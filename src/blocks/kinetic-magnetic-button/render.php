<?php
/**
 * Kinetic Magnetic Button - Server Render
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$attributes = $attributes ?? array();
$content = $content ?? '';
$block = $block ?? null;

if ( ! function_exists( 'kinetichub_mb_validate_color_strict' ) ) {
    /**
     * Validate a strict safe subset of CSS colors.
     *
     * @param string $color   Raw color value.
     * @param string $default Default fallback color.
     * @return string
     */
    function kinetichub_mb_validate_color_strict( $color, $default = 'transparent' ) {
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

        // HSL/HSLA support added
        if ( preg_match( '/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) {
            return $color;
        }

        if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $color ) ) {
            return $color;
        }

        return $default;
    }
}

$kh_mb_text = ! empty( $attributes['text'] ) ? $attributes['text'] : 'Discover More';
$kh_mb_url  = ! empty( $attributes['url'] ) ? esc_url_raw( $attributes['url'] ) : '#';

    $kh_mb_link_rel = ! empty( $attributes['linkRel'] ) ? sanitize_text_field( trim( $attributes['linkRel'] ) ) : '';

    $kh_mb_is_outline          = ! empty( $attributes['isOutline'] );
    $kh_mb_open_in_new_tab     = ! empty( $attributes['openInNewTab'] );

    if ( $kh_mb_open_in_new_tab ) {
        $rel_parts = preg_split( '/\s+/', strtolower( $kh_mb_link_rel ) );
        $rel_parts = is_array( $rel_parts ) ? array_filter( $rel_parts ) : array();
        $rel_parts[] = 'noopener';
        $rel_parts[] = 'noreferrer';
        $kh_mb_link_rel = implode( ' ', array_unique( $rel_parts ) );
    }

    $kh_mb_text_separation      = isset( $attributes['textSeparation'] ) ? (bool) $attributes['textSeparation'] : true;
    $kh_mb_hover_scale          = isset( $attributes['hoverScale'] ) ? (bool) $attributes['hoverScale'] : true;
    $kh_mb_enable_pulse         = ! empty( $attributes['enablePulse'] );
    $kh_mb_show_icon            = ! empty( $attributes['showIcon'] );
    $kh_mb_show_icon_normal     = ! empty( $attributes['showIconNormal'] );
    $kh_mb_show_status          = ! empty( $attributes['showStatusIndicator'] );
    $kh_mb_glassmorphism        = ! empty( $attributes['glassmorphism'] );
    $kh_mb_enable_shadow        = isset( $attributes['enableShadow'] ) ? (bool) $attributes['enableShadow'] : true;

    $kh_mb_icon_list    = array( 'arrow', 'chevron', 'play', 'plus', 'download', 'external', 'cart', 'check' );
    $kh_mb_icon_type    = in_array( $attributes['iconType'] ?? '', $kh_mb_icon_list, true ) ? $attributes['iconType'] : 'arrow';

    $kh_mb_pos_list     = array( 'left', 'right' );
    $kh_mb_icon_pos     = in_array( $attributes['iconPosition'] ?? '', $kh_mb_pos_list, true ) ? $attributes['iconPosition'] : 'right';

    $kh_mb_status_list  = array( 'dot', 'radar', 'sparkles', 'badge' );
    $kh_mb_status_type  = in_array( $attributes['statusType'] ?? '', $kh_mb_status_list, true ) ? $attributes['statusType'] : 'dot';

    $kh_mb_border_styles = array( 'solid', 'dashed', 'dotted', 'double' );
    $kh_mb_border_style  = in_array( $attributes['borderStyle'] ?? '', $kh_mb_border_styles, true ) ? $attributes['borderStyle'] : 'solid';

    $kh_mb_align_list = array( 'left', 'center', 'right' );
    $kh_mb_align      = in_array( $attributes['align'] ?? '', $kh_mb_align_list, true ) ? $attributes['align'] : 'center';
    $kh_mb_justify_content_map = array(
        'left'   => 'flex-start',
        'center' => 'center',
        'right'  => 'flex-end',
    );

    $kh_mb_magnetic_strength = max( 0.1, min( 1.0, (float) ( $attributes['magneticStrength'] ?? 0.3 ) ) );
    $kh_mb_magnetic_range    = max( 10, min( 200, (int) ( $attributes['magneticRange'] ?? 60 ) ) );
    $kh_mb_icon_size         = max( 10, min( 100, (int) ( $attributes['iconSize'] ?? 16 ) ) );
    $kh_mb_mobile_icon_size  = max( 10, min( 100, (int) ( $attributes['mobileIconSize'] ?? $kh_mb_icon_size ) ) );
    $kh_mb_border_width      = max( 0, min( 20, (int) ( $attributes['borderWidth'] ?? 0 ) ) );
    $kh_mb_border_radius     = max( 0, min( 100, (int) ( $attributes['borderRadius'] ?? 50 ) ) );

    $kh_mb_shadow_x          = max( -50, min( 50, (int) ( $attributes['shadowX'] ?? 0 ) ) );
    $kh_mb_shadow_y          = max( -50, min( 50, (int) ( $attributes['shadowY'] ?? 8 ) ) );
    $kh_mb_shadow_blur       = max( 0, min( 100, (int) ( $attributes['shadowBlur'] ?? 24 ) ) );
    $kh_mb_shadow_spread     = max( -50, min( 50, (int) ( $attributes['shadowSpread'] ?? 0 ) ) );

    $kh_mb_shadow_hover_x      = max( -50, min( 50, (int) ( $attributes['shadowHoverX'] ?? 0 ) ) );
    $kh_mb_shadow_hover_y      = max( -50, min( 50, (int) ( $attributes['shadowHoverY'] ?? 15 ) ) );
    $kh_mb_shadow_hover_blur   = max( 0, min( 100, (int) ( $attributes['shadowHoverBlur'] ?? 30 ) ) );
    $kh_mb_shadow_hover_spread = max( -50, min( 50, (int) ( $attributes['shadowHoverSpread'] ?? 0 ) ) );

    $kh_mb_padding_v        = max( 0, min( 100, (int) ( $attributes['paddingV'] ?? 18 ) ) );
    $kh_mb_padding_h        = max( 0, min( 150, (int) ( $attributes['paddingH'] ?? 40 ) ) );
    $kh_mb_custom_font_size = max( 0, min( 100, (int) ( $attributes['customFontSize'] ?? 16 ) ) );
    $kh_mb_mobile_font_size_raw = isset( $attributes['mobileFontSize'] ) ? (int) $attributes['mobileFontSize'] : 0;
    $kh_mb_mobile_font_size     = $kh_mb_mobile_font_size_raw > 0 ? max( 1, min( 100, $kh_mb_mobile_font_size_raw ) ) : $kh_mb_custom_font_size;

    $kh_mb_badge_text = ! empty( $attributes['badgeText'] ) ? sanitize_text_field( $attributes['badgeText'] ) : 'New';

    $kh_mb_badge_text_color = kinetichub_mb_validate_color_strict( $attributes['badgeTextColor'] ?? '', '#ffffff' );
    $kh_mb_status_dot_color = kinetichub_mb_validate_color_strict( $attributes['statusDotColor'] ?? '', 'var(--kh-accent, #10b981)' );
    $kh_mb_bg_color         = kinetichub_mb_validate_color_strict( $attributes['bgColor'] ?? '', 'var(--kh-accent, #10b981)' );
    $kh_mb_text_color       = kinetichub_mb_validate_color_strict( $attributes['textColor'] ?? '', '#ffffff' );
    $kh_mb_bg_hover_color   = kinetichub_mb_validate_color_strict( $attributes['bgHoverColor'] ?? '', '' );
    $kh_mb_text_hover_color = kinetichub_mb_validate_color_strict( $attributes['textHoverColor'] ?? '', '' );
    $kh_mb_border_color     = kinetichub_mb_validate_color_strict( $attributes['borderColor'] ?? '', 'transparent' );
    $kh_mb_border_hover     = kinetichub_mb_validate_color_strict( $attributes['borderHoverColor'] ?? '', 'transparent' );
    $kh_mb_shadow_color     = kinetichub_mb_validate_color_strict( $attributes['shadowColor'] ?? '', 'rgba(0,0,0,0.1)' );
    $kh_mb_shadow_hover_col = kinetichub_mb_validate_color_strict( $attributes['shadowHoverColor'] ?? '', 'rgba(0,0,0,0.15)' );

// FREE defaults for PRO features
$kh_mb_hover_effect   = 'none';
$kh_mb_ghost_text     = false;
$kh_mb_neon_glow      = false;
$kh_mb_stretched_link = false;
$kh_mb_entrance_anim  = 'none';
$kh_mb_entrance_delay = 0;
$kh_mb_hide_mobile    = false;
$kh_mb_hide_desktop   = false;



    $kh_mb_active_bg              = $kh_mb_is_outline ? 'transparent' : $kh_mb_bg_color;
    $kh_mb_active_text            = $kh_mb_is_outline ? $kh_mb_bg_color : $kh_mb_text_color;
    $kh_mb_active_border_color    = $kh_mb_is_outline ? $kh_mb_bg_color : $kh_mb_border_color;
    $kh_mb_active_border_width    = $kh_mb_is_outline && 0 === $kh_mb_border_width ? 2 : $kh_mb_border_width;

    $kh_mb_active_bg_hover        = $kh_mb_bg_hover_color ? $kh_mb_bg_hover_color : ( $kh_mb_is_outline ? $kh_mb_bg_color : $kh_mb_active_bg );
    $kh_mb_active_text_hover      = $kh_mb_text_hover_color ? $kh_mb_text_hover_color : ( $kh_mb_is_outline ? $kh_mb_text_color : $kh_mb_active_text );
    $kh_mb_active_border_hover    = $kh_mb_border_hover ? $kh_mb_border_hover : $kh_mb_active_border_color;

    $kh_mb_shadow_base = $kh_mb_enable_shadow && ! $kh_mb_is_outline
        ? "{$kh_mb_shadow_x}px {$kh_mb_shadow_y}px {$kh_mb_shadow_blur}px {$kh_mb_shadow_spread}px {$kh_mb_shadow_color}"
        : 'none';

    $kh_mb_shadow_hover = $kh_mb_enable_shadow && ! $kh_mb_is_outline
        ? "{$kh_mb_shadow_hover_x}px {$kh_mb_shadow_hover_y}px {$kh_mb_shadow_hover_blur}px {$kh_mb_shadow_hover_col}"
        : 'none';

    $kh_mb_css_vars = sprintf(
        '--kh-mb-bg: %1$s; --kh-mb-text: %2$s; --kh-mb-bg-hov: %3$s; --kh-mb-text-hov: %4$s; --kh-mb-bw: %5$dpx; --kh-mb-bc: %6$s; --kh-mb-bc-hov: %7$s; --kh-mb-bs: %8$s; --kh-mb-br: %9$dpx; --kh-mb-pad-v: %10$dpx; --kh-mb-pad-h: %11$dpx; --kh-mb-shadow: %12$s; --kh-mb-shadow-hov: %13$s; --kh-mb-dot: %14$s; --kh-mb-badge-txt: %15$s; --kh-mb-font: %16$s; --kh-mb-font-mob: %17$s; --kh-mb-icon-sz: %18$dpx; --kh-mb-icon-sz-mob: %19$dpx; --kh-mb-range: %20$dpx; --kh-mb-pulse: %21$s;',
        $kh_mb_active_bg,
        $kh_mb_active_text,
        $kh_mb_active_bg_hover,
        $kh_mb_active_text_hover,
        $kh_mb_active_border_width,
        $kh_mb_active_border_color,
        $kh_mb_active_border_hover,
        $kh_mb_border_style,
        $kh_mb_border_radius,
        $kh_mb_padding_v,
        $kh_mb_padding_h,
        $kh_mb_shadow_base,
        $kh_mb_shadow_hover,
        $kh_mb_status_dot_color,
        $kh_mb_badge_text_color,
        $kh_mb_custom_font_size > 0 ? $kh_mb_custom_font_size . 'px' : 'inherit',
        $kh_mb_mobile_font_size > 0 ? $kh_mb_mobile_font_size . 'px' : 'inherit',
        $kh_mb_icon_size,
        $kh_mb_mobile_icon_size,
        $kh_mb_magnetic_range,
        $kh_mb_bg_color
    );

    $kh_mb_wrapper_classes = array( 'kh-mb-wrapper' );



    $kh_mb_wrapper_classes = array_filter( $kh_mb_wrapper_classes );

    $kh_mb_wrapper_style = 'justify-content: ' . $kh_mb_justify_content_map[ $kh_mb_align ] . ';';



    $kh_mb_wrapper_attrs = get_block_wrapper_attributes(
        array(
            'class' => implode( ' ', $kh_mb_wrapper_classes ),
            'style' => $kh_mb_wrapper_style,
        )
    );

    $kh_mb_btn_classes = array(
        'kh-mb-button',
        $kh_mb_glassmorphism && ! $kh_mb_is_outline ? 'is-glass' : '',
        $kh_mb_enable_pulse ? 'is-pulsing' : '',
        $kh_mb_show_icon_normal ? 'icon-always-visible' : '',
    );



    $kh_mb_btn_classes = array_filter( $kh_mb_btn_classes );

    $kh_mb_render_icon = static function ( $type ) {
        switch ( $type ) {
            case 'play':
                return '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
            case 'plus':
                return '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
            case 'chevron':
                return '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            case 'download':
                return '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
            case 'external':
                return '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
            case 'cart':
                return '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
            case 'check':
                return '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            case 'arrow':
            default:
                return '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        }
    };

    $kh_mb_sparkles_svg = '<svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path></svg>';

    // NOTE: block.json viewScript auto-enqueues view.js. Verify 'kinetichub-core-engine'
    // is registered elsewhere and not a duplicate of the viewScript handle.
    $kh_mb_needs_engine = $kh_mb_hover_scale || $kh_mb_text_separation;



    if ( $kh_mb_needs_engine ) {
        wp_enqueue_script( 'kinetichub-core-engine' );
    }
    ?>

    <div <?php echo $kh_mb_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
        <a
            href="<?php echo esc_url( $kh_mb_url ); ?>"
            target="<?php echo esc_attr( $kh_mb_open_in_new_tab ? '_blank' : '_self' ); ?>"
            class="<?php echo esc_attr( implode( ' ', $kh_mb_btn_classes ) ); ?>"
            style="<?php echo esc_attr( $kh_mb_css_vars ); ?>"
            <?php if ( ! empty( $kh_mb_link_rel ) ) : ?>
                rel="<?php echo esc_attr( $kh_mb_link_rel ); ?>"
            <?php endif; ?>
            data-effect="<?php echo esc_attr( $kh_mb_hover_effect ); ?>"
            data-strength="<?php echo esc_attr( $kh_mb_magnetic_strength ); ?>"
            data-range="<?php echo esc_attr( $kh_mb_magnetic_range ); ?>"
            data-parallax="<?php echo esc_attr( $kh_mb_text_separation ? 'true' : 'false' ); ?>"
            data-scale="<?php echo esc_attr( $kh_mb_hover_scale ? 'true' : 'false' ); ?>"
        >
            <span class="kh-mb-hitbox" aria-hidden="true"></span>

            <span class="kh-mb-button-fx" aria-hidden="true"></span>

            <span class="kh-mb-content-wrap">
                <?php if ( $kh_mb_show_status ) : ?>
                    <?php if ( 'radar' === $kh_mb_status_type ) : ?>
                        <span class="kh-mb-status-radar" aria-hidden="true"></span>
                    <?php elseif ( 'sparkles' === $kh_mb_status_type ) : ?>
                        <span class="kh-mb-status-sparkles" aria-hidden="true">
                            <?php echo wp_kses(
                                $kh_mb_sparkles_svg,
                                array(
                                    'svg'      => array(
                                        'width' => true,
                                        'height' => true,
                                        'aria-hidden' => true,
                                        'viewbox' => true,
                                        'fill' => true,
                                        'stroke' => true,
                                        'stroke-width' => true,
                                        'stroke-linecap' => true,
                                        'stroke-linejoin' => true,
                                    ),
                                    'path'     => array( 'd' => true ),
                                )
                            ); ?>
                        </span>
                    <?php elseif ( 'badge' === $kh_mb_status_type ) : ?>
                        <span class="kh-mb-status-badge"><?php echo esc_html( $kh_mb_badge_text ); ?></span>
                    <?php else : ?>
                        <span class="kh-mb-status-dot" aria-hidden="true"></span>
                    <?php endif; ?>
                <?php endif; ?>

                <?php if ( $kh_mb_show_icon && 'left' === $kh_mb_icon_pos ) : ?>
                    <span class="kh-mb-icon kh-mb-icon-left pos-left" aria-hidden="true">
                        <?php echo wp_kses(
                            $kh_mb_render_icon( $kh_mb_icon_type ),
                            array(
                                'svg'      => array(
                                    'width' => true,
                                    'height' => true,
                                    'aria-hidden' => true,
                                    'viewbox' => true,
                                    'fill' => true,
                                    'stroke' => true,
                                    'stroke-width' => true,
                                    'stroke-linecap' => true,
                                    'stroke-linejoin' => true,
                                ),
                                'polygon'  => array( 'points' => true ),
                                'polyline' => array( 'points' => true ),
                                'line'     => array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true ),
                                'path'     => array( 'd' => true ),
                                'circle'   => array( 'cx' => true, 'cy' => true, 'r' => true ),
                            )
                        ); ?>
                    </span>
                <?php endif; ?>

                <span class="kh-mb-text-inner"><?php echo wp_kses_post( $kh_mb_text ); ?></span>

                <?php if ( $kh_mb_show_icon && 'right' === $kh_mb_icon_pos ) : ?>
                    <span class="kh-mb-icon kh-mb-icon-right pos-right" aria-hidden="true">
                        <?php echo wp_kses(
                            $kh_mb_render_icon( $kh_mb_icon_type ),
                            array(
                                'svg'      => array(
                                    'width' => true,
                                    'height' => true,
                                    'aria-hidden' => true,
                                    'viewbox' => true,
                                    'fill' => true,
                                    'stroke' => true,
                                    'stroke-width' => true,
                                    'stroke-linecap' => true,
                                    'stroke-linejoin' => true,
                                ),
                                'polygon'  => array( 'points' => true ),
                                'polyline' => array( 'points' => true ),
                                'line'     => array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true ),
                                'path'     => array( 'd' => true ),
                                'circle'   => array( 'cx' => true, 'cy' => true, 'r' => true ),
                            )
                        ); ?>
                    </span>
                <?php endif; ?>
            </span>
        </a>
    </div>