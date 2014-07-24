// load the things we need
var mongoose = require('mongoose');

var ObjectId  = mongoose.Schema.Types.ObjectId;

var ratingSchema = mongoose.Schema({
	helpfulness: Number,
	difficulty: Number,
	clarity: Number,
	recommend: Boolean,
    comment: String,
    _poster: {type:ObjectId, ref: 'User'},
    score: {type: Number, default: 0},
    date: {type: Date, default: Date.now},
    upvoters: [ObjectId],
    downvoters: [ObjectId]
});

module.exports = mongoose.model('Rating', ratingSchema);