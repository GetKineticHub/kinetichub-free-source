<?php
/**
 * Kinetic Split Scroll - Server Render Logic
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'kinetichub_ss_validate_color_strict' ) ) {
    function kinetichub_ss_validate_color_strict( $color, $default = 'transparent' ) {
        $color = is_string( $color ) ? trim( $color ) : '';
        if ( '' === $color ) return $default;
        if ( preg_match( '/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/', $color ) ) return $color;
        if ( preg_match( '/^rgba?\(\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) return $color;
        if ( preg_match( '/^hsla?\(\s*(\d+)\s*,\s*(\d+%)\s*,\s*(\d+%)\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) return $color;
        if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $color ) ) return $color;
        return $default;
    }
}

if ( ! function_exists( 'kinetichub_ss_get_media_url' ) ) {
    function kinetichub_ss_get_media_url( $item, $image_size ) {
        $kh_ss_item = is_array( $item ) ? $item : array();
        if ( isset( $kh_ss_item['sizes'][ $image_size ]['url'] ) ) {
            return (string) $kh_ss_item['sizes'][ $image_size ]['url'];
        }
        return ! empty( $kh_ss_item['url'] ) ? (string) $kh_ss_item['url'] : '';
    }
}

if ( ! function_exists( 'kinetichub_ss_render_media_tag' ) ) {
    function kinetichub_ss_render_media_tag( $url, $alt, $loading ) {
        $kh_ss_safe_url = esc_url( $url );
        $kh_ss_safe_alt = esc_attr( $alt );
        if ( preg_match( '/\.(mp4|webm)$/i', $url ) ) {
            return sprintf( '<video src="%1$s" autoplay loop muted playsinline aria-hidden="true"></video>', $kh_ss_safe_url );
        }
        return sprintf( '<img src="%1$s" alt="%2$s" loading="%3$s" decoding="async" />', $kh_ss_safe_url, $kh_ss_safe_alt, esc_attr( $loading ) );
    }
}

$kh_ss_raw_content = isset( $content ) ? (string) $content : '';
$kh_ss_media_items = ! empty( $attributes['mediaItems'] ) && is_array( $attributes['mediaItems'] ) ? $attributes['mediaItems'] : array();

if ( empty( $kh_ss_media_items ) && '' === trim( wp_strip_all_tags( $kh_ss_raw_content ) ) ) {
    return;
}

$kh_ss_align_list       = array( 'full', 'wide', 'center', 'left', 'right', '' );
$kh_ss_raw_align        = $attributes['align'] ?? '';
$kh_ss_align            = in_array( $kh_ss_raw_align, $kh_ss_align_list, true ) ? $kh_ss_raw_align : '';

$kh_ss_pinned_side_list = array( 'left', 'right' );
$kh_ss_pinned_side      = in_array( $attributes['pinnedSide'] ?? '', $kh_ss_pinned_side_list, true ) ? $attributes['pinnedSide'] : 'left';

$kh_ss_col_ratio_list   = array( '50/50', '40/60', '60/40' );
$kh_ss_column_ratio     = in_array( $attributes['columnRatio'] ?? '', $kh_ss_col_ratio_list, true ) ? $attributes['columnRatio'] : '50/50';

$kh_ss_stack_list       = array( 'media-first', 'text-first' );
$kh_ss_stack_on_mobile  = in_array( $attributes['stackOnMobile'] ?? '', $kh_ss_stack_list, true ) ? $attributes['stackOnMobile'] : 'media-first';

$kh_ss_image_size_list  = array( 'full', 'large', 'medium' );
$kh_ss_image_size       = in_array( $attributes['imageSize'] ?? '', $kh_ss_image_size_list, true ) ? $attributes['imageSize'] : 'large';

$kh_ss_fit_list         = array( 'cover', 'contain', 'fill' );
$kh_ss_object_fit       = in_array( $attributes['objectFit'] ?? '', $kh_ss_fit_list, true ) ? $attributes['objectFit'] : 'cover';

$kh_ss_pos_list         = array( 'center', 'top', 'bottom', 'left', 'right' );
$kh_ss_object_position  = in_array( $attributes['objectPosition'] ?? '', $kh_ss_pos_list, true ) ? $attributes['objectPosition'] : 'center';

// FREE: indicator limited to line/none
$kh_ss_indicator_list   = array( 'line', 'none' );
/* <fs_premium_only> */
$kh_ss_indicator_list   = array( 'line', 'none', 'dots', 'percentage' );
/* </fs_premium_only> */
$kh_ss_indicator_type   = in_array( $attributes['indicatorType'] ?? '', $kh_ss_indicator_list, true ) ? $attributes['indicatorType'] : 'line';

// FREE: media shape always default
$kh_ss_media_shape = 'default';
/* <fs_premium_only> */
$kh_ss_shape_list       = array( 'default', 'floating', 'arch', 'pill' );
$kh_ss_media_shape      = in_array( $attributes['mediaShape'] ?? '', $kh_ss_shape_list, true ) ? $attributes['mediaShape'] : 'default';
/* </fs_premium_only> */

// FREE: text effect limited to none/fade-up
$kh_ss_text_fx_list     = array( 'none', 'fade-up' );
/* <fs_premium_only> */
$kh_ss_text_fx_list     = array( 'none', 'fade-up', 'focus' );
/* </fs_premium_only> */
$kh_ss_text_effect      = in_array( $attributes['textEffect'] ?? '', $kh_ss_text_fx_list, true ) ? $attributes['textEffect'] : 'none';

// FREE: swap transition always fade
$kh_ss_swap_transition = 'fade';
/* <fs_premium_only> */
$kh_ss_swap_list        = array( 'fade', 'wipe', 'circle', 'diagonal' );
$kh_ss_swap_transition  = in_array( $attributes['swapTransition'] ?? '', $kh_ss_swap_list, true ) ? $attributes['swapTransition'] : 'fade';
/* </fs_premium_only> */

// FREE: shadow style always soft
$kh_ss_shadow_style = 'soft';
/* <fs_premium_only> */
$kh_ss_shadow_list      = array( 'soft', 'crisp', 'float', 'glow', 'elegant' );
$kh_ss_shadow_style     = in_array( $attributes['shadowStyle'] ?? '', $kh_ss_shadow_list, true ) ? $attributes['shadowStyle'] : 'soft';
/* </fs_premium_only> */

$kh_ss_sticky_offset    = max( 0, min( 200, (int) ( $attributes['stickyOffset'] ?? 0 ) ) );
$kh_ss_overlay_opacity  = max( 0.0, min( 1.0, (float) ( $attributes['overlayOpacity'] ?? 0 ) ) );

$kh_ss_pinned_bg_color = kinetichub_ss_validate_color_strict( $attributes['pinnedBgColor'] ?? '', 'transparent' );
$kh_ss_accent_color    = kinetichub_ss_validate_color_strict( $attributes['accentColor'] ?? '', 'var(--kh-accent, #10b981)' );
$kh_ss_overlay_tint    = kinetichub_ss_validate_color_strict( $attributes['overlayTint'] ?? '', '#000000' );

$kh_ss_enable_sticky_mob = ! empty( $attributes['enableStickyMobile'] );
$kh_ss_enable_smart_swap = ! empty( $attributes['enableSmartSwap'] );
$kh_ss_enable_snap       = ! empty( $attributes['enableSnap'] );

// FREE defaults for PRO-only booleans
$kh_ss_dots_interactive  = false;
$kh_ss_inner_parallax    = false;
$kh_ss_ambient_glow      = false;
$kh_ss_bg_morphing       = false;
$kh_ss_enable_ken_burns  = false;
$kh_ss_hide_mobile       = false;
$kh_ss_hide_desktop      = false;
$kh_ss_container_shadow  = false;

// FREE defaults for PRO-only color/number values
$kh_ss_glow_color      = 'rgba(16, 185, 129, 0.6)';
$kh_ss_glow_spread     = 40;
$kh_ss_bg_morph_start  = 'transparent';
$kh_ss_bg_morph_end    = 'transparent';
$kh_ss_shadow_color    = '';
$kh_ss_shadow_softness = '';

/* <fs_premium_only> */
$kh_ss_dots_interactive  = ! empty( $attributes['dotsInteractive'] );
$kh_ss_inner_parallax    = ! empty( $attributes['innerParallax'] );
$kh_ss_ambient_glow      = ! empty( $attributes['ambientGlow'] );
$kh_ss_bg_morphing       = ! empty( $attributes['scrollBgMorphing'] );
$kh_ss_enable_ken_burns  = ! empty( $attributes['enableKenBurns'] );
$kh_ss_hide_mobile       = ! empty( $attributes['hideOnMobile'] );
$kh_ss_hide_desktop      = ! empty( $attributes['hideOnDesktop'] );
$kh_ss_container_shadow  = ! empty( $attributes['containerShadow'] );

$kh_ss_glow_spread      = max( 10, min( 150, (int) ( $attributes['ambientGlowSpread'] ?? 40 ) ) );
$kh_ss_glow_color       = kinetichub_ss_validate_color_strict( $attributes['ambientGlowColor'] ?? '', 'rgba(16, 185, 129, 0.6)' );
$kh_ss_bg_morph_start   = kinetichub_ss_validate_color_strict( $attributes['bgMorphStart'] ?? '', 'transparent' );
$kh_ss_bg_morph_end     = kinetichub_ss_validate_color_strict( $attributes['bgMorphEnd'] ?? '', 'transparent' );
$kh_ss_shadow_color     = kinetichub_ss_validate_color_strict( $attributes['shadowColor'] ?? '', '' );
$kh_ss_shadow_softness  = isset($attributes['shadowSoftness']) ? (int) $attributes['shadowSoftness'] : '';
$kh_ss_floating_shadow_opacity = isset( $attributes['floatingCardShadowOpacity'] )
    ? max( 0, min( 0.4, (float) $attributes['floatingCardShadowOpacity'] ) )
    : 0.2;
/* </fs_premium_only> */

$kh_ss_max_items = 3;
/* <fs_premium_only> */
$kh_ss_max_items = 50;
/* </fs_premium_only> */

$kh_ss_left_width  = '50%';
$kh_ss_right_width = '50%';

if ( '40/60' === $kh_ss_column_ratio ) {
    $kh_ss_left_width  = '40%';
    $kh_ss_right_width = '60%';
} elseif ( '60/40' === $kh_ss_column_ratio ) {
    $kh_ss_left_width  = '60%';
    $kh_ss_right_width = '40%';
}

$kh_ss_pinned_width = ( 'left' === $kh_ss_pinned_side ) ? $kh_ss_left_width : $kh_ss_right_width;
$kh_ss_scroll_width = ( 'left' === $kh_ss_pinned_side ) ? $kh_ss_right_width : $kh_ss_left_width;

$kh_ss_media_items = array_slice( $kh_ss_media_items, 0, $kh_ss_max_items );
$kh_ss_media_items = array_map( static function ( $item ) { return is_array( $item ) ? $item : (array) $item; }, $kh_ss_media_items );

$kh_ss_css_vars = sprintf(
    '--kh-ss-pin-w: %1$s; --kh-ss-scroll-w: %2$s; --kh-ss-offset: %3$dpx; --kh-ss-fit: %4$s; --kh-ss-pos: %5$s; --kh-ss-tint: %6$s; --kh-ss-tint-op: %7$s; --kh-ss-accent: %8$s; --kh-ss-dir: %9$s; --kh-ss-mob-dir: %10$s; --kh-ss-pin-bg: %11$s;',
    $kh_ss_pinned_width,
    $kh_ss_scroll_width,
    $kh_ss_sticky_offset,
    $kh_ss_object_fit,
    $kh_ss_object_position,
    $kh_ss_overlay_tint,
    (string) $kh_ss_overlay_opacity,
    $kh_ss_accent_color,
    ( 'left' === $kh_ss_pinned_side ) ? 'row' : 'row-reverse',
    ( 'media-first' === $kh_ss_stack_on_mobile ) ? 'column' : 'column-reverse',
    $kh_ss_pinned_bg_color
);

/* <fs_premium_only> */
$kh_ss_css_vars .= sprintf(
    ' --kh-ss-glow-c: %1$s; --kh-ss-glow-s: %2$dpx; --kh-ss-bg-start: %3$s; --kh-ss-bg-end: %4$s;',
    $kh_ss_glow_color,
    $kh_ss_glow_spread,
    $kh_ss_bg_morph_start,
    $kh_ss_bg_morph_end
);

$kh_ss_css_vars .= sprintf(
    ' --kh-ss-floating-shadow-opacity: %s;',
    esc_attr( (string) $kh_ss_floating_shadow_opacity )
);

if ( $kh_ss_container_shadow ) {
    if ( '' !== $kh_ss_shadow_color ) {
        $kh_ss_css_vars .= sprintf( ' --kh-ss-shadow-c: %s;', $kh_ss_shadow_color );
    }
    if ( '' !== $kh_ss_shadow_softness ) {
        $kh_ss_css_vars .= sprintf( ' --kh-ss-shadow-blur: %dpx;', $kh_ss_shadow_softness );
    }
}
/* </fs_premium_only> */

$kh_ss_classes = array_filter(
    array(
        'kh-ss-wrapper',
        'full' === $kh_ss_align ? 'alignfull' : '',
        'wide' === $kh_ss_align ? 'alignwide' : '',
        'text-fx-' . $kh_ss_text_effect,
        'swap-trans-' . $kh_ss_swap_transition,
        $kh_ss_enable_snap ? 'has-scroll-snap' : '',
        $kh_ss_enable_sticky_mob ? 'has-mobile-sticky' : '',
    )
);

/* <fs_premium_only> */
if ( $kh_ss_enable_ken_burns ) {
    $kh_ss_classes[] = 'has-ken-burns';
}
if ( $kh_ss_bg_morphing ) {
    $kh_ss_classes[] = 'has-bg-morph';
}
if ( $kh_ss_hide_mobile ) {
    $kh_ss_classes[] = 'kh-hide-mobile';
}
if ( $kh_ss_hide_desktop ) {
    $kh_ss_classes[] = 'kh-hide-desktop';
}
if ( $kh_ss_container_shadow ) {
    $kh_ss_classes[] = 'has-shadow';
    $kh_ss_classes[] = 'shadow-' . $kh_ss_shadow_style;
}
/* </fs_premium_only> */

$kh_ss_wrapper_attrs = get_block_wrapper_attributes(
    array(
        'class'                 => implode( ' ', $kh_ss_classes ),
        'style'                 => $kh_ss_css_vars,
        'data-shape'            => $kh_ss_media_shape,
        'data-offset'           => (string) $kh_ss_sticky_offset,
        'data-sticky-mobile'    => $kh_ss_enable_sticky_mob ? 'true' : 'false',
        'data-parallax'         => $kh_ss_inner_parallax ? 'true' : 'false',
        'data-dots-interactive' => $kh_ss_dots_interactive ? 'true' : 'false',
        'data-bg-morph'         => $kh_ss_bg_morphing ? 'true' : 'false',
        'role'                  => 'region',
        'aria-label'            => __( 'Scrollable Media Section', 'kinetichub' ),
    )
);

$kh_ss_indicator_class = 'kh-ss-indicator-wrap pos-' . sanitize_html_class( $kh_ss_pinned_side );
if ( 'percentage' === $kh_ss_indicator_type ) {
    $kh_ss_indicator_class .= ' has-percentage';
}

$kh_ss_allowed_media_tags = array(
    'img'   => array( 'src' => true, 'alt' => true, 'loading' => true, 'decoding' => true ),
    'video' => array( 'src' => true, 'autoplay' => true, 'loop' => true, 'muted' => true, 'playsinline' => true, 'aria-hidden' => true ),
);
?>

<div <?php echo $kh_ss_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
    <div class="kh-ss-pinned-col">
        <?php /* <fs_premium_only> */ ?>
        <?php if ( $kh_ss_ambient_glow ) : ?>
            <div class="kh-ss-ambient-glow" aria-hidden="true"></div>
        <?php endif; ?>
        <?php /* </fs_premium_only> */ ?>

        <div class="kh-ss-media-inner">
            <?php foreach ( $kh_ss_media_items as $kh_ss_index => $kh_ss_item ) : ?>
                <?php
                $kh_ss_safe_alt  = ! empty( $kh_ss_item['alt'] ) ? sanitize_text_field( $kh_ss_item['alt'] ) : __( 'Media element', 'kinetichub' );
                $kh_ss_media_url = kinetichub_ss_get_media_url( $kh_ss_item, $kh_ss_image_size );
                ?>
                <div class="kh-ss-media-layer <?php echo esc_attr( 0 === $kh_ss_index ? 'is-active' : '' ); ?>" data-index="<?php echo esc_attr( $kh_ss_index ); ?>">
                    <?php
                    echo wp_kses(
                        kinetichub_ss_render_media_tag(
                            $kh_ss_media_url,
                            $kh_ss_safe_alt,
                            0 === $kh_ss_index ? 'eager' : 'lazy'
                        ),
                        $kh_ss_allowed_media_tags
                    );
                    ?>
                </div>
            <?php endforeach; ?>
            <div class="kh-ss-overlay-tint" aria-hidden="true"></div>
        </div>

        <?php if ( 'none' !== $kh_ss_indicator_type && count( $kh_ss_media_items ) > 0 ) : ?>
            <div class="<?php echo esc_attr( $kh_ss_indicator_class ); ?>">
                <?php if ( 'line' === $kh_ss_indicator_type ) : ?>
                    <div class="kh-ss-progress-line" aria-hidden="true"><div class="kh-ss-progress-fill"></div></div>
                <?php endif; ?>
                <?php /* <fs_premium_only> */ ?>
                <?php if ( 'dots' === $kh_ss_indicator_type ) : ?>
                    <?php foreach ( $kh_ss_media_items as $kh_ss_index => $kh_ss_item ) : ?>
                    <button
                        class="kh-ss-dot <?php echo esc_attr( 0 === $kh_ss_index ? 'is-active' : '' ); ?>"
                        aria-label="<?php
                        /* translators: %d: section number for navigation dot */
                        echo esc_attr( sprintf( __( 'Go to section %d', 'kinetichub' ), $kh_ss_index + 1 ) ); ?>"
                        data-dot-index="<?php echo esc_attr( $kh_ss_index ); ?>"
                    ></button>
                    <?php endforeach; ?>
                <?php elseif ( 'percentage' === $kh_ss_indicator_type ) : ?>
                    <div class="kh-ss-percentage" aria-live="polite">0%</div>
                <?php endif; ?>
                <?php /* </fs_premium_only> */ ?>
            </div>
        <?php endif; ?>
    </div>

    <div
        class="kh-ss-scroll-col"
        data-smartswap="<?php echo esc_attr( $kh_ss_enable_smart_swap ? 'true' : 'false' ); ?>"
        data-texteffect="<?php echo esc_attr( $kh_ss_text_effect ); ?>"
        data-mediacount="<?php echo esc_attr( count( $kh_ss_media_items ) ); ?>"
    >
        <?php echo wp_kses_post( $kh_ss_raw_content ); ?>
    </div>
</div>