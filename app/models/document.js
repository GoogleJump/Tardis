// load the things we need
var mongoose = require('mongoose');

var ObjectId  = mongoose.Schema.Types.ObjectId;

var documentSchema = mongoose.Schema({
    title: String,
    description: String,
    file_name:String,
    _sectionId: ObjectId,
    _userId: ObjectId,
    helpfulness: {type: Number, default: 0},
    date: {type: Date, default: Date.now},
    upvoters: [ObjectId],
    downvoters: [ObjectId]
});

module.exports = mongoose.model('Document', documentSchema);