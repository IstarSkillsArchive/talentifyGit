var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var StepTest = sequelize.define('StepTest', {
		
		StepId: {
	        type: DataTypes.INTEGER,
	        references: "Steps",
	        referencesKey: 'id'
	    },
	    TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    }	
	});
	
	return StepTest;
};
		