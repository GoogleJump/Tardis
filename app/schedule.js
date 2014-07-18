var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var Section = require('../app/models/section');
var User = require('../app/models/user');
var ScheduleTree = require('./ScheduleTree').ScheduleTree;

var _ = require('underscore');

var POTENTIAL_CUTOFF = 1000000; //if there would be more than this many nodes in the schedule tree, don't generate it
var PREF_DO_NOT_CONSIDER =3; //value for "do not consider" section preference
var BATCH_SIZE = 16; //number of schedules to send to the client at once

exports.view = function(req, res) {
	School.findOne({_id:req.user._schoolId}, function(err, school){
		res.render('schedule.ejs', {school:school});
	});
}

exports.generate = function(req, res) {
	var courses = req.body.courses;
	var term = req.body.term;
	var sectionPreferences = req.body.sectionPreferences;
	console.log("generating schedules");

	
	getSections(courses, term, function(s){
		//var sections = _.sortBy(s,function(cs){return cs.length;}); //sort by number of sections (so we take the most restrictive first)

		var potential = 1;
		for(var i=0;i<courses.length;i++) {
			potential*=s[courses[i].id].length;
		}
		if(potential>=POTENTIAL_CUTOFF) {
			//TODO: alternative approach for especially large solution spaces
			res.send({error:"I don't have the time or the memory to generate your schedules."});
			return;
		}

		var tree = new ScheduleTree();

		var beforeDate = new Date();

		for(var i=0;i<courses.length;i++) {
			tree.addCourse(courses[i],s[courses[i].id]);
			if(tree.isEmpty()) {
				res.send({error:"No schedules found"});
				return;
			}
		}
		
		//remove sections set as do not consider
		var forRemoval=[];
		for(var sectionId in sectionPreferences) {
			if(sectionPreferences[sectionId]==PREF_DO_NOT_CONSIDER) {
				forRemoval.push(sectionId);
			}
		}
		if(forRemoval.length>0)
			tree.removeSections(forRemoval);

		if(tree.isEmpty()) {
			res.send({error:"No schedules found after removal"});
			return;
		}
		var schedules = tree.getAllSchedules();
		var afterDate = new Date();
		var ms = afterDate.getTime() - beforeDate.getTime();
		console.log("generated schedule tree: "+schedules.length+" found of "+potential+" potential in "+ms+"ms");

		req.user.pendingScheduleData.schedules = schedules;
		req.user.markModified('pendingScheduleData.schedules');
		req.user.save();

		var scheduleSections = {};
		for(var cid in s) {
			var course = s[cid];
			for(var i=0;i<course.length;i++) {
				var section = course[i];
				scheduleSections[section._id] = section;
			}
		}

		if(schedules.length<=BATCH_SIZE) {
			//send them all
			res.send({count: schedules.length, results:schedules, sections:scheduleSections});
		}else {
			//only send the first batch
			res.send({count: schedules.length, results:schedules.slice(0, BATCH_SIZE), sections:scheduleSections});
		}
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
		var courseSections = {};
		var count=0;
		User.populate(req.user,{path:"pendingScheduleData.courses"}, function (err, populatedUser) {
			var courses = populatedUser.pendingScheduleData.courses;
			for(var i=0;i<courses.length;i++) {
				Section.find({_courseId:courses[i]._id})
				.populate('_professor', 'name')
				.select('number open _professor meet_time status _courseId')
				.sort('number')
				.exec(function(err, sections) {
					count++
					courseSections[sections[0]._courseId]= sections; //TODO: no sections?
					if(count==courses.length) {
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

exports.get_batch=function(req, res) {
	var batch = parseInt(req.query.batch);
	var schedules = req.user.pendingScheduleData.schedules;
	var batchSchedules = schedules.slice(batch*BATCH_SIZE, (batch+1)*BATCH_SIZE);
	res.send({results:batchSchedules});
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
