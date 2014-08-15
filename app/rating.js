var Rating = require('../app/models/rating');
var User = require('../app/models/user');
var Professor = require('../app/models/professor');

exports.rate = function(req, res) {
	var helpfulness = parseInt(req.body.helpfulness);
	var difficulty = parseInt(req.body.difficulty);
	var clarity = parseInt(req.body.clarity);
	var recommend = req.body.recommend=='true';
	var comment = req.body.comment;
	var anon = req.body.anon=='true';
	var professorId = req.body.professorId;

	console.log("rating prof "+professorId+" recommend? "+recommend+" anon "+anon+" comment: "+comment+" "+helpfulness);

	if(!req.user){
		res.send(500);
		return;
	}

	req.user.reputation+=10;//bonus rep for submitting rating
	req.user.save();

	var newRating = new Rating();
	newRating.helpfulness = helpfulness;
	newRating.difficulty = difficulty;
	newRating.clarity = clarity;
	newRating.recommend = recommend;
	newRating.comment = comment;

	newRating.overall = (helpfulness+difficulty+clarity)/3;

	if(anon) {
		console.log("anon");
		newRating._poster = null;
	} else {
		console.log("poster: "+req.user);
		newRating._poster = req.user._id;
	}

	newRating.save(function(err){
		Professor.findById(professorId, function(err, professor){
			professor._ratings.push(newRating._id);
			professor._raters.push(req.user._id);
			professor.save(function(err){
				res.send(200);
			});
		});		
	});
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

	if(!req.user) {
		res.send(500);
		return;
	}

	Rating.findById(ratingId, function(err, rating) {
		var upvoteIndex = rating.upvoters.indexOf(req.user._id);
		var delta = 0;
		if(upvoteIndex>=0&&!req.user.admin) {
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

	if(!req.user) {
		res.send(500);
		return;
	}

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
			if(downvoteIndex>=0&&!req.user.admin) {
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

		if(rating._poster) {
			User.findById(rating._poster, function(err, user) {
				user.reputation+=delta;
				user.save();
			});
		}

		res.send(rating.score+'');//send as a string, otherwise it will interpret it as a response code
	});
};