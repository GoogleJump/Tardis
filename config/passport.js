
// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// load up the user model
var User       		= require('../app/models/user');
var Section            = require('../app/models/section');
var configAuth = require('./auth');
var gcal = require('google-calendar');


// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        //validate email pattern .edu
        if(email.substring(email.length-4,email.length)!='.edu') {
            return done(null, false, req.flash('signupMessage', 'Email must end with .edu'));
        }

        //password must be >= 8 characters
        if(password.length<8) {
            return done(null, false, req.flash('signupMessage', 'Password must be 8 or more characters'));
        }

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'There is already a user with that email.'));
            } else {

				// if there is no user with that email
                // create the user
                var newUser            = new User();

                // set the user's local credentials
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);
                newUser.username = req.body.username;
                newUser.local.firstname = req.body.firstname;
                newUser.local.lastname = req.body.lastname;
                newUser.local.avatar = '/public/img/defaultavatar.png';

				// save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }

        });    

        });

    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        console.log("em: "+email+" pa: "+password);
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user was found with that email.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Incorrect password.')); // create the loginMessage and save it to session as flashdata

            //Update last login date
            user.lastLoginDate = Date.now();
            user.save(function(err, result){ return;});

            // all is well, return successful user
            return done(null, user);
        });

    }));

    passport.use(new GoogleStrategy(configAuth.googleAuth,
    function(req, token, refreshToken, profile, done) {
        console.log("google req: "+JSON.stringify(req));
        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {
            // try to find the user based on their google id
            User.findOne({ 'google.id' : profile.id }, function(err, user) {
                if (err)
                    return done(err);

                if (user) {
                    // if a user is found, log them in
                    if(req.user) {
                        //trying to connect google to multiple accounts
                        console.log("can't connect to multiple accounts");
                        return done("can't connect to multiple accounts");
                    }
                    return done(null, user);
                } else {
                    // if the user isnt in our database, create a new user
                    if(req.user) {
                        //add google to existing account
                        console.log("adding google to "+req.user.username);
                        req.user.google.id    = profile.id;
                        req.user.google.token = token;
                        req.user.google.name  = profile.displayName;
                        req.user.google.email = profile.emails[0].value; // pull the first email
                        req.user.local.avatar = profile._json['picture'];                
                        req.user.save(function(err){
                            return done(null, req.user);
                        })
                    } else {
                        var newUser = new User();

                        // set all of the relevant information
                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = profile.emails[0].value; // pull the first email
                        newUser.local.avatar = profile._json['picture'];

                        var splitName = profile.displayName.split(' ');
                        if(splitName.length>=2){
                            newUser.local.firstname = splitName[0];
                            newUser.local.lastname = splitName[splitName.length-1];
                        }
                        newUser.local.email = profile.emails[0].value;


                        // save the user
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }

                }
            });
        });

    }));

    passport.use('gcal', new GoogleStrategy(configAuth.gcalAuth,
    function(token, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {

            // try to find the user based on their google id
            User.findOne({ 'google.id' : profile.id }, function(err, user) {
                if (err)
                    return done(err);

                if (user) {
                    var calendar = new gcal.GoogleCalendar(token);

                    //make a calendar

                    //calendar.calendars.insert({summary:'Course schedule'}, function(err, response){
                        //var newCalendarId = response.id;

                    var sectionIds= user.schedule;
                    Section.find({_id:{$in:sectionIds}}).populate('_professor _courseId').exec(function(err, sections){
                        for(var i=0;i<sections.length;i++) {
                            var csection = sections[i];
                            for(var j=0;j<csection.moments.length;j++) {
                                var cmoment = csection.moments[j];
                                console.log("cmoment: "+JSON.stringify(cmoment));
                                var startDate = startDates[cmoment.day];
                                calendar.events.insert('primary', {
                                    start: {
                                        dateTime: startDate+'T'+pad(cmoment.startTime.hour)+':'+pad(cmoment.startTime.minute)+':00-07:00',
                                        timeZone: "America/Los_Angeles"
                                    },
                                    end: {
                                        dateTime: startDate+'T'+pad(cmoment.endTime.hour)+':'+pad(cmoment.endTime.minute)+':00-07:00',
                                        timeZone: "America/Los_Angeles"
                                    },
                                    summary: csection._courseId.name,
                                    recurrence: ["RRULE:FREQ=WEEKLY;UNTIL="+endDate+"T235900Z"],
                                    location: csection.location,
                                    description: csection._courseId.number+"-"+csection.number+" with "+csection._professor.name
                                }, function(err, res){
                                    console.log(err);
                                    console.log(JSON.stringify(res));
                                });                               
                            }
                        }
                    });


                    //});

                    return done(null, user);
                } else {
                    console.log('no user');
                }
            });
        });

    }));

};

var startDates = ['2014-08-24','2014-08-25','2014-08-26','2014-08-27','2014-08-28','2014-08-29','2014-08-30'];

var endDate = '20141208';

function pad(num) {
    if(num>9) return num;
    else return '0'+num;
}