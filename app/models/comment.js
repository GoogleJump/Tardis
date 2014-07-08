// load the things we need
var mongoose = require('mongoose');

var ObjectId  = mongoose.Schema.Types.ObjectId;

// define the schema for our user model
var commentSchema = mongoose.Schema({
    comment: String,
    type: String,
    _onId: ObjectId,
    _userId: ObjectId,
    helpfulness: {type: Number, default: 0},
    date: {type: Date, default: Date.now},
    replies: [commentSchema],
    upvoters: [ObjectId],
    downvoters: [ObjectId]
});

module.exports = mongoose.model('Comment', commentSchema);