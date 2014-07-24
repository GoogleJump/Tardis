var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Rating = require('../app/models/rating');
var User = require('../app/models/user');

exports.view = function(req, res) {
	var id = req.params.professorId;
	Professor.findById(id)
	.populate('_ratings _school')
	.exec(function(err, professor) {
		if(err) console.log(err);
		if(professor) {
			console.log("professor: "+JSON.stringify(professor));
			if(professor._ratings.length==0){
				res.render('professor.ejs', {
					professor : professor
				});						
			} else {
				for(var i=0;i<professor._ratings.length;i++){
					var posterMap = {};
					var count = 0;
					if(professor._ratings[i]._poster) {
						User.findById(professor._ratings[i]._poster).select('username reputation').exec(function(err,poster){
							posterMap[poster._id] = poster;
							count++;
							if(count==professor._ratings.length) {
								//done populating posters
								console.log("prof: "+JSON.stringify(professor));
								res.render('professor.ejs', {
									professor : professor,
									posterMap: posterMap
								});						
							}
						});
					} else {
						count++;
						if(count==professor._ratings.length) {
							//done populating posters
							console.log("prof: "+JSON.stringify(professor));
							res.render('professor.ejs', {
								professor : professor,
								posterMap: posterMap
							});						
						}
					}
				}				
			}
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