module.exports = function(sequelize, DataTypes) {
	var TrainerFeedback = sequelize.define('TrainerFeedback', {
		date: {
			type: DataTypes.DATE
		},
		classRating: {
			type: DataTypes.INTEGER
		},
		isModuleCompleted: {
			type: DataTypes.BOOLEAN
		},
		moduleComment: {
			type: DataTypes.TEXT
		},
		anyProblem: {
			type: DataTypes.TEXT
		},
		EventId: {
	        type: DataTypes.INTEGER,
	        references: "Events",
	        referencesKey: 'id'
	    }
	});
	
	return TrainerFeedback;
};

