var School = require('../app/models/school');
var Professor = require('../app/models/professor');

exports.add = function(req, res) {
	var name = req.body.schoolName;
	var city = req.body.schoolCity;
	var state = req.body.schoolState;

	//regex to match school name case insensitively mit==MIT
	var regex = new RegExp(["^",name,"$"].join(""),"i");

	School.findOne({'name':regex}, function(err, school) {
		if(school) {
			req.flash('message', 'There is already a school with the name '+name);
			res.redirect('/select-school');
		} else {
			var newSchool = new School();
			newSchool.name = name;
			newSchool.city = city;
			newSchool.state = state;
			newSchool.save();

			req.user._schoolId = newSchool._id;
			req.user.save();
			res.redirect('/profile');
		}
		
	});

}

exports.view = function(req, res) {
	var id = req.params.schoolId;
	School.findOne({'_id':id}, function(err, school) {
		if(school) {
			Professor.find({'_schoolId':id}, function(err, professors) {
				res.render('school.ejs', {school:school, professors:professors, message: req.flash('message')});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
};