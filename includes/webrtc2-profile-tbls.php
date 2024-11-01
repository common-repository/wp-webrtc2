<?php
/**
 * Description: Prepare tables for Profile: tbl_users, tbl_contact.
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

/**
 * Prepare table for Profile: tbl_users.
 *
 *  @param string $id $user->ID.
 */
function webrtc2_tbl_users($id) {
  WP_Filesystem();
  global $wp_filesystem;

  ?>
    <div class="caption_tbl">
      <h4>Registered users</h4>
    </div>
    <div class="head_tbl">
      <h4>#</h4>
      <h4>Name</h4>
      <h4>Role</h4>
      <h4>Land</h4>
    </div>
    <div class="body_tbl" id="users_tbody">
    <?php
      $hostId_data = get_userdata( $id );

      $val_users = get_option( "webrtc2_main_settings" );
      $val_users = isset( $val_users["enabled_for"] ) ? $val_users["enabled_for"] : "registered";

      if ("registered" === $val_users) {
        $users = get_users();
      } else {
        $users = get_users("role=" . $val_users);
      }

      $users_list = get_user_meta($hostId_data->ID, "сontacts_group", true);
      $arr_users = explode(";", $users_list);

      foreach ( $users as $user ) {

        if (!isset($user->roles[0]) || "administrator" === $user->roles[0] ) continue;
        // when the administrator adjusts the user profile.
        if ($user->ID === $id) continue;

        $pos = strpos($users_list, $user->user_login);
        if ($hostId_data->user_login !== $user->user_login && false === in_array($user->user_login, $arr_users) ) {
          $avatar       = get_avatar( $user->ID, 20 );
          $user_meta    = get_user_meta( $user->ID );
          $user_country = isset($user_meta["user_country_code"]) ? array_shift( $user_meta["user_country_code"] ) : "";
          $user_city    = isset($user_meta["user_city"]) ? array_shift( $user_meta["user_city"] ) : "";
          ?>
          <div class="tbody_fields">
            <input type="checkbox" name="users_site">
            <div style="display: flex;flex-direction: row;flex:2;">
              <?php echo( $avatar ); ?>
              <label><?php echo __( " " . $user->user_login ); ?></label>
            </div>
            <div style="display: flex;flex-direction: row;flex:2;">
              <label><?php echo __( $user->roles[0] ); ?></label>
            </div>
            <?php
            $img_flag = "";

            if ( is_dir( WP_PLUGIN_DIR . "/wp-webrtc2/" ) ) {
              $dir  = $wp_filesystem->find_folder(WP_PLUGIN_DIR . "/wp-webrtc2/images/flags/");
              $file = trailingslashit($dir) . $user_country . ".gif";

              if ($wp_filesystem->exists($file)) {
                $path_img = set_url_scheme( WP_PLUGIN_URL . "/wp-webrtc2/", "https" ) . "images/flags/" . $user_country . ".gif";
                $img_flag = "<image src='$path_img' >";
              }else{
                $img_flag = "";
                $user_country = "-";
              }
              ?>
              <div>
                <?php echo ( $img_flag ); ?>
                <label title="City:<?php echo __( $user_city ); ?>"><?php echo __( $user_country ); ?></label>
              </div>
            <?php
            }else{
              ?>
              <label>-</label>
              <?php
            }
          ?>
          </div>
          <?php
        }
      }
    ?>
    </div>
    <div class="foot_tbl">
      <input type="text" id="fld_users_search" placeholder="Name...">
      <input type="button" class="btn" id="btn_users_search" onClick="webrtc2_search_user_profile()" value="Search">
    </div>
  <?php
}

/**
 * Prepare table for Profile: tbl_contact.
 */
function webrtc2_tbl_contact() {
  WP_Filesystem();
  global $wp_filesystem;

  $hostId_data = wp_get_current_user();
  $hostId_role = isset($hostId_data->roles[0]) ? $hostId_data->roles[0] : "";

  if ( "administrator" !== $hostId_role ) {
    $current_user_id = get_current_user_id();
  } else {
    $current_user_id = filter_input( INPUT_GET, "user_id", FILTER_DEFAULT );
  }

  $hostId_data = get_userdata( $current_user_id );
  $users_list  = get_user_meta($hostId_data->ID, "сontacts_group", true);

  ?>
    <div class="caption_tbl">
      <h4>Contact List</h4>
    </div>
    <div class="head_tbl">
      <h4>#</h4>
      <h4>Name</h4>
      <h4>Role</h4>
      <h4>Land</h4>
    </div>
    <div class="body_tbl" id="contact_tbody">
      <?php
      if ("all_users" !== $users_list) {
        $users_list = explode(";", $users_list);
        foreach ($users_list as $user) {
          if ( username_exists( $user )) {
            $user_data    = get_user_by("login", $user);
            $avatar       = get_avatar( $user_data->ID, 20 );
            $user_meta    = get_user_meta( $user_data->ID );
            $user_country = isset($user_meta["user_country_code"]) ? array_shift( $user_meta["user_country_code"] ) : "";
            $user_city    = isset($user_meta["user_city"]) ? array_shift( $user_meta["user_city"] ) : "";
            ?>
            <div class="tbody_fields">
              <input type="checkbox" name="users_site">
              <div style="display: flex;flex-direction: row;flex:2;">
                <?php echo( $avatar ); ?>
                <label><?php echo __( " " . $user_data->user_login ); ?></label>
              </div>
              <div style="display: flex;flex-direction: row;flex:2;">
                <label><?php echo __( array_shift($user_data->roles )); ?></label>
              </div>
              <?php
              $img_flag = "";

              if ( is_dir( WP_PLUGIN_DIR . "/wp-webrtc2/" ) ) {
                $dir  = $wp_filesystem->find_folder(WP_PLUGIN_DIR . "/wp-webrtc2/images/flags/");
                $file = trailingslashit($dir) . $user_country . ".gif";

                if ($wp_filesystem->exists($file)) {
                  $path_img = set_url_scheme( WP_PLUGIN_URL . "/wp-webrtc2/", "https" ) . "images/flags/" . $user_country . ".gif";
                  $img_flag = "<image src='$path_img' >";
                }else{
                  $img_flag = "";
                  $user_country = "-";
                }
                ?>
                <div>
                  <?php echo ( $img_flag ); ?>
                  <label title="City:<?php echo __( $user_city ); ?>"><?php echo __( $user_country ); ?></label>
                </div>
              <?php
              }else{
                ?>
                <label>-</label>
                <?php
              }
              ?>
            </div>
            <?php
          }
        }
      }
      ?>
    </div>
    <div class="foot_tbl">
      <input type="text" id="fld_contact_search" placeholder="Name...">
      <input type="button" class="btn" id="btn_contact_search" onClick="webrtc2_search_contact_profile()" value="Search">
    </div>
  <?php
}
