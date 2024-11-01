/**
 * @description Create Contact List of Profile.
 * @category webrtc2-backend.js
 * @package  js
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 */

/*jshint esversion: 6 */

"use strict";

if (window.attachEvent) {
  window.attachEvent("onload", webrtc2_main_onload);
} else if (window.addEventListener) {
  window.addEventListener("load", webrtc2_main_onload, false);
} else {
  document.addEventListener("load", webrtc2_main_onload, false);
}

/**
 * @description Main function onload.
 */
function webrtc2_main_onload() {
  webrtc2_profile_onload();
  webrtc2_page_onload();
}
/**
 * @description Profile section onload.
 */
function webrtc2_profile_onload() {
  let all_users     = document.getElementById("all_users");
  let contact_list  = document.getElementById("contact_list");
  let contact_group = document.getElementById("contact_group");

  if (all_users && contact_list) {
    if (all_users.checked && ! contact_list.checked) {
      contact_group.style.display = "none";
    }
    if (!all_users.checked && contact_list.checked) {
      contact_group.style.display = "flex";
    }
  }
}
/**
 * @description Page onload.
 * Fixed a bug in the standard module WP_List_Table,
 * when the admin enters a value in the "current-page-selector field"
 * and in the address bar, the "paged" field did not change.
 */
function webrtc2_page_onload() {
  let current_page_selector = document.getElementById("current-page-selector");

  if (current_page_selector) {
    const queryString = new URLSearchParams(window.location.search);

    if (queryString.get("paged") !== current_page_selector.value) {
      let url = new URL(window.location);
      url.searchParams.set("paged", current_page_selector.value);
      history.pushState(null, null, url.href);
    }
  }
}
/**
 * @description Include user to Contact List.
 */
function webrtc2_users_include() {
  let usersRows   = document.getElementById("div_users").getElementsByClassName("tbody_fields");
  let contactRows = document.getElementById("div_contact").getElementsByClassName("body_tbl")[0];
  let result      = document.getElementById("contact_list").value;

  result = ("all_users" == result) ? "" : result + ";";

  Array.from(usersRows).forEach(
    function(element, index, array) {
      let checkbox = element.querySelector("input[type=checkbox]");
      if ( checkbox && checkbox.checked ) {
        //insert new row into contactRows.
        contactRows.appendChild(element);
        //prepare result out to server
        result += element.querySelector("label").textContent.trim() + ";";
      }
    }
  );
  let arr = result.split(";");
  let set = new Set(arr);

  arr = Array.from(set);

  arr = arr.filter(element => element !== "");
  arr.sort();

  result = arr.join(';') + ";";

  document.getElementById("contact_list").value = result;
  // console.log(result);
}
/**
 * @description Exclude user from Contact List.
 */
function webrtc2_users_exclude() {
  let usersRows   = document.getElementById("div_users").getElementsByClassName("body_tbl")[0];
  let contactRows = document.getElementById("div_contact").getElementsByClassName("tbody_fields");
  let result      = document.getElementById("contact_list").value + ";";

  Array.from(contactRows).forEach(
    function(element, index, array) {
      let checkbox = element.querySelector("input[type=checkbox]");
      if ( checkbox && checkbox.checked ) {
        //insert new row into usersRows.
        usersRows.appendChild(element);
        //prepare result out to server
        let str = element.querySelector("label").textContent.trim() + ";";
        result = result.replaceAll(str, "");
      }
    }
  );
  document.getElementById("contact_list").value = result;
}
/**
 * @description Dispaly on/off Contact List.
 * @param {string} id Radio button of select Users for Video chat.
 */
function webrtc2_users_sel_btn (id) {
  let contact_group = document.getElementById("contact_group");
  if (contact_group && id == "all_users") {
    contact_group.style.display = "none";
  }
  if (contact_group && id == "contact_list") {
    contact_group.style.display = "flex";
  }
}
/**
 * @description Search Name of user registered into profile.
 */
function webrtc2_search_user_profile() {
  let tableUsersRows  = document.getElementById("users_tbody").getElementsByClassName("tbody_fields");
  let fld_search_user = document.getElementById("fld_users_search");

  for (let tableUsersRow of tableUsersRows) {
    let fld_user_name = tableUsersRow.querySelector("label").textContent.trim();
    let flag = fld_user_name.indexOf( fld_search_user.value );
    if ( -1 !== flag ) {
      tableUsersRow.style.display = "flex";
    } else {
      tableUsersRow.style.display = "none";
    }
  }
  fld_search_user.oninput = function() {
    if ( fld_search_user.value.length == 0 ) {
      for ( let tableUsersRow of tableUsersRows ) {
        tableUsersRow.style.display = "flex";
      }
    }
  }
}
/**
 * @description Search Name of contact into profile.
 */
function webrtc2_search_contact_profile() {
  let tableContactRows   = document.getElementById("contact_tbody").getElementsByClassName("tbody_fields");
  let fld_search_contact = document.getElementById("fld_contact_search");

  for (let tableContactRow of tableContactRows) {
    let fld_contact_name = tableContactRow.querySelector("label").textContent.trim();
    let flag = fld_contact_name.indexOf( fld_search_contact.value );
    if ( -1 !== flag ) {
      tableContactRow.style.display = "flex";
    } else {
      tableContactRow.style.display = "none";
    }
  }
  fld_search_contact.oninput = function() {
    if ( fld_search_contact.value.length == 0 ) {
      for ( let tableContactRow of tableContactRows ) {
        tableContactRow.style.display = "flex";
      }
    }
  }
}
/**
 * @description Server check SMTP.
 */
function webrtc2_check_smtp() {
  let params = "&webrtc2_cmd=cmd10" + "&action=sign" + "&nonce=" + webrtc2_nonce;
  webrtc2_makeRequestSMTP(params)
  .then(msg => {
    let smtp_check_result = document.getElementById("smtp_check_result");
    smtp_check_result.innerHTML = msg;
  });
}
/**
 * @description Make request XMLHttpRequest.
 * @param {string} params Parameter for request.
 */
function webrtc2_makeRequestSMTP(params) {
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
