var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var ContentTest = sequelize.define('ContentTest', {
		
		ContentId: {
	        type: DataTypes.INTEGER,
	        references: "Contents",
	        referencesKey: 'id'
	    },
	    TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    }	
	});
	
	return ContentTest;
}
		