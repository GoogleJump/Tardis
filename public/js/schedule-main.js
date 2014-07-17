var selectedCourses = [];
var suggestedCourses = [];
var selectedCourseSections = [];
var courseCount =0;

var currentScheduleIndex = 0;
var schedules;

$(function () {
  $("#calendar-holder").hide();

  $("#error-alert").hide();

  $("#row-after-courses").hide();

  $("#course_input").focus();

  $('[data-toggle="tooltip"]').tooltip({
      'placement': 'top'
  });

  $("#course_input").autocomplete({
      source: function (request, response) {
         $.ajax({
            url: "/course-autocomplete",
            type: "POST",
            data: {input:request.term},  // request is the value of search input
            success: function (data, status) {
              $("#error-alert").hide();
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
            
            addSelectedCourse(ui.item);
            // Prevent other event from not being execute            
            event.preventDefault();
         }
  })
 .autocomplete( "instance" )._renderItem = function( ul, item ) {
    return $( "<li>" )
      .append( "<a class=\"list-group-item\">" + item.number + "<br>" + item.name + "</a>" )
      .appendTo( ul );
  };

  //To get preference selections
  // for(var index in selectedCourses) {
  //   var sects = selectedCourseSections[index];
  //   for(var index2 in sects) {
  //     var pref = $('#pref-radio-'+sects[index2]._id+' label.active input').val();
  //     console.log("sect "+sects[index2]._id+" selected: "+pref);
  //   }
  // }



  $("#create-schedule").click(function(){
    $("#calendar").empty();
    $("#loading").show();
    $("#calendar-holder").hide();

    console.log(selectedCourses);

    var courseIds = [];
    for(var index in selectedCourses) {
      courseIds.push({id:index,number:selectedCourses[index].number});
    }

    $.ajax({
      url: "/schedule/generate",
      type: "POST",
      data: {term:$("#term").val(), courses:courseIds}, 
      success: function (data, status) {
        $("#error-alert").hide();
        $("#loading").hide();
        if(data.error) {
          $("#error-alert").text("There was an error processing your request: "+data.error+". Please try again later.").show();
        } else {
          schedules = data.results;
          setupCalendar();
        }
        
      },
      error: function(xhr,status,error){
         $("#error-alert").text("There was an error processing your request. Please try again later.").show();
         $("#loading").hide();
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

  //check for pending schedule on load
   $.ajax({
      url: "/schedule/get-pending",
      type: "GET",
      data: {}, 
      success: function (data, status) {
        $("#error-alert").hide();
        $("#loading").hide();
        if(data.error) {
          $("#error-alert").text("There was an error processing your request: "+data.error+". Please try again later.").show();
        } else {
          if(data.courses) {
            console.log("got pending schedule");
            courseCount = data.courses.length;
            for(var i=0;i<data.courses.length;i++) {
              var cId = data.courses[i]._id;
              var course = {number:data.courses[i].number, id:cId,name:data.courses[i].name};
              selectedCourses[cId] = course;
              displayCourse(course);
              selectedCourseSections[cId] = data.sections[i];
              displaySections(cId);
            }
          } else {
            console.log("no pending schedule: "+JSON.stringify(data));
          }

        }
        
      },
      error: function(xhr,status,error){
         $("#error-alert").text("There was an error processing your request. Please try again later.").show();
         $("#loading").hide();
      }
    });

});

function addSelectedCourse(course) {
  if(selectedCourses[course.id]) {
      $("#error-alert").text(course.number+" is already selected").show();
      return;          
  }
  if(courseCount>=8) {
     $("#error-alert").text("There is maximum of 8 courses.").show();
     return;
  }
  courseCount++;
  selectedCourses[course.id]=course;
  displayCourse(course);
  $.ajax({
    url: "/schedule/add-course",
    type: "POST",
    data: {courseId:course.id}, 
    success: function (data, status) {
      $("#error-alert").hide();
      $("#loading").hide();
      if(data.error) {
        $("#error-alert").text("There was an error processing your request: "+data.error+". Please try again later.").show();
      } else {
        suggestedCourses = data.suggestedCourses;
        console.log(data.sections);
        selectedCourseSections[course.id] = jQuery.parseJSON(data.sections);
        displaySections(course.id);
        //TODO: display suggested courses
      }
    },
    error: function(xhr,status,error){
       $("#error-alert").text("There was an error processing your request. Please try again later.").show();
       $("#loading").hide();
    }
  });
}

function displayCourse(course) {
  $("#none-selected").hide();
  $("#row-after-courses").fadeIn();
  var content = '<div class="panel panel-default table-responsive" style="margin:10px 20px 0px 20px;" id="accordion-'+course.id+'"><div class="panel-heading"><h4 class="panel-title"><a title="View sections" data-toggle="collapse" href="#'+course.id+'"><strong>'
          +course.number+'</strong> - '+course.name+'</a><button type="button" title="Remove course" class="close pull-right" onclick="removeCourse(\''+course.id+'\')"><span aria-hidden="true">&times;</span></button></h4></div><div id="'+course.id+'" class="panel-collapse collapse"></div></div>'
  $("#accordion").append(content);
  console.log("displaying course "+course.id+" at index ");
}

var preferenceButtons= [
  {label:"Preferred", icon:"glyphicon glyphicon-heart", style:"btn-default"},
  {label:"Neutral", icon:"glyphicon glyphicon-minus", style:"btn-default"},
  {label:"Not preferred", icon:"glyphicon glyphicon-thumbs-down", style:"btn-default"},
  {label:"Do not consider", icon:"glyphicon glyphicon-ban-circle", style:"btn-danger"}];

function displaySections(courseId) {
  var content = "<table class=\"table\">";
  for(var i=0;i<selectedCourseSections[courseId].length;i++) {
    var s = selectedCourseSections[courseId][i];
    var openSymbol = 'glyphicon glyphicon-ok-sign';
    var defaultButton = 1;//neutral
    if(!s.open) {
      openSymbol = 'glyphicon glyphicon-minus-sign'
      defaultButton = 3//do not consider
    }
    var openLabel = s.status;
    var professorLabel = 'Unknown';
    if(s._professor) {
      professorLabel = "<a href=\"/professor/"+s._professor._id+"\" target=\"_blank\">"+s._professor.name+"</a>";
    }
    var meetTimeLabel = 'Unknown';
    if(s.meet_time) {
      meetTimeLabel = s.meet_time;
    }

    content+="<tr><td class=\"col-md-1\"><span class=\""+
      openSymbol+"\" data-toggle=\"tooltip\" title=\""+openLabel+"\"/></td><td class=\"col-md-1\">"+
      s.number+"</td><td class=\"col-md-2\">"+
      professorLabel+"</td><td class=\"col-md-6\">"+
      meetTimeLabel+"</td><td class=\"col-md-2\">"+
    '<div class="btn-group pull-right" data-toggle="buttons" id="pref-radio-'+s._id+'">';

    for(var index in preferenceButtons) {
      var but = preferenceButtons[index];
      if(defaultButton==index) {
        content+='<label class="btn '+but.style+' btn-sm active" title="'+but.label+'" checked>'+
                    '<input type="radio" name="options" id="option'+index+'" value="'+index+'"> <span class="'+but.icon+'" /></label>';
      } else {
        content+='<label class="btn '+but.style+' btn-sm" title="'+but.label+'">'+
                    '<input type="radio" name="options" id="option'+index+'"> <span class="'+but.icon+'" /></label>';        
      }

    }
    content+='</div></td></tr>';
  }
  content+='</table>';
  $("#"+courseId).append(content);
}

function removeCourse(courseId) {
   $.ajax({
    url: "/schedule/remove-course",
    type: "POST",
    data: {courseId:courseId}, 
    success: function (data, status) {
      $("#error-alert").hide();
      $("#loading").hide();
      if(data.error) {
        $("#error-alert").text("There was an error processing your request: "+data.error+". Please try again later.").show();
      } else {
        suggestedCourses = data.suggestedCourses;
        //TODO: display suggested courses
      }
      
    },
    error: function(xhr,status,error){
       $("#error-alert").text("There was an error processing your request. Please try again later.").show();
       $("#loading").hide();
    }
  });
   console.log("removing course "+courseId+" at index ");
  $("#accordion-"+courseId).remove();

  delete selectedCourseSections[courseId];
  delete selectedCourses[courseId];

  courseCount--;

  console.log(selectedCourses);

  if(courseCount==0) {
    $("#none-selected").fadeIn();
    $("#row-after-courses").fadeOut();
  }
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