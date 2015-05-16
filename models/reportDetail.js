module.exports = function(sequelize, DataTypes) {
	var ReportDetail = sequelize.define('ReportDetail', {
		date: {
			type: DataTypes.STRING
		},
		time: {
		 	type: DataTypes.STRING
		},
		score: {
			type: DataTypes.FLOAT
		},
		timeToAnswer: {
			type: DataTypes.INTEGER
		},
		isAnswer: {
		 	type: DataTypes.BOOLEAN
		},
		ProblemId: {
	        type: DataTypes.INTEGER,
	        references: "Problems",
	        referencesKey: 'id'
	    },
	    AnswerId: {
	        type: DataTypes.INTEGER,
	        references: "Answers",
	        referencesKey: 'id'
	    },
	    UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    },
	    TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    }
	});
	
	return ReportDetail;
};

