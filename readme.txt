=== WP-WebRTC2 ===

Plugin Name: WP-WebRTC2
Plugin URI: https://wordpress.org/plugins/wp-webrtc2/
Tags: chat, videochat, webrtc
Author: Oleg Klenitsky <klenitskiy.oleg@mail.ru>
Author URI: https://adminkov.bcr.by/
Contributors: adminkov, innavoronich
Requires PHP: 7.5
Requires at least: 6.0
Tested up to: 6.6
Stable tag: 1.7.4
License: GPLv2
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Donate link: https://adminkov.bcr.by/
Initiation:	Dedicated to granddaughter Arina Akrushko

Free video chat for registered site users.

== Description ==

WP-WebRTC2 is a WordPress CMS plugin that provides video chat between registered visitors to the site where the plugin is installed. The number of pairs of interlocutors is not limited. Within the framework of this video chat, it is possible to: exchange text messages, files, video recording of the conversation, providing the interlocutor with an overview of your computer screen during communication. A registered visitor can leave a message to an interlocutor who is not currently on the video chat page. When the interlocutor appears on the video chat page, he will read all the messages addressed to him from various registered site visitors. These messages will then be automatically deleted. The WP-WebRTC2 plugin is focused on the use of browsers: Google Chrome, Fire Fox, Edge, Opera, Yandex.

Instructions for using the video-chat plugin in: <a href="https://adminkov.bcr.by/wp-content/plugins/wp-webrtc2/doc/doc_cn/webrtc2_cn.html" target="_blank" title="中国人">[CN]</a>, <a href="https://adminkov.bcr.by/wp-content/plugins/wp-webrtc2/doc/doc_de/webrtc2_de.html" target="_blank" title="Deutsch">[DE]</a>, <a href="https://adminkov.bcr.by/wp-content/plugins/wp-webrtc2/doc/doc_en/webrtc2_en.html" target="_blank" title="English">[EN]</a>, <a href="https://adminkov.bcr.by/wp-content/plugins/wp-webrtc2/doc/doc_fr/webrtc2_fr.html" target="_blank" title="Français">[FR]</a>, <a href="https://adminkov.bcr.by/wp-content/plugins/wp-webrtc2/doc/doc_it/webrtc2_it.html" target="_blank" title="Italiano">[IT]</a>, <a href="https://adminkov.bcr.by/wp-content/plugins/wp-webrtc2/doc/doc_ru/webrtc2_ru.html" target="_blank" title="Русский">[RU]</a>

You can test this plugin on its <a href="https://adminkov.bcr.by/contact/" target="_blank"><strong> home page</strong></a>

You can send a letter to the developer at: klenitskiy.oleg@mail.ru

==Additionally:==

 Client WP-WebRTC2 (executable jar) application has been developed for a client workstation (personal computer or laptop) on the Windows platform, which provides video communication for two registered visitors to the site, on which the WP-WebRTC2 plugin is installed.After launch, the application is located in the system tray of Windows OS in the form of an icon waiting for a call to video communication.
 <a href="https://adminkov.bcr.by/support/" target="_blank" title="Support">Client WP-WebRTC2 (executable jar)</a>

== Installation ==

1. Download the plugin from the WordPress repository and activate it.
2. Go to the plugin Settings section.
3. Parameter <strong>WHO-IS service:</strong>
-set value: IP-API
4. Parameter <strong>STUN server:</strong>
-leave the field blank.
5. Parameters <strong>TURN server:</strong>
-get data from provider TURN server.
6. Click the button Save.
7. Wait 5min. until the plugin fills in the empty fields of the Servers table.
8. Insert a short code - <strong>[webrtc2]</strong> on any page to display video-chat.<br>

<strong>Note:</strong> If this plugin was previously installed, it is recommended to deactivate and remove the previous plugin installation and then download and activate the new plugin installation.

== Screenshots ==

1. General view of the video-chat plugin.
2. Call statistics in admin panel.
3. Stun servers in admin panel.
4. Interactive drawing board.

== Changelog ==

= 1.0.0 =
* First publication of the plugin.

= 1.0.1 =
* Tested up to: WordPress 5.3.

= 1.0.2 =
* Tested up to: WordPress 5.4.

= 1.1.0 =
* An experimental signaling algorithm has been developed that increases the likelihood of peer-to-peer connections in congested networks or not sufficient RAM on users' computers. Further development of this version (1.1 ...) will go in this direction.

= 1.2.0 =
* Improved video recording. The screens of two communication participants and text messaging are recorded in one .webm file.

= 1.2.1 =
* Refactoring code. Removed code fragment (ice restart).

= 1.3.0 =
* Added: webrtc2-processor.js (because ScriptProcessorNode is deprecated).
* Added: webrtc2-rest-api.php (for future development).

= 1.4.0 =
* The end user can create his own list of contacts in the Profile.
* Support for video communication from Android mobile devices.
* Remove support webrtc2-rest-api.php

= 1.5.0 =
* Using a midi-keyboard (virtual) and synthesizer.

= 1.6.0 =
* Remove support midi-keyboard (virtual) and synthesizer.
* Creating a table of user call statistics in the admin panel.

= 1.7.0 =
* Automatic health check of stun servers.

= 1.7.1 =
* Responsive design.

= 1.7.2 =
* Added interactive drawing board. Drawing geometric shapes and formulas.

= 1.7.3 =
* Correct graphic charts.

= 1.7.4 =
* Using email in a video chat user profile.

== Frequently Asked Questions ==

= Do I need to install additional software for this plugin to provide video chat? =
The WP-WebRTC2 plugin does not require additional software. Signaling server functions are provided by the plugin itself. PHP signal ing modules are located in the subfolder of the plugin: wp-webrtc2/includes/ The signaling exchange data is stored in the:<br>
get_option( 'webrtc2_users_online' );<br>
get_option( 'webrtc2_users_guests' );<br>
get_option( 'webrtc2_ice_candidates' );<br>
get_option( 'webrtc2_sdp_offer' );<br>
get_option( 'webrtc2_sdp_answer' );<br>
get_option( 'webrtc2_autoresponder' );<br>

= Does the choice of the Stun server in the plugin settings affect the speed of establishing a video chat? =
The site administrator can enter one Stun server value in the plugin settings. The recommended list is located  on the settings page and is optional. If this field is left blank, the plugin will automatically select the optimal Stun server for the video chat user. The selection criteria are: the common time zone of the Stun server and the video user, and the minimum time delay of the Stun server.

= What should a registered user do if an unfamiliar and unwanted, other registered user calls him? =
To avoid unwanted conversation with another registered user - click on your username - you will be taken to your profile. Then, at the very bottom, create your contact list with registered users. Click - Update Profile button. You will only receive calls from the created list of registered users.

= Rows with the value failed appear periodically in the Stun servers table. What to do with these lines? =
1. You can mark these lines with a checkmark and run the "Bulk action -> update" command. The "Response" field will be labeled "manually".
2. You can leave everything as is. The plugin itself, according to its own schedule, which can be seen in the "Graph" window pop-up, will check the health of Stun servers and put the "auto" mark in the "Response" field.
3. If for a long time (1-2 weeks) some Stun server definitely failed, you can delete it from the Stun servers table using the "Bulk action -> delete" command.

= How to replace an existing video chat poster with a different image? =
Select a suitable image for the theme of your site and put it in the directory: ...\wp-content\plugins\wp-webrtc2\images with the name poster (png/gif)
