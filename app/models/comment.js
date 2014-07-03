// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var commentSchema = mongoose.Schema({
    comment: String,
    type: String,
    _onId: mongoose.Schema.Types.ObjectId,
    _userId: mongoose.Schema.Types.ObjectId,
    helpfulness: {type: Number, default: 0},
    date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Comment', commentSchema);