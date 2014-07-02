var User       		= require('../app/models/user');
var School       		= require('../app/models/school');

module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', isNotLoggedIn, function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', isNotLoggedIn, function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') }); 
	});

	// process the login form
	// app.post('/login', do all our passport stuff here);

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', isNotLoggedIn, function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	// app.post('/signup', do all our passport stuff here);

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		School.findOne({ '_id' :  req.user._schoolId }, function(err, school) {
		res.render('profile.ejs', {
			user : req.user, // get the user out of session and pass to template
			school: school
		});
		});

	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});



	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/select-school', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));





	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));


	app.get('/select-school', function(req, res) {
		School.find({}, function (err, schools) {
         
		res.render('select_school.ejs',
			{schoolArray : schools,
				message: req.flash('message')});
         
   		});


	});

	app.post('/select-school', function(req, res) {
		var school = req.body.school;

		console.log(school);

		req.user._schoolId = school;
		req.user.save();

        res.redirect('/profile');
	});

	app.post('/add-school', function(req, res) {
		var name = req.body.schoolName;

		//regex to match school name case insensitively mit==MIT
		var regex = new RegExp(["^",name,"$"].join(""),"i");

		School.findOne({'name':regex}, function(err, school) {
			if(school) {
				req.flash('message', 'There is already a school with the name '+name);
				res.redirect('/select-school');
			} else {
				var newSchool = new School();
				newSchool.name = name;
				newSchool.save();

				req.user._schoolId = newSchool._id;
				req.user.save();
				res.redirect('/profile');
			}
			
		});

	});

	app.get('/schools/:schoolId', function(req, res) {
		var id = req.params.schoolId;
		School.findOne({'_id':id}, function(err, school) {
			if(school) {
				res.render('school.ejs', {school:school});
			} else {
				//Error!
				res.render('error.ejs');
			}
			
		});
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