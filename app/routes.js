var fs = require('fs'), express = require('express');

var School = require('../app/models/school');

//SUB ROUTES
var user = require('./user'); 
var school = require('./school'); 
var professor = require('./professor');
var rating = require('./rating');
var course = require('./course');
var section = require('./section');
var schedule = require('./schedule');
var major = require('./major');
var admin = require('./admin');

module.exports = function(app, passport) {
	app.get('/', isNotLoggedIn, function(req, res) {
		res.render('index.ejs'); 
	});

	app.get('/login', isNotLoggedIn, function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') }); 
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile',
		failureRedirect : '/login', // redirect back to the login page if there is an error
		failureFlash : true
	}));



	app.post('/lock_screen', passport.authenticate('local-login', {
		successRedirect : '/profile',
		failureRedirect : '/lock_screen', 
		failureFlash : true
	}));

	app.get('/lock_screen', isLoggedIn, user.unlock_profile);	
	

	app.get('/signup', isNotLoggedIn, function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/select-school', 
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true
	}));

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
	app.get('/auth/google/callback',
        passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
        })
    );
    app.get('/auth/google/gcal', passport.authenticate('gcal', { scope : ['profile', 'email','https://www.googleapis.com/auth/calendar']}));
	app.get('/auth/google/gcal/callback',
        passport.authenticate('gcal', {
                successRedirect : '/schedule',
                failureRedirect : '/'
        })
    );

	app.get('/profile', isLoggedIn, accountFullyCreated, user.view_profile);	
	app.get('/user/:userId', user.view);
	app.post('/profile-edit', user.update);
	app.post('/password-edit', user.update_password);
	app.post('/school-edit', user.update_school);
	app.post('/update-pic', user.update_pic);
	app.get('/profile-edit', isLoggedIn, user.edit);

	app.get('/auth/google/remove', user.remove_google);

	app.get('/select-school', isLoggedIn, user.view_select_school);
	app.post('/select-school', user.select_school);


	app.post('/school/add', school.add);
	app.get('/school/:schoolId', school.view);
	app.get('/school/:schoolId/courses', school.view_courses);
	app.post('/school/:schoolId/courses/update', school.update_courses);

	app.get('/school/:schoolId/professors', professor.view_all);
	app.get('/school/:schoolId/search', school.search_within);

	app.get('/professor/:professorId', professor.view);
	app.post('/add-professor/:schoolId', professor.add);

	app.post('/professor/:professorId/rate', rating.rate);
	app.post('/rating/:ratingId/upvote', rating.upvote);
	app.post('/rating/:ratingId/downvote', rating.downvote);

	app.get('/course/:courseId', course.view);

	app.get('/section/:sectionId', section.view);

	app.post('/section/:sectionId/add-document', section.add_document);

	app.post('/course-autocomplete', course.autocomplete);

	app.get('/degree', isLoggedIn, major.view);

	app.get('/schedule', isLoggedIn, schedule.view);
	app.post('/schedule/generate', schedule.generate);
	app.post('/schedule/add-course',schedule.add_course);
	app.post('/schedule/remove-course',schedule.remove_course);
	app.get('/schedule/get-pending', schedule.get_pending_schedule);
	app.get('/schedule/get-batch', schedule.get_batch);
	app.post('/schedule/save', schedule.save);

	app.get('/major/get', major.get);
	app.post('/major/add', major.add);

	app.get('/about', function(req,res){
		School.findById(req.user._schoolId, function(err, school){
			res.render('about.ejs', {user:req.user, school:school});
		});
	});

	app.get('/admin/users', isAdmin, admin.view_users);

	//set the public/ directory as static
	app.use('/public', express.static('public'));

	app.get('/error', function(req, res) {
		res.render('static/500.html');
	});

	//ALL OTHER ROUTES MUST BE ABOVE HERE
	//Got here and nothing has happened? 404!
	app.use(function(req, res, next){
	  res.render('static/404.html');
	});

	//Error? Show server error page!
	app.use(function(err, req, res, next){
	  console.error(err.stack);
	  	res.redirect('/error');
	});

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

function isNotLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (!req.isAuthenticated())
		return next();

	// if they are redirect them to the profile page
	res.redirect('/profile');
}

function accountFullyCreated(req, res, next) {
	if(req.user._schoolId) {
		return next();
	}

	res.redirect('/select-school');
}

function isAdmin(req, res, next) {
	if(req.user&&req.user.admin) {
		return next();
	}

	res.send(403);//forbidden
}