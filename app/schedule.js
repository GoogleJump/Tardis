var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var Section = require('../app/models/section');

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

	
	getSections(courses, term, function(s, titles){
		var sections = _.sortBy(s,function(cs){return cs.length;}); //sort by number of sections (so we take the most restrictive first)
		var results = [];

		for(var index in sections) {
			results = addToResults(sections[index], results);
			if(results.length==0) {
				res.send({error:"No schedules found"});
				return;
			}
		}
		console.log("generated "+results.length+" possible schedules");
		if(results.length==0) {
			res.send({error:"No schedules found"});
			return;
		} else{ 
			res.send({results:prepareCalendarResults(results, titles)});
		}

	});

	
}

function getSections(courses, term, next) {
	var sections = [];
	var titles = []
	var count = 0;
	for(var index in courses) {
		var currentCourse = courses[index];
		titles[currentCourse.id] = currentCourse.number;
		Section.find({_courseId:currentCourse.id, term:term}, function(err, csections){
			sections.push(csections);//TODO: what if their arn't any sections?
			count++;
			if(count==courses.length) {
				return next(sections, titles);
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
			var section = r[i][j];
			var moments = section.moments;
			for(var k=0;k<moments.length;k++) {
				var event = {};
				event.title = t[section._courseId]+"-"+section.number;
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