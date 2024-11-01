<?php
/**
 * Description: Creating a table of stun servers in the admin panel.
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

if ( ! defined( "ABSPATH" ) ) {
	exit();
}

class WebRTC2_List_Table_Srv extends WP_List_Table {
  /**
   * Constructor.
   */
  public function __construct() {
    parent::__construct(
      array(
        "plural"   => "",
        "singular" => "",
        "ajax"     => false,
      )
    );
  }
  public function no_items() {
    $prm_search = get_option( "webrtc2_search_srv" );
    if ( "" === $prm_search ) {
      _e( "No items found." );
    } else {
      _e( "No results were found for this filter value: " . "<b>" .$prm_search  . "</b>");
      update_option( "webrtc2_search_srv", "" );
    }
  }
  /**
   * Prepare the items for the table to process
   *
   * @return Void
   */
  public function prepare_items() {
    // default...
    $data = $this->webrtc2_table_data();
    $this->process_bulk_action();
    // search...
    if ( isset($_POST["s"]) && "" !== $_POST["s"]) {
      update_option("webrtc2_search_srv", $_POST["s"]);
      $data = $this->webrtc2_table_data($_POST["s"]);
    // paged into search...
    } else if (!isset($_POST["s"]) && "" !== get_option( "webrtc2_search_srv" ) ) {
      $data = $this->webrtc2_table_data(get_option( "webrtc2_search_srv"));
    // reset search...
    } else if ( isset($_POST["s"]) && "" === $_POST["s"] ) {
      update_option("webrtc2_search_srv", "");
      $data = $this->webrtc2_table_data();
    }

    $columns  = $this->get_columns();
    $hidden   = $this->get_hidden_columns();

    $sortable = $this->get_sortable_columns();
    $this->_column_headers = $this->get_column_info();

    /* pagination */
    $srv_per_page = $this->get_items_per_page( "srv_per_page", 50 );
    $currentPage = $this->get_pagenum();
    $totalItems = count($data);

    $data = array_slice($data,(($currentPage-1) * $srv_per_page), $srv_per_page);

    $this->set_pagination_args( array(
      "total_items" => $totalItems,
      "per_page"    => $srv_per_page,
    ) );

    $this->items = $data;
  }
  /**
   * Sorting data of table.
   *
   * @return array Bulk actions
   */
  function webrtc2_usort_reorder($a, $b) {
    // If no sort, default to user_login
    $orderby = (!empty($_GET["orderby"])) ? $_GET["orderby"] : "id";
    // If no order, default to asc
    $order = (!empty($_GET["order"])) ? $_GET["order"] : "asc";
    // Determine sort order
    $result = strnatcmp($a[$orderby], $b[$orderby]);
    // Send final sort direction to usort
    return ($order === "asc") ? $result : -$result;
  }
  /**
   * Get the table data
   *
   * @param string  $search Search.
   * @return Array
   */
  private function webrtc2_table_data($search = "") {
    global $wpdb;

    if ( !empty($search) ) {
      $result = $wpdb->get_results(
        "
        SELECT *
        FROM {$wpdb->prefix}webrtc2_stun_servers
        WHERE server_name Like '%{$search}%' OR
        ip_address Like '%{$search}%' OR
        timezone Like '%{$search}%'
        ",
        "ARRAY_A"
      );
    } else {
      $result = $wpdb->get_results(
        "
        SELECT *
        FROM {$wpdb->prefix}webrtc2_stun_servers
        ",
        "ARRAY_A"
      );
    }

    usort($result, array($this, "webrtc2_usort_reorder"));

    return $result;
  }
  /**
   * Determines list of bulk actions.
   *
   * @return array Bulk actions
   */
  public function get_bulk_actions() {
    $actions = array(
      "delete" => __( "Delete", "webrtc2" ),
      "report" => __( "Report", "webrtc2" ),
      "update" => __( "Update", "webrtc2" ),
    );
    return $actions;
  }
  /**
   * Performs bulk actions.
   */
  private function process_bulk_action() {
    global $wpdb;

    $_id = filter_input( INPUT_POST, "id", FILTER_DEFAULT, FILTER_REQUIRE_ARRAY );

    // security check.
    if ( isset( $_POST["_wpnonce"] ) && ! empty( $_POST["_wpnonce"] ) ) {

      $nonce  = filter_input( INPUT_POST, "_wpnonce", FILTER_DEFAULT );
      $action = "bulk-" . $this->_args["plural"];

      if ( ! wp_verify_nonce( $nonce, $action ) ) {
        wp_die( "Security check failed." );
      }
    }

    $action = $this->current_action();

    switch( $action ) {
      case "delete":
        if ($_id) {
          $ids = implode( ",", $_id );
          $result = $wpdb->query(
            "
            DELETE
            FROM {$wpdb->prefix}webrtc2_stun_servers
            WHERE `id` IN ($ids)
            "
          );
        }
        break;
      case "report":
        if ($_id) {
          $_ids = implode( ",", $_id );
          $result = $wpdb->get_results(
            "
            SELECT *
            FROM {$wpdb->prefix}webrtc2_stun_servers
            WHERE `id` IN ($_ids)
            ",
            "ARRAY_A"
          );
          $this->webrtc2_create_report_stun($result);
        }
        break;
      case "update":
        if ($_id) {
          $_ids = implode( ",", $_id );
          $result = $wpdb->get_results(
            "
            SELECT *
            FROM {$wpdb->prefix}webrtc2_stun_servers
            WHERE `id` IN ($_ids)
            ",
            "ARRAY_A"
          );
          if ( !empty($result) ) {
            $this->webrtc2_update_tbl($result, "manually");
          }
        }
        break;
    }
  }
  /**
   * Update fields of tbl webrtc2_stun_servers.
   *
   * @param array $result Selected records of tbl.
   * @param array $repeat Update records or not (auto/manually/no).
   */
  public function webrtc2_update_tbl($result, $repeat) {
    global $wpdb;

    $val           = get_option( "webrtc2_main_settings" );
    $whois_service = isset( $val["whois_service"] ) ? esc_attr( $val["whois_service"] ) : "none";

    $stun_client = new WebRTC2_Stun_Client();

    foreach ( $result as $key => $record ) {
      $response_add = "";
      $response["time_delay"] = "";
      $arr = webrtc2_who_is( $record["server_name"], $whois_service );

      // A necessary pause, otherwise the WHO-IS service will choke.
      usleep(360000);

      if ( !empty($arr) ) {
        if ( isset($arr["ip_address"]) && filter_var($arr["ip_address"], FILTER_VALIDATE_IP) ) {
          $stun_client->createSocket();
          $stun_client->setServerAddr($record["id"], $arr["ip_address"], $record["port"]);
          $response = $stun_client->getPublicIp();
          $stun_client->closeSocket();

          if ("no" === $repeat ) {
            $response_add = $response["ip"] . " :" . $response["port"];
          } else {
            $response_add = $response["ip"] . " :" . $response["port"] . " " . $repeat;
          }

          $wpdb->update( $wpdb->prefix . "webrtc2_stun_servers",
            [
            "ip_address"   => $arr["ip_address"],
            "provider"     => $arr["provider"],
            "country"      => $arr["country"],
            "timezone"     => $arr["timezone"],
            "check_date"   => current_time("mysql"),
            "response"     => $response_add,
            "time_delay"   => $response["time_delay"],
            ],
            [ 'ID' => $record["id"] ]
          );
        }
      } else {
        $wpdb->update( $wpdb->prefix . "webrtc2_stun_servers",
          [
          "ip_address" => "<span style='color:red;'>failed</span>",
          "provider"   => "<span style='color:red;'>failed</span>",
          "country"    => "<span style='color:red;'>failed</span>",
          "timezone"   => "<span style='color:red;'>failed</span>",
          "check_date" => current_time("mysql"),
          "response"   => "",
          "time_delay" => "",
          ],
          [ "id" => $record["id"] ]
        );
      }
    }
  }
  /**
   * Create report file of WP-WebRTC2: stun servers
   *
   * @param array $result Selected records for report.
   */
  public function webrtc2_create_report_stun($result) {
    WP_Filesystem();
    global $wp_filesystem;

    $path = plugin_dir_path(__FILE__) . "/report";

    $tbody = "";
    foreach ( $result as $key => $tr_value ) {
      $tr = "";
      $td = "";
      foreach ( $tr_value as $key => $td_value ) {
        $td = $td . "<td>" . $td_value . "</td>";
      }
      $tr = "<tr>" . $td . "</tr>";
      $tbody = $tbody . $tr;
    }

    $tbody = "<tbody>" . $tbody . "</tbody>";

    $table = "
    <table>
    <thead>
    <tr>
    <th>№</th>
    <th>Server name</th>
    <th>Port</th>
    <th>IP address</th>
    <th>Provider IP</th>
    <th>Country</th>
    <th>Time zone</th>
    <th>Check date</th>
    <th>Response</th>
    <th>Time delay</th>
    </tr>
    </thead>" .
    $tbody .
    "
    </table>
    ";

    $copyright = "Belarus, Minsk © 2019. Developer: Oleg Klenitsky";
    $foot = "<footer><img src='" . plugins_url( "doc/img/BY.gif" , __FILE__ ) ."'>" . $copyright . "</footer>";

    $template = "
    <!doctype html>
    <html lang='en'>
    <head>
      <meta charset='utf-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <title>Report of WP-WebRTC2: stun servers</title>
      <style type='text/css'>
        table: {
          width: 100%;
          border: 1px solid black;
        }
        th {
          background-color: #E0E0E0;
          border: 1px solid black;
        }
        td {
          border: 1px solid black;
        }
      </style>
    </head>
    <body>
    <h1>Report of WP-WebRTC2: stun servers (" . current_time('mysql') . ")</h1>" .
    $table . $foot .
    "</body></html>";

    if ($wp_filesystem->exists($path)) {
      $wp_filesystem->put_contents( $path . "/report.html", $template, FS_CHMOD_FILE );
    }
  }
  /**
   * Override the parent columns method. Defines the columns to use in your listing table
   *
   * @return Array
   */
  public function get_columns() {
    $columns = array(
      "cb"           => "<input type='checkbox'/>",
      "id"           => __( "№", "webrtc2" ),
      "server_name"  => __( "Server name", "webrtc2" ),
      "port"         => __( "Port", "webrtc2" ),
      "ip_address"   => __( "IP address", "webrtc2" ),
      "provider"     => __( "Provider", "webrtc2" ),
      "country"      => __( "Country", "webrtc2" ),
      "timezone"     => __( "Time zone", "webrtc2" ),
      "check_date"   => __( "Check date", "webrtc2" ),
      "response"     => __( "Response", "webrtc2" ),
      "time_delay"   => __( "Time delay", "webrtc2" ),
    );

    echo '<style type="text/css">';
    echo '.wp-list-table .column-cb { width: 2%; }';
    echo '.wp-list-table .column-id { width: 5%; }';
    echo '.wp-list-table .column-server_name { width: 12%; }';
    echo '.wp-list-table .column-port { width: 6%; }';
    echo '.wp-list-table .column-ip_address { width: 11%; }';
    echo '.wp-list-table .column-provider { width: 12%; }';
    echo '.wp-list-table .column-country { width: 11%; }';
    echo '.wp-list-table .column-timezone { width: 12%; }';
    echo '.wp-list-table .column-check_date { width: 10%; }';
    echo '.wp-list-table .column-response { width: 10%; }';
    echo '.wp-list-table .column-time_delay { width: 9%; }';
    echo '</style>';

    return $columns;
  }
  /**
   * Fills table cells with data in column cb (column 0).   intval($item[ $column_name ])
   *
   * @param  array  Content cell of table.
   * @return string sprintf(...)
   */
  public function column_cb( $item ) {
    return sprintf(
      "<input type='checkbox' name='id[]' value='%s' />", $item["id"]
    );
  }
  /**
   * Define which columns are hidden.
   *
   * @return Array
   */
  public function get_hidden_columns() {
    $hidden_cols = array();

    return $hidden_cols;
  }
  /**
   * Define the sortable columns
   *
   * @return Array
   */
  public function get_sortable_columns() {
    $sortable_columns = array(
      "id"           => array( "id", true ),
      "server_name"  => array( "server_name", true ),
      "port"         => array( "port", true ),
      "ip_address"   => array( "ip_address", true ),
      "provider"     => array( "provider", true ),
      "country"      => array( "country", true ),
      "timezone"     => array( "timezone", true ),
      "check_date"   => array( "check_date", true ),
      "response"     => array( "response", true ),
      "time_delay"   => array( "time_delay", true ),
    );
    return $sortable_columns;
  }
  /**
   * Define what data to show on each column of the table
   *
   * @param  Array $item         Data
   * @param  String $column_name Current column name
   *
   * @return Mixed
   */
  public function column_default( $item, $column_name ) {
    WP_Filesystem();
    global $wp_filesystem;

    switch( $column_name ) {
      case "id":
      case "server_name":
      case "port":
      case "ip_address":
      case "provider":
      case "timezone":
      case "check_date":
      case "country":
        $plugin_dir = plugin_dir_path( __FILE__ );
        $dir_flags  = $wp_filesystem->find_folder($plugin_dir . "images/flags/");
        $data       = explode("<br>", $item[ $column_name ]);
        $file       = trailingslashit($dir_flags) . $data[0] . ".gif";
        if ($wp_filesystem->exists($file)) {
          $plugin_url = plugins_url();
          $path_img = set_url_scheme( $plugin_url."/wp-webrtc2/", "https" )."images/flags/".$data[0].".gif";
          $img_flag = "<image src='$path_img' >";
        }else{
          $img_flag = "";
        }
        return $img_flag . $item[ $column_name ];
      case "response":
        return $item[ $column_name ];
      case "time_delay":
        if ("" !== $item[ $column_name ]) {
          return $item[ $column_name ] . " msec";
        }
    }
  }
}
