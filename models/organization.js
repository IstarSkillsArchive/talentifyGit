module.exports = function(sequelize, DataTypes) {
	var Organization = sequelize.define('Organization', {
		name: {
			type: DataTypes.STRING,
			unique: true,
			validate: {
				notEmpty: {
					msg: "Please enter a name"
				}
			}
		},
		description: {
		 	type: DataTypes.TEXT
		},
		country: {
			type: DataTypes.STRING
		},
		state: {
			type: DataTypes.STRING
		},
		city: {
			type: DataTypes.STRING
		},
		address: {
			type: DataTypes.TEXT
		},
		type: {
			type: DataTypes.STRING
		},
		IstarCoordinatorId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    }
	},
	{
		instanceMethods: {
			isAdmin: function() {
				return this.role === "admin";
			}
		}
	});
	
	return Organization;
}
