var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var Section = require('../app/models/section');

exports.view = function(req, res) {
	res.render('schedule.ejs');
}

exports.generate = function(req, res) {
	console.log(req.body.courses);
	


	
	res.send({text:"Hello"});
}