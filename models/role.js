module.exports = function(sequelize, DataTypes) {
	var Role = sequelize.define('Role', {
		name: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg: "Please enter a name"
				}
			}
		}
	});
	
	return Role;
}

