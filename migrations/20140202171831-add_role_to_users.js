module.exports = {
  up: function(migration, DataTypes, done) {
		migration.addColumn('Users', 'role', DataTypes.STRING);
    done();
  },
  down: function(migration, DataTypes, done) {
		migration.removeColume('Users', 'role');
    done();
  }
}
