import React from 'react'
import Sidebar from '../../Components/Sidebar/Sidebar';
import './Admins.css';
import {Routes , Route} from "react-router-dom";
import AddProduct from '../../Components/AddProduct/AddProduct';
import ListProduct from '../../Components/ListProduct/ListProduct';
 
 const Admins = () => {
   return (
     <div className="admin">
      <Sidebar/>
        <Routes>
          <Route path='/addproduct' element={<AddProduct/>}/>
          <Route path='/listproduct' element={<ListProduct/>}/>
        </Routes>
     </div>
   )
 }
 
 export default Admins
 