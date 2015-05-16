
/**
 * Module dependencies.
 */

var express = require('express'),
 http = require('http'),
 https = require('https'),
 fs = require('fs'),
 path = require('path'),
 engine = require('ejs-locals'),
 passport = require('passport'),
 LocalStrategy = require('passport-local').Strategy,
 flash = require('connect-flash'),
 db = require('./models'),
 user = require('./controllers/user'),
 organization = require('./controllers/organization'),
 hr_admin = require('./controllers/hr_admin'),
 trainer = require('./controllers/trainer'),
 coach = require('./controllers/coach'),
 content = require('./controllers/content'),
 //ot = require('./controllers/opentok'),
 //bbb = require('./controllers/bbb'),
 skill = require('./controllers/skill'),
 recruiter = require('./controllers/recruiter'),
 zoom = require('./controllers/zoom'),
 misc = require('./controllers/misc'),
 twilio = require('./controllers/twilio'),
 coordinator = require('./controllers/coordinator'),
 app = express();

var req = http.IncomingMessage.prototype;

require('./config/passport')(passport, LocalStrategy, db.User);

app.engine('ejs', engine);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(function(req, res, next){
	if (!req.secure) {
		var url = req.headers.host;
		var index = url.indexOf(':');
		url = url.substring(0, index);
		res.redirect('https://'+url+':4000'+req.url);
    } else
    	next();
});

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'uploads')));

app.locals.currentUser = null;
app.locals.currentFlag = null;

/*db.Organization.findOrCreate({name: "iStar"}, {description: "Learning Portal", country: "India", state: "Karnataka", city: "Bangalore"}).success(function(organization, created) { 
	
	//console.log("Organization", organization.values); 
	console.log("Created Organization", created); 
	
	db.User.findOrCreate({username: "admin"}, {first_name: "Administrator", password: "admin", email: "admin@admin.com", permission: "admin", OrganizationId: organization.id}).success(function(user, created) { 
		
		//console.log("User", user.values); 
		console.log("Created Admin", created); 
		
		db.User.findOrCreate({username: "contentadmin"}, {first_name: "Content Admin", password: "contentadmin", email: "contentadmin@istar.com", permission: "contentAdmin", OrganizationId: organization.id}).success(function(user, created) { 
			//console.log("User", user.values); 
			console.log("Created Content Admin", created); 
		});
	});
});*/

function setFlag(req, res, next) {
	if(req.isAuthenticated() && req.user.isManager()) {
		res.locals.currentFlag = 'create';
		next();
	} else if(req.isAuthenticated() && req.user.isAdmin()) {
		//res.locals.currentFlag = 'create';
		next();
	} else {
		res.redirect("/dashboard");
	}
}

function auth(req, res, next){
	if(req.isAuthenticated()){
		res.locals.currentUser = req.user;
		//res.locals.currentRole = req.user.getRole();
		next();
	}else{
		res.locals.currentUser = null;
		res.redirect("/");
	}
}

function superAuth(req, res, next) {
	if(req.isAuthenticated() && req.user.isAdmin()) {
		next();
	} else {
		res.redirect("/dashboard");
	}
}

function superAuthOrManager(req, res, next) {
	if(req.isAuthenticated() && (req.user.isAdmin() || req.user.isManager() || req.user.isContentAdmin())) {
		next();
	} else {
		res.redirect("/dashboard");
	}
}

function pagination(req, res, next) {
	res.locals.limit = 10;
	var limit = res.locals.limit;
	var page = req.param('page') != null ? parseInt(req.param('page')) : 1;
	res.locals.offset = (page - 1) * limit;
	
	var url = req.originalUrl.split('/'); 
	
	var deebee = null;
	
	switch(url[1]) {
		case 'content' 		:	deebee = db.Content; 	break;
		case 'skill' 		:	deebee = db.Skill; 		break;
		case 'module'		: 	deebee = db.Module; 	break;
		case 'users'		: 	deebee = db.User;		break;
		case 'skillgroup'	:	deebee = db.SkillGroup;	break;
		case 'problem'		:	deebee = db.Problem; 	break;	
		case 'test'			:	deebee = db.Test;		break;
		case 'job'			:	deebee = db.Job;		break;
	}
	
	deebee.count().success(function(total) {
        res.locals.total = total;
        res.locals.pages =  Math.ceil(total / limit);
        res.locals.page = page;
        
        res.locals.prev = page == 1 ? false : true;
        res.locals.next = page == parseInt(res.locals.pages) ? false : true;
        
        next();
    });
	
}

// development only
/*if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}*/

app.use(function(req, res) {
    res.redirect('/');
 });

app.use(function(err, req, res, next){
  console.log(">> ERROR from express js error handler >>",err.stack);
  res.status(500).send(err);
  res.redirect('/');
});

app.get('/', function(req, res) {
	//console.log("COOKIES "+req.cookies.user_id+" typeof "+typeof req.cookies.user_id+" REQ USER "+req.user);
	if(req.user)
		res.redirect('/dashboard');
	else if(req.cookies.user_id != undefined) {
		db.User.find({ where: {id: parseInt(req.cookies.user_id)} }).success(function(user) {
			if(user) {
				req = http.IncomingMessage.prototype;
				req.user = user;
				req.isAuthenticated = function() {
					return true;
				};
				
				res.redirect('/dashboard');
				
			} else
				res.render('home');
		}).error(function(err) {
			console.log(">> Error from Login:", err);
			res.render('home');
		});
	}
	else {
		var failure = req.flash('error')[0];
		res.render('home', {failure: failure});
	} 
});

app.get('/dashboard', auth, function(req, res) {
	if(!req.cookies.user_id) {
		res.cookie('user_id', req.user.id, {maxAge: 2628000000});
	} 
	var successFlash = req.flash('info')[0];
	
	var date = new Date();
	var days = 0;
	date.setDate(date.getDate() + days);
	
	var year = date.getFullYear();
	var month = date.getMonth();
	month = month < 9 ? '0'+(month+1) : month+1;
	var day = date.getDate();
	var generatedDate = year+"-"+month+"-"+day;
	
	db.Login.create({date: generatedDate, UserId: parseInt(req.user.id)}).success(function(){
		if(req.user.isAdmin())
			res.redirect('/users/list');
		else if(req.user.isManager())
			res.redirect('/hr_admin/dashboard');
		else if(req.user.isCoach())
			res.redirect('/coach/dashboard/'+req.user.id);
		else if(req.user.isTrainer())
			res.redirect('/trainer/dashboard/'+req.user.id);
		else if(req.user.isContentAdmin())
			res.render('content/dashboard', {successFlash: successFlash});
		else if(req.user.isRecruiter())
			res.redirect('/recruiter/dashboard/'+req.user.id);
		else if(req.user.isIstarCoordinator())
			res.redirect('/coordinator/dashboard/'+req.user.id);
		else
			res.redirect('/users/dashboard/'+req.user.id);
	});
});

app.post('/login',
		passport.authenticate('local', { successRedirect: '/dashboard',
			failureRedirect: '/',
		failureFlash: true })
);

app.get('/logout', function(req, res){
	res.clearCookie('user_id', { path: '/' });
	req.logout();
	//console.log("******************************** REQ USER AFTER LOGOUT "+req.user);
	req = http.IncomingMessage.prototype;
	req.user = null;
	//res.render('home');
	res.redirect('/');
});

app.get('/modules/:skill/:num', auth, function(req, res) {
	res.render('module', {skill: req.params.skill, num: req.params.num});
});

process.on('uncaughtException', function (err) {
	 console.log("Uncaught exception "+err);
});

app.get('/users/dashboard/:user_id', auth, user.dashboard);
app.get('/users/gym-mobile', auth, user.gym_mobile);
app.get('/users/updateIsTestTaken/:user_id', auth, user.updateIsTestTaken);
app.post('/users/scheduleMeetingWithCoach', auth, user.scheduleMeetingWithCoach);
app.get('/users/set_appointment/:user_id', auth, user.set_appointment);
app.get('/users/next_module/:user_id/:skill_id/:message', auth, user.next_module);
app.get('/users/next_module/:user_id/:skill_id', auth, user.next_module_no_message);
app.get('/users/new/:user_id', auth, superAuthOrManager, setFlag, user.new_user);
app.get('/users/gym/:user_id', auth, user.gym);
app.get('/users/report_card/:user_id', auth, user.report_card);
app.get('/users/report_card_ajax/:user_id/:skill_id', auth, user.report_card_ajax);
app.get('/users/report_card_ajax/:user_id/:skill_id/:hide', auth, user.report_card_ajax);
app.get('/users/ratings/:user_id', auth, user.ratings);
app.get('/users/skill_map/:user_id', auth, user.skill_map);
app.get('/users/profile/:user_id/:is_first_time', auth, user.profile);
app.get('/users/profile/:user_id', auth, user.profile_firstTime_false);
app.get('/users/enrollment_form/:user_id/:is_first_time', auth, user.enrollment_form);
app.post('/users/create_user_details', auth, user.create_user_details);
app.get('/users/edit_enrollment_form/:user_id', auth, user.edit_enrollment_form);
app.post('/users/update_user_details', auth, user.update_user_details);
app.get('/users/edit_profile/:user_id/:is_first_time', auth, user.edit_profile);
app.post('/users/update', auth, user.update);
app.get('/users/list', auth, superAuthOrManager, pagination, setFlag, user.list);
app.get('/users/listByOrganization/:org_id', auth, superAuthOrManager, setFlag, user.listByOrganization);
app.get('/users/list/:page', auth, superAuthOrManager, pagination, setFlag, user.list);
app.get('/users/listByOrganization/:org_id/:page', auth, superAuthOrManager, setFlag, user.listByOrganization);
app.post('/users/create', auth, superAuthOrManager, setFlag, user.create);
app.get('/users/:user_id/delete', auth, superAuthOrManager, setFlag, user.destroy);
app.get('/users/change_password/:user_id', auth, user.change_password);
app.get('/users/change_password_ajax/:user_id', auth, user.change_password_ajax);
app.post('/users/do_change_password', auth, user.do_change_password);
app.post('/users/do_change_password_ajax', auth, user.do_change_password_ajax);
app.get('/users/search/:username', auth, user.search);
app.get('/users/detail/:user_id?:keyword', auth, user.detail);
app.get('/users/calendar', auth, user.calendar);
app.get('/users/careers/:user_id', auth, user.careers);
app.get('/users/question_details/:id', auth, user.question_details);
app.get('/users/view_test_details/:skill_id', auth, user.view_user_test_details);
app.get('/users/view_test_details/:user_id/:skill_id', auth, user.view_test_details);
app.get('/users/view_report_details/:id', auth, user.view_user_report_details);
app.get('/users/view_report_details/:id/:user_id', auth, user.view_report_details);
app.get('/users/review_module/:skill_id', auth, user.review_module);
app.get('/users/review_content/:skill_id/:module_id', auth, user.review_content);
app.get('/users/review_old_content/:skill_id/:module_id', auth, user.review_old_content);
app.get('/users/review_new_content/:skill_id/:module_id', auth, user.review_new_content);
app.get('/users/view_content/:id', auth, user.view_content_no_skill);
app.get('/users/view_content/:id/:skill_id', auth, user.view_content);
app.get('/users/notes/:user_id/:skill_id/:total_length/:curr', auth, user.notes);
app.get('/users/notes_prev/:coach_id/:user_id/:skill_id/:cnh_id/:len/:curr', auth, user.notes_prev);
app.get('/users/notes_next/:coach_id/:user_id/:skill_id/:cnh_id/:len/:curr', auth, user.notes_next);
app.get('/users/coach_rating_history/:user_id/:skill_id', auth, user.coach_rating_history);
app.get('/users/start_pre_test', auth, user.start_pre_test);
app.get('/users/modules_completed/:skill_id', auth, user.modules_completed);
app.get('/users/view_other_test_details/:test_id', auth, user.view_other_test_details);
app.get('/users/skill_overview/:user_id/:skill_id', auth, user.skill_overview);
app.get('/users/get_users_test_events/:user_id', auth, user.get_users_test_events);
app.get('/users/get_users_live_events/:user_id', auth, user.get_users_live_events);
app.get('/users/certificates/:user_id', auth, user.certificates);
app.get('/users/get_users_coach_appointments/:user_id', auth, user.get_users_coach_appointments);
app.get('/users/calendar/:user_id', auth, user.calendar);
app.get('/users/terms/:user_id', auth, user.terms);
app.get('/users/do_agree_to_terms/:user_id', auth, user.do_agree_to_terms);
//app.get('/opentok/show', auth, ot.show);

app.get('/users/profile_user_orientation', auth, user.profile_user_orientation);
app.post('/users/do_create_user_profile', auth, user.do_create_user_profile);

app.get('/hr_admin/view_user_test_details/:skill_id/:user_id', auth, superAuthOrManager, hr_admin.view_user_test_details);
app.get('/hr_admin/dashboard', auth, superAuthOrManager, hr_admin.dashboard);
app.get('/hr_admin/new_role/:user_id', auth, superAuthOrManager, hr_admin.new_role);
app.get('/hr_admin/list_roles/:user_id', auth, superAuthOrManager, hr_admin.list_roles);
//app.get('/hr_admin/edit_role/:module_id', auth, superAuthOrManager, hr_admin.edit_role);
app.get('/hr_admin/delete_role/:user_id/:role_id', auth, superAuthOrManager, hr_admin.delete_role);
app.get('/hr_admin/stats/:user_id', auth, superAuthOrManager, hr_admin.stats);
app.get('/hr_admin/track', auth, superAuthOrManager, hr_admin.track);
app.get('/hr_admin/placement', auth, superAuthOrManager, hr_admin.placement);
app.get('/hr_admin/get_placement_user_data/:job_id', auth, superAuthOrManager, hr_admin.get_placement_user_data);
app.get('/hr_admin/view_role_test_results', auth, superAuthOrManager, hr_admin.view_role_test_results);
app.get('/hr_admin/view_role_test_results/:role_id', auth, superAuthOrManager, hr_admin.view_role_test_results);
app.get('/hr_admin/view_role_test_result_details/:role_id', auth, superAuthOrManager, hr_admin.view_role_test_result_details);
app.get('/hr_admin/view_role_test_result_details_score/:role_id', auth, superAuthOrManager, hr_admin.view_role_test_result_details_score);

app.get('/hr_admin/list_events', auth, superAuthOrManager, hr_admin.list_events);
app.get('/hr_admin/list_events_calendar', auth, hr_admin.list_events_calendar);
app.get('/hr_admin/new_event', auth, superAuthOrManager, hr_admin.new_event);
app.post('/hr_admin/do_create_event', auth, superAuthOrManager, hr_admin.do_create_event);
app.post('/hr_admin/do_edit_event', auth, superAuthOrManager, hr_admin.do_edit_event);
app.post('/hr_admin/do_create_event_ajax', auth, superAuthOrManager, hr_admin.do_create_event_ajax);
app.get('/hr_admin/add_user_to_event/:event_id/:user_id', auth, superAuthOrManager, hr_admin.add_user_to_event);
app.get('/hr_admin/invite_trainer_to_event/:event_id/:trainer_id', auth, superAuthOrManager, hr_admin.invite_trainer_to_event);
app.get('/hr_admin/event_user_list/:event_id', auth, superAuthOrManager, hr_admin.event_user_list);
app.get('/hr_admin/notify_event_users/:event_id', auth, superAuthOrManager, hr_admin.notify_event_users);
app.get('/hr_admin/delete_user_from_event/:event_id/:user_id', auth, superAuthOrManager, hr_admin.delete_user_from_event);
app.get('/hr_admin/event_confirm/:event_id', auth, superAuthOrManager, hr_admin.event_confirm);
app.get('/hr_admin/delete_event/:event_id', auth, superAuthOrManager, hr_admin.delete_event);

app.get('/rsvp/:user_id/:event_id', hr_admin.rsvp);
app.get('/rsvp_job/:user_id/:job_id', recruiter.rsvp_job);

app.get('/hr_admin/map_skills/:user_id/:role_id', auth, superAuthOrManager, skill.map_skills);
app.get('/hr_admin/get_skills/:q', auth, skill.get_skills);
app.get('/hr_admin/ajax_filter_users_skills/:skill_id/:val', auth, hr_admin.ajax_filter_users_skills);
app.get('/hr_admin/ajax_filter_users_roles/:role_id/:val', auth, hr_admin.ajax_filter_users_roles);
app.get('/hr_admin/show_monthly_login_graph/:month', auth, hr_admin.show_monthly_login_graph);
app.get('/hr_admin/show_role_skill_report/:role_name/:organization_id', auth, hr_admin.show_role_skill_report);
app.get('/hr_admin/show_quarterly_login_graph/:quarter', auth, hr_admin.show_quarterly_login_graph);
app.get('/hr_admin/test_analytics/:val/:test_id', auth, hr_admin.test_analytics);
app.get('/hr_admin/test_report/:test_id/:event_id', auth, hr_admin.test_report);
//app.get('/hr_admin/role_test_report/');
app.get('/hr_admin/test_analytics_report/:test_id/:event_id', auth, hr_admin.test_analytics_report);
app.get('/hr_admin/test_analytics_report/:role_id', auth, hr_admin.test_analytics_report);
app.get('/hr_admin/test_report_card/:test_id/:event_id', auth, hr_admin.test_report_card);
app.get('/hr_admin/question_analytics_report/:event_id/:test_id/:problem_id', auth, hr_admin.question_analytics_report);
app.get('/hr_admin/question_analytics_report/:role_id/:problem_id', auth, hr_admin.question_analytics_report);
app.get('/hr_admin/question_right_stats/:test_id/:event_id', auth, hr_admin.question_right_stats);
app.get('/hr_admin/question_right_stats/:role_id', auth, hr_admin.question_right_stats);
app.get('/hr_admin/question_wrong_stats/:test_id/:event_id', auth, hr_admin.question_wrong_stats);
app.get('/hr_admin/question_wrong_stats/:role_id', auth, hr_admin.question_wrong_stats);
app.get('/hr_admin/answer_analytics_report/:event_id/:test_id/:problem_id/:answer_id', auth, hr_admin.answer_analytics_report);
app.get('/hr_admin/answer_analytics_report/:role_id/:problem_id/:answer_id', auth, hr_admin.answer_analytics_report);
app.get('/hr_admin/add_pre_test_to_role/:role_id', auth, hr_admin.add_pre_test_to_role);
app.get('/hr_admin/add_pre_test/:role_id', auth, hr_admin.add_pre_test);
app.get('/hr_admin/calendar', auth, hr_admin.calendar);
app.get('/hr_admin/view_detailed_report_card/:user_id/:test_id/:role_id', auth, hr_admin.view_detailed_report_card);
app.get('/hr_admin/view_detailed_event_report_card/:username/:test_id/:event_id', auth, hr_admin.view_detailed_event_report_card);

app.get('/hr_admin/create_new_notification/:user_id', auth, superAuthOrManager, hr_admin.create_new_notification);
app.post('/hr_admin/do_create_notification', auth, superAuthOrManager, hr_admin.do_create_notification);
app.get('/hr_admin/list_notifications/:user_id', auth, superAuthOrManager, hr_admin.list_notifications);
app.get('/hr_admin/list_notifications_redirector/:user_id', auth, superAuthOrManager, hr_admin.list_notifications_redirector);
app.get('/hr_admin/delete_notification/:notification_id', auth, superAuthOrManager, hr_admin.delete_notification);
app.get('/hr_admin/edit_notification/:notification_id', auth, superAuthOrManager, hr_admin.edit_notification);
app.post('/hr_admin/do_edit_notification', auth, superAuthOrManager, hr_admin.do_edit_notification);

app.get('/hr_admin/manage_users', auth, superAuthOrManager, hr_admin.manage_users);
app.get('/hr_admin/view_users', auth, superAuthOrManager, hr_admin.view_users);
app.get('/hr_admin/role_filter_users/:role', auth, superAuthOrManager, hr_admin.role_filter_users);
app.get('/hr_admin/view_user_profile/:user_id', auth, superAuthOrManager, hr_admin.view_user_profile);
app.get('/hr_admin/replace_coach/:user_id', auth, superAuthOrManager, hr_admin.replace_coach);
app.get('/hr_admin/do_replace_coach/:user_id/:coach_id', auth, superAuthOrManager, hr_admin.do_replace_coach);
app.get('/hr_admin/show_coach/:user_id', auth, superAuthOrManager, hr_admin.show_coach);
app.get('/hr_admin/replace_role/:user_id', auth, superAuthOrManager, hr_admin.replace_role);
app.get('/hr_admin/do_replace_role/:user_id/:role_id', auth, superAuthOrManager, hr_admin.do_replace_role);
app.get('/hr_admin/show_role/:user_id', auth, superAuthOrManager, hr_admin.show_role);

app.get('/hr_admin/add_users', auth, superAuthOrManager, hr_admin.add_users);
app.get('/hr_admin/check_username/:username', superAuthOrManager, auth, hr_admin.check_username);
app.post('/hr_admin/create_user', auth, superAuthOrManager, hr_admin.create_user);

app.get('/hr_admin/manage_roles', auth, superAuthOrManager, hr_admin.manage_roles);
app.get('/hr_admin/get_skills_for_role/:role_id', auth, superAuthOrManager, hr_admin.get_skills_for_role);
app.get('/hr_admin/add_skills_to_role/:role_id', auth, superAuthOrManager, hr_admin.add_skills_to_role);
app.get('/hr_admin/get_skills_from_skill_group/:skill_group_id/:role_id', auth, superAuthOrManager, hr_admin.get_skills_from_skill_group);
app.get('/hr_admin/do_map_skill_to_role/:skill_id/:role_id', auth, superAuthOrManager, skill.do_map_skill_to_role);
app.get('/hr_admin/do_create_role/:role_name/:oid', auth, superAuthOrManager, hr_admin.do_create_role);
app.get('/hr_admin/delete_pre_test/:role_id/:test_id', auth, superAuthOrManager, hr_admin.delete_pre_test);
app.get('/hr_admin/do_add_pre_test/:test_name/:role_id', auth, hr_admin.do_add_pre_test);

app.get('/hr_admin/create_test_event', auth, superAuthOrManager, hr_admin.create_test_event);
app.get('/hr_admin/assign_users_to_event/:event_id/:val', auth, superAuthOrManager, hr_admin.assign_users_to_event);
app.get('/hr_admin/filter_users_for_event_on_role/:str/:event_id/:val', auth, superAuthOrManager, hr_admin.filter_users_for_event_on_role);
app.get('/hr_admin/filter_users_for_event_on_skill/:str1/:str2/:event_id/:val', auth, superAuthOrManager, hr_admin.filter_users_for_event_on_skill);
app.get('/hr_admin/filter_users_for_event_on_batch/:str1/:str2/:event_id/:val', auth, superAuthOrManager, hr_admin.filter_users_for_event_on_batch);
app.get('/hr_admin/get_skills_based_on_role_filter/:str/:val', auth, superAuthOrManager, hr_admin.get_skills_based_on_role_filter);
app.get('/hr_admin/get_batches_based_on_role_filter/:str/:val', auth, superAuthOrManager, hr_admin.get_batches_based_on_role_filter);
app.get('/hr_admin/add_users_to_event/:str/:event_id', auth, superAuthOrManager, hr_admin.add_users_to_event);
app.get('/hr_admin/show_test_event_name_desc/:event_id', auth, superAuthOrManager, hr_admin.show_test_event_name_desc);
app.get('/hr_admin/edit_event_field/:val/:event_id', auth, superAuthOrManager, hr_admin.edit_event_field);
app.get('/hr_admin/do_edit_event_field/:field/:val/:event_id', auth, superAuthOrManager, hr_admin.do_edit_event_field);
app.get('/hr_admin/show_event_field/:val/:event_id', auth, superAuthOrManager, hr_admin.show_event_field);
app.get('/hr_admin/delete_new_event/:event_id', auth, superAuthOrManager, hr_admin.delete_new_event);
app.get('/hr_admin/edit_test_event/:event_id/:test_name', auth, superAuthOrManager, hr_admin.edit_test_event);

app.get('/hr_admin/create_event', auth, superAuthOrManager, hr_admin.create_event);
app.get('/hr_admin/assign_trainer_to_event', auth, superAuthOrManager, hr_admin.assign_trainer_to_event);
app.get('/hr_admin/show_event_details/:event_id', auth, superAuthOrManager, hr_admin.show_event_details);
app.get('/hr_admin/do_assign_trainer_to_event/:moderator_id/:event_id', auth, superAuthOrManager, hr_admin.do_assign_trainer_to_event);

app.get('/hr_admin/send_sms', auth, twilio.send_sms);
app.post('/hr_admin/do_send_sms', auth, twilio.do_send_sms);
app.get('/twilio/get_messages', auth, twilio.get_messages);

app.get('/coordinator/dashboard/:user_id', auth, coordinator.dashboard);
app.get('/coordinator/schedule/:user_id', auth, coordinator.schedule);
app.get('/coordinator/schedule/:user_id/:year/:month/:day', auth, coordinator.schedule);
app.get('/coordinator/create_new_schedule/:user_id', auth, coordinator.create_new_schedule);
app.get('/coordinator/get_batches_for_organization/:oid', auth, coordinator.get_batches_for_organization);
app.get('/coordinator/get_learning_groups_for_organization/:rid', auth, coordinator.get_learning_groups_for_organization);
app.post('/coordinator/do_create_new_schedule', auth, coordinator.do_create_new_schedule);
app.get('/coordinator/assign_skill_trainer_to_event/:event_id',auth, coordinator.assign_skill_trainer_to_event);
app.post('/coordinator/do_assign_skill_trainer_to_event', auth, coordinator.do_assign_skill_trainer_to_event);
app.get('/coordinator/get_modules_for_skill/:skill_id', auth, coordinator.get_modules_for_skill);
app.get('/coordinator/confirm_schedule/:date1/:date2', auth, coordinator.confirm_schedule);
app.get('/coordinator/get_event_details/:event_id', auth, coordinator.get_event_details);
app.get('/coordinator/delete_event/:event_id', auth, coordinator.delete_event);
app.get('/coordinator/view_attendance/:event_id', auth, coordinator.view_attendance);
app.get('/coordinator/view_trainer_feedback/:event_id', auth, coordinator.view_trainer_feedback);
app.get('/coordinator/refresh_today_events', auth, coordinator.refresh_today_events);
app.get('/coordinator/get_conflict_events/:date1/:date2', auth, coordinator.get_conflict_events);
app.get('/coordinator/get_trainer_location/:event_id', auth, coordinator.get_trainer_location);
app.get('/coordinator/create_new_schedule_bulk/:user_id', auth, coordinator.create_new_schedule_bulk);
app.post('/coordinator/do_create_new_schedule_bulk', auth, coordinator.do_create_new_schedule_bulk);
app.get('/coordinator/get_no_of_modules_for_skill/:skill_id', auth, coordinator.get_no_of_modules_for_skill);

app.get('/recruiter/dashboard/:user_id', auth, recruiter.dashboard);
app.get('/job/list_jobs/:user_id', auth, pagination, recruiter.list_jobs);
app.get('/job/list_jobs/:user_id/:page', auth, pagination, recruiter.list_jobs);
app.get('/recruiter/create_job', auth, recruiter.create_job);
app.post('/recruiter/do_create_job', auth, recruiter.do_create_job);
app.get('/recruiter/edit_job/:id', auth, recruiter.edit_job);
app.post('/recruiter/do_edit_job', auth, recruiter.do_edit_job);
app.get('/recruiter/add_step_to_job/:job_id', auth, recruiter.add_step_to_job);
app.post('/recruiter/do_add_step_to_job', auth, recruiter.do_add_step_to_job);
app.get('/recruiter/edit_step/:id', auth, recruiter.edit_step);
app.get('/recruiter/delete_step_test/:step_id/:test_id', auth, recruiter.delete_step_test);
app.get('/recruiter/ajax_filter_job_users_skills/:skill_id/:val/:job_id', auth, recruiter.ajax_filter_job_users_skills);
app.get('/recruiter/ajax_filter_job_users_roles/:role_id/:val/:job_id', auth, recruiter.ajax_filter_job_users_roles);
app.get('/recruiter/add_user_to_job/:user_id/:job_id', auth, recruiter.add_user_to_job);
app.get('/recruiter/delete_user_from_job/:user_id/:job_id', auth, recruiter.delete_user_from_job);
app.get('/recruiter/set_appointment/:job_id/:user_id', auth, recruiter.set_appointment);
app.post('/recruiter/schedule_interview', auth, recruiter.schedule_interview);
app.get('/recruiter/schedule_interview_submit/:job_id', auth, recruiter.schedule_interview_submit);
app.get('/recruiter/appointments', auth, recruiter.appointments);
app.get('/recruiter/select_user/:job_id/:user_id', auth, recruiter.select_user);
app.get('/recruiter/reject_user/:job_id/:user_id', auth, recruiter.reject_user);

app.get('/trainer/dashboard/:user_id', auth, trainer.dashboard);
app.get('/trainer/event_confirm/:event_id', auth, trainer.trainer_event_confirm);
app.get('/trainer/event_reject/:event_id', auth, trainer.trainer_event_reject);
app.get('/trainer/event_triage/:event_id', auth, trainer.trainer_event_triage);
app.get('/trainer/profile/:user_id', auth, trainer.profile);
app.post('/trainer/add_tag', auth, trainer.add_tag);
app.get('/trainer/delete_tag/:tag_id', auth, trainer.delete_tag);
app.get('/trainer/edit_billing/:text', auth, trainer.edit_billing);
app.post('/trainer/do_edit', auth, trainer.do_edit);
app.get('/trainer/reset_meeting/:event_id', auth, trainer.reset_meeting);
app.post('/trainer/do_reset_meeting', auth, trainer.do_reset_meeting);
app.get('/trainer/get_trainers/:q/:val', auth, trainer.get_trainers);

app.get('/trainer/show_event_invites/:trainer_id', auth, trainer.show_event_invites);
app.get('/trainer/dashboard_second/:user_id', auth, trainer.dashboard_second);
app.post('/trainer/log_trainer_location', auth, trainer.log_trainer_location);
app.get('/trainer/take_attendance/:event_id', auth, trainer.take_attendance);
app.get('/trainer/take_feedback/:event_id', auth, trainer.take_feedback);
app.get('/trainer/mark_attendance/:user_id/:event_id/:status', auth, trainer.mark_attendance);
app.get('/trainer/show_attendance/:user_id/:event_id', auth, trainer.show_attendance);
app.post('/trainer/update_feedback', auth, trainer.update_feedback);
app.post('/trainer/submit_class_rating_details', auth, trainer.submit_class_rating_details);
app.get('/trainer/create_event_log/:event_id/:status', auth, trainer.create_event_log);
app.get('/trainer/event_steps/:event_id', auth, trainer.event_steps);
app.get('/trainer/event_done/:event_id', auth, trainer.trainer_event_done);
app.get('/trainer/billing/:user_id', auth, trainer.billing);
app.get('/trainer/alerts/:user_id', auth, trainer.alerts);
app.get('/trainer/weekly_view/:user_id', auth, trainer.weekly_view);
app.get('/trainer/get_event_details/:event_id', auth, trainer.get_event_details);
app.get('/trainer/tot/:user_id', auth, trainer.tot);
app.get('/trainer/live_class/:user_id', auth, trainer.live_class);

app.get('/coach/dashboard/:user_id', auth, coach.dashboard);
//app.get('/coach/gym/:coach_id/:user_id/:link/:message', auth, coach.gym);
app.get('/coach/gym/:coach_id/:user_id/:link/:message', auth, coach.gym);
app.get('/coach/gym/:coach_id/:user_id/:message', auth, coach.gym);
app.get('/zoom/join_meeting/:coach_id/:user_id', auth, zoom.join_meeting);
//app.get('/coach/gym/:coach_id/:user_id/:link', auth, coach.gym);
//app.get('/coach/gym/:coach_id/:user_id', auth, coach.gym);
//app.get('/coach/gym/:coach_id/:user_id', auth, bbb.join_coach);
//app.get('/coach/join_user/:coach_id/:user_id', auth, bbb.join_user);
//app.get('/coach/logout_coach/:coach_id/:user_id', auth, bbb.logout_coach);
app.get('/coach/add_skill/:coach_id/:user_id', auth, coach.add_skill);
app.get('/coach/do_add_skill/:coach_id/:user_id/:name', auth, coach.do_add_skill);

app.get('/coach/add_notes/:coach_id/:user_id/:skill_id', auth, coach.add_notes);
app.get('/coach/do_add_notes/:coach_id/:user_id/:skill_id', auth, coach.do_add_notes);
app.get('/coach/notes_prev/:coach_id/:user_id/:skill_id/:cnh_id/:len/:curr', auth, coach.notes_prev);
app.get('/coach/notes_next/:coach_id/:user_id/:skill_id/:cnh_id/:len/:curr', auth, coach.notes_next);
app.get('/coach/delete_notes/:notes_id', auth, coach.delete_notes);
app.get('/coach/edit_notes/:notes_id', auth, coach.edit_notes);
app.post('/coach/do_edit_notes', auth, coach.do_edit_notes);

app.get('/coach/:coach_id/user/:user_id/skill/:skill_id/:rating', auth, coach.coach_rating);
app.get('/coach/user_skills/:coach_id/:user_id', auth, coach.user_skills);
app.get('/coach/set_appointment/:coach_id/:user_id', auth, coach.set_appointment);
app.post('/coach/schedule_appointment', auth, coach.schedule_appointment);
app.get('/coach/delete_user_skill/:user_id/:skill_id', auth, coach.delete_user_skill);
app.get('/coach/reset_module/:user_id/:skill_id', auth, coach.reset_module);
app.get('/coach/do_reset_module/:user_id/:skill_id/:module_id', auth, coach.do_reset_module);
app.get('/coach/coach_level/:user_id/:skill_id/:level', auth, coach.coach_level);

app.get('/skill/delete_role_skill/:user_id/:role_id/:skill_id', auth, superAuthOrManager, skill.delete_role_skill);
app.get('/skill/map_skills_module/:user_id/:module_id', auth, superAuthOrManager, skill.map_skills_module);
app.get('/skill/delete_module_skill/:user_id/:module_id/:skill_id', auth, superAuthOrManager, skill.delete_module_skill);
app.post('/skill/do_map_skill_to_module', auth, superAuthOrManager, skill.do_map_skill_to_module);
app.get('/skill/view_skills/:role_id', auth, superAuthOrManager, skill.view_skills);
app.get('/skill/get_modules_for_skill/:skill_id', auth, skill.get_modules_for_skill);
app.get('/skill/get_modules_for_skill_ajax/:skill_id', auth, skill.get_modules_for_skill_ajax);

app.get('/skill/list_skills', auth, superAuthOrManager, pagination, skill.list_skills);
app.get('/skill/list_skills/:page', auth, superAuthOrManager, pagination, skill.list_skills);

app.get('/content/new_module', auth, superAuthOrManager, content.new_module);
//app.post('/content/do_create_module', auth, superAuthOrManager, content.do_create_module);
app.get('/module/list_modules', auth, superAuthOrManager, pagination, content.list_modules);
app.get('/module/list_modules/:page', auth, superAuthOrManager, pagination, content.list_modules);
app.get('/content/delete_module/:module_id', auth, superAuthOrManager, content.delete_module);
app.get('/content/list_skills', auth, superAuthOrManager, pagination, skill.list_skills);
app.get('/content/new_skill', auth, superAuthOrManager, skill.new_skill);
app.post('/content/do_create_skill', auth, superAuthOrManager, skill.do_create_skill);
app.get('/content/list_content', auth, superAuthOrManager, pagination, content.list_content);
app.get('/content/list_content/:page', auth, superAuthOrManager, pagination, content.list_content);
app.get('/content/upload', auth, superAuthOrManager, content.upload);
app.post('/content/do_upload', auth, superAuthOrManager, content.do_upload);
app.get('/skillgroup/list_skill_groups', auth, superAuthOrManager, pagination, skill.list_skill_groups);
app.get('/skillgroup/list_skill_groups/:page', auth, superAuthOrManager, pagination, skill.list_skill_groups);
app.get('/content/new_skill_group', auth, superAuthOrManager, skill.new_skill_group);
app.post('/content/do_create_skill_group', auth, superAuthOrManager, skill.do_create_skill_group);
app.get('/content/map_skills_groups/:skill_id', auth, superAuthOrManager, skill.map_skills_groups);
app.get('/content/add_skills_to_skill_groups/:skill_group_id', auth, superAuthOrManager, skill.add_skills_to_skill_groups);
app.post('/content/do_map_skill_to_skill_group', auth, superAuthOrManager, skill.do_map_skill_to_skill_group);
app.get('/content/delete_skill_from_skill_group/:skill_id/:skill_group_id', auth, superAuthOrManager, skill.delete_skill_from_skill_group);
app.post('/content/answer', auth, content.answer);
app.get('/content/add_question/:q', auth, content.add_question);
app.get('/content/show_question/:content_id/:skill_id/:current_question_id', auth, content.show_question);

app.get('/content/show_content_question/:test_id/:content_id/:skill_id', auth, content.show_content_question);
//app.get('/content/show_content_question/:content_id/:skill_id/:type', auth, content.show_content_question);
app.get('/content/show_content_question/:test_id/:content_id/:skill_id/:prev_question_id/:duration/:second_duration', auth, content.show_content_question);
//app.get('/content/show_content_question/:content_id/:skill_id/:prev_question_id/:duration/:type', auth, content.show_content_question);
app.get('/content/show_test_question/:id', auth, content.show_test_question);
app.get('/content/show_test_question/:id/:prev_question_id/:duration/:second_duration', auth, content.show_test_question);
app.get('/content/show_content_test_report_details/:test_id/:skill_id', auth, content.show_content_test_report_details);
app.get('/content/show_content_test_report_details/:test_id/:skill_id/:message', auth, content.show_content_test_report_details);
app.get('/content/advance_next/:user_id/:skill_id/:test_id', auth, content.advance_next);
app.get('/content/show_test_instructions/:content_id/:skill_id', auth, content.show_test_instructions);
app.get('/content/show_general_test_instructions/:id', auth, content.show_general_test_instructions);
app.get('/content/force_end_test/:test_id/:skill_id', auth, content.force_end_test);
app.get('/content/start_test/:val/:id', auth, content.start_test);
app.get('/content/reset_test/:test_id/:user_id', auth, content.reset_test);
app.get('/content/do_reset_test/:test_id/:user_id', auth, content.do_reset_test);

app.get('/content/show_module/:content_id/:skill_id', auth, content.show_module);
app.get('/content/answer_wrong/:content_id/:skill_id/:current_question_id', auth, content.answer_wrong);
app.get('/content/add_tag/:tag_name', auth, content.add_tag);
app.get('/content/remove_tag/:tag_name', auth, content.remove_tag);
app.get('/content/show_tag', auth, content.show_tag);
app.get('/content/get_tags/:q', auth, content.get_tags);
app.get('/content/search_content/:q', auth, content.search_content);
app.get('/content/search_content_by_tag/:q', auth, content.search_content_by_tag);
app.get('/content/search_content_by_title/:q', auth, content.search_content_by_title);
app.get('/content/search_module/:q', auth, content.search_module);
app.post('/content/do_create_module_ajax', auth, content.do_create_module_ajax);
app.get('/content/build_module_playlist/:module_id/:content_id', auth, content.build_module_playlist);
app.post('/content/do_edit_module', auth, content.do_edit_module);
app.get('/content/show_preview/:content_id/:val/:id', auth, content.show_preview_display_false);
app.get('/content/show_preview/:content_id/:val/:id/:display', auth, content.show_preview);
app.post('/content/show_content_preview_before_upload', auth, content.show_content_preview_before_upload);
app.get('/content/delete_content_from_playlist/:module_id/:content_id', auth, content.delete_content_from_playlist);
app.get('/content/module_playlist/:module_id', auth, content.module_playlist);
app.get('/content/ajax_load/:option/:id1/:val', auth, content.ajax_load);
app.get('/content/browse/:val', auth, pagination, content.browse);
app.get('/content/browse/:val/:page', auth, pagination, content.browse);
app.get('/content/update_content_to_https', auth, content.update_content_to_https);

app.get('/content/delete_content/:content_id', auth, superAuthOrManager, content.delete_content);
app.get('/content/delete_answer_ajax/:answer_id/:test_id/:div', auth, superAuthOrManager, content.delete_answer_ajax);
app.get('/content/delete_answer/:answer_id/:div', auth, superAuthOrManager, content.delete_answer);
app.post('/content/do_delete', auth, superAuthOrManager, content.do_delete);
app.get('/content/delete_problem/:problem_id/:div', auth, superAuthOrManager, content.delete_problem);
app.get('/content/delete_problem_ajax/:problem_id/:test_id/:div', auth, superAuthOrManager, content.delete_problem_ajax);
app.get('/content/delete_test/:val/:div/:test_id/:id', auth, superAuthOrManager, content.delete_test);
app.get('/content/delete_test/:val/:div/:test_id', auth, superAuthOrManager, content.delete_test);

app.get('/content/searchByField/:val', auth, content.searchByField);
app.get('/content/list_content_by_tag/:tag_id', auth, content.list_content_by_tag);
app.get('/content/list_content_by_tag/:tag_id/:page', auth, content.list_content_by_tag);
app.get('/content/list_content_by_tags/:q', auth, content.list_content_by_tags);
app.get('/content/list_content_by_tags/:q/:page', auth, content.list_content_by_tags);
app.get('/content/list_content_by_title/:tag_id', auth, content.list_content_by_title);
app.get('/content/list_content_by_title/:tag_id/:page', auth, content.list_content_by_title);
app.get('/content/list_content_by_titles/:q', auth, content.list_content_by_titles);
app.get('/content/list_content_by_titles/:q/:page', auth, content.list_content_by_titles);
app.get('/content/search_content_by_module/:q', auth, content.search_content_by_module);
app.get('/content/list_content_by_module/:tag_id', auth, content.list_content_by_module);
app.get('/content/list_content_by_module/:tag_id/:page', auth, content.list_content_by_module);
app.get('/content/list_content_by_modules/:q', auth, content.list_content_by_modules);
app.get('/content/list_content_by_modules/:q/:page', auth, content.list_content_by_modules);
app.get('/content/search_content_by_skill/:q', auth, content.search_content_by_skill);
app.get('/content/list_content_by_skill/:tag_id', auth, content.list_content_by_skill);
app.get('/content/list_content_by_skill/:tag_id/:page', auth, content.list_content_by_skill);
app.get('/content/list_content_by_skills/:q', auth, content.list_content_by_skills);
app.get('/content/list_content_by_skills/:q/:page', auth, content.list_content_by_skills);

app.get('/content/searchByFieldModule/:val', auth, content.searchByFieldModule);
app.get('/content/list_module_by_title/:tag_id', auth, content.list_module_by_title);
app.get('/content/list_module_by_title/:tag_id/:page', auth, content.list_module_by_title);
app.get('/content/list_module_by_titles/:q', auth, content.list_module_by_titles);
app.get('/content/list_module_by_titles/:q/:page', auth, content.list_module_by_titles);
app.get('/content/search_module_by_skill/:q', auth, content.search_module_by_skill);
app.get('/content/search_module_by_title/:q', auth, content.search_module_by_title);
app.get('/content/list_module_by_skill/:tag_id', auth, content.list_module_by_skill);
app.get('/content/list_module_by_skill/:tag_id/:page', auth, content.list_module_by_skill);
app.get('/content/list_module_by_skills/:q', auth, content.list_module_by_skills);
app.get('/content/list_module_by_skills/:q/:page', auth, content.list_module_by_skills);

app.get('/module/browse_modules', auth, pagination, content.browse_modules);
app.get('/module/browse_modules/:page', auth, pagination, content.browse_modules);

app.get('/problem/list_questions', auth, superAuthOrManager, pagination, content.list_questions);
app.get('/problem/list_questions/:page', auth, superAuthOrManager, pagination, content.list_questions);
app.get('/content/new_question', auth, superAuthOrManager, content.new_question);
app.get('/content/create_new_question_to_test/:test_id', auth, superAuthOrManager, content.create_new_question_to_test);
app.post('/content/create_question', auth, superAuthOrManager, content.create_question);
app.post('/content/create_question_ajax', auth, superAuthOrManager, content.create_question_ajax);
app.get('/content/edit_question/:id', auth, superAuthOrManager, content.edit_question);
app.get('/content/edit_question_ajax/:id/:test_id', auth, superAuthOrManager, content.edit_question_ajax);
app.post('/content/do_edit_question_ajax', auth, superAuthOrManager, content.do_edit_question_ajax);
app.post('/content/do_edit_question', auth, superAuthOrManager, content.do_edit_question);
app.get('/content/add_answer/:question_id', auth, superAuthOrManager, content.add_answer);
app.get('/content/add_answer/:question_id/:message', auth, superAuthOrManager, content.add_answer);
app.get('/content/add_answer_ajax/:question_id/:test_id', auth, superAuthOrManager, content.add_answer_ajax);
app.post('/content/do_add_answer', auth, superAuthOrManager, content.do_add_answer);
app.post('/content/do_add_answer_ajax', auth, superAuthOrManager, content.do_add_answer_ajax);
app.get('/content/add_problem_tag/:problem_id/:tag_name', auth, superAuthOrManager, content.add_problem_tag);
app.get('/content/delete_problem_tag/:problem_id/:tag_id', auth, superAuthOrManager, content.delete_problem_tag);
app.get('/content/add_problem_tag_ajax/:problem_id/:tag_name/:test_id', auth, superAuthOrManager, content.add_problem_tag_ajax);
app.get('/content/delete_problem_tag_ajax/:problem_id/:tag_id/:test_id', auth, superAuthOrManager, content.delete_problem_tag_ajax);
app.get('/content/edit_answers_ajax/:problem_id/:test_id', auth, superAuthOrManager, content.edit_answers_ajax);
app.get('/content/edit_answer_ajax/:answer_id/:test_id', auth, superAuthOrManager, content.edit_answer_ajax);
app.post('/content/do_edit_answer_ajax', auth, superAuthOrManager, content.do_edit_answer_ajax);
app.get('/content/edit_answer/:answer_id', auth, superAuthOrManager, content.edit_answer);
app.post('/content/do_edit_answer', auth, superAuthOrManager, content.do_edit_answer);
app.get('/content/delete_answer/:answer_id', auth, superAuthOrManager, content.delete_answer);

app.get('/content/edit_test_pass_score/:test_id', auth, superAuthOrManager, content.edit_test_pass_score);
app.get('/content/edit_test_mandatory_question/:test_id', auth, superAuthOrManager, content.edit_test_mandatory_question);
app.get('/content/do_edit_test_pass_score/:pass_score/:test_id', auth, superAuthOrManager, content.do_edit_test_pass_score);
app.get('/content/show_test_pass_score/:test_id', auth, superAuthOrManager, content.show_test_pass_score);
app.get('/content/do_edit_test_mandatory_question/:option/:test_id', auth, superAuthOrManager, content.do_edit_test_mandatory_question);
app.get('/content/show_test_mandatory_question/:test_id', auth, superAuthOrManager, content.show_test_mandatory_question);

app.get('/content/edit_content/:id', auth, superAuthOrManager, content.edit_content);
app.get('/content/edit_content/:id/:url_string/:url_param/:page', auth, superAuthOrManager, content.edit_content);
app.get('/content/edit_content/:id/:url_string/:url_param', auth, superAuthOrManager, content.edit_content);
app.post('/content/do_edit_content', auth, superAuthOrManager, content.do_edit_content);
app.get('/content/add_content_tag/:content_id/:tag_name', auth, superAuthOrManager, content.add_content_tag);
app.get('/content/delete_content_tag/:content_id/:tag_id', auth, superAuthOrManager, content.delete_content_tag);
app.get('/content/add_test/:val/:id', auth, content.add_test);
app.get('/content/do_add_test/:id/:test_id/:val', auth, content.do_add_test);
app.get('/content/get_tests_name/:q', auth, content.get_tests_name);

app.get('/test/list_tests', auth, superAuthOrManager, pagination, content.list_tests);
app.get('/test/list_tests/:page', auth, superAuthOrManager, pagination, content.list_tests);
app.get('/content/new_test', auth, superAuthOrManager, content.new_test);
app.post('/content/create_test', auth, superAuthOrManager, content.create_test);
app.get('/content/edit_test/:id', auth, superAuthOrManager, content.edit_test);
app.post('/content/do_edit_test', auth, superAuthOrManager, content.do_edit_test);
app.get('/content/add_question_to_test/:test_id', auth, superAuthOrManager, content.add_question_to_test);
app.get('/content/get_problem_tags/:q', auth, superAuthOrManager, content.get_problem_tags);
app.get('/content/do_add_question_to_test/:test_id/:question_id', auth, superAuthOrManager, content.do_add_question_to_test);

app.post('/content/do_create_skill_ajax', auth, content.do_create_skill_ajax);
app.get('/content/build_skill_playlist/:skill_id/:module_id', auth, content.build_skill_playlist);
app.post('/content/do_edit_skill', auth, content.do_edit_skill);
app.get('/content/show_preview_module/:module_id/:val/:id', auth, content.show_preview_module_false);
app.get('/content/show_preview_module/:module_id/:val/:id/:display', auth, content.show_preview_module);
app.get('/content/delete_module_from_playlist/:skill_id/:module_id', auth, content.delete_module_from_playlist);
app.get('/content/skill_playlist/:skill_id', auth, content.skill_playlist);

app.get('/organization/new', auth, superAuth, organization.new_organization);
app.get('/organization/list', auth, superAuth, organization.list);
app.post('/organization/create', auth, superAuth, organization.create);
app.get('/organization/:organization_id/delete', auth, superAuth, organization.destroy);

app.get('/zoom/start_meeting/:coach_id/:user_id', auth, zoom.start_meeting);
app.get('/zoom/recruiter_start_meeting/:recruiter_id/:user_id', auth, zoom.recruiter_start_meeting);
app.get('/zoom/start_live_class/:event_id', auth, zoom.start_live_class);
app.get('/zoom/join_live_class/:event_id', auth, zoom.join_live_class);

app.get('/misc/import_csv', auth, superAuthOrManager, misc.import_csv);
app.post('/misc/do_import_csv', auth, superAuthOrManager, misc.do_import_csv);
app.get('/misc/take_attendance', auth, misc.take_attendance);
app.get('/misc/take_attendance', auth, misc.take_attendance);
app.post('/misc/show_user_list', auth, misc.show_user_list);
app.get('/misc/mark_attendance/:user_id/:status', auth, misc.mark_attendance);
app.get('/misc/view_attendance', auth, misc.view_attendance);
app.post('/misc/do_view_attendance', auth, misc.do_view_attendance);
app.get('/misc/take_feedback', auth, misc.take_feedback);
app.post('/misc/do_submit_feedback', auth, misc.do_submit_feedback);
app.get('/misc/view_feedback', auth, misc.view_feedback);
app.post('/misc/do_view_feedback', auth, misc.do_view_feedback);
app.get('/misc/bulk_user_create', auth, misc.bulk_user_create);
app.post('/misc/do_bulk_user_create', auth, misc.do_bulk_user_create);
app.get('/misc/upload_batches', auth, misc.upload_batches);
app.post('/misc/do_upload_batches', auth, misc.do_upload_batches);

app.get('/misc/upload_country_and_state', auth, misc.upload_country_and_state);
app.get('/misc/upload_kerala_districts', auth, misc.upload_kerala_districts);
app.get('/misc/upload_training_centres', auth, misc.upload_training_centres);
app.post('/misc/do_upload_training_centres', auth, misc.do_upload_training_centres);
app.get('/misc/upload_kerala_trainers', auth, misc.upload_kerala_trainers);
app.post('/misc/do_upload_kerala_trainers', auth, misc.do_upload_kerala_trainers);
app.get('/misc/upload_kerala_students', auth, misc.upload_kerala_students);
app.post('/misc/do_upload_kerala_students', auth, misc.do_upload_kerala_students);
app.get('/misc/create_kerala_schedule', auth, misc.create_kerala_schedule);
app.post('/misc/do_create_kerala_schedule', auth, misc.do_create_kerala_schedule);

app.get('/misc/get_trainers', misc.get_trainers);
app.get('/misc/get_districts', misc.get_districts);
app.get('/misc/get_courses', misc.get_courses);
app.get('/misc/get_district_trainers/:district', misc.get_district_trainers);
app.get('/misc/get_course_trainers/:role', misc.get_course_trainers);

//var func = require('./controllers/functions');
//app.get('/users/get_users', func.get_users);

var options = {
  key: fs.readFileSync('ssl/talentify.key'),
  cert: fs.readFileSync('ssl/da1b6925513c9aad.crt'),
  ca: fs.readFileSync('ssl/gd_bundle-g2-g1.crt')
};

db.sequelize.sync().complete(function(err) {
	if(err) {
		throw err;
	} else {
		//db.sequelize.query('ALTER TABLE public."UserOrganizations" ADD CONSTRAINT "User_Id_Constraint" FOREIGN KEY("UserId") REFERENCES public."Users" (id) ON DELETE CASCADE');
		//db.sequelize.query('ALTER TABLE public."UserOrganizations" ADD CONSTRAINT "Organization_Id_Constraint" FOREIGN KEY("OrganizationId") REFERENCES public."Organizations" (id) ON DELETE CASCADE');
		
		http.createServer(app).listen(app.get('port'), function(){
			console.log('Express server listening on port ' + app.get('port'));
		});
		
		https.createServer(options, app).listen(4000, function(){
			console.log('Express secure server listening on port 4000');
		});
	}
});