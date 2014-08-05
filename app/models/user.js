// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var ObjectId = mongoose.Schema.Types.ObjectId;

// define the schema for our user model
var userSchema = mongoose.Schema({
    username: String,
    reputation: {type: Number, default: 0},
    createdDate: {type: Date, default: Date.now},
    lastLoginDate: {type: Date, default: Date.now},
    _schoolId: ObjectId,
    _major: {type:ObjectId, ref:'Major'},
    local            : {
        email        : String,
        password     : String,
        firstname    : String,
        lastname     : String, 
        avatar       : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    pendingScheduleData: {
        term: String,
        courses: [{type:ObjectId, ref:'Course'}],
        _schedules: {type:ObjectId, ref:"Schedule"}
    },
    schedule:[{type:ObjectId, ref:"Section"}]
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);