module.exports = function(sequelize, DataTypes) {
	var District = sequelize.define('District', {
		name: {
			type: DataTypes.STRING
		}
	});
	
	return District;
}

