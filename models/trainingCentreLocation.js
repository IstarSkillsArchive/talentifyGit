module.exports = function(sequelize, DataTypes) {
	var TrainingCentreLocation = sequelize.define('TrainingCentreLocation', {
		name: {
			type: DataTypes.STRING
		},
		address: {
			type: DataTypes.TEXT
		},
		pincode: {
			type: DataTypes.INTEGER
		}
	});
	
	return TrainingCentreLocation;
}

