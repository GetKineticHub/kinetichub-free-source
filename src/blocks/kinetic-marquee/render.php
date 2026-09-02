<?php
/**
 * Kinetic Marquee - Server-Side Render Logic
 * Version: 1.0.2
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Helper function for strict color validation
if ( ! function_exists( 'kinetichub_mq_validate_color_strict' ) ) {
    function kinetichub_mq_validate_color_strict( $color, $default = 'transparent' ) {
        $color = is_string( $color ) ? trim( $color ) : '';
        if ( '' === $color ) return $default;
        if ( preg_match( '/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/', $color ) ) return $color;
        if ( preg_match( '/^rgba?\(\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) return $color;
        if ( preg_match( '/^hsl(a)?\(\s*(36[0]|3[0-5]\d|[12]?\d{1,2})\s*,\s*(100|[1-9]?\d)%\s*,\s*(100|[1-9]?\d)%\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) return $color;
        if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $color ) ) return $color;
        return $default;
    }
}

// Helper: derive an accessible name for a linked item that has no author-written
// description. Every original gets the SAME generic string otherwise, so a screen
// reader hears a row of indistinguishable links. The destination is the only other
// thing the item already knows, and it identifies where the link goes.
//
// $link is the value already sanitised for href, so nothing new is trusted here, and
// no network work is done - wp_parse_url is pure string parsing.
if ( ! function_exists( 'kinetichub_mq_link_fallback_label' ) ) {
    function kinetichub_mq_link_fallback_label( $link ) {
        $kh_mq_host = wp_parse_url( $link, PHP_URL_HOST );

        if ( is_string( $kh_mq_host ) && '' !== $kh_mq_host ) {
            // A leading www. is noise in a spoken name and never distinguishes two
            // destinations, so "www.example.com" and "example.com" read alike.
            $kh_mq_host_label = preg_replace( '/^www\./i', '', $kh_mq_host );

            // Test what is actually being returned, not what was parsed. A host of
            // exactly "www." strips to nothing, and returning that produced an
            // aria-label="" on a rendered anchor whose image is alt="" - a link with no
            // accessible name at all. Checking the stripped value instead lets that
            // case fall through to the destination string below, which is still
            // specific and, more to the point, never empty.
            if ( is_string( $kh_mq_host_label ) && '' !== trim( $kh_mq_host_label ) ) {
                return $kh_mq_host_label;
            }
        }

        // Hostless but valid destinations - mailto:, tel:, /about, #section - keep the
        // sanitised destination itself. It is still specific, still non-empty, and far
        // better than one shared generic label repeated down the row.
        if ( is_string( $link ) && '' !== $link ) {
            return $link;
        }

        // Formally total only. The anchor is rendered exclusively when $kh_mq_link is
        // non-empty, so this cannot be reached during normal anchor rendering.
        return __( 'Marquee item link', 'kinetichub' );
    }
}

// Helper function to render individual marquee items
if ( ! function_exists( 'kinetichub_mq_render_item_markup' ) ) {
    function kinetichub_mq_render_item_markup( $item, $index, $is_first_group, $show_frame, $frame_shadow, $open_in_new_tab, $origin_index, $is_accessible_copy ) {
        $kh_mq_item      = is_array( $item ) ? $item : array();
        $kh_mq_url       = ! empty( $kh_mq_item['url'] ) ? esc_url( $kh_mq_item['url'] ) : '';

        // Normalise BEFORE deciding anything. The old test ran on the raw value and
        // then swapped in a generic string, so an author could never express "this
        // logo is decorative" - and a whitespace-only value counted as a description
        // while announcing as nothing.
        $kh_mq_alt       = isset( $kh_mq_item['alt'] ) ? sanitize_text_field( (string) $kh_mq_item['alt'] ) : '';
        $kh_mq_alt       = trim( $kh_mq_alt );

        $kh_mq_link      = ! empty( $kh_mq_item['link'] ) ? esc_url( $kh_mq_item['link'] ) : '';
        $kh_mq_loading   = ( $is_first_group && $index < 4 ) ? 'eager' : 'lazy';
        $kh_mq_frame_cls = $show_frame ? 'kh-mq-marquee-frame shadow-' . sanitize_html_class( $frame_shadow ) : '';

        $kh_mq_img_html = sprintf( '<img src="%1$s" alt="%2$s" loading="%3$s" decoding="async" />', $kh_mq_url, esc_attr( $kh_mq_alt ), esc_attr( $kh_mq_loading ) );
        $kh_mq_content_html = $kh_mq_img_html;

        if ( ! empty( $kh_mq_link ) ) {
            $kh_mq_target     = $open_in_new_tab ? '_blank' : '_self';
            $kh_mq_rel        = $open_in_new_tab ? 'noopener noreferrer' : '';

            // An image that is the sole content of a link already names that link
            // through its alt, so a described item needs no aria-label at all - and an
            // aria-label would OVERRIDE the alt, discarding the author's own wording in
            // favour of a translated wrapper phrase. Only a described-as-decorative
            // image leaves the link unnamed, and only that case gets a label.
            $kh_mq_aria_attr = '';
            if ( '' === $kh_mq_alt ) {
                $kh_mq_aria_attr = ' aria-label="' . esc_attr( kinetichub_mq_link_fallback_label( $kh_mq_link ) ) . '"';
            }

            // Duplicate visual copies keep their href, target and rel, so a pointer user
            // can still click whichever copy is in front of them. tabindex="-1" removes
            // them from sequential keyboard navigation only. inert would have done both
            // in one attribute but also kills pointer events, which would leave the
            // logos clickable solely in the leading pass - unusable in practice.
            $kh_mq_tabindex_attr = $is_accessible_copy ? '' : ' tabindex="-1"';

            $kh_mq_content_html = sprintf( '<a href="%1$s" target="%2$s"%3$s%4$s%5$s>%6$s</a>', $kh_mq_link, esc_attr( $kh_mq_target ), $kh_mq_rel ? ' rel="' . esc_attr( $kh_mq_rel ) . '"' : '', $kh_mq_aria_attr, $kh_mq_tabindex_attr, $kh_mq_img_html );
        }

        // The track repeats each original many times over so the loop never runs dry.
        // Only the leading pass is meaningful content; every later copy is the same
        // logo drawn again, and announcing it five more times is noise. Hiding the
        // wrapper removes the whole subtree - image and link alike - from the
        // accessibility tree without altering a single pixel.
        $kh_mq_hidden_attr = $is_accessible_copy ? '' : ' aria-hidden="true"';

        return sprintf( '<div class="kh-mq-marquee-item"%1$s data-kh-mq-origin-index="%2$d"><div class="kh-mq-marquee-item-inner"><div class="%3$s">%4$s</div></div></div>', $kh_mq_hidden_attr, (int) $origin_index, esc_attr( $kh_mq_frame_cls ), $kh_mq_content_html );
    }
}

// Main render logic
$kh_mq_images = ! empty( $attributes['images'] ) && is_array( $attributes['images'] ) ? $attributes['images'] : array();
if ( empty( $kh_mq_images ) ) return;

$kh_mq_align_list     = array( 'full', 'wide' );
$kh_mq_align          = in_array( $attributes['align'] ?? '', $kh_mq_align_list, true ) ? $attributes['align'] : 'full';

$kh_mq_rail_pos_list  = array( 'right', 'bottom' );
$kh_mq_rail_position  = in_array( $attributes['progressRailPosition'] ?? '', $kh_mq_rail_pos_list, true ) ? $attributes['progressRailPosition'] : 'right';

$kh_mq_shadow_list    = array( 'soft', 'crisp', 'float', 'glow', 'elegant' );
$kh_mq_frame_shadow_list = array( 'soft', 'medium', 'hard', 'float' );
$kh_mq_entrance_list  = array( 'none', 'fade', 'slide', 'zoom' );

$kh_mq_speed               = max( 1, min( 200, (int) ( $attributes['speed'] ?? 30 ) ) );
$kh_mq_item_height         = max( 20, min( 500, (int) ( $attributes['itemHeight'] ?? 120 ) ) );
$kh_mq_frame_radius        = max( 0, min( 100, (int) ( $attributes['frameRadius'] ?? 12 ) ) );
$kh_mq_sibling_blur_int    = max( 1, min( 50, (int) ( $attributes['siblingBlurIntensity'] ?? 3 ) ) );

$kh_mq_frame_bg = kinetichub_mq_validate_color_strict( $attributes['frameBg'] ?? '', '#ffffff' );

$kh_mq_edge_fade              = ! empty( $attributes['edgeFade'] );
$kh_mq_open_in_new_tab        = ! empty( $attributes['openInNewTab'] );
$kh_mq_reverse_direction      = ! empty( $attributes['reverseDirection'] );
$kh_mq_lift_effect            = ! empty( $attributes['liftEffect'] );
$kh_mq_show_frame             = ! empty( $attributes['showFrame'] );
$kh_mq_show_progress_rail     = ! empty( $attributes['showProgressRail'] );
$kh_mq_show_indicator         = ! empty( $attributes['showInteractionIndicator'] );
$kh_mq_highlight_active       = ! empty( $attributes['highlightActiveCenter'] );
$kh_mq_sibling_blur           = ! empty( $attributes['siblingBlur'] );
$kh_mq_pause_on_hover         = ! empty( $attributes['pauseOnHover'] );
$kh_mq_hover_slow_down        = ! empty( $attributes['hoverSlowDown'] );

/*
 * Auto Motion. The one switch that decides whether this marquee moves by itself,
 * and therefore whether it needs a mechanism a visitor can stop it with.
 *
 * Not ! empty(): every marquee saved before this attribute existed carries no key
 * at all and must keep moving, while a marquee an author deliberately set to false
 * must stay still. ! empty() reads both as falsey and cannot tell them apart, so
 * absence is tested explicitly and only a value that is actually present is cast.
 */
$kh_mq_auto_motion = array_key_exists( 'autoMotion', $attributes ) ? (bool) $attributes['autoMotion'] : true;

// Enforce mutual exclusion: pause takes priority over slow
if ( $kh_mq_pause_on_hover ) {
    $kh_mq_hover_slow_down = false;
}

// Runtime defaults
$kh_mq_max_items           = 7;
$kh_mq_mobile_item_height  = $kh_mq_item_height;
$kh_mq_logo_max_width      = 200;
$kh_mq_gap                 = 50;
$kh_mq_use_max_width       = false;
$kh_mq_grayscale           = false;
$kh_mq_idle_opacity        = false;
$kh_mq_container_shadow    = false;
$kh_mq_shadow_style        = 'soft';
$kh_mq_shadow_color        = '';
$kh_mq_hover_shadow_color  = '';
$kh_mq_shadow_softness        = '';
$kh_mq_mobile_shadow_softness = '';
$kh_mq_shadow_opacity         = '';
$kh_mq_hover_shadow_opacity   = '';
$kh_mq_hide_mobile            = false;
$kh_mq_hide_desktop        = false;
$kh_mq_entrance_anim       = 'none';
$kh_mq_entrance_delay      = 0;
$kh_mq_frame_shadow        = 'soft';



$kh_mq_images = array_slice( $kh_mq_images, 0, $kh_mq_max_items );
$kh_mq_images = array_map( static function ( $img ) { return is_array( $img ) ? $img : (array) $img; }, $kh_mq_images );
if ( empty( $kh_mq_images ) ) return;

$kh_mq_cloned_images    = $kh_mq_images;
$kh_mq_clone_target     = max( 30, count( $kh_mq_images ) );
while ( count( $kh_mq_cloned_images ) < $kh_mq_clone_target ) {
    $kh_mq_cloned_images = array_merge( $kh_mq_cloned_images, $kh_mq_images );
}

$kh_mq_dynamic_duration = $kh_mq_speed * ( count( $kh_mq_cloned_images ) / 5 );

$kh_mq_css_vars = sprintf(
    '--kh-mq-duration: %1$.2Fs; --kh-mq-h: %2$dpx; --kh-mq-h-mob: %3$dpx; --kh-mq-gap: %4$dpx; --kh-mq-frame-bg: %5$s; --kh-mq-frame-rad: %6$dpx; --kh-mq-max-w: %7$s; --kh-mq-blur: %8$dpx;',
    $kh_mq_dynamic_duration,
    $kh_mq_item_height,
    $kh_mq_mobile_item_height,
    $kh_mq_gap,
    $kh_mq_frame_bg,
    $kh_mq_frame_radius,
    $kh_mq_use_max_width ? $kh_mq_logo_max_width . 'px' : 'none',
    $kh_mq_sibling_blur_int
);



$kh_mq_outer_classes = array_filter(
    array(
        'kh-mq-marquee-container',
        // Frontend only - the editor preview builds its own class list and never gets
        // this. It marks markup that carries the persistent motion control, which is
        // what lets the stylesheet hold the CSS engine until view.js proves the control
        // is bound, without ever freezing a Marquee in the Gutenberg canvas.
        //
        // Mutually exclusive with kh-mq-static, and the pair is the whole Auto Motion
        // contract: a moving marquee claims a control and is held by the stylesheet
        // until one is proven usable; a static one claims nothing, is never held, and
        // has no control to prove - there is no automatic motion to stop.
        $kh_mq_auto_motion ? 'kh-mq-has-motion-control' : 'kh-mq-static',
        'full' === $kh_mq_align ? 'alignfull' : '',
        $kh_mq_pause_on_hover ? 'is-pause-hover' : '',
        $kh_mq_hover_slow_down ? 'is-slow-hover' : '',
        $kh_mq_lift_effect ? 'has-lift-effect' : '',
        $kh_mq_reverse_direction ? 'is-reversed' : '',
        $kh_mq_show_frame ? 'has-frames' : '',
        $kh_mq_show_progress_rail ? 'has-progress-rail' : '',
        $kh_mq_show_progress_rail ? 'rail-pos-' . $kh_mq_rail_position : '',
        $kh_mq_show_indicator ? 'has-interaction-indicator' : '',
        $kh_mq_highlight_active ? 'has-active-center-highlight' : '',
        $kh_mq_sibling_blur ? 'has-sibling-blur' : '',
        
    )
);

$kh_mq_inner_classes = array_filter( array( 'kh-mq-marquee-inner', $kh_mq_edge_fade ? 'has-edge-fade' : '' ) );

$kh_mq_wrapper_attrs = get_block_wrapper_attributes(
    array(
        'class'                         => implode( ' ', $kh_mq_outer_classes ),
        'style'                         => $kh_mq_css_vars,
        'data-progress-rail'            => $kh_mq_show_progress_rail ? 'true' : 'false',
        'data-interaction-indicator'    => $kh_mq_show_indicator ? 'true' : 'false',
        'data-active-center-highlight'  => $kh_mq_highlight_active ? 'true' : 'false',
        'data-original-count'           => (string) count( $kh_mq_images ),
        'data-progress-count'           => (string) count( $kh_mq_images ),
        'role'                          => 'group',
        'aria-label'                    => __( 'Marquee Gallery', 'kinetichub' ),
    )
);

// wp_kses drops anything not listed here, silently and without warning. The two
// accessibility attributes below are the whole point of the duplicate-copy contract,
// so they have to be allowed in the same breath as they are emitted - otherwise the
// markup still renders, PHP still lints, and the fix quietly does nothing.
$kh_mq_allowed_item_tags = array(
    'div'  => array( 'class' => true, 'data-kh-mq-origin-index' => true, 'aria-hidden' => true ),
    'a'    => array( 'href' => true, 'target' => true, 'rel' => true, 'aria-label' => true, 'class' => true, 'tabindex' => true ),
    'img'  => array( 'src' => true, 'alt' => true, 'loading' => true, 'decoding' => true, 'class' => true ),
    'span' => array( 'class' => true, 'data-state' => true ),
);
?>

<div <?php echo $kh_mq_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
    <?php
    /*
     * The persistent motion control. Hover, focus, a tap and leaving the viewport all
     * pause this marquee, but every one of them ends by itself - none of them is a
     * mechanism a visitor can operate and rely on. This is.
     *
     * First child deliberately: a keyboard user meets it before tabbing into the row of
     * links. It sits outside .kh-mq-marquee-inner, so the overflow and the edge-fade
     * mask never touch it, and outside both .kh-mq-marquee-group elements, so the loop
     * never clones it and 4B never hides it. Being literal template markup, it also
     * bypasses the per-item wp_kses helper entirely - that allowlist stays closed.
     *
     * The name stays "Pause marquee motion" in both states; aria-pressed carries the
     * state, which is how a native toggle button is meant to work. Only the glyph
     * changes, and the stylesheet swaps it from aria-pressed alone.
     *
     * Rendered for every automatically moving marquee, and only for those. Auto Motion
     * off is not the same marquee with its control hidden - there is no automatic
     * motion left for a visitor to stop, so the button would control nothing. Omitting
     * the element rather than hiding it leaves no dead control in the accessibility
     * tree and none in the tab order.
     */
    ?>
    <?php if ( $kh_mq_auto_motion ) : ?>
    <button type="button" class="kh-mq-pause-toggle" aria-pressed="false" aria-label="<?php echo esc_attr__( 'Pause marquee motion', 'kinetichub' ); ?>">
        <svg class="kh-mq-glyph kh-mq-glyph-pause" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>
        <svg class="kh-mq-glyph kh-mq-glyph-play" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z"></path></svg>
    </button>
    <?php endif; ?>

    <?php if ( $kh_mq_show_indicator ) : ?>
        <div class="kh-mq-interaction-indicator" data-state="running">
            <span class="kh-mq-indicator-label kh-mq-indicator-running"><?php echo esc_html__( 'RUNNING', 'kinetichub' ); ?></span>
            <span class="kh-mq-indicator-label kh-mq-indicator-paused"><?php echo esc_html__( 'PAUSED', 'kinetichub' ); ?></span>
            <span class="kh-mq-indicator-label kh-mq-indicator-slow"><?php echo esc_html__( 'SLOW', 'kinetichub' ); ?></span>
        </div>
    <?php endif; ?>

    <?php if ( $kh_mq_show_progress_rail ) : ?>
        <div class="kh-mq-progress-rail">
            <?php for ( $kh_mq_i = 0; $kh_mq_i < count( $kh_mq_images ); $kh_mq_i++ ) : ?>
                <span class="kh-mq-progress-segment <?php echo esc_attr( 0 === $kh_mq_i ? 'is-active' : '' ); ?>"></span>
            <?php endfor; ?>
        </div>
    <?php endif; ?>

    <div class="<?php echo esc_attr( implode( ' ', $kh_mq_inner_classes ) ); ?>">
        <div class="kh-mq-marquee-track">
            <div class="kh-mq-marquee-group">
                <?php foreach ( $kh_mq_cloned_images as $kh_mq_index => $kh_mq_img ) : ?>
                    <?php $kh_mq_origin_index = $kh_mq_index % count( $kh_mq_images ); ?>
                    <?php
                    /*
                     * Clone arithmetic belongs to the caller, which is the only scope where
                     * $kh_mq_images exists - the helper is a top-level function and inherits
                     * nothing. So the decision is made here and crosses as plain intent: the
                     * leading pass over the originals is the meaningful accessible copy, every
                     * repetition after it is not.
                     */
                    $kh_mq_is_accessible_copy = ( $kh_mq_index < count( $kh_mq_images ) );
                    ?>
                    <?php echo wp_kses( kinetichub_mq_render_item_markup( $kh_mq_img, $kh_mq_index, true, $kh_mq_show_frame, $kh_mq_frame_shadow, $kh_mq_open_in_new_tab, $kh_mq_origin_index, $kh_mq_is_accessible_copy ), $kh_mq_allowed_item_tags ); ?>
                <?php endforeach; ?>
            </div>

            <?php /* The second group exists purely to close the loop visually - nothing in it is ever the meaningful copy. */ ?>
            <div class="kh-mq-marquee-group" aria-hidden="true">
                <?php foreach ( $kh_mq_cloned_images as $kh_mq_index => $kh_mq_img ) : ?>
                    <?php $kh_mq_origin_index = $kh_mq_index % count( $kh_mq_images ); ?>
                    <?php echo wp_kses( kinetichub_mq_render_item_markup( $kh_mq_img, $kh_mq_index, false, $kh_mq_show_frame, $kh_mq_frame_shadow, $kh_mq_open_in_new_tab, $kh_mq_origin_index, false ), $kh_mq_allowed_item_tags ); ?>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>