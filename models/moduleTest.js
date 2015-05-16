var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var ModuleTest = sequelize.define('ModuleTest', {
		
		ModuleId: {
	        type: DataTypes.INTEGER,
	        references: "Modules",
	        referencesKey: 'id'
	    },
	    TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    }	
	});
	
	return ModuleTest;
}
		