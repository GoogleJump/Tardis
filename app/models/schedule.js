// load the things we need
var mongoose = require('mongoose');

var scheduleSchema = mongoose.Schema({
    schedule: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Schedule', scheduleSchema);