module.exports = function(sequelize, DataTypes) {
	var Step = sequelize.define('Step', {
		name: {
			type: DataTypes.STRING
		},
		description: {
		 	type: DataTypes.STRING
		},
		type: {
		 	type: DataTypes.STRING
		},
		order: {
			type: DataTypes.INTEGER
		},
		JobId: {
	        type: DataTypes.INTEGER,
	        references: "Jobs",
	        referencesKey: 'id'
	    }
	});
	
	return Step;
};

