var selectedCourses = [];

var currentScheduleIndex = 0;
var schedules;

$(function () {
  $("#selected-courses").hide();

  $("#calendar-holder").hide();

  $("#error-alert").hide();

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
               $("#error-alert").text("There was an error processing your request. Please try again later.").show();
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
        if(data.error) {
          $("#error-alert").text("There was an error processing your request: "+data.error+". Please try again later.").show();
        } else {
          schedules = data.results;
          setupCalendar();
        }
        
      },
      error: function(xhr,status,error){
         $("#error-alert").text("There was an error processing your request. Please try again later.").show();
      }
    });
  });

  $("#schedule-prev").click(function(){
    currentScheduleIndex--;
    if(currentScheduleIndex==0) {
      $("#schedule-prev").hide();
    }
    $("#schedule-next").show();
    updateScheduleCountText();
    updateCalendarEvents();
  });

  $("#schedule-next").click(function(){
    currentScheduleIndex++;
    if(currentScheduleIndex>=(schedules.length-1)) {
      $("#schedule-next").hide();
    }
    $("#schedule-prev").show();
    updateScheduleCountText();
    updateCalendarEvents();
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

function setupCalendar() {
  currentScheduleIndex = 0;

  $("#schedule-prev").hide();
  if(schedules.length>1) {
    $("#schedule-next").show();
  } else {
    $("#schedule-next").hide();
  }

  updateScheduleCountText();

  $("#calendar-holder").show();
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
    columnFormat:'dddd',
    events:schedules[0]
  });
  //$('#calendar').fullCalendar('gotoDate', '2014-01-13');
  
}

function updateScheduleCountText() {
  $("#schedule-count").text((currentScheduleIndex+1)+" of "+schedules.length+" possible schedules");
}

function updateCalendarEvents() {
  $('#calendar').fullCalendar('removeEvents');
  $('#calendar').fullCalendar('addEventSource', schedules[currentScheduleIndex]);
}