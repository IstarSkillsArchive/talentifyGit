var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var RoleTest = sequelize.define('RoleTest', {
		RoleId: {
	        type: DataTypes.INTEGER,
	        references: "Roles",
	        referencesKey: 'id'
	    },
	    TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    }
	});
	
	return RoleTest;
};
