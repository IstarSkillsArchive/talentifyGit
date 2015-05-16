var db = require('../models');
//,func = require('../controllers/functions');

module.exports = {
	get_user: function(id) {
		console.log(" >> ID "+id);
		var return_user = function(user) {
			console.log(">> USER "+user);
			return user;
		};
		
		var e = function(err) {
			console.log(">> ERROR "+err);
			return null;
		};
		
		return db.User.find({ where: { id: parseInt(id)}}).success(function(user) {
			console.log(">> USER "+user);
			return user;
		}).error(function(err) {
			console.log(">> ERROR "+err);
			return null;
		});
	},
	
	get_users: function(req, res) {
		function return_result(result) {
			if (result==null) {
	    	  	func.write('No users');
			} else {
				func.write('First name '+result[0].first_name);
			}
		};
		func.get_db_users(return_result);
	},
	
	get_db_users: function(callback) {
        console.log(">> CALLBACK "+callback);
		db.User.findAll().success(function(users){
            console.log(">> USERS "+users.length);
        	callback(users);
        }).error(function(err){
        	console.log(">> ERROR from func.get_users "+err);
            callback(null);
        });
    },
    
    get_roles: function(callback) {
        db.Role.findAll().success(function(roles){
            console.log(">> Roles "+roles.length);
        	callback(roles);
        }).error(function(err){
        	console.log(">> ERROR from func.get_roles "+err);
            callback(null);
        });
    },
    
    write: function(message) {
		console.log(message);
	}
};
