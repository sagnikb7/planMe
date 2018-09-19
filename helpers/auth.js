module.exports = {
    ensureAuthenticated: function(req,res,next){
            if(req.isAuthenticated()){
                return next();
            }else{
                req.flash('Error msg',"You need to log in!");
                res.redirect('/users/login');
            }
    },

    onlyNonAuthenticated: function(req,res,next){
        if(req.isAuthenticated()){
          
            res.redirect('/ideas');
        }else{
                return next();
        }
    }

}