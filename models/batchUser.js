var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var BatchUser = sequelize.define('BatchUser', {
		status: {
	        type: DataTypes.STRING
	    },
		BatchId: {
	        type: DataTypes.INTEGER,
	        references: "Batches",
	        referencesKey: 'id'
	    },
	    UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return BatchUser;
};
