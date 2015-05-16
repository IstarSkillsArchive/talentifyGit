var db = require('../models')
, express = require('express')
, mailer = require('nodemailer')
, path = require('path')
, engine = require('ejs-locals')
, fs = require('fs')
, app = express()
,passwordHash = require('password-hash');
;

app.engine('ejs', engine);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

//mailer.extend(app, {
//  from: 'Princiya',
//  host: 'smtp.gmail.com', // hostname
//  secureConnection: true, // use SSL
//  port: 465, // port for secure SMTP
//  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
//  auth: {
//    user: 'princiya777@gmail.com',
//    pass: 'password'
//  }
//});

module.exports = {
		
	//the initial view
	dashboard: function(req, res) {
		var successFlash = req.flash('info')[0];
		db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
			//if user has completed profile, taken the test and fixed an appointment with coach, then redirect
			//the user to the gym page. Else make sure, user completes all these steps
			if(user && user.isProfileCompleted == true && user.isTestTaken == true && user.isMetCoach == true) {
				res.redirect('/users/gym/'+user.id);
			} else 
				res.render('dashboard', {user: user, successFlash: successFlash});
		}).error(function(err){
			console.log(">> Catching error : from user/dashboard", err);
		});
	},
	
	new_user: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		if(req.user.isAdmin()) {
			db.Organization.findAll().success(function(organizations) {
				db.Role.findAll().success(function(roles) {
					db.User.findAll({ where: { permission: 'coach'}}).success(function(coaches) { 
						res.render('users/new', {roles: roles, organizations: organizations, coaches: coaches, successFlash: successFlash});
					}).error(function(errors) {
						console.log("Error", errors);
						res.render('dashboard', {errors: errors});
					});
				});
			}).error(function(errors) {
				console.log("Error", errors);
				res.render('dashboard', {errors: errors});
			});
		} else {
			db.User.find({ where: { id: req.param('user_id')} , include: [db.Organization]}).success(function(user) { 
				
				db.Role.findAll({ where: { OrganizationId: user.organization.id}}).success(function(roles) { 
					
					db.User.findAll({ where: { permission: 'coach'}}).success(function(coaches) { 
						res.render('users/new', {organization: user.organization, roles: roles, coaches: coaches, successFlash: successFlash});
					}).error(function(errors) {
						console.log("Error", errors);
						res.render('dashboard', {errors: errors});
					});
					
				}).error(function(errors) {
					console.log("Error", errors);
					res.render('dashboard', {errors: errors});
				});
			
			}).error(function(errors) {
				console.log("Error", errors);
				res.render('dashboard', {errors: errors});
			});
		}
	},
	
	careers: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
			//db.Appointment.findAll({ where: ['"UserId" = ? AND "status" = \'confirm\'', user.id]}).success(function(appointments) { 
				db.EventUsers.findAll({ where: ['"UserId" = ?', user.id]}).success(function(eventusers) {
					var events = [];
					var get_confirmed_events = function(i) {
						if(i == eventusers.length) {
							db.JobUser.findAll({ where: ['"UserId" = ? AND status = ?', user.id, 'Invited']}).success(function(jobUsers) {
								var jobs = [];
								var get_jobs = function(j) {
									if(j == jobUsers.length) {
										//start
										db.JobUser.findAll({ where: ['"UserId" = ? AND status = ?', user.id, 'RSVP Yes']}).success(function(ju) {
											var job_tests = [];
											var get_tests = function(k) {
												if(k == ju.length) {
													var job_interviews = [];
													db.JobUser.findAll({ where: ['"UserId" = ? AND status = ?', user.id, 'Interview']}).success(function(x) {
														var get_job_interviews = function(p) {
															if(p == x.length) {
																var job_selections = [];
																db.JobUser.findAll({ where: ['"UserId" = ? AND status = ?', user.id, 'Selected']}).success(function(y) {
																	var get_job_selections = function(q) {
																		if(q == y.length) {
																			res.render('careers', {job_interviews: job_interviews, job_selections: job_selections, job_tests: job_tests, jobs: jobs, user: user, events: events, successFlash: successFlash});
																			return;
																		} else {
																			db.Job.find({ where: ['"id" = ?', y[q].JobId]}).success(function(job) {
																				if(job) {
																					job_selections.push(job);
																				}
																				get_job_selections(++q);
																			});
																		}
																	};
																	get_job_selections(0);
																});
															} else {
																db.Job.find({ where: ['"id" = ?', x[p].JobId]}).success(function(job) {
																	if(job) {
																		job_interviews.push(job);
																	}
																	get_job_interviews(++p);
																});
															}
														};
														get_job_interviews(0);
													});
													
												} else {
													db.Step.find({ where: ['"JobId" = ? and "order" = 1', ju[k].JobId]}).success(function(step) {
														if(step) {
															db.StepTest.find({ where: ['"StepId" = ?', step.id]}).success(function(stepTest) {
																if(stepTest)
																	db.Test.find({ where: ['"id" = ?', stepTest.TestId]}).success(function(test) {
																		job_tests.push(test);
																		get_tests(++k);
																	});
																else
																	get_tests(++k);
															});
														} else
															get_tests(++k);
													});
												}
											};
											get_tests(0);
										});
										//end
									} else {
										db.Job.find({ where: ['"id" = ?', jobUsers[j].JobId]}).success(function(job) {
											if(job) {
												jobs.push(job);
											}
											get_jobs(++j);
										});
									}
								};
								get_jobs(0);
							});
						} else {
							db.Event.find({ where: ['"id" = ? AND "status" = \'Confirmed\'', eventusers[i].EventId]}).success(function(event) {
								if(event) {
									var flag = true;
									for(var z=0; z< events.length; z++) {
										if(events[z].id == event.id) flag = false;
									}
									if(flag) {
										events[i] = {};
										events[i] = event;
										events[i].rsvp = eventusers[i].status;
									}
								}
								get_confirmed_events(++i);
							});
						}
					};
					get_confirmed_events(0);
				});
			//});
		});
	},
	
	/*calendar: function( req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		db.User.find({ where: { id: parseInt(req.user.id)}}).success(function(user) {
			db.Appointment.findAll({ where: ['"UserId" = ? AND "status" = \'confirm\'', user.id]}).success(function(appointments) { 
				db.EventUsers.findAll({ where: ['"UserId" = ?', user.id]}).success(function(eventusers) {
					var events = [];
					var get_confirmed_events = function(i) {
						if(i == eventusers.length) {
							db.JobUser.findAll({ where: ['"UserId" = ? AND status = ?', user.id, 'Invited']}).success(function(jobUsers) {
								var jobs = [];
								var get_jobs = function(j) {
									if(j == jobUsers.length) {
										//start
										db.JobUser.findAll({ where: ['"UserId" = ? AND status = ?', user.id, 'RSVP Yes']}).success(function(ju) {
											var job_tests = [];
											var get_tests = function(k) {
												if(k == ju.length) {
													var job_interviews = [];
													db.JobUser.findAll({ where: ['"UserId" = ? AND status = ?', user.id, 'Interview']}).success(function(x) {
														var get_job_interviews = function(p) {
															if(p == x.length) {
																var job_selections = [];
																db.JobUser.findAll({ where: ['"UserId" = ? AND status = ?', user.id, 'Selected']}).success(function(y) {
																	var get_job_selections = function(q) {
																		if(q == y.length) {
																			res.render('calendar', {job_interviews: job_interviews, job_selections: job_selections, job_tests: job_tests, jobs: jobs, user: user, appointments: appointments, events: events, successFlash: successFlash});
																			return;
																		} else {
																			db.Job.find({ where: ['"id" = ?', y[q].JobId]}).success(function(job) {
																				if(job) {
																					job_selections.push(job);
																				}
																				get_job_selections(++q);
																			});
																		}
																	};
																	get_job_selections(0);
																});
															} else {
																db.Job.find({ where: ['"id" = ?', x[p].JobId]}).success(function(job) {
																	if(job) {
																		job_interviews.push(job);
																	}
																	get_job_interviews(++p);
																});
															}
														};
														get_job_interviews(0);
													});
													
												} else {
													db.Step.find({ where: ['"JobId" = ? and "order" = 1', ju[k].JobId]}).success(function(step) {
														if(step) {
															db.StepTest.find({ where: ['"StepId" = ?', step.id]}).success(function(stepTest) {
																if(stepTest)
																	db.Test.find({ where: ['"id" = ?', stepTest.TestId]}).success(function(test) {
																		job_tests.push(test);
																		get_tests(++k);
																	});
																else
																	get_tests(++k);
															});
														} else
															get_tests(++k);
													});
												}
											};
											get_tests(0);
										});
										//end
									} else {
										db.Job.find({ where: ['"id" = ?', jobUsers[j].JobId]}).success(function(job) {
											if(job) {
												jobs.push(job);
											}
											get_jobs(++j);
										});
									}
								};
								get_jobs(0);
							});
						} else {
							db.Event.find({ where: ['"id" = ? AND ("status" = \'Confirmed\' OR "type"=\'Test\')', eventusers[i].EventId]}).success(function(event) {
								if(event) {
									var flag = true;
									for(var z=0; z< events.length; z++) {
										if(events[z].id == event.id) flag = false;
									}
									if(flag) {
										events[i] = {};
										events[i] = event;
										events[i].rsvp = eventusers[i].status;
									}
								}
								get_confirmed_events(++i);
							});
						}
					};
					get_confirmed_events(0);
				});
			});
		});
	},*/
	
	gym_mobile: function(req, res) {
		res.render('users/gym-mobile');
	},
	
	gym: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		db.User.find({ where: { id: req.param('user_id')}}).success(function(user) { 
			db.UserSkills.findAll({ where: { UserId: user.id}}).success(function(userSkills) {
				var skills = [];
				var get_skills = function(x) {
					if(x == userSkills.length) {
						var skill_pagination = userSkills.length/4;
						if(userSkills.length % 4 > 0)
							skill_pagination += 1;
						var query = 'select * from "Events","EventUsers" where "Events".status = \'Confirmed\' and "Events".id = "EventUsers"."EventId" and "EventUsers"."UserId" = '+user.id;
						db.sequelize.query(query, null, {raw: true}).success(function(workshops_count){
							db.JobUser.count({ where: ['"UserId" = ? AND status = ?', user.id, 'Invited']}).success(function(new_jobs_count) {
								db.JobUser.count({ where: ['"UserId" = ? AND status = ?', user.id, 'RSVP Yes']}).success(function(job_tests_count) {
									db.JobUser.count({ where: ['"UserId" = ? AND status = ?', user.id, 'Interview']}).success(function(job_interviews_count) {
										db.JobUser.count({ where: ['"UserId" = ? AND status = ?', user.id, 'Selected']}).success(function(job_offers_count) {
											db.User.find({ where: ['"OrganizationId" = ? AND permission = ?', user.OrganizationId, 'manager']}).success(function(manager) {
												if(manager) {
													db.Notification.findAll({ where: { UserId: manager.id}}).success(function(notifications) {
														res.render('gym', {workshops_count: workshops_count.length, new_jobs_count: new_jobs_count, job_tests_count: job_tests_count, job_interviews_count: job_interviews_count, job_offers_count: job_offers_count, notifications: notifications, userSkills: userSkills, user: user, skills: skills, coach_id: req.param('coach_id'), successFlash: successFlash, skill_pagination: skill_pagination});
														return;
													});
												} else {
													res.render('gym', {workshops_count: workshops_count.length, new_jobs_count: new_jobs_count, job_tests_count: job_tests_count, job_interviews_count: job_interviews_count, job_offers_count: job_offers_count, notifications: null, userSkills: userSkills, user: user, skills: skills, coach_id: req.param('coach_id'), successFlash: successFlash, skill_pagination: skill_pagination});
													return;
												}
											});
										});
									});
								});
							});
						});
					} else {
						db.Skill.find({ where: { id: userSkills[x].SkillId}}).success(function(skill) {
							skills[x] = {};
							skills[x] = skill;
							db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', userSkills[x].SkillId] }).success(function(totalModules) { 
								userSkills[x].totalModules = totalModules;
								userSkills[x].completedModules = 0;
								
								var get_completed_modules = function(k, id) {
									db.SkillModulePlaylist.find({ where: ['"ModuleId" = ? AND "SkillId" = ?', id, skill.id] }).success(function(module) {
										if(module == null || module.PrevModuleId == null) {
											userSkills[x].completedModules = k;
											get_skills(x+1);
										} else {
											get_completed_modules(++k, module.PrevModuleId);
										}
									});
								};
								
								db.SkillModulePlaylist.find({ where: ['"ModuleId" = ? AND "SkillId" = ?', userSkills[x].ModuleId, skill.id] }).success(function(module) {
									if(userSkills[x].status == 'complete') {//completed all modules
										userSkills[x].completedModules = totalModules;
										get_skills(x+1);
									} else if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
										get_skills(x+1);
									} else {
										get_completed_modules(1, module.PrevModuleId);
									}
								});
								
							});
						});
					}
				};
				get_skills(0);
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {errors: errors});
		});
	},
	
	get_users_test_events: function(req, res) {
		db.EventUsers.findAll({ where: ['"UserId" = ?', parseInt(req.param('user_id'))]}).success(function(eventusers) {
			var events = [];
			var get_confirmed_events = function(i) {
				if(i == eventusers.length) {
					res.render('users/get_users_test_events', {events: events});
				} else {
					db.Event.find({ where: ['"id" = ? AND type = ?', eventusers[i].EventId, 'Test']}).success(function(event) {
						if(event) {
							events[i] = {};
							events[i] = event;
							events[i].rsvp = eventusers[i].status;
						} 
						get_confirmed_events(++i);
					});
				}
			};
			get_confirmed_events(0);
		});
	},
	
	get_users_live_events: function(req, res) {
		db.EventUsers.findAll({ where: ['"UserId" = ?', parseInt(req.param('user_id'))]}).success(function(eventusers) {
			var events = [];
			var get_confirmed_events = function(i) {
				if(i == eventusers.length) {
					res.render('users/get_users_live_events', {events: events});
				} else {
					db.Event.find({ where: ['"id" = ? AND (type ISNULL OR type != \'Test\')', eventusers[i].EventId]}).success(function(event) {
						if(event) {
							events[i] = {};
							events[i] = event;
							events[i].rsvp = eventusers[i].status;
						} 
						get_confirmed_events(++i);
					});
				}
			};
			get_confirmed_events(0);
		});
	},
	
	get_users_coach_appointments: function(req, res) {
		db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
			db.Appointment.findAll({ where: ['"UserId" = ? AND "status" = \'confirm\'', parseInt(req.param('user_id'))]}).success(function(appointments) {
				res.render('users/get_users_coach_appointments', {appointments: appointments, user: user});
			});
		});
	},
	
	certificates: function(req, res) {
		res.render('users/certificates');
	},
	
	calendar: function(req, res) {
		/*query = 'select DISTINCT "EventId" from "EventUsers" where "UserId"='+parseInt(req.param('user_id'));
		db.sequelize.query(query, null, {raw: true}).success(function(eu){
			
		});*/
		db.EventUsers.findAll({ where: { UserId: parseInt(req.param('user_id'))}}).success(function(eu) {
			var events_classes = [], events_tests = [];
			var get_events = function(i) {
				if(i == eu.length) {
					//db.Appointment.findAll({ where: ['"UserId" = ? AND "status" = \'confirm\' AND date IS NOT NULL', parseInt(req.param('user_id'))]}).success(function(appointments) {
						res.render('users/calendar',{events_classes: events_classes, events_tests: events_tests});
					//});
				} else {
					db.Event.find({ where: ['id = ? AND date IS NOT NULL', eu[i].EventId]}).success(function(event) {
						if(event && event.type == 'Test') {
							events_tests.push(event);
						} else if(event) {
							events_classes.push(event);
						}
						get_events(++i);
					});
				}
			};
			get_events(0);
		});
	},
	
	next_module_no_message: function(req, res) {
		var message = null;
		res.redirect('/users/next_module/'+req.param('user_id')+'/'+req.param('skill_id')+'/'+message);
	},
	
	// OLD CODE
//	next_module: function(req, res) {
//		db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', req.param('user_id'), req.param('skill_id')] }).success(function(userSkill) { 
//			db.Skill.find({ where: ['"id" = ?', req.param('skill_id')] }).success(function(skill) { 
//				db.ModuleSkills.count({ where: ['"SkillId" = ?', req.param('skill_id')] }).success(function(totalModules) { 
//					var completedModules = 0;
//					
//					var get_completed_modules = function(i, id) {
//						db.Module.find({ where: ['"id" = ?', id] }).success(function(module) {
//							if(module == null || module.PrevModuleId == null) {
//								res.render('next_module', {userSkill: userSkill, skill: skill, totalModules: totalModules, completedModules: i, message: req.param('message')});
//							} else {
//								get_completed_modules(++i, module.PrevModuleId);
//							}
//						});
//					};
//					
//					db.Module.find({ where: ['"id" = ?', userSkill.ModuleId] }).success(function(module) { 
//						if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
//							res.render('next_module', {userSkill: userSkill, skill: skill, totalModules: totalModules, completedModules: completedModules, message: req.param('message')});
//						} else if(userSkill.status == 'complete') {//completed all modules
//							res.render('next_module', {userSkill: userSkill, skill: skill, totalModules: totalModules, completedModules: totalModules, message: req.param('message')});
//						}else {
//							get_completed_modules(1, module.PrevModuleId);
//						}
//					});
//				});
//			});
//		});
//	},
	
	next_module: function(req, res) {
		db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', req.param('user_id'), req.param('skill_id')] }).success(function(userSkill) { 
			db.Skill.find({ where: ['"id" = ?', req.param('skill_id')] }).success(function(skill) { 
				var do_next_step = function() {
					db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', req.param('skill_id')] }).success(function(totalModules) { 
						var completedModules = 0;
						
						var get_completed_modules = function(i, id) {
							db.SkillModulePlaylist.find({ where: ['"ModuleId" = ? AND "SkillId" = ?', id, skill.id] }).success(function(module) {
								if(module == null || module.PrevModuleId == null) {
									res.render('next_module', {userSkill: userSkill, skill: skill, totalModules: totalModules, completedModules: i, message: req.param('message')});
								} else {
									get_completed_modules(++i, module.PrevModuleId);
								}
							});
						};
						
						db.SkillModulePlaylist.find({ where: ['"ModuleId" = ? AND "SkillId" = ?', userSkill.ModuleId, skill.id] }).success(function(module) {
							if(userSkill.status == 'complete') {//completed all modules
								res.render('next_module', {userSkill: userSkill, skill: skill, totalModules: totalModules, completedModules: totalModules, message: req.param('message')});
							} else if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
								res.render('next_module', {userSkill: userSkill, skill: skill, totalModules: totalModules, completedModules: completedModules, message: req.param('message')});
							} else {
								get_completed_modules(1, module.PrevModuleId);
							}
						});
						
					});
				};
				
				var update_user_skill_table = function() {
					
					var update_user_skill_table_for_content = function() {
						if(userSkill.ContentId == null && userSkill.ModuleId != null) {
							db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "PrevContentId" ISNULL', userSkill.ModuleId, null] }).success(function(mcpl) {
								if(mcpl) {
									userSkill.updateAttributes({ContentId: mcpl.ContentId}).success(function(){
										do_next_step();
									});
								} else {
									do_next_step();
								}
							});
						} else {
							do_next_step();
						}
					};
					
					if(userSkill.ModuleId == null) {
						db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" ISNULL', userSkill.SkillId] }).success(function(smpl) {
							if(smpl) {
								userSkill.updateAttributes({ModuleId: smpl.ModuleId}).success(function(){
									update_user_skill_table_for_content();
								});
							} else {
								update_user_skill_table_for_content();
							}
						});
					} else {
						update_user_skill_table_for_content();
					}
				};
				update_user_skill_table();
				
			});
		});
	},
	
	review_module: function(req, res) {
		db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.user.id), parseInt(req.param('skill_id'))] }).success(function(userSkill) { 
			db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', req.param('skill_id')] }).success(function(totalModules) { 
				var old_modules = [];
				var new_modules = [];
				var current_module = {};
				
				var get_current_module = function() {
					db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "ModuleId" = ?', userSkill.SkillId, userSkill.ModuleId] }).success(function(c_smpl) {
						if(c_smpl) {
							db.Module.find({ where: ['"id" = ?', userSkill.ModuleId] }).success(function(m) {
								current_module = m;
								var get_old_modules = function(module) {
									if(module.PrevModuleId == null) {
										var get_new_modules = function(module) {
											db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "PrevModuleId" = ?', userSkill.SkillId, module.ModuleId] }).success(function(n_smpl) {
												if(n_smpl) {
													db.Module.find({ where: ['"id" = ?', n_smpl.ModuleId] }).success(function(m) {
														new_modules.push(m);
														get_new_modules(n_smpl);
													}).error(function(err){
														console.log(">> Catch err "+err);
													});
												} else {
													res.render('review_module', {skill_id: req.param('skill_id'), old_modules: old_modules.reverse(), current_module: current_module, new_modules: new_modules});
												}
											}).error(function(err){
												console.log(">> Catch err "+err);
											});
										};
										get_new_modules(c_smpl);
									} else {
										db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "ModuleId" = ?', userSkill.SkillId, module.PrevModuleId] }).success(function(o_smpl) {
											db.Module.find({ where: ['"id" = ?', o_smpl.ModuleId] }).success(function(m) {
												old_modules.push(m);
												get_old_modules(o_smpl);
											}).error(function(err){
												console.log(">> Catch err "+err);
											});
										}).error(function(err){
											console.log(">> Catch err "+err);
										});
									}
								};
								get_old_modules(c_smpl);
							}).error(function(err){
								console.log(">> Catch err "+err);
							});
						} else
							res.render('review_module', {skill_id: req.param('skill_id'), old_modules: old_modules, current_module: current_module, new_modules: new_modules});
					}).error(function(err){
						console.log(">> Catch err "+err);
					});
				};
				get_current_module();
			}).error(function(err){
				console.log(">> Catch err "+err);
			});
		}).error(function(err){
			console.log(">> Catch err "+err);
		});
	},
	
	review_old_content: function(req, res) {
		db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.user.id), parseInt(req.param('skill_id'))] }).success(function(userSkill) { 
			db.Module.find({ where: ['"id" = ?', parseInt(req.param('module_id'))] }).success(function(module) {
				var old_content = [];
				
				//start getting old content
				
				var get_old_content = function() {
					db.ModuleContentPlaylist.findAll({ where: ['"ModuleId" = ?', module.id] }).success(function(mcpl) {
						var get_old_content_i = function(i) {
							if(i == mcpl.length) {
								res.render('review_content', {module: module, old_content: old_content, current_content: null, new_content: null});
								return;
							} else {
								try {
									db.Content.find({ where: ['"id" = ?', mcpl[i].ContentId] }).success(function(c) {
										old_content.push(c);
										get_old_content_i(++i);
									});
								} catch(err) {
									console.log(">> Catch err "+err);
									get_old_content_i(++i);
								}
							}
						};
						get_old_content_i(0);
						
					}).error(function(err){
						console.log(">> Catch err "+err);
					});
				};
				get_old_content();
				
				//end getting old content
			}).error(function(err){
				console.log(">> Catch err "+err);
			});
		}).error(function(err){
			console.log(">> Catch err "+err);
		});
	},
	
	review_new_content: function(req, res) {
		var new_content = [];
		var get_old_content = function() {
			db.ModuleContentPlaylist.findAll({ where: ['"ModuleId" = ?', parseInt(req.param('module_id'))] }).success(function(mcpl) {
				var get_old_content_i = function(i) {
					if(i == mcpl.length) {
						res.render('review_content', {old_content: null, current_content: null, new_content: new_content});
						return;
					} else {
						try {
							db.Content.find({ where: ['"id" = ?', mcpl[i].ContentId] }).success(function(c) {
								new_content.push(c);
								get_old_content_i(++i);
							});
						} catch(err) {
							console.log(">> Catch err "+err);
							get_old_content_i(++i);
						}
					}
				};
				get_old_content_i(0);
				
			}).error(function(err){
				console.log(">> Catch err "+err);
			});
		};
		get_old_content();
	},
	
	review_content: function(req, res) {
		db.UserSkills.find({ where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.user.id), parseInt(req.param('skill_id'))] }).success(function(userSkill) { 
			db.Module.find({ where: ['"id" = ?', parseInt(req.param('module_id'))] }).success(function(module) {
				var old_content = [];
				var new_content = [];
				var current_content = {};
				
				var get_current_content = function() {
					db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "ContentId" = ?', parseInt(req.param('module_id')), userSkill.ContentId] }).success(function(c_mcpl) {
						if(c_mcpl) {
							db.Content.find({ where: ['"id" = ?', userSkill.ContentId] }).success(function(c) {
								current_content = c;
								var get_old_content = function(content) {
									if(content.PrevContentId == null) {
										var get_new_content = function(content) {
											db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "PrevContentId" = ?', userSkill.ModuleId, content.ContentId] }).success(function(n_mcpl) {
												if(n_mcpl) {
													db.Content.find({ where: ['"id" = ?', n_mcpl.ContentId] }).success(function(c) {
														new_content.push(c);
														get_new_content(n_mcpl);
													});
												} else {
													res.render('review_content', {module: module, old_content: old_content.reverse(), current_content: current_content, new_content: new_content, skill_id: req.param('skill_id')});
													return;
												}
											}).error(function(err){
												console.log(">> Catch err "+err);
											});
										};
										get_new_content(c_mcpl);
									} else {
										db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "ContentId" = ?', userSkill.ModuleId, content.PrevContentId] }).success(function(o_mcpl) {
											try {
												db.Content.find({ where: ['"id" = ?', o_mcpl.ContentId] }).success(function(c) {
													old_content.push(c);
													get_old_content(o_mcpl);
												});
											} catch(err) {
												console.log(">> Catch err "+err);
											}
										}).error(function(err){
											console.log(">> Catch err "+err);
										});
									}
								};
								get_old_content(c_mcpl);
							}).error(function(err){
								console.log(">> Catch err "+err);
							});
						} else {
							res.render('review_content', {module: module, old_content: old_content, current_content: current_content, new_content: new_content, skill_id: req.param('skill_id')});
							return;
						}
					}).error(function(err){
						console.log(">> Catch err "+err);
					});
				};
				get_current_content();
			}).error(function(err){
				console.log(">> Catch err "+err);
			});
		}).error(function(err){
			console.log(">> Catch err "+err);
		});
	},
	
	view_content_no_skill: function(req, res) {
		res.redirect('/users/view_content/'+req.param('id')+'/null');
	},
	
	view_content: function( req, res ) {
		db.Content.find({ where: ['"id" = ?', parseInt(req.param('id'))] }).success(function(c) {
			res.render('module_ajax', {content: c, skill_id: req.param('skill_id')});
		}).error(function(err){
			console.log(">> Catch err "+err);
		});
	},
	
	list: function(req, res) {
		db.Organization.findAll().success(function(organizations) {
			db.User.find({ where: { id: parseInt(req.user.id) }, include: [db.Organization] }).success(function(user) {
				if(req.user.isAdmin()) {
					db.User.findAll({ offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC', include: [db.Organization, db. Role]}).success(function(users) {
						res.render('users/list', {organizations: organizations, hr: user, users: users, successFlash: req.flash('info')[0]});
					}).error(function(error) {
						console.log('Error', error);
						res.redirect('/dashboard');
					});
				}else if(req.user.isManager()){
					db.User.findAll({ where: {OrganizationId: user.OrganizationId}, offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC', include: [db.Organization, db. Role]}).success(function(users) {
						res.render('users/list', {organizations: organizations, hr: user, users: users, successFlash: req.flash('info')[0]});
					}).error(function(error) {
						console.log('Error', error);
						res.redirect('/dashboard');
					});
				}
			});
		});
	},
	
	listByOrganization: function(req, res) {
		res.locals.limit = 10;
		var limit = res.locals.limit;
		var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
		res.locals.offset = (page - 1) * limit;
		
		db.User.count({where: {OrganizationId: parseInt(req.param('org_id'))}}).success(function(total) {
	        res.locals.total = total;
	        res.locals.pages =  Math.ceil(total / limit);
	        res.locals.page = page;
	        
	        res.locals.prev = page == 1 ? false : true;
	        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
	        
	        db.Organization.findAll().success(function(organizations) {
				db.Organization.find({where: {id: parseInt(req.param('org_id'))}}).success(function(org) {
					db.User.findAll({ where: {OrganizationId: org.id}, offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC', include: [db.Organization, db. Role]}).success(function(users) {
						res.render('users/listByOrganization', {selected_org: org, organizations: organizations, users: users, successFlash: req.flash('info')[0]});
					}).error(function(error) {
						console.log('Error', error);
						res.redirect('/dashboard');
					});
				});
			});
			
	    });
	},
	
	create: function(req, res) {
		
		db.Organization.find({ where: { id: parseInt(req.param('OrganizationId')) } }).success(function(organization) {
			var oldPassword = req.param('password');
			var hashedPassword = passwordHash.generate(req.param('password'));
			req.body.password = hashedPassword;
			db.User.create(req.body).success(function(user) {
				db.Role.find({ where: { id: parseInt(req.param('RoleId')) }, include: [db.Skill] }).success(function(role) {
					if(role) {
						var add_user_skills = function(i) {
							if(i == role.skills.length) {
								//req.flash('info', "User '" + user.first_name + "' created");
							    //res.redirect('users/new/'+req.param('currentUserId'));
								var mailOpts, smtpConfig;
								
								smtpConfig = mailer.createTransport('SMTP', {
									service: 'Gmail',
									auth: {
										user: "noreply@istarindia.com",
										pass: "noreply12345"
									}
								});
								//construct the email sending module
								mailOpts = {
									from: 'admin - TALENTIFY',
									to: req.param('email'),
									subject: 'Invitation from TALENTIFY',
									html: "Hi,<br/>" +
				"<br/>" +
				"You have been invited to TALENTIFY.<br/>" +
				"<br/>" +
				"Username: "+req.param('username')+"<br/>" +
				"Password: "+oldPassword+"<br/>" +
				"<br/>" +
				"Please login at <b><u>http://talentify.in:3000</u></b>.<br/>" +
				"<br/>" +
				"-Admin"
								};
								//send Email
								smtpConfig.sendMail(mailOpts, function (error, response) {
								//Email not sent
								    if (error) {
								      // handle error
								    	console.log("Error 1", error);
								    	db.Organization.findAll().success(function(organizations) {
											res.render('users/new', {organizations: organizations, errors: {message: ['Email was not sent']}});
										}).error(function(errors) {
											console.log("Error", errors);
											res.render('/dashboard', {errors: errors});
										});
								    }
								    req.flash('info', "User '" + user.first_name + "' created");
								    //isUniqueUsername = isUniqueEmail = true;
									res.redirect('users/new/'+req.param('currentUserId'));
								});
							} else {
								db.UserSkills.findOrCreate({SkillId: role.skills[i].id, UserId: user.id}).success(function(us, created) { 
									console.log("User-Skill", created); 
									if(created) {
										db.SkillModulePlaylist.findAll({ where: ['"SkillId" = ?', parseInt(us.SkillId)] }).success(function(ms) {
											if(ms.length > 0) {
												var get_first_module = function(x) {
													db.SkillModulePlaylist.find({ where: ['"SkillId" = ? AND "ModuleId" = ? AND "PrevModuleId" IS NULL', parseInt(ms[x].SkillId), parseInt(ms[x].ModuleId)] }).success(function(m) {
														if(m){
															db.ModuleContentPlaylist.findAll({ where: ['"ModuleId" = ?', parseInt(m.ModuleId)] }).success(function(cm) {
																if(cm.length > 0) {
																	var get_first_content = function(j) {
																		db.ModuleContentPlaylist.find({ where: ['"ModuleId" = ? AND "ContentId" = ? AND "PrevContentId" IS NULL', parseInt(cm[j].ModuleId), parseInt(cm[j].ContentId)] }).success(function(c) {
																			if(c){
																				us.updateAttributes({"ModuleId":m.ModuleId, "ContentId": c.ContentId}).success(function() {
																					add_user_skills(++i);
																				});
																			}else {
																				get_first_content(++j);
																			}
																		});
																	};
																	get_first_content(0);
																} else {
																	add_user_skills(++i);
																}
															});
														}else {
															get_first_module(++x);
														}
													});
												};
												get_first_module(0);
											}else {
												add_user_skills(++i);
											}
										});
									}
									
								});
							}
							
						};
						add_user_skills(0);
					
					} else {
						// start
						
						var mailOpts, smtpConfig;
						
						smtpConfig = mailer.createTransport('SMTP', {
							service: 'Gmail',
							auth: {
								user: "noreply@istarindia.com",
								pass: "noreply12345"
							}
						});
						//construct the email sending module
						mailOpts = {
							from: 'admin - TALENTIFY',
							to: req.param('email'),
							subject: 'Invitation from TALENTIFY',
							html: "Hi,<br/>" +
		"<br/>" +
		"You have been invited to Talentify.<br/>" +
		"<br/>" +
		"Username: "+req.param('username')+"<br/>" +
		"Password: "+oldPassword+"<br/>" +
		"<br/>" +
		"Please login at <b><u>http://talentify.in:3000</u></b>.<br/>" +
		"<br/>" +
		"-Admin"
						};
						//send Email
						smtpConfig.sendMail(mailOpts, function (error, response) {
						//Email not sent
						    if (error) {
						      // handle error
						    	console.log("Error 1", error);
						    	db.Organization.findAll().success(function(organizations) {
									res.render('users/new', {organizations: organizations, errors: {message: ['Email was not sent']}});
								}).error(function(errors) {
									console.log("Error", errors);
									res.render('/dashboard', {errors: errors});
								});
						    }
						    req.flash('info', "User '" + user.first_name + "' created");
						    //isUniqueUsername = isUniqueEmail = true;
							res.redirect('users/new/'+req.param('currentUserId'));
						});
						
						//end
					}
				}).error(function(errors) {
					console.log("Error finding Roles", errors);
					req.flash('info','There was an error encountered. Could not find roles');
					res.redirect('users/new/'+req.param('currentUserId'));
				});
			}).error(function(errors) {
				console.log("Error 3", errors);
				req.flash('info','There was an error encountered. Could not create user');
				res.redirect('/users/new/'+req.param('currentUserId'));
			});
		}).error(function(errors) {
			console.log("Error 4", errors);
			req.flash('info','There was an error encountered. Could not find organizations');
			res.redirect('/users/new/'+req.param('currentUserId'));
		});
	},
	
	destroy: function(req, res) {
		db.User.find({ where: { id: parseInt(req.param('user_id')) } }).success(function(user) {
			if(user) {
				db.Appointment.findAll({ where: { UserId: user.id } }).success(function(appointments) {
					var del_appointments = function(a) {
						if(a == appointments.length) {
							db.Billing.findAll({ where: { UserId: user.id } }).success(function(billings) {
								var del_billings = function(b) {
									if(b == billings.length) {
										db.CoachNotesHistory.findAll({ where: { UserId: user.id } }).success(function(cnhs) {
											var del_cnhs = function(cn) {
												if(cn == cnhs.length) {
													db.CoachRatingHistory.findAll({ where: { UserId: user.id } }).success(function(crhs) {
														var del_crhs = function(cr) {
															if(cr == crhs.length) {
																db.EventUsers.findAll({ where: { UserId: user.id } }).success(function(eventUsers) {
																	var del_eus = function(e) {
																		if(e == eventUsers.length) {
																			db.UserQuestions.findAll({ where: { UserId: user.id } }).success(function(uqs) {
																				var del_uqs = function(uq) {
																					if(uq == uqs.length) {
																						db.UserTags.findAll({ where: { UserId: user.id } }).success(function(uts) {
																							var del_uts = function(ut) {
																								if(ut == uts.length) {
																									user.destroy().success(function() {
																										req.flash('info', "User deleted");
																										res.redirect('users/list');
																									});
																								} else {
																									uts[ut].destroy().success(function() {
																										del_uts(++ut);
																									});
																								}
																							};
																							del_uts(0);
																						});
																					} else {
																						uqs[uq].destroy().success(function() {
																							del_uqs(++uq);
																						});
																					}
																				};
																				del_uqs(0);
																			});
																		} else {
																			eventUsers[a].destroy().success(function() {
																				del_eus(++e);
																			});
																		}
																	};
																	del_eus(0);
																});
															} else {
																crhs[cr].destroy().success(function() {
																	del_crhs(++cr);
																});
															}
														};
														del_crhs(0);
													});
												} else {
													cnhs[cn].destroy().success(function() {
														del_cnhs(++cn);
													});
												}
											};
											del_cnhs(0);
										});
									} else {
										billings[b].destroy().success(function() {
											del_billings(++b);
										});
									}
								};
								del_billings(0);
							});
						} else {
							appointments[a].destroy().success(function() {
								del_appointments(++a);
							});
						}
					};
					del_appointments(0);
				});
			} else {
				req.flash('info', "User not deleted");
				res.redirect('users/list');
			}
			
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('users/new', {errors: errors});
		});
	},
	
	change_password: function(req, res) {
		res.render('users/change_password', {user_id: req.param('user_id')});
	},
	
	change_password_ajax: function(req, res) {
		res.render('users/change_password_ajax', {user_id: req.param('user_id')});
	},
	
	do_change_password: function(req, res) {
		db.User.find({ where: {id: parseInt(req.param('user_id'))} }).success(function(user) {
			var success = function() {
				var hashedPassword = passwordHash.generate(req.param('new_password'));
				user.updateAttributes({password: hashedPassword}).success(function() {
					req.flash('info', "Changed Password");
					res.redirect('/dashboard');
				}).error(function(errors) {
					console.log("Error", errors);
					res.render('users/change_password', {user_id: req.param('user_id'), errors: errors});
				});
			};
			
			var err = function(msg) {
				res.render('users/change_password', {user_id: req.param('user_id'), errors: {message: [msg]}});
			};
			
			if(user) {
				if(passwordHash.isHashed(user.password)) {
					if(passwordHash.verify(req.param('old_password'), user.password)) {
						success();
					} else {
						err('Login Failure! Wrong password');
					}
				} else {
					if(user.password === req.param('old_password')) {
						success();
					} else
						err('Login Failure! Wrong password');
				}
			} else {
				err('Username doesn\'t exist');
			}
		}).error(function(err) {
			res.render('users/change_password', {user_id: req.param('user_id'), errors: err});
		});
	},
	
	do_change_password_ajax: function(req, res) {
		db.User.find({ where: {id: parseInt(req.param('user_id'))} }).success(function(user) {
			var success = function() {
				var hashedPassword = passwordHash.generate(req.param('new_password'));
				user.updateAttributes({password: hashedPassword}).success(function() {
					req.flash('info', "Changed Password");
					res.redirect('/users/edit_profile/'+user.id);
				}).error(function(errors) {
					req.flash('info', "You entered a wrong password");
					res.redirect('/users/edit_profile/'+user.id);
				});
			};
			
			var err = function(msg) {
				req.flash('info', msg);
				res.redirect('/users/edit_profile/'+req.param('user_id'));
			};
			
			if(user) {
				if(passwordHash.isHashed(user.password)) {
					if(passwordHash.verify(req.param('old_password'), user.password)) {
						success();
					} else {
						err('Login Failure! Wrong password');
					}
				} else {
					if(user.password === req.param('old_password')) {
						success();
					} else
						err('Login Failure! Wrong password');
				}
			} else {
				err('Username doesn\'t exist');
			}
		}).error(function(err) {
			console.log("Error", errors);
			req.flash('info', "Could not find user for the 'id' provided");
			res.redirect('/users/edit_profile/'+req.param('user_id'));
		});
	},
	
	search: function(req, res) {
		db.User.find({ where: { username: req.param('username') }}).success(function(user) {
			var skills = [];
			if(user) {
				db.UserSkills.findAll({ where: { UserId: user.id }}).success(function(userSkills) {
					var get_skills = function(i) {
						if(i == userSkills.length) {
							res.render('users/user_search_result', {user: user, skills: skills});
						} else {
							db.Skill.find({ where: { id: userSkills[i].SkillId }}).success(function(skill) {
								if(skill) {
									console.log(">> Pushing skill "+skill.id);
									skills.push(skill);
								}
								get_skills(++i);
							});
						}
					};
					get_skills(0);
				});
			}
			else {
				res.render('users/user_search_result', {user: null, skills: skills});
			}
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('users/user_search_result', {user: null, skills: skills});
		});
	},
	
	detail: function(req, res) {
		db.User.find({ where: { id: req.param('user_id') } }).success(function(user) {
			res.render('users/user_detail', {user: user, keyword: req.param('keyword')});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('hr_admin/dashboard', {errors: errors});
		});
	},
	
	question_details: function(req, res) {
		db.ReportDetail.find({ where: ['"id" = ?', parseInt(req.param('id'))]}).success(function(reportDetail) {
			db.Problem.find({ where: { id: reportDetail.ProblemId}}).success(function(problem) {
				db.Answer.find({ where: ['"id" = ?', reportDetail.AnswerId]}).success(function(your_answer) {
					db.Answer.find({ where: ['"ProblemId" = ? AND "isAnswer" = ?', problem.id, true]}).success(function(correct_answer) {
						res.render('question_details', {reportDetail: reportDetail, problem: problem, correct_answer: correct_answer, your_answer: your_answer});
					});
				});
			});
		});
	},
	
	view_user_report_details: function(req, res) {
		res.redirect('/users/view_report_details/'+req.param('id')+'/'+req.user.id);
	},
	
	view_report_details: function( req, res ) {
		db.Test.find({ where: ['"id" = ?', parseInt(req.param('id'))]}).success(function(test) {
			db.Report.find({ where: ['"TestId" = ? AND "UserId" = ?', parseInt(req.param('id')), req.param('user_id')]}).success(function(report) {
				if(report) {
					db.ReportDetail.findAll({ where: ['"TestId" = ? AND "UserId" = ?', report.TestId, req.param('user_id')]}).success(function(reportDetails) {
						test.score = 0;
						var get_test_total_score = function(m) {
							if(m == reportDetails.length) {
								db.ReportDetail.count({ where: ['"TestId" = ? AND "UserId" = ? AND "isAnswer" = ?', report.TestId, req.param('user_id'), true]}).success(function(correct_answer_count) {
									db.ReportDetail.sum('timeToAnswer', { where: ['"TestId" = ? AND "UserId" = ?', report.TestId, req.param('user_id')]}).success(function(total_time) {
										var total_minutes = Math.floor(total_time / 60);
										var total_seconds = total_time % 60;
										res.render('view_report_details', {test: test, report: report, reportDetails: reportDetails, correct_answer_count: correct_answer_count, total_time: total_time, total_minutes: total_minutes, total_seconds: total_seconds});
									}).error(function(err){
										console.log(">> Catching exception from users/view_test_details, trying to find total time to answer: "+err);
									});
								}).error(function(err){
									console.log(">> Catching exception from users/view_test_details, trying to find correct answer count: "+err);
								});
							} else {
								db.TestProblems.find({ where: ['"TestId" = ? AND "ProblemId" = ?', test.id, reportDetails[m].ProblemId]}).success(function(p) {
									test.score += p.positiveScore;
									reportDetails[m].isMandatory = p.isMandatory;
									get_test_total_score(++m);
								});
							}
						};
						get_test_total_score(0);
					});
				} else
					res.render('view_report_details', {test: test, report: report, reportDetails: null, correct_answer_count: 0, total_time: 0, total_minutes: 0, total_seconds: 0});
			});
		});
	},
	
	view_user_test_details: function( req, res ) {
		res.redirect('/users/view_test_details/'+req.user.id+'/'+req.param('skill_id'));
	},
	
	view_test_details: function( req, res ) {
		db.SkillModulePlaylist.findAll({ where: ['"SkillId" = ?', parseInt(req.param('skill_id'))]}).success(function(smpl) {
			var modules = [];
			var contents = [];
			var tests = [];
			
			var render = function() {
				var get_module = function(i) {
					if(i == smpl.length) {
						var get_contents = function(j) {
							if(j == modules.length) {
								var get_content_test = function(l) {
									if(l == contents.length) {
										if(tests.length > 0) {
											tests.reverse();
											db.Report.find({ where: ['"TestId" = ? AND "UserId" = ?', parseInt(tests[0].id), req.param('user_id')]}).success(function(report) {
												db.ReportDetail.findAll({ where: ['"TestId" = ? AND "UserId" = ?', parseInt(tests[0].id), req.param('user_id')]}).success(function(reportDetails) {
													tests[0].score = 0;
													var get_test_total_score = function(m) {
														if(m == reportDetails.length) {
															db.ReportDetail.count({ where: ['"TestId" = ? AND "UserId" = ? AND "isAnswer" = ?', parseInt(tests[0].id), req.param('user_id'), true]}).success(function(correct_answer_count) {
																db.ReportDetail.sum('timeToAnswer', { where: ['"TestId" = ? AND "UserId" = ?', parseInt(tests[0].id), req.param('user_id')]}).success(function(total_time) {
																	var total_minutes = Math.floor(total_time / 60);
																	var total_seconds = total_time % 60;
																	res.render('view_test_details', {user_id: req.param('user_id'), tests: tests, report: report, reportDetails: reportDetails, correct_answer_count: correct_answer_count, total_time: total_time, total_minutes: total_minutes, total_seconds: total_seconds});
																}).error(function(err){
																	console.log(">> Catching exception from users/view_test_details, trying to find total time to answer: "+err);
																});
															}).error(function(err){
																console.log(">> Catching exception from users/view_test_details, trying to find correct answer count: "+err);
															});
														} else {
															db.TestProblems.find({ where: ['"TestId" = ? AND "ProblemId" = ?', parseInt(tests[0].id), reportDetails[m].ProblemId]}).success(function(p) {
																tests[0].score += p.positiveScore;
																get_test_total_score(++m);
															});
														}
													};
													get_test_total_score(0);
												});
											});
										} else {
											res.render('view_test_details', {user_id: req.param('user_id'), tests: tests, report: null, reportDetails: null, correct_answer_count: 0, total_time: 0, total_minutes: 0, total_seconds: 0});
										}
									} else {
										db.ContentTest.find({ where: ['"ContentId" = ?', parseInt(contents[l].id)]}).success(function(ct) {
											if(ct) {
												db.Test.find({ where: ['"id" = ?', ct.TestId]}).success(function(test) {
													tests.push(test);
													get_content_test(++l);
												});
											} else {
												get_content_test(++l);
											}
										});
									}
								};
								get_content_test(0);
							} else {
								db.ModuleContentPlaylist.findAll({ where: ['"ModuleId" = ?', parseInt(modules[j].id)]}).success(function(mcpl) {
									var get_content = function(k) {
										if(k == mcpl.length) {
											get_contents(++j);
										} else {
											db.Content.find({ where: ['"id" = ?', mcpl[k].ContentId]}).success(function(content) {
												contents[j+k] = {};
												contents[j+k] = content;
												get_content(++k);
											});
										}
									};
									get_content(0);
								});
							}
						};
						get_contents(0);
					} else {
						db.Module.find({ where: ['"id" = ?', smpl[i].ModuleId]}).success(function(module) {
							modules[i] = {};
							modules[i] = module;
							db.ModuleTest.find({ where: ['"ModuleId" = ?', module.id]}).success(function(ct) {
								if(ct) {
									db.Test.find({ where: ['"id" = ?', ct.TestId]}).success(function(test) {
										tests.push(test);
										get_module(++i);
									});
								} else {
									get_module(++i);
								}
							});
						});
					}
				};
				get_module(0);
			};
			
			db.SkillTest.find({ where: ['"SkillId" = ?', smpl[0].SkillId]}).success(function(ct) {
				if(ct) {
					db.Test.find({ where: ['"id" = ?', ct.TestId]}).success(function(test) {
						tests.push(test);
						render();
					});
				} else {
					render();
				}
			});
		});
	},
	
	view_other_test_details: function( req, res ) {
		var tests = [];
		db.Test.find({where: {id: parseInt(req.param('test_id'))}}).success(function(test){
			tests.push(test);
			db.Report.find({ where: ['"TestId" = ? AND "UserId" = ?', test.id, parseInt(req.user.id)]}).success(function(report) {
				db.ReportDetail.findAll({ where: ['"TestId" = ? AND "UserId" = ?', test.id, req.user.id]}).success(function(reportDetails) {
					tests[0].score = 0;
					var get_test_total_score = function(m) {
						if(m == reportDetails.length) {
							res.render('view_test_details', {tests: tests, report: report, reportDetails: reportDetails});
						} else {
							db.TestProblems.find({ where: ['"TestId" = ? AND "ProblemId" = ?', test.id, reportDetails[m].ProblemId]}).success(function(p) {
								tests[0].score += p.positiveScore;
								get_test_total_score(++m);
							});
						}
					};
					get_test_total_score(0);
				});
			});
		});
	},
	
	skill_overview: function(req, res) {
		var completedModules = 0;
		db.UserSkills.find({ where: ['"SkillId" = ? AND "UserId" = ?', parseInt(req.param('skill_id')), parseInt(req.param('user_id'))] }).success(function(us) {
			db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', parseInt(req.param('skill_id'))] }).success(function(totalModules) { 
				completedModules = 0;
				
				var get_completed_modules = function(k, id) {
					db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', id] }).success(function(module) {
						if(module == null || module.PrevModuleId == null) {
							completedModules = k;
							render();
						} else {
							get_completed_modules(++k, module.PrevModuleId);
						}
					});
				};
				
				function render() {
					res.render('skill_overview', {totalModules: totalModules, completedModules: completedModules});
				}
				
				db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', us.ModuleId] }).success(function(module) {
					if(us.status == 'complete') {//completed all modules
						completedModules = totalModules;
						render();
					} else if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
						render();
					} else {
						get_completed_modules(1, module.PrevModuleId);
					}
				});
				
			});
		}).error(function(err){
			console.log(">> Catching err from user/skill_overview, trying to find user's skill: "+err);
		});
	},
	
	report_card_ajax: function(req, res) {
		db.Skill.find({ where: ['"id" = ?', parseInt(req.param('skill_id'))]}).success(function(skill) {
			db.CoachNotesHistory.count({ where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.param('user_id')), parseInt(req.param('skill_id'))]}).success(function(n) {
				db.CoachRatingHistory.count({ where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.param('user_id')), parseInt(req.param('skill_id'))]}).success(function(r) {
					db.CoachRatingHistory.find({ where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.param('user_id')), parseInt(req.param('skill_id'))], order: 'id DESC'}).success(function(rating) {
						res.render('report_ajax', {skill: skill, user_id: req.param('user_id'), skill_id: req.param('skill_id'), notes_length: n, rating_length: r, current_coach_rating: rating, hide: req.param('hide')});
					}).error(function(err){
						console.log(">> Catching error from report card ajax, trying to fing current coach rating: "+err);
					});
				}).error(function(err){
					console.log(">> Catching error from report card ajax, trying to fing coach rating history length: "+err);
				});
			}).error(function(err){
				console.log(">> Catching error from report card ajax, trying to fing coach notes history length: "+err);
			});
		}).error(function(err){
			console.log(">> Catching error from report card ajax, trying to fing skill details: "+err);
		});
	},
	
	report_card: function(req, res) {
		db.UserSkills.findAll({ where: { UserId: parseInt(req.param('user_id'))}}).success(function(userSkills) { 
			db.User.find({ where: { id: parseInt(req.param('user_id'))}, include: [db.Skill, db.Role, db.Organization]}).success(function(user) { 
				var get_notes = function(i) {
					if(i == user.skills.length) {
						var get_modules_completed = function(j) {
							if(j == userSkills.length) {
								var get_event_tests = function() {
									var query = 'select * from "EventUsers" where "UserId" = '+user.id;
									db.sequelize.query(query, null, {raw: true}).success(function(eu){
										var events = [];
										var check_for_event_test = function(x) {
											if(x == eu.length) {
												var pre_test = null;
												var get_pre_test = function() {
													db.RoleTest.find({where: {RoleId: user.RoleId}}).success(function(rt){
														if(rt) {
															db.Test.find({where: {id: rt.TestId}}).success(function(pt){
																pre_test = {};
																pre_test = pt;
																res.render('report', {userSkills: userSkills, user: user, pre_test: pre_test, events: events}); return;
															});
														} else {
															res.render('report', {userSkills: userSkills, user: user, pre_test: pre_test, events: events}); return;
														}
													});
												}();
											} else {
												db.EventTest.find({where: {EventId: eu[x].EventId}}).success(function(et){
													if(et){
														db.Report.find({where: ['"UserId" = ? AND "TestId" = ?', user.id, et.TestId]}).success(function(report){
															if(report) {
																db.Test.find({where: {id: et.TestId}}).success(function(test){
																	events.push(test);
																	check_for_event_test(++x);
																});
															} else {
																check_for_event_test(++x);
															}
														});
													} else {
														check_for_event_test(++x);
													}
												});
											}
										};
										check_for_event_test(0);
									});
								};
								
								get_event_tests();
							} else {
								db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', userSkills[j].SkillId] }).success(function(totalModules) { 
									userSkills[j].totalModules = totalModules;
									userSkills[j].completedModules = 0;
									
									var get_completed_modules = function(k, id) {
										db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', id] }).success(function(module) {
											if(module == null || module.PrevModuleId == null) {
												userSkills[j].completedModules = k;
												get_modules_completed(j+1);
											} else {
												get_completed_modules(++k, module.PrevModuleId);
											}
										});
									};
									
									db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', userSkills[j].ModuleId] }).success(function(module) {
										if(userSkills[j].status == 'complete') {//completed all modules
											userSkills[j].completedModules = totalModules;
											get_modules_completed(j+1);
										} else if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
											get_modules_completed(j+1);
										} else {
											get_completed_modules(1, module.PrevModuleId);
										}
									});
									
								});
							}
						}; 
						get_modules_completed(0);
					} else {
						db.CoachNotesHistory.count({ where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.param('user_id')), user.skills[i].id]}).success(function(n) {
							user.skills[i].notes = n;
							get_notes(++i);
						});
					}
				};
				get_notes(0);
			});
		});
	},
	
	coach_rating_history: function(req, res) {
		db.CoachRatingHistory.findAll({ where: ['"UserId" = ? AND "SkillId" = ?', parseInt(req.param('user_id')), parseInt(req.param('skill_id'))], order: 'id DESC' }).success(function(crh) {
			var d = [];
			var get_date = function(i) {
				if(i == crh.length) {
					res.render('coach_rating_history',{crh: crh, skill_id: req.param('skill_id')});
				} else {
					d = crh[i].date.toDateString().split(' ');
					crh[i].month = d[1];
					crh[i].year = d[3];
					get_date(++i);
				}
			};
			get_date(0);
		});
	},
	
	notes: function(req, res) {
		db.User.find({ where: { id: parseInt(req.param('user_id')) }}).success(function(user) {
			db.CoachNotesHistory.min("id", {where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ?', user.CoachId, parseInt(req.param('user_id')), parseInt(req.param('skill_id'))] }).success(function(min) {
				res.redirect('/users/notes_next/'+user.CoachId+'/'+user.id+'/'+req.param("skill_id")+'/'+(min-1)+'/'+req.param("total_length")+'/'+req.param("curr")); return;
			});
		});
	},
	
	notes_prev: function(req, res) {
		var len = parseInt(req.param('len'));
		var curr = parseInt(req.param('curr'));
		if(len == 0){
			notes = {};
			res.render('notes',{notes: notes, curr: curr, len: len});
		}
		if(curr > 1) {
			curr--;
			db.CoachNotesHistory.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ? AND "id" < ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), parseInt(req.param('skill_id')), parseInt(req.param('cnh_id'))], order: 'id DESC' }).success(function(notes) {
				res.render('notes',{notes: notes, curr: curr, len: len});
			});
		}else{
			db.CoachNotesHistory.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ? AND "id" = ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), parseInt(req.param('skill_id')), parseInt(req.param('cnh_id'))], order: 'id DESC' }).success(function(notes) {
				res.render('notes',{notes: notes, curr: curr, len: len});
			});
		}
	},
	
	notes_next: function(req, res) {
		var len = parseInt(req.param('len'));
		var curr = parseInt(req.param('curr'));
		if(len == 0){
			notes = {};
			res.render('notes',{notes: notes, curr: curr, len: len}); return;
		}
		else if(curr < len) {
			curr++;
			db.CoachNotesHistory.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ? AND "id" > ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), parseInt(req.param('skill_id')), parseInt(req.param('cnh_id'))] }).success(function(notes) {
				res.render('notes',{notes: notes, curr: curr, len: len}); return;
			});
		}else {
			db.CoachNotesHistory.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "SkillId" = ? AND "id" = ?', parseInt(req.param('coach_id')), parseInt(req.param('user_id')), parseInt(req.param('skill_id')), parseInt(req.param('cnh_id'))] }).success(function(notes) {
				res.render('notes',{notes: notes, curr: curr, len: len}); return;
			});
		}
	},
	
	modules_completed: function(req, res) {
		db.UserSkills.find({ where: ['"SkillId" = ? AND "UserId" = ?', parseInt(req.param('skill_id')), parseInt(req.user.id)] }).success(function(us) {
			db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', parseInt(req.param('skill_id'))] }).success(function(totalModules) { 
				var totalModules = totalModules;
				var completedModules = 0;
				
				var get_completed_modules = function(k, id) {
					db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', id] }).success(function(module) {
						if(module == null || module.PrevModuleId == null) {
							completedModules = k;
							res.render('modules_completed', {completedModules: completedModules, totalModules: totalModules});
						} else {
							get_completed_modules(++k, module.PrevModuleId);
						}
					});
				};
				
				db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', us.ModuleId] }).success(function(module) {
					if(us.status == 'complete') {//completed all modules
						completedModules = totalModules;
						res.render('modules_completed', {completedModules: completedModules, totalModules: totalModules});
					} else if(module == null || module.PrevModuleId == null) {//user is in the first module. completed modules = 0
						res.render('modules_completed', {completedModules: completedModules, totalModules: totalModules});
					} else {
						get_completed_modules(1, module.PrevModuleId);
					}
				});
				
			});
		});
	},
	
	ratings: function(req, res) {
		db.User.find({ where: { id: req.param('user_id') }, include: [db.Skill] }).success(function(user) {
			res.render('ratings', {user: user});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {errors: errors});
		});
	},
	
	skill_map: function(req, res) {
		res.render('skill_map');
	},
	
	start_pre_test: function(req, res) {
		db.User.find({ where: { id: parseInt(req.user.id) }}).success(function(user) {
			db.RoleTest.find({where: {RoleId: user.RoleId}}).success(function(rt){
				if(rt) {
					res.redirect('/content/show_general_test_instructions/'+rt.TestId);
				} else {
					res.render('users/start_pre_test');
				}
			});
		});
	},
	
	enrollment_form: function(req, res) {
		var successFlash = req.flash('info')[0];
		db.User.find({ where: { id: parseInt(req.param('user_id')) }, include: [db.Role, db.Skill, db.Organization] }).success(function(user) {
			if(req.param('is_first_time') == 'true') {
				res.render('users/enrollment_form', {user: user, isFirstTime: req.param('is_first_time'), successFlash: successFlash});
			} else {
				res.redirect('/users/edit_enrollment_form/'+user.id);
			}
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {errors: errors});
		});
	},
	
	edit_enrollment_form: function(req, res) {
		db.UserDetails.find({UserId: parseInt(req.param('user_id'))}).success(function(userDetails){
			res.render('users/edit_enrollment_form', {userDetails: userDetails});
		});
	},
	
	update_user_details: function(req, res) {
		db.UserDetails.find({UserId: parseInt(req.param('id'))}).success(function(userDetails){
			userDetails.updateAttributes(req.body).success(function(){
				res.redirect('/users/edit_enrollment_form/'+userDetails.UserId);
			});
		});
	},
	
	create_user_details: function(req, res) {
		db.User.find({ where: { id: parseInt(req.param('id')) }}).success(function(user) {
			db.UserDetails.create({UserId: user.id}).success(function(ud){
				ud.updateAttributes(req.body).success(function(){
					user.updateAttributes({isProfileCompleted: true}).success(function(){
						res.redirect('/users/dashboard/'+req.param('id'));
					});
				});
			});
		});
	},
	
	profile_firstTime_false: function(req, res) {
		res.redirect('/users/profile/'+req.param('user_id')+'/false');
	},
	
	profile: function(req, res) {
		var successFlash = req.flash('info')[0];
		db.User.find({ where: { id: parseInt(req.param('user_id')) }, include: [db.Role, db.Skill, db.Organization] }).success(function(user) {
			res.render('profile', {user: user, isFirstTime: req.param('is_first_time'), successFlash: successFlash});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {errors: errors});
		});
	},
	
	profile_user_orientation: function(req, res) {
		db.User.find({ where: { id: parseInt(req.user.id) }}).success(function(user) {
			res.render('profile-user-orientation', {user: user});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {errors: errors});
		});
	},
	
	do_create_user_profile: function(req, res) {
		db.User.find({ where: { id: parseInt(req.user.id) }}).success(function(user) {
			if(req.param('email') == null || req.param('email') == '')
				req.body.email = user.email;
			user.updateAttributes(req.body).success(function() {
				res.redirect('users/dashboard/'+req.user.id);
			});
		});
	},
	
	edit_profile: function(req, res) {
		var successFlash = req.flash('info')[0];
		db.User.find({ where: { id: parseInt(req.param('user_id')) }, include: [db.Role, db.Skill, db.Organization] }).success(function(user) {
			db.Role.findAll().success(function(roles) {
				db.User.findAll({where: {permission: 'coach'}}).success(function(coaches) {
					res.render('users/edit_profile', {successFlash: successFlash, user: user, roles: roles, coaches: coaches, isFirstTime: req.param('is_first_time')});
				}).error(function(errors) {
					console.log("Error", errors);
					res.render('dashboard', {successFlash: successFlash, errors: errors});
				});
			}).error(function(errors) {
				console.log("Error", errors);
				res.render('dashboard', {successFlash: successFlash, errors: errors});
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {successFlash: successFlash, errors: errors});
		});
	},
	
	update: function(req, res) {
		db.User.find({ where: { id: req.param('id')} }).success(function(user) {
			if(user) {
				user.updateAttributes({department: req.param('department')
						,user_id: req.param('user_id')
						,username: req.param('username')
						,password: req.param('password')
						,first_name: req.param('first_name')
						,last_name: req.param('last_name')
						,email: req.param('email')
						,RoleId: req.param('RoleId')
						,CoachId: req.param('CoachId')
						,isProfileCompleted: true
					}).success(function() {
					req.flash('info', 'Updated Profile');
					if(req.param('isFirstTime') == 'true')
						res.redirect('/users/dashboard/'+req.param('id'));
					else
						res.redirect('/users/profile/'+req.param('id'));
				}).error(function(errors) {
					console.log("Error", errors);
					res.render('dashboard', {user_id: req.param('id'), errors: errors});
				});
			} else {
				res.render('dashboard', {user_id: req.param('id'), errors: {message: ['You are not authorized. Please login with a valid username/password']}});
			}
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {user_id: req.param('id'), errors: errors});
		});
	
	},
	
	updateIsTestTaken: function(req, res) {
		db.User.find({ where: { id: req.param('user_id')} }).success(function(user) {
			if(user) {
				user.updateAttributes({isTestTaken: true}).success(function() {
					req.flash('info', 'You have successfully completed the test');
					res.redirect('/users/dashboard/'+req.param('user_id'));
				}).error(function(errors) {
					console.log("Error", errors);
					res.render('dashboard', {user_id: req.param('user_id'), errors: errors});
				});
			} else {
				res.render('dashboard', {user_id: req.param('user_id'), errors: {message: ['You are not authorized. Please login with a valid username/password']}});
			}
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {user_id: req.param('user_id'), errors: errors});
		});
	},
	
	set_appointment: function(req, res) {
		db.User.find({ where: { id: req.param('user_id')}}).success(function(user) {
			if(user) {
				db.User.find({ where: { id: user.CoachId}}).success(function(coach) {
					if(coach)
						res.render('users/set_appointment', {user: user, coach: coach});
					else {
						db.User.find({where: {permission: 'coach'}}).success(function(coach) {
							res.render('users/set_appointment', {user: user, coach: coach});
						});
					}
				}).error(function(errors) {
					console.log("Error", errors);
					res.render('dashboard', {user_id: req.param('user_id'), errors: {message: ['Coach details are not available for you yet']}});
				});
			} else {
				res.render('dashboard', {user_id: req.param('user_id'), errors: {message: ['An error just occurred. Either you are not authorized, please login with a valid username/password or coach details are not available for you yet']}});
			}
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {user_id: req.param('user_id'), errors: errors});
		});
	},
	
	scheduleMeetingWithCoach: function(req, res) {
		db.User.find({ where: { id: req.param('user_id')}, include: [db.Role, db.Organization] }).success(function(user) {
			if(user) {
				db.User.find({ where: { id: user.CoachId != null ? user.CoachId : parseInt(req.param('coach_id'))}}).success(function(coach) {	
					if(req.param('date_1') != '' && req.param('time_1') != '')
						db.Appointment.create({option: 1, date: req.param('date_1'), time: req.param('time_1'), status: "request"}).success(function(a_1) { 
							db.sequelize.query('UPDATE "Appointments" SET "UserId"='+user.id+' , "CoachId"='+coach.id+' WHERE "id"='+a_1.id).success(function() {
								if(req.param('date_2') != '' && req.param('time_2') != '')
									db.Appointment.create({option: 2, date: req.param('date_2'), time: req.param('time_2'), status: "request"}).success(function(a_2) { 
										db.sequelize.query('UPDATE "Appointments" SET "UserId"='+user.id+' , "CoachId"='+coach.id+' WHERE "id"='+a_2.id).success(function() {
											if(req.param('date_3') != '' && req.param('time_3') != '')
												db.Appointment.create({UserId: user.id, CoachId: coach.id, option: 3, date: req.param('date_3'), time: req.param('time_3'), status: "request"}).success(function(a_3) { 
													db.sequelize.query('UPDATE "Appointments" SET "UserId"='+user.id+' , "CoachId"='+coach.id+' WHERE "id"='+a_3.id).success(function() {
														//res.redirect('/users/dashboard/'+req.param('user_id'));
														//START
														var mailOpts, smtpConfig;
														
														smtpConfig = mailer.createTransport('SMTP', {
															service: 'Gmail',
															auth: {
															user: "noreply@istarindia.com",
															pass: "noreply12345"
															}
														});
														//construct the email sending module
														var role_name = user.role != null && user.role != '' && user.role != 'null' ? user.role.name : '';
														mailOpts = {
															from: 'admin - TALENTIFY',
															to: coach.email,
															subject: 'Request for meeting with coach',
															html: "Hi,<br/>" +
											"<br/>" +
											"You have been requested to coach the following user.<br/><br/>"+
											"Name: <b>"+user.first_name+" "+user.last_name+"</b><br/>"+
											"Role: <b>"+role_name+"</b><br/>"+
											"Organizaion <b>"+user.organization != null ? user.organization.name : ''+"</b><br/>" +
											"<br/>" +
											"Please login at <b><u>http://talentify.in:3000</u></b> and schedule a meeting with this user" +
											"<br/>" +
											"-Admin"
														};
														//send Email
														smtpConfig.sendMail(mailOpts, function (error, response) {
														
														    if (error) {
														      // handle error
														    	req.flash('info', 'An email could not be sent to the coach. Please try again!');
																if(req.user.isTrainer())
																	res.redirect('/trainer/dashboard/'+req.param('user_id'));
																else
																	res.redirect('/users/dashboard/'+req.param('user_id'));
														    } else {
														    	user.updateAttributes({isMetCoach: true}).success(function() {
														    		req.flash('info', 'Your preferences have been recorded. Your coach will get in touch with you and schedule a meeting');
														    		if(req.user.isTrainer())
																		res.redirect('/trainer/dashboard/'+req.param('user_id'));
																	else
																		res.redirect('/users/gym/'+req.param('user_id'));
														    	}).error(function(errors) {
																	console.log("Error", errors);
																	res.render('dashboard', {user_id: req.param('user_id'), errors: errors});
																});	
														    }
														    
														});
														//END
													});
											});
										});
								});
							});
						});
					
				}).error(function(errors) {
					console.log("Error", errors);
					res.render('dashboard', {user_id: req.param('user_id'), errors: {message: ['Coach details are not available for you yet']}});
				});
			} else {
				res.render('dashboard', {user_id: req.param('user_id'), errors: {message: ['An error just occurred. Either you are not authorized, please login with a valid username/password or coach details are not available for you yet']}});
			}
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {user_id: req.param('user_id'), errors: errors});
		});
	},
	
	terms: function(req, res) {
		res.render('users/terms', {user_id: req.param('user_id')});
	},
	
	do_agree_to_terms: function(req, res) {
		db.User.find({where: {id: parseInt(req.param('user_id'))}}).success(function(user) {
			user.updateAttributes({isAgreedToTerms: true}).success(function(){
				if(user.isTrainer())
					res.redirect('/trainer/tot/'+req.param('user_id'));
				else
					res.redirect('/users/gym/'+req.param('user_id'));
			});
		});
	}
};