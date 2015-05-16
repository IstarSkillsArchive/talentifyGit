module.exports = function(sequelize, DataTypes) {
	var Problem = sequelize.define('Problem', {
		difficultyLevel: {
			type: DataTypes.STRING
		},
		whatIsTested: {
		 	type: DataTypes.STRING
		},
		isProblemContentSpecific: {
		 	type: DataTypes.BOOLEAN
		},
		isReviewed: {
		 	type: DataTypes.BOOLEAN
		},
		isMultiMedia: {
			type: DataTypes.BOOLEAN
		},
		filePath: {
		 	type: DataTypes.STRING
		},
		type: {
			type: DataTypes.STRING
		},
		text: {
			type: DataTypes.TEXT
		},
		PrevProblemId: {
	        type: DataTypes.INTEGER,
	        references: "Problems",
	        referencesKey: 'id'
	    }
	});
	
	return Problem;
};

