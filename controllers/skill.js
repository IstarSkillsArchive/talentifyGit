var db = require('../models')
;

module.exports = {
		
	list_skills: function(req, res) {
		db.Skill.findAll({offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC'}).success(function(skills) {
			res.render('content/list_skills', {skills: skills, successFlash: req.flash('info')[0]});
		}).error(function(error) {
			console.log('Error', error);
			res.redirect('/dashboard');
		});
	},
	
	new_skill: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		res.render('content/new_skill', {successFlash: successFlash});
	},
	
	do_create_skill: function(req, res) {
		db.Skill.findOrCreate({name: req.param('name')},{description: req.param('description')}).success(function(skill, created) {
			if(created)
				req.flash('info', "Skill "+skill.name+" created");
			else
				req.flash('info', "Skill "+skill.name+" already exists");
			res.redirect('/content/new_skill');
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/dashboard');
		});
	},
	
	map_skills: function(req, res) {
		db.Role.find({ where: { id: parseInt(req.param('role_id'))}, include: [db.Organization, db.Skill] }).success(function(role) {
			db.User.find({ where: { id: req.user.id} , include: [db.Organization]}).success(function(hr) {
				res.render('hr_admin/map_skills', {hr: hr, user_id: req.param('user_id'), role: role, successFlash: req.flash('info')[0]});
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/dashboard');
		});
	},
	
	get_skills: function(req, res) {
		var result = [];
		db.Skill.findAll({ where: ['"name" LIKE ?', '%'+req.param('q')+'%'] }).success(function(skills) {
			
			skills.forEach(function (skill, i) {
                result[i] = {};
				result[i].value = skill.id;
				result[i].label = skill.name;
              });
			res.send(result, {
	            'Content-Type': 'text/plain'
	         }, 200);
			
		}).error(function(errors) {
			res.render({errors: errors});
		});
	},
	
	view_skills: function(req, res) {
		var result = [];
		db.Role.find({ where: {id: req.param('role_id')}, include: [db.Skill] }).success(function(role) {
			res.render('hr_admin/view_skills', {skills: role.skills});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('hr_admin/view_skills', {errors: errors});
		});
	},
	
	list_skill_groups: function(req, res) {
		db.SkillGroup.findAll({offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC'}).success(function(skills) {
			res.render('content/list_skill_groups', {skills: skills, successFlash: req.flash('info')[0]});
		}).error(function(error) {
			console.log('Error', error);
			res.redirect('/dashboard');
		});
	},
	
	new_skill_group: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		
		res.render('content/new_skill_group', {successFlash: successFlash});
	},
	
	do_create_skill_group: function(req, res) {
		db.SkillGroup.findOrCreate({name: req.param('name')},{description: req.param('description')}).success(function(skill, created) {
			if(created)
				req.flash('info', "Skill Group "+skill.name+" created");
			else
				req.flash('info', "Skill Group "+skill.name+" already exists");
			var url = '/content/add_skills_to_skill_groups/'+skill.id;
			res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/dashboard');
		});
	},
	
	map_skills_groups: function(req, res) {
		db.Skill.find({ where: { id: req.param('skill_id')}}).success(function(skill) {
			res.render('content/map_skills_groups', {skill: skill, successFlash: req.flash('info')[0]});
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/dashboard');
		});
	},
	
	add_skills_to_skill_groups: function(req, res) {
		db.SkillGroup.find({ where: { id: parseInt(req.param('skill_group_id'))}, include: [db.Skill]}).success(function(skill_group) {
			res.render('content/add_skills_to_skill_groups', {skill_group: skill_group, successFlash: req.flash('info')[0]});
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/dashboard');
		});
	},
	
	do_map_skill_to_skill_group: function(req, res) {
		db.Skill.find({where: {id: parseInt(req.param('skill-id'))}}).success(function(skill) { 
			var render = function() {
				var url = '/content/add_skills_to_skill_groups/'+req.param('skill_group_id');
				res.render('iframe_middleware', {url: url, div: 'content-admin-display'});
			};
			if(skill) {
				db.SkillGroupSkills.findOrCreate({SkillId: skill.id, SkillGroupId: parseInt(req.param('skill_group_id'))}).success(function(sgs, created) { 
					render();	
				});
			} else
				render();
		});
	},
	
	delete_skill_from_skill_group: function(req, res) {
		db.SkillGroupSkills.find({ where: ['"SkillId" = ? and "SkillGroupId" = ?', req.param('skill_id'), req.param('skill_group_id')] }).success(function(sg) {
			sg.destroy().success(function() {
				req.flash('info', "Skill deleted from Skill Group");
				res.redirect('/content/add_skills_to_skill_groups/'+req.param('skill_group_id'));
			});
		});
	},
	
	do_map_skill_to_role: function(req, res) {
		db.User.find({where: {id: parseInt(req.user.id)}}).success(function(hr) {
			db.Skill.find({where: {id: parseInt(req.param('skill_id'))}}).success(function(skill) { 
				
				//console.log("Skill ", skill.values); 
				//console.log("Created Skill ", created); 
				var message = null;
				db.RoleSkills.findOrCreate({SkillId: parseInt(req.param('skill_id')), RoleId: parseInt(req.param('role_id'))}).success(function(rs, created) { 
					
					if(created) {
						message = "Added skill to role";
					}
					else {
						message = "Role already contains this skill";
					}
					
					if(created) {
						db.Role.find({ where: { id : parseInt(req.param('role_id')) } }).success(function(role) {
							db.User.findAll({ where: ['"RoleId" = ? AND "OrganizationId" = ?', role.id, hr.OrganizationId] }).success(function(users) {
								var update_user_skills = function(i) {
									if(i == users.length) {
										res.redirect('/hr_admin/get_skills_for_role/'+req.param('role_id'));
									} else {
										db.UserSkills.findOrCreate({SkillId: skill.id, UserId: users[i].id}).success(function(us, created) {
											db.SkillModulePlaylist.find({where: ['"SkillId" = ? AND "PrevModuleId" ISNULL', skill.id]}).success(function(smpl){
												if(smpl){
													us.updateAttributes({ModuleId: smpl.ModuleId}).success(function(){
														db.ModuleContentPlaylist.find({where: ['"ModuleId" = ? AND "PrevContentId" ISNULL', smpl.ModuleId]}).success(function(mcpl){
															if(mcpl) {
																us.updateAttributes({ContentId: mcpl.ContentId}).success(function(){
																	update_user_skills(++i);
																});
															} else {
																update_user_skills(++i);
															}
														});
													});
												} else {
													update_user_skills(++i);
												}
											});
										});
									}
								};
								update_user_skills(0);
							});
						});
					} else {
						res.redirect('/hr_admin/get_skills_for_role/'+req.param('role_id'));
					}
					
				}).error(function(errors) {
					console.log("Error", errors);
					res.redirect('/hr_admin/dashboard');
				});
				
			});
		});
	},
	
	delete_role_skill: function(req, res) {
			
		db.RoleSkills.find({ where: ['"RoleId" = ? AND "SkillId" = ?', parseInt(req.param('role_id')), parseInt(req.param('skill_id'))] }).success(function(roleSkill) {
			
			db.Role.find({ where: { id : parseInt(req.param('role_id')) } }).success(function(role) {
				db.User.findAll({ where: ['"RoleId" = ? AND permission = ?', role.id, 'user'] }).success(function(users) {
					var update_user_skills = function(i) {
						if(i == users.length) {
							roleSkill.destroy().success(function() {
								req.flash('info', "Role - Skill mapping deleted");
								res.redirect('/hr_admin/get_skills_for_role/'+req.param('role_id'));
							});
							
						} else {
							db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', users[i].id, parseInt(req.param('skill_id'))] }).success(function(us) {
								if(us) {
									us.destroy().success(function() {
										update_user_skills(++i); return;
									});
								} else {
									update_user_skills(++i); return;
								}
							});
						}
					};
					update_user_skills(0);
				});
			});
			
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/hr_admin/dashboard');
		});
		
	},
	
	map_skills_module: function(req, res) {
		db.Module.find({ where: { id: req.param('module_id')}, include: [db.Organization, db.Skill] }).success(function(module) {
			res.render('content/map_skills_module', {user_id: req.param('user_id'), module: module, successFlash: req.flash('info')[0]});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('content/dashboard', {errors: errors});
		});
	},
		
	do_map_skill_to_module: function(req, res) {
		
		db.Skill.findOrCreate({name: req.param('name')}).success(function(skill, created) { 
			
			console.log("Skill ", skill.values); 
			console.log("Created Skill ", created); 
			
			db.ModuleSkills.findOrCreate({SkillId: skill.id, ModuleId: req.param('module_id')}).success(function(ms, created) { 
				
				console.log("Modules-Skills ", ms.values); 
				console.log("Created Modules-Skills ", created);
				
				if(created)
					req.flash("info", "Created skill - "+skill.name);
				else
					req.flash("info", "Skill - "+skill.name+" already exists");
				
				res.redirect('/skill/map_skills_module/'+req.param('user_id')+'/'+req.param('module_id'));
			}).error(function(errors) {
				console.log("Error", errors);
				res.render('content/dashboard', {errors: errors});
			});
			
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('content/dashboard', {errors: errors});
		});
		
	},
	
	delete_module_skill: function(req, res) {
			
		db.ModuleSkills.find({ where: { SkillId : req.param('skill_id'), ModuleId : req.param('module_id') } }).success(function(moduleSkill) {
			moduleSkill.destroy().success(function() {
				req.flash('info', "Module - Skill mapping deleted");
				res.redirect('/skill/map_skills_module/'+req.param('user_id')+'/'+req.param('module_id'));
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('content/dashboard', {errors: errors});
		});
		
	},
	
	get_modules_for_skill: function(req, res) {
		db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', req.user.id, req.param('skill_id')] }).success(function(userSkill) {
			db.Content.find({ where: { id : userSkill.ContentId}}).success(function(content) {
				if(content) {
					//db.Question.find({ where: ['"ContentId" = ? AND PrevQuestionId IS NULL', content.id]}).success(function(question) {
						res.render('module', {skill_id: req.param('skill_id'), content: content, current_question_id: userSkill.QuestionId});
					//});
				}
				else {
					req.flash('info',"No content available for this skill");
					res.redirect("/users/gym/"+req.user.id);
				}
			}).error(function(errors) {
				console.log("Error", errors);
				res.redirect('/dashboard');
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/dashboard');
		});;		
	},
	
	get_modules_for_skill_ajax: function(req, res) {
		db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', req.user.id, req.param('skill_id')] }).success(function(userSkill) {
			db.Content.find({ where: { id : userSkill.ContentId}}).success(function(content) {
				if(content) {
					//db.Question.find({ where: ['"ContentId" = ? AND PrevQuestionId IS NULL', content.id]}).success(function(question) {
						res.render('module_turbo_ajax', {skill_id: req.param('skill_id'), content: content});
					//});
				}
				else {
					req.flash('info',"No content available for this skill");
					res.redirect("/users/gym/"+req.user.id);
				}
			}).error(function(errors) {
				console.log("Error", errors);
				res.redirect('/dashboard');
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/dashboard');
		});		
	}
	
//	get_modules_for_skill: function(req, res) {
//		db.ModuleSkills.find({ where: { SkillId : req.param('skill_id')} }).success(function(module) {
//			if(module) {
//				db.ContentModules.find({ where: { ModuleId: module.ModuleId} }).success(function(contentModule) {
//					if(contentModule) {
//						db.Content.find({ where: { id : contentModule.ContentId}, include: [db.Module]}).success(function(content) {
//							if(content) {
//								db.Question.find({ where: { ContentId : content.id}}).success(function(question) {
//									res.render('module', {content: content, question: question});
//								});
//							}
//							else {
//								req.flash('info',"No content available for this skill");
//								res.redirect("/users/gym/"+req.user.id);
//							}
//						}).error(function(errors) {
//							console.log("Error", errors);
//							res.redirect('/dashboard');
//						});
//					}else {
//						req.flash('info',"No module available for this skill");
//						res.redirect("/users/gym/"+req.user.id);
//					}
//				}).error(function(errors) {
//					console.log("Error", errors);
//					res.redirect('/dashboard');
//				});
//			}else {
//				req.flash('info',"No content available for this skill");
//				res.redirect("/users/gym/"+req.user.id);
//			}
//		}).error(function(errors) {
//			console.log("Error", errors);
//			res.redirect('/dashboard');
//		});
//	}

};