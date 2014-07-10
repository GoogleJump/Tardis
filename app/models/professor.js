// load the things we need
var mongoose = require('mongoose');

var professorSchema = mongoose.Schema({
    name: String,
    department: String,
    _schoolId: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Professor', professorSchema);