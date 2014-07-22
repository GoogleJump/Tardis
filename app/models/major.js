// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var majorSchema = mongoose.Schema({
    name: String,
    _school:{type:mongoose.Schema.Types.ObjectId, ref:'School'}
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Major', majorSchema);