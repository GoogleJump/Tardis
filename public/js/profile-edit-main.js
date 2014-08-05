var selectedSchoolId;

$(function () {
	$("#major-error-text").hide();
	$("#school-error-text").hide();
	selectedSchoolId = $("#school-select").val();

	$("#school-select").change(function(){
		console.log("school selected");

		selectedSchoolId = $("#school-select").val();
		console.log(selectedSchoolId);
		if(selectedSchoolId=='null'){
			selectedSchoolId=null;
		} else {
			$.ajax({
		      url: "/major/get",
		      type: "GET",
		      data: {schoolId:selectedSchoolId}, 
		      success: function (data, status) {
		      	console.log("major got");
		      	console.log(data);
		      	updateMajorSelect(data.majorMap);
		      	$("#major-select").removeAttr("disabled");
		      },
		      error: function(xhr,status,error){
		         console.log("error");
		      }
		    });
		}
	});

	$("#add-major-button").click(function(){
		console.log("adding major...");
		if(selectedSchoolId){
		    $.ajax({
		      url: "/major/add",
		      type: "POST",
		      data: {schoolId:selectedSchoolId, name:$("#major-name-input").val()}, 
		      success: function (data, status) {
		      	if(data.error){
		      		$("#major-parent").addClass("has-error");
		      		$("#major-error-text").text(data.error).show();
		      	} else{
		      		$("#major-parent").removeClass("has-error");
		      		$("#major-error-text").hide();
			      	console.log("major added");
			      	var majorName = data.majorName;
			      	$('#major-select').append($('<option>', { value : majorName }).text(majorName)); 
			      	$("#major-select").val(majorName).focus();
			      	$("#major-name-input").val(""); 		
		      	}

		      },
		      error: function(xhr,status,error){
		         console.log("error");
		      }
		    });
		} else{
			$("#major-parent").addClass("has-error");
		    $("#major-error-text").text("Must select school first").show();
		}
	});

	$("#add-school-button").click(function(){
		console.log("adding school..");
		console.log($("#school-name-input").val());
		 $.ajax({
	      url: "/school/add",
	      type: "POST",
	      data: {name:$("#school-name-input").val(),city:$("#school-city-input").val(),state:$("#school-state-input").val()}, 
	      success: function (data, status) {
	      	if(data.error){
	      		$("#school-parent").addClass("has-error");
	      		$("#school-error-text").text(data.error).show();
	      	} else{
	      		$("#school-parent").removeClass("has-error");
	      		$("#school-error-text").hide();
		      	console.log("school added");
		      	var schoolId= data.schoolId
		      	var schoolName = data.schoolName;
		      	$('#school-select').append($('<option>', { value : schoolId }).text(schoolName)); 
		      	$("#school-select").val(schoolId).focus();
		      	$("#school-name-input").val(""); 	
		      	$("#school-city-input").val(""); 
		      	$("#school-select").change();		
	      	}

	      },
	      error: function(xhr,status,error){
	         console.log("error");
	      }
		});
	});
})

function updateMajorSelect(majorMap) {
    var select = document.getElementById('major-select');

    // Clear the old options
    select.options.length = 0;

    // Load the new options
    console.log(majorMap);
    for (var name in majorMap) {
      if (majorMap.hasOwnProperty(name)) {
        select.options.add(new Option(majorMap[name], majorMap[name]));
      }
    }
}