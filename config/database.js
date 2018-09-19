if(process.env.NODE_ENV === 'production'){
module.exports ={
    mongoURI : 'mongodb://sagnik:Aquafox59$@ds159812.mlab.com:59812/planme-prod'
}
}else{
module.exports = {
    mongoURI:'mongodb://localhost/PlanMe_dev'
}
}