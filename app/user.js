var School = require('../app/models/school');
var User = require('../app/models/user');
var Major = require('../app/models/major');

var fs = require('fs');
var easyimg = require('easyimage');

//view your own user profile
exports.unlock_profile = function(req, res) {
	res.render('lock_screen.ejs', {
		user : req.user, // get the user out of session and pass to template
		message: req.flash('loginMessage')
	});	
};


//edit your own user profile
exports.edit = function(req, res) {
	//get all schools from the database
	School.find({}, function (err, schools) {
		School.findOne({ '_id' :  req.user._schoolId }, function(err, school) {
			Major.find({'_id' : { $in : school.majors }}, function (err, majorArray){
				Major.findOne({'_id' : req.user._major}, function(err, major){
					res.render('profile-edit.ejs', {
						majorArray : majorArray, 
						schoolArray : schools, 
						user : req.user, // get the user out of session and pass to template
						school: school,
						major: major, 
						message: req.flash('message')
					});
				});
			});
			
		});
	});
};

//update user profile
exports.update = function(req, res) {
	console.log(req.body);
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

//update user password
exports.update_password = function(req, res) {
	user = req.user;
	if (user.local.password&&!user.validPassword(req.body.currpassword)){
		req.flash('signupMessage', 'Current password is incorrect');
		console.log("Current password is incorrect")
		res.redirect('/profile-edit');
	} else if (req.body.newpassword != req.body.newpassword2){
		console.log('New passwords do not match')
		res.redirect('/profile-edit');
	} else if (req.body.newpassword.length < 8 ){
		console.log('Password must be 8 or more characters')
		res.redirect('/profile-edit');
	} else {
		console.log("Success");
		user.local.password = user.generateHash(req.body.newpassword);
		user.save(function(err){
			res.redirect('/profile-edit');
		});
	}
};

exports.remove_google = function(req, res) {
	if(req.user.local.password) {
		req.user.google.token = "";
		req.user.google.id = "";
		req.user.save(function (err){
			console.log(err+" saved");
			res.redirect('/profile');
		})
	} else {
		console.log("user must have local password");
		res.send(500);
	}
}

//update user school info
exports.update_school = function(req, res) {
	user = req.user;
	School.findOne({'_id': req.body.school}, function(err, school) {
		if ( school._id != user._schoolId ) {
			user._schoolId = school._id;
			user.save();
		}
		Major.findOne({name:req.body.major,_school:school._id}, function(err, major) {
			if ( major ) {
				if ( user._major != major._id ){
					user._major = major._id;
					user.save();
				}
			} 
			res.redirect('/profile-edit');
		});
	});
};


exports.update_pic = function(req, res) {
	var user = req.user;
	var file = req.files.picture;
	if ( file.size == 0 ){
		fs.unlinkSync(file.path);
		res.redirect('/profile-edit');
		return;
	}

	var oldpath = file.path;
	var newpath = 'public/img/avatars/' + file.path.substr(8, file.path.length-1);

	fs.rename(oldpath, newpath, function(err) {
        if (err) throw err;
        console.log('File uploaded to: ' + newpath + ' - ' + file.size + ' bytes');
    	if (user.local.avatar == '/public/img/defaultavatar.png' || user.local.avatar.substr(0, 6) == 'https:'){
		console.log('did not delete ' + user.local.avatar);
		} else {
			fs.unlinkSync(user.local.avatar.substr(1, user.local.avatar.length));
			console.log('successfully deleted ' + user.local.avatar);
		}

		user.local.avatar = '/'+newpath;	
		user.save(); 			
		res.redirect('/profile-edit');
		
	});
};

//view your own user profile
exports.view_profile = function(req, res) {
/*	User.find({}, function(err, users){
		for (index in users){
			users[index].local.avatar = '/public/img/defaultavatar.png';
			users[index].save();
		}
	})*/
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

exports.view_select_school = function(req, res, emsg) {
	//get all schools from the database
	var message="";
	if(typeof emsg == 'string') {
		message= emsg;
	}
	School.find({}, function (err, schools) {
		res.render('select_school.ejs', {
			schoolArray : 	schools,
			user: req.user,
			message: message
		});
	});
};

exports.select_school =  function(req, res) {
	var school = req.body.school;
	var major = req.body.major;
	var username = req.body.username;

	if(username!=undefined){
		if(username.length<3){
			exports.view_select_school(req, res,"Username must be at least 3 characters");
			return;
		} else {
			req.user.username = username;
		}
	}

	if(school=='null'||major=='null') {
		exports.view_select_school(req, res,"Must select school and major");
		return;
	}

	req.user._schoolId = school;
	req.user._major = major;

	req.user.save(function(err){
		res.redirect('/profile');
	});
};