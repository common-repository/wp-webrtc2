<?php
/**
 * Description: Used to create an administrative control panel for the plugin.
 *
 * PHP version 8.0.1
 *
 * @category class
 * @package  core
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 * @filesource
 */

if ( ! defined( "ABSPATH" ) ) {
	exit();
}

class WebRTC2_Core {
	private $pages_shortcode = array();
	/**
	 * Constructor.
	 */
	public function __construct() {
		if ( is_admin() ) {
			// admin actions.
			add_action( "admin_init", array( $this, "webrtc2_settings_sections" ) );
			add_action( "admin_menu", array( $this, "webrtc2_admin_menu" ) );
			add_action( "admin_head", array( $this, "webrtc2_screen_options" ) );
			add_filter( "plugin_row_meta", array( $this, "webrtc2_plugin_meta" ), 10, 2 );
			add_filter( "set-screen-option", array( $this, "webrtc2_set_screen_option" ), 11, 3 );
			// custom fields user profile.
			add_action("show_user_profile", array( $this, "webrtc2_users_select") ); //when you edit your own profile
			add_action("edit_user_profile", array( $this, "webrtc2_users_select") ); //when you edit a profile of any user.
			add_action("personal_options_update", array( $this, "webrtc2_users_select_update") );
			add_action("edit_user_profile_update", array( $this, "webrtc2_users_select_update") );
		} else {
			add_action("init", array( $this,"webrtc2_init") );
			// non-admin enqueues, actions, and filters.
			add_action( "wp_head", array( $this, "webrtc2_viewport_tags" ) );
			// action on successful login.
			add_action( "wp_login", array( $this, "webrtc2_users_online" ), 10, 2 );
			// only video-chat to page and for client application: Java client.
			add_action("wp_body_open", array( $this, "webrtc2_template_blank" ) );
			add_action("after_setup_theme", array( $this, "webrtc2_hiden_toolbar" ) );
			// Remove unnecessary script and css.
			add_filter("print_styles_array", array( $this, "webrtc2_head_content"), 10, 1);
		}
		if ( !wp_next_scheduled( "webrtc2_truncate" ) ) {
			wp_schedule_event( time(), "twicedaily", "webrtc2_truncate" );
		}
		if ( !wp_next_scheduled( "webrtc2_update" ) ) {
			wp_schedule_event( time(), "daily", "webrtc2_update" );
		}
		add_action( "plugins_loaded", function() {
			load_plugin_textdomain( "webrtc2", false, plugins_url("/languages/", __FILE__));
		});

		add_action( "wp_mail_failed", array( $this, "webrtc2_mailer_errors" ), 10, 1);
		add_filter( "wp_mail_content_type", array( $this, "webrtc2_mail_content_type" ) );

		add_action( "webrtc2_truncate", array( $this, "webrtc2_truncate_stat" ) );
		add_action( "webrtc2_update", array( $this, "webrtc2_update_stun" ) );
		add_action( "webrtc2_update_repeat", array( $this, "webrtc2_update_stun_repeat" ) );
		add_action( "user_register", array( $this, "webrtc2_registered_user" ), 10, 2 );
		add_filter( "user_contactmethods", array( $this, "webrtc2_user_contactmethods" ) );
	}
	/**
	 * Removes unnecessary styles if place_on_page = "place0" is selected.
	 *
	 * @param  array $list An array of queued styles before being processed for output.
	 *
	 * @return array       An array of queued styles before being processed for output.
	 */
	public function webrtc2_head_content($list) {
		global $post;

		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["place_on_page"] ) ? $val["place_on_page"] : "place0";

		$_user_agent = filter_input(INPUT_SERVER, "HTTP_USER_AGENT", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowser"));

		if ( !empty($post) && has_shortcode( $post->post_content, "webrtc2" ) ) {
			if ( !empty($_user_agent) && false !== strpos( $_user_agent, "WP-WebRTC2-client" ) || "place0" === $val ) {
				foreach($list as $key => $value) {
					$pos1 = strpos($value, "webrtc2");
					$pos2 = strpos($value, "katex");
					if ( false === $pos1 && false === $pos2 )  {
					  unset($list[$key]);
					}
				}
				$list = array_values($list);
			}
		}

	  return $list;
	}
	/**
	 * Update selecting a contact list from a list of all registered users
	 * or from a custom contact list.
	 *
	 * @param integer user_id User ID.
	 *
	 */
	public function webrtc2_users_select_update($user_id) {
		$_сontacts_group      = filter_input(INPUT_POST, "сontacts_group", FILTER_DEFAULT);
		$_autoresponder       = filter_input(INPUT_POST, "autoresponder", FILTER_DEFAULT);
		$_videochat_recording = filter_input(INPUT_POST, "videochat_recording", FILTER_DEFAULT);
		$_text_messages       = filter_input(INPUT_POST, "text_messages", FILTER_DEFAULT);

		if( !isset( $_POST["_wpnonce"] ) || !wp_verify_nonce( $_POST["_wpnonce"], "update-user_" . $user_id ) ) {
			wp_die( "webrtc2_users_select_update: nonce is incorrect." );
		}
		if( !current_user_can( "edit_user", $user_id ) ) {
			wp_die( "webrtc2_users_select_update: current_user_cannot." );
		}

		// Checking for a registered user.
		$arr_contact_group = explode(";", $_сontacts_group);
		foreach ( $arr_contact_group as $key => $value  ) {
			if ( false === username_exists( $value ) ) {
				$arr_contact_group[$key] = null;
			}
		}
		$arr_contact_group = array_filter($arr_contact_group);
		$_сontacts_group   = implode(";", $arr_contact_group);

  	update_user_meta( $user_id, "сontacts_group", $_сontacts_group );
  	update_user_meta( $user_id, "autoresponder", $_autoresponder );
  	update_user_meta( $user_id, "videochat_recording", $_videochat_recording );
  	update_user_meta( $user_id, "text_messages", $_text_messages );
	}
	/**
	 * Selecting a contact list from a list of all registered users
	 * or from a custom contact list.
	 *
	 * @param object user User.
	 *
	 */
	public function webrtc2_users_select($user) {

		if ("administrator" === $user->roles[0]) return($user);

		$сontacts_group = get_user_meta($user->ID, "сontacts_group", true);

		if ("" == $сontacts_group) {
			$radio_chk1 = "checked";
			$radio_chk2 = "";
		}else{
			$radio_chk1 = "";
			$radio_chk2 = "checked";
		}

		$autoresponder = get_user_meta($user->ID, "autoresponder", true);
		if ("1" == $autoresponder) {
			$smtp_chk1 = "checked";
		}else{
			$smtp_chk1 = "";
		}

		$videochat_recording = get_user_meta($user->ID, "videochat_recording", true);
		if ("1" == $videochat_recording) {
			$smtp_chk2 = "checked";
		}else{
			$smtp_chk2 = "";
		}

		$text_messages = get_user_meta($user->ID, "text_messages", true);
		if ("1" == $text_messages) {
			$smtp_chk3 = "checked";
		}else{
			$smtp_chk3 = "";
		}

		?>
	  <h2>Users for video-chat</h2>
	  <table class="form-table">
	    <tr>
	      <th><label>Select users</label></th>
	      <td>
	        <p>
	        	<input type="radio" id="all_users" name="сontacts_group" value="all_users" <?php echo($radio_chk1); ?>  onclick="webrtc2_users_sel_btn(id);">
	      		<label for="all_users">Registered Users</label>
	      	</p>
	        <p>
	        	<input type="radio" id="contact_list" name="сontacts_group" value="<?php echo($сontacts_group); ?>" <?php echo($radio_chk2); ?>  onclick="webrtc2_users_sel_btn(id);">
	        	<label for="contact_list">Contact List</label>
	        </p>
	        <br>
	        <fieldset class="fieldset_profile" id = "contact_group">
   					<legend>Create Contact List</legend>
   					<div class="div_users" id="div_users">
   						<?php webrtc2_tbl_users($user->ID); ?>
   					</div>
						<div class="div_btns">
							<input type="button" class= "btn_tbl_profile" id="include" value="=>"  onclick="webrtc2_users_include();">
							<input type="button" class= "btn_tbl_profile" id="exclude" value="<="  onclick="webrtc2_users_exclude();">
   					</div>
   					<div class="div_contact" id="div_contact">
   						<?php webrtc2_tbl_contact(); ?>
   					</div>
   				</fieldset>
	      </td>
	    </tr>
	    <tr>
	    	<!-- Add services -->
	    	<th><label>Email</label></th>
	    	<td>
		    	<fieldset class="fieldset_profile" id = "email_group" style="display:flex;flex-direction:column;justify-content:center;">
   					<legend>Items 1–2 listed below will work if the site owner has connected a mail server.</legend>
				    <div style="display: inline-block;">
				      <label style="width:200px;float: left;" for="profile_autoresponder">1.Send video-chat autoresponder messages to my email</label>
				      <p style="display:flex;">
			        	<input type="checkbox" id="profile_autoresponder" name="autoresponder" value="1" <?php echo($smtp_chk1); ?>>
			      		<label for="profile_autoresponder">You will receive each new notification before the session from video-chat users to your email. However, all messages from video-chat users addressed to you will be stored on the answering machine until you appear in the video-chat.</label>
			      	</p>
				    </div>
				    <div style="display: inline-block;">
				      <label style="width:200px;float: left;" for="profile_text_messages">2.Send video-chat session text messages to my email</label>
				      <p style="display:flex;">
			        	<input type="checkbox" id="profile_text_messages" name="text_messages" value="1" <?php echo($smtp_chk3); ?>>
			        	<label for="profile_text_messages">If text messages were exchanged during the video-chat session, you can receive a full list of these messages by email at the end of the video-chat session.<label>
			        </p>
				    </div>
					</fieldset>
				    <p style="width:700px;">Note: If you do not find letters from items 1-2 of the Email section in your mailbox, they may be in spam. Please mark them as not spam.</p>
	    	</td>
	    </tr>
	  </table>
	  <?php
	}
	/**
	 * Used for option: only video-chat to page and for client application: Java client.
	 *
	 * Since the client application works on mobile devices with a small screen,
	 * all unnecessary content into <body> is removed from the video-chat page
	 * and only the shortcode remains.
	 *
	 * @param object template Template.
	 */
	public function webrtc2_template_blank($template) {
		global $post;

		$_user_agent = filter_input(INPUT_SERVER, "HTTP_USER_AGENT", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowser"));
		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["place_on_page"] ) ? $val["place_on_page"] : "place0";

		if ( !empty($post) && has_shortcode( $post->post_content, "webrtc2" ) ) {
			if ( !empty($_user_agent) && false !== strpos( $_user_agent, "WP-WebRTC2-client" ) || "place0" === $val ) {
				webrtc2_build_template_blank();
			} else {
				return $template;
			}
		}
	}
	/**
	 * Used for option: only video-chat to page and for client application: Java client.
	 *
	 * Since the client application works on mobile devices with a small screen, wp toolbar hiden.
	 */
	public function webrtc2_hiden_toolbar() {
		$_user_agent = filter_input(INPUT_SERVER, "HTTP_USER_AGENT", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowser"));
		$val       = get_option( "webrtc2_main_settings" );
		$val       = isset( $val["place_on_page"] ) ? $val["place_on_page"] : "place0";
		$_uri      = webrtc2_validateURI();

		$post_id   = url_to_postid($_uri);
		$post_data = get_post($post_id);

		if ( !empty($post_data) && has_shortcode( $post_data->post_content, "webrtc2" ) ) {
			if ( !empty($_user_agent) && false !== strpos( $_user_agent, "WP-WebRTC2-client" ) || "place0" === $val ) {
				show_admin_bar(false);
			}
		}
	}
	/**
	 * Common functions of plugin.
	 */
	public function webrtc2_init() {
		$this->webrtc2_redirectToHTTPS();
		$this->webrt2_search_shortcode();
	}
	/**
	 * Redirect to https.
	 */
	public function webrtc2_redirectToHTTPS() {
		if( !is_ssl() ) {
			wp_redirect("https://" . $_SERVER["HTTP_HOST"] . webrtc2_validateURI(), 301);
			exit();
		}
	}
	/**
	 * Search for pages on which the shortcode [webrtc2] is set.
	 */
	public function webrt2_search_shortcode() {
		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["place_on_page"] ) ? $val["place_on_page"] : "place0";

		if ("place0" === $val) {
			// Update item menu.
			$list_pages = get_pages();
			foreach ( $list_pages as $key => $value ) {
				if ( has_shortcode( $value->post_content, "webrtc2" ) ) {
					$this->pages_shortcode[] = $value->post_title;
				}
			}
		}
	}
	/**
	 * Since the client application works on mobile devices with a small screen, profile items hiden.
	 */
	public function webrtc2_hiden_profile_items() {
		$_user_agent = filter_input(INPUT_SERVER, "HTTP_USER_AGENT", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowser"));

		if ( !empty($_user_agent) && false !== strpos( $_user_agent, "WP-WebRTC2-client" ) ) {
			remove_action( "admin_color_scheme_picker", "admin_color_scheme_picker" );
			?>
			<style type="text/css">
				#wpadminbar {display: none;}
				html.wp-toolbar {padding-top: 0;}
				.show-admin-bar {display: none;}
				H2:nth-of-type(1) {display: none;}
				H2 {color: blue;}
			</style>
			<?php
		}
	}
	/**
	 * Adds the metadata displayed for the plugin to the plugins table.
	 *
	 * @param string $items The setting item will be displayed in the plugin data.
	 * @param string $file  The path to the plugin file relative to the plugin directory.
	 * @return object $meta Items displayed in plugin data.
	 */
	public function webrtc2_plugin_meta( $meta, $file ) {
		if ( "wp-webrtc2/wp-webrtc2.php" == $file ) {
			$webrtc2_url_setting = get_admin_url( null, "admin.php?page=webrtc2_settings", "https" );
			$row_meta["Setting"] =  "<a href=". esc_url( $webrtc2_url_setting )."  target='_blank'>Setting</a>";

			$meta = array_merge( $meta, $row_meta );
		}
		return $meta;
	}
	/**
	 * Add tag viewport on page.
	 */
	public function webrtc2_viewport_tags() {
		global $post;

		$_user_agent = filter_input(INPUT_SERVER, "HTTP_USER_AGENT", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowser"));

		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["place_on_page"] ) ? $val["place_on_page"] : "place0";

		$viewport = ( get_post_meta( get_queried_object_id(), "viewport", true ) );
		if ( !$viewport ) {
			?>
			<meta name="viewport" content="width=device-width,initial-scale=1.0">
			<?php
		}
		if ( !empty($post) && has_shortcode( $post->post_content, "webrtc2" ) ) {
			if ( !empty($_user_agent) && false !== strpos( $_user_agent, "WP-WebRTC2-client" ) || "place0" === $val ) {
				?>
				<style type="text/css">
		    header, footer {
		      display: none !important;
		    }
		    section {
		    	padding:0 !important;
		    }
		  	</style>
				<?php
			}
		}
	}
	/**
	 * Checking the current functioning of stun servers.
	 */
	public function webrtc2_update_stun() {
		global $wpdb;

		$val           = get_option( "webrtc2_main_settings" );
    $whois_service = isset( $val["whois_service"] ) ? esc_attr( $val["whois_service"] ) : "none";

    if ( "none" !== $whois_service ) {
    	update_option("whois_service", $whois_service);

			$result = $wpdb->get_results(
	      "
	      SELECT *
	      FROM {$wpdb->prefix}webrtc2_stun_servers
	      WHERE check_date = '' OR DATE(check_date) < CURDATE()
	      ",
	      "ARRAY_A"
	    );
			if ( !empty($result) ) {
				if ( !wp_next_scheduled( "webrtc2_update_repeat" ) ) {
					wp_schedule_event( time() + 600, "hourly", "webrtc2_update_repeat" );
				}
				$WebRTC2_List_Table_Srv = new WebRTC2_List_Table_Srv();
	      $WebRTC2_List_Table_Srv->webrtc2_update_tbl($result, "no");
	    }
		}
	}
	/**
	 * Repeat the Stun servers list update.
	 */
	public function webrtc2_update_stun_repeat() {
		global $wpdb;

    $result = $wpdb->get_results(
      "
      SELECT *
      FROM {$wpdb->prefix}webrtc2_stun_servers
      WHERE ip_address = '' OR ip_address Like '%failed%' OR check_date = '' OR DATE(check_date) < CURDATE()
      ",
      "ARRAY_A"
    );
    if ( !empty($result) ) {
			$WebRTC2_List_Table_Srv = new WebRTC2_List_Table_Srv();
      $WebRTC2_List_Table_Srv->webrtc2_update_tbl($result, "auto");
    } else {
    	wp_clear_scheduled_hook( "webrtc2_update_repeat" );
    }
	}
	/**
	 * Removes data in the 'call statistics' table when the retention period expires.
	 */
	public function webrtc2_truncate_stat() {
		global $wpdb;
		$val           = get_option( "webrtc2_main_settings" );
		$duration_stat = isset( $val["duration_stat"] ) ? $val["duration_stat"] : "30";
		if ( 0 !== $duration_stat ) {
			$results = $wpdb->get_results(
				$wpdb->prepare(
					"
					DELETE
					FROM {$wpdb->prefix}webrtc2_call_stat
					WHERE `date_start` != '' AND `date_start` < DATE_SUB(CURDATE(),INTERVAL %d DAY)
	        ",
					$duration_stat
				)
			);
			$results = $wpdb->get_results(
				$wpdb->prepare(
					"
					DELETE
					FROM {$wpdb->prefix}webrtc2_call_stat
					WHERE `date_stop` != '' AND `date_stop` < DATE_SUB(CURDATE(),INTERVAL %d DAY)
	        ",
					$duration_stat
				)
			);
		} else {
			wp_clear_scheduled_hook( "webrtc2_truncate" );
		}
	}
	/**
	 * Edit user profile.
	 *
	 * @param  integer $user_id User ID.
	 */
	private function webrtc2_edit_profile($user_id) {
		// get user IP.
		$user_ip = webrtc2_validateIP();

		// get whois_service.
		$val           = get_option( "webrtc2_main_settings" );
		$whois_service = isset( $val["whois_service"] ) ? esc_attr( $val["whois_service"] ) : "none";

		$arr = webrtc2_who_is( $user_ip, $whois_service );

		if( isset($arr["failed"]) ) {
			update_user_meta( $user_id, "time_zone", "" );
			update_user_meta( $user_id, "user_country_code", "" );
			update_user_meta( $user_id, "user_country_name", "" );
			update_user_meta( $user_id, "user_city", "" );
			update_user_meta( $user_id, "user_region", "" );
			update_user_meta( $user_id, "user_ip", $arr["failed"] );
		} else {
			$country = isset( $arr["country"] ) ? ( $arr["country"] ) : "";

			$arr_country = explode( "<br>", $country );

			update_user_meta( $user_id, "time_zone", esc_attr( $arr["timezone"] ) );
			update_user_meta( $user_id, "user_country_code", esc_attr( trim($arr_country[0]) ) );
			update_user_meta( $user_id, "user_country_name", esc_attr( substr( $arr_country[1], 9 ) ) );
			update_user_meta( $user_id, "user_region", esc_attr( substr( $arr_country[2], 8 ) ) );
			update_user_meta( $user_id, "user_city", esc_attr( substr( $arr_country[3], 6 ) ) );
			update_user_meta( $user_id, "user_ip", esc_attr( $user_ip ) );
		}
	}
	/**
	 * Update 6 fields (time_zone,user_country_code,user_country_name,
	 * user_region,user_city,user_ip) to the user profile.
	 * Clear webrtc2_users_online option.
	 *
	 * @param string $user_login User login.
	 * @param string $user       User.
	 */
	public function webrtc2_users_online($user_login, $user) {
		$this->webrtc2_edit_profile($user->ID);
		update_option( "webrtc2_users_online", "" );
	}
	/**
	 * Adds 6 fields (time_zone,user_country_code,user_country_name,
	 * user_region,user_city,user_ip) to the user profile.
	 *
	 * @param string $user_id  User id.
	 * @param string $userdata User data.
	 */
	public function webrtc2_registered_user( $user_id, $userdata ) {
		$this->webrtc2_edit_profile($user_id);
	}
	/**
	 * Add menu page for admin panel.
	 */
	public function webrtc2_admin_menu() {
		if ( is_admin() || current_user_can("manage_options") ) {
			add_menu_page( __( "WP-WebRTC2", "webrtc2" ), 
				__( "WP-WebRTC2", "webrtc2" ), 
				"manage_options", 
				"webrtc2_overview", 
				array( $this, "webrtc2_overview" ), 
				"dashicons-video-alt", "76" );

			add_submenu_page( "webrtc2_overview", 
				__( "Settings", "webrtc2" ), 
				__( "Settings", "webrtc2" ), 
				"manage_options", 
				"webrtc2_settings", 
				array( $this, "webrtc2_settings" ) );

			add_submenu_page( "webrtc2_overview", 
				__( "Statistic", "webrtc2" ), 
				__( "Statistic", "webrtc2" ), 
				"manage_options", 
				"webrtc2_statistic", 
				array( $this, "webrtc2_statistic" ) );

			add_submenu_page( "webrtc2_overview", 
				__( "Servers", "webrtc2" ), 
				__( "Servers", "webrtc2" ), 
				"manage_options", 
				"webrtc2_servers", 
				array( $this, "webrtc2_servers" ) );
		}
	}
	/**
	 * Adds 6 fields (time_zone,user_country_code,user_country_name,
	 * user_region,user_city,user_ip) to the user profile.
	 *
	 * @param  string $user_contact Registered user.
	 * @return object $user_contact
	 */
	public function webrtc2_user_contactmethods( $user_contact ) {
		$user_contact["time_zone"]         = __( "Time zone", "webrtc2" );
		$user_contact["user_country_code"] = __( "Country code", "webrtc2" );
		$user_contact["user_country_name"] = __( "Country name", "webrtc2" );
		$user_contact["user_region"]       = __( "Region", "webrtc2" );
		$user_contact["user_city"]         = __( "City", "webrtc2" );
		$user_contact["user_ip"]           = __( "IP address", "webrtc2" );

		return $user_contact;
	}
	/**
	 * Create and save screen settings of plugin.
	 *
	 * @param string  $screen_option Screen options.
	 * @param string  $option        Option.
	 * @param integer $value         Value.
	 * @return object $value
	 */
	public function webrtc2_set_screen_option($screen_option, $option, $value) {

		return $value;
	}
	/**
	 * Add help tabs of plugin.
	 */
	public function webrtc2_screen_options() {
		$_page = filter_input(INPUT_GET, "page", FILTER_DEFAULT);

		// Used for client application: Java client.
		$this->webrtc2_hiden_profile_items();

		// execute only on webrtc2 pages, otherwise return null.
		if ( "webrtc2_settings" !== $_page &&
			"webrtc2_overview" !== $_page &&
			"webrtc2_statistic" !== $_page &&
			"webrtc2_servers" !== $_page ) {
			return;
		}
		if ( "webrtc2_settings" === $_page ) {
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-1",
					"title"   => esc_html( "1. About the environment", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator controls the site's software environment. The most interesting may be the environment parameters:<br>1. The version of PHP that is installed by the site's hosting provider.<br>2. Availability to use PHP mail function - mail().<br>3. Does the hosting provider provide a mail server for the site administrator.<br>Depending on the capabilities provided, the site administrator sets the option value to 11. <b>Email</b>", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-2",
					"title"   => esc_html( "2. Duration of remember of call statistics data", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator determines the duration of data storage in the 'Call Statistics' table in the range from 1 to 365 days. If set to 0 days, then the data in the 'call statistics' table will not be remembered.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-3",
					"title"   => esc_html( "3. Duration of the video-chat", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator determines the duration of the video-chat in the range of 0.5 - 24 hours. The current value of the video-chat time will be displayed in the graphical interface of the plugin as a countdown timer. After the set period of time, the video-chat will be stoped.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-4",
					"title"   => esc_html( "4. Disable video-chat for", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator lists the user name of registered site visitors for whom video-chat is prohibited. This can be used by the site administrator in relation to those registered users who violate certain rules on the site.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-5",
					"title"   => esc_html( "5. Video-chat", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator selects the category of registered visitors for whom video-chat is available. The site administrator is not involved in video-chat for security purposes, in order to prevent his login from being displayed to all other site visitors.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-6",
					"title"   => esc_html( "6. WHO-IS service", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator selects a provider that determines the country and city in the process of registering or login a site visitor. This information is displayed on the video-chat page in table 'Select member from all users', field 'Land'. In a real situation, the end user, being at home or in the office, most often has a dynamic, weekly changing IP address of the user's router, which is assigned to him by the Internet provider. The user can move from home to office, travel across countries.
						If desired, the administrator of the site where this video connection plug-in is installed can select the
						WHO-IS service provider option, which passes to the plug-in the country-city from which the video
						connection user is authorized. If the administrator does not need it, he can disable this option by
						selecting - None. If you select None, the plugin will not automatically select the optimal STUN server, but will use the one that will be registered by the site administrator in field STUN server", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-7",
					"title"   => esc_html( "7. STUN servers", "webrtc2" ),
					"content" => "<p>" . __( "Site administrator enters one value Stun server. The recommended list is located below on the settings page and is optional. Session Traversal Utilities for NAT (STUN) is a protocol for finding and determining the public address of each node and any restrictions in the router connected to the node that prevent direct connection to the node. The host will send a request to the STUN server on the Internet, which will respond with the public address of the client and whether the host behind the NAT router is available or not. If the site administrator fills in the Stun server field, the plugin will use the value of this field to establish the user's video connection. If the site administrator leaves this field empty, the plugin will select the optimal Stun server, taking into account the user's Time zone, in order to minimize the delay in the response time of the Stun server to user browser requests. Plugin once a day automatically checks each of their 375 Stun servers for operability and remembers the reaction time of each. The plugin will offer the user's browser a Stun server with the same Time zone and its minimum response delay.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-8",
					"title"   => esc_html( "8. TURN server", "webrtc2" ),
					"content" => "<p>" . __( "Site administrator follows the instructions in the Settings -> Turn server section of the plugin (paragraph 1-3). Click the Execute button (a message will appear below: data received). Click the Save plugin settings button.<br>Some routers using NAT apply a restriction called 'Symmetric NAT'. This means that the router will only accept connections from nodes to which the first node was previously connected. Traversal Using Relays around NAT (TURN) is designed to circumvent the 'Symmetric NAT' restriction by opening a connection to the TURN server and relaying all information through this server. The first node makes a connection to the TURN server and tells the other node to send packets to this server, which will then be forwarded to the first node. Obviously they come with some overhead, so this is only used if there are no other alternatives.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-9",
					"title"   => esc_html( "9. Appearance", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator determines the color scheme (dark or light) of the chat video on the site page.", "webrtc2" ) . "<br>" . __("dark - file is connected: ","webrtc2" ) . plugins_url( 'css/webrtc2-dark.css' , __FILE__ ) . "<br>". __("light - file is connected: ","webrtc2" ) . plugins_url( 'css/webrtc2-light.css' , __FILE__ ) . "<br>" . __("There are times when a website theme's .css file conflicts with a plugin's .css file. In this case, the site administrator can adjust the .css of this plugin at his discretion.","webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-10",
					"title"   => esc_html( "10. Place on page", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator determines whether to place only video-chat on the site page, or add video-chat to the content of the site page.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-11",
					"title"   => esc_html( "11. Email", "webrtc2" ),
					"content" => "<p>" . __( "The site administrator can use Email to send letters to video-chat participants:<br>1.The initiator of the video chat will receive each new notification before the session from video chat users by email. However, all messages from video chat users addressed to the initiator will be stored on the answering machine until he appears in the video chat.<br>2.If text messages were exchanged during a video chat session, the video chat participant may receive a full list of those messages via email at the end of the video chat session.<br>3.Items 1-2 are determined by each video chat participant in their profile.<br>4.There are cases when the hosting provider provides the site owner with a mail server only through its mail application. In this case, the site owner can ask the hosting provider to provide access to the mail server to the video-chat application (WP WebRTC2 plugin).", "webrtc2" ) . "</p>" . "<p>" . __("<b>Note: </b>Select the method for sending email depending on whether your hosting provider provides the PHP mail() function or a mail server.<br>See <b>About the environment</b> in WP-WebRTC2: Settings.", "webrtc2") . "</p>",
				)
			);
		}
		if ( "webrtc2_statistic" === $_page ) {
			// if per page option is not set, use default.
			$args = array(
				"label"   => __( "The number of elements on the page:", "webrtc2" ),
				"default" => 8,
				"option"  => "stat_per_page",
			);
			// display options.
			add_screen_option( "per_page", $args );
			// add columns to screen options.
			$table = new WebRTC2_List_Table_Stat();

			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-0",
					"title"   => __( "Overview", "webrtc2" ),
					"content" => "<p>" . __( "Table: User call statistics - contains information about calls made by users registered on the site. The table consists of 9 fields in which the data can be sorted in any order. By 4 fields (user name, role, user IP, browser) it is possible to search for relevant information. If the table is overflowing with data, part of the table data can be deleted using bulk actions (delete). Part of the table fields can be hidden if necessary using the option (Screen Options). <br>Bulk actions:<br>1. Delete - removes previously marked rows from the table.<br>2. Report - generates a report file from the previously marked rows of the table in HTML format.<br>Search - search data by fields: User name, Role, User IP, Browser. To reset the search - make the search field empty and click the Search button.", "webrtc2" ),
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-1",
					"title"   => __( "1. №", "webrtc2" ),
					"content" => "<p>" . __( "Record number in the database. It is generated automatically when a user makes or ends a call and is unique in the table.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-2",
					"title"   => __( "2. Session ID", "webrtc2" ),
					"content" => "<p>" . __( "The number of a video chat session between two participants.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-3",
					"title"   => __( "3. User name", "webrtc2" ),
					"content" => "<p>" . __( "A unique username that is created when registering on the site. The recommended username length is 9 characters. Field format: who called (who he called).", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-4",
					"title"   => __( "4. Role", "webrtc2" ),
					"content" => "<p>" . __( "User role. Usually, when registering a user, a role is assigned - subscriber. Only a site administrator can change the role. To make a video connection, the role of the user does not matter. It is needed by the administrator to group users. Access of groups (roles) of users to the video call service is carried out by the site administrator in the settings of this plugin.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-5",
					"title"   => __( "5. Initiator", "webrtc2" ),
					"content" => "<p>" . __( "video connection initiator. The user who calls (invites) another registered user to a video connection is appointed as the initiator of the connection. Accordingly, the called user is assigned as the responder. The respondent can agree to video communication or reject the call (invitation).", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-6",
					"title"   => esc_html( "6. User IP", "webrtc2" ),
					"content" => "<p>" . __( "The user's IP address. In most cases, the ip address is dynamic and changes once a week by the user's Internet provider. In addition, the user can change the place from which he accesses the Internet (place of residence, place of work, travel to countries and cities).", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-7",
					"title"   => esc_html( "7. Country", "webrtc2" ),
					"content" => "<p>" . __( "Field format: [flag country code]. If you move the mouse cursor over this field, a hint will appear - the city. This is the geographic location from which the video connection is made by the user. This information is supplied by the WHO-IS provider, which is selected by the site administrator in the settings menu of this plugin. This feature can be disabled by the site administrator by selecting the None option in the plugin's settings.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-8",
					"title"   => esc_html( "8. Date start", "webrtc2" ),
					"content" => "<p>" . __( "Field format: [Y-m-d H:i:s]. The start time of the video call. At this point, the video link countdown timer starts. The duration of the video communication session is set by the site administrator in the settings of this plugin.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-9",
					"title"   => esc_html( "9. Date stop", "webrtc2" ),
					"content" => "<p>" . __( "Field format: [Y-m-d H:i:s]. The end time of the video call. This moment comes when the user presses the Stop button or by the command of the countdown timer after the expiration of the time set by the site administrator in the settings of this plugin.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-10",
					"title"   => esc_html( "10. Browser", "webrtc2" ),
					"content" => "<p>" . __( "Field format: [browser name, browser version]. Information about the browser from which the user establishes a video connection.", "webrtc2" ) . "</p>",
				)
			);
		}
		if ( "webrtc2_servers" === $_page ) {
			// if per page option is not set, use default.
			$args = array(
				"label"   => __( "The number of elements on the page:", "webrtc2" ),
				"default" =>  50,
				"option"  => "srv_per_page",
			);
			// display options.
			add_screen_option( "per_page", $args );
			// add columns to screen options.
			$table = new WebRTC2_List_Table_Srv();

			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-0",
					"title"   => esc_html( "Overview", "webrtc2" ),
					"content" => "<p>" . __( "Table: stun servers - contains information about public servers involved in organizing video communication by technology WebRTC. Part of the table fields can be hidden if necessary using the option (Screen Options). The content of the table is imported by the plugin from the file ...\plugins\wp-webrtc2\settings\webrtc2-stun-servers.php. The site administrator can add new data (Server name, port) to this file. The remaining fields of the table are formed by the plugin itself. To automatically update the data in the table, you must enable the 'WHO-IS service' option in the settings of this plugin. The table can be sorted, searched by fields: Server name, IP address, Time zone.<br>Bulk actions:<br>1. Delete - removes previously marked rows from the table.<br>2. Report - generates a report file from the previously marked rows of the table in HTML format.<br>3. Update - updates previously marked table rows. The plugin automatically updates all table data once a day.<br>While this action is running, the 'Response' field may contain the following runtime errors:", "webrtc2" )."<br>" .esc_html("error0: Empty data received from server Stun (module: class-webrtc2-stun-client.php, str: 107)", "webrtc2")."<br>" .esc_html("error1: info['len'] > rest_len (module: class-webrtc2-stun-client.php, str: 114)", "webrtc2")."<br>".esc_html("error2: info['len'] !== 8 (module: class-webrtc2-stun-client.php, str: 124)", "webrtc2")."<br>".esc_html("error3: info['flag'] !== 1 (module: class-webrtc2-stun-client.php, str: 130)", "webrtc2" )."<br>".esc_html("error4: data not received from server Stun (module: class-webrtc2-stun-client.php, str: 147)", "webrtc2" )."<br>".__("Search - search data by fields: Server name, IP address, Time zone. To reset the search - make the search field empty and click the Search button.", "webrtc2"). "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-1",
					"title"   => esc_html( "1. №", "webrtc2" ),
					"content" => "<p>" . __( "Record number in the database. It is generated automatically  and is unique in the table.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-2",
					"title"   => esc_html( "2. Server name", "webrtc2" ),
					"content" => "<p>" . __( "The name of the Stun server. Used by the plugin to determine the IP address of the router (public address) of the user who establishes a video connection using WebRTC technology.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-3",
					"title"   => esc_html( "3. Port", "webrtc2" ),
					"content" => "<p>" . __( "The port number of the Stun server that the user connects to to obtain their public IP address.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-4",
					"title"   => esc_html( "4. IP address", "webrtc2" ),
					"content" => "<p>" . __( "The public IP address of the Stun server. The numeric equivalent of the server name.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-5",
					"title"   => esc_html( "5. Provider", "webrtc2" ),
					"content" => "<p>" . __( "The provider that issued the IP address to the owner of the Stun server.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-6",
					"title"   => esc_html( "6. Country", "webrtc2" ),
					"content" => "<p>" . __( "Country, Region, City - geographic location of the Stun server.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-7",
					"title"   => esc_html( "7. Time zone", "webrtc2" ),
					"content" => "<p>" . __( "The time zone of the geographic location of the Stun server.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-8",
					"title"   => esc_html( "8. Check date", "webrtc2" ),
					"content" => "<p>" . __( "Stun server health check time, which is performed by the plugin once a day, fixing the response time of the Stun server to a request from the plugin.", "webrtc2" ) . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-9",
					"title"   => esc_html( "9. Response", "webrtc2" ),
					"content" => "<p>" . __( "The response of the Stun server to the plugin request. The response contains the public IP address and port number of the site where the plugin is installed. In case of temporary inoperability of the Stun server, the plugin writes the value - failed to the table. The total execution time of a PHP script cannot exceed 5 minutes. However, when checking the health of the total number of 375 stun servers, a situation may occur when the total time of the script reaches its maximum value - 5 minutes. In this case, the script stops its work. The site administrator may notice that the last part of the stun server list has the date of the previous health check. In this case, you should mark this part of the list and repeat the check using: bulk actions - update. If the site administrator notices that some of the stun servers for a certain time (1-2 weeks) do not pass the automatic check successfully, he can delete the compromised stun servers using: bulk actions - delete.<br>If the administrator used the Bulk actions: Update command, - manually will appear in the Response field. If there was an automatic re-updating of the data in the Response field will appear - auto.", "webrtc2") . "</p>",
				)
			);
			get_current_screen()->add_help_tab(
				array(
					"id"      => "webrtc2-tab-10",
					"title"   => esc_html( "10. Time delay", "webrtc2" ),
					"content" => "<p>" . __( "The response time of the Stun server to a plugin request about the current health of the Stun server.", "webrtc2" ) . "</p>",
				)
			);
		}
		// Help sidebars are optional.
		get_current_screen()->set_help_sidebar(
			'<p><strong>' . __( 'Additional information:', 'webrtc2' ) . '</strong></p>' .
			'<p><a href="https://wordpress.org/plugins/wp-webrtc2/" target="_blank">' . __( 'page the WordPress repository', 'webrtc2' ) . '</a></p>' .
			'<p><a href="https://adminkov.bcr.by/contact/" target="_blank">' . __( 'home page of plugin', 'webrtc2' ) . '</a></p>' .
			'<p><a href="https://adminkov.bcr.by/support/" target="_blank">' . __( 'support page of plugin', 'webrtc2' ) . '</a></p>'
		);
	}
	/**
	 * Create and control page Servers.
	 */
	public function webrtc2_servers() {
		$webrtc2_table = new WebRTC2_List_Table_Srv();
		$webrtc2_table->prepare_items();

		if ((isset($_POST["action"]) && "delete" === $_POST["action"]) ||
				(isset($_POST["action2"]) && "delete" === $_POST["action2"])) {
			if (isset($_POST["id"])) {
				?>
				<div class="notice notice-success is-dismissible">
					<p><?php echo __( "Items deleted", "webrtc2" ); ?> : (items=<?php echo count( $_POST["id"] ); ?>), date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
					</p>
				</div>
				<?php
			}else{
				?>
				<div class="notice notice-warning is-dismissible">
					<p><?php echo __( "No items selected for delete", "webrtc2" ); ?>, date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
					</p>
				</div>
				<?php
			}
		}
		if ((isset($_POST["action"]) && "report" === $_POST["action"]) ||
				(isset($_POST["action2"]) && "report" === $_POST["action2"])) {
			if (isset($_POST["id"])) {
				$path = plugin_dir_url( __FILE__ ) . "report/report.html";
				?>
				<div class="notice notice-success is-dismissible">
					<p><?php echo __( "Report created", "webrtc2" ); ?> : (items=<?php echo count( $_POST["id"] ); ?>), date-time: ( <?php echo __( current_time( "mysql" ) ); ?>) <a href="<?php echo __($path);?>" download>download: report.html</a>
					</p>
				</div>
				<?php
			}else{
				?>
				<div class="notice notice-warning is-dismissible">
					<p><?php echo __( "No items selected for create report", "webrtc2" ); ?>, date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
					</p>
				</div>
				<?php
			}
		}
		if ((isset($_POST["action"]) && "update" === $_POST["action"]) ||
				(isset($_POST["action2"]) && "update" === $_POST["action2"])) {
			if (isset($_POST["id"])) {
				?>
				<div class="notice notice-success is-dismissible">
					<p><?php echo __( "Items updated", "webrtc2" ); ?> : (items=<?php echo count( $_POST["id"] ); ?>), date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
					</p>
				</div>
				<?php
				if ("" !== WebRTC2_Stun_Client::getError()) {
					?>
					<div class="notice notice-warning is-dismissible">
						<p><?php echo __( "Stun error: ", "webrtc2" ). WebRTC2_Stun_Client::getError() ?>, date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
						</p>
					</div>
					<?php
				}
			}else{
				?>
				<div class="notice notice-warning is-dismissible">
					<p><?php echo __( "No items selected for update", "webrtc2" ); ?>, date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
					</p>
				</div>
				<?php
			}
		}
		$plugine_info = get_plugin_data( __DIR__ . "/wp-webrtc2.php" );
		?>
		<div class="wrap">
			<span class="dashicons dashicons-video-alt" style="float: left;"></span>
			<h1><?php echo esc_html( $plugine_info["Name"] ) . ": " . __( "stun servers", "webrtc2" ); ?></h1>
			<br>
			<?php
			// check button graph.
			$data = $this->webrtc2_stun_chart_data();
			$status_button = (0 !== count($data[0])) ? "" : " disabled";
			?>
			<div class="alignleft actions">
				<form method="POST">
					<input type="submit" id="graph_stun" class="button action" name="chart" value="Graph" <?php echo($status_button); ?>>
				</form>
			</div>
			<form method="POST">
				<div class="alignright actions" title="enter: Server name, IP address, Time zone">
				<?php
					$webrtc2_table->search_box("search", "search_id");
					if ("" !== get_option( "webrtc2_search_srv" )) {
						?>
						<script type="text/javascript">
							var search = document.getElementById("search_id-search-input");
							if (search) {
								search.value = "<?php echo get_option( 'webrtc2_search_srv' );?>";
							}
						</script>
						<?php
					}
				?>
				</div>
				<?php
					$webrtc2_table->display();
				?>
			</form>
		</div>
		<?php
		if (isset($_POST["chart"])) {
			$this->webrtc2_stun_chart();
		}
	}
	/**
	 * Task Cron Schedule.
	 *
	 * @return string Task Cron Schedule.
	 */
	public function webrtc2_task_cron_schedule() {
		$task_cron_schedule = "";

		if ( wp_next_scheduled( "webrtc2_update_repeat" ) ) {
			$date_time = date( "Y-m-d H:i:s", wp_next_scheduled( "webrtc2_update_repeat" ) );
			$task_cron_schedule = get_date_from_gmt( $date_time, "M j, Y -> H:i:s" ) . " / ";
		}
		if ( wp_next_scheduled( "webrtc2_update" ) ) {
			$date_time = date( "Y-m-d H:i:s", wp_next_scheduled( "webrtc2_update" ) );
			$task_cron_schedule = $task_cron_schedule . get_date_from_gmt( $date_time, "M j, Y -> H:i:s" );
		}

		return $task_cron_schedule;
	}
	/**
	 * Create chart of call statistics.
	 */
	public function webrtc2_stat_chart() {
		$img1 = set_url_scheme( plugins_url( "/images/screw.png", __FILE__ ), "https" );
	  $img2 = set_url_scheme( plugins_url( "/images/screw_l.png", __FILE__ ), "https" );
	  $img3 = set_url_scheme( plugins_url( "/images/screw_r.png", __FILE__ ), "https" );

		$data = $this->webrtc2_stat_chart_data();
		$arr  = array();
		foreach ( $data[0] as $key => $value ) {
			$arr[$key] = [$value["user_name"], intval($value["all_time"])];
		}
		$arr = json_encode($arr);
		?>
		<div class="win-popup">
      <label class="btn"></label>
      <input type="checkbox" style="display: none;" checked>
      <div class="popup-content">
        <div class="popup-header">
          <h2>Call statistics</h2>
          <img src="<?php echo ( $img1 ); ?>" style="position: absolute;top: 10px;left: 12px;">
          <a href="" class="btn-close" title="close"></a>
        </div>
        <div class="popup-body">
          <img src="<?php echo ( $img2 ); ?>" style="position: absolute;top: 55px;left: 12px;z-index:2;">
          <img src="<?php echo ( $img3 ); ?>" style="position: absolute;top: 335px;left: 12px;z-index:2;">
          <img src="<?php echo ( $img3 ); ?>" style="position: absolute;top: 55px;left: 96%;z-index:2;">
          <img src="<?php echo ( $img2 ); ?>" style="position: absolute;top: 335px;left: 96%;z-index:2;">
          <div id="popup_chart"></div>
          <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
          <script type="text/javascript">
            var arrData =  "<?php echo esc_html( $arr ); ?>";
            arrData = arrData.replace( /&quot;/g, '"' );
            arrData = JSON.parse( arrData );

            // Load the Visualization API and the corechart package.
            google.charts.load("current", {"packages":["corechart"]});

            // Set a callback to run when the Google Visualization API is loaded.
            google.charts.setOnLoadCallback(drawChart);

            // Callback that creates and populates a data table,
            // instantiates the pie chart, passes in the data and
            // draws it.
            function drawChart() {
              // Create the data table.
              var dataTable = new google.visualization.DataTable();
              dataTable.addColumn("string", "Topping");
              dataTable.addColumn("number", "Slices");
              dataTable.addRows( arrData );
              // Set chart options
              var options = {
              	"title":"All calls: <?php echo($data[1]);?>; All time of calls: <?php echo($data[2]);?>;",
                left: 0, top: 0, height: 300, width: 660,
              };
              // Instantiate and draw our chart, passing in some options.
              var chart = new google.visualization.PieChart(document.getElementById("popup_chart"));
              chart.draw(dataTable, options);
            }
          </script>
        </div>
        <div class="popup-footer">
          <label style="padding: 0;"><b>TURN Server: </b>Plan: FREE; <b>Plan renews: </b>monthly; <b>Quota Usage: </b> 50GB;</label> <a href="https://dashboard.metered.ca/" target="_blank"> more details</a>
        </div>
      </div>
    </div>
		<?php
	}
	/**
	 * Create chart of stun servers.
	 */
	public function webrtc2_stun_chart() {
		$img1 = set_url_scheme( plugins_url( "/images/screw.png", __FILE__ ), "https" );
	  $img2 = set_url_scheme( plugins_url( "/images/screw_l.png", __FILE__ ), "https" );
	  $img3 = set_url_scheme( plugins_url( "/images/screw_r.png", __FILE__ ), "https" );

		$data = $this->webrtc2_stun_chart_data();
		$arr  = array();
		foreach ( $data[0] as $key => $value ) {
			$arr[$key] = [$value["timezone"], intval($value["count"])];
		}
		$arr = json_encode($arr);
		?>
		<div class="win-popup">
      <label class="btn"></label>
      <input type="checkbox" style="display: none;" checked>
      <div class="popup-content">
        <div class="popup-header">
          <h2>Live stun servers</h2>
          <img src="<?php echo ( $img1 ); ?>" style="position: absolute;top: 10px;left: 12px;">
          <a href="" class="btn-close" title="close"></a>
        </div>
        <div class="popup-body">
          <img src="<?php echo ( $img2 ); ?>" style="position: absolute;top: 55px;left: 12px;z-index:2;">
          <img src="<?php echo ( $img3 ); ?>" style="position: absolute;top: 335px;left: 12px;z-index:2;">
          <img src="<?php echo ( $img3 ); ?>" style="position: absolute;top: 55px;left: 96%;z-index:2;">
          <img src="<?php echo ( $img2 ); ?>" style="position: absolute;top: 335px;left: 96%;z-index:2;">
          <div id="popup_chart"></div>
          <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
          <script type="text/javascript">
            var arrData =  "<?php echo esc_html( $arr ); ?>";
            arrData = arrData.replace( /&quot;/g, '"' );
            arrData = JSON.parse( arrData );

            var who_is = "<?php echo get_option("whois_service"); ?>";
            who_is = "" + who_is;

            // Load the Visualization API and the corechart package.
            google.charts.load("current", {"packages":["corechart"]});

            // Set a callback to run when the Google Visualization API is loaded.
            google.charts.setOnLoadCallback(drawChart);

            // Callback that creates and populates a data table,
            // instantiates the pie chart, passes in the data and
            // draws it.
            function drawChart() {
              // Create the data table.
              var dataTable = new google.visualization.DataTable();
              dataTable.addColumn("string", "Topping");
              dataTable.addColumn("number", "Slices");
              dataTable.addRows( arrData );
              // Set chart options
              var options = {
              	"title":"location by time zones (WHO-IS service: " + who_is + ")",
                left: 0, top: 0, height: 300, width: 660,
              };
              // Instantiate and draw our chart, passing in some options.
              var chart = new google.visualization.PieChart(document.getElementById("popup_chart"));
              chart.draw(dataTable, options);
            }
          </script>
        </div>
        <div class="popup-footer">
          <label style="padding: 0;"><b>Live STUN servers:</b> <?php echo($data[1]);?>; <b>All Stun servers:</b> <?php echo($data[2]);?>; <b>Next check:</b> <?php echo( $this->webrtc2_task_cron_schedule() ); ?></label>
        </div>
      </div>
    </div>
		<?php
	}
	/**
	 * Receive data for chart of call statistics.
	 *
	 * @return array  [[Records of call statistics]].
	 */
	public function webrtc2_stat_chart_data() {
		global $wpdb;

		$results = $wpdb->get_results(
      "
      SELECT user_name, SUM(period_time) AS all_time FROM (
			SELECT user_name, TIMESTAMPDIFF(SECOND, `date_start`, `date_stop`) AS period_time
			      FROM {$wpdb->prefix}webrtc2_call_stat as alias1
			) AS alias2 GROUP BY user_name
      ",
      "ARRAY_A"
    );

    // All calls.
		$sql = "SELECT count(*) FROM {$wpdb->prefix}webrtc2_call_stat";
		$all_calls = $wpdb->get_var( $sql );

    // All time of calls.
		$sql = "SELECT SUM(period_time) AS all_time FROM (
						SELECT user_name, TIMESTAMPDIFF(SECOND, `date_start`, `date_stop`) AS period_time
						FROM wp_webrtc2_call_stat as alias1
						) AS alias2";
		$all_time = $wpdb->get_var( $sql );

		$seconds = $all_time;                 // Number of original seconds
		$minutes = floor($seconds / 60);      // Counting the minutes
		$hours   = floor($minutes / 60);      // Counting the number of full hours
		$minutes = $minutes - ($hours * 60);  // Counting the number of minutes left

		$all_time = $hours . 'hours : ' . $minutes . 'minutes';

		return [$results, $all_calls, $all_time];
	}
	/**
	 * Receive data for chart of stun servers.
	 *
	 * @return array  [[Records of live servers], Count servers live, Count servers all].
	 */
	public function webrtc2_stun_chart_data() {
		global $wpdb;

		$results = $wpdb->get_results(
      "
      SELECT timezone, COUNT(timezone) AS count
      FROM {$wpdb->prefix}webrtc2_stun_servers
      WHERE response NOT Like '%failed%' AND timezone NOT Like '%failed%' AND timezone != ''
      GROUP BY timezone
      ORDER BY timezone ASC
      ",
      "ARRAY_A"
    );

		$sql = "SELECT count(*) FROM {$wpdb->prefix}webrtc2_stun_servers
						WHERE response NOT Like '%failed%' AND timezone NOT Like '%failed%' AND timezone != ''";
		$count_servers_live = $wpdb->get_var( $sql );

    $sql = "SELECT count(*) FROM {$wpdb->prefix}webrtc2_stun_servers";
		$count_servers_all  = $wpdb->get_var( $sql );

    return [$results, $count_servers_live, $count_servers_all];
	}
	/**
	 * Create and control page Statistic.
	 */
	public function webrtc2_statistic() {
		$webrtc2_table = new WebRTC2_List_Table_Stat();
		$webrtc2_table->prepare_items();

		if ((isset($_POST['action']) && "delete" === $_POST['action']) ||
				(isset($_POST['action2']) && "delete" === $_POST['action2'])) {
			if (isset($_POST["id"])) {
				?>
				<div class="notice notice-success is-dismissible">
					<p><?php echo __( "Items deleted", "webrtc2" ); ?> : (items=<?php echo count( $_POST["id"] ); ?>), date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
					</p>
				</div>
				<?php
			}else{
				?>
				<div class="notice notice-warning is-dismissible">
					<p><?php echo __( "No items selected for delete", "webrtc2" ); ?>, date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
					</p>
				</div>
				<?php
			}
		}
		if ((isset($_POST['action']) && "report" === $_POST['action']) ||
				(isset($_POST['action2']) && "report" === $_POST['action2'])) {
			if (isset($_POST["id"])) {
				$path = plugin_dir_url( __FILE__ ) . "report/report.html";
				?>
				<div class="notice notice-success is-dismissible">
					<p><?php echo __( "Report created", "webrtc2" ); ?> : (items=<?php echo count( $_POST["id"] ); ?>), date-time: ( <?php echo __( current_time( "mysql" ) ); ?>) <a href="<?php echo __($path);?>" download>download: report.html</a>
					</p>
				</div>
				<?php
			}else{
				?>
				<div class="notice notice-warning is-dismissible">
					<p><?php echo __( "No items selected for create report", "webrtc2" ); ?>, date-time: ( <?php echo __( current_time( "mysql" ) ); ?>)
					</p>
				</div>
				<?php
			}
		}
		$plugine_info = get_plugin_data( __DIR__ . "/wp-webrtc2.php" );
		?>
		<div class="wrap">
			<span class="dashicons dashicons-video-alt" style="float: left;"></span>
			<h1><?php echo esc_html( $plugine_info["Name"] ) . ": " . __( "call statistics", "webrtc2" ); ?></h1>
			<br>
			<?php
			// check button graph.
			$data = $this->webrtc2_stat_chart_data();
			$status_button = (0 !== count($data[0])) ? "" : " disabled";
			?>
			<div class="alignleft actions">
				<form method="POST">
					<input type="submit" id="graph_stat" class="button action" name="chart" value="Graph" <?php echo($status_button); ?>>
				</form>
			</div>
			<form  method="POST">
				<div class="alignright actions" title="enter: user name, role, user IP, browser">
				<?php
					$webrtc2_table->search_box("search", "search_id");
					if ("" !== get_option( "webrtc2_search_stat" )) {
						?>
						<script type="text/javascript">
							var search = document.getElementById("search_id-search-input");
							if (search) {
								search.value = "<?php echo get_option( 'webrtc2_search_stat' );?>";
							}
						</script>
						<?php
					}
				?>
				</div>
				<?php
					$webrtc2_table->display();
				?>
			</form>
		</div>
		<?php
		if (isset($_POST["chart"])) {
			$this->webrtc2_stat_chart();
		}
	}
	/**
	 * Create and control page Overview.
	 */
	public function webrtc2_overview() {
		$img1 = plugins_url( "/images/wp-webrtc2-settings.png", __FILE__ );
		$img2 = plugins_url( "/images/wp-webrtc2-statistics.png", __FILE__ );
		$img3 = plugins_url( "/images/wp-webrtc2-stun.png", __FILE__ );
		$img4 = plugins_url( "/images/profile.png", __FILE__ );

		$plugine_info = get_plugin_data( __DIR__ . "/wp-webrtc2.php" );

		?>
		<div class="wrap">
			<span class="dashicons dashicons-video-alt" style="float: left;"></span>
			<h1><?php echo __( $plugine_info["Name"] ) . ": " . __( "overview", "webrtc2" ); ?></h1>
			<br>
			<div class="content_overview">
				<h2 class="h2_overview">General Provisions</h2>
				<p class="p_overview"><?php echo __( "WP-WebRTC2 is a WordPress CMS plugin that provides video-chat between registered visitors to the site where the plugin is installed. The number of pairs of interlocutors is not limited. Within the framework of this video-chat, it is possible to: exchange text messages, files, video recording of the conversation, providing the interlocutor with an overview of your computer screen during communication. A registered visitor can leave a message to an interlocutor who is not currently on the video-chat page. When the interlocutor appears on the video-chat page, he will read all the messages addressed to him from various registered site visitors. These messages will then be automatically deleted. The WP-WebRTC2 plugin is focused on the use of browsers: Google Chrome, Fire Fox, Edge, Opera, Yandex.", "webrtc2") ?> </p>
				<h2 class="h2_overview">Install and configure the plugin</h2>
				<p class="p_overview"><?php echo __( "Configuring the WP-WebRTC2 plugin is done by the site administrator from the administrative site control panel:", "webrtc2") ?> </p>
				<p class="p_overview"><img style="width:100%;" src="<?php echo($img1); ?>"></p>
				<p class="p_overview"><?php echo __( "<b>About the environment:</b> The site administrator controls the site's software environment. If the hosting provider has provided the site owner with a mail server, then instead of the value <b>Mail server</b>: none, a table of mail server values will be displayed.", "webrtc2") ?> </p>
				<p class="p_overview"><?php echo __( "<b>Duration of remember of call statistics data:</b> the site administrator determines how long data is stored in the table <b>WP-WebRTC2: call statistics</b> in the range 1 - 365 days. If set to 0 days, the data will not be saved.", "webrtc2") ?> </p>
				<p class="p_overview"><?php echo __( "<b>Duration of the video-chat:</b> The site administrator determines the duration of the video-chat in the range of 1 - 24 hours. If you set 0 hours, video-chat will be unavailable. The current value of the video-chat time will be displayed in the graphical interface of the plugin as a countdown timer.", "webrtc2") ?> </p>
				<p class="p_overview"><?php echo __( "<b>Disable video-chat for:</b> the site administrator lists the logines of registered site visitors for whom video-chat is prohibited.","webrtc2") ?> </p>
				<p class="p_overview"><?php echo __( "<b>Video-chat:</b> The site administrator selects the category of registered visitors for whom video-chat is available.","webrtc2") ?> </p>
				<p class="p_overview"><?php echo __( "<b>WHO-IS service:</b> The site administrator selects a provider that determines the country and city in the process of registering a site visitor. This information is displayed on the video-chat page in field: <b>Land</b>. In a real situation, the end user, being at home or in the office, most often has a dynamic, weekly changing IP address of the user's router, which is assigned to him by the Internet provider. The user can move from home to office, travel across countries. If desired, the administrator of the site where this video connection plugin is installed can select the WHO-IS service provider option, which passes to the plugin the country-city from which the video connection user is authorized. If the administrator does not need it, he can disable this option by selecting - None.","webrtc2") ?> </p>
				<p class="p_overview"><?php echo __( "<b>STUN servers:</b> Site administrator enters one value Stun server. The recommended list is located below on the settings page and is optional. If this field is left empty, then the plugin will automatically select the optimal Stun server for the video communication user. The selection criteria are: common <strong>Time zone</strong> for the Stun server and video communication user and the minimum <b>Time delay</b> of the Stun server.","webrtc2") ?> </p>
				<p class="p_overview"><?php echo __( "<b>TURN server:</b> Site administrator follows the instructions in the Settings -> Turn server section of the plugin (paragraph 1-3). Click the Execute button (a message will appear below: data received). Click the Save plugin settings button.","webrtc2") ?> </p>
				<p class="p_overview"><?php echo __( "<b>Email:</b> If a video chat user has set their Profile to use email to receive video-chat messages, the site administrator selects the mail delivery technology (PHP mail() or Mail server). ","webrtc2") ?> </p>
				<h2 class="h2_overview">Table of call statistics</h2>
				<p class="p_overview"><?php echo __( "Table: <b>User call statistics</b> - contains information about calls made by users registered on the site. The table consists of 9 fields in which the data can be sorted in any order. By 4 fields (user name, role, user IP, browser) it is possible to search for relevant information. If the table is overflowing with data, part of the table data can be deleted using bulk actions (delete). Part of the table fields can be hidden if necessary using the option (Screen Options). The <b>Graph</b> button shows the amount of time used by each user.","webrtc2") ?> </p>
				<p class="p_overview"><img style="width:100%;" src="<?php echo($img2); ?>"></p>
				<p class="p_overview"><?php echo __( "Detailed description of the table <b>WP-WebRTC2: call statistics</b> located in the Help section, in the upper right corner of the screen.","webrtc2") ?> </p>
				<h2 class="h2_overview">Table of Stun servers</h2>
				<p class="p_overview"><?php echo __( "Information about <b>Stun servers</b> is collected by the site administrator on the Internet. He needs to know about the new Stun server: server name and port. Then, the site administrator enters this data into the site's <b>webrtc2_stun_servers</b> db table. one of two ways:<br>1. If there is little data, then directly, manually add one or more stun servers to the <b>webrtc2_stun_servers</b> db table of the site by filling in 2 fields: <b>server_name</b>, <b>port</b>. <br>2. If there is a lot of data, then add the list to the file ...\plugins\wp-webrtc2\settings\webrtc2-stun-servers.php<br>...well, or send it by email to the plugin developer - he will do it himself. All other fields of the <b>webrtc2_stun_servers</b> db table of the site are filled in and updated once a day automatically by the plugin, but if the site administrator has selected the <b>WHO-IS service</b> option in the plugin settings. Then, the site administrator can automatically fill in all the fields of the newly entered servers by selecting the Bulk actions/update option, marking them with a checkmark beforehand. The <b>Graph</b> button shows the distribution of stun servers by time zone in graphical form. The practice of using automatic assignment of stun servers for video communication showed the dynamics of the state of stun servers. The performance of servers changes for the better, then for the worse, the time delay changes constantly. Therefore, the practice of dynamic assigning a stun server for video communication is correct.","webrtc2") ?> </p>
				<p class="p_overview"><img style="width:100%;" src="<?php echo($img3); ?>"></p>
				<p class="p_overview"><?php echo __( "Detailed description of the <b>WP-WebRTC2: Stun servers</b> table is in the Help section, in the upper right corner of the screen.","webrtc2") ?> </p>
				<h2 class="h2_overview">Additional fields in the User Profile</h2>
				<p class="p_overview"><?php echo __( "The WP-WebRTC2 plugin creates additional fields in the user profile:<br>- Time zone, Country Code, Country name, Region, City, IP. The listed fields can change their values, because. the user can access the site from anywhere he is located. The <b>Time zone</b> field is critical. If the plugin does not find a match for this field in the Stun servers database, the video-chat for this user will not work.<br>- Added the item - Users for Video chat to the user profile. In the case of a large number of registered users of the site, at this point, for convenience, the user can create his own Contact List for video chat.<br>- Added item Email to the user profile:<br>
					1. Send video-chat autoresponder messages to my email<br>
					2. Send video-chat session text messages to my email","webrtc2") ?> </p>
				<p class="p_overview"><img style="width:100%;" src="<?php echo($img4); ?>"></p>
			</div>
		<?php
	}
	/**
	 * Create and control page Settings.
	 */
	public function webrtc2_settings() {
		$plugine_info  = get_plugin_data( __DIR__ . "/wp-webrtc2.php" );
		$url           = get_site_url( null, "/wp-admin/index.php" );
		$val           = get_option( "webrtc2_main_settings" );
		$path_tbl_stun = get_admin_url( null, "admin.php?page=webrtc2_servers", "https" );
		?>
		<div class="wrap">
			<span class="dashicons dashicons-video-alt" style="float: left;"></span>
			<h1><?php echo esc_html( $plugine_info["Name"] ) . ": " . __( "settings", "webrtc2" ); ?></h1>
			<br>

			<details style="background-color: white;">
			  <summary style="background-color: #F0F0F1; cursor: pointer;"><b>About the environment:</b></summary>
			  	<p><?php echo("<b>Operating system:</b> ". php_uname()); ?></p>
			  	<p><?php echo("<b>Interface type between web server and PHP:</b> ". php_sapi_name()); ?></p>
			  	<p><?php echo("<b>Current PHP version:</b> ". phpversion()); ?></p>
			  	<p><?php echo("<b>Server software:</b> ".$_SERVER["SERVER_SOFTWARE"]); ?></p>
			  	<?php
			  	if ( function_exists( 'mail' ) ){
			  		?><p><?php echo("<b>PHP mail()</b>: function is available"); ?></p><?php
					}else{
						?><p><?php echo("<b>PHP mail()</b>: function has been disabled"); ?></p><?php
					}

					$server_admin_email = sanitize_text_field($_SERVER["SERVER_ADMIN"]);
					$server_name        = sanitize_text_field($_SERVER["SERVER_NAME"]);
					$result             = dns_get_record($server_name, DNS_MX);

					$mx_search = false;
					foreach ($result as $arr) {
						if (false === $mx_search) $mx_search = true;
						?><p><?php echo("<b>Mail server:</b>"); ?></p>
						<table style="border:1px solid black;border-collapse: collapse;width:400px;">
							<tr>
							<?php
							foreach ($arr as $key => $value) {
								?>
								<th style="border:1px solid black;text-align: center;"><?php echo($key); ?></th>
								<?php
							}

							//Add field
							?>
							<th style="border:1px solid black;text-align: center;">SERVER_ADMIN</th>

							</tr>
							<tr>
							<?php
							foreach ($arr as $key => $value) {
								?>
								<td style="border:1px solid black;text-align: center;"><?php echo($value); ?></td>
								<?php
							}

							//Add field
							?>
							<td style="border:1px solid black;text-align: center;"><?php echo($server_admin_email); ?></td>

							</tr>
						</table>
						<?php
					}
					if (false === $mx_search) {
						?><p><?php echo("<b>Mail server:</b> none"); ?></p><?php
					}
					?>
			</details>
			<?php

			$_settings_updated = filter_input(INPUT_GET, "settings-updated", FILTER_VALIDATE_BOOLEAN);
			if ( $_settings_updated ) {
				if (isset( $val["turn_server"] ) && "no data" !== $val["turn_server"]) {
					$msg = esc_html( "Settings data saved successful", "webrtc2" );
				?>
				<div class="notice notice-success is-dismissible" ><p><strong><?php echo esc_html( $msg ) . ", date-time: (" . esc_html( current_time( "mysql" ) ) . ")"; ?></strong></p></div>
				<?php
				}else{
					$msg = esc_html( "Warning: No access data to Turn server", "webrtc2" );
				?>
				<div class="notice notice-warning is-dismissible" ><p><strong><?php echo esc_html( $msg ) . ", date-time: (" . esc_html( current_time( "mysql" ) ) . ")"; ?></strong></p></div>
				<?php
				}
				$pos = strripos($val["stun_server"], ":");
				$str = substr($val["stun_server"], $pos+1);

				if ("" !== $val["stun_server"] && "3478" !== $str && "19302" !== $str) {
					$msg = esc_html( "Error: Stun server data is incorrect. Allowed ports: 3478 or 19302", "webrtc2" );
					?>
					<div class="notice notice-error is-dismissible" ><p><strong><?php echo esc_html( $msg ) . ", date-time: (" . esc_html( current_time( "mysql" ) ) . ")"; ?></strong></p></div>
					<?php
				}
			}
			?>
			<form method="POST" action="options.php">
				<table class="form-table">
					<tr>
						<td>
							<?php
							settings_fields( "webrtc2_option_group" );
							do_settings_sections( "webrtc2_settings" );
							?>
						</td>
					</tr>
				</table>
				<label><?php echo __( "Note: Insert a short code [webrtc2] on any page to display video-chat.", "webrtc2" ); ?></label><br>
				<label><?php echo __( "If the WP-WebRTC2 plugin is being installed for the first time, then after saving the plugin settings, it is recommended to wait about 5 minutes. until the plugin fills the empty fields of the table", "webrtc2" ); ?></label><a href="<?php echo($path_tbl_stun); ?>" target="_blank"> Stun servers</a>
				<br>
				<br>
				<button type="submit" class="button-primary" name="save" >Save</button>
				<button type="button" class="button-primary" name="quit" onClick="location.href='<?php echo esc_url( $url ); ?>'">Quit</button>
			</form>
		</div>
		<?php
	}
	/**
	 * Add fields to page Settings of plugin.
	 */
	public function webrtc2_settings_sections() {
		register_setting( "webrtc2_option_group", "webrtc2_main_settings", array( $this, "webrtc2_check_settings" ) );

		add_settings_section( "webrtc2_section", "", "", "webrtc2_settings" );

		add_settings_field(
			"field1",
			"<label style='cursor: pointer;' for='duration_stat'>" . __( "Duration of remember of call statistics data", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field1" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
		add_settings_field(
			"field2",
			"<label style='cursor: pointer;' for='duration_videochat'>" . __( "Duration of the video-chat", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field2" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
		add_settings_field(
			"field3",
			"<label style='cursor: pointer;' for='user_name_excluded'>" . __( "Disable video-chat for", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field3" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
		add_settings_field(
			"field4",
			"<label style='cursor: pointer;' for='enabled_for_0'>" . __( "Video-chat", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field4" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
		add_settings_field(
			"field5",
			"<label style='cursor: pointer;' for='who_0'>" . __( "WHO-IS service", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field5" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
		add_settings_field(
			"field6",
			"<label style='cursor: pointer;' for='stun_server'>" . __( "STUN server", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field6" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
		add_settings_field(
	    "field7",
	    "<label style='cursor: pointer;' for='fld_execute_js'>" . __( "TURN server<br>Free plan: 50GB", "webrtc2" ) . ":</label>",
	    array( $this, "webrtc2_setting_field7" ),
	    "webrtc2_settings",
	    "webrtc2_section"
	  );
		add_settings_field(
			"field8",
			"<label style='cursor: pointer;' for='appearance0'>" . __( "Appearance", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field8" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
		add_settings_field(
			"field9",
			"<label style='cursor: pointer;' for='place0'>" . __( "Place on page", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field9" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
		add_settings_field(
			"field10",
			"<label style='cursor: pointer;' for='email_php'>" . __( "Email", "webrtc2" ) . ":</label>",
			array( $this, "webrtc2_setting_field10" ),
			"webrtc2_settings",
			"webrtc2_section"
		);
	}
	/**
	 * Filling option1 (Duration of entries in call statistics table).
	 */
	public function webrtc2_setting_field1() {
		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["duration_stat"] ) ? $val["duration_stat"] : "30";
		?>
		<input id="duration_stat" name="webrtc2_main_settings[duration_stat]" type="number" step="1" min="0" max="365" value="<?php echo esc_html( $val ); ?>" /><br>
		<label><?php echo __( "in days. Set to 0 - the data in the 'call statistics' table will not be remembered.", "webrtc2" ); ?></label>
		<?php
	}
	/**
	 * Filling option2 (Duration of video-chat).
	 */
	public function webrtc2_setting_field2() {
		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["duration_videochat"] ) ? $val["duration_videochat"] : "0.5";
		?>
		<input id="duration_videochat" name="webrtc2_main_settings[duration_videochat]" type="number" step="0.5" min="0.5" max="24" value="<?php echo esc_html( $val ); ?>" /><br>
		<label><?php echo __( "in hours. After the set period of time, the video-chat will be stoped.", "webrtc2" ); ?></label>
		<?php
	}
	/**
	 * Filling option3 (For the listed user name, video-chat will be prohibited).
	 */
	public function webrtc2_setting_field3() {
		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["user_name_excluded"] ) ? $val["user_name_excluded"] : "";
		?>
		<input type="text" id="user_name_excluded" name="webrtc2_main_settings[user_name_excluded]" size="40" value="<?php esc_html_e($val); ?>" placeholder="userName1;userName2;"><br>
		<label><?php echo __( "For the listed user name, video-chat will be prohibited.", "webrtc2" ); ?></label>
		<?php
	}
	/**
	 * Filling option4 (enabled for role:).
	 */
	public function webrtc2_setting_field4() {
		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["enabled_for"] ) ? $val["enabled_for"] : "registered";

		if ("registered" === $val) {
			$checked = "checked";
		} else {
			$checked = "";
		}
		?>
		<input type="radio" value="registered" <?php echo esc_html( $checked ); ?> id="enabled_for_0" name="webrtc2_main_settings[enabled_for]">
		<label style="cursor: pointer;" for="enabled_for_0">for registered visitors</label><br>
		<?php
		$i = 1;
		$roles = wp_roles()->get_names();
		foreach ($roles as $key => $value) {
			if ("administrator" === $key) continue;
    	if ($key === $val) {
				$checked = "checked";
			} else {
				$checked = "";
			}
    	?>
    	<input type="radio" value="<?php echo __( $key ); ?>" <?php echo __( $checked ); ?> id="enabled_for_<?php echo __( $i ); ?>" name="webrtc2_main_settings[enabled_for]">
			<label style="cursor: pointer;" for="enabled_for_<?php echo __( $i ); ?>">for the role - <?php echo __( $key ); ?></label><br>
    	<?php
    	$i++;
		}
		?>
		<label><?php echo __( "For the selected category of visitors - a video-chat will be available.", "webrtc2" ); ?></label>
		<?php
	}
	/**
	 * Filling option5 (WHO-IS service:).
	 */
	public function webrtc2_setting_field5() {
		$val = get_option( "webrtc2_main_settings" );

		$checked0 = ( !isset($val["whois_service"]) || $val["whois_service"] == "none" ) ? "checked" : "";
		$checked1 = ( isset($val["whois_service"]) && $val["whois_service"] == "IP-API" ) ? "checked" : "";
		$checked2 = ( isset($val["whois_service"]) && $val["whois_service"] == "IP-Info" ) ? "checked" : "";
		$checked3 = ( isset($val["whois_service"]) && $val["whois_service"] == "SxGeo" ) ? "checked" : "";
		$checked4 = ( isset($val["whois_service"]) && $val["whois_service"] == "Geobytes" ) ? "checked" : "";
		?>
		<table>
			<tr>
				<td style="padding:0;">
					<input type="radio" value="none" <?php echo __( $checked0 ); ?> id="who_0" name="webrtc2_main_settings[whois_service]">
					<label style="cursor: pointer;" for="who_0">None</label>
				</td>
				<td style="padding:0;">--</td><td style="padding:0;">--</td>
			</tr>
			<tr>
				<td style="padding:0;width:200px;">
					<input type="radio" value="IP-API" <?php echo __( $checked1 ); ?> id="who_1" name="webrtc2_main_settings[whois_service]">
					<label style="cursor: pointer;" for="who_1">IP-API (high quality)</label>
				</td>
				<td style="padding:0;width:50px;"><a href="https://ip-api.com/" target="_blank">Site</a></td>
				<td style="padding:0;">contact@ip-api.com</td>
			</tr>
			<tr>
				<td style="padding:0;">
					<input type="radio" value="IP-Info" <?php echo __( $checked2 ); ?> id="who_2" name="webrtc2_main_settings[whois_service]">
					<label style="cursor: pointer;" for="who_2">IP-Info (high quality)</label>
				</td>
				<td style="padding:0;"><a href="https://ipinfo.io/" target="_blank">Site</a></td>
				<td style="padding:0;">https://ipinfo.io/contact</td>
			</tr>
			<tr>
				<td style="padding:0;">
					<input type="radio" value="SxGeo" <?php echo __( $checked3 ); ?> id="who_3" name="webrtc2_main_settings[whois_service]">
					<label style="cursor: pointer;" for="who_3">SxGeo (medium quality)</label>
				</td>
				<td style="padding:0;"><a href="https://sypexgeo.net/" target="_blank">Site</a></td>
				<td style="padding:0;">https://sypexgeo.net/ru/contacts/</td>
			</tr>
			<tr>
				<td style="padding:0;">
					<input type="radio" value="Geobytes" <?php echo __( $checked4 ); ?> id="who_4" name="webrtc2_main_settings[whois_service]">
					<label style="cursor: pointer;" for="who_4">Geobytes (medium quality)</label>
				</td>
				<td style="padding:0;"><a href="https://geobytes.com/" target="_blank">Site</a></td>
				<td style="padding:0;">https://geobytes.com/</td>
			</tr>
		</table>
			<label for="who_0"><?php echo __( "Select provider information of IP address of registered site visitor.", "webrtc2" ); ?></label>
		<?php
	}
	/**
	 * Filling option6 (STUN server).
	 */
	public function webrtc2_setting_field6() {
		$list_stun = "<br>stun:stun1.l.google.com:19302<br>stun:stun2.l.google.com:19302<br>stun:stun3.l.google.com:19302<br>stun:stun4.l.google.com:19302";
		$val = get_option( "webrtc2_main_settings" );
		$val = ( isset( $val["stun_server"] ) && "" !== $val["stun_server"] ) ? $val["stun_server"] : "";
		?>
		<input type="text" id="stun_server" name="webrtc2_main_settings[stun_server]" size="40" value="<?php esc_html_e($val); ?>" placeholder="<?php echo __("If the field is empty, plugin will choose itself", "webrtc2") ?>"><br>
		<label><?php echo __( "Select one server STUN from the list: ", "webrtc2" ); ?></label>
		<label><?php echo($list_stun); ?></label>
		<?php
	}
	/**
	 * Filling option7 (TURN server).
	 */
	public function webrtc2_setting_field7() {
		$val = get_option( "webrtc2_main_settings" );
		$val = ( isset( $val["turn_server"] ) && "" !== $val["turn_server"] ) ? $val["turn_server"] : "no data";
		$path_example_turn = set_url_scheme( plugins_url("/images/example_turn.png", __FILE__), "https" );

		$arrs = json_decode($val);
		$out  = "";

		if ( !is_null($arrs) && 0 !== count($arrs) ) {
			foreach ( $arrs as $arr ) {
				foreach ( $arr as $key => $value ) {
					$out = $out . " " . $key . ": " . $value ;
				}
				$out = $out . "<br>";
			}
		} else {
			$out = "no data";
		}

		?>
		<label><?php echo __("1. Login to your Dashboard at", "webrtc2") ?> </label><a href="https://dashboard.metered.ca" target="_blank">Metered->Apps->press your login</a>
		<label>-> <b>TURN Server</b> item into Metered menu</label><br>
		<label><?php echo __("2. Press button <b>Instruction</b> in the", "webrtc2") ?> <b>TURN API Key</b> section</label>
		<br>
		<label><?php echo __("3. Copy-Paste the contents of the popup window to the box below", "webrtc2") ?></label>
		<details>
		  <summary style="color: green; cursor: pointer;">Turn server setup example:</summary>
		  <div style="display:block;width:1100px;height:500px;">
		  	<image style="width: 100%;height: 100%;object-fit:contain;" src="<?php echo esc_url($path_example_turn); ?>">
		  </div>
		</details>
		<textarea id="fld_execute_js" rows="12" cols="120" wrap="off" style="width: 500px;" oninput="webrtc2_code_js();" placeholder="// Calling the REST API TO fetch the TURN Server Credentials&#010;...&#010;// Saving the response in the iceServers array&#010;...&#010;// Using the iceServers array in the RTCPeerConnection method&#010;..."></textarea><br>
		<input type="button" id="btn_execute_js" class="button action" value="Execute" disabled onClick="webrtc2_execute_js();">
		<input type="text" id="fieldTurnServers" name="webrtc2_main_settings[turn_server]" value="<?php esc_html_e($val); ?>" style="visibility:hidden;width:100%;">
		<fieldset id="listTurnServers" style="display: block;float: left;border:1px solid #8C8F94;margin-top:-25px;">
			<?php
			if ("no data" === $out) {
				?>
				<legend style="color:red;"><b>Received access details to the Turn server:</b></legend>
				<?php
			}else{
				?>
				<legend><b>Received access details to the Turn server:</b></legend>
				<?php
			}
			echo($out);
			?>
		</fieldset>
		<script type="text/javascript">
		let turnServers = [];
		async function webrtc2_execute_js() {
			let btn_execute_js = document.getElementById("btn_execute_js");
			let fldTurnSrv     = document.getElementById("fieldTurnServers");
			let lstTurnSrv     = document.getElementById("listTurnServers");
			let code = document.getElementById("fld_execute_js").value;
			fldTurnSrv.value = "";
			if ("" !== code) {
				try {
					await Object.getPrototypeOf(async function(){}).constructor(code+'turnServers=iceServers;')();
					for (let i = 0; i < turnServers.length; i++) {
				    if (-1 !== turnServers[i].urls.indexOf("stun")) {
				      turnServers.splice(i, 1);
				      i--;
				    }
				  }
				  if (0 !== turnServers.length) {
				  	lstTurnSrv.innerHTML = "Data received. Click <span style='color:white;background:#2271B1;'>Save</span> of page Settings.";
				  } else {
				  	lstTurnSrv.innerHTML = "no data";
				  }
				  lstTurnSrv.style.color = "black";
					fldTurnSrv.value = JSON.stringify(turnServers);

					btn_execute_js.className = "";
				} catch {
					lstTurnSrv.innerHTML   = "Command execution error...";
					lstTurnSrv.style.color = "red";

					btn_execute_js.className = "";
				}

			}
		}
		function webrtc2_code_js() {
			let fld_execute_js = document.getElementById("fld_execute_js");
			let btn_execute_js = document.getElementById("btn_execute_js");
			let lstTurnSrv     = document.getElementById("listTurnServers");

			lstTurnSrv.innerHTML = "";

			if ("" == fld_execute_js.value) {
				btn_execute_js.disabled = true;
			} else {
				btn_execute_js.disabled = false;
				btn_execute_js.className = "blinking";
			}
		}
		</script>
		<?php
	}
	/**
	 * Filling option8 (Appearance:).
	 */
	public function webrtc2_setting_field8() {
		$val      = get_option( "webrtc2_main_settings" );
		$val      = isset( $val["appearance"] ) ? $val["appearance"] : "dark";
		$checked0 = "";
		$checked1 = "";

		switch ( $val ) {
			case "dark":
				$checked0 = "checked";
				break;
			case "light":
				$checked1 = "checked";
				break;
		}
		?>

		<input type="radio" id="appearance0" name="webrtc2_main_settings[appearance]" value="dark" <?php echo esc_html( $checked0 ); ?>>
		<label style="cursor: pointer;" for="appearance0">dark</label><br>

		<input type="radio" id="appearance1" name="webrtc2_main_settings[appearance]" value="light" <?php echo esc_html( $checked1 ); ?>>
		<label style="cursor: pointer;" for="appearance1">light</label><br>

		<label><?php echo __( "Selecting the external appearance of the plugin on the video-chat page.", "webrtc2" ); ?></label>

		<?php
	}
	/**
	 * Filling option9 (Place on page:).
	 */
	public function webrtc2_setting_field9() {
		$val      = get_option( "webrtc2_main_settings" );
		$val      = isset( $val["place_on_page"] ) ? $val["place_on_page"] : "place0";
		$checked0 = "";
		$checked1 = "";

		switch ( $val ) {
			case "place0":
				$checked0 = "checked";
				break;
			case "place1":
				$checked1 = "checked";
				break;
		}
		?>

		<input type="radio" id="place0" name="webrtc2_main_settings[place_on_page]" value="place0" <?php echo esc_html( $checked0 ); ?>>
		<label style="cursor: pointer;" for="place0">Only video-chat to page</label><br>

		<input type="radio" id="place1" name="webrtc2_main_settings[place_on_page]" value="place1" <?php echo esc_html( $checked1 ); ?>>
		<label style="cursor: pointer;" for="place1">Append to page content</label><br>

		<label><?php echo __( "Select the video-chat display mode on the site page.", "webrtc2" ); ?></label>

		<?php
	}
	/**
	 * Filling option10 (SMTP server:).
	 */
	public function webrtc2_setting_field10() {
		$val      = get_option( "webrtc2_main_settings" );
		$val      = isset( $val["email"] ) ? $val["email"] : "email_php";
		$checked0 = "";
		$checked1 = "";

		switch ( $val ) {
			case "email_php":
				$checked0 = "checked";
				break;
			case "emai_smtp":
				$checked1 = "checked";
				break;
		}
		?>
		<div style="display:flex;border:1px solid #8C8F94;width:550px;flex-direction: column;">
			<div style="display:block;justify-content: space-between;flex-direction: column;">
				<input type="radio" id="email_php" name="webrtc2_main_settings[email]" value="email_php" <?php echo esc_html( $checked0 ); ?>>
				<label style="cursor: pointer;" for="email_php">Send emails using PHP (if PHP <b>mail()</b> function is available in the environment)</label><br>

				<input type="radio" id="emai_smtp" name="webrtc2_main_settings[email]" value="emai_smtp" <?php echo esc_html( $checked1 ); ?>>
				<label style="cursor: pointer;" for="emai_smtp">Send emails using SMTP (if <b>Mail server</b> is available in the environment)</label><br>
			</div>
			<div style="display:flex;margin:5px;">
				<div id="smtp_check_result"  style="flex-basis: 100%;resize: none;height:110px;border:1px solid #8C8F94;overflow-x: hidden; overflow-y: auto;">Email check result</div>
			</div>
		</div>
		<input type="button" id="btn_check_smtp" value="Check" style="margin-top:5px;" onClick="webrtc2_check_smtp();">
		<label>Before pressing the button <b>Check</b> - click the button <b>Save</b>.</label>
		<?php
	}
	/**
	 * Sanitize options and start schedule_event if changed value option whois_service.
	 * Fires when data is save from Settings plugin.
	 *
	 * @param  object $settings Settings.
	 * @return object Settings.
	 */
	public function webrtc2_check_settings($settings) {
		// Disable video-chat for.
		$user_name_excluded = explode(";", $settings["user_name_excluded"]);
		foreach ($user_name_excluded as $key => $value) {
    	$user_name_excluded[$key] = sanitize_user( $value, 1 );
		}
		$settings["user_name_excluded"] = implode(";", $user_name_excluded);

		// STUN server.
		if ("" !== $settings["stun_server"]) {
			$settings["stun_server"] = sanitize_text_field($settings["stun_server"]);
			$settings["stun_server"] = str_replace(" ", "", $settings["stun_server"]);
			if ("stun:" !== substr($settings["stun_server"], 0, 5)) {
				$settings["stun_server"] = "stun:" . $settings["stun_server"];
			}
			if (22 > strlen($settings["stun_server"])) {
				$settings["stun_server"] = "";
			}
		}

		 // TURN server.
		if ("" === $settings["turn_server"]) {
			$settings["turn_server"] = "no data";
		}

		// Restart the event when its value changes.
		$val = get_option( "webrtc2_main_settings" );
		$whois_service = isset( $val["whois_service"] ) ? esc_attr( $val["whois_service"] ) : "none";

		if ("none" !== $settings["whois_service"] && $whois_service !== $settings["whois_service"]) {
			wp_clear_scheduled_hook( "webrtc2_update" );
			wp_schedule_event( time(), "daily", "webrtc2_update" );

			wp_clear_scheduled_hook( "webrtc2_update_repeat" );
			wp_schedule_event( time() + 600, "hourly", "webrtc2_update_repeat" );
		}

		return $settings;
	}
	/**
	 * Change the content type in letters sent via wp_mail().
	 * @return string text/plain or text/html
	 */
	public function webrtc2_mail_content_type() {
		return "text/html";
	}
	/**
	 * Fires when there is an error sending a letter using the wp_mail()
	 * @param  object $wp_error WP_Error object.
	 */
	public function webrtc2_mailer_errors( $wp_error ) {
		echo("<b>Mailer errors: </b>".$wp_error->get_error_message());
	}
}
