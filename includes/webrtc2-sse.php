<?php
/**
 * Description: Check of users online, room guests.
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
 * Send info of members video-chat to the browser of client.
 *
 * @param string $data1 All users online on page video-chat.
 * @param string $data2 List of guests for each video-chat host.
 */
function webrtc2_send_frontend( $data1, $data2 ) {

	if ( ! headers_sent() ) {
		header( "Content-Type: text/event-stream" );
		header( "Cache-Control: no-cache" );
		header( "Connection: keep-alive" );
		header( "Access-Control-Expose-Headers: *" );

		echo "data: " . $data1;
		echo ";" . $data2;
		echo "\n\n";
	}
	// check for output_buffering activation.
	if ( 0 !== count( ob_get_status() ) ) {
		ob_flush();
	}
	flush();
}

/**
 * Collecting and saved information about video chat participants.
 */
function webrtc2_sse() {
	if (array_key_exists("HTTP_USER_AGENT", $_SERVER)) {
		$_user_agent = filter_input( INPUT_SERVER, "HTTP_USER_AGENT", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowser"));
	}
	if (array_key_exists("webrtc2_hostId", $_GET)) {
		$_webrtc2_hostId = filter_input(INPUT_GET, "webrtc2_hostId", FILTER_CALLBACK, array("options"=>"webrtc2_validateLogin"));
	}
	if (array_key_exists("nonce", $_GET)) {
		$_webrtc2_nonce = filter_input( INPUT_GET, "nonce", FILTER_DEFAULT );
	}

	if ( !isset($_webrtc2_nonce) && "invalid browser" === $_user_agent ) {
		wp_die( "webrtc2-sse: nonce is empty." );
	}
	if ( isset($_webrtc2_nonce) && $_webrtc2_nonce !== wp_create_nonce( "webrtc2" ) ) {
		wp_die( "webrtc2-sse: nonce is incorrect." );
	}

	if ( "" !== $_webrtc2_hostId ) {
		$users_online = get_option("webrtc2_users_online", "");
		$users_online = explode("|", $users_online);
		$users_guests = get_option("webrtc2_users_guests", "");

		if ( false === in_array($_webrtc2_hostId, $users_online) ) {
			$users_online[] = $_webrtc2_hostId;
		}
		$users_online = implode("|", $users_online);
		update_option( "webrtc2_users_online", $users_online );

		webrtc2_send_frontend( $users_online, $users_guests );
	}

	wp_die();
}
