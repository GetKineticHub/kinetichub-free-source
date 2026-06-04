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
/* <fs_premium_only> */
$kh_ty_anim_list = array_merge( $kh_ty_anim_list, array( 'bounce', 'flip', 'skew', 'scramble', 'plexus', 'pulse', 'cyber' ) );
/* </fs_premium_only> */

$kh_ty_animation_type = isset( $attributes['animationType'] ) && in_array( (string) $attributes['animationType'], $kh_ty_anim_list, true )
	? (string) $attributes['animationType']
	: 'reveal';

$kh_ty_split_type = isset( $attributes['splitType'] ) && in_array( (string) $attributes['splitType'], array( 'chars', 'words' ), true )
	? (string) $attributes['splitType']
	: 'chars';

$kh_ty_trigger_list = array( 'scroll' );
/* <fs_premium_only> */
$kh_ty_trigger_list[] = 'hover';
/* </fs_premium_only> */

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

/* <fs_premium_only> */
$kh_ty_hover_glitch        = ! empty( $attributes['hoverGlitch'] );
$kh_ty_floor_reflection    = ! empty( $attributes['floorReflection'] );
$kh_ty_aurora_backlight    = ! empty( $attributes['auroraBacklight'] );
$kh_ty_infinite_levitation = ! empty( $attributes['infiniteLevitation'] );
$kh_ty_highlight_sweep     = ! empty( $attributes['highlightSweep'] );
$kh_ty_use_gradient        = ! empty( $attributes['useGradient'] );
$kh_ty_use_glow            = ! empty( $attributes['useGlow'] );
$kh_ty_is_random           = ! empty( $attributes['randomize'] );
$kh_ty_reset_on_leave      = ! empty( $attributes['resetOnLeave'] );
$kh_ty_trigger_always      = ! empty( $attributes['triggerAlways'] );

$kh_ty_blend_mode = isset( $attributes['blendMode'] ) && in_array( (string) $attributes['blendMode'], array( 'normal', 'difference', 'exclusion', 'overlay' ), true )
	? (string) $attributes['blendMode']
	: 'normal';

$kh_ty_iterations = isset( $attributes['iterations'] ) && in_array( (string) $attributes['iterations'], array( '1', 'infinite' ), true )
	? (string) $attributes['iterations']
	: '1';

$kh_ty_text_align_mob = isset( $attributes['textAlignMobile'] ) && in_array( (string) $attributes['textAlignMobile'], array( '', 'left', 'center', 'right' ), true )
	? (string) $attributes['textAlignMobile']
	: '';

$kh_ty_pulse_mode = isset( $attributes['pulseMode'] ) && in_array( (string) $attributes['pulseMode'], array( 'soft', 'balanced', 'deep' ), true )
	? (string) $attributes['pulseMode']
	: 'soft';

$kh_ty_pulse_intensity   = max( 0.01, min( 1.0, (float) ( $attributes['pulseIntensity'] ?? 0.06 ) ) );
$kh_ty_pulse_min_opacity = max( 0.0, min( 1.0, (float) ( $attributes['pulseMinOpacity'] ?? 0.88 ) ) );
$kh_ty_reflect_dist      = max( -100, min( 100, (int) ( $attributes['reflectionDistance'] ?? 0 ) ) );
$kh_ty_reflect_op        = max( 0.0, min( 1.0, (float) ( $attributes['reflectionOpacity'] ?? 0.3 ) ) );
$kh_ty_aurora_spread     = max( 0, min( 500, (int) ( $attributes['auroraSpread'] ?? 50 ) ) );
$kh_ty_grad_angle        = max( 0, min( 360, (int) ( $attributes['gradAngle'] ?? 45 ) ) );

$kh_ty_aurora_color    = kinetichub_ty_validate_color_strict( $attributes['auroraColor'] ?? '', 'rgba(16, 185, 129, 0.4)' );
$kh_ty_highlight_color = kinetichub_ty_validate_color_strict( $attributes['highlightColor'] ?? '', 'rgba(16, 185, 129, 0.3)' );
$kh_ty_grad_c1         = kinetichub_ty_validate_color_strict( $attributes['gradColor1'] ?? '', '#007bff' );
$kh_ty_grad_c2         = kinetichub_ty_validate_color_strict( $attributes['gradColor2'] ?? '', '#6610f2' );
$kh_ty_glow_color      = kinetichub_ty_validate_color_strict( $attributes['glowColor'] ?? '', 'rgba(0, 255, 240, 0.5)' );

$kh_ty_plx_spread = isset( $attributes['plexusSpread'] ) && in_array( (string) $attributes['plexusSpread'], array( 'inside', 'around' ), true )
	? (string) $attributes['plexusSpread']
	: 'inside';

$kh_ty_plx_interact = isset( $attributes['plexusInteraction'] ) && in_array( (string) $attributes['plexusInteraction'], array( 'none', 'repel', 'attract' ), true )
	? (string) $attributes['plexusInteraction']
	: 'none';

$kh_ty_plx_density = max( 1, min( 200, (int) ( $attributes['plexusDensity'] ?? 60 ) ) );
$kh_ty_plx_speed   = max( 0.1, min( 5.0, (float) ( $attributes['plexusSpeed'] ?? 0.5 ) ) );
$kh_ty_plx_n_size  = max( 0.1, min( 20.0, (float) ( $attributes['plexusNodeSize'] ?? 1.5 ) ) );
$kh_ty_plx_l_dist  = max( 1, min( 200, (int) ( $attributes['plexusLineDistance'] ?? 45 ) ) );
$kh_ty_plx_opacity = max( 0.0, min( 1.0, (float) ( $attributes['plexusOpacity'] ?? 0.8 ) ) );
$kh_ty_plx_cont    = isset( $attributes['plexusContinuous'] ) ? (bool) $attributes['plexusContinuous'] : true;
$kh_ty_plx_node_c  = kinetichub_ty_validate_color_strict( $attributes['plexusNodeColor'] ?? '', '#10b981' );
$kh_ty_plx_line_c  = kinetichub_ty_validate_color_strict( $attributes['plexusLineColor'] ?? '', '#10b981' );

$kh_ty_hide_mobile  = ! empty( $attributes['hideOnMobile'] );
$kh_ty_hide_desktop = ! empty( $attributes['hideOnDesktop'] );
/* </fs_premium_only> */

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

/* <fs_premium_only> */
$kh_ty_css_vars['--kh-ty-blend']             = $kh_ty_blend_mode;
$kh_ty_css_vars['--kh-ty-iterations']        = $kh_ty_iterations;
$kh_ty_css_vars['--kh-ty-pulse-intensity']   = (string) $kh_ty_pulse_intensity;
$kh_ty_css_vars['--kh-ty-pulse-min-opacity'] = (string) $kh_ty_pulse_min_opacity;

if ( $kh_ty_floor_reflection ) {
	$kh_ty_css_vars['--kh-ty-reflect-dist'] = "{$kh_ty_reflect_dist}px";
	$kh_ty_css_vars['--kh-ty-reflect-op']   = (string) $kh_ty_reflect_op;
}
if ( $kh_ty_aurora_backlight ) {
	$kh_ty_css_vars['--kh-ty-aurora-c'] = $kh_ty_aurora_color;
	$kh_ty_css_vars['--kh-ty-aurora-s'] = "{$kh_ty_aurora_spread}px";
}
if ( $kh_ty_highlight_sweep ) {
	$kh_ty_css_vars['--kh-ty-highlight-c'] = $kh_ty_highlight_color;
}
if ( $kh_ty_use_gradient ) {
	$kh_ty_css_vars['--kh-ty-grad-1']     = $kh_ty_grad_c1;
	$kh_ty_css_vars['--kh-ty-grad-2']     = $kh_ty_grad_c2;
	$kh_ty_css_vars['--kh-ty-grad-angle'] = "{$kh_ty_grad_angle}deg";
}
if ( $kh_ty_use_glow ) {
	$kh_ty_css_vars['--kh-ty-glow-color'] = $kh_ty_glow_color;
}
/* </fs_premium_only> */

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

/* <fs_premium_only> */
$kh_ty_classes[] = $kh_ty_hover_glitch ? 'has-hover-glitch' : '';
$kh_ty_classes[] = $kh_ty_floor_reflection ? 'has-floor-reflect' : '';
$kh_ty_classes[] = $kh_ty_aurora_backlight ? 'has-aurora-backlight' : '';
$kh_ty_classes[] = $kh_ty_infinite_levitation ? 'has-levitation' : '';
$kh_ty_classes[] = $kh_ty_highlight_sweep ? 'has-highlight-sweep' : '';
$kh_ty_classes[] = $kh_ty_is_random ? 'kh-ty-rand' : '';
$kh_ty_classes[] = $kh_ty_use_gradient ? 'kh-ty-has-gradient' : '';
$kh_ty_classes[] = $kh_ty_use_glow ? 'kh-ty-has-glow' : '';
$kh_ty_classes[] = $kh_ty_hide_mobile ? 'kh-ty-hide-mobile' : '';
$kh_ty_classes[] = $kh_ty_hide_desktop ? 'kh-ty-hide-desktop' : '';
$kh_ty_classes[] = 'pulse' === $kh_ty_animation_type ? "kh-ty-pulse-mode-{$kh_ty_pulse_mode}" : '';
$kh_ty_classes[] = $kh_ty_text_align_mob ? "kh-ty-align-mob-{$kh_ty_text_align_mob}" : '';
/* </fs_premium_only> */

$kh_ty_classes = array_filter( array_map( 'sanitize_html_class', $kh_ty_classes ) );

$kh_ty_data_attrs = array(
	'class'          => implode( ' ', $kh_ty_classes ),
	'style'          => trim( $kh_ty_style_string ),
	'data-trigger'   => $kh_ty_trigger,
	'data-speed'     => (string) $kh_ty_speed,
	'data-threshold' => (string) $kh_ty_threshold,
	'data-anim-type' => $kh_ty_animation_type,
);

/* <fs_premium_only> */
$kh_ty_data_attrs['data-reset-leave']    = $kh_ty_reset_on_leave ? 'true' : 'false';
$kh_ty_data_attrs['data-trigger-always'] = $kh_ty_trigger_always ? 'true' : 'false';
$kh_ty_data_attrs['data-iterations']     = $kh_ty_iterations;

if ( 'plexus' === $kh_ty_animation_type ) {
	$kh_ty_data_attrs['data-plx-density']  = (string) $kh_ty_plx_density;
	$kh_ty_data_attrs['data-plx-speed']    = (string) $kh_ty_plx_speed;
	$kh_ty_data_attrs['data-plx-nsize']    = (string) $kh_ty_plx_n_size;
	$kh_ty_data_attrs['data-plx-ldist']    = (string) $kh_ty_plx_l_dist;
	$kh_ty_data_attrs['data-plx-node-c']   = $kh_ty_plx_node_c;
	$kh_ty_data_attrs['data-plx-line-c']   = $kh_ty_plx_line_c;
	$kh_ty_data_attrs['data-plx-opacity']  = (string) $kh_ty_plx_opacity;
	$kh_ty_data_attrs['data-plx-cont']     = $kh_ty_plx_cont ? 'true' : 'false';
	$kh_ty_data_attrs['data-plx-spread']   = $kh_ty_plx_spread;
	$kh_ty_data_attrs['data-plx-interact'] = $kh_ty_plx_interact;
}
/* </fs_premium_only> */

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

			/* <fs_premium_only> */
			if ( $kh_ty_is_random ) {
				$kh_ty_delay_index = wp_rand( 0, max( 1, $kh_ty_total_items * 10 ) ) / 10;
			}
			/* </fs_premium_only> */

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

				/* <fs_premium_only> */
				if ( $kh_ty_is_random ) {
					$kh_ty_delay_index = wp_rand( 0, max( 1, $kh_ty_total_items * 10 ) ) / 10;
				}
				/* </fs_premium_only> */

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

/* <fs_premium_only> */
$kh_ty_allowed_output['div']['data-reset-leave']    = true;
$kh_ty_allowed_output['div']['data-trigger-always'] = true;
$kh_ty_allowed_output['div']['data-iterations']     = true;
$kh_ty_allowed_output['div']['data-plx-density']    = true;
$kh_ty_allowed_output['div']['data-plx-speed']      = true;
$kh_ty_allowed_output['div']['data-plx-nsize']      = true;
$kh_ty_allowed_output['div']['data-plx-ldist']      = true;
$kh_ty_allowed_output['div']['data-plx-node-c']     = true;
$kh_ty_allowed_output['div']['data-plx-line-c']     = true;
$kh_ty_allowed_output['div']['data-plx-opacity']    = true;
$kh_ty_allowed_output['div']['data-plx-cont']       = true;
$kh_ty_allowed_output['div']['data-plx-spread']     = true;
$kh_ty_allowed_output['div']['data-plx-interact']   = true;
$kh_ty_allowed_output['canvas'] = array(
	'class' => true,
	'style' => true,
);
/* </fs_premium_only> */

ob_start();
?>
<div <?php echo wp_kses_data( $kh_ty_wrapper_attrs ); ?>>
	<div class="kh-ty-text-wrapper">
		<?php /* <fs_premium_only> */ ?>
		<?php if ( $kh_ty_aurora_backlight ) : ?>
			<div class="kh-ty-aurora-glow" aria-hidden="true"></div>
		<?php endif; ?>
		<?php /* </fs_premium_only> */ ?>

		<<?php echo esc_html( $kh_ty_tag_name ); ?> class="kh-ty-text-content">
			<span class="screen-reader-text"><?php echo esc_html( $kh_ty_clean_text ); ?></span>
			<?php echo wp_kses( $kh_ty_html_spans, $kh_ty_inner_allowed_html ); ?>
		</<?php echo esc_html( $kh_ty_tag_name ); ?>>
	</div>

	<?php /* <fs_premium_only> */ ?>
	<?php if ( 'plexus' === $kh_ty_animation_type ) : ?>
		<canvas class="kh-ty-plexus-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity 0.5s ease;"></canvas>
	<?php endif; ?>
	<?php /* </fs_premium_only> */ ?>
</div>
<?php

$kh_ty_output = ob_get_clean();

if ( is_string( $kh_ty_output ) ) {
	$kh_ty_output = preg_replace( '/>\s+</', '><', trim( $kh_ty_output ) );
	$kh_ty_output = is_string( $kh_ty_output ) ? $kh_ty_output : '';
}

echo wp_kses( $kh_ty_output, $kh_ty_allowed_output );