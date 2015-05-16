module.exports = function(sequelize, DataTypes) {
	var Report = sequelize.define('Report', {
		status: {
			type: DataTypes.STRING
		},
		date: {
			type: DataTypes.STRING
		},
		time: {
		 	type: DataTypes.STRING
		},
		score: {
			type: DataTypes.FLOAT
		},
		isPassed: {
			type: DataTypes.BOOLEAN
		},
		reason: {
			type: DataTypes.STRING
		},
		numberOfAttempt: {
			type: DataTypes.INTEGER
		},
		TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    },
	    UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return Report;
};

