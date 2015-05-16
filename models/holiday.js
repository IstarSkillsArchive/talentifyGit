module.exports = function(sequelize, DataTypes) {
	var Holiday = sequelize.define('Holiday', {
		description: {
		 	type: DataTypes.TEXT
		},
		OrganizationId: {
	        type: DataTypes.INTEGER,
	        references: "Organizations",
	        referencesKey: 'id'
	    },
	    date: {
	    	type: DataTypes.DATE
	    }
	});
	
	return Holiday;
};
