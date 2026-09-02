<?php
/**
 * Kinetic Scroll Progress - Server-Side Render Logic
 * Version: 1.0.0
 *
 * Emits the static structure and configuration for the scroll progress
 * indicator. Progress itself and milestone discovery are handled by the
 * frontend runtime; nothing here inspects or queries page content.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$attributes = $attributes ?? array();
$content    = $content ?? '';
$block      = $block ?? null;

if ( ! function_exists( 'kinetichub_sp_validate_color_strict' ) ) {
    /**
     * Validate a strict safe subset of CSS colors.
     *
     * @param string $color   Raw color value.
     * @param string $default Default fallback.
     * @return string
     */
    function kinetichub_sp_validate_color_strict( $color, $default = '#10b981' ) {
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

/* --- Indicator geometry --- */
$kh_sp_presentation = in_array( $attributes['presentation'] ?? '', array( 'horizontal', 'vertical' ), true )
    ? $attributes['presentation']
    : 'horizontal';



$kh_sp_position = in_array( $attributes['position'] ?? '', array( 'top', 'bottom', 'left', 'right' ), true )
    ? $attributes['position']
    : 'top';

/*
 * Coerce impossible presentation/position pairs. A horizontal bar can only sit
 * on a horizontal edge, a vertical rail only on a vertical edge. This keeps
 * stored content renderable if the presentation is switched without the
 * position being updated.
 */
if ( 'horizontal' === $kh_sp_presentation && ! in_array( $kh_sp_position, array( 'top', 'bottom' ), true ) ) {
    $kh_sp_position = 'top';
}

if ( 'vertical' === $kh_sp_presentation && ! in_array( $kh_sp_position, array( 'left', 'right' ), true ) ) {
    $kh_sp_position = 'left';
}

$kh_sp_thickness          = max( 1, min( 24, (int) ( $attributes['thickness'] ?? 4 ) ) );
$kh_sp_thickness_mobile   = max( 1, min( 24, (int) ( $attributes['thicknessMobile'] ?? 3 ) ) );
$kh_sp_length_percent     = max( 10, min( 100, (int) ( $attributes['lengthPercent'] ?? 100 ) ) );
$kh_sp_length_percent_mob = max( 10, min( 100, (int) ( $attributes['lengthPercentMobile'] ?? 100 ) ) );
$kh_sp_edge_offset        = max( 0, min( 200, (int) ( $attributes['edgeOffset'] ?? 0 ) ) );
$kh_sp_edge_offset_mob    = max( 0, min( 200, (int) ( $attributes['edgeOffsetMobile'] ?? 0 ) ) );
// Default 90: below the common theme header/mobile-nav plane (Astra puts
// .site-header at 99). The 1..9999 control range is unchanged and an explicitly
// saved custom value still wins.
$kh_sp_z_index            = max( 1, min( 9999, (int) ( $attributes['zIndex'] ?? 90 ) ) );





/* --- Header awareness --- */

/*
 * Whether the runtime should keep this indicator clear of the site header.
 *
 * Eligibility is decided here rather than in the runtime because everything it
 * depends on -- presentation, edge, ring corner, the mobile override and the
 * derived mobile edge -- is already resolved above. Re-deriving that matrix in
 * JavaScript would mean two copies of the same rules with two chances to drift.
 * The runtime reads one class and caches one boolean.
 *
 * A header can only ever be in the way at the TOP edge. A bar on the bottom or
 * a rail down a side is never eligible, so it is never written to and never
 * pays for any of this.
 */
$kh_sp_header_offset = in_array( $attributes['headerOffset'] ?? '', array( 'auto', 'off' ), true )
    ? $attributes['headerOffset']
    : 'auto';

$kh_sp_top_edge = ( 'horizontal' === $kh_sp_presentation && 'top' === $kh_sp_position );



$kh_sp_header_aware = ( 'auto' === $kh_sp_header_offset ) && $kh_sp_top_edge;

/* --- Progress appearance --- */
$kh_sp_track_color    = kinetichub_sp_validate_color_strict( $attributes['trackColor'] ?? '', '#111827' );
$kh_sp_progress_color = kinetichub_sp_validate_color_strict( $attributes['progressColor'] ?? '', '#10b981' );
$kh_sp_track_opacity  = max( 0, min( 1, (float) ( $attributes['trackOpacity'] ?? 0.2 ) ) );
$kh_sp_fill_opacity   = max( 0, min( 1, (float) ( $attributes['progressOpacity'] ?? 1 ) ) );
$kh_sp_radius         = max( 0, min( 50, (int) ( $attributes['borderRadius'] ?? 4 ) ) );

$kh_sp_direction = in_array( $attributes['direction'] ?? '', array( 'normal', 'reverse' ), true )
    ? $attributes['direction']
    : 'normal';

$kh_sp_smoothing = in_array( $attributes['smoothing'] ?? '', array( 'none', 'subtle', 'smooth' ), true )
    ? $attributes['smoothing']
    : 'subtle';





/* --- Automatic milestones --- */
$kh_sp_milestones_on = ! empty( $attributes['enableMilestones'] );

$kh_sp_heading_levels = in_array( $attributes['headingLevels'] ?? '', array( 'h2', 'h2h3' ), true )
    ? $attributes['headingLevels']
    : 'h2';

$kh_sp_max_milestones = max( 3, min( 30, (int) ( $attributes['maxMilestones'] ?? 12 ) ) );

/*
 * Milestone density is configured per device. Narrow screens carry the same
 * indicator but rarely have room for the same journey, so the levels and the
 * maximum are resolved separately and the frontend picks one pair per refresh.
 */
$kh_sp_heading_levels_mob = in_array( $attributes['headingLevelsMobile'] ?? '', array( 'h2', 'h2h3' ), true )
    ? $attributes['headingLevelsMobile']
    : 'h2';

$kh_sp_max_milestones_mob = max( 3, min( 30, (int) ( $attributes['maxMilestonesMobile'] ?? 6 ) ) );

$kh_sp_show_labels = isset( $attributes['showLabels'] ) ? (bool) $attributes['showLabels'] : true;

$kh_sp_labels_desktop = in_array( $attributes['labelsDesktop'] ?? '', array( 'show', 'major', 'current', 'hide' ), true )
    ? $attributes['labelsDesktop']
    : 'show';

$kh_sp_labels_mobile = in_array( $attributes['labelsMobile'] ?? '', array( 'show', 'major', 'current', 'hide' ), true )
    ? $attributes['labelsMobile']
    : 'current';

$kh_sp_label_layout = in_array( $attributes['horizontalLabelLayout'] ?? '', array( 'standard', 'staggered' ), true )
    ? $attributes['horizontalLabelLayout']
    : 'standard';



$kh_sp_marker_style = in_array( $attributes['markerStyle'] ?? '', array( 'dot', 'tick' ), true )
    ? $attributes['markerStyle']
    : 'dot';

$kh_sp_active_color   = kinetichub_sp_validate_color_strict( $attributes['activeColor'] ?? '', '#10b981' );
$kh_sp_inactive_color = kinetichub_sp_validate_color_strict( $attributes['inactiveColor'] ?? '', '#9ca3af' );

/*
 * Label background. A plate behind the label text only, for pages where the
 * content underneath makes a bare label hard to read.
 *
 * "none" is the default and is deliberately not a rendered state: no class and
 * no custom property are emitted for it, so a block that never touched the
 * setting produces exactly the markup it did before the setting existed.
 */
$kh_sp_label_bg = in_array( $attributes['labelBackground'] ?? '', array( 'none', 'box', 'rounded', 'pill' ), true )
    ? $attributes['labelBackground']
    : 'none';

$kh_sp_label_bg_color = kinetichub_sp_validate_color_strict( $attributes['labelBackgroundColor'] ?? '', '#111827' );

// Only meaningful where a label is actually drawn.
$kh_sp_label_bg_on = $kh_sp_milestones_on && $kh_sp_show_labels && 'none' !== $kh_sp_label_bg;

/*
 * Sync rides the same gate rather than standing on its own, so a block saved
 * with sync on and the background later set back to None emits nothing at all.
 * The stored colour is left untouched either way: turning sync off is only ever
 * the removal of a class, and the author's manual colour is still there.
 */
$kh_sp_label_bg_sync = $kh_sp_label_bg_on && ! empty( $attributes['syncLabelBackgroundWithProgress'] );

/* --- Responsive visibility --- */
$kh_sp_hide_mobile  = ! empty( $attributes['hideOnMobile'] );
$kh_sp_hide_desktop = ! empty( $attributes['hideOnDesktop'] );

/* --- Build CSS custom properties --- */
$kh_sp_css_vars = sprintf(
    '--kh-sp-size-desk: %1$dpx; --kh-sp-size-mob: %2$dpx; --kh-sp-length-desk: %3$d%%; --kh-sp-length-mob: %4$d%%; --kh-sp-offset-desk: %5$dpx; --kh-sp-offset-mob: %6$dpx; --kh-sp-z: %7$d; --kh-sp-track-c: %8$s; --kh-sp-track-o: %9$s; --kh-sp-fill-c: %10$s; --kh-sp-fill-o: %11$s; --kh-sp-radius: %12$dpx;',
    $kh_sp_thickness,
    $kh_sp_thickness_mobile,
    $kh_sp_length_percent,
    $kh_sp_length_percent_mob,
    $kh_sp_edge_offset,
    $kh_sp_edge_offset_mob,
    $kh_sp_z_index,
    $kh_sp_track_color,
    (string) $kh_sp_track_opacity,
    $kh_sp_progress_color,
    (string) $kh_sp_fill_opacity,
    $kh_sp_radius
);

if ( $kh_sp_milestones_on ) {
    $kh_sp_css_vars .= sprintf(
        ' --kh-sp-ms-active: %1$s; --kh-sp-ms-inactive: %2$s;',
        $kh_sp_active_color,
        $kh_sp_inactive_color
    );
}

if ( $kh_sp_label_bg_on ) {
    $kh_sp_css_vars .= sprintf( ' --kh-sp-ms-label-bg: %s;', $kh_sp_label_bg_color );
}



/* --- Build outer class list --- */
$kh_sp_outer_classes = array_filter(
    array(
        'kh-sp-wrapper',
        'pres-' . $kh_sp_presentation,
        
        'pos-' . $kh_sp_position,
        'dir-' . $kh_sp_direction,
        'smooth-' . $kh_sp_smoothing,
        // The runtime's only eligibility signal, and the hook the stylesheet
        // uses to withhold first paint until the clearance has been measured.
        $kh_sp_header_aware ? 'header-aware' : '',
        $kh_sp_milestones_on ? 'has-milestones' : '',
        $kh_sp_milestones_on ? 'marker-' . $kh_sp_marker_style : '',
        $kh_sp_milestones_on ? ( $kh_sp_show_labels ? 'labels-on' : 'labels-off' ) : '',
        $kh_sp_milestones_on && $kh_sp_show_labels ? 'labels-desk-' . $kh_sp_labels_desktop : '',
        $kh_sp_milestones_on && $kh_sp_show_labels ? 'labels-mob-' . $kh_sp_labels_mobile : '',
        $kh_sp_milestones_on && $kh_sp_show_labels ? 'labels-layout-' . $kh_sp_label_layout : '',
        // No class for "none": the absence of one is what keeps existing blocks
        // byte-identical rather than merely equivalent.
        $kh_sp_label_bg_on ? 'labels-bg-' . $kh_sp_label_bg : '',
        // Colour source only. The shape class above still owns padding and radius.
        $kh_sp_label_bg_sync ? 'labels-bg-sync' : '',
        $kh_sp_hide_mobile ? 'hide-mobile' : '',
        $kh_sp_hide_desktop ? 'hide-desktop' : '',
        
    )
);

$kh_sp_wrapper_attrs = get_block_wrapper_attributes(
    array(
        'class' => implode( ' ', $kh_sp_outer_classes ),
        'style' => $kh_sp_css_vars,
    )
);
?>

<div <?php echo $kh_sp_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
    aria-hidden="true"
    data-levels="<?php echo esc_attr( $kh_sp_heading_levels ); ?>"
    data-max="<?php echo esc_attr( (string) $kh_sp_max_milestones ); ?>"
    data-levels-mobile="<?php echo esc_attr( $kh_sp_heading_levels_mob ); ?>"
    data-max-mobile="<?php echo esc_attr( (string) $kh_sp_max_milestones_mob ); ?>"
    
>
    <div class="kh-sp-track">
        <div class="kh-sp-fill"></div>
    </div>
    
    <?php if ( $kh_sp_milestones_on ) : ?>
        <ol class="kh-sp-milestones"></ol>
    <?php endif; ?>
</div>
<?php
