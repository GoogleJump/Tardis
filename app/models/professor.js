// load the things we need
var mongoose = require('mongoose');

var professorSchema = mongoose.Schema({
    name: String,
    department: String,
    _school: {type:mongoose.Schema.Types.ObjectId, ref:'School'},
    _ratings:[{type:mongoose.Schema.Types.ObjectId, ref:'Rating'}],
    _raters:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}]
});

module.exports = mongoose.model('Professor', professorSchema);