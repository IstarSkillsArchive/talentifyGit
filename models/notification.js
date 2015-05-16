module.exports = function(sequelize, DataTypes) {
	var Notification = sequelize.define('Notification', {
		date: {
			type: DataTypes.STRING,
		},
		time: {
		 	type: DataTypes.STRING
		},
		text: {
			type: DataTypes.STRING
		},
		description: {
			type: DataTypes.STRING
		},
		UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	});
	
	return Notification;
};

