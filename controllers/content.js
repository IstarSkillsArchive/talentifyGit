var db = require('../models')
, fs = require('fs')
, path = require('path')
, AdmZip = require('adm-zip')
, rmdir = require('rimraf');

//global variable, to store tags
var tags = new Array();	

//deprecated
function isEmpty(obj, prop) {
    //for(prop in obj) {
        if((obj.prop != null && obj.prop != '' && obj.prop != 'null'))
            return false;
    //}

    return true;
}

//used to set a default value to 0
//data validation, ensures that an integer value is submitted, wherever necessary
function get_int_value(val) {
	var pattern = /^\d+$/;
	if(val == null || val == 'null') {
		val = 0;
	} else if(!pattern.test(val)) {
		val = 0;
	}
	return val;
}

//get the file extension for an uploaded file
function get_file_extension(problem) {
	var ext = null;
	var fullPath = problem.filePath;
	if(fullPath != null) {
		var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
		ext = fullPath.substring(startIndex);
		if (ext.indexOf('\.') === 0 ) {
			ext = ext.substring(1);
		}
	}
	return ext;
}

//while adding answers to questions, there needs to be only one correct answer for question of type - MCQ/Single Answer
//this function ensures that there is only one correct answer for question of type - MCQ/Single Answer
function check_correct_answers(res, pid, url, div) {
	var render = function() {
		res.render('iframe_middleware', {url: url, div: div});
	};
	db.Problem.find({where: {id: parseInt(pid)}}).success(function(problem) {
		db.Answer.findAll({where: {ProblemId: problem.id}, order: 'id ASC'}).success(function(answers) {
			if(answers.length == 0) { // this question has no answers
				render();
			} else {
				db.Answer.findAll({where: ['"ProblemId" = ? AND "isAnswer" = ?', problem.id, true], order: 'id ASC'}).success(function(correct_answers) {
					if(correct_answers < 2)
						render();
					else {
						var update_answer = function(i) {
							if(i == correct_answers.length) {
								render();
							} else {
								db.Answer.find({where: {id: correct_answers[i].id}}).success(function(ans) {
									ans.updateAttributes({isAnswer: false}).success(function(){
										update_answer(++i);	
									});
								});
							}
						};
						update_answer(1);
					}
				});
			}
		});
	});
}

//delete a generic database object
function delete_record(deebee, id, callback) {
	deebee.find({where: {id: parseInt(id)}}).success(function(obj) {
		obj.destroy().success(function() {
			callback();
		});
	});
}

//delete an answer associated to a question
function delete_answer(answer_id, callback) {
	var message = null;
	db.Answer.find({where: {id: parseInt(answer_id)}}).success(function(answer) {
		var problem_id = answer.ProblemId;
		db.ReportDetail.find({where: {AnswerId: answer.id}}).success(function(rd) {
			if(rd) {
				message = 'Sorry! You cannot delete this answer';
			} 
			callback(problem_id, message);
		});
	});
}

//delete a question
function delete_problem(problem_id, url1, div, res, callback) {
	var message = null;
	db.Problem.find({where: {id: parseInt(problem_id)}}).success(function(problem) {
		db.ReportDetail.find({where: {ProblemId: problem.id}}).success(function(rd) {
			if(rd) {
				message = 'Sorry! You cannot delete this question';
			} 
			callback(problem_id, message, url1, div, res);
		});
	});
}

//callback to be executed after deleting a question
var render_for_delete_problem = function(problem_id, message, url1, div, res) {
	var url2 = null;
	if(message == null)
		url2 = '/content/do_delete';
	res.render('content/delete_middleware', {id: problem_id, message: message, url1: url1, url2: url2, val: 'problem', div: div});
};

module.exports = {
	
	//interface to create a new module
	new_module: function(req, res) {
		tags.length = 0;
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		var user_id = req.user.id;
		
		db.User.find({ where: { id: user_id} , include: [db.Organization]}).success(function(user) {
			db.Role.findAll({ where: {OrganizationId: user.OrganizationId}, include: [db.Organization] }).success(function(roles) {
				res.render('content/new_module', {user_id: user_id, roles: roles, organization: user.organization, successFlash: successFlash});
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('content/dashboard', {errors: errors});
		});
	},
	
	//to browse the content, with pagination
	//app.get('/module/browse_modules', auth, pagination, content.browse_modules);
	//the third field is a pagination function which is defined in app.js.
	//it takes care of the pagination logic
	//used in content/module_playlist.ejs
	browse: function(req, res) {
		db.Module.findAll({limit: 10}).success(function(modules) {
			db.Content.findAll({offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC'}).success(function(contents) {
				db.Skill.findAll({limit:10}).success(function(skills) {
					res.render('content/browse', {val: req.param('val'), modules: modules, contents: contents, skills: skills});
				});
			});
		});
	},
	
	//to browse the modules, with pagination
	//used in content/skill_playlist.ejs
	browse_modules: function(req, res) {
		db.Module.findAll({offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC'}).success(function(modules) {
			res.render('content/browse_modules', {modules: modules});
		});
	},
	
	//create a new module
	//deprecated
	do_create_module: function(req, res) {
		db.Module.create({name: req.param('name'), description: req.param('description'), PrevModuleId: req.param('PrevModuleId') == 0 ? null : req.param('PrevModuleId'), OrganizationId: req.param('OrganizationId'), isPublic: req.param('isPublic')}).success(function(module) {
			req.flash('info', "Module "+module.name+" created");
			var map_skills = function(i) {
				if(i == tags.length) {
					res.redirect('content/new_module');
				}else {
					db.Skill.findOrCreate({name: tags[i]}).success(function(skill, created) { 
						db.ModuleSkills.findOrCreate({SkillId: skill.id, ModuleId: module.id}).success(function(ms, created) { 
							map_skills(++i);
						});
						
					});
				}
			};
			map_skills(0);
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('content/dashboard', {errors: errors});
		});
	},
	
	//called from content/module_playlist
	//lets you delete content from the playlist
	//the playlist needs to be adjusted accordingly
	//different cases considered are -
	//deleted content is the first content, or deleted content is the last content or
	//deleted content is anywhere in between the playlist
	delete_content_from_playlist: function(req, res) {
		db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "ContentId" = ?', parseInt(req.param('module_id')), parseInt(req.param('content_id'))] }).success(function(item) {
			var delete_item = function() {
				item.destroy().success(function(){
					//to display the playlist
					db.Module.find({ where: { id: parseInt(req.param('module_id')) } }).success(function(module) {
						db.ModuleContentPlaylist.findAll({ where: { ModuleId: module.id } }).success(function(pl) { // to return all playlists to module_playlist.ejs
							function playlist(id, name, description)
							{
								this.id = id;
								this.name=name;
								this.description=description;
							}
							var playlists = new Array();
							var prevContentId = null;
							
							var build_playlist = function() {
								//to get first item in the playlist
								if(prevContentId == null) {
									db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "PrevContentId" IS NULL', module.id] }).success(function(first_item) { 
										if(first_item) {
											db.Content.find({ where: ['"id" = ?', first_item.ContentId ] }).success(function(c) {
												if(c) {
													prevContentId = c.id;
													playlists.push(new playlist(c.id, c.name, c.description));
												}
												build_playlist();
											});
										} else {
											res.render('content/playlist_ajax', {skill: null, module: module, playlists: playlists});
											//res.redirect('/content/module_playlist/'+module.id);
										}
									});
								} else {
									db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "PrevContentId" = ?', module.id, parseInt(prevContentId)] }).success(function(other_item) { 
										if(other_item) {
											db.Content.find({ where: ['"id" = ?', other_item.ContentId ] }).success(function(c) {
												if(c) {
													prevContentId = c.id;
													playlists.push(new playlist(c.id, c.name, c.description));
												}
												build_playlist();
											});
										} else {
											res.render('content/playlist_ajax', {skill: null, module: module, playlists: playlists});
											//res.redirect('/content/module_playlist/'+module.id);
										}
									});
								}
							};
							build_playlist();
						});
					});
				});
			};
			
			if(item.PrevContentId == null) { // first item
				db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "PrevContentId" = ?', parseInt(req.param('module_id')), item.ContentId] }).success(function(item_successor) {
					if(item_successor) {
						item_successor.updateAttributes({PrevContentId: null}).success(function(){
							delete_item();
						});
					} else delete_item(); //if only one item in the playlist
				});
			} else {
				db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "PrevContentId" = ?', parseInt(req.param('module_id')), item.ContentId] }).success(function(item_successor) {
					if(item_successor == null) //last item
						delete_item();
					else {
						item_successor.updateAttributes({PrevContentId: item.PrevContentId}).success(function(){
							delete_item();
						});
					}
				});
			}
		});
	},
	
	//called from content/skill_playlist
	//lets you delete module from the playlist
	//the playlist needs to be adjusted accordingly
	//different cases considered are -
	//deleted module is the first module, or deleted module is the last module or
	//deleted module is anywhere in between the playlist
	delete_module_from_playlist: function(req, res) {
		db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "ModuleId" = ?', parseInt(req.param('skill_id')), parseInt(req.param('module_id'))] }).success(function(item) {
			var delete_item = function() {
				item.destroy().success(function(){
					//to display the playlist
					db.Skill.find({ where: { id: parseInt(req.param('skill_id')) } }).success(function(skill) {
						db.SkillModulePlaylist.findAll({ where: { SkillId: skill.id } }).success(function(pl) { // to return all playlists to module_playlist.ejs
							function playlist(id, name, description)
							{
								this.id = id;
								this.name=name;
								this.description=description;
							}
							var playlists = new Array();
							var prevContentId = null;
							
							var build_playlist = function() {
								//to get first item in the playlist
								if(prevContentId == null) {
									db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" IS NULL', skill.id] }).success(function(first_item) { 
										if(first_item) {
											db.Module.find({ where: ['"id" = ?', first_item.ModuleId ] }).success(function(c) {
												if(c) {
													prevContentId = c.id;
													playlists.push(new playlist(c.id, c.name, c.description));
												}
												build_playlist();
											});
										} else {
											res.render('content/playlist_ajax', {module: null, skill: skill, playlists: playlists});
										}
									});
								} else {
									db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" = ?', skill.id, parseInt(prevContentId)] }).success(function(other_item) { 
										if(other_item) {
											db.Module.find({ where: ['"id" = ?', other_item.ModuleId ] }).success(function(c) {
												if(c) {
													prevContentId = c.id;
													playlists.push(new playlist(c.id, c.name, c.description));
												}
												build_playlist();
											});
										} else {
											res.render('content/playlist_ajax', {module: null, skill: skill, playlists: playlists});
										}
									});
								}
							};
							build_playlist();
						});
					});
				});
			};
			
			if(item.PrevModuleId == null) { // first item
				db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" = ?', parseInt(req.param('skill_id')), item.ModuleId] }).success(function(item_successor) {
					if(item_successor) {
						item_successor.updateAttributes({PrevModuleId: null}).success(function(){
							delete_item();
						});
					} else delete_item(); //if only one item in the playlist
				});
			} else {
				db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" = ?', parseInt(req.param('skill_id')), item.ModuleId] }).success(function(item_successor) {
					if(item_successor == null) //last item
						delete_item();
					else {
						item_successor.updateAttributes({PrevModuleId: item.PrevModuleId}).success(function(){
							delete_item();
						});
					}
				});
			}
		});
	},
	
	//not to show the 'Add to Playlist' button in content/show_preview.ejs
	//if items are already in the playlist, then the button needs to be disabled
	//used in content/module_playlist.ejs
	show_preview_display_false: function(req, res) {
		res.redirect('/content/show_preview/'+req.param('content_id')+'/'+req.param('val')+'/'+req.param('id')+'/false');
	},
	
	//called from content/browse.ejs, content/module_playlist.ejs
	//if 'display' param is false, then 'Add to Playlist' button needs to be hidden,
	//else, show the button
	show_preview: function(req, res) {
		db.Content.find({ where: { id: parseInt(req.param('content_id')) } }).success(function(content) {
			res.render('content/show_preview', {content: content, val: req.param('val'), id: req.param('id'), display: req.param('display')});
		});
	},
	
	//not to show the 'Add to Playlist' button in content/show_preview_module.ejs
	//if items are already in the playlist, then the button needs to be disabled
	//used in content/skill_playlist.ejs
	show_preview_module_false: function(req, res) {
		res.redirect('/content/show_preview_module/'+req.param('module_id')+'/'+req.param('val')+'/'+req.param('id')+'/false');
	},
	
	//called from content/browse_modules.ejs, content/skill_playlist.ejs
	//if 'display' param is false, then 'Add to Playlist' button needs to be hidden,
	//else, show the button
	show_preview_module: function(req, res) {
		db.Module.find({ where: { id: parseInt(req.param('module_id')) } }).success(function(module) {
			//show the preview of all content, belonging to this module
			db.ModuleContentPlaylist.findAll({ where: { ModuleId: module.id } }).success(function(pl) { 
				function playlist(id, name, description, path)
				{
					this.id = id;
					this.name=name;
					this.description=description;
					this.path = path;
				}
				var playlists = new Array();
				var build_playlist = function(i) {
					if(i == pl.length) {
						res.render('content/show_preview_module', {id: req.param('id'), display: req.param('display'), val: req.param('val'), module: module, playlists: playlists});
					} else {
						db.Content.find({ where: { id: pl[i].ContentId } }).success(function(c) {
							if(c) playlists.push(new playlist(c.id, c.name, c.description, c.path));
							build_playlist(++i);
						});
					}
				};
				build_playlist(0);
			});
		});
	},
	
	//called from content/module_playlist.ejs
	do_edit_module: function(req, res) {
		db.Module.find({ where: { id: parseInt(req.param('module_id')) } }).success(function(module) {
			module.updateAttributes({name: req.param('module_name'), description: req.param('module_description')}).success(function() {
				req.flash('info', "Module '"+module.name+"' updated");
				var url = '/content/module_playlist/'+module.id;
				//ajax form submission through hidden iframe
				res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
			});
		});
	},
	
	//called from content/skill_playlist.ejs
	do_edit_skill: function(req, res) {
		db.Skill.find({ where: { id: parseInt(req.param('skill_id')) } }).success(function(skill) {
			skill.updateAttributes({name: req.param('skill_name'), description: req.param('skill_description')}).success(function() {
				req.flash('info', "Skill '"+skill.name+"' updated");
				var url = 'content/skill_playlist/'+skill.id;
				//ajax form submission through hidden iframe
				res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
			});
		});
	},
	
	//create a new module, the ajax way
	do_create_module_ajax: function(req, res) {
		db.Module.create(req.body).success(function(module) {
			/*res.send(module, {
	            'Content-Type': 'text/plain'
	         }, 200);*/
	         var url = '/content/module_playlist/'+module.id;
	         res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
		});
	},
	
	//create a new skill, the ajax way
	do_create_skill_ajax: function(req, res) {
		var newPath = null;
		
		var delete_file_from_temp_location = function(newPath) {
			fs.unlink(req.files.content.path, function() { //delete file from temporary location
				db.Skill.create({imgPath: newPath, name: req.param('name'), description: req.param('description')}).success(function(skill) {
					res.redirect('/content/build_skill_playlist/'+skill.id+'/'+req.param('search'));
				});
		    });
		};
		
		//entry point
		if(req.files != null && req.files.content != null && req.files.content.originalFilename != null && req.files.content.originalFilename != '' && req.files.content.originalFilename != 'null') {
			fs.readFile(req.files.content.path, function (err, data) {
				var __parentDir = path.dirname(module.parent.filename);
				newPath = __parentDir + '/uploads/skill/'+req.files.content.name;
				fs.writeFile(newPath, data, function (err) { //write file to new path
					// req.protocol + '://' + req.get('host') + '/' + req.files.content.name
					delete_file_from_temp_location(req.protocol + '://' + req.get('host') + '/skill/' + req.files.content.name);
				});
			});
		} else {
			db.Skill.create({imgPath: newPath, name: req.param('name'), description: req.param('description')}).success(function(skill) {
				var url = '/content/skill_playlist/'+skill.id;
				res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
			});
		}
	},
	
	//edit module
	//click on the 'edit' icon from content/list_modules.ejs
	module_playlist: function(req, res) {
		db.Module.find({ where: { id: parseInt(req.param('module_id')) } }).success(function(module) {
			db.ModuleContentPlaylist.findAll({ where: { ModuleId: module.id } }).success(function(pl) { // to return all playlists to module_playlist.ejs
				function playlist(id, name, description)
				{
					this.id = id;
					this.name=name;
					this.description=description;
				}
				var playlists = new Array();
				var build_playlist = function(i) {
					if(i == pl.length) {
						//get module test
						db.ModuleTest.findAll({ where: ['"ModuleId" = ?', module.id] }).success(function(moduleTests) {
							var tests = [];
							var get_tests = function(j) {
								if(j == moduleTests.length) {
									res.render('content/module_playlist', {module: module, playlists: playlists, tests: tests});
								} else {
									db.Test.find({ where: ['"id" = ?', moduleTests[j].TestId] }).success(function(test) {
										tests.push(test);
										get_tests(++j);
									});
								}
							};
							get_tests(0);
						});
					} else {
						db.Content.find({ where: { id: pl[i].ContentId } }).success(function(c) {
							if(c) playlists.push(new playlist(c.id, c.name, c.description));
							build_playlist(++i);
						});
					}
				};
				build_playlist(0);
			});
		});
	},
	
	//edit skill
	//click on the 'edit' icon from content/list_skills.ejs
	skill_playlist: function(req, res) {
		db.Skill.find({ where: { id: parseInt(req.param('skill_id')) } }).success(function(skill) {
			db.SkillModulePlaylist.findAll({ where: { SkillId: skill.id } }).success(function(pl) { // to return all playlists to module_playlist.ejs
				function playlist(id, name, description)
				{
					this.id = id;
					this.name=name;
					this.description=description;
				}
				var playlists = new Array();
				var build_playlist = function(i) {
					if(i == pl.length) {
						//get skill test
						db.SkillTest.findAll({ where: ['"SkillId" = ?', skill.id] }).success(function(skillTests) {
							var tests = [];
							var get_tests = function(j) {
								if(j == skillTests.length) {
									res.render('content/skill_playlist', {skill: skill, playlists: playlists, tests: tests});
								} else {
									db.Test.find({ where: ['"id" = ?', skillTests[j].TestId] }).success(function(test) {
										tests.push(test);
										get_tests(++j);
									});
								}
							};
							get_tests(0);
						});
					} else {
						db.Module.find({ where: { id: pl[i].ModuleId } }).success(function(m) {
							if(m) playlists.push(new playlist(m.id, m.name, m.description));
							build_playlist(++i);
						});
					}
				};
				build_playlist(0);
			});
		});
	},
	
	//build content module playlist
	//called from build_module_content_playlist(id, val) function in script.js
	//used to build module content playlist
	//the new content would be the first content or anywhere in between the playlist
	build_module_playlist: function(req, res) {
		db.Module.find({ where: { id: parseInt(req.param('module_id')) } }).success(function(module) {
			db.Content.find({ where: { id: parseInt(req.param('content_id')) } }).success(function(content) {
				db.ModuleContentPlaylist.findAll({ where: { ModuleId: module.id } }).success(function(pl) { // to find previous content id
					var prevContentId = null;
					
					var create_playlist = function() {
						//content will be added only once to this playlist
						db.ModuleContentPlaylist.findOrCreate({ModuleId: module.id, ContentId: content.id}, {PrevContentId: prevContentId}).success(function() {
							//res.redirect('/content/module_playlist/'+module.id);
							function playlist(id, name, description)
							{
								this.id = id;
								this.name=name;
								this.description=description;
							}
							var playlists = new Array();
							db.ModuleContentPlaylist.findAll({where: {ModuleId: module.id}}).success(function(pl){
								var build_playlist = function(i) {
									if(i == pl.length) {
										res.render('content/playlist_ajax', {skill: null, module: module, playlists: playlists});
									} else {
										db.Content.find({ where: { id: pl[i].ContentId } }).success(function(c) {
											if(c) playlists.push(new playlist(c.id, c.name, c.description));
											build_playlist(++i);
										});
									}
								};
								build_playlist(0);
							});
										
						});
					};
					
					if(pl.length > 0) { //playlist has atleast one item
						//get the recent item in the playlist
						db.ModuleContentPlaylist.max("createdAt", {where: { ModuleId: module.id } }).success(function(max) {
							db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "createdAt" = ?', module.id, max] }).success(function(mcpl) {
								prevContentId = mcpl.ContentId;
								create_playlist();
							});
						});
					} else { //playlist has no items, new content will be the first item in the playlist
						create_playlist();
					}
					
				});
			});
		});
	},
	
	//build skill module playlist
	//called from build_skill_playlist(val, disp) function in script.js
	//used to build skill module playlist
	//the new module would be the first module or anywhere in between the playlist
	build_skill_playlist: function(req, res) {
		db.Skill.find({ where: { id: parseInt(req.param('skill_id')) } }).success(function(skill) {
			db.Module.find({ where: { id: parseInt(req.param('module_id')) } }).success(function(module) {
				db.SkillModulePlaylist.findAll({ where: { SkillId: skill.id } }).success(function(pl) { // to find previous content id
					var prevModuleId = null;
					
					var create_playlist = function() {
						db.SkillModulePlaylist.findOrCreate({SkillId: skill.id, ModuleId: module.id},{PrevModuleId: prevModuleId}).success(function() {
							db.SkillModulePlaylist.findAll({ where: { SkillId: skill.id } }).success(function(pl) { // to return all playlists to module_playlist.ejs
								function playlist(id, name, description)
								{
									this.id = id;
									this.name=name;
									this.description=description;
								}
								var playlists = new Array();
								var prevContentId = null;
								
								var build_playlist = function() {
									//to get first item in the playlist
									if(prevContentId == null) {
										db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" IS NULL', skill.id] }).success(function(first_item) { 
											if(first_item) {
												db.Module.find({ where: ['"id" = ?', first_item.ModuleId ] }).success(function(c) {
													if(c) {
														prevContentId = c.id;
														playlists.push(new playlist(c.id, c.name, c.description));
													}
													build_playlist();
												});
											} else {
												res.render('content/playlist_ajax', {module: null, skill: skill, playlists: playlists});
											}
										});
									} else {
										db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" = ?', skill.id, parseInt(prevContentId)] }).success(function(other_item) { 
											if(other_item) {
												db.Module.find({ where: ['"id" = ?', other_item.ModuleId ] }).success(function(c) {
													if(c) {
														prevContentId = c.id;
														playlists.push(new playlist(c.id, c.name, c.description));
													}
													build_playlist();
												});
											} else {
												res.render('content/playlist_ajax', {module: null, skill: skill, playlists: playlists});
											}
										});
									}
								};
								build_playlist();
							});
						});
					};
					
					if(pl.length > 0) {
						//get the recent item in the playlist
						db.SkillModulePlaylist.max("createdAt", {where: { SkillId: skill.id } }).success(function(max) {
							db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "createdAt" = ?', skill.id, max] }).success(function(smpl) {
								prevModuleId = smpl.ModuleId;
								create_playlist();
							});
						});
					} else {
						create_playlist();
					}
					
				});
			});
		});
	},
	
	/* Map skills while creating module -- OLD CODE */
//	do_create_module: function(req, res) {
//		db.Module.create({name: req.param('name'), description: req.param('description'), PrevModuleId: req.param('PrevModuleId') == 0 ? null : req.param('PrevModuleId'), OrganizationId: req.param('OrganizationId'), isPublic: req.param('isPublic')}).success(function(module) {
//			req.flash('info', "Module "+module.name+" created");
//			var map_skills = function(i) {
//				if(i == tags.length) {
//					res.redirect('content/new_module');
//				}else {
//					db.Skill.findOrCreate({name: tags[i]}).success(function(skill, created) { 
//						db.ModuleSkills.findOrCreate({SkillId: skill.id, ModuleId: module.id}).success(function(ms, created) { 
//							map_skills(++i);
//						});
//						
//					});
//				}
//			};
//			map_skills(0);
//		}).error(function(errors) {
//			console.log("Error", errors);
//			res.render('content/dashboard', {errors: errors});
//		});
//	},

	/* From a company's content admin perspective (so that he cannot view private modules) */
//	do_create_module: function(req, res) {
//		
//		db.Role.find({ where: { id: req.param('role_id') } }).success(function(role) {
//			db.Module.create(req.body).success(function(module) {
//				module.setRoles([role]).success(function() {
//					req.flash('info', "Module "+module.name+" created");
//					res.redirect('content/new_module/'+req.param('user_id'));
//				}).error(function(errors) {
//					console.log("Error", errors);
//					res.render('content/dashboard', {errors: errors});
//				});
//			}).error(function(errors) {
//				var user_id = req.param('user_id');
//				
//				db.User.find({ where: { id: user_id} , include: [db.Organization]}).success(function(user) {
//					user.organizations.forEach(function(organization){
//						
//						db.Role.findAll({ where: {OrganizationId: organization.id} }).success(function(roles) {
//							res.render('content/new_module', {user_id: user_id, roles: roles, org: organization, errors: errors});
//						}).error(function(error) {
//							console.log('Error', error);
//							res.render('content/dashboard', {errors: errors});
//						});
//						
//					});
//				}).error(function(errors) {
//					console.log("Error", errors);
//					res.render('content/dashboard', {errors: errors});
//				});
//			});
//		}).error(function(errors) {
//			console.log("Error", errors);
//			res.render('content/dashboard', {errors: errors});
//		});
//	},
	
//	list_modules: function(req, res) {
//		db.User.find({ where: { id: req.param('user_id')} , include: [db.Organization]}).success(function(user) {
//			//user.organizations.forEach(function(organization){
//				db.Module.findAll({ where: {OrganizationId: user.OrganizationId} }).success(function(modules) {
//					res.render('content/list_modules', {user_id: req.param('user_id'), modules: modules, successFlash: req.flash('info')[0]});
//				}).error(function(error) {
//					console.log('Error', error);
//					res.render('content/dashboard', {errors: errors});
//				});
//				
//			//});
//			
//			
//		}).error(function(errors) {
//			console.log("Error", errors);
//			res.render('content/dashboard', {errors: errors});
//		});
//	},
	
	//search tests by name
	//called from content/add_test.ejs
	get_tests_name: function(req, res) {
		var result = [];
		db.Test.findAll({ where: ['"name" LIKE ?', '%'+req.param('q')+'%'] }).success(function(tags) {
			tags.forEach(function (tag, i) {
                result[i] = {};
                result[i].value = tag.id;
                result[i].label = tag.name;
                //result.push(tag.name);
              });
			res.send(result, {
	            'Content-Type': 'text/plain'
	         }, 200);
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//add test to a content or a module or a skill based on 'val' param
	//called from content/add_test.ejs
	//step test refers to a job test
	//job has many steps
	//each step could be either a test or an interview (appointment)
	do_add_test: function( req, res ) {
		db.Test.find({ where: ['"id" = ?', parseInt(req.param('test_id'))] }).success(function(test) {
			switch(req.param('val')) {
				case 'content':
								db.Content.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(content) {
									if(test)
										db.ContentTest.findOrCreate({ ContentId: content.id, TestId: test.id }).success(function(contentTest, created) {
											if(created)
												req.flash('info', 'Test added to content');
											else
												req.flash('info', 'Test already exists');
											res.redirect('/content/edit_content/'+contentTest.ContentId);
										});
									else {
										req.flash('error', 'Test not added');
										res.redirect('/content/edit_content/'+req.param('id'));
									}
								});
								break;
				case 'module':
								db.Module.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(module) {
									if(test)
										db.ModuleTest.findOrCreate({ ModuleId: module.id, TestId: test.id }).success(function(moduleTest, created) {
											if(created)
												req.flash('info', 'Test added to module');
											else
												req.flash('info', 'Test already exists');
											res.redirect('/content/module_playlist/'+moduleTest.ModuleId);
										});
									else {
										req.flash('error', 'Test not added');
										res.redirect('/content/module_playlist/'+req.param('id'));
									}
								});
								break;
				case 'skill':
								db.Skill.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(skill) {
									if(test)
										db.SkillTest.findOrCreate({ SkillId: skill.id, TestId: test.id }).success(function(skillTest, created) {
											if(created)
												req.flash('info', 'Test added to skill');
											else
												req.flash('info', 'Test already exists');
											res.redirect('/content/skill_playlist/'+skillTest.SkillId);
										});
									else {
										req.flash('error', 'Test not added');
										res.redirect('/content/skill_playlist/'+req.param('id'));
									}
								});
								break;
				case 'step':
								db.Step.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(step) {
									if(test)
										db.StepTest.findOrCreate({ StepId: step.id, TestId: test.id }).success(function(stepTest, created) {
											if(created)
												req.flash('info', 'Test added to interview round');
											else
												req.flash('info', 'Test already exists');
											res.redirect('/recruiter/edit_job/'+step.JobId);
										});
									else {
										req.flash('error', 'Test not added');
										res.redirect('/recruiter/edit_job/'+step.JobId);
									}
								});
								break;
			}
		}).error(function(){
			switch(req.param('val')) {
				case 'content'	:	res.redirect('/content/edit_content/'+req.param('id'));
									break;
				case 'module'	: 	res.redirect('/content/module_playlist/'+req.param('id'));
									break;
				case 'skill'	:	res.redirect('/content/skill_playlist/'+req.param('id'));
									break;
			}
		});
	},
	
	
	//interface to add test
	//called from content/edit_content.ejs, content/module_playlist.ejs, content/skill_playlist.ejs
	//'val' param = 'step' refers to the job test
	add_test: function(req, res) {
		switch(req.param('val')) {
			case 'content': db.Content.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(content) {
								res.render('content/add_test', {step: null, content: content, module: null, skill: null, val: req.param('val')});
							});
							break;
			case 'module':	db.Module.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(module) {
								res.render('content/add_test', {step: null, module: module, content: null, skill: null,  val: req.param('val')});
							});
							break;
			case 'skill':	db.Skill.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(skill) {
								res.render('content/add_test', {step: null, module: null, content: null, skill: skill,  val: req.param('val')});
							});
							break;
			case 'step':	db.Step.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(step) {
								res.render('content/add_test', {step: step, module: null, content: null, skill: null,  val: req.param('val')});
							});
							break;
		}
		
	},
	
	//add tags to content
	//called from content/edit_content.ejs
	add_content_tag: function( req, res ) {
		db.Content.find({ where: { id: parseInt(req.param('content_id')) } }).success(function(content) {
			db.Tag.findOrCreate({ name: req.param('tag_name') }).success(function(tag) {
				db.ContentTags.findOrCreate({ContentId: content.id, TagId: tag.id }).success(function(contentTag, created) {
					if(created)
						req.flash('info', 'Tag added');
					else
						req.flash('info', 'Tag already exists');
					res.redirect('/content/edit_content/'+content.id);
				});
			});
		});
	},
	
	//delete a content tag
	//called from content/edit_content.ejs
	delete_content_tag: function( req, res ) {
		db.ContentTags.find({ where: ['"ContentId" = ? AND "TagId" = ?', parseInt(req.param('content_id')), parseInt(req.param('tag_id'))] }).success(function(problemTag) {
			problemTag.destroy().success(function(){
				req.flash('info', 'Tag deleted');
				res.redirect('/content/edit_content/'+parseInt(req.param('content_id')));
			});
		});
	},
	
	//edit content
	//called from content/edit_content.ejs
	do_edit_content: function( req, res ) {
		db.Content.find({ where: { id: parseInt(req.param('content_id')) } }).success(function(content) {
			var pattern = /^\d+$/;
			if(req.param('hours') == null || req.param('hours') == 'null') {
				req.body.hours = 1;
			} else if(!pattern.test(req.param('hours'))) {
				req.body.hours = 1;
			}
			content.updateAttributes(req.body).success(function(){
				req.flash('info', 'Updated content');
				var url = '/content/edit_content/'+content.id 
				//ajax form submission through hidden frame
				res.render('iframe_middleware',{url: url, div: 'content-admin-display'});
			});
		});
	},
	
	//the page to edit content
	//click on the 'edit' icon on content/list_content.ejs
	edit_content: function(req, res) {
		db.Content.find({ where: { id: parseInt(req.param('id')) } }).success(function(content) {
			db.ContentTest.findAll({ where: ['"ContentId" = ?', content.id] }).success(function(contentTests) {
				var tests = [];
				var get_tests = function(j) {
					if(j == contentTests.length) {
						//get all content tags
						db.ContentTags.findAll({ where: ['"ContentId" = ?', content.id] }).success(function(contentTags) {
							var tags = [];
							var get_tags = function(i) {
								if(i == contentTags.length) {
									res.render('content/edit_content', {content: content, tests: tests, tags: tags, successFlash: req.flash('info')[0], url_string: req.param('url_string'), url_param: req.param('url_param'), page: req.param('page')});
								} else {
									db.Tag.find({ where: ['"id" = ?', contentTags[i].TagId] }).success(function(tag) {
										tags.push(tag);
										get_tags(++i);
									});
								}
							};
							get_tags(0);
						});
					} else {
						//get content test
						db.Test.find({ where: ['"id" = ?', contentTests[j].TestId] }).success(function(test) {
							tests.push(test);
							get_tests(++j);
						});
					}
				};
				get_tests(0);
			});
		});
	},
	
	//called from content/add_question_to_test.ejs
	do_add_question_to_test: function( req, res ) {
		db.Problem.find({ where: ['"id" = ?', parseInt(req.param('question_id'))] }).success(function(problem) {
			db.Test.find({ where: ['"id" = ?', parseInt(req.param('test_id'))] }).success(function(test) {
				if(problem)
					db.TestProblems.findOrCreate({ ProblemId: problem.id, TestId: test.id }).success(function(testProblem, created) {
						if(created)
							req.flash('info', 'Question added to test');
						else
							req.flash('info', 'Question already exists');
						res.redirect('/content/edit_test/'+testProblem.TestId);
					});
				else {
					req.flash('error', 'Question not added');
					res.redirect('/content/edit_test/'+req.param('test_id'));
				}
			});
		}).error(function(){
			res.redirect('/content/edit_test/'+req.param('test_id'));
		});
	},
	
	
	//called from content/edit_test.ejs
	add_question_to_test: function(req, res) {
		db.Test.find({ where: ['"id" = ?', parseInt(req.param('test_id'))] }).success(function(test) {
			res.render('content/add_question_to_test', {test: test});
		});
	},
	
	get_problem_tags: function(req, res) {
		var result = [];
		db.Tag.findAll({ where: ['"name" LIKE ?', '%'+req.param('q')+'%'] }).success(function(tags) {
			var questions = [];
			var get_problem_tags = function(i) {
				if(i == tags.length) {
					questions.forEach(function (q, i) {
		                result[i] = {};
		                result[i].value = q.id;
		                result[i].label = q.text;
		              });
					res.send(result, {
			            'Content-Type': 'text/plain'
			         }, 200);
				} else {
					db.ProblemTags.findAll({ where: ['"TagId" = ?', tags[i].id] }).success(function(problemTags) {
						var get_problems = function(j) {
							if(j == problemTags.length) {
								get_problem_tags(++i);
							} else {
								db.Problem.find({ where: ['"id" = ?', problemTags[j].ProblemId] }).success(function(problem) {
									questions.push(problem);
									get_problems(++j);
								});
							}
						};
						get_problems(0);
					});
				}
			};
			get_problem_tags(0);
		});
	},
	
	//list all tests
	list_tests: function( req, res ) {
		db.Test.findAll({offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC'}).success(function(tests) {
			res.render('content/list_tests', {tests: tests});
		});
	},
	
	//called from content/edit_test.ejs
	edit_test_pass_score: function( req, res ) {
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test){
			res.render('content/edit_test_pass_score', {test: test});
		});
	},
	
	//show test score after it's been edited
	show_test_pass_score: function( req, res ) {
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test){
			res.render('content/show_test_pass_score', {test: test});
		});
	},
	
	//update test pass score
	//called from content/edit_test_pass_score.ejs
	do_edit_test_pass_score: function( req, res ) {
		var score = get_int_value(req.param('pass_score'));
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test){
			test.updateAttributes({passScore: parseInt(score)}).success(function() {
				res.redirect('content/show_test_pass_score/'+test.id);
			});
		});
	},
	
	//called from content/edit_test.ejs
	edit_test_mandatory_question: function( req, res ) {
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test){
			res.render('content/edit_test_mandatory_question', {test: test});
		});
	},
	
	//show mandatory questions' count after it's been edited
	show_test_mandatory_question: function( req, res ) {
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test){
			res.render('content/show_test_mandatory_question', {test: test});
		});
	},
	
	//update madatory questions' count
	//called from content/edit_test_mandatory_question.ejs
	do_edit_test_mandatory_question: function( req, res ) {
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test){
			test.updateAttributes({criticalQuestions: req.param('option')}).success(function() {
				res.redirect('content/show_test_mandatory_question/'+test.id);
			});
		});
	},
	
	//edit test
	do_edit_test: function( req, res ) {
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test){
			req.body.duration = get_int_value(req.param('duration'));
			test.updateAttributes(req.body).success(function(){
				req.flash('info', 'Test updated');
				var url = '/content/edit_test/'+test.id;
				//ajax form submission through hidden iframe
				res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
			});
		});
	},
	
	//edit test
	//click on 'edit' icon in content/list_tests.ejs
	edit_test: function( req, res ) {
		db.Test.find({where: {id: parseInt(req.param('id'))}}).success(function(test){
			db.TestProblems.findAll({where: {TestId: test.id}, order: 'id ASC'}).success(function(testProblems){
				var questions = [];
				var total_score = 0;
				var get_questions = function(i) {
					if(i == testProblems.length) {
						db.TestProblems.count({where: ['"TestId" = ? AND "isMandatory" = ?', test.id, true]}).success(function(mandatory_count){
							db.TestProblems.count({where: ['"TestId" = ? AND "isCritical" = ?', test.id, true]}).success(function(critical_count){
								
								res.render('content/edit_test', {test: test, questions: questions, total_score: total_score, mandatory_count: mandatory_count, critical_count: critical_count, successFlash: req.flash('info')[0]});
							});
						});	
					} else {
						db.Problem.find({where: {id: testProblems[i].ProblemId}}).success(function(problem){
							total_score += testProblems[i].positiveScore;
							
							problem.positiveScore = testProblems[i].positiveScore; 
							problem.negativeScore = testProblems[i].negativeScore;
							
							problem.isMandatory = testProblems[i].isMandatory;
							problem.isLocked = testProblems[i].isLocked;
							problem.isCritical = testProblems[i].isCritical;
							
							questions.push(problem);
							get_questions(++i);
						});
					}
				};
				get_questions(0);
			});
		});
	},
	
	//create a new test
	create_test: function( req, res ) {
		req.body.duration = get_int_value(req.param('duration'));
		db.Test.create(req.body).success(function(test) {
			req.flash('info', 'Test created');
			var url = '/content/edit_test/'+test.id;
			res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
		});
	},
	
	//show a form to create a new test
	new_test: function( req, res ) {
		res.render('content/new_test');
	},
	
	//called from content/edit_question.ejs
	edit_answer: function(req, res) {
		db.Answer.find({where: { id: parseInt(req.param('answer_id'))}}).success(function(answer) {
			res.render('content/edit_answer', {answer: answer});
		});
	},
	
	//called from content/edit_answer.ejs
	do_edit_answer: function(req, res) {
		req.param.isAnswer = typeof req.param('isAnswer') != 'undefined' ? req.param('isAnswer') : false;
		db.Answer.find({where: { id: parseInt(req.param('id'))}}).success(function(answer) {
			answer.updateAttributes(req.body).success(function(){
				var render = function() {
					var url = '/content/edit_question/'+answer.ProblemId;
					//res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
					check_correct_answers(res, answer.ProblemId, url , 'content-admin-display');
				};
				if(req.param.isAnswer == false) {
					answer.updateAttributes({isAnswer: false}).success(function(){
						render();
					});
				} else 
					render();
			});
		});
	},
	
	//deprecated
	edit_answer_ajax: function(req, res) {
		db.Answer.find({where: { id: parseInt(req.param('answer_id'))}}).success(function(answer) {
			res.render('content/edit_answer_ajax', {answer: answer, test_id: req.param('test_id')});
		});
	},
	
	//deprecated
	do_edit_answer_ajax: function(req, res) {
		req.body.isAnswer = typeof req.param('isAnswer') != 'undefined' ? req.param('isAnswer') : false;
		db.Answer.find({where: { id: parseInt(req.param('id'))}}).success(function(answer) {
			answer.updateAttributes(req.body).success(function(){
				var url = '/content/edit_answers_ajax/'+req.param('ProblemId')+'/'+req.param('TestId');
				check_correct_answers(res, answer.ProblemId, url , 'uide4b3dde6bb5097375d99eb18a83d7146');
			});
		});
	},
	
	//called from content/edit_answer.ejs
	delete_answer: function(req, res) {
		db.Answer.find({where: { id: parseInt(req.param('answer_id'))}}).success(function(answer) {
			var problem_id = answer.ProblemId;
			answer.destroy().success(function(){
				res.redirect('/content/edit_question/'+problem_id);
			});
		});
	},
	
	//called from content/add_answer.ejs
	do_add_answer: function( req, res ) {
		db.Answer.create(req.body).success(function(answer) {
			req.flash('info', 'Answer added successfully');
			var url = '/content/add_answer/'+answer.ProblemId+'/'+req.flash('info')[0];
			//the following function is used to ensure that there is only one correct answer for question of type 'MCQ/Single Answer'
			check_correct_answers(res, answer.ProblemId, url , 'uide4b3dde6bb5097375d99eb18a83d7146');
		});
	},
	
	//called from content/add_answer.ejs
	do_add_answer_ajax: function( req, res ) {
		db.Answer.create(req.body).success(function(answer) {
			req.flash('info', 'Answer created');
			var url = '/content/edit_answers_ajax/'+req.param('ProblemId')+'/'+req.param('TestId');
			//the following function calls redirects to iframe_middleware.ejs
			check_correct_answers(res, answer.ProblemId, url , 'uide4b3dde6bb5097375d99eb18a83d7146');
		});
	},
	
	//called from content/edit_question.ejs
	add_answer: function( req, res ) {
		res.render('content/add_answer', {question_id: req.param('question_id'), successFlash: req.param('message')});
	},
	
	//deprecated
	add_answer_ajax: function(req, res) {
		res.render('content/add_answer_ajax', {question_id: req.param('question_id'), test_id: req.param('test_id')});
	},
	
	//called from content/edit_test.ejs
	edit_answers_ajax: function( req, res ) {
		db.Answer.findAll({where: { ProblemId: parseInt(req.param('problem_id'))}, order: 'id ASC'}).success(function(answers) {
			res.render('content/edit_answers_ajax', {answers: answers, problem_id: req.param('problem_id'), test_id: req.param('test_id'), successFlash: req.flash('info')[0]});
		});
	},
	
	//called from content/edit_question_ajax.ejs
	add_problem_tag_ajax: function( req, res ) {
		db.Problem.find({ where: { id: parseInt(req.param('problem_id')) } }).success(function(problem) {
			db.Tag.findOrCreate({ name: req.param('tag_name') }).success(function(tag) {
				db.ProblemTags.findOrCreate({ProblemId: problem.id, TagId: tag.id }).success(function(problemTag, created) {
					if(created)
						req.flash('info', 'Tag added');
					else
						req.flash('info', 'Tag already exists');
					res.redirect('/content/edit_question_ajax/'+problem.id+'/'+parseInt(req.param('test_id')));
					//res.redirect('/content/edit_question/'+problem.id);
				});
			});
		});
	},
	
	//called from content/edit_question_ajax.ejs
	delete_problem_tag_ajax: function( req, res ) {
		db.ProblemTags.find({ where: ['"ProblemId" = ? AND "TagId" = ?', parseInt(req.param('problem_id')), parseInt(req.param('tag_id'))] }).success(function(problemTag) {
			problemTag.destroy().success(function(){
				req.flash('info', 'Tag deleted');
				res.redirect('/content/edit_question_ajax/'+parseInt(req.param('problem_id'))+'/'+parseInt(req.param('test_id')));
			});
		});
	},
	
	add_problem_tag: function( req, res ) {
		db.Problem.find({ where: { id: parseInt(req.param('problem_id')) } }).success(function(problem) {
			db.Tag.findOrCreate({ name: req.param('tag_name') }).success(function(tag) {
				db.ProblemTags.findOrCreate({ProblemId: problem.id, TagId: tag.id }).success(function(problemTag, created) {
					if(created)
						req.flash('info', 'Tag added');
					else
						req.flash('info', 'Tag already exists');
					res.redirect('/content/edit_question/'+problem.id);
				});
			});
		});
	},
	
	delete_problem_tag: function( req, res ) {
		db.ProblemTags.find({ where: ['"ProblemId" = ? AND "TagId" = ?', parseInt(req.param('problem_id')), parseInt(req.param('tag_id'))] }).success(function(problemTag) {
			problemTag.destroy().success(function(){
				req.flash('info', 'Tag deleted');
				res.redirect('/content/edit_question/'+parseInt(req.param('problem_id')));
			});
		});
	},
	
	//list all questions
	list_questions: function(req, res) {
		
		db.Problem.findAll({offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC'}).success(function(problems) {
			res.render('content/list_questions', {user_id: req.user.id, problems: problems, successFlash: req.flash('info')[0]});
		}).error(function(error) {
			console.log('Error', error);
			res.render('content/dashboard', {errors: errors});
		});
				
	},
	
	create_new_question_to_test: function(req, res) {
		res.render('content/create_new_question_to_test', {user_id: req.user.id, test_id: req.param('test_id'), successFlash: req.flash('info')[0]});
	},
	
	//create a new question
	//called from content/list_questions.ejs
	new_question: function(req, res) {
		res.render('content/new_question', {user_id: req.user.id, successFlash: req.flash('info')[0]});
	},
	
	//called from content/edit_question.ejs
	do_edit_question: function( req, res ) {
		db.Problem.find({ where: { id: parseInt(req.param('ProblemId')) } }).success(function(problem) {
			problem.updateAttributes(req.body).success(function(){
				req.flash('info', 'Updated question');
				var url = '/content/edit_question/'+problem.id;
				//ajax based form submission through hidden frame
				res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
			});
		});
	},
	
	//called from content/list_question.ejs
	edit_question: function(req, res) {
		db.Problem.find({ where: { id: parseInt(req.param('id')) } }).success(function(problem) {
			db.Answer.findAll({ where: ['"ProblemId" = ?', problem.id], order: 'id ASC' }).success(function(answers) {
				db.ProblemTags.findAll({ where: ['"ProblemId" = ?', problem.id] }).success(function(problemTags) {
					var tags = [];
					var get_tags = function(i) {
						if(i == problemTags.length) {
							res.render('content/edit_question', {problem: problem, answers: answers, tags: tags, successFlash: req.flash('info')[0]});
						} else {
							db.Tag.find({ where: ['"id" = ?', problemTags[i].TagId] }).success(function(tag) {
								tags.push(tag);
								get_tags(++i);
							});
						}
					};
					get_tags(0);
				});
			});
		});
	},
	
	//called from content/edit_test.ejs
	edit_question_ajax: function(req, res) {
		db.Problem.find({ where: { id: parseInt(req.param('id')) } }).success(function(problem) {
			db.TestProblems.find({ where: ['"ProblemId" = ? AND "TestId" = ?', problem.id, parseInt(req.param('test_id'))] }).success(function(testProblem) {
				db.ProblemTags.findAll({ where: ['"ProblemId" = ?', problem.id] }).success(function(problemTags) {
					var tags = [];
					var get_tags = function(i) {
						if(i == problemTags.length) {
							
							problem.positiveScore = testProblem.positiveScore;
							problem.negativeScore = testProblem.negativeScore;
							problem.isMandatory = testProblem.isMandatory;
							problem.isCritical = testProblem.isCritical;
							problem.isLocked = testProblem.isLocked;
							
							res.render('content/edit_question_ajax', {test_id: req.param('test_id'), problem: problem, tags: tags, successFlash: req.flash('info')[0]});
						} else {
							db.Tag.find({ where: ['"id" = ?', problemTags[i].TagId] }).success(function(tag) {
								tags.push(tag);
								get_tags(++i);
							});
						}
					};
					get_tags(0);
				});
			});
		});
	},
	
	//called from content/edit_question_ajax.ejs
	do_edit_question_ajax: function(req, res) {
		db.TestProblems.find({ where: ['"TestId" = ? AND "ProblemId" = ?', parseInt(req.param('test_id')), parseInt(req.param('problem_id'))] }).success(function(testProblem) {
			req.body.positiveScore = get_int_value(req.param('positiveScore'));
			req.body.negativeScore = get_int_value(req.param('negativeScore'));
			
			req.body.isCritical = typeof req.param('isCritical') != 'undefined' ? req.param('isCritical') : false;
			req.body.isMandatory = typeof req.param('isMandatory') != 'undefined' ? req.param('isMandatory') : false;
			
			testProblem.updateAttributes(req.body).success(function(){
				db.Problem.find({ where: {id: parseInt(req.param('problem_id'))}}).success(function(problem) {
					problem.updateAttributes(req.body).success(function() {
						req.flash('info', 'Updated question');
						var url = '/content/edit_test/'+testProblem.TestId;
						res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
					});
				});
			});
		});
	},
	
	create_question_ajax: function(req, res) {
		var create_question = function() {
			db.Problem.create(req.body).success(function(problem) {
				var set_tags = function(j) {
					if(j == tags.length) {
						req.flash('info', 'Question created');
						var url = '/content/edit_test/'+req.param('test_id');
						res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
					} else {
						db.Tag.find({ where: {name: tags[j]} }).success(function(tag) {
							problem.addTag(tag).success(function() {
								set_tags(++j);
							});
						});
					}
				};
				db.Test.find({where: {id: req.param('test_id')}}).success(function(test){
					db.TestProblems.create({TestId: test.id, ProblemId: problem.id}).success(function(testProblem){
						req.body.positiveScore = get_int_value(req.param('positiveScore'));
						req.body.negativeScore = get_int_value(req.param('negativeScore'));
						testProblem.updateAttributes(req.body).success(function(){
							set_tags(0);
						});
					});
				});
			});
		};
		if(req.files.file != null && req.files.file.originalFilename != null && req.files.file.originalFilename != '' && req.files.file.originalFilename != 'null') {
		    var fullPath = req.files.file.path;
		    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
			var ext = fullPath.substring(startIndex);
			if (ext.indexOf('\.') === 0 ) {
				ext = ext.substring(1);
			}
			console.log("FILE EXTENSION: ", ext);
			
			var delete_file_from_temp_location = function(newPath) {
				fs.unlink(req.files.file.path, function() { //delete file from temporary location
			    	req.params.filePath = newPath;
			    	req.body.filePath = newPath;
					create_question();
			    });
			};
			
			fs.readFile(req.files.file.path, function (err, data) {
				var __parentDir = path.dirname(module.parent.filename);
				var newPath = __parentDir + '/uploads/question/'+req.files.file.name;
				fs.writeFile(newPath, data, function (err) { //write file to new path
					delete_file_from_temp_location(req.protocol + '://' + req.get('host') + '/question/' + req.files.file.name);
				});
			});
			
		} else {
			create_question();
		}
	},	
	
	//called from content/new_question.ejs
	create_question: function(req, res) {
		var create_question = function() {
			db.Problem.create(req.body).success(function(problem) {
				var set_tags = function(j) {
					if(j == tags.length) {
						req.flash('info', 'Question created');
						var url = '/content/edit_question/'+problem.id;
						res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
					} else {
						db.Tag.find({ where: {name: tags[j]} }).success(function(tag) {
							problem.addTag(tag).success(function() {
								set_tags(++j);
							});
						});
					}
				};
				set_tags(0);
				
			});
		};
		
		//entry point
		if(req.files.file != null && req.files.file.originalFilename != null && req.files.file.originalFilename != '' && req.files.file.originalFilename != 'null') {
		    var fullPath = req.files.file.path;
		    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
			var ext = fullPath.substring(startIndex);
			if (ext.indexOf('\.') === 0 ) {
				ext = ext.substring(1);
			}
			console.log("FILE EXTENSION: ", ext);
			
			var delete_file_from_temp_location = function(newPath) {
				fs.unlink(req.files.file.path, function() { //delete file from temporary location
			    	req.params.filePath = newPath;
			    	req.body.filePath = newPath;
					create_question();
			    });
			};
			
			fs.readFile(req.files.file.path, function (err, data) {
				var __parentDir = path.dirname(module.parent.filename);
				var newPath = __parentDir + '/uploads/question/'+req.files.file.name;
				fs.writeFile(newPath, data, function (err) { //write file to new path
					delete_file_from_temp_location(req.protocol + '://' + req.get('host') + '/question/' + req.files.file.name);
				});
			});
			
		} else {
			create_question();
		}
	},
	
	//list all content
	list_content: function(req, res) {
		db.Content.findAll({offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC'}).success(function(content) {
			res.render('content/list_content', {user_id: req.user.id, content: content, successFlash: req.flash('info')[0]});
		}).error(function(error) {
			console.log('Error', error);
			res.render('content/dashboard', {errors: errors});
		});
				
	},
	
	//list all modules
	list_modules: function(req, res) {
		db.Module.findAll({offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC'}).success(function(modules) {
			res.render('content/list_modules', {user_id: req.user.id, modules: modules, successFlash: req.flash('info')[0]});
		}).error(function(error) {
			console.log('Error', error);
			res.render('content/dashboard', {errors: errors});
		});
				
	},
	
	//delete a module
	//not called yet
	//to be called from content/list_modules.ejs
	//this piece of code is not complete
	delete_module: function(req, res) {
		db.Module.find({ where: { id: req.param('module_id') } }).success(function(module) {
			db.UserSkills.findAll({ where: { "ModuleId": module.id } }).success(function(us) {
				if(us.length > 0) {
					req.flash('info', "'"+module.name+"' cannot be deleted. Users are currently taking this module");
					res.redirect('content/list_modules');
				} else {
					db.ModuleContentPlaylist.findAll({ where: { "ModuleId": module.id } }).success(function(mcpl) {
						var find_all_modules_in_skill_playlist = function() {
							db.SkillModulePlaylist.findAll({ where: { "ModuleId": module.id } }).success(function(smpl) {
								if(smpl.length > 0) {
									//to be filled
								} else {
									//to be updated
								}
							});
						};
						if(mcpl.length > 0) {
							var delete_all_content = function(i) {
								if(i == mcpl.length) {
									find_all_modules_in_skill_playlist();
								} else {
									mcpl[i].destroy().success(function(){
										delete_all_content(++i);
									});
								}
							};
							delete_all_content(0);
						} else {
							find_all_modules_in_skill_playlist();
						}
					});
				}
			});
			module.destroy().success(function() {
				req.flash('info', "Module deleted");
				res.redirect('content/list_modules');
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('content/dashboard', {errors: errors});
		});
	},
	
	show_module: function(req, res) {
		db.Content.find({ where: { id: parseInt(req.param('content_id')) } }).success(function(content) {
			res.render('module', {skill_id: req.param('skill_id'), content: content});
		});
	},
	
	// following are the sequence of steps to arrive at this piece of code
	// user gym >> play button in 'Learn' tile >> /skill/get_modules_for_skill_ajax/:skill_id (skill controller) >>
	// >> module_turbo_ajax.ejs (view) >> 'Next' button in module_turbo_ajax.ejs >> /content/show_test_instructions (content controller) >>
	// >> if there is no content test, or if user has already taken up this test, then >> /content/advance_next/ (content controller)
	advance_next: function(req, res) {
		var last = function(userSkill) {
			userSkill.updateAttributes({status: 'complete'}).success(function() {
				req.flash('info', 'Congratulations! You have completed this skill');
	    		res.redirect('/users/next_module/'+req.param('user_id')+'/'+req.param('skill_id')+'/'+req.flash('info')[0]);
			});
		};
		
		var rem = function(userSkill) {
			db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" = ?', userSkill.SkillId, userSkill.ModuleId] }).success(function(module) {
				if(module) { 
					db.ModuleContentPlaylist.findAll({ where: { ModuleId: module.ModuleId } }).success(function(contentModules) {
						var get_first_content = function(i) {
							if(i == contentModules.length) {
								req.flash('info', 'No more content available in this module');
								res.redirect('/users/next_module/'+req.param('user_id')+'/'+req.param('skill_id')+'/'+req.flash('info')[0]);
							} else {
								db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "ContentId" = ? AND "PrevContentId" IS NULL', contentModules[i].ModuleId, contentModules[i].ContentId] }).success(function(c) {
									if(c) {
										userSkill.updateAttributes({ContentId: c.ContentId, ModuleId: contentModules[i].ModuleId, status: ''}).success(function() {
											res.redirect('/users/next_module/'+req.param('user_id')+'/'+req.param('skill_id'));
										});
									} else {
										get_first_content(++i);
									}
								});
							}
						};
						get_first_content(0);
					});
				} else { 
					//done with all module for this skill, check if this skill has a test
					db.SkillTest.findAll({where: {SkillId: userSkill.SkillId}, order: 'id ASC'}).success(function(st){
						render('skill', st, userSkill, last);
					});
				}
			});
		};
		
		var render = function(type, smt, userSkill, callback) {
			if(smt.length > 0) {
				db.Test.find({ where: ['"id" = ?', smt[0].TestId]}).success(function(test) {
					db.TestProblems.count({ where: ['"TestId" = ?', test.id]}).success(function(test_problem_count) {
						db.Report.find({ where: ['"UserId" = ? AND "TestId" = ? AND status = ?', parseInt(req.user.id), test.id, 'complete']}).success(function(report) {
							if(report) {
								callback(userSkill);
							} else {
								db.Report.find({ where: ['"UserId" = ? AND "TestId" = ? AND status = ?', parseInt(req.user.id), test.id, "progress"]}).success(function(report) {
									if(report) {
										db.ReportDetail.count({ where: ['"UserId" = ? AND "TestId" = ?', parseInt(req.user.id), test.id]}).success(function(rd) {
											if(rd == test_problem_count)
												res.redirect('/content/show_content_test_report_details/'+test.id+'/'+userSkill.SkillId);
											else
												res.render('content/show_test_instructions', {rd: rd, test_problem_count: test_problem_count, type: type, test: test, message: null, content_id: userSkill.ContentId, skill_id: userSkill.SkillId});
										});
									} else
										res.render('content/show_test_instructions', {rd: null, test_problem_count: test_problem_count, type: type, test: test, message: null, content_id: userSkill.ContentId, skill_id: userSkill.SkillId});
								});
							}
						});
					});
				});
			} else {
				//no skill or module test
				callback(userSkill);	
			}
		};
		
		var next = function(userSkill) {
			db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "PrevContentId" = ?', userSkill.ModuleId, userSkill.ContentId] }).success(function(content) {
				if(content) { 
					userSkill.updateAttributes({ContentId: content.ContentId, status: ''}).success(function() {
						res.redirect('/users/next_module/'+req.param('user_id')+'/'+req.param('skill_id'));
					});
				} else { 
					//done with all content for this module, check if this module has a test
					db.ModuleTest.findAll({where: {ModuleId: userSkill.ModuleId}, order: 'id ASC'}).success(function(mt){
						render('module', mt, userSkill, rem);
					});
				}
			});
		};
		
		//first entry point, to check for test
		if(req.param('test_id') != null && req.param('test_id') != '' && req.param('test_id') != 'null') {
			db.ContentTest.find({ where: { TestId: parseInt(req.param('test_id')) } }).success(function(contentTest) {
				if(contentTest) {
					db.UserSkills.find({where: ['"UserId" = ? AND "ContentId" = ? AND "SkillId" = ?', parseInt(req.param('user_id')), contentTest.ContentId, parseInt(req.param('skill_id'))]}).success(function(userSkill){
						next(userSkill);
					});
				} else {
					db.UserSkills.find({where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.param('user_id')), parseInt(req.param('skill_id'))]}).success(function(userSkill){
						next(userSkill);
					});
				}
			});
		} else {
			//start (if no test for content)
			db.UserSkills.find({where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.param('user_id')), parseInt(req.param('skill_id'))]}).success(function(userSkill){
				next(userSkill);
			});
		}
	},
	
	//called from content/show_content_question.ejs
	answer: function(req, res) {
		db.Problem.find({ where: { id: parseInt(req.param('id')) } }).success(function(question) {
			db.Answer.find({ where: ['"ProblemId" = ? AND "isAnswer" = ?', question.id, true] }).success(function(answer) {
				var isAnswer = false;
				var score;
				
				db.TestProblems.find({ where: ['"ProblemId" = ? AND "TestId" = ?', question.id, parseInt(req.param('test_id'))] }).success(function(testProblem) {
					if(req.param('option') == answer.id) {
						isAnswer = true;
						score = testProblem.positiveScore;
					} else
						score = -(testProblem.negativeScore);
					
					db.ReportDetail.findOrCreate({ProblemId: question.id, UserId: parseInt(req.param('user_id')), TestId: testProblem.TestId}, {AnswerId: req.param('option') != null ? parseInt(req.param('option')) : null, isAnswer: isAnswer, score: score, timeToAnswer: req.param('timeToAnswer')}).success(function(){
						if(req.param('val') == 'content') {
							db.ContentTest.find({ where: { TestId: parseInt(req.param('test_id')) } }).success(function(ct) {
								res.render('content/answer_submit', {value: 'Next', message: null, test_id: req.param('test_id'), skill_id: req.param('skill_id'), content_id: ct != null ? ct.ContentId : null, current_question_id: testProblem.id, duration: req.param('oldDuration'), second_duration: req.param('oldSecondDuration')});
							});
						} else if(req.param('val') == 'test') {
							res.render('content/answer_submit', {value: 'Test', message: null, skill_id: null, test_id: req.param('test_id'), current_question_id: testProblem.id, duration: req.param('oldDuration'), second_duration: req.param('oldSecondDuration')});
						}
					});
				});
			});
		});
	},
	
	//deprecated
	answer_wrong: function(req, res) {
		res.render('content/answer_wrong', {skill_id: parseInt(req.param('skill_id')), content_id: req.param('content_id'), current_question_id: req.param('current_question_id')});
	},
	
	//deprecated
	add_question: function(req, res) {
		res.render('content/add_question', {q: parseInt(req.param('q'))});
	},
	
	//deprecated
	show_question: function(req, res) {
		db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', req.user.id, req.param('skill_id')] }).success(function(userSkill) {
			if(userSkill.status == "complete") {
				var msg = 'You have answered all questions and also completed all modules for this skill';
				res.redirect('/users/next_module/'+req.user.id+'/'+req.param('skill_id')+'/'+msg);
			}else {
				db.Content.find({ where: { id : userSkill.ContentId}, include: [db.Module]}).success(function(content) {
					if(content) {
						var get_first_question = function() {
							db.Question.find({ where: ['"ContentId" = ? AND "PrevQuestionId" IS NULL', content.id]}).success(function(question) {
								res.render('content/show_question', {skill_id: req.param('skill_id'), content: content, question: question});
							});
						};
						//var qId = (req.param('current_question_id') != null && req.param('current_question_id') != 'null' && req.param('current_question_id') != '') ? req.param('current_question_id') : (userSkill.QuestionId != null ? userSkill.QuestionId : null);
						var qId = userSkill.QuestionId;
						if(qId != null) {
							db.Question.find({ where: ['"ContentId" = ? AND "PrevQuestionId" = ?', content.id, parseInt(qId)]}).success(function(question) {
								if(question)
									res.render('content/show_question', {skill_id: req.param('skill_id'), content: content, question: question});
								else
									get_first_question();
							});
						} else {
							get_first_question();
						}
						
					}
					else {
						req.flash('info',"No content available for this skill");
						res.redirect("/users/gym/"+req.user.id);
					}
				}).error(function(errors) {
					console.log("Error", errors);
					res.redirect('/dashboard');
				});
			}
		});	
	},
	
	//called from user gym page
	//when a user has completed one of the following tests - role test / module test / skill test / content test / job test
	//shows a summary of score along with reason for failure
	//following is the logic to calculate pass score
	//1)user has to get >= the test pass score
	//2)user has to answer >= critical questions correctly
	//3)user has to answer all mandatory questions
	//user passes the test only if all of the above 3 conditions are satisfied
	//else, the user fails the given test
	show_content_test_report_details: function( req, res ) {
		db.ReportDetail.findAll({ where: ['"UserId" = ? AND "TestId" = ?', parseInt(req.user.id), parseInt(req.param('test_id'))], order: 'id DESC' }).success(function(reportDetails) {
			var total = 0;
			var total_test_score = 0;
			var noOfMandatoryQuestions = 0;
			var noOfCriticalQuestions = 0;
			db.TestProblems.findAll({where: {TestId: parseInt(req.param('test_id'))}}).success(function(testProblems) {
				var get_no_of_mandatory_questions = function(j) {
					if(j == testProblems.length) {
						var get_score = function(i) {
							if(i == reportDetails.length) {
								db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test) {
									var passed = false;
									//var testMandatoryQuestions = 0;
									var testCriticalQuestions = 0
									switch(test.criticalQuestions) {
										case 'All'	: testCriticalQuestions = noOfCriticalQuestions; break;
										case 'One'	: testCriticalQuestions = 1; break;
										case 'Two'	: testCriticalQuestions = 2; break;
										case 'Three': testCriticalQuestions = 3; break;
										case 'Four'	: testCriticalQuestions = 4; break;
										case 'Five'	: testCriticalQuestions = 5; break;
										default		: testCriticalQuestions = 0; break;	
									}
									testCriticalQuestions = testCriticalQuestions > noOfCriticalQuestions ? noOfCriticalQuestions : testCriticalQuestions;
									var correct_mandatory_questions_answered = 0;
									var correct_critical_questions_answered = 0;
									var get_correct_mandatory_questions_answered = function(k) {
										if(k == reportDetails.length) {
											var passScore = test.passScore != null && test.passScore > total_test_score ? total_test_score : (test.passScore != null ? test.passScore : 0);
											var reason = req.param('message') != null ? req.param('message')+' .' : '';
											if(total >= passScore && correct_mandatory_questions_answered >= noOfMandatoryQuestions && correct_critical_questions_answered >= noOfCriticalQuestions) {
												passed = true;
											}
											if(total < passScore)
												reason = reason+' You failed to get a pass score of '+passScore+'.';
											if(correct_mandatory_questions_answered < noOfMandatoryQuestions) 
												reason = reason+' Failed to answer the required mandatory questions. You answered '+correct_mandatory_questions_answered+' out of '+noOfMandatoryQuestions+' mandatory questions correctly.';
											if(correct_critical_questions_answered < testCriticalQuestions) 
												reason = reason+' Failed to answer the required critical questions. You answered '+correct_critical_questions_answered+' out of '+testCriticalQuestions+' critical questions correctly.';
											
											var date = new Date();
											var year = date.getFullYear();
											var month = date.getMonth();
											month = month < 10 ? '0'+(month+1) : month+1;
											var day = date.getDate();
											var generatedDate = year+"-"+month+"-"+day;
											
											db.Report.find({where: ['"TestId" = ? AND "UserId" = ?', test.id, parseInt(req.user.id)]}).success(function(report) {
												report.updateAttributes({status: 'complete', date: generatedDate, score: total, isPassed: passed, reason: reason}).success(function(){
													res.render('content/show_content_test_report_details', {report: report, test_id: req.param('test_id'), skill_id: req.param('skill_id'), total_test_score: total_test_score});
												});
											});
										} else {
											if(reportDetails[k].isAnswer) {
												db.TestProblems.find({ where: ['"TestId" = ? AND "ProblemId" = ?', test.id, reportDetails[k].ProblemId]}).success(function(tp) {
													if(tp.isMandatory) {
														correct_mandatory_questions_answered++;
													}
													if(tp.isCritical) {
														correct_critical_questions_answered++;
													}
													get_correct_mandatory_questions_answered(++k);
												});
											} else
												get_correct_mandatory_questions_answered(++k);
										}
									};
									get_correct_mandatory_questions_answered(0);
								});
							} else {
								total = total + reportDetails[i].score;
								get_score(++i);
							}
						};
						get_score(0);
					} else {
						if(testProblems[j].isMandatory) noOfMandatoryQuestions++;
						if(testProblems[j].isCritical) noOfCriticalQuestions++;
						total_test_score += testProblems[j].positiveScore;
						get_no_of_mandatory_questions(++j);
					}
				};
				get_no_of_mandatory_questions(0);
			});
		});
	},
	
	//deprecated
	start_test: function( req, res ) {
		switch(req.param('val')) {
			case 'event':	db.Event.find({ where: ['"id" = ?', parseInt(req.param('id'))]}).success(function(event) {
								db.EventTest.find({ where: ['"EventId" = ?', event.id]}).success(function(eventTest) {
									res.redirect('/content/show_general_test_instructions/'+eventTest.TestId);
								});
							});
							break;
			case 'job':		res.redirect('/content/show_general_test_instructions/'+req.param('id'));
							/*db.Job.find({ where: ['"id" = ?', parseInt(req.param('id'))]}).success(function(job) {
								db.Step.find({ where: ['"JobId" = ?', job.id]}).success(function(step) {
									db.StepTest.find({ where: ['"StepId" = ?', step.id]}).success(function(stepTest) {
										res.redirect('/content/show_general_test_instructions/'+stepTest.TestId);
									});
								});
							});*/
							break;
		}
	},
	
	//before a user takes the test, instructions are shown
	//called from user gym page
	//when a user tries to attempt one of the following tests - role test / module test / skill test / job test
	//if a user has already taken the test, appropriate message will be shown
	show_general_test_instructions: function( req, res ) {
		db.Test.find({ where: ['"id" = ?', parseInt(req.param('id'))]}).success(function(test) {
			db.TestProblems.count({ where: ['"TestId" = ?', test.id]}).success(function(test_problem_count) {
				db.Report.find({ where: ['"UserId" = ? AND "TestId" = ? AND status = ?', parseInt(req.user.id), test.id, 'complete']}).success(function(report) {
					if(report) {
						res.render('content/show_general_test_instructions', {report: report, rd: null, test: test, test_problem_count: test_problem_count, message: 'You have already taken this test!'});
					} else {
						db.Report.find({ where: ['"UserId" = ? AND "TestId" = ? AND status = ?', parseInt(req.user.id), test.id, "progress"]}).success(function(report) {
							if(report) {
								db.ReportDetail.count({ where: ['"UserId" = ? AND "TestId" = ?', parseInt(req.user.id), test.id]}).success(function(rd) {
									if(rd == test_problem_count)
										res.redirect('/content/show_content_test_report_details/'+test.id+'/null');
									else
										res.render('content/show_general_test_instructions', {report: null, rd: rd, test: test, test_problem_count: test_problem_count, message: null});
								});
							} else
								res.render('content/show_general_test_instructions', {report: null, rd: null, test: test, test_problem_count: test_problem_count, message: null});
						});
					}
				});
			});
		});
	},
	
	//before a user takes the test, instructions are shown
	//called from user gym page
	//when a user tries to attempt to take content test
	show_test_instructions: function( req, res ) {
		db.ContentTest.find({ where: ['"ContentId" = ?', parseInt(req.param('content_id'))]}).success(function(ct) {
			if(ct) {
				db.Test.find({ where: ['"id" = ?', ct.TestId]}).success(function(test) {
					db.TestProblems.count({ where: ['"TestId" = ?', test.id]}).success(function(test_problem_count) {
						db.Report.find({ where: ['"UserId" = ? AND "TestId" = ? AND status = ?', parseInt(req.user.id), test.id, 'complete']}).success(function(report) {
							if(report) {
								//already taken test, advance next
								res.redirect('/content/advance_next/'+req.user.id+'/'+req.param('skill_id')+'/null');
							} else {
								db.Report.find({ where: ['"UserId" = ? AND "TestId" = ? AND status = ?', parseInt(req.user.id), test.id, "progress"]}).success(function(report) {
									if(report) {
										db.ReportDetail.count({ where: ['"UserId" = ? AND "TestId" = ?', parseInt(req.user.id), test.id]}).success(function(rd) {
											if(rd == test_problem_count)
												res.redirect('/content/show_content_test_report_details/'+test.id+'/'+req.param('skill_id'));
											else
												res.render('content/show_test_instructions', {rd: rd, test_problem_count: test_problem_count, type: 'content', test: test, message: null, content_id: req.param('content_id'), skill_id: req.param('skill_id')});
										});
									} else
										res.render('content/show_test_instructions', {rd: null, test_problem_count: test_problem_count, type: 'content', test: test, message: null, content_id: req.param('content_id'), skill_id: req.param('skill_id')});
								});
							}
						});
					});
				});
			} else {
				//no test for this content, advance next
				res.redirect('/content/advance_next/'+req.user.id+'/'+req.param('skill_id')+'/null');
			}
		});
	},
	
	//when the user runs out of time, call the below code
	//called from the set_time_interval_function() javascript function in script.js
	force_end_test: function( req, res ) {
		//res.render('content/force_end_test', {message: 'Oops! you ran out of time', test_id: req.param('test_id'), skill_id: req.param('skill_id')});
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth();
		month = month < 10 ? '0'+(month+1) : month+1;
		var day = date.getDate();
		var generatedDate = year+"-"+month+"-"+day;
		
		var score = 0;
		db.ReportDetail.findAll({ where: ['"UserId" = ? AND "TestId" = ?', parseInt(req.user.id), parseInt(req.param('test_id'))], order: 'id DESC' }).success(function(reportDetails) {
			var get_test_problems = function(i) {
				if(i == reportDetails.length) {
					db.Report.find({where: ['"UserId" = ? AND "TestId" = ?', parseInt(req.user.id), parseInt(req.param('test_id'))]}).success(function(report) {
						report.updateAttributes({status: 'complete', score: score, date: generatedDate, score: score, isPassed: false, TestId: parseInt(req.param('test_id')), UserId: parseInt(req.user.id), reason: 'Oops! you ran out of time'}).success(function(){
							res.render('content/force_end_test', {message: 'Oops! you ran out of time', test_id: req.param('test_id'), skill_id: req.param('skill_id')});
						});
					});
				} else {
					db.TestProblems.find({ where: ['"TestId" = ? AND "ProblemId" = ?', parseInt(req.param('test_id')), reportDetails[i].ProblemId]}).success(function(testProblem) {
						score += testProblem.positiveScore;
						score -= testProblem.negativeScore;
						get_test_problems(++i);
					});
				}
			};
			get_test_problems(0);
		});
		
	},
	
	//interface for admin to reset test when user runs out of time
	//called from content/show_general_test_instructions.ejs
	reset_test: function(req, res) {
		res.render('content/reset_test', {user_id: req.param('user_id'), test_id: req.param('test_id')});
	},
	
	//reset the test
	//password is admin123 to reset the rest
	do_reset_test: function(req, res) {
		var query = 'delete from "ReportDetails" where "UserId" = '+parseInt(req.param('user_id'))+' and "TestId" = '+parseInt(req.param('test_id'));
		db.sequelize.query(query, null, {raw: true}).success(function() {
			query = 'delete from "Reports" where "UserId" = '+parseInt(req.param('user_id'))+' and "TestId" = '+parseInt(req.param('test_id'));
			db.sequelize.query(query, null, {raw: true}).success(function() {
				res.redirect('/users/gym/'+req.param('user_id'));
			});
		});
	},
	
	//show question for content test
	show_content_question: function(req, res) {
		db.Test.find({ where: ['"id" = ?', parseInt(req.param('test_id'))]}).success(function(test) {
			db.TestProblems.count({ where: ['"TestId" = ?', test.id]}).success(function(test_problem_count) {
				if(req.param('prev_question_id') == null) {
					db.Report.findOrCreate({"UserId": parseInt(req.user.id), "TestId": test.id}, {status: "progress"}).success(function(report, created) {
						
						var render = function(val, minutes, seconds) {
							db.TestProblems.findAll({ where: ['"TestId" = ?', test.id], order: 'id ASC'}).success(function(tp) {
								db.Problem.find({ where: ['"id" = ?', tp[val].ProblemId]}).success(function(question) {
									db.Answer.findAll({ where: ['"ProblemId" = ?', tp[val].ProblemId]}).success(function(answers) {
										var ext = get_file_extension(question);	
										res.render('content/show_content_question', {score: tp[val].positiveScore, ext: ext, problem_index: val+1, test_problem_count: test_problem_count, duration: test.duration - minutes == 0 || test.duration - minutes == test.duration ? test.duration - 1 : test.duration - minutes - 1, second_duration: 60 - seconds, message: null, test_id: test.id, skill_id: req.param('skill_id'), content: null, question: question, answers: answers, mandatory: tp[val].isMandatory, critical: tp[val].isCritical});
									});
								});
							});
						};
						
						if(created) { //report doesn't exist, first time, attempting test
							render(0, test.duration, 0);
						} else { // resume test
							db.ReportDetail.count({ where: ['"UserId" = ? AND "TestId" = ?', parseInt(req.user.id), test.id]}).success(function(rd) {
								db.ReportDetail.sum('timeToAnswer', { where: ['"TestId" = ? AND "UserId" = ?', test.id, parseInt(req.user.id)]}).success(function(total_time) {
									var total_minutes = Math.floor(total_time / 60);
									var total_seconds = total_time % 60;
									
									if(rd == test_problem_count)
										res.redirect('/content/show_content_test_report_details/'+test.id+'/'+req.param('skill_id'));
									else {
										render(rd, total_minutes, total_seconds);
									}
								});
							});
						}
					});
				} else {
					db.TestProblems.findAll({ where: ['"TestId" = ? AND id > ?', test.id, parseInt(req.param('prev_question_id'))], order: 'id ASC'}).success(function(tp) {
						if(tp.length > 0) {
							db.Problem.find({ where: ['"id" = ?', tp[0].ProblemId]}).success(function(question) {
								db.Answer.findAll({ where: ['"ProblemId" = ?', tp[0].ProblemId]}).success(function(answers) {
									var ext = get_file_extension(question);
									res.render('content/show_content_question', {score: tp[0].positiveScore, ext: ext, problem_index: test_problem_count - tp.length + 1, test_problem_count: test_problem_count, duration: req.param('duration'), second_duration: req.param('second_duration'), message: null, test_id: test.id, skill_id: req.param('skill_id'), content: null, question: question, answers: answers, mandatory: tp[0].isMandatory, critical: tp[0].isCritical});
								});
							});
						} else {
							res.redirect('/content/show_content_test_report_details/'+test.id+'/'+req.param('skill_id'));
						}
						
					});
				}
			});
		});
	},
	
	//show question for general test - role test / module test / skill test / job test
	show_test_question: function(req, res) {
		db.Test.find({ where: ['"id" = ?', parseInt(req.param('id'))]}).success(function(test) {
			db.TestProblems.count({ where: ['"TestId" = ?', test.id]}).success(function(test_problem_count) {
				if(req.param('prev_question_id') == null) {
					db.Report.findOrCreate({"UserId": parseInt(req.user.id), "TestId": test.id}, {status: "progress"}).success(function(report, created) {
						var render = function(val, minutes, seconds) {
							db.TestProblems.findAll({ where: ['"TestId" = ?', test.id], order: 'id ASC'}).success(function(tp) {
								db.Problem.find({ where: ['"id" = ?', tp[val].ProblemId]}).success(function(question) {
									db.Answer.findAll({ where: ['"ProblemId" = ?', tp[val].ProblemId]}).success(function(answers) {
										var ext = get_file_extension(question);	
										res.render('content/show_test_question', {score: tp[val].positiveScore, ext: ext, problem_index: val+1, test_problem_count: test_problem_count, duration: test.duration - minutes == 0 || test.duration - minutes == test.duration ? test.duration - 1 : test.duration - minutes - 1, second_duration: 60 - seconds, message: null, test_id: test.id, question: question, answers: answers, mandatory: tp[val].isMandatory, critical: tp[val].isCritical});
									});
								});
							});
						};
						if(created) { //report doesn't exist, first time, attempting test
							render(0, test.duration, 0);
						} else { // resume test
							db.ReportDetail.count({ where: ['"UserId" = ? AND "TestId" = ?', parseInt(req.user.id), test.id]}).success(function(rd) {
								db.ReportDetail.sum('timeToAnswer', { where: ['"TestId" = ? AND "UserId" = ?', test.id, parseInt(req.user.id)]}).success(function(total_time) {
									var total_minutes = Math.floor(total_time / 60);
									var total_seconds = total_time % 60;
									
									if(rd == test_problem_count)
										res.redirect('/content/show_content_test_report_details/'+test.id+'/'+req.param('skill_id'));
									else {
										render(rd, total_minutes, total_seconds);
									}
								});
							});
						}
					});
				} else {
					db.TestProblems.findAll({ where: ['"TestId" = ? AND id > ?', test.id, parseInt(req.param('prev_question_id'))], order: 'id ASC'}).success(function(tp) {
						if(tp.length > 0) {
							db.Problem.find({ where: ['"id" = ?', tp[0].ProblemId]}).success(function(question) {
								db.Answer.findAll({ where: ['"ProblemId" = ?', tp[0].ProblemId]}).success(function(answers) {
									var ext = get_file_extension(question);	
									res.render('content/show_test_question', {score: tp[0].positiveScore, ext: ext, problem_index: test_problem_count - tp.length + 1, test_problem_count: test_problem_count, duration: req.param('duration'), second_duration: req.param('second_duration'), message: null, test_id: test.id, question: question, answers: answers, mandatory: tp[0].isMandatory});
								});
							});
						} else {
							res.redirect('/content/show_content_test_report_details/'+test.id+'/null');
						}
						
					});
				}
			});
		});
	},
	
	//create new content
	upload: function(req, res) {
		tags.length = 0;
		res.render('content/upload');
	},
	
	//show content preview before upload
	//called from content/upload.ejs
	show_content_preview_before_upload: function(req, res) {
		
		function preview(name, path)
		{
			this.name = name;
			this.path = path;
		}
		
		var content = {};
		
		var render = function() {
			res.render('content/show_preview', {content: content, id: null, val: null, display: 'false'});
		};
		
		content = new preview('',req.param('filename'));
		render();
	},
	
	//create new content
	do_upload: function(req, res) {
		var create_content = function() {
			var pattern = /^\d+$/; //ensure 'hours' param is of type int
			if(req.param('hours') == null || req.param('hours') == 'null') {
				req.body.hours = 1;
			} else if(!pattern.test(req.param('hours'))) {
				req.body.hours = 1;
			}
			db.Content.create(req.body).success(function(content) {
				var set_tags = function(j) {
					if(j == tags.length) {
						req.flash('info', "Content created");
						var url = '/content/edit_content/'+content.id;
						res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
					} else {
						db.Tag.findOrCreate({name: tags[j]}).success(function(tag) {
							content.addTag(tag).success(function() {
								set_tags(++j);
							});
						});
					}
				};
				set_tags(0);
			}).error(function(errors) {
				console.log("Error 2", errors);
				res.redirect('/dashboard');
			});
		};
		
		if(req.param('upload') == 'file' && req.files.content != null && req.files.content.originalFilename != null && req.files.content.originalFilename != '' && req.files.content.originalFilename != 'null') {
		    var fullPath = req.files.content.path;
		    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
			var ext = fullPath.substring(startIndex);
			if (ext.indexOf('\.') === 0 ) {
				ext = ext.substring(1);
			}
			console.log("FILE EXTENSION: ", ext);
			
			var delete_file_from_temp_location = function(newPath) {
				fs.unlink(req.files.content.path, function() { //delete file from temporary location
			    	req.body.path = newPath;
					create_content();
			    	
			  	});
			};
			
			if(ext == 'zip') { //used for zip files generated from adobe captivate. the zip files contains various folders along with a .html file. The .html file needs to be rendered
				// START ADM_ZIP
			    var zip = new AdmZip(req.files.content.path);
			    //var zipEntries = zip.getEntries(); // an array of ZipEntry records
			    var __parentDir = path.dirname(module.parent.filename);
				var newPath = __parentDir + '/uploads/'+req.param('name');
				zip.extractAllTo(/*target path*/newPath, /*overwrite*/true);
			    //END ADM_ZIP
			    
			    delete_file_from_temp_location(req.protocol + '://' + req.get('host') + '/' + req.param('name') + '/index.html');
			} else {
				fs.readFile(req.files.content.path, function (err, data) {
					var __parentDir = path.dirname(module.parent.filename);
					var newPath = __parentDir + '/uploads/'+req.files.content.name;
					fs.writeFile(newPath, data, function (err) { //write file to new path
						delete_file_from_temp_location(req.protocol + '://' + req.get('host') + '/' + req.files.content.name);
					});
				});
			}
		} else if(req.param('upload') == 'path' && req.param('path') != null && req.param('path') != '' && req.param('path') != 'null') {
			create_content();
		} else {
			req.flash('info', "Please upload a file or enter the path"); 
		    res.redirect('/content/upload');
		}
	},
	
	//show content tags during auto-complete
	get_tags: function(req, res) {
		var result = [];
		db.Tag.findAll({ where: ['"name" LIKE ?', '%'+req.param('q')+'%'] }).success(function(tags) {
			
			tags.forEach(function (tag, i) {
                result[i] = {};
                result[i].value = tag.id;
                result[i].label = tag.name;
              });
			res.send(result, {
	            'Content-Type': 'text/plain'
	         }, 200);
			
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	show_tag: function(req, res) {
		res.render('content/show_tag', {tags: tags});
	},
	
	add_tag: function(req, res) {
		db.Tag.findOrCreate({name: req.param('tag_name')}).success(function(tag, created) {
			var pos = -1;
			pos = tags.indexOf(req.param('tag_name'));
			if(pos == -1)
				tags.push(req.param('tag_name'));
			res.redirect('content/show_tag');
		});
	},
	
	remove_tag: function(req, res) {
		var pos = tags.indexOf(req.param('tag_name'));
		tags.splice(pos,1);
		res.redirect('content/show_tag');
	},
	
	//used for content search filter
	//'val' param values are - tag, title, module, skill
	searchByField: function(req, res) {
		res.render('content/searchByField', {val: req.param('val')});
	},
	
	//used for module search filter
	//'val' param values are - title, skill
	searchByFieldModule: function(req, res) {
		res.render('content/searchByFieldModule', {val: req.param('val')});
	},
	
	//search content based on tags
	search_content: function(req, res) {
		var result = [];
		db.Tag.findAll({ where: ['"name" LIKE ?', '%'+req.param('q')+'%'] }).success(function(tags) {
			var get_tags = function(j) {
				if(j == tags.length) {
					res.send(result, {
			            'Content-Type': 'text/plain'
			         }, 200);
				} else {
					db.ContentTags.findAll({ where: {TagId: tags[j].id} }).success(function(contentTags) {
						var get_content = function(i) {
							if(i == contentTags.length) {
								get_tags(++j);
							} else {
								db.Content.find({ where: {id: contentTags[i].ContentId} }).success(function(content) {
									if(content) {
										result[j+i] = {};
										result[j+i].value = content.id;
										result[j+i].label = content.name;
									};
									get_content(++i);
						        });
							}
						};
						get_content(0);
					});
				}
			};
			get_tags(0);
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//show matching content based on tags (more than one tag)
	//called from searchByField(val) function in script.js which is called from content/searchByField.ejs
	list_content_by_tags: function(req, res) {
		var result = [];
		var k = 0;
		
		res.locals.limit = 10; //pagination variables
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Contents" where id in (select distinct c.id from "Contents" c, "ContentTags" ct, "Tags" t where ct."ContentId"=c.id and ct."TagId"=t.id and t.name LIKE \''+req.param('q')+'%\')';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        
	        db.Tag.findAll({ where: ['"name" LIKE ?', req.param('q')+'%'] }).success(function(tags) {
				var query2 = 'select * from "Contents" where id in (select distinct c.id from "Contents" c, "ContentTags" ct, "Tags" t where ct."ContentId"=c.id and ct."TagId"=t.id and t.name LIKE \''+req.param('q')+'%\') order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
				db.sequelize.query(query2, null, {raw: true}).success(function(result2){
					res.render('content/list_content_by_field', {url_string: 'list_content_by_tags', url_param: req.param('q'), content: result2, field: tags, val: 'tag'});
				});
			}).error(function(errors) {
				res.render({errors: errors});
			});
	    });
		
	},
	
	//show matching content based on single tag
	//called from content/searchByField.ejs
	list_content_by_tag: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Contents" where id in (select distinct c.id from "Contents" c, "ContentTags" ct, "Tags" t where ct."ContentId"=c.id and ct."TagId"=t.id and t.id = '+parseInt(req.param('tag_id'))+')';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        
	        db.Tag.find({where: {id: parseInt(req.param('tag_id'))}}).success(function(tag) {
	        	var field = [];
	        	field[0] = {};
	        	field[0] = tag;	
	        	var query2 = 'select * from "Contents" where id in (select distinct c.id from "Contents" c, "ContentTags" ct, "Tags" t where ct."ContentId"=c.id and ct."TagId"=t.id and t.id = '+parseInt(req.param('tag_id'))+') order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
				db.sequelize.query(query2, null, {raw: true}).success(function(result2){
					res.render('content/list_content_by_field', {url_string: 'list_content_by_tag', url_param: req.param('tag_id'), content: result2, field: field, val: 'tag'});
				});
	        });
	        
	    });
	},
	
	//show matching content based on titles (more than one title)
	//called from searchByField(val) function in script.js which is called from content/searchByField.ejs
	list_content_by_titles: function(req, res) {
		var result = [];
		var k = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Contents" where name LIKE \''+req.param('q')+'%\'';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        
	        var query2 = 'select * from "Contents" where name LIKE \''+req.param('q')+'%\' order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
			db.sequelize.query(query2, null, {raw: true}).success(function(result2){
				res.render('content/list_content_by_field', {url_string: 'list_content_by_titles', url_param: req.param('q'), content: result2, field: result2, val: 'title'});
			});
	    });
		
	},
	
	//show matching content based on single title
	//called from content/searchByField.ejs
	list_content_by_title: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Contents" where id = '+parseInt(req.param('tag_id'));
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        	
        	var query2 = 'select * from "Contents" where id = '+parseInt(req.param('tag_id'))+' order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
			db.sequelize.query(query2, null, {raw: true}).success(function(result2){
				res.render('content/list_content_by_field', {url_string: 'list_content_by_title', url_param: req.param('tag_id'), content: result2, field: result2, val: 'title'});
			});
	    });
	},
	
	//show matching content based on a single module
	//called from content/searchByField.ejs
	list_content_by_module: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Contents" where id in (select distinct c.id from "Contents" c, "ModuleContentPlaylists" mcpl, "Modules" m where mcpl."ContentId"=c.id and mcpl."ModuleId"=m.id and m.id = '+parseInt(req.param('tag_id'))+')';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        	
        	db.Module.find({where: ['id = ?', req.param('tag_id')]}).success(function(module) {
	        	var field = [];
	        	field[0] = {};
	        	field[0] = module
	        	var query2 = 'select * from "Contents" where id in (select distinct c.id from "Contents" c, "ModuleContentPlaylists" mcpl, "Modules" m where mcpl."ContentId"=c.id and mcpl."ModuleId"=m.id and m.id = '+parseInt(req.param('tag_id'))+') order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
				db.sequelize.query(query2, null, {raw: true}).success(function(result2){
					res.render('content/list_content_by_field', {url_string: 'list_content_by_module', url_param: req.param('tag_id'), content: result2, field: field, val: 'module'});
				});
			});
	    });
	},
	
	//show matching content based on modules (more than one module)
	//called from searchByField(val) function in script.js which is called from content/searchByField.ejs
	list_content_by_modules: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Contents" where id in (select distinct c.id from "Contents" c, "ModuleContentPlaylists" mcpl, "Modules" m where mcpl."ContentId"=c.id and mcpl."ModuleId"=m.id and m.name LIKE \''+req.param('q')+'%\')';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        	
        	db.Module.findAll({where: ['name LIKE ?', req.param('q')+'%']}).success(function(modules) {
	        	var query2 = 'select * from "Contents" where id in (select distinct c.id from "Contents" c, "ModuleContentPlaylists" mcpl, "Modules" m where mcpl."ContentId"=c.id and mcpl."ModuleId"=m.id and m.name LIKE \''+req.param('q')+'%\') order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
				db.sequelize.query(query2, null, {raw: true}).success(function(result2){
					res.render('content/list_content_by_field', {url_string: 'list_content_by_module', url_param: req.param('q'), content: result2, field: modules, val: 'module'});
				});
			});
	    });
	},
	
	//show matching content based on skills (more than one skill)
	//called from searchByField(val) function in script.js which is called from content/searchByField.ejs
	list_content_by_skills: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Contents" where id in (select distinct c.id from "Contents" c, "ModuleContentPlaylists" mcpl, "SkillModulePlaylists" smpl, "Skills" s where mcpl."ContentId"=c.id and mcpl."ModuleId"=smpl."ModuleId" and smpl."SkillId" = s.id and s.name LIKE \''+req.param('q')+'%\')';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        	
        	db.Skill.findAll({where: ['name LIKE ?', req.param('q')+'%']}).success(function(skills) {
	        	var query2 = 'select * from "Contents" where id in (select distinct c.id from "Contents" c, "ModuleContentPlaylists" mcpl, "SkillModulePlaylists" smpl, "Skills" s where mcpl."ContentId"=c.id and mcpl."ModuleId"=smpl."ModuleId" and smpl."SkillId" = s.id and s.name LIKE \''+req.param('q')+'%\') order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
				db.sequelize.query(query2, null, {raw: true}).success(function(result2){
					res.render('content/list_content_by_field', {url_string: 'list_content_by_skills', url_param: req.param('q'), content: result2, field: skills, val: 'skill'});
				});
			});
	    });
	},
	
	//show matching content based on single skill
	//called from content/searchByField.ejs
	list_content_by_skill: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Contents" where id in (select distinct c.id from "Contents" c, "ModuleContentPlaylists" mcpl, "SkillModulePlaylists" smpl, "Skills" s where mcpl."ContentId"=c.id and mcpl."ModuleId"=smpl."ModuleId" and smpl."SkillId" = s.id and s.id = '+parseInt(req.param('tag_id'))+')';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        	
        	db.Skill.find({where: ['id = ?', req.param('tag_id')]}).success(function(skill) {
	        	var field = [];
	        	field[0] = {};
	        	field[0] = skill;
	        	var query2 = 'select * from "Contents" where id in (select distinct c.id from "Contents" c, "ModuleContentPlaylists" mcpl, "SkillModulePlaylists" smpl, "Skills" s where mcpl."ContentId"=c.id and mcpl."ModuleId"=smpl."ModuleId" and smpl."SkillId" = s.id and s.id = '+parseInt(req.param('tag_id'))+') order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
				db.sequelize.query(query2, null, {raw: true}).success(function(result2){
					res.render('content/list_content_by_field', {url_string: 'list_content_by_skill', url_param: req.param('tag_id'), content: result2, field: field, val: 'skill'});
				});
			});
	    });
	},
	
	//show matching tags
	//called from content/searchByField.ejs
	search_content_by_tag: function(req, res) {
		var result = [];
		var q = req.param('q');
		var q1 = q.length > 1 ? q.charAt(0).toUpperCase() + q.slice(1) : q.toUpperCase();
		var qU = q.toUpperCase();
		var qL = q.toLowerCase();
		db.Tag.findAll({ where: ['"name" LIKE ? OR name LIKE ?', req.param('q')+'%', q1+'%'] }).success(function(tags) {
			var get_tags = function(j) {
				if(j == tags.length) {
					res.send(result, {
			            'Content-Type': 'text/plain'
			         }, 200);
				} else {
					result[j] = {};
					result[j].value = tags[j].id;
					result[j].label = tags[j].name;
					get_tags(++j);
				}
			};
			get_tags(0);
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//show matching titles
	//called from content/searchByField.ejs
	search_content_by_title: function(req, res) {
		var result = [];
		db.Content.findAll({ where: ['"name" LIKE ?', req.param('q')+'%'] }).success(function(contents) {
			var get_content = function(i) {
				if(i == contents.length) {
					res.send(result, {
			            'Content-Type': 'text/plain'
			         }, 200);
				} else {
					result[i] = {};
					result[i].value = contents[i].id;
					result[i].label = contents[i].name;
					get_content(++i);
			    }
			};
			get_content(0);
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//show matching modules
	//called from content/searchByField.ejs
	search_content_by_module: function(req, res) {
		var result = [];
		db.Module.findAll({ where: ['"name" LIKE ?', req.param('q')+'%'] }).success(function(contents) {
			var get_content = function(i) {
				if(i == contents.length) {
					res.send(result, {
			            'Content-Type': 'text/plain'
			         }, 200);
				} else {
					result[i] = {};
					result[i].value = contents[i].id;
					result[i].label = contents[i].name;
					get_content(++i);
			    }
			};
			get_content(0);
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//show matching skills
	//called from content/searchByField.ejs
	search_content_by_skill: function(req, res) {
		var result = [];
		db.Skill.findAll({ where: ['"name" LIKE ?', req.param('q')+'%'] }).success(function(contents) {
			var get_content = function(i) {
				if(i == contents.length) {
					res.send(result, {
			            'Content-Type': 'text/plain'
			         }, 200);
				} else {
					result[i] = {};
					result[i].value = contents[i].id;
					result[i].label = contents[i].name;
					get_content(++i);
			    }
			};
			get_content(0);
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//show matching skills for module search
	//called from content/searchByFieldModule.ejs
	search_module_by_skill: function(req, res) {
		var result = [];
		db.Skill.findAll({ where: ['"name" LIKE ?', req.param('q')+'%'] }).success(function(contents) {
			var get_content = function(i) {
				if(i == contents.length) {
					res.send(result, {
			            'Content-Type': 'text/plain'
			         }, 200);
				} else {
					result[i] = {};
					result[i].value = contents[i].id;
					result[i].label = contents[i].name;
					get_content(++i);
			    }
			};
			get_content(0);
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//show matching titles for module search
	//called from content/searchByFieldModule.ejs
	search_module_by_title: function(req, res) {
		var result = [];
		db.Module.findAll({ where: ['"name" LIKE ?', req.param('q')+'%'] }).success(function(contents) {
			var get_content = function(i) {
				if(i == contents.length) {
					res.send(result, {
			            'Content-Type': 'text/plain'
			         }, 200);
				} else {
					result[i] = {};
					result[i].value = contents[i].id;
					result[i].label = contents[i].name;
					get_content(++i);
			    }
			};
			get_content(0);
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//show matching modules based on title
	//called from content/skill_playlist.ejs while building a playlist
	search_module: function(req, res) {
		var result = [];
		db.Module.findAll({ where: ['"name" LIKE ?', '%'+req.param('q')+'%'] }).success(function(modules) {
				var get_module = function(i) {
					if(i == modules.length) {
						res.send(result, {
				            'Content-Type': 'text/plain'
				         }, 200);
					} else {
						result[i] = {};
						result[i].value = modules[i].id;
						result[i].label = modules[i].name;
						get_module(++i);
				    }
				};
				get_module(0);
			
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	//show matching modules based on skills
	//paginated view
	//called from searchByFieldModule(val) in script.js which is called from content/searchByFieldModule.ejs
	list_module_by_skills: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Modules" where id in (select distinct m.id from "Modules" m, "SkillModulePlaylists" smpl, "Skills" s where m."id"=smpl."ModuleId" and smpl."SkillId" = s.id and s.name LIKE \''+req.param('q')+'%\')';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        	
        	db.Skill.findAll({where: ['name LIKE ?', req.param('q')+'%']}).success(function(skills) {
	        	var query2 = 'select * from "Modules" where id in (select distinct m.id from "Modules" m, "SkillModulePlaylists" smpl, "Skills" s where m."id"=smpl."ModuleId" and smpl."SkillId" = s.id and s.name LIKE \''+req.param('q')+'%\') order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
				db.sequelize.query(query2, null, {raw: true}).success(function(result2){
					res.render('content/list_module_by_field', {url_string: 'list_module_by_skills', url_param: req.param('q'), content: result2, field: skills, val: 'skill'});
				});
			});
	    });
	},
	
	//show matching modules based on single skill
	//called from content/searchByFieldModule.ejs
	list_module_by_skill: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Modules" where id in (select distinct m.id from "Modules" m, "SkillModulePlaylists" smpl, "Skills" s where m."id"=smpl."ModuleId" and smpl."SkillId" = s.id and s.id = '+parseInt(req.param('tag_id'))+')';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        	
        	db.Skill.find({where: ['id = ?', req.param('tag_id')]}).success(function(skill) {
	        	var field = [];
	        	field[0] = {};
	        	field[0] = skill;
	        	var query2 = 'select * from "Modules" where id in (select distinct m.id from "Modules" m, "SkillModulePlaylists" smpl, "Skills" s where m."id"=smpl."ModuleId" and smpl."SkillId" = s.id and s.id = '+parseInt(req.param('tag_id'))+') order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
				db.sequelize.query(query2, null, {raw: true}).success(function(result2){
					res.render('content/list_module_by_field', {url_string: 'list_module_by_skill', url_param: req.param('tag_id'), content: result2, field: field, val: 'skill'});
				});
			});
	    });
	},
	
	//show matching modules based on titles
	//paginated view
	//called from searchByFieldModule(val) in script.js which is called from content/searchByFieldModule.ejs
	list_module_by_titles: function(req, res) {
		var result = [];
		var k = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Modules" where name LIKE \''+req.param('q')+'%\'';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        
	        var query2 = 'select * from "Modules" where name LIKE \''+req.param('q')+'%\' order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
			db.sequelize.query(query2, null, {raw: true}).success(function(result2){
				res.render('content/list_module_by_field', {url_string: 'list_module_by_titles', url_param: req.param('q'), content: result2, field: result2, val: 'title'});
			});
	    });
		
	},
	
	//show matching modules based on single title
	//called from searchByFieldModule(val) in script.js which is called from content/searchByFieldModule.ejs
	list_module_by_title: function(req, res) {
		var result = [];
		var j = 0;
		
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		var query1 = 'select count(*) from "Modules" where id = '+parseInt(req.param('tag_id'));
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
	        res.locals.total = result1[0].count;
	        res.locals.pages =  Math.ceil(result1[0].count / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        	
        	var query2 = 'select * from "Modules" where id = '+parseInt(req.param('tag_id'))+' order by id asc offset '+res.locals.offset+' limit '+res.locals.limit;
			db.sequelize.query(query2, null, {raw: true}).success(function(result2){
				res.render('content/list_module_by_field', {url_string: 'list_module_by_title', url_param: req.param('tag_id'), content: result2, field: result2, val: 'title'});
			});
	    });
	},
	
	//deprecated
	ajax_load: function(req, res) {
		switch(req.param('option')) {
			case 'skill':
				break;
			case 'module':
				db.SkillModulePlaylist.findAll({ where: { SkillId: parseInt(req.param('id1')) } }).success(function(pl) { 
					function playlist(id, name, description)
					{
						this.id = id;
						this.name=name;
						this.description=description;
					}
					var playlists = new Array();
					var build_playlist = function(i) {
						if(i == pl.length) {
							res.render('content/ajax_load', {items: playlists, val: req.param('val'), option: req.param('option')});
						} else {
							db.Module.find({ where: { id: pl[i].ModuleId } }).success(function(m) {
								if(m) playlists.push(new playlist(m.id, m.name, m.description));
								build_playlist(++i);
							});
						}
					};
					build_playlist(0);
				});
				break;
			case 'content':
				db.ModuleContentPlaylist.findAll({ where: { ModuleId: parseInt(req.param('id1')) } }).success(function(pl) { 
					function playlist(id, name, description)
					{
						this.id = id;
						this.name=name;
						this.description=description;
					}
					var playlists = new Array();
					var build_playlist = function(i) {
						if(i == pl.length) {
							res.render('content/ajax_load', {items: playlists, val: req.param('val'), option: req.param('option')});
						} else {
							db.Content.find({ where: { id: pl[i].ContentId } }).success(function(m) {
								if(m) playlists.push(new playlist(m.id, m.name, m.description));
								build_playlist(++i);
							});
						}
					};
					build_playlist(0);
				});
		}
	},
	
	//was used one-time
	//when we did the ssl certification
	//initially youtube links where http, and they didn't load on https
	//so this piece of code was written to update content links from http to https
	update_content_to_https: function(req, res) {
		/*db.Content.findAll({ where: ['"path" LIKE ? OR path LIKE ?', '%localhost%', '%talentify.in%'] }).success(function(content) {
			var update_content = function(i) {
				if(i == content.length) {
					res.redirect('/content/list_content');
				} else {
					db.Content.find({where: {id: content[i].id}}).success(function(c){
						var index = c.path.indexOf('3000');
						if(index > -1) {
							var str = c.path.substring(index+5);
							c.updateAttributes({path: 'https://talentify.in:4000/'+str}).success(function(){
								update_content(++i);
							});
						} else {
							update_content(++i);
						}
					});
				}
			};
			update_content(0);
		});*/
		db.Content.findAll({ where: ['"path" LIKE ? OR path LIKE ?', ' http%', 'http%'] }).success(function(content) {
			var update_content = function(i) {
				if(i == content.length) {
					res.redirect('/content/list_content');
				} else {
					db.Content.find({where: {id: content[i].id}}).success(function(c){
						var str = c.path.substring(7);
						c.updateAttributes({path: 'https://'+str}).success(function(){
							update_content(++i);
						});
					});
				}
			};
			update_content(0);
		});
	},
	
	//incomplete code
	delete_content: function(req, res) {
		db.ModuleContent.Playlist.find({where: {id: parseInt(req.param('content_id'))}}).success(function(mcpl) {
			if(mcpl) {
				//to be updated
			} else {
				//to be updated
			}
		});
	},
	
	//called from content/edit_answers_ajax.ejs
	delete_answer_ajax: function(req, res) {
		var render = function(problem_id, message) {
			var url1 = null, url2 = null;
			url1 = '/content/edit_answers_ajax/'+problem_id+'/'+req.param('test_id');
			if(message == null)
				url2 = '/content/do_delete';
			res.render('content/delete_middleware', {id: req.param('answer_id'), message: message, url1: url1, url2: url2, val: 'answer', div: req.param('div')});
		};
		delete_answer(req.param('answer_id'), render);
	},
	
	//called from content/edit_answer.ejs
	delete_answer: function(req, res) {
		var render = function(problem_id, message) {
			var url1 = null, url2 = null;
			url1 = '/content/edit_question/'+problem_id;
			if(message == null)
				url2 = '/content/do_delete';
			res.render('content/delete_middleware', {id: req.param('answer_id'), message: message, url1: url1, url2: url2, val: 'answer', div: req.param('div')});
		};
		delete_answer(req.param('answer_id'), render);
	},
	
	//delete middleware called from the above and below delete functions
	do_delete: function(req, res) {
		var deebee = null;
		
		var render = function() {
			res.render('iframe_middleware', {url: req.param('url1'), div : req.param('div')});
		};
		
		var delete_object = function(val, id, callback) {
			switch(val) {
				case 'answer'		: 	deebee = db.Answer; 	
										//function written in the beginning of this page
										delete_record(deebee, id, callback);	
										break;
				
				case 'problem' 		:	deebee = db.Problem;	
										db.ProblemTags.findAll({where: {ProblemId: parseInt(req.param('id'))}}).success(function(pt) {
											var delete_problem_tags = function(i) {
												if(i == pt.length) {
													db.TestProblems.findAll({where: {ProblemId: parseInt(req.param('id'))}}).success(function(tp) {
														var delete_test_problems = function(j) {
															if(j == tp.length) {
																db.Answer.findAll({where: {ProblemId: parseInt(req.param('id'))}}).success(function(answers) {
																	var delete_answers = function(k) {
																		if(k == answers.length) {
																			delete_record(deebee, req.param('id'), render);	
																		} else {
																			delete_object('answer', answers[k].id, delete_problem);
																			answers[k].destroy().success(function() {
																				delete_answers(++k);
																			});
																		}
																	};
																	delete_answers(0);
																});
															} else {
																tp[j].destroy().success(function() {
																	delete_test_problems(++j);
																});
															}
														};
														delete_test_problems(0);
													});
												} else {
													pt[i].destroy().success(function() {
														delete_problem_tags(++i);
													});
												}
											};
											delete_problem_tags(0);
										});
										break;
										
				case 'test':			deebee = db.Test;
										break;
										
				case 'module':			deebee = db.Module;
										break;
										
				case 'skill':			deebee = db.Skill;
										break;
			}		
		};
		delete_object(req.param('val'), req.param('id'), render);
	},
	
	delete_problem: function(req, res) {
		var url1 = '/problem/list_questions'; 
		delete_problem(req.param('problem_id'), url1, req.param('div'), res, render_for_delete_problem);
	},
	
	delete_problem_ajax: function(req, res) {
		var url1 = '/content/edit_test/'+req.param('test_id');
		delete_problem(req.param('problem_id'), url1, req.param('div'), res, render_for_delete_problem);
	},
	
	delete_test: function(req, res) {
		var url1 = null;
		
		switch(req.param('val')) {
			case 'content':		url1 = '/content/edit_content/'+req.param('id');	break;
			case 'module':		url1 = '/content/module_playlist/'+req.param('id');	break;
			case 'skill':		url1 = '/content/skill_playlist/'+req.param('id');	break;
			case 'test':		url1 = '/test/list_tests';							break;
		}
		
		var message = null;
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test) {
			var render = function(msg) {
				var url2 = null;
				if(msg == null)
					url2 = '/content/do_delete';
				res.render('content/delete_middleware', {id: test_id, message: msg, url1: url1, url2: url2, val: 'test', div: div});
			};
			db.ReportDetail.find({where: {TestId: test.id}}).success(function(rd) {
				if(rd) {
					message = 'Sorry! You cannot delete this test';
					render(message);
				} else {
					db.RoleTest.find({where: {TestId: test.id}}).success(function(rt) {
						if(rt) {
							message = 'Sorry! You cannot delete this test';
							render(message);
						} else {
							db.StepTest.find({where: {TestId: test.id}}).success(function(st) {
								if(st) {
									message = 'Sorry! You cannot delete this test';
									render(message);
								} else {
									db.EventTest.find({where: {TestId: test.id}}).success(function(et) {
										if(et) {
											message = 'Sorry! You cannot delete this test';
											render(message);
										} else {
											db.ContentTest.find({where: {TestId: test.id}}).success(function(ct) {
												if(ct) {
													message = 'Sorry! You cannot delete this test';
													render(message);
												} else {
													db.ModuleTest.find({where: {TestId: test.id}}).success(function(mt) {
														if(mt) {
															message = 'Sorry! You cannot delete this test';
															render(message);
														} else {
															db.SkillTest.find({where: {TestId: test.id}}).success(function(skt) {
																if(skt) {
																	message = 'Sorry! You cannot delete this test';
																	render(message);
																} else {
																	message = null;
																	render(message);	
																}
															});
														}
													});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		});
	}	
};