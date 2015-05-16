module.exports = function(sequelize, DataTypes) {
	var Country = sequelize.define('Country', {
		name: {
			type: DataTypes.STRING
		}
	});
	
	return Country;
}

