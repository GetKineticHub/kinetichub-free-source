/**
 * Kinetic Image Hero - Presets
 *
 * A preset is a starting point, not a mode: applying one writes a coherent
 * bundle of the block's ordinary attributes, and every one of them stays
 * editable afterwards. Nothing records which preset was used, so the saved
 * block never depends on one and there is no second rendering path.
 *
 * Presets set presentation, composition, atmosphere, motion, and the design
 * of the content and the buttons -- scale, rhythm, surfaces, button styles,
 * the content entrance. They never touch the images, their mobile
 * replacements, alt text, the copy, the heading level, or a button's link,
 * new-tab or rel. Smart Addons a preset does not name are switched off, and
 * the frame (height, vertical placement, overlay) and every content design
 * setting are reset, so each bundle lands the same way whatever was set
 * before.
 *
 * Presets and bundle keys inside PRO-only build regions are removed at
 * compile time from a build that does not offer them, so a preset there
 * writes only settings that build offers and leaves any other saved value
 * as it was.
 *
 * Editor only; no WordPress imports.
 */

// The hero's frame at the block defaults, for every preset except Cinematic Edge, which sets its own.
const FRAME = {
    contentVerticalAlign: 'center',
    heroHeightDesktop: 90,
    heroHeightMobile: 80,
    overlayOpacity: 0.35,
};

/*
 * Every content and button design setting at its default: the base each
 * preset styles from. The button styles are written explicitly, so a preset
 * always gives the colour-aware styles rather than the original look.
 */
const CONTENT_BASE = {
    contentWidth: 'standard',
    contentSpacing: 'balanced',
    headingSize: 'xl',
    descriptionSize: 'normal',
    eyebrowStyle: 'plain',
    badgeStyle: 'minimal',
    contentSurface: 'none',
    contentReveal: 'none',
    contentDelay: 'none',
    cta1Variant: 'solid',
    cta1Icon: 'none',
    cta2Variant: 'outline',
    cta2Icon: 'none',
    ctaSize: 'medium',
    ctaLayout: 'row',
    ctaMobileLayout: 'auto',
    ctaMotion: 'none',
};

// Every Smart Addon attribute this build offers, all off: the base each preset switches on from.
const ADDONS_OFF = {
    cardFocus: false,
    smartReadability: false,
    
};

/*
 * Each preset: the number of images it is designed for, and its bundle. The
 * bundle reads the current attributes for one thing only, the author's side:
 * a preset with a side keeps content on the right if it was there, and
 * otherwise puts it on the left -- centred content would move a composition
 * below it, or run a Split Duo seam through the text.
 */
const sideOf = (attributes) => (attributes.contentAlign === 'right' ? 'right' : 'left');

export const PRESETS = {
    'clean-split': {
        images: 2,
        // The text sits wholly on the larger image, so no seam runs through it.
        bundle: (attributes) => ({
            ...FRAME,
            ...ADDONS_OFF,
            presentation: 'split-duo',
            contentAlign: sideOf(attributes),
            splitRatio: sideOf(attributes) === 'right' ? '40-60' : '60-40',
            compositionGap: 16,
            cardRadius: 12,
            cardShadow: 'soft',
            cardRotation: 0,
            compositionDepth: 0,
            sceneBackdrop: 'none',
            backdropIntensity: 'medium',
            motionMode: 'hover',
            motionIntensity: 'subtle',
            revealStyle: 'fade-rise',
            
            ...CONTENT_BASE,
            headingSize: 'large',
            cta1Icon: 'arrow',
            ctaMobileLayout: 'stack',
            ctaMotion: 'arrow-shift',
            contentReveal: 'fade-rise',
            contentDelay: 'short',
        }),
    },
    'floating-duo': {
        images: 2,
        bundle: (attributes) => ({
            ...FRAME,
            ...ADDONS_OFF,
            presentation: 'offset-duo',
            contentAlign: sideOf(attributes),
            compositionScale: 'large',
            mediaBalance: '40-60',
            contentOverlap: 'none',
            compositionGap: 16,
            cardRadius: 14,
            cardShadow: 'floating',
            cardRotation: 2.5,
            compositionOverlap: 45,
            compositionDepth: 55,
            sceneBackdrop: 'soft-glow',
            backdropIntensity: 'medium',
            motionMode: 'hover',
            motionIntensity: 'medium',
            revealStyle: 'fade-rise',
            
            cardFocus: true,
            ...CONTENT_BASE,
            eyebrowStyle: 'accent-line',
            cta1Icon: 'arrow',
            ctaMobileLayout: 'stack',
            ctaMotion: 'lift',
            contentReveal: 'fade-rise',
            contentDelay: 'short',
        }),
    },
    
};
