// load the things we need
var mongoose = require('mongoose');

var SUNDAY = 0;
var MONDAY = 1;
var TUESDAY = 2;
var WEDNESDAY = 3;
var THURSDAY = 4;
var FRIDAY = 5;
var SATURDAY = 6;

var sectionSchema = mongoose.Schema({
    number: String,
    location: String,
    meet_time: String,
    status: String,
    open: Boolean,
    term: String,
    moments: [mongoose.Schema.Types.Mixed],
    _courseId: mongoose.Schema.Types.ObjectId,
    _professorId: mongoose.Schema.Types.ObjectId
});

sectionSchema.methods.conflictsWith = function(otherSection) {
	//TODO: create moments on addition and store them in the db
	var thisMoments = this.getCleanMoments();
	var otherMoments = otherSection.getCleanMoments();

	//console.log("CONFLICT CHECK: "+JSON.stringify(thisMoments)+" "+JSON.stringify(otherMoments));

	for(var index1 in thisMoments) {
		for(var index2 in otherMoments) {
			//console.log("comparing "+JSON.stringify(thisMoments[index1])+" AND "+JSON.stringify(otherMoments[index2]));
			if(thisMoments[index1].day==otherMoments[index2].day) {
				if(thisMoments[index1].startTime.hour==otherMoments[index2].startTime.hour&&thisMoments[index1].startTime.minute==otherMoments[index2].startTime.minute) {
					//start at same time: conflict
					return true;
				} 

				if(thisMoments[index1].startTime.hour<otherMoments[index2].startTime.hour || 
					(thisMoments[index1].startTime.hour==otherMoments[index2].startTime.hour &&
						thisMoments[index1].startTime.minute<otherMoments[index2].startTime.minute)) {
					//thisMoment starts before otherMoment
					if(thisMoments[index1].endTime.hour<otherMoments[index2].startTime.hour ||
						(thisMoments[index1].endTime.hour==otherMoments[index2].startTime.hour &&
							thisMoments[index1].endTime.minute<otherMoments[index2].startTime.minute)) {
						//OK!
					} else {
						return true;
					}

				} else {
					if(otherMoments[index2].endTime.hour<thisMoments[index1].startTime.hour ||
						(otherMoments[index2].endTime.hour==thisMoments[index1].startTime.hour &&
							otherMoments[index2].endTime.minute<thisMoments[index1].startTime.minute)) {
						//OK!
					} else {
						return true;
					}
				}
			}
		}
	}
    return false;
};

sectionSchema.methods.getCleanMoments = function() {
	//not sure why this needs to happen... but it does need to happen
	return JSON.parse(JSON.stringify(this.moments));
}

sectionSchema.methods.getMoments = function() {
	var moments = [];

	if(!this.meet_time) {
		return moments;
	}

	var splitTimes = this.meet_time.trim().split(' ');
	console.log("Getting moments: "+splitTimes);
	for(var i=0;i<splitTimes.length;i+=2) {
		var days = splitTimes[i]; //in form MTWTHFS
		var timeRange = splitTimes[i+1];
		var timeRangeSplit = timeRange.split('-');//in form HH:MMam

		var startTime = getTimeFromString(timeRangeSplit[0]);
		var endTime = getTimeFromString(timeRangeSplit[1]);

		//console.log("days: "+days+" start: "+startTime+" end: "+endTime);

		for(var d=0;d<days.length;d++) {
			var moment = {};
			if(days[d]=='T') {
				if(days.length>d && days[d+1]=='H') {
					d++;
					moment.day=THURSDAY;
				} else {
					moment.day = TUESDAY;
				}
			} else {
				if(days[d]=='M') {
					moment.day = MONDAY;
				} else {
					if(days[d]=='W') {
						moment.day = WEDNESDAY;
					} else {
						if(days[d]=='F') {
							moment.day = FRIDAY;
						} else {
							if(days[d]=='S') {
								moment.day = SATURDAY;
							}
						}
					}
				}
			}
			moment.startTime = startTime;
			moment.endTime = endTime;
			console.log("new moment: "+moment);
			moments.push(moment);
		}

	}
	return moments;
}

function getTimeFromString(stringTime) {
	var time = {};
	time.hour = parseInt(stringTime.slice(0,2));
	time.minute = parseInt(stringTime.slice(3,5));
	if(stringTime.slice(5,6)=='P') {
		if(time.hour!=12){
			time.hour+=12;//convert to 24 hour time
		}
	} else {
		if(time.hour==12) {
			time.hour =0;
		}
	}
	return time;
}

module.exports = mongoose.model('Section', sectionSchema);