/**
 * Kinetic Image Hero - Presentation Model
 *
 * Every decision render.php makes from the attributes before it writes any
 * markup -- which images are kept, which presentation actually renders, the
 * effective composition settings, and the classes and custom properties that
 * carry them -- as plain functions. The editor canvas builds its preview from
 * these, so it lands on the same classes and values as the frontend. render.php
 * implements the same rules in PHP; keep the two in step.
 *
 * The lists below are what this build offers. Values between fs_premium_only
 * markers are removed at compile time from a build that does not offer them;
 * a saved value that build does not offer renders as its VALUE_FALLBACKS
 * entry, and the attribute itself is never rewritten.
 *
 * No WordPress imports: plain data in, plain data out.
 */

// Images kept in the attribute, in every build. A presentation that shows
// fewer (PRESENTATION_SLOTS) leaves the rest stored but unrendered.
export const MAX_IMAGES = 3;

// The one breakpoint: the stylesheet and the mobile <source> both use it.
export const MOBILE_MEDIA = '(max-width: 768px)';

/*
 * How an image sits in its frame. Cover fills it and may crop it, the focal
 * point choosing what stays in view; Contain shows the whole image and may
 * leave space around it. Cover is the default and is never stored, so an
 * image saved before the setting existed renders exactly as it did. A slot's
 * mobile replacement shares its fit.
 */
export const IMAGE_FITS = ['cover', 'contain'];

export const getImageFit = (image) => (image && image.fit === 'contain' ? 'contain' : 'cover');

/*
 * Frame background: whether a contained image's card keeps its solid face
 * (see the composed stage in style.scss). On unless switched off, so only
 * Off is stored; an image saved before the setting existed, or holding
 * anything but `false`, keeps the face. Cover ignores it.
 */
export const getContainBackground = (image) => !(image && image.containBackground === false);

export const PRESENTATIONS = [
    'single',
    'split-duo',
    'offset-duo',
    
];

/*
 * [minimum, maximum] images each presentation renders. Below the minimum the
 * hero renders as single; the saved presentation is never rewritten.
 */
export const PRESENTATION_SLOTS = {
    single: [1, 1],
    'split-duo': [2, 2],
    'offset-duo': [2, 2],
    
};

// Presentations whose images are a composition in their own area, beside the
// content (or below it when centred). The others are a backdrop behind it.
export const COMPOSED_LAYOUTS = [
    'offset-duo',
    
];

export const CONTENT_X = ['left', 'center', 'right'];
export const CONTENT_Y = ['top', 'center', 'bottom'];
export const SPLIT_RATIOS = ['50-50', '40-60', '60-40'];
export const SHADOWS = ['none', 'soft', 'floating'];
export const MOBILE_COMPOSITIONS = ['auto', 'stack', 'primary'];
export const MOBILE_ORDERS = ['content-first', 'media-first'];

export const COMPOSITION_SCALES = [
    'balanced',
    'large',
    
];
export const MEDIA_BALANCES = [
    '50-50',
    '40-60',
    
];
export const CONTENT_OVERLAPS = [
    'none',
    'subtle',
    
];
export const SCENE_BACKDROPS = [
    'none',
    'soft-glow',
    'gradient-wash',
    
];

/*
 * The composed stage's semantic settings: [attribute, allowed values, value
 * used when unset or invalid]. Each is written as one class,
 * kh-ih-{prefix}-{value}, and only on a composed stage; the stylesheet turns
 * them into geometry. Mirrors $kh_ih_stage_settings in render.php.
 */
export const STAGE_SETTINGS = {
    scale: ['compositionScale', COMPOSITION_SCALES, 'large'],
    balance: ['mediaBalance', MEDIA_BALANCES, '40-60'],
    crossover: ['contentOverlap', CONTENT_OVERLAPS, 'none'],
    scene: ['sceneBackdrop', SCENE_BACKDROPS, 'none'],
};

/*
 * Scene backdrops a backdrop stage can show. Its images fill the section, so
 * nothing drawn behind them would be seen: only Vignette, which lies over
 * them, applies. Any other saved value is kept and simply not drawn.
 */
export const BACKDROP_STAGE_SCENES = [
    'none',
    
];

// Backdrop Intensity: every level in every build, so it never shares a list
// with Motion Intensity, which can be narrower.
export const SCENE_INTENSITIES = ['subtle', 'medium', 'strong'];

export const MOTION_MODES = [
    'none',
    'hover',
    
];
export const MOTION_INTENSITIES = [
    'subtle',
    'medium',
    
];
export const REVEAL_STYLES = [
    'none',
    'fade-rise',
    'scale',
    
];

/*
 * What a saved value renders as where this build does not offer it, by
 * attribute: the nearest value it does offer. In a build that offers every
 * value no entry changes what renders, and the attribute is never rewritten,
 * so the saved value returns wherever it is offered. Any other unknown value
 * takes the setting's own default. Backdrop Intensity and Content Entrance
 * are offered in full everywhere and have no entry. Mirrors
 * $kh_ih_value_fallbacks in render.php.
 */
export const VALUE_FALLBACKS = {
    presentation: { 'stacked-cards': 'offset-duo', 'editorial-collage': 'offset-duo' },
    compositionScale: { oversized: 'large' },
    mediaBalance: { '35-65': '40-60' },
    contentOverlap: { strong: 'subtle' },
    sceneBackdrop: { 'dual-glow': 'soft-glow', 'accent-panel': 'gradient-wash', vignette: 'none' },
    motionMode: { scroll: 'none', 'scroll-hover': 'hover' },
    motionIntensity: { strong: 'medium' },
    revealStyle: { clip: 'fade-rise', 'blur-sharp': 'fade-rise' },
};

/**
 * A saved choice as it renders: itself when the list offers it, else its
 * fallback when the list offers that, else the default. Mirrors
 * kinetichub_ih_resolve_choice().
 *
 * @param {*}        value     Raw attribute.
 * @param {string[]} allowed   Values offered here.
 * @param {Object}   fallbacks The attribute's entry of VALUE_FALLBACKS.
 * @param {string}   byDefault Used for anything else.
 * @return {string} The value that renders.
 */
export const resolveChoice = (value, allowed, fallbacks, byDefault) => {
    if (allowed.includes(value)) {
        return value;
    }

    const mapped = typeof value === 'string' && fallbacks && Object.prototype.hasOwnProperty.call(fallbacks, value) ? fallbacks[value] : null;

    return allowed.includes(mapped) ? mapped : byDefault;
};

/*
 * Smart Addons: [attribute, class suffix, motion family it refines (null for
 * none), whether the rendered hero can use it]. Each is written as one class,
 * kh-ih-addon-{suffix}, only when it is switched on, its family is part of
 * the Motion Mode, and the hero can use it -- so a saved addon that no longer
 * applies, or that this build does not offer, is kept but has no effect.
 * Mirrors $kh_ih_addons in render.php.
 */
export const SMART_ADDONS = [
    ['cardFocus', 'card-focus', 'hover', (hero) => hero.slotCount > 1],
    ['smartReadability', 'readability', null, (hero) => hero.stage === 'backdrop' || hero.stageSettings.crossover !== 'none'],
    
];

/*
 * Content and button design: [attribute, allowed values, value used when
 * unset or invalid]. Each is written as one class, kh-ih-{key}-{value}, and
 * only when it differs from that default, so a hero saved before these
 * settings existed renders exactly as it did. The stylesheet turns them into
 * scale, rhythm and surfaces. Mirrors $kh_ih_content_settings in render.php.
 */
export const CONTENT_SETTINGS = {
    width: ['contentWidth', ['narrow', 'standard', 'wide', 'custom'], 'standard'],
    spacing: ['contentSpacing', ['compact', 'balanced', 'airy'], 'balanced'],
    heading: ['headingSize', ['large', 'xl', 'display'], 'xl'],
    description: ['descriptionSize', ['normal', 'large'], 'normal'],
    eyebrow: ['eyebrowStyle', ['plain', 'accent-line', 'pill'], 'plain'],
    badge: ['badgeStyle', ['minimal', 'soft', 'glass'], 'minimal'],
    panel: ['contentSurface', ['none', 'soft-panel', 'glass'], 'none'],
    'content-in': ['contentReveal', ['none', 'fade-rise', 'clip', 'blur-sharp'], 'none'],
    'content-delay': ['contentDelay', ['none', 'short', 'after-media'], 'none'],
    ctas: ['ctaLayout', ['row', 'stack'], 'row'],
    'ctas-mobile': ['ctaMobileLayout', ['auto', 'stack', 'full-width'], 'auto'],
    'ctas-size': ['ctaSize', ['medium', 'large'], 'medium'],
    'ctas-hover': ['ctaMotion', ['none', 'lift', 'arrow-shift', 'glow'], 'none'],
};

// Custom content width, in px; the column it sits in always caps it.
export const CONTENT_WIDTH_RANGE = { min: 320, max: 1200, step: 10, fallback: 700 };

/*
 * Buttons. A button whose style was never chosen keeps the look it always
 * had (the first a white fill, the second an outline) and writes no style
 * class; the Inspector shows it as the style it resembles. Only a chosen
 * style writes kh-ih-cta-{variant}. Mirrors render.php.
 */
export const CTA_VARIANTS = ['solid', 'outline', 'ghost', 'glass'];
export const CTA_DEFAULT_VARIANTS = { 1: 'solid', 2: 'outline' };
export const CTA_ICONS = ['none', 'arrow', 'external-arrow'];

export const HEIGHT_MIN = 30;
export const HEIGHT_MAX = 100;

/*
 * The numeric composition settings: the attribute each is stored in, and the
 * range it is clamped and stepped to.
 */
export const COMPOSITION_RANGES = {
    gap: { attribute: 'compositionGap', min: 0, max: 64, step: 1 },
    radius: { attribute: 'cardRadius', min: 0, max: 48, step: 1 },
    rotation: { attribute: 'cardRotation', min: 0, max: 8, step: 0.5 },
    overlap: { attribute: 'compositionOverlap', min: 0, max: 100, step: 1 },
    depth: { attribute: 'compositionDepth', min: 0, max: 100, step: 1 },
};

/*
 * What each presentation uses for a setting that has never been touched. The
 * attributes deliberately have no block.json default: unset means "this
 * presentation's own tuning", and a value once set is shared by all of them.
 * Split Duo's defaults keep it one seamless backdrop until a gap is set.
 */
export const COMPOSITION_DEFAULTS = {
    'split-duo': { gap: 0, radius: 0, shadow: 'none', rotation: 0, overlap: 0, depth: 0 },
    'offset-duo': { gap: 16, radius: 12, shadow: 'floating', rotation: 2, overlap: 35, depth: 50 },
    
};

// The numeric settings each presentation reads, written as --kh-ih-{key}.
export const COMPOSITION_VARS = {
    'split-duo': ['gap', 'radius', 'rotation', 'depth'],
    'offset-duo': ['gap', 'radius', 'rotation', 'overlap', 'depth'],
    
};

const toNumber = (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value);

const clampUnit = (value) => {
    const number = toNumber(value);

    if (typeof number !== 'number' || !Number.isFinite(number)) {
        return 0.5;
    }

    return Math.min(1, Math.max(0, number));
};

export const clampHeight = (value, fallback) => {
    const number = Math.trunc(Number(value));

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.min(HEIGHT_MAX, Math.max(HEIGHT_MIN, number));
};

/**
 * Clamp a numeric setting to its range and step. Mirrors kinetichub_ih_clamp_step().
 *
 * @param {*}      value    Raw attribute.
 * @param {Object} range    Entry of COMPOSITION_RANGES.
 * @param {number} fallback Used when the value is not a finite number.
 * @return {number} The clamped value.
 */
export const clampStep = (value, range, fallback) => {
    const number = toNumber(value);

    if (typeof number !== 'number' || !Number.isFinite(number)) {
        return fallback;
    }

    const stepped = Math.round(Math.round(number / range.step) * range.step * 100) / 100;

    return Math.min(range.max, Math.max(range.min, stepped));
};

// Same output as kinetichub_ih_format_number(): at most two decimals, no trailing zeros.
export const formatNumber = (value) => String(Math.round(value * 100) / 100);

const toAttachmentId = (value) => {
    const id = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

    return Number.isInteger(id) && id > 0 ? id : 0;
};

const isPlainObject = (item) => !!item && typeof item === 'object' && !Array.isArray(item);

const normalizeMobileImage = (item) => {
    if (!isPlainObject(item)) {
        return null;
    }

    const id = toAttachmentId(item.id);
    const url = typeof item.url === 'string' ? item.url.trim() : '';

    return id || url ? { id, url } : null;
};

/**
 * Normalize the stored image list and the mobile replacements that go with it.
 * Mirrors kinetichub_ih_normalize_images().
 *
 * Mobile replacements are their own attribute, aligned with `images` by
 * position. They are joined here, by the RAW position, so a malformed desktop
 * entry that is dropped takes its replacement with it instead of shifting
 * every later replacement onto the wrong image.
 *
 * @param {*} rawImages       The `images` attribute as stored.
 * @param {*} rawMobileImages The `mobileImages` attribute as stored.
 * @return {{images: Object[], mobileImages: Array<Object|null>}} Aligned lists, at most MAX_IMAGES long.
 */
export const normalizeMedia = (rawImages, rawMobileImages) => {
    const images = [];
    const mobileImages = [];

    if (!Array.isArray(rawImages)) {
        return { images, mobileImages };
    }

    const rawMobile = Array.isArray(rawMobileImages) ? rawMobileImages : [];

    for (let rawIndex = 0; rawIndex < rawImages.length && images.length < MAX_IMAGES; rawIndex++) {
        const item = rawImages[rawIndex];

        if (!isPlainObject(item)) {
            continue;
        }

        const id = toAttachmentId(item.id);
        const url = typeof item.url === 'string' ? item.url.trim() : '';

        if (!id && !url) {
            continue;
        }

        const focalPoint = isPlainObject(item.focalPoint) ? item.focalPoint : {};
        const image = {
            id,
            url,
            focalPoint: { x: clampUnit(focalPoint.x), y: clampUnit(focalPoint.y) },
            altOverride: typeof item.altOverride === 'string' ? item.altOverride : '',
            decorative: !!item.decorative,
        };

        // Only Contain is stored; the focal point is kept either way, for Cover.
        if (getImageFit(item) === 'contain') {
            image.fit = 'contain';
        }

        // Kept through Cover too, so switching back to Contain restores it.
        if (!getContainBackground(item)) {
            image.containBackground = false;
        }

        images.push(image);
        mobileImages.push(normalizeMobileImage(rawMobile[rawIndex]));
    }

    return { images, mobileImages };
};

/**
 * The stored form of the mobile list: `{}` where a slot has no replacement
 * (an object, so the attribute's `items` schema holds), trailing gaps trimmed.
 *
 * @param {Array<Object|null>} mobileImages Normalized, aligned list.
 * @return {Object[]} Value for the `mobileImages` attribute.
 */
export const toStoredMobileImages = (mobileImages) => {
    const stored = mobileImages.map((item) => (item ? { id: item.id, url: item.url } : {}));

    while (stored.length && !stored[stored.length - 1].id && !stored[stored.length - 1].url) {
        stored.pop();
    }

    return stored;
};

/**
 * Which presentation actually renders for this many usable images.
 *
 * @param {*}      presentation The saved `presentation` attribute.
 * @param {number} imageCount   Usable images.
 * @return {Object} presentation (saved, validated, or its fallback where this build does not offer it), layout (rendered), slotCount, stage.
 */
export const resolveLayout = (presentation, imageCount) => {
    const saved = resolveChoice(presentation, PRESENTATIONS, VALUE_FALLBACKS.presentation, 'single');
    const layout = imageCount >= PRESENTATION_SLOTS[saved][0] ? saved : 'single';

    return {
        presentation: saved,
        layout,
        slotCount: Math.min(imageCount, PRESENTATION_SLOTS[layout][1]),
        stage: COMPOSED_LAYOUTS.includes(layout) ? 'composed' : 'backdrop',
    };
};

/**
 * The effective composition settings for a rendered layout, or null for
 * single, which has none.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} layout     Rendered layout.
 * @return {Object|null} ratio, shadow and every key of COMPOSITION_RANGES.
 */
export const resolveComposition = (attributes, layout) => {
    const defaults = COMPOSITION_DEFAULTS[layout];

    if (!defaults) {
        return null;
    }

    const composition = {
        ratio: SPLIT_RATIOS.includes(attributes.splitRatio) ? attributes.splitRatio : '50-50',
        shadow: SHADOWS.includes(attributes.cardShadow) ? attributes.cardShadow : defaults.shadow,
    };

    Object.keys(COMPOSITION_RANGES).forEach((key) => {
        const range = COMPOSITION_RANGES[key];
        composition[key] = clampStep(attributes[range.attribute], range, defaults[key]);
    });

    return composition;
};

/**
 * The composed stage's semantic settings, or null for a backdrop stage, which
 * has none.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} stage      Rendered stage.
 * @return {Object|null} Every key of STAGE_SETTINGS.
 */
export const resolveStage = (attributes, stage) => {
    if (stage !== 'composed') {
        return null;
    }

    const settings = {};

    Object.keys(STAGE_SETTINGS).forEach((key) => {
        const [attribute, values, fallback] = STAGE_SETTINGS[key];
        settings[key] = resolveChoice(attributes[attribute], values, VALUE_FALLBACKS[attribute], fallback);
    });

    return settings;
};

/**
 * The alpha of a custom CSS colour as core stores it (hex, rgb[a](), hsl[a](),
 * `transparent`); 1 when it cannot be read. Mirrors kinetichub_ih_color_alpha().
 *
 * @param {*} color Raw colour.
 * @return {number} 0..1.
 */
export const colorAlpha = (color) => {
    const value = typeof color === 'string' ? color.trim().toLowerCase() : '';

    if (value === 'transparent') {
        return 0;
    }

    let match = value.match(/^#(?:[0-9a-f]{3}([0-9a-f])|[0-9a-f]{6}([0-9a-f]{2}))$/);

    if (match) {
        return match[1] !== undefined ? parseInt(match[1], 16) / 15 : parseInt(match[2], 16) / 255;
    }

    match = value.match(/^(?:rgba?|hsla?)\((.*)\)$/);

    if (match) {
        const parts = match[1].split(/\s*[,/]\s*|\s+/).filter(Boolean);

        if (parts.length === 4) {
            const alpha = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);

            return Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 1;
        }
    }

    return 1;
};

/**
 * Whether the native Background makes the section see-through: a custom
 * colour under half opacity. A palette colour, or none (the stylesheet's
 * own dark default), is opaque. Mirrors render.php.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} See-through.
 */
export const isClearSurface = (attributes) => {
    const background = attributes.style && attributes.style.color ? attributes.style.color.background : undefined;

    return !attributes.backgroundColor && typeof background === 'string' && colorAlpha(background) < 0.5;
};

/**
 * The scene backdrop actually drawn: every value on a composed stage, only
 * Vignette on a backdrop stage, none without images.
 *
 * @param {Object} attributes Block attributes.
 * @param {Object} hero       Resolved layout (slotCount, stage, stageSettings).
 * @return {string} Scene backdrop.
 */
export const resolveScene = (attributes, hero) => {
    if (hero.slotCount === 0) {
        return 'none';
    }

    if (hero.stageSettings) {
        return hero.stageSettings.scene;
    }

    return resolveChoice(attributes.sceneBackdrop, BACKDROP_STAGE_SCENES, VALUE_FALLBACKS.sceneBackdrop, 'none');
};

/**
 * Motion, reveal and Smart Addons as they will actually run. A hero without
 * images has none of them.
 *
 * @param {Object} attributes Block attributes.
 * @param {Object} hero       Resolved layout (slotCount, layout, stage, stageSettings).
 * @return {Object} mode, hover, scroll, intensity, reveal, stagger, addons.
 */
export const resolveMotion = (attributes, hero) => {
    const hasMedia = hero.slotCount > 0;
    const mode = hasMedia ? resolveChoice(attributes.motionMode, MOTION_MODES, VALUE_FALLBACKS.motionMode, 'none') : 'none';
    const motion = {
        mode,
        hover: mode === 'hover' || mode === 'scroll-hover',
        scroll: mode === 'scroll' || mode === 'scroll-hover',
        intensity: resolveChoice(attributes.motionIntensity, MOTION_INTENSITIES, VALUE_FALLBACKS.motionIntensity, 'medium'),
        reveal: hasMedia ? resolveChoice(attributes.revealStyle, REVEAL_STYLES, VALUE_FALLBACKS.revealStyle, 'none') : 'none',
        addons: {},
    };

    // Off where Stagger Images is not offered; the saved value is kept either way.
    motion.stagger = false;
    

    SMART_ADDONS.forEach(([attribute, , family, applies]) => {
        motion.addons[attribute] = hasMedia
            && attributes[attribute] === true
            && (family === null || motion[family])
            && applies(hero);
    });

    return motion;
};

/**
 * The content and button design settings as they render. They apply with or
 * without images. The entrance timing only exists with an entrance.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Every key of CONTENT_SETTINGS, plus maxWidth for a custom width.
 */
export const resolveContent = (attributes) => {
    const content = {};

    Object.keys(CONTENT_SETTINGS).forEach((key) => {
        const [attribute, values, fallback] = CONTENT_SETTINGS[key];
        content[key] = values.includes(attributes[attribute]) ? attributes[attribute] : fallback;
    });

    if (content['content-in'] === 'none') {
        content['content-delay'] = 'none';
    }

    content.maxWidth = clampStep(attributes.contentMaxWidth, CONTENT_WIDTH_RANGE, CONTENT_WIDTH_RANGE.fallback);

    return content;
};

/**
 * One button's style as the Inspector shows it, and whether it was chosen.
 *
 * @param {Object} attributes Block attributes.
 * @param {number} index      1 or 2.
 * @return {Object} variant, chosen, icon.
 */
export const resolveCta = (attributes, index) => {
    const saved = attributes[`cta${index}Variant`];
    const chosen = CTA_VARIANTS.includes(saved);
    const icon = attributes[`cta${index}Icon`];

    return {
        variant: chosen ? saved : CTA_DEFAULT_VARIANTS[index],
        chosen,
        icon: CTA_ICONS.includes(icon) ? icon : 'none',
    };
};

// Same class list, same order, as the button markup in render.php.
export const getCtaClassName = (attributes, index) => {
    const cta = resolveCta(attributes, index);

    return [
        'kh-ih-cta',
        index === 1 ? 'kh-ih-cta-primary' : 'kh-ih-cta-secondary',
        cta.chosen ? `kh-ih-cta-${cta.variant}` : '',
        cta.icon !== 'none' ? `kh-ih-cta-icon-${cta.icon}` : '',
    ].filter(Boolean).join(' ');
};

/**
 * Everything the section wrapper carries: the resolved state, its classes
 * (in render.php's order) and its custom properties.
 *
 * Alignment and visibility classes are left to the caller: the editor keeps a
 * hidden-on-device hero visible so it can still be edited.
 *
 * @param {Object} attributes Block attributes.
 * @param {number} imageCount Usable images.
 * @return {Object} Resolved hero.
 */
export const resolveHero = (attributes, imageCount) => {
    const hero = resolveLayout(attributes.presentation, imageCount);

    hero.contentX = CONTENT_X.includes(attributes.contentAlign) ? attributes.contentAlign : 'center';
    hero.contentY = CONTENT_Y.includes(attributes.contentVerticalAlign) ? attributes.contentVerticalAlign : 'center';
    hero.heightDesktop = clampHeight(attributes.heroHeightDesktop, 90);
    hero.heightMobile = clampHeight(attributes.heroHeightMobile, 80);
    hero.composition = resolveComposition(attributes, hero.layout);
    hero.stageSettings = resolveStage(attributes, hero.stage);
    hero.mobileComposition = MOBILE_COMPOSITIONS.includes(attributes.mobileComposition) ? attributes.mobileComposition : 'auto';
    hero.mobileOrder = MOBILE_ORDERS.includes(attributes.mobileOrder) ? attributes.mobileOrder : 'content-first';
    hero.scene = resolveScene(attributes, hero);
    hero.sceneIntensity = SCENE_INTENSITIES.includes(attributes.backdropIntensity) ? attributes.backdropIntensity : 'medium';
    hero.motion = resolveMotion(attributes, hero);
    hero.content = resolveContent(attributes);

    const { motion, content } = hero;

    hero.classNames = [
        'kh-ih-hero',
        `kh-ih-layout-${hero.layout}`,
        `kh-ih-stage-${hero.stage}`,
        hero.slotCount > 0 ? `kh-ih-slots-${hero.slotCount}` : '',
        `kh-ih-content-x-${hero.contentX}`,
        `kh-ih-content-y-${hero.contentY}`,
        hero.slotCount > 0 ? 'kh-ih-has-media' : 'kh-ih-no-media',
        hero.layout === 'split-duo' ? `kh-ih-ratio-${hero.composition.ratio}` : '',
        hero.composition ? `kh-ih-shadow-${hero.composition.shadow}` : '',
        ...Object.keys(STAGE_SETTINGS).map((key) => (hero.stageSettings ? `kh-ih-${key}-${hero.stageSettings[key]}` : '')),
        !hero.stageSettings && hero.scene !== 'none' ? `kh-ih-scene-${hero.scene}` : '',
        hero.scene !== 'none' ? `kh-ih-atmos-${hero.sceneIntensity}` : '',
        hero.slotCount > 1 ? `kh-ih-mobile-${hero.mobileComposition}` : '',
        hero.stage === 'composed' ? `kh-ih-mobile-${hero.mobileOrder}` : '',
        motion.mode !== 'none' ? `kh-ih-motion-${motion.mode}` : '',
        motion.mode !== 'none' ? `kh-ih-intensity-${motion.intensity}` : '',
        motion.reveal !== 'none' ? `kh-ih-reveal-${motion.reveal}` : '',
        motion.stagger ? 'kh-ih-stagger' : '',
        ...SMART_ADDONS.map(([attribute, suffix]) => (motion.addons[attribute] ? `kh-ih-addon-${suffix}` : '')),
        // Smart Readability fades into the section colour, so it needs to know when there is none.
        motion.addons.smartReadability && isClearSurface(attributes) ? 'kh-ih-surface-clear' : '',
        ...Object.keys(CONTENT_SETTINGS).map((key) => (content[key] !== CONTENT_SETTINGS[key][2] ? `kh-ih-${key}-${content[key]}` : '')),
    ].filter(Boolean);

    hero.style = {
        '--kh-ih-h-desk': String(hero.heightDesktop),
        '--kh-ih-h-mob': String(hero.heightMobile),
    };

    (COMPOSITION_VARS[hero.layout] || []).forEach((key) => {
        hero.style[`--kh-ih-${key}`] = formatNumber(hero.composition[key]);
    });

    if (content.width === 'custom') {
        hero.style['--kh-ih-content-w'] = formatNumber(content.maxWidth);
    }

    return hero;
};

// Same class list, same order, as the slot markup in render.php.
export const getSlotClassName = (index, hasMobileSource, fit = 'cover', containBackground = true) => [
    'kh-ih-slot',
    `kh-ih-slot-${index + 1}`,
    index === 0 ? 'is-primary' : '',
    hasMobileSource ? 'has-mobile-source' : '',
    fit === 'contain' ? 'is-fit-contain' : '',
    fit === 'contain' && !containBackground ? 'is-contain-transparent' : '',
].filter(Boolean).join(' ');
