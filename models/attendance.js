module.exports = function(sequelize, DataTypes) {
	var Attendance = sequelize.define('Attendance', {
		status: {
			type: DataTypes.STRING,
		},
		date: {
			type: DataTypes.DATE,
		},
		UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    },
		EventId: {
	        type: DataTypes.INTEGER,
	        references: "Events",
	        referencesKey: 'id'
	    }
	});
	
	return Attendance;
};

