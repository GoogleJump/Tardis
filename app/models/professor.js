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
	if(this._ratings.length==0) return null;
    var sum=0;
    for(var i=0;i<this._ratings.length;i++) {
    	sum+=this._ratings[i].overall;
    }
    return sum/this._ratings.length;
};

professorSchema.methods.getRecommendPercent = function() {
	if(this._ratings.length==0) return null;
    var sum=0;
    for(var i=0;i<this._ratings.length;i++) {
    	if(this._ratings[i].recommend){
    		sum++;
    	}
    }
    var dec = sum/this._ratings.length;
    return dec*100;
};

module.exports = mongoose.model('Professor', professorSchema);