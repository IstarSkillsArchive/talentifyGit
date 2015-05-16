module.exports = {
  up: function(migration, DataTypes, done) {
		migration.createTable('Users',
				{
					id: {
						type: DataTypes.INTEGER,
						primaryKey: true,
						autoIncrement: true
					},
					createdAt: {
						type: DataTypes.DATE
					},
					updatedAt: {
						type: DataTypes.DATE
					},
					username: {
						type: DataTypes.STRING,
						allowNull: false
					},
					name: {
						type: DataTypes.STRING,
						allowNull: true
					},
					password: {
						type: DataTypes.STRING,
						allowNull: false,
						defaultValue: "123456"
					},
					email: {
						type: DataTypes.STRING,
						allowNull: false
					}
				}
			);
    done();
  },
  down: function(migration, DataTypes, done) {
		migration.dropTable('Users');
    done();
  }
}
