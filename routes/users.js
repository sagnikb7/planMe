const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


//load user model

require('../models/users');
const usersModel = mongoose.model('users');

router.get('/login', (req, res) => {
    res.render("users/login")
});

router.get('/register', (req, res) => {
    res.render("users/register")
});

router.post('/register', (req, res) => {
    let errors = [];

    // console.log(req.body);

    if (req.body.password != req.body.password2) {
        errors.push({
            text: "Passwords should match"
        });

    }

    if (req.body.password.length < 8) {
        errors.push({
            text: "Password should be atleast 8 characters"
        });
    }

    if (errors.length > 0) {
        res.render('users/register', {
            errors: errors,
            name: req.body.name,
            email: req.body.email
        });
    } else {

        usersModel.findOne({
            email: req.body.email
        }).then((user) => {
            // console.log(user);
            if (user) {
                errors.push({
                    text: "User with the same email ID exists"
                });
                res.render('users/register', {
                    errors: errors,
                });
            } else {

                const newUser = new usersModel({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save().then(() => {
                            console.log("user saved");
                            req.flash('Success msg', "User Register, Now you can log in");
                            res.redirect("/users/login");
                        }).catch((err) => {
                            console.log("ERROR");
                        })
                        // console.log(newUser);
                    })
                });


            }
        })






    }
})

module.exports = router;