var selectedCourses = [];

$(function () {
  $("#selected-courses").hide();

  $("#course_input").autocomplete({
      source: function (request, response) {
         console.log("requesting: "+request);
         $.ajax({
            url: "/course-autocomplete",
            type: "POST",
            data: {input:request.term},  // request is the value of search input
            success: function (data, status) {
              // Map response values to fiedl label and value
              console.log("response received: "+data+" status: "+status);
               response($.map(data, function (el) {
                  return {
                     number: el.number,
                     id: el._id,
                     name: el.name
                  };
                  }));
               },
            error: function(xhr,status,error){
               alert(error);
               }
            });
         },
         
         // The minimum number of characters a user must type before a search is performed.
         minLength: 2, 
         
         // set an onFocus event to show the result on input field when result is focused
         focus: function (event, ui) { 
            this.value = ui.item.number; 
            // Prevent other event from not being execute
            event.preventDefault();
         },
         select: function (event, ui) {
            this.value = "";
            
            selectedCourses.push(ui.item);
            displaySelectedCourses();
            // Prevent other event from not being execute            
            event.preventDefault();
         }
  })
 .autocomplete( "instance" )._renderItem = function( ul, item ) {
    return $( "<li>" )
      .append( "<a>" + item.number + "<br>" + item.name + "</a>" )
      .appendTo( ul );
  };

  $("#create-schedule").click(function(){
    console.log("creating schedule");
    $("#calendar").empty();
    $.ajax({
      url: "/generate-schedule",
      type: "POST",
      data: {courses:selectedCourses}, 
      success: function (data, status) {
        console.log("response received: "+data.text+" status: "+status);
        $('#calendar').fullCalendar({
          defaultView:"agendaWeek",
          header: {
            left: '',
            center: '',
            right: ''
          },
          editable: false,
          minTime:"06:00:00",
          allDaySlot:false,
          columnFormat:'dddd',
          events:[{title:'CS1001',start:'2014-07-10T09:00:00',end:'2014-07-10T09:50:00',allDay:false,color:"green"}]
        });
      },
      error: function(xhr,status,error){
         alert(error);
      }
    });
  });
});

function displaySelectedCourses() {
   if(selectedCourses.length==0) {
      $("#none-selected").show();
      $("#selected-courses").hide();
   } else {
      $("#none-selected").hide();
      $("#selected-courses").find("tr:gt(0)").remove(); //remove all existing rows except title
      for(var index in selectedCourses) {
         $("#selected-courses tr:last").after("<tr><td>"+selectedCourses[index].number+"</td><td>"+selectedCourses[index].name+"</td><td onclick=\"removeCourse("+index+");\"><a href=\"#\">Remove</a></td></tr>");
      }
      $("#selected-courses").show();
   }
}

function removeCourse(index) {
   selectedCourses.splice(index, 1);
   displaySelectedCourses();
}