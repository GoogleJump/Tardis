var selectedCourses = [];

$(function () {
  $("#selected-courses").hide();

  $("#course_input").autocomplete({
      source: function (request, response) {
         $.ajax({
            url: "/course-autocomplete",
            type: "POST",
            data: {input:request.term},  // request is the value of search input
            success: function (data, status) {
              // Map response values to fiedl label and value
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
    $("#calendar").empty();
    $.ajax({
      url: "/generate-schedule",
      type: "POST",
      data: {term:$("#term").val(), courses:selectedCourses}, 
      success: function (data, status) {
        console.log(data.results[0][5].start);
        if(data.error) {
          alert(data.error)
        } else {
          setupCalendar(data.results);
        }
        
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
         $("#selected-courses tr:last").after("<tr><td>"+selectedCourses[index].number+"</td><td>"+selectedCourses[index].name+"</td><td><input value=\"Remove\" type=\"button\" class='btn btn-danger' onclick=\"removeCourse("+index+");\"></td></tr>");
      }
      $("#selected-courses").show();
   }
}

function removeCourse(index) {
   selectedCourses.splice(index, 1);
   displaySelectedCourses();
}

function setupCalendar(schedules) {
  console.log(schedules[0]);
  $('#calendar').fullCalendar({
    defaultView:"agendaWeek",
    header: {
      left: '',
      center: '',
      right: ''
    },
    year:2014,
    month:0,
    date:12,
    editable: false,
    minTime:"06:00:00",
    allDaySlot:false,
    //columnFormat:'dddd',
    events:schedules[0]
  });
  //$('#calendar').fullCalendar('gotoDate', '2014-01-13');
}