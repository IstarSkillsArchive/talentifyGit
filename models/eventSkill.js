module.exports = function(sequelize, DataTypes) {
	var EventSkill = sequelize.define('EventSkill', {
		status: {
			type: DataTypes.STRING
		},
		EventId: {
	        type: DataTypes.INTEGER,
	        references: "Events",
	        referencesKey: 'id'
	    },
		SkillId: {
	        type: DataTypes.INTEGER,
	        references: "Skills",
	        referencesKey: 'id'
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
	    RoleId: {
	        type: DataTypes.INTEGER,
	        references: "Roles",
	        referencesKey: 'id'
	    },
	    PrevEventId: {
	        type: DataTypes.INTEGER,
	        references: "Events",
	        referencesKey: 'id'
	    }
	});
	
	return EventSkill;
};

