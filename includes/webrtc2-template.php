<?php
/**
 * Description: Removes unnecessary content from the video chat page.
 * Choose stun server for user video chat.
 * Used for WebRTC2 (client Java).
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

if ( ! defined( "ABSPATH" ) ) {
  exit();
}

/**
 * Used for client application: Java client.
 *
 * Since the client application works on mobile devices with a small screen,
 * all unnecessary content is removed from the video chat page and only the shortcode remains.
 */
function webrtc2_build_template_blank() {
  $theme = wp_get_theme();
  ?>
  <body>
  <?php
  // https://wordpress.org/themes/twentytwentythree/
  if ( "Twenty Twenty-Three" !== $theme->get( "Name" ) ) {
    $webrtc2_videochat = new WebRTC2_Shortcode();
    $webrtc2_videochat->webrtc2_shortcode();
  }
  ?>
  </body>
  <?php
  exit;
}
/**
 * Choose stun server name for user video chat.
 */
function webrtc2_choose_stun() {
  $val         =  get_option( "webrtc2_main_settings" );
  $stun_server = ( isset( $val["stun_server"] ) && "" !== $val["stun_server"] ) ? $val["stun_server"] : "";

  $cur_user_id = get_current_user_id();

  if ("" === $stun_server && 0 !== $cur_user_id) {
    $user_meta      = get_user_meta( $cur_user_id );
    $user_time_zone = isset( $user_meta["time_zone"] ) ? array_shift( $user_meta["time_zone"] ) : "";

    if ("" !== $user_time_zone) {
      // plugin will choose itself.
      $stun_server = webrtc2_receive_stun($user_time_zone);
      return $stun_server;
    } else {
      return "stun:stun1.l.google.com:19302";
    }
  } else {
    return $stun_server;
  }
}
/**
 * Receive data of stun server name.
 */
function webrtc2_receive_stun($user_time_zone) {
  global $wpdb;

  $user_time_zone = explode("/", $user_time_zone);

  // Checking the time zone.
  // If the user's timezone is not in the Stun server table,
  // then add here the nearest time zone, which is in the table.
  switch ($user_time_zone[0]) {
    case "Atlantic":
      $time_zone = "America";
      break;
    case "Indian":
      $time_zone = "Africa";
      break;
    default:
      $time_zone = $user_time_zone[0];
  }

  $result = $wpdb->get_results(
    "
    SELECT *
    FROM {$wpdb->prefix}webrtc2_stun_servers
    WHERE timezone LIKE '%{$time_zone}%' AND response NOT Like '%failed%'
    ",
    "ARRAY_A"
  );
  if (0 !== count($result)) {
    $data = array();
    foreach ( $result as $key => $value ) {
      $data[$value['server_name'].":".$value['port']] = intval($value['time_delay']);
    }
    uasort($data, "cmp");
    return "stun:".array_key_first($data);
  }else{
    return "stun:stun1.l.google.com:19302";
  }
}
/**
 * Helper function for uasort($data, "cmp").
 */
function cmp($a, $b) {
  if ($a == $b) {
      return 0;
  }
  return ($a < $b) ? -1 : 1;
}
