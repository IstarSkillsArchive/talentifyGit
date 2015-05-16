module.exports = function(sequelize, DataTypes) {
	var Tag = sequelize.define('Tag', {
		name: {
			type: DataTypes.STRING
		},
		description: {
			type: DataTypes.STRING
		}
	});
	
	return Tag;
}

