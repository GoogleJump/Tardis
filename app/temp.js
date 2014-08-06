exports.chamila = function(req, res){

	School.findOne({name:"University of Tulsa"}, function(err, school) {
		Major.findOne({name:"Computer Science", _school: school}, function(err, major){
			major.college = "Engineering";
			major.coreClasses.push('CS 1001');
			major.coreClasses.push('CS 1043');
			major.coreClasses.push('Eng 1033');
			major.coreClasses.push('CS 2003');
			major.coreClasses.push('CS 2033');
			major.coreClasses.push('CS 2103');
			major.coreClasses.push('CS 2123');
			major.coreClasses.push('CS 3003');
			major.coreClasses.push('CS 3013');
			major.coreClasses.push('CS 3053');
			major.coreClasses.push('CS 4163');
			major.coreClasses.push('CS 4503');
			major.coreClasses.push('CS 4513');



			major.electives.push('Math 3073');
			major.electives.push('CS 3243 - Computer Applications Programming');
			major.electives.push('CS 3353 - System Administration');
			major.electives.push('CS 3363 - Data Communication and Networking');
			major.electives.push('CS 3043 - Human-Web Interfaces');
			major.electives.push('CS 4043 - Online Communities');
			major.electives.push('CS 4123 - Theory of Computing');
			major.electives.push('CS 4153 - Computer Security');
			major.electives.push('CS 4213 - Object-Oriented Software');
			major.electives.push('CS 4253 - Artificial Intelligence');
			major.electives.push('CS 4063 - Computer Architecture');
			major.electives.push('CS 4333 - Computer Networks');
			major.electives.push('CS 4343 - Enterprise Integration and Architecture');
			major.electives.push('CS 4363 - Distributed Computing');
			major.electives.push('CS 4533 - Scientific Software Environments');
			major.electives.push('CS 4613 - Fundamentals of Computer Graphics');
			major.electives.push('CS 4623 - Evolutionary Computation');
			major.electives.push('CS 4643 - Bioinformatics');
			major.electives.push('CS 4753 - Robotics');
			major.electives.push('CS 4763 - Robotics Competition');
			major.electives.push('CS 4353 - Parallel Programming');
			major.electives.push('CS 3023 - Introduction to Game Programming');
			major.electives.push('CS 4653 - Medical Informatics');


			major.langReqs.push('Span 1004 - Beginning Spanish I');
			major.langReqs.push('Span 1014 - Beginning Spanish II');
			major.langReqs.push('Span 2003 - Intermediate Spanish I');
			major.langReqs.push('Span 2013 - Intermediate Spanish II');

			major.genEds.push();

			major.save();
		});
	});
};