module.exports = function(sequelize, DataTypes) {
	var TestProblems = sequelize.define('TestProblems', {
		positiveScore: {
			type: DataTypes.FLOAT
		},
		negativeScore: {
			type: DataTypes.FLOAT
		},
		duration: {
			type: DataTypes.INTEGER
		},
		isLocked: {
			type: DataTypes.BOOLEAN
		},
		isCritical: {
			type: DataTypes.BOOLEAN
		},
		isMandatory: {
			type: DataTypes.BOOLEAN
		},
		TestId: {
	        type: DataTypes.INTEGER,
	        references: "Tests",
	        referencesKey: 'id'
	    },
	    ProblemId: {
	        type: DataTypes.INTEGER,
	        references: "Problems",
	        referencesKey: 'id'
	    },
	    PrevProblemId: {
	        type: DataTypes.INTEGER,
	        references: "Problems",
	        referencesKey: 'id'
	    }
	});
	
	return TestProblems;
};

