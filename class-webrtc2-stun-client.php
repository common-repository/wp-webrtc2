<?php
/**
 * Description: Creates client of stun server.
 *
 * PHP version 8.0.1
 *
 * @category class
 * @package  core
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 * @filesource
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit();
}

class WebRTC2_Stun_Client {
  private $socket;
  private $stun_id;
  private $stun_ip;
  private $stun_port;
  private static $stun_err;

  public function __construct() {
    self::$stun_err = "";
  }

  public static function getError() {
    return self::$stun_err;
  }

  public function setServerAddr($id, $ip, $port) {
    $this->stun_id   = $id;
    $this->stun_ip   = $ip;
    $this->stun_port = $port;
  }

  public function closeSocket() {
    socket_close($this->socket);
  }

  public function createSocket() {
    $this->socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP );
    socket_set_nonblock($this->socket);
  }

  public function getPublicIp() {
    //Message Type.
    $bindingRequest  = 0x0001;
    $bindingResponse = 0x0101;
    //Message Attribute Types.
    $MAPPED_ADDRESS  = 0x0001;
    $CHANGE_REQUEST  = 0x0003;
    $CHANGED_ADDRESS = 0x0005;
    $ERROR_CODE      = 0x0009;

    $TID1 = 0x00005555;
    $TID2 = 0x01234567;
    $TID3 = 0x00abcdef;
    $TID4 = 0x00000000;

    $buflen  = 4096;
    $timeout = 3;

    $msg = pack("nnNNNN", $bindingRequest, 0, $TID1, $TID2, $TID3, $TID4);
    $numberOfBytesSent = socket_sendto($this->socket, $msg, strlen($msg), 0, $this->stun_ip, $this->stun_port);

    $start_time = time();
    $start_time_msec = date_create()->format('Uv');

    while (time() - $start_time < $timeout) {
      $count_bytes = socket_recvfrom($this->socket, $data, $buflen, 0, $remoteIP, $remotePort);

      if (is_null($data) || strlen($data) < 20) {
        continue;
      }
      if (false === $count_bytes) {
        //  code error = 11    Resource temporarily unavailable.
        //  code error = 10035 An operation on an unlocked socket cannot be completed immediately.
        if (10035 === socket_last_error() || 11 === socket_last_error()) {
          socket_clear_error();
        } else{
          self::$stun_err = "(Item id=". $this->stun_id .
          "), code error=" . socket_last_error(). ", " .socket_strerror(socket_last_error());
          break;
        }
      }
      $info = unpack("nmsg/nlen/N4tid",substr($data, 0, 20));

      if($info["msg"] !== $bindingResponse) {
        continue;
      }
      if($info["len"] !== strlen($data) - 20) {
        continue;
      }
      break;
    }

    if (is_null($data)) {
      return [
        "ip"         => "<span style='color:red;'>failed</span>",
        "port"       => "<span style='color:red;'>error4</span>",
        "date_check" => $start_time,
        "time_delay" => "",
      ];
    }

    $rest_len = strlen($data) - 20;
    $rest_idx = 20;

    $mappedIP   = "<span style='color:red;'>failed</span>";
    $mappedPort = "<span style='color:red;'>error0</span>";

    while(true) {
      if($rest_len < 4) {
        break;
      }
      $mah = substr($data, $rest_idx, 4);
      $rest_len -= 4;
      $rest_idx += 4;
      $info = unpack("ntag/nlen", $mah);
      if($info["len"] > $rest_len) {
        $mappedIP   = "<span style='color:red;'>failed</span>";
        $mappedPort = "<span style='color:red;'>error1</span>";
        break;
      }

      $v = substr($data, $rest_idx, $info["len"]);
      $rest_len -= $info["len"];
      $rest_idx += $info["len"];
      if($info["tag"] === $MAPPED_ADDRESS) {
        if($info["len"] !== 8) {
          $mappedIP   = "<span style='color:red;'>failed</span>";
          $mappedPort = "<span style='color:red;'>error2</span>";
          break;
        }
        $info = unpack("Cfirst/Cflag/nport/C4s", $v);
        if($info["flag"] !== 1) {
          $mappedIP   = "<span style='color:red;'>failed</span>";
          $mappedPort = "<span style='color:red;'>error3</span>";
          break;
        }
        $mappedIP   = sprintf("%u.%u.%u.%u", $info["s1"], $info["s2"], $info["s3"], $info["s4"]);
        $mappedPort = $info["port"];
      }
    }

    if ( 0 !== strlen($data) ) {
      return [
        "ip"         => $mappedIP,
        "port"       => $mappedPort,
        "date_check" => $start_time,
        "time_delay" => date_create()->format('Uv') - $start_time_msec,
      ];
    } else {
      return [
        "ip"         => "<span style='color:red;'>failed</span>",
        "port"       => "<span style='color:red;'>error4</span>",
        "date_check" => $start_time,
        "time_delay" => "",
      ];
    }
  }
}
