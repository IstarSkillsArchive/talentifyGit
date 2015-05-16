module.exports = function(sequelize, DataTypes) {
	var Test = sequelize.define('Test', {
		name: {
			type: DataTypes.STRING,
		},
		description: {
		 	type: DataTypes.STRING
		},
		criticalQuestions: {
			type: DataTypes.STRING
		},
		passCondition: {
			type: DataTypes.STRING,
		},
		passScore: {
			type: DataTypes.FLOAT,
		},
		duration: {
			type: DataTypes.INTEGER,
		}
	});
	
	return Test;
};

