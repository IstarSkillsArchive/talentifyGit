module.exports = function(sequelize, DataTypes) {
	var Event = sequelize.define('Event', {
		name: {
			type: DataTypes.STRING
		},
		description: {
		 	type: DataTypes.STRING
		},
		type: {
		 	type: DataTypes.STRING
		},
		date: {
			type: DataTypes.DATE
		},
		endDate: {
			type: DataTypes.DATE
		},
		maxSize: {
			type: DataTypes.INTEGER
		},
		location: {
			type: DataTypes.STRING
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
		OrganizationId: {
	        type: DataTypes.INTEGER,
	        references: "Organizations",
	        referencesKey: 'id'
	    },
		InitiatorId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    },
	    ModeratorId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return Event;
};

