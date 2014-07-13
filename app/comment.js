var Comment = require('../app/models/comment');
var User = require('../app/models/user');

exports.upvote = function(req, res) {
	var commentId = req.params.commentId;

	Comment.findOne({'_id':commentId}, function(err, comment) {
		var upvoteIndex = comment.upvoters.indexOf(req.user._id);
		var delta = 0;
		if(upvoteIndex>=0) {
			//has already upvoted
			delta = -1;
			comment.upvoters.splice(upvoteIndex, 1);
		} else {
			var downvoteIndex = comment.downvoters.indexOf(req.user._id);
			if(downvoteIndex>=0) {
				//changing from downvote to upvote
				delta = 2;
				comment.downvoters.splice(downvoteIndex, 1);
				comment.upvoters.push(req.user._id);
			} else {
				//has neither upvoted nor downvoted
				delta = 1;
				comment.upvoters.push(req.user._id);
			}
		}
		comment.helpfulness+=delta;

		comment.save();

		if(comment._userId) {
			User.findOne({'_id':comment._userId}, function(err, user) {
				user.reputation+=delta;
				user.save();
			});
		}

		res.send(comment.helpfulness+'');//send as a string, otherwise it will interpret it as a response code
	});
};

exports.downvote = function(req, res) {
	var commentId = req.params.commentId;

	Comment.findOne({'_id':commentId}, function(err, comment) {
		var upvoteIndex = comment.upvoters.indexOf(req.user._id);
		var delta = 0;
		if(upvoteIndex>=0) {
			//changing from upvote to downvote
			delta = -2;
			comment.upvoters.splice(upvoteIndex, 1);
			comment.downvoters.push(req.user._id);
		} else {
			var downvoteIndex = comment.downvoters.indexOf(req.user._id);
			if(downvoteIndex>=0) {
				//has already downvoted
				delta = 1;
				comment.downvoters.splice(downvoteIndex, 1);
			} else {
				//has neither upvoted nor downvoted
				delta = -1;
				comment.downvoters.push(req.user._id);
			}
		}
		comment.helpfulness+=delta;

		comment.save();

		if(comment._userId) {
			User.findOne({'_id':comment._userId}, function(err, user) {
				user.reputation+=delta;
				user.save();
			});
		}

		res.send(comment.helpfulness+'');//send as a string, otherwise it will interpret it as a response code
	});
};