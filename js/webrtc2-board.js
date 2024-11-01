/**
 * @description Creating an interactive board for drawing.
 * @category webrtc2-board.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

var mouse = {x:0, y:0};
var area  = {x1:0, y1:0, x2:0, y2:0};

var clipboard = {x:0, y:0, width:0, height:0};
var imageData = [];
var imageClip = [];

var mousedown = false;
var mousemove = false;
var mouseup   = false;

var current_color = "";
var current_line_width = 1;

var draw = false;

var angleRotation = 0;

var title_cmd = "cmd: no selected";

var temp = [];

var repeat_cancel = false;

/**
 * @description Add listener to webrtc2_boardCanvas.
 */
function webrtc2_boardCanvas_listener() {
  webrtc2_boardCanvas.addEventListener("keydown", function(e) {
    if (e.keyCode == 90 && e.ctrlKey) {
      if (false == repeat_cancel) {
        temp.pop();
      }
      let last_item = temp.pop();
      if (last_item) {
        webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
        webrtc2_boardCtx.putImageData(last_item, 0, 0);
        repeat_cancel = true;
        // Send imageData to remote canvas.
        if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
          let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
          if (256000 > dataSend.length) {
            webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
          } else {
            webrtc2_bigData_send(dataSend);
          }
        }
      }
    }
  });
  webrtc2_boardCanvas.addEventListener("mousedown", function(e) {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;

    mousedown = true;
    mousemove = false;
    mouseup   = false;

    if (20 < mouse.x && 20 < mouse.y) {
      draw = true;
      area.x1 = mouse.x;
      area.y1 = mouse.y;
    } else {
      draw = false;
      area.x1 = 0;
      area.y1 = 0;
    }

    imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);

    if ("on" == document.getElementById("cmd_pencil").getAttribute("status")) {
      draw = true;
      webrtc2_use_pencil();
    }
    if ("on" == document.getElementById("cmd_select").getAttribute("status")) {
      if (mouse.x > clipboard.x && mouse.x < clipboard.x + clipboard.width &&
          mouse.y > clipboard.y && mouse.y < clipboard.y + clipboard.height) {
        // mouse in selected area.
      } else {
        // mouse outside the selected area.
        webrtc2_use_select(clipboard.x, clipboard.y, clipboard.width, clipboard.height);
        clipboard.x = mouse.x;
        clipboard.y = mouse.y;
        clipboard.width  = 0;
        clipboard.height = 0;
      }
    }
  });
  webrtc2_boardCanvas.addEventListener("mousemove", function(e) {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;

    area.x2 = mouse.x;
    area.y2 = mouse.y;

    mousemove = true;

    if ("on" == document.getElementById("cmd_pencil").getAttribute("status")) {
      if (true == draw) {
        webrtc2_use_pencil();
      }
    }
    if ("on" == document.getElementById("cmd_line").getAttribute("status")) {
      if (true == draw) {
        webrtc2_use_line();
      }
    }
    if ("on" == document.getElementById("cmd_rectangle").getAttribute("status")) {
      if (true == draw) {
        webrtc2_use_rectangle();
      }
    }
    if ("on" == document.getElementById("cmd_circle").getAttribute("status")) {
      if (0 !== area.x1 && 0 !== area.y1 && true == draw) {
        webrtc2_use_circle();
      }
    }
    if ("on" == document.getElementById("cmd_oval").getAttribute("status")) {
      if (0 !== area.x1 && 0 !== area.y1 && true == draw) {
        webrtc2_use_oval();
      }
    }
    if ("on" == document.getElementById("cmd_select").getAttribute("status")) {
      if (true == draw) {
        webrtc2_use_select();
      }
      if ( mouse.x > clipboard.x && mouse.y > clipboard.y &&
        mouse.x < clipboard.x+clipboard.width && mouse.y < clipboard.y+clipboard.height) {
        webrtc2_boardCanvas.setAttribute("style", "cursor: move;");
      } else {
        webrtc2_boardCanvas.setAttribute("style", "cursor: default;");
      }
    }
    if ("on" == document.getElementById("cmd_erase").getAttribute("status")) {
      if (0 !== area.x1 && 0 !== area.y1 && true == draw) {
        webrtc2_use_erase();
      }
    }
  });
  webrtc2_boardCanvas.addEventListener("mouseup", function(e) {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;

    area.x2 = mouse.x;
    area.y2 = mouse.y;

    mousedown = false;
    mousemove = false;
    mouseup   = true;

    if ("on" == document.getElementById("cmd_pencil").getAttribute("status")) {
      draw = false;
      webrtc2_use_pencil();
      // Send imageData to remote canvas.
      if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
        let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
        if (256000 > dataSend.length) {
          webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
        } else {
          webrtc2_bigData_send(dataSend);
        }
      }
      // save current content of canvas.
      let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
      temp.push(tmp_imageData);
      if (6 < temp.length) {
        temp = temp.slice(-6);
      }
      repeat_cancel = false;
    }
    if ("on" == document.getElementById("cmd_line").getAttribute("status")) {
      draw = false;
      webrtc2_use_line();
      // Send imageData to remote canvas.
      if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
        let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
        if (256000 > dataSend.length) {
          webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
        } else {
          webrtc2_bigData_send(dataSend);
        }
      }
      // save current content of canvas.
      let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
      temp.push(tmp_imageData);
      if (6 < temp.length) {
        temp = temp.slice(-6);
      }
      repeat_cancel = false;
    }
    if ("on" == document.getElementById("cmd_rectangle").getAttribute("status")) {
      draw = false;
      webrtc2_use_rectangle();
      // Send imageData to remote canvas.
      if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
        let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
        if (256000 > dataSend.length) {
          webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
        } else {
          webrtc2_bigData_send(dataSend);
        }
      }
      // save current content of canvas.
      let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
      temp.push(tmp_imageData);
      if (6 < temp.length) {
        temp = temp.slice(-6);
      }
      repeat_cancel = false;
    }
    if ("on" == document.getElementById("cmd_circle").getAttribute("status")) {
      draw = false;
      webrtc2_use_circle();
      // Send imageData to remote canvas.
      if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
        let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
        if (256000 > dataSend.length) {
          webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
        } else {
          webrtc2_bigData_send(dataSend);
        }
      }
      // save current content of canvas.
      let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
      temp.push(tmp_imageData);
      if (6 < temp.length) {
        temp = temp.slice(-6);
      }
      repeat_cancel = false;
    }
    if ("on" == document.getElementById("cmd_oval").getAttribute("status")) {
      draw = false;
      webrtc2_use_oval();
      // Send imageData to remote canvas.
      if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
        let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
        if (256000 > dataSend.length) {
          webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
        } else {
          webrtc2_bigData_send(dataSend);
        }
      }
      // save current content of canvas.
      let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
      temp.push(tmp_imageData);
      if (6 < temp.length) {
        temp = temp.slice(-6);
      }
      repeat_cancel = false;
    }
    if ("on" == document.getElementById("cmd_text").getAttribute("status")) {
      draw = false;
      if (20 < mouse.x && 20 < mouse.y) {
        webrtc2_use_text();
        // Send imageData to remote canvas.
        if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
          let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
          if (256000 > dataSend.length) {
            webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
          } else {
            webrtc2_bigData_send(dataSend);
          }
        }
        // save current content of canvas.
        let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
        temp.push(tmp_imageData);
        if (6 < temp.length) {
          temp = temp.slice(-6);
        }
        repeat_cancel = false;
      }
    }
    if ("on" == document.getElementById("cmd_select").getAttribute("status")) {
      draw = false;
      if (20 < clipboard.x && 20 < clipboard.y) {
        clipboard.width  = Math.abs(clipboard.x - mouse.x);
        clipboard.height = Math.abs(clipboard.y - mouse.y);
        webrtc2_validate_coordinates();
        webrtc2_use_select(clipboard.x, clipboard.y, clipboard.width, clipboard.height);
      }
    }
    if ("on" == document.getElementById("cmd_rotate").getAttribute("status")) {
      draw = false;
      if (20 < clipboard.x && 20 < clipboard.y) {
        webrtc2_use_rotate(clipboard.x, clipboard.y, clipboard.width, clipboard.height);
        // Send imageData to remote canvas.
        if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
          let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
          if (256000 > dataSend.length) {
            webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
          } else {
            webrtc2_bigData_send(dataSend);
          }
        }
        // save current content of canvas.
        let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
        temp.push(tmp_imageData);
        if (6 < temp.length) {
          temp = temp.slice(-6);
        }
        repeat_cancel = false;
      }
    }
    if ("on" == document.getElementById("cmd_paste").getAttribute("status")) {
      draw = false;
      if (20 < clipboard.x && 20 < clipboard.y) {
        webrtc2_use_paste(clipboard.x, clipboard.y, clipboard.width, clipboard.height);
        // Send imageData to remote canvas.
        if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
          let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
          if (256000 > dataSend.length) {
            webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
          } else {
            webrtc2_bigData_send(dataSend);
          }
        }
        // save current content of canvas.
        let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
        temp.push(tmp_imageData);
        if (6 < temp.length) {
          temp = temp.slice(-6);
        }
        repeat_cancel = false;
      }
    }
    if ("on" == document.getElementById("cmd_erase").getAttribute("status")) {
      draw = false;
      webrtc2_validate_coordinates();
      webrtc2_use_erase();
      // Send imageData to remote canvas.
      if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
        let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
        if (256000 > dataSend.length) {
          webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
        } else {
          webrtc2_bigData_send(dataSend);
        }
      }
      // save current content of canvas.
      let tmp_imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
      temp.push(tmp_imageData);
      if (6 < temp.length) {
        temp = temp.slice(-6);
      }
      repeat_cancel = false;
    }
  });
}

/**
 * @description Ensures that x1 < x2 and y1 < y2 in the area.
 */
function webrtc2_validate_coordinates() {
  let temp = 0;

  if (area.x1 > area.x2) {
    temp = area.x1;
    area.x1 = area.x2;
    area.x2 = temp;
    clipboard.x = area.x1;
  }
  if (area.y1 > area.y2) {
    temp = area.y1;
    area.y1 = area.y2;
    area.y2 = temp;
    clipboard.y = area.y1;
  }
  clipboard.width  = area.x2 - area.x1;
  clipboard.height = area.y2 - area.y1;
}

/**
 * @description Choosing a color to draw on the board.
 * @param {string} id ID of color.
 */
function webrtc2_color(id) {
  document.getElementById("color_red").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("color_orange").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("color_yellow").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("color_green").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("color_deepskyblue").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("color_blue").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("color_purple").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("color_white").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";

  if (current_color !== id.slice(6)) {
    document.getElementById(id).style.boxShadow =
    "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
    current_color = id.slice(6);
    webrtc2_boardCtx.strokeStyle = current_color;
    webrtc2_boardCtx.fillStyle   = current_color;
  } else {
    document.getElementById("color_white").style.boxShadow =
    "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
    webrtc2_boardCtx.strokeStyle = "black";
    webrtc2_boardCtx.fillStyle   = "black";
  }

  console.log("Select color: ", webrtc2_boardCtx.strokeStyle);
}

/**
 * @description Choosing a command to draw on the board.
 * @param {string} id ID of command a drawing.
 */
function webrtc2_cmd_board(id) {
  document.getElementById("cmd_pencil").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_line").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_rectangle").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_circle").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_oval").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_text").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_select").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_rotate").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_paste").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  document.getElementById("cmd_erase").style.boxShadow =
  "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";

  document.getElementById(id).style.boxShadow =
  "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";

  // Reset commands.
  document.getElementById("cmd_pencil").setAttribute("status", "off");
  document.getElementById("cmd_line").setAttribute("status", "off");
  document.getElementById("cmd_rectangle").setAttribute("status", "off");
  document.getElementById("cmd_circle").setAttribute("status", "off");
  document.getElementById("cmd_oval").setAttribute("status", "off");
  document.getElementById("cmd_text").setAttribute("status", "off");
  document.getElementById("cmd_select").setAttribute("status", "off")
  document.getElementById("cmd_rotate").setAttribute("status", "off")
  document.getElementById("cmd_paste").setAttribute("status", "off")
  document.getElementById("cmd_erase").setAttribute("status", "off");

  // Reset coordinates.
  area = {x1:0, y1:0, x2:0, y2:0};

  switch(id) {
    case "cmd_pencil":
      document.getElementById("cmd_pencil").setAttribute("status", "on");
      break;
    case "cmd_line":
      document.getElementById("cmd_line").setAttribute("status", "on");
      break;
    case "cmd_rectangle":
      document.getElementById("cmd_rectangle").setAttribute("status", "on");
      break;
    case "cmd_circle":
      document.getElementById("cmd_circle").setAttribute("status", "on");
      break;
    case "cmd_oval":
      document.getElementById("cmd_oval").setAttribute("status", "on");
      break;
    case "cmd_text":
      document.getElementById("cmd_text").setAttribute("status", "on");
      break;
    case "cmd_select":
      document.getElementById("cmd_select").setAttribute("status", "on");
      break;
    case "cmd_rotate":
      document.getElementById("cmd_rotate").setAttribute("status", "on");
      break;
    case "cmd_paste":
      document.getElementById("cmd_paste").setAttribute("status", "on");
      break;
    case "cmd_erase":
      document.getElementById("cmd_erase").setAttribute("status", "on");
      break;
  }
  title_cmd = document.getElementById(id).title;

  if ("on" === document.getElementById("cmd_fill").getAttribute("status")) {
    title_cmd = "cmd: " + title_cmd + "; color fill";
  } else {
    title_cmd = "cmd: " + document.getElementById(id).title;
  }
  document.getElementById("fld_current_cmd").innerHTML = title_cmd;

  console.log("Select cmd board: ", title_cmd);
}

/**
 * @description Pencil drawing.
 */
function webrtc2_use_pencil() {
  if ( true == mousedown && false == mousemove) {
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.moveTo(mouse.x, mouse.y);
  }
  if( true == draw && true == mousemove) {
    webrtc2_boardCtx.lineTo(mouse.x, mouse.y);
    webrtc2_boardCtx.stroke();
  }
  if ( true == mouseup ) {
    webrtc2_boardCtx.lineTo(mouse.x, mouse.y);
    webrtc2_boardCtx.stroke();
    webrtc2_boardCtx.closePath();
  }
}

/**
 * @description Line drawing.
 */
function webrtc2_use_line() {
  if (!imageData) return;

  if (true == mousemove) {
    // delete old line.
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.closePath();
    webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
    webrtc2_boardCtx.putImageData(imageData, 0, 0);

    // draw current line.
    webrtc2_boardCtx.strokeStyle = "black";
    webrtc2_boardCtx.setLineDash([5, 3]);
    webrtc2_boardCtx.lineWidth = 1;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.moveTo(area.x1, area.y1);
    webrtc2_boardCtx.lineTo(mouse.x, mouse.y);
    webrtc2_boardCtx.stroke();
    webrtc2_boardCtx.closePath();
  }
  if (true == mouseup) {
    webrtc2_boardCtx.strokeStyle = current_color;
    webrtc2_boardCtx.setLineDash([]);
    webrtc2_boardCtx.lineWidth = current_line_width;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.moveTo(area.x1, area.y1);
    webrtc2_boardCtx.lineTo(area.x2, area.y2);
    webrtc2_boardCtx.stroke();
    webrtc2_boardCtx.closePath();
  }
}

/**
 * @description Rectangle drawing.
 */
function webrtc2_use_rectangle() {
  let cmd_fill = document.getElementById("cmd_fill");

  if (!imageData) return;

  if (true == mousemove) {
    // delete old rectangle.
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.closePath();
    webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
    webrtc2_boardCtx.putImageData(imageData, 0, 0);

    // draw current rectangle.
    webrtc2_boardCtx.strokeStyle = "black";
    webrtc2_boardCtx.setLineDash([5, 3]);
    webrtc2_boardCtx.lineWidth = 1;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.strokeRect(area.x1, area.y1, area.x2-area.x1, area.y2-area.y1);

    webrtc2_boardCtx.closePath();
  }
  if (true == mouseup) {
    webrtc2_boardCtx.strokeStyle = current_color;
    webrtc2_boardCtx.setLineDash([]);
    webrtc2_boardCtx.lineWidth = current_line_width;

    webrtc2_boardCtx.beginPath();
    if ("off" === cmd_fill.getAttribute("status")) {
      webrtc2_boardCtx.strokeRect(area.x1, area.y1, area.x2-area.x1, area.y2-area.y1);
    } else {
      webrtc2_boardCtx.fillRect(area.x1, area.y1, area.x2-area.x1, area.y2-area.y1);
    }
    webrtc2_boardCtx.closePath();
  }
}

/**
 * @description Circle drawing.
 */
function webrtc2_use_circle() {
  let cmd_fill = document.getElementById("cmd_fill");
  let radius   = Math.round(Math.pow( Math.pow( Math.abs(mouse.x-area.x1), 2) + Math.pow( Math.abs(mouse.y-area.y1), 2), 0.5));

  if (!imageData) return;

  if (true == mousemove) {
    // delete old circle.
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.closePath();
    webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
    webrtc2_boardCtx.putImageData(imageData, 0, 0);

    // draw current circle.
    webrtc2_boardCtx.strokeStyle = "black";
    webrtc2_boardCtx.setLineDash([5, 3]);
    webrtc2_boardCtx.lineWidth = 1;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.arc(area.x1, area.y1, radius, 0, 2*Math.PI, false);
    if ("off" === cmd_fill.getAttribute("status")) {
      webrtc2_boardCtx.stroke();
    } else {
      webrtc2_boardCtx.fill();
    }
    webrtc2_boardCtx.closePath();
  }
  if (true == mouseup) {
    webrtc2_boardCtx.strokeStyle = current_color;
    webrtc2_boardCtx.setLineDash([]);
    webrtc2_boardCtx.lineWidth = current_line_width;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.arc(area.x1, area.y1, radius, 0, 2*Math.PI, false);
    if ("off" === cmd_fill.getAttribute("status")) {
      webrtc2_boardCtx.stroke();
    } else {
      webrtc2_boardCtx.fill();
    }
    webrtc2_boardCtx.closePath();
  }
}

/**
 * @description Oval drawing.
 */
function webrtc2_use_oval() {
  let cmd_fill = document.getElementById("cmd_fill");
  let radiusX  = Math.abs(area.y1 - mouse.y);
  let radiusY  = Math.abs(area.x1 - mouse.x);

  if (!imageData) return;

  if (true == mousemove) {
    // delete old ellipse.
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.closePath();
    webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
    webrtc2_boardCtx.putImageData(imageData, 0, 0);

    // draw current ellipse.
    webrtc2_boardCtx.strokeStyle = "black";
    webrtc2_boardCtx.setLineDash([5, 3]);
    webrtc2_boardCtx.lineWidth = 1;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.ellipse(area.x1, area.y1, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
    if ("off" === cmd_fill.getAttribute("status")) {
      webrtc2_boardCtx.stroke();
    } else {
      webrtc2_boardCtx.fill();
    }
    webrtc2_boardCtx.closePath();
  }
  if (true == mouseup) {
    webrtc2_boardCtx.strokeStyle = current_color;
    webrtc2_boardCtx.setLineDash([]);
    webrtc2_boardCtx.lineWidth = current_line_width;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.ellipse(area.x1, area.y1, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
    if ("off" === cmd_fill.getAttribute("status")) {
      webrtc2_boardCtx.stroke();
    } else {
      webrtc2_boardCtx.fill();
    }
    webrtc2_boardCtx.closePath();
  }
}

/**
 * @description Text drawing.
 */
function webrtc2_use_text() {
  let font_size   = document.getElementById("fld_font_size");
  let text_bold   = document.getElementById("cmd_text_bold");
  let text_italic = document.getElementById("cmd_text_italic");

  let fld_text    = document.getElementById("fld_text").value;
  let cmd_formula = document.getElementById("cmd_formula");
  let temp_div    = document.createElement("div");

  temp_div.id = "temp_div";
  temp_div.setAttribute("style", "background-color: #245657;")
  document.getElementById("win_board").appendChild(temp_div);

  if ("off" === cmd_formula.getAttribute("status")) {
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.fillText(fld_text, mouse.x, mouse.y);
    webrtc2_boardCtx.closePath();
  } else {
    try {
      if ("on" === text_bold.getAttribute("status") && "off" === text_italic.getAttribute("status")) {
        fld_text = "\\mathbf{" + fld_text + "}";
      }
      if ("off" === text_bold.getAttribute("status") && "on" === text_italic.getAttribute("status")) {
        fld_text = "\\mathit{" + fld_text + "}";
      }
      if ("on" === text_bold.getAttribute("status") && "on" === text_italic.getAttribute("status")) {
        fld_text = "\\bm{" + fld_text + "}";
      }
      let katex_font_size = "";
      switch (font_size.value) {
        case "12":
        case "14":  
          katex_font_size = "\\tiny ";
          break;
        case "16":
        case "18":
          katex_font_size = "\\scriptsize ";
          break;
        case "20":
        case "22":
          katex_font_size = "\\footnotesize ";
          break;
        case "24":
        case "26":
          katex_font_size = "\\small ";
          break;
        case "28":
        case "30":
          katex_font_size = "\\normalsize ";
          break;
        case "32":
        case "34":
          katex_font_size = "\\large ";
          break;
        case "36":
        case "38":
          katex_font_size = "\\Large ";
          break;
        case "40":
        case "42":
          katex_font_size = "\\LARGE ";
          break;
        case "44":
        case "46":
          katex_font_size = "\\huge ";
          break;
        case "48":
          katex_font_size = "\\Huge ";
          break;
      }
      let result_cmd = "\\color{"+current_color+"}"+katex_font_size+fld_text;
      let html = katex.renderToString(result_cmd);

      document.getElementById("temp_div").innerHTML = html;

      html2canvas(document.getElementById("temp_div")).then(canvas => {
        let img = new Image();
        img.onload = function() {
          webrtc2_boardCtx.drawImage(img,
            0, 0, img.width-1, img.height-1,
            mouse.x, mouse.y, img.width, img.height);
          if (img.complete) {
            // Send imageData to remote canvas.
            if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
              let dataSend = webrtc2_boardCanvas.toDataURL("image/png");
              if (256000 > dataSend.length) {
                webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
              } else {
                webrtc2_bigData_send(dataSend);
              }
            }
          }
        }
        img.src = canvas.toDataURL("image/png");
      });
    } catch (e) {
      if (e instanceof katex.ParseError) {
        // KaTeX can't parse the expression.
        let err = (e.message).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        document.getElementById("slogan").innerHTML = err;
      } else {
        document.getElementById("slogan").innerHTML = e;
        throw e;  // Other error.
      }
    }
  }
  document.getElementById("win_board").removeChild(temp_div);
}

/**
 * @description Drawing a mathematical formula.
 */
function webrtc2_formula() {
  let text_formula = document.getElementById("cmd_formula");

  if ("off" === text_formula.getAttribute("status")) {
    text_formula.setAttribute("status", "on");
    text_formula.style.boxShadow =
    "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  } else {
    text_formula.setAttribute("status", "off");
    text_formula.style.boxShadow =
    "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  }
}

/**
 * @description Select use.
 * @param {integer} left   Left corner of the selected area
 * @param {integer} top    Top corner of selected area
 * @param {integer} width  Width corner of selected area !==0
 * @param {integer} height Height corner of selected area !==0
 */
function webrtc2_use_select(left, top, width, height) {
  if (!imageData) return;

  if (true == mousedown) {
    if (0 !== clipboard.width && 0 !== clipboard.height) {
      // remove the previous selection contour.
      webrtc2_boardCtx.strokeStyle = "#245657";
      webrtc2_boardCtx.lineWidth = 2;
      webrtc2_boardCtx.setLineDash([]);
      webrtc2_boardCtx.beginPath();
      webrtc2_boardCtx.strokeRect(clipboard.x, clipboard.y, clipboard.width, clipboard.height);
      webrtc2_boardCtx.closePath();
      webrtc2_boardCtx.strokeStyle = current_color;
      webrtc2_boardCtx.lineWidth = current_line_width;

      imageData = webrtc2_boardCtx.getImageData(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
    }
  }
  if (true == mousemove && 0 !== imageData.length) {
    // delete old selected area.
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.closePath();
    webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
    webrtc2_boardCtx.putImageData(imageData, 0, 0);

    // draw current selected area.
    webrtc2_boardCtx.strokeStyle = "black";
    webrtc2_boardCtx.setLineDash([5, 3]);
    webrtc2_boardCtx.lineWidth = 1;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.strokeRect(area.x1, area.y1, area.x2-area.x1, area.y2-area.y1);

    webrtc2_boardCtx.closePath();
  }
  if (true == mouseup && width !== undefined && height !== undefined) {
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.strokeRect(left, top, width, height);
    webrtc2_boardCtx.closePath();

    imageClip = webrtc2_boardCtx.getImageData(left+1, top+1, width-2, height-2);
  }
}

/**
 * @description Rotate use.
 * @param {integer} left   Left corner of the selected area
 * @param {integer} top    Top corner of selected area
 * @param {integer} width  Width corner of selected area !==0
 * @param {integer} height Height corner of selected area !==0
 */
function webrtc2_use_rotate(left, top, width, height) {
  let inMemCnv = document.createElement("canvas");
  let inMemCtx;
  let rotation;

  inMemCnv.setAttribute("width", width);
  inMemCnv.setAttribute("height", height);

  inMemCtx = inMemCnv.getContext("2d", { willReadFrequently: true });
  inMemCtx.putImageData(imageClip, 0, 0);

  if (360 > angleRotation) {
    angleRotation = angleRotation + 45;
  } else {
    angleRotation = 45;
  }
  rotation = angleRotation * Math.PI / 180;

  let x = left + width/2;
  let y = top + height/2;
  let inMemWidth  = inMemCnv.width;
  let inMemHeight = inMemCnv.height;

  webrtc2_boardCtx.clearRect(left-1, top-1, width+2, height+2);

  webrtc2_boardCtx.translate(x, y);
  webrtc2_boardCtx.rotate(rotation);
  webrtc2_boardCtx.drawImage(inMemCnv, - inMemWidth/2, - inMemHeight/2, inMemWidth, inMemHeight);
  webrtc2_boardCtx.rotate(-rotation);
  webrtc2_boardCtx.translate(-x, -y);
}

/**
 * @description Get - Move - Put imageClip.
 * @param {integer} left   Left corner of the selected area
 * @param {integer} top    Top corner of selected area
 * @param {integer} width  Width corner of selected area !==0
 * @param {integer} height Height corner of selected area !==0
 */
function webrtc2_use_paste(left, top, width, height) {
  if (imageClip.length !== 0) {
    webrtc2_boardCtx.putImageData(imageClip, mouse.x-width/2, mouse.y-height/2);
  }
}

/**
 * @description Erase use.
 */
function webrtc2_use_erase() {
  if (true == mousemove) {
    // delete old area erased.
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.closePath();
    webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);
    webrtc2_boardCtx.putImageData(imageData, 0, 0);

    // draw current rectangle.
    webrtc2_boardCtx.strokeStyle = "black";
    webrtc2_boardCtx.setLineDash([5, 3]);
    webrtc2_boardCtx.lineWidth = 1;

    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.strokeRect(area.x1, area.y1, area.x2-area.x1, area.y2-area.y1);

    webrtc2_boardCtx.closePath();
  }
  if (true == mouseup) {
    webrtc2_boardCtx.beginPath();
    webrtc2_boardCtx.closePath();

    webrtc2_boardCtx.strokeStyle = current_color;
    webrtc2_boardCtx.fillStyle   = current_color;
    webrtc2_boardCtx.setLineDash([]);

    webrtc2_boardCtx.clearRect(area.x1-1, area.y1-1, Math.abs(area.x2-area.x1)+2, Math.abs(area.y2-area.y1)+2);
  }
}

/**
 * @description Color fill.
 */
function webrtc2_use_fill() {
  let cmd_fill = document.getElementById("cmd_fill");
  let txt      = document.getElementById("fld_current_cmd").innerHTML;

  if ("off" === cmd_fill.getAttribute("status")) {
    cmd_fill.setAttribute("status", "on");
    cmd_fill.style.boxShadow =
    "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
    if (-1 !== txt.indexOf("no selected")) {
      txt = "cmd: color fill";
    } else {
      txt = txt + "; color fill";
    }
  } else {
    cmd_fill.setAttribute("status", "off");
    cmd_fill.style.boxShadow =
    "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
    txt = txt.slice(0, txt.length - 12);
  }
  document.getElementById("fld_current_cmd").innerHTML = txt;
}

/**
 * @description Help use.
 */
function webrtc2_board_help() {
  let win_board = document.getElementById("win_board");
  let cmd_help  = document.getElementById("cmd_help");
  let win_help  = document.createElement("div");

  if ("off" === cmd_help.getAttribute("status")) {
    win_help.id = "win_help";
    win_help.setAttribute("style", "position:absolute;top:55px;left:60px;width:335px;height:293px;overflow: auto;background-color: #245657;");

    cmd_help.setAttribute("status", "on");
    cmd_help.style.boxShadow =
    "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";

    // build window of help.
    let item1 = document.createElement("label");
    let item2 = document.createElement("label");
    let item3 = document.createElement("label");
    let item4 = document.createElement("label");
    let item5 = document.createElement("label");
    let item6 = document.createElement("label");
    let item7 = document.createElement("label");

    item1.id = "item1";
    item1.setAttribute("style", "color: white;font-size:14px;display:block;");
    item1.innerHTML = "1. Commands: <b>rectangle, circle, oval</b> - are executed with filling the shapes with the selected color, if the <b>color fill</b> button was previously pressed.";
    win_help.appendChild(item1);

    item2.id = "item2";
    item2.setAttribute("style", "color: white;font-size:14px;display:block;margin-top: 10px;");
    item2.innerHTML = "2. Commands <b>rotate, paste</b> - are executed, if the <b>select</b> command was previously executed.";
    win_help.appendChild(item2);

    item3.id = "item3";
    item3.setAttribute("style", "color: white;font-size:14px;display:block;margin-top: 10px;");
    item3.innerHTML = "3. Сommand <b>text</b> - is executed, if the text was previously entered in the <b>text</b> field of the top menu. If the <b>Formula</b> button was pressed, then the entered text will be accepted as a formula.";
    win_help.appendChild(item3);

    item4.id = "item4";
    item4.setAttribute("style", "color: white;font-size:14px;display:block;margin-top: 10px;");
    item4.innerHTML = "4. The size of the working area for drawing is 360x325px. It is allowed to upload an image no larger than twice the size of the drawing area.";
    win_help.appendChild(item4);

    item5.id = "item5";
    item5.setAttribute("style", "color: white;font-size:14px;display:block;margin-top: 10px;");
    item5.innerHTML = "5. <b>ctrl+z</b> cancel drawing 1 step back. All steps - 5.";
    win_help.appendChild(item5);

    item6.id = "item6";
    item6.setAttribute("style", "color: white;font-size:14px;display:block;margin-top: 10px;");
    item6.innerHTML = "6. "+ "<a style='color: white;' href='https://katex.org/docs/supported.html' target='_blank' >Supported functions of mathematical formulas</a>";
    win_help.appendChild(item6);

    let tbl_math = document.createElement("table");
    tbl_math.setAttribute("style", "padding:0;margin:0;border: 1px solid white;border-collapse: collapse;width:100%;");

    let tbl_head_math = tbl_math.insertRow();
    let cell0_math = tbl_head_math.insertCell(0);
    cell0_math.setAttribute("style", "font-size: 14px;color: white;padding:0;width:50%;font-weight: bold;text-align: center;border: 1px solid white;border-collapse: collapse;");
    cell0_math.innerHTML = "input field";
    let cell1_math = tbl_head_math.insertCell(1);
    cell1_math.setAttribute("style", "font-size: 14px;color: white;padding:0;width:50%;font-weight: bold;text-align: center;border: 1px solid white;border-collapse: collapse;");
    cell1_math.innerHTML = "on drawing board";

    for (let i = 0; i < 5; i++) {
      let tbl_row = tbl_math.insertRow();
      let cell0 = tbl_row.insertCell(0);
      cell0.setAttribute("style", "font-size: 14px;color: white;padding:0;width:50%;text-align: center;border: 1px solid white;border-collapse: collapse;");
      let cell1 = tbl_row.insertCell(1);
      cell1.setAttribute("style", "font-size: 14px;color: white;padding:0;width:50%;text-align: center;border: 1px solid white;border-collapse: collapse;");
      switch(i) {
        case 0:
          cell0.innerHTML = "\\left(x^2\\right)";
          cell1.innerHTML = katex.renderToString("\\left(x^2\\right)");
          break;
        case 1:
          cell0.innerHTML = "\\sqrt(b^y)";
          cell1.innerHTML = katex.renderToString("\\sqrt(b^y)");
          break;
        case 2:
          cell0.innerHTML = "c=\\pm\\sqrt{a^2 + b^2}";
          cell1.innerHTML = katex.renderToString("c=\\pm\\sqrt{a^2 + b^2}");
          break;
        case 3:
          cell0.innerHTML = "f(x)=x^2 \\cdot \\ln (2x)";
          cell1.innerHTML = katex.renderToString("f(x)=x^2 \\cdot \\ln (2x)");
          break;
        case 4:
          cell0.innerHTML = "\\Set{ x | x<\\frac 1 2 }";
          cell1.innerHTML = katex.renderToString("\\Set{ x | x<\\frac 1 2 }");
          break;
      }
    }
    win_help.appendChild(tbl_math);

    item7.id = "item7";
    item7.setAttribute("style", "color: white;font-size:14px;display:block;margin-top: 10px;");
    item7.innerHTML = "7. "+ "<a style='color: white;' href='https://mhchem.github.io/MathJax-mhchem/' target='_blank' >Supported functions of chemical formulas</a>";
    win_help.appendChild(item7);

    let tbl_chem = document.createElement("table");
    tbl_chem.setAttribute("style", "padding:0;margin:0;border: 1px solid white;border-collapse: collapse;width:100%;");

    let tbl_head_chem = tbl_chem.insertRow();
    let cell0_chem = tbl_head_chem.insertCell(0);
    cell0_chem.setAttribute("style", "font-size: 14px;color: white;padding:0;width:50%;font-weight: bold;text-align: center;border: 1px solid white;border-collapse: collapse;");
    cell0_chem.innerHTML = "input field";
    let cell1_chem = tbl_head_chem.insertCell(1);
    cell1_chem.setAttribute("style", "font-size: 14px;color: white;padding:0;width:50%;font-weight: bold;text-align: center;border: 1px solid white;border-collapse: collapse;");
    cell1_chem.innerHTML = "on drawing board";

    for (let i = 0; i < 5; i++) {
      let tbl_row = tbl_chem.insertRow();
      let cell0 = tbl_row.insertCell(0);
      cell0.setAttribute("style", "font-size: 14px;color: white;padding:0;width:50%;text-align: center;border: 1px solid white;border-collapse: collapse;");
      let cell1 = tbl_row.insertCell(1);
      cell1.setAttribute("style", "font-size: 14px;color: white;padding:0;width:50%;text-align: center;border: 1px solid white;border-collapse: collapse;");
      switch(i) {
        case 0:
          cell0.innerHTML = "\\ce{CO2 + C -> 2 CO}";
          cell1.innerHTML = katex.renderToString("\\ce{CO2 + C -> 2 CO}");
          break;
        case 1:
          cell0.innerHTML = "\\ce{Sb2O3}";
          cell1.innerHTML = katex.renderToString("\\ce{Sb2O3}");
          break;
        case 2:
          cell0.innerHTML = "\\ce{1/2 H2O}";
          cell1.innerHTML = katex.renderToString("\\ce{1/2 H2O}");
          break;
        case 3:
          cell0.innerHTML = "\\ce{H^3HO}";
          cell1.innerHTML = katex.renderToString("\\ce{H^3HO}");
          break;
        case 4:
          cell0.innerHTML = "\\ce{CH4 + 2 \\left(\\ce{O2 + 79/21 N2}\\right)}";
          cell1.innerHTML = katex.renderToString("\\ce{CH4 + 2\\left(\\ce{O2 + 79/21 N2}\\right)}");
          break;
      }
    }
    win_help.appendChild(tbl_chem);

    win_board.appendChild(win_help);

  } else {
    cmd_help.setAttribute("status", "off");
    cmd_help.style.boxShadow =
    "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
    // remove window of help.
    let win_help  = document.getElementById("win_help");
    win_help.remove();
  }
}

/**
 * @description File load for board drawing.
 * @param {object} e Event.
 */
function webrtc2_file_load(e) {
  webrtc2_boardCtx.beginPath();
  webrtc2_boardCtx.closePath();

  webrtc2_boardCtx.clearRect(0,0,webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);

  if(e.target.files) {
    let img = new Image;
    img.onload = function() {
      webrtc2_boardCtx.drawImage(this,
        0, 0, this.width, this.height,
        0, 0, webrtc2_boardCanvas.width, webrtc2_boardCanvas.height);

      // Send imageData to remote canvas.
      if (webrtc2_ctxChannel && "open" == webrtc2_ctxChannel.readyState) {
        let dataSend = webrtc2_boardCanvas.toDataURL("image/png");

        if (256000 > dataSend.length) {
          webrtc2_ctxChannel.send(JSON.stringify({"name" : "imageData", "value" : dataSend}));
        } else {
          webrtc2_bigData_send(dataSend);
        }
      }
    }
    img.src = URL.createObjectURL(e.target.files[0]);
  }
}

/**
 * @description File save for board drawing.
 */
function webrtc2_file_save() {
  let link = document.createElement("a");

  link.download = "webrtc2_board.png";
  link.href = webrtc2_boardCanvas.toDataURL("image/png");
  link.click();
}

/**
 * @description Set font size for board drawing.
 */
function webrtc2_font_size() {
  let font_size   = document.getElementById("fld_font_size");
  let text_bold   = document.getElementById("cmd_text_bold");
  let text_italic = document.getElementById("cmd_text_italic");

  if (48 < font_size.value) {
    font_size.value = 48;
  }
  if (12 > font_size.value) {
    font_size.value = 12;
  }
  webrtc2_boardCtx.font = font_size.value + "px sans-serif";

  if ( "on" === text_bold.getAttribute("status") ) {
    webrtc2_boardCtx.font = "bold " + webrtc2_boardCtx.font;
  }
  if ( "on" === text_italic.getAttribute("status") ) {
    webrtc2_boardCtx.font = "italic " + webrtc2_boardCtx.font;
  }
  document.getElementById("fld_txt_attrs").innerHTML = "txt: " + webrtc2_boardCtx.font;
}
/**
 * @description Set line width for board drawing.
 */
function webrtc2_line_width() {
  let line_width = document.getElementById("fld_line_width");

  if (6 < line_width.value) {
    line_width.value = 5;
  }
  if (1 > line_width.value) {
    line_width.value = 1;
  }
  current_line_width = line_width.value;
  webrtc2_boardCtx.lineWidth = current_line_width;
  document.getElementById("fld_line_attrs").innerHTML = "line width: " + current_line_width;
}
/**
 * @description Set text bold for board drawing.
 */
function webrtc2_text_bold() {
  let font_size   = document.getElementById("fld_font_size");
  let text_bold   = document.getElementById("cmd_text_bold");
  let text_italic = document.getElementById("cmd_text_italic");

  if ("off" === text_bold.getAttribute("status")) {
    text_bold.setAttribute("status", "on");
    text_bold.style.boxShadow =
    "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  } else {
    text_bold.setAttribute("status", "off");
    text_bold.style.boxShadow =
    "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  }

  webrtc2_boardCtx.font = font_size.value + "px sans-serif";

  if ( "on" === text_bold.getAttribute("status") ) {
    webrtc2_boardCtx.font = "bold " + webrtc2_boardCtx.font;
  }
  if ( "on" === text_italic.getAttribute("status") ) {
    webrtc2_boardCtx.font = "italic " + webrtc2_boardCtx.font;
  }
  document.getElementById("fld_txt_attrs").innerHTML = "txt: " + webrtc2_boardCtx.font;
}

/**
 * @description Set text italic for board drawing.
 */
function webrtc2_text_italic() {
  let font_size   = document.getElementById("fld_font_size");
  let text_bold   = document.getElementById("cmd_text_bold");
  let text_italic = document.getElementById("cmd_text_italic");

  if ("off" === text_italic.getAttribute("status")) {
    text_italic.setAttribute("status", "on");
    text_italic.style.boxShadow =
    "inset -2px -2px 3px rgba(200, 200, 200, .6),inset 2px 2px 3px rgba(0, 0, 0, .6)";
  } else {
    text_italic.setAttribute("status", "off");
    text_italic.style.boxShadow =
    "inset 2px 2px 3px rgba(255, 255, 255, .6),inset -2px -2px 3px rgba(0, 0, 0, .6)";
  }

  webrtc2_boardCtx.font = font_size.value + "px sans-serif";

  if ( "on" === text_bold.getAttribute("status") ) {
    webrtc2_boardCtx.font = "bold " + webrtc2_boardCtx.font;
  }
  if ( "on" === text_italic.getAttribute("status") ) {
    webrtc2_boardCtx.font = "italic " + webrtc2_boardCtx.font;
  }
  document.getElementById("fld_txt_attrs").innerHTML = "txt: " + webrtc2_boardCtx.font;
}

/**
 * @description Send big Data to webrtc2_guestId.
 * @param {blob} dataSend Big data.
 */
function webrtc2_bigData_send(dataSend) {
  let chunkSize  = 65535; //64Kbt.
  let bigimageData = dataSend;

  for (let i = 0; i < bigimageData.length; i += chunkSize) {
    let partData = bigimageData.slice(i, i + chunkSize);
    webrtc2_ctxChannel.send(JSON.stringify({"name" : "bigimageData", "value" : partData}));
  }
  webrtc2_ctxChannel.send(JSON.stringify({"name" : "bigimageData", "value" :  "end_imageData"}));
}
