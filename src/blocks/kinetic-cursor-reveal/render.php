<?php
/**
 * Kinetic Cursor Reveal - Server-Side Render Logic
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'kinetichub_cr_validate_color_strict' ) ) {
    function kinetichub_cr_validate_color_strict( $color, $default = 'transparent' ) {
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

$kh_cr_block_id      = ! empty( $attributes['blockId'] ) ? sanitize_html_class( $attributes['blockId'] ) : wp_unique_id( 'kh-cr-' );
$kh_cr_items         = ! empty( $attributes['items'] ) && is_array( $attributes['items'] ) ? $attributes['items'] : array();
$kh_cr_open_new_tab  = ! empty( $attributes['openInNewTab'] );

// FREE defaults
$kh_cr_text_style       = 'solid';
$kh_cr_bg_type          = 'none';
$kh_cr_media_layer      = 'over';
$kh_cr_blend_mode       = 'normal';
$kh_cr_accent_color     = 'var(--kh-accent, #10b981)';

$kh_cr_enable_dimming   = false;
$kh_cr_enable_tilt      = false;
$kh_cr_enable_noise     = false;
$kh_cr_container_shadow = false;

$kh_cr_lerp_amount      = 0.08;
$kh_cr_offset_x         = 0;
$kh_cr_offset_y         = 0;

$kh_cr_max_items        = 3;

$kh_cr_media_ratio      = '4/5';
$kh_cr_mobile_action    = 'tap';
$kh_cr_reveal_mask      = 'fade';
$kh_cr_hover_filter     = 'none';
$kh_cr_shadow_style     = 'soft';
$kh_cr_entrance_anim    = 'none';

$kh_cr_font_size        = 40;
$kh_cr_mobile_font      = 30;
$kh_cr_hover_font       = 95;
$kh_cr_sub_size         = 13;
$kh_cr_sub_space        = 3;
$kh_cr_media_width      = 350;
$kh_cr_entrance_delay   = 0;

$kh_cr_sub_color        = '#666666';

$kh_cr_enable_magnetic  = false;
$kh_cr_cursor_badge     = false;
$kh_cr_badge_text       = 'View';
$kh_cr_inner_parallax   = false;
$kh_cr_hide_mobile      = false;
$kh_cr_hide_desktop     = false;



if ( empty( $kh_cr_items ) ) {
    return;
}

$kh_cr_valid_items = array();
$kh_cr_count       = 0;

foreach ( $kh_cr_items as $kh_cr_item ) {
    if ( $kh_cr_count >= $kh_cr_max_items ) {
        break;
    }

    $kh_cr_item_data = (array) $kh_cr_item;
    $kh_cr_title     = ! empty( $kh_cr_item_data['title'] ) ? wp_kses_post( trim( $kh_cr_item_data['title'] ) ) : '';
    $kh_cr_subtitle  = ! empty( $kh_cr_item_data['subtitle'] ) ? wp_kses_post( trim( $kh_cr_item_data['subtitle'] ) ) : '';
    $kh_cr_media     = ! empty( $kh_cr_item_data['mediaUrl'] ) ? esc_url_raw( trim( $kh_cr_item_data['mediaUrl'] ) ) : '';
    $kh_cr_url       = ! empty( $kh_cr_item_data['url'] ) ? esc_url_raw( trim( $kh_cr_item_data['url'] ) ) : '';

    if ( '' !== $kh_cr_title && '' !== $kh_cr_media ) {
        $kh_cr_valid_items[] = array(
            'title'    => $kh_cr_title,
            'subtitle' => $kh_cr_subtitle,
            'mediaUrl' => $kh_cr_media,
            'url'      => $kh_cr_url,
        );
        ++$kh_cr_count;
    }
}

if ( empty( $kh_cr_valid_items ) ) {
    return;
}

$kh_cr_scale_factor = $kh_cr_font_size > 0 ? number_format( $kh_cr_hover_font / $kh_cr_font_size, 3, '.', '' ) : '1';

// FREE: hardcoded safe defaults for wrapper style vars
$kh_cr_wrapper_style_vars = sprintf(
    '--kh-cr-font-size: %1$dpx; --kh-cr-font-mob: %2$dpx; --kh-cr-scale: %3$s; --kh-cr-accent: %4$s; --kh-cr-sub-color: %5$s; --kh-cr-sub-size: %6$dpx; --kh-cr-sub-space: %7$dpx;',
    40, 30, '2.375', 'var(--kh-accent, #10b981)', '#666666', 13, 3
);



// FREE: hardcoded safe defaults for floating box style vars
$kh_cr_box_style_vars = '--kh-cr-media-w: 350px; --kh-cr-media-ratio: 4/5; --kh-cr-media-z: 999999; --kh-cr-blend-mode: normal;';



$kh_cr_classes = array_filter(
    array(
        'kh-cr-wrapper',
        $kh_cr_block_id,
    )
);



$kh_cr_wrapper_attrs_array = array(
    'class'        => implode( ' ', $kh_cr_classes ),
    'style'        => $kh_cr_wrapper_style_vars,
    'data-blockid' => $kh_cr_block_id,
    'role'         => 'list',
    'aria-label'   => __( 'Interactive Portfolio List', 'kinetichub' ),
);



$kh_cr_wrapper_attrs = get_block_wrapper_attributes( $kh_cr_wrapper_attrs_array );

$kh_cr_box_classes = array(
    'kh-cr-floating-box',
    'kh-cr-floating-box-' . $kh_cr_block_id,
    'mask-fade',
    'filter-none',
    'bg-none',
);



<div <?php echo $kh_cr_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
    <div class="kh-cr-list">
        <?php foreach ( $kh_cr_valid_items as $kh_cr_index => $kh_cr_item ) : ?>
            <?php $kh_cr_safe_alt = wp_strip_all_tags( $kh_cr_item['title'] ); ?>
            <div
                class="kh-cr-item"
                data-media="<?php echo esc_url( $kh_cr_item['mediaUrl'] ); ?>"
                data-index="<?php echo esc_attr( $kh_cr_index ); ?>"
                data-tapped="false"
                tabindex="0"
                role="listitem"
            >
                <?php if ( ! empty( $kh_cr_item['url'] ) ) : ?>
                    <a
                        href="<?php echo esc_url( $kh_cr_item['url'] ); ?>"
                        <?php if ( $kh_cr_open_new_tab ) : ?>
                            target="_blank" rel="noopener noreferrer"
                        <?php else : ?>
                            target="_self"
                        <?php endif; ?>
                        class="kh-cr-link-overlay"
                        aria-label="<?php echo esc_attr( $kh_cr_safe_alt ); ?>"
                        tabindex="-1"
                    ></a>
                <?php endif; ?>

                <span class="kh-cr-title-wrapper">
                    <span class="kh-cr-title"><?php echo wp_kses_post( $kh_cr_item['title'] ); ?></span>
                </span>

                <?php if ( ! empty( $kh_cr_item['subtitle'] ) ) : ?>
                    <span class="kh-cr-subtitle"><?php echo wp_kses_post( $kh_cr_item['subtitle'] ); ?></span>
                <?php endif; ?>

                
            </div>
        <?php endforeach; ?>
    </div>

    <div class="<?php echo esc_attr( implode( ' ', $kh_cr_box_classes ) ); ?>" style="<?php echo esc_attr( $kh_cr_box_style_vars ); ?>" aria-hidden="true">
        <div class="kh-cr-media-layer kh-cr-layer-1"></div>
        <div class="kh-cr-media-layer kh-cr-layer-2"></div>

        

        <div class="kh-cr-close-btn">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </div>
    </div>
</div>