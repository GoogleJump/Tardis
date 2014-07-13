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

	
	getSections(courses, term, function(s){
		var sections = _.sortBy(s,function(cs){return cs.length;}); //sort by number of sections (so we take the most restrictive first)
		var results = [];

		for(var index in sections) {
			results = addToResults(sections[index], results);
		}
		console.log(results);
		if(results.length==0) {
			res.send({error:"No schedules found"});
			return;
		} else{ 
			res.send({results:prepareCalendarResults(results)});
		}

	});

	
}

function getSections(courses, term, next) {
	var sections = [];
	var count = 0;
	for(var index in courses) {
		var currentCourse = courses[index];
		Section.find({_courseId:currentCourse.id, term:term}, function(err, csections){
			sections.push(csections);//TODO: what if their arn't any sections?
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

var sourceYearMonth = "2014-01-";
var sourceDay = 12;

function prepareCalendarResults(r) {
	var results = [];

	for(var i in r) {
		var events = []; //{title:'CS1001',start:'2014-07-10T09:00:00',end:'2014-07-10T09:50:00',allDay:false,color:"green"}

		for(var j in r[i]) {
			var section = r[i][j];
			var moments = section.getMoments();
			for(var k in moments) {
				var event = {};
				event.title = section.number;
				event.allDay = false;
				event.color = "green";
				var startHour = padWith0(moments[k].startTime.hour);
				var startMin = padWith0(moments[k].startTime.minute);
				var endHour = padWith0(moments[k].endTime.hour);
				var endMin = padWith0(moments[k].endTime.minute);
				event.start = sourceYearMonth+(sourceDay+moments[k].day)+'T'+startHour+":"+startMin+":00";
				event.end = sourceYearMonth+(sourceDay+moments[k].day)+'T'+endHour+":"+endMin+":00";
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