const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');

const User = mongoose.model('users');

module.exports = function (passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email'
    }, (email, password, done) => {
        //match user
        User.findOne({
            email: email
        }).lean().then((user) => {
            // console.log(user);
            if (user) { //match user
                //match password
                bcrypt.compare(password, user.password, (err, isMatch) => {

                    if (err) throw err;
                    if (isMatch) {
                        console.log("LOG IN");
                        return done(null, user);
                    } else {
                        console.log("Incorrect Password");
                        return done(null, false, {
                            message: 'Incorrect Password'
                        });
                    }
                });

            } else {
                console.log("USER not found");
                return done(null, false, {
                    message: 'User not found'
                });
            }



        })
    }));


    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        // User.findById(id, function(err, user) {
        // });
        User.findById(id).lean().then(user => {
            done(null, user);
        })
    });
}