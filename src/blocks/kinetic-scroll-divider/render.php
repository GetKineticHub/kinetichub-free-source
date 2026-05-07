<?php
/**
 * Kinetic Scroll Divider - Server-Side Render Logic
 * Version: 1.0.2
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$attributes = $attributes ?? array();
$content    = $content ?? '';
$block      = $block ?? null;

    if ( ! function_exists( 'kinetichub_sd_validate_color_strict' ) ) {
        /**
         * Validate a strict safe subset of CSS colors.
         *
         * @param string $color   Raw color value.
         * @param string $default Default fallback.
         * @return string
         */
        function kinetichub_sd_validate_color_strict( $color, $default = '#10b981' ) {
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

            if ( preg_match( '/^hsla?\(\s*(\d+)\s*,\s*(\d+%)\s*,\s*(\d+%)\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) {
                return $color;
            }

            if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $color ) ) {
                return $color;
            }

            return $default;
        }
    }

    /* --- FREE attribute values --- */
    $kh_sd_line_color    = kinetichub_sd_validate_color_strict( $attributes['lineColor'] ?? '', '#10b981' );
    $kh_sd_line_opacity  = max( 0, min( 1, (float) ( $attributes['lineOpacity'] ?? 1 ) ) );
    $kh_sd_thickness     = max( 1, min( 20, (int) ( $attributes['thickness'] ?? 2 ) ) );
    $kh_sd_width_percent = max( 10, min( 100, (int) ( $attributes['widthPercent'] ?? 100 ) ) );
    $kh_sd_duration      = max( 0.2, min( 4, (float) ( $attributes['duration'] ?? 1.2 ) ) );

    $kh_sd_alignment   = in_array( $attributes['alignment'] ?? '', array( 'left', 'center', 'right' ), true ) ? $attributes['alignment'] : 'center';
    $kh_sd_border_style = in_array( $attributes['borderStyle'] ?? '', array( 'solid', 'dashed', 'dotted' ), true ) ? $attributes['borderStyle'] : 'solid';
    $kh_sd_anim_style  = in_array( $attributes['animStyle'] ?? '', array( 'draw-center', 'draw-right', 'draw-left', 'fade-in' ), true ) ? $attributes['animStyle'] : 'draw-center';
    $kh_sd_visibility  = in_array( $attributes['visibility'] ?? '', array( 'all', 'desktop', 'mobile' ), true ) ? $attributes['visibility'] : 'all';
    $kh_sd_spacing     = in_array( $attributes['spacingPreset'] ?? '', array( 'tight', 'normal', 'spacious' ), true ) ? $attributes['spacingPreset'] : 'normal';

    $kh_sd_glow_effect    = ! empty( $attributes['glowEffect'] );
    $kh_sd_glow_intensity = in_array( $attributes['glowIntensity'] ?? '', array( 'low', 'medium', 'high' ), true ) ? $attributes['glowIntensity'] : 'medium';

    /* --- FREE defaults (MASTER-safe: set once with let-style, advanced overrides below) --- */
    $kh_sd_line_type           = 'solid';
    $kh_sd_opacity_curve       = 'soft';
    $kh_sd_scroll_tether       = 'trigger';
    $kh_sd_mobile_behavior     = 'same';
    $kh_sd_gradient_color      = '';
    $kh_sd_max_width_px        = 0;
    $kh_sd_trigger_offset      = 0;
    $kh_sd_rm_behavior         = 'static';
    $kh_sd_glow_color_mode     = 'same';
    $kh_sd_static_on_mobile    = false;
    $kh_sd_easing_mode         = 'smooth';
    $kh_sd_glow_intensity_safe = 'low';

    

    /* --- Build CSS custom properties --- */
    $kh_sd_css_vars = sprintf(
        '--kh-div-o: %1$s; --kh-div-h: %2$dpx; --kh-div-dur: %3$.2Fs; --kh-div-c: %4$s; --kh-div-w: %5$d%%;',
        (string) $kh_sd_line_opacity,
        $kh_sd_thickness,
        $kh_sd_duration,
        $kh_sd_line_color,
        $kh_sd_width_percent
    );

    

    /* --- Build outer class list --- */
    $kh_sd_outer_classes = array_filter(
        array(
            'kh-scroll-divider-container',
            'align-' . $kh_sd_alignment,
            'anim-' . $kh_sd_anim_style,
            'style-' . $kh_sd_border_style,
            'space-' . $kh_sd_spacing,
            'type-' . $kh_sd_line_type,
            'curve-' . $kh_sd_opacity_curve,
            'tether-' . $kh_sd_scroll_tether,
            'easing-' . $kh_sd_easing_mode,
            $kh_sd_glow_effect ? 'has-glow glow-' . $kh_sd_glow_intensity_safe . ' glow-mode-' . $kh_sd_glow_color_mode : '',
            'vis-' . $kh_sd_visibility,
            'mob-' . $kh_sd_mobile_behavior,
            $kh_sd_static_on_mobile ? 'mob-static' : '',
            'rm-' . $kh_sd_rm_behavior,
        )
    );

    if ( in_array( $attributes['align'] ?? '', array( 'wide', 'full' ), true ) ) {
        $kh_sd_outer_classes[] = 'align' . $attributes['align'];
    }

    $kh_sd_wrapper_attrs = get_block_wrapper_attributes(
        array(
            'class' => implode( ' ', $kh_sd_outer_classes ),
            'style' => $kh_sd_css_vars,
        )
    );
    ?>

    <div <?php echo $kh_sd_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> aria-hidden="true">
        <div class="kh-divider-track">
            <div class="kh-divider-line"></div>
        </div>
    </div>
    <?php
