module.exports = function(sequelize, DataTypes) {
	var State = sequelize.define('State', {
		name: {
			type: DataTypes.STRING
		}
	});
	
	return State;
}

