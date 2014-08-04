var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var User = require('../app/models/user');
var Section = require('../app/models/section');

exports.view = function(req, res) {
	var id = req.params.courseId;
	Course.findOne({'_id':id}).populate('_schoolId').exec(function(err, course) {
		if(course) {
			Section.find({'_courseId':id}, function(err, sections){
				res.render('course.ejs',{course:course,sections:sections,school:course._schoolId,cUser:req.user});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
};

exports.autocomplete = function(req, res) {
	console.log(req.body.input);

	var regex = new RegExp(req.body.input, 'i');//case insensitive contains
	var query = Course.find({_schoolId:req.user._schoolId, $or:[{number:regex},{name:regex}]}).limit(10);

	query.exec(function(err, courses){
		if(!err) {
			var results = [];
			for(var index in courses) {
				results.push({_id:courses[index]._id,number:courses[index].number, name:courses[index].name});
			}
			res.send(results);
		} else {
			console.error(err);
			res.send(500, err);
		}
	});
}