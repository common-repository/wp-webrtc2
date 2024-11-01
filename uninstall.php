<?php
/**
 * Description: Deletes the plugin settings from the database of the website.
 *
 * PHP version 8.0.1
 *
 * @category module
 * @package  main
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 * @filesource
 */

if ( ! defined( "ABSPATH" ) ) {
	exit();
}
if ( ! defined( "WP_UNINSTALL_PLUGIN" ) ) {
	exit();
}

webrtc2_uninstall();

/**
 * Delete all options and tables of plugin WP-WebRTC2.
 */
function webrtc2_uninstall() {
	global $wpdb;

	// Delete options.
	delete_option( "webrtc2_main_settings" );
	delete_option( "webrtc2_users_online" );
	delete_option( "webrtc2_users_guests" );
	delete_option( "webrtc2_ice_candidates" );
	delete_option( "webrtc2_sdp_offer" );
	delete_option( "webrtc2_sdp_answer" );
	delete_option( "webrtc2_autoresponder" );
	delete_option( "webrtc2_sessions" );

	delete_option( "webrtc2_search_stat" );
	delete_option( "webrtc2_search_srv" );

	delete_option("whois_service");

	// Delete table webrtc2_countries.
	$sql = "DROP TABLE IF EXISTS {$wpdb->prefix}webrtc2_countries";
	$wpdb->query( $sql );
	// Delete table webrtc2_call_stat.
	$sql = "DROP TABLE IF EXISTS {$wpdb->prefix}webrtc2_call_stat";
	$wpdb->query( $sql );
	// Delete table webrtc2_stun_servers.
	$sql = "DROP TABLE IF EXISTS {$wpdb->prefix}webrtc2_stun_servers";
	$wpdb->query( $sql );
}
