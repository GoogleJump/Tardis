var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var fs = require('fs');

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
}

exports.view_courses = function(req, res) {
	var id = req.params.schoolId;

	School.findOne({'_id':id}, function(err, school) {
		if(school) {
			Course.find({'_schoolId':id}, function(err, courses){
				res.render('courses.ejs', {courses:courses, school:school});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
}

exports.update_courses = function(req, res) {
	var id = req.params.schoolId;
	var file = req.files.courses;

	fs.readFile(file.path, 'utf8', function (err, data) {
	  if (err) {
	    console.log('Error: ' + err);
	    return;
	  }
	 
	  data = JSON.parse(data);
	 
	  for(var index in data) {
	      createCourseFromJSON(id, data[index]);
	  }
	});


	res.redirect('/school/'+id+"/courses");
}

function createCourseFromJSON(schoolId, data) {
	//number is a unique key- see if there is already a course with this number
	Course.findOne({"_schoolId":schoolId, "number":data.number}, function(err, course){
		if(course) {
			console.log("course with number "+data.number+" already exists: "+course._id);
		} else {
			var newCourse = new Course();
			newCourse.name = data.name;
			newCourse.number = data.number;
			newCourse._schoolId = schoolId;
			newCourse.department = data.department;
			newCourse.description = data.description;
			newCourse.credits = data.credits;
			newCourse.level = data.level;

			console.log("new course created: "+newCourse._id);

			newCourse.save();
		}
	});
}