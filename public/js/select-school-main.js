var selectedSchoolId;

$(function () {
	$("#major-error-text").hide();

	$("#school-select").change(function(){
		console.log("school selected");

		selectedSchoolId = $("#school-select").val();
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
			      	var majorId= data.majorId
			      	var majorName = data.majorName;
			      	$('#major-select').append($('<option>', { value : majorId }).text(majorName)); 
			      	$("#major-select").val(majorId).focus();
			      	$("#major-name-input").val(""); 		
		      	}

		      },
		      error: function(xhr,status,error){
		         console.log("error");
		      }
		    });
		}
	});
})

function updateMajorSelect(majorMap) {
    var select = document.getElementById('major-select');

    // Clear the old options
    select.options.length = 0;

    // Load the new options
    for (var name in majorMap) {
      if (majorMap.hasOwnProperty(name)) {
        select.options.add(new Option(majorMap[name], name));
      }
    }
}