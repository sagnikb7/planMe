const express = require('express');
const router = express.Router();


router.get('/register',(req,res)=>{
res.send("user register")
});


router.get('/login',(req,res)=>{
    res.send("user login")
    });
    

module.exports = router;