/**
 * Kinetic Image Hero - Editor Script
 *
 * The canvas renders the same DOM and class model as render.php, so the
 * preview is the frontend structure rather than an approximation of it.
 * Every class and custom property on it comes from hero-model.js, which
 * mirrors render.php's decisions, and every composition is drawn by the
 * shared stylesheet -- there is no editor-only composition logic. The block
 * owns its content (no InnerBlocks): every text field is an attribute edited
 * in place with RichText.
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import {
    useBlockProps,
    InspectorControls,
    BlockControls,
    RichText,
    MediaUpload,
    MediaUploadCheck,
    MediaPlaceholder,
} from '@wordpress/block-editor';
import {
    PanelBody,
    SelectControl,
    RangeControl,
    ToggleControl,
    TextControl,
    TextareaControl,
    ColorPalette,
    FocalPointPicker,
    Button,
    ToolbarDropdownMenu,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { __, sprintf, isRTL } from '@wordpress/i18n';

import {
    InspectorHelp,
    InspectorNote,
    InspectorNotice,
    labelWithHelp,
    
    ProNote,
    
} from '../../components/InspectorUX';
import { KineticVisibilityControls } from '../../components/VisibilityControls';
import {
    MOBILE_MEDIA,
    PRESENTATIONS,
    PRESENTATION_SLOTS,
    COMPOSITION_RANGES,
    HEIGHT_MIN,
    HEIGHT_MAX,
    STAGE_SETTINGS,
    SCENE_BACKDROPS,
    BACKDROP_STAGE_SCENES,
    SCENE_INTENSITIES,
    MOTION_MODES,
    MOTION_INTENSITIES,
    REVEAL_STYLES,
    SMART_ADDONS,
    CONTENT_WIDTH_RANGE,
    clampHeight,
    clampStep,
    getImageFit,
    getContainBackground,
    normalizeMedia,
    toStoredMobileImages,
    resolveStage,
    resolveHero,
    resolveCta,
    getSlotClassName,
    getCtaClassName,
} from './hero-model';
import { PRESETS } from './presets';
import metadata from './block.json';

/*
 * A setting the model lists per build offers only the values on its model
 * list, so its control offers exactly what this build renders. The control
 * shows the value that renders: a saved value this build does not offer
 * shows as its fallback, and stays stored until another value is chosen.
 */
const offered = (options, values) => options.filter((option) => values.includes(option.value));

/*
 * The most images an author can add: as many as the largest presentation
 * this build offers can show. Storage still keeps MAX_IMAGES, so a hero saved
 * with more keeps every image; those no presentation here shows stay stored
 * but unrendered.
 */
const MAX_ADDED_IMAGES = Math.max(...PRESENTATIONS.map((presentation) => PRESENTATION_SLOTS[presentation][1]));

/*
 * Help that names choices. The first text names only what every build
 * offers; a build that offers more replaces it with the full description.
 */
const CHOICE_HELP = {
    presentation: __('Single fills the hero with the first image. Split Duo sets two images side by side behind the content. Offset Duo arranges two images as a composition beside the content, or below it when the content is centred.', 'kinetichub'),
    scale: __('How much of the hero the images claim. Balanced stays inside the content width. Large reaches toward the hero\'s outer edge.', 'kinetichub'),
    scene: __('Atmosphere around the images, in the KineticHub accent colour set in the dashboard. Soft Glow is a gentle halo; Gradient Wash a broad diagonal of light.', 'kinetichub'),
    motionMode: __('How the images respond. Hover: they separate into layers while the pointer is over them, on a mouse or trackpad. The text and buttons never move, and visitors whose device asks for reduced motion see the hero still.', 'kinetichub'),
    motionIntensity: __('How far the images move. Subtle suits a business page.', 'kinetichub'),
    motionPreview: __('The editor shows the hero at rest, and hover can be tried here. The reveal plays on the published page.', 'kinetichub'),
    cardFocus: __('The image under the pointer comes forward a little while the others step back, so one photograph at a time takes the lead. Nothing changes order.', 'kinetichub'),
};


const PRESENTATION_LABELS = {
    single: __('Single', 'kinetichub'),
    'split-duo': __('Split Duo', 'kinetichub'),
    'offset-duo': __('Offset Duo', 'kinetichub'),
    'stacked-cards': __('Stacked Cards', 'kinetichub'),
    'editorial-collage': __('Editorial Collage', 'kinetichub'),
};

// What Auto does on mobile, per presentation; shown in the Responsive help.
const MOBILE_AUTO_DESCRIPTIONS = {
    'split-duo': __('the two images stack top and bottom', 'kinetichub'),
    'offset-duo': __('the pair keeps a smaller, fixed overlap', 'kinetichub'),
    'stacked-cards': __('the stack stays, with shorter steps and half the rotation', 'kinetichub'),
    'editorial-collage': __('the primary image runs full width with the others beneath it', 'kinetichub'),
};

// The composed stage's semantic settings, in Inspector order: [attribute key
// in hero.stageSettings and STAGE_SETTINGS, attribute, label, help, options].
const STAGE_CONTROLS = [
    ['scale', 'compositionScale', __('Scale', 'kinetichub'), CHOICE_HELP.scale, [
        { label: __('Balanced', 'kinetichub'), value: 'balanced' },
        { label: __('Large', 'kinetichub'), value: 'large' },
        { label: __('Oversized', 'kinetichub'), value: 'oversized' },
    ]],
    ['balance', 'mediaBalance', __('Content / Media', 'kinetichub'), __('How the width is shared between the content and the images, on desktop.', 'kinetichub'), [
        { label: __('50 / 50', 'kinetichub'), value: '50-50' },
        { label: __('40 / 60', 'kinetichub'), value: '40-60' },
        { label: __('35 / 65', 'kinetichub'), value: '35-65' },
    ]],
    ['crossover', 'contentOverlap', __('Content Overlap', 'kinetichub'), __('Lets the images run behind the content. The text then stands on a plate of the section\'s background colour, so it stays readable and the buttons stay clickable. Desktop only.', 'kinetichub'), [
        { label: __('None', 'kinetichub'), value: 'none' },
        { label: __('Subtle', 'kinetichub'), value: 'subtle' },
        { label: __('Strong', 'kinetichub'), value: 'strong' },
    ]],
];

const PRESET_LABELS = {
    'clean-split': __('Clean Split', 'kinetichub'),
    'floating-duo': __('Floating Duo', 'kinetichub'),
    'layered-studio': __('Layered Studio', 'kinetichub'),
    'editorial-showcase': __('Editorial Showcase', 'kinetichub'),
    'cinematic-edge': __('Cinematic Edge', 'kinetichub'),
};

const PRESET_DESCRIPTIONS = {
    'clean-split': __('Two images side by side as clean cards, the text on the larger one, with a soft shadow, a gentle reveal and a subtle hover. A restrained Large heading, a solid button with an arrow and an outline one. The safe choice for a business page.', 'kinetichub'),
    'floating-duo': __('A large image with a second card floating over its edge and a soft glow behind them; the image under the pointer comes forward. An accent-line eyebrow, and buttons that lift on hover.', 'kinetichub'),
    'layered-studio': __('A stack of three cards with floating shadows. It scales in, and opens into a fan on hover. A pill eyebrow, a solid button and a ghost link with an arrow.', 'kinetichub'),
    'editorial-showcase': __('An oversized collage of three overlapping images, two soft lights behind them, a staggered clip reveal and layered depth on scroll and hover. A Display heading with an accent-line eyebrow, an airy rhythm, and text that wipes in with the images.', 'kinetichub'),
    'cinematic-edge': __('One full-screen photograph with a wide Display heading set low on the left, a vignette, a readability veil, a blur-to-sharp reveal and a slow drift on scroll. The text arrives once the image has settled; a solid and a glass button.', 'kinetichub'),
};

const SCENE_OPTIONS = [
    { label: __('None', 'kinetichub'), value: 'none' },
    { label: __('Soft Glow', 'kinetichub'), value: 'soft-glow' },
    { label: __('Gradient Wash', 'kinetichub'), value: 'gradient-wash' },
    { label: __('Dual Glow', 'kinetichub'), value: 'dual-glow' },
    { label: __('Accent Panel', 'kinetichub'), value: 'accent-panel' },
    { label: __('Vignette', 'kinetichub'), value: 'vignette' },
];

const INTENSITY_OPTIONS = [
    { label: __('Subtle', 'kinetichub'), value: 'subtle' },
    { label: __('Medium', 'kinetichub'), value: 'medium' },
    { label: __('Strong', 'kinetichub'), value: 'strong' },
];

const MOTION_MODE_OPTIONS = [
    { label: __('None', 'kinetichub'), value: 'none' },
    { label: __('Hover', 'kinetichub'), value: 'hover' },
    { label: __('Scroll', 'kinetichub'), value: 'scroll' },
    { label: __('Scroll + Hover', 'kinetichub'), value: 'scroll-hover' },
];

const REVEAL_OPTIONS = [
    { label: __('None', 'kinetichub'), value: 'none' },
    { label: __('Fade & Rise', 'kinetichub'), value: 'fade-rise' },
    { label: __('Scale', 'kinetichub'), value: 'scale' },
    { label: __('Clip', 'kinetichub'), value: 'clip' },
    { label: __('Blur → Sharp', 'kinetichub'), value: 'blur-sharp' },
];

/*
 * Content and button design options, in Inspector order. The values and
 * defaults live in CONTENT_SETTINGS (hero-model.js); these are the labels.
 */
const CONTENT_OPTIONS = {
    contentWidth: [
        { label: __('Narrow', 'kinetichub'), value: 'narrow' },
        { label: __('Standard', 'kinetichub'), value: 'standard' },
        { label: __('Wide', 'kinetichub'), value: 'wide' },
        { label: __('Custom', 'kinetichub'), value: 'custom' },
    ],
    contentSpacing: [
        { label: __('Compact', 'kinetichub'), value: 'compact' },
        { label: __('Balanced', 'kinetichub'), value: 'balanced' },
        { label: __('Airy', 'kinetichub'), value: 'airy' },
    ],
    headingSize: [
        { label: __('Large', 'kinetichub'), value: 'large' },
        { label: __('XL', 'kinetichub'), value: 'xl' },
        { label: __('Display', 'kinetichub'), value: 'display' },
    ],
    descriptionSize: [
        { label: __('Normal', 'kinetichub'), value: 'normal' },
        { label: __('Large', 'kinetichub'), value: 'large' },
    ],
    eyebrowStyle: [
        { label: __('Plain', 'kinetichub'), value: 'plain' },
        { label: __('Accent Line', 'kinetichub'), value: 'accent-line' },
        { label: __('Pill', 'kinetichub'), value: 'pill' },
    ],
    badgeStyle: [
        { label: __('Minimal', 'kinetichub'), value: 'minimal' },
        { label: __('Soft', 'kinetichub'), value: 'soft' },
        { label: __('Glass', 'kinetichub'), value: 'glass' },
    ],
    contentSurface: [
        { label: __('None', 'kinetichub'), value: 'none' },
        { label: __('Soft Panel', 'kinetichub'), value: 'soft-panel' },
        { label: __('Glass', 'kinetichub'), value: 'glass' },
    ],
    contentReveal: [
        { label: __('None', 'kinetichub'), value: 'none' },
        { label: __('Fade & Rise', 'kinetichub'), value: 'fade-rise' },
        { label: __('Clip', 'kinetichub'), value: 'clip' },
        { label: __('Blur → Sharp', 'kinetichub'), value: 'blur-sharp' },
    ],
    contentDelay: [
        { label: __('With the images', 'kinetichub'), value: 'none' },
        { label: __('Just after', 'kinetichub'), value: 'short' },
        { label: __('After the images', 'kinetichub'), value: 'after-media' },
    ],
    ctaSize: [
        { label: __('Medium', 'kinetichub'), value: 'medium' },
        { label: __('Large', 'kinetichub'), value: 'large' },
    ],
    ctaLayout: [
        { label: __('Side by side', 'kinetichub'), value: 'row' },
        { label: __('Stacked', 'kinetichub'), value: 'stack' },
    ],
    ctaMobileLayout: [
        { label: __('As on desktop', 'kinetichub'), value: 'auto' },
        { label: __('Stacked', 'kinetichub'), value: 'stack' },
        { label: __('Stacked, full width', 'kinetichub'), value: 'full-width' },
    ],
    ctaMotion: [
        { label: __('None', 'kinetichub'), value: 'none' },
        { label: __('Lift', 'kinetichub'), value: 'lift' },
        { label: __('Arrow Shift', 'kinetichub'), value: 'arrow-shift' },
        { label: __('Glow', 'kinetichub'), value: 'glow' },
    ],
};

const CTA_STYLE_OPTIONS = [
    { label: __('Solid', 'kinetichub'), value: 'solid' },
    { label: __('Outline', 'kinetichub'), value: 'outline' },
    { label: __('Ghost', 'kinetichub'), value: 'ghost' },
    { label: __('Glass', 'kinetichub'), value: 'glass' },
];

const CTA_ICON_OPTIONS = [
    { label: __('None', 'kinetichub'), value: 'none' },
    { label: __('Arrow', 'kinetichub'), value: 'arrow' },
    { label: __('External Arrow', 'kinetichub'), value: 'external-arrow' },
];

/*
 * The toolbar's content positions. A stored side is the start or end of the
 * reading direction (the stylesheet mirrors it right to left), so labels and
 * icons follow the side it actually appears on.
 */
const layoutIcon = (children) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        {children}
    </svg>
);

const lines = (d) => <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />;
const frame = <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />;

const POSITION_ICONS = {
    composed: {
        left: layoutIcon(<>{lines('M3 8.5h7M3 12h7M3 15.5h4.5')}<rect x="13" y="5" width="8" height="14" rx="1.5" fill="currentColor" /></>),
        center: layoutIcon(<>{lines('M7 4.5h10M9 7.5h6')}<rect x="4" y="10.5" width="16" height="9" rx="1.5" fill="currentColor" /></>),
        right: layoutIcon(<>{lines('M14 8.5h7M14 12h7M16.5 15.5h4.5')}<rect x="3" y="5" width="8" height="14" rx="1.5" fill="currentColor" /></>),
    },
    backdrop: {
        left: layoutIcon(<>{frame}{lines('M6 10h7M6 13.5h4.5')}</>),
        center: layoutIcon(<>{frame}{lines('M8.5 10h7M9.75 13.5h4.5')}</>),
        right: layoutIcon(<>{frame}{lines('M11 10h7M13.5 13.5h4.5')}</>),
    },
};

const POSITION_LABELS = {
    composed: {
        left: __('Content left, images right', 'kinetichub'),
        center: __('Content centred, images below', 'kinetichub'),
        right: __('Content right, images left', 'kinetichub'),
    },
    backdrop: {
        left: __('Content left', 'kinetichub'),
        center: __('Content centred', 'kinetichub'),
        right: __('Content right', 'kinetichub'),
    },
};

const HORIZONTAL_LABELS = {
    left: __('Left', 'kinetichub'),
    center: __('Center', 'kinetichub'),
    right: __('Right', 'kinetichub'),
};

// The side a stored placement appears on.
const visualSide = (value) => {
    if (value === 'center' || !isRTL()) {
        return value;
    }

    return value === 'left' ? 'right' : 'left';
};

// Smart Addon labels and help, by attribute; order and rules come from SMART_ADDONS.
const ADDON_CONTROLS = {
    cardFocus: [__('Card Focus', 'kinetichub'), CHOICE_HELP.cardFocus],
    smartReadability: [__('Smart Readability', 'kinetichub'), __('Quiets the image behind the text wherever the two meet, with no hard edge: a soft fall of shade, dark behind light text and light behind dark text. With Content Overlap the images fade into the section background behind the text instead of stopping at the solid plate; on a see-through section the soft shade is used instead. A fixed rule, not image analysis.', 'kinetichub')],
    depthOnScroll: [__('Depth on Scroll', 'kinetichub'), __('Deepens the scroll motion: each image moves at its own rate, the nearer ones grow very slightly as the hero passes, and each photograph shifts inside its frame like a window.', 'kinetichub')],
    pointerDepth: [__('Pointer Depth', 'kinetichub'), __('The images shift a few pixels against the pointer, each by a different amount, so the composition reads as layers. Mouse and trackpad only.', 'kinetichub')],
    stackFan: [__('Stack Fan', 'kinetichub'), __('Hovering the stack opens it into a slight fan, even at Rotation 0; it closes again when the pointer leaves.', 'kinetichub')],
    reactiveSpotlight: [__('Reactive Spotlight', 'kinetichub'), __('A soft light follows the pointer: behind a composition it lights the space around the cards; over a full-width image it is a faint sheen. Mouse and trackpad only.', 'kinetichub')],
    scrollDrift: [__('Scroll Drift', 'kinetichub'), __('As the page scrolls, the images behind the primary also drift sideways and turn a fraction of a degree. The text and buttons never move.', 'kinetichub')],
    focusReveal: [__('Focus Reveal', 'kinetichub'), __('Each photograph rests a few percent inside its frame and opens to the full frame when the pointer is over it, around its focal point.', 'kinetichub')],
};

// Uploads report a temporary blob first and the saved attachment after;
// only the saved attachment may be stored.
const isSavedMedia = (media) => !!media && Number.isInteger(media.id) && media.id > 0 && !!media.url;

// Image Fit, with what each choice does to the frame. Contain notes that the
// focal point is only hidden: it steers a crop, and comes back with Cover.
const IMAGE_FIT_OPTIONS = [
    { label: __('Cover', 'kinetichub'), value: 'cover' },
    { label: __('Contain', 'kinetichub'), value: 'contain' },
];

const IMAGE_FIT_HELP = {
    cover: __('Fills the frame and may crop the image. The focal point below chooses what stays in view.', 'kinetichub'),
    contain: __('Shows the full image inside the frame and may leave empty space around it. The focal point only steers a crop, so it is kept for Cover.', 'kinetichub'),
};

// A replaced image starts fresh: an alt override written for the old image
// would be wrong for the new one.
const mediaToImage = (media) => ({
    id: media.id,
    url: media.url,
    focalPoint: { x: 0.5, y: 0.5 },
    altOverride: '',
    decorative: false,
});

// A mobile replacement is only an alternate file for its slot.
const mediaToMobileImage = (media) => ({ id: media.id, url: media.url });

// Same rounding as kinetichub_ih_format_percent().
const toPercent = (value) => String(Math.round(value * 10000) / 100);

const getFocalStyle = (focalPoint) => ({
    '--kh-ih-focal': `${toPercent(focalPoint.x)}% ${toPercent(focalPoint.y)}%`,
});

const getPreviewUrl = (image, media) => (media && media.source_url) || image.url;

const getThumbnailUrl = (image, media) => {
    const thumbnail = media && media.media_details && media.media_details.sizes && media.media_details.sizes.thumbnail;

    return (thumbnail && thumbnail.source_url) || getPreviewUrl(image, media);
};

const getLibraryAlt = (media) => (media && typeof media.alt_text === 'string' ? media.alt_text.trim() : '');

// Same precedence as render.php: decorative, then override, then Media Library.
const resolveAlt = (image, media) => {
    if (image.decorative) {
        return '';
    }

    return image.altOverride.trim() || getLibraryAlt(media);
};

const hasText = (value) => typeof value === 'string' && !RichText.isEmpty(value);

const thumbnailStyle = { width: '40px', height: '40px', flexShrink: 0, borderRadius: '2px', objectFit: 'cover' };

/**
 * One titled group of controls inside a panel, divided from the one before
 * it the way the Images panel divides the active image's settings.
 *
 * @param {Object}  props
 * @param {string}  props.title    Group title.
 * @param {boolean} props.first    Whether it opens the panel (no divider).
 * @param {*}       props.children Controls.
 */
const InspectorGroup = ({ title, first = false, children }) => (
    <div style={first ? { marginBottom: '8px' } : { marginTop: '8px', marginBottom: '8px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>{title}</p>
        {children}
    </div>
);

const CtaControls = ({ index, attributes, setAttributes }) => {
    const text = attributes[`cta${index}Text`];
    const url = attributes[`cta${index}Url`] || '';
    const newTab = attributes[`cta${index}NewTab`];
    const rel = attributes[`cta${index}Rel`] || '';
    const cta = resolveCta(attributes, index);

    return (
        <InspectorGroup title={index === 1 ? __('Primary button', 'kinetichub') : __('Secondary button', 'kinetichub')} first={index === 1}>

            {hasText(text) && !url.trim() && (
                <InspectorNotice>
                    {__('This button has text but no link, so it is not shown on the site.', 'kinetichub')}
                </InspectorNotice>
            )}

            <TextControl
                label={__('Link URL', 'kinetichub')}
                type="url"
                value={url}
                onChange={(value) => setAttributes({ [`cta${index}Url`]: value })}
            />
            <ToggleControl
                label={__('Open in new tab', 'kinetichub')}
                checked={!!newTab}
                onChange={(value) => setAttributes({ [`cta${index}NewTab`]: !!value })}
            />
            <TextControl
                label={labelWithHelp(__('Link rel', 'kinetichub'), __('Optional, space-separated values such as nofollow or sponsored. noopener is added automatically when the link opens in a new tab.', 'kinetichub'))}
                value={rel}
                onChange={(value) => setAttributes({ [`cta${index}Rel`]: value })}
            />
            <SelectControl
                label={labelWithHelp(__('Style', 'kinetichub'), __('Solid is filled in the text colour with the label in the opposite tone. Outline is a hairline; Ghost is the label alone; Glass is a translucent, lightly blurred plate that suits a photograph or a mesh. Every style follows the hero\'s text colour, so it works on a dark or a light section.', 'kinetichub'))}
                value={cta.variant}
                options={CTA_STYLE_OPTIONS}
                onChange={(value) => setAttributes({ [`cta${index}Variant`]: value })}
            />
            <SelectControl
                label={labelWithHelp(__('Icon', 'kinetichub'), __('A small glyph after the label, hidden from screen readers. External Arrow is only a picture: whether the link opens a new tab is set above.', 'kinetichub'))}
                value={cta.icon}
                options={CTA_ICON_OPTIONS}
                onChange={(value) => setAttributes({ [`cta${index}Icon`]: value })}
            />
        </InspectorGroup>
    );
};

/**
 * A composition slider. Reset clears the stored value, which hands the
 * setting back to the presentation's own tuning; the slider always shows the
 * value actually in use.
 *
 * @param {Object}   props
 * @param {string}   props.setting       Key of COMPOSITION_RANGES.
 * @param {*}        props.label         Control label.
 * @param {number}   props.value         Effective value.
 * @param {number}   props.step          Slider step.
 * @param {Function} props.setAttributes Block setAttributes.
 */
const CompositionRange = ({ setting, label, value, step, setAttributes }) => {
    const range = COMPOSITION_RANGES[setting];

    return (
        <RangeControl
            label={label}
            value={value}
            min={range.min}
            max={range.max}
            step={step}
            allowReset
            onChange={(next) => setAttributes({
                [range.attribute]: next === undefined ? undefined : clampStep(next, range, value),
            })}
        />
    );
};

const Edit = ({ attributes, setAttributes, isSelected }) => {
    const {
        eyebrow, heading, headingLevel, description, badge,
        cta1Text, cta1Url, cta2Text, cta2Url,
        overlayColor, overlayOpacity, align,
    } = attributes;

    const { images, mobileImages } = normalizeMedia(attributes.images, attributes.mobileImages);
    const [activeIndex, setActiveIndex] = useState(0);

    // The preset picker is editor state only: nothing records which preset was applied.
    const [presetChoice, setPresetChoice] = useState('');
    const [appliedPreset, setAppliedPreset] = useState('');
    const activeImageIndex = Math.min(activeIndex, Math.max(0, images.length - 1));
    const activeImage = images[activeImageIndex];
    const activeFit = getImageFit(activeImage);
    const activeMobileImage = mobileImages[activeImageIndex];

    // Resolved from the attachment at edit time, exactly as the server does
    // at render time; the stored URL is only the fallback. Desktop records
    // first, then the mobile replacements, position for position.
    const idsKey = [...images.map((image) => image.id), ...mobileImages.map((item) => (item ? item.id : 0))].join(',');
    const records = useSelect(
        (select) => idsKey.split(',').map((id) => (Number(id) > 0 ? select(coreStore).getEntityRecord('root', 'media', Number(id)) : undefined)),
        [idsKey]
    );
    const mediaRecords = records.slice(0, images.length);
    const mobileRecords = records.slice(images.length);

    /*
     * Presentation, composition and responsive state, resolved the way
     * render.php resolves them.
     */
    const hero = resolveHero(attributes, images.length);
    const { layout, stage, slotCount, composition } = hero;
    const slotImages = images.slice(0, slotCount);
    const level = Math.min(6, Math.max(1, Math.trunc(Number(headingLevel)) || 1));
    const opacity = Math.min(1, Math.max(0, Number(overlayOpacity) || 0));
    const alignClass = ['wide', 'full'].includes(align) ? `align${align}` : '';

    /*
     * Image list mutations. Every write goes through normalizeMedia, so the
     * stored list can never exceed MAX_IMAGES from the editor, and the mobile
     * list moves with it position for position. Adding stops at
     * MAX_ADDED_IMAGES; editing, reordering or removing the images already
     * stored never drops one.
     */
    const setMedia = (nextImages, nextMobileImages) => {
        const media = normalizeMedia(nextImages, nextMobileImages);

        setAttributes({ images: media.images, mobileImages: toStoredMobileImages(media.mobileImages) });
    };

    const onSelectInitial = (selection) => {
        const selected = (Array.isArray(selection) ? selection : [selection])
            .filter(isSavedMedia)
            .slice(0, MAX_ADDED_IMAGES)
            .map(mediaToImage);

        if (selected.length) {
            setMedia(selected, []);
            setActiveIndex(0);
        }
    };

    const onAddImage = (media) => {
        if (!isSavedMedia(media) || images.length >= MAX_ADDED_IMAGES) {
            return;
        }

        setMedia([...images, mediaToImage(media)], [...mobileImages, null]);
        setActiveIndex(images.length);
    };

    // A new image drops its mobile replacement, which was a crop of the old one.
    const onReplaceImage = (index, media) => {
        if (!isSavedMedia(media)) {
            return;
        }

        setMedia(
            images.map((image, i) => (i === index ? mediaToImage(media) : image)),
            mobileImages.map((item, i) => (i === index ? null : item))
        );
    };

    const onRemoveImage = (index) => {
        setMedia(images.filter((_, i) => i !== index), mobileImages.filter((_, i) => i !== index));

        if (index <= activeImageIndex && activeImageIndex > 0) {
            setActiveIndex(activeImageIndex - 1);
        }
    };

    const onMoveImage = (index, direction) => {
        const target = index + direction;

        if (target < 0 || target >= images.length) {
            return;
        }

        const nextImages = [...images];
        const nextMobileImages = [...mobileImages];
        [nextImages[index], nextImages[target]] = [nextImages[target], nextImages[index]];
        [nextMobileImages[index], nextMobileImages[target]] = [nextMobileImages[target], nextMobileImages[index]];
        setMedia(nextImages, nextMobileImages);

        if (index === activeImageIndex) {
            setActiveIndex(target);
        } else if (target === activeImageIndex) {
            setActiveIndex(index);
        }
    };

    const updateImage = (index, patch) => {
        setMedia(images.map((image, i) => (i === index ? { ...image, ...patch } : image)), mobileImages);
    };

    const setMobileImage = (index, media) => {
        if (media !== null && !isSavedMedia(media)) {
            return;
        }

        setMedia(images, images.map((_, i) => {
            if (i === index) {
                return media ? mediaToMobileImage(media) : null;
            }

            return mobileImages[i];
        }));
    };

    const hasImages = images.length > 0;

    const blockProps = useBlockProps(
        hasImages
            ? {
                className: [...hero.classNames, alignClass].filter(Boolean).join(' '),
                style: hero.style,
                'data-kh-ih-presentation': hero.presentation,
            }
            : { className: ['kh-ih-editor-placeholder', alignClass].filter(Boolean).join(' ') }
    );

    const activeMedia = mediaRecords[activeImageIndex];
    const activeMobileMedia = mobileRecords[activeImageIndex];
    const activeLibraryAlt = getLibraryAlt(activeMedia);
    const activeSettingsTitle = sprintf(
        /* translators: %d: image position in the list. */
        __('Image %d settings', 'kinetichub'),
        activeImageIndex + 1
    );
    const activeAltHelp = activeLibraryAlt
        ? sprintf(
            /* translators: %s: the image's alternative text from the Media Library. */
            __('Empty uses the Media Library text: “%s”', 'kinetichub'),
            activeLibraryAlt
        )
        : __('Empty uses the Media Library text, which this image does not have yet.', 'kinetichub');

    const savedLabel = PRESENTATION_LABELS[hero.presentation];
    const minimumImages = PRESENTATION_SLOTS[hero.presentation][0];
    const unusedImages = images.length - slotCount;

    // A hero saved with more images than can be added here is already past the limit.
    let addImageLabel = __('+ Add Image', 'kinetichub');

    if (images.length > MAX_ADDED_IMAGES) {
        addImageLabel = __('No more images can be added', 'kinetichub');
    } else if (images.length === MAX_ADDED_IMAGES) {
        addImageLabel = sprintf(
            /* translators: %d: maximum number of images. */
            __('Maximum of %d images reached', 'kinetichub'),
            MAX_ADDED_IMAGES
        );
    }

    // Gap is visible wherever it does something: between Split Duo and
    // Editorial Collage images, and in Offset Duo / Stacked Cards only once
    // their images stack on mobile.
    const usesGap = layout === 'split-duo'
        || layout === 'editorial-collage'
        || (hero.mobileComposition === 'stack' && slotCount > 1);
    const gapHelp = {
        'split-duo': __('The space between the two images and around them. At 0 they meet edge to edge as one backdrop; above 0 they become separate cards. Capped at 16px on mobile.', 'kinetichub'),
        'editorial-collage': __('The space between the second image and the small accent, and between all three on mobile, where it is capped at 16px.', 'kinetichub'),
    }[layout] || __('The images overlap on desktop, so this is only the space between them when they stack on mobile, capped at 16px.', 'kinetichub');

    // Split Duo's stagger only exists once Gap has separated the images.
    const depthLabel = {
        'split-duo': composition && composition.gap > 0 ? __('Stagger (%)', 'kinetichub') : null,
        'offset-duo': __('Vertical Offset (%)', 'kinetichub'),
        'stacked-cards': __('Depth (%)', 'kinetichub'),
        'editorial-collage': __('Stagger (%)', 'kinetichub'),
    }[layout];
    const depthHelp = {
        'split-duo': __('Staggers the two cards vertically: the first rises, the second drops. Desktop only.', 'kinetichub'),
        'offset-duo': __('How far the floating card hangs below the primary image. Desktop only: mobile uses a fixed offset.', 'kinetichub'),
        'stacked-cards': __('How far the cards behind the front one step out from it: a compact cascade at 0, a wide fan at 100. Desktop only: mobile uses shorter steps.', 'kinetichub'),
        'editorial-collage': __('How far the second image drops below the primary. Desktop only.', 'kinetichub'),
    }[layout];

    const applyPreset = () => {
        const preset = PRESETS[presetChoice];

        if (!preset) {
            return;
        }

        setAttributes(preset.bundle(attributes));
        setAppliedPreset(presetChoice);
    };

    /*
     * Atmosphere and motion. The controls show the value that renders, the
     * way render.php resolves it; the saved attribute is only replaced when
     * another value is chosen. A scene this stage cannot draw is kept for
     * the composed presentations, and a note says so.
     */
    const { motion, content } = hero;

    // Content beside a composition, where its column is the Content / Media track.
    const sideBySide = stage === 'composed' && hero.contentX !== 'center';
    const sceneOptions = offered(SCENE_OPTIONS, stage === 'composed' ? SCENE_BACKDROPS : BACKDROP_STAGE_SCENES);
    const composedScene = resolveStage(attributes, 'composed').scene;
    const keptScene = SCENE_OPTIONS.find((option) => option.value === composedScene && option.value !== hero.scene);

    // Smart Addons this presentation can use: available now, or waiting for their Motion Mode.
    const addonsHere = slotCount > 0 ? SMART_ADDONS.filter(([, , , applies]) => applies(hero)) : [];
    const addonsReady = addonsHere.filter(([, , family]) => family === null || motion[family]);
    const addonNames = (family) => addonsHere.filter(([, , addonFamily]) => addonFamily === family && !motion[family])
        .map(([attribute]) => ADDON_CONTROLS[attribute][0])
        .join(', ');
    const waitingForHover = addonNames('hover');
    const waitingForScroll = addonNames('scroll');

    const inspector = (
        <InspectorControls>
            <PanelBody title={__('🧭 Presentation', 'kinetichub')} initialOpen={true}>
                <SelectControl
                    label={labelWithHelp(__('Preset', 'kinetichub'), __('A curated starting point. Applying one sets the presentation, composition, atmosphere, motion and the styling of the content and buttons together. Your images, text and links are never changed, and every setting stays editable afterwards.', 'kinetichub'))}
                    value={presetChoice}
                    options={[
                        { label: __('Choose a preset…', 'kinetichub'), value: '' },
                        ...Object.keys(PRESETS).map((value) => ({ label: PRESET_LABELS[value], value })),
                    ]}
                    onChange={(value) => {
                        setPresetChoice(value);
                        setAppliedPreset('');
                    }}
                />

                {presetChoice && <InspectorNote text={PRESET_DESCRIPTIONS[presetChoice]} />}

                <Button
                    variant="secondary"
                    onClick={applyPreset}
                    disabled={!presetChoice}
                    style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
                >
                    {__('Apply Preset', 'kinetichub')}
                </Button>

                {appliedPreset && (
                    <InspectorNote
                        text={images.length < PRESETS[appliedPreset].images
                            ? sprintf(
                                /* translators: 1: preset name, 2: number of images it is designed for. */
                                __('%1$s applied. It is designed for %2$d images; until they are added the hero shows what it can. Every setting stays editable.', 'kinetichub'),
                                PRESET_LABELS[appliedPreset],
                                PRESETS[appliedPreset].images
                            )
                            : sprintf(
                                /* translators: %s: preset name. */
                                __('%s applied. Every setting stays editable.', 'kinetichub'),
                                PRESET_LABELS[appliedPreset]
                            )}
                    />
                )}

                <SelectControl
                    label={labelWithHelp(__('Presentation', 'kinetichub'), CHOICE_HELP.presentation)}
                    value={hero.presentation}
                    options={PRESENTATIONS.map((value) => ({ label: PRESENTATION_LABELS[value], value }))}
                    onChange={(value) => setAttributes({ presentation: value })}
                />

                
                <ProNote text={__('Stacked Cards and Editorial Collage, which compose up to three images as a layered stack or an overlapping collage, and three more presets: Layered Studio, Editorial Showcase and Cinematic Edge.', 'kinetichub')} />
                

                {hero.presentation !== attributes.presentation && (
                    <InspectorNote
                        text={sprintf(
                            /* translators: %s: presentation name. */
                            __('This hero was saved with a presentation this version does not offer, so %s is used in its place. The saved setting is kept until you choose a presentation here.', 'kinetichub'),
                            savedLabel
                        )}
                    />
                )}

                {hasImages && layout !== hero.presentation && (
                    <InspectorNote
                        text={sprintf(
                            /* translators: 1: presentation name, 2: number of images it needs. */
                            __('%1$s needs at least %2$d images. Until they are added the hero shows as Single; the setting is kept.', 'kinetichub'),
                            savedLabel,
                            minimumImages
                        )}
                    />
                )}

                {unusedImages > 0 && (
                    <InspectorNote
                        text={slotCount === 1
                            ? __('Single uses the first image. The others are kept, but not shown.', 'kinetichub')
                            : sprintf(
                                /* translators: 1: presentation name, 2: number of images it shows. */
                                __('%1$s uses the first %2$d images. The rest are kept, but not shown.', 'kinetichub'),
                                PRESENTATION_LABELS[layout],
                                slotCount
                            )}
                    />
                )}

                {layout === 'stacked-cards' && slotCount === 2 && (
                    <InspectorNote text={__('A third image becomes the deepest card, behind the other two.', 'kinetichub')} />
                )}

                {layout === 'editorial-collage' && slotCount === 2 && (
                    <InspectorNote text={__('A third image becomes a small accent under the second.', 'kinetichub')} />
                )}
            </PanelBody>

            <PanelBody title={__('🖼️ Images', 'kinetichub')} initialOpen={true}>
                {/* A hero saved with more images than can be added here keeps them all. */}
                <InspectorNote
                    text={images.length > MAX_ADDED_IMAGES
                        ? sprintf(
                            /* translators: 1: number of images stored, 2: the most images any presentation here shows. */
                            __('%1$d images. Up to %2$d are shown; the others are kept. The first is the primary image: it loads first, at high priority.', 'kinetichub'),
                            images.length,
                            MAX_ADDED_IMAGES
                        )
                        : sprintf(
                            /* translators: 1: number of images added, 2: maximum number of images. */
                            __('%1$d of %2$d images. The first is the primary image: it loads first, at high priority.', 'kinetichub'),
                            images.length,
                            MAX_ADDED_IMAGES
                        )}
                />

                {images.map((image, index) => {
                    const media = mediaRecords[index];
                    const position = index + 1;
                    const baseLabel = index === 0
                        ? sprintf(
                            /* translators: %d: image position, always 1 here. */
                            __('Image %d · Primary', 'kinetichub'),
                            position
                        )
                        : sprintf(
                            /* translators: %d: image position in the list. */
                            __('Image %d', 'kinetichub'),
                            position
                        );
                    // The row names a mobile replacement only where this build offers them.
                    let rowLabel = baseLabel;
                    

                    return (
                        <div
                            // Position is the identity: the same attachment may fill two slots.
                            key={`image-${index}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '4px', background: '#f0f0f0', borderRadius: '4px' }}
                        >
                            <img
                                src={getThumbnailUrl(image, media)}
                                alt=""
                                style={getImageFit(image) === 'contain'
                                    ? { ...thumbnailStyle, objectFit: 'contain' }
                                    : { ...thumbnailStyle, objectPosition: getFocalStyle(image.focalPoint)['--kh-ih-focal'] }}
                            />
                            <Button
                                variant="tertiary"
                                size="small"
                                isPressed={index === activeImageIndex}
                                onClick={() => setActiveIndex(index)}
                                style={{ flex: 1, minWidth: 0, justifyContent: 'flex-start' }}
                            >
                                {rowLabel}
                            </Button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                <Button
                                    size="small"
                                    icon="arrow-up-alt2"
                                    /* translators: %d: image position in the list. */
                                    label={sprintf(__('Move image %d up', 'kinetichub'), position)}
                                    disabled={index === 0}
                                    onClick={() => onMoveImage(index, -1)}
                                />
                                <Button
                                    size="small"
                                    icon="arrow-down-alt2"
                                    /* translators: %d: image position in the list. */
                                    label={sprintf(__('Move image %d down', 'kinetichub'), position)}
                                    disabled={index === images.length - 1}
                                    onClick={() => onMoveImage(index, 1)}
                                />
                                <MediaUploadCheck>
                                    <MediaUpload
                                        onSelect={(selectedMedia) => onReplaceImage(index, selectedMedia)}
                                        allowedTypes={['image']}
                                        value={image.id || undefined}
                                        render={({ open }) => (
                                            <Button
                                                size="small"
                                                icon="update"
                                                /* translators: %d: image position in the list. */
                                                label={sprintf(__('Replace image %d', 'kinetichub'), position)}
                                                onClick={open}
                                            />
                                        )}
                                    />
                                </MediaUploadCheck>
                                <Button
                                    size="small"
                                    icon="trash"
                                    isDestructive
                                    /* translators: %d: image position in the list. */
                                    label={sprintf(__('Remove image %d', 'kinetichub'), position)}
                                    onClick={() => onRemoveImage(index)}
                                />
                            </div>
                        </div>
                    );
                })}

                <MediaUploadCheck>
                    <MediaUpload
                        onSelect={onAddImage}
                        allowedTypes={['image']}
                        render={({ open }) => (
                            <Button
                                variant="secondary"
                                onClick={open}
                                disabled={images.length >= MAX_ADDED_IMAGES}
                                style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
                            >
                                {addImageLabel}
                            </Button>
                        )}
                    />
                </MediaUploadCheck>

                
                <ProNote text={__('A third image, and a separate mobile image for any image, for a crop that suits a small screen.', 'kinetichub')} />
                

                {activeImage && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
                            {activeSettingsTitle}
                        </p>

                        <SelectControl
                            label={__('Image fit', 'kinetichub')}
                            value={activeFit}
                            options={IMAGE_FIT_OPTIONS}
                            onChange={(fit) => updateImage(activeImageIndex, { fit })}
                            help={IMAGE_FIT_HELP[activeFit]}
                        />

                        {/* Only a composed stage has cards that overlap, and only there is the face solid. */}
                        {activeFit === 'contain' && stage === 'composed' && (
                            <ToggleControl
                                label={labelWithHelp(__('Frame background', 'kinetichub'), __('Adds a solid backing behind the contained image so overlapping content does not show through.', 'kinetichub'))}
                                checked={getContainBackground(activeImage)}
                                onChange={(value) => updateImage(activeImageIndex, { containBackground: !!value })}
                            />
                        )}

                        {activeFit === 'cover' && (
                            <FocalPointPicker
                                label={labelWithHelp(__('Focal point', 'kinetichub'), __('The part of the image kept in view when the hero crops it. The crop changes with the screen shape, so check the desktop and mobile previews.', 'kinetichub'))}
                                url={getPreviewUrl(activeImage, activeMedia)}
                                value={activeImage.focalPoint}
                                onChange={(focalPoint) => updateImage(activeImageIndex, { focalPoint })}
                            />
                        )}

                        <ToggleControl
                            label={labelWithHelp(__('Decorative image', 'kinetichub'), __('Outputs an empty alt so screen readers skip the image. Use it only when the image adds nothing a visitor would miss without seeing it.', 'kinetichub'))}
                            checked={activeImage.decorative}
                            onChange={(value) => updateImage(activeImageIndex, { decorative: !!value })}
                        />

                        {!activeImage.decorative && (
                            <TextareaControl
                                label={labelWithHelp(__('Alternative text', 'kinetichub'), __('Describes the image for visitors who cannot see it. Leave it empty to use the text saved in the Media Library, read fresh every time the page renders.', 'kinetichub'))}
                                value={activeImage.altOverride}
                                onChange={(value) => updateImage(activeImageIndex, { altOverride: value })}
                                help={activeAltHelp}
                            />
                        )}

                        
                    </div>
                )}
            </PanelBody>

            {composition && (
                <PanelBody title={__('🧩 Composition', 'kinetichub')} initialOpen={false}>
                    {hero.stageSettings && STAGE_CONTROLS.map(([key, attribute, label, help, options]) => {
                        const stageOptions = offered(options, STAGE_SETTINGS[key][1]);

                        if (key === 'balance' && hero.contentX === 'center') {
                            return <InspectorNote key={key} text={__('Content / Media applies when the content is on the left or right. Centred content puts the images below it.', 'kinetichub')} />;
                        }

                        // A choice of one is no choice: nothing to show.
                        return stageOptions.length > 1 && (
                            <SelectControl
                                key={key}
                                label={labelWithHelp(label, help)}
                                value={hero.stageSettings[key]}
                                options={stageOptions}
                                onChange={(value) => setAttributes({ [attribute]: value })}
                            />
                        );
                    })}

                    
                    {hero.stageSettings && (
                        <ProNote text={__('An Oversized scale that runs the images off the edge of the hero, a 35 / 65 content and media balance, and Strong content overlap.', 'kinetichub')} />
                    )}
                    

                    <InspectorNote text={__('Each presentation has its own tuning. A setting you change is kept when you switch presentation; Reset hands it back.', 'kinetichub')} />

                    {layout === 'split-duo' && (
                        <SelectControl
                            label={labelWithHelp(__('Split', 'kinetichub'), __('How the width is shared between the first and second image. On mobile they stack at equal height.', 'kinetichub'))}
                            value={composition.ratio}
                            options={[
                                { label: __('50 / 50', 'kinetichub'), value: '50-50' },
                                { label: __('40 / 60', 'kinetichub'), value: '40-60' },
                                { label: __('60 / 40', 'kinetichub'), value: '60-40' },
                            ]}
                            onChange={(value) => setAttributes({ splitRatio: value })}
                        />
                    )}

                    {usesGap && (
                        <CompositionRange
                            setting="gap"
                            label={labelWithHelp(__('Gap (px)', 'kinetichub'), gapHelp)}
                            value={composition.gap}
                            step={2}
                            setAttributes={setAttributes}
                        />
                    )}

                    {layout === 'split-duo' && composition.gap === 0 && (
                        <InspectorNote text={__('Radius, shadow and rotation read best once Gap separates the images.', 'kinetichub')} />
                    )}

                    <CompositionRange
                        setting="radius"
                        label={labelWithHelp(__('Card Radius (px)', 'kinetichub'), __('Rounds the corners of every image.', 'kinetichub'))}
                        value={composition.radius}
                        step={1}
                        setAttributes={setAttributes}
                    />

                    <SelectControl
                        label={labelWithHelp(__('Shadow', 'kinetichub'), __('Soft suits images that sit close together; Floating lifts them clear of the background. Mobile uses a lighter Floating.', 'kinetichub'))}
                        value={composition.shadow}
                        options={[
                            { label: __('None', 'kinetichub'), value: 'none' },
                            { label: __('Soft', 'kinetichub'), value: 'soft' },
                            { label: __('Floating', 'kinetichub'), value: 'floating' },
                        ]}
                        onChange={(value) => setAttributes({ cardShadow: value })}
                    />

                    <CompositionRange
                        setting="rotation"
                        label={labelWithHelp(__('Rotation (°)', 'kinetichub'), __('Turns the images in opposite directions. The value is the strongest turn; the other images turn less, and Offset Duo keeps its primary image straight. 0 keeps everything straight. Mobile uses half, or none when the images stack.', 'kinetichub'))}
                        value={composition.rotation}
                        step={0.5}
                        setAttributes={setAttributes}
                    />

                    {layout === 'offset-duo' && (
                        <CompositionRange
                            setting="overlap"
                            label={labelWithHelp(__('Overlap (%)', 'kinetichub'), __('How far the second image reaches over the first. At 0 their edges just meet. Desktop only: mobile uses a fixed overlap.', 'kinetichub'))}
                            value={composition.overlap}
                            step={5}
                            setAttributes={setAttributes}
                        />
                    )}

                    {depthLabel && (
                        <CompositionRange
                            setting="depth"
                            label={labelWithHelp(depthLabel, depthHelp)}
                            value={composition.depth}
                            step={5}
                            setAttributes={setAttributes}
                        />
                    )}
                </PanelBody>
            )}

            <PanelBody title={__('🎨 Appearance', 'kinetichub')} initialOpen={false}>
                <RangeControl
                    label={labelWithHelp(__('Hero Min Height — Desktop (vh)', 'kinetichub'), __('The least height the hero takes, as a percentage of the browser window: 100 is one full screen. It is a minimum, never a fixed height: content taller than this makes the hero taller.', 'kinetichub'))}
                    value={hero.heightDesktop}
                    onChange={(value) => setAttributes({ heroHeightDesktop: clampHeight(value, 90) })}
                    min={HEIGHT_MIN}
                    max={HEIGHT_MAX}
                />
                <RangeControl
                    label={labelWithHelp(__('Hero Min Height — Mobile (vh)', 'kinetichub'), __('The same minimum height, used at 768px and below.', 'kinetichub'))}
                    value={hero.heightMobile}
                    onChange={(value) => setAttributes({ heroHeightMobile: clampHeight(value, 80) })}
                    min={HEIGHT_MIN}
                    max={HEIGHT_MAX}
                />

                {stage === 'composed' ? (
                    <InspectorNote text={__('The content sits beside the images in this presentation, never on them, so no overlay is drawn. The section background colour is set in the Styles tab.', 'kinetichub')} />
                ) : (
                    <>
                        <p style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                            {__('Overlay Color', 'kinetichub')}
                            <InspectorHelp
                                label={__('Overlay Color', 'kinetichub')}
                                text={__('The colour laid over the images, behind your content. It stays invisible until Overlay Opacity is above 0.', 'kinetichub')}
                            />
                        </p>
                        <ColorPalette
                            value={overlayColor}
                            onChange={(value) => setAttributes({ overlayColor: value || '#000000' })}
                        />
                        <RangeControl
                            label={labelWithHelp(__('Overlay Opacity', 'kinetichub'), __('How strongly the colour covers the images. Raising it is the usual way to keep text readable over a busy image.', 'kinetichub'))}
                            value={opacity}
                            onChange={(value) => setAttributes({ overlayOpacity: Math.min(1, Math.max(0, Number(value) || 0)) })}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                    </>
                )}

                {/* Hidden where None is the only scene this stage can draw. */}
                {sceneOptions.length > 1 && (
                    <SelectControl
                        label={labelWithHelp(
                            __('Scene Backdrop', 'kinetichub'),
                            stage === 'composed'
                                ? CHOICE_HELP.scene
                                : __('The image fills this presentation, so only Vignette, which lies over it, applies here: it shades the edges of the frame for a cinematic finish.', 'kinetichub')
                        )}
                        value={hero.scene}
                        options={sceneOptions}
                        onChange={(value) => setAttributes({ sceneBackdrop: value })}
                    />
                )}

                
                <ProNote text={__('Dual Glow, Accent Panel and Vignette scene backdrops. Vignette also shades the edges of a full-width image.', 'kinetichub')} />
                

                {hasImages && keptScene && (
                    <InspectorNote
                        text={sprintf(
                            /* translators: %s: scene backdrop name. */
                            __('%s is drawn behind a composition, and here the image covers that space, so it is not shown. The setting is kept for the composed presentations.', 'kinetichub'),
                            keptScene.label
                        )}
                    />
                )}

                {hero.scene !== 'none' && (
                    <SelectControl
                        label={labelWithHelp(__('Backdrop Intensity', 'kinetichub'), __('How strong the scene backdrop is. Medium is the standard strength; Subtle and Strong adjust it without changing its shape.', 'kinetichub'))}
                        value={hero.sceneIntensity}
                        options={offered(INTENSITY_OPTIONS, SCENE_INTENSITIES)}
                        onChange={(value) => setAttributes({ backdropIntensity: value })}
                    />
                )}

                <InspectorNote text={__('To let a background behind the hero show through (Hero Mesh, Ambient Aura or a Group), set Background in the Styles tab to a colour at 0% opacity. The scene backdrop still draws over it.', 'kinetichub')} />
            </PanelBody>

            {hasImages && (
                <PanelBody title={__('🎬 Motion', 'kinetichub')} initialOpen={false}>
                    <SelectControl
                        label={labelWithHelp(__('Motion Mode', 'kinetichub'), CHOICE_HELP.motionMode)}
                        value={motion.mode}
                        options={offered(MOTION_MODE_OPTIONS, MOTION_MODES)}
                        onChange={(value) => setAttributes({ motionMode: value })}
                    />

                    {motion.mode !== 'none' && (
                        <SelectControl
                            label={labelWithHelp(__('Motion Intensity', 'kinetichub'), CHOICE_HELP.motionIntensity)}
                            value={motion.intensity}
                            options={offered(INTENSITY_OPTIONS, MOTION_INTENSITIES)}
                            onChange={(value) => setAttributes({ motionIntensity: value })}
                        />
                    )}

                    <SelectControl
                        label={labelWithHelp(__('Reveal Style', 'kinetichub'), __('How the images appear the first time the hero comes into view. The text is there from the start, and a hero already on screen when the page opens is never hidden.', 'kinetichub'))}
                        value={motion.reveal}
                        options={offered(REVEAL_OPTIONS, REVEAL_STYLES)}
                        onChange={(value) => setAttributes({ revealStyle: value })}
                    />

                    

                    
                    <ProNote text={__('Scroll motion, alone or with hover, a Strong intensity, Clip and Blur → Sharp image reveals, and staggered reveals that bring the images in one after another.', 'kinetichub')} />
                    

                    <InspectorNote text={CHOICE_HELP.motionPreview} />
                </PanelBody>
            )}

            {hasImages && (
                <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                    {addonsReady.map(([attribute]) => (
                        <ToggleControl
                            key={attribute}
                            label={labelWithHelp(ADDON_CONTROLS[attribute][0], ADDON_CONTROLS[attribute][1])}
                            checked={attributes[attribute] === true}
                            onChange={(value) => setAttributes({ [attribute]: !!value })}
                        />
                    ))}

                    {waitingForHover && (
                        <InspectorNote
                            text={sprintf(
                                /* translators: %s: comma-separated Smart Addon names. */
                                __('With Hover in Motion Mode: %s.', 'kinetichub'),
                                waitingForHover
                            )}
                        />
                    )}

                    {waitingForScroll && (
                        <InspectorNote
                            text={sprintf(
                                /* translators: %s: comma-separated Smart Addon names. */
                                __('With Scroll in Motion Mode: %s.', 'kinetichub'),
                                waitingForScroll
                            )}
                        />
                    )}

                    {!addonsHere.some(([attribute]) => attribute === 'smartReadability') && (
                        <InspectorNote text={__('Smart Readability is offered where the text can sit on an image: on Single and Split Duo, and with Content Overlap.', 'kinetichub')} />
                    )}

                    
                    <ProNote text={__('Depth and interaction addons: Pointer Depth and Reactive Spotlight follow the pointer, Depth on Scroll and Scroll Drift layer the scroll motion, Stack Fan opens a stack of cards, and Focus Reveal opens each photograph to its full frame.', 'kinetichub')} />
                    
                </PanelBody>
            )}

            {slotCount > 1 && (
                <PanelBody title={__('📐 Responsive', 'kinetichub')} initialOpen={false}>
                    <SelectControl
                        label={labelWithHelp(
                            __('Mobile Composition', 'kinetichub'),
                            sprintf(
                                /* translators: %s: what Auto does for the current presentation. */
                                __('At 768px and below. Auto simplifies this presentation for small screens: %s. Stack places the images one under the other, straight. Primary Only shows just the first image.', 'kinetichub'),
                                MOBILE_AUTO_DESCRIPTIONS[layout]
                            )
                        )}
                        value={hero.mobileComposition}
                        options={[
                            { label: __('Auto', 'kinetichub'), value: 'auto' },
                            { label: __('Stack', 'kinetichub'), value: 'stack' },
                            { label: __('Primary Only', 'kinetichub'), value: 'primary' },
                        ]}
                        onChange={(value) => setAttributes({ mobileComposition: value })}
                    />

                    {stage === 'composed' && (
                        <SelectControl
                            label={labelWithHelp(__('Mobile Order', 'kinetichub'), __('On mobile the content and the images stack. Choose which comes first.', 'kinetichub'))}
                            value={hero.mobileOrder}
                            options={[
                                { label: __('Content First', 'kinetichub'), value: 'content-first' },
                                { label: __('Media First', 'kinetichub'), value: 'media-first' },
                            ]}
                            onChange={(value) => setAttributes({ mobileOrder: value })}
                        />
                    )}

                    
                </PanelBody>
            )}

            <PanelBody title={__('✍️ Content', 'kinetichub')} initialOpen={false}>
                <InspectorNote text={__('Eyebrow, badge, heading, description and button text are edited directly on the canvas. Empty fields are left out on the site, with no gap where they would have been.', 'kinetichub')} />

                <InspectorGroup title={__('Layout', 'kinetichub')} first>
                    <SelectControl
                        label={stage === 'composed'
                            ? labelWithHelp(__('Horizontal placement', 'kinetichub'), __('Left or Right puts the content on that side and the images on the other. Center puts the images below the content. The same choice is in the block toolbar.', 'kinetichub'))
                            : labelWithHelp(__('Horizontal placement', 'kinetichub'), __('Where the content sits over the image, and how its lines align. The same choice is in the block toolbar.', 'kinetichub'))}
                        value={hero.contentX}
                        options={['left', 'center', 'right'].map((value) => ({ label: HORIZONTAL_LABELS[visualSide(value)], value }))}
                        onChange={(value) => setAttributes({ contentAlign: value })}
                    />
                    <SelectControl
                        label={__('Vertical placement', 'kinetichub')}
                        value={hero.contentY}
                        options={[
                            { label: __('Top', 'kinetichub'), value: 'top' },
                            { label: __('Center', 'kinetichub'), value: 'center' },
                            { label: __('Bottom', 'kinetichub'), value: 'bottom' },
                        ]}
                        onChange={(value) => setAttributes({ contentVerticalAlign: value })}
                    />
                    <SelectControl
                        label={labelWithHelp(__('Content Width', 'kinetichub'), __('The widest the text may run. Narrow suits an editorial measure; Wide gives a large heading room on a full-width image. Custom sets it in pixels. The space the content has always caps it, so a width never pushes into the images.', 'kinetichub'))}
                        value={content.width}
                        options={CONTENT_OPTIONS.contentWidth}
                        onChange={(value) => setAttributes({ contentWidth: value })}
                    />
                    {content.width === 'custom' && (
                        <RangeControl
                            label={__('Custom Width (px)', 'kinetichub')}
                            value={content.maxWidth}
                            min={CONTENT_WIDTH_RANGE.min}
                            max={CONTENT_WIDTH_RANGE.max}
                            step={CONTENT_WIDTH_RANGE.step}
                            allowReset
                            onChange={(next) => setAttributes({
                                contentMaxWidth: next === undefined ? undefined : clampStep(next, CONTENT_WIDTH_RANGE, content.maxWidth),
                            })}
                        />
                    )}
                    {sideBySide && (
                        <InspectorNote text={__('Beside the images, the column is set by Content / Media in the Composition panel; Content Width caps the text inside that column.', 'kinetichub')} />
                    )}
                    <SelectControl
                        label={labelWithHelp(__('Spacing', 'kinetichub'), __('The rhythm between the eyebrow, the heading, the description and the buttons, and between the two buttons. Balanced is the standard rhythm.', 'kinetichub'))}
                        value={content.spacing}
                        options={CONTENT_OPTIONS.contentSpacing}
                        onChange={(value) => setAttributes({ contentSpacing: value })}
                    />
                </InspectorGroup>

                <InspectorGroup title={__('Typography', 'kinetichub')}>
                    <SelectControl
                        label={labelWithHelp(__('Heading level', 'kinetichub'), __('The heading\'s place in the page outline, for screen readers and search engines. It never changes the size. Use H1 only when this hero carries the page\'s main heading and the theme does not already print one above it.', 'kinetichub'))}
                        value={String(level)}
                        options={[1, 2, 3, 4, 5, 6].map((value) => ({ label: `H${value}`, value: String(value) }))}
                        onChange={(value) => setAttributes({ headingLevel: Number(value) })}
                    />
                    <SelectControl
                        label={labelWithHelp(__('Heading Size', 'kinetichub'), __('How large the heading is drawn, whatever its level. Large suits a longer headline; XL is the standard size; Display is poster-scale for a few words. Font and weight stay the theme\'s.', 'kinetichub'))}
                        value={content.heading}
                        options={CONTENT_OPTIONS.headingSize}
                        onChange={(value) => setAttributes({ headingSize: value })}
                    />
                    <SelectControl
                        label={__('Description Size', 'kinetichub')}
                        value={content.description}
                        options={CONTENT_OPTIONS.descriptionSize}
                        onChange={(value) => setAttributes({ descriptionSize: value })}
                    />
                </InspectorGroup>

                <InspectorGroup title={__('Eyebrow & Badge', 'kinetichub')}>
                    <SelectControl
                        label={labelWithHelp(__('Eyebrow Style', 'kinetichub'), __('Plain is small capitals. Accent Line adds a short rule in the KineticHub accent colour on the outer side, or on both sides when the content is centred. Pill sets the eyebrow in a quiet capsule with an accent dot.', 'kinetichub'))}
                        value={content.eyebrow}
                        options={CONTENT_OPTIONS.eyebrowStyle}
                        onChange={(value) => setAttributes({ eyebrowStyle: value })}
                    />
                    <SelectControl
                        label={labelWithHelp(__('Badge Style', 'kinetichub'), __('Minimal is a hairline capsule. Soft is tinted with the accent colour. Glass is translucent and lightly blurred, for a badge over a photograph or a mesh.', 'kinetichub'))}
                        value={content.badge}
                        options={CONTENT_OPTIONS.badgeStyle}
                        onChange={(value) => setAttributes({ badgeStyle: value })}
                    />
                </InspectorGroup>

                <InspectorGroup title={__('Surface & Readability', 'kinetichub')}>
                    <SelectControl
                        label={labelWithHelp(__('Content Surface', 'kinetichub'), __('A visible panel behind the text, the width of the content. Soft Panel is a quiet, solid-feeling ground; Glass is translucent and blurs what lies behind it. Both take the tone opposite the text, so they read over a photograph, a mesh or a gradient.', 'kinetichub'))}
                        value={content.panel}
                        options={CONTENT_OPTIONS.contentSurface}
                        onChange={(value) => setAttributes({ contentSurface: value })}
                    />
                    {content.panel !== 'none' && motion.addons.smartReadability && (
                        <InspectorNote text={__('Smart Readability is on, so the panel deepens instead of the soft shade being drawn under it.', 'kinetichub')} />
                    )}
                    {content.panel !== 'none' && hero.stageSettings && hero.stageSettings.crossover !== 'none' && hero.contentX !== 'center' && (
                        <InspectorNote text={__('With Content Overlap the panel takes the place of the solid plate, so the images run behind the panel.', 'kinetichub')} />
                    )}
                </InspectorGroup>

                <InspectorGroup title={__('Entrance', 'kinetichub')}>
                    <SelectControl
                        label={labelWithHelp(__('Content Entrance', 'kinetichub'), __('How the text arrives, in reading order: eyebrow, heading, description, then buttons. It plays once, as the page opens or when a hero further down comes into view, and ends on the hero exactly as it stands. Visitors whose device asks for reduced motion see the text at once.', 'kinetichub'))}
                        value={content['content-in']}
                        options={CONTENT_OPTIONS.contentReveal}
                        onChange={(value) => setAttributes({ contentReveal: value })}
                    />
                    {content['content-in'] !== 'none' && (
                        <SelectControl
                            label={labelWithHelp(__('Timing', 'kinetichub'), __('When the text starts, measured against the image reveal: together with it, just after, or once the images have mostly settled. Without an image reveal it is measured from when the hero comes into view.', 'kinetichub'))}
                            value={content['content-delay']}
                            options={CONTENT_OPTIONS.contentDelay}
                            onChange={(value) => setAttributes({ contentDelay: value })}
                        />
                    )}
                    {content['content-in'] !== 'none' && (
                        <InspectorNote text={__('The editor shows the content at rest. The entrance plays on the published page.', 'kinetichub')} />
                    )}
                </InspectorGroup>
            </PanelBody>

            <PanelBody title={__('🔗 Buttons', 'kinetichub')} initialOpen={false}>
                <InspectorNote text={__('Button text is edited on the canvas. A button appears on the site only once it has both text and a link.', 'kinetichub')} />
                <CtaControls index={1} attributes={attributes} setAttributes={setAttributes} />
                <CtaControls index={2} attributes={attributes} setAttributes={setAttributes} />

                <InspectorGroup title={__('Layout & Hover', 'kinetichub')}>
                    <SelectControl
                        label={labelWithHelp(__('Size', 'kinetichub'), __('One size for both buttons, so side by side they always share a height.', 'kinetichub'))}
                        value={content['ctas-size']}
                        options={CONTENT_OPTIONS.ctaSize}
                        onChange={(value) => setAttributes({ ctaSize: value })}
                    />
                    <SelectControl
                        label={labelWithHelp(__('Arrangement', 'kinetichub'), __('Side by side, wrapping onto a new line when there is no room; or stacked, one above the other at the width of the wider button. They follow the content\'s alignment.', 'kinetichub'))}
                        value={content.ctas}
                        options={CONTENT_OPTIONS.ctaLayout}
                        onChange={(value) => setAttributes({ ctaLayout: value })}
                    />
                    <SelectControl
                        label={labelWithHelp(__('On Mobile', 'kinetichub'), __('At 768px and below. Stacked puts the buttons one above the other; Stacked, full width also stretches them across the content.', 'kinetichub'))}
                        value={content['ctas-mobile']}
                        options={CONTENT_OPTIONS.ctaMobileLayout}
                        onChange={(value) => setAttributes({ ctaMobileLayout: value })}
                    />
                    <SelectControl
                        label={labelWithHelp(__('Hover', 'kinetichub'), __('A restrained response to the pointer, and to keyboard focus: Lift raises the button a touch, Arrow Shift nudges its icon forward, Glow adds a soft halo in the accent colour. Mouse and trackpad only; reduced motion keeps Glow and drops the movement.', 'kinetichub'))}
                        value={content['ctas-hover']}
                        options={CONTENT_OPTIONS.ctaMotion}
                        onChange={(value) => setAttributes({ ctaMotion: value })}
                    />
                    {content['ctas-hover'] === 'arrow-shift' && resolveCta(attributes, 1).icon === 'none' && resolveCta(attributes, 2).icon === 'none' && (
                        <InspectorNote text={__('Arrow Shift moves a button\'s icon; choose an icon for a button above to see it.', 'kinetichub')} />
                    )}
                </InspectorGroup>
            </PanelBody>

            <KineticVisibilityControls attributes={attributes} setAttributes={setAttributes} />
        </InspectorControls>
    );

    if (!hasImages) {
        return (
            <>
                {inspector}
                <div {...blockProps}>
                    <MediaPlaceholder
                        icon="format-image"
                        labels={{
                            title: __('Kinetic Image Hero', 'kinetichub'),
                            instructions: sprintf(
                                /* translators: %d: maximum number of images. */
                                __('Choose up to %d images. The first becomes the primary image.', 'kinetichub'),
                                MAX_ADDED_IMAGES
                            ),
                        }}
                        onSelect={onSelectInitial}
                        accept="image/*"
                        allowedTypes={['image']}
                        multiple
                    />
                </div>
            </>
        );
    }

    const showKicker = isSelected || hasText(badge) || hasText(eyebrow);
    const showActions = isSelected || hasText(cta1Text) || hasText(cta2Text);

    /*
     * One quick control: where the content sits. Every presentation offers
     * the same three placements, so none is impossible; the labels say what
     * each one does here -- beside a composition, or over the image. Width,
     * Wide and Full stay with the native alignment control.
     */
    const positionStage = stage === 'composed' ? 'composed' : 'backdrop';

    return (
        <>
            <BlockControls group="block">
                <ToolbarDropdownMenu
                    icon={POSITION_ICONS[positionStage][visualSide(hero.contentX)]}
                    label={sprintf(
                        /* translators: %s: the current content position, such as "Content left, images right". */
                        __('Content position: %s', 'kinetichub'),
                        POSITION_LABELS[positionStage][visualSide(hero.contentX)]
                    )}
                    controls={['left', 'center', 'right'].map((value) => ({
                        title: POSITION_LABELS[positionStage][visualSide(value)],
                        icon: POSITION_ICONS[positionStage][visualSide(value)],
                        isActive: hero.contentX === value,
                        onClick: () => setAttributes({ contentAlign: value }),
                    }))}
                />
            </BlockControls>

            {inspector}

            <section {...blockProps}>
                <div className="kh-ih-media">
                    {slotImages.map((image, index) => {
                        // As render.php: where mobile replacements are not offered, every width shows the desktop image.
                        let mobileImage = null;
                        
                        const mobileUrl = mobileImage ? getPreviewUrl(mobileImage, mobileRecords[index]) : '';

                        return (
                            <div
                                key={`slot-${index}`}
                                className={getSlotClassName(index, !!mobileUrl, getImageFit(image), getContainBackground(image))}
                                data-kh-ih-slot={index}
                            >
                                <div className="kh-ih-slot-inner">
                                    <picture className="kh-ih-picture">
                                        {mobileUrl && <source media={MOBILE_MEDIA} srcSet={mobileUrl} />}
                                        <img
                                            className="kh-ih-img"
                                            src={getPreviewUrl(image, mediaRecords[index])}
                                            alt={resolveAlt(image, mediaRecords[index])}
                                            style={getFocalStyle(image.focalPoint)}
                                        />
                                    </picture>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="kh-ih-overlay" aria-hidden="true" style={{ backgroundColor: overlayColor || '#000000', opacity }} />

                <div className="kh-ih-content-layer">
                    <div className="kh-ih-content">
                        {showKicker && (
                            <div className="kh-ih-kicker">
                                {(isSelected || hasText(badge)) && (
                                    <RichText
                                        identifier="badge"
                                        tagName="span"
                                        className="kh-ih-badge"
                                        aria-label={__('Badge', 'kinetichub')}
                                        placeholder={__('Badge', 'kinetichub')}
                                        value={badge}
                                        onChange={(value) => setAttributes({ badge: value })}
                                        allowedFormats={['core/bold', 'core/italic']}
                                        disableLineBreaks
                                    />
                                )}
                                {(isSelected || hasText(eyebrow)) && (
                                    <RichText
                                        identifier="eyebrow"
                                        tagName="p"
                                        className="kh-ih-eyebrow"
                                        aria-label={__('Eyebrow', 'kinetichub')}
                                        placeholder={__('Eyebrow text', 'kinetichub')}
                                        value={eyebrow}
                                        onChange={(value) => setAttributes({ eyebrow: value })}
                                        allowedFormats={['core/bold', 'core/italic']}
                                        disableLineBreaks
                                    />
                                )}
                            </div>
                        )}

                        {(isSelected || hasText(heading)) && (
                            <RichText
                                identifier="heading"
                                tagName={`h${level}`}
                                className="kh-ih-heading"
                                aria-label={__('Hero heading', 'kinetichub')}
                                placeholder={__('Hero heading', 'kinetichub')}
                                value={heading}
                                onChange={(value) => setAttributes({ heading: value })}
                                allowedFormats={['core/bold', 'core/italic']}
                            />
                        )}

                        {(isSelected || hasText(description)) && (
                            <RichText
                                identifier="description"
                                tagName="p"
                                className="kh-ih-description"
                                aria-label={__('Description', 'kinetichub')}
                                placeholder={__('Supporting text for the hero', 'kinetichub')}
                                value={description}
                                onChange={(value) => setAttributes({ description: value })}
                                allowedFormats={['core/bold', 'core/italic', 'core/link']}
                            />
                        )}

                        {showActions && (
                            <div className="kh-ih-actions">
                                {(isSelected || hasText(cta1Text)) && (
                                    <RichText
                                        identifier="cta1Text"
                                        tagName="a"
                                        className={`${getCtaClassName(attributes, 1)}${(cta1Url || '').trim() ? '' : ' kh-ih-cta-is-unlinked'}`}
                                        aria-label={__('Primary button text', 'kinetichub')}
                                        placeholder={__('Primary button', 'kinetichub')}
                                        value={cta1Text}
                                        onChange={(value) => setAttributes({ cta1Text: value })}
                                        allowedFormats={[]}
                                        withoutInteractiveFormatting
                                        disableLineBreaks
                                    />
                                )}
                                {(isSelected || hasText(cta2Text)) && (
                                    <RichText
                                        identifier="cta2Text"
                                        tagName="a"
                                        className={`${getCtaClassName(attributes, 2)}${(cta2Url || '').trim() ? '' : ' kh-ih-cta-is-unlinked'}`}
                                        aria-label={__('Secondary button text', 'kinetichub')}
                                        placeholder={__('Secondary button', 'kinetichub')}
                                        value={cta2Text}
                                        onChange={(value) => setAttributes({ cta2Text: value })}
                                        allowedFormats={[]}
                                        withoutInteractiveFormatting
                                        disableLineBreaks
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
};

registerBlockType(metadata.name, {
    edit: Edit,
    save: () => null,
});
