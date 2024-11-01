
/**
 * @description Exchange sdp, ice-candidates between chat members.
 * @category webrtc2-sign.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

/**
 * Send stop of video-chat to server.
 */
function webrtc2_chat_stop() {
  if (webrtc2_dataChannel && "open" == webrtc2_dataChannel.readyState) {
    webrtc2_dataChannel.send(JSON.stringify({"name" : "cmd", "text" : "stop_chat"}));
  }
  if (webrtc2_pc) {
    let webrtc2_guestId = sessionStorage.getItem("webrtc2_guestId");
    let fld_chat = document.getElementById("fld_chat");
    let result = "";
    fld_chat.childNodes.forEach(msg => {
      if ("LABEL" === msg.nodeName) {
        result = result + msg.textContent + "<br>";
      }
    });
    let params = "webrtc2_hostId=" + webrtc2_hostId +
      "&webrtc2_guestId=" + webrtc2_guestId +
      "&fld_chat=" + result + "&webrtc2_cmd=cmd0" +
      "&action=sign" +
      "&nonce=" + webrtc2_nonce;

    let curr_time = new Date();
	  let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
    console.log(`%c${log_time} client: Send stop of video-chat of ${webrtc2_hostId} to server.`, `color:blue`);

    webrtc2_makeRequest(params)
    .then(msg => {
      console.log(`%c${msg}`, `color:green`);
      if (webrtc2_dataChannel) {
        webrtc2_dataChannel.close();
      }
      if (webrtc2_statChannel) {
        webrtc2_statChannel.close();
      }
      if (webrtc2_ctxChannel) {
        webrtc2_ctxChannel.close();
      }
    });
  }
}
/**
 * @description Send list name of guests to server.
 * @param {string} webrtc2_guestId webrtc2_guestId.
 */
function webrtc2_send_guestId(webrtc2_guestId) {
  if ("no_name" !== webrtc2_hostId) {
    let params = "webrtc2_hostId=" + webrtc2_hostId +
      "&webrtc2_guestId=" + webrtc2_guestId +
      "&webrtc2_cmd=cmd1" +
      "&action=sign" +
      "&nonce=" + webrtc2_nonce;

    let curr_time = new Date();
		let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
    console.log(`%c${log_time} client: Send current guest list of ${webrtc2_hostId} to server.`, `color:blue`);

    webrtc2_makeRequest(params)
    .then(msg => console.log(`%c${msg}`, `color:green`));
  }
}
/**
 * @description Send msg of webrtc2_hostId to autoresponder on server (autoresponder).
 * @param {string} message Message for send to autoresponder.
 */
function webrtc2_autoresponder_send( message ) {
  let webrtc2_guestId = sessionStorage.getItem("webrtc2_guestId");
  if ("no_name" !== webrtc2_hostId) {
    let params = "webrtc2_hostId=" + webrtc2_hostId +
      "&webrtc2_guestId=" + webrtc2_guestId +
      "&webrtc2_msg=" + message +
      "&webrtc2_cmd=cmd2" +
      "&action=sign" +
      "&nonce=" + webrtc2_nonce;

    let curr_time = new Date();
		let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
    console.log(`%c${log_time} client: Send msg to autoresponder: from ${webrtc2_hostId} to ${webrtc2_guestId}` , `color:blue`);

    webrtc2_makeRequest(params)
    .then(msg => console.log(`%c${msg}`, `color:green`));
  }
}
/**
 * @description Receive msg for webrtc2_hostId from autoresponder on server (autoresponder).
 * @return {string} Message.
 */
async function webrtc2_autoresponder_receive() {
	if ("no_name" !== webrtc2_hostId) {
		let params = "webrtc2_hostId=" + webrtc2_hostId +
			"&webrtc2_cmd=cmd3" +
			"&action=sign" +
			"&nonce=" + webrtc2_nonce;
		let msg = await webrtc2_makeRequest(params);
		if (msg) {
			let curr_time = new Date();
			let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
			console.log(`%c${log_time} client: Receive messages from autoresponder: for ${webrtc2_hostId}`, `color:blue`);
			return msg;
		}
	}
}
/**
 * @description Send ice-candidate of webrtc2_hostId to server.
 * @param {string} webrtc2_ice_candidates ICE candidates of webrtc2_hostId.
 */
function webrtc2_send_ice( webrtc2_ice_candidates ) {
	let params = "webrtc2_hostId=" + webrtc2_hostId +
		"&webrtc2_ice_candidates=" + webrtc2_ice_candidates +
		"&webrtc2_cmd=cmd4" +
		"&action=sign" +
		"&nonce=" + webrtc2_nonce;

	let curr_time = new Date();
	let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
	console.log(`%c${log_time} client: Send ice-candidates of ${webrtc2_hostId} to server`, `color:blue`);

	webrtc2_makeRequest(params)
	.then(msg => {
		console.log(`%c${msg}`, `color:green`)
	});
}
/**
 * @description Receive ice candidates from server.
 * @return {array} Ice candidates.
 */
async function webrtc2_receive_ice() {
	let webrtc2_guestId = sessionStorage.getItem("webrtc2_guestId");
	let params = "webrtc2_guestId=" + webrtc2_guestId +
		"&webrtc2_cmd=cmd5" +
		"&action=sign" +
		"&nonce=" + webrtc2_nonce;

	let msg = await webrtc2_makeRequest(params);
	if (msg) {
		let curr_time = new Date();
		let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
		console.log(`%c${log_time} client: Receive from server ice candidates of ${webrtc2_guestId}`, `color:blue`);
		return JSON.parse(msg);
	}
}
/**
 * @description Send sdp of webrtc2_hostId to server.
 * @param {string} sdp  SDP of webrtc2_hostId.
 * @param {string} type Offer or Answer SDP of webrtc2_hostId.
 */
function webrtc2_send_sdp( sdp, type ) {
	let params = "webrtc2_hostId=" + webrtc2_hostId +
		"&webrtc2_sdp=" + sdp +
		"&webrtc2_type_sdp=" + type +
		"&webrtc2_cmd=cmd6" +
		"&action=sign" +
		"&nonce=" + webrtc2_nonce;

	let curr_time = new Date();
	let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
	console.log(`%c${log_time} client: Send ${type} of ${webrtc2_hostId} to server.`, `color:blue`);

	webrtc2_makeRequest(params)
	.then((msg) => console.log(`%c${msg}`,`color:green`));
}
/**
 * @description Receive sdp from server.
 * @param {string} webrtc2_type_sdp Offer or Answer.
 * @return {string} SDP.
 */
async function webrtc2_receive_sdp( webrtc2_type_sdp ) {
	let webrtc2_guestId = sessionStorage.getItem("webrtc2_guestId");
	let params = "webrtc2_guestId=" + webrtc2_guestId +
		"&webrtc2_type_sdp=" + webrtc2_type_sdp +
		"&webrtc2_cmd=cmd7" +
		"&action=sign" +
		"&nonce=" + webrtc2_nonce;
	let msg = await webrtc2_makeRequest(params);
	if (msg) {
		let curr_time = new Date();
		let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
		console.log(`%c${log_time} client: Receive from server ${webrtc2_type_sdp} of ${webrtc2_guestId}`, `color:blue`);
		return JSON.parse(msg);
	}
}
/**
 * @description Send call_stat of videochat to server.
 * @param {string} state: start or stop.
 */
function webrtc2_call_stat(state) {
	let webrtc2_guestId   = sessionStorage.getItem("webrtc2_guestId");
	let webrtc2_initiator = sessionStorage.getItem("webrtc2_initiator");

	if (webrtc2_pc && "new" !== webrtc2_pc.iceConnectionState) {
		let agentInfo = detect.parse(navigator.userAgent);
		let browser = "";

		if (!agentInfo.browser.major) {
			browser = agentInfo.browser.family;
		} else {
			browser = agentInfo.browser.family + " version " +
				agentInfo.browser.major + "." +
				agentInfo.browser.minor + "." +
				agentInfo.browser.patch;
		}

		let params = "webrtc2_hostId=" + webrtc2_hostId +
			"&webrtc2_guestId=" + webrtc2_guestId +
			"&initiator=" + webrtc2_initiator +
			"&state=" + state +
			"&browser=" + browser +
			"&webrtc2_cmd=cmd8" +
			"&action=sign" +
			"&nonce=" + webrtc2_nonce;

		let curr_time = new Date();
		let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
		console.log(`%c${log_time} client: Send call_stat signal of videochat (${webrtc2_hostId}) to server.`, `color:blue`);

		webrtc2_makeRequest(params)
		.then(msg => console.log(`%c${msg}`, `color:green`));
	}
}
/**
 * @description Set session ID for initiator of chat.
 */
function webrtc2_set_session() {
	let params = "webrtc2_hostId=" + webrtc2_hostId +
		"&webrtc2_cmd=cmd9" +
		"&action=sign" +
		"&nonce=" + webrtc2_nonce;

	let curr_time = new Date();
	let log_time  = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";
	console.log(`%c${log_time} client: Set session ID of ${webrtc2_hostId} to server`, `color:blue`);

	webrtc2_makeRequest(params)
	.then(msg => {
		console.log(`%c${msg}`, `color:green`)
	});
}
/**
 * @description Peer to Peer video-chat.
 */
function webrtc2_chat_init() {
	let webrtc2_guestId = sessionStorage.getItem("webrtc2_guestId");
	let timer_receive_answer;
	let timer_receive_ice;

	if ( "true" === sessionStorage.getItem("webrtc2_initiator") ) {
		// Init data channel for statistics data of guestId.
		webrtc2_statChannel = webrtc2_pc.createDataChannel("statChannel", {protocol: "json"});
		webrtc2_statChannel.binaryType = "arraybuffer";
		webrtc2_datachannel_stat();

		// Init data channel for receive/send of messages, files.
		webrtc2_dataChannel = webrtc2_pc.createDataChannel("dataChannel", {protocol: "json/arraybuffer"});
		webrtc2_dataChannel.binaryType = "arraybuffer";
		webrtc2_datachannel_data();

		// Init data channel for interactive drawing board.
		webrtc2_ctxChannel = webrtc2_pc.createDataChannel("ctxChannel", {protocol: "json"});
		webrtc2_ctxChannel.binaryType = "arraybuffer";
		webrtc2_datachannel_ctx();

		webrtc2_pc.createOffer(webrtc2_offerOptions)
		// Modifying the SDP to check ice-ufrag, ice-pwd.
		.then(offer => {
			offer.sdp = webrtc2_chk_ufrag_pwd(webrtc2_hostId, "Offer", offer.sdp);
			return offer;
		})
		.then(offer => {
			webrtc2_pc.setLocalDescription(offer);
			return offer;
		})
		// modify the SDP after calling setLocalDescription.
		.then(offer => {
			offer.sdp = webrtc2_setMediaBitrates(webrtc2_hostId, "Offer", offer.sdp);
			return offer;
		})
		.then(offer => {
			webrtc2_log_sdp(webrtc2_hostId, " -> Send [Offer] to " + webrtc2_guestId + ":", offer.sdp);
			webrtc2_send_sdp(JSON.stringify(offer), "offer");
		})
		// Receive answer sdp of webrtc2_guestId from server.
		.then(timer_receive_answer = setInterval(() => {
			webrtc2_receive_sdp("answer").then(answer => {
				if (answer) {
					webrtc2_log_sdp(webrtc2_hostId, " -> Receive [Answer] from " + webrtc2_guestId + ":", answer.sdp);
					webrtc2_pc.setRemoteDescription(answer);
					clearInterval(timer_receive_answer);
				}
			})
		}, 10000))
		// Receive ice-candidates of webrtc2_guestId from server.
		.then(timer_receive_ice = setInterval(() => {
			webrtc2_receive_ice().then(iceCandidates => {
				if (iceCandidates) {
					webrtc2_ice_remote(iceCandidates);
					for (let iceCandidate of iceCandidates) {
						webrtc2_pc.addIceCandidate(iceCandidate).catch((err) => {
							clearInterval(timer_receive_ice);
							console.log(`%cError: ${err.message}`,`color:red`);
						});
					}
					clearInterval(timer_receive_ice);
				}
			})
		}, 10000));
	}else{
		// Receive offer sdp of webrtc2_guestId from server.
		let timer_receive_offer = setInterval(() => {
			webrtc2_receive_sdp("offer").then(offer => {
				if (offer) {
					webrtc2_log_sdp(webrtc2_hostId, " -> Receive [Offer] from " + webrtc2_guestId + " :", offer.sdp);
					webrtc2_pc.setRemoteDescription(offer).then(() => webrtc2_pc.createAnswer())
					.then((answer) => {
						// Modifying the SDP to check ice-ufrag, ice-pwd.
						answer.sdp = webrtc2_chk_ufrag_pwd(webrtc2_hostId, "Answer", answer.sdp);
						return answer;
					})
					.then(answer => {
						webrtc2_pc.setLocalDescription(answer);
						return answer;
					})
					// modify the SDP after calling setLocalDescription.
					.then(answer => {
						answer.sdp = webrtc2_setMediaBitrates(webrtc2_hostId, "Answer", answer.sdp);
						return answer;
					})
					.then(answer => {
						webrtc2_log_sdp(webrtc2_hostId, " -> Send [Answer] to " + webrtc2_guestId + ":", answer.sdp);
						webrtc2_send_sdp(JSON.stringify(answer), "answer");
					})
					// Receive ice-candidates of webrtc2_guestId from server.
					.then(timer_receive_ice = setInterval(() => {
						webrtc2_receive_ice().then(iceCandidates => {
							if (iceCandidates) {
								webrtc2_ice_remote(iceCandidates);
								for (let iceCandidate of iceCandidates) {
									webrtc2_pc.addIceCandidate(iceCandidate).catch((err) => {
										clearInterval(timer_receive_ice);
										console.log(`%cError: ${err.message}`,`color:red`);
									});
								}
								clearInterval(timer_receive_ice);
							}
						})
					}, 10000));
					clearInterval(timer_receive_offer);
				}
			})
		}, 10000);
	}
}
/**
 * @description Make request XMLHttpRequest.
 * @param {string} params Parameter for request.
 */
function webrtc2_makeRequest (params) {
	return new Promise( function(resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", webrtc2_url_ajax, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = function() {
			if (this.readyState == 4 && this.status == 200) {
				resolve(this.response);
			}else{
				reject({
					status: this.status,
					statusText: this.statusText
				});
			}
    };
    xhr.onerror = function() {
			reject({
				status: this.status,
				statusText: this.statusText
			});
    };
    xhr.send(params);
	});
}
