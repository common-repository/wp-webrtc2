/**
 * @description Create interface of plugin.
 * @category webrtc2-interface.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

//fixed error of browsers.
var scrollTop = 0;
var scrollLeft = 0;

var win_height;

var winEvent = window.attachEvent || window.addEventListener;
var chkEventUnload = window.attachEvent ? "onbeforeunload" : "beforeunload";
var chkEventLoad   = window.attachEvent ? "onload" : "load";
var chkEventResize = window.attachEvent ? "onresize" : "resize";
var receive_call_timer = null;
var guest_called = "";
var now;

winEvent(chkEventLoad, function(e) {
	// Main function onload.
	webrtc2_interface_onload();
});
winEvent(chkEventUnload, function(e) {
	// Send call_stat of videochat to server.
	if ( webrtc2_pc ) {
		webrtc2_call_stat("stop");
		// Send stop of videochat to server.
		webrtc2_chat_stop();
		// Clear all local data.
		sessionStorage.clear();
	}
});
winEvent(chkEventResize, function(e) {
	// Window of browser resize.
});
/**
 * @description Main function onload.
 */
function webrtc2_interface_onload() {
	// Check
	if (!document.getElementById("wins1_table1") && !document.getElementById("wins1_table2")) return;
	// Detected browser.
	let agentInfo = detect.parse(navigator.userAgent);
	if ('Chrome' === agentInfo.browser.family) {
		document.getElementById("progress_file").className = "progress_chrome";
		document.getElementById("progress_caption").className = "label_chrome";
	}
	if ('Firefox' === agentInfo.browser.family) {
		document.getElementById("progress_file").className = "progress_firefox";
		document.getElementById("progress_caption").className = "label_firefox";
	}
	if ('Opera' === agentInfo.browser.family) {
		document.getElementById("progress_file").className = "progress_opera";
		document.getElementById("progress_caption").className = "label_opera";
	}
	if ('Edge' === agentInfo.browser.family) {
		document.getElementById("progress_file").className = "progress_edge";
		document.getElementById("progress_caption").className = "label_edge";
	}
	if ('Yandex' === agentInfo.browser.family) {
		document.getElementById("progress_file").className = "progress_yandex";
		document.getElementById("progress_caption").className = "label_yandex";
	}
	if ('WP-WebRTC2-client' === agentInfo.browser.family) {
		document.getElementById("progress_file").className = "progress_chrome";
		document.getElementById("progress_caption").className = "label_chrome";
	}
	//
	let tableUsersRows   = document.getElementById("wins1_tbody1").getElementsByTagName("tr");
	let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");

	document.getElementById("win_head").addEventListener('mouseenter', e => webrtc2_win1_menu_items_visible());
	document.getElementById("win_head").addEventListener('mouseleave', e => webrtc2_win1_menu_items_hide());

	document.getElementById("win1_head").addEventListener('mouseenter', e => webrtc2_win1_menu_items_visible());
	document.getElementById("win1_head").addEventListener('mouseleave', e => webrtc2_win1_menu_items_hide());

	document.getElementById("win1_menu_item1").addEventListener('mouseenter', e => webrtc2_win1_menu_items_visible());
	document.getElementById("win1_menu_item1").addEventListener('mouseleave', e => webrtc2_win1_menu_items_hide());

	document.getElementById("win1_menu_item2").addEventListener('mouseenter', e => webrtc2_win1_menu_items_visible());
	document.getElementById("win1_menu_item2").addEventListener('mouseleave', e => webrtc2_win1_menu_items_hide());

	// Enable button of stop a chat.
	document.getElementById("btn_stop_chat").style.color  = "red";
	// Check for the possibility of pressing a button btn_send_msg.
	let fld_send_msg     = document.getElementById("fld_send_msg");
	fld_send_msg.oninput = function() {
		if ( "" !== fld_send_msg.value && sessionStorage.getItem("webrtc2_guestId") ) {
			document.getElementById("btn_send_msg").style.color = "green";
			document.getElementById("btn_send_msg").disabled    = false;
		} else {
			document.getElementById("btn_send_msg").style.color = "white";
			document.getElementById("btn_send_msg").disabled    = true;
		}
	}
	// Check for the possibility of pressing a button btn_search_user.
	let fld_search_user     = document.getElementById("fld_search_user");
	fld_search_user.oninput = function() {
		if ( fld_search_user.value.length == 0 ) {
			document.getElementById("btn_search_user").style.color = "white";
			document.getElementById("btn_search_user").disabled    = true;
			for ( let tableUsersRow of tableUsersRows ) {
				tableUsersRow.style.display = "table";
			}
		} else {
			document.getElementById("btn_search_user").style.color = "green";
			document.getElementById("btn_search_user").disabled    = false;
		}
	}
	// Send file to webrtc2_guestId.
	let btn_send_file       = document.getElementById("btn_send_file");
	let fld_file_attach     = document.getElementById("fld_file_attach");
	let for_fld_file_attach = document.getElementById("for_fld_file_attach");
	webrtc2_file_select     = document.getElementById("img_file_select");

	fld_file_attach.onchange = function() {
	  if (webrtc2_dataChannel && webrtc2_dataChannel.readyState == "open" && fld_file_attach.files[0]) {
			document.getElementById("btn_send_file").style.color = "green";
			document.getElementById("btn_send_file").disabled    = false;
			for_fld_file_attach.innerHTML = fld_file_attach.files[0].name;
	  }else{
			document.getElementById("btn_send_file").style.color = "white";
			document.getElementById("btn_send_file").disabled    = true;
			for_fld_file_attach.innerHTML = "Choose a file";
			for_fld_file_attach.appendChild(webrtc2_file_select);
	  }
	}
	// Chek for the possibility of include user in chat room.
	webrtc2_check_include_user_in_room();
	// Chek for the possibility of exclude user from chat room.
	webrtc2_check_exclude_user_from_room();
	// Set Name of webrtc2_hostId to win1.
	webrtc2_include_user_in_room();
	// Init video-chat.
	if (0 !== tableMembersRows.length) {
		// Start SSE webrtc2.
		webrtc2_sse();
		// Change of bitrate of local win1_video.
		webrtc2_bitrate_level_local("wins1_bitrate_1");
		// Creating a PC object and setting other events.
		webrtc2_peer_init();
		// Receive messages for webrtc2_hostId from autoresponder.
		webrtc2_autoresponder_receive()
		.then(msg => {
			if (msg) {
				webrtc2_autoresponder_msg(msg);
				webrtc2_msg_chat_switch();
			} else {
				webrtc2_msg_dump_switch();
			}
		});
		// Review.
		let review = "For the administrator of this site:" + "\n\r" +
			"1. Register multiple site users for video chat with a role: " +
			tableMembersRows[0].querySelectorAll("td")[2].innerHTML + "\n\r" +
			"2. For security reasons - the administrator is not involved in video-chat.";
		if (0 === tableUsersRows.length) {
			alert(review);
		}
	}
	win_height = window.innerHeight;
}
/**
 * @description Maximize or minimize window of video chat.
 * @param {string} id ID of component.
 */
function webrtc2_max_min_win(id) {
	let win_board = document.getElementById("win_board");

	if (!document.getElementById("part1") ||
			!document.getElementById("part2")	||
			!document.getElementById("part3")) {
			return;
	}
	switch (id) {
	  case "max_off":
	  	document.getElementById("max_off").style.display = "none";
	  	document.getElementById("max_on").style.display = "inline-flex";

	  	document.getElementById("min_off").style.display = "inline-flex";
	  	document.getElementById("min_on").style.display = "none";

	  	document.getElementById("part1").style.display = "flex";
			document.getElementById("part2").style.display = "flex";
			document.getElementById("part3").style.display = "flex";

			if (-1 !== navigator.userAgent.indexOf("OPR")) {
				window.resizeTo(790, win_height + 90);
			}else	if (-1 !== navigator.userAgent.indexOf("YaBrowser")) {
				window.resizeTo(750, win_height + 50);
			}else{
				window.resizeTo(750, win_height + 75);
			}
	    break;
	  case "min_off":
	  	document.getElementById("max_off").style.display = "inline-flex";
	  	document.getElementById("max_on").style.display = "none";

	  	document.getElementById("min_off").style.display = "none";
	  	document.getElementById("min_on").style.display = "inline-flex";

	  	document.getElementById("part1").style.display = "none";
			document.getElementById("part2").style.display = "none";
			document.getElementById("part3").style.display = "none";

			if (-1 !== navigator.userAgent.indexOf("OPR")) {
				if(win_board) {
					window.resizeTo(750, 555);
				}else{
					window.resizeTo(750, 355);
				}
			}else	if (-1 !== navigator.userAgent.indexOf("YaBrowser")) {
				if(win_board) {
					window.resizeTo(750, 500);
				}else{
					window.resizeTo(750, 300);
				}
			}else{
				if(win_board) {
					window.resizeTo(750, 530);
				}else{
					window.resizeTo(750, 330);
				}
			}
	    break;
	  case "max_on":
	  	document.getElementById("part1").style.display = "flex";
			document.getElementById("part2").style.display = "flex";
			document.getElementById("part3").style.display = "flex";

			if (-1 !== navigator.userAgent.indexOf("OPR")) {
				window.resizeTo(790, win_height + 90);
			}else	if (-1 !== navigator.userAgent.indexOf("YaBrowser")) {
				window.resizeTo(750, win_height + 50);
			}else{
				window.resizeTo(750, win_height + 75);
			}
	  	break;
	  case "min_on":
	  	document.getElementById("part1").style.display = "none";
			document.getElementById("part2").style.display = "none";
			document.getElementById("part3").style.display = "none";

			if (-1 !== navigator.userAgent.indexOf("OPR")) {
				if(win_board) {
					window.resizeTo(750, 555);
				}else{
					window.resizeTo(750, 355);
				}
			}else	if (-1 !== navigator.userAgent.indexOf("YaBrowser")) {
				if(win_board) {
					window.resizeTo(750, 500);
				}else{
					window.resizeTo(750, 300);
				}
			}else{
				if(win_board) {
					window.resizeTo(750, 530);
				}else{
					window.resizeTo(750, 330);
				}
			}
			break;
	}
}
/**
 * @description Chek for the possibility of include user in chat room.
 */
function webrtc2_check_include_user_in_room() {
	let tableUsersRows   = document.getElementById("wins1_tbody1").getElementsByTagName("tr");
	let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");
	if ( (0 < tableUsersRows.length && 2 > tableMembersRows.length) && 0 !== tableMembersRows.length ) {
		document.getElementById("btn_include_member").disabled    = false;
		document.getElementById("btn_include_member").style.color = "green";
	} else {
		document.getElementById("btn_include_member").disabled    = true;
		document.getElementById("btn_include_member").style.color = "white";
	}
}
/**
 * @description Chek for the possibility of exclude user from chat room.
 */
function webrtc2_check_exclude_user_from_room() {
	let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");
	if ( 1 < tableMembersRows.length ) {
		document.getElementById("btn_exclude_member").disabled    = false;
		document.getElementById("btn_exclude_member").style.color = "green";
	} else {
		document.getElementById("btn_exclude_member").disabled    = true;
		document.getElementById("btn_exclude_member").style.color = "white";
	}
}
/**
 * @description Check of users online, room guests.
 */
function webrtc2_sse() {
	if ( window.EventSource ) {
		let webrtc2_source = new EventSource( webrtc2_url_ajax + "?webrtc2_hostId=" + webrtc2_hostId + "&action=sse" + "&nonce=" + webrtc2_nonce);
		webrtc2_source.onmessage = function(e) {
			let data_SSE = e.data.split( ";" );
			let webrtc2_users_online = data_SSE[0];
			let webrtc2_users_guests = [];
			if ( 0 !== data_SSE[1].length ) {
				let parsed = JSON.parse(data_SSE[1]);
				if (parsed) {
					webrtc2_users_guests = Object.keys(parsed).map( function(key) {
						return [(key), parsed[key]];
					});
				}
			}
			// For users chat table on page.
			webrtc2_chk_status_users(webrtc2_users_online, webrtc2_users_guests);
			// For members chat table on page.
			webrtc2_chk_status_members(webrtc2_users_online, webrtc2_users_guests);
			// Initiator or not of video-chat.
			let webrtc2_initiator = webrtc2_is_initiator(webrtc2_users_guests);
			sessionStorage.setItem("webrtc2_initiator", webrtc2_initiator );
			// Check for the possibility of starting a chat.
			webrtc2_check_on_start();
		};
	} else {
		webrtc2_log_err("Error: ",  "Browser does not support SSE.");
		return;
	}
}
/**
 * @description Check status of users (online,offline,envited).
 * @param {string} webrtc2_users_online  List of registered users online.
 * @param {string} webrtc2_users_guests  List of registered users guests.
 */
function webrtc2_chk_status_users(webrtc2_users_online, webrtc2_users_guests) {
	let tableUsersRows = document.getElementById("wins1_tbody1").getElementsByTagName("tr");
	let sound          = new Audio();

	let webrtc2_users_online_arr = webrtc2_users_online.split("|");

	for ( let tableUserRow of tableUsersRows ) {
		let user_status = tableUserRow.querySelectorAll( "td" )[0];
		let user_name   = tableUserRow.querySelectorAll( "td" )[1];
		user_name       = user_name.innerHTML.replace( /<(.+?)> /, "" );

		user_status.querySelectorAll( "input[type=checkbox]" )[0].disabled = false;

		if ( -1 != webrtc2_users_online_arr.indexOf(user_name) ) {
				// If user - online.
				// Title online.
				user_status.querySelectorAll( "img" )[0].style.display = "inline";
				// Title offline.
				user_status.querySelectorAll( "img" )[1].style.display = "none";
				// Title invite.
				user_status.querySelectorAll( "img" )[2].style.display = "none";
				// Title hello.
				user_status.querySelectorAll( "img" )[3].style.display = "none";
		} else {
				// If user - offline.
				// Title online.
				user_status.querySelectorAll( "img" )[0].style.display = "none";
				// Title offline.
				user_status.querySelectorAll( "img" )[1].style.display = "inline";
				// Title invite.
				user_status.querySelectorAll( "img" )[2].style.display = "none";
				// Title hello.
				user_status.querySelectorAll( "img" )[3].style.display = "none";
		}
		// If user - invited or guest.
		for ( let webrtc2_user_guest of webrtc2_users_guests ) {
			if (webrtc2_user_guest[0] == user_name || webrtc2_user_guest[1] == user_name ) {
				// Title online.
				user_status.querySelectorAll( "img" )[0].style.display = "none";
				// Title offline.
				user_status.querySelectorAll( "img" )[1].style.display = "none";
				// Title invite.
				user_status.querySelectorAll( "img" )[2].style.display = "inline";
				if ( webrtc2_user_guest[0] == user_name ) {
					user_status.querySelectorAll( "img" )[2].title = "invites a " + webrtc2_user_guest[1];
					if ( webrtc2_user_guest[1] == webrtc2_hostId ) {
						user_status.querySelectorAll( "input[type=checkbox]" )[0].disabled = false;
						if ("false" == sessionStorage.getItem("webrtc2_chat_start")) {
							sound.src = webrtc2_url + "sound/receive_call.mp3";
							if (!receive_call_timer) {
								receive_call_timer = setInterval(() => sound.play(), 3000);
							}
						}
						guest_called = user_name;
						now = new Date();
						document.getElementById("slogan").innerHTML = user_name + " is calling";
						document.getElementById("btn_cancel_call").style.display = "inline-block";
					} else {
						user_status.querySelectorAll( "input[type=checkbox]" )[0].disabled = true;
					}
				}
				if ( webrtc2_user_guest[1] == user_name ) {
					user_status.querySelectorAll( "img" )[2].title = "guest for " + webrtc2_user_guest[0];
					user_status.querySelectorAll( "input[type=checkbox]" )[0].disabled = true;
				}
				break;
			}
		}
	}
	for ( let tableUserRow of tableUsersRows ) {
		let user_status = tableUserRow.querySelectorAll( "td" )[0];
		let user_name   = tableUserRow.querySelectorAll( "td" )[1];

		user_status   = user_status.querySelectorAll( "img" );
		user_name     = user_name.innerHTML.replace( /<(.+?)> /, "" );

		if ( "" !== guest_called && user_name == guest_called && "inline" == user_status[0].style.display) {
			clearInterval(receive_call_timer);
			receive_call_timer = null;
			document.getElementById("slogan").innerHTML = guest_called + " called at " + now.toLocaleTimeString();
			document.getElementById("btn_cancel_call").style.display = "none";
			break;
		}
	}
}
/**
 * @description Check status of members (online, offline, envited).
 * @param {array} webrtc2_users_online List of users online.
 * @param {array} webrtc2_users_guests List of guest.
 */
function webrtc2_chk_status_members(webrtc2_users_online, webrtc2_users_guests) {
	let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");
	for ( let tableMembersRow of tableMembersRows ) {
		let status    = tableMembersRow.querySelectorAll( "td" )[0];
		let td1       = tableMembersRow.querySelectorAll( "td" )[1];
		let	user_name = td1.innerHTML.replace( /<(.+?)> /, "" );
		// fixed user_name.
		user_name = user_name.replace("</a>", "" );

		// If user - online.
		if ( 0 <= webrtc2_users_online.indexOf( user_name, 0 ) ) {
			// Title online.
			status.querySelectorAll( "img" )[0].style.display = "inline";
			// Title offline.
			status.querySelectorAll( "img" )[1].style.display = "none";
			// Title invite.
			status.querySelectorAll( "img" )[2].style.display = "none";
			// Title hello.
			status.querySelectorAll( "img" )[3].style.display = "none";
		} else {
			// If user - offline.
			// Title online.
			status.querySelectorAll( "img" )[0].style.display = "none";
			// Title offline.
			status.querySelectorAll( "img" )[1].style.display = "inline";
			// Title invite.
			status.querySelectorAll( "img" )[2].style.display = "none";
			// Title hello.
			status.querySelectorAll( "img" )[3].style.display = "none";
		}

		for ( let webrtc2_user_guest of webrtc2_users_guests ) {
			// If the user is invited and agreed.
			if ( user_name == webrtc2_user_guest[0]  && webrtc2_hostId == webrtc2_user_guest[1] ) {
				// Title online.
				status.querySelectorAll( "img" )[0].style.display = "none";
				// Title offline.
				status.querySelectorAll( "img" )[1].style.display = "none";
				// Title invite.
				status.querySelectorAll( "img" )[2].style.display = "none";
				// Title hello.
				status.querySelectorAll( "img" )[3].style.display = "inline";
				if ( "speechSynthesis" in window && "hello" !== sessionStorage.getItem(user_name) ) {
					clearInterval(receive_call_timer);
					let speech  = new SpeechSynthesisUtterance("Hello");
					speech.lang = "en-US";
					window.speechSynthesis.speak(speech);
					sessionStorage.setItem(user_name, "hello");
				}
			}
			// If user canceled call.
			if ( user_name == webrtc2_user_guest[0] && "cancel" == webrtc2_user_guest[1] ) {
				let guest_canceled = sessionStorage.getItem("webrtc2_guestId");
				webrtc2_exclude_user_from_room();
				webrtc2_send_guestId("");
				clearInterval(receive_call_timer);
				document.getElementById("slogan").innerHTML = guest_canceled + " canceled call";
				document.getElementById("btn_cancel_call").style.display = "none";
			}
		}
	}
}
/**
 * @description Check for the possibility of starting a chat.
 */
function webrtc2_check_on_start() {
	let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");
	for ( let tableMembersRow of tableMembersRows ) {
		let status = tableMembersRow.querySelectorAll( "td" )[0];
		if ( "inline" == status.querySelectorAll( "img" )[3].style.display ) {
			document.getElementById("btn_start_chat").disabled    = false;
			document.getElementById("btn_start_chat").style.color = "green";
			break;
		} else {
			document.getElementById("btn_start_chat").disabled    = true;
			document.getElementById("btn_start_chat").style.color = "white";
		}
	}
}
/**
 * @description Search Name of user registered for video conference.
 */
function webrtc2_search_user() {
	let tableUsersRows  = document.getElementById("wins1_tbody1").getElementsByTagName("tr");
	let fld_search_user = document.getElementById("fld_search_user").value;

	for (let tableUsersRow of tableUsersRows) {
		if ( 4 == tableUsersRow.cells.length ) {
			let pos  = tableUsersRow.cells[1].innerHTML.indexOf ("> ");
			let str  = tableUsersRow.cells[1].innerHTML.substring( pos + 2 );
			let flag = str.indexOf( fld_search_user );
			if ( -1 !== flag ) {
				tableUsersRow.style.display = "table";
			} else {
				tableUsersRow.style.display = "none";
			}
		}
	}
}
/**
 * @description Include user in chat room.
 */
function webrtc2_include_user_in_room() {
	let tableUsersRows   = document.getElementById("wins1_tbody1").getElementsByTagName("tr");
	let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");
	let step = 1;

	for (let i = 0; i < tableUsersRows.length; i++) {
  	let td = tableUsersRows[i].querySelectorAll("td")[0];
    if ( td ) {
	    let checkbox = td.querySelector("input[type=checkbox]");
	    if ( checkbox && checkbox.checked ) {
	    	if ( 1 == tableMembersRows.length ) {
		    	let row   = document.getElementById("wins1_tbody2").insertRow();
		    	let cell0 = row.insertCell(0);
					let cell1 = row.insertCell(1);
		    	let cell2 = row.insertCell(2);
					let cell3 = row.insertCell(3);

					//insert new row into wins1_table2.
					cell0.innerHTML   = tableUsersRows[i].querySelectorAll("td")[0].innerHTML;
					cell0.style.width = "17%";

					cell1.innerHTML   = tableUsersRows[i].querySelectorAll("td")[1].innerHTML;
					cell1.style       = "width:35%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;";

					cell2.innerHTML   = tableUsersRows[i].querySelectorAll("td")[2].innerHTML;
					cell2.style       = "width:29%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;";

					cell3.title       = tableUsersRows[i].querySelectorAll("td")[3].title;
					cell3.innerHTML   = tableUsersRows[i].querySelectorAll("td")[3].innerHTML;
					cell3.style.width = "18%";

		    	// Delete selected row of wins1_table1.
		    	document.getElementById("wins1_tbody1").deleteRow( i );
		    	// Save webrtc2_guestId value.
		    	sessionStorage.setItem("webrtc2_guestId", cell1.innerHTML.replace( /<(.+?)> /, "" ))
					// Send name guest to webrtc2_guests option.
					webrtc2_send_guestId(sessionStorage.getItem("webrtc2_guestId"));
					// Chek for the possibility of include user in chat room.
					webrtc2_check_include_user_in_room();
					// Chek for the possibility of exclude user from chat room.
					webrtc2_check_exclude_user_from_room();
					// Set time interval for wait answer from guest.
					let timer_wait_response_guest = setInterval( function() {
						if ( 2 == tableMembersRows.length ) {
							let status     = tableMembersRows[1].querySelectorAll( "td" )[0];
							let guest_name = tableMembersRows[1].querySelectorAll( "td" )[1];
							guest_name = guest_name.innerHTML.replace( /<(.+?)> /, "" );

							document.getElementById("slogan").innerHTML = "waiting " + (60 - step * 5) + " sec";
							if ( step == 12 || "inline" == status.querySelectorAll( "img" )[3].style.display ) {
								if ( step == 12 && "inline" == status.querySelectorAll( "img" )[1].style.display ) {
									// Guest offline.
									webrtc2_exclude_user_from_room();
									document.getElementById("slogan").innerHTML = "WP-WebRTC2 plugin is ready";
								}
								if ( step == 12 && "inline" == status.querySelectorAll( "img" )[0].style.display ) {
									// Guest online is not responding.
									webrtc2_exclude_user_from_room();
									document.getElementById("slogan").innerHTML = guest_name + " doesn't answer";
								}
								if ( step < 12 && "inline" == status.querySelectorAll( "img" )[3].style.display ) {
									// Guest accepted the invitation.
									document.getElementById("btn_cancel_call").style.display = "none";
									document.getElementById("slogan").innerHTML = "press start button";
									document.getElementById("btn_start_chat").className = "btn_chat blinking";
								}
								clearInterval(timer_wait_response_guest);
							}
							step++;
						} else {
							clearInterval(timer_wait_response_guest);
						}
					}, 5000);
					break;
	    	}
	    }
    }
	}
	// Name the video stream windows.
	webrtc2_chat_window_name( tableMembersRows );
}
/**
 * @description Exclude user from chat room.
 */
function webrtc2_exclude_user_from_room() {
	let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");

  if ( tableMembersRows[1] ) {
  	let td = tableMembersRows[1].querySelectorAll("td")[0];

  	//insert new row into wins1_table1.
  	let row   = document.getElementById("wins1_tbody1").insertRow(0);
  	let cell0 = row.insertCell(0);
		let cell1 = row.insertCell(1);
  	let cell2 = row.insertCell(2);
		let cell3 = row.insertCell(3);

		cell0.innerHTML   = tableMembersRows[1].querySelectorAll("td")[0].innerHTML;
		let checkbox      = cell0.querySelector("input[type=checkbox]");
		checkbox.checked  = true;
		cell0.style.width = "17%";

		cell1.innerHTML   = tableMembersRows[1].querySelectorAll("td")[1].innerHTML;
		cell1.style       = "width:35%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;";

		cell2.innerHTML   = tableMembersRows[1].querySelectorAll("td")[2].innerHTML;
		cell2.style       = "width:29%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;";

		cell3.title       = tableMembersRows[1].querySelectorAll("td")[3].title;
		cell3.innerHTML   = tableMembersRows[1].querySelectorAll("td")[3].innerHTML;
		cell3.style.width = "18%";

		document.getElementById("btn_start_chat").className = "btn_chat";
		document.getElementById("btn_start_chat").disabled  = true;

		document.getElementById("slogan").innerHTML = "WP-WebRTC2 plugin is ready";
		guest_called = "";

  	// Delete selected row of wins1_table2.
  	document.getElementById("wins1_tbody2").deleteRow( 1 );
  	// Save webrtc2_guestId value.
  	sessionStorage.setItem("webrtc2_guestId", "");
		// Send name guest to webrtc2_guests option.
		webrtc2_send_guestId(sessionStorage.getItem("webrtc2_guestId"));
		// Chek for the possibility of include user in chat room.
		webrtc2_check_include_user_in_room();
		// Chek for the possibility of exclude user from chat room.
		webrtc2_check_exclude_user_from_room();
		// Name the video stream windows.
		webrtc2_chat_window_name( tableMembersRows );
  }
}
/**
 * @description Start video chat.
 */
function webrtc2_start() {
	let deadline = new Date();

	deadline.setMinutes( deadline.getMinutes() + webrtc2_duration * 60 );
	webrtc2_initializeClock("clockdiv", deadline);

	document.getElementById("btn_start_chat").className = "btn_chat";
	document.getElementById("btn_start_chat").disabled  = true;
	document.getElementById("btn_start_chat").setAttribute(
	"style", "box-shadow: rgba(200, 200, 200, 0.6) -2px -2px 3px inset, rgba(0, 0, 0, 0.6) 2px 2px 3px inset;");
	document.getElementById("btn_start_chat").style.color = "green";

	document.getElementById("btn_report").style.color   = "green";
	document.getElementById("btn_report").disabled      = false;

	webrtc2_msg_dump_switch();
	webrtc2_dump_msg("Initiatior: ", sessionStorage.getItem("webrtc2_initiator"));

	webrtc2_log_config(webrtc2_hostId, " -> RTCPeerConnection config:");

	// Set session ID.
	if ("true" === sessionStorage.getItem("webrtc2_initiator")) {
		webrtc2_set_session();
	}

	// Start of video-chat.
	document.getElementById("slogan").innerHTML = "please wait";
	document.getElementById("slogan").setAttribute("style", "flex-basis:35%;");
	sessionStorage.setItem("webrtc2_chat_start", "true");
	webrtc2_chat_init();
	// Progress of connection.
	document.getElementById("progress_connection").style.display = "inline-block";

}
/**
 * @description Stop video chat.
 */
function webrtc2_stop() {
	document.getElementById("btn_stop_chat").setAttribute(
	"style", "box-shadow: rgba(200, 200, 200, 0.6) -2px -2px 3px inset, rgba(0, 0, 0, 0.6) 2px 2px 3px inset;");
	document.getElementById("btn_stop_chat").style.color  = "red";
	// Reload current page.
	location.reload(true);
}
/**
 * @description Switching box "messages" to chat mode.
 */
function webrtc2_msg_chat_switch() {
	if ("no_name" !== webrtc2_hostId) {
		document.getElementById("fld_chat").style.visibility = "visible";
		document.getElementById("fld_cmd").style.visibility = "visible";
		document.getElementById("fld_dump").style.visibility = "hidden";
		document.getElementById("fld_graph").style.visibility = "hidden";

		document.getElementById("btn_chat").style.boxShadow =
		"inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
		document.getElementById("btn_dump").style.boxShadow =
		"inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
	}
}
/**
 * @description Switching box "messages" to dump mode.
 */
function webrtc2_msg_dump_switch() {
	if ("no_name" !== webrtc2_hostId) {
		document.getElementById("fld_dump").style.visibility = "visible";
		document.getElementById("fld_cmd").style.visibility = "visible";
		document.getElementById("fld_chat").style.visibility = "hidden";
		document.getElementById("fld_graph").style.visibility = "hidden";

		document.getElementById("btn_dump").style.boxShadow =
		"inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
		document.getElementById("btn_chat").style.boxShadow =
		"inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
	}
}
/**
 * @description Clear box of dump, chat.
 */
function webrtc2_msg_clear() {
	let webrtc2_msg1 = document.createElement("label");
	let fld_dump = document.getElementById("fld_dump");
	let fld_chat = document.getElementById("fld_chat");

	if ("no_name" !== webrtc2_hostId) {
		let fld_dump = document.getElementById("fld_dump");
		let fld_chat = document.getElementById("fld_chat");

		// Clean out the fld_dump.
		if ("visible" == document.getElementById("fld_dump").style.visibility) {
	  	while (fld_dump.firstChild) {
	    	fld_dump.removeChild(fld_dump.firstChild);
	  	}
	  	webrtc2_msg1.id = "lbl_fld_dump";
	  	webrtc2_msg1.innerHTML = "Protocol of dump:";
	  	fld_dump.appendChild(webrtc2_msg1);
		}
		// Clean out the fld_chat.
		if ("visible" == document.getElementById("fld_chat").style.visibility) {
	  	while (fld_chat.firstChild) {
	    	fld_chat.removeChild(fld_chat.firstChild);
	  	}
	  	webrtc2_msg1.id = "lbl_fld_chat";
	  	webrtc2_msg1.innerHTML = "Protocol of chat:";
	  	fld_chat.appendChild(webrtc2_msg1);
		}
	}
}
/**
 * @description Hiden of fld_dump, fld_chat and displaying fld_graph.
 */
function webrtc2_msg_graph_switch() {
	let legend_local  = document.getElementById("graph_legend_local");
  let legend_remote = document.getElementById("graph_legend_remote");
  
	if ("no_name" !== webrtc2_hostId) {
		sessionStorage.setItem("webrtc2_graph_stat", "graph" );
		// Buttons
		document.getElementById("btn_graph1").style.boxShadow =
		"inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
		document.getElementById("btn_graph2").style.boxShadow =
		"inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
		document.getElementById("btn_graph3").style.boxShadow =
		"inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
		document.getElementById("btn_graph4").style.boxShadow =
		"inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";

		document.getElementById("fld_graph").style.visibility = "visible";
		document.getElementById("fld_cmd").style.visibility   = "hidden";
		document.getElementById("fld_dump").style.visibility  = "hidden";
		document.getElementById("fld_chat").style.visibility  = "hidden";

		legend_local.innerHTML  = "";
  	legend_remote.innerHTML = "";
	}
}
/**
 * @description Hiden of fld_graph and displaying fld_dump, fld_chat.
 */
function webrtc2_graph_quit() {
	// Clear titles.
	document.getElementById("graph_title_local").innerHTML = "[Local]";
	document.getElementById("graph_title_remote").innerHTML = "[Remote]";
	// Clear legends.
	let local_legend1 = document.getElementById("local_legend1");
	if (local_legend1) local_legend1.innerHTML = "local legend1";
	let local_legend2 = document.getElementById("local_legend2");
	if (local_legend2) local_legend2.innerHTML = "local legend2";
	let remote_legend1 = document.getElementById("remote_legend1");
	if (remote_legend1) remote_legend1.innerHTML = "remote legend1";
	let remote_legend2 = document.getElementById("remote_legend2");
	if (remote_legend2) remote_legend2.innerHTML = "remote legend2";

	// Clear canvas.
	const context_local = document.getElementById("canvas_local").getContext("2d", { willReadFrequently: true });
	context_local.clearRect(0, 0, context_local.width, context_local.height);

	const context_remote = document.getElementById("canvas_remote").getContext("2d", { willReadFrequently: true });
	context_remote.clearRect(0, 0, context_remote.width, context_remote.height);

	sessionStorage.setItem("webrtc2_graph_stat", "" );

	webrtc2_msg_dump_switch();
}
/**
 * @description Name the chat window.
 * @param {array} names_members_chat Names the video stream windows.
 */
function webrtc2_chat_window_name( names_members_chat) {
	let win_member_head = document.querySelectorAll(".member_head");

	for (let i = 0; i <= 1; i++) {
		if ( names_members_chat[i] && names_members_chat[i].querySelectorAll("td")[1] ) {
			win_member_head[i].innerHTML = names_members_chat[i].querySelectorAll("td")[1].innerHTML;
		} else {
			win_member_head[i].innerHTML = "";
		}
		win_member_head[i].className = "member_head";
	}
}
/**
 * @description After clicking on the windows (win1-win2), rebuilds them.
 * @param {string} id ID of window video stream.
 */
function webrtc2_rebuild_elements( id ) {
	let win1 = document.getElementById("win1");
	let win2 = document.getElementById("win2");

	// Conversion of all windows () to the default size.
	if ( "400px" === document.getElementById( id ).style.height ) {
		document.getElementById("wins_video").removeChild(win1);
		document.getElementById("wins_video").removeChild(win2);

		document.getElementById("wins_video").appendChild(win1);
		document.getElementById("wins_video").appendChild(win2);

		win1.setAttribute("style", "flex-basis:49.8%;height:200px;");
		win1.style.position  = "relative";
		document.getElementById("win1_head_menu").style.margin  = "-50px 0 0 0";

		win2.setAttribute("style", "flex-basis:49.8%;height:200px;");
		win2.style.position  = "relative";
		document.getElementById("win2_head_menu").style.margin  = "-50px 0 0 0";

		return;
	}
	if ( "win1" == id ) {
		document.getElementById("wins_video").removeChild(win1);
		document.getElementById("wins_video").removeChild(win2);

		document.getElementById("wins_video").appendChild(win1);
		document.getElementById("wins_video").appendChild(win2);

		if ("board" == win1_menu_item2.innerHTML) {
			win1.setAttribute("style", "flex-basis:100%;height:400px;");

			document.getElementById("win1_head_menu").style.margin  = "-120px 0 0 0";
			document.getElementById("win2_head_menu").style.margin  = "-50px 0 0 0";

			win2.setAttribute("style", "right:0;top:50px;width:220px;height:200px;");
			win2.style.position = "absolute";
		}
	}
	if ( "win2" == id ) {
		document.getElementById("wins_video").removeChild(win1);
		document.getElementById("wins_video").removeChild(win2);

		document.getElementById("wins_video").appendChild(win2);
		document.getElementById("wins_video").appendChild(win1);

		if ("board" == win1_menu_item2.innerHTML) {
			win2.setAttribute("style", "flex-basis:100%;height:400px;");

			document.getElementById("win1_head_menu").style.margin  = "-50px 0 0 0";
			document.getElementById("win2_head_menu").style.margin  = "-120px 0 0 0";

			win1.setAttribute("style", "right:0;top:50px;width:220px;height:200px;");
			win1.style.position = "absolute";
		}
	}
}
/**
 * Fixes the position of the video chat window on the website page.
 */
function webrtc2_locate_win() {

	if(0 == scrollTop){
		scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
		scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		window.scrollTo(scrollLeft,scrollTop);
	}else{
		window.scrollTo(scrollLeft,scrollTop);
		scrollTop = 0;
		scrollLeft = 0;
	}

	// console.log("scrollLeft:",scrollLeft, "scrollTop:",scrollTop);
}
