module.exports = function(sequelize, DataTypes) {
	var Job = sequelize.define('Job', {
		name: {
			type: DataTypes.STRING
		},
		description: {
		 	type: DataTypes.STRING
		},
		salary: {
		 	type: DataTypes.STRING
		},
		location: {
		 	type: DataTypes.STRING
		},
		createdDate: {
		 	type: DataTypes.STRING
		},
		expiryDate: {
		 	type: DataTypes.STRING
		},
		PostedBy: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return Job;
};

