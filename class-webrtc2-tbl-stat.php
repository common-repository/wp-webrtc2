<?php
/**
 * Description: Creating a table of user call statistics in the admin panel.
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

class WebRTC2_List_Table_Stat extends WP_List_Table {
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
		$prm_search = get_option( "webrtc2_search_stat" );
		if ( "" === $prm_search ) {
			_e( "No items found." );
		} else {
			_e( "No results were found for this filter value: " . "<b>" .$prm_search  . "</b>");
			update_option( "webrtc2_search_stat", "" );
		}
	}
	/**
	 * Prepare the items for the table to process
	 *
	 * @return Void
	 */
	public function prepare_items()	{
		// default...
		$data = $this->webrtc2_table_data();
		$this->process_bulk_action();
		// search...
		if ( isset($_POST["s"]) && "" !== $_POST["s"]) {
			update_option("webrtc2_search_stat", $_POST["s"]);
      $data = $this->webrtc2_table_data($_POST["s"]);
    // paged into search...
    } else if (!isset($_POST["s"]) && "" !== get_option( "webrtc2_search_stat" ) ) {
    	$data = $this->webrtc2_table_data(get_option( "webrtc2_search_stat"));
    // reset search...
    } else if ( isset($_POST["s"]) && "" === $_POST["s"] ) {
    	update_option("webrtc2_search_stat", "");
      $data = $this->webrtc2_table_data();
    }

    $columns  = $this->get_columns();
    $hidden   = $this->get_hidden_columns();

    $sortable = $this->get_sortable_columns();
    $this->_column_headers = $this->get_column_info();

    /* pagination */
    $stat_per_page = $this->get_items_per_page( "stat_per_page", 8 );
    $currentPage = $this->get_pagenum();
    $totalItems = count($data);

    $data = array_slice($data,(($currentPage-1) * $stat_per_page), $stat_per_page);

    $this->set_pagination_args( array(
      "total_items" => $totalItems,
      "per_page"    => $stat_per_page,
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
	private function webrtc2_table_data($search = "")	{
		global $wpdb;

		if ( !empty($search) ) {
			$result = $wpdb->get_results(
				"
				SELECT *
				FROM {$wpdb->prefix}webrtc2_call_stat
				WHERE user_name Like '%{$search}%' OR
				role Like '%{$search}%' OR
				user_ip Like '%{$search}%' OR
				browser Like '%{$search}%'
				",
				"ARRAY_A"
			);
		} else {
			$result = $wpdb->get_results(
				"
				SELECT *
				FROM {$wpdb->prefix}webrtc2_call_stat
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
        $action = 'bulk-' . $this->_args["plural"];

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
						FROM {$wpdb->prefix}webrtc2_call_stat
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
		        FROM {$wpdb->prefix}webrtc2_call_stat
		        WHERE `id` IN ($_ids)
		        ",
						"ARRAY_A"
					);
					$this->webrtc2_create_report_stat($result);

				}
        break;
    }
	}
	/**
	 * Create report file of WP-WebRTC2: call statistics
	 *
	 * @param array $result Selected records for report.
	 */
	public function webrtc2_create_report_stat($result) {
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
		<th>Session ID</th>
		<th>User name</th>
		<th>Role</th>
		<th>Initiator</th>
		<th>User IP</th>
		<th>Country</th>
		<th>Date start</th>
		<th>Date stop</th>
		<th>Browser</th>
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
		  <title>Report of WP-WebRTC2: call statistics</title>
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
		<h1>Report of WP-WebRTC2: call statistics (" . current_time('mysql') . ")</h1>" .
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
	public function get_columns()	{
    $columns = array(
      "cb"          => "<input type='checkbox'/>",
			"id"          => __( "№", "webrtc2" ),
			"session_id"  => __( "Session ID", "webrtc2" ),
			"user_name"   => __( "User name", "webrtc2" ),
			"role"        => __( "Role", "webrtc2" ),
			"initiator"   => __( "Initiator", "webrtc2" ),
			"user_ip"     => __( "User IP", "webrtc2" ),
			"country"     => __( "Country", "webrtc2" ),
			"date_start"  => __( "Date start", "webrtc2" ),
			"date_stop"   => __( "Date stop", "webrtc2" ),
			"browser"     => __( "Browser", "webrtc2" ),
    );

    echo '<style type="text/css">';
    echo '.wp-list-table .column-cb { width: 2%; }';
	  echo '.wp-list-table .column-id { width: 5%; }';
	  echo '.wp-list-table .column-session_id { width: 9%; }';
	  echo '.wp-list-table .column-user_name { width: 12%; }';
	  echo '.wp-list-table .column-role { width: 8%; }';
	  echo '.wp-list-table .column-initiator { width: 8%; }';
	  echo '.wp-list-table .column-user_ip { width: 9%; }';
	  echo '.wp-list-table .column-country { width: 14%; }';
	  echo '.wp-list-table .column-date_start { width: 10%; }';
	  echo '.wp-list-table .column-date_stop { width: 10%; }';
	  echo '.wp-list-table .column-browser { width: 13%; }';
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
			"<input type='checkbox' name='id[]' value='%s' />",	$item["id"]
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
			"id"         => array( "id", true ),
			"session_id" => array( "session_id", true ),
			"user_name"  => array( "user_name", true ),
			"role"       => array( "role", true ),
			"initiator"  => array( "initiator", true ),
			"user_ip"    => array( "user_ip", true ),
			"country"    => array( "country", true ),
			"date_start" => array( "date_start", true ),
			"date_stop"  => array( "date_stop", true ),
			"browser"    => array( "browser", true ),
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
      case "user_name":
      	$login = explode(" ", $item[ $column_name ]);
      	if (username_exists($login[0])) {
    			$hostId_data   = get_user_by( "login", $login[0] );
      		$hostId_avatar = get_avatar( $hostId_data->ID, 20 );
      		return $hostId_avatar . $item[ $column_name ];
      	}else{
      		return $item[ $column_name ];
      	}
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
			case "initiator":
			 	if(1  == $item[ $column_name ]) return "yes";
				if(0  == $item[ $column_name ]) return "no";
      case "id":
      case "session_id":
      case "role":
      case "user_ip":
      case "browser":
        return $item[ $column_name ];
      case "date_start":
      case "date_stop":
      	if ("" !==$item[ $column_name ]) {
      		return $item[ $column_name ];
      	}else{
      		return "";
      	}
    }
	}
}
