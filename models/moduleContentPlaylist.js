module.exports = function(sequelize, DataTypes) {
	var ModuleContentPlaylist = sequelize.define('ModuleContentPlaylist', {
		name: {
			type: DataTypes.STRING,
		},
		description: {
		 	type: DataTypes.STRING
		},
		isPublic: {
			type: DataTypes.BOOLEAN
		},
		ModuleId: {
	        type: DataTypes.INTEGER,
	        references: "Modules",
	        referencesKey: 'id'
	    },
	    ContentId: {
	        type: DataTypes.INTEGER,
	        references: "Contents",
	        referencesKey: 'id'
	    },
	    PrevContentId: {
	        type: DataTypes.INTEGER,
	        references: "Contents",
	        referencesKey: 'id'
	    },
	    OrganizationId: {
	        type: DataTypes.INTEGER,
	        references: "Organizations",
	        referencesKey: 'id'
	    }
	});
	
	return ModuleContentPlaylist;
};

