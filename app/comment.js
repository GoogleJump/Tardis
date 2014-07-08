var Comment = require('../app/models/comment');
var User = require('../app/models/user');

exports.upvote = function(req, res) {
	var commentId = req.params.commentId;

	Comment.findOne({'_id':commentId}, function(err, comment) {
		comment.helpfulness = comment.helpfulness+1;
		comment.save();

		User.findOne({'_id':comment._userId}, function(err, user) {
			user.reputation++;
			user.save();
		});

		res.redirect('/profile');
	});
};