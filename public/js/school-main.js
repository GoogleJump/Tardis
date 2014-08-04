
$(function () {
	$("#omnibox-button").click(search);
	$("#omnibox").on("keypress", function(e) {
	     if (e.which == 13) {
	         //do some stuff
	         search();
	     }
	});
})

function search() {
	var term = $("#omnibox").val();
	var schoolId = $("#schoolId").val();
	console.log("school "+schoolId);
	if(term) {
		console.log("searching: "+term);
		$.ajax({
	      url: "/school/"+schoolId+"/search",
	      type: "GET",
	      data: {term:term}, 
	      success: function (data, status) {
	      	console.log("search success");
	      	console.log(data);
	      },
	      error: function(xhr,status,error){
	         console.log("error");
	      }
	    });
	}
}