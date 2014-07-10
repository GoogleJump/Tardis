var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var User = require('../app/models/user');
var Section = require('../app/models/section');

exports.view = function(req, res) {
	var id = req.params.sectionId;
	Section.findOne({'_id':id}, function(err, section) {
		if(section) {
			Course.findOne({'_id':section._courseId}, function(err, course){
				Professor.findOne({'_id':section._professorId}, function(err, professor){
					res.render('section.ejs',{course:course,section:section,professor:professor,documents:[]});
				});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
};