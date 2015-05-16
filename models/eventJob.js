var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var EventJob = sequelize.define('EventJob', {
		EventId: {
	        type: DataTypes.INTEGER,
	        references: "Events",
	        referencesKey: 'id'
	    },
	    JobId: {
	        type: DataTypes.INTEGER,
	        references: "Jobs",
	        referencesKey: 'id'
	    }
	});
	
	return EventJob;
};
