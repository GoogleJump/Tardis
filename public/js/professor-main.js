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

	$("#rate-button").click(function(){
		console.log("rating");

		var reqParams = {};
		reqParams.professorId = $("#professorId").val();
		reqParams.anon = $("#rating-anon").is(':checked');
		reqParams.recommend = $('#rating-recommend').is(':checked');
		reqParams.helpfulness = $("#slider-helpfulness" ).slider("value");
		reqParams.difficulty = $("#slider-difficulty" ).slider("value");
		reqParams.clarity = $("#slider-clarity" ).slider("value");
		reqParams.comment = $("#rating-comment").val();

		console.log(reqParams);
		$.ajax({
			url: "/professor/"+reqParams.professorId+"/rate",
			type: "POST",
			data: reqParams, 
			success: function (data, status) {
				console.log("rate success");
			},
			error: function(xhr,status,error){
				console.log("rate error");
			}
		});
	});
});

function upvote(ratingId, down) {
	console.log("voting "+ratingId);
	var url ="/rating/"+ratingId+"/";
	if(down){
		url += "downvote";
	} else {
		url+="upvote";
	}
	$.ajax({
		url: url,
		type: "POST",
		data: {}, 
		success: function (data, status) {
			console.log("vote success: "+data);
			$("#score-"+ratingId).text(data);
		},
		error: function(xhr,status,error){
			console.log("vote error");
		}
	});
}



						// <% for(var index=0;index<comments.length;index++) {%>
						// 	<%var c = comments[index];%>
						// 	<%var p = c._poster;%>
						// 	<span id='reputation-<%=c._id%>'><B><%=c.helpfulness%></B></span> <%=c.comment%> 
						// 	<input input id="upvote" type="button" value="Upvote" onclick="upvote('<%=c._id%>', false);" />
						// 	<input input id="downvote" type="button" value="Downvote" onclick="upvote('<%=c._id%>', true);" /><br>
						// 	<%if(p) {%>
						// 		posted by <a href="/user/<%=p._id%>"><%=p.username%></a> (<%=p.reputation%>)
						// 	<%} else {%>
						// 		posted anonymously
						// 	<%}%>
						// 	<br><br>
						// <%}%>
						// <% if (comments.length==0) {%>
						// 	No comments to show
						// <%}%>