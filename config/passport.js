var passwordHash = require('password-hash');

module.exports = function(passport, Strategy, User) {
	passport.use(new Strategy(
				function(username, password, done) {
					User.find({ where: {username: username} }).success(function(user) {
						if(user) {
							if(passwordHash.isHashed(user.password)) {
								if(passwordHash.verify(password, user.password)) {
									return done(null, user);
								} else {
									return done(null, false, { message: 'Login Failure! Wrong password' });
								}
							} else {
								if(user.password === password) {
									return done(null, user);
								} else
									return done(null, false, { message: 'Login Failure! Wrong password' });
							}
						} else
							return done(null, false, { message: 'Login Failure! Username doesn\'t exist' });
					}).error(function(err) {
						console.log("Error", err);
						return done(null, false, { message: 'Login Failure!' });
					});
				}
				));
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.find(id).success(function(user) {
			done(null, user);
		});
	});
};
