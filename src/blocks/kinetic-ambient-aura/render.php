<?php
/**
 * Kinetic Ambient Aura - Server Render
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'kinetichub_aa_validate_color' ) ) {
	/**
	 * Validate aura color against a strict safe subset.
	 *
	 * @param string $color   Raw color value.
	 * @param string $default Fallback color.
	 * @return string
	 */
	function kinetichub_aa_validate_color( $color, $default = '#3b82f6' ) {
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

		if ( preg_match( '/^hsla?\(\s*(\d+)[\s,]+(\d+%)[\s,]+(\d+%)\s*(?:[,\/]\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $color ) ) {
			return $color;
		}

		return $default;
	}
}

$kinetichub_aa_position_allowed = array( 'fixed', 'absolute' );

$kinetichub_aa_raw_position = isset( $attributes['positionType'] ) ? (string) $attributes['positionType'] : 'fixed';
$kinetichub_aa_position     = in_array( $kinetichub_aa_raw_position, $kinetichub_aa_position_allowed, true ) ? $kinetichub_aa_raw_position : 'fixed';

$kinetichub_aa_shape                = 'circle';
$kinetichub_aa_blend                = 'normal';
$kinetichub_aa_mobile_behavior      = 'reduce';
$kinetichub_aa_disable_blend_mobile = true;
$kinetichub_aa_z_index              = -1;



$kinetichub_aa_opacity  = max( 0.01, min( 0.35, (float) ( $attributes['opacity'] ?? 0.15 ) ) );
$kinetichub_aa_spread   = max( 200, min( 2500, (int) ( $attributes['spread'] ?? 800 ) ) );
$kinetichub_aa_falloff  = max( 30, min( 100, (int) ( $attributes['falloff'] ?? 70 ) ) );
$kinetichub_aa_offset_x = max( -50, min( 150, (int) ( $attributes['offsetX'] ?? 50 ) ) );
$kinetichub_aa_offset_y = max( -50, min( 150, (int) ( $attributes['offsetY'] ?? -10 ) ) );

$kinetichub_aa_color = kinetichub_aa_validate_color( $attributes['color'] ?? '', '#3b82f6' );

$kinetichub_aa_css_shape = 'circle';
$kinetichub_aa_css_ratio = '1';



$kinetichub_aa_css_vars = sprintf(
	'--kh-aura-c: %s; --kh-aura-o: %s; --kh-aura-s: %dpx; --kh-aura-f: %d%%; --kh-aura-pos: %s; --kh-aura-x: %d%%; --kh-aura-y: %d%%;',
	$kinetichub_aa_color,
	(string) $kinetichub_aa_opacity,
	$kinetichub_aa_spread,
	$kinetichub_aa_falloff,
	$kinetichub_aa_position,
	$kinetichub_aa_offset_x,
	$kinetichub_aa_offset_y
);



$kinetichub_aa_classes = array_filter(
	array(
		'kh-ambient-aura',
		'kh-aura-pos-' . sanitize_html_class( $kinetichub_aa_position ),
		
	)
);

$kinetichub_aa_wrapper_attrs = get_block_wrapper_attributes(
	array(
		'class'       => implode( ' ', $kinetichub_aa_classes ),
		'style'       => $kinetichub_aa_css_vars,
		'aria-hidden' => 'true',
	)
);

?>
<div <?php echo $kinetichub_aa_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<div class="kh-aura-core"></div>
</div>