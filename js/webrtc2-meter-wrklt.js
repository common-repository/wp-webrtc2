/**
 * @description Sound worklet (audio meter).
 * @category webrtc2-meter-wrklt.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

/**
 * @description Sound processor (audio meter).
 * @param {object} stream Overall audio signal level.
 */
function webrtc2_WorkletNodeAudioMeter(stream) {
  let canvas        = document.getElementById("wins1_vu_audio");
  let canvasContext = canvas.getContext("2d", { willReadFrequently: true });
  let gradient      = canvasContext.createLinearGradient(0, 0, 10, 50);

  webrtc2_audioCtx = (webrtc2_audioCtx) ?webrtc2_audioCtx :new AudioContext();
  let microphone   = webrtc2_audioCtx.createMediaStreamSource(stream);

  // Add three color stops.
  gradient.addColorStop(0, "red");
  gradient.addColorStop(0.3, "yellow");
  gradient.addColorStop(1, "green");

  webrtc2_audioCtx.audioWorklet.addModule(webrtc2_url + "js/webrtc2-meter-prcsr.js")
  .then(() => {
    webrtc2_audio_meter = new AudioWorkletNode(webrtc2_audioCtx, "webrtc2-audio-meter");

    microphone.connect(webrtc2_audio_meter);
    webrtc2_audio_meter.connect(webrtc2_audioCtx.destination);

    webrtc2_audio_meter.port.postMessage({msg: "WorkletNode webrtc2_audio_meter is work."});

    webrtc2_audio_meter.port.onmessage = (event) => {
      // Handling data from the processor.
      if (event.data.msg) {
        console.log("WorkletNode webrtc2_audio_meter receive: " + event.data.msg);
      }
      if (event.data.vu_audio) {
        let masterVolume = event.data.vu_audio;
        let sensibility = 1;
        masterVolume = Math.round((masterVolume * 100) / sensibility);
        canvasContext.clearRect(0, 0, 10, 50);
        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(0, 50 - masterVolume, 10, 50);
        // Send to statChannel.
        if (webrtc2_statChannel && "open" == webrtc2_statChannel.readyState) {
          webrtc2_vu_audio.name = "vu_audio";
          webrtc2_vu_audio.text = masterVolume;
          webrtc2_statChannel.send(JSON.stringify(webrtc2_vu_audio));
        }
      }
    };
  });
}
