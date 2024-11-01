<?php
/**
 * Description: Execute functions of signaling server.
 *
 * PHP version 8.0.1
 *
 * @category module
 * @package  includes
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 * @filesource
 */

/**
* Validate Browser name.
*
* @param  string $state Start or Stop.
* @return string State.
*/
function webrtc2_validateBrowserName($browser_name) {
	if ( false !== strpos( $browser_name, "version" ) || false !== strpos( $browser_name, "WP-WebRTC2-client" ) ) {
		return $browser_name;
	} else {
		return "";
	}
}
/**
* Validate state of videochat.
*
* @param  string $state Start or Stop.
* @return string State.
*/
function webrtc2_validateState($state) {
	if( "start" === $state ) {
		return $state;
	} else if ( "stop" === $state ) {
		return $state;
	} else {
		return "";
	}
}
/**
* Validate command of signaling.
*
* @param  string $cmd Unique command identifier of signaling.
* @return string Command.
*/
function webrtc2_validateCmd($cmd) {
	$arr_cmd = ["cmd0","cmd1","cmd2","cmd3","cmd4","cmd5","cmd6","cmd7","cmd8","cmd9","cmd10"];
	if( in_array($cmd, $arr_cmd) ) {
		return $cmd;
	} else {
		return "";
	}
}
/**
* Validate Msg (Strip HTML and PHP tags from a string).
* Limits the length of the input string.
*
* @param  string $msg Message of user.
* @return string Message.
*/
function webrtc2_validateMsg($msg) {
	$msg = strip_tags($msg);

	if ( 256 < strlen($msg) ) {
		substr($msg, 0, 256);
	}
	return $msg;
}
/**
* Validate Type SDP.
*
* @param  string $type_sdp Type SDP.
* @return string Type SDP.
*/
function webrtc2_validateTypeSdp($type_sdp) {
	if( "offer" === $type_sdp ) {
		return $type_sdp;
	} else if ( "answer" === $type_sdp ) {
		return $type_sdp;
	} else {
		return "";
	}
}
/**
* Validate HTTP_USER_AGENT.
*
* @param  string $http_user_agent HTTP_USER_AGENT.
* @return string HTTP_USER_AGENT.
*/
function webrtc2_validateBrowser($user_agent) {
	if ( false !== strpos( $user_agent, "WP-WebRTC2-client" ) ) {
		return $user_agent;
	} else if ( false !== strpos( $user_agent, " OPR/" ) ) {
		return $user_agent;
	} else if ( false !== strpos( $user_agent, " Firefox/" ) ) {
		return $user_agent;
	} else if ( false !== strpos( $user_agent, " Edg/" ) ) {
		return $user_agent;
	} else if ( false !== strpos( $user_agent, " YaBrowser/" ) ) {
		return $user_agent;
	} else if ( false !== strpos( $user_agent, " Chrome/" ) ) {
		return $user_agent;
	} else if ( false !== strpos( $user_agent, "Apache-HttpClient" ) ) {
		return $user_agent;
	} else {
		return "invalid browser";
	}
}
/**
* Validate User login.
*
* @param  string $login User login.
* @return string User login.
*/
function webrtc2_validateLogin($login) {
	if( validate_username($login) && username_exists($login) || "cancel" === $login) {
		return $login;
	} else {
		return "";
	}
}
/**
* Validate user IP.
*
* @return string User IP.
*/
function webrtc2_validateIP() {
	if (array_key_exists("HTTP_CLIENT_IP", $_SERVER)) {
		return filter_var( $_SERVER["HTTP_CLIENT_IP"], FILTER_VALIDATE_IP);
	} else if (array_key_exists("HTTP_X_FORWARDED_FOR", $_SERVER)) {
		$ip_array = array_values( array_filter( explode("," ,$_SERVER["HTTP_X_FORWARDED_FOR"]) ) );
		return filter_var( reset($ip_array), FILTER_VALIDATE_IP);
	} else if (array_key_exists("REMOTE_ADDR", $_SERVER)) {
	  return filter_var( $_SERVER["REMOTE_ADDR"], FILTER_VALIDATE_IP);
	}

	return "";
}
/**
* Validate URI.
*
* @return string URI.
*/
function webrtc2_validateURI() {
	$_request_host = filter_var($_SERVER["HTTP_HOST"], FILTER_SANITIZE_URL);
	$_request_uri  = filter_var($_SERVER["REQUEST_URI"], FILTER_SANITIZE_URL);

	$_request_url  = filter_var("https://" . $_request_host . $_request_uri, FILTER_VALIDATE_URL );
	if("" !== $_request_url) {
		return $_request_uri;
	} else {
		return "";
	}
}

/**
 * WebRTC signaling Server.
 */
function webrtc2_sign() {
	if (array_key_exists("HTTP_USER_AGENT", $_SERVER)) {
		$_user_agent = filter_input( INPUT_SERVER, "HTTP_USER_AGENT", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowser"));
	}
	// Video-chat room owner.
	if (array_key_exists("webrtc2_hostId", $_POST)) {
		$_webrtc2_hostId = filter_input(INPUT_POST, "webrtc2_hostId", FILTER_CALLBACK, array("options"=>"webrtc2_validateLogin"));
	}
	// Guest for webrtc2_hostId of video-chat.
	if (array_key_exists("webrtc2_guestId", $_POST)) {
		$_webrtc2_guestId = filter_input(INPUT_POST, "webrtc2_guestId", FILTER_CALLBACK, array("options"=>"webrtc2_validateLogin"));
	}
	// ICE candidates.
	if (array_key_exists("webrtc2_ice_candidates", $_POST)) {
		$_webrtc2_ice_candidates = filter_input( INPUT_POST, "webrtc2_ice_candidates", FILTER_DEFAULT );
	}
	// SDP
	if (array_key_exists("webrtc2_sdp", $_POST)) {
		$_webrtc2_sdp = filter_input( INPUT_POST, "webrtc2_sdp", FILTER_DEFAULT );
	}
	// Type SDP: Offer or Answer
	if (array_key_exists("webrtc2_type_sdp", $_POST)) {
		$_webrtc2_type_sdp = filter_input(INPUT_POST, "webrtc2_type_sdp", FILTER_CALLBACK, array("options"=>"webrtc2_validateTypeSdp"));
	}
	// Message to save to autoresponder.
	if (array_key_exists("webrtc2_msg", $_POST)) {
		$_webrtc2_msg = filter_input( INPUT_POST, "webrtc2_msg", FILTER_CALLBACK, array("options"=>"webrtc2_validateMsg") );
	}
	// Messages of fld_chat.
	if (array_key_exists("fld_chat", $_POST)) {
		$_webrtc2_fld_chat = filter_input( INPUT_POST, "fld_chat", FILTER_DEFAULT );
	}
	// Unique command identifier of signaling.
	if (array_key_exists("webrtc2_cmd", $_POST)) {
		$_webrtc2_cmd = filter_input( INPUT_POST, "webrtc2_cmd", FILTER_CALLBACK, array("options"=>"webrtc2_validateCmd") );
	}
	// Cryptographic token tied to a specific action.
	if (array_key_exists("nonce", $_POST)) {
		$_webrtc2_nonce = filter_input( INPUT_POST, "nonce", FILTER_DEFAULT );
	}
	// Initiator of videochat or not.
	if (array_key_exists("initiator", $_POST)) {
		$_initiator = filter_input( INPUT_POST, "initiator", FILTER_VALIDATE_BOOLEAN );
	}
	// Videochat: start or stop.
	if (array_key_exists("state", $_POST)) {
		$_state = filter_input( INPUT_POST, "state", FILTER_CALLBACK, array("options"=>"webrtc2_validateState") );
	}
	// Browser name of user.
	if (array_key_exists("browser", $_POST)) {
		$_browser = filter_input( INPUT_POST, "browser", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowserName") );
	}

	if ( !isset($_webrtc2_nonce) && false === strpos( $_user_agent, "WP-WebRTC2-client" ) ) {
		wp_die( "webrtc2-sign: nonce is empty." );
	}
	if ( isset($_webrtc2_nonce) && $_webrtc2_nonce !== wp_create_nonce( "webrtc2" ) ) {
		wp_die( "webrtc2-sse: nonce is incorrect." );
	}

	$current_time = "[" . current_time("H:i:s") . "]";

	// Stop of video-chat for $_webrtc2_hostId.
	if ( "cmd0" === $_webrtc2_cmd ) {
		if ( "" === $_webrtc2_hostId ) {
			wp_die( "webrtc2-sign->cmd0: User login is incorrect." );
		}
		$users_online = get_option("webrtc2_users_online", "");
		if ( "" !== $users_online ) {
			$users_online = explode("|", $users_online);
			foreach ($users_online as $key => $value) {
				if ( $users_online[$key] === $_webrtc2_hostId ) {
					unset($users_online[$key]);
				}
			}
			$users_online = implode("|", $users_online);
			update_option( "webrtc2_users_online", $users_online );
		}
		$users_guests = get_option("webrtc2_users_guests", "");
		if ( "" !== $users_guests ) {
			$users_guests = json_decode( $users_guests, true );
			if ( isset( $users_guests[$_webrtc2_hostId] ) ) {
				unset( $users_guests[$_webrtc2_hostId] );
			}
			if ( isset($_webrtc2_guestId) && isset( $users_guests[$_webrtc2_guestId] ) ) {
				unset( $users_guests[$_webrtc2_guestId] );
			}
			update_option( "webrtc2_users_guests", json_encode( $users_guests ) );
		}
		$sessions = get_option("webrtc2_sessions", "");
		if ( "" !== $sessions ) {
			$sessions = json_decode( $sessions, true );
			if ( isset( $sessions[$_webrtc2_hostId] ) ) {
				unset( $sessions[$_webrtc2_hostId] );
			}
			update_option( "webrtc2_sessions", json_encode( $sessions ) );
		}
		$ice = get_option("webrtc2_ice_candidates", "");
		if ( "" !== $ice ) {
			$ice = json_decode( $ice, true );
			if ( isset( $ice[$_webrtc2_hostId] ) ) unset( $ice[$_webrtc2_hostId] );
			update_option( "webrtc2_ice_candidates", json_encode( $ice ) );
		}
		$sdp_offer = get_option("webrtc2_sdp_offer", "");
		if ( "" !== $sdp_offer ) {
			$sdp_offer = json_decode( $sdp_offer, true );
			if ( isset( $sdp_offer[$_webrtc2_hostId] ) ) unset( $sdp_offer[$_webrtc2_hostId] );
			update_option( "webrtc2_sdp_offer", json_encode( $sdp_offer ) );
		}
		$sdp_answer = get_option("webrtc2_sdp_answer", "");
		if ( "" !== $sdp_answer ) {
			$sdp_answer = json_decode( $sdp_answer, true );
			if ( isset( $sdp_answer[$_webrtc2_hostId] ) ) unset( $sdp_answer[$_webrtc2_hostId] );
			update_option( "webrtc2_sdp_answer", json_encode( $sdp_answer ) );
		}

		echo( $current_time . " server: Clear data video-chat of " . $_webrtc2_hostId . " on server." );

		//Send email(text_messages data) to $_webrtc2_hostId.
		if ( isset($_webrtc2_fld_chat) && "Protocol of chat:<br>" !== $_webrtc2_fld_chat ) {
			webrtc2_mail_text_messages($_webrtc2_hostId, $_webrtc2_fld_chat);
		}
	}
	// Stores current guestId of hostId.
	if ( "cmd1" === $_webrtc2_cmd ) {
		if ( "" === $_webrtc2_hostId ) {
			wp_die( "webrtc2-sign->cmd1: User login is incorrect." );
		}
		$users_guests = get_option("webrtc2_users_guests", "");
		$users_guests = json_decode( $users_guests, true );

		if ( "" !== $_webrtc2_guestId) {
			$users_guests[$_webrtc2_hostId] = $_webrtc2_guestId;
		} else {
			unset($users_guests[$_webrtc2_hostId]);
		}

		update_option( "webrtc2_users_guests", json_encode( $users_guests ) );

		if ( "" !== $_webrtc2_guestId ) {
			echo( $current_time . " server: Stores current guest list of " . $_webrtc2_hostId . " on server." );
		} else {
			echo( $current_time . " server: Clear current guest list of " . $_webrtc2_hostId . " on server." );
		}
	}
	// Store msg for guestId to autoresponder.
	if ( "cmd2" === $_webrtc2_cmd ) {
		if ( "" === $_webrtc2_hostId || "" === $_webrtc2_guestId ) {
			wp_die( "webrtc2-sign->cmd2: User login is incorrect." );
		}
		$autoresponder = get_option("webrtc2_autoresponder", "");
		$autoresponder = json_decode( $autoresponder, true );

		// Format mySQL.
		$date = current_time( "mysql" );

		if ( isset($autoresponder[$_webrtc2_guestId]) ) {
			//Autoresponder overflow protection.
			$items = explode("|", $autoresponder[$_webrtc2_guestId]);
			$count_items = count($items);
			if ( $count_items > 10 ) {
				$items = array_slice($items, $count_items - 10);
				$autoresponder[$_webrtc2_guestId] = implode("|", $items);
			}
			//Continue...
			$autoresponder[$_webrtc2_guestId] = $autoresponder[$_webrtc2_guestId] . "[" . $date . "] " . $_webrtc2_hostId . ": " . $_webrtc2_msg . "|";
		} else {
			$autoresponder[$_webrtc2_guestId] = "[" . $date . "] " . $_webrtc2_hostId . ": " . $_webrtc2_msg . "|";
		}
		update_option( "webrtc2_autoresponder", json_encode( $autoresponder, JSON_UNESCAPED_UNICODE ) );

		echo( $current_time . " server: Store msg from " . $_webrtc2_hostId . " to " . $_webrtc2_guestId . " in autoresponder." );

		//Send email(autoresponder data) to $_webrtc2_guestId from $_webrtc2_hostId.
		webrtc2_mail_autoresponder($_webrtc2_hostId, $_webrtc2_guestId, $_webrtc2_msg, $date);
	}
	// Send msg of hostId from autoresponder.
	if ( "cmd3" === $_webrtc2_cmd ) {
		if ( "" === $_webrtc2_hostId ) {
			wp_die( "webrtc2-sign->cmd3: User login is incorrect." );
		}
		$autoresponder = get_option("webrtc2_autoresponder", "");
		$autoresponder = json_decode( $autoresponder, true );
		if ( isset( $autoresponder[$_webrtc2_hostId] ) ) {
			echo( $autoresponder[$_webrtc2_hostId] );
			unset( $autoresponder[$_webrtc2_hostId] );

			update_option( "webrtc2_autoresponder", json_encode( $autoresponder, JSON_UNESCAPED_UNICODE ) );
		} else {
			echo "";
		}
	}
	// Store ice-candidates of hostId.
	if ( "cmd4" === $_webrtc2_cmd ) {
		if ( "" === $_webrtc2_hostId ) {
			wp_die( "webrtc2-sign->cmd4: User login is incorrect." );
		}
		$ice = get_option("webrtc2_ice_candidates", "");
		$ice = json_decode( $ice, true );
		$ice[$_webrtc2_hostId] = $_webrtc2_ice_candidates;
		update_option( "webrtc2_ice_candidates", json_encode( $ice ) );

		echo( $current_time . " server: Store ice-candidates of " . $_webrtc2_hostId. " on server." );
	}
	// Send ice-candidate of guestId.
	if ( "cmd5" === $_webrtc2_cmd ) {
		if ( "" === $_webrtc2_guestId ) {
			wp_die( "webrtc2-sign->cmd5: User login is incorrect." );
		}
		$ice = get_option("webrtc2_ice_candidates", "");
		$ice = json_decode( $ice, true );
		if (isset( $ice[$_webrtc2_guestId] ) ) {
			echo( $ice[$_webrtc2_guestId] );
		}
	}
	// Store sdp of hostId.
	if ( "cmd6" === $_webrtc2_cmd ) {
		if ( "" === $_webrtc2_hostId ) {
			wp_die( "webrtc2-sign->cmd6: User login is incorrect." );
		}
		switch ( $_webrtc2_type_sdp ) {
		    case "offer":
	        $name_option = "webrtc2_sdp_offer";
	        break;
		    case "answer":
	        $name_option = "webrtc2_sdp_answer";
	        break;
		    case "":
		  		wp_die( "webrtc2-sign->cmd6: Action state is incorrect." );
		}
		$sdp = get_option($name_option, "");
		$sdp = json_decode( $sdp, true );

		$sdp[$_webrtc2_hostId] = $_webrtc2_sdp;

		update_option( $name_option, json_encode( $sdp ) );

		echo( $current_time . " server: Store " . $_webrtc2_type_sdp . " of " . $_webrtc2_hostId . " on server." );
	}
	// Send sdp of guestId.
	if ( "cmd7" === $_webrtc2_cmd ) {
		if ( "" === $_webrtc2_guestId ) {
			wp_die( "webrtc2-sign->cmd7: User login is incorrect." );
		}
		switch ( $_webrtc2_type_sdp ) {
		    case "offer":
		        $name_option = "webrtc2_sdp_offer";
		        break;
		    case "answer":
		        $name_option = "webrtc2_sdp_answer";
		        break;
		}
		$sdp = get_option($name_option, "");
		$sdp = json_decode( $sdp, true );
		if ( isset($sdp[$_webrtc2_guestId] ) ) {
			echo( $sdp[$_webrtc2_guestId] );
		}
	}
	// Store call_stat for $_webrtc2_hostId.
	if ( "cmd8" === $_webrtc2_cmd ) {
		$val           = get_option( "webrtc2_main_settings" );
		$duration_stat = isset( $val["duration_stat"] ) ? $val["duration_stat"] : "30";

		if ( 0 === $duration_stat ) {
			wp_die( "webrtc2-sign->cmd8: duration_stat = 0." );
		}
		if ( "" === $_webrtc2_hostId || "" === $_webrtc2_guestId ) {
			wp_die( "webrtc2-sign->cmd8: User login is incorrect." );
		}
		if ( "" === $_state ) {
			wp_die( "webrtc2-sign->cmd8: State of videochat is incorrect." );
		}
		if ( "" === $_browser ) {
			wp_die( "webrtc2-sign->cmd8: Browser name is incorrect." );
		}
		global $wpdb;

		// Get session ID.
		$sessions = get_option("webrtc2_sessions", "");
		$sessions = json_decode( $sessions, true );

		if ("start" === $_state) {
			if ($_initiator) {
				if (isset($sessions[$_webrtc2_hostId])) {
					$session_id = $sessions[$_webrtc2_hostId];
				} else {
					$session_id = "none";
				}
			}else{
				if (isset($sessions[$_webrtc2_guestId])) {
					$session_id = $sessions[$_webrtc2_guestId];
				} else {
					$session_id = "none";
				}
			}
			$hostId_data = wp_get_current_user();
			$hostId_data = get_userdata( $hostId_data->ID );
			$hostId_role = implode(", ", $hostId_data->roles);
			$hostId_meta = get_user_meta( $hostId_data->ID );

			$hostId_country_code = isset( $hostId_meta["user_country_code"] ) ? array_shift( $hostId_meta["user_country_code"] ) : "";
			$hostId_country_name = isset( $hostId_meta["user_country_name"] ) ? array_shift( $hostId_meta["user_country_name"] ) : "";
			$hostId_region  = isset( $hostId_meta["user_region"] ) ? array_shift( $hostId_meta["user_region"] ) : "";
			$hostId_city    = isset( $hostId_meta["user_city"] ) ? array_shift( $hostId_meta["user_city"] ) : "";
			$hostId_ip      = isset( $hostId_meta["user_ip"] ) ? array_shift( $hostId_meta["user_ip"] ) : "";

			$values = array(
				"session_id"    => $session_id,
				"user_name"     => $_webrtc2_hostId,
				"role"          => $hostId_role,
				"initiator"     => $_initiator,
				"user_ip"       => $hostId_ip,
				"country"       => $hostId_country_code .
					"<br>Country: " . $hostId_country_name .
					"<br>Region: " . $hostId_region .
					"<br>City: " . $hostId_city,
				"date_start"    => current_time( "mysql" ),
				"browser"       => $_browser,
			);
			$format = array( "%s", "%s", "%s", "%s", "%s", "%s", "%s", "%s" );
			$wpdb->insert( $wpdb->prefix . "webrtc2_call_stat", $values, $format );

			echo( $current_time . " server: Store call_stat=start" . " of " . $_webrtc2_hostId );
		} else if("stop" === $_state) {
			if ($_initiator) {
				if (isset($sessions[$_webrtc2_hostId])) {
					$session_id = $sessions[$_webrtc2_hostId];
				} else {
					$session_id = "none";
				}
			}else{
				if (isset($sessions[$_webrtc2_guestId])) {
					$session_id = $sessions[$_webrtc2_guestId];
				} else {
					$session_id = "none";
				}
			}
			$sql = "SELECT id FROM {$wpdb->prefix}webrtc2_call_stat
							WHERE session_id = '$session_id' AND user_name = '$_webrtc2_hostId'";
			$id  = $wpdb->get_var( $sql );

			$wpdb->update( $wpdb->prefix . "webrtc2_call_stat",
			array( "date_stop" => current_time( "mysql" ) ),
			array( "ID" => $id )
		);
			echo( $current_time . " server: Store call_stat=stop" . " of " . $_webrtc2_hostId );
		}
	}
	// Set session ID for initiator of chat.
	if ( "cmd9" === $_webrtc2_cmd ) {
		$sessions = get_option("webrtc2_sessions", "");
		$sessions = json_decode( $sessions, true );

		$sessions[$_webrtc2_hostId] = rand(1, 1000000);
		update_option( "webrtc2_sessions", json_encode($sessions) );

		echo( $current_time . " server: Store session ID:" . $sessions[$_webrtc2_hostId] . " of " . $_webrtc2_hostId . " on server." );
	}
	// Check email service of site.
	if ( "cmd10" === $_webrtc2_cmd ) {
		webrtc2_mail_check();
	}

	wp_die();
}
