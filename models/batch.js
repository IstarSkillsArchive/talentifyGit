module.exports = function(sequelize, DataTypes) {
	var Batch = sequelize.define('Batch', {
		name: {
			type: DataTypes.STRING
		},
		year: {
			type: DataTypes.INTEGER
		},
		status: {
			type: DataTypes.STRING
		}
	});
	
	return Batch;
};

