var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var UserSkills = sequelize.define('UserSkills', {
		level: {
			type: DataTypes.STRING
		},
		rating: {
			type: DataTypes.INTEGER
		},
		status: {
			type: DataTypes.STRING
		},
		ContentId: {
	        type: DataTypes.INTEGER,
	        references: "Contents",
	        referencesKey: 'id'
	    },
	    ModuleId: {
	        type: DataTypes.INTEGER,
	        references: "Modules",
	        referencesKey: 'id'
	    }
	});
	
	return UserSkills;
}
