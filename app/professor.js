var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Comment = require('../app/models/comment');
var User = require('../app/models/user');

exports.view = function(req, res) {
	var id = req.params.professorId;
	Professor.findOne({'_id':id}, function(err, professor) {
		if(professor) {
			School.findOne({ '_id' : professor._schoolId }, function(err, school) {
				Comment.find({'type':'professor', '_onId':id}, function(err, comments) {
					if(comments.length==0) {
						res.render('professor.ejs', {
							professor : professor, 
							school: school,
							comments: []
						});
					}
					
					var commentPacks = [];
					comments.forEach(function(comment, index) {
						var pack = [];
						pack['comment'] = comment;
						if(comment._userId) {
							User.findOne({'_id':comment._userId}, function(err, poster) {
								pack['poster'] = poster;
								commentPacks.push(pack);
								if(commentPacks.length==comments.length) {
									res.render('professor.ejs', {
										professor : professor, 
										school: school,
										comments: commentPacks
									});
								}
							});
						} else {
							commentPacks.push(pack);
							if(commentPacks.length==comments.length) {
								res.render('professor.ejs', {
									professor : professor, 
									school: school,
									comments: commentPacks
								});
							}
						}
					});
				});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
};

exports.add = function(req, res) {
	var name = req.body.name;
	var department = req.body.department;
	var schoolId = req.params.schoolId;

	//regex to match professor name case insensitively mit==MIT
	var regex = new RegExp(["^",name,"$"].join(""),"i");

	Professor.findOne({'_schoolId':schoolId,'name':regex}, function(err, professor) {
		if(professor) {
			req.flash('message', 'There is already a professor with the name '+name);
			res.redirect('/school/'+schoolId);
		} else {
			var newProfessor = new Professor();
			newProfessor.name = name;
			newProfessor.department = department;
			newProfessor._schoolId = schoolId;
			newProfessor.save();

			res.redirect('/professor/'+newProfessor._id);
		}
		
	});

};

exports.comment = function(req, res) {
	var comment = req.body.comment;
	var anon = req.body.anon;
	var professorId = req.params.professorId;

	var newComment = new Comment();
	newComment.comment = comment;
	newComment.type = 'professor';
	newComment._onId = professorId;
	if(!anon)
		newComment._userId = req.user._id;
	else
		newComment._userId = null;
	newComment.save();

	res.redirect('/professor/'+professorId);
};