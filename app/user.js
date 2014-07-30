var School = require('../app/models/school');
var User = require('../app/models/user');
var Major = require('../app/models/major');

//view your own user profile
exports.unlock_profile = function(req, res) {
	res.render('lock_screen.ejs', {
		user : req.user, // get the user out of session and pass to template
	});	
};


//edit your own user profile
exports.edit = function(req, res) {
	School.findOne({ '_id' :  req.user._schoolId }, function(err, school) {
		User.findOne({'_id' : req.user._id}, function(err, user){
			Major.findOne({'_id' : req.user._major}, function(err, major){
				res.render('profile-edit.ejs', {
					user : user, // get the user out of session and pass to template
					school: school,
					major: major
				});
			});			
		});
	});
};

//update user profile
exports.update = function(req, res) {
	
	// email was not changed - update rest of info
    if( req.user.local.email === req.body.email ) {
    	console.log("Success");
    	req.user.local.firstname = req.body.firstname;
		req.user.local.lastname = req.body.lastname;
		req.user.local.firstname = req.body.firstname;
		req.user.username = req.body.username;
		req.user.save();
		exports.edit(req, res);

    }
    else{

		User.findOne({ 'local.email' :  req.body.email }, function(err, user) {
	        // if there are any errors, return the error
	        if (err)
	            console.log(err);


	        // check to see if theres already another user with that email
	        if ( user ) {
	            console.log("There is already a user with that email");
	        } else if(req.body.email.substring(req.body.email.length-4,req.body.email.length)!='.edu') {
	        	console.log("Email must end with .edu");
	        	exports.edit(req, res); 
	        } else {
	        	console.log("Success");
	        	req.user.local.firstname = req.body.firstname;
				req.user.local.lastname = req.body.lastname;
				req.user.local.firstname = req.body.firstname;
				req.user.local.email = req.body.email;
				req.user.username = req.body.username;
				req.user.save();
				exports.edit(req, res);      	
	        }
		});
	}

};


//view your own user profile
exports.view_profile = function(req, res) {
	School.findOne({ '_id' :  req.user._schoolId }, function(err, school) {
		req.user.populate('_major', function(err, user){
			res.render('profile.ejs', {
				user : user, // get the user out of session and pass to template
				school: school
			});			
		});
	});
};



//view a public user profile
exports.view = function(req, res) {
	var id = req.params.userId;
	User.findOne({'_id':id}, function(err, user) {
		if(user) {
			School.findOne({ '_id' : user._schoolId }, function(err, school) {
			res.render('user.ejs', {
				user : user, 
				school: school
			});
		});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
};

exports.view_select_school = function(req, res) {
	//get all schools from the database
	School.find({}, function (err, schools) {
		res.render('select_school.ejs', {
			schoolArray : 	schools,
			message: 		req.flash('message')
		});
	});
};

exports.select_school =  function(req, res) {
	var school = req.body.school;
	var major = req.body.major;

	req.user._schoolId = school;
	req.user._major = major;
	req.user.save();

    res.redirect('/profile');
};