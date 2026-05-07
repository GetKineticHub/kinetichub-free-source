<?php
/**
 * Uninstall cleanup for kinetichub.
 *
 * @package kinetichub
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/*
 * Keep uninstall conservative for WordPress.org:
 * - remove only plugin-owned options/transients;
 * - do not touch posts, reusable blocks, uploaded media, or third-party data.
 */

delete_option( 'kinetichub_version' );
delete_option( 'kinetichub_settings' );
delete_option( 'kinetichub_admin_notice_dismissed' );

delete_site_option( 'kinetichub_version' );
delete_site_option( 'kinetichub_settings' );
delete_site_option( 'kinetichub_admin_notice_dismissed' );

global $wpdb;

if ( isset( $wpdb ) && $wpdb instanceof wpdb ) {
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
			$wpdb->esc_like( '_transient_kinetichub_' ) . '%'
		)
	);

	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
			$wpdb->esc_like( '_transient_timeout_kinetichub_' ) . '%'
		)
	);

	if ( is_multisite() ) {
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->sitemeta} WHERE meta_key LIKE %s",
				$wpdb->esc_like( '_site_transient_kinetichub_' ) . '%'
			)
		);

		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->sitemeta} WHERE meta_key LIKE %s",
				$wpdb->esc_like( '_site_transient_timeout_kinetichub_' ) . '%'
			)
		);
	}
}