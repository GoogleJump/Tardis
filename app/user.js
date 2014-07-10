var School = require('../app/models/school');
var User = require('../app/models/user');

//view your own user profile
exports.view_profile = function(req, res) {
	School.findOne({ '_id' :  req.user._schoolId }, function(err, school) {
		res.render('profile.ejs', {
			user : req.user, // get the user out of session and pass to template
			school: school
		});
	});
};

//view a public user profile
exports.view = function(req, res) {
	var id = req.params.userId;
	User.findOne({'_id':id}, function(err, user) {
		if(user) {
			School.findOne({ '_id' : user._schoolId }, function(err, school) {
			res.render('user.ejs', {
				user : user, 
				school: school
			});
		});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
};

exports.view_select_school = function(req, res) {
	//get all schools from the database
	School.find({}, function (err, schools) {
		res.render('select_school.ejs', {
			schoolArray : 	schools,
			message: 		req.flash('message')
		});
	});
};

exports.select_school =  function(req, res) {
	var school = req.body.school;

	req.user._schoolId = school;
	req.user.save();

    res.redirect('/profile');
};