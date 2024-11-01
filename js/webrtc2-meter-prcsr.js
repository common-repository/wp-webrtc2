/**
 * @description Creating a WebRTC2AudioMeter.
 * @category webrtc2-meter-prcsr.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

/**
 * @description The AudioWorkletProcessor interface of the Web Audio API represents an audio processing code behind a
 * custom AudioWorkletNode. It lives in the AudioWorkletGlobalScope and runs on the Web Audio rendering thread.
 * In turn, an AudioWorkletNode based on it runs on the main thread.
 */
class WebRTC2AudioMeter extends AudioWorkletProcessor {
  /**
   * The AudioWorkletProcessor() constructor creates a new AudioWorkletProcessor object,
   * which represents an underlying audio processing mechanism of an AudioWorkletNode.
   * @constructor
   */
  constructor() {
    super();

    this.smoothing_factor = 0.8;
    this.masterVolume = 0;
    this.sampleRate = 48000;
    this.updateIntervalInMS = 25;
    this.nextUpdateFrame = this.updateIntervalInMS;
    this.port.postMessage({msg: "WorkletProcessor WebRTC2AudioMeter is work."});
    this.port.onmessage = (event) => {
      // Handling data from the node.
      if (event.data.msg) {
        console.log("WorkletProcessor WebRTC2AudioMeter receive: " + event.data.msg);
      }
    };
  }
  /**
   * @description Interval in Frames.
   * @return {number} Interval in Frames.
   */
  get intervalInFrames() {
    return this.updateIntervalInMS / 1000 * this.sampleRate;
  }
  /**
   * @description Audio signal processing.
   * @param  {number} inputs     The value to initialize the numberOfInputs property to. Defaults to 1.
   * @param  {number} outputs    The value to initialize the numberOfOutputs property to. Defaults to 1.
   * @param  {number} parameters An object containing the initial values of custom AudioParam objects on this node.
   * @return {boolean} The newly constructed AudioWorkletProcessor instance.
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const samples = input[0];
      let sum = 0;
      let rms = 0;

      // Calculated the squared-sum.
      for (let i = 0; i < samples.length; ++i) {
        sum += samples[i] * samples[i];
      }
      // Calculate the RMS level and update the masterVolume.
      rms = Math.sqrt(sum / samples.length);
      this.masterVolume = Math.max(rms, this.masterVolume * this.smoothing_factor);

      // Update and sync the masterVolume property with the main thread.
      this.nextUpdateFrame -= samples.length;
      if (this.nextUpdateFrame < 0) {
        this.nextUpdateFrame += this.intervalInFrames;
        this.port.postMessage({vu_audio: this.masterVolume});
      }
    }
    return true;
  }
}
registerProcessor("webrtc2-audio-meter", WebRTC2AudioMeter);
