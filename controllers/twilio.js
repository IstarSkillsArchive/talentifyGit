//ACdf6784bdc0e5537f73adf820708027c5
//05582901b4f72bf746d21e8471433f74
/*var client = require('twilio')('AC35569df73c663b982e524da779c8da09', '374bcc4f4aae9d30fd49f64b84b0166b')
;*/
var client = require('twilio')('ACdf6784bdc0e5537f73adf820708027c5', '05582901b4f72bf746d21e8471433f74')
;

module.exports = {
	send_sms : function(req, res) {
		res.render('twilio/send_sms');
	},
	
	do_send_sms: function(req, res) {
		console.log(" TRYING TO SEND "+req.param('msg')+" to "+req.param('phone'));
		client.sms.messages.create({
		    body: req.param('msg'),
		    to: req.param('phone'),
		    from: /*"+19099069959""+15005550006""+13172070891"*/"+12566774481"
		}, function(err, responseData) { //this function is executed when a response is received from Twilio

		 if(err) {
			 console.log(">> ERROR ", err);
			 res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(
			        'There was an error '
			      );
				res.end();
		 } 
		 if (!err) { 
			 console.log(responseData.from); 
		     console.log(responseData.body); 
		     res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(
			        'Message sent successfully'
			      );
				res.end();
		  }
		});
	},
	
	get_messages: function(req, res) {
		client.messages.list(function(err, data) {
		    data.messages.forEach(function(sms, i) {
		        for(var key in sms)
		        	console.log(i+" "+key+" "+sms[key]);
		        console.log("#############");
		    });
		});
	}
};
