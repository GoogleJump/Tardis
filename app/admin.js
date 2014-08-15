var School = require('../app/models/school');
var User = require('../app/models/user');
var Major = require('../app/models/major');


exports.view_users = function(req, res) {
	User.find().sort('-lastLoginDate').exec(function(err, users){
		res.render('admin-users.ejs', {users:users});
	});
}