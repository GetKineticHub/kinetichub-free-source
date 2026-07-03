<?php
/**
 * Kinetic Box - Dynamic Render
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Preserve rendered InnerBlocks content. Re-sanitizing here strips valid nested block markup such as canvas, svg, and data attributes.
$kh_box_inner_content = $content ?? '';

    if ( ! function_exists( 'kinetichub_box_validate_color_strict' ) ) {
        /**
         * Validate a safe subset of CSS color formats.
         *
         * @param string $color   Raw color value.
         * @param string $default Fallback color.
         * @return string
         */
        function kinetichub_box_validate_color_strict( $color, $default = 'transparent' ) {
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

    $kh_box_anim_list       = array( 'none', 'lift', 'scale', 'tilt' );
    $kh_box_animation_type  = in_array( $attributes['animationType'] ?? '', $kh_box_anim_list, true ) ? $attributes['animationType'] : 'lift';

    $kh_box_ease_list = array( 'smooth', 'bouncy', 'snappy' );
    $kh_box_easing    = in_array( $attributes['easing'] ?? '', $kh_box_ease_list, true ) ? $attributes['easing'] : 'smooth';

    $kh_box_align_h_list = array( 'left', 'center', 'right' );
    $kh_box_h_align      = in_array( $attributes['hAlign'] ?? '', $kh_box_align_h_list, true ) ? $attributes['hAlign'] : 'left';

    $kh_box_align_v_list = array( 'top', 'center', 'bottom' );
    $kh_box_v_align      = in_array( $attributes['vAlign'] ?? '', $kh_box_align_v_list, true ) ? $attributes['vAlign'] : 'top';

    $kh_box_box_align_list = array( 'left', 'center', 'right' );
    $kh_box_box_align      = in_array( $attributes['boxAlign'] ?? '', $kh_box_box_align_list, true ) ? $attributes['boxAlign'] : 'center';

    $kh_box_safe_speed_raw       = max( 0.1, min( 2.0, (float) ( $attributes['transitionSpeed'] ?? 0.4 ) ) );
    $kh_box_mapped_engine_speed  = 0.6 + ( ( $kh_box_safe_speed_raw - 0.1 ) / 1.9 ) * 1.4;
    $kh_box_transition_speed_str = number_format( $kh_box_mapped_engine_speed, 2, '.', '' );

    $kh_box_zoom_intensity         = max( 1.0, min( 2.0, (float) ( $attributes['zoomIntensity'] ?? 1.08 ) ) );
    $kh_box_hover_intensity        = max( 0, min( 30, (float) ( $attributes['hoverIntensity'] ?? 20 ) ) );
    $kh_box_mobile_intensity       = max( 0, min( 30, (float) ( $attributes['mobileIntensity'] ?? 0 ) ) );
    $kh_box_rotation               = max( -45, min( 45, (float) ( $attributes['rotation'] ?? 0 ) ) );
    $kh_box_shadow_softness        = max( 0, min( 200, (float) ( $attributes['shadowSoftness'] ?? 20 ) ) );
    $kh_box_mobile_shadow_softness = max( 0, min( 200, (float) ( $attributes['mobileShadowSoftness'] ?? 10 ) ) );
    $kh_box_shadow_opacity         = max( 0, min( 1, (float) ( $attributes['shadowOpacity'] ?? 0.1 ) ) );
    $kh_box_hover_shadow_opacity   = max( 0, min( 1, (float) ( $attributes['hoverShadowOpacity'] ?? 0.2 ) ) );
    $kh_box_min_height             = max( 0, min( 2000, (int) ( $attributes['minHeight'] ?? 0 ) ) );
    $kh_box_box_width              = max( 0, min( 100, (int) ( $attributes['boxWidth'] ?? 0 ) ) );

    $kh_box_bring_to_front = ! empty( $attributes['bringToFront'] );
    $kh_box_zoom_images    = ! empty( $attributes['zoomImages'] );
    $kh_box_has_glow       = ! empty( $attributes['hasGlow'] );
    $kh_box_is_grayscale   = ! empty( $attributes['isGrayscale'] );
    $kh_box_open_new_tab   = ! empty( $attributes['openInNewTab'] );
    $kh_box_stretched_link = ! empty( $attributes['stretchedLink'] );
    $kh_box_hide_on_mobile = ! empty( $attributes['hideOnMobile'] );
    $kh_box_hide_on_desktop = ! empty( $attributes['hideOnDesktop'] );

    $kh_box_shadow_color       = kinetichub_box_validate_color_strict( $attributes['shadowColor'] ?? '', '#000000' );
    $kh_box_hover_shadow_color = kinetichub_box_validate_color_strict( $attributes['hoverShadowColor'] ?? '', '#000000' );
    $kh_box_hover_bg_color     = kinetichub_box_validate_color_strict( $attributes['hoverBgColor'] ?? '', '' );
    $kh_box_hover_border_color = kinetichub_box_validate_color_strict( $attributes['hoverBorderColor'] ?? '', '' );
    $kh_box_hover_text_color   = kinetichub_box_validate_color_strict( $attributes['hoverTextColor'] ?? '', '' );

    $kh_box_url        = ! empty( $attributes['url'] ) ? esc_url_raw( $attributes['url'] ) : '';
    $kh_box_link_label = ! empty( $attributes['linkLabel'] ) ? sanitize_text_field( $attributes['linkLabel'] ) : '';
    $kh_box_link_rel   = ! empty( $attributes['linkRel'] ) ? sanitize_text_field( $attributes['linkRel'] ) : '';

    // Auto-add security rel for target="_blank" only if not already present
    if ( $kh_box_open_new_tab ) {
        $kh_box_rel_parts = array_filter( array_map( 'trim', preg_split( '/[\s,]+/', $kh_box_link_rel ) ) );
        if ( ! in_array( 'noopener', $kh_box_rel_parts, true ) ) {
            $kh_box_rel_parts[] = 'noopener';
        }
        if ( ! in_array( 'noreferrer', $kh_box_rel_parts, true ) ) {
            $kh_box_rel_parts[] = 'noreferrer';
        }
        $kh_box_link_rel = implode( ' ', $kh_box_rel_parts );
    }

    // FREE defaults for PRO features
    $kh_box_entrance_animation = 'none';
    $kh_box_entrance_delay     = 0;
    $kh_box_glass_opacity      = 0.2;
    $kh_box_blur_intensity     = 10;
    $kh_box_tilt_effect        = false;
    $kh_box_magnetic_hover     = false;
    $kh_box_enable_parallax    = false;
    $kh_box_enable_glass       = false;
    $kh_box_spotlight_glow     = false;
    $kh_box_spotlight_size     = 400;
    $kh_box_spotlight_color    = 'rgba(255, 255, 255, 0.1)';
    $kh_box_film_grain         = false;
    $kh_box_grain_opacity      = 0.15;
    $kh_box_idle_levitate      = false;
    $kh_box_crisp_edge         = false;
    $kh_box_edge_color         = 'rgba(255, 255, 255, 0.3)';

    

    

    $kh_box_flex_h_align = 'left' === $kh_box_h_align ? 'flex-start' : ( 'right' === $kh_box_h_align ? 'flex-end' : 'center' );
    $kh_box_flex_v_align = 'top' === $kh_box_v_align ? 'flex-start' : ( 'bottom' === $kh_box_v_align ? 'flex-end' : 'center' );

    $kh_box_has_custom_bg     = strlen( $kh_box_hover_bg_color ) > 1;
    $kh_box_has_custom_text   = strlen( $kh_box_hover_text_color ) > 1;
    $kh_box_has_custom_border = strlen( $kh_box_hover_border_color ) > 1;

    $kh_box_margin_l   = '0';
    $kh_box_margin_r   = '0';
    $kh_box_align_self = 'center';

    if ( 'center' === $kh_box_box_align ) {
        $kh_box_margin_l   = 'auto';
        $kh_box_margin_r   = 'auto';
        $kh_box_align_self = 'center';
    } elseif ( 'right' === $kh_box_box_align ) {
        $kh_box_margin_l   = 'auto';
        $kh_box_margin_r   = '0';
        $kh_box_align_self = 'flex-end';
    } elseif ( 'left' === $kh_box_box_align ) {
        $kh_box_margin_l   = '0';
        $kh_box_margin_r   = 'auto';
        $kh_box_align_self = 'flex-start';
    }

    $kh_box_css_vars = array(
        '--kh-box-speed'        => $kh_box_transition_speed_str . 's',
        '--kh-box-bezier'       => 'bouncy' === $kh_box_easing ? 'cubic-bezier(0.68, -0.6, 0.32, 1.6)' : ( 'snappy' === $kh_box_easing ? 'cubic-bezier(0.25, 1, 0.5, 1)' : 'ease' ),
        '--kh-box-intensity'    => (string) $kh_box_hover_intensity,
        '--kh-box-m-intensity'  => (string) $kh_box_mobile_intensity,
        '--kh-box-rot'          => $kh_box_rotation . 'deg',
        '--kh-box-shadow-blur'  => $kh_box_shadow_softness . 'px',
        '--kh-box-m-blur'       => $kh_box_mobile_shadow_softness . 'px',
        '--kh-box-base-shadow'  => $kh_box_shadow_color,
        '--kh-box-hover-shadow' => $kh_box_hover_shadow_color,
        '--kh-box-shadow-o'     => (string) $kh_box_shadow_opacity,
        '--kh-box-hover-o'      => (string) $kh_box_hover_shadow_opacity,
        '--kh-box-hover-bg'     => $kh_box_hover_bg_color ? $kh_box_hover_bg_color : 'transparent',
        '--kh-box-hover-border' => $kh_box_hover_border_color ? $kh_box_hover_border_color : 'transparent',
        '--kh-box-hover-text'   => $kh_box_hover_text_color ? $kh_box_hover_text_color : 'inherit',
        '--kh-box-zoom-int'     => (string) $kh_box_zoom_intensity,
        '--kh-box-min-h'        => $kh_box_min_height > 0 ? $kh_box_min_height . 'px' : 'auto',
        '--kh-box-w'            => $kh_box_box_width > 0 ? $kh_box_box_width . '%' : '100%',
        '--kh-box-ml'           => $kh_box_margin_l,
        '--kh-box-mr'           => $kh_box_margin_r,
        '--kh-box-align-self'   => $kh_box_align_self,
        '--kh-box-h-align'      => $kh_box_flex_h_align,
        '--kh-box-v-align'      => $kh_box_flex_v_align,
        '--kh-box-text-align'   => $kh_box_h_align,
    );

    

    $kh_box_style_string = '';
    foreach ( $kh_box_css_vars as $kh_box_key => $kh_box_val ) {
        $kh_box_style_string .= $kh_box_key . ': ' . $kh_box_val . '; ';
    }

    $kh_box_classes = array_filter(
        array(
            'kh-box-wrapper',
            $kh_box_box_width > 0 ? 'kh-box-has-custom-width' : '',
            'anim-' . $kh_box_animation_type,
            'kh-box-ease-' . $kh_box_easing,
            $kh_box_has_custom_bg ? 'kh-box-change-bg' : '',
            $kh_box_has_custom_text ? 'kh-box-change-text' : '',
            $kh_box_has_custom_border ? 'kh-box-change-border' : '',
            $kh_box_zoom_images ? 'kh-box-zoom-img' : '',
            $kh_box_has_glow ? 'kh-box-glow' : '',
            $kh_box_is_grayscale ? 'kh-box-grayscale' : '',
            $kh_box_bring_to_front ? 'kh-box-z-top' : '',
            $kh_box_hide_on_mobile ? 'kh-box-hide-mobile' : '',
            $kh_box_hide_on_desktop ? 'kh-box-hide-desktop' : '',
        )
    );

    

    $kh_box_attrs = array(
        'class'          => implode( ' ', $kh_box_classes ),
        'style'          => trim( $kh_box_style_string ),
        'role'           => ( ! empty( $kh_box_url ) && $kh_box_stretched_link ) ? 'link' : 'group',
        'aria-label'     => ( ! empty( $kh_box_url ) && $kh_box_stretched_link && ! empty( $kh_box_link_label ) ) ? $kh_box_link_label : __( 'Interactive Content Box', 'kinetichub' ),
    );

    

    $kh_box_wrapper_attrs = get_block_wrapper_attributes( $kh_box_attrs );
    ?>

    <div <?php echo $kh_box_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
        

        <div class="kh-box-inner-content">
            <?php
            // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- InnerBlocks content is rendered by WordPress and child block render callbacks; re-sanitizing strips valid nested block markup.
            echo $kh_box_inner_content;
            ?>
        </div>

        <?php if ( ! empty( $kh_box_url ) && $kh_box_stretched_link ) : ?>
            <a
                href="<?php echo esc_url( $kh_box_url ); ?>"
                class="kh-box-stretched-link"
                aria-label="<?php echo esc_attr( ! empty( $kh_box_link_label ) ? $kh_box_link_label : __( 'Box Content Link', 'kinetichub' ) ); ?>"
                target="<?php echo esc_attr( $kh_box_open_new_tab ? '_blank' : '_self' ); ?>"
                <?php if ( ! empty( $kh_box_link_rel ) ) : ?>
                    rel="<?php echo esc_attr( $kh_box_link_rel ); ?>"
                <?php endif; ?>
            ></a>
        <?php endif; ?>
    </div>