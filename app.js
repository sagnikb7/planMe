const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');


const app = express();
const port = 3000;


//static folder
app.use(express.static('public'));

//template engine and middlewares
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

//method-override middleware
app.use(methodOverride('_method'));

//express-session middleware
app.use(session({
    secret: 'Vortex Iz cool',
    resave: true,
    saveUninitialized: true,

}))
app.use((flash()));


//Global Variables middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('Success msg');
    res.locals.error_msg = req.flash('Error msg');
    next();
})

// mongoose.Promise = global.Promise;
//db connection
mongoose.connect("mongodb://localhost/PlanMe_dev", {
        useNewUrlParser: true
    })
    .then(() => {
        console.log("MongoDB connected");
    }).catch(() => {
        console.log("MongoDB error");
    });

// app.use((req, res, next) => {
//     console.log(Date.now());
//     req.name = "Sagnik"
//     next();
// });


//routes
const ideasRoute = require('./routes/ideas');
const userRoute = require('./routes/users');

app.use('/ideas', ideasRoute);
app.use('/users', userRoute);




//server
app.listen(port, () => {
    console.log(`Server started on PORT ${port}`);
});