var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var Section = require('../app/models/section');

var fs = require('fs');

exports.add = function(req, res) {
	var name = req.body.name;
	var city = req.body.city;
	var state = req.body.state;

	console.log("adding school: "+name);

	//regex to match school name case insensitively mit==MIT
	var regex = new RegExp(["^",name,"$"].join(""),"i");

	School.findOne({'name':regex}, function(err, school) {
		if(school) {
			res.send({error:'There is already a school with the name '+name});
		} else {
			var newSchool = new School();
			newSchool.name = name;
			newSchool.city = city;
			newSchool.state = state;
			newSchool.save();

			res.send({schoolId:newSchool._id,schoolName:name});
		}
	});
}

//			req.user._schoolId = newSchool._id;
//			req.user.save();

exports.view = function(req, res) {
	var id = req.params.schoolId;
	School.findOne({'_id':id}, function(err, school) {
		if(school) {

			res.render('school.ejs', {school:school, cUser:req.user});
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
			Course.aggregate([{$group:{_id:"$department", count:{$sum:1}}}], function(err, result){
				if(err){
					console.error(err);
					return;
				}
				console.log(result);
			});

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
	var term = req.body.term;

	School.findOne({_id:id}, function(err, school){
		if(school) {
			if(school.terms.indexOf(term)<0) {
				school.terms.push(term);
				school.save();
			}
		}
	});

	fs.readFile(file.path, 'utf8', function (err, data) {
	  if (err) {
	    console.log('Error: ' + err);
	    return;
	  }
	 
	  data = JSON.parse(data);

	function createCourseSeries(item) {
		if(item) {
			createCourseFromJSON(id, term, item, function(){
				return createCourseSeries(data.shift());
			});
		}
	}	

	  createCourseSeries(data.shift());
	});

	res.redirect('/school/'+id+"/courses");
}

exports.search_within =function(req, res) {
	console.log('searching within school: '+req.body.input);

	var regex = new RegExp(req.body.input, 'i');//case insensitive contains
	var courseQuery = Course.find({_schoolId:req.user._schoolId, $or:[{number:regex},{name:regex}]}).limit(10);
	var professorQuery = Professor.find({_school:req.user._schoolId, name:regex}).limit(10);

	var doneCount = 0;
	var results = {courses:[], professors:[]};

	courseQuery.exec(function(err, courses){
		if(!err) {
			for(var index in courses) {
				results.courses.push({_id:courses[index]._id,number:courses[index].number, name:courses[index].name});
			}
			//res.send(results);
			finishSearch();
		} else {
			console.error(err);
			res.send(500, err);
		}
	});
	professorQuery.exec(function(err, professors){
		if(!err) {
			for(var index in professors) {
				results.professors.push({_id:professors[index]._id,name:professors[index].name, department:professors[index].department});
			}
			//res.send(results);
			finishSearch();
		} else {
			console.error(err);
			res.send(500, err);
		}
	});

	function finishSearch(){
		doneCount++;
		if(doneCount==2){
			//both queries returned
			//send results
			console.log("sending: "+JSON.stringify(results));
			res.send(results);
		}
	}
}



function createCourseFromJSON(schoolId, term, data, next) {
	//number is a unique key- see if there is already a course with this number
	Course.findOne({"_schoolId":schoolId, "number":data.number}, function(err, course){
		if(course) {
			console.log("course with number "+data.number+" already exists: "+course._id);
			createSectionsFromJSON(course, term, data.sections, next);
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

			createSectionsFromJSON(newCourse, term, data.sections, next);
		}
	});
}

function createSectionsFromJSON(course, term, data, next) {
	//FIXED: problem: this happens in parallel- possible to add professor repeatedly if he teaches multiple sections
	function createSectionsSeries(item) {
		if(item) {
			console.log("processing item: "+item);
			createSectionFromJSON(course, term, item, function(){
				return createSectionsSeries(data.shift());
			})
		} else {
			console.log("series done");
			return next();
		}
	}
	
	createSectionsSeries(data.shift());
}

function createSectionFromJSON(course, term, jsonSection, next) {
	Section.findOne({"_courseId":course._id,"term":term,"number":jsonSection.number}, function(err, section){
		if(section) {
			console.log("section with number "+jsonSection.number+" already exists: "+section._id);
			//update section info

			section.location = jsonSection.location;
			section.meet_time = jsonSection.meet_time;
			section.status = jsonSection.status;
			section.open = jsonSection.open;
			section.moments = section.getMoments();
			section.markModified('moments');
			section.save();

			return next();
		} else {
			var newSection = new Section();
			newSection.number = jsonSection.number;
			newSection.location = jsonSection.location;
			newSection.meet_time = jsonSection.meet_time;
			newSection.status = jsonSection.status;
			newSection.open = jsonSection.open;
			newSection.term = term;
			newSection.moments = newSection.getMoments();
			newSection._courseId = course._id;

			newSection.markModified('moments');

			if(!jsonSection.professor){
				newSection._professor = null;
				console.log("new section created without professor: "+newSection._id);
				newSection.save();
				return next();
			}
			Professor.findOne({"name":jsonSection.professor,"_school":course._schoolId}, function(err, professor){
				if(professor) {
					newSection._professor = professor._id;
				} else {
					var newProfessor = new Professor();
					newProfessor.name = jsonSection.professor;
					newProfessor._school = course._schoolId;
					newProfessor.department = course.department;
					newSection._professor = newProfessor._id;

					newProfessor.save();
				}
				console.log("new section created: "+newSection._id);
				newSection.save();
				return next();
			});
			//TODO: books
		}
	});		
}
