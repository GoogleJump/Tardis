var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var Section = require('../app/models/section');
var User = require('../app/models/user');
var ScheduleTree = require('./ScheduleTree').ScheduleTree;

var _ = require('underscore');

exports.view = function(req, res) {
	School.findOne({_id:req.user._schoolId}, function(err, school){
		res.render('schedule.ejs', {school:school});
	});
}

exports.generate = function(req, res) {
	var courses = req.body.courses;
	var term = req.body.term;
	console.log("generating schedules");

	
	getSections(courses, term, function(s){
		//var sections = _.sortBy(s,function(cs){return cs.length;}); //sort by number of sections (so we take the most restrictive first)

		var tree = new ScheduleTree();

		for(var i=0;i<courses.length;i++) {
			tree.addCourse(courses[i],s[courses[i].id]);
			if(tree.isEmpty()) {
				res.send({error:"No schedules found"});
				return;
			}
		}
		
		var schedules = tree.getAllSchedules();
		console.log("generated schedule tree: "+schedules.length+" possible");

		res.send({results:prepareCalendarResults(schedules, tree)});

	});
}

exports.add_course = function(req, res) {
	var courseId = req.body.courseId;
	console.log("user "+req.user.username+" added course "+courseId);

	req.user.pendingScheduleData.courses.push(courseId);
	req.user.save();

	//TODO: term
	Section.find({_courseId:courseId})
		.populate('_professor', 'name')
		.select('number open _professor meet_time status')
		.sort('number')
		.exec(function(err, sections){
			if(err) {
				res.send({error:"Could not find sections"});
				return;
			}
			console.log(sections);
			res.send({sections:JSON.stringify(sections)});
		});
}

exports.remove_course = function(req, res) {
	var courseId = req.body.courseId;
	console.log("user "+req.user.username+" removed course "+courseId);

	var courseIndex = req.user.pendingScheduleData.courses.indexOf(courseId);
	if(courseIndex>=0) {
		req.user.pendingScheduleData.courses.splice(courseIndex, 1);
		req.user.save();
	}

	res.send(200);
}

exports.get_pending_schedule = function(req, res) {
	if(req.user.pendingScheduleData && req.user.pendingScheduleData.courses.length>0) {
		var courseIds = req.user.pendingScheduleData.courses;
		var courseSections = [];
		User.populate(req.user,{path:"pendingScheduleData.courses"}, function (err, populatedUser) {
			var courses = populatedUser.pendingScheduleData.courses;
			console.log(JSON.stringify(courses));
			for(var i=0;i<courses.length;i++) {
				Section.find({_courseId:courses[i]._id})
				.populate('_professor', 'name')
				.select('number open _professor meet_time status')
				.sort('number')
				.exec(function(err, sections) {
					console.log("got sections: "+JSON.stringify(sections));
					courseSections.push(sections);
					if(courseSections.length==courses.length) {
						res.send({courses:courses, sections:courseSections});
						return;
					}
				});
			}
		});
	} else {
		res.send(200);
	}
	
}

function getSections(courses, term, next) {
	var sections = {};
	var count = 0;
	for(var index in courses) {
		var currentCourse = courses[index];
		Section.find({_courseId:currentCourse.id, term:term}, function(err, csections){
			sections[csections[0]._courseId] = csections;//TODO: what if their arn't any sections?
			count++;
			if(count==courses.length) {
				return next(sections);
			}
		});
	}
}

function addToResults(sections, results) {
	var localResults = [];
	if(results.length==0) {
		for(var index in sections) {
			localResults.push([sections[index]]);
		}
		return localResults;
	}

	for(var index in results) {
		for(var index3 in sections) {
			var ok = true;
			for(var index2 in results[index]) {
				//what if time is null?
				if(results[index][index2].conflictsWith(sections[index3])) {
					ok = false;
				}
			}
			if(ok) {
				localResults.push(results[index].concat(sections[index3]));
			}			
		}
	}
	return localResults;
}

var sourceYearMonth = "2014-01-";//fixed date for rendering in the calendar
var sourceDay = 12;//the twelveth is a sunday

var colors = ["#16a085","#27ae60","#2980b9","#8e44ad","#2c3e50","#7f8c8d","#bdc3c7","#c0392b","#d35400"];

function prepareCalendarResults(r, t) {
	var results = [];

	for(var i in r) {
		var events = []; 

		for(var j in r[i]) {
			var sectionId = r[i][j];
			var section = t.sections[sectionId];
			var moments = section.moments;
			for(var k=0;k<moments.length;k++) {
				var event = {};
				event.title = t.courses[section._courseId].number+"-"+section.number;
				event.allDay = false;
				event.color = colors[j];
				event.start = formatEventDate(moments[k].day, moments[k].startTime.hour, moments[k].startTime.minute);
				event.end = formatEventDate(moments[k].day, moments[k].endTime.hour, moments[k].endTime.minute);

				event.url = "/section/"+section._id;
				events.push(event);
			}
		}

		results.push(events);
	}

	return results;
}

function padWith0(value) {
	if(value<10) {
		return "0"+value;
	}
	return value;
}

function formatEventDate(day, hour, minute) {
	var pHour = padWith0(hour);
	var pMinute = padWith0(minute);
	return sourceYearMonth+(sourceDay+day)+'T'+pHour+":"+pMinute+":00";
}