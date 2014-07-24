// load the things we need
var mongoose = require('mongoose');

var professorSchema = mongoose.Schema({
    name: String,
    department: String,
    _school: {type:mongoose.Schema.Types.ObjectId, ref:'School'},
    _ratings:[{type:mongoose.Schema.Types.ObjectId, ref:'Rating'}]
});

module.exports = mongoose.model('Professor', professorSchema);