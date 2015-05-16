var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var EventTest = sequelize.define('EventTest', {
		EventId: {
	        type: DataTypes.INTEGER,
	        references: "Events",
	        referencesKey: 'id'
	    },
	    TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    }
	});
	
	return EventTest;
};
