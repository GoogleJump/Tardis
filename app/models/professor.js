// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var professorSchema = mongoose.Schema({
    name: String,
    department: String,
    _schoolId: mongoose.Schema.Types.ObjectId
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Professor', professorSchema);