var db = require('../models');

module.exports = {
		
	dashboard: function(req, res) {
		//res.redirect('/recruiter/list_jobs/'+req.user.id);
		res.render('recruiter/dashboard');
	},
	
	list_jobs: function(req, res) {
		db.Job.findAll({ where: {PostedBy: parseInt(req.param('user_id'))}, offset: res.locals.offset, limit: res.locals.limit, order: 'id ASC' }).success(function(jobs) {
			res.render('recruiter/list_jobs', {jobs: jobs, successFlash: req.flash('info')[0]});
		});		
	},
	
	create_job: function( req, res ) {
		res.render('recruiter/create_job');
	},
	
	do_create_job: function( req, res ) {
		db.Job.create(req.body).success(function(job){
			job.updateAttributes({PostedBy: parseInt(req.user.id)}).success(function(){
				res.redirect('/recruiter/list_jobs/'+req.user.id);
			});
		});
	},
	
	edit_job: function(req, res) {
		db.Job.find({ where: {id: parseInt(req.param('id'))} }).success(function(job) {
			db.Step.findAll({ where: {JobId: job.id}, order: 'id ASC' }).success(function(steps) {
				if(steps.length > 0) {
					db.Step.find({ where: ['"JobId" = ? AND "order" = 1', job.id]}).success(function(step) {
						db.StepTest.find({ where: {StepId: step.id}}).success(function(stepTest) {
							db.JobUser.findAll({ where: { JobId: job.id } }).success(function(pl) { 
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
										db.User.findAll({ where: ['"permission" = ?', 'user']}).success(function(users) {
											db.Role.findAll().success(function(roles) {
												db.Skill.findAll().success(function(skills) {
													res.render('recruiter/edit_job', {job: job, steps: steps, playlists: playlists, users: users, roles: roles, skills: skills, successFlash: req.flash('info')[0]});
												});
											});
										});
									} else {
										db.User.find({ where: { id: pl[i].UserId } }).success(function(c) {
											if(c) { 
												if(pl[i].status == 'RSVP Yes') {
													db.Report.find({ where: ['"UserId" = ? AND "TestId" = ?', c.id, stepTest.TestId]}).success(function(report) {
														if(report && report.isPassed) 
															playlists.push(new playlist(c.id, c.first_name, c.last_name, 'Passed Test'));
														else if(report && !report.isPassed)
															playlists.push(new playlist(c.id, c.first_name, c.last_name, 'Failed Test'));
														else if(!report)
															playlists.push(new playlist(c.id, c.first_name, c.last_name, pl[i].status));
													});
												} else {
													playlists.push(new playlist(c.id, c.first_name, c.last_name, pl[i].status));
												}
											}
											build_playlist(++i);
										});
									}
								};
								build_playlist(0);
							});
						});
					});
				} else {
					res.render('recruiter/edit_job', {job: job, steps: steps, playlists: null, users: null, roles: null, skills: null, successFlash: req.flash('info')[0]});
				}
			});
		});		
	},
	
	do_edit_job: function( req, res) {
		db.Job.find({ where: {id: parseInt(req.param('job_id'))} }).success(function(job) {
			job.updateAttributes(req.body).success(function() {
				req.flash('info', 'Job updated');
				res.redirect('/recruiter/edit_job/'+job.id);
			});
		});		
	},
	
	add_step_to_job: function(req, res) {
		db.Job.find({ where: {id: parseInt(req.param('job_id'))} }).success(function(job) {
			res.render('recruiter/add_step_to_job', {job: job, successFlash: req.flash('info')[0]});
		});		
	},
	
	do_add_step_to_job: function( req, res) {
		db.Step.create(req.body).success(function(step){
			step.updateAttributes({order: 1}).success(function(){
				req.flash('info', 'Created interview round');
				res.redirect('/recruiter/edit_job/'+step.JobId);
			});
		});
	},
	
	edit_step: function( req, res) {
		db.Step.find({ where: {id: parseInt(req.param('id'))} }).success(function(step) {
			if(step.type == 'Test') {
				db.StepTest.find({ where: {StepId: step.id} }).success(function(stepTest) {
					if(stepTest)
						db.Test.find({ where: {id: stepTest.TestId} }).success(function(test) {
							res.render('recruiter/edit_step_test', {step: step, test: test});
						});
					else
						res.render('recruiter/edit_step_test', {step: step, test: null});
				});
			}
		});
	},
	
	delete_step_test: function( req, res) {
		db.Step.find({ where: { id: parseInt(req.param('step_id')) } }).success(function(step) {
			db.StepTest.find({ where: ['"StepId" = ? AND "TestId" = ?', parseInt(req.param('step_id')), parseInt(req.param('test_id'))] }).success(function(stepTest) {
				stepTest.destroy().success(function(){
					req.flash('info', 'Deleted test');
					res.redirect('/recruiter/edit_job/'+step.JobId);
				});
			});
		});
	},
	
	ajax_filter_job_users_skills: function(req, res) {
		db.UserSkills.findAll({ where: { SkillId: parseInt(req.param('skill_id')) } }).success(function(us) {
			var users = [];
			var get_user = function(i) {
				if(i == us.length) {
					res.render('recruiter/users_ajax', {users: users, val: req.param('val'), job_id: req.param('job_id')});
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
	
	ajax_filter_job_users_roles: function(req, res) {
		db.User.findAll({ where: ['"RoleId" = ? AND permission = ?', parseInt(req.param('role_id')), 'user']}).success(function(users) {
			res.render('recruiter/users_ajax', {users: users, val: req.param('val'), job_id: req.param('job_id')});
		});
	},
	
	add_user_to_job: function( req, res ) {
		db.JobUser.findOrCreate({UserId: parseInt(req.param('user_id')), JobId: parseInt(req.param('job_id'))},{status: 'Invited'}).success(function(jobUser) {
			res.redirect('/recruiter/edit_job/'+jobUser.JobId);
		});
	},
	
	delete_user_from_job: function( req, res) {
		db.JobUser.find({ where: ['"JobId" = ? AND "UserId" = ?', parseInt(req.param('job_id')), parseInt(req.param('user_id'))] }).success(function(jobUser) {
			jobUser.destroy().success(function(){
				req.flash('info', 'Removed user');
				res.redirect('/recruiter/edit_job/'+parseInt(req.param('job_id')));
			});
		});
	},
	
	rsvp_job: function(req, res) {
		db.JobUser.find({ where: ['"JobId" = ? AND "UserId" = ?', parseInt(req.param('job_id')), parseInt(req.param('user_id'))]}).success(function(jobUser) {
			jobUser.updateAttributes({status: 'RSVP Yes'}).success(function(){
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(
			        'Thank you for applying to this job. Please answer the test.'
			      );
				res.end();
			});
		});
	},
	
	set_appointment: function(req, res) {
		res.render('recruiter/set_appointment', {user_id: req.param('user_id'), job_id: req.param('job_id'), recruiter_id: req.user.id});
	},
	
	schedule_interview: function(req, res) {
		db.Appointment.create(req.body).success(function(){
			db.JobUser.find({ where: ['"JobId" = ? AND "UserId" = ?', parseInt(req.param('JobId')), parseInt(req.param('UserId'))]}).success(function(jobUser) {
				jobUser.updateAttributes({status: 'Interview'}).success(function(){
					req.flash('info', 'Interview has been scheduled');
					res.redirect('/recruiter/schedule_interview_submit/'+jobUser.JobId);
				});
			});
		});
	},
	
	schedule_interview_submit: function(req, res) {
		res.render('recruiter/schedule_interview_submit', {job_id: req.param('job_id')});
	}, 
	
	appointments: function(req, res) {
		db.Appointment.findAll({ where: ['"CoachId" = ?', parseInt(req.user.id)]}).success(function(appointments) {
			var users = [];
			var get_users = function(i) {
				if(i == appointments.length) {
					res.render('recruiter/calendar', {appointments: appointments, users: users});
				} else {
					db.User.find({ where: ['"id" = ?', appointments[i].UserId]}).success(function(user) {
						users.push(user);
						get_users(++i);
					});
				}
			};
			get_users(0);
		});
	},
	
	select_user: function(req, res) {
		db.JobUser.find({ where: ['"JobId" = ? AND "UserId" = ?', parseInt(req.param('job_id')), parseInt(req.param('user_id'))]}).success(function(jobUser) {
			jobUser.updateAttributes({status: 'Selected'}).success(function(){
				res.redirect('/recruiter/edit_job/'+jobUser.JobId);
			});
		});
	},
	
	reject_user: function(req, res) {
		db.JobUser.find({ where: ['"JobId" = ? AND "UserId" = ?', parseInt(req.param('job_id')), parseInt(req.param('user_id'))]}).success(function(jobUser) {
			jobUser.updateAttributes({status: 'Rejected'}).success(function(){
				res.redirect('/recruiter/edit_job/'+jobUser.JobId);
			});
		});
	}
};