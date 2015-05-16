var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var CoachNotesHistory = sequelize.define('CoachNotesHistory', {
		notes: {
			type: DataTypes.TEXT
		},
		date: {
			type: DataTypes.DATE
		},
		UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    },
	    SkillId: {
	        type: DataTypes.INTEGER,
	        references: "Skills",
	        referencesKey: 'id'
	    },
		CoachId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return CoachNotesHistory;
}
