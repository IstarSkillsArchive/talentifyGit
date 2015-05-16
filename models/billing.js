var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var Billing = sequelize.define('Billing', {
		rate: {
			type: DataTypes.FLOAT
		},
		trainingHours: {
			type: DataTypes.FLOAT
		},
		unBilledHours: {
			type: DataTypes.FLOAT
		},
		UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return Billing;
}
