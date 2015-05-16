var db = require('../models'),
request = require('request');

module.exports = {
	start_meeting: function( req, res ) {
		/*request.post(
		    'https://api.zoom.us/v1/user/create',
		    { form: { api_key: 'QBJv9A8jM2tyG0tyMC8F8XeLEDn7lGrTDa0N', api_secret: 'tbOF7RGo954FP5qeNKiVMpaVihSIWi8ZGbiS', data_type: 'JSON', email: 'princiya777@aiaioo.com', type: 2 } },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            console.log("#############ZOOM "+body);
		        }
		    }
		);*/
		//host_id_princiya: ygF04ToQRIaSCZarF6s9_g
		
		request.post(
		    'https://api.zoom.us/v1/meeting/create',
		    { form: { api_key: 'QBJv9A8jM2tyG0tyMC8F8XeLEDn7lGrTDa0N', api_secret: 'tbOF7RGo954FP5qeNKiVMpaVihSIWi8ZGbiS', data_type: 'JSON', host_id: 'ZAryLbfaTDqwhHvrpwXG3Q', topic: 'Meeting with Coach', type: 1, option_jbh: false, option_start_type: 'video' } },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            var result = JSON.parse(body);
		            
		            db.Appointment.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "status" = \'confirm\'', parseInt(req.param('coach_id')), parseInt(req.param('user_id'))]}).success(function(appointment) {
		  				if(appointment) {
	  						appointment.updateAttributes({meetingId: result.id, meetingName: result.topic}).success(function() {
	  							res.redirect("/coach/gym/"+req.param('coach_id')+'/'+req.param('user_id')+'/'+encodeURIComponent(result.start_url)+'/'+result.topic);
		  					});
		  				}else
		  					res.redirect("/coach/gym/"+req.param('coach_id')+'/'+req.param('user_id'));
	  				});
		        } else {
		        	res.redirect("/coach/gym/"+req.param('coach_id')+'/'+req.param('user_id')+'/'+error.message);
		        }
		    }
		);
	},
	
	start_live_class: function( req, res ) {
		request.post(
		    'https://api.zoom.us/v1/meeting/create',
		    { form: { api_key: 'QBJv9A8jM2tyG0tyMC8F8XeLEDn7lGrTDa0N', api_secret: 'tbOF7RGo954FP5qeNKiVMpaVihSIWi8ZGbiS', data_type: 'JSON', host_id: 'ZAryLbfaTDqwhHvrpwXG3Q', topic: 'Live Class', type: 1, option_jbh: false, option_start_type: 'video' } },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            var result = JSON.parse(body);
		            
		            db.Event.find({ where: ['"id" = ?', parseInt(req.param('event_id'))]}).success(function(appointment) {
		  				if(appointment) {
	  						appointment.updateAttributes({meetingId: result.id, meetingName: result.topic}).success(function() {
	  							res.render("coach/join_user",{link: result.start_url});
	  						});
		  				}else
		  					res.render("coach/join_user",{link: null});
	  				});
		        } else {
		        	res.render("coach/join_user",{link: null});
		        }
		    }
		);
	},
	
	join_meeting: function(req, res) {
		db.Appointment.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "status" = \'confirm\'', parseInt(req.param('coach_id')), parseInt(req.param('user_id'))]}).success(function(appointment) {
			if(appointment) {
				//db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
					var join_url = "https://api.zoom.us/j/"+appointment.meetingId;
					res.render("coach/join_user",{link: join_url});
				//});
			} else
				res.render("coach/join_user",{link: null});
		});
	},
	
	join_live_class: function(req, res) {
		db.Event.find({ where: ['"id" = ?', parseInt(req.param('event_id'))]}).success(function(appointment) {
			if(appointment) {
				//db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
					var join_url = "https://api.zoom.us/j/"+appointment.meetingId;
					res.render("coach/join_user",{link: join_url});
				//});
			} else
				res.render("coach/join_user",{link: null});
		});
	},
	
	recruiter_start_meeting: function( req, res ) {
		request.post(
		    'https://api.zoom.us/v1/meeting/create',
		    { form: { api_key: 'QBJv9A8jM2tyG0tyMC8F8XeLEDn7lGrTDa0N', api_secret: 'tbOF7RGo954FP5qeNKiVMpaVihSIWi8ZGbiS', data_type: 'JSON', host_id: 'ZAryLbfaTDqwhHvrpwXG3Q', topic: 'Interview', type: 1, option_jbh: false, option_start_type: 'video' } },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            var result = JSON.parse(body);
		            
		            db.Appointment.find({ where: ['"CoachId" = ? AND "UserId" = ?', parseInt(req.param('recruiter_id')), parseInt(req.param('user_id'))]}).success(function(appointment) {
		  				if(appointment) {
	  						appointment.updateAttributes({meetingId: result.id, meetingName: result.topic}).success(function() {
	  							res.redirect(result.start_url);
		  					});
		  				}else
		  					res.redirect("/recruiter/appointments");
	  				});
		            
		        } else {
		        	res.redirect("/recruiter/appointments");
		        }
		    }
		);
	},
};