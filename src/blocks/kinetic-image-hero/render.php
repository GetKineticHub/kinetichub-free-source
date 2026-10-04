<?php
/**
 * Kinetic Image Hero - Server Render Logic
 *
 * One DOM structure serves every presentation, and the editor preview in
 * index.js mirrors it class for class (the decisions behind the classes are
 * mirrored in hero-model.js):
 *
 *   section.kh-ih-hero                  layout, stage, placement, motion classes; its ::before is the vignette
 *     .kh-ih-media                      image composition layer; ::before scene backdrop, ::after spotlight
 *       .kh-ih-slot                     one per rendered image; geometry + entrance owner; is-fit-contain for Contain,
 *                                       plus is-contain-transparent when its Frame background is off
 *         .kh-ih-slot-inner             card face (clip, radius, shadow); hover / scroll / pointer owner
 *           picture.kh-ih-picture       optional mobile <source>, then the <img>
 *             img.kh-ih-img             fit + crop + focal point + image treatment owner
 *     .kh-ih-overlay                    tint
 *     .kh-ih-content-layer              placement; never inside an image transform
 *       .kh-ih-content                  text + actions
 *
 * Two stages share that DOM. Backdrop (single, split-duo): the media fills the
 * section behind the overlay and the content. Composed (offset-duo,
 * stacked-cards, editorial-collage): the media is a composition in its own
 * area beside the content, or below it when the content is centred. The
 * stylesheet does all of that from the classes and custom properties written
 * here; the markup itself never changes per presentation.
 *
 * Everything below is visible and usable without JavaScript, and mobile
 * simplification is CSS media queries only. Motion is classes too: hover is
 * pure CSS, and the view script -- enqueued only by a hero that needs it --
 * does no more than trigger the reveal and feed scroll progress and pointer
 * position to the stylesheet as custom properties. Nothing waits for it.
 *
 * @package kinetichub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$attributes = isset( $attributes ) && is_array( $attributes ) ? $attributes : array();

if ( ! function_exists( 'kinetichub_ih_validate_color_strict' ) ) {
	/**
	 * Validate a strict safe subset of CSS colors.
	 *
	 * @param mixed  $color    Raw color.
	 * @param string $fallback Fallback color.
	 * @return string
	 */
	function kinetichub_ih_validate_color_strict( $color, $fallback = 'transparent' ) {
		$color = is_string( $color ) ? trim( $color ) : '';

		if ( '' === $color ) {
			return $fallback;
		}

		if ( preg_match( '/^#([A-Fa-f0-9]{3}){1,2}([A-Fa-f0-9]{2})?$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^rgba?\(\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/', $color ) ) {
			return $color;
		}

		if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $color ) ) {
			return $color;
		}

		return $fallback;
	}
}

if ( ! function_exists( 'kinetichub_ih_color_alpha' ) ) {
	/**
	 * The alpha of a custom CSS colour as core stores it (hex, rgb[a](), hsl[a](),
	 * `transparent`); 1 when it cannot be read. Mirrors colorAlpha() in hero-model.js.
	 *
	 * @param mixed $color Raw colour.
	 * @return float
	 */
	function kinetichub_ih_color_alpha( $color ) {
		$color = is_string( $color ) ? strtolower( trim( $color ) ) : '';

		if ( 'transparent' === $color ) {
			return 0.0;
		}

		if ( preg_match( '/^#(?:[0-9a-f]{3}([0-9a-f])|[0-9a-f]{6}([0-9a-f]{2}))$/', $color, $match ) ) {
			return '' !== $match[1] ? hexdec( $match[1] ) / 15 : hexdec( $match[2] ) / 255;
		}

		if ( preg_match( '/^(?:rgba?|hsla?)\((.*)\)$/', $color, $match ) ) {
			$parts = preg_split( '/\s*[,\/]\s*|\s+/', $match[1], -1, PREG_SPLIT_NO_EMPTY );

			if ( 4 === count( $parts ) && is_numeric( rtrim( $parts[3], '%' ) ) ) {
				$alpha = '%' === substr( $parts[3], -1 ) ? (float) $parts[3] / 100 : (float) $parts[3];

				return max( 0.0, min( 1.0, $alpha ) );
			}
		}

		return 1.0;
	}
}

if ( ! function_exists( 'kinetichub_ih_clamp_unit' ) ) {
	/**
	 * Clamp a focal-point coordinate to 0..1, defaulting to the centre.
	 *
	 * @param mixed $value Raw coordinate.
	 * @return float
	 */
	function kinetichub_ih_clamp_unit( $value ) {
		if ( ! is_numeric( $value ) ) {
			return 0.5;
		}

		return max( 0.0, min( 1.0, (float) $value ) );
	}
}

if ( ! function_exists( 'kinetichub_ih_clamp_step' ) ) {
	/**
	 * Clamp a numeric setting to its range and step. Mirrors clampStep() in hero-model.js.
	 *
	 * @param mixed     $value    Raw attribute.
	 * @param int|float $min      Minimum.
	 * @param int|float $max      Maximum.
	 * @param int|float $step     Step the value is rounded to.
	 * @param int|float $fallback Used when the value is not numeric.
	 * @return float
	 */
	function kinetichub_ih_clamp_step( $value, $min, $max, $step, $fallback ) {
		if ( ! is_numeric( $value ) ) {
			return (float) $fallback;
		}

		$stepped = round( round( (float) $value / $step ) * $step, 2 );

		return (float) max( $min, min( $max, $stepped ) );
	}
}

if ( ! function_exists( 'kinetichub_ih_resolve_choice' ) ) {
	/**
	 * A saved choice as it renders: itself when the list offers it, else its
	 * fallback when the list offers that, else the default. Mirrors
	 * resolveChoice() in hero-model.js.
	 *
	 * @param mixed    $value      Raw attribute.
	 * @param string[] $allowed    Values offered here.
	 * @param string[] $fallbacks  The attribute's entry of $kh_ih_value_fallbacks.
	 * @param string   $by_default Used for anything else.
	 * @return string
	 */
	function kinetichub_ih_resolve_choice( $value, $allowed, $fallbacks, $by_default ) {
		if ( in_array( $value, $allowed, true ) ) {
			return $value;
		}

		$mapped = is_string( $value ) && isset( $fallbacks[ $value ] ) ? $fallbacks[ $value ] : null;

		return in_array( $mapped, $allowed, true ) ? $mapped : $by_default;
	}
}

if ( ! function_exists( 'kinetichub_ih_format_number' ) ) {
	/**
	 * Format a number with at most two decimals and no trailing zeros, matching the editor.
	 *
	 * @param float $value Number.
	 * @return string
	 */
	function kinetichub_ih_format_number( $value ) {
		return rtrim( rtrim( number_format( (float) $value, 2, '.', '' ), '0' ), '.' );
	}
}

if ( ! function_exists( 'kinetichub_ih_format_percent' ) ) {
	/**
	 * Format a 0..1 coordinate as a percentage number, matching the editor's rounding.
	 *
	 * @param float $value Coordinate.
	 * @return string
	 */
	function kinetichub_ih_format_percent( $value ) {
		return kinetichub_ih_format_number( $value * 100 );
	}
}

if ( ! function_exists( 'kinetichub_ih_normalize_mobile_image' ) ) {
	/**
	 * Normalize one stored mobile replacement: an attachment ID and its fallback URL.
	 *
	 * @param mixed $raw_item Raw `mobileImages` entry.
	 * @return array|null Null when the slot has no replacement.
	 */
	function kinetichub_ih_normalize_mobile_image( $raw_item ) {
		if ( is_object( $raw_item ) ) {
			$raw_item = (array) $raw_item;
		}

		if ( ! is_array( $raw_item ) ) {
			return null;
		}

		$id  = isset( $raw_item['id'] ) && is_numeric( $raw_item['id'] ) ? absint( $raw_item['id'] ) : 0;
		$url = isset( $raw_item['url'] ) && is_string( $raw_item['url'] ) ? esc_url_raw( trim( $raw_item['url'] ) ) : '';

		if ( 0 === $id && '' === $url ) {
			return null;
		}

		return array(
			'id'  => $id,
			'url' => $url,
		);
	}
}

if ( ! function_exists( 'kinetichub_ih_normalize_images' ) ) {
	/**
	 * Normalize the stored image list and the mobile replacements that go with it.
	 *
	 * Drops malformed entries, clamps every value, and enforces the maximum here
	 * rather than trusting the editor: a hand-edited or imported post can carry
	 * any number of items, and none past the cap may ever reach the markup.
	 *
	 * Mobile replacements are their own attribute, aligned with `images` by
	 * position. They are joined here by the RAW position, so a dropped desktop
	 * entry takes its replacement with it instead of shifting every later
	 * replacement onto the wrong image.
	 *
	 * @param mixed $raw_images        Raw `images` attribute.
	 * @param int   $max_images        Maximum number of items kept.
	 * @param mixed $raw_mobile_images Raw `mobileImages` attribute.
	 * @return array[]
	 */
	function kinetichub_ih_normalize_images( $raw_images, $max_images, $raw_mobile_images = array() ) {
		$images = array();

		if ( ! is_array( $raw_images ) ) {
			return $images;
		}

		$raw_mobile_images = is_array( $raw_mobile_images ) ? array_values( $raw_mobile_images ) : array();

		foreach ( array_values( $raw_images ) as $raw_index => $raw_item ) {
			if ( count( $images ) >= $max_images ) {
				break;
			}

			if ( is_object( $raw_item ) ) {
				$raw_item = (array) $raw_item;
			}

			if ( ! is_array( $raw_item ) ) {
				continue;
			}

			$id  = isset( $raw_item['id'] ) && is_numeric( $raw_item['id'] ) ? absint( $raw_item['id'] ) : 0;
			$url = isset( $raw_item['url'] ) && is_string( $raw_item['url'] ) ? esc_url_raw( trim( $raw_item['url'] ) ) : '';

			if ( 0 === $id && '' === $url ) {
				continue;
			}

			$focal = isset( $raw_item['focalPoint'] ) ? (array) $raw_item['focalPoint'] : array();

			$images[] = array(
				'id'           => $id,
				'url'          => $url,
				'focal_x'      => kinetichub_ih_clamp_unit( $focal['x'] ?? 0.5 ),
				'focal_y'      => kinetichub_ih_clamp_unit( $focal['y'] ?? 0.5 ),
				'alt_override' => isset( $raw_item['altOverride'] ) && is_string( $raw_item['altOverride'] ) ? sanitize_text_field( $raw_item['altOverride'] ) : '',
				'decorative'   => ! empty( $raw_item['decorative'] ),
				// Cover unless Contain was chosen: an image saved before Image Fit existed is Cover. Mirrors getImageFit().
				'fit'          => isset( $raw_item['fit'] ) && 'contain' === $raw_item['fit'] ? 'contain' : 'cover',
				// Frame background: on unless switched off, so only `false` turns it off. Mirrors getContainBackground().
				'contain_bg'   => ! ( isset( $raw_item['containBackground'] ) && false === $raw_item['containBackground'] ),
				'mobile'       => kinetichub_ih_normalize_mobile_image( $raw_mobile_images[ $raw_index ] ?? null ),
			);
		}

		return $images;
	}
}

if ( ! function_exists( 'kinetichub_ih_attachment_is_renderable' ) ) {
	/**
	 * Whether an attachment ID currently resolves to a renderable image.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return bool
	 */
	function kinetichub_ih_attachment_is_renderable( $attachment_id ) {
		return $attachment_id > 0
			&& wp_attachment_is_image( $attachment_id )
			&& false !== wp_get_attachment_image_src( $attachment_id, 'full' );
	}
}

if ( ! function_exists( 'kinetichub_ih_image_is_usable' ) ) {
	/**
	 * Whether a normalized image can produce an <img>: a live attachment, or the fallback URL.
	 *
	 * @param array $image Normalized image.
	 * @return bool
	 */
	function kinetichub_ih_image_is_usable( $image ) {
		return kinetichub_ih_attachment_is_renderable( $image['id'] ) || '' !== $image['url'];
	}
}

if ( ! function_exists( 'kinetichub_ih_keep_sizes' ) ) {
	/**
	 * Take core's `auto` back off an Image Hero card whose photo is drawn by its height.
	 *
	 * Core puts `auto` first in every lazy image's `sizes` (WordPress 6.7+),
	 * and a browser that honours it picks the file for the <img> box alone.
	 * That is right for a photo drawn no wider than its box, but a card that
	 * crops a landscape photo draws it at the card's height times its aspect,
	 * far wider than the box, and gets a file too small. Those are the `sizes`
	 * this block ends with a vh size (see the card sizes), so exactly those
	 * keep their own. Core adds `auto` in wp_get_attachment_image() and again
	 * when it filters post content, so this runs on the rendered image and as
	 * a `wp_content_img_tag` filter. Every other image is returned untouched.
	 *
	 * @param string $image An <img> tag.
	 * @return string
	 */
	function kinetichub_ih_keep_sizes( $image ) {
		if ( ! is_string( $image ) || false === strpos( $image, 'kh-ih-img' ) ) {
			return $image;
		}

		$processor = new WP_HTML_Tag_Processor( $image );

		if ( ! $processor->next_tag( 'img' ) ) {
			return $image;
		}

		$class = $processor->get_attribute( 'class' );
		$sizes = $processor->get_attribute( 'sizes' );

		if ( ! is_string( $class ) || ! preg_match( '/(^|\s)kh-ih-img(\s|$)/', $class ) || ! is_string( $sizes ) || ! preg_match( '/^\s*auto\s*,\s*(\S.*\dvh)\s*$/is', $sizes, $match ) ) {
			return $image;
		}

		$processor->set_attribute( 'sizes', $match[1] );

		return $processor->get_updated_html();
	}
}

if ( ! function_exists( 'kinetichub_ih_render_image' ) ) {
	/**
	 * Render one <img>, resolved from the attachment ID at render time.
	 *
	 * Loading is decided here and nowhere else. The primary slot is always
	 * eager with high fetch priority; every other slot is lazy and never gets
	 * a fetch priority. Both are set explicitly, so core's content-level
	 * heuristics leave them alone. A mobile <source> beside this <img> is
	 * picked by the browser for this same element, so it inherits the same
	 * loading and priority.
	 *
	 * Alt: decorative wins and outputs alt=""; otherwise the per-slot override;
	 * otherwise nothing is passed, so core reads the current Media Library alt.
	 *
	 * @param array  $image      Normalized image.
	 * @param bool   $is_primary Whether this is the primary slot.
	 * @param string $sizes      The `sizes` value for this slot.
	 * @return string
	 */
	function kinetichub_ih_render_image( $image, $is_primary, $sizes ) {
		$focal_style = sprintf(
			'--kh-ih-focal: %1$s%% %2$s%%;',
			kinetichub_ih_format_percent( $image['focal_x'] ),
			kinetichub_ih_format_percent( $image['focal_y'] )
		);
		$loading     = $is_primary ? 'eager' : 'lazy';
		$alt         = null;

		if ( $image['decorative'] ) {
			$alt = '';
		} elseif ( '' !== $image['alt_override'] ) {
			$alt = $image['alt_override'];
		}

		if ( kinetichub_ih_attachment_is_renderable( $image['id'] ) ) {
			$image_attrs = array(
				'class'    => 'kh-ih-img',
				'loading'  => $loading,
				'decoding' => 'async',
				'sizes'    => $sizes,
				'style'    => $focal_style,
			);

			if ( $is_primary ) {
				$image_attrs['fetchpriority'] = 'high';
			}

			if ( null !== $alt ) {
				$image_attrs['alt'] = $alt;
			}

			$image_html = wp_get_attachment_image( $image['id'], 'full', false, $image_attrs );

			if ( '' !== $image_html ) {
				return kinetichub_ih_keep_sizes( $image_html );
			}
		}

		if ( '' === $image['url'] ) {
			return '';
		}

		// No attachment to read a Media Library alt from, so an unset alt is empty rather than missing.
		return sprintf(
			'<img class="kh-ih-img" src="%1$s" alt="%2$s" loading="%3$s" decoding="async"%4$s style="%5$s" />',
			esc_url( $image['url'] ),
			esc_attr( null === $alt ? '' : $alt ),
			esc_attr( $loading ),
			$is_primary ? ' fetchpriority="high"' : '',
			esc_attr( $focal_style )
		);
	}
}

if ( ! function_exists( 'kinetichub_ih_render_mobile_source' ) ) {
	/**
	 * Render the mobile <source> for one slot, or '' when it has no usable replacement.
	 *
	 * A <source> only offers the browser a different file for the slot's one
	 * <img>: there is never a second image element, and nothing here carries
	 * alt text -- the <img> keeps the slot's alternative text for both files.
	 *
	 * @param array|null $mobile Normalized mobile replacement.
	 * @param string     $sizes  The `sizes` value at the mobile breakpoint.
	 * @return string
	 */
	function kinetichub_ih_render_mobile_source( $mobile, $sizes ) {
		if ( null === $mobile ) {
			return '';
		}

		$source_attrs = array( 'media' => '(max-width: 768px)' );

		if ( kinetichub_ih_attachment_is_renderable( $mobile['id'] ) ) {
			$full   = wp_get_attachment_image_src( $mobile['id'], 'full' );
			$srcset = wp_get_attachment_image_srcset( $mobile['id'], 'full' );

			if ( $srcset ) {
				$source_attrs['srcset'] = $srcset;
				$source_attrs['sizes']  = $sizes;
			} else {
				$source_attrs['srcset'] = $full[0];
			}

			if ( $full[1] > 0 && $full[2] > 0 ) {
				$source_attrs['width']  = (int) $full[1];
				$source_attrs['height'] = (int) $full[2];
			}
		} elseif ( '' !== $mobile['url'] ) {
			// A comma in a bare URL would read as a srcset candidate separator.
			$source_attrs['srcset'] = str_replace( ',', '%2C', $mobile['url'] );
		} else {
			return '';
		}

		$source_html = '<source';

		foreach ( $source_attrs as $name => $value ) {
			$source_html .= sprintf( ' %1$s="%2$s"', $name, esc_attr( $value ) );
		}

		return $source_html . ' />';
	}
}

if ( ! function_exists( 'kinetichub_ih_rich_text' ) ) {
	/**
	 * Sanitize a RichText attribute; returns '' when it has no visible text.
	 *
	 * @param mixed $value        Raw attribute.
	 * @param array $allowed_html wp_kses allowed tags.
	 * @return string
	 */
	function kinetichub_ih_rich_text( $value, $allowed_html ) {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$value = wp_kses( $value, $allowed_html );

		return '' === trim( wp_strip_all_tags( $value ) ) ? '' : $value;
	}
}

if ( ! function_exists( 'kinetichub_ih_build_rel' ) ) {
	/**
	 * Build a clean rel value, adding noopener for new-tab links.
	 *
	 * @param mixed $rel     Raw rel attribute.
	 * @param bool  $new_tab Whether the link opens in a new tab.
	 * @return string
	 */
	function kinetichub_ih_build_rel( $rel, $new_tab ) {
		$tokens = is_string( $rel ) ? preg_split( '/[\s,]+/', strtolower( $rel ), -1, PREG_SPLIT_NO_EMPTY ) : array();
		$tokens = array_filter(
			$tokens,
			static function ( $token ) {
				return (bool) preg_match( '/^[a-z][a-z0-9-]*$/', $token );
			}
		);

		if ( $new_tab ) {
			$tokens[] = 'noopener';
		}

		return implode( ' ', array_unique( $tokens ) );
	}
}

/*
 * Images. Up to three are read in every build; the presentation's slots
 * decide how many render, and the rest stay stored.
 */
$kh_ih_max_images = 3;
$kh_ih_images     = kinetichub_ih_normalize_images( $attributes['images'] ?? array(), $kh_ih_max_images, $attributes['mobileImages'] ?? array() );

/*
 * What a saved value renders as where this build does not offer it, by
 * attribute: the nearest value it does offer. In a build that offers every
 * value no entry changes what renders, and the attribute is never rewritten.
 * Any other unknown value takes the setting's own default. Backdrop Intensity
 * and Content Entrance are offered in full everywhere and have no entry.
 * Mirrors VALUE_FALLBACKS in hero-model.js.
 */
$kh_ih_value_fallbacks = array(
	'presentation'     => array(
		'stacked-cards'     => 'offset-duo',
		'editorial-collage' => 'offset-duo',
	),
	'compositionScale' => array( 'oversized' => 'large' ),
	'mediaBalance'     => array( '35-65' => '40-60' ),
	'contentOverlap'   => array( 'strong' => 'subtle' ),
	'sceneBackdrop'    => array(
		'dual-glow'    => 'soft-glow',
		'accent-panel' => 'gradient-wash',
		'vignette'     => 'none',
	),
	'motionMode'       => array(
		'scroll'       => 'none',
		'scroll-hover' => 'hover',
	),
	'motionIntensity'  => array( 'strong' => 'medium' ),
	'revealStyle'      => array(
		'clip'       => 'fade-rise',
		'blur-sharp' => 'fade-rise',
	),
);

/*
 * Presentation. Every ID this build offers is accepted so a saved value is
 * never lost; one it does not offer renders as its fallback, anything else as
 * single. `$kh_ih_layout` is what actually renders: a presentation without
 * enough usable images renders as single while `$kh_ih_presentation` keeps
 * the saved value.
 */
$kh_ih_presentation_list = array(
	'single',
	'split-duo',
	'offset-duo',
	
);
$kh_ih_presentation = kinetichub_ih_resolve_choice( $attributes['presentation'] ?? '', $kh_ih_presentation_list, $kh_ih_value_fallbacks['presentation'], 'single' );

// [minimum, maximum] usable images each presentation renders.
$kh_ih_layout_slots = array(
	'single'            => array( 1, 1 ),
	'split-duo'         => array( 2, 2 ),
	'offset-duo'        => array( 2, 2 ),
	
);

// Presentations whose images are a composition beside the content rather than a backdrop behind it.
$kh_ih_composed_layouts = array(
	'offset-duo',
	
);

$kh_ih_usable_images = array_values( array_filter( $kh_ih_images, 'kinetichub_ih_image_is_usable' ) );
$kh_ih_layout        = count( $kh_ih_usable_images ) >= $kh_ih_layout_slots[ $kh_ih_presentation ][0] ? $kh_ih_presentation : 'single';
$kh_ih_slot_images   = array_slice( $kh_ih_usable_images, 0, $kh_ih_layout_slots[ $kh_ih_layout ][1] );
$kh_ih_slot_count    = count( $kh_ih_slot_images );
$kh_ih_stage         = in_array( $kh_ih_layout, $kh_ih_composed_layouts, true ) ? 'composed' : 'backdrop';

/*
 * Composition. A setting that was never touched has no stored value and
 * takes the rendered presentation's own tuning; a stored value is shared by
 * every presentation. Single has no composition settings at all.
 */
$kh_ih_composition_ranges = array(
	'gap'      => array( 'compositionGap', 0, 64, 1 ),
	'radius'   => array( 'cardRadius', 0, 48, 1 ),
	'rotation' => array( 'cardRotation', 0, 8, 0.5 ),
	'overlap'  => array( 'compositionOverlap', 0, 100, 1 ),
	'depth'    => array( 'compositionDepth', 0, 100, 1 ),
);

$kh_ih_composition_defaults = array(
	'split-duo'         => array(
		'gap'      => 0,
		'radius'   => 0,
		'shadow'   => 'none',
		'rotation' => 0,
		'overlap'  => 0,
		'depth'    => 0,
	),
	'offset-duo'        => array(
		'gap'      => 16,
		'radius'   => 12,
		'shadow'   => 'floating',
		'rotation' => 2,
		'overlap'  => 35,
		'depth'    => 50,
	),
	
);

// The numeric settings each presentation reads, written as --kh-ih-{key}.
$kh_ih_composition_vars = array(
	'split-duo'         => array( 'gap', 'radius', 'rotation', 'depth' ),
	'offset-duo'        => array( 'gap', 'radius', 'rotation', 'overlap', 'depth' ),
	
);

$kh_ih_split_ratio_list = array( '50-50', '40-60', '60-40' );
$kh_ih_shadow_list      = array( 'none', 'soft', 'floating' );
$kh_ih_composition      = null;

if ( isset( $kh_ih_composition_defaults[ $kh_ih_layout ] ) ) {
	$kh_ih_composition_default = $kh_ih_composition_defaults[ $kh_ih_layout ];

	$kh_ih_composition = array(
		'ratio'  => in_array( $attributes['splitRatio'] ?? '', $kh_ih_split_ratio_list, true ) ? $attributes['splitRatio'] : '50-50',
		'shadow' => in_array( $attributes['cardShadow'] ?? '', $kh_ih_shadow_list, true ) ? $attributes['cardShadow'] : $kh_ih_composition_default['shadow'],
	);

	foreach ( $kh_ih_composition_ranges as $kh_ih_setting => $kh_ih_range ) {
		$kh_ih_composition[ $kh_ih_setting ] = kinetichub_ih_clamp_step(
			$attributes[ $kh_ih_range[0] ] ?? null,
			$kh_ih_range[1],
			$kh_ih_range[2],
			$kh_ih_range[3],
			$kh_ih_composition_default[ $kh_ih_setting ]
		);
	}
}

/*
 * Stage. The composed stage's semantic settings -- scale, content / media
 * balance, content crossover, scene backdrop -- each written as one class,
 * kh-ih-{key}-{value}; the stylesheet turns them into geometry. Mirrors
 * STAGE_SETTINGS in hero-model.js: attribute, allowed values, fallback.
 */
$kh_ih_composition_scales = array(
	'balanced',
	'large',
	
);

$kh_ih_media_balances = array(
	'50-50',
	'40-60',
	
);

$kh_ih_content_overlaps = array(
	'none',
	'subtle',
	
);

$kh_ih_scene_backdrops = array(
	'none',
	'soft-glow',
	'gradient-wash',
	
);

$kh_ih_stage_settings = array(
	'scale'     => array( 'compositionScale', $kh_ih_composition_scales, 'large' ),
	'balance'   => array( 'mediaBalance', $kh_ih_media_balances, '40-60' ),
	'crossover' => array( 'contentOverlap', $kh_ih_content_overlaps, 'none' ),
	'scene'     => array( 'sceneBackdrop', $kh_ih_scene_backdrops, 'none' ),
);
$kh_ih_stage_values   = array();

if ( 'composed' === $kh_ih_stage ) {
	foreach ( $kh_ih_stage_settings as $kh_ih_setting => $kh_ih_stage_setting ) {
		$kh_ih_stage_values[ $kh_ih_setting ] = kinetichub_ih_resolve_choice( $attributes[ $kh_ih_stage_setting[0] ] ?? '', $kh_ih_stage_setting[1], $kh_ih_value_fallbacks[ $kh_ih_stage_setting[0] ], $kh_ih_stage_setting[2] );
	}
}

/*
 * Scene backdrop actually drawn. A backdrop stage's images fill the section,
 * so only Vignette, which lies over them, applies there; any other saved
 * value is kept and not drawn. Mirrors resolveScene() in hero-model.js.
 */
$kh_ih_backdrop_stage_scenes = array(
	'none',
	
);

$kh_ih_has_media = $kh_ih_slot_count > 0;
$kh_ih_scene     = 'none';

if ( $kh_ih_has_media && 'composed' === $kh_ih_stage ) {
	$kh_ih_scene = $kh_ih_stage_values['scene'];
} elseif ( $kh_ih_has_media ) {
	$kh_ih_scene = kinetichub_ih_resolve_choice( $attributes['sceneBackdrop'] ?? '', $kh_ih_backdrop_stage_scenes, $kh_ih_value_fallbacks['sceneBackdrop'], 'none' );
}

// Backdrop Intensity: every level in every build, so it never shares a list
// with Motion Intensity, which can be narrower.
$kh_ih_scene_intensity_list = array( 'subtle', 'medium', 'strong' );
$kh_ih_scene_intensity      = in_array( $attributes['backdropIntensity'] ?? '', $kh_ih_scene_intensity_list, true ) ? $attributes['backdropIntensity'] : 'medium';

/*
 * Motion, reveal and Smart Addons as they will actually run; a hero without
 * images has none. Mirrors resolveMotion() in hero-model.js. Everything here
 * is written as classes: the stylesheet owns every amplitude, and the view
 * script only feeds it scroll progress and pointer position.
 */
$kh_ih_motion_modes = array(
	'none',
	'hover',
	
);

$kh_ih_motion_intensity_list = array(
	'subtle',
	'medium',
	
);

$kh_ih_reveal_styles = array(
	'none',
	'fade-rise',
	'scale',
	
);

$kh_ih_motion_mode     = $kh_ih_has_media ? kinetichub_ih_resolve_choice( $attributes['motionMode'] ?? '', $kh_ih_motion_modes, $kh_ih_value_fallbacks['motionMode'], 'none' ) : 'none';
$kh_ih_motion_families = array(
	'hover'  => in_array( $kh_ih_motion_mode, array( 'hover', 'scroll-hover' ), true ),
	'scroll' => in_array( $kh_ih_motion_mode, array( 'scroll', 'scroll-hover' ), true ),
);
$kh_ih_motion_level    = kinetichub_ih_resolve_choice( $attributes['motionIntensity'] ?? '', $kh_ih_motion_intensity_list, $kh_ih_value_fallbacks['motionIntensity'], 'medium' );
$kh_ih_reveal          = $kh_ih_has_media ? kinetichub_ih_resolve_choice( $attributes['revealStyle'] ?? '', $kh_ih_reveal_styles, $kh_ih_value_fallbacks['revealStyle'], 'none' ) : 'none';

// Off where Stagger Images is not offered; the saved value is kept either way.
$kh_ih_stagger = false;


// attribute => [class suffix, motion family it refines (null for none), whether this hero can use it].
$kh_ih_addons = array(
	'cardFocus'         => array( 'card-focus', 'hover', $kh_ih_slot_count > 1 ),
	'smartReadability'  => array( 'readability', null, 'backdrop' === $kh_ih_stage || 'none' !== ( $kh_ih_stage_values['crossover'] ?? 'none' ) ),
	
);
$kh_ih_active_addons = array();

foreach ( $kh_ih_addons as $kh_ih_addon => $kh_ih_addon_rule ) {
	if ( $kh_ih_has_media && true === ( $attributes[ $kh_ih_addon ] ?? false ) && ( null === $kh_ih_addon_rule[1] || $kh_ih_motion_families[ $kh_ih_addon_rule[1] ] ) && $kh_ih_addon_rule[2] ) {
		$kh_ih_active_addons[ $kh_ih_addon ] = $kh_ih_addon_rule[0];
	}
}

/*
 * Smart Readability fades the images into the section colour, so it needs to
 * know when there is none: a custom native Background under half opacity,
 * the documented way to let a parent background show through.
 */
$kh_ih_surface_clear = isset( $kh_ih_active_addons['smartReadability'] )
	&& empty( $attributes['backgroundColor'] )
	&& isset( $attributes['style']['color']['background'] )
	&& is_string( $attributes['style']['color']['background'] )
	&& kinetichub_ih_color_alpha( $attributes['style']['color']['background'] ) < 0.5;

/*
 * Content and button design. Each setting is written as one class,
 * kh-ih-{key}-{value}, only when it differs from its default, so a hero saved
 * before these settings existed renders exactly as it did. They apply with or
 * without images. Mirrors CONTENT_SETTINGS / resolveContent() in hero-model.js.
 */
$kh_ih_content_settings = array(
	'width'         => array( 'contentWidth', array( 'narrow', 'standard', 'wide', 'custom' ), 'standard' ),
	'spacing'       => array( 'contentSpacing', array( 'compact', 'balanced', 'airy' ), 'balanced' ),
	'heading'       => array( 'headingSize', array( 'large', 'xl', 'display' ), 'xl' ),
	'description'   => array( 'descriptionSize', array( 'normal', 'large' ), 'normal' ),
	'eyebrow'       => array( 'eyebrowStyle', array( 'plain', 'accent-line', 'pill' ), 'plain' ),
	'badge'         => array( 'badgeStyle', array( 'minimal', 'soft', 'glass' ), 'minimal' ),
	'panel'         => array( 'contentSurface', array( 'none', 'soft-panel', 'glass' ), 'none' ),
	'content-in'    => array( 'contentReveal', array( 'none', 'fade-rise', 'clip', 'blur-sharp' ), 'none' ),
	'content-delay' => array( 'contentDelay', array( 'none', 'short', 'after-media' ), 'none' ),
	'ctas'          => array( 'ctaLayout', array( 'row', 'stack' ), 'row' ),
	'ctas-mobile'   => array( 'ctaMobileLayout', array( 'auto', 'stack', 'full-width' ), 'auto' ),
	'ctas-size'     => array( 'ctaSize', array( 'medium', 'large' ), 'medium' ),
	'ctas-hover'    => array( 'ctaMotion', array( 'none', 'lift', 'arrow-shift', 'glow' ), 'none' ),
);
$kh_ih_content_values   = array();

foreach ( $kh_ih_content_settings as $kh_ih_setting => $kh_ih_content_setting ) {
	$kh_ih_content_values[ $kh_ih_setting ] = in_array( $attributes[ $kh_ih_content_setting[0] ] ?? '', $kh_ih_content_setting[1], true ) ? $attributes[ $kh_ih_content_setting[0] ] : $kh_ih_content_setting[2];
}

// The entrance timing only exists with an entrance.
if ( 'none' === $kh_ih_content_values['content-in'] ) {
	$kh_ih_content_values['content-delay'] = 'none';
}

// Custom width in px, clamped and stepped like the editor; the column it sits in always caps it.
$kh_ih_content_width = kinetichub_ih_clamp_step( $attributes['contentMaxWidth'] ?? null, 320, 1200, 10, 700 );

// The view script runs only what CSS cannot do alone: the reveal trigger, scroll progress, pointer position.
$kh_ih_needs_script = 'none' !== $kh_ih_reveal
	|| 'none' !== $kh_ih_content_values['content-in']
	|| $kh_ih_motion_families['scroll']
	|| isset( $kh_ih_active_addons['pointerDepth'] )
	|| isset( $kh_ih_active_addons['reactiveSpotlight'] );

/*
 * Responsive. Mobile simplification is pure CSS at 768px and below; these
 * only choose which rules apply.
 */
$kh_ih_mobile_composition_list = array( 'auto', 'stack', 'primary' );
$kh_ih_mobile_composition      = in_array( $attributes['mobileComposition'] ?? '', $kh_ih_mobile_composition_list, true ) ? $attributes['mobileComposition'] : 'auto';

$kh_ih_mobile_order_list = array( 'content-first', 'media-first' );
$kh_ih_mobile_order      = in_array( $attributes['mobileOrder'] ?? '', $kh_ih_mobile_order_list, true ) ? $attributes['mobileOrder'] : 'content-first';

/*
 * `sizes`, per slot: roughly the width of image each slot shows at each
 * breakpoint. Desktop values follow the presentation (and Split Duo's ratio);
 * on mobile every slot below is full width.
 *
 * A composition's primary is often taller than it is wide, and a landscape
 * photo cropped to fill it is drawn wider than the slot. So these are the
 * width of the photo as drawn (a 3:2 source covering the slot), measured on a
 * Large composition, and scaled with the composition.
 */
$kh_ih_composed_sizes = array(
	'offset-duo'        => 66,
	
);
$kh_ih_scale_factor = array(
	'balanced'  => 0.85,
	'large'     => 1,
	
);

$kh_ih_desktop_sizes = array(
	'single'    => array( '100vw' ),
	'split-duo' => array_map(
		static function ( $share ) {
			return $share . 'vw';
		},
		explode( '-', null !== $kh_ih_composition ? $kh_ih_composition['ratio'] : '50-50' )
	),
);

foreach ( $kh_ih_composed_sizes as $kh_ih_sizes_layout => $kh_ih_sizes_width ) {
	$kh_ih_desktop_sizes[ $kh_ih_sizes_layout ] = array( min( 100, (int) round( $kh_ih_sizes_width * $kh_ih_scale_factor[ $kh_ih_stage_values['scale'] ?? 'large' ] ) ) . 'vw' );
}

/*
 * The other cards of a composition are portrait or near-square, so a
 * landscape photo cropped to fill one is drawn at the card's height times its
 * aspect: far wider than the card. Each asks for that drawn width. On desktop
 * it follows the stage's height, which follows the window's (vh, scaled with
 * Hero Height); in a window no wider than 5:4 the stage keeps a 4:5 shape and
 * follows the width instead (COMPOSED STAGE in style.scss); on mobile the stage
 * is a full-width 4:3 box. Contain draws the photo no wider than its card, so
 * it asks for the card's own width; a browser that honours core's `auto`
 * measures that exactly (kinetichub_ih_keep_sizes() leaves it there).
 *
 * Per card: desktop (vh), a window up to 5:4 (vw), mobile (vw), then Contain
 * on desktop and on mobile (vw). Measured with a 3:2 photo on a Large
 * composition beside side-aligned text, from 1024x768 to 1920x1080, in its
 * widest Balance. Balanced cards shrink too little to ask for less; Oversized
 * ones grow with its factor above. The width-led values grow a quarter when
 * Content Overlap widens the stage, and Contain half again when the text is
 * centred, since the stage then spans the hero.
 */
$kh_ih_card_sizes = array(
	'offset-duo'        => array(
		1 => array( 61, 51, 68, 26, 46 ),
	),
	
);


$kh_ih_card_grow  = max( 1, $kh_ih_scale_factor[ $kh_ih_stage_values['scale'] ?? 'large' ] ?? 1 );
$kh_ih_card_reach = 'none' === ( $kh_ih_stage_values['crossover'] ?? 'none' ) ? 1 : 1.25;

/*
 * Content.
 */
$kh_ih_inline_html      = array(
	'strong' => array(),
	'em'     => array(),
	'b'      => array(),
	'i'      => array(),
	'br'     => array(),
);
$kh_ih_description_html = $kh_ih_inline_html + array(
	'a' => array(
		'href'   => true,
		'target' => true,
		'rel'    => true,
	),
);

$kh_ih_badge       = kinetichub_ih_rich_text( $attributes['badge'] ?? '', $kh_ih_inline_html );
$kh_ih_eyebrow     = kinetichub_ih_rich_text( $attributes['eyebrow'] ?? '', $kh_ih_inline_html );
$kh_ih_heading     = kinetichub_ih_rich_text( $attributes['heading'] ?? '', $kh_ih_inline_html );
$kh_ih_description = kinetichub_ih_rich_text( $attributes['description'] ?? '', $kh_ih_description_html );

$kh_ih_heading_level = max( 1, min( 6, (int) ( $attributes['headingLevel'] ?? 1 ) ) );
$kh_ih_heading_tag   = 'h' . $kh_ih_heading_level;

/*
 * A button renders only with both text and a URL: an <a> without href is not a link.
 *
 * Its classes: the slot (primary / secondary), then the style, written only
 * once one was chosen -- a button whose style was never chosen keeps the look
 * it always had -- then the icon. Mirrors getCtaClassName() in hero-model.js.
 */
$kh_ih_ctas           = array();
$kh_ih_cta_variants   = array(
	1 => 'primary',
	2 => 'secondary',
);
$kh_ih_cta_style_list = array( 'solid', 'outline', 'ghost', 'glass' );
$kh_ih_cta_icon_list  = array( 'arrow', 'external-arrow' );

foreach ( $kh_ih_cta_variants as $kh_ih_cta_index => $kh_ih_cta_variant ) {
	$kh_ih_cta_text    = kinetichub_ih_rich_text( $attributes[ 'cta' . $kh_ih_cta_index . 'Text' ] ?? '', array() );
	$kh_ih_cta_raw_url = $attributes[ 'cta' . $kh_ih_cta_index . 'Url' ] ?? '';
	$kh_ih_cta_url     = is_string( $kh_ih_cta_raw_url ) ? esc_url_raw( trim( $kh_ih_cta_raw_url ) ) : '';

	if ( '' === $kh_ih_cta_text || '' === $kh_ih_cta_url ) {
		continue;
	}

	$kh_ih_cta_new_tab = ! empty( $attributes[ 'cta' . $kh_ih_cta_index . 'NewTab' ] );
	$kh_ih_cta_style   = $attributes[ 'cta' . $kh_ih_cta_index . 'Variant' ] ?? '';
	$kh_ih_cta_icon    = $attributes[ 'cta' . $kh_ih_cta_index . 'Icon' ] ?? '';

	$kh_ih_ctas[] = array(
		'classes' => array_filter(
			array(
				'kh-ih-cta',
				'kh-ih-cta-' . $kh_ih_cta_variant,
				in_array( $kh_ih_cta_style, $kh_ih_cta_style_list, true ) ? 'kh-ih-cta-' . $kh_ih_cta_style : '',
				in_array( $kh_ih_cta_icon, $kh_ih_cta_icon_list, true ) ? 'kh-ih-cta-icon-' . $kh_ih_cta_icon : '',
			)
		),
		'text'    => $kh_ih_cta_text,
		'url'     => $kh_ih_cta_url,
		'new_tab' => $kh_ih_cta_new_tab,
		'rel'     => kinetichub_ih_build_rel( $attributes[ 'cta' . $kh_ih_cta_index . 'Rel' ] ?? '', $kh_ih_cta_new_tab ),
	);
}

$kh_ih_has_content = '' !== $kh_ih_badge || '' !== $kh_ih_eyebrow || '' !== $kh_ih_heading || '' !== $kh_ih_description || ! empty( $kh_ih_ctas );

if ( empty( $kh_ih_slot_images ) && ! $kh_ih_has_content ) {
	return;
}

/*
 * Layout, overlay, visibility.
 */
$kh_ih_align_list = array( 'wide', 'full' );
$kh_ih_align      = in_array( $attributes['align'] ?? '', $kh_ih_align_list, true ) ? $attributes['align'] : '';

$kh_ih_x_list    = array( 'left', 'center', 'right' );
$kh_ih_content_x = in_array( $attributes['contentAlign'] ?? '', $kh_ih_x_list, true ) ? $attributes['contentAlign'] : 'center';

$kh_ih_y_list    = array( 'top', 'center', 'bottom' );
$kh_ih_content_y = in_array( $attributes['contentVerticalAlign'] ?? '', $kh_ih_y_list, true ) ? $attributes['contentVerticalAlign'] : 'center';

$kh_ih_height_desktop = max( 30, min( 100, (int) ( $attributes['heroHeightDesktop'] ?? 90 ) ) );
$kh_ih_height_mobile  = max( 30, min( 100, (int) ( $attributes['heroHeightMobile'] ?? 80 ) ) );

$kh_ih_overlay_color   = kinetichub_ih_validate_color_strict( $attributes['overlayColor'] ?? '', '#000000' );
$kh_ih_overlay_opacity = max( 0.0, min( 1.0, (float) ( $attributes['overlayOpacity'] ?? 0.35 ) ) );

// Same classes, same order, as resolveHero() in hero-model.js.
$kh_ih_classes = array_filter(
	array_merge(
		array(
			'kh-ih-hero',
			'kh-ih-layout-' . $kh_ih_layout,
			'kh-ih-stage-' . $kh_ih_stage,
			$kh_ih_slot_count > 0 ? 'kh-ih-slots-' . $kh_ih_slot_count : '',
			'kh-ih-content-x-' . $kh_ih_content_x,
			'kh-ih-content-y-' . $kh_ih_content_y,
			$kh_ih_slot_count > 0 ? 'kh-ih-has-media' : 'kh-ih-no-media',
			'split-duo' === $kh_ih_layout ? 'kh-ih-ratio-' . $kh_ih_composition['ratio'] : '',
			null !== $kh_ih_composition ? 'kh-ih-shadow-' . $kh_ih_composition['shadow'] : '',
		),
		array_map(
			static function ( $setting, $value ) {
				return 'kh-ih-' . $setting . '-' . $value;
			},
			array_keys( $kh_ih_stage_values ),
			$kh_ih_stage_values
		),
		array(
			'composed' !== $kh_ih_stage && 'none' !== $kh_ih_scene ? 'kh-ih-scene-' . $kh_ih_scene : '',
			'none' !== $kh_ih_scene ? 'kh-ih-atmos-' . $kh_ih_scene_intensity : '',
			$kh_ih_slot_count > 1 ? 'kh-ih-mobile-' . $kh_ih_mobile_composition : '',
			'composed' === $kh_ih_stage ? 'kh-ih-mobile-' . $kh_ih_mobile_order : '',
			'none' !== $kh_ih_motion_mode ? 'kh-ih-motion-' . $kh_ih_motion_mode : '',
			'none' !== $kh_ih_motion_mode ? 'kh-ih-intensity-' . $kh_ih_motion_level : '',
			'none' !== $kh_ih_reveal ? 'kh-ih-reveal-' . $kh_ih_reveal : '',
			$kh_ih_stagger ? 'kh-ih-stagger' : '',
		),
		array_map(
			static function ( $suffix ) {
				return 'kh-ih-addon-' . $suffix;
			},
			array_values( $kh_ih_active_addons )
		),
		array( $kh_ih_surface_clear ? 'kh-ih-surface-clear' : '' ),
		array_map(
			static function ( $setting, $value ) use ( $kh_ih_content_settings ) {
				return $value !== $kh_ih_content_settings[ $setting ][2] ? 'kh-ih-' . $setting . '-' . $value : '';
			},
			array_keys( $kh_ih_content_values ),
			$kh_ih_content_values
		),
		array(
			'' !== $kh_ih_align ? 'align' . $kh_ih_align : '',
			! empty( $attributes['hideOnMobile'] ) ? 'kh-ih-hide-mobile' : '',
			! empty( $attributes['hideOnDesktop'] ) ? 'kh-ih-hide-desktop' : '',
		)
	)
);

/*
 * Only unitless numbers go through the wrapper style: get_block_wrapper_attributes()
 * runs safecss_filter_attr(), which drops values such as rgba(). The overlay
 * colour is written on the overlay element itself for that reason, and the
 * composition settings are unitless here and given their units in the stylesheet.
 */
$kh_ih_style = sprintf( '--kh-ih-h-desk: %1$d; --kh-ih-h-mob: %2$d;', $kh_ih_height_desktop, $kh_ih_height_mobile );

foreach ( $kh_ih_composition_vars[ $kh_ih_layout ] ?? array() as $kh_ih_setting ) {
	$kh_ih_style .= sprintf( ' --kh-ih-%1$s: %2$s;', $kh_ih_setting, kinetichub_ih_format_number( $kh_ih_composition[ $kh_ih_setting ] ) );
}

if ( 'custom' === $kh_ih_content_values['width'] ) {
	$kh_ih_style .= sprintf( ' --kh-ih-content-w: %s;', kinetichub_ih_format_number( $kh_ih_content_width ) );
}

$kh_ih_wrapper_args = array(
	'class'                   => implode( ' ', $kh_ih_classes ),
	'style'                   => $kh_ih_style,
	'data-kh-ih-presentation' => $kh_ih_presentation,
);

// Core applies the anchor server-side only from WordPress 7.0; passing it here covers earlier versions too.
if ( isset( $attributes['anchor'] ) && is_string( $attributes['anchor'] ) && '' !== trim( $attributes['anchor'] ) ) {
	$kh_ih_wrapper_args['id'] = trim( $attributes['anchor'] );
}

$kh_ih_wrapper_attrs = get_block_wrapper_attributes( $kh_ih_wrapper_args );

$kh_ih_overlay_style = sprintf(
	'background-color: %1$s; opacity: %2$s;',
	$kh_ih_overlay_color,
	number_format( $kh_ih_overlay_opacity, 2, '.', '' )
);

/*
 * The view script is enqueued by the hero that needs it, not declared in
 * block.json: a static hero, or one whose motion is hover-only CSS, loads no
 * script at all. Registered once, however many heroes the page holds.
 */
if ( $kh_ih_needs_script ) {
	if ( ! wp_script_is( 'kinetichub-image-hero-view', 'registered' ) ) {
		$kh_ih_view_asset = file_exists( __DIR__ . '/view.asset.php' ) ? include __DIR__ . '/view.asset.php' : array();

		wp_register_script(
			'kinetichub-image-hero-view',
			plugins_url( 'view.js', __FILE__ ),
			$kh_ih_view_asset['dependencies'] ?? array(),
			$kh_ih_view_asset['version'] ?? false,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}

	wp_enqueue_script( 'kinetichub-image-hero-view' );
}

// Filtering post content would put `auto` back into these images' `sizes`.
if ( ! empty( $kh_ih_slot_images ) && ! has_filter( 'wp_content_img_tag', 'kinetichub_ih_keep_sizes' ) ) {
	add_filter( 'wp_content_img_tag', 'kinetichub_ih_keep_sizes' );
}
?>
<section <?php echo $kh_ih_wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by get_block_wrapper_attributes. ?>>
	<div class="kh-ih-media">
		<?php
		foreach ( $kh_ih_slot_images as $kh_ih_slot_index => $kh_ih_slot_image ) :
			$kh_ih_slot_card = $kh_ih_card_sizes[ $kh_ih_layout ][ $kh_ih_slot_index ] ?? null;

			if ( null === $kh_ih_slot_card ) {
				$kh_ih_slot_desktop_size = $kh_ih_desktop_sizes[ $kh_ih_layout ][ $kh_ih_slot_index ];
				$kh_ih_slot_mobile_size  = '100vw';
			} elseif ( 'contain' === $kh_ih_slot_image['fit'] ) {
				$kh_ih_slot_desktop_size = round( $kh_ih_slot_card[3] * $kh_ih_card_grow * $kh_ih_card_reach * ( 'center' === $kh_ih_content_x ? 1.5 : 1 ) ) . 'vw';
				$kh_ih_slot_mobile_size  = round( $kh_ih_slot_card[4] * $kh_ih_card_grow ) . 'vw';
			} else {
				$kh_ih_slot_desktop_size = sprintf( '(max-aspect-ratio: 5/4) %1$dvw, %2$dvh', round( $kh_ih_slot_card[1] * $kh_ih_card_grow * $kh_ih_card_reach ), round( $kh_ih_slot_card[0] * $kh_ih_card_grow * max( 60, $kh_ih_height_desktop ) / 90 ) );
				$kh_ih_slot_mobile_size  = round( $kh_ih_slot_card[2] * $kh_ih_card_grow ) . 'vw';
			}

			// Stack and Primary Only show every image full width on mobile.
			if ( 'auto' !== $kh_ih_mobile_composition ) {
				$kh_ih_slot_mobile_size = '100vw';
			}

			$kh_ih_slot_sizes = $kh_ih_slot_mobile_size === $kh_ih_slot_desktop_size ? $kh_ih_slot_desktop_size : sprintf( '(max-width: 768px) %1$s, %2$s', $kh_ih_slot_mobile_size, $kh_ih_slot_desktop_size );

			// Where mobile replacements are not offered, every width shows the desktop image and its focal point.
			$kh_ih_slot_source = '';
			

			$kh_ih_slot_classes = array_filter(
				array(
					'kh-ih-slot',
					'kh-ih-slot-' . ( $kh_ih_slot_index + 1 ),
					0 === $kh_ih_slot_index ? 'is-primary' : '',
					'' !== $kh_ih_slot_source ? 'has-mobile-source' : '',
					'contain' === $kh_ih_slot_image['fit'] ? 'is-fit-contain' : '',
					'contain' === $kh_ih_slot_image['fit'] && ! $kh_ih_slot_image['contain_bg'] ? 'is-contain-transparent' : '',
				)
			);
			?>
			<div class="<?php echo esc_attr( implode( ' ', $kh_ih_slot_classes ) ); ?>" data-kh-ih-slot="<?php echo esc_attr( $kh_ih_slot_index ); ?>">
				<div class="kh-ih-slot-inner">
					<picture class="kh-ih-picture">
						<?php
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Every attribute escaped in kinetichub_ih_render_mobile_source().
						echo $kh_ih_slot_source;
						// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Built by wp_get_attachment_image() or from escaped parts in kinetichub_ih_render_image().
						echo kinetichub_ih_render_image( $kh_ih_slot_image, 0 === $kh_ih_slot_index, $kh_ih_slot_sizes );
						?>
					</picture>
				</div>
			</div>
		<?php endforeach; ?>
	</div>

	<div class="kh-ih-overlay" aria-hidden="true" style="<?php echo esc_attr( $kh_ih_overlay_style ); ?>"></div>

	<div class="kh-ih-content-layer">
		<div class="kh-ih-content">
			<?php if ( '' !== $kh_ih_badge || '' !== $kh_ih_eyebrow ) : ?>
				<div class="kh-ih-kicker">
					<?php if ( '' !== $kh_ih_badge ) : ?>
						<span class="kh-ih-badge"><?php echo $kh_ih_badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized by wp_kses in kinetichub_ih_rich_text(). ?></span>
					<?php endif; ?>
					<?php if ( '' !== $kh_ih_eyebrow ) : ?>
						<p class="kh-ih-eyebrow"><?php echo $kh_ih_eyebrow; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized by wp_kses in kinetichub_ih_rich_text(). ?></p>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<?php if ( '' !== $kh_ih_heading ) : ?>
				<?php
				printf(
					'<%1$s class="kh-ih-heading">%2$s</%1$s>',
					tag_escape( $kh_ih_heading_tag ),
					$kh_ih_heading // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized by wp_kses in kinetichub_ih_rich_text().
				);
				?>
			<?php endif; ?>

			<?php if ( '' !== $kh_ih_description ) : ?>
				<p class="kh-ih-description"><?php echo $kh_ih_description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized by wp_kses in kinetichub_ih_rich_text(). ?></p>
			<?php endif; ?>

			<?php if ( ! empty( $kh_ih_ctas ) ) : ?>
				<div class="kh-ih-actions">
					<?php foreach ( $kh_ih_ctas as $kh_ih_cta ) : ?>
						<a
							class="<?php echo esc_attr( implode( ' ', $kh_ih_cta['classes'] ) ); ?>"
							href="<?php echo esc_url( $kh_ih_cta['url'] ); ?>"
							<?php if ( $kh_ih_cta['new_tab'] ) : ?>
								target="_blank"
							<?php endif; ?>
							<?php if ( '' !== $kh_ih_cta['rel'] ) : ?>
								rel="<?php echo esc_attr( $kh_ih_cta['rel'] ); ?>"
							<?php endif; ?>
						><?php echo $kh_ih_cta['text']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_kses with no allowed tags in kinetichub_ih_rich_text(). ?></a>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</div>
	</div>
</section>
