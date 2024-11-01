<?php
/**
 * Description: Check and Send email from site.
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
 * Send email(text_messages data) to $_webrtc2_hostId.
 * In webrtc2-sign.php - (cmd0)
 * @param  string $_webrtc2_hostId   [description]
 * @param  string $_webrtc2_fld_chat [description]
 */
function webrtc2_mail_text_messages($_webrtc2_hostId, $_webrtc2_fld_chat) {
	if ("Protocol of chat:<br>" !== $_webrtc2_fld_chat) {
		$val   = get_option( "webrtc2_main_settings" );
		$email = isset( $val["email"] ) ? $val["email"] : "email_php";

		$server_admin_email = sanitize_text_field($_SERVER["SERVER_ADMIN"]);
		$server_name        = sanitize_text_field($_SERVER["SERVER_NAME"]);

		$site_url = get_site_url();
		$message  = "<p>From: ". $site_url . "</p>";

		$hostId  = username_exists( $_webrtc2_hostId );
		$text_messages = get_user_meta($hostId, "text_messages", true);
		$host_info     = get_userdata($hostId);

		if ("1" === $text_messages) {
			$subject = "Text messages of video-chat (" . $server_name . ")";

			$message .= "Your name in video chat: " . $_webrtc2_hostId . "<br>";

			$headers[] = "MIME-Version: 1.0";
			$headers[] = "Content-type: text/html; charset=UTF-8";
			if ("" !== $server_admin_email) {
				//The default sender name is WordPress and the default email is wordpress@yoursite.com.
				$headers[] = "From: no-reply <" . $server_admin_email . ">";
			}

			if ("email_php" === $email) {
				mail( $host_info->user_email, $subject, $message . $_webrtc2_fld_chat, implode("\r\n", $headers) );
			}
			if ("emai_smtp" === $email) {
				wp_mail( $host_info->user_email, $subject, $message . $_webrtc2_fld_chat, implode("\r\n", $headers) );
			}
		}
	}
}
/**
 * Send email(autoresponder data) to $_webrtc2_guestId from $_webrtc2_hostId.
 * In webrtc2-sign.php - (cmd2)
 * @param  string $_webrtc2_hostId  [description]
 * @param  string $_webrtc2_guestId [description]
 * @param  string $_webrtc2_msg     [description]
 * @param  string $date             [description]
 */
function webrtc2_mail_autoresponder($_webrtc2_hostId, $_webrtc2_guestId, $_webrtc2_msg, $date) {
	$val   = get_option( "webrtc2_main_settings" );
	$email = isset( $val["email"] ) ? $val["email"] : "email_php";

	$server_admin_email = sanitize_text_field($_SERVER["SERVER_ADMIN"]);
	$server_name        = sanitize_text_field($_SERVER["SERVER_NAME"]);

	$site_url = get_site_url();
	$message  = "<p>From: ". $site_url . "</p>";

	$guestId  = username_exists( $_webrtc2_guestId );
	$autoresponder = get_user_meta($guestId, "autoresponder", true);
	$guest_info    = get_userdata($guestId);

	if ("1" === $autoresponder) {
		$subject = "Autoresponder of video-chat (" . $server_name . ")";

		$message .= "<p>On your name <b>" . $_webrtc2_guestId . "</b> received a message from <b>" . $_webrtc2_hostId . "</b></p>";
		$message .= "<p>[" . $date . "] " . $_webrtc2_hostId . ": " . $_webrtc2_msg . "</p>";

		$headers[] = "MIME-Version: 1.0";
		$headers[] = "Content-type: text/html; charset=UTF-8";
		if ("" !== $server_admin_email) {
			//The default sender name is WordPress and the default email is wordpress@yoursite.com.
			$headers[] = "From: no-reply <" . $server_admin_email . ">";
		}

		if ("email_php" === $email) {
			mail( $guest_info->user_email, $subject, $message, implode("\r\n", $headers) );
		}
		if ("emai_smtp" === $email) {
			wp_mail( $guest_info->user_email, $subject, $message, implode("\r\n", $headers) );
		}
	}
}
/**
 * Check email service of site.
 * In webrtc2-sign.php - (cmd9)
 */
function webrtc2_mail_check() {
	$val   = get_option( "webrtc2_main_settings" );
	$email = isset( $val["email"] ) ? $val["email"] : "email_php";

	$server_admin_email = sanitize_text_field($_SERVER["SERVER_ADMIN"]);
	$server_name        = sanitize_text_field($_SERVER["SERVER_NAME"]);

	$site_url = get_site_url();
	$message  = "<p>From: ". $site_url . "</p>";

	$to = get_bloginfo("admin_email");

	$headers[] = "MIME-Version: 1.0";
	$headers[] = "Content-type: text/html; charset=UTF-8";
	if ("" !== $server_admin_email) {
		//The default sender name is WordPress and the default email is wordpress@yoursite.com.
		$headers[] = "From: no-reply <" . $server_admin_email . ">";
	}

	if ("email_php" === $email) {
		$subject = "Server check PHP mail() (" . $server_name . ")";
		$message .= "<p style='font-weight: bold;'>PHP mail() is ready for work</p>";

		if (mail( $to, $subject, $message, implode("\r\n", $headers) ) ) {
			echo("Settings <b>PHP mail()</b> are correct. Check mailbox " . $to);
		}else{
			echo("PHP mail() failed.");
			echo("<br>server admin email: " . $server_admin_email);
			echo("<br>server_name: " . $server_name);
			echo("<br>site url: " . $site_url);
			echo("<br>admin_email: " . $to);
		}
	}
	if ("emai_smtp" === $email) {
    $subject = "Server check SMTP (" . $server_name . ")";
    $message .= "<p style='font-weight: bold;'>server SMTP is ready for work</p>";

    if (wp_mail( $to, $subject, $message, implode("\r\n", $headers) ) ) {
    	echo("Settings <b>Mail server</b> are correct. Check mailbox " . $to);
    }else{
			echo("Mail server failed.");
			echo("<br>server admin email: " . $server_admin_email);
			echo("<br>server_name: " . $server_name);
			echo("<br>site url: " . $site_url);
			echo("<br>admin_email: " . $to);
    }
	}
}
