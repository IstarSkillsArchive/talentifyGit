module.exports = function(sequelize, DataTypes) {
	var SkillGroup = sequelize.define('SkillGroup', {
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
		}
	});
	
	return SkillGroup;
}

