var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var SkillTest = sequelize.define('SkillTest', {
		
		SkillId: {
	        type: DataTypes.INTEGER,
	        references: "Skills",
	        referencesKey: 'id'
	    },
	    TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    }	
	});
	
	return SkillTest;
}
		