//Trainer Mapping To Trainer Centre Location

var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var TrainerMappingToTcl = sequelize.define('TrainerMappingToTcl', {
		TrainerId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    },
	    TclId: {
	        type: DataTypes.INTEGER,
	        references: "TrainingCentreLocations",
	        referencesKey: 'id'
	    }
	});
	
	return TrainerMappingToTcl;
};
