//all admin related bulk import code using CSV is written here

var db = require('../models')
, path = require('path')
, fs = require('fs')
, ya_csv = require('ya-csv')
, json2csv = require('json2csv');
//, csv = require('csv');

module.exports = {
		
	//interface to upload a csv file containing user data
	import_csv: function(req, res) {
		db.Organization.findAll().success(function(organizations){
			db.Role.findAll().success(function(roles){
				res.render('misc/import_csv', {organizations: organizations, roles: roles, successFlash: req.flash('info')[0]});
			});
		});
	},
	
	//deprecated
	do_import_csv1: function(req, res) {
		var do_import_csv = function(path) {
			console.log(" >> PATH "+path);
			var reader = ya_csv.createCsvFileReader(path, { columnsFromHeader: true }, {
			    'separator': ',',
			    'quote': '"',
			    'escape': '"',       
			    'comment': '',
			});
			//var writer = new csv.CsvWriter(process.stdout);
			var cnt = 0;
			var users = [];
			var d = [];
			//var row = ["ID", "NAME"];
			//d.push(row);
			
			/*var writeStream = fs.createWriteStream("test.csv");
			var header="Counter"+","+"Name"+"\n";
			writeStream.write(header);
			writeStream.write("Counter"+","+"Name"+"\n");
			writeStream.write("Counter"+","+"Name"+"\n");
			writeStream.write("Counter"+","+"Name"+"\n");
			writeStream.write("Counter"+","+"Name"+"\n");
			writeStream.write("Counter"+","+"Name"+"\n");*/
						
			reader.addListener('data', function(data) {
			    users[cnt] = {};
			    users[cnt] = data;
			    ++cnt;
			});
			
			reader.addListener('end', function(data) {
				console.log(">> "+users.length+" users");
				var write_user = function(i) {
					if(i == users.length) {
						//writeStream.close();
						var json = [
				            {
				              "car": "Audi",
				              "price": 40000,
				              "color": "blue"
				            }, {
				              "car": "BMW",
				              "price": 35000,
				              "color": "black"
				            }, {
				              "car": "Porsche",
				              "price": 60000,
				              "color": "green"
				            }
				          ];
						//var jsond = JSON.parse(JSON.stringify(d));
						//console.log(jsond);
						//csv().from(d).to(fs.createWriteStream('test.csv'));
						json2csv({data: json, fields: ['ID', 'NAME']}, function(err, csv) {
						  if (err) console.log(err);
						  fs.writeFile('file.csv', csv, function(err) {
						    if (err) throw err;
						    console.log('file saved', csv);
						    fs.unlink(path, function() { //delete file from temporary location
								req.flash('info', "Successfully imported "+cnt+" student(s) data"); 
							    res.redirect('/misc/import_csv');
						    });
						  });
						});
					} else {
						//console.log(i+","+users[i]["Student Name"]);
						//writeStream.write(i+","+users[i]["Student Name"]+"\n");
						//writeStream.write("Counter"+","+"Name"+"\n");
						/*row = [];
						row.push(i);
						row.push(users[i]["Student Name"]);
						d.push(row);*/
						
						var row = {};
						row.id = i;
						row.name = users[i]["Student Name"];
						//row.push(i);
						//row.push(users[i]["Student Name"]);
						var rowd = JSON.stringify(row);
						d.push(rowd);
						
						write_user(++i);
					}
				};
				write_user(0);
				
				/*db.Organization.find({id: parseInt(req.param('OrganizationId'))}).success(function(organization) {
					db.Role.find({id: parseInt(req.param('RoleId'))}).success(function(role) {
						var d = new Date();
						var current_year = d.getFullYear();
						var add_users_to_db = function(i) {
							if(i == users.length) {
								fs.unlink(path, function() { //delete file from temporary location
									req.flash('info', "Successfully imported "+cnt+" student(s) data"); 
								    res.redirect('/misc/import_csv');
							    });
							} else {
								var n = users[i]["Student Name"];
								n = n.replace(/[\.]+/g,' ');
								var result = n.split(' ');
								var last_name = [];
								var first_name = result[0];
								for(var x = 1; x < result.length; x++) {
									last_name.push(result[x]);
								}
								last_name = last_name.join(" ");
								
								//var name = users[i]["Student Name"].toLowerCase();
								//var username = college.id+""+Math.floor((Math.random() * 100) + 1)+""+first_name.toLowerCase();
								
								db.User.create({first_name: first_name, 
												last_name: last_name, 
												//phone: users[i]["Contact No"], 
												//department: users[i]["Stream"],
												//location: users[i]["Location"],
												//email: users[i]["Email"],
												permission: 'user',
												isProfileCompleted: req.param('isProfileCompleted'),
												isTestTaken: req.param('isTestTaken'),
												isMetCoach: req.param('isMetCoach'),
												//year: users[i]["Year"], 
												//section: users[i]["Section"], 
												//address: users[i]["Address"], 
												//gender: users[i]["Gender"], 
												//caste: users[i]["Caste"], 
												//religion: users[i]["Religion"], 
												//dob: users[i]["Date of Birth"], 
												//father_name: users[i]["Father Name"], 
												//father_occupation: users[i]["Father Occupation"], 
												//mother_name: users[i]["Mother Name"], 
												//mother_occupation: users[i]["Mother Occupation"], 
												//monthly_family_income: !isNaN(users[i]["Monthly Family Income"]) ? parseInt(users[i]["Monthly Family Income"]) : 0, 
												//aadhar_number: users[i]["Aadhar No"], 
												//last_exam_passed: users[i]["Last Exam Passed"], 
												//percentage: users[i]["Percentage"] != 'Nil' && users[i]["Percentage"] != 'Nill' && users[i]["Percentage"] != 'NA' ? parseInt(users[i]["Percentage"]) : 0, 
												//isJobAfterGraduation: users[i]["Job/Study"] == 'Job' ? true : false, 
												//isStudyAfterGraduation: users[i]["Job/Study"] == 'Study' ? true : false, 
												//job_sector: users[i]["Which Sector Job"], 
												//expected_salary: !isNaN(users[i]["Expected Salary"]) ? parseInt(users[i]["Expected Salary"]) : 0, 
												//course: users[i]["Course"], 
												//isLearntMsOffice: users[i]["MS Office"] == 'Yes' ? true : false, 
												//isLearntTally: users[i]["Tally"] == 'Yes' ? true : false, 
												//goal: users[i]["Career Goal"], 
												RoleId: parseInt(req.param('RoleId')),
												OrganizationId: parseInt(req.param('OrganizationId'))}).success(function(user) {
									var username = current_year;
									switch(user.id.toString().length) {
										case 1: username = username+'00000'+user.id;break;
										case 2: username = username+'0000'+user.id;break;
										case 3: username = username+'000'+user.id;break;
										case 4: username = username+'00'+user.id;break;
										case 5: username = username+'0'+user.id;break;
										case 6: username = username+user.id;break;
									}
									console.log(">> Username: "+username+" Password: "+username+" First Name: "+first_name+" Last Name: "+last_name);
									user.updateAttributes({username: username, password: username}).success(function(){
										add_users_to_db(++i);
									});
								});
							}
						};
						add_users_to_db(0);
					});
				});*/
			});
		};
		
		 
		if(req.files.csv != null && req.files.csv.originalFilename != null && req.files.csv.originalFilename != '' && req.files.csv.originalFilename != 'null') {
		    var fullPath = req.files.csv.path;
		    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
			var ext = fullPath.substring(startIndex);
			if (ext.indexOf('\.') === 0 ) {
				ext = ext.substring(1);
			}
			console.log("FILE EXTENSION: ", ext);
			
			if(ext != 'csv') {
				req.flash('info', "You uploaded a "+ext+" file. Please upload a CSV file ONLY."); 
			    res.redirect('/misc/import_csv');
			}
			
			else if(ext == 'csv') {
				fs.readFile(req.files.csv.path, function (err, data) {
					do_import_csv(req.files.csv.path);
				});
			}
		} else {
			req.flash('info', "Please upload a CSV file."); 
		    res.redirect('/misc/import_csv');
		}
	},
	
	//interface to create many users
	//the no. of users to be created is specified as a parameter
	bulk_user_create: function(req, res) {
		db.Organization.findAll().success(function(organizations){
			db.Role.findAll().success(function(roles){
				db.User.findAll({where: {permission: 'coach'}}).success(function(coaches){
					res.render('misc/bulk_user_create', {coaches: coaches, organizations: organizations, roles: roles, successFlash: req.flash('info')[0]});
				});
			});
		});
	},
	
	//no. of users to be created is specified in 'count' param
	//the username is of the form '2015' followed by the database id for the user 
	//the username length is 10 characters
	//this doesn't need any csv file to be uploaded
	//email is compulsory for a user, hence 'noreply@istarindia.com' is specified
	//users generated from this process have no first name/last name
	do_bulk_user_create: function(req, res) {
		var pattern = /^\d+$/;
		var count = req.param('count');
		count = pattern.test(count) ? parseInt(count) : 1; //ensure 'count' parameter is an int value
		var create = function(i) {
			if(i == parseInt(count)) {
				req.flash('info', "Successfully imported "+count+" student(s) data"); 
			    res.redirect('/misc/bulk_user_create');
			} else {
				db.User.create({ username: '20150'+(i+1),
								email: 'noreply@istarindia.com',
								permission: 'user',
								CoachId: parseInt(req.param('CoachId')),
								RoleId: parseInt(req.param('RoleId')),
								OrganizationId: parseInt(req.param('OrganizationId'))}).success(function(user) {
					var username = '2015';
					//code to generate usernames
					switch(user.id.toString().length) {
						case 1: username = username+'00000'+user.id;break;
						case 2: username = username+'0000'+user.id;break;
						case 3: username = username+'000'+user.id;break;
						case 4: username = username+'00'+user.id;break;
						case 5: username = username+'0'+user.id;break;
						case 6: username = username+user.id;break;
					}
					//console.log(">> Username: "+username+" Password: "+username+" First Name: "+first_name+" Last Name: "+last_name);
					user.updateAttributes({username: username, password: username}).success(function(){
						create(++i);
					});
				});
			}
		};
		create(0);
	},
	
	//this was written to import MLA college students' data using a CSV file
	//the format of the csv file uploaded can be found on github -
	//ISTARSkills/CSV repository
	do_import_csv: function(req, res) {
		var do_import_csv = function(path) {
			console.log(">> PATH "+path);
			var reader = ya_csv.createCsvFileReader(path, { columnsFromHeader: true }, {
			    'separator': ',',
			    'quote': '"',
			    'escape': '"',       
			    'comment': '',
			});
			//var writer = new csv.CsvWriter(process.stdout);
			var cnt = 0;
			var users = [];
			var d = [];
						
			reader.addListener('data', function(data) {
			    users[cnt] = {};
			    users[cnt] = data;
			    ++cnt;
			});
			
			reader.addListener('end', function(data) {
				db.Organization.find({id: parseInt(req.param('OrganizationId'))}).success(function(organization) {
					db.Role.find({id: parseInt(req.param('RoleId'))}).success(function(role) {
						var d = new Date();
						var current_year = d.getFullYear();
						var add_users_to_db = function(i) {
							if(i == users.length) {
								fs.unlink(path, function() { //delete file from temporary location
									req.flash('info', "Successfully imported "+cnt+" student(s) data"); 
								    res.redirect('/misc/import_csv');
							    });
							} else {
								//normalize the user's name
								//replace '.' (dot) with ' ' (space)
								var n = users[i]["Student Name"];
								n = n.replace(/[\.]+/g,' ');
								var result = n.split(' ');
								var last_name = [];
								var first_name = result[0];
								for(var x = 1; x < result.length; x++) {
									last_name.push(result[x]);
								}
								last_name = last_name.join(" ");
								
								//var name = users[i]["Student Name"].toLowerCase();
								//var username = college.id+""+Math.floor((Math.random() * 100) + 1)+""+first_name.toLowerCase();
								
								db.User.create({ username: current_year+'0'+(i+1),
												first_name: first_name, 
												last_name: last_name, 
												email: 'noreply@istarindia.com',
												permission: 'user',
												isProfileCompleted: req.param('isProfileCompleted'),
												isTestTaken: req.param('isTestTaken'),
												isMetCoach: req.param('isMetCoach'),
												RoleId: parseInt(req.param('RoleId')),
												OrganizationId: parseInt(req.param('OrganizationId'))}).success(function(user) {
									var username = current_year;
									switch(user.id.toString().length) {
										case 1: username = username+'00000'+user.id;break;
										case 2: username = username+'0000'+user.id;break;
										case 3: username = username+'000'+user.id;break;
										case 4: username = username+'00'+user.id;break;
										case 5: username = username+'0'+user.id;break;
										case 6: username = username+user.id;break;
									}
									//console.log(">> Username: "+username+" Password: "+username+" First Name: "+first_name+" Last Name: "+last_name);
									user.updateAttributes({username: username, password: username}).success(function(){
										add_users_to_db(++i);
									});
								});
							}
						};
						add_users_to_db(0);
					});
				});
			});
		};
		
		 
		if(req.files.csv != null && req.files.csv.originalFilename != null && req.files.csv.originalFilename != '' && req.files.csv.originalFilename != 'null') {
		    var fullPath = req.files.csv.path;
		    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
			var ext = fullPath.substring(startIndex);
			if (ext.indexOf('\.') === 0 ) {
				ext = ext.substring(1);
			}
			console.log("FILE EXTENSION: ", ext);
			
			if(ext != 'csv') {
				req.flash('info', "You uploaded a "+ext+" file. Please upload a CSV file ONLY."); 
			    res.redirect('/misc/import_csv');
			}
			
			else if(ext == 'csv') {
				fs.readFile(req.files.csv.path, function (err, data) {
					do_import_csv(req.files.csv.path);
				});
			}
		} else {
			req.flash('info', "Please upload a CSV file."); 
		    res.redirect('/misc/import_csv');
		}
	},
	
	//deprecated
	take_attendance: function(req, res) {
		db.Organization.findAll().success(function(organizations){
			res.render('misc/take_attendance', {organizations: organizations});
		});
	},
	
	//deprecated
	show_user_list: function(req, res) {
		db.Organization.find({ where: ['"id" = ?', parseInt(req.param('OrganizationId'))]}).success(function(organization) {
			db.User.findAll({ where: ['"OrganizationId" = ? AND department = ?', organization.id, req.param('stream')]}).success(function(users) {
				var date = new Date(); 
				var year = date.getFullYear();
				var month = date.getMonth();
				month = month < 10 ? '0'+(month+1) : month+1;
				var day = date.getDate();
				
				var generatedDate = year+"-"+month+"-"+day;
				
				var mark_attendance = function(i) {
					if(i == users.length) {
						res.render('misc/show_user_list', {users: users});
					} else {
						db.Attendance.find({ where: ['"UserId" = ? AND date = ?', users[i].id, generatedDate]}).success(function(attendance) {
							if(attendance != null && generatedDate == attendance.date) {
								mark_attendance(++i);
							} else {
								db.Attendance.create({UserId: users[i].id, status: 'present', date: generatedDate}).success(function(att) {
									mark_attendance(++i);
								});
							}
						});
					}
				};
				mark_attendance(0);
			});
		});
	},
	
	//called from trainer controller
	mark_attendance: function(req, res) {
		db.User.find({ where: ['"id" = ?', parseInt(req.param('user_id'))]}).success(function(user) {
			var date = new Date(); 
			var year = date.getFullYear();
			var month = date.getMonth();
			month = month < 10 ? '0'+(month+1) : month+1;
			var day = date.getDate();
			
			var generatedDate = year+"-"+month+"-"+day;
			
			db.Attendance.find({where: ['"UserId" = ? AND date = ?', user.id, generatedDate]}).success(function(attendance) {
				attendance.updateAttributes({status: req.param('status'), date: generatedDate}).success(function(){
					console.log("## User "+user.first_name+" marked "+req.param('status'));
					var message = "User "+user.first_name+" marked "+req.param('status');
					res.send(message, {
			            'Content-Type': 'text/plain'
			         }, 200);
				});
			});
		});
	},
	
	//called from trainer controller
	view_attendance: function(req, res) {
		db.Organization.findAll().success(function(organizations){
			res.render('misc/view_attendance', {organizations: organizations});
		});
	},
	
	//called from trainer controller
	do_view_attendance: function(req, res) {
		db.Organization.find({ where: ['"id" = ?', parseInt(req.param('OrganizationId'))]}).success(function(organization) {
			db.Attendance.findAll({ where: ['date = ?', req.param('date')]}).success(function(attendances) {
				db.User.findAll({ where: ['"OrganizationId" = ? AND department = ?', organization.id, req.param('stream')]}).success(function(users) {
					var att = {};
					att.attendance = [];
					
					var present = 0;
					var absent = 0;
					
					var u = [];
					for(var x = 0; x < users.length; x++) {
						u.push(users[x].id);
					}
					
					var get_attendance = function(i) {
						if(i == attendances.length) {
							res.render('misc/do_view_attendance', {att: att});
						} else {
							var pos = -1;
							pos = u.indexOf(attendances[i].UserId);
							if(pos != -1) {
								db.User.find({ where: ['id = ?', attendances[i].UserId]}).success(function(user) {
									if(user) {
										att.attendance[i] = {};
										att.attendance[i].name = user.first_name+" "+user.last_name;
										att.attendance[i].status = attendances[i].status;
										
										if(attendances[i].status == 'present') {
											att.present = ++present;
										} else {
											att.absent = ++absent;
										}
									}
									get_attendance(++i);
								});
							} else {
								get_attendance(++i);
							}
						}
					};
					get_attendance(0);
				});
			});
		});
	},
	
	//called from trainer controller
	take_feedback: function(req, res) {
		res.render('misc/take_feedback', {successFlash: req.flash('info')[0]});
	},
	
	//called from trainer controller
	do_submit_feedback: function(req, res) {
		var date = new Date(); 
		var year = date.getFullYear();
		var month = date.getMonth();
		month = month < 10 ? '0'+(month+1) : month+1;
		var day = date.getDate();
		
		var generatedDate = year+"-"+month+"-"+day;
		
		db.TrainerFeedback.findOrCreate({date: generatedDate, TrainerId: parseInt(req.user.id)}).success(function(feedback){
			feedback.updateAttributes(req.body).success(function(){
				console.log('Thanks for submitting feedback');
				req.flash('info', 'Thanks for submitting feedback');
				res.redirect('/misc/take_feedback');
			});
		});
	},
	
	//called from trainer controller
	view_feedback: function(req, res) {
		res.render('misc/view_feedback');
	},
	
	//called from trainer controller
	do_view_feedback: function(req, res) {
		db.TrainerFeedback.find({ where: ['"TrainerId" = ? AND date = ?', parseInt(req.user.id), req.param('date')]}).success(function(feedback) {
			console.log(">>FEEDBACK",feedback);
			res.render('misc/do_view_feedback', {feedback: feedback});
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	upload_country_and_state: function(req, res) {
		db.Country.findOrCreate({name: 'India'}).success(function(country, createdC) {
			db.State.findOrCreate({name: 'Kerala', CountryId: country.id}).success(function(state, createdS) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write('Country '+country.name+' created '+createdC+' and state '+state.name+' created '+createdS);
				res.end();
			});
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	upload_kerala_districts: function(req, res) {
		db.State.find({where: {name: 'Kerala'}}).success(function(state) {
			var districts = ['Alapuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasargode', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pattanamthitta', 'Thrissur', 'Trivandrum', 'Wayanad'];
			var upload = function(i) {
				if(i == 14) {
					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.write(i+' districts created');
					res.end();
				} else {
					db.District.create({name: districts[i], StateId: state.id}).success(function(d) {
						upload(++i);
					});
				}
			};
			upload(0);
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	upload_training_centres: function(req, res) {
		res.render('misc/upload_training_centres');
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	do_upload_training_centres: function(req, res) {
		var do_import_csv = function(path) {
			var reader = ya_csv.createCsvFileReader(path, { columnsFromHeader: true }, {
			    'separator': ',',
			    'quote': '"',
			    'escape': '"',       
			    'comment': '',
			});
			var rows = [];
			var cnt = 0;
						
			reader.addListener('data', function(data) {
			    rows[cnt] = {};
			    rows[cnt] = data;
			    ++cnt;
			});
			reader.addListener('end', function(data) {
				var add = function(i) {
					if(i == rows.length) {
						fs.unlink(path, function() { //delete file from temporary location
							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.write('training centres created');
							res.end();
					    });
					} else {
						db.District.find({where: {name: rows[i]["District"]}}).success(function(district) {
							db.TrainingCentreLocation.findOrCreate({name: rows[i]["Centre"].trim(), DistrictId: district.id}).success(function(tcl, created) {
								add(++i);
							});
						});
					}
				};
				add(0);
			});
		};
		
		 
		var fullPath = req.files.csv.path;
	    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
		var ext = fullPath.substring(startIndex);
		if (ext.indexOf('\.') === 0 ) {
			ext = ext.substring(1);
		}
		fs.readFile(req.files.csv.path, function (err, data) {
			do_import_csv(req.files.csv.path);
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	upload_kerala_trainers: function(req, res) {
		db.Organization.findAll().success(function(organizations) {
			res.render('misc/upload_kerala_trainers', {organizations: organizations});
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	do_upload_kerala_trainers: function(req, res) {
		var do_import_csv = function(path) {
			var reader = ya_csv.createCsvFileReader(path, { columnsFromHeader: true }, {
			    'separator': ',',
			    'quote': '"',
			    'escape': '"',       
			    'comment': '',
			});
			var rows = [];
			var cnt = 0;
						
			reader.addListener('data', function(data) {
			    rows[cnt] = {};
			    rows[cnt] = data;
			    ++cnt;
			});
			reader.addListener('end', function(data) {
				db.Organization.find({where: {id: parseInt(req.param('OrganizationId'))}}).success(function(organization) {
					db.Role.findAll({where: {OrganizationId: organization.id}}).success(function(roles) {
						var do_get_role_id = function(val) {
							var id = -1;
							for(var x = 0; x < roles.length; x++) {
								if(roles[x].name == val) {
									id = roles[x].id;
									break;
								}
							}
							return id;
						};
						
						var get_role_id = function(role) {
							var pos = -1;
							switch(role) {
								case 'ATP' : 	pos = do_get_role_id('Accounting and Taxation Professional'); break;
								case 'MFA' : 	pos = do_get_role_id('Mutual Fund Agent'); break;
								case 'WD' : 	pos = do_get_role_id('Web Developer'); break;
								case 'SP' : 	pos = do_get_role_id('Software Developer'); break;
							}
							return pos;
						};
						
						var add = function(i) {
							if(i == rows.length) {
								fs.unlink(path, function() { //delete file from temporary location
									res.writeHead(200, {'Content-Type': 'text/plain'});
									res.write('kerala trainers created');
									res.end();
							    });
							} else {
								db.District.find({where: {name: rows[i]["District"]}}).success(function(district) {
									db.TrainingCentreLocation.find({where: ['name = ? AND "DistrictId" = ?', rows[i]["Centre"].trim(), district.id]}).success(function(tcl, created) {
										var n = rows[i]["Name"];
										n = n.replace(/[\.]+/g,' ');
										var result = n.split(' ');
										var last_name = [];
										var first_name = result[0];
										for(var x = 1; x < result.length; x++) {
											last_name.push(result[x]);
										}
										last_name = last_name.join(" ");
										
										var role_id = get_role_id(rows[i]["Role"]);
										
										if(rows[i]["Email"] != '') {
											var e = rows[i]["Email"].trim();
											db.User.findOrCreate({username: e}, {permission: 'trainer', first_name: first_name, last_name: last_name, password: rows[i]["Phone"], email: e, phone: rows[i]["Phone"], RoleId: role_id, OrganizationId: organization.id, isProfileCompleted: true, isTestTaken: true, isMetCoach: true}).success(function(user, created) {
												db.TrainerMappingToTcl.findOrCreate({TrainerId: user.id, TclId: tcl.id}).success(function(){
													add(++i);
												});
											});
										}
										else
											add(++i);
									});
								});
							}
						};
						add(0);
					});
				});
			});
		};
		
		 
		var fullPath = req.files.csv.path;
	    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
		var ext = fullPath.substring(startIndex);
		if (ext.indexOf('\.') === 0 ) {
			ext = ext.substring(1);
		}
		fs.readFile(req.files.csv.path, function (err, data) {
			do_import_csv(req.files.csv.path);
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	upload_batches: function(req, res) {
		db.Organization.findAll().success(function(organizations) {
			res.render('misc/upload_batches', {organizations: organizations});
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	do_upload_batches: function(req, res) {
		var do_import_csv = function(path) {
			var reader = ya_csv.createCsvFileReader(path, { columnsFromHeader: true }, {
			    'separator': ',',
			    'quote': '"',
			    'escape': '"',       
			    'comment': '',
			});
			var rows = [];
			var cnt = 0;
						
			reader.addListener('data', function(data) {
			    rows[cnt] = {};
			    rows[cnt] = data;
			    ++cnt;
			});
			reader.addListener('end', function(data) {
				db.Organization.find({where: {id: parseInt(req.param('OrganizationId'))}}).success(function(organization) {
					db.Role.findAll({where: {OrganizationId: organization.id}}).success(function(roles) {
						var do_get_role_id = function(val) {
							var id = -1;
							for(var x = 0; x < roles.length; x++) {
								if(roles[x].name == val) {
									id = roles[x].id;
									break;
								}
							}
							return id;
						};
						
						var get_role_id = function(role) {
							var pos = -1;
							switch(role) {
								case 'ATP' : 	pos = do_get_role_id('Accounting and Taxation Professional'); break;
								case 'MFA' : 	pos = do_get_role_id('Mutual Fund Agent'); break;
								case 'WD' : 	pos = do_get_role_id('Web Developer'); break;
								case 'SP' : 	pos = do_get_role_id('Software Developer'); break;
							}
							return pos;
						};
						
						var add = function(i) {
							if(i == rows.length) {
								fs.unlink(path, function() { //delete file from temporary location
									res.writeHead(200, {'Content-Type': 'text/plain'});
									res.write('batches created');
									res.end();
							    });
							} else {
								db.District.find({where: {name: rows[i]["District"]}}).success(function(district) {
									db.TrainingCentreLocation.find({where: ['name = ? AND "DistrictId" = ?', rows[i]["Centre"].trim(), district.id]}).success(function(tcl, created) {
										var role_id = get_role_id(rows[i]["Role"]);
										db.Batch.findOrCreate({name: rows[i]["Name"]}, {year: 2015, OrganizationId: organization.id, RoleId: role_id, TrainingCentreLocationId: tcl.id}).success(function(batch, created) {
											add(++i);
										});
									});
								});
							}
						};
						add(0);
					});
				});
			});
		};
		
		 
		fs.readFile(req.files.csv.path, function (err, data) {
			do_import_csv(req.files.csv.path);
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	upload_kerala_students: function(req, res) {
		db.Organization.findAll().success(function(organizations) {
			db.Role.findAll({order: 'id asc'}).success(function(roles) {
				db.Batch.findAll({order: 'id asc'}).success(function(batches) {
					res.render('misc/upload_kerala_students', {organizations: organizations, roles: roles, batches: batches});
				});
			});
		});
	},
	
	//used to upload kerala training data
	//csv format can be found in ISTARSkills/CSV github repo
	do_upload_kerala_students: function(req, res) {
		var do_import_csv = function(path) {
			var reader = ya_csv.createCsvFileReader(path, { columnsFromHeader: true }, {
			    'separator': ',',
			    'quote': '"',
			    'escape': '"',       
			    'comment': '',
			});
			var rows = [];
			var cnt = 0;
						
			reader.addListener('data', function(data) {
			    rows[cnt] = {};
			    rows[cnt] = data;
			    ++cnt;
			});
			reader.addListener('end', function(data) {
				var add = function(i) {
					if(i == rows.length) {
						fs.unlink(path, function() { //delete file from temporary location
							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.write('kerala students created');
							res.end();
					    });
					} else {
						var n = rows[i]["Name"];
						//n = n.replace(/[\.]+/g,' ');
						var result = n.split(' ');
						var last_name = [];
						var first_name = result[0];
						for(var x = 1; x < result.length-1; x++) {
							last_name.push(result[x]);
						}
						last_name = last_name.join(" ");
						
						var username = result[result.length-1];
						username = username.substring(1, username.length - 1);
						
						db.User.findOrCreate({username: username}, {permission: 'user', first_name: first_name, last_name: last_name, password: username, email: 'noreply@istarindia.com', RoleId: parseInt(req.param('RoleId')), OrganizationId: parseInt(req.param('OrganizationId')), isProfileCompleted: false, isTestTaken: true, isMetCoach: true}).success(function(user, created) {
							db.BatchUser.findOrCreate({UserId: user.id, BatchId: parseInt(req.param('BatchId'))}).success(function(){
								add(++i);
							});
						});
					}
				};
				add(0);
			});
		};
		
		 
		var fullPath = req.files.csv.path;
	    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
		var ext = fullPath.substring(startIndex);
		if (ext.indexOf('\.') === 0 ) {
			ext = ext.substring(1);
		}
		fs.readFile(req.files.csv.path, function (err, data) {
			do_import_csv(req.files.csv.path);
		});
	},
	
	//called from coordinator/schedule.ejs
	create_kerala_schedule: function(req, res) {
		db.Organization.findAll().success(function(organizations) {
			res.render('misc/create_kerala_schedule', {organizations: organizations});
		});
	},
	
	//called from coordinator/create_kerala_schedule.ejs
	do_create_kerala_schedule: function(req, res) {
		var do_import_csv = function(path) {
			var reader = ya_csv.createCsvFileReader(path, { columnsFromHeader: true }, {
			    'separator': ',',
			    'quote': '"',
			    'escape': '"',       
			    'comment': '',
			});
			var rows = [];
			var cnt = 0;
						
			reader.addListener('data', function(data) {
			    rows[cnt] = {};
			    rows[cnt] = data;
			    ++cnt;
			});
			reader.addListener('end', function(data) {
				var d = new Date();
				var d_string = d.toDateString();
				
				var add = function(i) {
					if(i == rows.length) {
						fs.unlink(path, function() { //delete file from temporary location
							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.write('kerala events created');
							res.end();
					    });
					} else {
						var n = rows[i]["Name"];
						var username = rows[i]["Email"].trim();
						
						db.User.find({where: {username: username}}).success(function(user) {
							db.Batch.find({where: {name: n}}).success(function(batch) {
								db.BatchUser.findAll({where: {BatchId: batch.id}}).success(function(bu) {
									var add_users = function(x, event_id) {
										if(x == bu.length) {
											add(++i);
										} else {
											db.EventUsers.findOrCreate({EventId: event_id, UserId: bu[x].UserId}).success(function(eu) {
												add_users(++x, event_id);
											});
										}
									};
									if(bu.length > 0) {
										db.Event.create({name: n+' '+d_string, InitiatorId: parseInt(req.user.id), ModeratorId: user.id, date: d, OrganizationId: parseInt(req.param('OrganizationId')), type: 'Class Training', status: 'Trainer Accepted Invite'}).success(function(event) {
											add_users(0, event.id);
										});
									} else
										add(++i);
								});
							});
						});
					}
				};
				add(0);
			});
		};
		
		 
		var fullPath = req.files.csv.path;
	    var startIndex = (fullPath.indexOf('\.') >= 0 ? fullPath.lastIndexOf('\.') : -1);
		var ext = fullPath.substring(startIndex);
		if (ext.indexOf('\.') === 0 ) {
			ext = ext.substring(1);
		}
		fs.readFile(req.files.csv.path, function (err, data) {
			do_import_csv(req.files.csv.path);
		});
	},
	
	//used for android app. called as a web service from the SMS android app
	//code can be found in github repo
	get_trainers: function(req, res) {
		db.User.findAll({order: 'id asc', limit : 5}).success(function(users){
			res.json(users);
		});
	},
	
	//used for android app. called as a web service from the SMS android app
	//code can be found in github repo
	get_districts: function(req, res) {
		db.District.findAll().success(function(districts) {
			res.json(districts);
		});
	},
	
	//used for android app. called as a web service from the SMS android app
	//code can be found in github repo
	get_courses: function(req, res) {
		db.Organization.find({where: {name: 'Asap Kerala'}}).success(function(org) {
			db.Role.findAll({where: {OrganizationId: org.id}, order: 'id desc', limit: 4}).success(function(roles) {
				res.json(roles);
			});
		});
	},
	
	//used for android app. called as a web service from the SMS android app
	//code can be found in github repo
	get_district_trainers: function(req, res) {
		db.Organization.find({where: {name: 'Asap Kerala'}}).success(function(org) {
			db.District.find({where: {name: req.param('district')}}).success(function(district){
				var query = 'select u.id, first_name, last_name, phone, r.name from "Users" u, "Roles" r, "TrainingCentreLocations" tcl, "TrainerMappingToTcls" tmtcl where tcl."DistrictId" = '+district.id+' and tmtcl."TrainerId" = u.id and tcl.id = tmtcl."TclId" and u."RoleId" = r.id and u."OrganizationId" = '+org.id;
				db.sequelize.query(query, null, {raw: true}).success(function(users){
					res.json(users);
				});
			});
		});
	},
	
	//used for android app. called as a web service from the SMS android app
	//code can be found in github repo
	get_course_trainers: function(req, res) {
		db.Organization.find({where: {name: 'Asap Kerala'}}).success(function(org) {
			var role_name = 'Software Developer';
			switch(req.param('role')) {
				case 'SP': role_name = 'Software Developer'; break;
				case 'WD': role_name = 'Web Developer'; break;
				case 'ATP': role_name = 'Accounting and Taxation Professional'; break;
				case 'MFA': role_name = 'Mutual Fund Agent'; break;
			}
			db.Role.find({where: ['name = ? and "OrganizationId" = ?', role_name, org.id]}).success(function(role) {
				var query = 'select u.id, first_name, last_name, phone, d.name from "Users" u, "Districts" d, "TrainingCentreLocations" tcl, "TrainerMappingToTcls" tmtcl where tcl."DistrictId" = d.id and tmtcl."TrainerId" = u.id and tcl.id = tmtcl."TclId" and u."RoleId" = '+role.id+' and u."OrganizationId" = '+org.id+' order by u.first_name asc';
				db.sequelize.query(query, null, {raw: true}).success(function(users){
					res.json(users);
				});
			});
		});
	}
};