<?php
/**
 * Kinetic Typography - Server Render Logic
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'kinetichub_ty_validate_color_strict' ) ) {
	function kinetichub_ty_validate_color_strict( $color, $default = 'transparent' ) {
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

		if ( preg_match( '/^hsla?\(\s*(360|3[0-5]\d|[12]\d{2}|\d\d?)\s*,\s*(100|[1-9]\d?|0)%\s*,\s*(100|[1-9]\d?|0)%\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $color ) ) {
			return $color;
		}

		return $default;
	}
}

$kh_ty_raw_content = isset( $attributes['content'] ) ? (string) $attributes['content'] : '';

if ( '' === trim( wp_strip_all_tags( $kh_ty_raw_content ) ) ) {
	return;
}

$kh_ty_allowed_tags = array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' );
$kh_ty_tag_name     = isset( $attributes['tagName'] ) && in_array( (string) $attributes['tagName'], $kh_ty_allowed_tags, true )
	? (string) $attributes['tagName']
	: 'h2';

$kh_ty_anim_list = array( 'reveal', 'blur', 'pop' );


$kh_ty_animation_type = isset( $attributes['animationType'] ) && in_array( (string) $attributes['animationType'], $kh_ty_anim_list, true )
	? (string) $attributes['animationType']
	: 'reveal';

$kh_ty_split_type = isset( $attributes['splitType'] ) && in_array( (string) $attributes['splitType'], array( 'chars', 'words' ), true )
	? (string) $attributes['splitType']
	: 'chars';

$kh_ty_trigger_list = array( 'scroll' );


$kh_ty_trigger = isset( $attributes['trigger'] ) && in_array( (string) $attributes['trigger'], $kh_ty_trigger_list, true )
	? (string) $attributes['trigger']
	: 'scroll';

$kh_ty_direction = isset( $attributes['direction'] ) && in_array( (string) $attributes['direction'], array( 'up', 'down', 'left', 'right' ), true )
	? (string) $attributes['direction']
	: 'up';

$kh_ty_easing_key = isset( $attributes['easing'] ) && in_array( (string) $attributes['easing'], array( 'smooth', 'bouncy', 'snappy' ), true )
	? (string) $attributes['easing']
	: 'smooth';

$kh_ty_easing_map = array(
	'smooth' => 'cubic-bezier(0.23, 1, 0.32, 1)',
	'bouncy' => 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
	'snappy' => 'cubic-bezier(0.25, 1, 0.5, 1)',
);

$kh_ty_easing = $kh_ty_easing_map[ $kh_ty_easing_key ];

$kh_ty_speed       = max( 0.1, min( 10.0, (float) ( $attributes['speed'] ?? 0.6 ) ) );
$kh_ty_stagger     = max( 0.0, min( 2.0, (float) ( $attributes['stagger'] ?? 0.05 ) ) );
$kh_ty_threshold   = max( 0.0, min( 1.0, (float) ( $attributes['threshold'] ?? 0.2 ) ) );
$kh_ty_perspective = max( 100, min( 5000, (int) ( $attributes['perspective'] ?? 1000 ) ) );
$kh_ty_outline_w   = max( 0, min( 20, (int) ( $attributes['outlineWidth'] ?? 1 ) ) );

$kh_ty_custom_font_size        = isset( $attributes['customFontSize'] ) ? max( 0, min( 300, (int) $attributes['customFontSize'] ) ) : null;
$kh_ty_custom_font_size_mobile = isset( $attributes['customFontSizeMobile'] ) ? max( 0, min( 200, (int) $attributes['customFontSizeMobile'] ) ) : null;
$kh_ty_custom_line_height      = isset( $attributes['customLineHeight'] ) ? max( 0.5, min( 5.0, (float) $attributes['customLineHeight'] ) ) : null;
$kh_ty_custom_line_height_mob  = isset( $attributes['customLineHeightMobile'] ) ? max( 0.5, min( 5.0, (float) $attributes['customLineHeightMobile'] ) ) : null;

$kh_ty_is_reverse          = ! empty( $attributes['reverseOrder'] );
$kh_ty_use_outline         = ! empty( $attributes['useOutline'] );
$kh_ty_hover_glitch        = false;
$kh_ty_floor_reflection    = false;
$kh_ty_aurora_backlight    = false;
$kh_ty_infinite_levitation = false;
$kh_ty_highlight_sweep     = false;
$kh_ty_use_gradient        = false;
$kh_ty_use_glow            = false;
$kh_ty_blend_mode          = 'normal';
$kh_ty_is_random           = false;
$kh_ty_iterations          = '1';
$kh_ty_reset_on_leave      = false;
$kh_ty_trigger_always      = false;
$kh_ty_text_align_mob      = '';



$kh_ty_clean_text = wp_strip_all_tags( $kh_ty_raw_content );

if ( mb_strlen( $kh_ty_clean_text ) > 500 && 'chars' === $kh_ty_split_type ) {
	$kh_ty_split_type = 'words';
}

$kh_ty_native_font_size_preset = ! empty( $attributes['fontSize'] ) ? sanitize_html_class( $attributes['fontSize'] ) : null;
$kh_ty_native_font_size_custom = ! empty( $attributes['style']['typography']['fontSize'] ) ? (string) $attributes['style']['typography']['fontSize'] : null;
$kh_ty_native_line_height      = ! empty( $attributes['style']['typography']['lineHeight'] ) ? (string) $attributes['style']['typography']['lineHeight'] : null;
$kh_ty_has_native_typo         = ! empty( $kh_ty_native_font_size_preset ) || ! empty( $kh_ty_native_font_size_custom ) || ! empty( $kh_ty_native_line_height );

$kh_ty_lines       = preg_split( '/<br\s*\/?>/i', $kh_ty_raw_content );
$kh_ty_lines       = is_array( $kh_ty_lines ) ? $kh_ty_lines : array( $kh_ty_raw_content );
$kh_ty_total_items = 0;

foreach ( $kh_ty_lines as $kh_ty_line ) {
	$kh_ty_clean_line = wp_strip_all_tags( $kh_ty_line );
	$kh_ty_words      = preg_split( '/\s+/u', $kh_ty_clean_line, -1, PREG_SPLIT_NO_EMPTY );
	$kh_ty_words      = is_array( $kh_ty_words ) ? $kh_ty_words : array();

	if ( 'words' === $kh_ty_split_type ) {
		$kh_ty_total_items += count( $kh_ty_words );
	} else {
		foreach ( $kh_ty_words as $kh_ty_word ) {
			$kh_ty_chars       = preg_split( '//u', $kh_ty_word, -1, PREG_SPLIT_NO_EMPTY );
			$kh_ty_chars       = is_array( $kh_ty_chars ) ? $kh_ty_chars : array();
			$kh_ty_total_items += count( $kh_ty_chars );
		}
	}
}

$kh_ty_max_delay_seconds = ( $kh_ty_total_items > 0 ) ? ( $kh_ty_total_items - 1 ) * $kh_ty_stagger : 0;

$kh_ty_css_vars = array(
	'--kh-ty-speed'     => "{$kh_ty_speed}s",
	'--kh-ty-stagger'   => "{$kh_ty_stagger}s",
	'--kh-ty-easing'    => $kh_ty_easing,
	'--kh-ty-persp'     => "{$kh_ty_perspective}px",
	'--kh-ty-outline-w' => "{$kh_ty_outline_w}px",
	'--kh-ty-max-delay' => "{$kh_ty_max_delay_seconds}s",
);

if ( $kh_ty_custom_font_size || $kh_ty_custom_font_size_mobile || $kh_ty_custom_line_height || $kh_ty_custom_line_height_mob ) {
	if ( $kh_ty_custom_font_size ) {
		$kh_ty_css_vars['--kh-ty-fs-desk'] = "{$kh_ty_custom_font_size}px";
	}
	if ( $kh_ty_custom_font_size_mobile ) {
		$kh_ty_css_vars['--kh-ty-fs-mob'] = "{$kh_ty_custom_font_size_mobile}px";
	}
	if ( $kh_ty_custom_line_height ) {
		$kh_ty_css_vars['--kh-ty-lh-desk'] = (string) $kh_ty_custom_line_height;
	}
	if ( $kh_ty_custom_line_height_mob ) {
		$kh_ty_css_vars['--kh-ty-lh-mob'] = (string) $kh_ty_custom_line_height_mob;
	}
}



$kh_ty_style_string = '';

foreach ( $kh_ty_css_vars as $kh_ty_key => $kh_ty_val ) {
	if ( preg_match( '/^--kh-ty-[a-z0-9-]+$/', $kh_ty_key ) ) {
		$kh_ty_style_string .= $kh_ty_key . ': ' . esc_attr( $kh_ty_val ) . '; ';
	}
}

$kh_ty_has_custom_typo = ! empty( $kh_ty_custom_font_size ) || ! empty( $kh_ty_custom_font_size_mobile ) || ! empty( $kh_ty_custom_line_height ) || ! empty( $kh_ty_custom_line_height_mob );

$kh_ty_classes = array(
	'kh-ty-master-typography',
	'kh-ty-safe-render',
	'kh-ty-ready',
	$kh_ty_has_custom_typo ? 'kh-ty-has-custom-typo' : ( $kh_ty_has_native_typo ? 'kh-ty-has-native-typo' : '' ),
	"kh-ty-anim-{$kh_ty_animation_type}",
	"kh-ty-trig-{$kh_ty_trigger}",
	"kh-ty-split-{$kh_ty_split_type}",
	"kh-ty-dir-{$kh_ty_direction}",
	$kh_ty_use_outline ? 'kh-ty-has-outline' : '',
	$kh_ty_is_reverse ? 'kh-ty-rev' : '',
);



$kh_ty_classes = array_filter( array_map( 'sanitize_html_class', $kh_ty_classes ) );

$kh_ty_data_attrs = array(
	'class'          => implode( ' ', $kh_ty_classes ),
	'style'          => trim( $kh_ty_style_string ),
	'data-trigger'   => $kh_ty_trigger,
	'data-speed'     => (string) $kh_ty_speed,
	'data-threshold' => (string) $kh_ty_threshold,
	'data-anim-type' => $kh_ty_animation_type,
);



$kh_ty_wrapper_attrs     = get_block_wrapper_attributes( $kh_ty_data_attrs );
$kh_ty_html_spans        = '';
$kh_ty_global_item_count = 0;

foreach ( $kh_ty_lines as $kh_ty_line_index => $kh_ty_line ) {
	$kh_ty_clean_line = wp_strip_all_tags( $kh_ty_line );
	$kh_ty_words      = preg_split( '/\s+/u', $kh_ty_clean_line, -1, PREG_SPLIT_NO_EMPTY );
	$kh_ty_words      = is_array( $kh_ty_words ) ? $kh_ty_words : array();

	foreach ( $kh_ty_words as $kh_ty_word_index => $kh_ty_word ) {
		if ( '' === $kh_ty_word ) {
			continue;
		}

		$kh_ty_html_spans .= '<span class="kh-ty-word" dir="auto">';

		if ( 'words' === $kh_ty_split_type ) {
			$kh_ty_delay_index = $kh_ty_is_reverse ? ( $kh_ty_total_items - 1 - $kh_ty_global_item_count ) : $kh_ty_global_item_count;

			

			$kh_ty_html_spans .= sprintf(
				'<span class="kh-ty-item" data-delay="%1$s" aria-hidden="true">%2$s</span>',
				esc_attr( sprintf( '%.4fs', $kh_ty_delay_index * $kh_ty_stagger ) ),
				esc_html( $kh_ty_word )
			);

			++$kh_ty_global_item_count;
		} else {
			$kh_ty_chars = preg_split( '//u', $kh_ty_word, -1, PREG_SPLIT_NO_EMPTY );
			$kh_ty_chars = is_array( $kh_ty_chars ) ? $kh_ty_chars : array();

			foreach ( $kh_ty_chars as $kh_ty_char ) {
				$kh_ty_delay_index = $kh_ty_is_reverse ? ( $kh_ty_total_items - 1 - $kh_ty_global_item_count ) : $kh_ty_global_item_count;

				

				$kh_ty_html_spans .= sprintf(
					'<span class="kh-ty-item" data-delay="%1$s" aria-hidden="true">%2$s</span>',
					esc_attr( sprintf( '%.4fs', $kh_ty_delay_index * $kh_ty_stagger ) ),
					esc_html( $kh_ty_char )
				);

				++$kh_ty_global_item_count;
			}
		}

		$kh_ty_html_spans .= '</span>';

		if ( $kh_ty_word_index < count( $kh_ty_words ) - 1 ) {
			$kh_ty_html_spans .= '<span class="kh-ty-space" aria-hidden="true">&nbsp;</span>';
		}
	}

	if ( $kh_ty_line_index < count( $kh_ty_lines ) - 1 ) {
		$kh_ty_html_spans .= '<br aria-hidden="true">';
	}
}

$kh_ty_inner_allowed_html = array(
	'span' => array(
		'class'       => true,
		'dir'         => true,
		'data-delay'  => true,
		'aria-hidden' => true,
	),
	'br' => array(
		'aria-hidden' => true,
	),
);

$kh_ty_allowed_output = array(
	'div' => array(
		'class'          => true,
		'style'          => true,
		'data-trigger'   => true,
		'data-speed'     => true,
		'data-threshold' => true,
		'data-anim-type' => true,
	),
	'span' => array(
		'class'       => true,
		'dir'         => true,
		'data-delay'  => true,
		'aria-hidden' => true,
	),
	'br' => array(
		'aria-hidden' => true,
	),
	'h1' => array( 'class' => true, 'id' => true ),
	'h2' => array( 'class' => true, 'id' => true ),
	'h3' => array( 'class' => true, 'id' => true ),
	'h4' => array( 'class' => true, 'id' => true ),
	'h5' => array( 'class' => true, 'id' => true ),
	'h6' => array( 'class' => true, 'id' => true ),
	'p'  => array( 'class' => true ),
);



ob_start();
?>
<div <?php echo wp_kses_data( $kh_ty_wrapper_attrs ); ?>>
	<div class="kh-ty-text-wrapper">
		

		<<?php echo esc_html( $kh_ty_tag_name ); ?> class="kh-ty-text-content">
			<span class="screen-reader-text"><?php echo esc_html( $kh_ty_clean_text ); ?></span>
			<?php echo wp_kses( $kh_ty_html_spans, $kh_ty_inner_allowed_html ); ?>
		</<?php echo esc_html( $kh_ty_tag_name ); ?>>
	</div>

	
</div>
<?php

$kh_ty_output = ob_get_clean();

if ( is_string( $kh_ty_output ) ) {
	$kh_ty_output = preg_replace( '/>\s+</', '><', trim( $kh_ty_output ) );
	$kh_ty_output = is_string( $kh_ty_output ) ? $kh_ty_output : '';
}

echo wp_kses( $kh_ty_output, $kh_ty_allowed_output );