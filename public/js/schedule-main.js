var selectedCourses = [];
var suggestedCourses = [];
var selectedCourseSections = [];
var courseCount =0;

var currentScheduleIndex = 0;

var schedules = [];
var scheduleSections = {};
var batchNumber = 1;
var schedulesCount = 0;

var BATCH_SIZE = 16;

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

  $("#create-schedule").click(function(){
    $("#calendar").empty();
    $("#loading").show();
    $("#calendar-holder").hide();

    var courseIds = [];
    for(var index in selectedCourses) {
      courseIds.push({id:index,number:selectedCourses[index].number});
    }

    //To get section preference selections
    var sectionPreferences = {};
    for(var index in selectedCourses) {
      var sects = selectedCourseSections[index];
      for(var index2 in sects) {
        var pref = $('#pref-radio-'+sects[index2]._id+' label.active input').val();
        sectionPreferences[sects[index2]._id] = pref;
      }
    }

    var timeRange = {start:$("#slider" ).slider("values",0),end:$("#slider" ).slider("values",1)};

    $.ajax({
      url: "/schedule/generate",
      type: "POST",
      data: {term:$("#term").val(), courses:courseIds, sectionPreferences:sectionPreferences, timeRange:timeRange}, 
      success: function (data, status) {
        $("#error-alert").hide();
        $("#loading").hide();
        if(data.error) {
          $("#error-alert").text("There was an error processing your request: "+data.error+". Please try again later.").show();
        } else {
          schedules = data.results;
          updateScheduleCountText(data.count);
          schedulesCount = data.count;
          updateCurrentScheduleIndex(1);
          scheduleSections = data.sections;
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
    updateCurrentScheduleIndex(currentScheduleIndex+1);
    updateCalendarEvents();
  });

  $("#schedule-next").click(function(){
    currentScheduleIndex++;
    if(currentScheduleIndex>=(schedulesCount-1)) {
      $("#schedule-next").hide();
    }
    $("#schedule-prev").show();
    updateCurrentScheduleIndex(currentScheduleIndex+1);
    updateCalendarEvents();
  });

  $("#expand-all").click(function(){
    for(var id in selectedCourses) {
      $("#"+id).collapse('show');
    }
  });
  $("#collapse-all").click(function(){
    for(var id in selectedCourses) {
      $("#"+id).collapse('hide');
    }
  });

  $( "#slider" ).slider({
      range: true,
      min: 0,
      max: 24,
      values: [8, 17],
      slide: function( event, ui ) {
        $("#time0").text(formatTime(ui.values[0]));
        $("#time1").text(formatTime(ui.values[1]));
      }
    });
    // $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
    //   " - $" + $( "#slider-range" ).slider( "values", 1 ) );

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
            courseCount = data.courses.length;
            for(var i=0;i<data.courses.length;i++) {
              var cId = data.courses[i]._id;
              var course = {number:data.courses[i].number, id:cId,name:data.courses[i].name};
              selectedCourses[cId] = course;
              displayCourse(course);
              selectedCourseSections[cId] = data.sections[cId];
              displaySections(cId);
            }
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
      // defaultButton = 3//do not consider //TODO: temporarily disabled during testing
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
        content+='<label class="btn '+but.style+' btn-sm active" title="'+but.label+'" checked>';
                    
      } else {
        content+='<label class="btn '+but.style+' btn-sm" title="'+but.label+'">';        
      }
      content += '<input type="radio" name="options" id="option'+index+'" value="'+index+'"> <span class="'+but.icon+'" /></label>';
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
  $("#accordion-"+courseId).remove();

  delete selectedCourseSections[courseId];
  delete selectedCourses[courseId];

  courseCount--;

  if(courseCount==0) {
    $("#none-selected").fadeIn();
    $("#row-after-courses").fadeOut();
  }
}

var sourceYearMonth = "2014-01-";//fixed date for rendering in the calendar
var sourceDay = 12;//the twelveth is a sunday

function setupCalendar() {
  currentScheduleIndex = 0;

  $("#schedule-prev").hide();
  if(schedulesCount>1) {
    $("#schedule-next").show();
  } else {
    $("#schedule-next").hide();
  }

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
    date:sourceDay,
    editable: false,
    minTime:"06:00:00",
    allDaySlot:false,
    columnFormat:'dddd',
    events:getCalendarEvents(schedules[0])
  });
  //$('#calendar').fullCalendar('gotoDate', '2014-01-13');
  
}

function updateScheduleCountText(count) {
  $("#schedule-count").text(count);
}
function updateCurrentScheduleIndex(index) {
  $("#current-index").text(index);
}

function updateCalendarEvents() {
  $('#calendar').fullCalendar('removeEvents');
  $('#calendar').fullCalendar('addEventSource', getCalendarEvents(schedules[currentScheduleIndex]));

  if(currentScheduleIndex>=(batchNumber*BATCH_SIZE-1)) {
    $("#schedule-next").attr('disabled','disabled');
    $.ajax({
      url: "/schedule/get-batch",
      type: "GET",
      data: {batch:batchNumber}, 
      success: function (data, status) {
        $("#error-alert").hide();
        $("#loading").hide();
        if(data.error) {
          $("#error-alert").text("There was an error processing your request: "+data.error+". Please try again later.").show();
        } else {
          $("#schedule-next").removeAttr('disabled');
          for(var index in data.results)
            schedules.push(data.results[index]);
          batchNumber++;
        }
        
      },
      error: function(xhr,status,error){
         $("#error-alert").text("There was an error processing your request. Please try again later.").show();
         $("#loading").hide();
      }
    });
  }
}



var colors = ["#16a085","#27ae60","#2980b9","#8e44ad","#2c3e50","#7f8c8d","#bdc3c7","#c0392b","#d35400"];

function getCalendarEvents(sections) {
  var events = [];
  sections = sections.schedule;
  //sections is an array of section ids
  for(var j in sections) {
    var sectionId = sections[j];
    var section = scheduleSections[sectionId];
    var moments = section.moments;
    for(var k=0;k<moments.length;k++) {
      var event = {};
      event.title = selectedCourses[section._courseId].number+"-"+section.number;
      event.allDay = false;
      event.color = colors[j];
      event.start = formatEventDate(moments[k].day, moments[k].startTime.hour, moments[k].startTime.minute);
      event.end = formatEventDate(moments[k].day, moments[k].endTime.hour, moments[k].endTime.minute);

      event.url = "/section/"+section._id;
      events.push(event);
    }
  }

  return events;
}

function padWith0(value) {
  if(value<10) {
    return "0"+value;
  }
  return value;
}

function formatEventDate(day, hour, minute) {
  var pHour = padWith0(hour);
  var pMinute = padWith0(minute);
  return sourceYearMonth+(sourceDay+day)+'T'+pHour+":"+pMinute+":00";
}

function formatTime(hr24) {
  if(hr24<12) {
    if(hr24==0){
      return "midnight";
    }
    return hr24+"am";
  } else{
    if(hr24==12){
      return "noon";
    }
    return (hr24-12)+"pm";
  }

}