<?php
/**
 * Description: Takes the IP of the visitor. Returns an array of information about IP.
 *
 * PHP version 8.0.1
 *
 * @category module
 * @package  includes
 * @author   Oleg Klenitsky <klenitskiy.oleg@mail.ru>
 * @version  1.7.4
 * @license  GPLv2 or later
 * @filesource
 */

if ( ! defined( "ABSPATH" ) ) {
	exit();
}

/**
 * Select name of WHO-IS provider.
 *
 * @param  string $ip_or_dns IP or DNS of server.
 * @param  string $who_is    Name of who is provider.
 * @return array.
 */
function webrtc2_who_is( $ip_or_dns, $who_is ) {
	if (filter_var($ip_or_dns, FILTER_VALIDATE_IP)) {
		$user_ip = $ip_or_dns;
	} else {
		$user_ip = gethostbyname($ip_or_dns);
		if (false === filter_var($user_ip, FILTER_VALIDATE_IP)) {
			$result = array();
			$result["failed"] = "IP no valid";
			$result["user_ip"] = "";
			$result["ip_or_dns"] = $ip_or_dns;
			$result["who_is"] = $who_is;

			$who_is = "";
		}
	}
	switch ( $who_is ) {
		case "IP-API":
			$result = webrtc2_ip_api( $user_ip );
			break;
		case "IP-Info":
			$result = webrtc2_ip_info( $user_ip );
			break;
		case "SxGeo":
			$result = webrtc2_sx_geo( $user_ip );
			break;
		case "Geobytes":
			$result = webrtc2_geobytes( $user_ip );
			break;
		case "none":
			$result["failed"] = "WHO-IS service: None";
			break;
	}
	return $result;
}
/**
 * Retrieve ip information from the provider IP_API.
 *
 * @param  string $user_ip User ip.
 * @return array In format json.
 */
function webrtc2_ip_api( $user_ip ) {
	WP_Filesystem();
	global $wp_filesystem;

	$str_info = array();
	// Receiving data from API  JSON - format.
	$geo_request = "http://ip-api.com/json/" . $user_ip;
	$geo_info_json = $wp_filesystem->get_contents( $geo_request );

	// Receiving data from API  JSON - format.
	$country_info = json_decode($geo_info_json, true );

	if ( is_null($country_info) || 0 === count($country_info) || "fail" === $country_info["status"] ) {
		$result = array();
		$result["failed"] = "No data (Provider: IP-API, User IP: " . $user_ip . ")";
		return $result;
	}

	// get user country code.
	$country_code = isset( $country_info["countryCode"] ) ? sanitize_text_field( $country_info["countryCode"] ) : "";

	// get user country name.
	$country_name = webrtc2_country_name( $country_code );
	// get user country region.
	$region = isset( $country_info["regionName"] ) ? sanitize_text_field( $country_info["regionName"] ) : "";
	// get user country city.
	$city = isset( $country_info["city"] ) ? sanitize_text_field( $country_info["city"] ) : "";
	// info.
	$str_info["country"]  = $country_code .
							"<br>Country: " . $country_name .
							"<br>Region: " . $region .
							"<br>City: " . $city;
	$provider             = isset( $country_info["as"] ) ? $country_info["as"] : "";
	$str_info["provider"] = $provider;
	// timezone.
	$timezone             = isset( $country_info["timezone"] ) ? $country_info["timezone"] : "";
	$str_info["timezone"] = $timezone;
	// IP address.
	$str_info["ip_address"] = $user_ip;
	// coordinates.
	$lat = isset( $country_info["lat"] ) ? sanitize_text_field( $country_info["lat"] ) : "";
	$lon = isset( $country_info["lon"] ) ? sanitize_text_field( $country_info["lon"] ) : "";

	$position = array("latitude"=>$lat, "longitude"=>$lon);
	$str_info["geo_ip"] = json_encode( $position );

	return $str_info;
}
/**
 * Retrieve ip information from the provider IP_info.
 *
 * @param  string $user_ip User ip.
 * @return array In format json.
 */
function webrtc2_ip_info( $user_ip ) {
	WP_Filesystem();
	global $wp_filesystem;

	$str_info = array();
	// Receiving data from API  JSON - format.
	$geo_request = "http://ipinfo.io/" . $user_ip . "/json";
	$geo_info_json = $wp_filesystem->get_contents( $geo_request );

	// Receiving data from API  JSON - format.
	$country_info = json_decode( $geo_info_json, true );

	if ( isset($country_info["error"]) ) {
		$result = array();
		$result["failed"] = "No data (Provider: IP-Info, User IP: " . $user_ip . ")";
		return $result;
	}

	// get user country code.
	$country_code = isset( $country_info["country"] ) ? sanitize_text_field( $country_info["country"] ) : "";

	// get user country name.
	$country_name = webrtc2_country_name( $country_code );
	// get user country region.
	$region = isset( $country_info["region"] ) ? sanitize_text_field( $country_info["region"] ) : "";
	// get user country city.
	$city = isset( $country_info["city"] ) ? sanitize_text_field( $country_info["city"] ) : "";
	// info.
	$str_info["country"]  = $country_code .
							"<br>Country: " . $country_name .
							"<br>Region: " . $region .
							"<br>City: " . $city;
	$provider             = isset( $country_info["org"] ) ? $country_info["org"] : "";
	$str_info["provider"] = $provider;
	// timezone.
	$timezone             = isset( $country_info["timezone"] ) ? $country_info["timezone"] : "";
	$str_info["timezone"] = $timezone;
	// IP address.
	$str_info["ip_address"] = $user_ip;
	// coordinates.
	$loc = isset( $country_info["loc"] ) ? explode(",", $country_info["loc"]) : "";
	$lat = isset( $loc[0] ) ? sanitize_text_field( $loc[0] ) : "";
	$lon = isset( $loc[1] ) ? sanitize_text_field( $loc[1] ) : "";

	$position = array("latitude"=>$lat, "longitude"=>$lon);
	$str_info["geo_ip"] = json_encode( $position );

	return $str_info;
}
/**
 * Retrieve ip information from the provider SxGeo.
 *
 * @param  string $user_ip User ip.
 * @return array In format json.
 */
function webrtc2_sx_geo( $user_ip ) {
	WP_Filesystem();
	global $wp_filesystem;

	$str_info = array();
	// Receiving data from API  JSON - format.
	$geo_request = "https://api.sypexgeo.net/json/" . $user_ip;
	$geo_info_json = $wp_filesystem->get_contents( $geo_request );

	// Receive associative array with result of request to API.
	$country_info = json_decode( $geo_info_json, true );

	if ( 0 === count($country_info) || is_null($country_info["country"]) ) {
		$result = array();
		$result["failed"] = "No data (Provider: SxGeo, User IP: " . $user_ip . ")";
		return $result;
	}

	// get user country code.
	$country_code = isset( $country_info["country"]["iso"] ) ? sanitize_text_field( $country_info["country"]["iso"] ) : "";

	// get user country name.
	$country_name = webrtc2_country_name( $country_code );
	// get user country region.
	$region = isset( $country_info["region"]["name_en"] ) ? sanitize_text_field( $country_info["region"]["name_en"] ) : "";
	// get user country city.
	$city = isset( $country_info["city"]["name_en"] ) ? sanitize_text_field( $country_info["city"]["name_en"] ) : "";
	// info.
	$str_info["country"]  = $country_code .
							"<br>Country: " . $country_name .
							"<br>Region: " . $region .
							"<br>City: " . $city;
	$provider             = "";
	$str_info["provider"] = $provider;
	// timezone.
	$timezone = isset( $country_info["country"]["timezone"] ) ? $country_info["country"]["timezone"] : "";
	$str_info["timezone"] = $timezone;
	// IP address.
	$str_info["ip_address"] = $user_ip;
	// coordinates.
	$lat = isset( $country_info["city"]["lat"] ) ? sanitize_text_field( $country_info["city"]["lat"] ) : "";
	$lon = isset( $country_info["city"]["lon"] ) ? sanitize_text_field( $country_info["city"]["lon"] ) : "";

	$position = array("latitude"=>$lat, "longitude"=>$lon);
	$str_info["geo_ip"] = json_encode( $position );

	return $str_info;
}
/**
 * Retrieve ip information from the provider Geobytes.
 *
 * @param  string $user_ip User ip.
 * @return array In format json.
 */
function webrtc2_geobytes( $user_ip ) {
	WP_Filesystem();
	global $wp_filesystem;

	$str_info = array();
	// Receiving data from API  JSON - format.
	$geo_request = "https://getcitydetails.geobytes.com/GetCityDetails?key=7c756203dbb38590a66e01a5a3e1ad96&fqcn=" . $user_ip;
	$geo_info_json = $wp_filesystem->get_contents( $geo_request );

	// Receive associative array with result of request to API.
	$country_info = json_decode( $geo_info_json, true );

	if ( is_null($country_info) || 0 === count($country_info) ) {
		$result = array();
		$result["failed"] = "No data (Provider: Geobytes, User IP: " . $user_ip . ")";
		return $result;
	}

	// get user country code.
	$country_code = isset($country_info["geobytesinternet"]) ? sanitize_text_field( $country_info["geobytesinternet"] ) : "";

	// get user country name.
	$country_name = webrtc2_country_name( $country_code );
	// get user country region.
	$region = isset( $country_info["geobytesregion"] ) ? sanitize_text_field( $country_info["geobytesregion"] ) : "";
	// get user country city.
	$city = isset( $country_info["geobytescity"] ) ? sanitize_text_field( $country_info["geobytescity"] ) : "";
	// info.
	$str_info["country"]  = $country_code .
							"<br>Country: " . $country_name .
							"<br>Region: " . $region .
							"<br>City: " . $city;
	$provider             = "";
	$str_info["provider"] = $provider;
	// IP address.
	$str_info["ip_address"] = $user_ip;
	// coordinates.
	$lat = isset( $country_info["geobyteslatitude"] ) ? sanitize_text_field( $country_info["geobyteslatitude"] ) : "";
	$lon = isset( $country_info["geobyteslongitude"] ) ? sanitize_text_field( $country_info["geobyteslongitude"] ) : "";

	// timezone.
	if ( "" !== $lat && "" !== $lon ) {
		$str_info["timezone"] = webrtc2_getClosestTimezone( $lat, $lon );
	} else {
		$str_info["timezone"] = "";
	}

	$position = array("latitude"=>$lat, "longitude"=>$lon);
	$str_info["geo_ip"] = json_encode( $position );

	return $str_info;
}
/**
 * Retrieve information of country of visitor.
 *
 * @param  string $country_code Country code.
 * @return string User country name.
 */
function webrtc2_country_name( $country_code ) {
	global $wpdb;

	$results = $wpdb->get_var(
		$wpdb->prepare(
			"
      SELECT `name`
      FROM {$wpdb->prefix}webrtc2_countries
      WHERE `code` = %s
      ",
			$country_code
		)
	);

	return $results;
}
/**
 * Attempts to find the closest timezone by coordinates.
 *
 * @param  string $lat Latitude.
 * @param  string $lon Longitude.
 *
 * @return string Timezone.
 */
function webrtc2_getClosestTimezone( $lat, $lon ) {
	$diffs = array();

  foreach(DateTimeZone::listIdentifiers() as $timezoneID) {
    $timezone = new DateTimeZone($timezoneID);
    $location = $timezone->getLocation();
    $tLat = $location["latitude"];
    $tLon = $location["longitude"];
    $diffLat = abs($lat - $tLat);
    $diffLon = abs($lon - $tLon);
    $diff = $diffLat + $diffLon;
    $diffs[$timezoneID] = $diff;

  }

  //asort($diffs);
  $timezone = array_keys($diffs, min($diffs));

  return $timezone[0];
}
