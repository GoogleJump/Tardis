var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var Section = require('../app/models/section');
var User = require('../app/models/user');
var Schedule = require('../app/models/schedule');
var ScheduleTree = require('./ScheduleTree').ScheduleTree;

var _ = require('underscore');

var POTENTIAL_CUTOFF = 1000000; //if there would be more than this many nodes in the schedule tree, don't generate it
var PREF_PREFER = 0;
var PREF_NEUTRAL = 1;
var PREF_NOT_PREFER = 2;
var PREF_DO_NOT_CONSIDER =3; //value for "do not consider" section preference
var BATCH_SIZE = 16; //number of schedules to send to the client at once

exports.view = function(req, res) {
	School.findOne({_id:req.user._schoolId}, function(err, school){
		res.render('schedule.ejs', {school:school, cUser:req.user});
	});
}

exports.generate = function(req, res) {
	var courses = req.body.courses;
	var term = req.body.term;
	var sectionPreferences = req.body.sectionPreferences;
	var timeRange = req.body.timeRange;
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

		//create map for sectionId:Section
		var scheduleSections = {};
		for(var cid in s) {
			var course = s[cid];
			for(var i=0;i<course.length;i++) {
				var section = course[i];
				scheduleSections[section._id] = section;
			}
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
		var costs = {};
		for(var sectionId in sectionPreferences) {
			if(sectionPreferences[sectionId]==PREF_DO_NOT_CONSIDER) {
				forRemoval.push(sectionId);
			} else {
				var cost = 0;
				cost += getTimeRangeCost(scheduleSections[sectionId], timeRange);
				if(sectionPreferences[sectionId]==PREF_PREFER) {
					cost += 20;
				}
				else {
					if(sectionPreferences[sectionId]==PREF_NEUTRAL){
						cost += 10;
					}
				}
				costs[sectionId] = cost;
			}
		}

		if(forRemoval.length>0)
			tree.removeSections(forRemoval);

		if(tree.isEmpty()) {
			res.send({error:"No schedules found after removal"});
			return;
		}
		var schedules = tree.getAllSchedulesWithCost(costs);

		schedules = _.sortBy(schedules, function(cs){return -cs.cost;}); //negative to sort highest to lowest

		//Fixed: store generated schedule in it's own document; 
		var dbSchedule = new Schedule();
		dbSchedule.schedule = schedules;
		if(req.user.pendingScheduleData._schedules){
			removeSavedSchedule(req.user.pendingScheduleData._schedules);
		}
		req.user.pendingScheduleData._schedules = dbSchedule._id;
		dbSchedule.markModified('schedule');
		req.user.save();
		dbSchedule.save();

		if(schedules.length<=BATCH_SIZE) {
			//send them all
			res.send({count: schedules.length, results:schedules, sections:scheduleSections});
		}else {
			//only send the first batch
			res.send({count: schedules.length, results:schedules.slice(0, BATCH_SIZE), sections:scheduleSections});
		}
		var afterDate = new Date();
		var ms = afterDate.getTime() - beforeDate.getTime();
		console.log("generated schedule tree: "+schedules.length+" found of "+potential+" potential in "+ms+"ms");
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
		var count=0;
		for(var i=0;i<sections.length;i++) {
			if(sections[i]._professor){
				Professor.findById(sections[i]._professor._id, profCallback(i));
			} else {
				profCallback(-1)();
			}
			
		}
		function profCallback(index){
			return function(err, professor){
				if(index>=0){
					console.log(index+" setting rp: "+professor.getAverageRating());
					sections[index]._professor.recommendPercent = professor.getRecommendPercent();
					console.log("prof now: "+JSON.stringify(sections[index]._professor));
				}
				count++;
				if(count==sections.length) {
					console.log("sending "+JSON.stringify(sections));
					res.send({sections:JSON.stringify(sections)});
				}
			}
		}
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
	if(req.user.schedule){
		//if the user has already generated a schedule, show it
		var sectionIds = req.user.schedule;
		getTableData(sectionIds, function(tableData){
			res.send({tableData:tableData});
		});
	} else{
		if(req.user.pendingScheduleData && req.user.pendingScheduleData.courses.length>0) {
			//if a user has already added courses to their list, show them
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
}

exports.get_batch=function(req, res) {
	var batch = parseInt(req.query.batch);

	req.user.populate({path:'pendingScheduleData._schedules'}, function(err, popUser){
		var schedules = popUser.pendingScheduleData._schedules.schedule;
		var batchSchedules = schedules.slice(batch*BATCH_SIZE, (batch+1)*BATCH_SIZE);
		res.send({results:batchSchedules});
	});
}

exports.save = function(req, res) {
	var scheduleIndex = req.body.index;

	console.log("saving schedule "+scheduleIndex);

	req.user.populate('pendingScheduleData._schedules',function(err, user){
		if(err) {
			res.send(500);
			return;
		}
		user.schedule= user.pendingScheduleData._schedules.schedule[scheduleIndex].schedule;
		user.save();
		console.log("sections: "+JSON.stringify(user.schedule));

		getTableData(user.schedule, function(tableData){
			console.log(JSON.stringify(tableData));
			res.send({tableData:tableData});
		});
	});
	
}

function getTableData(sectionIds, next) {
	Section.find({_id:{$in:sectionIds}}).populate('_professor _courseId').exec(function(err, sections){
		var tableData = {};
		for(var i=0;i<sections.length;i++) {
			var csection = sections[i];
			var professor;
			if(csection._professor) {
				professor = {
					name: csection._professor.name,
					_id:csection._professor._id
				}
			} else {
				professor = null;
			}

			tableData[csection._id] = {
				course: {
					name: csection._courseId.name,
					number: csection._courseId.number,
					_id: csection._courseId._id
				},
				section:{
					number: csection.number,
					_id: csection._id
				},
				courseName: csection._courseId.name,
				professor:professor,
				meetTime: csection.meet_time,
				location: csection.location
			}
			if(i==(sections.length-1)){
				return next(tableData);
			}
		}
	});
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

function getTimeRangeCost(section, timeRange) {
	var cost = 0;
	var m = section.moments;
	for(var i=0;i<m.length;i++) {
		var startHour = m[i].startTime.hour;
		if(startHour>=timeRange.start&&startHour<=timeRange.end) {
			//within time range: 5pt bonus
			cost+=5;
		}else{
			var timeDistance = 0;
			if(startHour<timeRange.start){
				//startHour is before time range start
				timeDistance = timeRange.start-startHour;
			} else {
				//startHour is after time range end
				timeDistance = startHour-timeRange.end;
			}
			if(timeDistance<5){
				cost+=(5-timeDistance);
			}
		} 
	}
	return cost/m.length;//get average cost across all moments of this section
}

function removeSavedSchedule(scheduleId) {
	Schedule.findById(scheduleId).remove(function(err){
		//noop
	});
}