<?php
/**
 * Description: Use to create shortcode [webrtc2].
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
if ( ! function_exists ( "WP_Filesystem" ) ) {
	require_once  ABSPATH . "wp-admin/includes/file.php";
}

class WebRTC2_Shortcode {
  /**
	 * Add new shortcode [webrtc2].
	 */
	public function __construct() {
		add_shortcode( "webrtc2", array( $this, "webrtc2_shortcode" ) );
	}
	/**
	 * Creates webrtc2 shortcode.
	 */
	public function webrtc2_shortcode() {
		$plugine_info = get_plugin_data( __DIR__ . "/wp-webrtc2.php" );

		WP_Filesystem();
		global $wp_filesystem;

		$val_role = get_option( "webrtc2_main_settings" );
		$val_role = isset( $val_role["enabled_for"] ) ? $val_role["enabled_for"] : "registered";

		$_user_agent = filter_input(INPUT_SERVER, "HTTP_USER_AGENT", FILTER_CALLBACK, array("options"=>"webrtc2_validateBrowser"));

		$hostId_data = wp_get_current_user();
		if ( !empty($_user_agent) && false === strpos( $_user_agent, "WP-WebRTC2-client" ) ) {
			if ( false === $this->webrtc2_shortcode_head($hostId_data) ) {
				return;
			}
		}
		$val_role = get_option( "webrtc2_main_settings" );
    $val_role = isset( $val_role["enabled_for"] ) ? $val_role["enabled_for"] : "registered";

    $hostId_role    = "";
    $hostId_country = "";

		if ( 0 !== $hostId_data->ID ) {
			$hostId_data     = get_userdata( $hostId_data->ID );
			$hostId_role     = isset($hostId_data->roles[0]) ? $hostId_data->roles[0] : "";
			$hostId_avatar   = get_avatar( $hostId_data->ID, 20 );
			$hostId_meta     = get_user_meta( $hostId_data->ID );
			$hostId_country  = isset( $hostId_meta["user_country_code"] ) ? array_shift( $hostId_meta["user_country_code"] ) : "";
			$hostId_city     = isset( $hostId_meta["user_city"] ) ? array_shift( $hostId_meta["user_city"] ) : "";
		}
		// Check exist /wp-webrtc2/images/flags/.
		$plugin_dir = plugin_dir_path( __FILE__ );
		if ( is_dir( $plugin_dir ) ) {
			$dir_flags  = $wp_filesystem->find_folder($plugin_dir . "images/flags/");
			$file = trailingslashit($dir_flags) . $hostId_country . ".gif";
			if ($wp_filesystem->exists($file)) {
				$plugin_url = plugins_url();
				$path_img = set_url_scheme( $plugin_url . "/wp-webrtc2/", "https" ) . "images/flags/" . $hostId_country . ".gif";
				$hostId_img_flag = "<image src='$path_img' >";
			}else{
				$hostId_img_flag = "";
				$hostId_country  = "-";
			}
		}
		$val_appearance  = get_option( "webrtc2_main_settings" );
		$val_appearance  = isset( $val_appearance["appearance"] ) ? $val_appearance["appearance"] : "dark";
		if ("dark"=== $val_appearance) {
			$path_img_banner = set_url_scheme( plugins_url("/images/banner-dark.png", __FILE__), "https" );
		}
		if ("light"=== $val_appearance) {
			$path_img_banner = set_url_scheme( plugins_url("/images/banner-light.png", __FILE__), "https" );
		}
		$path_img_on     = set_url_scheme( plugins_url("/images/online.png", __FILE__), "https" );
		$path_img_off    = set_url_scheme( plugins_url("/images/offline.png", __FILE__), "https" );
		$path_img_inv    = set_url_scheme( plugins_url("/images/invite.png", __FILE__), "https" );
		$path_img_hello  = set_url_scheme( plugins_url("/images/hello.png", __FILE__), "https" );
		$path_img_poster = set_url_scheme( plugins_url("/images/poster.png", __FILE__), "https" );
		$path_img_file   = set_url_scheme( plugins_url("/images/openfile.png", __FILE__), "https" );

		$img_lamp_off    = "<image src='$path_img_off' title='offline' style='display:inline-block;'>";
		$img_lamp_on     = "<image src='$path_img_on' title='online' style='display:none;'>";
		$img_lamp_inv    = "<image src='$path_img_inv' title='invite' style='display:none;'>";
		$img_lamp_hello  = "<image src='$path_img_hello' title='hello' style='display:none;'>";
		$img_file_select = "<image id='img_file_select' src='$path_img_file'>";
		?>
		<div class="webrtc2_container" id="video_chat">
			<!-- item1 -->
			<div id="part1" class="item">
				<image src="<?php echo esc_url($path_img_banner); ?>" style="object-fit: cover;width: 100%;height: 100%;" title="banner" alt="banner">
				<label class="lbl_version"><?php echo("v. ".__($plugine_info["Version"])); ?></label>
			</div>
			<!-- item2 -->
			<div id="part2" class="item">
				<!-- wins1_table1 -->
				<div class="item2subitem">
					<table id="wins1_table1">
						<?php
						$hostId_data = wp_get_current_user();
						$checked = get_user_meta($hostId_data->ID, "сontacts_group", true);
						if ("all_users" == $checked || "" == $checked) {
							$caption = "Select member from all users";
						} else {
							$caption = "Select member from contact list";
						}
						?>
						<caption class="caption_tbl"><?php echo($caption); ?></caption>
						<thead id="wins1_thead1">
							<tr>
								<th style="width:17%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">Status</th>
								<th style="width:35%;">Name</th>
								<th style="width:27%;">Role</th>
								<th style="width:21%;">Land</th>
							</tr>
						</thead>
						<tbody id="wins1_tbody1">
							<?php
							// Select who is users.
							if ("all_users" == $checked || "" == $checked) {
								$val_users = get_option( "webrtc2_main_settings" );
								$val_users = isset( $val_users["enabled_for"] ) ? $val_users["enabled_for"] : "registered";
								if ("registered" === $val_users) {
					        $users = get_users();
					      } else {
					        $users = get_users("role=" . $val_users);
					      }
							}else{
								$users_list = get_user_meta($hostId_data->ID, "сontacts_group", true);
								$users = array_filter(explode(";", $users_list));
							}
							foreach ( $users as $user ) {
								if ("all_users" == $checked || "" == $checked) {
									$avatar     = get_avatar( $user->ID, 20 );
									$user_meta  = get_user_meta( $user->ID );
									$user_login = $user->user_login;
									$user_role  = (0 !== count($user->roles)) ? array_shift( $user->roles ) : "";
								}else{
									if (false === username_exists($user)) continue;

									$user_data  = get_user_by("login", $user);
									$avatar     = get_avatar( $user_data->ID, 20 );
									$user_meta  = get_user_meta( $user_data->ID );
									$user_info  = get_userdata( $user_data->ID );
									$user_login = $user_info->user_login;
									$user_role  = (0 !== count($user_info->roles)) ? array_shift( $user_info->roles ) : "";
								}
								if ( $hostId_data->user_login !== $user_login && "administrator" !== $user_role && "" !== $user_role) {

									$user_country = isset($user_meta["user_country_code"]) ? array_shift( $user_meta["user_country_code"] ) : "";
									$user_city    = isset($user_meta["user_city"]) ? array_shift( $user_meta["user_city"] ) : "";
									?>
									<tr>
										<td style="width:17%;"><?php echo( $img_lamp_on );echo( $img_lamp_off );echo( $img_lamp_inv );echo( $img_lamp_hello ); ?><label class="container_chk" onClick="webrtc2_locate_win();"><input type="checkbox" name="users_site"><span class="checkmark"></span></label></td>
										<td style="width:35%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"><?php echo( $avatar ); echo ( " " . $user_login ); ?></td>
											<?php
											$img_flag = "";

											$file = trailingslashit($dir_flags) . $user_country . ".gif";

											if ($wp_filesystem->exists($file)) {
												$plugin_url = plugins_url();
												$path_img = set_url_scheme( $plugin_url . "/wp-webrtc2/", "https" ) . "images/flags/" . $user_country . ".gif";
												$img_flag = "<image src='$path_img' >";
											}else{
												$img_flag = "";
												$user_country = "-";
											}
										?>
										<td style="width:29%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"><?php echo __( $user_role ); ?></td>
										<td style="width:18%;" title="City:<?php echo __( $user_city ); ?>"><?php echo ( $img_flag ); echo __( $user_country ); ?></td>
									</tr>
								<?php
								}
							}
							?>
						</tbody>
						<tfoot id="wins1_tfoot1">
							<tr>
								<td>
									<input type="text" id="fld_search_user" placeholder="Name..." autocomplete="off">
									<button class="btn_chat" id="btn_search_user" disabled onClick="webrtc2_search_user()">Search</button>
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
				<!-- control panel -->
				<div class="item2subitem">
					<button class="btn_chat" id="btn_include_member" disabled onClick="webrtc2_include_user_in_room()">=></button>
					<button class="btn_chat" id="btn_exclude_member" disabled onClick="webrtc2_exclude_user_from_room()"><=</button>
					<button id="clockdiv">00:00</button>
					<button class="btn_chat" id="btn_start_chat" disabled onClick="webrtc2_start()">Start</button>
					<button class="btn_chat" id="btn_stop_chat" onClick="webrtc2_stop()">Stop</button>
					<div id="record">
						<p id="record_caption">Record</p>
						<button class="btn_chat" id="btn_start_record" disabled onClick="webrtc2_startRecording()">Start</button>
						<button class="btn_chat" id="btn_stop_record" disabled onClick="webrtc2_stopRecording()">Stop</button>
					</div>
				</div>
				<!-- wins1_table2 -->
				<div class="item2subitem">
					<table id="wins1_table2">
						<caption class="caption_tbl">Members of video-chat</caption>
						<thead id="wins1_thead2">
							<tr>
								<th style="width:17%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">Status</th>
								<th style="width:35%;">Name</th>
								<th style="width:27%;">Role</th>
								<th style="width:21%;">Land</th>
							</tr>
						</thead>
						<tbody id="wins1_tbody2">
						<?php
						if ( "administrator" !== $hostId_role ) {
							$profile_url = get_edit_user_link();
							?>
							<tr>
								<td style="width:17%;"><?php echo( $img_lamp_on );echo( $img_lamp_off );echo( $img_lamp_inv );echo( $img_lamp_hello );?><label class="container_chk"><input type="checkbox" name="members_chat" disabled="disabled"><span class="checkmark"></span></label></td>
								<td style="width:35%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"><?php echo( $hostId_avatar ); ?><a class="host_id" href="<?php echo($profile_url);?>"><?php echo( " ".$hostId_data->user_login );?></a></td>
								<td style="width:29%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;"><?php echo __( $hostId_role ); ?></td>
								<?php
								?><td style="width:18%;" title="City:<?php echo __( $hostId_city ); ?>"><?php echo( $hostId_img_flag ); echo __( $hostId_country ); ?></td>
							</tr>
						</tbody>
						<?php
						}
						?>
						<tfoot id="wins1_tfoot2">
							<?php
								$slogan = "WP-WebRTC2 plugin is ready";
							?><tr>
								<td style="display: flex;justify-content: center;align-items: center;height: 46px;">
									<label id="slogan" class="slogan"><?php echo __( $slogan ); ?></label>
									<section id="progress_connection">
									  <div class="sk-wave">
									    <div class="sk-rect sk-rect-1"></div>
									    <div class="sk-rect sk-rect-2"></div>
									    <div class="sk-rect sk-rect-3"></div>
									    <div class="sk-rect sk-rect-4"></div>
									    <div class="sk-rect sk-rect-5"></div>
									  </div>
									</section>
									<button class="btn_chat" id="btn_cancel_call" style="display:none;flex-basis:20%;color:green;" onClick="webrtc2_send_guestId('cancel')">Cancel</button>
								</td>
							</tr>
							<tr>
								<td style="position:relative;">
									<input type="text" id="fld_file_attach" accept=".zip" placeholder="File ..." autocomplete="off">
									<label id="for_fld_file_attach" style="z-index:-1;" for="fld_file_attach">Choose a file<?php echo( $img_file_select ); ?></label>
									<progress id="progress_file" style="visibility: hidden;position: absolute;-moz-appearance:none;"></progress>
									<label id="progress_caption" style="visibility: hidden;position: absolute;">received or sended</label>
									<button class="btn_chat" id="btn_send_file" disabled onClick="webrtc2_file_send()">Send</button>
								</td>
							</tr>
							<tr>
								<td>
									<input type="text" id="fld_send_msg" placeholder="Message..." autocomplete="off">
									<button class="btn_chat" id="btn_send_msg" disabled onClick="webrtc2_msg_send()">Send</button>
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
			<!-- item3 -->
			<div id="part3" class="item" style="height:122px;">
				<!-- Combined window for displaying current messages -->
				<div class="item3subitem">
					<div id="fld_dump">
						<label id="lbl_fld_dump">Protocol of dump:</label>
					</div>
					<div id="fld_chat" style="visibility: hidden;">
						<label id="lbl_fld_chat">Protocol of chat:</label>
					</div>
				</div>
				<!-- Contol panel of combined window -->
				<div id="fld_cmd" class="item3subitem">
					<button class="btn_chat" id="btn_chat" disabled onClick="webrtc2_msg_chat_switch()">Chat</button>
					<button class="btn_chat" id="btn_dump" disabled onClick="webrtc2_msg_dump_switch()">Dump</button>
					<button class="btn_chat" id="btn_clear" disabled onClick="webrtc2_msg_clear()">Clear</button>
					<button class="btn_chat" id="btn_report" disabled onClick="webrtc2_msg_report()">Report</button>
					<button class="btn_chat" id="btn_graph" disabled onClick="webrtc2_msg_graph_switch()">Graph</button>
				</div>
				<div id="fld_graph" class="item3subitem" style="visibility: hidden;">
					<div class="graph_local">
						<div id="graph_title_local">[Local]</div>
						<canvas id="canvas_local" width="320" height="90"></canvas>
						<div id="graph_legend_local">
							<div style="display:inline-flex;align-items: center;">
								<div style="width:20px;height:10px;background: #006600;border:2px solid #00FF00;"></div>
								<label id="local_legend1">local legend1</label>
							</div>
							<div style="display:inline-flex;align-items: center;">
								<div style="width:20px;height:10px;background: #4D474D;border:2px solid #FF00FF;"></div>
								<label id="local_legend2">local legend2</label>
							</div>
						</div>
					</div>
					<div class="graph_cmd">
						<button class="btn_chat" id="btn_graph1" disabled onClick="webrtc2_graph1()">Graph1</button>
						<button class="btn_chat" id="btn_graph2" disabled onClick="webrtc2_graph2()">Graph2</button>
						<button class="btn_chat" id="btn_graph3" disabled onClick="webrtc2_graph3()">Graph3</button>
						<button class="btn_chat" id="btn_graph4" disabled onClick="webrtc2_graph4()">Graph4</button>
						<button class="btn_chat" id="btn_quit" onClick="webrtc2_graph_quit()">Quit</button>
					</div>
					<div class="graph_remote">
						<div id="graph_title_remote">[Remote]</div>
						<canvas id="canvas_remote" width="320" height="90"></canvas>
						<div id="graph_legend_remote">
							<div style="display:inline-flex;align-items: center;">
								<div style="width:20px;height:10px;background: #006600;border:2px solid #00FF00;"></div>
								<label id="remote_legend1">remote legend1</label>
							</div>
							<div style="display:inline-flex;align-items: center;">
								<div style="width:20px;height:10px;background: #4D474D;border:2px solid #FF00FF;"></div>
								<label id="remote_legend2">remote legend2</label>
							</div>
						</div>
					</div>
				</div>
			</div>
			<!-- item4 -->
			<div id="part4" class="item">
				<div id="wins_video">
					<!-- video controls win1_video -->
					<div class="item4subitem" id="win1">
						<div class="stats">
							<p id="wins1_ticker">Statistics of connection.</p>
						</div>
						<div id="win1_head_menu" style="display: flex;flex-basis:100%;justify-content: space-between;margin-top: -50px;">
							<div id="win_head" class="win_head" onClick="webrtc2_rebuild_elements('win1')">
								<p id="win1_head">1</p>
								<p id="win1_menu_item1" onClick="webrtc2_screen_share()">screen</p>
								<p id="win1_menu_item2" onClick="webrtc2_board_share()">board</p>
							</div>
							<div class="member_head"></div>
						</div>
						<div style="display: flex;flex-basis:100%;justify-content: space-between;align-items: flex-end;">
							<div id="wins1_bitrate">
								<div id=wins1_bitrate_1 class="wins_bitrates" title="bitrate: unlimited" onClick="webrtc2_bitrate_level_local(id)"></div>
								<div id=wins1_bitrate_2 class="wins_bitrates" title="bitrate: 2000" onClick="webrtc2_bitrate_level_local(id)"></div>
								<div id=wins1_bitrate_3 class="wins_bitrates" title="bitrate: 1000" onClick="webrtc2_bitrate_level_local(id)"></div>
								<div id=wins1_bitrate_4 class="wins_bitrates" title="bitrate: 500" onClick="webrtc2_bitrate_level_local(id)"></div>
								<div id=wins1_bitrate_5 class="wins_bitrates" title="bitrate: 250" onClick="webrtc2_bitrate_level_local(id)"></div>
								<div id=wins1_bitrate_6 class="wins_bitrates" title="bitrate: 125" onClick="webrtc2_bitrate_level_local(id)"></div>
							</div>
							<div id="wins1_audio">
								<canvas id="wins1_vu_audio" width="6" height="45" title="microphone" style="float: right;right: 1px;bottom: 1px;border:1px solid black;z-index: 2;margin: 1px 1px;"></canvas>
							</div>
						</div>
						<video controls id="win1_video" autoplay muted disablePictureInPicture poster="<?php echo esc_url($path_img_poster); ?>"></video>
					</div>
					<!-- video controls win2_video -->
					<div class="item4subitem" id="win2">
						<div class="stats">
							<p id="wins2_ticker">Statistics of connection.</p>
						</div>
						<div id="win2_head_menu" style="display: flex;flex-basis:100%;justify-content: space-between;margin-top: -50px;">
							<div class="win_head" onClick="webrtc2_rebuild_elements('win2')">
								<p id="win2_head">2</p>
							</div>
							<div class="member_head"></div>
						</div>
						<div style="display: flex;flex-basis:100%;justify-content: space-between;align-items: flex-end;">
							<div id="wins2_bitrate">
								<div id=wins2_bitrate_1 class="wins_bitrates" title="bitrate: unlimited"></div>
								<div id=wins2_bitrate_2 class="wins_bitrates" title="bitrate: 2000"></div>
								<div id=wins2_bitrate_3 class="wins_bitrates" title="bitrate: 1000"></div>
								<div id=wins2_bitrate_4 class="wins_bitrates" title="bitrate: 500"></div>
								<div id=wins2_bitrate_5 class="wins_bitrates" title="bitrate: 250"></div>
								<div id=wins2_bitrate_6 class="wins_bitrates" title="bitrate: 125"></div>
							</div>
							<div id="wins2_audio">
								<canvas id="wins2_vu_audio" width="6" height="45" title="microphone" style="float: right;right: 1px;bottom: 1px;border:1px solid black;z-index: 2;margin: 1px 1px;"></canvas>
							</div>
						</div>
						<video controls id="win2_video" autoplay disablePictureInPicture poster="<?php echo esc_url($path_img_poster); ?>"></video>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
	/**
	 * Does not work a visitor with this user name.
	 *
	 * @param string $user_name_excluded User name of visitor.
	 */
	private function webrtc2_user_name_excluded( $user_name_excluded ) {

		$val = get_option( "webrtc2_main_settings" );
		$val = isset( $val["user_name_excluded"] ) ? $val["user_name_excluded"] : "";

		if ( empty( $val ) ) {
			return false;
		} else {
			$arr = explode(";", $val);
			foreach ($arr as $item) {
				if ( $user_name_excluded === $item ) {
					return true;
				}
			}
			return false;
		}
	}
	/**
	 * Creates a shortcode head.
	 *
	 * @param  object $hostId_data User registration data.
	 * @return boolean             Video chat available - yes/no.
	 */
	private function webrtc2_shortcode_head($hostId_data) {
		$val_role = get_option( "webrtc2_main_settings" );
		$val_role = isset( $val_role["enabled_for"] ) ? $val_role["enabled_for"] : "registered";
		
		$path_doc_cn = set_url_scheme( plugins_url("/doc/doc_cn/webrtc2_cn.html", __FILE__), "https" );
		$path_doc_de = set_url_scheme( plugins_url("/doc/doc_de/webrtc2_de.html", __FILE__), "https" );
		$path_doc_en = set_url_scheme( plugins_url("/doc/doc_en/webrtc2_en.html", __FILE__), "https" );
		$path_doc_fr = set_url_scheme( plugins_url("/doc/doc_fr/webrtc2_fr.html", __FILE__), "https" );
		$path_doc_it = set_url_scheme( plugins_url("/doc/doc_it/webrtc2_it.html", __FILE__), "https" );
		$path_doc_ru = set_url_scheme( plugins_url("/doc/doc_ru/webrtc2_ru.html", __FILE__), "https" );

		$path_img_max_on  = set_url_scheme( plugins_url("/images/max_on.png", __FILE__), "https" );
		$path_img_max_off = set_url_scheme( plugins_url("/images/max_off.png", __FILE__), "https" );
		$path_img_min_on  = set_url_scheme( plugins_url("/images/min_on.png", __FILE__), "https" );
		$path_img_min_off = set_url_scheme( plugins_url("/images/min_off.png", __FILE__), "https" );

		$hostId_role      = (0 !== count($hostId_data->roles)) ? $hostId_data->roles[0] : "";

		?>
		<div class="webrtc2_head">
			<div style="display:flex;flex-direction: column;">
				<p>
				<?php
				echo __( "Video-chat available for visitors: ", "webrtc2" );
				?>
				<span style='font-weight: bold;'>
					<?php	echo ($val_role); ?>
				</span>
				<?php
	      if ( 0 !== $hostId_data->ID ) {
	      	$continue = true;
	      	echo ", (".__( "your role: ", "webrtc2" ).$hostId_role.")";
	      	?>
	      	</p>
	      	<?php
	      	if ( $val_role !== $hostId_role && "registered" !== $val_role || "" === $hostId_role) {
	      		$continue = false;
	      	}
	      	// Check current_user is excluded for video-chat.
					if ( $this->webrtc2_user_name_excluded( $hostId_data->user_login ) ) {
						$continue = false;
						?>
						<p style="font-size:14px;margin:0 0 0 5px;">
							<?php
							echo __( "Access to video-chat is prohibited for user name: ", "webrtc2" ).$hostId_data->user_login;
							?>
						</p></div>
						<?php
					} elseif ( true === $continue ) {
						?>
						<p>
				    	<?php
				    	echo __("Instructions for using the video-chat plugin in: ", "webrtc2");
				    	?>
				    	<a href="<?php echo esc_url($path_doc_cn); ?>" title="中国人" target="_blank"><strong>[CN], </strong></a>
				    	<a href="<?php echo esc_url($path_doc_de); ?>" title="Deutsch" target="_blank"><strong>[DE], </strong></a>
				    	<a href="<?php echo esc_url($path_doc_en); ?>" title="English" target="_blank"><strong>[EN], </strong></a>
				    	<a href="<?php echo esc_url($path_doc_fr); ?>" title="Français" target="_blank"><strong>[FR], </strong></a>
				    	<a href="<?php echo esc_url($path_doc_it); ?>" title="Italiano" target="_blank"><strong>[IT], </strong></a>
				    	<a href="<?php echo esc_url($path_doc_ru); ?>" title="Русский" target="_blank"><strong>[RU] </strong></a>
			    	</p></div>
			  		<div class="max_min" title="chat size">
					  	<div style="display:flex;align-items: center;">
					  		<image id="max_on" style="display:inline-flex;cursor: pointer;" src="<?php echo esc_url($path_img_max_on); ?>" onclick="webrtc2_max_min_win(id);">
					  		<image id="max_off" style="display:none;cursor: pointer;" src="<?php echo esc_url($path_img_max_off); ?>" onclick="webrtc2_max_min_win(id);">
					  	</div>
					  	<div style="display:flex;align-items: center;">
					  		<image id="min_on" style="display:none;cursor: pointer;" src="<?php echo esc_url($path_img_min_on); ?>" title="chat size" onclick="webrtc2_max_min_win(id);">
					  		<image id="min_off" style="display:inline-flex;cursor: pointer;" src="<?php echo esc_url($path_img_min_off); ?>" title="chat size" onclick="webrtc2_max_min_win(id);">
					  	</div>
					  </div>
			  		<?php
					} else {
						?>
						</div>
						<?php
					}
	      } else {
	      	?>
	      	</p>
	      	</div>
	      	<?php
	      	$continue = false;
	      }
	      ?>
		</div>
		<?php

		return $continue;
	}
}
