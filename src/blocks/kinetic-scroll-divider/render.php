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

    if ( ! function_exists( 'kinetichub_sd_center_icon_svg' ) ) {
        /**
         * Markup for one icon of the curated center icon set.
         *
         * Decorative: hidden from assistive technology and never focusable. The
         * shapes are drawn in currentColor, so the icon color reaches them through
         * CSS. renderCenterIcon() in index.js draws the same shapes in the editor.
         *
         * @param string $icon Icon key. Unknown keys fall back to the diamond.
         * @return string
         */
        function kinetichub_sd_center_icon_svg( $icon ) {
            $shapes = array(
                'diamond' => '<path d="M12 3 21 12 12 21 3 12Z"></path>',
                'sparkle' => '<path d="M12 3c.6 4.8 4.2 8.4 9 9-4.8.6-8.4 4.2-9 9-.6-4.8-4.2-8.4-9-9 4.8-.6 8.4-4.2 9-9Z"></path>',
                'star'    => '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
                'dot'     => '<circle cx="12" cy="12" r="4.5" fill="currentColor"></circle>',
                'heart'   => '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>',
                'chevron' => '<polyline points="6 9 12 15 18 9"></polyline>',
            );

            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . ( $shapes[ $icon ] ?? $shapes['diamond'] ) . '</svg>';
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

    /* --- Center element (opt-in). 'none' renders the original divider markup byte for byte. --- */
    $kh_sd_center_mode = in_array( $attributes['centerMode'] ?? '', array( 'icon', 'text' ), true ) ? $attributes['centerMode'] : 'none';
    $kh_sd_center_text = is_string( $attributes['centerText'] ?? null ) ? trim( $attributes['centerText'] ) : '';

    // A text center without text has nothing to show, so it stays the plain divider.
    if ( 'text' === $kh_sd_center_mode && '' === $kh_sd_center_text ) {
        $kh_sd_center_mode = 'none';
    }

    /* --- FREE defaults (MASTER-safe: set once with let-style, PRO overrides below) --- */
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

    /* --- Center element classes and properties: only when one is shown --- */
    if ( 'none' !== $kh_sd_center_mode ) {
        $kh_sd_center_size  = 'icon' === $kh_sd_center_mode
            ? max( 12, min( 64, (int) ( $attributes['centerIconSize'] ?? 20 ) ) )
            : max( 11, min( 40, (int) ( $attributes['centerTextSize'] ?? 14 ) ) );
        $kh_sd_center_gap   = max( 0, min( 64, (int) ( $attributes['centerGap'] ?? 16 ) ) );
        $kh_sd_center_color = kinetichub_sd_validate_color_strict( $attributes['centerColor'] ?? '', '' );

        $kh_sd_css_vars .= sprintf( ' --kh-div-center-gap: %1$dpx; --kh-div-center-size: %2$dpx;', $kh_sd_center_gap, $kh_sd_center_size );

        if ( '' !== $kh_sd_center_color ) {
            $kh_sd_css_vars .= sprintf( ' --kh-div-center-c: %s;', $kh_sd_center_color );
        }

        $kh_sd_outer_classes[] = 'has-center center-' . $kh_sd_center_mode;

        if ( 'text' === $kh_sd_center_mode && ! empty( $attributes['centerTextUppercase'] ) ) {
            $kh_sd_outer_classes[] = 'center-upper';
        }

        
    }

    $kh_sd_wrapper_attrs = get_block_wrapper_attributes(
        array(
            'class' => implode( ' ', $kh_sd_outer_classes ),
            'style' => $kh_sd_css_vars,
        )
    );

if ( 'none' === $kh_sd_center_mode ) :
    ?>

    <div <?php echo $kh_sd_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> aria-hidden="true">
        <div class="kh-divider-track">
            <div class="kh-divider-line"></div>
        </div>
    </div>
    <?php
else :
    /*
     * The line is split around the center element instead of running behind it,
     * so the break is clean on any background. An icon is decorative and keeps the
     * whole divider hidden from assistive technology; a text label is content, so
     * it stays readable to screen readers.
     */
    $kh_sd_center_markup = 'icon' === $kh_sd_center_mode
        ? '<span class="kh-divider-center kh-divider-center-icon">' . kinetichub_sd_center_icon_svg( is_string( $attributes['centerIcon'] ?? null ) ? $attributes['centerIcon'] : 'diamond' ) . '</span>'
        : '<span class="kh-divider-center kh-divider-center-text" dir="auto">' . esc_html( $kh_sd_center_text ) . '</span>';
    ?>

    <div <?php echo $kh_sd_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php echo 'icon' === $kh_sd_center_mode ? ' aria-hidden="true"' : ''; ?>>
        <div class="kh-divider-split">
            <div class="kh-divider-track kh-divider-track-start">
                <div class="kh-divider-line"></div>
            </div>
            <?php echo $kh_sd_center_markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fixed SVG markup or esc_html() text. ?>
            <div class="kh-divider-track kh-divider-track-end">
                <div class="kh-divider-line"></div>
            </div>
        </div>
    </div>
    <?php
endif;
