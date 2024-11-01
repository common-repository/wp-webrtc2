/**
 * @description Declaration of global variables.
 * @category webrtc2-variables.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

/**
 * @description Initiator of video-chat or not.
 */
sessionStorage.setItem("webrtc2_initiator", false );

/**
 * @description Video-chat start or not.
 */
sessionStorage.setItem("webrtc2_chat_start", false );

/**
 * @description Type of graph stat (graph1 ... graph4).
 */
sessionStorage.setItem("webrtc2_graph_stat", "" );

/**
 * @description User name of guest of video-chat.
 */
sessionStorage.setItem("webrtc2_guestId", "" );

/**
 * @description Statistic data for displaying on graph1.
 */
sessionStorage.setItem("webrtc2_bytesReceived_prev_video", 0 );
sessionStorage.setItem("webrtc2_packetsReceived_prev_video", 0 );

/**
 * @description Statistic data for displaying on graph2.
 */
sessionStorage.setItem("webrtc2_bytesSent_prev_video", 0 );
sessionStorage.setItem("webrtc2_packetsSent_prev_video", 0 );

/**
 * @description Statistic data for displaying on graph3.
 */
sessionStorage.setItem("webrtc2_bytesSent_prev_transport", 0 );
sessionStorage.setItem("webrtc2_bytesReceived_prev_transport", 0 );

/**
 * @description Bytes previous of bytesReceived statistics.
 */
sessionStorage.setItem("webrtc2_bytesReceivedPrev", 0 );

/**
 * @description Time previous of bytesReceived statistics.
 */
sessionStorage.setItem("webrtc2_timestampReceivedPrev", + new Date() );

/**
 * @description Build last 6 string of fld_chat for videoStreamAll.
 */
sessionStorage.setItem("webrtc2_videoStreamAll_chat", false);

/**
 * @description Img folder for_fld_file_attach.
 * @var object
 */
var webrtc2_file_select = null;

/**
 * @description Object RTCPeerConnection.
 * @var object
 */
var webrtc2_pc = null;

/**
 * @description The current number of the drop-down list in the dump window.
 * @var integer
 */
var webrtc2_num_hide = 0;

/**
 * @description Data channel for receive or send of messages.
 * @var object
 */
var webrtc2_offerOptions = {
  iceRestart: false,
  offerToReceiveAudio: true,
  offerToReceiveVideo :true,
};

/**
 * @description Data channel for receive/send of messages.
 * @var object
 */
var webrtc2_dataChannel = null;

/**
 * @description Data channel for receive/send stats data.
 * @var object
 */
var webrtc2_statChannel = null;

/**
 * @description Data channel for interactive drawing board.
 * @var object
 */
var webrtc2_ctxChannel = null;

/**
 * @description MediaRecorder of videoStreamAll = videoStream1 + videoStream2.
 * @var object
 */
var webrtc2_videoStreamAll_MediaRec = null;

/**
 * @description Array of videoStreamAll for Blob of webrtc2_videoStreamAll_MediaRec.
 * @var array
 */
var webrtc2_videoStreamAll_BlobsRec = [];

/**
 * @description Last 6 string of fld_chat for videoStreamAll.
 * @var array
 */
var webrtc2_videoStreamAll_ChatNew = [];

/**
 * @description Stat WebRTC - inbound_rtp_video.
 * @var object
 */
var webrtc2_inbound_rtp_video = {};

/**
 * @description Stat WebRTC - inbound_rtp_video of client remote.
 * @var object
 */
var webrtc2_inbound_rtp_video_remote = {};

/**
 * @description Stat WebRTC - outbound_rtp_video.
 * @var object
 */
var webrtc2_outbound_rtp_video = {};

/**
 * @description Stat WebRTC - outbound_rtp_video of client remote.
 * @var object
 */
var webrtc2_outbound_rtp_video_remote = {};

/**
 * @description Stat WebRTC - transport.
 * @var object
 */
var webrtc2_transport = {};

/**
 * @description Stat WebRTC - transport of client remote.
 * @var object
 */
var webrtc2_transport_remote = {};

/**
 * @description Stat WebRTC - channel.
 * @var object
 */
var webrtc2_channel = {"statChannel":{}, "dataChannel":{}, "ctxChannel":{}};

/**
 * @description Stat WebRTC - channel of client remote.
 * @var object
 */
var webrtc2_channel_remote = {"statChannel":{}, "dataChannel":{}, "ctxChannel":{}};

/**
 * @description Stat WebRTC - bitrate and fps.
 * @var object
 */
var webrtc2_ticker = {};

/**
 * @description Stat WebRTC - sound level meters.
 * @var object
 */
var webrtc2_vu_audio = {};

/**
 * @description Stat WebRTC - bitrate level meters.
 * @var object
 */
var webrtc2_vu_bitrate = {"text" : "unlimited"};

/**
 * @description Stat WebRTC - change webcam / screen share.
 * @var object
 */
var webrtc2_webcam_screen = {};

/**
 * @description AudioWorkletNode.
 * @uses In module: webrtc2-service.js
 * @var object
 */
var webrtc2_audio_meter = null;

/**
 * @description AudioContext for microphone level.
 * @uses In module: webrtc2-meter-wrklt.js
 * @var object
 */
var webrtc2_audioCtx = null;

/**
 * @description BoardCanvas.
 * @uses In module: webrtc2-board.js
 * @var object
 */
var webrtc2_boardCanvas = null;

/**
 * @description BoardContext.
 * @uses In module: webrtc2-board.js
 * @var object
 */
var webrtc2_boardCtx = null;

/**
 * @description Board remote active.
 * @uses In module: webrtc2-service.js
 * @var object
 */
var webrtc2_board_remote_active = "no";

/**
 * @description Board local active.
 * @uses In module: webrtc2-service.js
 * @var object
 */
var webrtc2_board_local_active = "no";
