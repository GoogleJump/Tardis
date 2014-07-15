// load the things we need
var mongoose = require('mongoose');

var ObjectId  = mongoose.Schema.Types.ObjectId;

exports.documentSchema = mongoose.Schema({
    title: String,
    description: String,
    file_name: String,
    _userId: {type:ObjectId, ref:'User'},
    helpfulness: {type: Number, default: 0},
    date: {type: Date, default: Date.now},
    upvoters: [{type:ObjectId, ref:'User'}],
    downvoters: [{type:ObjectId, ref:'User'}]
});

module.exports = mongoose.model('Document', exports.documentSchema);