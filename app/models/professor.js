// load the things we need
var mongoose = require('mongoose');

var professorSchema = mongoose.Schema({
    name: String,
    department: String,
    _school: {type:mongoose.Schema.Types.ObjectId, ref:'School'},
    _ratings:[{type:mongoose.Schema.Types.ObjectId, ref:'Rating'}],
    _raters:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}]
});

professorSchema.methods.getAverageRating = function() {
    var sum=0;
    for(var i=0;i<this._ratings.length;i++) {
    	sum+=this._ratings[i].overall;
    }
    return sum/this._ratings.length;
};

professorSchema.methods.getRecommendPercent = function() {
    var sum=0;
    for(var i=0;i<this._ratings.length;i++) {
    	if(this._ratings[i].recommend){
    		sum++;
    	}
    }
    var dec = sum/this._ratings.length;
    return parseFloat(dec*100).toFixed(0)+'%';
};

module.exports = mongoose.model('Professor', professorSchema);