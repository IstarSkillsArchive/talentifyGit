module.exports = function(sequelize, DataTypes) {
	var ClassRatingDetails = sequelize.define('ClassRatingDetails', {
		isContentAllocatedFitsInTime: {
			type: DataTypes.BOOLEAN
		},
		isStudentParticipationQuality: {
			type: DataTypes.BOOLEAN
		},
		isClassDiscipline: {
			type: DataTypes.BOOLEAN
		},
		isStudentEnjoyedTheContent: {
			type: DataTypes.BOOLEAN
		},
		isLearningExperience: {
			type: DataTypes.BOOLEAN
		},
		isLowAttendance: {
			type: DataTypes.BOOLEAN
		},
		isInfrastructureIssues: {
			type: DataTypes.BOOLEAN
		},
		isModuleNotCompleted: {
			type: DataTypes.BOOLEAN
		},
		isActivityHard: {
			type: DataTypes.BOOLEAN
		},
		isPowerFailure: {
			type: DataTypes.BOOLEAN
		},
		isNothingFine: {
			type: DataTypes.BOOLEAN
		},
		FeedbackId: {
	        type: DataTypes.INTEGER,
	        references: "TrainerFeedbacks",
	        referencesKey: 'id'
	    }
	});
	
	return ClassRatingDetails;
};

