module.exports = {

	'googleAuth' : {
		'clientID' 		: process.env.GOOGLE_ID, // your App ID
		'clientSecret' 	: process.env.GOOGLE_SECRET, // your App Secret
		'callbackURL' 	: 'http://scheduler.evanforbes.net/auth/google/callback',
		'passReqToCallback' : true
	},

	'gcalAuth' : {
		'clientID' : process.env.GCAL_ID,
		'clientSecret' : process.env.GCAL_SECRET,
		'callbackURL': 'http://scheduler.evanforbes.net/auth/google/gcal/callback'
	}
}