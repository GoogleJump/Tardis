function upvote(comment, down) {
	var xmlhttp;
	if (window.XMLHttpRequest)
	  {// code for IE7+, Firefox, Chrome, Opera, Safari
	  	xmlhttp=new XMLHttpRequest();
	  }
	else
	  {// code for IE6, IE5
	  	xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	  }

	xmlhttp.onreadystatechange=function() {
	  if (xmlhttp.readyState==4 && xmlhttp.status==200) {
	    	document.getElementById("reputation-"+comment).innerHTML = xmlhttp.responseText;
		}
	};
	if(down) {
		xmlhttp.open("POST","/comment/"+comment+"/downvote",true);
	} else {
		xmlhttp.open("POST","/comment/"+comment+"/upvote",true);
	}
	xmlhttp.send();
};


  // $("#create-schedule").click(function(){
  //   $.ajax({
  //     url: "/generate-schedule",
  //     type: "POST",
  //     data: {term:$("#term").val(), courses:selectedCourses}, 
  //     success: function (data, status) {
  //       $("#error-alert").hide();
  //       $("#loading").hide();
  //       if(data.error) {
  //         $("#error-alert").text("There was an error processing your request: "+data.error+". Please try again later.").show();
  //       } else {
  //         schedules = data.results;
  //         setupCalendar();
  //       }
        
  //     },
  //     error: function(xhr,status,error){
  //        $("#error-alert").text("There was an error processing your request. Please try again later.").show();
  //        $("#loading").hide();
  //     }
  //   });
  // });