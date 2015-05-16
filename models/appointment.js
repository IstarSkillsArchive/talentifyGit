module.exports = function(sequelize, DataTypes) {
	var Appointment = sequelize.define('Appointment', {
		date: {
			type: DataTypes.STRING,
		},
		time: {
		 	type: DataTypes.STRING
		},
		option: {
			type: DataTypes.INTEGER
		},
		status: {
			type: DataTypes.STRING
		},
		meetingId: {
			type: DataTypes.STRING
		},
		meetingName: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.STRING
		},
		UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    },
	    CoachId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return Appointment;
};

