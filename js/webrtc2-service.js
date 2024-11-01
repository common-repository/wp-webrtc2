/**
 * @description Other service functions for web-rtc.
 * @category webrtc2-service.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

/**
 * @description Determines whether the video-chat participant is the initiator or not.
 * @param {array} webrtc2_users_guests List of envited users.
 * @return {boolean} Initiator or not.
 */
function webrtc2_is_initiator(webrtc2_users_guests) {
  let fld = "";
  for ( let webrtc2_user_guest of webrtc2_users_guests ) {
    if (webrtc2_user_guest[0] == webrtc2_hostId) {
      fld = webrtc2_user_guest[1];
    }
    if ( fld !== "" && fld == webrtc2_user_guest[0] &&  webrtc2_user_guest[1] == webrtc2_hostId ) {
      return true;
    }
  }
  return false;
}
/**
 * @description Init events of data channel for receive/send statistics data of webrtc2_guestId.
 */
function webrtc2_datachannel_stat() {
  try{
    webrtc2_statChannel.onopen = event => {
      webrtc2_log_dataChannel(webrtc2_statChannel);

  		webrtc2_vu_bitrate.name = "vu_bitrate";
  		webrtc2_statChannel.send(JSON.stringify(webrtc2_vu_bitrate));
    }
    webrtc2_statChannel.onclose = event => {
      webrtc2_dump_msg(webrtc2_hostId, " -> statChannel close");
    }
    webrtc2_statChannel.onmessage = event => {
      let stat_remote = JSON.parse(event.data);

      if ("inbound_rtp_video" == stat_remote.name) {
        webrtc2_inbound_rtp_video_remote = stat_remote;
      }
      if ("outbound_rtp_video" == stat_remote.name) {
        webrtc2_outbound_rtp_video_remote = stat_remote;
      }
      if ("transport" == stat_remote.name) {
        webrtc2_transport_remote = stat_remote;
      }
      if ("channel" == stat_remote.name) {
        webrtc2_channel_remote = stat_remote;
      }
      if ("ticker" == stat_remote.name) {
        document.getElementById("wins2_ticker").innerHTML = stat_remote.text;
      }
      if ("vu_audio" == stat_remote.name) {
        let canvasContext = document.getElementById("wins2_vu_audio");
        canvasContext = canvasContext.getContext("2d", { willReadFrequently: true });

        let gradient = canvasContext.createLinearGradient(0, 0, 10, 50);

        // Add three color stops
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(.3, 'yellow');
        gradient.addColorStop(1, 'green');

        let average = stat_remote.text;
        canvasContext.clearRect(0, 0, 10, 50);
        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(0,50-average,10,50);
      }
      if ("vu_bitrate" == stat_remote.name) {
        webrtc2_bitrate_level_remote(stat_remote.text);
      }
      if ("webcam_screen" == stat_remote.name) {
        if ("screen" == stat_remote.text) {
          document.getElementById("win2_video").id = "win2_video_screen";
        }
        if ("webcam" == stat_remote.text) {
          document.getElementById("win2_video_screen").id = "win2_video";
        }
      }
    }
  }catch(err) {
    webrtc2_log_err(err.name + ": ",  err.message);
  }
}
/**
 * @description Init events of data channel for receive/send of messages and files.
 */
function webrtc2_datachannel_data() {
  let for_fld_file_attach = document.getElementById("for_fld_file_attach");
  let fld_file_attach     = document.getElementById("fld_file_attach");
  let progress_file       = document.getElementById("progress_file");
  let caption             = document.getElementById("progress_caption");

  let receiveBuffer = [];
  let receivedSize  = 0;
  let fullSize      = 0;
  let filename;

  let snd = new Audio();

  try{
    webrtc2_dataChannel.onopen = event => {
      webrtc2_log_dataChannel(webrtc2_dataChannel);
      // Progress of connection.
      document.getElementById("progress_connection").style.display = "none";
    }
    webrtc2_dataChannel.onclose = event => {
      webrtc2_dump_msg(webrtc2_hostId, " -> dataChannel close");

      document.getElementById("btn_send_file").style.color = "white";
      document.getElementById("btn_send_file").disabled    = true;
    }

    webrtc2_dataChannel.onmessage = async (event) => {
      let event_data = event.data;
      if (event_data instanceof Blob) {
        console.log("Got Blob!");
        event_data = await event.data.arrayBuffer();
      }
      if (event_data instanceof ArrayBuffer) {
        if (0 == fullSize) {
          document.getElementById("btn_send_file").disabled = false;
          caption.setAttribute("style", "z-index:2;visibility:hidden;");
          for_fld_file_attach.style.visibility = "visible";
          fld_file_attach.style.visibility = "visible";
          progress_file.style.visibility   = "hidden";
          return;
        }
        for_fld_file_attach.style.visibility = "hidden";

        // continue...
        receiveBuffer.push(event_data);
        receivedSize += event_data.byteLength;

        progress_file.value = receivedSize;

        let count = (receivedSize / fullSize) * 100;
        caption.innerHTML = "received " + Math.round(count) + "%";

        if (receivedSize == fullSize) {
          document.getElementById("slogan").innerHTML = "connection established";
          document.getElementById("btn_send_file").disabled = false;
          caption.setAttribute("style", "z-index:2;visibility:hidden;");
          for_fld_file_attach.style.visibility = "visible";
          fld_file_attach.style.visibility = "visible";
          progress_file.style.visibility   = "hidden";

          let received = new Blob(receiveBuffer);
          receiveBuffer = [];
          receivedSize  = 0;
          let upload = `<a href="${URL.createObjectURL(received)}" download="${filename}">${filename} (${fullSize} bytes)</a>`;
          webrtc2_msg_chat_switch();
          webrtc2_chat_msg(sessionStorage.getItem("webrtc2_guestId"), ': send file-> ' + upload);
          snd.src = webrtc2_url + 'sound/receive_file.mp3';
          snd.play();
        }
      } else {
        let data_remote = JSON.parse(event.data);

        if ("cmd" == data_remote.name) {
          if ("stop_chat" == data_remote.text) {
            webrtc2_dataChannel.close();
            webrtc2_statChannel.close();
            webrtc2_ctxChannel.close();

            webrtc2_stop();
          }
          if ("cancel_send_file" == data_remote.text) {
            let webrtc2_guestId = sessionStorage.getItem("webrtc2_guestId");
            document.getElementById("slogan").innerHTML = webrtc2_guestId + " cancel send file";
            document.getElementById("btn_send_file").disabled    = false;

            caption.setAttribute("style", "z-index:2;visibility:hidden;");
            fld_file_attach.style.visibility = "visible";
            fld_file_attach.value = "";
            progress_file.style.visibility   = "hidden";
            for_fld_file_attach.innerHTML    = "Choose a file";
            for_fld_file_attach.appendChild(webrtc2_file_select);
            for_fld_file_attach.style.visibility = "visible";

            fullSize      = 0;
            receivedSize  = 0;
            receiveBuffer = [];
          }
        }
        if ("dialogue_recording" == data_remote.name) {
          if ("start" == data_remote.text) {
            document.getElementById("slogan").innerHTML = "video recording start";
          }
          if ("stop" == data_remote.text) {
            document.getElementById("slogan").innerHTML = "video recording stop";
          }
        }
        if ("msg" == data_remote.name) {
          webrtc2_msg_chat_switch();
          webrtc2_chat_msg(sessionStorage.getItem("webrtc2_guestId"), ": " + data_remote.text);
          snd.src = webrtc2_url + "sound/receive_msg.mp3";
          snd.play();
        }
        if ("file_attr" == data_remote.name) {
          document.getElementById("slogan").innerHTML = "receiving file...";
          document.getElementById("btn_send_file").disabled = true;
          caption.setAttribute("style", "z-index:3;visibility:visible;");
          fld_file_attach.style.visibility = "hidden";
          progress_file.style.visibility   = "visible";

          filename = data_remote.filename;
          fullSize = data_remote.fullSize;
          progress_file.max = fullSize;
        }
      }
    }
  }catch(err) {
    webrtc2_log_err(err.name + ": ",  err.message);
  }
}
/**
 * @description Init events of data channel for interactive drawing board.
 */
function webrtc2_datachannel_ctx() {
  let bigimageData = "";

  try{
    webrtc2_ctxChannel.onopen = event => {
      webrtc2_log_dataChannel(webrtc2_ctxChannel);
      if ("yes" === webrtc2_board_local_active) {
        // Send of board status.
        webrtc2_ctxChannel.send(JSON.stringify({"name" : "board_active", "text" : "yes"}));
      }
    }
    webrtc2_ctxChannel.onclose = event => {
      webrtc2_dump_msg(webrtc2_hostId, " -> ctxChannel close");
    }
    webrtc2_ctxChannel.onmessage = event => {
      let ctx_remote = JSON.parse(event.data);

      if ("board_active" == ctx_remote.name) {
        webrtc2_board_remote_active = ctx_remote.text;
        if ("yes" == webrtc2_board_remote_active && "no" == webrtc2_board_local_active) {
          webrtc2_board_share();
        }
      }
      if ("imageData" == ctx_remote.name) {
        webrtc2_boardCtx.beginPath();
        webrtc2_boardCtx.closePath();

        webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);

        let img = new Image();
        img.width  = webrtc2_boardCanvas.width;
        img.height = webrtc2_boardCanvas.height;
        img.onload = function() {
          webrtc2_boardCtx.drawImage(this,
            0, 0, this.width, this.height,
            0, 0, webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
        }
        img.src = ctx_remote.value;
      }
      if ("bigimageData" == ctx_remote.name) {
        if ("end_imageData" !== ctx_remote.value) {
          bigimageData = bigimageData + ctx_remote.value;
        } else {
          webrtc2_boardCtx.beginPath();
          webrtc2_boardCtx.closePath();

          webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);

          let img = new Image();
          img.width  = webrtc2_boardCanvas.width;
          img.height = webrtc2_boardCanvas.height;
          img.onload = function() {
            webrtc2_boardCtx.drawImage(this,
              0, 0, this.width, this.height,
              0, 0, webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
          }
          img.src = bigimageData;
          bigimageData = "";
        }
      }
    }
  }catch(err) {
    webrtc2_log_err(err.name + ": ",  err.message);
  }
}
/**
 * @description Cancel send file to webrtc2_guestId.
 */
function webrtc2_file_cancel_send() {
  let fld_file_attach = document.getElementById("fld_file_attach");
  let progress_file   = document.getElementById("progress_file");
  let caption         = document.getElementById("progress_caption");

  // Change button "cancel_sendsend_file" to "send_file".
  document.getElementById("btn_cancel_send_file").id = "btn_send_file";
  document.getElementById("btn_send_file").setAttribute("onclick", "webrtc2_file_send()");
  document.getElementById("btn_send_file").textContent = "Send";
  document.getElementById("btn_send_file").style.color = "white";

  caption.setAttribute("style", "z-index:2;visibility:hidden;");
  fld_file_attach.style.visibility = "visible";
  progress_file.style.visibility   = "hidden";

  fld_file_attach.value =  null;

  // Send cmd - cancel.
  webrtc2_dataChannel.send(JSON.stringify({"name" : "cmd", "text" : "cancel_send_file"}));

}
/**
 * @description Send file to webrtc2_guestId.
 */
function webrtc2_file_send() {
  let fld_file_attach     = document.getElementById("fld_file_attach");
  let progress_file       = document.getElementById("progress_file");
  let caption             = document.getElementById("progress_caption");
  let for_fld_file_attach = document.getElementById("for_fld_file_attach");

  if (fld_file_attach.files[0]) {
    let filename   = fld_file_attach.files[0].name;
    let fullSize   = fld_file_attach.files[0].size;
    let file       = fld_file_attach.files[0];
    let chunkSize  = 16384;
    let offset     = 0;

    for_fld_file_attach.style.visibility = "hidden";

    // Change button "send_file" to "cancel_send".
    document.getElementById("slogan").innerHTML = "file transfer...";
    document.getElementById("btn_send_file").id = "btn_cancel_send_file";
    document.getElementById("btn_cancel_send_file").setAttribute("onclick", "webrtc2_file_cancel_send()");
    document.getElementById("btn_cancel_send_file").style.color = "red";
    document.getElementById("btn_cancel_send_file").textContent = "Cancel";

    webrtc2_msg_chat_switch();

    webrtc2_chat_msg(webrtc2_hostId, `: send file--> ${filename} (${fullSize} bytes) to ${sessionStorage.getItem("webrtc2_guestId")}`);
    webrtc2_dataChannel.send(JSON.stringify({"name" : "file_attr", "filename" : filename, "fullSize": fullSize}));

    progress_file.max = fullSize;

    file.arrayBuffer().then((buffer) => {
      const send = () => {
        caption.setAttribute("style", "z-index:3;visibility:visible;");
        fld_file_attach.style.visibility = "hidden";
        progress_file.style.visibility   = "visible";
        while(buffer.byteLength) {

          // If pressed button btn_cancel_send_file.
          if (!fld_file_attach.files[0]) {
            document.getElementById("slogan").innerHTML = "connection established";
            progress_file.style.visibility   = "hidden";
            caption.setAttribute("style", "z-index:2;visibility:hidden;");
            fld_file_attach.style.visibility = "visible";
            fld_file_attach.value = "";
            for_fld_file_attach.innerHTML = "Choose a file";
            for_fld_file_attach.appendChild(webrtc2_file_select);
            for_fld_file_attach.style.visibility = "visible";

            return;
          }
          
          if (webrtc2_dataChannel.bufferedAmount > webrtc2_dataChannel.bufferedAmountLowThreshold) {
            webrtc2_dataChannel.onbufferedamountlow = () => {
              webrtc2_dataChannel.onbufferedamountlow = null;
              send();
            };
            return;
          }
          let chunk = buffer.slice(0, chunkSize);
          buffer    = buffer.slice(chunkSize, buffer.byteLength);

          webrtc2_dataChannel.send(chunk);

          offset += chunkSize;
          progress_file.value = offset;

          let count = (offset / fullSize) * 100;

          if (offset < fullSize) {
            caption.innerHTML = "sended " + Math.round(count) + "%";
          } else {
            setTimeout(() => {
              caption.setAttribute("style", "z-index:2;visibility:hidden;");
              fld_file_attach.style.visibility = "visible";
              fld_file_attach.value = "";
              progress_file.style.visibility   = "hidden";

              for_fld_file_attach.innerHTML = "Choose a file";
              for_fld_file_attach.appendChild(webrtc2_file_select);
              for_fld_file_attach.style.visibility = "visible";

              // Change button "cancel_sendsend_file" to "send_file".
              document.getElementById("slogan").innerHTML = "connection established";
              document.getElementById("btn_cancel_send_file").id = "btn_send_file";
              document.getElementById("btn_send_file").setAttribute("onclick", "webrtc2_file_send()");
              document.getElementById("btn_send_file").textContent = "Send";
              document.getElementById("btn_send_file").style.color = "white";

            }, 3000);
          }
        }
      };
      send();
    });
  }
}
/**
 * @description Send message to data channel for autoresponder.
 */
function webrtc2_msg_send() {
  let tableMembersRows = document.getElementById("wins1_tbody2").getElementsByTagName("tr");
  let msg              = document.getElementById("fld_send_msg");

  if ( 256 < msg.value.length) {
    msg.value = msg.value.substr(0, 256);
  }
  webrtc2_msg_chat_switch();

  if (webrtc2_dataChannel && "open" == webrtc2_dataChannel.readyState) {
    webrtc2_chat_msg(webrtc2_hostId, ': ' + msg.value);
    // Send to dataChannel.
    webrtc2_dataChannel.send(JSON.stringify({"name" : "msg", "text" : msg.value}));
  } else if (sessionStorage.getItem("webrtc2_guestId")) {
    webrtc2_msg_chat_switch();
    webrtc2_chat_msg(webrtc2_hostId,'->autoresponder[' + sessionStorage.getItem("webrtc2_guestId") + ']: ' + msg.value);
    // Send to autoresponder.
    webrtc2_autoresponder_send(msg.value);
  }
  msg.value = "";
  document.getElementById("btn_send_msg").style.color = "white";
  document.getElementById("btn_send_msg").disabled    = true;
}
/**
 * @description Countdown counter.
 * @param {string} id      ID element <div> of countdown timer.
 * @param {string} endtime End time of video conference.
 */
function webrtc2_initializeClock( id, endtime ) {
  let clock = document.getElementById( id );

  let timeinterval = setInterval(function() {
    let t = webrtc2_getTimeRemaining( endtime );
    clock.innerHTML = t.hours + ":" + t.minutes + ":" + t.seconds;
    if ( t.total <= 60000 && "blinking" !== clock.className ) {
      clock.className = "blinking";
      if ("true" == sessionStorage.getItem("webrtc2_videoStreamAll_chat")) {
        webrtc2_stopRecording();
      }
    }
    if( t.total <= 0 ) {
      // Stop video chat. (reload current page).
      webrtc2_stop();
      clearInterval( timeinterval );
    }
  },1000);
}
/**
 * @description Get the remaining time for the countdown timer.
 * @param {string} endtime ID of window video stream.
 */
function webrtc2_getTimeRemaining( endtime ) {
  let t       = Date.parse( endtime ) - Date.parse( new Date() );
  let seconds = Math.floor( ( t/1000 ) % 60 );
  let minutes = Math.floor( ( t/1000/60 ) % 60 );
  let hours   = Math.floor( ( t/( 1000*60*60 ) ) % 24 );
  return {
    "total": t,
    "hours": hours,
    "minutes": minutes,
    "seconds": seconds
  };
}
/**
 * @description Play video of getUserMedia from canvas.
 * @return {object} Capture Stream.
 */
function webrtc2_canvas() {
  let canvas = Object.assign(document.createElement("canvas"), {width:640, height:480});
  let ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.fillRect(0, 0, 640, 480);
  let p = ctx.getImageData(0, 0, 640, 480);
  requestAnimationFrame(function draw() {
    for (let i = 0; i < p.data.length; i++) {
      p.data[i++] = p.data[i++] = p.data[i++] = Math.random() * 255;
    }
    ctx.putImageData(p, 0, 0);

    requestAnimationFrame(draw);
  });

  return canvas.captureStream(30);
}
/**
 * @description Build last 6 string of fld_chat for videoStreamAll.
 */
function webrtc2_fld_chat_strings() {

  let fld_chat_strings = setInterval(function() {
    let fld_chat   = document.getElementById("fld_chat");
    if (fld_chat.hasChildNodes) {
      let childrens = fld_chat.childNodes;
      let arrchilds = Array.prototype.slice.call(childrens);

      if (arrchilds.length < 7) {
        webrtc2_videoStreamAll_ChatNew = arrchilds;
      }else{
        webrtc2_videoStreamAll_ChatNew = arrchilds.slice(arrchilds.length -6);
      }
    }else{
      webrtc2_videoStreamAll_ChatNew = [];
    }
    if ("false" == sessionStorage.getItem("webrtc2_videoStreamAll_chat")) {
      clearInterval(fld_chat_strings);
    }
  }, 5000);
}
/**
 * @description Recording video of selected member of chat.
 */
function webrtc2_startRecording() {
  let curr_time        = new Date().toLocaleString();
  let video1           = document.getElementById("win1_video");
  let video2           = document.getElementById("win2_video");
  let btn_start_record = document.getElementById("btn_start_record");
  let btn_stop_record  = document.getElementById("btn_stop_record");
  let canvas_record    = document.createElement("canvas");
  let canvas_width     = Math.trunc(document.getElementById("video_chat").offsetWidth);

  // Send a message to the interlocutor that the recording of the conversation start.
  webrtc2_dataChannel.send(JSON.stringify({"name" : "dialogue_recording", "text" : "start"}));

  sessionStorage.setItem("webrtc2_videoStreamAll_chat", true);
  // Prepare 6 last strings from fld_chat.
  webrtc2_fld_chat_strings();

  btn_start_record.style.boxShadow =
  "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  btn_start_record.disabled = true;
  btn_start_record.className = "btn_chat blinking";

  btn_stop_record.style.boxShadow  =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  btn_stop_record.disabled = false;

  canvas_record.id     = "canvas_record";
  canvas_record.width  = canvas_width;
  canvas_record.height = "570";

  let ctx    = canvas_record.getContext("2d", { willReadFrequently: true });
  ctx.width  = canvas_width;
  ctx.height = "570";

  let requestAnimationFrame = setInterval(() => {
    ctx.clearRect(0,0,ctx.width, ctx.height);

    ctx.fillStyle = "#245657";
    ctx.fillRect(0, 15, canvas_record.width, canvas_record.height - 15);

    ctx.font      = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText("recorded: " + curr_time, Math.trunc(canvas_width / 2), 12);

    let draw_height = 0;
    ctx.textAlign = "left";
    ctx.fillStyle = "white";

    if ("no" === webrtc2_board_local_active) {
      // draw name of webrtc2_hostId for video1, webrtc2_guestId for video2.
      let text_win1   = ctx.measureText( webrtc2_hostId );
      let text_win1_X = Math.trunc((canvas_width / 4) - text_win1.width / 2);
      let text_win2   = ctx.measureText( sessionStorage.getItem("webrtc2_guestId") );
      let text_win2_X = Math.trunc((canvas_width / 4) * 3 - text_win2.width / 2);

      ctx.drawImage(video1, 5, 20, Math.trunc(canvas_width / 2)-5, 220);
      ctx.fillText(webrtc2_hostId, text_win1_X, 35);
      ctx.drawImage(video2, Math.trunc(canvas_width / 2)+5, 20, Math.trunc(canvas_width / 2)-10, 220);
      ctx.fillText(sessionStorage.getItem("webrtc2_guestId"), text_win2_X, 35);

      // draw background fld_chat.
      ctx.fillStyle = "#F1F3F4";
      ctx.fillRect(5, 245, canvas_width -10, 104);
      ctx.stroke();

      draw_height = 260;
    }else{
      let img_data = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height+40);
      ctx.putImageData(img_data, 5, 20);

      // draw name of webrtc2_hostId for video1, webrtc2_guestId for video2.
      let text_win1   = ctx.measureText( webrtc2_hostId );
      let text_win1_X = Math.trunc(((canvas_width / 4) * 3) + 20 - text_win1.width / 2);
      let text_win2   = ctx.measureText( sessionStorage.getItem("webrtc2_guestId") );
      let text_win2_X = Math.trunc(((canvas_width / 4) * 3) + 20 - text_win2.width / 2);

      ctx.drawImage(video1, 385, 20, (canvas_width / 2) - 63, 180);
      ctx.fillText(webrtc2_hostId, text_win1_X, 35);
      ctx.drawImage(video2, 385, 205, (canvas_width / 2) - 63, 180);
      ctx.fillText(sessionStorage.getItem("webrtc2_guestId"), text_win2_X, 220);

      // info for img.
      ctx.fillStyle = "#1E1E1E";
      ctx.fillRect(5, 350, webrtc2_boardCanvas.width, 30);

      let ctx_size  = ctx.width * ctx.height * 4;
      ctx.fillStyle = "#F1F3F4";
      let info_ctx  = "img: resolution - 360x325 px; size - " + ctx_size + " bytes";
      ctx.fillText(info_ctx, 20, 370);

      // draw background fld_chat.
      ctx.fillRect(5, 390, canvas_width -10, 104);
      ctx.stroke();

      draw_height = 408;
    }

    for (let i = 1; i < webrtc2_videoStreamAll_ChatNew.length; i++) {
      if ("#text" !== webrtc2_videoStreamAll_ChatNew[i].nodeName) {
        // redraw fld_chat on canvas.
        let pos = webrtc2_videoStreamAll_ChatNew[i].textContent.indexOf("]");
        // Select substr of color blue.
        let sub_str1 = webrtc2_videoStreamAll_ChatNew[i].textContent.slice(0, pos+1);
        // Select substr of color green.
        let sub_str2 = webrtc2_videoStreamAll_ChatNew[i].textContent.slice(pos+1);
        if ("" == sub_str1 && "" !== sub_str2) {
          ctx.fillStyle = "black";
          ctx.fillText(sub_str2, 5, draw_height);
        }else{
          ctx.fillStyle = "brown";
          ctx.fillText(sub_str1, 5, draw_height);
          ctx.fillStyle = "black";
          ctx.fillText(sub_str2, 70, draw_height);
        }
        ctx.stroke();
        draw_height = draw_height + 20;
      }
    }
    if ("false" == sessionStorage.getItem("webrtc2_videoStreamAll_chat")) {
      clearInterval(requestAnimationFrame);
    }
  }, 250);

  let videoStreamAll = canvas_record.captureStream();
  // Add audio traks from videoStream1 and videoStream2 to videoStreamAll.
  let videoStream1 = video1.srcObject;
  let videoStream2 = video2.srcObject;

  videoStream1.getAudioTracks().forEach(track => videoStreamAll.addTrack(track, videoStream1));
  videoStream2.getAudioTracks().forEach(track => videoStreamAll.addTrack(track, videoStream2));

  webrtc2_videoStreamAll_BlobsRec = [];

  try {
    webrtc2_videoStreamAll_MediaRec = new MediaRecorder(videoStreamAll);
    webrtc2_videoStreamAll_MediaRec.ondataavailable = event => {
      webrtc2_videoStreamAll_BlobsRec.push(event.data);
    }
    webrtc2_videoStreamAll_MediaRec.start(1000); // collect 1 seconds of data.
  }catch(err) {
    webrtc2_log_err(err.name + ": ",  err.message);
  }
}
/**
 * @description Stop Recording video of selected member of chat.
 */
async function webrtc2_stopRecording() {
  let btn_start_record = document.getElementById("btn_start_record");
  let btn_stop_record  = document.getElementById("btn_stop_record");

  // Send a message to the interlocutor that the recording of the conversation stop.
  webrtc2_dataChannel.send(JSON.stringify({"name" : "dialogue_recording", "text" : "stop"}));

  sessionStorage.setItem("webrtc2_videoStreamAll_chat", false);

  btn_start_record.style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  btn_start_record.disabled = false;
  btn_start_record.className = "btn_chat";

  btn_stop_record.style.boxShadow =
  "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  btn_stop_record.disabled = true;

  if (webrtc2_videoStreamAll_MediaRec) {
    webrtc2_videoStreamAll_MediaRec.stop();
    await new Promise(r => webrtc2_videoStreamAll_MediaRec.onstop = r);
  }else{
    return;
  }
  let blob = new Blob(webrtc2_videoStreamAll_BlobsRec, { type: "video/webm" });
  let url  = window.URL.createObjectURL(blob);
  let a    = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "WP-WebRTC2.webm";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}
/**
 * @description Visible win1_menu_item1, win1_menu_item2 into win1.
 */
function webrtc2_win1_menu_items_visible() {
  document.getElementById("win1_menu_item1").style.visibility = "visible";
  document.getElementById("win1_menu_item2").style.visibility = "visible";
}
/**
 * @description Hide win1_menu_item1, win1_menu_item2 into win1.
 */
function webrtc2_win1_menu_items_hide() {
  document.getElementById("win1_menu_item1").style.visibility = "hidden";
  document.getElementById("win1_menu_item2").style.visibility = "hidden";
}
/**
 * @description Shared board on win1.
 */
function webrtc2_board_share() {
  let part4        = document.getElementById("part4");
  let wins_video   = document.getElementById("wins_video");
  let win1         = document.getElementById("win1");
  let win2         = document.getElementById("win2");

  if ("400px" === win1.style.height) {
    webrtc2_rebuild_elements("win1");
  }
  if ("400px" === win2.style.height) {
    webrtc2_rebuild_elements("win2");
  }

  let win1_menu_item2 = document.getElementById("win1_menu_item2");

  if ("board" == win1_menu_item2.innerHTML) {
    let win_board          = document.createElement("div");
    let board_panel_top    = document.createElement("div");
    let imgLoad            = document.createElement("input");
    let cmd_load           = document.createElement("div");
    let cmd_save           = document.createElement("div");
    let cmd_formula        = document.createElement("div");
    let cmd_text_bold      = document.createElement("div");
    let cmd_text_italic    = document.createElement("div");
    let fld_text           = document.createElement("input");
    let fld_font_size      = document.createElement("input");
    let fld_line_width     = document.createElement("input");
    let board_menu_bottom  = document.createElement("div");
    let board_panel_bottom = document.createElement("div");
    let fld_current_cmd    = document.createElement("div");
    let fld_txt_attrs      = document.createElement("div");
    let fld_line_attrs     = document.createElement("div");
    let board_panel_left   = document.createElement("div");
    let cmd_pencil         = document.createElement("div");
    let cmd_line           = document.createElement("div");
    let cmd_rectangle      = document.createElement("div");
    let cmd_circle         = document.createElement("div");
    let cmd_oval           = document.createElement("div");
    let cmd_text           = document.createElement("div");
    let cmd_select         = document.createElement("div");
    let cmd_rotate         = document.createElement("div");
    let cmd_paste          = document.createElement("div");
    let cmd_erase          = document.createElement("div");
    let cmd_fill           = document.createElement("div");
    let cmd_help           = document.createElement("div");
    let color_red          = document.createElement("div");
    let color_orange       = document.createElement("div");
    let color_yellow       = document.createElement("div");
    let color_green        = document.createElement("div");
    let color_deepskyblue  = document.createElement("div");
    let color_blue         = document.createElement("div");
    let color_purple       = document.createElement("div");
    let color_white        = document.createElement("div");
    let board_canvas       = document.createElement("canvas");

    win1_menu_item2.innerHTML = "no board";
    // create board.
    win_board.id = "win_board";
    win_board.setAttribute("style", "flex-direction: column;flex-basis: 60%;background-repeat: no-repeat;");

    board_panel_top.id    = "board_panel_top";
    board_menu_bottom.id  = "board_menu_bottom";
    board_panel_bottom.id = "board_panel_bottom";
    board_panel_left.id   = "board_panel_left";

    cmd_pencil.id ="cmd_pencil";
    cmd_pencil.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_pencil.setAttribute("title", "pencil");
    cmd_pencil.setAttribute("status", "off");
    board_panel_left.appendChild(cmd_pencil);

    cmd_line.id ="cmd_line";
    cmd_line.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_line.setAttribute("title", "line");
    board_panel_left.appendChild(cmd_line);

    cmd_rectangle.id ="cmd_rectangle";
    cmd_rectangle.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_rectangle.setAttribute("title", "rectangle");
    board_panel_left.appendChild(cmd_rectangle);

    cmd_circle.id ="cmd_circle";
    cmd_circle.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_circle.setAttribute("title", "circle");
    board_panel_left.appendChild(cmd_circle);

    cmd_oval.id ="cmd_oval";
    cmd_oval.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_oval.setAttribute("title", "oval");
    board_panel_left.appendChild(cmd_oval);

    cmd_text.id ="cmd_text";
    cmd_text.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_text.setAttribute("title", "text");
    cmd_text.setAttribute("status", "off");
    board_panel_left.appendChild(cmd_text);

    cmd_select.id ="cmd_select";
    cmd_select.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_select.setAttribute("title", "select");
    board_panel_left.appendChild(cmd_select);

    cmd_rotate.id ="cmd_rotate";
    cmd_rotate.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_rotate.setAttribute("title", "rotate");
    board_panel_left.appendChild(cmd_rotate);

    cmd_paste.id ="cmd_paste";
    cmd_paste.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_paste.setAttribute("title", "paste");
    board_panel_left.appendChild(cmd_paste);

    cmd_erase.id ="cmd_erase";
    cmd_erase.setAttribute("onclick", "webrtc2_cmd_board(id)");
    cmd_erase.setAttribute("title", "erase");
    board_panel_left.appendChild(cmd_erase);

    cmd_fill.id ="cmd_fill";
    cmd_fill.setAttribute("onclick", "webrtc2_use_fill()");
    cmd_fill.setAttribute("title", "color fill");
    cmd_fill.setAttribute("status", "off");
    board_panel_left.appendChild(cmd_fill);

    cmd_help.id ="cmd_help";
    cmd_help.setAttribute("onclick", "webrtc2_board_help()");
    cmd_help.setAttribute("title", "help");
    cmd_help.setAttribute("status", "off");
    board_panel_left.appendChild(cmd_help);

    board_canvas.id ="board_canvas";
    board_canvas.setAttribute("width", "360");
    board_canvas.setAttribute("height", "325");
    board_canvas.setAttribute("tabindex", "1");

    cmd_load.id ="cmd_load";
    cmd_load.setAttribute("title", "load");
    cmd_load.addEventListener("mousedown", (e) => {
      document.getElementById("cmd_load").style.boxShadow =
      "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
    });
    cmd_load.addEventListener("mouseup", (e) => {
      document.getElementById("cmd_load").style.boxShadow =
      "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
    });
    imgLoad.id = "imgLoad";
    imgLoad.setAttribute("type", "file");
    imgLoad.setAttribute("accept", ".png");
    imgLoad.setAttribute("style", "opacity:0;width:25px;height:25px;");
    imgLoad.addEventListener("change",(e) => webrtc2_file_load(e));

    cmd_load.appendChild(imgLoad);

    board_panel_top.appendChild(cmd_load);

    cmd_save.id ="cmd_save";
    cmd_save.setAttribute("onclick", "webrtc2_file_save()");
    cmd_save.setAttribute("title", "save");
    cmd_save.addEventListener("mousedown", (e) => {
      document.getElementById("cmd_save").style.boxShadow =
      "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
    });
    cmd_save.addEventListener("mouseup", (e) => {
      document.getElementById("cmd_save").style.boxShadow =
      "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
    });
    board_panel_top.appendChild(cmd_save);

    cmd_formula.id ="cmd_formula";
    cmd_formula.setAttribute("onclick", "webrtc2_formula()");
    cmd_formula.setAttribute("title", "formula");
    cmd_formula.setAttribute("status", "off");
    board_panel_top.appendChild(cmd_formula);

    cmd_text_bold.id ="cmd_text_bold";
    cmd_text_bold.setAttribute("onclick", "webrtc2_text_bold()");
    cmd_text_bold.setAttribute("title", "bold");
    cmd_text_bold.setAttribute("status", "off");
    board_panel_top.appendChild(cmd_text_bold);

    cmd_text_italic.id ="cmd_text_italic";
    cmd_text_italic.setAttribute("onclick", "webrtc2_text_italic()");
    cmd_text_italic.setAttribute("title", "italic");
    cmd_text_italic.setAttribute("status", "off");
    board_panel_top.appendChild(cmd_text_italic);

    fld_text.id ="fld_text";
    fld_text.setAttribute("title", "text or formula");
    fld_text.setAttribute("type", "text");
    fld_text.setAttribute("maxlength", "128");
    fld_text.setAttribute("placeholder", "enter text (128 symbols)");
    fld_text.setAttribute("autocomplete", "off");
    board_panel_top.appendChild(fld_text);

    fld_font_size.id ="fld_font_size";
    fld_font_size.setAttribute("onchange", "webrtc2_font_size()");
    fld_font_size.setAttribute("title", "font size");
    fld_font_size.setAttribute("type", "number");
    fld_font_size.setAttribute("step", 2);
    fld_font_size.setAttribute("min", 12);
    fld_font_size.setAttribute("max", 48);
    fld_font_size.setAttribute("value", 14);
    board_panel_top.appendChild(fld_font_size);

    fld_line_width.id ="fld_line_width";
    fld_line_width.setAttribute("onchange", "webrtc2_line_width()");
    fld_line_width.setAttribute("title", "line width");
    fld_line_width.setAttribute("type", "number");
    fld_line_width.setAttribute("step", 1);
    fld_line_width.setAttribute("min", 1);
    fld_line_width.setAttribute("max", 5);
    fld_line_width.setAttribute("value", 1);
    board_panel_top.appendChild(fld_line_width);

    color_red.id    = "color_red";
    color_red.setAttribute("onclick", "webrtc2_color(id)");
    color_red.setAttribute("title", "color: red");
    board_menu_bottom.appendChild(color_red);

    color_orange.id    = "color_orange";
    color_orange.setAttribute("onclick", "webrtc2_color(id)");
    color_orange.setAttribute("title", "color: orange");
    board_menu_bottom.appendChild(color_orange);

    color_yellow.id = "color_yellow";
    color_yellow.setAttribute("onclick", "webrtc2_color(id)");
    color_yellow.setAttribute("title", "color: yellow");
    board_menu_bottom.appendChild(color_yellow);

    color_green.id  = "color_green";
    color_green.setAttribute("onclick", "webrtc2_color(id)");
    color_green.setAttribute("title", "color: green");
    board_menu_bottom.appendChild(color_green);

    color_deepskyblue.id = "color_deepskyblue";
    color_deepskyblue.setAttribute("onclick", "webrtc2_color(id)");
    color_deepskyblue.setAttribute("title", "color: deepskyblue");
    board_menu_bottom.appendChild(color_deepskyblue);

    color_blue.id   = "color_blue";
    color_blue.setAttribute("onclick", "webrtc2_color(id)");
    color_blue.setAttribute("title", "color: blue");
    board_menu_bottom.appendChild(color_blue);

    color_purple.id   = "color_purple";
    color_purple.setAttribute("onclick", "webrtc2_color(id)");
    color_purple.setAttribute("title", "color: purple");
    board_menu_bottom.appendChild(color_purple);

    color_white.id  = "color_white";
    color_white.setAttribute("onclick", "webrtc2_color(id)");
    color_white.setAttribute("title", "color: white");
    board_menu_bottom.appendChild(color_white);

    fld_current_cmd.id = "fld_current_cmd";
    fld_current_cmd.innerHTML = "cmd: no selected";
    board_panel_bottom.appendChild(fld_current_cmd);
    fld_txt_attrs.id    = "fld_txt_attrs";
    fld_txt_attrs.innerHTML = "txt: 14px sans-serif";
    board_panel_bottom.appendChild(fld_txt_attrs);
    fld_line_attrs.id   = "fld_line_attrs";
    fld_line_attrs.innerHTML = "line width: 1";
    board_panel_bottom.appendChild(fld_line_attrs);

    win_board.appendChild(board_panel_top);
    win_board.appendChild(board_panel_left);
    win_board.appendChild(board_canvas);
    win_board.appendChild(board_menu_bottom);
    win_board.appendChild(board_panel_bottom);

    document.getElementById("part4").removeChild(wins_video);
    wins_video.setAttribute("style", "flex-direction: column;flex-basis: 40%;");
    document.getElementById("part4").appendChild(win_board);
    document.getElementById("part4").appendChild(wins_video);

    // Init board canvas.
    webrtc2_boardCanvas   = document.getElementById("board_canvas");
    webrtc2_boardCtx      = webrtc2_boardCanvas.getContext("2d", { willReadFrequently: true });
    webrtc2_boardCtx.font    = "14px sans-serif";
    webrtc2_boardCtx.lineCap = "round";
    // Add listener to webrtc2_boardCanvas.
    webrtc2_boardCanvas_listener();
    // Init color to draw on the board.
    webrtc2_color("color_white");
    // Send of board status.
    if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
      webrtc2_ctxChannel.send(JSON.stringify({"name" : "board_active", "text" : "yes"}));
    }
    webrtc2_board_local_active = "yes";
  } else {
    let win_board = document.getElementById("win_board");
    win1_menu_item2.innerHTML = "board";
    wins_video.setAttribute("style", "flex-direction: row;flex-basis: 100%;");
    // remove board.
    part4.removeChild(win_board);
    // Send of board status.
    if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
      webrtc2_ctxChannel.send(JSON.stringify({"name" : "board_active", "text" : "no"}));
    }
    webrtc2_board_local_active = "no";
  }
}
/**
 * @description Screen share into win1.
 */
function webrtc2_screen_share() {
  let win1_menu_item1 = document.getElementById("win1_menu_item1");
  let mediaSource;
  let videoTrack;
  let sender;

  webrtc2_rebuild_elements("win1");

  if (!webrtc2_pc) return;

  if ("screen" == win1_menu_item1.innerHTML) {
    // replace id for win_video.
    document.getElementById("win1_video").id = "win1_video_screen";
    webrtc2_webcam_screen.text = "screen";

    win1_menu_item1.innerHTML = "webcam";

    if (navigator.mediaDevices.getDisplayMedia) {
      mediaSource = navigator.mediaDevices.getDisplayMedia({video: true, audio: true,});
    } else {
      alert("This browser not support WebRTC. \n\r module:webrtc2-service.js");
      return;
    }

    mediaSource.then(stream => {
      stream.getTracks().forEach(track => webrtc2_pc.addTrack(videoTrack = track, stream));
      document.getElementById("win1_video_screen").srcObject = stream;

      videoTrack = stream.getVideoTracks()[0];
      let sender = webrtc2_pc.getSenders().find(function(s) {
        return s.track.kind == videoTrack.kind;
      });
      sender.replaceTrack(videoTrack);
    }).catch(err => {
      document.getElementById("win1_video_screen").id = "win1_video";
      win1_menu_item1.innerHTML = "screen";
      console.log("Cancel command");
    });
  }else{
    // replace id for win_video.
    document.getElementById("win1_video_screen").id = "win1_video";
    webrtc2_webcam_screen.text = "webcam";

    win1_menu_item1.innerHTML = "screen";

    if (navigator.mediaDevices.getUserMedia){//latest version browser API
        mediaSource = navigator.mediaDevices.getUserMedia({video: true, audio: true,});
    } else if (navigator.webkitGetUserMedia){ //webkit kernel browser API
        mediaSource = navigator.mediaDevices.webkitGetUserMedia({video: true, audio: true,});
    }

    mediaSource.then(stream => {
      stream.getTracks().forEach(track => webrtc2_pc.addTrack(videoTrack = track, stream));
      document.getElementById("win1_video").srcObject = stream;

      videoTrack = stream.getVideoTracks()[0];
      let sender = webrtc2_pc.getSenders().find(function(s) {
        return s.track.kind == videoTrack.kind;
      });
      sender.replaceTrack(videoTrack);
    })
    .catch(err => {
      let stream_err = webrtc2_canvas();

      stream_err.getTracks().forEach(track => webrtc2_pc.addTrack(videoTrack = track, stream_err));
      document.getElementById("win1_video").srcObject = stream_err;

      videoTrack = stream_err.getVideoTracks()[0];
      let sender = webrtc2_pc.getSenders().find(function(s) {
        return s.track.kind == videoTrack.kind;
      });
      sender.replaceTrack(videoTrack);
      webrtc2_log_err(err.name + ": ",  err.message);
    });
  }
  // Send to statChannel.
  if (webrtc2_statChannel && "open" == webrtc2_statChannel.readyState) {
    webrtc2_webcam_screen.name = "webcam_screen";
    webrtc2_statChannel.send(JSON.stringify(webrtc2_webcam_screen));
  }
}
/**
 * @description Get bitrate and fps for webrtc2_hostId in win1.
 * @param {object} stats  Collects statistics for an webrtc2_pc.
 */
function webrtc2_screen_stat(stats) {
  let bitrate = 0;
  let fps     = 0;

  // calculate video bitrate.
  stats.forEach(report => {
    let now = report.timestamp;

    if (report.type == "inbound-rtp" && report.mediaType == "video") {
      let bytesReceived = report.bytesReceived;

      bitrate = 8 * ( bytesReceived - sessionStorage.getItem("webrtc2_bytesReceivedPrev") ) / ( now - sessionStorage.getItem("webrtc2_timestampReceivedPrev") );
      bitrate = Math.floor(bitrate);

      sessionStorage.setItem("webrtc2_bytesReceivedPrev", bytesReceived );
      sessionStorage.setItem("webrtc2_timestampReceivedPrev", now );
    }
    if (report.type == "media-source") {
      Object.keys(report).forEach(key => {
        if (key == "framesPerSecond") {
          fps = report[key];
        }
      });
    }
  });
  if (0 !==bitrate && 0 !== fps) {
    bitrate += " kbits/s;";
    fps += " frames/s;";
    webrtc2_ticker.text = "Bitrate: " + bitrate + " Fps: " + fps;
  }else if (0 !== bitrate && 0 === fps) {
    bitrate += " kbits/s;";
    webrtc2_ticker.text = "Bitrate: " + bitrate;
  }
  if (webrtc2_ticker.text) {
    document.getElementById("wins1_ticker").innerHTML = webrtc2_ticker.text;
  }else{
    document.getElementById("wins1_ticker").innerHTML = "Waiting for statistics...";
    webrtc2_ticker.text = "Waiting for statistics...";
  }
  // Send to statChannel.
  if (webrtc2_statChannel && "open" == webrtc2_statChannel.readyState) {
    webrtc2_ticker.name = "ticker";
    webrtc2_statChannel.send(JSON.stringify(webrtc2_ticker));
  }
}
/**
 * @description Statistics collection for displaying on tbl_graph.
 * @param {object} stats  Collects statistics for an webrtc2_pc.
 */
function webrtc2_collect_stat(stats) {

  stats.forEach(report => {
    // Statistic data for displaying on graph1.
    if (report.type == "inbound-rtp" && report.mediaType == "video") {
      webrtc2_inbound_rtp_video.name = "inbound_rtp_video";
      webrtc2_inbound_rtp_video.timestamp = report.timestamp;
      //In kilobytes.
      webrtc2_inbound_rtp_video.bytesReceivedPerSec = (report.bytesReceived - sessionStorage.getItem("webrtc2_bytesReceived_prev_video")) / 1000;
      sessionStorage.setItem("webrtc2_bytesReceived_prev_video", report.bytesReceived );

      webrtc2_inbound_rtp_video.qpSumPerSec = report.qpSum - sessionStorage.getItem("webrtc2_in_qpSum_prev_video");
      sessionStorage.setItem("webrtc2_in_qpSum_prev_video", report.qpSum );

      webrtc2_inbound_rtp_video.packetsLost = report.packetsLost;
      webrtc2_inbound_rtp_video.pliCount    = report.pliCount;
      webrtc2_inbound_rtp_video.jitter      = report.jitter.toFixed(2);

      // Send inbound_rtp_video to client remote on statChannel.
      if (webrtc2_statChannel && "open" == webrtc2_statChannel.readyState) {
        webrtc2_statChannel.send(JSON.stringify(webrtc2_inbound_rtp_video));
      }
    }
    // Statistic data for displaying on graph2.
    if (report.type == "outbound-rtp" && report.mediaType == "video") {
      webrtc2_outbound_rtp_video.name = "outbound_rtp_video";
      webrtc2_outbound_rtp_video.timestamp = report.timestamp;
      //In kilobytes.
      webrtc2_outbound_rtp_video.bytesSentPerSec = (report.bytesSent - sessionStorage.getItem("webrtc2_bytesSent_prev_video")) / 1000;
      sessionStorage.setItem("webrtc2_bytesSent_prev_video", report.bytesSent );

      webrtc2_outbound_rtp_video.qpSumPerSec = report.qpSum - sessionStorage.getItem("webrtc2_out_qpSum_prev_video");
      sessionStorage.setItem("webrtc2_out_qpSum_prev_video", report.qpSum );

      webrtc2_outbound_rtp_video.packetsLost = report.packetsLost;
      webrtc2_outbound_rtp_video.pliCount    = report.pliCount;

      // Send outbound_rtp_video to client remote on statChannel.
      if (webrtc2_statChannel && "open" == webrtc2_statChannel.readyState) {
        webrtc2_statChannel.send(JSON.stringify(webrtc2_outbound_rtp_video));
      }
    }
    // Statistic data for displaying on graph3.
    if (report.type == "transport") {
      webrtc2_transport.name = "transport";
      webrtc2_transport.timestamp = report.timestamp;
      //In kilobytes.
      webrtc2_transport.bytesSentPerSec = (report.bytesSent - sessionStorage.getItem("webrtc2_bytesSent_prev_transport")) / 1000;
      sessionStorage.setItem("webrtc2_bytesSent_prev_transport", report.bytesSent );

      webrtc2_transport.bytesReceivedPerSec = (report.bytesReceived - sessionStorage.getItem("webrtc2_bytesReceived_prev_transport")) / 1000;
      sessionStorage.setItem("webrtc2_bytesReceived_prev_transport", report.bytesReceived );

      webrtc2_transport.dtlsState = report.dtlsState;

      // Send transport to client remote on statChannel.
      if (webrtc2_statChannel && "open" == webrtc2_statChannel.readyState) {
        webrtc2_statChannel.send(JSON.stringify(webrtc2_transport));
      }
    }
    // Statistic data for displaying on graph4.
    if (report.type == "data-channel") {
      webrtc2_channel.name = "channel";

      switch(report.label) {
        case "statChannel":
          webrtc2_channel.statChannel.timestamp = report.timestamp;
          //In kilobytes.
          webrtc2_channel.statChannel.bytesSentPerSec = (report.bytesSent - sessionStorage.getItem("webrtc2_statChannel_sent_prev")) / 1000;
          sessionStorage.setItem("webrtc2_statChannel_sent_prev", report.bytesSent );

          webrtc2_channel.statChannel.bytesReceivePerSec = (report.bytesReceived - sessionStorage.getItem("webrtc2_statChannel_received_prev")) / 1000;
          sessionStorage.setItem("webrtc2_statChannel_received_prev", report.bytesReceived );
          break;
        case "dataChannel":
          webrtc2_channel.dataChannel.timestamp = report.timestamp;
          //In kilobytes.
          webrtc2_channel.dataChannel.bytesSentPerSec = (report.bytesSent - sessionStorage.getItem("webrtc2_dataChannel_sent_prev")) / 1000;
          sessionStorage.setItem("webrtc2_dataChannel_sent_prev", report.bytesSent );

          webrtc2_channel.dataChannel.bytesReceivePerSec = (report.bytesReceived - sessionStorage.getItem("webrtc2_dataChannel_received_prev")) / 1000;
          sessionStorage.setItem("webrtc2_dataChannel_received_prev", report.bytesReceived );
          break;
        case "ctxChannel":
          webrtc2_channel.ctxChannel.timestamp = report.timestamp;
          //In kilobytes.
          webrtc2_channel.ctxChannel.bytesSentPerSec = (report.bytesSent - sessionStorage.getItem("webrtc2_ctxChannel_sent_prev")) / 1000;
          sessionStorage.setItem("webrtc2_ctxChannel_sent_prev", report.bytesSent );

          webrtc2_channel.ctxChannel.bytesReceivePerSec = (report.bytesReceived - sessionStorage.getItem("webrtc2_ctxChannel_received_prev")) / 1000;
          sessionStorage.setItem("webrtc2_ctxChannel_received_prev", report.bytesReceived );
          break;
      }

      // Send data-channel to client remote on statChannel.
      if (webrtc2_statChannel && "open" == webrtc2_statChannel.readyState) {
        webrtc2_statChannel.send(JSON.stringify(webrtc2_channel));
      }
    }
  });
}
/**
 * @description Save to file.html selected content of win_messages.
 */
function webrtc2_msg_report() {
  let html    = document.implementation.createHTMLDocument();
  let footer  = html.createElement("footer");

  let link      = document.createElement("link");

  let copyright = document.createElement("label");
  let img_flag  = document.createElement("img");

  let info      = html.createElement("div");
  let userName  = html.createElement("label");
  let browser   = html.createElement("label");
  let device    = html.createElement("label");
  let os        = html.createElement("label");
  let date_time = html.createElement("label");

  let content   = html.createElement("div");
  content.style = "margin-top: 5px;";

  let a         = document.createElement("a");
  let bl;

  //browser.family      Имя браузера
  //browser.name        Имя браузера и его версия
  //browser.version     Полная версия браузер
  //browser.major       Основной номер версии браузера
  //browser.minor       Дополнительный номер версии браузера
  //browser.patch       Номер патча браузера
  //device.family       Имя устройства
  //device.name         Имя устройства и версия
  //device.version      Полная версия устройства
  //device.major        Основной номер версии устройства
  //device.major        Дополнительный номер версии устройства
  //device.patch        Номер патча устройства
  //device.type         Тип устройства (например, "Desktop" или "Mobile")
  //device.manufacturer Производитель устройства
  //os.family           Название операционной системы
  //os.name             Полне имя операционной системы
  //os.version          Полная версия операционной системы
  //os.major            Основной номер версии операционной системы
  //os.minor            Дополнительный номер версии операционной системы
  //os.patch            Номер патча операционной системы

  let agentInfo = detect.parse(navigator.userAgent);

  userName.innerHTML  = "User name: " + webrtc2_hostId;
  userName.className  = "info";
  browser.innerHTML   = "Browser: " + agentInfo.browser.family + " version " + agentInfo.browser.major + "." + agentInfo.browser.minor + "." +  agentInfo.browser.patch;
  browser.className   = "info";
  device.innerHTML    = "Device: " + agentInfo.device.type;
  device.className    = "info";
  os.innerHTML        = "OS: " + agentInfo.os.name;
  os.className        = "info";
  date_time.innerHTML = "Date: " + new Date().toLocaleString();
  date_time.className = "info";

  if ("visible" == document.getElementById("fld_dump").style.visibility) {
    html.title        = "WP-WebRTC2 protocol of dump";
    content.innerHTML = document.getElementById("fld_dump").innerHTML;
    content.id        = "fld_dump_copy";
  }
  if ("visible" == document.getElementById("fld_chat").style.visibility) {
    html.title        = "WP-WebRTC2 protocol of chat";
    content.innerHTML = document.getElementById("fld_chat").innerHTML;
    content.id        = "fld_chat_copy";
  }

  img_flag.src = webrtc2_url + "doc/img/BY.gif";
  copyright.innerHTML = "Belarus, Minsk © 2019. Developer: Oleg Klenitsky";
  footer.appendChild(img_flag);
  footer.appendChild(copyright);

  info.appendChild(userName);
  info.appendChild(browser);
  info.appendChild(device);
  info.appendChild(os);
  info.appendChild(date_time);

  link.rel = "stylesheet";
  link.href = webrtc2_url + "css/webrtc2-report.css";
  link.type = "text/css";

  html.head.appendChild(link);
  html.body.appendChild(info);
  html.body.appendChild(content);
  html.body.appendChild(footer);

  let out = html.all[0];
  bl = new Blob(["<!DOCTYPE html>" + out.outerHTML], {type: "text/html"});

  a.href = URL.createObjectURL(bl);
  if ("visible" == document.getElementById("fld_dump").style.visibility) {
    a.download = "dump.html";
  }
  if ("visible" == document.getElementById("fld_chat").style.visibility) {
    a.download = "chat.html";
  }

  a.hidden = true;
  document.body.appendChild(a);
  a.click();
}
/**
 * @description Correction graph_legend_local, graph_legend_remote
 * Graph1, Graph2, Graph3 - have 2 lines graph legends;
 * Graph4 - have 6 lines of graph legends.
 * @param {string} id Graph1, Graph2, Graph3, or Graph4.
 */
function webrtc2_change_legend(id) {
  let legend_local  = document.getElementById("graph_legend_local");
  let legend_remote = document.getElementById("graph_legend_remote");

  legend_local.innerHTML  = "";
  legend_remote.innerHTML = "";

  //local.
  let div1 = document.createElement("div");
  div1.setAttribute("style", "display:inline-flex;align-items: center;");

  let div2 = document.createElement("div");
  div2.setAttribute("style", "display:inline-flex;align-items: center;");

  let div3 = document.createElement("div");
  div3.setAttribute("style", "display:inline-flex;align-items: center;");

  let div1_1 = document.createElement("div");
  div1_1.setAttribute("style", "width:20px;height:10px;background: #4D474D;border:2px solid rgb(0, 255, 0);");

  let div1_2 = document.createElement("div");
  div1_2.setAttribute("style", "width:20px;height:10px;background: #4D474D;border:2px solid rgb(255, 0, 255);");

  let div2_1 = document.createElement("div");
  div2_1.setAttribute("style", "width:20px;height:10px;background: #4D474D;border:2px solid rgb(255, 75, 0);");

  let div2_2 = document.createElement("div");
  div2_2.setAttribute("style", "width:20px;height:10px;background: #4D474D;border:2px solid rgb(255, 175, 0);");

  let div3_1 = document.createElement("div");
  div3_1.setAttribute("style", "width:20px;height:10px;background: #4D474D;border:2px solid rgb(75, 255, 175);");

  let div3_2 = document.createElement("div");
  div3_2.setAttribute("style", "width:20px;height:10px;background: #4D474D;border:2px solid rgb(125, 0, 255);");
  
  if ("Graph4" === id) {
    div1_1.setAttribute("title", "statChannel:Receive");
    div1_2.setAttribute("title", "statChannel:Sent");
    div1.appendChild(div1_1);
    div1.appendChild(div1_2);

    div2_1.setAttribute("title", "dataChannel:Receive");
    div2_2.setAttribute("title", "dataChannel:Sent");
    div2.appendChild(div2_1);
    div2.appendChild(div2_2);

    div3_1.setAttribute("title", "ctxChannel:Receive");
    div3_2.setAttribute("title", "ctxChannel:Sent");
    div3.appendChild(div3_1);
    div3.appendChild(div3_2);

    legend_local.appendChild(div1);
    legend_local.appendChild(div2);
    legend_local.appendChild(div3);
    legend_remote.innerHTML = legend_local.innerHTML;
  } else {
    let lbl1_1 = document.createElement("label");
    lbl1_1.id = "local_legend1";
    let lbl1_2 = document.createElement("label");
    lbl1_2.id = "local_legend2";

    div1_1.setAttribute("title", "");
    div1_2.setAttribute("title", "");
    div1.appendChild(div1_1);
    div1.appendChild(lbl1_1);
    div2.appendChild(div1_2);
    div2.appendChild(lbl1_2);

    legend_local.appendChild(div1);
    legend_local.appendChild(div2);
    legend_remote.innerHTML = legend_local.innerHTML;
    legend_remote.querySelector("#local_legend1").id = "remote_legend1";
    legend_remote.querySelector("#local_legend2").id = "remote_legend2";
  }
}
/**
 * @description Display graph1.
 */
function webrtc2_graph1() {
  webrtc2_change_legend("Graph1");

  // Нажата
  document.getElementById("btn_graph1").style.boxShadow =
  "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  // Отжата
  document.getElementById("btn_graph3").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("btn_graph2").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("btn_graph4").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";

  sessionStorage.setItem("webrtc2_graph_stat", "graph1" );

  let smoothie = new SmoothieChart({grid:{sharpLines:true},responsive:true,tooltip:true,timestampFormatter:SmoothieChart.timeFormatter});

  // Legends
  document.getElementById("local_legend1").innerHTML = "Received";
  document.getElementById("local_legend1").title     = "Kbytes/sec";
  document.getElementById("local_legend2").innerHTML = "Compressed";
  document.getElementById("local_legend2").title     = "qpSum";
  // Data
  let line1 = new TimeSeries();
  let line2 = new TimeSeries();

  // Add to SmoothieChart
  smoothie.addTimeSeries(line1,
    { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line2,
    { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:2 });

  smoothie.streamTo(document.getElementById("canvas_local"), 500);

  // Add value to each line every second
  let graph1_interval_local = setInterval(function() {
    let packetsLost = (!!webrtc2_inbound_rtp_video.packetsLost) ? webrtc2_inbound_rtp_video.packetsLost : "0";
    let pliCount = (!!webrtc2_inbound_rtp_video.pliCount) ? webrtc2_inbound_rtp_video.pliCount : "0";
    let jitter = (!!webrtc2_inbound_rtp_video.jitter) ? webrtc2_inbound_rtp_video.jitter : "0";

    document.getElementById("graph_title_local").innerHTML =
    "[Local] packetsLost:" + packetsLost + "; pliCount:" + pliCount + "; jitter:" + jitter;
    document.getElementById("graph_title_local").title = "inbound-rtp";
    line1.append(webrtc2_inbound_rtp_video.timestamp, webrtc2_inbound_rtp_video.bytesReceivedPerSec);
    line2.append(webrtc2_inbound_rtp_video.timestamp, webrtc2_inbound_rtp_video.qpSumPerSec);
    if ( "graph1" !== sessionStorage.getItem("webrtc2_graph_stat") ) {
      document.getElementById("graph_title_local").innerHTML = "[Local] Wait...";
      document.getElementById("graph_title_local").title = "";
      clearInterval(graph1_interval_local);
    }
  }, 1000);
  document.getElementById("graph_title_remote").innerHTML = "[Remote] Wait...";
  document.getElementById("graph_title_remote").title = "";
  webrtc2_graph1_remote();
}
/**
 * @description Display graph1 remote.
 */
function webrtc2_graph1_remote() {
  // webrtc2_change_legend("Graph1");

  let smoothie = new SmoothieChart({grid:{sharpLines:true},responsive:true,tooltip:true,timestampFormatter:SmoothieChart.timeFormatter});

  // Legends
  document.getElementById("remote_legend1").innerHTML = "Received";
  document.getElementById("remote_legend1").title     = "Kbytes/sec";
  document.getElementById("remote_legend2").innerHTML = "Compressed";
  document.getElementById("remote_legend2").title     = "qpSum";
  // Data
  let line1 = new TimeSeries();
  let line2 = new TimeSeries();

  // Add to SmoothieChart
  smoothie.addTimeSeries(line1,
    { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line2,
    { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:2 });

  smoothie.streamTo(document.getElementById("canvas_remote"), 500);

  // Add value to each line every second
  let graph1_interval_remote = setInterval(function() {
    let packetsLost = (!!webrtc2_inbound_rtp_video_remote.packetsLost) ? webrtc2_inbound_rtp_video_remote.packetsLost : "0";
    let pliCount = (!!webrtc2_inbound_rtp_video_remote.pliCount) ? webrtc2_inbound_rtp_video_remote.pliCount : "0";
    let jitter = (!!webrtc2_inbound_rtp_video_remote.jitter) ? webrtc2_inbound_rtp_video_remote.jitter : "0";

    document.getElementById("graph_title_remote").innerHTML =
    "[Remote] packetsLost:" + packetsLost + "; pliCount:" + pliCount + "; jitter:" + jitter;
    document.getElementById("graph_title_remote").title = "inbound-rtp";
    line1.append(webrtc2_inbound_rtp_video_remote.timestamp, webrtc2_inbound_rtp_video_remote.bytesReceivedPerSec);
    line2.append(webrtc2_inbound_rtp_video_remote.timestamp, webrtc2_inbound_rtp_video_remote.qpSumPerSec);

    if ( "graph1" !== sessionStorage.getItem("webrtc2_graph_stat") ) {
      document.getElementById("graph_title_remote").innerHTML = "[Remote] Wait...";
      document.getElementById("graph_title_remote").title = "";
      clearInterval(graph1_interval_remote);
    }
  }, 1000);
}
/**
 * @description Display graph2.
 */
function webrtc2_graph2() {
  webrtc2_change_legend("Graph2");

  // Нажата
  document.getElementById("btn_graph2").style.boxShadow =
  "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  // Отжата
  document.getElementById("btn_graph1").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("btn_graph3").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("btn_graph4").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";

  sessionStorage.setItem("webrtc2_graph_stat", "graph2");

  let smoothie = new SmoothieChart({grid:{sharpLines:true},responsive:true,tooltip:true,timestampFormatter:SmoothieChart.timeFormatter});

  // Legends
  document.getElementById("local_legend1").innerHTML = "Sended";
  document.getElementById("local_legend1").title     = "Kbytes/sec";
  document.getElementById("local_legend2").innerHTML = "Compressed";
  document.getElementById("local_legend2").title     = "qpSum";
  // Data
  let line1 = new TimeSeries();
  let line2 = new TimeSeries();

  // Add to SmoothieChart
  smoothie.addTimeSeries(line1,
    { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line2,
    { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:2 });

  smoothie.streamTo(document.getElementById("canvas_local"), 500);

  // Add value to each line every second
  let graph2_interval_local = setInterval(function() {
    let pliCount = (!!webrtc2_outbound_rtp_video.pliCount) ? webrtc2_outbound_rtp_video.pliCount : "0";
    document.getElementById("graph_title_local").innerHTML =
    "[Local] video pliCount: " + pliCount + ";";
    document.getElementById("graph_title_local").title = "outbound-rtp";
    line1.append(webrtc2_outbound_rtp_video.timestamp, webrtc2_outbound_rtp_video.bytesSentPerSec);
    line2.append(webrtc2_outbound_rtp_video.timestamp, webrtc2_outbound_rtp_video.qpSumPerSec);
    if ( "graph2" !== sessionStorage.getItem("webrtc2_graph_stat") ) {
      document.getElementById("graph_title_local").innerHTML = "[Local] Wait...";
      document.getElementById("graph_title_local").title = "";
      clearInterval(graph2_interval_local);
    }
  }, 1000);
  document.getElementById("graph_title_remote").innerHTML = "[Remote] Wait...";
  document.getElementById("graph_title_remote").title = "";
  webrtc2_graph2_remote();
}
/**
 * @description Display graph2 remote.
 */
function webrtc2_graph2_remote() {
  // webrtc2_change_legend("Graph2");

  let smoothie = new SmoothieChart({grid:{sharpLines:true},responsive:true,tooltip:true,timestampFormatter:SmoothieChart.timeFormatter});

  // Legends
  document.getElementById("remote_legend1").innerHTML = "Sended";
  document.getElementById("remote_legend1").title     = "Kbytes/sec";
  document.getElementById("remote_legend2").innerHTML = "Compressed";
  document.getElementById("remote_legend2").title     = "qpSum";
  // Data
  let line1 = new TimeSeries();
  let line2 = new TimeSeries();

  // Add to SmoothieChart
  smoothie.addTimeSeries(line1,
    { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line2,
    { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:2 });

  smoothie.streamTo(document.getElementById("canvas_remote"), 500);

  // Add value to each line every second
  let graph2_interval_remote = setInterval(function() {
    let pliCount = (!!webrtc2_outbound_rtp_video_remote.pliCount) ? webrtc2_outbound_rtp_video_remote.pliCount : "0";
    document.getElementById("graph_title_remote").innerHTML =
    "[Remote] video pliCount: " + pliCount + ";";
    document.getElementById("graph_title_remote").title = "outbound-rtp";
    line1.append(webrtc2_outbound_rtp_video_remote.timestamp, webrtc2_outbound_rtp_video_remote.bytesSentPerSec);
    line2.append(webrtc2_outbound_rtp_video_remote.timestamp, webrtc2_outbound_rtp_video_remote.qpSumPerSec);

    if ( "graph2" !== sessionStorage.getItem("webrtc2_graph_stat") ) {
      document.getElementById("graph_title_remote").innerHTML = "[Remote] Wait...";
      document.getElementById("graph_title_remote").title = "";
      clearInterval(graph2_interval_remote);
    }
  }, 1000);
}
/**
 * @description Display graph3.
 */
function webrtc2_graph3() {
  webrtc2_change_legend("Graph3");

  // Нажата
  document.getElementById("btn_graph3").style.boxShadow =
  "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  // Отжата
  document.getElementById("btn_graph1").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("btn_graph2").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("btn_graph4").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";

  sessionStorage.setItem("webrtc2_graph_stat", "graph3");

  let smoothie = new SmoothieChart({grid:{sharpLines:true},responsive:true,tooltip:true,timestampFormatter:SmoothieChart.timeFormatter});

  // Legends
  document.getElementById("local_legend1").innerHTML = "Sended";
  document.getElementById("local_legend1").title     = "Kbytes/sec";
  document.getElementById("local_legend2").innerHTML = "Received";
  document.getElementById("local_legend2").title     = "Kbytes/sec";

  // Data
  let line1 = new TimeSeries();
  let line2 = new TimeSeries();

  // Add to SmoothieChart
  smoothie.addTimeSeries(line1,
    { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line2,
    { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:2 });

  smoothie.streamTo(document.getElementById("canvas_local"), 500);

  // Add value to each line every second
  let graph3_interval_local = setInterval(function() {
    let dtlsState = (!!webrtc2_transport.dtlsState) ? webrtc2_transport.dtlsState : "0";
    document.getElementById("graph_title_local").innerHTML =
    "[Local] dtlsState: " + dtlsState + ";";
    document.getElementById("graph_title_local").title = "transport";
    line1.append(webrtc2_transport.timestamp, webrtc2_transport.bytesSentPerSec);
    line2.append(webrtc2_transport.timestamp, webrtc2_transport.bytesReceivedPerSec);
    if ( "graph3" !== sessionStorage.getItem("webrtc2_graph_stat") ) {
      document.getElementById("graph_title_local").innerHTML = "[Local] Wait...";
      document.getElementById("graph_title_local").title = "";
      clearInterval(graph3_interval_local);
    }
  }, 1000);
  document.getElementById("graph_title_remote").innerHTML = "[Remote] Wait...";
  document.getElementById("graph_title_remote").title = "";
  webrtc2_graph3_remote();
}
/**
 * @description Display graph3 remote.
 */
function webrtc2_graph3_remote() {
  // webrtc2_change_legend("Graph3");

  let smoothie = new SmoothieChart({grid:{sharpLines:true},responsive:true,tooltip:true,timestampFormatter:SmoothieChart.timeFormatter});

  // Legends
  document.getElementById("remote_legend1").innerHTML = "Sended";
  document.getElementById("remote_legend1").title     = "Kbytes/sec";
  document.getElementById("remote_legend2").innerHTML = "Received";
  document.getElementById("remote_legend2").title     = "Kbytes/sec";
  // Data
  let line1 = new TimeSeries();
  let line2 = new TimeSeries();

  // Add to SmoothieChart
  smoothie.addTimeSeries(line1,
    { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line2,
    { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:2 });

  smoothie.streamTo(document.getElementById("canvas_remote"), 500);

  // Add value to each line every second
  let graph3_interval_remote = setInterval(function() {
    let dtlsState = (!!webrtc2_transport_remote.dtlsState) ? webrtc2_transport_remote.dtlsState : "0";
    document.getElementById("graph_title_remote").innerHTML =
    "[Remote] dtlsState: " + dtlsState + ";";
    document.getElementById("graph_title_remote").title = "transport";
    line1.append(webrtc2_transport_remote.timestamp, webrtc2_transport_remote.bytesSentPerSec);
    line2.append(webrtc2_transport_remote.timestamp, webrtc2_transport_remote.bytesReceivedPerSec);

    if ( "graph3" !== sessionStorage.getItem("webrtc2_graph_stat") ) {
      document.getElementById("graph_title_remote").innerHTML = "[Remote] Wait...";
      document.getElementById("graph_title_remote").title = "";
      clearInterval(graph3_interval_remote);
    }
  }, 1000);
}
/**
 * @description Display graph4.
 */
function webrtc2_graph4() {
  webrtc2_change_legend("Graph4");

  // Нажата.
  document.getElementById("btn_graph4").style.boxShadow =
  "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  // Отжата.
  document.getElementById("btn_graph1").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("btn_graph3").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("btn_graph2").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";

  sessionStorage.setItem("webrtc2_graph_stat", "graph4");

  let smoothie = new SmoothieChart({grid:{sharpLines:true},responsive:true,tooltip:true,timestampFormatter:SmoothieChart.timeFormatter});

  // Data.
  let line1 = new TimeSeries();
  let line2 = new TimeSeries();
  let line3 = new TimeSeries();
  let line4 = new TimeSeries();
  let line5 = new TimeSeries();
  let line6 = new TimeSeries();

  // Add to SmoothieChart for statChannel.
  smoothie.addTimeSeries(line1,
    { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line2,
    { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:2 });

  // Add to SmoothieChart for dataChannel.
  smoothie.addTimeSeries(line3,
    { strokeStyle:'rgb(255, 75, 0)', fillStyle:'rgba(255, 75, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line4,
    { strokeStyle:'rgb(255, 175, 0)', fillStyle:'rgba(255, 175, 0, 0.3)', lineWidth:2 });

  // Add to SmoothieChart for ctxChannel.
  smoothie.addTimeSeries(line5,
    { strokeStyle:'rgb(75, 255, 175)', fillStyle:'rgba(0, 255, 175, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line6,
    { strokeStyle:'rgb(125, 0, 255)', fillStyle:'rgba(125, 0, 255, 0.3)', lineWidth:2 });

  smoothie.streamTo(document.getElementById("canvas_local"), 500);

  // Add value to each line every second.
  let graph4_interval_local = setInterval(function() {
    document.getElementById("graph_title_local").innerHTML =
    "[Local] channels state: " + "open";
    document.getElementById("graph_title_local").title = "data-channel";
    line1.append(webrtc2_channel.statChannel.timestamp, webrtc2_channel.statChannel.bytesReceivePerSec);
    line2.append(webrtc2_channel.statChannel.timestamp, webrtc2_channel.statChannel.bytesSentPerSec);
    line3.append(webrtc2_channel.dataChannel.timestamp, webrtc2_channel.dataChannel.bytesReceivePerSec);
    line4.append(webrtc2_channel.dataChannel.timestamp, webrtc2_channel.dataChannel.bytesSentPerSec);
    line5.append(webrtc2_channel.ctxChannel.timestamp, webrtc2_channel.ctxChannel.bytesReceivePerSec);
    line6.append(webrtc2_channel.ctxChannel.timestamp, webrtc2_channel.ctxChannel.bytesSentPerSec);
    if ( "graph4" !== sessionStorage.getItem("webrtc2_graph_stat") ) {
      document.getElementById("graph_title_local").innerHTML = "[Local] Wait...";
      document.getElementById("graph_title_local").title = "data-channel";
      clearInterval(graph4_interval_local);
    }
  }, 1000);

  document.getElementById("graph_title_remote").innerHTML = "[Remote] Wait...";
  document.getElementById("graph_title_remote").title = "data-channel";
  webrtc2_graph4_remote();
}
/**
 * @description Display graph4 remote.
 */
function webrtc2_graph4_remote() {
  // webrtc2_change_legend("Graph4");

  let smoothie = new SmoothieChart({grid:{sharpLines:true},responsive:true,tooltip:true,timestampFormatter:SmoothieChart.timeFormatter});

  // Data.
  let line1 = new TimeSeries();
  let line2 = new TimeSeries();
  let line3 = new TimeSeries();
  let line4 = new TimeSeries();
  let line5 = new TimeSeries();
  let line6 = new TimeSeries();

  // Add to SmoothieChart for statChannel.
  smoothie.addTimeSeries(line1,
    { strokeStyle:'rgb(0, 255, 0)', fillStyle:'rgba(0, 255, 0, 0.4)', lineWidth:2 });
  smoothie.addTimeSeries(line2,
    { strokeStyle:'rgb(255, 0, 255)', fillStyle:'rgba(255, 0, 255, 0.3)', lineWidth:2 });

  // Add to SmoothieChart for dataChannel.
  smoothie.addTimeSeries(line3,
    { strokeStyle:'rgb(255, 175, 0)', fillStyle:'rgba(255, 175, 0, 0.3)', lineWidth:2 });
  smoothie.addTimeSeries(line4,
    { strokeStyle:'rgb(255, 75, 0)', fillStyle:'rgba(255, 75, 0, 0.4)', lineWidth:2 });

  // Add to SmoothieChart for ctxChannel.
  smoothie.addTimeSeries(line5,
    { strokeStyle:'rgb(125, 0, 255)', fillStyle:'rgba(125, 0, 255, 0.3)', lineWidth:2 });
  smoothie.addTimeSeries(line6,
    { strokeStyle:'rgb(75, 255, 150)', fillStyle:'rgba(0, 255, 150, 0.4)', lineWidth:2 });
  
  smoothie.streamTo(document.getElementById("canvas_remote"), 500);

  // Add value to each line every second.
  let graph4_interval_remote = setInterval(function() {
    document.getElementById("graph_title_remote").innerHTML =
    "[Remote] channels state: " + "open";
    document.getElementById("graph_title_remote").title = "data-channel";
    line1.append(webrtc2_channel_remote.statChannel.timestamp, webrtc2_channel.statChannel.bytesReceivePerSec);
    line2.append(webrtc2_channel_remote.statChannel.timestamp, webrtc2_channel.statChannel.bytesSentPerSec);
    line3.append(webrtc2_channel_remote.dataChannel.timestamp, webrtc2_channel.dataChannel.bytesReceivePerSec);
    line4.append(webrtc2_channel_remote.dataChannel.timestamp, webrtc2_channel.dataChannel.bytesSentPerSec);
    line5.append(webrtc2_channel_remote.ctxChannel.timestamp, webrtc2_channel.ctxChannel.bytesReceivePerSec);
    line6.append(webrtc2_channel_remote.ctxChannel.timestamp, webrtc2_channel.ctxChannel.bytesSentPerSec);
    
    if ( "graph4" !== sessionStorage.getItem("webrtc2_graph_stat") ) {
      document.getElementById("graph_title_remote").innerHTML = "[Remote] Wait...";
      document.getElementById("graph_title_remote").title = "";
      clearInterval(graph4_interval_remote);
    }
  }, 1000);
}
/**
 * @description Change of bitrate of local win1_video.
 * @param {string} id ID of local level of bitrate.
 */
function webrtc2_bitrate_level_local(id) {
  switch (id) {
    case "wins1_bitrate_1":
      document.getElementById("wins1_bitrate_1").style.background = "red";
      document.getElementById("wins1_bitrate_2").style.background = "orange";
      document.getElementById("wins1_bitrate_3").style.background = "yellow";
      document.getElementById("wins1_bitrate_4").style.background = "yellow";
      document.getElementById("wins1_bitrate_5").style.background = "lime";
      document.getElementById("wins1_bitrate_6").style.background = "green";
      webrtc2_vu_bitrate.text = "unlimited";
      break;
    case "wins1_bitrate_2":
      document.getElementById("wins1_bitrate_1").style.background = "none";
      document.getElementById("wins1_bitrate_2").style.background = "orange";
      document.getElementById("wins1_bitrate_3").style.background = "yellow";
      document.getElementById("wins1_bitrate_4").style.background = "yellow";
      document.getElementById("wins1_bitrate_5").style.background = "lime";
      document.getElementById("wins1_bitrate_6").style.background = "green";
      webrtc2_vu_bitrate.text = "2000";
      break;
    case "wins1_bitrate_3":
      document.getElementById("wins1_bitrate_1").style.background = "none";
      document.getElementById("wins1_bitrate_2").style.background = "none";
      document.getElementById("wins1_bitrate_3").style.background = "yellow";
      document.getElementById("wins1_bitrate_4").style.background = "yellow";
      document.getElementById("wins1_bitrate_5").style.background = "lime";
      document.getElementById("wins1_bitrate_6").style.background = "green";
      webrtc2_vu_bitrate.text = "1000";
      break;
    case "wins1_bitrate_4":
      document.getElementById("wins1_bitrate_1").style.background = "none";
      document.getElementById("wins1_bitrate_2").style.background = "none";
      document.getElementById("wins1_bitrate_3").style.background = "none";
      document.getElementById("wins1_bitrate_4").style.background = "yellow";
      document.getElementById("wins1_bitrate_5").style.background = "lime";
      document.getElementById("wins1_bitrate_6").style.background = "green";
      webrtc2_vu_bitrate.text = "500";
      break;
    case "wins1_bitrate_5":
      document.getElementById("wins1_bitrate_1").style.background = "none";
      document.getElementById("wins1_bitrate_2").style.background = "none";
      document.getElementById("wins1_bitrate_3").style.background = "none";
      document.getElementById("wins1_bitrate_4").style.background = "none";
      document.getElementById("wins1_bitrate_5").style.background = "lime";
      document.getElementById("wins1_bitrate_6").style.background = "green";
      webrtc2_vu_bitrate.text = "250";
      break;
    case "wins1_bitrate_6":
      document.getElementById("wins1_bitrate_1").style.background = "none";
      document.getElementById("wins1_bitrate_2").style.background = "none";
      document.getElementById("wins1_bitrate_3").style.background = "none";
      document.getElementById("wins1_bitrate_4").style.background = "none";
      document.getElementById("wins1_bitrate_5").style.background = "none";
      document.getElementById("wins1_bitrate_6").style.background = "green";
      webrtc2_vu_bitrate.text = "125";
      break;
  }
  // Send to statChannel.
  if (webrtc2_statChannel && "open" == webrtc2_statChannel.readyState) {
    webrtc2_vu_bitrate.name = "vu_bitrate";
    webrtc2_statChannel.send(JSON.stringify(webrtc2_vu_bitrate));
  }
  // Renegotiate bandwidth on the fly.
  if (webrtc2_pc && webrtc2_pc.iceConnectionState == "connected") {
    webrtc2_bandwidth(webrtc2_vu_bitrate.text);
  }
}
/**
 * @description Change of bitrate of remote win1_video.
 * @param {string} bitrate_level_remote Bitrate level remote.
 */
function webrtc2_bitrate_level_remote(bitrate_level_remote) {
  switch (bitrate_level_remote) {
    case "unlimited":
      document.getElementById("wins2_bitrate_1").style.background = "red";
      document.getElementById("wins2_bitrate_2").style.background = "orange";
      document.getElementById("wins2_bitrate_3").style.background = "yellow";
      document.getElementById("wins2_bitrate_4").style.background = "yellow";
      document.getElementById("wins2_bitrate_5").style.background = "lime";
      document.getElementById("wins2_bitrate_6").style.background = "green";
      break;
    case "2000":
      document.getElementById("wins2_bitrate_1").style.background = "none";
      document.getElementById("wins2_bitrate_2").style.background = "orange";
      document.getElementById("wins2_bitrate_3").style.background = "yellow";
      document.getElementById("wins2_bitrate_4").style.background = "yellow";
      document.getElementById("wins2_bitrate_5").style.background = "lime";
      document.getElementById("wins2_bitrate_6").style.background = "green";
      break;
    case "1000":
      document.getElementById("wins2_bitrate_1").style.background = "none";
      document.getElementById("wins2_bitrate_2").style.background = "none";
      document.getElementById("wins2_bitrate_3").style.background = "yellow";
      document.getElementById("wins2_bitrate_4").style.background = "yellow";
      document.getElementById("wins2_bitrate_5").style.background = "lime";
      document.getElementById("wins2_bitrate_6").style.background = "green";
      break;
    case "500":
      document.getElementById("wins2_bitrate_1").style.background = "none";
      document.getElementById("wins2_bitrate_2").style.background = "none";
      document.getElementById("wins2_bitrate_3").style.background = "none";
      document.getElementById("wins2_bitrate_4").style.background = "yellow";
      document.getElementById("wins2_bitrate_5").style.background = "lime";
      document.getElementById("wins2_bitrate_6").style.background = "green";
      break;
    case "250":
      document.getElementById("wins2_bitrate_1").style.background = "none";
      document.getElementById("wins2_bitrate_2").style.background = "none";
      document.getElementById("wins2_bitrate_3").style.background = "none";
      document.getElementById("wins2_bitrate_4").style.background = "none";
      document.getElementById("wins2_bitrate_5").style.background = "lime";
      document.getElementById("wins2_bitrate_6").style.background = "green";
      break;
    case "125":
      document.getElementById("wins2_bitrate_1").style.background = "none";
      document.getElementById("wins2_bitrate_2").style.background = "none";
      document.getElementById("wins2_bitrate_3").style.background = "none";
      document.getElementById("wins2_bitrate_4").style.background = "none";
      document.getElementById("wins2_bitrate_5").style.background = "none";
      document.getElementById("wins2_bitrate_6").style.background = "green";
      break;
  }
}
