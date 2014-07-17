//Evan Forbes

exports.ScheduleTree= function() {
	this.courses = {};
	this.sections = {};
	this.levels = [];

	this.root = new Node(0);

	this.addCourse=function(course, sections) {
		//console.log("adding course to tree "+course.id);
		//add course and sections to dictionaries
		this.courses[course.id] = course;
		var sectionIdArray = [];
		for(var i=0;i<sections.length;i++) {
			var csection = sections[i];
			this.sections[csection._id] = csection;
			sectionIdArray.push(csection._id);
		}

		this.levels.push(course._id);

		this.root.addSections(this, sectionIdArray);

		function censor(censor) {
		  var i = 0;

		  return function(key, value) {
		    if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
		      return '[Circular]'; 

		    if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
		      return '[Unknown]';

		    ++i; // so we know we aren't using the original object anymore

		    return value;  
		  }
		}
		//console.log("course added");
		//console.log(JSON.stringify(this.root, censor(this.root)));
	}

	this.isEmpty = function() {
		return Object.keys(this.root.children).length==0;
	}

	this.getAllSchedules = function() {
		return this.root.getAllSchedules();
	}
}

function Node(l, sId, parent) {
	this.level = l;
	this.sectionId = sId;
	this.parentNode = parent;
	this.children = {};

	this.addSections=function(tree, sectionIds) {
		//console.log("adding sections: "+sectionIds+ " to node "+this.sectionId+" on level "+this.level);
		var nonConflictingSectionIds = [];
		for(var i=0;i<sectionIds.length;i++) {
			var currentSectionId = sectionIds[i];
			var currentSection = tree.sections[currentSectionId];
			if(!this.sectionId || !tree.sections[this.sectionId].conflictsWith(currentSection)) {
				//console.log(this.sectionId+" doesn't conflict with "+currentSectionId);
				nonConflictingSectionIds.push(currentSectionId);
			}
		}
		if(nonConflictingSectionIds.length==0) {
			//console.log("no nonconflicting section ids... removing self");
			removeSelfFromParent();//CALLBACK?
			return;
		}
		if(this.level ==(tree.levels.length-1)){
			//Leaf base case
			//console.log("turning over a new leaf");
			for(var index in nonConflictingSectionIds) {
				this.children[nonConflictingSectionIds[index]] = new Node(this.level+1, nonConflictingSectionIds[index], this);
			}
		}
		else {
			for(var childSectionId in this.children) {
				this.children[childSectionId].addSections(tree, nonConflictingSectionIds);//CALLBACK?
			}
		}
			
	}

	this.getAllSchedules = function() {
		var results = [];
		for(var index in this.children) {
			var childSchedules = this.children[index].getAllSchedules();
			if(childSchedules.length==0) {
				results.push([this.sectionId,this.children[index].sectionId]);
			}
			for(var index2 in childSchedules) {
				if(this.sectionId) {
					childSchedules[index2].push(this.sectionId);
					results.push(childSchedules[index2]);
				} else {
					results.push(childSchedules[index2]);
				}
			}
		}
		return results;
	}

	function removeSelfFromParent() {
		if(this.parentNode) {
			this.parentNode.removeChild(this.sectionId);
		}
	}

	this.removeChild=function(sectionId) {
		if(sectionId in children) {
			console.log("child deleted");
			delete children[sectionId];
		}
		if(Object.keys(children).length==0) {
			//No children left... remove this node from it's parent
			if(this.parentNode){
				//not the root
				console.log("childless... removing self");
				this.parentNode.removeChild(this.sectionId);
			} else {
				//No branches in tree, no possible schedules
				console.log("branchless");
			}
		}
	}
}