<?php
/**
 * Plugin Name:  WP-WebRTC2
 * Description:  Designed for video communication WebRTC.
 * PHP version 8.0.1
 * Author:       Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * Author URI:   https://www.adminkov.bcr.by/
 * Plugin URI:   https://wordpress.org/plugins/wp-webrtc2/
 * Contributors: adminkov, innavoronich
 * Version:      1.7.4
 * Text Domain:  webrtc2
 * Domain Path:  /languages/
 * Initiation:   Dedicated to granddaughter Arina Akrushko.
 * @category    module
 * @package     main
 * @author      Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version     1.7.4
 * @license     GPLv2 or later
 * @filesource
 */

if ( ! defined( "ABSPATH" ) ) {
	exit();
}

/**
 * Check and Send email from site.
 */
require_once __DIR__ . "/includes/webrtc2-mail.php";

/**
 * Create tables in the DB :prefix_webrtc2_countries, prefix_webrtc2_call_statistics, prefix_webrtc2_stun_servers.
 */
require_once __DIR__ . "/includes/webrtc2-create-tables.php";

/**
 * Contains reference data to populate the table prefix_webrtc2_countries in DB.
 */
require_once __DIR__ . "/settings/webrtc2-stun-servers.php";

/**
 * Contains reference data to populate the table prefix_webrtc2_stun_servers in DB.
 */
require_once __DIR__ . "/settings/webrtc2-countries.php";

if ( ! class_exists( "WebRTC2_Core" ) ) {
	/**
	 * Used to create an administrative control panel for the plugin.
	 */
	require_once __DIR__ . "/class-webrtc2-core.php";

	$webrtc2_core = new WebRTC2_Core();
}

if ( ! class_exists( "WebRTC2_Shortcode" ) ) {
	/**
	 * Used to creates a short code [webrtc2].
	 */
	require_once __DIR__ . "/class-webrtc2-shortcode.php";

	$webrtc2_shortcode = new WebRTC2_Shortcode();
}

if ( ! class_exists( "WebRTC2_List_Table_Stat" ) ) {
	/**
	 * Creating a table of user call statistics.
	 */
	require_once __DIR__ . "/class-webrtc2-tbl-stat.php";
}

if ( ! class_exists( "WebRTC2_List_Table_Srv" ) ) {
	/**
	 * Creating a table of stun servers.
	 */
	require_once __DIR__ . "/class-webrtc2-tbl-srv.php";
}

if ( ! class_exists( "WebRTC2_Stun_Client" ) ) {
	/**
	 * Creates client of stun server.
	 */
	require_once __DIR__ . "/class-webrtc2-stun-client.php";
}

/**
 * Removes the header and footer, displays only shortcode content.
 */
require_once __DIR__ . "/includes/webrtc2-template.php";

/**
 * Prepare tables for Profile: tbl_users, tbl_contact.
 */
require_once __DIR__ . "/includes/webrtc2-profile-tbls.php";

/**
 * Takes the IP of the visitor. Returns an array of information about IP.
 */
require_once __DIR__ . "/includes/webrtc2-ip-info.php";

/**
 * Localization of plugin.
 */
function webrtc2_textdomain() {
	load_plugin_textdomain( "webrtc2", false, dirname( plugin_basename( __FILE__ ) ) . "/languages/" );
}
add_action( "init", "webrtc2_textdomain" );

/**
 * Register javascripts, css for backend.
 */
function webrtc2_enqueue_scripts_backend() {
	$_request_uri = webrtc2_validateURI();

	if( stristr($_request_uri, "user-edit.php" ) ||
		stristr($_request_uri, "profile.php" ) ||
		stristr($_request_uri, "webrtc2_overview") ||
		stristr($_request_uri, "webrtc2_settings") ||
		stristr($_request_uri, "page=webrtc2_statistic" ) ||
		stristr($_request_uri, "page=webrtc2_servers" ) ) {
		wp_enqueue_style( "webrtc2-backend-css", plugins_url( "/css/webrtc2-backend.css", __FILE__ ),false,"v1.7","all" );
	}
	if( stristr($_request_uri, "user-edit.php" ) ||
		stristr($_request_uri, "profile.php" ) ||
		stristr($_request_uri, "webrtc2_settings") ||
	  stristr($_request_uri, "page=webrtc2_statistic" ) ||
		stristr($_request_uri, "page=webrtc2_servers" ) ) {
		wp_enqueue_script( "webrtc2-backend-js", plugins_url( "/js/webrtc2-backend.js", __FILE__ ), array(), "v1.7" );
	}
	$webrtc2_ajax_url = admin_url( "admin-ajax.php" );
	$webrtc2_nonce    = wp_create_nonce( "webrtc2" );
	?>
	<script type="text/javascript">
		var webrtc2_url_ajax  = "<?php echo esc_html( $webrtc2_ajax_url ); ?>";
		var webrtc2_nonce     = "<?php echo esc_html( $webrtc2_nonce ); ?>";
	</script>
	<?php
}
add_action( "admin_enqueue_scripts", "webrtc2_enqueue_scripts_backend" );

/**
 * Register javascripts, css for frontend.
 */
function webrtc2_scripts_css() {
	global $post;

	if ( !empty($post) && has_shortcode( $post->post_content, "webrtc2" ) ) {
		$webrtc2_hostId_data = wp_get_current_user();
		if ( 0 === $webrtc2_hostId_data->ID ) {
			return;
		}
		$webrtc2_hostId_data = get_userdata( $webrtc2_hostId_data->ID );
		$webrtc2_hostId_role = implode(", ", $webrtc2_hostId_data->roles);
		$webrtc2_hostId      = $webrtc2_hostId_data->user_login;
		$val  = get_option( "webrtc2_main_settings" );
		$val1 = isset( $val["enabled_for"] ) ? $val["enabled_for"] : "registered";
		$val2 = isset( $val["duration_videochat"] ) ? $val["duration_videochat"] : "0.5";
		$val3 = isset( $val["appearance"] ) ? $val["appearance"] : "dark";
		$val4 = webrtc2_choose_stun();
		$val5 = isset( $val["turn_server"] ) ? $val["turn_server"] : "";

		$arrs = json_decode($val5);

		$urls = "";
		$turn_usr = "";
		$turn_pwd = "";

		if ( is_array($arrs) ){
			foreach ( $arrs as $arr ) {
				foreach ( $arr as $key => $value ) {
					if ("urls" === $key) {
						$urls = $urls . $value . ";";
					}
					if ("username" === $key) {
						$turn_usr = $value;
					}
					if ("credential" === $key) {
						$turn_pwd = $value;
					}
				}
			}
		}
		if ( "administrator" === $webrtc2_hostId_role ) {
			//the site administrator is not involved in video-chat for security purposes,
			//in order to prevent his login from being displayed to all other site visitors.
			$webrtc2_hostId = "no_name";
			?>
			<script type="text/javascript">
				var webrtc2_hostId = "<?php echo esc_html( $webrtc2_hostId ); ?>";
			</script>
			<?php
		} else if ( $webrtc2_hostId_role === $val1 || "registered" === $val1 ) {
			$webrtc2_url      = plugin_dir_url( __FILE__ );
			$webrtc2_ajax_url = admin_url( "admin-ajax.php" );
			$webrtc2_nonce    = wp_create_nonce( "webrtc2" );
			?>
			<script type="text/javascript">
				var webrtc2_hostId    = "<?php echo esc_html( $webrtc2_hostId ); ?>";
				var webrtc2_duration  = "<?php echo esc_html( $val2 ); ?>";
				var webrtc2_stun      = "<?php echo esc_html( $val4 ); ?>";
				var webrtc2_turn      = "<?php echo esc_html( $urls ); ?>";
				var webrtc2_turn_usr  = "<?php echo esc_html( $turn_usr ); ?>";
				var webrtc2_turn_pwd  = "<?php echo esc_html( $turn_pwd ); ?>";
				var webrtc2_url       = "<?php echo esc_html( $webrtc2_url ); ?>";
				var webrtc2_url_ajax  = "<?php echo esc_html( $webrtc2_ajax_url ); ?>";
				var webrtc2_nonce     = "<?php echo esc_html( $webrtc2_nonce ); ?>";
			</script>
			<?php
		}
		// Converter html to canvas.
		wp_enqueue_script( "converter", plugins_url( "/converter/html2canvas.js", __FILE__ ), array(), "v1.4.1" );
		
		// For drawing mathematical formulas on the drawing board.
		$href_katex_math_js  = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.js";
		$href_katex_math_css = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css";
		wp_enqueue_style( "katex-math", $href_katex_math_css, "v0.16.8", "all" );
		wp_enqueue_script( "katex-math", $href_katex_math_js, array(), "v0.16.8" );

		// For drawing chemical formulas on the drawing board.
		$href_katex_chem_js  = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/mhchem.min.js";
		wp_enqueue_script( "katex-chem", $href_katex_chem_js, array(), "v0.16.8" );

		if ("dark"=== $val3) {
			wp_enqueue_style( "webrtc2-dark", plugins_url( "/css/webrtc2-dark.css", __FILE__ ), "v1.7", "all" );
		}
		if ("light"=== $val3) {
			wp_enqueue_style( "webrtc2-light", plugins_url( "/css/webrtc2-light.css", __FILE__ ), "v1.7", "all" );
		}
		wp_enqueue_script( "detect", plugins_url( "/parser/detect.js", __FILE__ ), array(), "v2.2.2" );
		wp_enqueue_script( "smoothie", plugins_url( "/chart/smoothie.js", __FILE__ ), array(), "v1.36" );
		wp_enqueue_script( "webrtc2-variables", plugins_url( "/js/webrtc2-variables.js", __FILE__ ), array(), "v1.7" );
		wp_enqueue_script( "webrtc2-interface", plugins_url( "/js/webrtc2-interface.js", __FILE__ ), array(), "v1.7" );
		wp_enqueue_script( "webrtc2-init", plugins_url( "/js/webrtc2-init.js", __FILE__ ), array(), "v1.7" );
		wp_enqueue_script( "webrtc2-sign", plugins_url( "/js/webrtc2-sign.js", __FILE__ ), array(), "v1.7" );
		wp_enqueue_script( "webrtc2-service", plugins_url( "/js/webrtc2-service.js", __FILE__ ), array(), "v1.7" );
		wp_enqueue_script( "webrtc2-modify", plugins_url( "/js/webrtc2-modify-sdp.js", __FILE__ ), array(), "v1.7" );
		wp_enqueue_script( "webrtc2-meter-wrklt", plugins_url( "/js/webrtc2-meter-wrklt.js", __FILE__ ), array(), "v1.7" );
		wp_enqueue_script( "webrtc2-board", plugins_url( "/js/webrtc2-board.js", __FILE__ ), array(), "v1.7" );
	}
}
add_action( "wp_enqueue_scripts", "webrtc2_scripts_css" );

/**
 * Execute functions of signaling server.
 */
require_once __DIR__ . "/includes/webrtc2-sign.php";
add_action("wp_ajax_sign", "webrtc2_sign");
// for user agent - "WP-WebRTC2-client"
add_action("wp_ajax_nopriv_sign", "webrtc2_sign");

/**
 * Check of users online, room guests.
 */
require_once __DIR__ . "/includes/webrtc2-sse.php";
add_action("wp_ajax_sse", "webrtc2_sse");
// for user agent - "WP-WebRTC2-client"
add_action("wp_ajax_nopriv_sse", "webrtc2_sse");

// Activation hook.
register_activation_hook( __FILE__, "webrtc2_activation" );
/**
 * Performed when the plugin is activation.
 * During activation, creates table in the database:
 *
 * webrtc2_countries, webrtc2_call_stat, webrtc2_stun_servers
 */
function webrtc2_activation() {
	// Create custom tables for plugin.
	webrtc2_create_tables();
}

// Deactivation hook.
register_deactivation_hook( __FILE__, "webrtc2_deactivation" );
/**
 * Performed when the plugin is deactivation.
 *
 * Delete cron events: webrtc2_truncate, webrtc2_update, webrtc2_update_repeat
 */
function webrtc2_deactivation() {
	// clean up old cron jobs that no longer exist.
	wp_clear_scheduled_hook( "webrtc2_truncate" );
	wp_clear_scheduled_hook( "webrtc2_update" );
	wp_clear_scheduled_hook( "webrtc2_update_repeat" );
}
