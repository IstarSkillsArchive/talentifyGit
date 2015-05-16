module.exports = function(sequelize, DataTypes) {
	var SkillModulePlaylist = sequelize.define('SkillModulePlaylist', {
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
	    SkillId: {
	        type: DataTypes.INTEGER,
	        references: "Skills",
	        referencesKey: 'id'
	    },
	    PrevModuleId: {
	        type: DataTypes.INTEGER,
	        references: "Modules",
	        referencesKey: 'id'
	    },
	    OrganizationId: {
	        type: DataTypes.INTEGER,
	        references: "Organizations",
	        referencesKey: 'id'
	    }
	});
	
	return SkillModulePlaylist;
};

