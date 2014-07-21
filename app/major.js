var Major = require('../app/models/major');
var School = require('../app/models/school');
var User = require('../app/models/user');

exports.get = function(req, res){
	var schoolId = req.query.schoolId;
	console.log("getting majors for "+schoolId);

	School.findById(schoolId).select('majors').populate('majors').exec(function(err, school){
		if(err||!school){
			res.send(500);
		}
		var majorMap = {};
		for(var i=0;i<school.majors.length;i++) {
			majorMap[school.majors[i]._id] = school.majors[i].name;
		}
		res.send({majorMap:majorMap});
	});
}

exports.add = function(req, res){
	var schoolId = req.body.schoolId;
	var name = req.body.name;
	console.log("adding major "+name+" to school "+schoolId);

	var newMajor = new Major();
	newMajor.name = name;
	newMajor.save();

	School.findById(schoolId).select('majors').exec(function(err, school){
		school.majors.push(newMajor._id);
		school.save();
	});
}