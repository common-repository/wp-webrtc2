/**
 * @description Modify the SDP (offer, answer).
 * @category webrtc2-modify-sdp.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

/**
 * @description Modifying the SDP to Add a Bandwidth Constraint. Author: Nick Gauthier.
 * @param {object} user     User name of videi-chat.
 * @param {object} type_sdp Offer or Answer.
 * @param {string} sdp      SDP.
 * @return {string} Modifying the SDP.
 */
function webrtc2_setMediaBitrates(user, type_sdp, sdp) {
	let sdp_new = webrtc2_setMediaBitrate(user, type_sdp, sdp, "video", webrtc2_vu_bitrate.text);
		  sdp_new = webrtc2_setMediaBitrate(user, type_sdp, sdp_new, "audio", 50);
  return sdp_new;
}
/**
 * @description Modifying the SDP to Add a Bandwidth Constraint. Author: Nick Gauthier.
 * @param {string} user     User name of videi-chat.
 * @param {string} type_sdp Offer or Answer.
 * @param {string} sdp      SDP.
 * @param {string} media    Type of stream of getUserMedia.
 * @param {number} bitrate  Level of bitrate.
 * @return {string} Modifying the SDP.
 */
function webrtc2_setMediaBitrate(user, type_sdp, sdp, media, bitrate) {
  let lines = sdp.split("\n");
  let line  = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("m=" + media) === 0) {
      line = i;
      break;
    }
  }
  // Could not find the m line for.
  if (line === -1 || "unlimited" === bitrate) {
    return sdp;
  }
  // Found the m line for media at line.
  line++;

  // Skip i and c lines.
  while(lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
    line++;
  }
  // If we're on a b line, replace it.
  if (lines[line].indexOf("b") === 0) {
    lines[line] = "b=AS:" + bitrate + "\r";
    webrtc2_log_modify(user + "[" + type_sdp + "] -> replaced b line b=AS:" + bitrate +  " (line=" + (line+1) + ")");

    return lines.join("\n");
  }
  // Add a new b line.
  let newLines = lines.slice(0, line);
  newLines.push("b=AS:" + bitrate + "\r");
  newLines = newLines.concat(lines.slice(line, lines.length));
  webrtc2_log_modify(user + "[" + type_sdp + "] -> adding new b line: b=AS:" + bitrate +  " (line=" + (line) + ")");

  return newLines.join("\n");
}
/**
 * @description Modifying the SDP to check ice-ufrag, ice-pwd.
 * @param string user     User name of videi-chat.
 * @param string type_sdp Offer or Answer.
 * @param string sdp      SDP.
 * @return {string} Modifying the SDP.
 */
function webrtc2_chk_ufrag_pwd($user, type_sdp, sdp) {
	let lines = sdp.split("\n");

	for (var i = 0; i < lines.length; i++) {
		// If we're on a ice-ufrag line, check it.
		let ufrag_pos = lines[i].indexOf("a=ice-ufrag:", 0);
		if (-1 !== ufrag_pos) {
			let str    = lines[i].slice(ufrag_pos);
			let result = str.search(/[ /+]/gi);
			if(-1 !== result) {
        let str_len = lines[i].slice(12).length;
		  	let str_add = lines[i].slice(12).replace(/[^a-zA-Z0-9]/gi,"");
        str_add     = str_add.replace(/\s+/g, '');
		  	str_add     = webrtc2_randomInteger(str_add, str_len);
		  	lines[i]    = lines[i].slice(0, 12) + str_add + "\r";
		  	let num     = i + 1;
				webrtc2_log_modify($user + "[" + type_sdp + "] -> modify: " + str + " (line=" + num +")");
			}
		}
		// If we're on a ice-pwd line, check it.
		let pwd_pos = lines[i].indexOf("a=ice-pwd:", 0);
		if (-1 !== pwd_pos) {
			let str    = lines[i].slice(pwd_pos);
			let result = str.search(/[ /+]/gi);
			if(-1 !== result) {
        let str_len = lines[i].slice(10).length;
        let str_add = lines[i].slice(10).replace(/[^a-zA-Z0-9]/gi,"");
        str_add     = str_add.replace(/\s+/g, '');
        str_add     = webrtc2_randomInteger(str_add, str_len);
        lines[i]    = lines[i].slice(0, 10) + str_add + "\r";
        let num     = i + 1;
        webrtc2_log_modify($user + "[" + type_sdp + "] -> modify: " + str + " (line=" + num + ")");
			}
		}
	}

	return lines.join("\n");
}
/**
 * @description Getting a random integer in a given interval.
 * @param string str_add String of sdp.
 * @param string str_len Length of str_add.
 * @return {string} Modifying the SDP.
 */
function webrtc2_randomInteger(str_add, str_len) {
  let min = 0;
  let max = 9;

  while (str_add.length < str_len - 1) {
    let rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    str_add = str_add + rand;
  }

  return str_add;
}
/**
 * @description Renegotiate bandwidth on the fly.
 * @param {string} bandwidth Bitrate.
 */
function webrtc2_bandwidth(bandwidth) {
  // Loop through each track.
  for (let i = 0; i < webrtc2_pc.getSenders().length; i++) {
    let sender = webrtc2_pc.getSenders()[i];

    if(sender.track && sender.track.kind === "video"){
      let parameters = sender.getParameters();

      if (bandwidth === "unlimited") {
        delete parameters.encodings[0].maxBitrate;
      } else {
        parameters.encodings = [{maxBitrate:bandwidth * 1000}];
      }

      sender.setParameters(parameters).then(success, error);

      function success() {
        webrtc2_dump_msg(webrtc2_hostId, "-> Change MaxBitrate: "+ bandwidth);
      };

      function error(err) {
        webrtc2_log_err(err.name + ": ",  err.message);
      };
    }
  }
}
