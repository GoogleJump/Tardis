

$(function () {
	$("#school-select").change(function(){
		console.log("school selected");
		$("#major-select").removeAttr("disabled");
	});
})