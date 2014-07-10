var School = require('../app/models/school');
var Professor = require('../app/models/professor');
var Course = require('../app/models/course');
var User = require('../app/models/user');
var Section = require('../app/models/section');
var Document = require('../app/models/document');

var fs = require('fs');
var path = require('path');

exports.view = function(req, res) {
	var id = req.params.sectionId;
	Section.findOne({'_id':id}, function(err, section) {
		if(section) {
			Course.findOne({'_id':section._courseId}, function(err, course){
				Professor.findOne({'_id':section._professorId}, function(err, professor){
					Document.find({'_sectionId':id},function(err, documents){
						res.render('section.ejs',{course:course,section:section,professor:professor,documents:documents});
					});
				});
			});
		} else {
			//Error!
			res.redirect('/error');
		}
		
	});
};

exports.add_document = function(req, res) {
	var id = req.params.sectionId;
	var file = req.files.document;

	var newDocument = new Document();
	newDocument.title = req.body.title;
	newDocument.description = req.body.description;
	newDocument._userId = req.user._id;
	newDocument.file_name = newDocument._id + path.extname(file.name);
	newDocument._sectionId = id;

	newDocument.save();

	console.log(file);

	var tmp_path = file.path;
    var target_path = 'public/user_documents/' + newDocument.file_name;

    console.log(target_path);
    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
            console.log('File uploaded to: ' + target_path + ' - ' + file.size + ' bytes');
            res.redirect('/section/'+id);
        });
    });

}