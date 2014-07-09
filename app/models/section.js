// load the things we need
var mongoose = require('mongoose');

var sectionSchema = mongoose.Schema({
    number: String,
    location: String,
    meet_time: String,
    status: String,
    open: Boolean,
    term: String,
    _courseId: mongoose.Schema.Types.ObjectId,
    _professorId: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Section', sectionSchema);