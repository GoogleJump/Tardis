var Rating = require('../app/models/rating');
var User = require('../app/models/user');
var Professor = require('../app/models/professor');

exports.rate = function(req, res) {
	var helpfulness = req.body.helpfulness;
	var difficulty = req.body.difficulty;
	var clarity = req.body.clarity;
	var recommend = req.body.recommend=='true';
	var comment = req.body.comment;
	var anon = req.body.anon=='true';
	var professorId = req.body.professorId;

	console.log("rating prof "+professorId+" recommend? "+recommend+" anon "+anon+" comment: "+comment+" "+helpfulness);

	if(!req.user){
		res.send(500);
		return;
	}


	var newRating = new Rating();
	newRating.helpfulness = helpfulness;
	newRating.difficulty = difficulty;
	newRating.clarity = clarity;
	newRating.recommend = recommend;
	newRating.comment = comment;

	if(anon) {
		console.log("anon");
		newRating._poster = null;
	} else {
		console.log("poster: "+req.user);
		newRating._poster = req.user._id;
	}

	newRating.save();

	Professor.findById(professorId, function(err, professor){
		professor._ratings.push(newRating._id);
		professor.save();
	});

	res.send(200);
}

// exports.comment = function(req, res) {
// 	var comment = req.body.comment;
// 	var anon = req.body.anon;
// 	var professorId = req.params.professorId;

// 	var newComment = new Comment();
// 	newComment.comment = comment;
// 	newComment.type = 'professor';
// 	newComment._onId = professorId;
// 	if(!anon)
// 		newComment._poster = req.user._id;
// 	else
// 		newComment._poster = null;
// 	newComment.save(function(err){
// 		res.redirect('/professor/'+professorId);
// 	});
// };

exports.upvote = function(req, res) {
	var ratingId = req.params.ratingId;

	Rating.findById(ratingId, function(err, rating) {
		var upvoteIndex = rating.upvoters.indexOf(req.user._id);
		var delta = 0;
		if(upvoteIndex>=0) {
			//has already upvoted
			delta = -1;
			rating.upvoters.splice(upvoteIndex, 1);
		} else {
			var downvoteIndex = rating.downvoters.indexOf(req.user._id);
			if(downvoteIndex>=0) {
				//changing from downvote to upvote
				delta = 2;
				rating.downvoters.splice(downvoteIndex, 1);
				rating.upvoters.push(req.user._id);
			} else {
				//has neither upvoted nor downvoted
				delta = 1;
				rating.upvoters.push(req.user._id);
			}
		}
		rating.score+=delta;

		rating.save();

		if(rating._poster) {
			User.findById(rating._poster, function(err, user) {
				user.reputation+=delta;
				user.save();
			});
		}

		res.send(rating.score+'');//send as a string, otherwise it will interpret it as a response code
	});
};

exports.downvote = function(req, res) {
	var ratingId = req.params.ratingId;

	Rating.findById(ratingId, function(err, rating) {
		var upvoteIndex = rating.upvoters.indexOf(req.user._id);
		var delta = 0;
		if(upvoteIndex>=0) {
			//changing from upvote to downvote
			delta = -2;
			rating.upvoters.splice(upvoteIndex, 1);
			rating.downvoters.push(req.user._id);
		} else {
			var downvoteIndex = rating.downvoters.indexOf(req.user._id);
			if(downvoteIndex>=0) {
				//has already downvoted
				delta = 1;
				rating.downvoters.splice(downvoteIndex, 1);
			} else {
				//has neither upvoted nor downvoted
				delta = -1;
				rating.downvoters.push(req.user._id);
			}
		}
		rating.score+=delta;

		rating.save();

		if(comment._poster) {
			User.findById(comment._poster, function(err, user) {
				user.reputation+=delta;
				user.save();
			});
		}

		res.send(rating.score+'');//send as a string, otherwise it will interpret it as a response code
	});
};