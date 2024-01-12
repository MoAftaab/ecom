const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const port = 4000;

app.use(cors());
app.use(express.json());

// Database Connection with mongo Db 
mongoose.connect("mongodb+srv://aftaabdev:contextswitching@cluster0.yv8pea5.mongodb.net/website");

// api creation
app.get("/", (req, res) => {
    res.send("Express App is running");
});


// image storage engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({ storage: storage })


app.use('/images', express.static('upload/images'));

app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `https://backend-lcua.onrender.com/images/${req.file.filename}`

    });
});

// schema for creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },

    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    category: {
        type: String,
        required: true,
    },
    available: {
        type: Boolean,
        default: true,
    },
})
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else {
        id = 1;
    }
    const product = new Product({
        // id: req.body.id,
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success: true,
        name: req.body.name,
    })
})

// creating api for deleting productt
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name,
    })
})

// creating api for get method
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

// schema for creating user model
const Users = mongoose.model('Users', {
    name: {
        type: String,
        required: true,

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    cartdata: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
// Creating end pooint for reggistering users
app.post('/signup', async (req, res) => {
    try {
        let check = await Users.findOne({ email: req.body.email });
        if (check) {
            return res.status(400).json({ success: false, errors: "Existing user found with the same email id" });
        }

        let cart = {};
        for (let i = 0; i < 300; i++) {
            cart[i] = 0;
        }

        const user = new Users({
            name: req.body.username,
            email: req.body.email,
            password: req.body.password,
            cartdata: cart,
        });

        await user.save();

        const data = {
            user: {
                id: user.id
            }
        };

        const token = jwt.sign(data, 'secret_ecom');
        res.json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, errors: "Internal Server Error" });
    }
});


//creating end point for user login
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passcompare = req.body.password === user.password;
        if (passcompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({ success: true, token });
        }

        else {
            res.json({ success: false, errors: "Wrong Password" });
        }


    }
    else {
        res.json({ success: false, errors: "wrong email id" })
    }

});

// Creating endpoint for newcollection data
app.get('/newcollections', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection);

})
// Middleware to fetch user
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({ errors: "Pls authenticate using valid token" });
    }
    else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();

        } catch (error) {
            res.status(401).send({ errors: "Pls authenticate using valid profile" });

        }
    }
}




// Creating endpoint for women section
app.get('/popularinwomen', async (req, res) => {

    let products = await Product.find({ category: "women" })
    let popular_in_women = products.slice(0, 4);
    console.log("Popular in women fetching");
    res.send(popular_in_women);

})

// creating endpoint for adding products in cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("Added", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartdata[req.body.item] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartdata:userData.cartdata })
    res.send("Added");
})

// creating endpoint for removing products in cartdata
app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("removed", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartdata[req.body.itemId] > 0)
        userData.cartdata[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartdata: userData.cartdata })
    res.send("removed"); 
})

// creating endpoint to get cartdata
app.post('/getcart', fetchUser, async (req, res) => {
    console.log("Get Cart");
    let userData = await Users.findOne({ _id:req.user.id });
    res.json(userData.cartdata);
})

 

app.listen(port, (error) => {
    if (!error) {
        console.log(`Server running on port ${port}`);

    }
    else {
        console.log("Error : " + error);
    }
});