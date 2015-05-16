var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var JobUser = sequelize.define('JobUser', {
		status: {
	        type: DataTypes.STRING
	    },
		JobId: {
	        type: DataTypes.INTEGER,
	        references: "Jobs",
	        referencesKey: 'id'
	    },
	    UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return JobUser;
};
