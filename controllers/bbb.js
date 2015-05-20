/* DEPRECATED */

var bbb = require('bigbluebutton'),
db = require('../models');

bbb.salt = '734e90ea774fafb41d639d7aaa03f328';
bbb.url = 'http://128.199.254.149/bigbluebutton';

module.exports = {
	join_coach: function(req, res) {
		var meetingId = 'talentify-bbb_'+req.param('coach_id')+'_'+req.param('user_id');
		var password;
		
		data_create = {
		  action: 'create',
		  params: { 
		    meetingID: meetingId,
		    meetingName: 'Talentify',
		    logoutURL: '/bbb/logout_coach/'+req.param('coach_id')+'_'+req.param('user_id')
		  }
//				  body: {
//				    modules: {
//				      module: [
//				        {
//				          name:'presentation',
//				          document:{url:'http://www.samplepdf.com/sample.pdf'}
//				        }
//				      ]
//				    }
//				  }
		};
		
		bbb.request(data_create, function (er,response){
  			console.log("############# CREATE RESPONSE #################", response);
  			var result = JSON.parse(response);
  			
  			if(result.response.returncode == "SUCCESS") {
  				db.Appointment.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "status" = \'confirm\'', parseInt(req.param('coach_id')), parseInt(req.param('user_id'))]}).success(function(appointment) {
	  				if(appointment) {
  						appointment.updateAttributes({meetingId: meetingId, meetingName: 'Talentify', password: result.response.attendeePW}).success(function() {
  							db.User.find({ where: { id: parseInt(req.param('coach_id'))}}).success(function(user) {
  								data_join = {
		  							  action: 'join',
		  							  params: {
		  							    fullName: user.first_name,
		  							    meetingID: meetingId,
		  							    password: result.response.moderatorPW
		  							  }
		  						};
		  	  					bbb.link(data_join,function(er,link){
		  	  					  console.log("############# JOIN LINK #################", link);
		  	  					  res.redirect("/coach/gym/"+req.param('coach_id')+'/'+req.param('user_id')+'/'+encodeURIComponent(link));
		  	  					});
  							});
	  					});
	  				}
  				});
  			} else {
  				var link = null;
  				res.redirect("/coach/gym/"+req.param('coach_id')+'/'+req.param('user_id')+'/'+link+'/'+result.response.message);
  			}
  		});
	},
	
	join_user: function(req, res) {
		db.Appointment.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "status" = \'confirm\'', parseInt(req.param('coach_id')), parseInt(req.param('user_id'))]}).success(function(appointment) {
			if(appointment) {
				db.User.find({ where: { id: parseInt(req.param('user_id'))}}).success(function(user) {
					data_join = {
					  action: 'join',
					  params: {
					    fullName: user.first_name,
					    meetingID: appointment.meetingId,
					    password: appointment.password
					  }
					};
  					bbb.link(data_join,function(er,link){
  					  console.log("############# JOIN LINK #################", link);
  					  res.render("coach/join_user",{link: link});
  					});
				});
			}
		});
	},
	
	logout_coach: function(req, res) {
		db.Appointment.find({ where: ['"CoachId" = ? AND "UserId" = ? AND "status" = \'confirm\'', parseInt(req.param('coach_id')), parseInt(req.param('user_id'))]}).success(function(appointment) {
			if(appointment) {
				appointment.destroy().success(function() {
					
				});
			}
		});
	}
};

/* DEPRECATED */
