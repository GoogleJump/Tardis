// load the things we need
var mongoose = require('mongoose');

var courseSchema = mongoose.Schema({
    name: String,
    number: String,
    department: String,
    description: String,
    credits: Number,
    level: String,
    _schoolId: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Course', courseSchema);