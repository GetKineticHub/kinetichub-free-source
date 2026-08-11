<?php
/**
 * FREE-only review notice for kinetichub.
 *
 * Shows a single, permanently dismissible admin notice once the plugin has
 * been installed for a while AND at least one kinetichub block has actually
 * been used. No remote calls, no telemetry, no user-identifying data.
 *
 * This file ships in the FREE package only. It is required from the FREE
 * entry point and removed from the paid package at build time.
 *
 * @package kinetichub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'kinetichub_Review_Notice' ) ) {

	/**
	 * Lifecycle + rendering for the FREE review notice.
	 */
	final class kinetichub_Review_Notice {

		/**
		 * Timestamp of the first admin page load that evaluated the notice.
		 *
		 * Written lazily with add_option() so it is never reset by a
		 * deactivate/reactivate cycle.
		 */
		const OPTION_FIRST_SEEN = 'kinetichub_review_first_seen';

		/**
		 * Set to '1' once a kinetichub block is confirmed in real content.
		 */
		const OPTION_BLOCK_USED = 'kinetichub_review_block_used';

		/**
		 * Set to '1' once the notice is acted on or dismissed. Never unset.
		 */
		const OPTION_DISMISSED = 'kinetichub_admin_notice_dismissed';

		/**
		 * Minimum install age before the notice may appear.
		 */
		const MIN_AGE = 7 * DAY_IN_SECONDS;

		/**
		 * Capability required to see or act on the notice.
		 */
		const CAPABILITY = 'manage_options';

		/**
		 * admin-post.php action name.
		 */
		const ACTION = 'kinetichub_review_action';

		/**
		 * Nonce action name.
		 */
		const NONCE = 'kinetichub_review_notice';

		/**
		 * WordPress.org review page. No rating is pre-selected.
		 */
		const REVIEW_URL = 'https://wordpress.org/support/plugin/kinetichub/reviews/';

		/**
		 * WordPress.org support forum.
		 */
		const SUPPORT_URL = 'https://wordpress.org/support/plugin/kinetichub/';

		/**
		 * Serialized block delimiter prefix used by every kinetichub block.
		 */
		const CONTENT_NEEDLE = '<!-- wp:kinetichub/';

		/**
		 * Block name prefix used by every kinetichub block.
		 */
		const BLOCK_PREFIX = 'kinetichub/';

		/**
		 * Admin screens allowed to render the notice.
		 *
		 * @var string[]
		 */
		const ALLOWED_SCREENS = array(
			'plugins',
			'toplevel_page_kinetichub',
		);

		/**
		 * Valid values for the "do" request argument.
		 *
		 * @var string[]
		 */
		const VALID_ACTIONS = array(
			'review',
			'support',
			'dismiss',
		);

		/**
		 * Register hooks once.
		 *
		 * @return self
		 */
		public static function init() {
			static $instance = null;

			if ( null === $instance ) {
				$instance = new self();
			}

			return $instance;
		}

		/**
		 * Hook registration.
		 */
		private function __construct() {
			add_action( 'init', array( $this, 'maybe_register_usage_listeners' ) );
			add_action( 'admin_notices', array( $this, 'maybe_render_notice' ) );
			add_action( 'admin_post_' . self::ACTION, array( $this, 'handle_action' ) );
		}

		/**
		 * Attaches the usage listeners only while the usage flag is unset.
		 *
		 * Once the flag exists these hooks are never registered again, so the
		 * detection cost disappears permanently after the first hit.
		 *
		 * @return void
		 */
		public function maybe_register_usage_listeners() {
			if ( $this->has_block_usage() ) {
				return;
			}

			add_filter( 'render_block', array( $this, 'detect_block_usage' ), 10, 2 );
			add_action( 'save_post', array( $this, 'detect_block_usage_on_save' ), 10, 2 );
		}

		/**
		 * Flags usage when a kinetichub block is rendered.
		 *
		 * @param string $block_content Rendered block markup.
		 * @param array  $parsed_block  Parsed block data.
		 * @return string Unmodified block markup.
		 */
		public function detect_block_usage( $block_content, $parsed_block ) {
			if ( ! is_array( $parsed_block ) || empty( $parsed_block['blockName'] ) || ! is_string( $parsed_block['blockName'] ) ) {
				return $block_content;
			}

			if ( 0 !== strncmp( $parsed_block['blockName'], self::BLOCK_PREFIX, strlen( self::BLOCK_PREFIX ) ) ) {
				return $block_content;
			}

			$this->flag_block_usage();

			return $block_content;
		}

		/**
		 * Flags usage when post content containing a kinetichub block is saved.
		 *
		 * @param int     $post_id Saved post ID.
		 * @param WP_Post $post    Saved post object.
		 * @return void
		 */
		public function detect_block_usage_on_save( $post_id, $post ) {
			if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
				return;
			}

			if ( ! $post instanceof WP_Post || 'auto-draft' === $post->post_status ) {
				return;
			}

			if ( '' === $post->post_content || false === strpos( $post->post_content, self::CONTENT_NEEDLE ) ) {
				return;
			}

			$this->flag_block_usage();
		}

		/**
		 * Persists the usage flag and detaches both listeners for this request.
		 *
		 * @return void
		 */
		private function flag_block_usage() {
			if ( ! $this->has_block_usage() ) {
				update_option( self::OPTION_BLOCK_USED, '1', true );
			}

			remove_filter( 'render_block', array( $this, 'detect_block_usage' ), 10 );
			remove_action( 'save_post', array( $this, 'detect_block_usage_on_save' ), 10 );
		}

		/**
		 * Whether a kinetichub block has been confirmed in real content.
		 *
		 * @return bool
		 */
		private function has_block_usage() {
			return '1' === get_option( self::OPTION_BLOCK_USED );
		}

		/**
		 * Evaluates every display gate and renders the notice when all pass.
		 *
		 * @return void
		 */
		public function maybe_render_notice() {
			if ( ! current_user_can( self::CAPABILITY ) ) {
				return;
			}

			if ( ! $this->is_allowed_screen() ) {
				return;
			}

			if ( '1' === get_option( self::OPTION_DISMISSED ) ) {
				return;
			}

			if ( ( time() - $this->get_first_seen() ) < self::MIN_AGE ) {
				return;
			}

			if ( ! $this->has_block_usage() ) {
				return;
			}

			$this->render_notice();
		}

		/**
		 * Whether the current admin screen may show the notice.
		 *
		 * @return bool
		 */
		private function is_allowed_screen() {
			if ( ! function_exists( 'get_current_screen' ) ) {
				return false;
			}

			$screen = get_current_screen();

			if ( ! $screen instanceof WP_Screen ) {
				return false;
			}

			return in_array( $screen->id, self::ALLOWED_SCREENS, true );
		}

		/**
		 * Reads the first-seen timestamp, creating it on first evaluation.
		 *
		 * add_option() is deliberate: it never overwrites an existing value,
		 * so reactivating the plugin does not restart the waiting period.
		 *
		 * @return int Unix timestamp.
		 */
		private function get_first_seen() {
			$first_seen = get_option( self::OPTION_FIRST_SEEN );

			if ( ! $first_seen ) {
				$first_seen = time();
				add_option( self::OPTION_FIRST_SEEN, $first_seen, '', 'yes' );
			}

			return (int) $first_seen;
		}

		/**
		 * Builds a nonced admin-post URL for one notice action.
		 *
		 * @param string $do One of self::VALID_ACTIONS.
		 * @return string
		 */
		private function get_action_url( $do ) {
			return wp_nonce_url(
				add_query_arg(
					array(
						'action' => self::ACTION,
						'do'     => $do,
					),
					admin_url( 'admin-post.php' )
				),
				self::NONCE
			);
		}

		/**
		 * Outputs the notice using core notice markup only.
		 *
		 * @return void
		 */
		private function render_notice() {
			?>
			<div class="notice notice-info">
				<p><strong><?php esc_html_e( 'Enjoying KineticHub?', 'kinetichub' ); ?></strong></p>
				<p>
					<?php
					esc_html_e(
						"Hi, I'm Sorin, the developer behind KineticHub. If you're enjoying the blocks, a short WordPress.org review really helps others discover the plugin. If something isn't working, let me know and I'll take a look.",
						'kinetichub'
					);
					?>
				</p>
				<p>
					<a
						class="button button-primary"
						href="<?php echo esc_url( $this->get_action_url( 'review' ) ); ?>"
						target="_blank"
						rel="noopener noreferrer"
					><?php esc_html_e( 'Leave a review', 'kinetichub' ); ?></a>
					<a
						class="button"
						href="<?php echo esc_url( $this->get_action_url( 'support' ) ); ?>"
						target="_blank"
						rel="noopener noreferrer"
					><?php esc_html_e( "Something isn't working", 'kinetichub' ); ?></a>
					<a
						class="button-link"
						href="<?php echo esc_url( $this->get_action_url( 'dismiss' ) ); ?>"
					><?php esc_html_e( 'Dismiss', 'kinetichub' ); ?></a>
				</p>
			</div>
			<?php
		}

		/**
		 * Handles review / support / dismiss clicks.
		 *
		 * All three outcomes dismiss the notice permanently: someone who has
		 * already responded should not be asked again.
		 *
		 * @return void
		 */
		public function handle_action() {
			if ( ! current_user_can( self::CAPABILITY ) ) {
				wp_die(
					esc_html__( 'You are not allowed to do that.', 'kinetichub' ),
					'',
					array( 'response' => 403 )
				);
			}

			check_admin_referer( self::NONCE );

			$requested = isset( $_GET['do'] ) ? sanitize_key( wp_unslash( $_GET['do'] ) ) : '';

			if ( ! in_array( $requested, self::VALID_ACTIONS, true ) ) {
				wp_safe_redirect( admin_url() );
				exit;
			}

			update_option( self::OPTION_DISMISSED, '1', true );

			if ( 'review' === $requested || 'support' === $requested ) {
				/*
				 * Deliberate wp_redirect(): the destination is a hard-coded
				 * class constant on wordpress.org, never request input, so
				 * wp_safe_redirect() would only bounce it back to wp-admin.
				 */
				wp_redirect( 'review' === $requested ? self::REVIEW_URL : self::SUPPORT_URL );
				exit;
			}

			$referer = wp_get_referer();

			wp_safe_redirect( $referer ? $referer : admin_url() );
			exit;
		}
	}
}
