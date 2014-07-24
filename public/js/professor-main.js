var helpfulnessLabels= ["very unhelpful", "unhelpful", "average", "helpful", "very helpful"];
var difficultyLabels= ["very hard", "hard", "moderate", "easy", "very easy"];
var clarityLabels = ["did not understand anything","not understandable","average","understandable", "very understandable"]

$(function () {

	//Rating sliders
	 $("#slider-helpfulness").slider({
      min: 0,
      max: 4,
      value: 2,
      step: 1,
      slide: function( event, ui ) {
        $("#helpfulness-label").text(helpfulnessLabels[ui.value]);
      }
    });
	 $("#slider-difficulty").slider({
      min: 0,
      max: 4,
      value: 2,
      step: 1,
      slide: function( event, ui ) {
        $("#difficulty-label").text(difficultyLabels[ui.value]);
      }
    });
	$("#slider-clarity").slider({
      min: 0,
      max: 4,
      value: 2,
      step: 1,
      slide: function( event, ui ) {
        $("#clarity-label").text(clarityLabels[ui.value]);
      }
    });



});