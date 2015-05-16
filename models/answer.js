module.exports = function(sequelize, DataTypes) {
	var Answer = sequelize.define('Answer', {
		score: {
			type: DataTypes.FLOAT,
		},
		whatAnswerIndicates: {
		 	type: DataTypes.STRING
		},
		isAnswer: {
		 	type: DataTypes.BOOLEAN
		},
		isMultiMedia: {
			type: DataTypes.BOOLEAN
		},
		filePath: {
		 	type: DataTypes.STRING
		},
		text: {
			type: DataTypes.TEXT
		},
		ProblemId: {
	        type: DataTypes.INTEGER,
	        references: "Problems",
	        referencesKey: 'id'
	    },
	    SkillId: {
	        type: DataTypes.INTEGER,
	        references: "Skills",
	        referencesKey: 'id'
	    }
	});
	
	return Answer;
};

