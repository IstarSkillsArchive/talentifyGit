var db = require('../models');

function get_formatted_time(val) {
	var t = val.split(" ");
	var time = t[0].split(":");
	if(t[1] == "AM" && parseInt(time[0]) == 12) {
		time[0] = 00;
	}
	if(t[1] == "PM" && parseInt(time[0]) != 12) {
		time[0] = parseInt(time[0])+12;
	}
	return time;
}

function format_date(d) {
	//return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 0));
	//return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+' +05:30';
	return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':00';
}

function set_local_time_zone(d) {
	d.setHours(d.getHours()+5);
	d.setMinutes(d.getMinutes()+30);
	return d;
}

function get_date_with_time_zone(d) {
	var obj = {};
	var d_string = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
	
	var tzo = d.getTimezoneOffset();
	var ptzo = tzo;
	if(tzo < 0) ptzo = -tzo;
	
	var hours = Math.floor(ptzo / 60);          
    var minutes = ptzo % 60;
    
    if(tzo <= 0) {
		obj.start = d_string+' 00:00:00 +'+hours+':'+minutes;
		obj.end = d_string+' 23:59:00 +'+hours+':'+minutes;
	} else {
		obj.start = d_string+' 00:00:00 -'+hours+':'+minutes;
		obj.end = d_string+' 23:59:00 -'+hours+':'+minutes;
	}
	return obj;
}

module.exports = {
		
	dashboard: function(req, res) {
		var d = get_date_with_time_zone(new Date());
		
		db.Event.findAll({where: ['type = ? AND date > ? ::timestamp with time zone and ("endDate" < ? ::timestamp with time zone or "endDate" IS NULL) AND (status = ? OR status = ?)', 'Class Training', d.start, d.end, 'Trainer Accepted Invite', 'Done Event'], order: 'date ASC'}).success(function(events){
			
			var render = function() {
				db.Event.findAll({where: {status: 'Trainer Triaged Invite'}}).success(function(alerts){
					res.render('coordinator/dashboard', {user_id: req.param('user_id'), events: events, alerts: alerts});
				});
			};
			
			var get_trainer = function(i) {
				if(i == events.length) {
					render();
				} else {
					db.User.find({ where: {id: events[i].ModeratorId}}).success(function(trainer) {
						if(trainer) {
							events[i].trainer = trainer.username;
						}
						get_trainer(++i);
					});
				}
			};
			
			var get_org = function(i) {
				if(i == events.length) {
					get_trainer(0);
				} else {
					db.Organization.find({ where: {id: events[i].OrganizationId}}).success(function(org) {
						if(org) {
							events[i].org = org.name;
						}
						get_org(++i);
					});
				}
			};
			
			var get_event_log = function(i) {
				if(i == events.length) {
					get_org(0);
				} else {
					db.EventLog.findAll({ where: {EventId: events[i].id}, order: 'id DESC' }).success(function(el) {
						if(el && el.length > 0) {
							events[i].status = el[0].status;
						}
						get_event_log(++i);
					});
				}
			};
			if(events.length > 0)
				get_event_log(0);
			else
				render();
		});
	},
	
	schedule: function(req, res) {
		db.Event.findAll({where: {type: 'Class Training'}, include: [db.Organization]}).success(function(events){
			var get_skill_trainer = function(i) {
				if(i == events.length) {
					res.render('coordinator/schedule', {user_id: req.param('user_id'), events: events, year: req.param('year'), month: req.param('month'), day: req.param('day')});
				} else {
					//events[i].date = set_local_time_zone(events[i].date);
					//events[i].endDate = set_local_time_zone(events[i].endDate);
					db.EventSkill.find({where: {EventId: events[i].id}}).success(function(es){
						var get_moderator = function() {
							if(events[i].ModeratorId != null) {
								db.User.find({where: {id: events[i].ModeratorId}}).success(function(user){
									events[i].trainer = user;
									get_skill_trainer(++i);
								});
							} else
								get_skill_trainer(++i);
						};
						
						if(es != null) {
							if(es.SkillId != null) {
								db.Skill.find({where: {id: es.SkillId}}).success(function(skill){
									events[i].skill = skill;
									if(es.ModuleId != null) {
										db.Module.find({where: {id: es.ModuleId}}).success(function(module){
											events[i].module = module;
											get_moderator();
										});
									}else
										get_moderator();
								});
							} else
								get_moderator();
						} else
							get_skill_trainer(++i);
					});
				}
			};
			get_skill_trainer(0);
		});
	},
	
	create_new_schedule: function(req, res) {
		db.Organization.findAll({where: ['("IstarCoordinatorId" IS NULL OR "IstarCoordinatorId" = ?)', parseInt(req.param('user_id'))]}).success(function(orgs){
			if(orgs.length > 0) {
				db.Role.findAll({where: {OrganizationId: orgs[0].id}}).success(function(batches){
					if(batches.length > 0) {
						db.Batch.findAll({where: {RoleId: batches[0].id}}).success(function(lg) {
							res.render('coordinator/create_new_schedule', {orgs: orgs, batches: batches, lg: lg});
						});
					} else
						res.render('coordinator/create_new_schedule', {orgs: orgs, batches: batches, lg: null});
				});
			} else
				res.render('coordinator/create_new_schedule', {orgs: orgs, batches: null, lg: null});
		});
	},
	
	get_batches_for_organization: function( req, res) {
		db.Role.findAll({where: {OrganizationId: parseInt(req.param('oid'))}}).success(function(batches){
			res.render('coordinator/get_batches_for_organization', {batches: batches});
		});
	},
	
	get_learning_groups_for_organization: function( req, res) {
		db.Batch.findAll({where: {RoleId: parseInt(req.param('rid'))}, order: 'id asc'}).success(function(batches){
			res.render('coordinator/get_learning_groups_for_organization', {batches: batches});
		});
	},
	
	do_create_new_schedule: function(req, res) {
		var time1 = get_formatted_time(req.param('startTime'));
		var time2 = get_formatted_time(req.param('endTime'));
		
		var d = req.param('startDate').split('/');
		
		var date = new Date(d[2], parseInt(d[0])-1, d[1], time1[0], time1[1], 0, 0);
		var endDate = new Date(d[2], parseInt(d[0])-1, d[1], time2[0], time2[1], 0, 0);
		
		db.User.findAll({where: {RoleId: parseInt(req.param('RoleId'))}}).success(function(users){
			var create_new_event = function(i) {
				if(i == parseInt(req.param('weeks'))) {
					res.redirect('/coordinator/schedule/'+req.user.id);
				} else {
					db.Event.create({date: date, endDate: endDate, OrganizationId: parseInt(req.param('OrganizationId')), type: 'Class Training', InitiatorId: parseInt(req.user.id), name: req.param('name'), description: req.param('name'), status: 'Created Event'}).success(function(event){
						db.EventSkill.create({EventId: event.id, RoleId: parseInt(req.param('RoleId'))}).success(function(){
							date.setDate(date.getDate()+7);
							endDate.setDate(endDate.getDate()+7);
							
							var create_event_user = function(j) {
								if(j == users.length) {
									create_new_event(++i);
								} else {
									db.EventUsers.create({EventId: event.id, UserId: users[j].id}).success(function(){
										create_event_user(++j);
									});
								}
							};
							create_event_user(0);
							
						});
					});
				}
			};
			create_new_event(0);
		});
	},
	
	assign_skill_trainer_to_event: function(req, res) {
		db.EventSkill.find({where: {EventId: parseInt(req.param('event_id'))}}).success(function(event){
			db.Role.find({where: {id: event.RoleId}, include: [db.Skill]}).success(function(role){
				var modules = [];
				var render = function() {
					db.User.findAll({where: {permission: 'trainer'}}).success(function(trainers){
						res.render('coordinator/assign_skill_trainer_to_event',{skills: role.skills, event_id: event.EventId, modules: modules, trainers: trainers});
					});
				};
				if(role.skills.length > 0) {
					db.SkillModulePlaylist.findAll({where: {SkillId: role.skills[0].id}}).success(function(smpl){
						var get_modules = function(i) {
							if(i == smpl.length) {
								render();
							} else {
								db.Module.find({where: {id: smpl[i].ModuleId}}).success(function(module){
									modules.push(module);
									get_modules(++i);
								});
							}
						};
						get_modules(0);
					});
				} else
					render();
			});
		});
	},
	
	do_assign_skill_trainer_to_event: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('EventId'))}}).success(function(event){
			var common_function = function(return_msg) {
				db.EventSkill.find({where: {EventId: parseInt(req.param('EventId'))}}).success(function(es){
					var sid = req.param('SkillId') == null || req.param('SkillId') == 'null' || req.param('SkillId') == '' ? null : parseInt(req.param('SkillId'));
					var mid = req.param('ModuleId') == null || req.param('ModuleId') == 'null' || req.param('ModuleId') == '' ? null : parseInt(req.param('ModuleId'));
					es.updateAttributes({SkillId: sid, ModuleId: mid}).success(function(){
						var obj = {};
						obj.message = return_msg;
						obj.year = event.date.getFullYear();
						obj.month = event.date.getMonth() < 9 ? '0'+(event.date.getMonth()+1) : event.date.getMonth()+1;
						obj.day = event.date.getDate() < 10 ? '0'+event.date.getDate() : event.date.getDate();
						res.send(obj, {
				            'Content-Type': 'text/plain'
				         }, 200);
					});
				});
			};
			
			if(req.param('flag') == 'proceed') {
				event.updateAttributes({status: 'Trainer Conflict', ModeratorId: parseInt(req.param('TrainerId'))}).success(function(){
					common_function('success');
				});
			} else {
				var d = get_date_with_time_zone(event.date);
				
				//get all events for this date
				db.Event.findAll({where: ['id != ? AND type = \'Class Training\' AND date IS NOT NULL AND "endDate" IS NOT NULL AND ((date >= ? ::timestamp with time zone AND "endDate" <= ? ::timestamp with time zone)) AND "ModeratorId" = ?', event.id, d.start, d.end, parseInt(req.param('TrainerId'))]}).success(function(conflicting_events){
					var get_trainers = function(i) {
						if(i == conflicting_events.length) {
							//no conflicting events, do normal update
							event.updateAttributes({ModeratorId: parseInt(req.param('TrainerId')), status: 'Assigned Trainer'}).success(function(){
								common_function('success');
							});
						} else {
							var query, event_date;
							if(conflicting_events[i].date < event.date || (conflicting_events[i].date = event.date && conflicting_events[i].endDate <= event.endDate)) {
								query = 'id = ? AND (("endDate" >= ? ::timestamp with time zone - \'2 hours\'::interval) OR ("endDate" >= ? ::timestamp with time zone - \'1 hours\'::interval))';
								event_date = event.date;
							} else {
								query = 'id = ? AND (("date" <= ? ::timestamp with time zone + \'2 hours\'::interval) OR ("date" <= ? ::timestamp with time zone + \'1 hours\'::interval))';
								event_date = event.endDate;
							}
							
							//event_date = format_date(event_date);
							
							db.Event.find({where: [query, conflicting_events[i].id, event_date, event_date]}).success(function(conflicting_event){
							//db.sequelize.query(query, null, {raw: true}).success(function(conflicting_event){
								if(conflicting_event) {
									db.User.find({where: {id: parseInt(req.param('TrainerId'))}}).success(function(user) {
										db.Organization.find({where: {id: conflicting_events[i].OrganizationId}}).success(function(organization) {
											var time1 = conflicting_event.date.getHours()+':'+conflicting_event.date.getMinutes();
											var time2 = conflicting_event.endDate.getHours()+':'+conflicting_event.endDate.getMinutes();
											common_function('There is a trainer conflict for '+user.username+'. Trainer is already allocated for '+conflicting_events[i].name+' on '+conflicting_event.date.toDateString()+' from <b>'+time1+'</b> to <b>'+time2+'</b> at '+organization.name);
											return;
										});
									});
								} else {
									get_trainers(++i);
								}
							});
						}
					};
					get_trainers(0);
				});
			}
		});
	},
	
	get_modules_for_skill: function(req, res) {
		db.SkillModulePlaylist.findAll({where: {SkillId: parseInt(req.param('skill_id'))}}).success(function(smpl){
			var modules = [];
			var get_modules = function(i) {
				if(i == smpl.length) {
					res.render('coordinator/get_modules_for_skill',{modules: modules});
				} else {
					db.Module.find({where: {id: smpl[i].ModuleId}}).success(function(module){
						modules.push(module);
						get_modules(++i);
					});
				}
			};
			get_modules(0);
		});
	},
	
	confirm_schedule: function(req, res) {
		db.Event.findAll({where: ['(status = \'Assigned Trainer\' OR status = \'Trainer Conflict\') AND type = \'Class Training\' AND date >= ? AND "endDate" <= ?', req.param('date1'), req.param('date2')]}).success(function(events){
			var confirm_events = function(i) {
				if(i == events.length) {
					res.redirect('/coordinator/schedule/'+req.user.id);
				} else {
					if(events[i].status == 'Trainer Conflict') {
						events[i].updateAttributes({status: 'Coordinator Confirmed Event With Conflict'}).success(function(){
							confirm_events(++i);
						});
					} else {
						events[i].updateAttributes({status: 'Coordinator Confirmed Event'}).success(function(){
							confirm_events(++i);
						});
					}
				}
			};
			confirm_events(0);
		});
	},
	
	get_event_details: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}, include: [db.Organization]}).success(function(event){
			db.EventSkill.find({where: {EventId: event.id}}).success(function(es){
				db.User.find({where: {id: event.ModeratorId}}).success(function(user){
					if(es && es.SkillId != null) {
						db.Skill.find({where: {id: es.SkillId}}).success(function(skill){
							event.skill = skill;
							if(es.ModuleId != null) {
								db.Module.find({where: {id: es.ModuleId}}).success(function(module){
									event.module = module;
									res.render('coordinator/get_event_details',{event: event, es: es, user: user});
								});
							}else
								res.render('coordinator/get_event_details',{event: event, es: es, user: user});
						});
					} else
						res.render('coordinator/get_event_details',{event: event, es: es, user: user});
				});
			});
		});
	},
	
	delete_event: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			db.EventSkill.find({where: {EventId: event.id}}).success(function(es){
				es.destroy().success(function(){
					db.EventUsers.findAll({where: {EventId: event.id}}).success(function(eu){
						var delete_event_user = function(i) {
							if(i == eu.length) {
								event.destroy().success(function(){
									res.redirect('/coordinator/schedule/'+req.user.id);
								});
							} else {
								eu[i].destroy().success(function(){
									delete_event_user(++i);
								});
							}
						};
						delete_event_user(0);
					});
					
				});
			});
		});
	},
	
	view_attendance: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			db.Attendance.findAll({where: {EventId: event.id}}).success(function(att){
				var users = [];
				var get_users = function(i) {
					if(i == att.length) {
						db.Attendance.count({where: ['"EventId" = ? and status = ?', event.id, 'Present']}).success(function(present){
							var absent = users.length - present;
							res.render('coordinator/view_attendance',{users: users, event_id: req.param('event_id'), present: present, absent: absent});
						});
					} else {
						db.User.find({ where: {id: att[i].UserId} }).success(function(user) {
							if(user) {
								user.status = att[i].status;
								users.push(user);
							};
							get_users(++i);
						});
					}
				};
				get_users(0);
			});
		});
	},
	
	view_trainer_feedback: function(req, res) {
		db.TrainerFeedback.find({ where: {EventId: parseInt(req.param('event_id'))} }).success(function(tf) {
			if(tf) {
				db.ClassRatingDetails.find({ where: {FeedbackId: tf.id} }).success(function(crd) {
					res.render('coordinator/view_trainer_feedback',{tf: tf, crd: crd});
				});
			} else
				res.render('coordinator/view_trainer_feedback',{tf: null, crd: null});
		});
	},
	
	refresh_today_events: function(req, res) {
		var d = get_date_with_time_zone(new Date());
		
		db.Event.findAll({where: ['type = ? AND date > ? ::timestamp with time zone and ("endDate" < ? ::timestamp with time zone or "endDate" IS NULL) AND (status = ? OR status = ?)', 'Class Training', d.start, d.end, 'Trainer Accepted Invite', 'Done Event'], order: 'date ASC'}).success(function(events){
			
			var render = function() {
				res.render('coordinator/refresh-today-events', {events: events});
			};
			
			var get_trainer = function(i) {
				if(i == events.length) {
					render();
				} else {
					db.User.find({ where: {id: events[i].ModeratorId}}).success(function(trainer) {
						if(trainer) {
							events[i].trainer = trainer.username;
						}
						get_trainer(++i);
					});
				}
			};
			
			var get_org = function(i) {
				if(i == events.length) {
					get_trainer(0);
				} else {
					db.Organization.find({ where: {id: events[i].OrganizationId}}).success(function(org) {
						if(org) {
							events[i].org = org.name;
						}
						get_org(++i);
					});
				}
			};
			
			var get_event_log = function(i) {
				if(i == events.length) {
					get_org(0);
				} else {
					db.EventLog.findAll({ where: {EventId: events[i].id}, order: 'id DESC' }).success(function(el) {
						if(el && el.length > 0) {
							events[i].status = el[0].status;
						}
						get_event_log(++i);
					});
				}
			};
			if(events.length > 0)
				get_event_log(0);
			else
				render();
		});
	},
	
	get_conflict_events: function(req, res) {
		db.Event.findAll({where: ['status = \'Trainer Conflict\' AND type = \'Class Training\' AND date >= ? AND "endDate" <= ?', req.param('date1'), req.param('date2')]}).success(function(cnt){
			res.send(cnt, {
	            'Content-Type': 'text/plain'
	         }, 200);
		});
	},
	
	get_trainer_location: function(req, res) {
		db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
			db.TrainerLocation.findAll({where: ['"EventId" = ?', event.id], order: 'id ASC'}).success(function(tl){
				res.render('coordinator/get_trainer_location', {tl: tl, event_id: req.param('event_id')});
			});
		});
	},
	
	create_new_schedule_bulk: function(req, res) {
		db.Skill.findAll().success(function(skills){
			db.Organization.findAll({where: ['type = ? AND ("IstarCoordinatorId" IS NULL OR "IstarCoordinatorId" = ?)', 'College', parseInt(req.param('user_id'))]}).success(function(orgs){
				if(orgs.length > 0) {
					db.Role.findAll({where: {OrganizationId: orgs[0].id}}).success(function(batches){
						res.render('coordinator/create_new_schedule_bulk', {skills: skills, orgs: orgs, batches: batches});
					});
				} else
					res.render('coordinator/create_new_schedule_bulk', {skills: skills, orgs: orgs, batches: null});
			});
		});
	},
	
	do_create_new_schedule_bulk: function(req, res) {
		var time1 = get_formatted_time(req.param('startTime'));
		var time2 = get_formatted_time(req.param('endTime'));
		
		var d = req.param('startDate').split('/');
		
		var date = new Date(d[2], parseInt(d[0])-1, d[1], time1[0], time1[1], 0, 0);
		var endDate = new Date(d[2], parseInt(d[0])-1, d[1], time2[0], time2[1], 0, 0);
		
		db.User.findAll({where: {RoleId: parseInt(req.param('RoleId'))}}).success(function(users){
			var PrevEventId = null;
			var create_new_event = function(i) {
				if(i == parseInt(req.param('weeks'))) {
					res.redirect('/coordinator/schedule/'+req.user.id);
				} else {
					db.Event.create({date: date, endDate: endDate, OrganizationId: parseInt(req.param('OrganizationId')), type: 'Class Training', InitiatorId: parseInt(req.user.id), name: req.param('name'), description: req.param('name'), status: 'Created Event'}).success(function(event){
						db.EventSkill.create({PrevEventId: PrevEventId, SkillId: parseInt(req.param('SkillId')), EventId: event.id, RoleId: parseInt(req.param('RoleId'))}).success(function(){
							PrevEventId = event.id;
							date.setDate(date.getDate()+7);
							endDate.setDate(endDate.getDate()+7);
							
							var create_event_user = function(j) {
								if(j == users.length) {
									create_new_event(++i);
								} else {
									db.EventUsers.create({EventId: event.id, UserId: users[j].id}).success(function(){
										create_event_user(++j);
									});
								}
							};
							create_event_user(0);
							
						});
					});
				}
			};
			create_new_event(0);
		});
	},
	
	get_no_of_modules_for_skill: function(req, res) {
		db.SkillModulePlaylist.findAll({where: {SkillId: parseInt(req.param('skill_id'))}}).success(function(cnt){
			res.send(cnt, {
	            'Content-Type': 'text/plain'
	         }, 200);
		});
	}
};