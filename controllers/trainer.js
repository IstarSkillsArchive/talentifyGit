var db = require('../models');

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
		db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
			if(user && user.isProfileCompleted == true && user.isTestTaken == true && user.isMetCoach == true) {
				db.Event.findAll({ where: ['"ModeratorId" = ? AND (status = \'Coordinator Confirmed Event\' OR status = \'Coordinator Confirmed Event With Conflict\')', parseInt(req.param('user_id'))] }).success(function(events) {
					if(events.length > 0) {
						res.render('trainer/dashboard', {user_id: req.param('user_id'), events: events});
					}
					else 
						//res.redirect('/trainer/dashboard_second/'+req.param('user_id'));
						res.redirect('/trainer/tot/'+req.param('user_id'));
				});
			} else 
				res.render('dashboard', {user: user, successFlash: null});
		}).error(function(err){
			console.log(">> Catching error : from trainer/dashboard", err);
		});
	},
	
	dashboard_second: function(req, res) {
		var d = get_date_with_time_zone(new Date());
		
		db.Event.findAll({ where: ['"ModeratorId" = ? AND type = ? AND (status = ?) AND date > ? ::timestamp with time zone and ("endDate" < ? ::timestamp with time zone or "endDate" IS NULL)', parseInt(req.param('user_id')), 'Class Training', 'Trainer Accepted Invite', d.start, d.end], order: 'date ASC' }).success(function(events) {
			var render = function() {
				res.render('trainer/dashboard_second', {user_id: req.param('user_id'), events: events});
			};
			
			var get_org = function(i) {
				if(i == events.length) {
					render();
				} else {
					db.Organization.find({ where: {id: events[i].OrganizationId}}).success(function(org) {
						if(org) {
							events[i].org = org.name;
						}
						get_org(++i);
					});
				}
			};
			if(events.length > 0)
				get_org(0);
			else
				render();
			
		});
	},
	
	live_class: function(req, res) {
		var d = get_date_with_time_zone(new Date());
		
		db.Event.findAll({ where: ['"ModeratorId" = ? AND type = ? AND date > ? ::timestamp with time zone', parseInt(req.param('user_id')), 'Live Class', d.start], order: 'date DESC' }).success(function(events) {
			res.render('trainer/live_class', {user_id: req.param('user_id'), events: events});
		});
	},
	
	billing: function(req, res) {
		db.Event.findAll({ where: ['"ModeratorId" = ? AND status = ?', parseInt(req.param('user_id')), 'Done Event'], include: [db.Organization]}).success(function(events) {
			res.render('trainer/billing', {user_id: req.param('user_id'), events: events});
		});
	},
	
	alerts: function(req, res) {
		db.Event.findAll({ where: ['"ModeratorId" = ? AND status = ?', parseInt(req.param('user_id')), 'Trainer Triaged Invite'] }).success(function(events) {
			var render = function() {
				res.render('trainer/alerts', {user_id: req.param('user_id'), events: events});
			};
			
			var get_org = function(i) {
				if(i == events.length) {
					render();
				} else {
					db.Organization.find({ where: {id: events[i].OrganizationId}}).success(function(org) {
						if(org) {
							events[i].org = org.name;
						}
						get_org(++i);
					});
				}
			};
			if(events.length > 0)
				get_org(0);
			else
				render();
		});
	},
	
	show_event_invites: function(req, res) {
		db.Event.findAll({ where: ['"ModeratorId" = ? AND (status = ? OR status = ?)', parseInt(req.param('trainer_id')), 'Coordinator Confirmed Event', 'Coordinator Confirmed Event With Conflict']}).success(function(events) {
			var render = function() {
				res.render('trainer/show_event_invites', {events: events});
			};
			
			var get_org = function(i) {
				if(i == events.length) {
					render();
				} else {
					db.Organization.find({ where: {id: events[i].OrganizationId}}).success(function(org) {
						if(org) {
							events[i].org = org.name;
						}
						get_org(++i);
					});
				}
			};
			if(events.length > 0)
				get_org(0);
			else
				render();
			
		});
	},
	
	log_trainer_location: function(req, res) {
		db.TrainerLocation.create(req.body).success(function(tl) {
			res.send('Trainer location logged', {
	            'Content-Type': 'text/plain'
	         }, 200);
		});
	},
	
	take_attendance: function(req, res) {
		db.Attendance.findAll({ where: {EventId: parseInt(req.param('event_id'))}, order: '"UserId" ASC' }).success(function(att) {
			if(att.length == 0) {
				// create attendance for this event, by default, mark everybody present
				db.EventUsers.findAll({ where: {EventId: parseInt(req.param('event_id'))} }).success(function(eu) {
					var date = new Date();
					var get_users = function(i) {
						if(i == eu.length) {
							get_attendance();
						} else {
							db.Attendance.create({ status: 'Present', date: date, EventId: eu[i].EventId, UserId: eu[i].UserId}).success(function(a) {
								get_users(++i);
							});
						}
					};
					get_users(0);
				});
			} else
				get_attendance();
		});
		
		var get_attendance = function() {
			db.Attendance.findAll({ where: {EventId: parseInt(req.param('event_id'))}, order: '"UserId" ASC' }).success(function(att) {
				var users = [];
				var get_users = function(i) {
					if(i == att.length) {
						res.render('trainer/take_attendance',{users: users, event_id: req.param('event_id')});
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
		};
	},
	
	mark_attendance: function(req, res) {
		db.Attendance.find({where: ['"UserId" = ? AND "EventId" = ?', parseInt(req.param('user_id')), parseInt(req.param('event_id'))]}).success(function(att){
			att.updateAttributes({status: req.param('status')}).success(function(){
				res.redirect('/trainer/show_attendance/'+att.UserId+'/'+att.EventId);
			});
		});
	},
	
	show_attendance: function(req, res) {
		db.Attendance.find({where: ['"UserId" = ? AND "EventId" = ?', parseInt(req.param('user_id')), parseInt(req.param('event_id'))]}).success(function(att){
			db.User.find({where: ['"id" = ?', parseInt(req.param('user_id'))]}).success(function(user){
				res.render('trainer/show_attendance', {user: user, att: att});
			});
		});
	},
	
	take_feedback: function(req, res) {
		db.TrainerFeedback.find({ where: {EventId: parseInt(req.param('event_id'))} }).success(function(tf) {
			if(tf == null) {
				db.TrainerFeedback.create({ EventId: parseInt(req.param('event_id')), date: new Date()}).success(function(tfc) {
					res.render('trainer/take_feedback', {tf:tfc});
				});
			} else
				res.render('trainer/take_feedback', {tf:tf});
		});
	},
	
	update_feedback: function(req, res) {
		db.TrainerFeedback.find({ where: {id: parseInt(req.param('id'))} }).success(function(tf) {
			tf.updateAttributes(req.body).success(function(){
				res.send('Thanks for submitting feedback!', {
		            'Content-Type': 'text/plain'
		         }, 200);
			});
		});
	},
	
	submit_class_rating_details: function(req, res) {
		db.ClassRatingDetails.findOrCreate({ FeedbackId: parseInt(req.param('FeedbackId')) }).success(function(crd) {
			crd.updateAttributes(req.body).success(function(){
				res.send('Thanks for submitting feedback!', {
		            'Content-Type': 'text/plain'
		         }, 200);
			});
		});
	},
	
	create_event_log: function(req, res) {
		db.EventLog.create({EventId: parseInt(req.param('event_id')), date: new Date(), status: req.param('status')}).success(function(){
			res.send('Thanks for submitting feedback!', {
	            'Content-Type': 'text/plain'
	         }, 200);
		});
	},
	
	event_steps: function(req, res) {
		
		db.EventLog.findAll({ where: {EventId: parseInt(req.param('event_id'))}, order: 'id DESC' }).success(function(el) {
			db.Event.find({where: {id: parseInt(req.param('event_id'))}}).success(function(event){
				db.Event.findAll({where: ['"ModeratorId" = ? AND date IS NOT NULL AND "endDate" IS NOT NULL AND date < ? AND id != ? AND status != ?', parseInt(req.user.id), event.date, event.id, 'Done Event'], order: 'date ASC'}).success(function(events){
					res.render('trainer/event_steps',{events: events, event_id: req.param('event_id'), el: el && el.length > 0 ? el[0].status : null});
				});
			});
		});
	},
	
	trainer_event_confirm: function(req, res) {
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			event.updateAttributes({status: 'Trainer Accepted Invite'}).success(function(){
				res.redirect('/trainer/dashboard/'+req.user.id);
			});
		});
	},
	
	trainer_event_reject: function(req, res) {
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			event.updateAttributes({status: 'Trainer Rejected Invite'}).success(function(){
				res.redirect('/trainer/dashboard/'+req.user.id);
			});
		});
	},
	
	trainer_event_triage: function(req, res) {
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			event.updateAttributes({status: 'Trainer Triaged Invite'}).success(function(){
				res.redirect('/trainer/dashboard/'+req.user.id);
			});
		});
	},
	
	trainer_event_done: function(req, res) {
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			event.updateAttributes({status: 'Done Event'}).success(function(){
				res.send('Done event!', {
		            'Content-Type': 'text/plain'
		         }, 200);
			});
		});
	},
	
	reset_meeting: function(req, res) {
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			res.render('trainer/reset_meeting', {event: event});
		});
	},
	
	do_reset_meeting: function(req, res) {
		db.Event.find({ where: {id: parseInt(req.param('event_id'))} }).success(function(event) {
			event.updateAttributes({date: req.param('date'), "time": req.param('time_1')}).success(function(){
				res.redirect('/trainer/dashboard/'+req.user.id);
			});
		});
	},
	
	get_trainers: function(req, res) {
		var result = [];
		var r = [];
		var x = 0;
		db.Tag.findAll({ where: ['"name" LIKE ?', '%'+req.param('q')+'%'] }).success(function(tags) {
			var get_trainers = function(i) {
				if(i== tags.length) {
					/*res.send(r, {
			            'Content-Type': 'text/plain'
			         }, 200);*/
					res.render('trainer/get_trainers', {users: r, val: req.param('val')});
				} else {
					db.UserTags.findAll({ where: ['"TagId" = ?', tags[i].id] }).success(function(userTags) {
						var get_users_from_user_tags = function(j) {
							if(j == userTags.length) {
								get_trainers(++i);
							} else {
								db.User.find({ where: ['"id" = ?', userTags[j].UserId] }).success(function(user) {
									var pos = -1;
									pos = result.indexOf(user.first_name+' '+user.last_name);
									if(pos == -1) {
										result.push(user.first_name+' '+user.last_name);
										r[x] = {};
										//r[x].label = user.first_name+' '+user.last_name;
										//r[x].id = user.id;
										r[x] = user;
										db.Billing.find({ where: { UserId: user.id }}).success(function(billing) {
											if(billing) r[x].rate = billing.rate;
											x++;
											get_users_from_user_tags(++j);
										});
										
									}
									else get_users_from_user_tags(++j);
								});
							}
						};
						get_users_from_user_tags(0);
					});
				}
			};
			get_trainers(0);
		});
	},
	
	profile: function(req, res) {
		var successFlash = req.flash('info')[0];
		db.User.find({ where: { id: req.param('user_id') }, include: [db.Role, db.Skill, db.Organization] }).success(function(user) {
			db.Billing.find({ where: { UserId: user.id }}).success(function(billing) {
				db.UserTags.findAll({ where: { UserId: user.id }}).success(function(t) {
					var tags = [];
					var get_tags = function(i) {
						if(i == t.length) {
							res.render('trainer/profile', {tags: tags, user: user, billing: billing, successFlash: successFlash});
						} else {
							db.Tag.find({ where: { id: t[i].TagId }}).success(function(tag) {
								tags[i] = {};
								tags[i].id = tag.id;
								tags[i].name = tag.name;
								get_tags(++i);
							});
						}
					};
					get_tags(0);
				});
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {errors: errors});
		});
	},
	
	add_tag: function(req, res) {
		db.Tag.findOrCreate({name: req.param('tag_text') }).success(function(tag, created) {
			db.User.find({ where: { id: parseInt(req.user.id) }}).success(function(user) {
				db.UserTags.findOrCreate({ UserId: user.id, TagId: tag.id }).success(function(userTag) {
					res.redirect('/trainer/profile/'+user.id);
				});
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {errors: errors});
		});
	},
	
	delete_tag: function(req, res) {
		db.UserTags.find({where : ['"TagId" = ? AND "UserId" = ?', parseInt(req.param('tag_id')), parseInt(req.user.id)] }).success(function(tag) {
			tag.destroy().success(function() {
				res.redirect('/trainer/profile/'+req.user.id);
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('dashboard', {errors: errors});
		});
	},
	
	edit_billing: function(req, res) {
		db.Billing.findOrCreate({UserId: parseInt(req.user.id) }).success(function(billing) {
			res.render('trainer/edit_billing', {billing: billing, text: req.param('text'), user_id: req.user.id});
		});
	},
	
	do_edit: function(req, res) {
		var res_redirect = function() {
			res.redirect('/trainer/profile/'+req.user.id);
		};
		db.Billing.find({where : ['"id" = ?', parseInt(req.param('id'))] }).success(function(billing) {
			switch(req.param('text')) {
				case 'rate':
				billing.updateAttributes({rate: parseInt(req.param('rate'))}).success(function(){
					res_redirect();
				});
				break;
				
				case 'trainingHours':
				billing.updateAttributes({trainingHours: parseInt(req.param('rate'))}).success(function(){
					res_redirect();
				});
				break;
				
				case 'unBilledHours':
				billing.updateAttributes({unBilledHours: parseInt(req.param('rate'))}).success(function(){
					res_redirect();
				});
				break;
			}
		});
	},
	
	weekly_view: function(req, res) {
		db.Event.findAll({where: {ModeratorId: parseInt(req.param('user_id'))}, include: [db.Organization]}).success(function(events){
			res.render('trainer/trainer_weekly_view',{events: events});
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
									res.render('trainer/get_event_details',{event: event, es: es, user: user});
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
	
	tot: function(req, res) {
		db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) { 
			db.UserSkills.findAll({ where: { UserId: user.id}}).success(function(userSkills) {
				var skills = [];
				var get_skills = function(x) {
					if(x == userSkills.length) {
						res.render('trainer/tot', {userSkills: userSkills, user: user, skills: skills});
					} else {
						db.Skill.find({ where: { id: userSkills[x].SkillId}}).success(function(skill) {
							skills[x] = {};
							skills[x] = skill;
							db.SkillModulePlaylist.count({ where: ['"SkillId" = ?', userSkills[x].SkillId] }).success(function(totalModules) { 
								userSkills[x].totalModules = totalModules;
								userSkills[x].completedModules = 0;
								
								var get_completed_modules = function(k, id) {
									db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', id] }).success(function(module) {
										if(module == null || module.PrevModuleId == null) {
											userSkills[x].completedModules = k;
											get_skills(x+1);
										} else {
											get_completed_modules(++k, module.PrevModuleId);
										}
									});
								};
								
								db.SkillModulePlaylist.find({ where: ['"ModuleId" = ?', userSkills[x].ModuleId] }).success(function(module) {
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
	}
};