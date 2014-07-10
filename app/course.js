var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var User = require('../app/models/user');
var Section = require('../app/models/section');

exports.view = function(req, res) {
	var id = req.params.courseId;
	Course.findOne({'_id':id}, function(err, course) {
		if(course) {
			Section.find({'_courseId':id}, function(err, sections){
				res.render('course.ejs',{course:course,sections:sections});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
};