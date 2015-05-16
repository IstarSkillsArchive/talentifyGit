module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define('User', {
		username: {
			type: DataTypes.STRING,
			unique: true,
			validate: {
				notEmpty: {
					msg: "Please enter a username"
				}
			}
		},
		password: {
			type: DataTypes.STRING
		},
		user_id: {
			type: DataTypes.STRING
		},
		first_name: {
		 	type: DataTypes.STRING
		},
		last_name: {
		 	type: DataTypes.STRING
		},
		phone: {
		 	type: DataTypes.STRING
		},
		age: {
		 	type: DataTypes.INTEGER
		},
		location: {
		 	type: DataTypes.STRING
		},
		department: {
		 	type: DataTypes.STRING
		},
		imgPath: {
		 	type: DataTypes.STRING
		},
		email: {
			type: DataTypes.STRING,
			validate: {
				isEmail: true
				/*notEmpty: {
					msg: "Please enter a valid email addresss"
				}*/
			}
		},
		permission: {
		 	type: DataTypes.STRING
		},
		isProfileCompleted: {
		 	type: DataTypes.BOOLEAN
		},
		isTestTaken: {
		 	type: DataTypes.BOOLEAN
		},
		isMetCoach: {
		 	type: DataTypes.BOOLEAN
		},
		isAgreedToTerms: {
			type: DataTypes.BOOLEAN
		}
	},
	{
		instanceMethods: {
			isAdmin: function() {
				return this.permission === "admin";
			},
			isManager: function() {
				return this.permission === "manager";
			},
			isCoach: function() {
				return this.permission === "coach";
			},
			isContentAdmin: function() {
				return this.permission === "contentAdmin";
			},
			isTrainer: function() {
				return this.permission === "trainer";
			},
			isRecruiter: function() {
				return this.permission === "recruiter";
			},
			isUser: function() {
				return this.permission === "user";
			},
			isIstarCoordinator: function() {
				return this.permission === "istarCoordinator";
			},
			isCollegeCoordinator: function() {
				return this.permission === "collegeCoordinator";
			},
			getRole: function() {
				return this.permission;
			}
		}
	});
	
	return User;
};

