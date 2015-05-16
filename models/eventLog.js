module.exports = function(sequelize, DataTypes) {
	var EventLog = sequelize.define('EventLog', {
		status: {
			type: DataTypes.STRING,
		},
		date: {
			type: DataTypes.DATE
		},
		EventId: {
	        type: DataTypes.INTEGER,
	        references: "Events",
	        referencesKey: 'id'
	    }
	});
	
	return EventLog;
};

