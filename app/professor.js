var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Rating = require('../app/models/rating');
var User = require('../app/models/user');

var _ = require('underscore');

exports.view = function(req, res) {
	var id = req.params.professorId;
	Professor.findById(id)
	.populate('_ratings _school')
	.exec(function(err, professor) {
		if(err) console.log(err);

		if(professor) {
			var rateState=0;// user not logged in
			var uIndex =0;
			if(req.user){
				rateState = 1;//user logged in
				uIndex = professor._raters.indexOf(req.user._id);
				if(uIndex>=0){
					rateState = 2;//user already rated this prof
				}
			}
			if(professor._ratings.length==0){
				res.render('professor.ejs', {
					professor : professor,
					cUser: req.user,
					rateState: rateState
				});						
			} else {
				var posterMap = {};
				var count = 0;
				professor._ratings = _.sortBy(professor._ratings, function(rating){return -rating.score;});
				for(var i=0;i<professor._ratings.length;i++){
					if(professor._ratings[i]._poster) {
						User.findById(professor._ratings[i]._poster).select('username reputation').exec(function(err,poster){
							posterMap[poster._id] = poster;
							count++;
							if(count==professor._ratings.length) {
								//done populating posters
								res.render('professor.ejs', {
									professor : professor,
									posterMap: posterMap,
									cUser: req.user,
									rateState: rateState
								});						
							}
						});
					} else {
						count++;
						if(count==professor._ratings.length) {
							//done populating posters
							res.render('professor.ejs', {
								professor : professor,
								posterMap: posterMap,
								cUser: req.user,
								rateState: rateState
							});						
						}
					}
				}				
			}
		} else {
			//Error!
			console.log("prof not found");
			res.redirect('/error');
		}
	});
};

exports.view_all = function(req, res) {
	var schoolId = req.params.schoolId;
	console.log("viewing professors for "+schoolId);
	School.findById(schoolId, function(err, school) {
		if(school) {
			Professor.find({'_school':schoolId}).sort('name').exec(function(err, professors) {
				res.render('professors.ejs', {school:school, professors:professors, message: req.flash('message'), cUser:req.user});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
	});
}

exports.add = function(req, res) {
	var name = req.body.name;
	var department = req.body.department;
	var schoolId = req.params.schoolId;

	console.log("adding professor to school "+schoolId+": "+name);

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
			newProfessor._school = schoolId;
			newProfessor.save();

			res.redirect('/professor/'+newProfessor._id);
		}
		
	});

};