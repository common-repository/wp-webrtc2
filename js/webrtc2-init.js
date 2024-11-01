/**
 * @description Creating a PC object and setting other events.
 * @category webrtc2-init.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

/**
 * @description Creating a PC object and setting other events.
 */
function webrtc2_peer_init() {
  let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");
  let td1 = tableMembersRows[0].querySelectorAll( "td" )[1];
  let constraints    = {};
  let configuration  = {};
  let iceServers     = [];
  let arr_candidates = [];

  if (RTCPeerConnection) {
    // Set STUN url.
    if ("" !== webrtc2_stun) {
      iceServers.push({urls: webrtc2_stun});
    }
    // Set TURN url.
    if ("" !== webrtc2_turn ) {
      let turnServers = webrtc2_turn.split(";");
      turnServers.forEach(srv => {
        if ("" !== srv) {
          iceServers.push({urls:srv,username:webrtc2_turn_usr,credential:webrtc2_turn_pwd});
        }
      });
    }
    configuration.trickle = false;

    // Detected browser.
    let agentInfo = detect.parse(navigator.userAgent);
    if ("Firefox" === agentInfo.browser.family) {
      let arr = iceServers.slice(0,2);
      configuration.iceServers = arr;
    } else {
      configuration.iceServers = iceServers;
    }

    webrtc2_pc    = new RTCPeerConnection(configuration);
    webrtc2_pc.id = td1.innerHTML.replace( /<(.+?)> /, "" );
    // fixed webrtc2_pc.id.
    webrtc2_pc.id = webrtc2_pc.id.replace( "</a>", "" );
  } else {
      webrtc2_log_err("webrtc: ", "This browser not support WebRTC.");
    return;
  }

  constraints = { audio: true, video: true, };
  navigator.mediaDevices.getUserMedia(constraints)
  .then((stream) => {
    document.getElementById("win1_video").srcObject = stream;
    stream.getTracks().forEach(track => webrtc2_pc.addTrack(track, stream));
    webrtc2_WorkletNodeAudioMeter(stream);
  })
  .catch((err) => {
    webrtc2_log_err("Webcam: ", err.message);
    constraints = { audio: true, video: false, };
    navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      let stream_err = webrtc2_canvas();
      document.getElementById("win1_video").srcObject = stream_err;
      stream_err.getTracks().forEach(track => webrtc2_pc.addTrack(track, stream_err));
      webrtc2_WorkletNodeAudioMeter(stream);
    });
  })
  .then(() => webrtc2_pc.oniceconnectionstatechange = (e) => webrtc2_iceconnectionstate_change(e))
  .then(() => webrtc2_pc.onsignalingstatechange = (e) => webrtc2_signalingstate_change(e))
  .then(() => webrtc2_pc.onicegatheringstatechange = (e) => webrtc2_icegatheringstate_change(e))
  .then(() => webrtc2_pc.onnegotiationneeded = (e) => webrtc2_negotiationneeded(e))
  .then(() => webrtc2_pc.onicecandidate = (e) => webrtc2_ice_local(e, arr_candidates))
  .then(() => webrtc2_pc.ontrack = (e) => (document.getElementById("win2_video").srcObject = e.streams[0]))
  .then(() => webrtc2_pc.ondatachannel = (e) => {
    if (e.channel.label == "statChannel") {
      webrtc2_statChannel = e.channel;
      webrtc2_datachannel_stat();
    }
    if (e.channel.label == "dataChannel") {
      webrtc2_dataChannel = e.channel;
      webrtc2_datachannel_data();
    }
    if (e.channel.label == "ctxChannel") {
      webrtc2_ctxChannel = e.channel;
      webrtc2_datachannel_ctx();
    }
  })
  .catch(error => {
    webrtc2_log_err(error.name + ": ",  error.message);
  });
}
/**
 * @description Determined when the state of the connection's ICE agent.
 * @param {object} event webrtc2_pc.oniceconnectionstatechange.
 */
function webrtc2_iceconnectionstate_change(event) {
  let connection = event.target;
  let screen_stat_timer;
  let local_stat_timer;

  switch (connection.iceConnectionState) {
    case "connected":
      // Send call_stat of videochat to server.
      webrtc2_call_stat("start");

      // ICE candidates pair succeeded.
      webrtc2_log_connectionStats();

      screen_stat_timer = setInterval(() => {
        // Get bitrate & fps and send to webrtc2_guestId.
        webrtc2_pc.getStats(null).then((stats) => {
          webrtc2_screen_stat(stats);
        })
      }, 5000);

      local_stat_timer = setInterval(() => {
        // Get stats of connection and send to webrtc2_guestId.
        webrtc2_pc.getStats(null).then((stats) => {
          webrtc2_collect_stat(stats);
        })
      }, 1000);
      document.getElementById("btn_include_member").disabled    = true;
      document.getElementById("btn_include_member").style.color = "white";

      document.getElementById("btn_exclude_member").disabled    = true;
      document.getElementById("btn_exclude_member").style.color = "white";

      document.getElementById("btn_start_record").disabled    = false;
      document.getElementById("btn_start_record").style.color = "green";

      document.getElementById("btn_stop_record").disabled    = false;
      document.getElementById("btn_stop_record").style.color = "red";

      document.getElementById("fld_file_attach").type = "file";
      document.getElementById("fld_file_attach").setAttribute("style", "z-index:-1;");
      document.getElementById("for_fld_file_attach").setAttribute("style", "z-index:1;");

      document.getElementById("btn_dump").style.color   = "green";
      document.getElementById("btn_dump").disabled      = false;

      document.getElementById("btn_chat").style.color   = "green";
      document.getElementById("btn_chat").disabled      = false;

      document.getElementById("btn_clear").style.color  = "red";
      document.getElementById("btn_clear").disabled     = false;

      document.getElementById("btn_graph").style.color  = "green";
      document.getElementById("btn_graph").disabled     = false;

      document.getElementById("btn_graph1").style.color = "green";
      document.getElementById("btn_graph1").disabled    = false;

      document.getElementById("btn_graph2").style.color = "green";
      document.getElementById("btn_graph2").disabled    = false;

      document.getElementById("btn_graph3").style.color = "green";
      document.getElementById("btn_graph3").disabled    = false;

      document.getElementById("btn_graph4").style.color = "green";
      document.getElementById("btn_graph4").disabled    = false;

      document.getElementById("btn_quit").style.color   = "red";
      document.getElementById("btn_quit").disabled      = false;

      document.getElementById("slogan").innerHTML = "connection established";
      document.getElementById("slogan").setAttribute("style", "flex-basis:80%;");
      break;
    case "disconnected":
      //
      document.getElementById("progress_connection").style.display = "none";
      document.getElementById("slogan").innerHTML = "disconnected";
      document.getElementById("slogan").setAttribute("style", "flex-basis:80%;");

      document.getElementById("wins1_ticker").innerHTML = "disconnected";
      document.getElementById("wins1_ticker").style.color = "black";
      break;
    case "failed":
      //
      document.getElementById("progress_connection").style.display = "none";
      document.getElementById("slogan").innerHTML = "connection failed";
      document.getElementById("slogan").setAttribute("style", "flex-basis:80%;");

      document.getElementById("wins1_ticker").innerHTML = "connection failed";
      document.getElementById("wins1_ticker").style.color = "black";

      //webrtc2_pc.restartIce();
      break;
    case "closed":
      //
      document.getElementById("progress_connection").style.display = "none";
      document.getElementById("slogan").innerHTML = "connection closed";
      document.getElementById("slogan").setAttribute("style", "flex-basis:80%;");

      document.getElementById("wins1_ticker").innerHTML = "connection closed";
      document.getElementById("wins1_ticker").style.color = "black";
      break;
  }
  webrtc2_dump_msg(webrtc2_hostId + " -> iceConnectionState: ", connection.iceConnectionState);
}
/**
 * @description Determined when the new state changes of webrtc2_pc.
 * @param {object} event webrtc2_pc.onsignalingstatechange.
 */
function webrtc2_signalingstate_change(event) {
  let connection = event.target;

  switch(connection.signalingState) {

    case "stable":
      // There is no offer/answer exchange in progress. This is also the initial state.

      break;
    case "have-local-offer":
      // Local description, of type "offer", has been successfully applied.

      break;
    case "have-remote-offer":
      //  Remote description, of type "offer", has been successfully applied.

      break;
    case "have-local-pranswer":
      // Remote description of type "offer" has been successfully applied and.
      // Local description of type "pranswer" has been successfully applied.

      break;
    case "have-remote-pranswer":
      // Local description of type "offer" has been successfully applied.
      // Remote description of type "pranswer" has been successfully applied.

      break;
  }
  webrtc2_dump_msg(webrtc2_hostId + " -> signalingState: ", connection.signalingState);
}
/**
 * @description Determined when the state of the ICE candidate gathering process changes of webrtc2_pc.
 * @param {object} event webrtc2_pc.onicegatheringstatechange.
 */
function webrtc2_icegatheringstate_change(event) {
  let connection = event.target;

  switch (connection.iceGatheringState) {
  case "new":
      // Peer connection was just created and hasn't done any networking yet.
      break;
    case "gathering":
      // ICE agent is in the process of gathering candidates.
      break;
    case "complete":
      // ICE agent has finished gathering candidates..
      break;
  }
  webrtc2_dump_msg(webrtc2_hostId + " -> iceGatheringState: ", connection.iceGatheringState);
}
/**
 * @description Connection negotiation occurs both during the initial connection setup
 * and at any time when a change in the communication environment requires the connection to be reconfigured.
 * @param {object} event  webrtc2_pc.onnegotiationneeded.
 */
function webrtc2_negotiationneeded(event) {
  let curr_time  = new Date();
  let log_time   = "[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]";

  console.log(`%c${log_time} client: negotiationneeded `, `color:blue`);
}
/**
 * @description Gathering and sending local ICE-candidates to the server.
 * @param {object} event  webrtc2_pc.onicecandidate.
 * @param  {array} arr_candidates Array of candidates.
 */
function webrtc2_ice_local(event, arr_candidates) {
  let webrtc2_ice = document.getElementById("ice_local");
  let num_row     = 0;
  let ice_local;

  // collect of ice candidates.
  if (event.candidate) {
    arr_candidates.push(event.candidate);
  }else{
    if (!webrtc2_ice) {
      // Create head of table ice candidates.
      webrtc2_log_ice("ice_local", arr_candidates);
      webrtc2_ice = document.getElementById("ice_local");
    }

    for (let iceCandidate of arr_candidates) {
      let row = document.createElement("tr");
      num_row ++;

      if(!iceCandidate) {
        continue;
      }
      let candidate = webrtc2_parseCandidate(iceCandidate.candidate);
      webrtc2_appendCell(row, num_row, "td");
      webrtc2_appendCell(row, candidate.component, "td");
      webrtc2_appendCell(row, candidate.type, "td");
      webrtc2_appendCell(row, candidate.foundation, "td");
      webrtc2_appendCell(row, candidate.protocol, "td");
      webrtc2_appendCell(row, candidate.address, "td");
      webrtc2_appendCell(row, candidate.port, "td");
      webrtc2_appendCell(row, webrtc2_formatPriority(candidate.priority), "td");

      if (num_row % 2 == 0) {
        row.cells[0].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
        row.cells[1].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
        row.cells[2].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
        row.cells[3].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
        row.cells[4].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
        row.cells[5].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
        row.cells[6].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
        row.cells[7].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
      } else {
        row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
        row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
        row.cells[2].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
        row.cells[3].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
        row.cells[4].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
        row.cells[5].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
        row.cells[6].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
        row.cells[7].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
      }
      webrtc2_ice.appendChild(row);
    }

    webrtc2_send_ice(JSON.stringify(arr_candidates));
    webrtc2_dump_msg(webrtc2_hostId, " -> Send [iceCandidates] to "+ sessionStorage.getItem("webrtc2_guestId"));
  }
}
/**
 * @description Creation of a table of remote ICE candidates.
 * @param {array} iceCandidates  Remote ICE candidates.
 */
function webrtc2_ice_remote(iceCandidates) {
  let webrtc2_ice = document.getElementById("ice_remote");
  let num_row     = 0;

  if (!webrtc2_ice) {
    // Create head of table ice candidates.
    webrtc2_log_ice("ice_remote", iceCandidates);
    webrtc2_ice = document.getElementById("ice_remote");
  }
  for (let iceCandidate of iceCandidates) {
    let row = document.createElement("tr");
    num_row ++;

    if (!iceCandidate) {
      continue;
    }
    let candidate = webrtc2_parseCandidate(iceCandidate.candidate);
    webrtc2_appendCell(row, num_row, "td");
    webrtc2_appendCell(row, candidate.component, "td");
    webrtc2_appendCell(row, candidate.type, "td");
    webrtc2_appendCell(row, candidate.foundation, "td");
    webrtc2_appendCell(row, candidate.protocol, "td");
    webrtc2_appendCell(row, candidate.address, "td");
    webrtc2_appendCell(row, candidate.port, "td");
    webrtc2_appendCell(row, webrtc2_formatPriority(candidate.priority), "td");

    if (num_row % 2 == 0) {
      row.cells[0].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
      row.cells[1].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
      row.cells[2].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
      row.cells[3].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
      row.cells[4].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
      row.cells[5].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
      row.cells[6].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
      row.cells[7].setAttribute("style", "background-color: #363636 !important;padding:0 !important;text-align: left !important;");
    } else {
      row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
      row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
      row.cells[2].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
      row.cells[3].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
      row.cells[4].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
      row.cells[5].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
      row.cells[6].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
      row.cells[7].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;text-align: left !important;");
    }
    webrtc2_ice.appendChild(row);
  }
}
/**
 * @description Parse a candidate: string into an object, for easier use by other methods.
 * @param {string} text text.
 */
function webrtc2_parseCandidate(text) {
  const candidateStr = "candidate:";
  const pos          = text.indexOf(candidateStr) + candidateStr.length;
  let [foundation, component, protocol, priority, address, port, , type] = text.substr(pos).split(" ");
  return {
    "component": component,
    "type": type,
    "foundation": foundation,
    "protocol": protocol,
    "address": address,
    "port": port,
    "priority": priority
  };
}
/**
 * @description Parse the uint32 PRIORITY field into its constituent parts from RFC 5245,
 * type preference, local preference, and (256 - component ID).
 * ex: 126 | 32252 | 255 (126 is host preference, 255 is component ID 1)
 * @param {string} priority Text.
 */
function webrtc2_formatPriority(priority) {
  return [
    priority >> 24,
    (priority >> 8) & 0xFFFF,
    priority & 0xFF
  ].join(" | ");
}
/**
 * @description Checking the ice-candidate array for exist srflx and relay.
 * @param {array} iceCandidates Array of ice-candidates.
 * @param {text} msg If there is no srflx or relay - it will blink.
 */
function webrtc2_check_ice_candidates(iceCandidates, msg) {
  let result    = [];
  let candidate = {};

  for ( let item of iceCandidates ) {
    if(!item) continue;
    candidate = webrtc2_parseCandidate(item.candidate);
    result.push(candidate.type);
  }
  if ( false === result.includes("srflx") ) {
    msg.className = "blinking";
    msg.innerHTML = msg.innerHTML + " No srflx";
    return;
  }
  if ( false === result.includes("relay") ) {
    msg.className = "blinking";
    msg.innerHTML = msg.innerHTML + " No relay";
    return;
  }
}
/**
 * @description Print message to win dump of webrtc2_hostId.
 * @param {string} id   webrtc2_hostId.
 * @param {object} desc message.
 */
function webrtc2_dump_msg(id, desc) {
  let curr_time    = new Date();
  let fld_dump     = document.getElementById("fld_dump");
  let webrtc2_msg1 = document.createElement("label");

  webrtc2_msg1.className = "msg";
  webrtc2_msg1.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) +"]</span>" + id + desc;

  fld_dump.appendChild(webrtc2_msg1);
}
/**
 * @description Print message to win chat of webrtc2_hostId from autoresponder.
 * @param {string} autoresponder Messages of autoresponder for webrtc2_hostId.
 */
function webrtc2_autoresponder_msg(autoresponder) {
  let messages = autoresponder.split("|");
  let fld_chat = document.getElementById("fld_chat");

  for ( let message of messages ) {
    if ( "" !== message ) {
      let webrtc2_msg1 = document.createElement("label");
      webrtc2_msg1.className = "autoresponder";

      webrtc2_msg1.innerHTML = message;
      fld_chat.appendChild(webrtc2_msg1);
    }
  }
}
/**
 * @description Print message to win dump of modify SDP.
 * @param {string} desc Message.
 */
function webrtc2_log_modify(desc) {
  let curr_time    = new Date();
  let fld_dump     = document.getElementById("fld_dump");
  let webrtc2_mod1 = document.createElement("label");

  webrtc2_mod1.className = "mod";
  webrtc2_mod1.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) +"]</span>" + desc;
  fld_dump.appendChild(webrtc2_mod1);
}
/**
 * @description Print message to win chat of webrtc2_hostId.
 * @param {string} id   Webrtc2_hostId.
 * @param {object} desc Message.
 */
function webrtc2_chat_msg(id, desc) {
  let curr_time    = new Date();
  let fld_chat     = document.getElementById("fld_chat");
  let webrtc2_msg1 = document.createElement("label");

  if ('*' !== webrtc2_hostId) {
    webrtc2_msg1.className = "msg";
    webrtc2_msg1.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) +"]</span>" + id + desc;
    fld_chat.appendChild(webrtc2_msg1);
  }
}
/**
 * @description Print error to win dump of webrtc2_hostId.
 * @param {string} id Webrtc2_hostId.
 * @param {object} desc Error.
 */
function webrtc2_log_err(id, desc) {
  let curr_time    = new Date();
  let fld_dump     = document.getElementById("fld_dump");
  let webrtc2_msg1 = document.createElement("label");

  webrtc2_msg1.className = "err";
  webrtc2_msg1.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) +"]</span>" + id + desc;
  fld_dump.appendChild(webrtc2_msg1);
}
/**
 * @description Print RTCPeerConnection.getConfiguration of webrtc2_hostId or webrtc2_guestId.
 * @param {string} id   Name of webrtc2_hostId or webrtc2_guestId.
 * @param {string} desc Description.
 */
function webrtc2_log_config(id, desc) {
  let config = webrtc2_pc.getConfiguration();

  let curr_time      = new Date();
  let fld_dump       = document.getElementById("fld_dump");
  let webrtc2_span   = document.createElement("label");
  let webrtc2_chk1   = document.createElement("input");
  let webrtc2_msg1   = document.createElement("label");
  let row            = document.createElement("tr");
  let webrtc2_cnf    = document.createElement("table");
  let webrtc2_сhilds = document.createElement("div");

  webrtc2_сhilds.className = "childs_msg";

  webrtc2_cnf.id = "cnf";

  webrtc2_num_hide++;

  webrtc2_chk1.type      = "checkbox";
  webrtc2_chk1.id        = "hide" + webrtc2_num_hide;
  webrtc2_chk1.className = "hide";
  webrtc2_chk1.style     = "position: absolute;visibility: hidden;";

  webrtc2_span.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) +"]</span> ";

  webrtc2_msg1.innerHTML = id + desc;
  webrtc2_msg1.htmlFor   = "hide" + webrtc2_num_hide;
  webrtc2_msg1.style     = "height: 20px;";

  webrtc2_сhilds.appendChild(webrtc2_span);
  webrtc2_сhilds.appendChild(webrtc2_chk1);
  webrtc2_сhilds.appendChild(webrtc2_msg1);

  webrtc2_appendCell(row, "№", "th");
  webrtc2_appendCell(row, "Configuration of the RTCPeerConnection", "th");
  row.cells[0].setAttribute("style", "background-color: #272727 !important;border: none !important;padding:0 !important;");
  row.cells[1].setAttribute("style", "background-color: #272727 !important;border: none !important;padding:1px 0 1px 5px !important;text-align: center !important;");
  webrtc2_cnf.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, 1, "td");
  webrtc2_appendCell(row, "iceServers:", "td");

  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:0 !important;word-break: normal !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:1px 0 1px 5px !important;");
  webrtc2_cnf.appendChild(row);

  // Get iceServers.
  let srvs  = config.iceServers;
  let i_add = 2;
  for (let i = 0; i < srvs.length; i++) {
    row = document.createElement("tr");
    webrtc2_appendCell(row, i_add, "td");
    webrtc2_appendCell(row, srvs[i].urls, "td");

    row.cells[0].setAttribute("style", "background-color: #363636 !important;border: none !important; padding:0 !important;word-break: normal !important;");
    row.cells[1].setAttribute("style", "background-color: #363636 !important;border: none !important; padding:1px 0 1px 5px !important;");
    webrtc2_cnf.appendChild(row);
    i_add++;
  }
  // bundlePolicy: "balanced"
  row = document.createElement("tr");
  webrtc2_appendCell(row, i_add, "td");
  webrtc2_appendCell(row, "bundlePolicy: " + config.bundlePolicy, "td");
  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:0 !important;word-break: normal !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:1px 0 1px 5px !important;");
  webrtc2_cnf.appendChild(row);
  webrtc2_cnf.appendChild(row);
  webrtc2_сhilds.appendChild(webrtc2_cnf);
  // encodedInsertableStreams: 0
  row = document.createElement("tr");
  webrtc2_appendCell(row, i_add+1, "td");
  webrtc2_appendCell(row, "encodedInsertableStreams: " + config.encodedInsertableStreams, "td");
  row.cells[0].setAttribute("style", "background-color: #363636 !important;border: none !important; padding:0 !important;word-break: normal !important;");
  row.cells[1].setAttribute("style", "background-color: #363636 !important;border: none !important; padding:1px 0 1px 5px !important;");
  webrtc2_cnf.appendChild(row);
  webrtc2_cnf.appendChild(row);
  webrtc2_сhilds.appendChild(webrtc2_cnf);
  // iceCandidatePoolSize: 0
  row = document.createElement("tr");
  webrtc2_appendCell(row, i_add+2, "td");
  webrtc2_appendCell(row, "iceCandidatePoolSize: " + config.iceCandidatePoolSize, "td");
  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:0 !important;word-break: normal !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:1px 0 1px 5px !important;");
  webrtc2_cnf.appendChild(row);
  webrtc2_cnf.appendChild(row);
  webrtc2_сhilds.appendChild(webrtc2_cnf);
  // iceTransportPolicy: "all"
  row = document.createElement("tr");
  webrtc2_appendCell(row, i_add+3, "td");
  webrtc2_appendCell(row, "iceTransportPolicy: " + config.iceTransportPolicy, "td");
  row.cells[0].setAttribute("style", "background-color: #363636 !important;border: none !important; padding:0 !important;word-break: normal !important;");
  row.cells[1].setAttribute("style", "background-color: #363636 !important;border: none !important; padding:1px 0 1px 5px !important;");
  webrtc2_cnf.appendChild(row);
  webrtc2_cnf.appendChild(row);
  webrtc2_сhilds.appendChild(webrtc2_cnf);
  // rtcpMuxPolicy: "require"
  row = document.createElement("tr");
  webrtc2_appendCell(row, i_add+4, "td");
  webrtc2_appendCell(row, "rtcpMuxPolicy: " + config.rtcpMuxPolicy, "td");
  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:0 !important;word-break: normal !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:1px 0 1px 5px !important;");
  webrtc2_cnf.appendChild(row);
  webrtc2_cnf.appendChild(row);
  webrtc2_сhilds.appendChild(webrtc2_cnf);

  fld_dump.appendChild(webrtc2_сhilds);
}
/**
 * @description Print SDP (offer, answer) to win dump of webrtc2_hostId or webrtc2_guestId.
 * @param {string} id   Name of webrtc2_hostId or webrtc2_guestId.
 * @param {string} desc Description.
 * @param {string} sdp  Offer or Answer.
 */
function webrtc2_log_sdp(id, desc, sdp) {
  let curr_time      = new Date();
  let fld_dump       = document.getElementById("fld_dump");
  let webrtc2_span   = document.createElement("label");
  let webrtc2_chk1   = document.createElement("input");
  let webrtc2_msg1   = document.createElement("label");
  let row            = document.createElement("tr");
  let webrtc2_sdp    = document.createElement("table");
  let webrtc2_сhilds = document.createElement("div");

  webrtc2_сhilds.className = "childs_msg";

  webrtc2_sdp.id = "sdp";

  webrtc2_num_hide++;

  webrtc2_chk1.type      = "checkbox";
  webrtc2_chk1.id        = "hide" + webrtc2_num_hide;
  webrtc2_chk1.className = "hide";
  webrtc2_chk1.style     = "position: absolute;visibility: hidden;";

  webrtc2_span.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) +"]</span> ";

  webrtc2_msg1.innerHTML = id + desc;
  webrtc2_msg1.htmlFor   = "hide" + webrtc2_num_hide;
  webrtc2_msg1.style     = "height: 20px;";

  webrtc2_сhilds.appendChild(webrtc2_span);
  webrtc2_сhilds.appendChild(webrtc2_chk1);
  webrtc2_сhilds.appendChild(webrtc2_msg1);

  webrtc2_appendCell(row, "№", "th");
  webrtc2_appendCell(row, "Session Description Protocol (SDP)", "th");
  row.cells[0].setAttribute("style", "background-color: #272727 !important;border: none !important;padding:0 !important;");
  row.cells[1].setAttribute("style", "background-color: #272727 !important;border: none !important;padding:1px 0 1px 5px !important;text-align: center !important;");
  webrtc2_sdp.appendChild(row);

  let sdp_in = JSON.stringify(sdp).replace( /\\r\\n/g, "<br>" );
  sdp_in = sdp_in.replace( /"/g, "");
  sdp_in = sdp_in.split('<br>');
  for (let i = 0; i < sdp_in.length; i++) {
    if ("" !== sdp_in[i]) {
      row = document.createElement("tr");
      webrtc2_appendCell(row, i, "td");
      webrtc2_appendCell(row, sdp_in[i], "td");
      if (i % 2 == 0) {
        row.cells[0].setAttribute("style", "background-color: #363636 !important;border: none !important; padding:0 !important;word-break: normal !important;");
        row.cells[1].setAttribute("style", "background-color: #363636 !important;border: none !important; padding:1px 0 1px 5px !important;");
        webrtc2_sdp.appendChild(row);
      } else {
        row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:0 !important;word-break: normal !important;");
        row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;border: none !important; padding:1px 0 1px 5px !important;");
        webrtc2_sdp.appendChild(row);
      }
    }
  }

  webrtc2_сhilds.appendChild(webrtc2_sdp);

  fld_dump.appendChild(webrtc2_сhilds);
}
/**
 * @description Print list of ice-candidates of webrtc2_hostId.
 * @param {string} type_ice      Type ICE: ice_local or ice_remote.
 * @param {array}  iceCandidates Array of ice-candidates.
 */
function webrtc2_log_ice(type_ice, iceCandidates) {
  let curr_time      = new Date();
  let fld_dump       = document.getElementById("fld_dump");
  let webrtc2_span   = document.createElement("label");
  let webrtc2_chk2   = document.createElement("input");
  let webrtc2_msg2   = document.createElement("label");
  let row            = document.createElement("tr");
  let webrtc2_ice    = document.createElement("table");
  let webrtc2_сhilds = document.createElement("div");

  webrtc2_сhilds.className = "childs_msg";

  if ("ice_local" == type_ice) {
    webrtc2_ice.id         = "ice_local";
    webrtc2_msg2.innerHTML = webrtc2_hostId + " -> [ICE candidates]:";
  }
  if ("ice_remote" == type_ice) {
    webrtc2_ice.id         = "ice_remote";
    webrtc2_msg2.innerHTML = webrtc2_hostId + " -> Receive [ICE candidates] from " +
    sessionStorage.getItem("webrtc2_guestId") + ":";
  }

  webrtc2_check_ice_candidates(iceCandidates, webrtc2_msg2);

  webrtc2_num_hide++;

  webrtc2_chk2.type      = "checkbox";
  webrtc2_chk2.id        = "hide" + webrtc2_num_hide;
  webrtc2_chk2.className = "hide";
  webrtc2_chk2.style     = "position: absolute;visibility: hidden;";

  webrtc2_span.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]</span> ";

  webrtc2_msg2.htmlFor   = "hide" + webrtc2_num_hide;
  webrtc2_msg2.style     = "height: 20px;";

  webrtc2_сhilds.appendChild(webrtc2_span);
  webrtc2_сhilds.appendChild(webrtc2_chk2);
  webrtc2_сhilds.appendChild(webrtc2_msg2);

  webrtc2_appendCell(row, "ID", "th");
  webrtc2_appendCell(row, "Comp", "th");
  webrtc2_appendCell(row, "Type", "th");
  webrtc2_appendCell(row, "Foundation", "th");
  webrtc2_appendCell(row, "Protocol", "th");
  webrtc2_appendCell(row, "Address", "th");
  webrtc2_appendCell(row, "Port", "th");
  webrtc2_appendCell(row, "Priority", "th");

  row.cells[0].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[3].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[4].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[5].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[6].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[7].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");

  webrtc2_ice.appendChild(row);
  webrtc2_сhilds.appendChild(webrtc2_ice);

  fld_dump.appendChild(webrtc2_сhilds);
}
/**
 * @description Auxiliary function for webrtc2_log_ice().
 * @param {string} row  tow of table.
 * @param {string} name name of cell.
 * @param {string} type th or td.
 */
function webrtc2_appendCell(row, name, type) {
  let cell_table = null;
  let cell_radio = null;

  switch(type) {
    case "th":
    case "td":
      cell_table = document.createElement(type);
      cell_table.textContent = name;
      break;
  }
  row.appendChild(cell_table);
}
/**
 * @description Get log connectionStats of ice candidates for pair succeeded.
 */
async function webrtc2_log_connectionStats() {
  let stats      = await webrtc2_pc.getStats(null);
  let candidates = await webrtc2_getCandidateIds(stats);
  if (candidates !== {}) {
    let localCadidate  = await webrtc2_getCandidateInfo(stats, candidates.localId);
    let remoteCadidate = await webrtc2_getCandidateInfo(stats, candidates.remoteId);
    if (localCadidate !== null && remoteCadidate !== null) {
      stats = [
        {
        "id":localCadidate.id.replace("RTCIceCandidate_",""),
        "type":localCadidate.type,
        "candidateType":localCadidate.candidateType,
        "networkType":localCadidate.networkType,
        "protocol":localCadidate.protocol,
        "address": (localCadidate.address) ? localCadidate.address : localCadidate.ip,
        "port":localCadidate.port
        },
        {
        "id":remoteCadidate.id.replace("RTCIceCandidate_",""),
        "type":remoteCadidate.type,
        "candidateType":remoteCadidate.candidateType,
        "networkType":remoteCadidate.networkType,
        "protocol":remoteCadidate.protocol,
        "address": (remoteCadidate.address) ? remoteCadidate.address : remoteCadidate.ip,
        "port":remoteCadidate.port
        }
      ];
      let curr_time         = new Date();
      let fld_dump          = document.getElementById("fld_dump");
      let webrtc2_span      = document.createElement("label");
      let webrtc2_chk3      = document.createElement("input");
      let webrtc2_msg3      = document.createElement("label");
      let row               = document.createElement("tr");
      let webrtc2_con_stats = document.createElement("table");
      let webrtc2_сhilds    = document.createElement("div");

      webrtc2_сhilds.className = "childs_msg";

      webrtc2_con_stats.id  = "con_stats";

      webrtc2_num_hide++;

      webrtc2_chk3.type      = "checkbox";
      webrtc2_chk3.id        = "hide" + webrtc2_num_hide;
      webrtc2_chk3.className = "hide";
      webrtc2_chk3.style     = "position: absolute;visibility: hidden;";

      webrtc2_span.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) +"]</span> ";

      webrtc2_msg3.innerHTML = webrtc2_hostId + " -> ICE candidates pair succeeded:";
      webrtc2_msg3.htmlFor   = "hide" + webrtc2_num_hide;
      webrtc2_msg3.style     = "height: 20px;";

      webrtc2_сhilds.appendChild(webrtc2_span);
      webrtc2_сhilds.appendChild(webrtc2_chk3);
      webrtc2_сhilds.appendChild(webrtc2_msg3);

      webrtc2_appendCell(row, "ID", "th");
      webrtc2_appendCell(row, "Type", "th");
      webrtc2_appendCell(row, "Candidate Type", "th");
      webrtc2_appendCell(row, "Network Type", "th");
      webrtc2_appendCell(row, "Protocol", "th");
      webrtc2_appendCell(row, "IP Address", "th");
      webrtc2_appendCell(row, "Port", "th");

      row.cells[0].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[1].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[2].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[3].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[4].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[5].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[6].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");

      webrtc2_con_stats.appendChild(row);

      row = document.createElement("tr");

      webrtc2_appendCell(row, stats[0].id, "td");
      webrtc2_appendCell(row, stats[0].type, "td");
      webrtc2_appendCell(row, stats[0].candidateType, "td");
      webrtc2_appendCell(row, stats[0].networkType, "td");
      webrtc2_appendCell(row, stats[0].protocol, "td");
      webrtc2_appendCell(row, stats[0].address, "td");
      webrtc2_appendCell(row, stats[0].port, "td");

      row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[2].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[3].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[4].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[5].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[6].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");

      webrtc2_con_stats.appendChild(row);

      row = document.createElement("tr");

      webrtc2_appendCell(row, stats[1].id, "td");
      webrtc2_appendCell(row, stats[1].type, "td");
      webrtc2_appendCell(row, stats[1].candidateType, "td");
      webrtc2_appendCell(row, stats[1].networkType, "td");
      webrtc2_appendCell(row, stats[1].protocol, "td");
      webrtc2_appendCell(row, stats[1].address, "td");
      webrtc2_appendCell(row, stats[1].port, "td");

      row.cells[0].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[1].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[2].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[3].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[4].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[5].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
      row.cells[6].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");

      webrtc2_con_stats.appendChild(row);

      webrtc2_сhilds.appendChild(webrtc2_con_stats);

      fld_dump.appendChild(webrtc2_сhilds);
    }
  }
}
/**
 * @description Get CandidateIds for pair succeeded.
 * @param {string} stats Stats of ice candidates.
 */
function webrtc2_getCandidateIds(stats) {
  let ids = {};
  stats.forEach(report => {
    if (report.type == "candidate-pair" && report.nominated && report.state == "succeeded") {
      ids = {
        localId: report.localCandidateId,
        remoteId: report.remoteCandidateId
      }
    }
  });
  return ids;
}
/**
 * @description Get Candidate info for pair succeeded.
 * @param {string} stats        Stats of ice candidates.
 * @param {string} candidateId  Id of ice candidates.
 */
function webrtc2_getCandidateInfo(stats, candidateId) {
  let info = null;
  stats.forEach(report => {
    if (report.id == candidateId) {
      info = report;
    }
  });
  return info;
}
/**
 * @description Print a list of data channel properties of webrtc2_hostId.
 * @param {string} dataChannel  Data channel.
 */
function webrtc2_log_dataChannel(dataChannel) {
  let curr_time           = new Date();
  let fld_dump            = document.getElementById("fld_dump");
  let webrtc2_span        = document.createElement("label");
  let webrtc2_chk4        = document.createElement("input");
  let webrtc2_msg4        = document.createElement("label");
  let row                 = document.createElement("tr");
  let webrtc2_dataChannel = document.createElement("table");
  let webrtc2_сhilds      = document.createElement("div");

  webrtc2_сhilds.className = "childs_channel";

  webrtc2_dataChannel.id = dataChannel.label;
  webrtc2_msg4.innerHTML = webrtc2_hostId + " -> " + dataChannel.label + " " + dataChannel.readyState;

  webrtc2_num_hide++;

  webrtc2_chk4.type      = "checkbox";
  webrtc2_chk4.id        = "hide" + webrtc2_num_hide;
  webrtc2_chk4.className = "hide";
  webrtc2_chk4.style     = "position: absolute;visibility: hidden;";

  webrtc2_span.innerHTML = "<span>[" + curr_time.toLocaleTimeString([], { hour12: false}) + "]</span> ";

  webrtc2_msg4.htmlFor   = "hide" + webrtc2_num_hide;
  webrtc2_msg4.style     = "height: 20px;";

  webrtc2_сhilds.appendChild(webrtc2_span);
  webrtc2_сhilds.appendChild(webrtc2_chk4);
  webrtc2_сhilds.appendChild(webrtc2_msg4);

  webrtc2_appendCell(row, "ID", "th");
  webrtc2_appendCell(row, "Property", "th");
  webrtc2_appendCell(row, "Value", "th");

  row.cells[0].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #272727 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  
  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "1", "td");
  webrtc2_appendCell(row, "ordered", "td");
  webrtc2_appendCell(row, dataChannel.ordered, "td");

  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  
  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "2", "td");
  webrtc2_appendCell(row, "protocol", "td");
  webrtc2_appendCell(row, dataChannel.protocol, "td");

  row.cells[0].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");

  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "3", "td");
  webrtc2_appendCell(row, "bufferedAmount", "td");
  webrtc2_appendCell(row, dataChannel.bufferedAmount, "td");

  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");

  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "4", "td");
  webrtc2_appendCell(row, "bufferedAmountLowThreshold", "td");
  webrtc2_appendCell(row, dataChannel.bufferedAmountLowThreshold, "td");

  row.cells[0].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");

  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "5", "td");
  webrtc2_appendCell(row, "binaryType", "td");
  webrtc2_appendCell(row, dataChannel.binaryType, "td");

  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");

  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "6", "td");
  webrtc2_appendCell(row, "maxPacketLifeType", "td");
  webrtc2_appendCell(row, dataChannel.maxPacketLifeType, "td");

  row.cells[0].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");

  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "7", "td");
  webrtc2_appendCell(row, "maxRetransmits", "td");
  webrtc2_appendCell(row, dataChannel.maxRetransmits, "td");

  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");

  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "8", "td");
  webrtc2_appendCell(row, "negotiated", "td");
  webrtc2_appendCell(row, dataChannel.negotiated, "td");

  row.cells[0].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #363636 !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  
  webrtc2_dataChannel.appendChild(row);

  row = document.createElement("tr");
  webrtc2_appendCell(row, "9", "td");
  webrtc2_appendCell(row, "reliable", "td");
  webrtc2_appendCell(row, dataChannel.reliable, "td");

  row.cells[0].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[1].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");
  row.cells[2].setAttribute("style", "background-color: #4A4A4A !important;padding:0 !important;margin:0 !important;text-align: left !important;");

  webrtc2_dataChannel.appendChild(row);

  webrtc2_сhilds.appendChild(webrtc2_dataChannel);

  fld_dump.appendChild(webrtc2_сhilds);
}
