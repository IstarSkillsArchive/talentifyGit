var db = require('../models');

module.exports = function(sequelize, DataTypes) {
	var StepAppointment = sequelize.define('StepAppointment', {
		
		StepId: {
	        type: DataTypes.INTEGER,
	        references: "Steps",
	        referencesKey: 'id'
	    },
	    AppointmentId: {
	        type: DataTypes.INTEGER,
	        references: "Appointments",
	        referencesKey: 'id'
	    }	
	});
	
	return StepAppointment;
}
		