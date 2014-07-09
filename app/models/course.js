// load the things we need
var mongoose = require('mongoose');

var courseSchema = mongoose.Schema({
    name: String,
    number: String,
    department: String,
    description: String,
    credits: Number,
    level: String,
    _schoolId: mongoose.Schema.Types.ObjectId
});

exports.createCourseFromJSON = function(schoolId, data) {
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

module.exports = mongoose.model('Course', courseSchema);

