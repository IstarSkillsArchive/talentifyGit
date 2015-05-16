module.exports = function(sequelize, DataTypes) {
	var Login = sequelize.define('Login', {
		date: {
			type: DataTypes.STRING,
		},
		time: {
			type: DataTypes.STRING,
		},
		UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return Login;
};

