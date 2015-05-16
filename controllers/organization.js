var db = require('../models');

module.exports = {
	
	new_organization: function(req, res) {
		var successFlash = req.flash('info')[0];
		console.log(successFlash);
		res.render('organization/new', {successFlash: successFlash});
	},
	
	list: function(req, res) {
		db.Organization.findAll().success(function(organizations) {
			res.render('organization/list', {organizations: organizations, successFlash: req.flash('info')[0]});
		}).error(function(error) {
			console.log('Error', error);
			res.redirect('/dashboard');
		});
	},
	
	create: function(req, res) {
		db.Organization.create(req.body).success(function(organization) {
			req.flash('info', "Organization '" + organization.name + "' created");
			res.redirect('organization/new');
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('organization/new', {errors: errors});
		});
	},
	
	destroy: function(req, res) {
		db.Organization.find({ where: { id: req.param('organization_id') } }).success(function(organization) {
			organization.destroy().success(function() {
				req.flash('info', "Organization deleted");
				res.redirect('organization/list');
			});
		}).error(function(errors) {
			console.log("Error", errors);
			res.render('organization/new', {errors: errors});
		});
	}
	
};