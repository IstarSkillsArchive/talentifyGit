module.exports = function(sequelize, DataTypes) {
	var Content = sequelize.define('Content', {
		name: {
			type: DataTypes.STRING,
		},
		description: {
		 	type: DataTypes.STRING
		},
		type: {
			type: DataTypes.STRING
		},
		path: {
			type: DataTypes.STRING
		},
		hours: {
			type: DataTypes.INTEGER
		}
//		,
//		content: {
//			type: DataTypes.BLOB,
//			validate: {
//				notEmpty: {
//					msg: "Please upload a file"
//				}
//			}
//		}
	});
	
	return Content;
};

