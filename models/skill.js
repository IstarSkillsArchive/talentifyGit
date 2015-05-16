module.exports = function(sequelize, DataTypes) {
	var Skill = sequelize.define('Skill', {
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
		imgPath: {
			type: DataTypes.STRING
		}
	});
	
	return Skill;
}

