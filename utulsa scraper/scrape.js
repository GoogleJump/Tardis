var http = require("follow-redirects").http;
var cheerio = require("cheerio");
var fs = require('fs');

var options = {
    host: 'utulsa.edu'
};

var skip = 10;
var max = 82;
http://www.utulsa.edu

var root = '/academics/undergraduate-majors-and-minors.aspx';

options.path = root;
http.get(options, function (http_res) {
    // initialize the container for our data
    var data = "";

    // this event fires many times, each time collecting another piece of the response
    http_res.on("data", function (chunk) {
        // append this chunk to our growing `data` var
        data += chunk;
    });

    // this event fires *one* time, after all the `data` events/chunks have been gathered
    http_res.on("end", function () {
        // you can use res.send instead of console.log to output via express
        //console.log(data);

        var $ = cheerio.load(data);

        var count = 0;

        var startedCount = 0;
        var finishedCount = 0;
        var courses =[];
        $("a").each(function() {
         count++;
         if(count>=skip&&count<=max) {
                startedCount++;
var title = $(this);
var department = title.text();
var linkTo = title.attr("href");

console.log(count+" link: "+department+" to "+linkTo);
                //Only do this for cs first one right now
//if(count==19+skip)
                getCourses(department, linkTo, function(results){
                    courses = courses.concat(results);
                    finishedCount++;
                    if(finishedCount==startedCount) {
                         fs.writeFile('utulsa_courses.json', JSON.stringify(courses, null, 4), function(err){
                            console.log('File successfully written!');
                        });
                    } else {
                        console.log(finishedCount+'/'+startedCount+' completed');
                    }
                });
         }
        });

    });
});

function getCourses(department, newPath, next) {
options.path = root+newPath;
http.get(options, function (http_res) {
        // initialize the container for our data
        var data = "";

        // this event fires many times, each time collecting another piece of the response
        http_res.on("data", function (chunk) {
            // append this chunk to our growing `data` var
            data += chunk;
        });

        // this event fires *one* time, after all the `data` events/chunks have been gathered
        http_res.on("end", function () {
            // you can use res.send instead of console.log to output via express
            //console.log(data);

            var $ = cheerio.load(data);

            var count = 0;

            var previousNumber;
            var previousJsonCourse;

            var courses = [];
            $("tr").each(function() {
                if(count==0) {
                    count++
                    return; //skip title row
                }
                count++;
             var row = $(this);
             var cols = row.children();

                var status = cols.eq(0).text();
                var number = cols.eq(1).text();
                var section = cols.eq(2).text();
                var nameElement = cols.eq(4).children().first().children().first();
                var pathToDetails = nameElement.attr("href");
                var shortName = nameElement.text();
                var time_location = cols.eq(5).html().trim().replace(/\s+/g, ' ').split("<br>");
                var professor = cols.eq(6).html().split('<br>')[0];

                var location = null;
                var time = '';

                for(var index in time_location) {
                    var locArray = time_location[index].split(' ');
                    if(locArray.length>2) {
                        location = locArray.shift()+' '+locArray.shift();
                        time += locArray.join(' ')+' ';
                    }
                }
                if(location && (location.slice(0,3)=='ARR'||location.slice(0,3)=='TBA')) {
                    location = null;
                }

                if(time.indexOf('S')>0) {
                    console.log("time with s: "+time);
                }

                if(time.slice(0,3)=='ARR'||time.slice(0,3)=='TBA'||time.isEmpty()) {
                    time = null;
                }else {
                    time=time.trim();
                }


                if(professor.isEmpty()||professor=='Staff') {
                    professor = null;
                }
                
                if(location&&location.slice(0,1)=='(') {
                    console.log("FIXED SPECIAL 3: "+location+" / "+time);
                    location = null;
                    time = null;
                }
                if(location&&location.length>8&&time.split(' ').length==1) {
                    console.log("FIXED SPECIAL: "+location+" / "+time);
                    if(location.slice(0,3)=="GYM") {
                     time = location.slice(9)+" "+time; //special case :(
                     location = location.slice(0,9);
                    } else {
                     time = location.slice(8)+" "+time; //special case :(
                    location = location.slice(0,8);
                    }
                    console.log("NOW: "+location+" / "+time);
                }


                //console.log(status+"/"+number+"/"+section+"/"+shortName+"/"+location+'/'+time+"/"+professor+"/"+pathToDetails);

                if(number==previousNumber) {
                    //console.log('adding section to previous course');
                    var jsonSection = {};
                    jsonSection.number = section;
                    jsonSection.location = location;
                    jsonSection.meet_time = time;
                    jsonSection.status = status;
                    jsonSection.professor = professor;
                    if(status=='Open') {
                        jsonSection.open = true;
                    } else {
                        jsonSection.open = false;
                    }
                    previousJsonCourse.sections.push(jsonSection);

                } else {
                    //console.log('new course');
                    previousNumber = number;
                    var jsonCourse={};
                    jsonCourse.number = number;
                    jsonCourse.department = department;
                    jsonCourse.name = shortName;
                    jsonCourse.credits = parseInt(number.slice(-1));
                    if(parseInt(number.slice(-4).slice(0,1))<=4) {
                        jsonCourse.level = 'undergraduate';
                    } else {
                        jsonCourse.level = 'graduate';
                    }

                    var jsonSection ={};
                    jsonSection.number = section;
                    jsonSection.location = location;
                    jsonSection.meet_time = time;
                    if(jsonCourse.number=='EDUC 3171') {
                        console.log("FIXED SPECIAL 2: "+jsonSection.meet_time);
                        jsonSection.meet_time = jsonSection.meet_time.split(' ').slice(0,2).join(' ');
                        console.log("NOW: "+jsonSection.meet_time);
                    }

                    jsonSection.status = status;
                    jsonSection.professor = professor;
                    if(status=='Open') {
                        jsonSection.open = true;
                    } else {
                        jsonSection.open = false;
                    }

                    jsonCourse.sections=[jsonSection];
                    previousJsonCourse = jsonCourse;
                    courses.push(jsonCourse);
                }
                
            });
            //console.log(courses);
            return next(courses);
        });
    });
}

String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};