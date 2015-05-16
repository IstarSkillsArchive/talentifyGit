module.exports = function(sequelize, DataTypes) {
	var TrainerLocation = sequelize.define('TrainerLocation', {
		latitude: {
			type: DataTypes.FLOAT,
		},
		longitude: {
		 	type: DataTypes.FLOAT
		},
		date: {
			type: DataTypes.DATE
		},
		TrainerId: {
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
	
	return TrainerLocation;
};

