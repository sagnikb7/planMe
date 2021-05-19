const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../helpers/auth');

//Load mongoose model
require("../models/Ideas");
const Idea = mongoose.model('ideas');


const {
    check,
    validationResult
} = require('express-validator/check');



//---------------------------------------------------------------- ROUTES ----LANDING & STATIC PAGES
// router.get('/',ensureAuthenticated, (req, res) => {
//     const title = "PlanMe";
//     res.render('index', {
//         title: title
//     });
// });
router.get('/about', (req, res) => {
    res.render('about');
});

//-------------------------------------------------------------------  VIEW IDEAS
router.get('/my-ideas', ensureAuthenticated, (req, res) => {
    Idea.find({ user: req.user._id }).sort({
        date: 'desc'
    }).lean().then(ideas => {
        //console.log(ideas);
        res.render('ideas/my-ideas', {
            ideas: ideas
        });
    });

});


//------------------------------------------------------------------- ADD IDEAS
router.get('/add-ideas', ensureAuthenticated, (req, res) => {
    res.render('ideas/add-ideas');
});


router.post("/add-ideas", ensureAuthenticated, [check("title").isLength({
    "min": 2
}),
check("details").isLength({
    "min": 2
})
], (req, res) => {
    var formErrors = validationResult(req);
    if (formErrors.isEmpty()) {
        // console.log(req.body);
        var data = {
            title: req.body.title,
            details: req.body.details,
            user: req.user._id
        }
        new Idea(data).save().then(e => {
            req.flash('Success msg', "Idea saved");
            res.redirect("/ideas/my-ideas");
        });
    } else {
        console.log("Validation Error..");
        req.flash('Error msg', "Title and Details should be a bit long");
        res.redirect('/ideas/add-ideas');
    }


})
//------------------------------------------------------------------- ADD IDEAS (view)
router.get("/edit-ideas/:id", ensureAuthenticated, (req, res) => {
    Idea.findById(req.params.id).lean().then((idea) => {
        res.render('ideas/edit-ideas', { idea: idea });
    })
})

router.put("/edit-ideas/:id", ensureAuthenticated, (req, res) => {                     // put backend validation while udating


    const { title, details } = req.body;
    let updatedObj = { title, details }

    Idea.updateOne({ _id: req.params.id }, { $set: updatedObj }).then((stats) => {
        req.flash('Success msg', "Idea Updated");
        res.redirect("/ideas/my-ideas");
    })

})

//------------------------------------------------------------------- DELETE IDEAS
router.delete('/delete-ideas/:id', ensureAuthenticated, (req, res) => {
    Idea.deleteOne({ _id: req.params.id, user: req.user._id }).then(() => {
        req.flash('Success msg', "Idea Deleted");
        res.redirect("/ideas/my-ideas");
    }).catch(() => {
        cosnole.log('deletion error');
    });
})
module.exports = router;