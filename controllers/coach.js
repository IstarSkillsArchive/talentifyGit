var db = require('../models');

/*var completedModules = new Array();
var totalModules = new Array();

var get_module_count = function(z, userSkill) {
	
	db.Skill.find({ where: ['"id" = ?', userSkill.SkillId] }).success(function(skill) { 
		db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', userSkill.SkillId] }).success(function(tm) { 
			completedModules[z] = 0;
			totalModules[z] = tm;
			var get_completed_modules = function(i, id) {
				db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', id] }).success(function(module) {
					if(module == null || module.PrevModuleId == null) {
						completedModules[z] = i;
						get_module_count_next(z+1);
					} else {
						get_completed_modules(++i, module.PrevModuleId);
					}
				});
			};
			
			db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', userSkill.ModuleId] }).success(function(module) { 
				if(userSkill.status == 'complete') {//completed all modules
					completedModules[z] = totalModules[z];
					get_module_count_next(z+1);
				} else if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
					get_module_count_next(z+1);
				} else {
					get_completed_modules(1, module.PrevModuleId);
				}
			});
		});
	});
	
};*/

module.exports = {
		
	dashboard: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		db.User.findAll({ where: { CoachId: parseInt(req.param('user_id'))}, include: [db.Organization, db.Role]}).success(function(users) { 
			var appointments_request = new Array();
			var appointments_confirm = new Array();
			
			function appointment(id, date, time, user_id, first_name, last_name, role, org)
			{
				this.id=id;
				this.date=date;
				this.time=time;
				this.user_id = user_id;
				this.first_name=first_name;
				this.last_name=last_name;
				this.role=role;
				this.org=org;
			}
			
			var get_user_details = function(id) {
				db.User.find({ where: { id: parseInt(id)}, include: [db.Role, db.Organization] }).success(function(user) {
					return user;
				});
			};
			
			var get_confirmed_appointments = function() {
				db.Appointment.findAll({ where: ['"CoachId" = ? AND "status" = \'confirm\'', parseInt(req.param('user_id'))] }).success(function(apps) { 
					var add_appointment = function(i) {
						if(i == apps.length) {
							res.render('coach/dashboard', {coach_id: req.param('user_id'), users: users, appointments_request: appointments_request, appointments_confirm: appointments_confirm, successFlash: successFlash});
						}else {
							db.User.find({ where: { id: apps[i].UserId}, include: [db.Role, db.Organization] }).success(function(user) {
								appointments_confirm[i] = new appointment(apps[i].id, apps[i].date, apps[i].time, user.id, user.first_name, user.last_name, user.role != null ? user.role.name : '', user.organization != null ? user.organization.name : '');
								add_appointment(++i);
							});
						}
					};
					add_appointment(0);
				});
			};
			
			var query;
			var get_requested_appointments = function() {
				query = 'select DISTINCT "UserId" from "Appointments" where "CoachId"='+parseInt(req.param('user_id'))+' AND "status" = \'request\'';
				db.sequelize.query(query, null, {raw: true}).success(function(apps){
					var add_appointment = function(i) {
						if(i == apps.length) {
							get_confirmed_appointments();
						}else {
							db.User.find({ where: { id: apps[i].UserId}, include: [db.Role, db.Organization] }).success(function(user) {
								appointments_request[i] = new appointment(apps[i].id, null, null, user.id, user.first_name, user.last_name, user.role != null ? user.role.name : '', user.organization != null ? user.organization.name : '');
								add_appointment(++i);
							});
						}
					};
					add_appointment(0);
				});
			};
			get_requested_appointments();
			
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/coach/dashboard/'+req.user.id);
		});
	},
	
	schedule_appointment: function(req, res) {
		db.User.find({ where: { id: req.param('user_id')}, include: [db.Role, db.Organization] }).success(function(user) {
			if(user) {
				db.User.find({ where: { id: user.CoachId}}).success(function(coach) {
					if(req.param('appointment_option') != null && req.param('appointment_option') != '') {
						db.Appointment.find({ where: { id: req.param('appointment_option')} }).success(function(old_appointment) {
							db.Appointment.findAll({ where: ['"CoachId" = ? AND "UserId" = ? AND "status" = \'request\'', req.param('coach_id'), req.param('user_id')] }).success(function(appointments) { 
								var delete_appointments = function(i) {
									if(appointments.length == i) {
										db.Appointment.create({UserId: user.id, CoachId: coach.id, option: 1, date: old_appointment.date, time: old_appointment.time, status: "confirm"}).success(function(appointment) {
											req.flash('info', 'Appointment Created');
											res.redirect('/coach/dashboard/'+req.user.id);
										});
									}else {
										appointments[i].destroy().success(function() {
											delete_appointments(++i);
										});
									}
								};
								delete_appointments(0);
							});
						});
					} else if(req.param('date_1') != null && req.param('date_1') != '' && req.param('time_1') != null && req.param('time_1') != '') {
						
						db.Appointment.findAll({ where: ['"CoachId" = ? AND "UserId" = ? AND ("status" = \'request\' OR "status" = \'confirm\')', req.param('coach_id'), req.param('user_id')] }).success(function(appointments) { 
							var delete_appointments = function(i) {
								if(appointments.length == i) {
									db.Appointment.create({UserId: user.id, CoachId: coach.id, option: 1, date: req.param('date_1'), time: req.param('time_1'), status: "confirm"}).success(function(appointment) {
										req.flash('info', 'Appointment Created');
										res.redirect('/coach/dashboard/'+req.user.id);
									});
								}else {
									appointments[i].destroy().success(function() {
										delete_appointments(++i);
									});
								}
							};
							delete_appointments(0);
						});
						
					}
				}).error(function(errors) {
					console.log("Error", errors);
					res.redirect('/coach/dashboard/'+req.user.id);
				});
			} else {
				res.redirect('/coach/dashboard/'+req.user.id);
			}
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/coach/dashboard/'+req.user.id);
		});
	},
	
	set_appointment: function(req, res) {
		db.Appointment.findAll({ where: ['"CoachId" = ? AND "UserId" = ? AND "status" = \'request\'', req.param('coach_id'), req.param('user_id')] }).success(function(appointments) { 
			res.render('coach/set_appointment', {appointments: appointments, coach_id: req.param('coach_id'), user_id: req.param('user_id')});
		}).error(function(errors) {
			res.send('There was an error while fetching appointments. Refresh the page and please try again!', {
	            'Content-Type': 'text/plain'
	         }, 200);
		});
	},
	
	gym: function(req, res) {
		var completedModules = new Array();
		var totalModules = new Array();
		
		var notes = [];
		
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		db.UserSkills.findAll({ where: { UserId: parseInt(req.param('user_id'))}}).success(function(userSkills) { 
			//START
			var get_module_count_next = function(x) {
				if(x == userSkills.length) {
					db.User.find({ where: { id: parseInt(req.param('user_id'))}, include: [db.Skill, db.Role, db.Organization]}).success(function(user) { 
		  				
						db.Appointment.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "status" = \'confirm\'', parseInt(req.param('coach_id')), parseInt(req.param('user_id'))]}).success(function(appointment) {
							res.render('coach/gym_new', {message: appointment.meetingName, link: req.param('link'), userSkills: userSkills, user: user, coach_id: req.param('coach_id'), completedModules: completedModules, totalModules: totalModules, notes: notes});
						});
						
		  			}).error(function(errors) {
						console.log("Error", errors);
						res.redirect('/coach/dashboard/'+req.user.id);
					});
				} else {
					db.CoachNotesHistory.findAll({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), userSkills[x].SkillId], order: 'id ASC' }).success(function(n) {
						notes[x] = {};
						notes[x].id = userSkills[x].SkillId;
						notes[x].notes = [];
						add_notes = function(y) {
							if(y == n.length) {
								db.Skill.find({ where: ['"id" = ?', userSkills[x].SkillId] }).success(function(skill) { 
									db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', userSkills[x].SkillId] }).success(function(tm) { 
										completedModules[x] = 0;
										totalModules[x] = tm;
										var get_completed_modules = function(i, id) {
											db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', id] }).success(function(module) {
												if(module == null || module.PrevModuleId == null) {
													completedModules[x] = i;
													get_module_count_next(x+1);
												} else {
													get_completed_modules(++i, module.PrevModuleId);
												}
											});
										};
										
										db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', userSkills[x].ModuleId] }).success(function(module) { 
											if(userSkills[x].status == 'complete') {//completed all modules
												completedModules[x] = totalModules[x];
												get_module_count_next(x+1);
											} else if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
												get_module_count_next(x+1);
											} else {
												get_completed_modules(1, module.PrevModuleId);
											}
										});
									});
								});
							}else {
								notes[x].notes[y] = {};
								notes[x].notes[y].notes = n[y].notes;
								notes[x].notes[y].id = n[y].id;
								add_notes(++y);
							}
						};
						add_notes(0);
					});
				}
			};
			get_module_count_next(0);
			//END
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/coach/dashboard/'+req.user.id);
		});
	},
	
	notes_prev: function(req, res) {
		var len = parseInt(req.param('len'));
		var curr = parseInt(req.param('curr'));
		if(len == 0){
			notes = {};
			res.render('coach/notes',{notes: notes, curr: curr, len: len});
		}
		if(curr > 1) {
			curr--;
			db.CoachNotesHistory.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ? AND "id" < ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), parseInt(req.param('skill_id')), parseInt(req.param('cnh_id'))], order: 'id DESC' }).success(function(notes) {
				res.render('coach/notes',{notes: notes, curr: curr, len: len});
			});
		}else{
			db.CoachNotesHistory.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ? AND "id" = ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), parseInt(req.param('skill_id')), parseInt(req.param('cnh_id'))], order: 'id DESC' }).success(function(notes) {
				res.render('coach/notes',{notes: notes, curr: curr, len: len});
			});
		}
	},
	
	notes_next: function(req, res) {
		var len = parseInt(req.param('len'));
		var curr = parseInt(req.param('curr'));
		if(len == 0){
			notes = {};
			res.render('coach/notes',{notes: notes, curr: curr, len: len}); return;
		}
		else if(curr < len) {
			curr++;
			db.CoachNotesHistory.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ? AND "id" > ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), parseInt(req.param('skill_id')), parseInt(req.param('cnh_id'))] }).success(function(notes) {
				res.render('coach/notes',{notes: notes, curr: curr, len: len}); return;
			});
		}else {
			db.CoachNotesHistory.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ? AND "id" = ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), parseInt(req.param('skill_id')), parseInt(req.param('cnh_id'))] }).success(function(notes) {
				res.render('coach/notes',{notes: notes, curr: curr, len: len}); return;
			});
		}
	},
	
	user_skills: function(req, res) {
		var completedModules = new Array();
		var totalModules = new Array();
		
		var notes = [];
		
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		db.UserSkills.findAll({ where: { UserId: parseInt(req.param('user_id'))}}).success(function(userSkills) { 
			//START
			var get_module_count_next = function(x) {
				if(x == userSkills.length) {
					db.User.find({ where: { id: parseInt(req.param('user_id'))}, include: [db.Skill, db.Role, db.Organization]}).success(function(user) { 
						res.render('coach/user_skills', {userSkills: userSkills, user: user, coach_id: req.param('coach_id'), completedModules: completedModules, totalModules: totalModules, notes: notes});
					}).error(function(errors) {
						console.log("Error", errors);
						res.redirect('/coach/dashboard/'+req.user.id);
					});
				} else {
					db.CoachNotesHistory.findAll({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), userSkills[x].SkillId] }).success(function(n) {
						notes[x] = {};
						notes[x].id = userSkills[x].SkillId;
						notes[x].notes = [];
						add_notes = function(y) {
							if(y == n.length) {
								db.Skill.find({ where: ['"id" = ?', userSkills[x].SkillId] }).success(function(skill) { 
									db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', userSkills[x].SkillId] }).success(function(tm) { 
										completedModules[x] = 0;
										totalModules[x] = tm;
										var get_completed_modules = function(i, id) {
											db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', id] }).success(function(module) {
												if(module == null || module.PrevModuleId == null) {
													completedModules[x] = i;
													get_module_count_next(x+1);
												} else {
													get_completed_modules(++i, module.PrevModuleId);
												}
											});
										};
										
										db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', userSkills[x].ModuleId] }).success(function(module) { 
											if(userSkills[x].status == 'complete') {//completed all modules
												completedModules[x] = totalModules[x];
												get_module_count_next(x+1);
											} else if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
												get_module_count_next(x+1);
											} else {
												get_completed_modules(1, module.PrevModuleId);
											}
										});
									});
								});
							}else {
								notes[x].notes[y] = {};
								notes[x].notes[y].notes = n[y].notes;
								notes[x].notes[y].id = n[y].id;
								add_notes(++y);
							}
						};
						add_notes(0);
						
					});
				}
			};
			get_module_count_next(0);
			//END
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/coach/dashboard/'+req.user.id);
		});
	},
	
	add_notes: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		res.render('coach/add_notes', {user_id: req.param('user_id'), coach_id: req.param('coach_id'), skill_id: req.param('skill_id'), successFlash: successFlash});
	},
	
	do_add_notes: function(req, res) {
		db.CoachNotesHistory.create({CoachId: parseInt(req.param('coach_id')), UserId: parseInt(req.param('user_id')), SkillId: parseInt(req.param('skill_id'))}).success(function(cnh) { 
			cnh.updateAttributes({date: new Date()}).success(function(){
				res.redirect('/coach/gym/'+cnh.CoachId+'/'+cnh.UserId+'/null');
			});
		});
	},	
	
	delete_notes: function(req, res) {
		db.CoachNotesHistory.find({ where: { id: parseInt(req.param('notes_id'))}}).success(function(note) { 
			var coach_id = note.CoachId;
			var user_id = note.UserId;
			note.destroy().success(function(){
				res.redirect('/coach/gym/'+coach_id+'/'+user_id+'/null');
			});
		});
	},
	
	edit_notes: function(req, res) {
		db.CoachNotesHistory.find({ where: { id: parseInt(req.param('notes_id'))}}).success(function(note) { 
			res.render('coach/edit_notes', {notes: note});
		});
	},
	
	do_edit_notes: function(req, res) {
		db.CoachNotesHistory.find({ where: { id: parseInt(req.param('notes_id'))}}).success(function(note) { 
			var coach_id = note.CoachId;
			var user_id = note.UserId;
			note.updateAttributes({notes: req.param('notes'), date: new Date()}).success(function(){
				res.redirect('/coach/gym/'+coach_id+'/'+user_id+'/null');
			});
		});
	},
	
	add_skill: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		db.User.find({ where: { id: req.param('user_id')}, include: [db.Skill]}).success(function(user) { 
			res.render('coach/add_skill', {user: user, coach_id: req.param('coach_id'), successFlash: successFlash});
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/coach/dashboard/'+req.user.id);
		});
	},
	
	do_add_skill: function(req, res) {
			db.Skill.findOrCreate({name: req.param('name')}).success(function(skill, created) { 
					
			db.UserSkills.findOrCreate({SkillId: skill.id, UserId: req.param('user_id')}).success(function(us, created) { 
				
				if(created) {
					req.flash("info", "Created skill - "+skill.name);
					db.SkillModulePlaylist.findAll({ where: ['"SkillId" = ?', parseInt(us.SkillId)] }).success(function(ms) {
						if(ms.length > 0) {
							var get_first_module = function(i) {
								db.SkillModulePlaylist.find({ where: ['"ModuleId" = ? AND "PrevModuleId" IS NULL', parseInt(ms[i].ModuleId)] }).success(function(m) {
									if(m){
										db.ModuleContentPlaylist.findAll({ where: ['"ModuleId" = ?', parseInt(m.ModuleId)] }).success(function(cm) {
											if(cm.length > 0) {
												var get_first_content = function(j) {
													db.ModuleContentPlaylist.find({ where: ['"ContentId" = ? AND "PrevContentId" IS NULL', parseInt(cm[j].ContentId)] }).success(function(c) {
														if(c){
															us.updateAttributes({"ModuleId":m.ModuleId, "ContentId": c.ContentId}).success(function() {
																res.redirect('/coach/add_skill/'+req.param('coach_id')+'/'+req.param('user_id'));
															});
														}else {
															get_first_content(++j);
														}
													});
												};
												get_first_content(0);
											} else {
												res.redirect('/coach/add_skill/'+req.param('coach_id')+'/'+req.param('user_id'));
											}
										});
									}else {
										get_first_module(++i);
									}
								});
							};
							get_first_module(0);
						} else {
							res.redirect('/coach/add_skill/'+req.param('coach_id')+'/'+req.param('user_id'));
						}
					});
				}
				else {
					req.flash("info", "Skill - "+skill.name+" already exists");
					res.redirect('/coach/add_skill/'+req.param('coach_id')+'/'+req.param('user_id'));
				}
			}).error(function(errors) {
				console.log("Error", errors);
				res.redirect('/coach/dashboard/'+req.user.id);
			});
			
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/coach/dashboard/'+req.user.id);
		});
	},
	
	delete_user_skill: function(req, res) {
		db.UserSkills.find({ where: ['"UserSkills"."SkillId" = ? AND "UserSkills"."UserId" = ?', parseInt(req.params.skill_id), parseInt(req.params.user_id)] }).success(function(us) {
			us.destroy().success(function() {
				req.flash('info', "User deleted");
				res.redirect('/coach/user_skills/'+req.user.id+'/'+req.param('user_id'));
			});
		});
	},
	
	reset_module: function(req, res) {
		db.SkillModulePlaylist.findAll({where: ['"SkillId" = ?', parseInt(req.param('skill_id'))]}).success(function(moduleSkills) {
			var modules = new Array();
			
			function module(id, name)
			{
				this.id=id;
				this.name=name;
			}
			
			var get_all_modules = function(i) {
				if(i == moduleSkills.length) {
					res.render('coach/reset_module', {modules: modules, skill_id: req.param('skill_id'), user_id: req.param('user_id')});
				} else {
					db.Module.find({where: {id: moduleSkills[i].ModuleId}}).success(function(m) {
						if(m) {
							modules[i] = new module(m.id, m.name);
						}
						get_all_modules(++i);
					});
				}
			};
			
			get_all_modules(0);
		});
	},
	
	do_reset_module: function(req, res) {
		db.UserSkills.find({where: ['"SkillId" = ? AND "UserId" = ?', parseInt(req.param('skill_id')), parseInt(req.param('user_id'))]}).success(function(us) {
			db.ModuleContentPlaylist.findAll({ where: ['"ModuleId" = ?', parseInt(req.param('module_id'))] }).success(function(cm) {
				var get_first_content = function(j) {
					if(j == cm.length) {
						console.log("################# REQ USER", req.user.id);
						res.redirect('/coach/user_skills/'+req.user.id+'/'+req.param('user_id'));
					} else {
						db.ModuleContentPlaylist.find({ where: ['"ContentId" = ? AND "PrevContentId" IS NULL', parseInt(cm[j].ContentId)] }).success(function(c) {
							if(c){
								us.updateAttributes({"ModuleId": cm[j].ModuleId, "ContentId": c.ContentId, status: null}).success(function() {
									res.redirect('/coach/user_skills/'+req.user.id+'/'+req.param('user_id'));
								});
							}else {
								get_first_content(++j);
							}
						});
					}
				};
				get_first_content(0);
			});
		});
	},
	
	coach_rating: function(req, res) {
		db.UserSkills.find({ where: ['"UserSkills"."SkillId" = ? AND "UserSkills"."UserId" = ?', parseInt(req.params.skill_id), parseInt(req.params.user_id)] }).success(function(us) { 
			if(us) {
				us.updateAttributes({rating: parseInt(req.param('rating'))}).success(function() {
					db.User.find({ where: ['"id" = ?', us.UserId] }).success(function(user) {
						db.CoachRatingHistory.create({SkillId: us.SkillId, UserId: us.UserId, CoachId: user.CoachId, rating: parseInt(req.param('rating')), date: new Date()}).success(function(crh, created) {
							res.render('coach/coach_rating', {us: us});
						});
					});
				}).error(function(errors) {
					console.log("Error", errors);
					res.redirect('/coach/gym/'+req.param('coach_id')+'/'+req.param('user_id')+'/null');
				});
			}
			else
				res.redirect('/coach/gym/'+req.param('coach_id')+'/'+req.param('user_id')+'/null');
			
		}).error(function(errors) {
			console.log("Error", errors);
			res.redirect('/coach/dashboard/'+req.user.id);
		});
	},
	
	coach_level: function(req, res) {
		db.UserSkills.find({ where: ['"UserSkills"."SkillId" = ? AND "UserSkills"."UserId" = ?', parseInt(req.params.skill_id), parseInt(req.params.user_id)] }).success(function(us) { 
			if(us) {
				us.updateAttributes({level: req.param('level')}).success(function() {
					console.log(">>Updated skill level by coach for user");
					res.send('Updated level', {
			            'Content-Type': 'text/plain'
			         }, 200);
				}).error(function(errors) {
					console.log("Error", errors);
					console.log(">>Error updating skill level by coach for user");
				});
			}
			else
				console.log(">>Error updating skill level by coach for user, no user skill found");
			
		}).error(function(errors) {
			console.log("Error", errors);
			console.log(">>Error updating skill level by coach for user");
		});
	}
};