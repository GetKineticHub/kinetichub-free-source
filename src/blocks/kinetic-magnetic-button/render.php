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

/*
 * Button model: the PHP twin of button-model.js; keep the two in step.
 *
 * Button 1 is the block's top-level attributes; Buttons 2-4 are the objects in
 * `buttons`, keyed by the same names. Loosely typed values follow empty(), as
 * this file always has, and button-model.js mirrors empty() for JSON values.
 */
if ( ! function_exists( 'kinetichub_mb_button_items' ) ) {
    /**
     * The stored items that render as Buttons 2-4. Entries that are not objects
     * are skipped; items past the fourth button stay stored but do not render.
     *
     * @param array $attributes Block attributes.
     * @return array At most three items.
     */
    function kinetichub_mb_button_items( $attributes ) {
        $stored = isset( $attributes['buttons'] ) && is_array( $attributes['buttons'] ) ? $attributes['buttons'] : array();
        $items  = array();

        // A JSON array only: an object keyed by names is not a button list.
        if ( array_values( $stored ) !== $stored ) {
            return $items;
        }

        foreach ( $stored as $item ) {
            if ( count( $items ) >= 3 ) {
                break;
            }

            if ( is_array( $item ) ) {
                $items[] = $item;
            }
        }

        return $items;
    }
}

if ( ! function_exists( 'kinetichub_mb_normalize_button' ) ) {
    /**
     * One button's own settings, normalized. Button 1 keeps its historical
     * "Discover More" fallback; an additional button's label is kept as stored.
     *
     * @param mixed $source     Block attributes (Button 1) or a stored item.
     * @param bool  $is_primary Whether this is Button 1.
     * @return array
     */
    function kinetichub_mb_normalize_button( $source, $is_primary ) {
        $source     = is_array( $source ) ? $source : array();
        $text       = isset( $source['text'] ) && is_string( $source['text'] ) ? $source['text'] : '';
        $url        = isset( $source['url'] ) && is_string( $source['url'] ) ? $source['url'] : '';
        $link_rel   = isset( $source['linkRel'] ) && is_string( $source['linkRel'] ) ? $source['linkRel'] : '';
        $badge_text = isset( $source['badgeText'] ) && is_string( $source['badgeText'] ) ? $source['badgeText'] : '';

        if ( $is_primary ) {
            // Outline stays in the legacy isOutline attribute; buttonStyle is stored only for Soft.
            if ( isset( $source['buttonStyle'] ) && 'soft' === $source['buttonStyle'] ) {
                $style = 'soft';
            } else {
                $style = empty( $source['isOutline'] ) ? 'solid' : 'outline';
            }
        } else {
            $style = in_array( $source['buttonStyle'] ?? '', array( 'solid', 'soft', 'outline' ), true ) ? $source['buttonStyle'] : 'outline';
        }

        return array(
            'isPrimary'           => (bool) $is_primary,
            'text'                => $is_primary && empty( $text ) ? 'Discover More' : $text,
            'url'                 => empty( $url ) ? '#' : $url,
            'openInNewTab'        => ! empty( $source['openInNewTab'] ),
            'linkRel'             => empty( $link_rel ) ? '' : $link_rel,
            'buttonStyle'         => $style,
            'showIcon'            => ! empty( $source['showIcon'] ),
            'iconType'            => in_array( $source['iconType'] ?? '', array( 'arrow', 'chevron', 'play', 'plus', 'download', 'external', 'cart', 'check' ), true ) ? $source['iconType'] : 'arrow',
            'iconPosition'        => in_array( $source['iconPosition'] ?? '', array( 'left', 'right' ), true ) ? $source['iconPosition'] : 'right',
            'showStatusIndicator' => ! empty( $source['showStatusIndicator'] ),
            'statusType'          => in_array( $source['statusType'] ?? '', array( 'dot', 'radar', 'sparkles', 'badge' ), true ) ? $source['statusType'] : 'dot',
            'badgeText'           => empty( $badge_text ) ? 'New' : $badge_text,
            'enablePulse'         => ! empty( $source['enablePulse'] ),
        );
    }
}

if ( ! function_exists( 'kinetichub_mb_get_buttons' ) ) {
    /**
     * Every button of the block, in order: Button 1, then up to three items.
     *
     * @param array $attributes Block attributes.
     * @return array Normalized buttons.
     */
    function kinetichub_mb_get_buttons( $attributes ) {
        $buttons = array( kinetichub_mb_normalize_button( $attributes, true ) );

        foreach ( kinetichub_mb_button_items( $attributes ) as $item ) {
            $buttons[] = kinetichub_mb_normalize_button( $item, false );
        }

        return $buttons;
    }
}

if ( ! function_exists( 'kinetichub_mb_button_is_rendered' ) ) {
    /**
     * Button 1 always renders; an additional button with an empty or
     * whitespace-only label (ASCII whitespace or no-break spaces) does not.
     *
     * @param array $button A normalized button.
     * @return bool
     */
    function kinetichub_mb_button_is_rendered( $button ) {
        if ( ! empty( $button['isPrimary'] ) ) {
            return true;
        }

        $text = isset( $button['text'] ) && is_string( $button['text'] ) ? $button['text'] : '';

        return '' !== str_replace( array( ' ', "\t", "\n", "\r", "\f", "\v", "\xC2\xA0" ), '', $text );
    }
}

if ( ! function_exists( 'kinetichub_mb_group_settings' ) ) {
    /**
     * Group settings, and whether the block renders group markup at all: it
     * does once there is an additional button, once Button 1 is Soft, or once
     * any group attribute holds a valid value.
     *
     * @param array $attributes Block attributes.
     * @return array count, isGroup, layout, mobileLayout, gap.
     */
    function kinetichub_mb_group_settings( $attributes ) {
        $count         = 1 + count( kinetichub_mb_button_items( $attributes ) );
        $layout        = $attributes['buttonLayout'] ?? '';
        $mobile_layout = $attributes['buttonMobileLayout'] ?? '';
        $gap           = $attributes['buttonGap'] ?? null;
        $has_layout    = in_array( $layout, array( 'row', 'stack' ), true );
        $has_mobile    = in_array( $mobile_layout, array( 'auto', 'stack', 'full-width' ), true );
        $has_gap       = ( is_int( $gap ) || is_float( $gap ) ) && is_finite( (float) $gap );

        return array(
            'count'        => $count,
            'isGroup'      => $count > 1 || 'soft' === ( $attributes['buttonStyle'] ?? '' ) || $has_layout || $has_mobile || $has_gap,
            'layout'       => $has_layout ? $layout : 'row',
            'mobileLayout' => $has_mobile ? $mobile_layout : 'auto',
            'gap'          => $has_gap ? (int) floor( max( 0, min( 100, (float) $gap ) ) + 0.5 ) : 12,
        );
    }
}

if ( ! function_exists( 'kinetichub_mb_resolve_rel' ) ) {
    /**
     * The rel a button renders with: a new-tab link lowercases the tokens and
     * adds noopener + noreferrer once each; otherwise rel is as given.
     *
     * @param string $rel     Sanitized rel value.
     * @param bool   $new_tab Whether the link opens in a new tab.
     * @return string
     */
    function kinetichub_mb_resolve_rel( $rel, $new_tab ) {
        $rel = is_string( $rel ) ? $rel : '';

        if ( ! $new_tab ) {
            return $rel;
        }

        $rel_parts   = preg_split( '/\s+/', strtolower( $rel ) );
        $rel_parts   = is_array( $rel_parts ) ? array_filter( $rel_parts ) : array();
        $rel_parts[] = 'noopener';
        $rel_parts[] = 'noreferrer';

        return implode( ' ', array_unique( $rel_parts ) );
    }
}

$kh_mb_buttons  = kinetichub_mb_get_buttons( $attributes );
$kh_mb_group    = kinetichub_mb_group_settings( $attributes );
$kh_mb_is_group = $kh_mb_group['isGroup'];

    $kh_mb_text_separation      = isset( $attributes['textSeparation'] ) ? (bool) $attributes['textSeparation'] : true;
    $kh_mb_hover_scale          = isset( $attributes['hoverScale'] ) ? (bool) $attributes['hoverScale'] : true;
    $kh_mb_show_icon_normal     = ! empty( $attributes['showIconNormal'] );
    $kh_mb_glassmorphism        = ! empty( $attributes['glassmorphism'] );
    $kh_mb_enable_shadow        = isset( $attributes['enableShadow'] ) ? (bool) $attributes['enableShadow'] : true;

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



    $kh_mb_wrapper_classes = array( 'kh-mb-wrapper' );

    

    // Group markup only: a block without it renders exactly as it did before 1.2.0.
    if ( $kh_mb_is_group ) {
        $kh_mb_wrapper_classes[] = 'kh-mb-group';
        $kh_mb_wrapper_classes[] = 'kh-mb-layout-' . $kh_mb_group['layout'];
        $kh_mb_wrapper_classes[] = 'kh-mb-mobile-' . $kh_mb_group['mobileLayout'];
    }

    $kh_mb_wrapper_classes = array_filter( $kh_mb_wrapper_classes );

    $kh_mb_wrapper_style = 'justify-content: ' . $kh_mb_justify_content_map[ $kh_mb_align ] . ';';

    

    // justify-content aligns a row; a column aligns its buttons across, so the stylesheet reads the same value from --kh-mb-align.
    if ( $kh_mb_is_group ) {
        $kh_mb_wrapper_style .= sprintf( ' --kh-mb-gap: %dpx; --kh-mb-align: %s;', $kh_mb_group['gap'], $kh_mb_justify_content_map[ $kh_mb_align ] );
    }

    $kh_mb_wrapper_attrs = get_block_wrapper_attributes(
        array(
            'class' => implode( ' ', $kh_mb_wrapper_classes ),
            'style' => $kh_mb_wrapper_style,
        )
    );

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

    // One entry per rendered button: the normalized button plus what its markup needs.
    // Shared settings are the same for every button; only the button's own settings differ.
    $kh_mb_views = array();

    foreach ( $kh_mb_buttons as $kh_mb_button ) {
        if ( ! kinetichub_mb_button_is_rendered( $kh_mb_button ) ) {
            continue;
        }

        $kh_mb_is_outline = 'outline' === $kh_mb_button['buttonStyle'];
        $kh_mb_is_soft    = 'soft' === $kh_mb_button['buttonStyle'];

        $kh_mb_active_bg              = $kh_mb_is_outline ? 'transparent' : $kh_mb_bg_color;
        $kh_mb_active_text            = $kh_mb_is_outline ? $kh_mb_bg_color : $kh_mb_text_color;
        $kh_mb_active_border_color    = $kh_mb_is_outline ? $kh_mb_bg_color : $kh_mb_border_color;
        $kh_mb_active_border_width    = $kh_mb_is_outline && 0 === $kh_mb_border_width ? 2 : $kh_mb_border_width;

        $kh_mb_active_bg_hover        = $kh_mb_bg_hover_color ? $kh_mb_bg_hover_color : ( $kh_mb_is_outline ? $kh_mb_bg_color : $kh_mb_active_bg );
        $kh_mb_active_text_hover      = $kh_mb_text_hover_color ? $kh_mb_text_hover_color : ( $kh_mb_is_outline ? $kh_mb_text_color : $kh_mb_active_text );
        $kh_mb_active_border_hover    = $kh_mb_border_hover ? $kh_mb_border_hover : $kh_mb_active_border_color;

        /*
         * Soft: a tint of the background colour with the label in that colour,
         * shaded towards the text colour around the block (currentColor, here
         * the inherited colour), so it stays dark on a light section and light
         * on a dark one. The Text Color setting is the label of a filled
         * button, so Soft does not use it. Hover deepens the tint; the hover
         * text colour applies once a hover background is chosen as well
         * (textHoverColor defaults to white, unreadable on a tint).
         */
        if ( $kh_mb_is_soft ) {
            $kh_mb_active_bg         = sprintf( 'color-mix(in srgb, %s 14%%, transparent)', $kh_mb_bg_color );
            $kh_mb_active_text       = sprintf( 'color-mix(in srgb, %s 56%%, currentColor)', $kh_mb_bg_color );
            $kh_mb_active_bg_hover   = $kh_mb_bg_hover_color ? $kh_mb_bg_hover_color : sprintf( 'color-mix(in srgb, %s 12%%, transparent)', $kh_mb_bg_color );
            $kh_mb_active_text_hover = $kh_mb_bg_hover_color && $kh_mb_text_hover_color ? $kh_mb_text_hover_color : $kh_mb_active_text;
        }

        // In a group, the transparent default no longer empties an Outline or Soft border on hover (the hover
        // fill sits inside the border, so it left a see-through ring); a chosen hover border colour still applies.
        if ( $kh_mb_is_group && ( $kh_mb_is_outline || $kh_mb_is_soft ) && 'transparent' === $kh_mb_border_hover ) {
            $kh_mb_active_border_hover = $kh_mb_active_border_color;
        }

        // Outline and Soft cast no drop shadow.
        $kh_mb_shadow_base = $kh_mb_enable_shadow && ! $kh_mb_is_outline && ! $kh_mb_is_soft
            ? "{$kh_mb_shadow_x}px {$kh_mb_shadow_y}px {$kh_mb_shadow_blur}px {$kh_mb_shadow_spread}px {$kh_mb_shadow_color}"
            : 'none';

        $kh_mb_shadow_hover = $kh_mb_enable_shadow && ! $kh_mb_is_outline && ! $kh_mb_is_soft
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

        // The neon glow and ripple are drawn in the hover background, which on Soft is a faint tint: Soft glows in the full colour.
        if ( $kh_mb_is_soft ) {
            $kh_mb_css_vars .= sprintf( ' --kh-mb-glow: %s;', $kh_mb_bg_hover_color ? $kh_mb_bg_hover_color : $kh_mb_bg_color );
        }

        $kh_mb_btn_classes = array(
            'kh-mb-button',
            $kh_mb_is_group ? 'kh-mb-style-' . $kh_mb_button['buttonStyle'] : '',
            $kh_mb_glassmorphism && ! $kh_mb_is_outline ? 'is-glass' : '',
            $kh_mb_button['enablePulse'] ? 'is-pulsing' : '',
            $kh_mb_show_icon_normal ? 'icon-always-visible' : '',
        );

        

        $kh_mb_btn_classes = array_filter( $kh_mb_btn_classes );

        $kh_mb_link_rel = '' !== $kh_mb_button['linkRel'] ? sanitize_text_field( trim( $kh_mb_button['linkRel'] ) ) : '';

        $kh_mb_views[] = array_merge(
            $kh_mb_button,
            array(
                'href'      => esc_url_raw( $kh_mb_button['url'] ),
                'classes'   => implode( ' ', $kh_mb_btn_classes ),
                'style'     => $kh_mb_css_vars,
                'rel'       => kinetichub_mb_resolve_rel( $kh_mb_link_rel, $kh_mb_button['openInNewTab'] ),
                'badgeLabel' => sanitize_text_field( $kh_mb_button['badgeText'] ),
            )
        );
    }

    // NOTE: block.json viewScript auto-enqueues view.js. Verify 'kinetichub-core-engine'
    // is registered elsewhere and not a duplicate of the viewScript handle.
    $kh_mb_needs_engine = $kh_mb_hover_scale || $kh_mb_text_separation;

    

    if ( $kh_mb_needs_engine ) {
        wp_enqueue_script( 'kinetichub-core-engine' );
    }
    ?>

    <div <?php echo $kh_mb_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
<?php foreach ( $kh_mb_views as $kh_mb_view ) : ?>
        <a
            href="<?php echo esc_url( $kh_mb_view['href'] ); ?>"
            target="<?php echo esc_attr( $kh_mb_view['openInNewTab'] ? '_blank' : '_self' ); ?>"
            class="<?php echo esc_attr( $kh_mb_view['classes'] ); ?>"
            style="<?php echo esc_attr( $kh_mb_view['style'] ); ?>"
            <?php if ( ! empty( $kh_mb_view['rel'] ) ) : ?>
                rel="<?php echo esc_attr( $kh_mb_view['rel'] ); ?>"
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
                <?php if ( $kh_mb_view['showStatusIndicator'] ) : ?>
                    <?php if ( 'radar' === $kh_mb_view['statusType'] ) : ?>
                        <span class="kh-mb-status-radar" aria-hidden="true"></span>
                    <?php elseif ( 'sparkles' === $kh_mb_view['statusType'] ) : ?>
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
                    <?php elseif ( 'badge' === $kh_mb_view['statusType'] ) : ?>
                        <span class="kh-mb-status-badge"><?php echo esc_html( $kh_mb_view['badgeLabel'] ); ?></span>
                    <?php else : ?>
                        <span class="kh-mb-status-dot" aria-hidden="true"></span>
                    <?php endif; ?>
                <?php endif; ?>

                <?php if ( $kh_mb_view['showIcon'] && 'left' === $kh_mb_view['iconPosition'] ) : ?>
                    <span class="kh-mb-icon kh-mb-icon-left pos-left" aria-hidden="true">
                        <?php echo wp_kses(
                            $kh_mb_render_icon( $kh_mb_view['iconType'] ),
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

                <span class="kh-mb-text-inner"><?php echo wp_kses_post( $kh_mb_view['text'] ); ?></span>

                <?php if ( $kh_mb_view['showIcon'] && 'right' === $kh_mb_view['iconPosition'] ) : ?>
                    <span class="kh-mb-icon kh-mb-icon-right pos-right" aria-hidden="true">
                        <?php echo wp_kses(
                            $kh_mb_render_icon( $kh_mb_view['iconType'] ),
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
<?php if ( $kh_mb_is_group && $kh_mb_view['openInNewTab'] ) : ?>
            <span class="kh-mb-sr-only"><?php echo esc_html__( '(opens in a new tab)', 'kinetichub' ); ?></span>
<?php endif; ?>
        </a>
<?php endforeach; ?>
    </div>