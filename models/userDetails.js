module.exports = function(sequelize, DataTypes) {
	var UserDetails = sequelize.define('UserDetails', {
		year: {
			type: DataTypes.STRING
		},
		section: {
			type: DataTypes.STRING
		},
		address: {
			type: DataTypes.TEXT
		},
		gender: {
			type: DataTypes.STRING
		},
		caste: {
			type: DataTypes.STRING
		},
		religion: {
			type: DataTypes.STRING
		},
		dob: {
			type: DataTypes.STRING
		},
		father_name: {
			type: DataTypes.STRING
		},
		husband_name: {
			type: DataTypes.STRING
		},
		father_occupation: {
			type: DataTypes.STRING
		},
		husband_occupation: {
			type: DataTypes.STRING
		},
		mother_name: {
			type: DataTypes.STRING
		},
		mother_occupation: {
			type: DataTypes.STRING
		},
		monthly_family_income: {
			type: DataTypes.STRING
		},
		aadhar_number: {
			type: DataTypes.STRING
		},
		last_exam_passed: {
			type: DataTypes.STRING
		},
		percentage: {
			type: DataTypes.STRING
		},
		isJobAfterGraduation: {
			type: DataTypes.BOOLEAN
		},
		isStudyAfterGraduation: {
			type: DataTypes.BOOLEAN
		},
		job_sector: {
			type: DataTypes.STRING
		},
		expected_salary: {
			type: DataTypes.STRING
		},
		course: {
			type: DataTypes.STRING
		},
		isLearntMsOffice: {
			type: DataTypes.BOOLEAN
		},
		isLearntTally: {
			type: DataTypes.BOOLEAN
		},
		goal: {
			type: DataTypes.STRING
		},
		UserId: {
	        type: DataTypes.INTEGER,
	        references: "Users",
	        referencesKey: 'id'
	    },
	});
	
	return UserDetails;
};

