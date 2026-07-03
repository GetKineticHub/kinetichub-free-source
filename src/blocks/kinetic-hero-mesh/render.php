<?php
/**
 * Kinetic Hero Mesh - Server Render Logic
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$attributes = $attributes ?? array();
$content    = $content ?? '';
$block      = $block ?? null;

// Sanitize InnerBlocks content through wp_kses_post() before output.
$kh_hm_inner_content = wp_kses_post( $content );

if ( ! function_exists( 'kinetichub_hm_validate_color_strict' ) ) {
	/**
	 * Validate a strict safe subset of CSS colors.
	 *
	 * @param string $color   Raw color.
	 * @param string $default Fallback color.
	 * @return string
	 */
	function kinetichub_hm_validate_color_strict( $color, $default = 'transparent' ) {
		$color = is_string( $color ) ? trim( $color ) : '';

		if ( '' === $color ) {
			return $default;
		}

		if ( preg_match( '/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^rgba?\(\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $color ) ) {
			return $color;
		}

		return $default;
	}
}

$kh_hm_align_v_list    = array( 'top', 'center', 'bottom' );
$kh_hm_content_align   = in_array( $attributes['contentAlign'] ?? '', $kh_hm_align_v_list, true ) ? $attributes['contentAlign'] : 'center';

$kh_hm_fit_list        = array( 'cover', 'contain', 'fill' );
$kh_hm_object_fit      = in_array( $attributes['objectFit'] ?? '', $kh_hm_fit_list, true ) ? $attributes['objectFit'] : 'cover';

$kh_hm_pos_list        = array( 'center', 'top', 'bottom', 'left', 'right' );
$kh_hm_object_position = in_array( $attributes['objectPosition'] ?? '', $kh_hm_pos_list, true ) ? $attributes['objectPosition'] : 'center';

$kh_hm_blend_list      = array( 'normal', 'multiply', 'overlay', 'screen', 'color-dodge', 'difference' );
$kh_hm_blend_mode      = in_array( $attributes['blendMode'] ?? '', $kh_hm_blend_list, true ) ? $attributes['blendMode'] : 'normal';

/*
 * Background mode validation.
 */
$kh_hm_mode_list = array( 'plexus', 'classic' );

$kh_hm_bg_mode = in_array( $attributes['bgMode'] ?? '', $kh_hm_mode_list, true ) ? $attributes['bgMode'] : 'plexus';

$kh_hm_interact_list   = array( 'none', 'repel', 'attract', 'constellation' );
$kh_hm_plexus_interact = in_array( $attributes['plexusInteraction'] ?? '', $kh_hm_interact_list, true ) ? $attributes['plexusInteraction'] : 'repel';

$kh_hm_hero_height_desktop = max( 20, min( 200, (int) ( $attributes['heroHeightDesktop'] ?? 100 ) ) );
$kh_hm_hero_height_mobile  = max( 20, min( 200, (int) ( $attributes['heroHeightMobile'] ?? 100 ) ) );
$kh_hm_overlay_opacity     = max( 0.0, min( 1.0, (float) ( $attributes['overlayOpacity'] ?? 0.3 ) ) );

/*
 * Plexus settings.
 */
$kh_hm_plexus_density    = max( 10, min( 100, (int) ( $attributes['plexusDensity'] ?? 80 ) ) );
$kh_hm_plexus_distance   = max( 20, min( 200, (int) ( $attributes['plexusDistance'] ?? 150 ) ) );
$kh_hm_plexus_speed      = max( 0.1, min( 3.0, (float) ( $attributes['plexusSpeed'] ?? 1.0 ) ) );
$kh_hm_plexus_line_width = max( 0.1, min( 3.0, (float) ( $attributes['plexusLineWidth'] ?? 1.0 ) ) );
$kh_hm_plexus_color      = kinetichub_hm_validate_color_strict( $attributes['plexusColor'] ?? '', '#ffffff' );



$kh_hm_parallax_effect = ! empty( $attributes['parallaxEffect'] );
$kh_hm_enable_grain    = ! empty( $attributes['enableGrain'] );

$kh_hm_overlay_color = kinetichub_hm_validate_color_strict( $attributes['overlayColor'] ?? '', '#000000' );
$kh_hm_media_url     = ! empty( $attributes['mediaUrl'] ) ? esc_url_raw( $attributes['mediaUrl'] ) : '';

$kh_hm_align = isset( $attributes['align'] ) ? $attributes['align'] : 'full';

$kh_hm_classes = array_filter(
	array(
		'kh-hm-hero-container',
		'align' . $kh_hm_align,
		$kh_hm_parallax_effect ? 'has-parallax' : '',
		$kh_hm_enable_grain ? 'has-grain' : '',
		
	)
);

$kh_hm_safe_opacity  = number_format( $kh_hm_overlay_opacity, 2, '.', '' );
$kh_hm_has_native_bg = isset( $attributes['backgroundColor'] ) || isset( $attributes['style']['color']['background'] );

$kh_hm_fallback_bg_color = '#0f172a';


$kh_hm_bg_style_inline = '';

if ( ! $kh_hm_has_native_bg ) {
	$kh_hm_bg_style_inline = sprintf( 'background-color: %s;', $kh_hm_fallback_bg_color );
}

$kh_hm_modes_with_image = array( 'classic' );


if ( ! empty( $kh_hm_media_url ) && in_array( $kh_hm_bg_mode, $kh_hm_modes_with_image, true ) ) {
	$kh_hm_bg_style_inline .= sprintf( ' background-image: url(%s);', esc_url( $kh_hm_media_url ) );

	if ( 'classic' === $kh_hm_bg_mode ) {
		$kh_hm_bg_size = 'fill' === $kh_hm_object_fit ? '100% 100%' : $kh_hm_object_fit;

		$kh_hm_bg_style_inline .= sprintf(
			' background-size: %s; background-position: %s;',
			$kh_hm_bg_size,
			$kh_hm_object_position
		);

		if ( $kh_hm_parallax_effect ) {
			$kh_hm_bg_style_inline .= ' background-attachment: fixed;';
		}
	}
}

$kh_hm_css_vars = sprintf(
	'--kh-hm-h-desk: %1$dvh; --kh-hm-h-mob: %2$dvh; min-height: var(--kh-hm-h-desk, %1$dvh); display: flex; flex-direction: column; position: relative; z-index: 0; %3$s',
	$kh_hm_hero_height_desktop,
	$kh_hm_hero_height_mobile,
	$kh_hm_bg_style_inline
);

$kh_hm_overlay_style = sprintf(
	'position: absolute; top: 0; right: 0; bottom: 0; left: 0; width: 100%%; height: 100%%; margin: 0; padding: 0; background-color: %1$s; opacity: %2$s; mix-blend-mode: %3$s; z-index: 1; pointer-events: none;',
	$kh_hm_overlay_color,
	$kh_hm_safe_opacity,
	$kh_hm_blend_mode
);

$kh_hm_align_vertical = 'top' === $kh_hm_content_align ? 'flex-start' : ( 'bottom' === $kh_hm_content_align ? 'flex-end' : 'center' );

$kh_hm_layer_style = sprintf(
	'display: flex; flex-direction: column; width: 100%%; flex: 1; justify-content: %s; position: relative; z-index: 2;',
	$kh_hm_align_vertical
);

$kh_hm_inner_wrap_style = 'width: 100%; pointer-events: auto; display: flex; flex-direction: column;';

$kh_hm_canvas_style = 'position: absolute; inset: 0; width: 100%; height: 100%; display: block; margin: 0; padding: 0; z-index: 1; pointer-events: none;';

$kh_hm_wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'               => implode( ' ', $kh_hm_classes ),
		'style'               => $kh_hm_css_vars,
		'data-mode'           => $kh_hm_bg_mode,
		'data-media'          => $kh_hm_media_url,
		'data-plexus-color'   => $kh_hm_plexus_color,
		'data-plexus-density' => (string) $kh_hm_plexus_density,
		'data-plexus-dist'    => (string) $kh_hm_plexus_distance,
		'data-plexus-speed'   => (string) $kh_hm_plexus_speed,
		'data-plexus-width'   => (string) $kh_hm_plexus_line_width,
		'data-plexus-int'     => $kh_hm_plexus_interact,
		
	)
);
?>

<div <?php echo $kh_hm_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by get_block_wrapper_attributes. ?>>
	<?php if ( 'classic' !== $kh_hm_bg_mode ) : ?>
		<canvas class="kh-hm-canvas-engine" aria-hidden="true" style="<?php echo esc_attr( $kh_hm_canvas_style ); ?>"></canvas>
	<?php endif; ?>

	<div class="kh-hm-overlay" style="<?php echo esc_attr( $kh_hm_overlay_style ); ?>"></div>

	<div class="kh-hm-content-layer" style="<?php echo esc_attr( $kh_hm_layer_style ); ?>">
		<div class="kh-hm-inner-wrap" style="<?php echo esc_attr( $kh_hm_inner_wrap_style ); ?>">
			<?php echo $kh_hm_inner_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- InnerBlocks content is filtered through wp_kses_post() above. ?>
		</div>
	</div>
</div>