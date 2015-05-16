$(document).ajaxStart(function(){
	$("#spinner").css("display","block");
	//$("#DimBg").css("display","block");
});
$(document).ajaxComplete(function(){
	$("#spinner").css("display","none");
	//$("#DimBg").css("display","none");
});

function search_users() { 
	var search = $('#search_text').val();
	 $.ajax({ 
	   url: '/users/search/'+search,
	   type: 'POST',
	   success: function(data){
	   	  $('#search_results_error').parent('div').hide();	
	      $('#user_list').html(data).addClass('in active').show();
	      $('#user_detail').removeClass('in active').hide();
	   }
	   , error: function(jqXHR, textStatus, err){
       $('#search_results_error').html(err).parent('div').show();
       }
     });
} 

function user_detail(val) {  
	
    $.ajax({ 
      url: '/users/detail/'+val,
      success: function(data){
      	 $('#search_results_error').parent('div').hide();	
         $('#user_detail').html(data).addClass('in active').show();
         $('#user_list').removeClass('in active').hide();
      }
      , error: function(jqXHR, textStatus, err){
          $('#search_results_error').html(err).parent('div').show();
      }
    });
}    
 
 function back() {
 	$(this).hide();
 	$('#user_list').addClass('in active').show();
 	$('#user_detail').removeClass('in active').hide();
 } 
 
 function change_test_tab(obj, className) {
	 if(className == null)
		 className = 'test_tab';
	 $('.'+className).removeClass('active');
	 $(obj).addClass('active');
 }
 
 function change_todo_tab(obj) {
	 $('.todo li').removeClass('active');
	 $(obj).addClass('active');
 }

function changeTab(obj, index, liClass, divClass) {
	$('.'+liClass).removeClass('active');
	$(obj).addClass('active');
	$('.'+divClass).removeClass('display_inline_block').addClass('display_none');
	$('#'+divClass+'_'+index).addClass('display_inline_block').removeClass('display_none');
}

function changeTab_btn(obj, index, liClass, divClass) {
	$('.'+liClass).removeClass('active');
	$(obj).addClass('active');
	$('.'+divClass).hide();
	$('#'+divClass+'_'+index).show();
}

function changeTab_ajax(obj, type, user_id, li_class, div_id) {
	$('.'+li_class).removeClass('active');
	$(obj).parent('li.'+li_class).addClass('active');
	var url;
	switch(type) {
		case 'roles': 
		case 'modules': url = '/hr_admin/list_'+type+'/'+user_id;
			break;
		default: url = '/hr_admin/'+type;
			break;
	}
	ajax_call(url, div_id);
}

function non_ajax_call(url) {
	window.location = url;
}

function modal_ajax_call(url, div_id, e) { 
	e = e || window.event;
    
    if(e != null) {
	    e = e.target || e.srcElement;
	    $(e).attr('data-target', '#uide4b3dde6bb5097375d99eb18a83d7146');
	}
	ajax_call(url, div_id);
}

function ajax_call(url, div_id, e) { 
	var element = null; 
	
	e = e || window.event;
    
    if(e != null) {
	    e = e.target || e.srcElement;
	    var $this = $(e); 
	    
	    if($this.attr('data-target') != null) {
	   		element = $this.attr('data-target');
	   	}
	}
    
	$.ajax({ 
	   url: url,
	   success: function(data){
		   if(div_id != null && div_id != '' && div_id != 'null') {
			   	$('#'+div_id).html(data);
			   	
			   	if(element != null) {
			    	compute_modal_height(element);	
			    }
		   }
	   }
	});
}

function compute_modal_height(element) { 
	//var doc_height = $(document).height();
	var height = $(element+' .modal-dialog').outerHeight(); 
	height = height > 0 ? -(height/2+25) : -260;
	$(element).css('margin-top',height+'px');
	$(element).css('top', 50+'%');
}

function view_skills(role_id, div_id) {
	var url = '/skill/view_skills/'+role_id;
	$('#'+div_id).show();
	ajax_call(url, div_id);$('.DimBg').show();
}

function add_skill(coach_id, user_id, div_id) {
	var url = '/coach/add_skill/'+coach_id+'/'+user_id;
	$('#'+div_id).show();
	ajax_call(url, div_id);$('.DimBg').show();
}

function hide_div(div_id) {
	$('#'+div_id).hide();
}

function hide_class(class_name) {
	$('.'+class_name).hide();
}

function show_class(class_name) {
	$('.'+class_name).show();
}

function show_id(id) {
	$('#'+id).show();
}

function do_add_skill(coach_id, user_id, id, div_id) {
	var url = '/coach/do_add_skill/'+coach_id+'/'+user_id+'/'+$('#'+id).val();
	$('#'+div_id).show();
	ajax_call(url, div_id);
}

function opentok(id_iframe) {
	$("#"+id_iframe).attr("src","/opentok/show");
	$('#opentok').show();
	//$("#connect").hide();
	$("#end").show();
}

function disconnect() {
	$("#opentok").attr("src","");
	$("#opentok_first").hide();
	$("#opentok_second").show();
}

function remove_attr(id,attr_name) {
	$("#"+id).attr(attr_name,"");
}

function coach_rating(coach_id, user_id, skill_id, rating, div_id) {
	var url = '/coach/'+coach_id+'/user/'+user_id+'/skill/'+skill_id+'/'+rating;
	ajax_call(url, div_id);
}

function user_skills(coach_id, user_id, div_id) {
	var url = '/coach/user_skills/'+coach_id+'/'+user_id;
	ajax_call(url, div_id);
	hide_div('add_skill_div');
	hide_class('DimBg');
}

function change_password(user_id, div_id) {
	var url = '/users/change_password_ajax/'+user_id;
	$('#'+div_id).show();$('.DimBg').show();
	ajax_call(url, div_id);
}

function panel(val) {
	if(val == 'hide') {
		hide_div('skills_panel');
		$('#video_panel').css('width','100%');
		hide_div('hide_panel');
		show_id('show_panel');
	}else {
		show_id('skills_panel');
		$('#video_panel').css('width','50%');
		hide_div('show_panel');
		show_id('hide_panel');
	}
}

function add_tag(val_id) {
	var tag_name = $('#'+val_id).val();
	ajax_call('/content/add_tag/'+tag_name, 'tags');
}

function add_content_tag(c_id) {
	var tag_name = $('#tag_name').val();
	ajax_call('/content/add_content_tag/'+c_id+'/'+tag_name, 'content-admin-display');
}

function reset_module(user_id, skill_id, div_id) {
	var module_id = $('#ModuleId').val();
	var url = '/coach/do_reset_module/'+user_id+'/'+skill_id+'/'+module_id;
	ajax_call(url, div_id);
	hide_div('opentok');
	hide_class('DimBg');
}

function delete_user_skill(user_id, skill_id, div_id) {
	if(confirm('Are you sure?')) 
		ajax_call('/coach/delete_user_skill/'+user_id+'/'+skill_id, div_id);
}

function show_preview(id, val, display) {
	var content_id = $('#'+id).val();
	if(content_id == '') alert('Please select a content to preview');
	else {
		$("body").append('<div class="modal-backdrop fade in"></div>');
        $('body').addClass('modal-open');
		$('#uide4b3dde6bb5097375d99eb18a83d7146').addClass("in");
		$('#uide4b3dde6bb5097375d99eb18a83d7146').show();
		
		display = display != null ? display : 'true';
		modal_ajax_call('/content/show_preview/'+content_id+'/'+val+'/'+id+'/'+display, 'uide4b3dde6bb5097375d99eb18a83d7146');
		compute_modal_height('#uide4b3dde6bb5097375d99eb18a83d7146');
	}
}

function build_module_content_playlist(id, val) {
	var content_id = $('#'+id).val();
	if(content_id == '') alert('Please select a content to add to the playlist');
	else {
		var module_id = $('#module_id').val();
		ajax_call('/content/build_module_playlist/'+module_id+'/'+content_id,'div_playlist');
		/*var ajax_func = function(module_id, content_name) {
			window.location = '/content/build_module_playlist/'+module_id+'/'+content_name;
		};
		
		if(val == '0') { //first time
			var module_name = $('#name').val();
			var description = $('#description').val();
			if(module_name == '') {alert('Please enter the module name before building the playlist!');}
			else {
				$.ajax({ 
				   url: '/content/do_create_module_ajax/'+module_name+'/'+description,
				   success: function(data){
					   var content_name = $('#search').val();
					   	ajax_func(data.id, content_name);
				   }
				});
			}
		} else {
			var content_name = $('#'+id).val();
			if(content_name == '' || content_name == null || content_name == 'null') content_name = $('#'+id).text();
			var id = $('#module_id').val();
		   	ajax_func(id, content_name);
		}*/
	}
}

function add_user_to_event(id, val) {
	var ajax_func = function(event_id, user_id) {
		window.location = '/hr_admin/add_user_to_event/'+event_id+'/'+user_id;
	};
	if(val == '0') { //first time
		var event_name = $('#name').val();
		var description = $('#description').val();
		if(event_name == '') {alert('Please enter the event name before adding users!');}
		else {
			$.ajax({ 
			   url: '/hr_admin/do_create_event_ajax',
			   type: 'POST',
			   data: {name: event_name, description: description, date: $('#date').val(), InitiatorId: $('#InitiatorId').val(), ModeratorId: $('#ModeratorId').val(), OrganizationId: $('#OrganizationId').val()},
			   success: function(data){
				   ajax_func(data.id, id);
			   }
			});
		}
	} else {
		ajax_func($('#event_id').val(), id);
	}	
}

function invite_trainer_to_event(id, val) {
	var ajax_func = function(event_id, user_id) {
		window.location = '/hr_admin/invite_trainer_to_event/'+event_id+'/'+user_id;
	};
	if(val == '0') { //first time
		var event_name = $('#name').val();
		var description = $('#description').val();
		if(event_name == '') {alert('Please enter the event name before inviting trainers!');}
		else {
			$.ajax({ 
			   url: '/hr_admin/do_create_event_ajax',
			   type: 'POST',
			   data: {name: event_name, description: description, status: $('#status').val(), date: $('#date').val(), time: $('#time').val(), location: $('#location').val(),InitiatorId: $('#InitiatorId').val(), ModeratorId: id, OrganizationId: $('#OrganizationId').val()},
			   success: function(data){
				   ajax_func(data.id, id);
			   }
			});
		}
	} else {
		ajax_func($('#event_id').val(), id);
	}	
}

function show_preview_module(id, val, display) {
	var module_id = $('#'+id).val();
	if(module_id == '') alert('Please select a module to preview');
	else {
		$("body").append('<div class="modal-backdrop fade in"></div>');
        $('body').addClass('modal-open');
		$('#uide4b3dde6bb5097375d99eb18a83d7146').addClass("in");
		$('#uide4b3dde6bb5097375d99eb18a83d7146').show();
		
		display = display != null ? display : 'true';
		modal_ajax_call('/content/show_preview_module/'+module_id+'/'+val+'/'+id+'/'+display, 'uide4b3dde6bb5097375d99eb18a83d7146');
		compute_modal_height('#uide4b3dde6bb5097375d99eb18a83d7146');
	}
}

function build_skill_playlist(val, disp) {
	var module_id = $('#'+val).val();
	if(module_id == '') alert('Please select a module to add to the playlist');
	
	else {
		var id = $('#skill_id').val();
		ajax_call('/content/build_skill_playlist/'+id+'/'+module_id,'div_playlist');
	}
}

function submit_form(id) {
	document.getElementById(id).submit();
}

function ajax_load(obj, option, val) {
	var id =  $(obj).val();
	ajax_call('/content/ajax_load/'+option+'/'+id+'/'+val, option);
}

function ajax_filter_users(obj, option, val) {
	var id =  $(obj).val();
	ajax_call('/hr_admin/ajax_filter_users/'+option+'/'+id+'/'+val, 'content');
}

function ajax_filter_users_skill(obj, val) {
	var id =  $(obj).val();
	ajax_call('/hr_admin/ajax_filter_users_skills/'+id+'/'+val, 'content');
}

function ajax_filter_users_role(obj, val) {
	var id =  $(obj).val();
	ajax_call('/hr_admin/ajax_filter_users_roles/'+id+'/'+val, 'content');
}

function ajax_filter_job_users_skill(obj, val,job_id) {
	var id =  $(obj).val();
	ajax_call('/recruiter/ajax_filter_job_users_skills/'+id+'/'+val+'/'+job_id, 'content');
}

function ajax_filter_job_users_role(obj, val, job_id) {
	var id =  $(obj).val();
	ajax_call('/recruiter/ajax_filter_job_users_roles/'+id+'/'+val+'/'+job_id, 'content');
}

function get_skills_from_skill_group(obj, role_id) {
	var skill_group_id = $(obj).val();
	ajax_call('/hr_admin/get_skills_from_skill_group/'+skill_group_id+'/'+role_id,'skill-group-div');
}

function show_content_preview() {
	var show = function(filename) {
		$.ajax({ 
		   url: '/content/show_content_preview_before_upload',
		   type: 'POST',
		   data: {filename: filename},
		   success: function(data){
			   $("body").append('<div class="modal-backdrop fade in"></div>');
		        $('body').addClass('modal-open');
				$('#uide4b3dde6bb5097375d99eb18a83d7146').addClass("in");
				$('#uide4b3dde6bb5097375d99eb18a83d7146').show();
				$('#uide4b3dde6bb5097375d99eb18a83d7146').html(data);
				compute_modal_height('#uide4b3dde6bb5097375d99eb18a83d7146');
		   }
		});
	};
	
	var filename = ($('#path').val() != null && $('#path').val() != '') ? $('#path').val() : '';
	if(filename != null && filename != '') {
		var index = filename.search("youtube");
		if(index > -1) {
			index = filename.search("embed");
			if(index > -1) show(filename);
			else {
				var startIndex = (filename.indexOf('=') >= 0 ? filename.lastIndexOf('=') : -1);
				var id = filename.substring(startIndex);
				if (id.indexOf('=') === 0 ) {
					id = id.substring(1);
				}
				filename = 'https://youtube.com/embed/'+id;
				$('#path').val(filename);
				show(filename);
			}
		}else {
			show(filename);
		}
	}else {
		alert("Please enter the file path to preview");
	}
	
}

function disable(id) {
	$('#'+id).attr('disabled', true);
}
 
function enable(id) {
	$('#'+id).attr('disabled', false);
}

function reset_test(test_id, user_id) {
	$('#wrong-password-message').hide();
	var pass = $('#password').val();
	if(pass != 'admin123') {
		$('#wrong-password-message').show();
	} else {
		non_ajax_call('/content/do_reset_test/'+test_id+'/'+user_id);
	}
}

function do_add_answer(question_id) {
	var isAnswer, isMultiMedia;
	if($('#isAnswer').is(':checked')) {
		isAnswer = true;
	}
	if($('#isMultiMedia').is(':checked')) {
		isMultiMedia = true;
	}
	$.ajax({ 
	   url: '/content/do_add_answer',
	   type: 'POST',
	   data: {text: $('#text').val(), whatAnswerIndicates: $('#whatAnswerIndicates').val(), isAnswer: isAnswer, isMultiMedia: isMultiMedia, ProblemId: question_id},
	   success: function(data){
		   $('#modal_preview').html(data);
	   }
	});
}

function do_add_test(id, val) {
	var test_id = $('#test_id').val();
	ajax_call('/content/do_add_test/'+id+'/'+test_id+'/'+val,'content-admin-display');
}

function add_problem_tag(problem_id) {
	var tag_name = $('#tag_name').val();
	//non_ajax_call('/content/add_problem_tag/'+problem_id+'/'+tag_name);
	ajax_call('/content/add_problem_tag/'+problem_id+'/'+tag_name,'content-admin-display');
}

function add_problem_tag_ajax(problem_id, test_id) {
	var tag_name = $('#tag_name').val();
	ajax_call('/content/add_problem_tag_ajax/'+problem_id+'/'+tag_name+'/'+test_id, 'uide4b3dde6bb5097375d99eb18a83d7146');
}

function do_add_question_to_test(test_id) {
	var question_id = $('#tag_name_id').val();
	ajax_call('/content/do_add_question_to_test/'+test_id+'/'+question_id,'content-admin-display');
}

function do_edit_test_pass_score(test_id) {
	var pass_score = $('#score').val();
	pass_score = pass_score != null && pass_score != 'null' && pass_score != '' ? pass_score : 0;
	ajax_call('/content/do_edit_test_pass_score/'+pass_score+'/'+test_id, 'test_pass_score');
}

function do_edit_test_mandatory_question(test_id) {
	var option = $('#mandatory_question').val();
	ajax_call('/content/do_edit_test_mandatory_question/'+option+'/'+test_id, 'test_mandatory_question');
}

/*var timer, seconds_timer;

function set_time_interval_function() {
	timer = setInterval(function(){
		decrement_duration();
	}, 60000);
	seconds_timer = setInterval(function(){
		increment_duration();
	}, 1000);
}

function increment_duration() {
	var duration = parseInt($('#seconds_counter').text());
	++duration;
	$('#seconds_counter').text(duration);
}

function decrement_duration() {
	var duration = parseInt($('#test_duration').text());
	--duration;
	if(duration == 0) {
		clearInterval(timer);
		ajax_call('/content/force_end_test/'+$('#test_id').val()+'/'+$('#skill_id').val(),'uide4b3dde6bb5097375d99eb18a83d7146');
	} else {
		$('#test_duration').text(duration);
	}
}*/
var sec_timer;
var set_time_interval_function = function() {
	sec_timer = setInterval(function(){
		decrement_sec_duration();
	}, 1000);
	
	var decrement_sec_duration = function() {
		var sec = parseInt($('#sec_duration').text());
		var min;
		if(sec == 0) {
			sec = 60;
			min = parseInt($('#test_duration').text());
			$('#test_duration').text(--min);
		}
		--sec;
		if(sec < 10)
			sec = '0'+sec;
		$('#sec_duration').text(sec);
		if(min == 0) {
			clearInterval(sec_timer);
			ajax_call('/content/force_end_test/'+$('#test_id').val()+'/'+$('#skill_id').val(),'uide4b3dde6bb5097375d99eb18a83d7146');
		}
	};
};

function clear_test_timer() {
	clearInterval(sec_timer);
}

function answer_form_submit() {
	var old_time = parseInt($('#timeToAnswer').val()); 
	
	var oldSecondDuration = $('#oldSecondDuration').val(); 
	var old_second_time = oldSecondDuration != null && oldSecondDuration != '' && oldSecondDuration != 'null' ? parseInt(oldSecondDuration) : 60;
	if(old_second_time == 0)
		old_second_time = 60;
		
	var new_time = parseInt($('#test_duration').text()); 
	var new_second_time = parseInt($('#sec_duration').text()); 
	
	/*
	var timeToAnswer = 0;
	timeToAnswer = old_second_time - new_second_time; 
	if(timeToAnswer < 0)
		timeToAnswer = -timeToAnswer;
		
	var minutes_time = old_time - new_time;
	if(minutes_time > 0)
		timeToAnswer = minutes_time * 60 + timeToAnswer;
	*/
	
	var os = old_time * 60 + old_second_time;
	var ns = new_time * 60 + new_second_time;
	var timeToAnswer = os - ns;
	
	$('#timeToAnswer').val(timeToAnswer);
	$('#oldDuration').val(new_time);
	$('#oldSecondDuration').val(new_second_time);
	
	clearInterval(sec_timer);
	
	submit_form('answer_submit_form');
}

function toggle_trainer_test(obj) {
	var select = $(obj).val();
	$('#search_trainer_div').hide();
	$('#search_test_div').hide();
	switch(select) {
		case 'Test': 	$('#search_test_div').show();
						break;
		case 'Meeting': $('#search_trainer_div').show();
						break;
	}
}

function show_monthly_login_graph(obj) {
	var month = $(obj).val();
	switch(month) {
		case 'January': 	month = '01'; break;
		case 'February': 	month = '02'; break;
		case 'March':		month = '03'; break;
		case 'April':		month = '04'; break;
		case 'May':			month = '05'; break;
		case 'June':		month = '06'; break;
		case 'July':		month = '07'; break;
		case 'August':		month = '08'; break;
		case 'September':	month = '09'; break;
		case 'October':		month = '10'; break;
		case 'November':	month = '11'; break;
		case 'December':	month = '12'; break;
	}
	ajax_call('/hr_admin/show_monthly_login_graph/'+month,'uid83974b3d0401cd98df971622447c4874');
}

function show_role_skill_report(obj, oid) {
	var role = $(obj).val();
	ajax_call('/hr_admin/show_role_skill_report/'+role+'/'+oid,'role-report');
}

function show_current_monthly_login_graph() {
	var date = new Date();
	var month = date.getMonth();
	month = month < 9 ? '0'+(month+1) : ''+(month+1);
	ajax_call('/hr_admin/show_monthly_login_graph/'+month,'uid83974b3d0401cd98df971622447c4874');
}

function show_quarterly_login_graph(obj) {
	var quarter = $(obj).val();
	ajax_call('/hr_admin/show_quarterly_login_graph/'+quarter,'login_dashboard');
}

function role_filter_users(obj) {
	var role = $(obj).val();
	ajax_call('/hr_admin/role_filter_users/'+role,'role-filter');
}

function listUsersByOrg(obj) {
	var org = $(obj).val();
	non_ajax_call('/users/listByOrganization/'+org);
}

function replace_coach(obj, uid) {
	var coach_id = $(obj).val();
	ajax_call('/hr_admin/do_replace_coach/'+uid+'/'+coach_id,'replace-coach');
}

function replace_role(obj, uid) {
	var role_id = $(obj).val();
	ajax_call('/hr_admin/do_replace_role/'+uid+'/'+role_id,'replace-role');
}

function searchByField(val) {
	var url = '';
	var search = $('#search').val();
	if(val == 'tag') {
		url = '/content/list_content_by_tags/'+search;
	}
	else if(val == 'title') {
		url = '/content/list_content_by_titles/'+search;
	}
	else if(val == 'module') {
		url = '/content/list_content_by_modules/'+search;
	}
	else if(val == 'skill') {
		url = '/content/list_content_by_skills/'+search;
	}
	ajax_call(url, 'content-admin-display');
}

function searchByFieldModule(val) {
	var url = '';
	var search = $('#search').val();
	if(val == 'title') {
		url = '/content/list_module_by_titles/'+search;
	}
	else if(val == 'skill') {
		url = '/content/list_module_by_skills/'+search;
	}
	ajax_call(url, 'content-admin-display');
}

function mark_attendance(obj, user_id) {
	var status;
	if($(obj).is(':checked')) {
		status = 'present';
	} else {
		status = 'absent';
	}
	alert(status);
	ajax_call('/misc/mark_attendance/'+user_id+'/'+status,'');
} 

/* SLIDESHOW START*/
var slideshow_counter = 0;
var slideshow_timer;
(function() {
	slideshow_timer = setInterval(function(){
		start_slideshow(slideshow_counter);
	}, 10000);
	
	var start_slideshow = function(counter) {
		$('.captionable-front-padded').hide();
		if(slideshow_counter > 2)
			slideshow_counter = 0;
		$('.captionable-front-padded-'+slideshow_counter).show();
		slideshow_counter++;
	};
}());

function start_slideshow() {
	slideshow_timer = setInterval(function(){
		start_slideshow(slideshow_counter);
	}, 10000);
	
	var start_slideshow = function(counter) {
		$('.captionable-front-padded').hide();
		if(slideshow_counter > 2)
			slideshow_counter = 0;
		$('.captionable-front-padded-'+slideshow_counter).show();
		slideshow_counter++;
	};
}

function clear_interval() {
	clearInterval(slideshow_timer);
}

function show_col_md_3_panel(obj, val) {
	$('.col-md-3-panel').hide();
	var i;
	var start = parseInt(val)*4 - 3;
	var end = parseInt(val)*4;
	for(i = start; i <= end; i++) {
		if($('#col-md-3-panel-'+i).length > 0) { 
			$('#col-md-3-panel-'+i).show();
		}
	}
	$('.skill-pagination-badge').removeClass('badge-success');
	$('.skill-pagination-badge').removeClass('badge-default');
	$('.skill-pagination-badge').addClass('badge-default');
	$(obj).removeClass('badge-default');
	$(obj).addClass('badge-success');
}
/* END SLIDESHOW */

function mark_active_td(val) {
	$('.test-detail-table td').removeClass('rd-td-border-right');
	$('.rd-td').removeClass('active');
	$('.rd-td-'+val).addClass('active');
	$('.rd-td-'+val).prev().addClass('rd-td-border-right');
}

function mark_active_tr(val) {
	$('.question-analytics-table td').removeClass('active-default');
	$('.question-analytics-table td.rd-td-'+val).addClass('active-default');
}

function mark_active_td_role_filter_user(val) {
	$('.role-filter-users td').removeClass('active-td-role-filter-users');
	$('.role-filter-users-'+val+' td').addClass('active-td-role-filter-users');
}

function nav_prev(curr, total, val) {
	switch(val) {
		case 'job_test':	
			if(curr > 1) {
				$('.job-test-table').hide();
				--curr;
				$('.job-test-table-'+curr).show();
				$('#job_test_count').text(curr);
				$('#job_test_prev').html('<i class="icm icm-arrow-left" onclick="nav_prev('+curr+','+total+',\'job_test\')"></i>');
				$('#job_test_next').html('<i class="icm icm-arrow-right2" onclick="nav_next('+curr+','+total+',\'job_test\')"></i>');
			}
			break;
			
		case 'job_interview':	
			if(curr > 1) {
				$('.job-interview-table').hide();
				--curr;
				$('.job-interview-table-'+curr).show();
				$('#job_interview_count').text(curr);
				$('#job_interview_prev').html('<i class="icm icm-arrow-left" onclick="nav_prev('+curr+','+total+',\'job_interview\')"></i>');
				$('#job_interview_next').html('<i class="icm icm-arrow-right2" onclick="nav_next('+curr+','+total+',\'job_interview\')"></i>');
			}
			break;
			
		case 'job_selection':	
			if(curr > 1) {
				$('.job-selection-table').hide();
				--curr;
				$('.job-selection-table-'+curr).show();
				$('#job_selection_count').text(curr);
				$('#job_selection_prev').html('<i class="icm icm-arrow-left" onclick="nav_prev('+curr+','+total+',\'job_selection\')"></i>');
				$('#job_selection_next').html('<i class="icm icm-arrow-right2" onclick="nav_next('+curr+','+total+',\'job_selection\')"></i>');
			}
			break;
			
		case 'job_event':	
			if(curr > 1) {
				$('.job-event-table').hide();
				--curr;
				$('.job-event-table-'+curr).show();
				$('#job_event_count').text(curr);
				$('#job_event_prev').html('<i class="icm icm-arrow-left" onclick="nav_prev('+curr+','+total+',\'job_event\')"></i>');
				$('#job_event_next').html('<i class="icm icm-arrow-right2" onclick="nav_next('+curr+','+total+',\'job_event\')"></i>');
			}
			break;
							
	}
}

function nav_next(curr, total, val) {
	switch(val) {
	case 'job_test':	
		if(curr < total) {
			$('.job-test-table').hide();
			++curr;
			$('.job-test-table-'+curr).show();
			$('#job_test_count').text(curr);
			$('#job_test_prev').html('<i class="icm icm-arrow-left" onclick="nav_prev('+curr+','+total+',\'job_test\')"></i>');
			$('#job_test_next').html('<i class="icm icm-arrow-right2" onclick="nav_next('+curr+','+total+',\'job_test\')"></i>');
		}
		break;
					
	case 'job_interview':	
		if(curr < total) {
			$('.job-interview-table').hide();
			++curr;
			$('.job-interview-table-'+curr).show();
			$('#job_interview_count').text(curr);
			$('#job_interview_prev').html('<i class="icm icm-arrow-left" onclick="nav_prev('+curr+','+total+',\'job_interview\')"></i>');
			$('#job_interview_next').html('<i class="icm icm-arrow-right2" onclick="nav_next('+curr+','+total+',\'job_interview\')"></i>');
		}
		break;
		
	case 'job_selection':	
		if(curr < total) {
			$('.job-selection-table').hide();
			++curr;
			$('.job-selection-table-'+curr).show();
			$('#job_selection_count').text(curr);
			$('#job_selection_prev').html('<i class="icm icm-arrow-left" onclick="nav_prev('+curr+','+total+',\'job_selection\')"></i>');
			$('#job_selection_next').html('<i class="icm icm-arrow-right2" onclick="nav_next('+curr+','+total+',\'job_selection\')"></i>');
		}
		break;
		
	case 'job_event':	
		if(curr < total) {
			$('.job-event-table').hide();
			++curr;
			$('.job-event-table-'+curr).show();
			$('#job_event_count').text(curr);
			$('#job_event_prev').html('<i class="icm icm-arrow-left" onclick="nav_prev('+curr+','+total+',\'job_event\')"></i>');
			$('#job_event_next').html('<i class="icm icm-arrow-right2" onclick="nav_next('+curr+','+total+',\'job_event\')"></i>');
		}
		break;
}
}

function search_user_hr() {
	var val = $('#search').val();
	setTimeout(function(){
		ajax_call('/users/search/'+val, 'turbo-content-open-id');
	}, 5);
}

function checkEmail(val) {
	var pattern = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	if (pattern.test(document.getElementById(val).value)) {
	  return true;
	}
	return false;
}

function doCreateUserProfile() { 
	var first_name = $('#first_name').val();
	
	var pattern = /^[A-Z a-z]+$/;
	
	if(!pattern.test(first_name)) {
		$('#first-name-msg').show();
		$('#email-msg').hide();
	}
	else if(!checkEmail('email')) {
		$('#email-msg').show();
		$('#first-name-msg').hide();
	}
	else
		submit_form('do_create_user_profile');
}

function donothing() {
	alert('hello');
}

function username_check(obj) {
	$('.form-message-div').hide();
	$('.form-message-span').text();
	if(checkEmail('username')) {
		$.ajax({ 
		   url: '/hr_admin/check_username/'+$(obj).val(),
		   success: function(data){
			   if(data == 'Valid username') {
				   $('#form-message-span-success').text('Valid username');
				   $('#form-message-div-success').show();	
			   } else {
				   $('#form-message-span-danger').text(data);
				   $('#form-message-div-danger').show();	
			   }
		   }
		});
	} else {
		$('#form-message-span-danger').text('Invalid username');
		$('#form-message-div-danger').show();
	}
}

function create_user() {
	if($('#form-message-span-success').text() != 'Valid username') {
		alert('Please enter a valid username');
	} else { 
		var username = $('#username').val();
		var role_id = $('#roleId').val();
		var organization_id = $('#organizationId').val();
		var permission = $('input[name="type"]:checked').val(); 
		$.ajax({ 
		   url: '/hr_admin/create_user',
		   type: 'POST',
		   data: {username: username, password: username, permission: permission, email: username, RoleId: role_id, OrganizationId: organization_id},
		   success: function(data){
			   $('.form-message-div').hide();
			   $('.form-message-span').text();
			   if(data == 'User created successfully') {
				   $('#form-message-span-success-main').text(data);
				   $('#form-message-div-success-main').show();	
			   } else {
				   $('#form-message-span-danger-main').text(data);
				   $('#form-message-div-danger-main').show();	
			   }
		   }
		});
	}
}

function create_role(oid) {
	var role_name = $('#role-name').val();
	ajax_call('/hr_admin/do_create_role/'+role_name+'/'+oid,'turbo-content-open-id');
	
}

function add_pre_test(rid) {
	var test_name = $('#test-name').val();
	ajax_call('/hr_admin/do_add_pre_test/'+test_name+'/'+rid,'role-skills-div');
}

function manage_roles_opacity(obj) {
	$('.manage-roles-panel').css('opacity',1);
	$(obj).closest('.manage-roles-panel').css('opacity',0.65);
}

function change_wizard_step(val) {
	$('#wizard-step-'+val).find('.badge').removeClass('badge-primary');
	$('#wizard-step-'+val).find('.badge').addClass('badge-success');
	$('#wizard-step-'+val).find('.tooltip').css('visibility','hidden');
	
	if(val != 3) {
		val++;
		$('#wizard-step-'+val).find('.badge').removeClass('badge-default');
		$('#wizard-step-'+val).find('.badge').addClass('badge-primary');
		$('#wizard-step-'+val).find('.tooltip').css('visibility','visible');
	}
	
}

function create_test_event(obj, val, test_name, initiator_id, organization_id, type) {
	var event_id = $('#event-id').val();
	if(event_id != '') {
		ajax_call('/hr_admin/edit_test_event/'+event_id+'/'+encodeURIComponent(test_name),'');
		mark_active_td_role_filter_user(val);
	} else {
		var date = new Date();
		var name = 'Test-'+test_name+'-'+date.getDate()+'-'+(date.getMonth()+1)+'-'+date.getFullYear();
		$.ajax({ 
		   url: '/hr_admin/do_create_event_ajax',
		   type: 'POST',
		   data: {name: name, type: type,InitiatorId: initiator_id, OrganizationId: organization_id, Test_Name: test_name},
		   success: function(data){
			   $('#event-id').val(data.id);
			   mark_active_td_role_filter_user(val);
			   change_wizard_step(1);
			   ajax_call('/hr_admin/assign_users_to_event/'+data.id+'/test','assign-users');
		   }
		});
	}
}

function get_selected_checkbox_values(className) {
	var obj = {
		str : '',
		count : 0	
	};
	$("."+className).each(function() {
		if(this.checked) {
			obj.str = obj.str + $(this).val() + ',';
			obj.count++;
		}
	});
	return obj;
}

function get_role_filter_checkbox_values(val) {
	var obj = get_selected_checkbox_values('role-filter-checkbox');
	var event_id = $('#event-id').val();
	if(obj.count == 0)
		alert('Please select atleast one role');
	else if(event_id == '')
		alert('Invalid event');
	else {
		ajax_call('/hr_admin/filter_users_for_event_on_role/'+obj.str+'/'+event_id+'/'+val,'role-filter');
		ajax_call('/hr_admin/get_skills_based_on_role_filter/'+obj.str+'/'+val,'filter-dropdown-skills');
		ajax_call('/hr_admin/get_batches_based_on_role_filter/'+obj.str+'/'+val,'filter-dropdown-batches');
	}
}

function get_skill_filter_checkbox_values(val) {
	var obj = get_selected_checkbox_values('skill-filter-checkbox');
	var obj1 = get_selected_checkbox_values('role-filter-checkbox');
	var event_id = $('#event-id').val();
	if(obj.count == 0)
		alert('Please select atleast one skill');
	else if(event_id == '')
		alert('Invalid event');
	else {
		if(obj1.str == '')
			obj1.str = ',';
		ajax_call('/hr_admin/filter_users_for_event_on_skill/'+obj.str+'/'+obj1.str+'/'+event_id+'/'+val,'role-filter');
	}
}

function get_batch_filter_checkbox_values(val) {
	var obj = get_selected_checkbox_values('skill-filter-checkbox');
	var obj1 = get_selected_checkbox_values('role-filter-checkbox');
	var obj2 = get_selected_checkbox_values('batch-filter-checkbox');
	var event_id = $('#event-id').val();
	if(obj2.count == 0)
		alert('Please select atleast one batch');
	else if(event_id == '')
		alert('Invalid event');
	else {
		if(obj2.str == '')
			obj2.str = ',';
		ajax_call('/hr_admin/filter_users_for_event_on_batch/'+obj2.str+'/'+obj1.str+'/'+event_id+'/'+val,'role-filter');
	}
}

function check_all(obj, checkbox_class) {
	if($(obj).is(':checked')) { 
		$("."+checkbox_class).prop('checked',true);
	}
	else { 
		$("."+checkbox_class).prop('checked',false);
	}
}

function add_single_user_to_event(user_id, val) {
	var obj = {
		str : '',
		count : 0	
	};
	obj.str = obj.str + user_id + ',';
	obj.count++;
	do_add_users_to_event(obj, val);
}

function do_add_users_to_event(obj, val) {
	var event_id = $('#event-id').val();
	$.ajax({ 
	   url: '/hr_admin/add_users_to_event/'+obj.str+'/'+event_id,
	   success: function(data){
		   var obj1 = get_selected_checkbox_values('skill-filter-checkbox');
		   var obj2 = get_selected_checkbox_values('role-filter-checkbox');
		   if(obj1.count == 0) {
			   if(obj2.count == 0) {
				   alert('Users added to event');
			   } else {
				   ajax_call('/hr_admin/filter_users_for_event_on_role/'+obj2.str+'/'+event_id+'/'+val,'role-filter');
				   ajax_call('/hr_admin/get_skills_based_on_role_filter/'+obj2.str+'/'+val,'filter-dropdown-skills');
			   }
		   } else {
			   if(obj2.str == '')
				   obj2.str = ',';
			   ajax_call('/hr_admin/filter_users_for_event_on_skill/'+obj1.str+'/'+obj2.str+'/'+event_id+'/'+val,'role-filter');
			}
		   if(val == 'test') {
			   ajax_call('/hr_admin/show_test_event_name_desc/'+event_id,'event-name-desc');
			   change_wizard_step(2);
		   }
		   $('#event-done-btn').show();
	   }
	});
}

function add_users_to_event(val) {
	var event_id = $('#event-id').val();
	var obj = get_selected_checkbox_values('user-checkbox');
	if(obj.count == 0)
		alert('Please select atleast one user');
	else if(event_id == '') {
		alert('Invalid event');
	}else {
		do_add_users_to_event(obj, val);
	}
}

function do_edit_event_field(id, val, event_id, div_to_replace) {
	var field = $('#'+id).val();
	ajax_call('/hr_admin/do_edit_event_field/'+encodeURIComponent(field)+'/'+val+'/'+event_id, div_to_replace);
}

function delete_new_event() {
	var event_id = $('#event-id').val();
	if(event_id == '') {
		non_ajax_call('/hr_admin/dashboard');
	}
	else
		non_ajax_call('/hr_admin/delete_new_event/'+event_id);
}

function create_event(initiator_id, organization_id) {
	if($('#event-name').val() == '') {
		alert('Please enter the event name');
	} else {
		var date = $('#event-date').val().split('/');
		var t = $('#event-time').val().split(' ');
		var time = t[0].split(':');
		//datepicker: mm/dd/yyyy database: yyyy/mm/dd
		//alert(date[0]+"-"+date[1]+"-"+date[2]+" "+time[0]+":"+time[1]);
		//var d = date[2]+"-"+date[0]+"-"+date[1]+" "+time[0]+":"+time[1];
		var d = new Date(date[2], date[0]-1, date[1], time[0], time[1]);
		$.ajax({ 
		   url: '/hr_admin/do_create_event_ajax',
		   type: 'POST',
		   data: {type: 'Live Class', name: $('#event-name').val(), description: $('#event-description').val(), status: 'Created Event', date: d, location: $('#event-location').val(), InitiatorId: initiator_id, OrganizationId: organization_id},
		   success: function(data){
			   $('#event-id').val(data.id);
			   change_wizard_step(1);
			   ajax_call('/hr_admin/show_event_details/'+data.id, 'new-event-details');
			   ajax_call('/hr_admin/assign_trainer_to_event','assign-trainer');
		   }
		});
	}
}

function do_assign_trainer_to_event(moderator_id, val) {
	var event_id = $('#event-id').val();
	if(event_id == '') {
		alert('Invalid event');
	} else {
		ajax_call('/hr_admin/do_assign_trainer_to_event/'+moderator_id+'/'+event_id);
		mark_active_td_role_filter_user(val);
		change_wizard_step(2);
		ajax_call('/hr_admin/assign_users_to_event/'+data.id+'/meeting','assign-users');
	}
}

var geolocation = {
	old_latitude: 0, old_longitude: 0,
	
	interval : 0,
	
	event_id: 0, trainer_id: 0,
	
	flag: false, i: 0,
		
	get_geolocation : function(eid, tid) {
		this.event_id = eid;
		this.trainer_id = tid;
		//this.i = val;
		if (navigator.geolocation) {
	        navigator.geolocation.getCurrentPosition(this.write_geolocation);
	    } else {
	        alert("Geo location not supported by this browser");
	    }
	},
	
	write_geolocation : function(position) {
		var new_latitude = position.coords.latitude, new_longitude = position.coords.longitude;
		if(this.old_latitude == new_latitude && this.old_longitude == new_longitude) {
			//alert("No change in lat long");
		}
		else {
			//alert("Latitude: " + new_latitude + " Longitude: " + new_longitude);
			this.old_latitude = new_latitude; this.old_longitude = new_longitude;
			$.ajax({ 
			   url: '/trainer/log_trainer_location',
			   type: 'POST',
			   data: {EventId: geolocation.event_id, TrainerId: geolocation.trainer_id, date: new Date(), latitude: new_latitude, longitude: new_longitude},
			   success: function(data){
				   if(geolocation.flag == false) {
					   geolocation.flag = true;
					   $('.checkin-btn-'+geolocation.event_id).addClass('disabled');
					   $('.reached-btn-'+geolocation.event_id).removeClass('disabled');
					   ajax_call('/trainer/create_event_log/'+geolocation.event_id+'/checkin');
					   geolocation.set_interval();
				   }
			   }
			});
		}
	},
	
	set_interval : function() {
		this.interval = setInterval(function(){
			geolocation.get_geolocation(geolocation.event_id, geolocation.trainer_id);
		}, 6000);
	},
	
	clear_interval : function() { 
		this.flag = false; this.old_latitude = 0; this.old_longitude = 0;
		ajax_call('/trainer/create_event_log/'+this.event_id+'/reached');
		$('.reached-btn-'+this.event_id).addClass('disabled');
		clearInterval(this.interval);
		attendance.show_attendance_btn(this.i, this.event_id);
	}
};

var attendance = {
	i:0, event_id:0,
	
	show_attendance_btn: function(i, eid) { 
		this.i = i;
		this.event_id = eid;
		$('.start-btn-'+this.event_id).removeClass('disabled');
	},
	
	submit_attendance: function(eid) {
		ajax_call('/trainer/create_event_log/'+eid+'/attendance');
		$('#attendance-modal-footer').hide();
		$('#attendance').text('Thanks for submitting attendance!');
		//$('.attendance-btn-'+eid).addClass('disabled');
		$('.feedback-btn-'+eid).removeClass('disabled');
	},
	
	start_class: function(eid) {
		this.event_id = eid;
		ajax_call('/trainer/create_event_log/'+this.event_id+'/start');
		$('.attendance-btn-'+this.event_id).removeClass('disabled');
		$('.start-btn-'+this.event_id).addClass('disabled');
	}
};

var feedback = {
	fid:0,
	
	submit_feedback: function(feedback_id, event_id) {
		this.fid = feedback_id;
		var isModuleCompleted = $('input[name="isModuleCompleted"]:checked').val() == 'yes' ? true : false;
		var moduleComment = $('#moduleComment').val();
		var anyProblem = $('#anyProblem').val();
		var classRating = $('input[name="rating"]:checked').val();
		ajax_call('/trainer/create_event_log/'+event_id+'/feedback');
		//$('.feedback-btn-'+event_id).addClass('disabled');
		$('.checkout-btn-'+event_id).removeClass('disabled');
		if(classRating <= 3) {
			var isContentAllocatedFitsInTime = $('input[name="isContentAllocatedFitsInTime"]:checked').val() == 'yes' ? true : false;
			var isStudentParticipationQuality = $('input[name="isStudentParticipationQuality"]:checked').val() == 'yes' ? true : false;
			var isClassDiscipline = $('input[name="isClassDiscipline"]:checked').val() == 'yes' ? true : false;
			var isStudentEnjoyedTheContent = $('input[name="isStudentEnjoyedTheContent"]:checked').val() == 'yes' ? true : false;
			var isLearningExperience = $('input[name="isLearningExperience"]:checked').val() == 'yes' ? true : false;
			
			$.ajax({ 
			   url: '/trainer/submit_class_rating_details',
			   type: 'POST',
			   data: {FeedbackId: feedback_id, isContentAllocatedFitsInTime: isContentAllocatedFitsInTime, isStudentParticipationQuality: isStudentParticipationQuality, isClassDiscipline: isClassDiscipline, isStudentEnjoyedTheContent: isStudentEnjoyedTheContent, isLearningExperience: isLearningExperience},
			   success: function(data){
				   
			   }
			});
		}
		$.ajax({ 
		   url: '/trainer/update_feedback',
		   type: 'POST',
		   data: {id: feedback_id, date: new Date, isModuleCompleted: isModuleCompleted, moduleComment: moduleComment, anyProblem: anyProblem, classRating: classRating},
		   success: function(data){
			   $('#trainer-feedback').text(data);
			   $('#feedback-modal-footer').hide();
		   }
		});
	}
};

function check_out(event_id, user_id) {
	ajax_call('/trainer/event_done/'+event_id);
	ajax_call('/trainer/create_event_log/'+event_id+'/checkout');
	non_ajax_call('/trainer/dashboard_second/'+user_id);
}

function show_gym_skills(val) {
	if(val == 'tile') {
		/*
		-webkit-transform: rotateY(0deg);
    -moz-transform: rotateY(0deg);
    -ms-transform: rotateY(0deg);
    -o-transform: rotateY(0deg);
    transform: rotateY(0deg);
		*/
		$('#gym-captionable-front').css('-webkit-transform','rotateY(180deg)').css('z-index','1');
		$('#gym-captionable-back').css('-webkit-transform','rotateY(0deg)').css('z-index', '2');
	} else if(val == 'carousel') {
		$('#gym-captionable-back').css('-webkit-transform','rotateY(180deg)').css('z-index', '1');
		$('#gym-captionable-front').css('-webkit-transform','rotateY(0deg)').css('z-index','2');
	}
}

function get_batches_for_organization() {
	var oid = $('#OrganizationId').val();
	ajax_call('/coordinator/get_batches_for_organization/'+oid,'batch_div');
}

function get_learning_groups_for_organization() {
	var oid = $('#RoleId').val();
	ajax_call('/coordinator/get_learning_groups_for_organization/'+oid,'learning_group_div');
}

function do_assign_skill_trainer_to_event(event_id, user_id, flag) {
	$.ajax({ 
	   url: '/coordinator/do_assign_skill_trainer_to_event',
	   type: 'POST',
	   data: {flag: flag, EventId: event_id, SkillId: $('#SkillId').val(), ModuleId: $('#ModuleId').val(), TrainerId: $('#TrainerId').val()},
	   success: function(data){
		   if(data.message == "success")
			   //$('#error-message').html('No conflict');
			   non_ajax_call('/coordinator/schedule/'+user_id+'/'+data.year+'/'+data.month+'/'+data.day);
		   else {
			   $('#submit-with-conflict-btn').show();
			   $('#error-message').html(data.message);
		   }
	   }
	});
}

function get_modules_for_skill() {
	var skillId = $('#SkillId').val(); 
	ajax_call('/coordinator/get_modules_for_skill/'+skillId,'module_div');
}

function get_formatted_time(val) {
	var t = val.split(" ");
	var time = t[0].split(":");
	if(t[1] == "AM" && parseInt(time[0]) == 12) {
		time[0] = 0;
	}
	if(t[1] == "PM" && parseInt(time[0]) != 12) {
		time[0] = parseInt(time[0])+12;
	}
	return time;
}

function string_to_int_array(res) {
	for (var i=0; i<res.length; i++)
	{
	    res[i] = parseInt(res[i], 10);
	}
	return res;
}

function do_create_new_schedule() {
	var val = $('#weeks').val();
	var pattern = /^\d+$/;
	
	var startTime = get_formatted_time($('#startTime').val());
	var endTime = $('#endTime').val() != '' ? get_formatted_time($('#endTime').val()) : '';
	
	startTime = string_to_int_array(startTime);
	endTime = string_to_int_array(endTime);
	
	if($('#name').val() == '') {
		alert("Please enter a event name");
	}else if($('#startDate').val() == '') {
		alert("Please select a value for 'Start Date'");
	} else if(endTime == '') {
		alert("Please select a value for 'End Time'");
	} else if((startTime[0] > endTime[0]) || (startTime[0] == endTime[0] && startTime[1] > endTime[1])) {
		alert('Start Time '+startTime[0]+' cannot be greater than End Time '+endTime[0]);
	} else if (!pattern.test(val)) {
		alert("Please enter integer value for 'No. of Weeks'");
	} else
		submit_form('create_new_schedule_form');
	/*if((startTime[0] > endTime[0]) || (startTime[0] == endTime[0] && startTime[1] > endTime[1])) {
		alert('Start Time '+startTime[0]+' cannot be greater than End Time '+endTime[0]);
	} else
		alert("All is well");*/
}

function confirm_schedule() {
	var week = $('#fullcalendar .fc-header .fc-header-center .fc-header-title h2').text(); // blue mode
	if(week != null && week != '') {
		//check if week mode is selected
		if($('#fullcalendar .fc-header .fc-header-left .fc-button-month').hasClass('fc-state-active') || $('#fullcalendar .fc-header .fc-header-left .fc-button-agendaDay').hasClass('fc-state-active')) {
			alert('Please select week mode');
		} else
			do_confirm_schedule(week);
			
	} else {
    	week = $('#fullcalendar .fc-toolbar .fc-center h2').text(); // grey mode
    	if(week != null && week != '') {
    		//check if week mode is selected
    		if($('#fullcalendar .fc-toolbar .fc-left .fc-month-button').hasClass('fc-state-active') || $('#fullcalendar .fc-toolbar .fc-left .fc-agendaDay-button').hasClass('fc-state-active')) {
    			alert('Please select week mode');
    		} else
    			do_confirm_schedule(week);
    	} else
    		alert('Oops..looks like something is not alright. Please refresh the page!!!');
    } 	
}

function do_confirm_schedule(week) {
	var date = week.split(' ');
    var date1 = date[0]+' '+date[1]+' '+date[4];
    var date2 = date[0]+' '+date[3]+' '+date[4];
    $.ajax({ 
	   url: '/coordinator/get_conflict_events/'+date1+'/'+date2,
	   success: function(data){
		   if((data.length) > 0){
			   if(confirm('There are '+data.length+' conflicting events for this week. Are you sure you want to confirm?'))
				   non_ajax_call('/coordinator/confirm_schedule/'+date1+'/'+date2);  
		   } else
			   non_ajax_call('/coordinator/confirm_schedule/'+date1+'/'+date2);
	   }
	});
}

function coordinator_event_details(val) {
	if(val == 'show') {
		$("body").append('<div class="modal-backdrop fade in"></div>');
        $('body').addClass('modal-open');
		$('#uide4b3dde6bb5097375d99eb18a83d7146').addClass("in");
		$('#uide4b3dde6bb5097375d99eb18a83d7146').show();
	} else {
		$('.modal-backdrop').remove();
		$('body').removeClass('modal-open');
		$('#uide4b3dde6bb5097375d99eb18a83d7146').removeClass("in");
		$('#uide4b3dde6bb5097375d99eb18a83d7146').hide();
	}
}

function toggleFullScreen() {
  if ((document.fullScreenElement && document.fullScreenElement !== null) ||    
   (!document.mozFullScreen && !document.webkitIsFullScreen)) {
    if (document.documentElement.requestFullScreen) {  
      document.documentElement.requestFullScreen();  
    } else if (document.documentElement.mozRequestFullScreen) {  
      document.documentElement.mozRequestFullScreen();  
    } else if (document.documentElement.webkitRequestFullScreen) {  
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);  
    }  
  } else {  
    if (document.cancelFullScreen) {  
      document.cancelFullScreen();  
    } else if (document.mozCancelFullScreen) {  
      document.mozCancelFullScreen();  
    } else if (document.webkitCancelFullScreen) {  
      document.webkitCancelFullScreen();  
    }  
  }  
}

function cancelFullScreen() {
	if (document.cancelFullScreen) {  
      document.cancelFullScreen();  
    } else if (document.mozCancelFullScreen) {  
      document.mozCancelFullScreen();  
    } else if (document.webkitCancelFullScreen) {  
      document.webkitCancelFullScreen();  
    } 
}

function get_no_of_modules_for_skill() {
	$.ajax({ 
	   url: '/coordinator/get_no_of_modules_for_skill/'+$('#SkillId').val(),
	   success: function(data){
			$('#last_row').removeClass('display-none');
			$('#weeks').val(data.length);
			$('#last_row_first_td').text('It needs '+data.length+' week(s)');
	   }
	});
}