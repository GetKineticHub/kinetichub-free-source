<?php
/**
 * Plugin Name: kinetichub 
 * Plugin URI: https://getkinetichub.com
 * Description: Animated Gutenberg blocks for WordPress with motion, media, typography, sliders, marquees, and interactive visual effects.
 * Version: 1.0.0
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

//  integration.
if ( function_exists( 'kinetichub_fs' ) ) {
	kinetichub_fs()->set_basename( true, __FILE__ );
} else {
	if ( ! function_exists( 'kinetichub_fs' ) ) {
		function kinetichub_fs() {
			global $kinetichub_fs;

			if ( ! isset( $kinetichub_fs ) ) {
				require_once dirname( __FILE__ ) . '/vendor/freemius/start.php';

				$kinetichub_fs = fs_dynamic_init(
					array(
						'id'                  => '25337',
						'slug'                => 'kinetichub',
						'type'                => 'plugin',
						'public_key'          => 'pk_9390d83e31db0dee39d3b5bbb027e',
						'is_premium'          => false,
						'has_premium_version' => true,
						'has_addons'          => false,
						'has_paid_plans'      => true,
						'is_org_compliant'    => true,
						'menu'                => array(
							'support' => false,
						),
					)
				);
			}

			return $kinetichub_fs;
		}
	}

	kinetichub_fs();
	do_action( 'kinetichub_fs_loaded' );
}

define( 'kinetichub_PATH', plugin_dir_path( __FILE__ ) );
define( 'kinetichub_URL', plugin_dir_url( __FILE__ ) );
define( 'kinetichub_VERSION', '1.0.0' );

$kinetichub_is_pro_runtime = false;

if ( function_exists( 'kinetichub_fs' ) ) {
	$kinetichub_is_pro_runtime = kinetichub_fs()->can_use_premium_code();
}

define( '', $kinetichub_is_pro_runtime );

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
		add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
		add_action( 'init', array( $this, 'register_blocks' ) );
		add_filter( 'block_categories_all', array( $this, 'register_block_category' ), 10, 2 );
		add_action( 'admin_menu', array( $this, 'register_dashboard_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_frontend_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_global_tokens' ), 5 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_custom_css' ), 20 );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_global_tokens' ), 5 );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_custom_css' ), 20 );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	private function __clone() {}
	public function __wakeup() {
		throw new \Exception( 'Cannot unserialize singleton' );
	}

	private function get_settings() {
		if ( null === $this->settings ) {
			$fetched_settings = get_option( 'kinetichub_global_settings', array() );
			$this->settings   = is_array( $fetched_settings ) ? $fetched_settings : array();
		}
		return $this->settings;
	}

	public function load_textdomain() {
		load_plugin_textdomain(
			'kinetichub',
			false,
			dirname( plugin_basename( __FILE__ ) ) . '/languages'
		);
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

		$blocks = array(
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

		$blocks_build_path = kinetichub_PATH . 'build/blocks/';

		foreach ( $blocks as $folder ) {
			$is_active = ! isset( $active_blocks[ $folder ] ) || false !== $active_blocks[ $folder ];

			if ( $is_active ) {
				$path_to_block = $blocks_build_path . $folder;
				
				// Verify folder and block.json exist before registration
				if ( is_dir( $path_to_block ) && file_exists( $path_to_block . '/block.json' ) ) {
					register_block_type( $path_to_block );
				}
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
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);

		$settings       = $this->get_settings();
		$settings_array = array(
			'globalLerp'         => isset( $settings['globalLerp'] ) ? floatval( $settings['globalLerp'] ) : 0.08,
			'enableMobileMotion' => isset( $settings['enableMobileMotion'] ) ? (bool) $settings['enableMobileMotion'] : true,
			'performanceMode'    => isset( $settings['performanceMode'] ) ? sanitize_text_field( $settings['performanceMode'] ) : 'balanced',
			''              => ,
		);

		wp_add_inline_script(
			'kinetichub-core-engine',
			'window.kinetichubSettings = ' . wp_json_encode( $settings_array ) . ';',
			'before'
		);

		$load_in_head = isset( $settings['assetOptimization'] ) ? (bool) $settings['assetOptimization'] : true;

		// Frontend CSS can be loaded in head (optimized) or footer (compatibility)
		if ( $load_in_head ) {
			$this->enqueue_frontend_css();
		} else {
			add_action( 'wp_footer', array( $this, 'enqueue_frontend_css' ), 5 );
		}
		
		// Note: enqueue_global_tokens() and enqueue_custom_css() are handled via hooks in constructor

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

		$editor_data = array(
			'' => ,
		);

		wp_add_inline_script( 'wp-blocks', 'window. = ' . wp_json_encode( $editor_data ) . ';', 'before' );
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
			$asset_file['dependencies'],
			$asset_file['version'],
			true
		);

		$admin_data = array(
			'pluginUrl' => kinetichub_URL,
			'nonce'     => wp_create_nonce( 'wp_rest' ),
			'restUrl'   => esc_url_raw( rest_url() ),
			''     => ,
			'version'   => kinetichub_VERSION,
		);

		wp_add_inline_script( 'kinetichub-admin-js', 'window. = ' . wp_json_encode( $admin_data ) . ';', 'before' );

		if ( file_exists( kinetichub_PATH . 'build/admin.css' ) ) {
			wp_enqueue_style(
				'kinetichub-admin-css',
				kinetichub_URL . 'build/admin.css',
				array( 'wp-components' ),
				$asset_file['version']
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

		// Reject if nonce is missing OR invalid
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
		$sanitized_settings = array();

		$valid_blocks = array(
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

		$sanitized_blocks = array();

		if ( isset( $params['activeBlocks'] ) && is_array( $params['activeBlocks'] ) ) {
			foreach ( $params['activeBlocks'] as $block_id => $is_active ) {
				if ( in_array( $block_id, $valid_blocks, true ) ) {
					$sanitized_blocks[ $block_id ] = rest_sanitize_boolean( $is_active );
				}
			}
		} else {
			foreach ( $valid_blocks as $block ) {
				$sanitized_blocks[ $block ] = true;
			}
		}

		$sanitized_settings['activeBlocks'] = $sanitized_blocks;

		$perf_modes = array( 'balanced', 'eco', 'performance' );

		$sanitized_settings['performanceMode'] = in_array( $params['performanceMode'] ?? '', $perf_modes, true )
			? $params['performanceMode']
			: 'balanced';

		$sanitized_settings['globalLerp']     = max( 0.01, min( 0.2, floatval( $params['globalLerp'] ?? 0.08 ) ) );
		$sanitized_settings['glassIntensity'] = max( 0, min( 50, intval( $params['glassIntensity'] ?? 20 ) ) );

		$sanitized_settings['enableMobileMotion'] = isset( $params['enableMobileMotion'] ) ? rest_sanitize_boolean( $params['enableMobileMotion'] ) : true;
		$sanitized_settings['assetOptimization']  = isset( $params['assetOptimization'] ) ? rest_sanitize_boolean( $params['assetOptimization'] ) : true;

		$color = $params['accentColor'] ?? '';

		$sanitized_settings['accentColor'] = preg_match( '/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $color )
			? $color
			: '#10b981';

		$sanitized_settings['licenseKey'] = isset( $params['licenseKey'] )
			? sanitize_text_field( $params['licenseKey'] )
			: '';

		// Custom CSS: Admin-only powerful feature - minimal sanitization (trust admin input)
		// Similar to WordPress Custom HTML block - only basic textarea sanitization
		$sanitized_settings['customCSS'] = isset( $params['customCSS'] )
			? sanitize_textarea_field( $params['customCSS'] )
			: '';

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

		// Re-validate at output to prevent CSS injection from DB tampering
		if ( ! preg_match( '/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $accent ) ) {
			$accent = '#10b981';
		}

		$css = ":root, .editor-styles-wrapper, .block-editor-iframe__body { --kh-accent: {$accent}; --kh-glass-blur: {$glass}px; }\n";

		$handle = 'kinetichub-global-variables';
		wp_register_style( $handle, false, array(), kinetichub_VERSION );
		wp_enqueue_style( $handle );
		wp_add_inline_style( $handle, $css );
	}

	public function enqueue_custom_css() {
		$settings = $this->get_settings();

		if ( empty( $settings['customCSS'] ) ) {
			return;
		}

		$css = trim( (string) $settings['customCSS'] );
		
		// Strip any HTML tags that survived sanitize_textarea_field
		$css = wp_strip_all_tags( $css );

		// Remove known CSS injection vectors
		$css = preg_replace( '/expression\s*\(/i', '(', $css );
		$css = preg_replace( '/@import\b/i', '', $css );
		$css = preg_replace( '/behavior\s*:/i', '', $css );
		$css = preg_replace( '/javascript\s*:/i', '', $css );
		$css = preg_replace( '/-moz-binding\s*:/i', '', $css );

		if ( empty( $css ) ) {
			return;
		}

		$handle = 'kinetichub-custom-css';

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