const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser')

require('dotenv').config()

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const COOKIE_SECRET = process.env.COOKIE_SECRET;

const app = express();


//static folder
app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())


//template engine and middlewares
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

//method-override middleware
app.use(methodOverride('_method'));

//express-session middleware
app.use(session({
    secret: COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
}));


app.use(passport.initialize());
app.use(passport.session());
app.use((flash()));


//Global Variables middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('Success msg');
    res.locals.error_msg = req.flash('Error msg');
    res.locals.user = req.user || null;
    next();
})

//db connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connected");
}).catch(() => {
    console.log("MongoDB error");
});


//routes
const ideasRoute = require('./routes/ideas');
const userRoute = require('./routes/users');

app.get('', (req, res) => {
    res.render('landing');
})
app.use('/ideas', ideasRoute);
app.use('/users', userRoute);

//passport
require('./config/passport')(passport);

//server
app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
});