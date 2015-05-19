var db = require('../models'),
mailer = require('nodemailer'),
func = require('../controllers/functions'),
passwordHash = require('password-hash');;

module.exports = {
	//manager's dashboard page	
	dashboard: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		
		//get hr admin's organization; to get user list for this organization
		db.User.find({ where: { id: req.user.id} , include: [db.Organization]}).success(function(hr) {
			
			//get all users for this organization
			db.User.findAll({ where: { OrganizationId: hr.OrganizationId}}).success(function(users) {
				var departments = [];
				var pos;
				
				//get unique departments (deprecated, but there is future scope)
				users.forEach(function(user){
					pos = -1;
					pos = departments.indexOf(user.department);
					if(pos == -1 && user.department != null && user.department != '')
						departments.push(user.department);
				});
				
				var counts = [];
				
				departments.forEach(function(dept, i) {
					counts[i]={};
					counts[i].name = dept;
					counts[i].count_coach_rating = 0;
					counts[i].count_modules_completed = 0;
				});
				
				//get the no. of users who have completed all modules. used for role-skill statistics
				var get_users_count_for_modules_completed = function() {
					db.UserSkills.findAll({ where: { status: 'complete'} }).success(function(us) {
						var visited = [];
						var update_count_for_modules_completed = function(j) {
							if(j == us.length) {
								var date = new Date();
								var month = date.getMonth();
								month = month < 9 ? '0'+(month+1) : ''+(month+1);
								//db.Login.findAll({ where: ['"date" LIKE ?', '%-'+month+'-%'] }).success(function(logins) {
									//start login activity related variables
									var split_date;
									var daily_activity = [];
									var no_of_days;
									var month_name;
									var query;
									switch(month) {
										case '01': month_name = 'January'; no_of_days = 31; break;
										case '03': month_name = 'March'; no_of_days = 31; break;
										case '05': month_name = 'May'; no_of_days = 31; break;
										case '07': month_name = 'July'; no_of_days = 31; break;
										case '08': month_name = 'August'; no_of_days = 31; break;
										case '10': month_name = 'October'; no_of_days = 31; break;
										case '12': month_name = 'December'; no_of_days = 31; break;
										case '04': month_name = 'April'; no_of_days = 30; break;
										case '06': month_name = 'June'; no_of_days = 30; break;
										case '09': month_name = 'September'; no_of_days = 30; break;
										case '11': month_name = 'November'; no_of_days = 30; break;
										case '02': month_name = 'February'; no_of_days = 28; break;
									}
									for(var q = 0; q < no_of_days; q++) {
										daily_activity[q] = {};
										daily_activity[q].day = q+1;
										daily_activity[q].count = 0;
									}
									//end login activity related variables
									
									//get the login activity
									var get_login_for_each_day = function(p) {
										if(p == no_of_days) {
											db.Event.findAll({ where: ['type = ? and "InitiatorId" = ?', 'Test', hr.id], order: 'id DESC'}).success(function(events) {
												var tests = [];
												var get_test_details = function(r) {
													if(r == events.length) {
														var skills = [];
														//start role
														db.Role.findAll({where: {OrganizationId: hr.OrganizationId}}).success(function(roles) {
															if(roles.length > 0) {
																//get skills for first role
																db.RoleSkills.findAll({where: {RoleId: roles[0].id}, limit: 4, order: '"SkillId" DESC'}).success(function(role_skills) {
																	var all_skills = [];
																	var get_role_skills = function(rs) {
																		if(rs == role_skills.length) {
																			db.Notification.findAll({limit: 10, where: {UserId: hr.id}}).success(function(notifications) {
																				db.Event.findAll({ where: ['(type IS NULL or type != ?) and   "InitiatorId" = ?', 'Test', hr.id]}).success(function(trainings) {
																					var get_skills_data = function(sk) {
																						if(sk == all_skills.length) {
																							res.render('hr_admin/dashboard-new', {roles: roles, all_skills: all_skills, trainings: trainings, hr: hr, month_name: month_name, daily_activity: daily_activity, user_id: req.param('user_id'), successFlash: successFlash, departments: departments, counts: counts, tests: tests, skills: skills, notifications: notifications});
																						} else {
																							db.UserSkills.count({ where: ['"SkillId" = ? and   "level" = ?', all_skills[sk].id, 'wizard']}).success(function(wizard) {
																								all_skills[sk].wizard = wizard;
																								db.UserSkills.count({ where: ['"SkillId" = ? and   "level" = ?', all_skills[sk].id, 'master']}).success(function(master) {
																									all_skills[sk].master = master;
																									db.UserSkills.count({ where: ['"SkillId" = ? and   "level" = ?', all_skills[sk].id, 'apprentice']}).success(function(apprentice) {
																										all_skills[sk].apprentice = apprentice;
																										db.UserSkills.count({ where: ['"SkillId" = ? and   "level" = ?', all_skills[sk].id, 'rookie']}).success(function(rookie) {
																											all_skills[sk].rookie = rookie;
																											get_skills_data(++sk);
																										});
																									});
																								});
																							});
																						}
																					};
																					get_skills_data(0);
																				});
																			});
																		} else {
																			db.Skill.find({where: {id: role_skills[rs].SkillId}, limit: 4}).success(function(skill) {
																				all_skills.push(skill);
																				get_role_skills(++rs);
																			});
																		}
																	};
																	get_role_skills(0);
																});
															} else {
																db.Notification.findAll({limit: 10, where: {UserId: hr.id}}).success(function(notifications) {
																	db.Event.findAll({ where: ['(type IS NULL or type != ?) and   "InitiatorId" = ?', 'Test', hr.id], limit: 10 }).success(function(trainings) {
																		var all_skills = [];
																		res.render('hr_admin/dashboard-new', {roles: roles, all_skills: all_skills, trainings: trainings, hr: hr, month_name: month_name, daily_activity: daily_activity, user_id: req.param('user_id'), successFlash: successFlash, departments: departments, counts: counts, tests: tests, skills: skills, notifications: notifications});
																	});
																});
															}
														});
														//end role
													} else {
														//get all test events
														db.EventTest.find({ where: { EventId: events[r].id} }).success(function(eventTest) {
															db.Test.find({ where: { id: eventTest.TestId} }).success(function(test) {
																if(eventTest) {
																	tests[r] = {};
																	tests[r] = test;
																	tests[r].eventName = events[r].name;
																	tests[r].eventId = events[r].id;
																	db.EventUsers.count({ where: { EventId: events[r].id} }).success(function(euCount) {
																		tests[r].user_count = euCount;
																		db.Report.count({ where: { TestId: test.id} }).success(function(rCount) {
																			tests[r].test_taken_count = rCount;
																			db.Report.count({ where: ['"TestId" = ? AND "isPassed" = ?', test.id, true] }).success(function(pCount) {
																				tests[r].test_passed_count = pCount;
																				tests[r].test_not_taken_count = tests[r].user_count - tests[r].test_taken_count;
																				tests[r].test_failed_count = tests[r].test_taken_count - tests[r].test_passed_count;
																				get_test_details(++r);
																			});
																		});
																	});
																} else
																	get_test_details(++r);
															});
														});
													}
												};
												get_test_details(0);
											});
										} else {
											//get login activity
											query = 'select DISTINCT "UserId" from "Logins" where date=\'2014-'+month+'-'+(p+1)+'\' OR date=\'2015-'+month+'-'+(p+1)+'\'';
											db.sequelize.query(query, null, {raw: true}).success(function(l){
												daily_activity[p].count = l.length;
												get_login_for_each_day(++p);
											});
										}
									};
									get_login_for_each_day(0);
								//});
							} /*else {
								db.User.find({ where: { id: us[j].UserId} }).success(function(u) {
									if(u != null && u.department != null && u.department != '' && visited.indexOf(us.SkillId) == -1) {
										visited.push(us.SkillId);
										for(var x = 0; x < counts.length; x++) {
											if(counts[x].name == u.department) {
												//if(! crhs[j].date < crhs[j+1].date) {
													counts[x].count_modules_completed++;
													break;
												//}
											}
										}
									}
									update_count_for_modules_completed(++j);
								});
							}*/
						};
						update_count_for_modules_completed(us.length);
					});
				};
				get_users_count_for_modules_completed();
				
				/*var get_users_count = function(i) {
					if(users.length == i) {
						get_users_count_for_modules_completed();
					}else {
						db.CoachRatingHistory.findAll({ where: { UserId: users[i].id}, order: 'date DESC'}).success(function(crhs) {
							var update_count = function(j) {
								if(j == 1) {
									get_users_count(++i);
								} else {
									db.User.find({ where: { id: crhs[j].UserId} }).success(function(u) {
										if(u.department != null && u.department != '') {
											for(var x = 0; x < counts.length; x++) {
												if(counts[x].name == u.department) {
													if(crhs[j+1] != null && !(crhs[j].rating < crhs[j+1].rating)) {
														counts[x].count_coach_rating++;
														break;
													}
												}
											}
										}
										update_count(++j);
									});
								}
							};
							if(crhs.length > 0)
								update_count(0);
							else
								get_users_count(++i);
						});
					}
				};
				get_users_count(0);*/
			});
		});
	},
	
	//for each role, show how the users are performing - apprentice, rookie, master, wizard
	show_role_skill_report: function(req, res) {
		db.Role.find({where: {name: req.param('role_name')}}).success(function(role) {
			if(role) {
				db.RoleSkills.findAll({where: {RoleId: role.id}, limit: 4, order: '"SkillId" DESC'}).success(function(role_skills) {
					var all_skills = [];
					var get_role_skills = function(rs) {
						if(rs == role_skills.length) {
							var get_skills_data = function(sk) {
								if(sk == all_skills.length) {
									db.Role.findAll({where: {OrganizationId: parseInt(req.param('organization_id'))}}).success(function(roles) {
										res.render('hr_admin/show_role_skill_report', {oid: req.param('organization_id'), role: role, roles: roles, all_skills: all_skills});
									});
								} else {
									db.UserSkills.count({ where: ['"SkillId" = ? and   "level" = ?', all_skills[sk].id, 'wizard']}).success(function(wizard) {
										all_skills[sk].wizard = wizard;
										db.UserSkills.count({ where: ['"SkillId" = ? and   "level" = ?', all_skills[sk].id, 'master']}).success(function(master) {
											all_skills[sk].master = master;
											db.UserSkills.count({ where: ['"SkillId" = ? and   "level" = ?', all_skills[sk].id, 'apprentice']}).success(function(apprentice) {
												all_skills[sk].apprentice = apprentice;
												db.UserSkills.count({ where: ['"SkillId" = ? and   "level" = ?', all_skills[sk].id, 'rookie']}).success(function(rookie) {
													all_skills[sk].rookie = rookie;
													get_skills_data(++sk);
												});
											});
										});
									});
								}
							};
							get_skills_data(0);
						} else {
							db.Skill.find({where: {id: role_skills[rs].SkillId}, limit: 4}).success(function(skill) {
								all_skills.push(skill);
								get_role_skills(++rs);
							});
						}
					};
					get_role_skills(0);
				});
			} else {
				res.render('hr_admin/show_role_skill_report', {oid: req.param('organization_id'), role: null, roles: null, all_skills: null});
			}
		});
	},
	
	//show the login activity, for each month
	show_monthly_login_graph: function(req, res) {
		//db.Login.findAll({ where: ['"date" LIKE ?', '%-'+req.param('month')+'-%'] }).success(function(logins) {
			var split_date;
			var daily_activity = [];
			var no_of_days;
			var name;
			switch(req.param('month')) {
				case '01':	name = 'January'; no_of_days = 31; break;
				case '03':	name = 'March'; no_of_days = 31; break;
				case '05':	name = 'May'; no_of_days = 31; break;
				case '07':	name = 'July'; no_of_days = 31; break;
				case '08':	name = 'August'; no_of_days = 31; break;
				case '10':	name = 'October'; no_of_days = 31; break;
				case '12': 	name = 'December'; no_of_days = 31; break;
				case '04':	name = 'April'; no_of_days = 30; break;
				case '06':	name = 'June'; no_of_days = 30; break;
				case '09':	name = 'September'; no_of_days = 30; break;
				case '11': 	name = 'November'; no_of_days = 30; break;
				case '02': 	name = 'February'; no_of_days = 28; break;
			}
			for(var q = 0; q < no_of_days; q++) {
				daily_activity[q] = {};
				daily_activity[q].day = q+1;
				daily_activity[q].count = 0;
			}
			var get_login_for_each_day = function(p) {
				if(p == no_of_days) {
					res.render('hr_admin/show_monthly_login_graph', {name: name, daily_activity: daily_activity});
				} else {
					/*if(p < 9) {
						query = 'select DISTINCT "UserId" from "Logins" where date=\'2014-'+req.param('month')+'-'+(p+1)+'\'';
						db.sequelize.query(query, null, {raw: true}).success(function(l){
							daily_activity[p].count = l.length;
							get_login_for_each_day(++p);
						});
					} else {
						query = 'select DISTINCT "UserId" from "Logins" where date=\'2014-'+req.param('month')+'-'+(p+1)+'\'';
						db.sequelize.query(query, null, {raw: true}).success(function(l){
							daily_activity[p].count = l.length;
							get_login_for_each_day(++p);
						});
					}*/
					query = 'select DISTINCT "UserId" from "Logins" where date=\'2014-'+req.param('month')+'-'+(p+1)+'\' OR date=\'2015-'+req.param('month')+'-'+(p+1)+'\'';
					db.sequelize.query(query, null, {raw: true}).success(function(l){
						daily_activity[p].count = l.length;
						get_login_for_each_day(++p);
					});
				}
			};
			get_login_for_each_day(0);
		//});
	},
	
	//this is the quarter yearly login activity
	show_quarterly_login_graph: function(req, res) {
		var monthly_activity = [];
		var quarterly_activity = [];
		
		monthly_activity[0] = {};
		monthly_activity[0].month = 'Jan';
		monthly_activity[0].count = 0;
		
		monthly_activity[1] = {};
		monthly_activity[1].month = 'Feb';
		monthly_activity[1].count = 0;
		
		monthly_activity[2] = {};
		monthly_activity[2].month = 'Mar';
		monthly_activity[2].count = 0;
		
		monthly_activity[3] = {};
		monthly_activity[3].month = 'Apr';
		monthly_activity[3].count = 0;
		
		monthly_activity[4] = {};
		monthly_activity[4].month = 'May';
		monthly_activity[4].count = 0;
		
		monthly_activity[5] = {};
		monthly_activity[5].month = 'Jun';
		monthly_activity[5].count = 0;
		
		monthly_activity[6] = {};
		monthly_activity[6].month = 'Jul';
		monthly_activity[6].count = 0;
		
		monthly_activity[7] = {};
		monthly_activity[7].month = 'Aug';
		monthly_activity[7].count = 0;
		
		monthly_activity[8] = {};
		monthly_activity[8].month = 'Sep';
		monthly_activity[8].count = 0;
		
		monthly_activity[9] = {};
		monthly_activity[9].month = 'Oct';
		monthly_activity[9].count = 0;
		
		monthly_activity[10] = {};
		monthly_activity[10].month = 'Nov';
		monthly_activity[10].count = 0;
		
		monthly_activity[11] = {};
		monthly_activity[11].month = 'Dec';
		monthly_activity[11].count = 0;
		
		var get_login_for_each_month = function(i) {
			if(i == 12) {
				quarterly_activity[0] = monthly_activity[0].count + monthly_activity[1].count + monthly_activity[2].count + monthly_activity[3].count;
				quarterly_activity[1] = monthly_activity[4].count + monthly_activity[5].count + monthly_activity[6].count + monthly_activity[7].count;
				quarterly_activity[2] = monthly_activity[8].count + monthly_activity[9].count + monthly_activity[10].count + monthly_activity[11].count;
				res.render('hr_admin/show_quarterly_login_graph', {monthly_activity: monthly_activity, quarterly_activity: quarterly_activity});
			} else {
				if(i < 9) {
					db.Login.count({ where: ['"date" LIKE ?', '%-0'+(i+1)+'-%'] }).success(function(logins) {
						monthly_activity[i].count = logins;
						get_login_for_each_month(++i);
					});
				} else {
					db.Login.count({ where: ['"date" LIKE ?', '%-'+(i+1)+'-%'] }).success(function(logins) {
						monthly_activity[i].count = logins;
						get_login_for_each_month(++i);
					});
				}
			}
		};
		get_login_for_each_month(0);
	},
	
	//get list of all roles for this organization
	manage_roles: function(req, res) {
		db.User.find({ where: { id: req.user.id}, include: [db.Organization]}).success(function(hr) {
			db.Role.findAll({ where: { OrganizationId: hr.OrganizationId}}).success(function(roles) {
				res.render('hr_admin/manage_roles', {roles: roles, hr: hr});
			});
		});
	},
	
	//every role has a pre-test (optional). manager can delete a pre-test and assign a new one.
	delete_pre_test: function(req, res) {
		db.RoleTest.find({where: ['"RoleId" = ? AND "TestId" = ?', parseInt(req.param('role_id')), parseInt(req.param('test_id'))]}).success(function(rt){
			if(rt) {
				rt.destroy().success(function(){
					res.redirect('/hr_admin/get_skills_for_role/'+req.param('role_id'));
				});
			} else {
				res.redirect('/hr_admin/get_skills_for_role/'+req.param('role_id'));
			}
		});
	},
	
	//called from hr_admin/manage_roles.ejs
	//lists all the skills for the selected role
	//get pre-test for the selected role, if any
	get_skills_for_role: function(req, res) {
		db.RoleSkills.findAll({ where: { RoleId: parseInt(req.param('role_id'))}}).success(function(roleSkills) {
			var skills = [];
			var get_skills = function(i) {
				if(i == roleSkills.length) {
					var get_pre_test = function() {
						db.RoleTest.find({where: {RoleId: parseInt(req.param('role_id'))}}).success(function(rt){
							if(rt) {
								db.Test.find({where: {id: rt.TestId}}).success(function(test){
									res.render('hr_admin/get_skills_for_role', {skills: skills, role_id: req.param('role_id'), test: test});
								});
							} else {
								res.render('hr_admin/get_skills_for_role', {skills: skills, role_id: req.param('role_id'), test: null});
							}
						});
					};
					get_pre_test();
				} else {
					db.Skill.find({ where: { id: roleSkills[i].SkillId}}).success(function(skill) {
						if(skill)
							skills.push(skill);
						get_skills(++i);
					});
				}
			};
			get_skills(0);
		});
	},
	
	//interface to add a skill to a role
	//called from hr_admin/get_skills_for_role.ejs
	add_skills_to_role: function(req, res) {
		db.SkillGroup.findAll().success(function(skillGroups) {
			res.render('hr_admin/add_skills_to_role', {skillGroups: skillGroups, role_id: req.param('role_id')});
		});
	},
	
	//called from hr_admin/add_skills_to_role.ejs
	//list all the skills from a particular skill group
	get_skills_from_skill_group: function(req, res) {
		db.SkillGroupSkills.findAll({ where: { SkillGroupId: parseInt(req.param('skill_group_id'))}}).success(function(sgs) {
			var skills = [];
			var get_skills = function(i) {
				if(i == sgs.length) {
					res.render('hr_admin/get_skills_from_skill_group', {skills: skills, skill_group_id: req.param('skill_group_id'), role_id: req.param('role_id')});
				} else {
					db.Skill.find({ where: { id: sgs[i].SkillId}}).success(function(skill) {
						if(skill)
							skills.push(skill);
						get_skills(++i);
					});
				}
			};
			get_skills(0);
		});
	},
	
	//interface to create an event
	//called from hr_admin/dashboard-new.ejs
	create_event: function(req, res) {
		res.render('hr_admin/create_event');
	},
	
	//while creating an event, the first step is to enter the basic details like - 
	// event name, description, location, date and time
	// the second step is to assign a trainer to an event
	assign_trainer_to_event: function(req, res) {
		db.User.find({where: {id: parseInt(req.user.id)}}).success(function(hr) {
			db.User.findAll({ where: ['permission = ? and "OrganizationId" = ?', 'trainer', hr.OrganizationId]}).success(function(trainers) {
				var get_tags = function(i) {
					if(i == trainers.length) {
						res.render('hr_admin/assign_trainer_to_event', {trainers: trainers});
					} else {
						//for each trainer, get his/her skills
						db.UserTags.findAll({where: {UserId: trainers[i].id}}).success(function(ut){
							trainers[i].skills = [];
							var get_skills = function(j) {
								if(j == ut.length) {
									get_tags(++i);
								} else {
									db.Tag.find({where: {id: ut[j].TagId}}).success(function(tag){
										trainers[i].skills.push(tag);
										get_skills(++j);
									});
								}
							};
							get_skills(0);
						});
					}
				};
				get_tags(0);
			});
		});
	},
	
	//show event details, after assigning a trainer and users to an event
	//manager can edit the event name, description here
	show_event_details: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event) {
			res.render('hr_admin/show_event_details', {event: event});
		});
	},
	
	//second step of an event creation
	//assign trainer to an event
	//update the "ModeratorId" field for an event
	do_assign_trainer_to_event: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event) {
			event.updateAttributes({ModeratorId: parseInt(req.param('moderator_id'))}).success(function(){
				res.send('Trainer assigned to event', {
		            'Content-Type': 'text/plain'
		         }, 200);
			});
		});
	},
	
	//list all tests, so that manager can choose one test and create a test event
	create_test_event: function(req, res) {
		db.Test.findAll({order: 'id DESC'}).success(function(tests){
			res.render('hr_admin/create_test_event', {tests: tests});
		});
	},
	
	//third step of an event creation process
	//assign users to event
	assign_users_to_event: function(req, res) {
		db.User.find({ where: { id: parseInt(req.user.id)}, include: [db.Organization]}).success(function(hr) {
			db.Role.findAll({ where: { OrganizationId: hr.OrganizationId}}).success(function(roles) {
				res.render('hr_admin/assign_users_to_event', {roles: roles, hr: hr, event_id: req.param('event_id'), val: req.param('val')});
			});
		});
	},
	
	//third step of an event creation process
	//filter users based on skills, roles, batches
	filter_users_for_event_on_role: function(req, res) {
		var roles = req.param('str').split(',');
		var str = "";
		for(var i = 0; i< roles.length - 1; i++) {
			if(i == roles.length - 2)
				str = str + '"RoleId"='+roles[i];
			else
				str = str + '"RoleId"='+roles[i]+' OR ';
		}
		var query = 'select * from "Users" where '+str;
		db.sequelize.query(query, null, {raw: true}).success(function(us){
			var users = [];
			var get_users = function(j) {
				if(j == us.length) {
					res.render('hr_admin/filter_users_for_event', {users: users, val: req.param('val')});
				} else {
					db.User.find({where: {id: parseInt(us[j].id)}}).success(function(user) {
						if(user) {
							db.EventUsers.find({where: ['"EventId" = ? AND "UserId" = ?', parseInt(req.param('event_id')), user.id]}).success(function(eu){
								if(eu) {
									user.eventUser = true;
								} else
									user.eventUser = false;
								users.push(user);
								get_users(++j);
							});
						} else
							get_users(++j);
					});
				}
			};
			get_users(0);
		});
	},
	
	//third step of an event creation process
	//select a role, and then get all skills for this role
	//acts like a skill filter
	//users can be filtered based on a role/roles and skill/skills
	//this is an AND filter
	get_skills_based_on_role_filter: function(req, res) {
		//called from javascript function - get_role_filter_checkbox_values() in script.js
		//req.param('str') will be role id's which are comma separated
		var roles = req.param('str').split(',');
		var str = "";
		for(var i = 0; i< roles.length - 1; i++) {
			if(i == roles.length - 2)
				str = str + '"RoleId"='+roles[i];
			else
				str = str + '"RoleId"='+roles[i]+' OR ';
		}
		//str now looks like -
		//"RoleId" = 1 OR "RoleId" = 2 OR "RoleId" = 3
		var query = 'select DISTINCT "SkillId" from "RoleSkills" where '+str;
		db.sequelize.query(query, null, {raw: true}).success(function(roleSkills){
			var skills = [];
			var get_rs = function(j) {
				if(j == roleSkills.length) {
					res.render('hr_admin/get_skills_based_on_role_filter', {skills: skills, val: req.param('val')});
				} else {
					db.Skill.find({where: ['id = ?', parseInt(roleSkills[j].SkillId)]}).success(function(skill) {
						if(skill && skills.indexOf(skill) == -1)
							skills.push(skill);
						get_rs(++j);
					});
				}
			};
			get_rs(0);
		});
	},
	
	//third step of an event creation process
	//select a role, and then get all batches for this role
	//acts like a batch filter
	//users can be filtered based on a role/roles and batch/batches
	//this is an AND filter
	get_batches_based_on_role_filter: function(req, res) {
		var roles = req.param('str').split(',');
		var str = "";
		for(var i = 0; i< roles.length - 1; i++) {
			if(i == roles.length - 2)
				str = str + '"RoleId"='+roles[i];
			else
				str = str + '"RoleId"='+roles[i]+' OR ';
		}
		var query = 'select * from "Batches" where '+str;
		db.sequelize.query(query, null, {raw: true}).success(function(batches){
			res.render('hr_admin/get_batches_based_on_role_filter', {batches: batches, val: req.param('val')});
		});
	},
	
	//third step of an event creation process
	//filter users based on a batch
	filter_users_for_event_on_batch: function(req, res) {
		var batches = req.param('str1').split(',');
		var str1 = "";
		for(var i = 0; i< batches.length - 1; i++) {
			if(i == batches.length - 2)
				str1 = str1 + '"BatchId"='+batches[i];
			else
				str1 = str1 + '"BatchId"='+batches[i]+' OR ';
		}
		
		var query = 'select DISTINCT "UserId" from "BatchUsers" where '+str1;
		db.sequelize.query(query, null, {raw: true}).success(function(us){
			var users = [];
			var get_users = function(i) {
				if(i == us.length) {
					res.render('hr_admin/filter_users_for_event', {users: users, val: req.param('val')});
				} else {
					db.User.find({where: {id: us[i].UserId}}).success(function(user) {
						users.push(user);
						get_users(++i);
					});
				}
			};
			get_users(0);
		});
	},
	
	//third step of an event creation process
	//filter users based on a skill
	filter_users_for_event_on_skill: function(req, res) {
		var skills = req.param('str1').split(',');
		var str1 = "";
		for(var i = 0; i< skills.length - 1; i++) {
			if(i == skills.length - 2)
				str1 = str1 + '"SkillId"='+skills[i];
			else
				str1 = str1 + '"SkillId"='+skills[i]+' OR ';
		}
		
		var roles = req.param('str2').split(',');
		var str2 = "";
		for(i = 0; i< roles.length - 1; i++) {
			if(i == roles.length - 2 && roles[i] != '')
				str2 = str2 + '"RoleId"='+roles[i];
			else if(roles[i] != '')
				str2 = str2 + '"RoleId"='+roles[i]+' OR ';
		}
		
		if(str2 != '')
			str2 = ' AND '+str2;
		
		var query = 'select DISTINCT "UserId" from "UserSkills" where '+str1;
		db.sequelize.query(query, null, {raw: true}).success(function(us){
			var users = [];
			var user = {};
			var get_users = function(j) {
				if(j == us.length) {
					res.render('hr_admin/filter_users_for_event', {users: users, val: req.param('val')});
				} else {
					var query1 = 'select * from "Users" where "id" = '+parseInt(us[j].UserId)+str2;
					db.sequelize.query(query1, null, {raw: true}).success(function(u){
						user = u[0];
						if(user) {
							//this is an ajax view, if a user is already added, then it displays 'Added'
							//else it displays a '+' icon
							db.EventUsers.find({where: ['"EventId" = ? AND "UserId" = ?', parseInt(req.param('event_id')), user.id]}).success(function(eu){
								if(eu) {
									user.eventUser = true;
								} else
									user.eventUser = false;
								users.push(user);
								get_users(++j);
							});
						} else
							get_users(++j);
					});
				}
			};
			get_users(0);
		});
	},
	
	/*filter_users_for_event_on_skill: function(req, res) {
		var skills = req.param('str').split(',');
		var str = "";
		for(var i = 0; i< skills.length - 1; i++) {
			if(i == skills.length - 2)
				str = str + '"SkillId"='+skills[i];
			else
				str = str + '"SkillId"='+skills[i]+' OR ';
		}
		var query = 'select DISTINCT "UserId" from "UserSkills" where '+str;
		db.sequelize.query(query, null, {raw: true}).success(function(us){
			var users = [];
			var get_users = function(j) {
				if(j == us.length) {
					res.render('hr_admin/filter_users_for_event', {users: users, val: req.param('val')});
				} else {
					db.User.find({where: {id: parseInt(us[j].UserId)}}).success(function(user) {
						if(user) {
							db.EventUsers.find({where: ['"EventId" = ? AND "UserId" = ?', parseInt(req.param('event_id')), user.id]}).success(function(eu){
								if(eu) {
									user.eventUser = true;
								} else
									user.eventUser = false;
								users.push(user);
								get_users(++j);
							});
						} else
							get_users(++j);
					});
				}
			};
			get_users(0);
		});
	},*/
	
	//third step of an event creation process
	//add a single user or multiple users
	add_users_to_event: function(req, res) {
		var users = req.param('str').split(',');
		var add_users_to_event = function(i) {
			if(i == users.length-1) {
				res.send('Users added to event', {
		            'Content-Type': 'text/plain'
		         }, 200);
			} else {
				db.EventUsers.findOrCreate({EventId: parseInt(req.param('event_id')), UserId: parseInt(users[i])}).success(function() {
					add_users_to_event(++i);
				});
			}
		};
		add_users_to_event(0);
	},
	
	//final step before an event is created
	//show event name, description
	//manger can edit these fields
	//called from hr_admin/assign_users_to_event.ejs and javascript call -
	//add_users_to_event(val) in script.js
	show_test_event_name_desc: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			res.render('hr_admin/show_test_event_name_desc', {event: event});
		});
	},
	
	//final step before an event is created
	//manager can edit name, description etc for an event
	edit_event_field: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			res.render('hr_admin/edit_event_field', {event: event, val: req.param('val')});
		});
	},
	
	//update the edited values for an event accordingly
	//this is the final step before an event is created
	do_edit_event_field: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			switch(req.param('val')) {
				case 'name': event.updateAttributes({name: req.param('field')}).success(function(){
					res.redirect('/hr_admin/show_event_field/'+req.param('val')+'/'+event.id);
				});
				break;
				case 'description': event.updateAttributes({description: req.param('field')}).success(function(){
					res.redirect('/hr_admin/show_event_field/'+req.param('val')+'/'+event.id);
				});
				break;
				case 'date': event.updateAttributes({date: req.param('field')}).success(function(){
					res.redirect('/hr_admin/show_event_field/'+req.param('val')+'/'+event.id);
				});
				break;
				case 'time': event.updateAttributes({time: req.param('field')}).success(function(){
					res.redirect('/hr_admin/show_event_field/'+req.param('val')+'/'+event.id);
				});
				break;
				case 'location': event.updateAttributes({location: req.param('field')}).success(function(){
					res.redirect('/hr_admin/show_event_field/'+req.param('val')+'/'+event.id);
				});
				break;
			}
		});
	},
	
	//show the updated field, after an event field is edited
	show_event_field: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			res.render('hr_admin/show_event_field', {event: event, val: req.param('val')});
		});
	},
	
	//during the event creation process, delete an event, if you wish to
	delete_new_event: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			var get_event_users = function() {
				db.EventUsers.findAll({where: {EventId: parseInt(req.param('event_id'))}}).success(function(eu){
					var delete_event_users = function(i) {
						if(i == eu.length) {
							event.destroy().success(function(){
								res.redirect('/hr_admin/dashboard');
							});
						} else {
							eu[i].destroy().success(function(){
								delete_event_users(++i);
							});
						}
					};
					delete_event_users(0);
				});
			};
			
			if(event.type == 'Test') {
				db.EventTest.find({where: {EventId: parseInt(req.param('event_id'))}}).success(function(et){
					et.destroy().success(function(){
						get_event_users();
					});
				});
			} else
				get_event_users();
		});
	},
	
	//test event can be edited
	//test already assigned to a test event can be deleted and 
	//a new test can be addedd
	edit_test_event: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			db.EventTest.find({where: {EventId: parseInt(req.param('event_id'))}}).success(function(et){
				et.destroy().success(function(){
					db.Test.find({where: {name: req.param('test_name')}}).success(function(test){
						db.EventTest.findOrCreate({EventId: parseInt(req.param('event_id')), TestId: test.id}).success(function(event){
							res.send('Edited event test', {
					            'Content-Type': 'text/plain'
					         }, 200);
						});
					});
				});
			});
		});
	},
	
	//manage users
	//manager can edit / add users
	//import users, buy licenses is static
	manage_users: function(req, res) {
		res.render('hr_admin/manage_users');
	},
	
	//called from hr_admin/manage_users.ejs
	add_users: function(req, res) {
		db.User.find({ where: { id: parseInt(req.user.id)}, include: [db.Organization]}).success(function(hr) {
			db.Role.findAll({ where: { OrganizationId: hr.OrganizationId}}).success(function(roles) {
				res.render('hr_admin/add_users', {roles: roles, hr: hr});
			});
		});
	},
	
	//while adding a user, check if the username already exists
	//called from hr_admin/add_users.ejs >> username_check(obj) in script.js
	//an ajax call
	check_username: function(req, res) {
		db.User.find({ where: ['username = ? OR email = ?', req.param('username'), req.param('username')]}).success(function(user){
			if(user) {
				res.send('Username already exists', {
		            'Content-Type': 'text/plain'
		         }, 200);
			} else {
				res.send('Valid username', {
		            'Content-Type': 'text/plain'
		         }, 200);
			}
		});
	},
	
	//manager can add a new user
	//called from hr_admin/add_users.js >> create_user() in script.js
	//same code from user controller to create a new user
	//only difference is that, it is ajax here
	create_user: function( req, res ) {
		//encrypt the password
		var hashedPassword = passwordHash.generate(req.param('password'));
		req.body.password = hashedPassword;
		db.User.create(req.body).success(function(user) {
			db.Role.find({ where: { id: req.param('RoleId') }, include: [db.Skill] }).success(function(role) {
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
			"Password: "+req.param('username')+"<br/>" +
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
							    	res.send('Unable to create user', {
							            'Content-Type': 'text/plain'
							         }, 200);
							    }
							    res.send('User created successfully', {
						            'Content-Type': 'text/plain'
						         }, 200);
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
	"Password: "+req.param('username')+"<br/>" +
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
					    	res.send('Unable to create user', {
					            'Content-Type': 'text/plain'
					         }, 200);
					    }
					    res.send('User created successfully', {
				            'Content-Type': 'text/plain'
				         }, 200);
					});
					
					//end
				}
			}).error(function(errors) {
				console.log("Error finding Roles", errors);
				res.send('Unable to create user', {
		            'Content-Type': 'text/plain'
		         }, 200);
			});
			
			
	    }).error(function(errors) {
			console.log("Error 3", errors);
			res.send('Unable to create user', {
	            'Content-Type': 'text/plain'
	         }, 200);
		});
	},
	
	//called from hr_admin/manage_users.ejs
	//edit users
	view_users: function(req, res) {
		db.User.find({ where: { id: req.user.id}}).success(function(hr) {
			db.Role.findAll({ where: { OrganizationId: hr.OrganizationId}}).success(function(roles) {
				res.render('hr_admin/view_users', {roles: roles});
			});
		});
	},
	
	//filter users based on a role
	//called from hr_admin/view_users.ejs
	role_filter_users: function(req, res) {
		db.Role.find({ where: { id: parseInt(req.param('role'))}}).success(function(role) {
			db.User.findAll({ where: ['"RoleId" = ?', role.id]}).success(function(users) {
				res.render('hr_admin/role-filter-users', {role: role, users: users});
			});
		});
	},
	
	//called from hr_admin/role-filter-users.ejs
	//click on a user, to view his/her profile
	view_user_profile: function(req, res) {
		db.User.find({ where: { id: parseInt(req.param('user_id'))}, include: [db.Role, db.Skill]}).success(function(user) {
			db.User.find({ where: { id: user.CoachId}}).success(function(coach) {
				if(coach) user.coach = coach;
				res.render('hr_admin/view_user_profile', {user: user});
			});
		});
	},
	
	//manager can edit the "CoachId" for user
	//called from hr_admin/view_user_profile.ejs
	replace_coach: function( req, res ) {
		db.User.find({ where: { id: parseInt(req.user.id)}}).success(function(hr) {
			db.User.findAll({ where: ['"OrganizationId" = ? AND permission = ?', hr.OrganizationId, 'coach']}).success(function(coaches) {
				res.render('hr_admin/replace-coach', {coaches: coaches, user_id: req.param('user_id')});
			});
		});
	},
	
	//update the "CoachId" field for user
	do_replace_coach: function( req, res ) {
		db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
			user.updateAttributes({CoachId: parseInt(req.param('coach_id'))}).success(function(){
				res.redirect('/hr_admin/show_coach/'+user.id);
			});
		});
	},
	
	//ajax call
	//shows the updated "CoachId" field for user
	show_coach: function(req, res) {
		db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
			db.User.find({ where: { id: user.CoachId}}).success(function(coach) {
				if(coach) user.coach = coach;
				res.render('hr_admin/show_coach', {user: user});
			});
		});
	},
	
	//manager can edit the "RoleId" for user
	//called from hr_admin/view_user_profile.ejs
	replace_role: function( req, res ) {
		db.User.find({ where: { id: parseInt(req.user.id)}}).success(function(hr) {
			db.Role.findAll({ where: ['"OrganizationId" = ?', hr.OrganizationId]}).success(function(roles) {
				res.render('hr_admin/replace_role', {roles: roles, user_id: req.param('user_id')});
			});
		});
	},
	
	//update the "RoleId" field for user
	do_replace_role: function( req, res ) {
		db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
			user.updateAttributes({RoleId: parseInt(req.param('role_id'))}).success(function(){
				res.redirect('/hr_admin/show_role/'+user.id);
			});
		});
	},
	
	//ajax call
	//shows the updated "RoleId" field for user
	show_role: function(req, res) {
		db.User.find({ where: { id: parseInt(req.param('user_id'))}, include:[db.Role]}).success(function(user) {
			res.render('hr_admin/show_role', {user: user});
		});
	},
	
	//static calendar view
	//called from hr_admin/dashboard-new.ejs
	list_events_calendar: function(req, res) {
		res.render('hr_admin/list_events_calendar');
	},
	
	//called from hr_admin/question_analytics_report.ejs
	//used for either role test or an event test
	//for role test, req.param('event_id') is null
	//for event test, req.param('role_id') is null
	answer_analytics_report: function(req, res) {
		if(req.param('event_id') != null) {
			db.Answer.find({ where: { id: parseInt(req.param('answer_id'))} }).success(function(answer) {
				var query = 'select * from "Users" u, "ReportDetails" r,"EventUsers" e where "AnswerId"='+parseInt(req.param('answer_id'))+' and "ProblemId"='+parseInt(req.param('problem_id'))+' and r."TestId"='+parseInt(req.param('test_id'))+' and e."UserId"=r."UserId" and e."UserId" = u.id and e."EventId"='+parseInt(req.param('event_id'))+' order by u.id asc';
				db.sequelize.query(query, null, {raw: true}).success(function(rd){
					var users = [];
					var get_users = function(i) {
						if(i == rd.length) {
							res.render('hr_admin/answer_analytics_report', {event_id: req.param('event_id'), role_id: null, users: rd, answer: answer});
						} else {
							db.Role.find({ where: { id: rd[i].RoleId} }).success(function(role) {
								rd[i].role = role;
								get_users(++i);
							});
						}
					};
					get_users(0);
				});
			});
		} else {
			db.RoleTest.find({where: {RoleId: parseInt(req.param('role_id'))}}).success(function(rt) {
				db.Answer.find({ where: { id: parseInt(req.param('answer_id'))} }).success(function(answer) {
					var query = 'select * from "Users" u, "ReportDetails" r where "AnswerId"='+parseInt(req.param('answer_id'))+' and "ProblemId"='+parseInt(req.param('problem_id'))+' and r."TestId"='+parseInt(rt.TestId)+' and r."UserId" = u.id and u."RoleId"='+parseInt(rt.RoleId)+' order by u.id asc';
					db.sequelize.query(query, null, {raw: true}).success(function(rd){
						var users = [];
						var get_users = function(i) {
							if(i == rd.length) {
								res.render('hr_admin/answer_analytics_report', {event_id: null, role_id: req.param('role_id'), users: rd, answer: answer});
							} else {
								db.Role.find({ where: { id: rd[i].RoleId} }).success(function(role) {
									rd[i].role = role;
									get_users(++i);
								});
							}
						};
						get_users(0);
					});
				});
			});
		}
	},
	
	//called from hr_admin/test_analytics_report.ejs
	//used for either role test or an event test
	//for role test, req.param('event_id') is null
	//for event test, req.param('role_id') is null
	question_analytics_report: function(req, res) {
		if(req.param('event_id') != null) {
			db.Problem.find({ where: { id: parseInt(req.param('problem_id'))} }).success(function(problem) {
				db.Answer.findAll({ where: { ProblemId: problem.id} }).success(function(answers) {
					var get_count = function(i) {
						if(i== answers.length) {
							res.render('hr_admin/question_analytics_report', {event_id: req.param('event_id'), role_id: null, problem: problem, answers: answers, test_id: req.param('test_id')});
						} else {
							var query = 'select count(*) from "ReportDetails" r,"EventUsers" e where "AnswerId"='+answers[i].id+' and "ProblemId"='+parseInt(req.param('problem_id'))+' and r."TestId"='+parseInt(req.param('test_id'))+' and e."UserId"=r."UserId" and e."EventId"='+parseInt(req.param('event_id'));
							db.sequelize.query(query, null, {raw: true}).success(function(result1){
								answers[i].count = result1.length > 0 ? result1[0].count : 0;
								get_count(++i);
							});
						}
					};
					get_count(0);
				});
			});
		} else {
			db.RoleTest.find({where: {RoleId: parseInt(req.param('role_id'))}}).success(function(rt) {
				db.Problem.find({ where: { id: parseInt(req.param('problem_id'))} }).success(function(problem) {
					db.Answer.findAll({ where: { ProblemId: problem.id} }).success(function(answers) {
						var get_count = function(i) {
							if(i== answers.length) {
								res.render('hr_admin/question_analytics_report', {event_id: null, role_id: req.param('role_id'), problem: problem, answers: answers, test_id: req.param('test_id')});
							} else {
								var query = 'select count(*) from "ReportDetails" r,"Users" e where "AnswerId"='+answers[i].id+' and "ProblemId"='+parseInt(req.param('problem_id'))+' and r."TestId"='+parseInt(rt.TestId)+' and e."id"=r."UserId" and e."RoleId"='+parseInt(rt.RoleId);
								db.sequelize.query(query, null, {raw: true}).success(function(result1){
									answers[i].count = result1.length > 0 ? result1[0].count : 0;
									get_count(++i);
								});
							}
						};
						get_count(0);
					});
				});
			});
		}
	},
	
	//called from hr_admin/test_analytics_report.ejs
	//used for either role test or an event test
	//for role test, req.param('event_id') is null
	//for event test, req.param('role_id') is null
	question_right_stats: function(req, res) {
		if(req.param('event_id') != null) {
			db.EventTest.find({ where: ['"TestId" = ? AND "EventId" = ?', parseInt(req.param('test_id')), parseInt(req.param('event_id'))] }).success(function(eventTest) {
				db.TestProblems.findAll({ where: { TestId: eventTest.TestId}, order: 'id asc' }).success(function(tp) {
					var get_stats = function(i) {
						if(i == tp.length) {
							res.render('hr_admin/question_right_stats', {tp: tp});
						} else {
							var query = 'select count(*) from "ReportDetails" r,"EventUsers" e where "ProblemId"='+tp[i].ProblemId+' and r."TestId"='+eventTest.TestId+' and e."UserId"=r."UserId" and e."EventId"='+eventTest.EventId+' and "isAnswer" = true';
							db.sequelize.query(query, null, {raw: true}).success(function(result1){
								db.Problem.find({where: {id: tp[i].ProblemId}}).success(function(p){
									tp[i].count = result1.length > 0 ? result1[0].count : 0;
									tp[i].problem = p;
									get_stats(++i);
								});
							});
						}
					};
					get_stats(0);
				});
			});
		} else {
			db.RoleTest.find({ where: ['"RoleId" = ?', parseInt(req.param('role_id'))] }).success(function(eventTest) {
				db.TestProblems.findAll({ where: { TestId: eventTest.TestId}, order: 'id asc' }).success(function(tp) {
					var get_stats = function(i) {
						if(i == tp.length) {
							res.render('hr_admin/question_right_stats', {tp: tp});
						} else {
							var query = 'select count(*) from "ReportDetails" r,"Users" e where "ProblemId"='+tp[i].ProblemId+' and r."TestId"='+eventTest.TestId+' and e."id"=r."UserId" and e."RoleId"='+eventTest.RoleId+' and "isAnswer" = true';
							db.sequelize.query(query, null, {raw: true}).success(function(result1){
								db.Problem.find({where: {id: tp[i].ProblemId}}).success(function(p){
									tp[i].count = result1.length > 0 ? result1[0].count : 0;
									tp[i].problem = p;
									get_stats(++i);
								});
							});
						}
					};
					get_stats(0);
				});
			});
		}
	},
	
	//called from hr_admin/test_analytics_report.ejs
	//used for either role test or an event test
	//for role test, req.param('event_id') is null
	//for event test, req.param('role_id') is null
	question_wrong_stats: function(req, res) {
		if(req.param('event_id') != null) {
			db.EventTest.find({ where: ['"TestId" = ? AND "EventId" = ?', parseInt(req.param('test_id')), parseInt(req.param('event_id'))] }).success(function(eventTest) {
				db.TestProblems.findAll({ where: { TestId: eventTest.TestId}, order: 'id asc' }).success(function(tp) {
					var get_stats = function(i) {
						if(i == tp.length) {
							res.render('hr_admin/question_right_stats', {tp: tp});
						} else {
							var query = 'select count(*) from "ReportDetails" r,"EventUsers" e where "ProblemId"='+tp[i].ProblemId+' and r."TestId"='+eventTest.TestId+' and e."UserId"=r."UserId" and e."EventId"='+eventTest.EventId+' and "isAnswer" = false or "isAnswer" IS NULL';
							db.sequelize.query(query, null, {raw: true}).success(function(result1){
								db.Problem.find({where: {id: tp[i].ProblemId}}).success(function(p){
									tp[i].count = result1.length > 0 ? result1[0].count : 0;
									tp[i].problem = p;
									get_stats(++i);
								});
							});
						}
					};
					get_stats(0);
				});
			});
		} else {
			db.RoleTest.find({ where: ['"RoleId" = ?', parseInt(req.param('role_id'))] }).success(function(eventTest) {
				db.TestProblems.findAll({ where: { TestId: eventTest.TestId}, order: 'id asc' }).success(function(tp) {
					var get_stats = function(i) {
						if(i == tp.length) {
							res.render('hr_admin/question_right_stats', {tp: tp});
						} else {
							var query = 'select count(*) from "ReportDetails" r,"Users" e where "ProblemId"='+tp[i].ProblemId+' and r."TestId"='+eventTest.TestId+' and e."id"=r."UserId" and e."RoleId"='+eventTest.RoleId+' and "isAnswer" = false or "isAnswer" IS NULL';
							db.sequelize.query(query, null, {raw: true}).success(function(result1){
								db.Problem.find({where: {id: tp[i].ProblemId}}).success(function(p){
									tp[i].count = result1.length > 0 ? result1[0].count : 0;
									tp[i].problem = p;
									get_stats(++i);
								});
							});
						}
					};
					get_stats(0);
				});
			});
		}
	},
	
	//report for test events
	//called from hr_admin/dashboard-new.ejs
	test_report: function(req, res) {
		db.EventTest.find({ where: ['"TestId" = ? AND "EventId" = ?', parseInt(req.param('test_id')), parseInt(req.param('event_id'))] }).success(function(eventTest) {
			if(eventTest) {
				db.Test.find({ where: { id: eventTest.TestId} }).success(function(test) {
					res.render('hr_admin/test_report', {test: test, test_id: req.param('test_id'), event_id: req.param('event_id')});
				});
			} 
		});
	},
	
	//called from hr_admin/test_report.ejs
	//gives the analytics for a test
	//used for either role test or an event test
	//for role test, req.param('event_id') is null
	//for event test, req.param('role_id') is null
	test_analytics_report: function(req, res) {
		if(req.param('event_id') != null) { //test event
			db.EventTest.find({ where: ['"TestId" = ? AND "EventId" = ?', parseInt(req.param('test_id')), parseInt(req.param('event_id'))] }).success(function(eventTest) {
				if(eventTest) {
					db.Test.find({ where: { id: eventTest.TestId} }).success(function(test) {
						db.EventUsers.count({ where: { EventId: eventTest.EventId} }).success(function(euCount) {
							test.user_count = euCount;
							var query1 = 'select count(*) from "Reports" r,"EventUsers" e, "EventTests" t where r."UserId" = e."UserId" and e."EventId"='+eventTest.EventId+' and r."TestId"=t."TestId" and e."EventId"=t."EventId" and r.status=\'complete\'';
							db.sequelize.query(query1, null, {raw: true}).success(function(result1){
								test.test_taken_count = result1.length > 0 ? result1[0].count : 0;
								var query2 = 'select count(*) from "Reports" r,"EventUsers" e, "EventTests" t where r."UserId" = e."UserId" and e."EventId"='+eventTest.EventId+' and r."TestId"=t."TestId" and e."EventId"=t."EventId" and r.status=\'complete\' and r."isPassed" = true';
								db.sequelize.query(query2, null, {raw: true}).success(function(result2){
									test.test_passed_count = result2.length > 0 ? result2[0].count : 0;
									test.test_not_taken_count = test.user_count - test.test_taken_count;
									test.test_failed_count = test.test_taken_count - test.test_passed_count;
									db.TestProblems.findAll({ where: ['"TestId" = ?', test.id], order: 'id asc'}).success(function(testProblems) {
										var get_d_level = function(i) {
											if(i == testProblems.length) {
												res.render('hr_admin/test_analytics_report', {test: test, testProblems: testProblems, event_id: req.param('event_id'), role_id: null});
											} else {
												db.Problem.find({where: {id: testProblems[i].ProblemId}}).success(function(p){
													testProblems[i].problem = p;
													get_d_level(++i);
												});	
											}
										};
										get_d_level(0);
									});
								});
							});
						});
					});
				} else {
					var testProblems = [];
					res.render('hr_admin/test_analytics_report', {event_id: null, role_id: null, test: null, testProblems: testProblems});
				}
			});
		} else { //role test
			db.User.find({where: {id: parseInt(req.user.id)}}).success(function(hr) {
				db.Role.find({where: {id: parseInt(req.param('role_id'))}}).success(function(role) {
					db.RoleTest.find({where: {RoleId: role.id}}).success(function(rt) {
						if(rt) {
							db.Test.find({ where: { id: rt.TestId} }).success(function(test) {
								db.User.count({ where: { RoleId: role.id} }).success(function(euCount) {
									test.user_count = euCount;
									var query1 = 'select count(*) from "Reports" r,"Users" u where r."TestId"='+test.id+' and r."UserId"=u."id" and u."RoleId"='+rt.RoleId+' and u."OrganizationId"='+hr.OrganizationId+' and "status" = \'complete\'';
									db.sequelize.query(query1, null, {raw: true}).success(function(result1){
										test.test_taken_count = result1.length > 0 ? result1[0].count : 0;
										var query2 = 'select count(*) from "Reports" r,"Users" u where r."TestId"='+test.id+' and r."UserId"=u."id" and u."RoleId"='+rt.RoleId+' and u."OrganizationId"='+hr.OrganizationId+' and "status" = \'complete\' and r."isPassed" = true';
										db.sequelize.query(query2, null, {raw: true}).success(function(result2){
											test.test_passed_count = result2.length > 0 ? result2[0].count : 0;
											test.test_not_taken_count = test.user_count - test.test_taken_count;
											test.test_failed_count = test.test_taken_count - test.test_passed_count;
											db.TestProblems.findAll({ where: ['"TestId" = ?', test.id], order: 'id asc'}).success(function(testProblems) {
												var get_d_level = function(i) {
													if(i == testProblems.length) {
														res.render('hr_admin/test_analytics_report', {test: test, testProblems: testProblems, event_id: null, role_id: req.param('role_id')});
													} else {
														db.Problem.find({where: {id: testProblems[i].ProblemId}}).success(function(p){
															testProblems[i].problem = p;
															get_d_level(++i);
														});	
													}
												};
												get_d_level(0);
											});
										});
									});
								});
							});
						} else {
							res.render('hr_admin/test_analytics_report', {test: null, testProblems: null, event_id: null, role_id: req.param('role_id')});
						}
					});
				});
			});
		}
	},
	
	//called from hr_admin/test_report.ejs
	//gives the score card for all users for a test (both role test or an event test)
	test_report_card: function(req, res) {
		var query1 = 'select distinct "whatIsTested" from "TestProblems" t,"Problems" p where "TestId"='+parseInt(req.param('test_id'))+' and p.id = t."ProblemId"';
		db.sequelize.query(query1, null, {raw: true}).success(function(result1){
			var w = {};
			w.domain = [];
			w.totalScore = [];
			for(var key in result1) {
				w.domain.push(result1[key].whatIsTested);
			}
			for(var i = 0; i < w.domain.length; i++) {
				w.totalScore[i] = 0;
			}
			var query2 = 'select * from "Users" u, "Reports" r,"EventUsers" e, "EventTests" t where u.id = r."UserId" and r."UserId" = e."UserId" and e."EventId"='+parseInt(req.param('event_id'))+' and r."TestId"=t."TestId" and e."EventId"=t."EventId" and r.status=\'complete\' order by u.id asc';
			var max = 0;
			db.sequelize.query(query2, null, {raw: true}).success(function(result2){
				result2.forEach(function(r){
					r.domainScore = [];
					for(i = 0; i < w.domain.length; i++) {
						r.domainScore[i] = 0;
					}
				});
				db.Test.find({ where: { id: parseInt(req.param('test_id'))} }).success(function(test) {
					db.TestProblems.findAll({where: {TestId: test.id}}).success(function(tp) {
						db.TestProblems.sum('positiveScore', {where: {TestId: test.id}}).success(function(ps) {
							var get_p = function(x) {
								if(x == tp.length) {
									var get_user_score = function(y) {
										if(y == result2.length) {
											res.render('hr_admin/test_report_card', {max: max, ps: ps, w: w, test: test, users: result2, test_id: req.param('test_id'), event_id: req.param('event_id')});
										} else {
											if(result2[y].score > max) {
												max = result2[y].score;
											}
											db.ReportDetail.findAll({ where: ['"TestId" = ? AND "UserId" = ?', test.id, result2[y].UserId], order: 'id asc'}).success(function(rds) {
												var get_domain_score = function(z) {
													if(z == rds.length) {
														get_user_score(++y);
													} else {
														db.Problem.find({where: {id: rds[z].ProblemId}}).success(function(p) {
															var index = w.domain.indexOf(p.whatIsTested);
															result2[y].domainScore[index] += rds[z].score;
															get_domain_score(++z);
														});
													}
												};
												get_domain_score(0);
											});
										}
									};
									get_user_score(0);
								} else {
									db.Problem.find({where: {id: tp[x].ProblemId}}).success(function(p) {
										var index = w.domain.indexOf(p.whatIsTested);
										w.totalScore[index] += tp[x].positiveScore;
										get_p(++x);
									});
								}
							};
							get_p(0);
						});
					});
				});
			});
		});
	},
	
	//deprecated
	calendar: function(req, res) {
		res.render('hr_admin/calendar');
	},
	
	//deprecated
	test_analytics: function(req, res) {
		db.EventTest.find({ where: { TestId: parseInt(req.param('test_id'))} }).success(function(eventTest) {
			db.Test.find({ where: { id: eventTest.TestId} }).success(function(test) {
				db.TestProblems.findAll({where: {TestId: test.id}}).success(function(tp){
					var total_score = 0;
					var get_total_test_score = function(i) {
						if(i == tp.length) {
							switch(req.param('val')) {
								case 'all':				db.EventUsers.findAll({ where: { EventId: eventTest.EventId} }).success(function(eventUsers) {
															var all_users = [];
															var get_all_users = function(a) {
																if(a == eventUsers.length) {
																	res.render('hr_admin/test_analytics_all', {users: all_users, test_id: test.id, test: test});
																} else {
																	db.User.find({ where: { id: eventUsers[a].UserId} }).success(function(user) {
																		all_users.push(user);
																		get_all_users(++a);
																	});
																}
															};
															get_all_users(0);
														});
														break;
								case 'test_taken':		db.Report.findAll({ where: { TestId: test.id} }).success(function(ttu) {
														var test_taken_users = [];
															var get_test_taken_users = function(b) {
																if(b == ttu.length) {
																	res.render('hr_admin/test_analytics_test_taken', {users: test_taken_users, test_id: test.id, test: test});
																} else {
																	db.User.find({ where: { id: ttu[b].UserId} }).success(function(user) {
																		test_taken_users.push(user);
																		get_test_taken_users(++b);
																	});
																}
															};
															get_test_taken_users(0);
														});
														break;
								case 'test_not_taken':	db.EventUsers.findAll({ where: { EventId: eventTest.EventId} }).success(function(eventUsers) {
															db.Report.findAll({ where: { TestId: test.id} }).success(function(ttu) {
																var test_not_taken_users = [];
																var flag = false;
																var get_test_not_taken_users = function(c) {
																	if(c == eventUsers.length) {
																		res.render('hr_admin/test_analytics_test_not_taken', {users: test_not_taken_users, test_id: test.id, test: test});
																	} else {
																		flag = false;
																		for(var x = 0; x < ttu.length; x++) {
																			if(eventUsers[c].UserId == ttu[x].UserId) {
																				flag = true;
																			}
																		}
																		if(flag == false) {
																			db.User.find({ where: { id: eventUsers[c].UserId} }).success(function(user) {
																				test_not_taken_users.push(user);
																				get_test_not_taken_users(++c);
																			});
																		} else 
																			get_test_not_taken_users(++c);
																	}
																}; 
																get_test_not_taken_users(0);
															});
														});
														break;
								case 'passed':			db.Report.findAll({ where: ['"TestId" = ? AND "isPassed" = ?', test.id, true] }).success(function(tpu) {
															var test_passed_users = [];
															var get_test_passed_users = function(d) {
																if(d == tpu.length) {
																	res.render('hr_admin/test_analytics_passed', {users: test_passed_users, test_id: test.id, test: test, total_score: total_score});
																} else {
																	db.User.find({ where: { id: tpu[d].UserId} }).success(function(user) {
																		user.score = tpu[d].score;
																		test_passed_users.push(user);
																		get_test_passed_users(++d);
																	});
																}
															};
															get_test_passed_users(0);
														});
														break;
								case 'failed':			db.Report.findAll({ where: { TestId: test.id} }).success(function(ttu) {
															db.Report.findAll({ where: ['"TestId" = ? AND "isPassed" = ?', test.id, true] }).success(function(tpu) {
																var test_failed_users = [];
																var flag = false;
																var get_test_failed_users = function(e) {
																	if(e == ttu.length) {
																		res.render('hr_admin/test_analytics_failed', {users: test_failed_users, test_id: test.id, test: test, total_score: total_score});
																	} else {
																		flag = false;
																		for(var y = 0; y < tpu.length; y++) {
																			if(ttu[e].UserId == tpu[y].UserId) {
																				flag = true;
																			}
																		}
																		if(flag == false) {
																			db.User.find({ where: { id: ttu[e].UserId} }).success(function(user) {
																				user.score = ttu[e].score;
																				test_failed_users.push(user);
																				get_test_failed_users(++e);
																			});
																		} else 
																			get_test_failed_users(++e);
																	}
																}; 
																get_test_failed_users(0);
															});
														});
														break;
							}
						} else {
							total_score += tp[i].positiveScore;
							get_total_test_score(++i);
						}
					};
					get_total_test_score(0);
				});
			});
		});
	},
	
	//deprecated
	stats: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		res.render('hr_admin/stats', {successFlash: successFlash});
	},
	
	//deprecated
	track: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		db.User.find({ where: { id: parseInt(req.user.id)} , include: [db.Organization]}).success(function(hr) {
			res.render('hr_admin/track', {hr: hr, successFlash: successFlash});
		});
	},
	
	//deprecated
	new_role: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		var user_id = req.param('user_id');
		
		db.User.find({ where: { id: user_id} , include: [db.Organization]}).success(function(user) {
			res.render('hr_admin/new_role', {user: user, user_id: user_id, successFlash: successFlash});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('hr_admin/dashboard', {errors: errors});
		});
	},
	
	//called from hr_admin/manage_roles.ejs
	do_create_role: function(req, res) {
		db.Role.create({name: req.param('role_name'), OrganizationId: parseInt(req.param('oid'))}).success(function(role) {
			req.flash('info', "Role "+role.name+" created");
			res.redirect('/hr_admin/manage_roles');
		}).error(function(errors) {
			res.redirect('/hr_admin/dashboard');
		});
	},
	
	//deprecated
	list_roles: function(req, res) {
		db.User.find({ where: { id: req.param('user_id')} , include: [db.Organization]}).success(function(user) {
			//user.organizations.forEach(function(organization){
				
				db.Role.findAll({ where: {OrganizationId: user.OrganizationId} }).success(function(roles) {
					res.render('hr_admin/list_roles', {user:user, user_id: req.param('user_id'), roles: roles, successFlash: req.flash('info')[0]});
				}).error(function(error) {
					console.log('Error', error);
					res.render('hr_admin/dashboard', {errors: errors});
				});
				
			//});
			
			
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('hr_admin/dashboard', {errors: errors});
		});
	},
	
	//deprecated
	delete_role: function(req, res) {
		db.Role.find({ where: { id: req.param('role_id') } }).success(function(role) {
			role.destroy().success(function() {
				req.flash('info', "Role deleted");
				res.redirect('hr_admin/list_roles/'+req.param('user_id'));
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('hr_admin/dashboard', {errors: errors});
		});
	},
	
	//never used
	trainer_dashboard: function(req, res) {
		//db.User.find({ where: { id: req.user.id} , include: [db.Organization]}).success(function(user) {
			db.Event.findAll({ where: {ModeratorId: parseInt(req.param('user_id'))} }).success(function(events) {
				function initiator(id, fname, lname)
				{
					this.id = id;
					this.first_name=fname;
					this.last_name=lname;
				}
				var init = new Array();
				var get_initiator = function(i) {
					if(i == events.length) {
						res.render('trainer/dashboard', {user_id: req.user.id, events: events, init: init, successFlash: req.flash('info')[0]});
					} else {
						db.User.find({ where: { id: events[i].InitiatorId } }).success(function(c) {
							if(c) init.push(new initiator(c.id, c.first_name, c.last_name));
							get_initiator(++i);
						});
					}
				};
				get_initiator(0);
			});
		//});
	},
	
	trainer_event_confirm: function(req, res) {
		
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			event.updateAttributes({status: 'confirm'}).success(function(){
				res.redirect('/trainer/dashboard/'+req.user.id);
			});
		});
		
	},
	
	//deprecated
	list_events: function(req, res) {
		db.User.find({ where: { id: req.user.id} , include: [db.Organization]}).success(function(user) {
			db.Event.findAll({ where: {OrganizationId: user.OrganizationId}}).success(function(events) {
				function trainer(id, fname, lname)
				{
					this.id = id;
					this.first_name=fname;
					this.last_name=lname;
				}
				var trainers = new Array();
				var get_trainer = function(i) {
					if(i == events.length) {
						res.render('hr_admin/list_events', {hr: user, user_id: req.user.id, events: events, trainers: trainers, event_users: event_users, successFlash: req.flash('info')[0]});
					} else {
						db.User.find({ where: { id: events[i].ModeratorId } }).success(function(c) {
							if(c) trainers.push(new trainer(c.id, c.first_name, c.last_name));
							get_trainer(++i);
						});
					}
				};
				var event_users = [];
				var get_event_users_count = function(j) {
					if(j == events.length) {
						get_trainer(0);
					} else {
						db.EventUsers.count({ where: {EventId: events[j].id}}).success(function(cnt) {
							event_users.push(cnt);
							get_event_users_count(++j);
						});
					}
				};
				 get_event_users_count(0);
				
			}).error(function(error) {
				console.log('Error', error);
				res.render('hr_admin/dashboard', {errors: errors});
			});
		});
	},
	
	//deprecated
	notify_event_users: function(req, res) {
		db.Event.find({ where: {id: parseInt(req.param('event_id'))}}).success(function(event) {
			db.EventUsers.findAll({ where: {EventId: event.id}}).success(function(eventusers) {
				var send_email = function(user, j) {
					
					// START EMAIL
					
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
						to: user.email,
						subject: 'Meeting Invite from TALENTIFY',
						html: "Hi "+user.first_name+" "+user.last_name+",<br/>" +
	"<br/>" +
	"You have been invited for the following event.<br/>" +
	"<br/>" +
	"Event name: "+event.name+"<br/>" +
	"Event description: "+event.description+"<br/>" +
	"Date: "+event.date+"<br/>" +
	"Time: "+event.time+"<br/>" +
	"<br/>" +
	"Please click the below RSVP link to confirm your participation.<br/>"+
	"<b><u>http://talentify.in:3000/rsvp/"+user.id+"/"+event.id+"</u></b>.<br/>" +
	"<br/>" +
	"-Admin"
					};
					smtpConfig.sendMail(mailOpts, function (error, response) {
					    send_email_to_user(++j);
					});
					//END EMAIL
					
				};
				var send_email_to_user = function(i) {
					if(i == eventusers.length) {
						event.updateAttributes({status: 'Notified Users'}).success(function(){
							res.redirect('hr_admin/list_events');
						});
						
					} else {
						db.User.find({ where: { id: eventusers[i].UserId}}).success(function(user) {
							send_email(user, i);
						});
					}
				};
				send_email_to_user(0);
			});
		});
	},
	
	//deprecated
	rsvp: function(req, res) {
		db.EventUsers.find({ where: ['"EventId" = ? AND "UserId" = ?', parseInt(req.param('event_id')), parseInt(req.param('user_id'))]}).success(function(eventuser) {
			eventuser.updateAttributes({status: 'RSVP Yes'}).success(function(){
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(
			        'Thanks for confirming your participation for the event.'
			      );
				res.end();
			});
		});
	},
	
	//deprecated
	new_event: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		var user_id = req.user.id;
		db.User.find({ where: { id: user_id} , include: [db.Organization]}).success(function(user) {
			db.User.findAll({ where: ['"OrganizationId" = ? AND "permission" = ?', user.OrganizationId, 'trainer']}).success(function(trainers) {
				db.User.findAll({ where: ['"OrganizationId" = ? AND "permission" = ?', user.OrganizationId, 'user']}).success(function(users) {
					db.Role.findAll({ where: ['"OrganizationId" = ?', user.OrganizationId]}).success(function(roles) {
						db.Skill.findAll().success(function(skills) {
							res.render('hr_admin/new_event', {user: user, user_id: user_id, trainers: trainers, users: users, roles: roles, skills: skills, successFlash: successFlash});
						});
					});
				});
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('hr_admin/dashboard', {errors: errors});
		});
	},
	
	//deprecated
	do_create_event: function(req, res) {
		if(req.param('type') == 'Test') req.params.ModeratorId = null;
		
		db.Event.create({type: req.param('type'), name: req.param('name'), description: req.param('description'), date: req.param('date'), time: req.param('time'), location: req.param('location'), status: req.param('status'), InitiatorId: req.param('InitiatorId'), ModeratorId: req.params.ModeratorId, OrganizationId: req.param('OrganizationId')}).success(function(event) {
			req.flash('info', "Event "+event.name+" created");
			if(event.type == 'Test') {
				db.Test.find({where: {name: req.param('Test_Name')}}).success(function(test) {
					db.EventTest.findOrCreate({EventId: event.id, TestId: test.id}).success(function(){
						res.redirect('hr_admin/list_events');
					});
				});
			} else 
				res.redirect('hr_admin/list_events');
		});
	},
	
	//deprecated
	do_edit_event: function(req, res) {
		db.Event.find({where: {id: req.param('event_id')}}).success(function(event) {
			event.updateAttributes({type: req.param('type'), name: req.param('name'), description: req.param('description'), date: req.param('date'), time: req.param('time'), location: req.param('location'), status: req.param('status'), InitiatorId: req.param('InitiatorId'), ModeratorId: req.params.ModeratorId, OrganizationId: req.param('OrganizationId')}).success(function(){
				req.flash('info', "Event "+event.name+" updated");
				res.redirect('hr_admin/list_events');
			});
		});
	},
	
	//event creation process
	//create an event, the ajax way
	do_create_event_ajax: function(req, res) {
		db.Event.create(req.body).success(function(event) {
			if(event.type == 'Test') {
				db.Test.find({where: {name: req.param('Test_Name')}}).success(function(test) {
					db.EventTest.findOrCreate({EventId: event.id, TestId: test.id}).success(function(){
						res.send(event, {
				            'Content-Type': 'text/plain'
				         }, 200);
					});
				});
			} else {
				res.send(event, {
		            'Content-Type': 'text/plain'
		         }, 200);
			}
		});
	},
	
	//add a user to an event
	//deprecated
	add_user_to_event: function(req, res) {
		db.Event.find({ where: { id: parseInt(req.param('event_id')) } }).success(function(event) {
			db.User.find({ where: { id: parseInt(req.param('user_id')) } }).success(function(user) {
				db.EventUsers.findOrCreate({EventId: event.id, UserId: user.id}).success(function() {
					res.redirect('/hr_admin/event_user_list/'+event.id);
				});
			});
		});
	},
	
	//deprecated
	//send an email invite to a trainer for an event
	invite_trainer_to_event: function(req, res) {
		db.Event.find({ where: { id: parseInt(req.param('event_id')) } }).success(function(event) {
			db.User.find({ where: { id: parseInt(req.param('trainer_id')) } }).success(function(user) {
				// START EMAIL
				
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
					to: user.email,
					subject: 'Meeting Invite from TALENTIFY',
					html: "Hi "+user.first_name+" "+user.last_name+",<br/>" +
"<br/>" +
"You have been invited as a trainer for the following event.<br/>" +
"<br/>" +
"Event name: "+event.name+"<br/>" +
"Event description: "+event.description+"<br/>" +
"Date: "+event.date+"<br/>" +
"Time: "+event.time+"<br/>" +
"<br/>" +
"Please login at <b><u>http://talentify.in:3000</u></b> to confirm the same.<br/>" +
"<br/>" +
"-Admin"
				};
				smtpConfig.sendMail(mailOpts, function (error, response) {
				    if (error) {
				    	console.log("Email not sent");
				    }
				    event.updateAttributes({status: 'Created Event', ModeratorId: user.id}).success(function(){
				    	res.redirect('/hr_admin/event_user_list/'+event.id);
				    });
				});
				//END EMAIL
			});
		});
	},
	
	//deprecated
	event_confirm: function(req, res) {
		
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			event.updateAttributes({status: 'Confirmed'}).success(function(){
				res.redirect('/hr_admin/list_events');
			});
		});
		
	},
	
	//deprecated
	//delete an event
	//also, notify trainers and event users that the event has been deleted
	delete_event: function(req, res) {
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			db.EventUsers.findAll({ where: {EventId: event.id} }).success(function(eventusers) {
				var delete_event_user = function(k) {
					if(k == eventusers.length) {
						event.destroy().success(function(){
							res.redirect('/hr_admin/list_events');
						});
					} else {
						eventusers[k].destroy().success(function() {
							delete_event_user(++k);
						});
					}
				};
				var send_email = function(user, j) {
					
					// START EMAIL
					
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
						to: user.email,
						subject: 'Meeting Invite from TALENTIFY',
						html: "Hi "+user.first_name+" "+user.last_name+",<br/>" +
	"<br/>" +
	"The following event has been cancelled.<br/>" +
	"<br/>" +
	"Event name: "+event.name+"<br/>" +
	"Event description: "+event.description+"<br/>" +
	"Date: "+event.date+"<br/>" +
	"Time: "+event.time+"<br/>" +
	"<br/>" +
	"-Admin"
					};
					smtpConfig.sendMail(mailOpts, function (error, response) {
					    send_email_to_user(++j);
					});
					//END EMAIL
					
				};
				var send_email_to_user = function(i) {
					if(i == eventusers.length) {
						
						db.User.find({ where: { id: event.ModeratorId}}).success(function(user) {
							// START EMAIL
							
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
								to: user.email,
								subject: 'Meeting Invite from TALENTIFY',
								html: "Hi "+user.first_name+" "+user.last_name+",<br/>" +
			"<br/>" +
			"The following event has been cancelled.<br/>" +
			"<br/>" +
			"Event name: "+event.name+"<br/>" +
			"Event description: "+event.description+"<br/>" +
			"Date: "+event.date+"<br/>" +
			"Time: "+event.time+"<br/>" +
			"<br/>" +
			"-Admin"
							};
							smtpConfig.sendMail(mailOpts, function (error, response) {
							    delete_event_user(0);
							});
							//END EMAIL
						});
						
					} else {
						db.User.find({ where: { id: eventusers[i].UserId}}).success(function(user) {
							send_email(user, i);
						});
					}
				};
				send_email_to_user(0);
			});
		});
	},
	
	//deprecated
	//get all event users
	event_user_list: function(req, res) {
		db.Event.find({ where: { id: parseInt(req.param('event_id')) } }).success(function(event) {
			db.User.find({ where: { id: event.ModeratorId } }).success(function(event_trainer) {
				db.EventUsers.findAll({ where: { EventId: event.id } }).success(function(pl) { // to return all playlists to module_playlist.ejs
					function playlist(id, fname, lname, status)
					{
						this.id = id;
						this.first_name=fname;
						this.last_name=lname;
						this.status = status;
					}
					var playlists = new Array();
					var build_playlist = function(i) {
						if(i == pl.length) {
							db.User.findAll({ where: ['"OrganizationId" = ? AND "permission" = ?', event.OrganizationId, 'trainer']}).success(function(trainers) {
								db.User.findAll({ where: ['"OrganizationId" = ? AND "permission" = ?', event.OrganizationId, 'user']}).success(function(users) {
									db.Role.findAll({ where: ['"OrganizationId" = ?', event.OrganizationId]}).success(function(roles) {
										db.Skill.findAll().success(function(skills) {
											if(event_trainer != null) {
												db.Billing.find({ where: { UserId: event_trainer.id }}).success(function(billing) {
													event_trainer.rate = billing.rate;
													db.EventTest.find({ where: { EventId: event.id }}).success(function(eventTest) {
														if(eventTest != null) {
															db.Test.find({ where: { id: eventTest.TestId }}).success(function(test) {
																res.render('hr_admin/event_user_list', {test_name: test.name, event: event, event_trainer: event_trainer, playlists: playlists, trainers: trainers, roles: roles, skills: skills, users: users});
															});
														} else 
															res.render('hr_admin/event_user_list', {test_name: null, event: event, event_trainer: event_trainer, playlists: playlists, trainers: trainers, roles: roles, skills: skills, users: users});
													});
												});
											} else {
												db.EventTest.find({ where: { EventId: event.id }}).success(function(eventTest) {
													if(eventTest != null) {
														db.Test.find({ where: { id: eventTest.TestId }}).success(function(test) {
															res.render('hr_admin/event_user_list', {test_name: test.name, event: event, event_trainer: event_trainer, playlists: playlists, trainers: trainers, roles: roles, skills: skills, users: users});
														});
													} else 
														res.render('hr_admin/event_user_list', {test_name: null, event: event, event_trainer: event_trainer, playlists: playlists, trainers: trainers, roles: roles, skills: skills, users: users});
												});
											} 
										});
									});
								});
							});
						} else {
							db.User.find({ where: { id: pl[i].UserId } }).success(function(c) {
								if(c) playlists.push(new playlist(c.id, c.first_name, c.last_name, pl[i].status));
								build_playlist(++i);
							});
						}
					};
					build_playlist(0);
				});
			});
		});
	},
	
	//deprecated
	//OR filter
	//filter users by skills for an event
	ajax_filter_users_skills: function(req, res) {
		db.UserSkills.findAll({ where: { SkillId: parseInt(req.param('skill_id')) } }).success(function(us) {
			var users = [];
			var get_user = function(i) {
				if(i == us.length) {
					res.render('hr_admin/users_ajax', {users: users, val: req.param('val')});
				} else {
					db.User.find({ where: { id: us[i].UserId } }).success(function(user) {
						if(user) {
							users[i] = {};
							users[i].id = user.id;
							users[i].first_name = user.first_name;
							users[i].last_name = user.last_name;
						}
						get_user(++i);
					});
				}
			};
			get_user(0);
		});
	},
	
	//deprecated
	//OR filter
	//filter users by roles for an event
	ajax_filter_users_roles: function(req, res) {
		db.User.findAll({ where: ['"RoleId" = ? AND permission = ?', parseInt(req.param('role_id')), 'user']}).success(function(users) {
			res.render('hr_admin/users_ajax', {users: users, val: req.param('val')});
		});
	},
	
	ajax_filter_users: function(req, res) {
		switch(req.param('option')) {
			case 'skill':
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
			case 'role':
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
	
	delete_user_from_event: function(req, res) {
		
	},
	
	//deprecated
	map_skills: function(req, res) {
		db.Role.find({ where: { id: req.param('role_id')} }).success(function(role) {
			db.Organization.find({ where: {id: role.OrganizationId} }).success(function(organization) {
				db.User.find({ where: { id: req.user.id} , include: [db.Organization]}).success(function(hr) {
					res.render('hr_admin/map_skills', {hr: hr, user_id: req.param('user_id'), role: role, organization: organization, successFlash: req.flash('info')[0]});
				});
			}).error(function(error) {
				console.log('Error', error);
				res.render('hr_admin/dashboard', {errors: errors});
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('hr_admin/dashboard', {errors: errors});
		});
	},
	
	//deprecated
	//add skills to a role
	do_map_skill_to_role: function(req, res) {
		db.Skill.create(req.body).success(function(skill) {
			console.log("Skill created "+skill.name);
			req.flash("info", "Skill "+skill.name+" created");
			res.redirect('/hr_admin/map_skills/'+req.param('user_id')+'/'+req.param('role_id'));
			
		}).error(function(errors) {
			console.log("Error", errors);
			res.render({errors: errors});
		});
	},
	
	//deprecated
	add_pre_test_to_role: function(req, res) {
		db.User.find({ where: { id: req.user.id} , include: [db.Organization]}).success(function(hr) {
			db.Role.find({ where: { id: parseInt(req.param('role_id'))} }).success(function(role) {
				db.RoleTest.find({where: {RoleId: role.id}}).success(function(rt){
					if(rt) {
						db.Test.find({where: {id: rt.TestId}}).success(function(test){
							res.render('hr_admin/add_pre_test_to_role', {hr: hr, role: role, test: test});
						});
					} else {
						res.render('hr_admin/add_pre_test_to_role', {hr: hr, role: role, test: null});
					}
				});
			});
		});
	},
	
	add_pre_test: function(req, res) {
		res.render('hr_admin/add_pre_test', {role_id: req.param('role_id')});
	},
	
	//deprecated
	//add pre-test for a role
	do_add_pre_test: function(req, res) {
		db.Test.find({where: {name: req.param('test_name')}}).success(function(test){
			if(test) {
				db.RoleTest.create({RoleId: parseInt(req.param('role_id')), TestId: test.id}).success(function(){
					res.redirect('/hr_admin/get_skills_for_role/'+req.param('role_id'));
				});
			} else {
				res.redirect('/hr_admin/get_skills_for_role/'+req.param('role_id'));
			}
		});
	},
	
	//deprecated
	//refer to hr_admin/view_role_test_result_details_score
	view_user_test_details: function( req, res ) {
		db.SkillModulePlaylist.findAll({ where: ['"SkillId" = ?', parseInt(req.param('skill_id'))]}).success(function(smpl) {
			var modules = [];
			var contents = [];
			var tests = [];
			var get_module = function(i) {
				if(i == smpl.length) {
					var get_contents = function(j) {
						if(j == modules.length) {
							var get_content_test = function(l) {
								if(l == contents.length) {
									if(tests.length > 0) {
										db.Report.find({ where: ['"TestId" = ? AND "UserId" = ?', parseInt(tests[0].id), parseInt(req.param('user_id'))]}).success(function(report) {
											db.ReportDetail.findAll({ where: ['"TestId" = ? AND "UserId" = ?', parseInt(tests[0].id), parseInt(req.param('user_id'))]}).success(function(reportDetails) {
												tests[0].score = 0;
												var get_test_total_score = function(m) {
													if(m == reportDetails.length) {
														res.render('view_test_details', {tests: tests, report: report, reportDetails: reportDetails});
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
										res.render('view_test_details', {tests: tests, report: null, reportDetails: null});
									}
								} else {
									db.ContentTest.find({ where: ['"ContentId" = ?', parseInt(contents[l].id)]}).success(function(ct) {
										if(ct) {
											db.Test.find({ where: ['"id" = ?', ct.TestId]}).success(function(test) {
												//tests[l] = {};
												//tests[l] = test;
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
						get_module(++i);
					});
				}
			};
			get_module(0);
			
		});
	},
	
	//interface for manager to create new notification
	create_new_notification: function(req, res) {
		res.render('hr_admin/create_new_notification', {user_id: req.param('user_id')});
	},
	
	//create the new notification
	do_create_notification: function(req, res) {
		db.Notification.create(req.body).success(function(notification) {
			res.redirect('hr_admin/list_notifications_redirector/'+req.user.id);
		}).error(function(err) {
			console.log(">>Catching error while creating notification: "+err);
		});
	},
	
	//iframe based ajax form submission
	list_notifications_redirector: function(req, res) {
		res.render('hr_admin/list_notifications_redirector', {user_id: req.param('user_id')});
	},
	
	//list all notifications created by this manager
	list_notifications: function(req, res) {
		db.Notification.findAll({ where: { UserId: parseInt(req.param('user_id')) }, order: 'id DESC' }).success(function(notifications) {
			res.render('hr_admin/list_notifications', {notifications: notifications});
		}).error(function(err) {
			console.log(">>Catching error while listing notifications: "+err);
		});
	},
	
	//delete notifications
	delete_notification: function(req, res) {
		db.Notification.find({ where: { id: parseInt(req.param('notification_id')) }}).success(function(notification) {
			notification.destroy().success(function(){
				res.redirect('hr_admin/list_notifications/'+req.user.id);
			});
		}).error(function(err) {
			console.log(">>Catching error while deleting notification: "+err);
		});
	},
	
	//edit notifications
	edit_notification: function(req, res) {
		db.Notification.find({ where: { id: parseInt(req.param('notification_id')) }}).success(function(notification) {
			res.render('hr_admin/edit_notification', {notification: notification});
		}).error(function(err) {
			console.log(">>Catching error while edit_notification: "+err);
		});
	},
	
	//edit notifications
	do_edit_notification: function(req, res) {
		db.Notification.find({ where: { id: parseInt(req.param('notification_id')) }}).success(function(notification) {
			notification.updateAttributes(req.body).success(function(){
				res.redirect('/hr_admin/list_notifications_redirector/'+req.user.id);
			});
		}).error(function(err) {
			console.log(">>Catching error while do_editnotification: "+err);
		});
	},
	
	//get placement statistics for this manager's organization
	placement: function(req, res) {
		var query = 'select * from "JobUsers" where "UserId" IN (select id from "Users" where "OrganizationId" = '+req.user.OrganizationId+')';
		db.sequelize.query(query, null, {raw: true}).success(function(ju){
			var invites = [], tests = [], interviews = [], offers = [];
			for(var z = 0; z < ju.length; z++)
				ju[z].visited = false;
			var sort = function(i) {
				if(i == ju.length) {
					res.render('hr_admin/placement', {invites: invites, tests: tests, interviews: interviews, offers: offers});
				} else {
					if(ju.status == 'Invited') {
						db.Job.find({where: {id: ju[i].JobId}}).success(function(job) {
							invites.push(job);
							sort(++i);
						});	
					} else if(ju.status == 'Interview') {
						db.Job.find({where: {id: ju[i].JobId}}).success(function(job) {
							interviews.push(job);
							sort(++i);
						});
					} else if(ju.status == 'Selected') {
						db.Job.find({where: {id: ju[i].JobId}}).success(function(job) {
							offers.push(job);
							sort(++i);
						});
					} else {
						for(var x = 0; x < ju.length; x++) {
							if(i != x && ju[x].JobId == ju[i].JobId)
								ju[x].visited = true;
						}
						if(!ju[i].visited) {
							db.Step.find({ where: ['"JobId" = ? and "order" = 1', ju[i].JobId]}).success(function(step) {
								if(step) {
									db.StepTest.find({ where: ['"StepId" = ?', step.id]}).success(function(stepTest) {
										if(stepTest)
											db.Test.find({ where: ['"id" = ?', stepTest.TestId]}).success(function(test) {
												if(test) {
													db.Job.find({where: {id: ju[i].JobId}}).success(function(job) {
														var pos = -1;
														pos = tests.indexOf(job);
														if(pos == -1) tests.push(job);
														sort(++i);
													});
												} else
													sort(++i);
											});
										else
											sort(++i);
									});
								} else
									sort(++i);
							});
						} else
							sort(++i);
					}
				}
			};
			sort(0);
		});
	},
	
	//refers to the 'Placement Center' tile in hr_admin/dashboard-new.ejs
	get_placement_user_data: function(req, res) {
		var query = 'select * from "Users" where id IN (select "UserId" from "JobUsers" where "JobId" = '+parseInt(req.param('job_id'))+')';
		db.sequelize.query(query, null, {raw: true}).success(function(users){
			res.render('hr_admin/get_placement_user_data', {users: users});
		});
	},
	
	//get role test results
	//list all roles for this organization
	view_role_test_results: function(req, res) {
		db.User.find({ where: { id: parseInt(req.user.id)} , include: [db.Organization]}).success(function(hr) {
			db.Role.findAll({where: {OrganizationId: hr.OrganizationId}}).success(function(roles) {
				res.render('hr_admin/view_role_test_results', {role_id: req.param('role_id'), roles: roles});
			});
		});
	},
	
	//called from hr_admin/view_role_test_results.ejs
	//get the pre-test results for this role
	view_role_test_result_details: function(req, res) {
		db.User.find({ where: { id: parseInt(req.user.id)} , include: [db.Organization]}).success(function(hr) {
			db.Role.find({where: {id: parseInt(req.param('role_id'))}}).success(function(role) {
				db.RoleTest.find({where: {RoleId: parseInt(req.param('role_id'))}}).success(function(rt) {
					if(rt) {
						res.render('hr_admin/view_role_test_result_details', {rt: rt, role_id: req.param('role_id'), role: role});
					} else {
						res.render('hr_admin/view_role_test_result_details', {rt: null, role_id: req.param('role_id'), role: role});
					}
				});
			});
		});
	},
	
	//called from hr_admin/view_role_test_result_details.ejs
	//get the pre-test result details for this role
	view_role_test_result_details_score: function(req, res) {
		db.User.find({ where: { id: parseInt(req.user.id)} , include: [db.Organization]}).success(function(hr) {
			db.RoleTest.find({where: {RoleId: parseInt(req.param('role_id'))}}).success(function(rt) {
				if(rt) {
					db.Test.find({where: {id: rt.TestId}}).success(function(test) {
						db.TestProblems.findAll({where: {TestId: test.id}}).success(function(tp) {
							var total_test_score = 0;
							var get_total_test_score = function(j) {
								if(j == tp.length) {
									test.total_score = total_test_score;
									
									var query = 'select * from "Reports" r,"Users" u where r."TestId"='+test.id+' and r."UserId"=u."id" and u."RoleId"='+rt.RoleId+' and u."OrganizationId"='+hr.OrganizationId+' and "status" = \'complete\' order by u.id asc';
									db.sequelize.query(query, null, {raw: true}).success(function(reports){
										res.render('hr_admin/view_role_test_result_details_score', {test: test, users: reports});
									});
								} else {
									total_test_score += tp[j].positiveScore;
									get_total_test_score(++j);
								}
							};
							get_total_test_score(0);
						});
					});
				} else
					res.render('hr_admin/view_role_test_result_details_score', {test: null, users: null});
			});
		});
	},
	
	//get report card for role test
	//deprecated
	view_detailed_report_card: function(req, res) {
		res.render('hr_admin/view_detailed_report_card', {event_id: null, role_id: req.param('role_id'), user_id: req.param('user_id'), test_id: req.param('test_id')});
	},
	
	//get report card for test event
	//deprecated
	view_detailed_event_report_card: function(req, res) {
		db.User.find({where: {username: req.param('username')}}).success(function(user) {
			res.render('hr_admin/view_detailed_report_card', {event_id: req.param('event_id'), role_id: null, user_id: user.id, test_id: req.param('test_id')});
		});
	}
};