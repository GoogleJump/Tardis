
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
	      	displaySearchResults(data);
	      },
	      error: function(xhr,status,error){
	         console.log("error");
	      }
	    });
	}
}

function displaySearchResults(data) {
	var p = $("#professor-results-table");
	var c = $("#course-results-table");
	//remove past results
	p.find("tr:gt(0)").remove();
	c.find("tr:gt(0)").remove();
	//unhide tables if there are results
	if(data.professors.length>0){
		p.show();
		//hide error msg
		for(var i=0;i<data.professors.length;i++) {
			var cp = data.professors[i];
			var viewButton="<td>view button</td>";
			$('#professor-results-table tr:last').after('<tr><td>'+cp.name+'</td><td>'+cp.department+'</td>'+viewButton+'</tr>');
		}
	} else {
		p.hide();
		//show error msg
	}
	if(data.courses.length>0){
		c.show();
		for(var i=0;i<data.courses.length;i++) {
			var cc = data.courses[i];
			var viewButton="<td>view button</td>";
			$('#course-results-table tr:last').after('<tr><td>'+cc.number+'</td><td>'+cc.name+'</td>'+viewButton+'</tr>');
		}
	} else {
		c.hide();
	}
	
}