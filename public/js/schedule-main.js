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
            console.log("focused: "+ui.item);
            // Prevent other event from not being execute
            event.preventDefault();
         },
         select: function (event, ui) {
            // Prevent value from being put in the input:
            this.value = "";
            
            selectedCourses.push(ui.item);
            displaySelectedCourses();
            console.log("selected: "+ui.item.id);
            // Prevent other event from not being execute            
            event.preventDefault();
            // optionnal: submit the form after field has been filled up
            //$('#quicksearch').submit();
         }
  })
   .autocomplete( "instance" )._renderItem = function( ul, item ) {
      return $( "<li>" )
        .append( "<a>" + item.number + "<br>" + item.name + "</a>" )
        .appendTo( ul );
    };;
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