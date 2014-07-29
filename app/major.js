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

	//TODO: case insensitive
	Major.findOne({name:name,_school:schoolId}, function(err, major){
		console.log(major);
		if(major){
			res.send({error:"There is already a major with that name"});
		} else{
			var newMajor = new Major();
			newMajor.name = name;
			newMajor._school = schoolId;
			newMajor.save();

			School.findById(schoolId).select('majors').exec(function(err, school){
				school.majors.push(newMajor._id);
				school.save();
			});
			res.send({majorId:newMajor._id,majorName:name});		
		}
	});
}

exports.view = function(req, res) {
	var majorid = req.user._major;
	var schoolid = req.user._schoolId;
	School.findOne({'_id':schoolid}, function(err, school) {
		if(school) {
			Major.findOne({'_id':majorid}, function(err, major) {
				res.render('major.ejs', {school:school, major:major, user:req.user, message: req.flash('message')});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
}