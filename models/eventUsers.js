var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var EventUsers = sequelize.define('EventUsers', {
		status: {
	        type: DataTypes.STRING
	    },
		EventId: {
	        type: DataTypes.INTEGER,
	        references: "Events",
	        referencesKey: 'id'
	    },
	    UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return EventUsers;
};
