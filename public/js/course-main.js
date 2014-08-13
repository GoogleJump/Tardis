
$(function () {
	$("#add-to-schedule-button").click(addToSchedule);
})

function addToSchedule() {
	var courseId= $("#courseId").val();
	console.log("adding "+courseId);
	$.ajax({
    url: "/schedule/add-course",
    type: "POST",
    data: {courseId:courseId}, 
    success: function (data, status) {
      window.location.href = "/schedule";
      if(data.error) {
        console.log(data.error);
        //todo: show error message
      } else {
      	console.log("add success");
        //todo: show success message
      }
    },
    error: function(xhr,status,error){
       //todo: show error message
    }
  });
}