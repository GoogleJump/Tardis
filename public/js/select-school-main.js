var selectedSchoolId;

$(function () {
	$("#school-select").change(function(){
		console.log("school selected");
		$("#major-select").removeAttr("disabled");
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
		      },
		      error: function(xhr,status,error){
		         console.log("error");
		      }
		    });
		}
	});

	$("#add-major-button").click(function(){
		if(selectedSchoolId){
		    $.ajax({
		      url: "/major/add",
		      type: "POST",
		      data: {schoolId:selectedSchoolId, name:$("#major-name-input").val()}, 
		      success: function (data, status) {
		      	console.log("major added");

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