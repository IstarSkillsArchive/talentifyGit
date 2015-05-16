var config = require('../config/config.json');
//validator = require('validator');
//
//validator.extend('isUnique', function(str) {
//  return false;
//  
//  isUnique: function (username) { // This doesn't work
//	  var User = seqeulize.import('../models');
//
//	  User.find({where:{username: username}})
//	    .success(function (u) { // This gets called
//	      if(u){
//	        throw new Error({error:[{message:'Username exists'}]});  // But this isn't triggering a validation error.
//	      }
//	    });
//	}
//  
//});

if (!global.hasOwnProperty('db')) {
	var Sequelize = require('sequelize')
		, sequelize = null;

	if (process.env.HEROKU_POSTGRESQL_BRONZE_URL) {
		// the application is executed on Heroku ... use the postgres database
		var match = process.env.HEROKU_POSTGRESQL_BRONZE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

		sequelize = new Sequelize(match[5], match[1], match[2], {
			dialect:  'postgres',
			protocol: 'postgres',
			port:     match[4],
			host:     match[3],
			logging:  true //false
		});
	} else {
		sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, { 
			dialect:  'postgres',
			protocol: 'postgres',
			host: config.development.host,
			logging:  true //false
		});
	}	
	
	global.db = {
	    Sequelize: 		Sequelize,
	    sequelize: 		sequelize,
	    Organization:	sequelize.import(__dirname + '/organization'),
	    User:      		sequelize.import(__dirname + '/user'),
	    Content:      		sequelize.import(__dirname + '/content'),
	    Role:      		sequelize.import(__dirname + '/role'),
	    Module:      		sequelize.import(__dirname + '/module'),
	    Skill:      		sequelize.import(__dirname + '/skill'),
	    RoleSkills:      		sequelize.import(__dirname + '/roleSkills'),
	    UserSkills:      		sequelize.import(__dirname + '/userSkills'),
	    SkillGroup:      		sequelize.import(__dirname + '/skillGroup'),
	    SkillGroupSkills:      		sequelize.import(__dirname + '/skillGroupSkills'),
	    Appointment:      		sequelize.import(__dirname + '/appointment'),
	    Tag:      		sequelize.import(__dirname + '/tag'),
	    ContentTags:      		sequelize.import(__dirname + '/contentTags'),
	    ModuleContentPlaylist:      		sequelize.import(__dirname + '/moduleContentPlaylist'),
	    SkillModulePlaylist:      		sequelize.import(__dirname + '/skillModulePlaylist'),
	    CoachRatingHistory:      		sequelize.import(__dirname + '/coachRatingHistory'),
	    CoachNotesHistory:      		sequelize.import(__dirname + '/coachNotesHistory'),
	    Event:      		sequelize.import(__dirname + '/event'),
	    EventUsers:      		sequelize.import(__dirname + '/eventUsers'),
	    Billing:      		sequelize.import(__dirname + '/billing'),
	    UserTags:      		sequelize.import(__dirname + '/userTags'),
	    Problem:      		sequelize.import(__dirname + '/problem'),
	    ProblemTags:      		sequelize.import(__dirname + '/problemTags'),
	    Answer:      		sequelize.import(__dirname + '/answer'),
	    Test:      		sequelize.import(__dirname + '/test'),
	    TestProblems:      		sequelize.import(__dirname + '/testProblems'),
	    ContentTest:      		sequelize.import(__dirname + '/contentTest'),
	    Report:      		sequelize.import(__dirname + '/report'),
	    ReportDetail:      		sequelize.import(__dirname + '/reportDetail'),
	    EventTest:      		sequelize.import(__dirname + '/eventTest'),
	    ModuleTest:      		sequelize.import(__dirname + '/moduleTest'),
	    SkillTest:      		sequelize.import(__dirname + '/skillTest'),
	    Job:      		sequelize.import(__dirname + '/job'),
	    EventJob:      		sequelize.import(__dirname + '/eventJob'),
	    Step:      		sequelize.import(__dirname + '/step'),
	    StepTest:      		sequelize.import(__dirname + '/stepTest'),
	    StepAppointment:      		sequelize.import(__dirname + '/stepAppointment'),
	    JobUser:      		sequelize.import(__dirname + '/jobUser'),
	    Login:      		sequelize.import(__dirname + '/login'),
	    Attendance:      		sequelize.import(__dirname + '/attendance'),
	    TrainerFeedback:      		sequelize.import(__dirname + '/trainerFeedback'),
	    UserDetails:      		sequelize.import(__dirname + '/userDetails'),
	    RoleTest:      		sequelize.import(__dirname + '/roleTest'),
	    Notification:      		sequelize.import(__dirname + '/notification'),
	    TrainerLocation:      		sequelize.import(__dirname + '/trainerLocation'),
	    ClassRatingDetails:      		sequelize.import(__dirname + '/classRatingDetails'),
	    EventLog:      		sequelize.import(__dirname + '/eventLog'),
	    EventSkill:      		sequelize.import(__dirname + '/eventSkill'),
	    Holiday:			sequelize.import(__dirname + '/holiday'),
	    Country:			sequelize.import(__dirname + '/country'),
	    State:			sequelize.import(__dirname + '/state'),
	    District:			sequelize.import(__dirname + '/district'),
	    TrainingCentreLocation:			sequelize.import(__dirname + '/trainingCentreLocation'),
	    TrainerMappingToTcl:			sequelize.import(__dirname + '/trainerMappingToTcl'),
	    Batch:			sequelize.import(__dirname + '/batch'),
	    BatchUser:			sequelize.import(__dirname + '/batchUser')
	 };
	 
	global.db.User.belongsTo(global.db.Organization);
	global.db.User.belongsTo(global.db.Role);
	global.db.User.hasOne(global.db.User, {as: 'Coach'});
	global.db.User.hasMany(global.db.Skill, {through: global.db.UserSkills});
	global.db.User.hasMany(global.db.Tag, {through: global.db.UserTags});
	
	global.db.Role.belongsTo(global.db.Organization);
	global.db.Role.hasMany(global.db.Module);
	global.db.Role.hasMany(global.db.Skill, {through: global.db.RoleSkills});
	
	global.db.Skill.hasMany(global.db.Role, {through: global.db.RoleSkills});
	global.db.Skill.hasMany(global.db.User, {through: global.db.UserSkills});
	global.db.Skill.hasMany(global.db.SkillGroup, {through: global.db.SkillGroupSkills});
	
	global.db.SkillGroup.hasMany(global.db.Skill, {through: global.db.SkillGroupSkills});
	
	global.db.Event.belongsTo(global.db.Organization);
	
	global.db.State.belongsTo(global.db.Country);
	global.db.District.belongsTo(global.db.State);
	global.db.TrainingCentreLocation.belongsTo(global.db.District);
	
	global.db.Batch.belongsTo(global.db.Organization);
	global.db.Batch.belongsTo(global.db.TrainingCentreLocation);
	global.db.Batch.belongsTo(global.db.Role);
	
	global.db.Module.belongsTo(global.db.Organization);
	global.db.Module.hasMany(global.db.Role);
	global.db.Module.hasOne(global.db.Module, {as: 'PrevModule'});
	
	global.db.Content.hasOne(global.db.Content, {as: 'PrevContent'});
	global.db.Content.hasMany(global.db.Tag, {through: global.db.ContentTags});
	
	global.db.Tag.hasMany(global.db.Content, {through: global.db.ContentTags});
	global.db.Tag.hasMany(global.db.User, {through: global.db.UserTags});
	global.db.Tag.hasMany(global.db.Problem, {through: global.db.ProblemTags});
	
	global.db.Problem.hasMany(global.db.Tag, {through: global.db.ProblemTags});
	
	//global.db.Event.hasMany(global.db.User, {through: global.db.EventUsers});
	
	global.db.Appointment.hasOne(global.db.User, {as: 'User'});
	global.db.Appointment.hasOne(global.db.User, {as: 'Coach'});
}

module.exports = global.db;
