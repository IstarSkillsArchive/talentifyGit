module.exports = function(sequelize, DataTypes) {
	var Module = sequelize.define('Module', {
		name: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: "Please enter a name"
				}
			}
		},
		description: {
		 	type: DataTypes.STRING
		},
		isPublic: {
			type: DataTypes.BOOLEAN,
		}
	});
	
	return Module;
}

