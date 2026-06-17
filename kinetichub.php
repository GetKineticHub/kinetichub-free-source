<?php
/**
 * Plugin Name: KineticHub - Animated Gutenberg Blocks
 * Plugin URI: https://getkinetichub.com
 * Description: Animated Gutenberg blocks for WordPress with motion, media, typography, sliders, marquees, and interactive visual effects.
 * Version: 1.0.7
 * Author: kinetichub
 * Text Domain: kinetichub
 * Domain Path: /languages
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'kinetichub_PATH', plugin_dir_path( __FILE__ ) );
define( 'kinetichub_URL', plugin_dir_url( __FILE__ ) );
define( 'kinetichub_VERSION', '1.0.7' );

class kinetichub_Suite {
	private static $instance = null;
	private $settings        = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'register_blocks' ) );
		add_filter( 'block_categories_all', array( $this, 'register_block_category' ), 10, 2 );
		add_action( 'admin_menu', array( $this, 'register_dashboard_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_frontend_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_global_tokens' ), 5 );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_global_tokens' ), 5 );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	private function __clone() {}

	public function __wakeup() {
		throw new \Exception( 'Cannot unserialize singleton' );
	}

	private function get_valid_blocks() {
		return array(
			'kinetic-ambient-aura',
			'kinetic-audio-player',
			'kinetic-before-after',
			'kinetic-box',
			'kinetic-cursor-reveal',
			'kinetic-hero-mesh',
			'kinetic-magnetic-button',
			'kinetic-marquee',
			'kinetic-scroll-divider',
			'kinetic-split-scroll',
			'kinetic-typography',
			'kinetic-video-modal',
		);
	}

	private function get_default_settings() {
		$active_blocks = array();

		foreach ( $this->get_valid_blocks() as $block_name ) {
			$active_blocks[ $block_name ] = true;
		}

		return array(
			'activeBlocks'       => $active_blocks,
			'performanceMode'    => 'balanced',
			'globalLerp'         => 0.08,
			'glassIntensity'     => 20,
			'enableMobileMotion' => true,
			'assetOptimization'  => true,
			'accentColor'        => '#10b981',
		);
	}

	private function normalize_settings( $settings ) {
		$settings = is_array( $settings ) ? $settings : array();
		$defaults = $this->get_default_settings();

		$normalized = $defaults;

		if ( isset( $settings['activeBlocks'] ) && is_array( $settings['activeBlocks'] ) ) {
			foreach ( $this->get_valid_blocks() as $block_name ) {
				if ( array_key_exists( $block_name, $settings['activeBlocks'] ) ) {
					$normalized['activeBlocks'][ $block_name ] = rest_sanitize_boolean( $settings['activeBlocks'][ $block_name ] );
				}
			}
		}

		$perf_modes = array( 'balanced', 'eco', 'performance' );

		if ( isset( $settings['performanceMode'] ) && in_array( $settings['performanceMode'], $perf_modes, true ) ) {
			$normalized['performanceMode'] = $settings['performanceMode'];
		}

		if ( isset( $settings['globalLerp'] ) ) {
			$normalized['globalLerp'] = max( 0.01, min( 0.2, floatval( $settings['globalLerp'] ) ) );
		}

		if ( isset( $settings['glassIntensity'] ) ) {
			$normalized['glassIntensity'] = max( 0, min( 50, intval( $settings['glassIntensity'] ) ) );
		}

		if ( isset( $settings['enableMobileMotion'] ) ) {
			$normalized['enableMobileMotion'] = rest_sanitize_boolean( $settings['enableMobileMotion'] );
		}

		if ( isset( $settings['assetOptimization'] ) ) {
			$normalized['assetOptimization'] = rest_sanitize_boolean( $settings['assetOptimization'] );
		}

		if ( isset( $settings['accentColor'] ) && preg_match( '/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $settings['accentColor'] ) ) {
			$normalized['accentColor'] = $settings['accentColor'];
		}

		return $normalized;
	}

	private function get_settings() {
		if ( null === $this->settings ) {
			$this->settings = $this->normalize_settings( get_option( 'kinetichub_global_settings', array() ) );
		}

		return $this->settings;
	}

	public function register_block_category( $categories, $post ) {
		return array_merge(
			array(
				array(
					'slug'  => 'kinetic-suite',
					'title' => esc_html__( 'Kinetic Suite', 'kinetichub' ),
					'icon'  => 'superhero',
				),
			),
			$categories
		);
	}

	public function register_blocks() {
		$settings      = $this->get_settings();
		$active_blocks = isset( $settings['activeBlocks'] ) ? (array) $settings['activeBlocks'] : array();

		$blocks_build_path = kinetichub_PATH . 'build/blocks/';

		foreach ( $this->get_valid_blocks() as $folder ) {
			$is_active = ! isset( $active_blocks[ $folder ] ) || false !== $active_blocks[ $folder ];

			if ( ! $is_active ) {
				continue;
			}

			$path_to_block = $blocks_build_path . $folder;

			if ( is_dir( $path_to_block ) && file_exists( $path_to_block . '/block.json' ) ) {
				register_block_type( $path_to_block );
			}
		}
	}

	public function register_frontend_assets() {
		$core_asset_path = kinetichub_PATH . 'build/core.asset.php';
		$asset_file      = file_exists( $core_asset_path ) ? include $core_asset_path : array(
			'dependencies' => array(),
			'version'      => kinetichub_VERSION,
		);

		wp_register_script(
			'kinetichub-core-engine',
			kinetichub_URL . 'build/core.js',
			isset( $asset_file['dependencies'] ) ? $asset_file['dependencies'] : array(),
			isset( $asset_file['version'] ) ? $asset_file['version'] : kinetichub_VERSION,
			true
		);

		$settings       = $this->get_settings();
		$settings_array = array(
			'globalLerp'         => isset( $settings['globalLerp'] ) ? floatval( $settings['globalLerp'] ) : 0.08,
			'enableMobileMotion' => isset( $settings['enableMobileMotion'] ) ? (bool) $settings['enableMobileMotion'] : true,
			'performanceMode'    => isset( $settings['performanceMode'] ) ? sanitize_text_field( $settings['performanceMode'] ) : 'balanced',
		);

		wp_add_inline_script(
			'kinetichub-core-engine',
			'window.kinetichubSettings = ' . wp_json_encode( $settings_array ) . ';',
			'before'
		);

		$load_in_head = isset( $settings['assetOptimization'] ) ? (bool) $settings['assetOptimization'] : true;

		if ( $load_in_head ) {
			$this->enqueue_frontend_css();
		} else {
			add_action( 'wp_footer', array( $this, 'enqueue_frontend_css' ), 5 );
		}

		do_action( 'kinetichub_frontend_assets_registered' );
	}

	public function enqueue_frontend_css() {
		if ( file_exists( kinetichub_PATH . 'assets/css/global-animations.css' ) ) {
			wp_enqueue_style(
				'kinetichub-global-animations',
				kinetichub_URL . 'assets/css/global-animations.css',
				array(),
				kinetichub_VERSION
			);
		}
	}

	public function enqueue_editor_assets() {
		if ( file_exists( kinetichub_PATH . 'assets/css/global-animations.css' ) ) {
			wp_enqueue_style(
				'kinetichub-global-animations-editor',
				kinetichub_URL . 'assets/css/global-animations.css',
				array(),
				kinetichub_VERSION
			);
		}
	}

	public function register_dashboard_menu() {
		add_menu_page(
			esc_html__( 'kinetichub', 'kinetichub' ),
			esc_html__( 'kinetichub', 'kinetichub' ),
			'manage_options',
			'kinetichub',
			array( $this, 'render_dashboard' ),
			'dashicons-superhero',
			30
		);
	}

	public function enqueue_admin_assets( $hook ) {
		if ( 'toplevel_page_kinetichub' !== $hook ) {
			return;
		}

		$asset_path = kinetichub_PATH . 'build/admin.asset.php';
		$asset_file = file_exists( $asset_path ) ? include $asset_path : array(
			'dependencies' => array( 'wp-element', 'wp-components', 'wp-dom-ready' ),
			'version'      => kinetichub_VERSION,
		);

		wp_enqueue_script(
			'kinetichub-admin-js',
			kinetichub_URL . 'build/admin.js',
			isset( $asset_file['dependencies'] ) ? $asset_file['dependencies'] : array( 'wp-element', 'wp-components', 'wp-dom-ready' ),
			isset( $asset_file['version'] ) ? $asset_file['version'] : kinetichub_VERSION,
			true
		);

		$admin_data = array(
			'pluginUrl' => kinetichub_URL,
			'nonce'     => wp_create_nonce( 'wp_rest' ),
			'restUrl'   => esc_url_raw( rest_url() ),
			'version'   => kinetichub_VERSION,
		);

		wp_add_inline_script(
			'kinetichub-admin-js',
			'window.kinetichubDashboardData = ' . wp_json_encode( $admin_data ) . ';',
			'before'
		);

		if ( file_exists( kinetichub_PATH . 'build/admin.css' ) ) {
			wp_enqueue_style(
				'kinetichub-admin-css',
				kinetichub_URL . 'build/admin.css',
				array( 'wp-components' ),
				isset( $asset_file['version'] ) ? $asset_file['version'] : kinetichub_VERSION
			);
		}
	}

	public function render_dashboard() {
		echo wp_kses(
			'<div id="kinetichub-dashboard-root"></div>',
			array(
				'div' => array(
					'id' => true,
				),
			)
		);
	}

	public function check_rest_permissions( \WP_REST_Request $request ) {
		$nonce = $request->get_header( 'X-WP-Nonce' );

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				esc_html__( 'Invalid or missing nonce.', 'kinetichub' ),
				array( 'status' => 403 )
			);
		}

		return current_user_can( 'manage_options' );
	}

	public function register_rest_routes() {
		register_rest_route(
			'kinetichub/v1',
			'/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_global_settings' ),
					'permission_callback' => array( $this, 'check_rest_permissions' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_global_settings' ),
					'permission_callback' => array( $this, 'check_rest_permissions' ),
				),
			)
		);
	}

	public function get_global_settings( \WP_REST_Request $request ) {
		return rest_ensure_response( $this->get_settings() );
	}

	public function save_global_settings( \WP_REST_Request $request ) {
		$params             = $request->get_json_params();
		$params             = is_array( $params ) ? $params : array();
		$sanitized_settings = $this->normalize_settings( $params );

		update_option( 'kinetichub_global_settings', $sanitized_settings );
		$this->settings = $sanitized_settings;

		return rest_ensure_response(
			array(
				'success'  => true,
				'settings' => $sanitized_settings,
			)
		);
	}

	public function enqueue_global_tokens() {
		$settings = $this->get_settings();
		$accent   = ! empty( $settings['accentColor'] ) ? $settings['accentColor'] : '#10b981';
		$glass    = isset( $settings['glassIntensity'] ) ? max( 0, min( 50, intval( $settings['glassIntensity'] ) ) ) : 20;

		if ( ! preg_match( '/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $accent ) ) {
			$accent = '#10b981';
		}

		$css = ":root, .editor-styles-wrapper, .block-editor-iframe__body { --kh-accent: {$accent}; --kh-glass-blur: {$glass}px; }\n";

		$handle = 'kinetichub-global-variables';
		wp_register_style( $handle, false, array(), kinetichub_VERSION );
		wp_enqueue_style( $handle );
		wp_add_inline_style( $handle, $css );
	}

	public static function hex_to_rgba( $hex, $alpha ) {
		$alpha = max( 0.0, min( 1.0, floatval( $alpha ) ) );

		if ( ! $hex || 'transparent' === $hex ) {
			return 'transparent';
		}

		if ( 0 === strpos( $hex, 'rgba' ) ) {
			return esc_attr( $hex );
		}

		$hex = preg_replace( '/[^0-9a-fA-F]/', '', $hex );

		if ( ! preg_match( '/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/', $hex ) ) {
			return "rgba(0,0,0,{$alpha})";
		}

		if ( 3 === strlen( $hex ) ) {
			$r = hexdec( str_repeat( $hex[0], 2 ) );
			$g = hexdec( str_repeat( $hex[1], 2 ) );
			$b = hexdec( str_repeat( $hex[2], 2 ) );
		} else {
			$r = hexdec( substr( $hex, 0, 2 ) );
			$g = hexdec( substr( $hex, 2, 2 ) );
			$b = hexdec( substr( $hex, 4, 2 ) );
		}

		return "rgba({$r},{$g},{$b},{$alpha})";
	}
}

kinetichub_Suite::get_instance();
