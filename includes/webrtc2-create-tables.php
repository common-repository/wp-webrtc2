<?php
/**
 * Description: Creates tables in the database.
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

if ( ! defined( 'ABSPATH' ) ) {
	exit();
}

/**
 * For use dbDelta.
 */
require_once ABSPATH . 'wp-admin/includes/upgrade.php';

/**
 * Create tables: webrtc2_call_statistics.
 *
 * @return boolean.
 */
function webrtc2_create_tables() {
	webrtc2_create_table_countries();
	webrtc2_create_table_call_stat();
	webrtc2_create_table_stun_servers();
}

/**
 * Create table: webrtc2_countries.
 *
 * @return boolean.
 */
function webrtc2_create_table_countries() {
	global $wpdb;

	$sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}webrtc2_countries
	(
	id int(4) unsigned NOT NULL AUTO_INCREMENT,
	code char(2) NOT NULL,
	name varchar(150) NOT NULL,
	latitude float NOT NULL,
	longitude float NOT NULL,
	PRIMARY KEY (`id`)
	);";
	$wpdb->query( $sql );

	$sql = "SELECT count(*) FROM {$wpdb->prefix}webrtc2_countries ";
	$count_rows = $wpdb->get_var( $sql );

	if ( 0 === (int) $count_rows ) {
		$sql = "INSERT INTO {$wpdb->prefix}webrtc2_countries (`code`, `name`, `latitude`, `longitude`) VALUES ";
		$sql = $sql . webrtc2_sql_countries();

		$wpdb->query( $sql );
	}

	return true;
}
/**
 * Create table: webrtc2_call_stat.
 *
 * @return boolean.
 */
function webrtc2_create_table_call_stat() {
	global $wpdb;

	$sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}webrtc2_call_stat
	(
	id int(4) unsigned NOT NULL AUTO_INCREMENT,
	session_id varchar(16) NOT NULL,
	user_name varchar(32) NOT NULL,
	role varchar(16) NOT NULL,
	initiator boolean DEFAULT FALSE,
	user_ip varchar(64) NOT NULL,
	country  LONGTEXT NOT NULL,
	date_start varchar(32) NOT NULL,
	date_stop varchar(32) NOT NULL,
	browser varchar(64) NOT NULL,
	PRIMARY KEY (`id`)
	);";
	$wpdb->query( $sql );

	return true;
}
/**
 * Create table: webrtc2_stun_servers.
 *
 * @return boolean.
 */
function webrtc2_create_table_stun_servers() {
	global $wpdb;

	$sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}webrtc2_stun_servers
	(
	id int(4) unsigned NOT NULL AUTO_INCREMENT,
	server_name varchar(64) NOT NULL,
	port int(6) NOT NULL,
	ip_address varchar(64) NOT NULL,
	provider varchar(128) NOT NULL,
	country LONGTEXT NOT NULL,
	timezone varchar(64) NOT NULL,
	check_date varchar(32) NOT NULL,
	response varchar(128) NOT NULL,
	time_delay varchar(32) NOT NULL,
	PRIMARY KEY (`id`), UNIQUE INDEX server_port (server_name, port)
	);";
	$wpdb->query( $sql );

	$sql = "SELECT count(*) FROM {$wpdb->prefix}webrtc2_stun_servers ";
	$count_rows = $wpdb->get_var( $sql );

	if ( 0 === (int) $count_rows ) {
		$sql = "INSERT INTO {$wpdb->prefix}webrtc2_stun_servers (`server_name`, `port`) VALUES ";
		$sql = $sql . webrtc2_stun_servers();

		$wpdb->query( $sql );
	}

	return true;
}
