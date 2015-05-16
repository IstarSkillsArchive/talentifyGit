var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var CoachRatingHistory = sequelize.define('CoachRatingHistory', {
		rating: {
			type: DataTypes.INTEGER
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
	
	return CoachRatingHistory;
};
