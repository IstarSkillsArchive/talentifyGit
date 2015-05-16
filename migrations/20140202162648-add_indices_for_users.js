module.exports = {
  up: function(migration, DataTypes, done) {
		migration.addIndex('Users', ['email'], { indicesType: 'UNIQUE' });
		migration.addIndex('Users', ['username'], { indicesType: 'UNIQUE' });
    done();
  },
  down: function(migration, DataTypes, done) {
		migration.removeIndex('Users', ['email']);
		migration.removeIndex('Users', ['username']);
    done();
  }
}
