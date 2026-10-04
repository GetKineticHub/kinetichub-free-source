/**
 * Kinetic Magnetic Button - Button Model
 *
 * One block renders up to four buttons. Button 1 is the block's own top-level
 * attributes, stored exactly as every button saved before 1.2.0 stores them;
 * Buttons 2-4 are plain objects in the `buttons` attribute, keyed by the same
 * names. Nothing is migrated and nothing is written on load: a block with no
 * additional button and no group attribute keeps rendering through the
 * single-button markup it always had.
 *
 * Reads normalize what is stored and never write it; malformed data degrades
 * to something renderable. The list operations return ONE attribute patch for
 * ONE setAttributes() call, never mutate what they are given, and keep every
 * key of an item they do not know. Shared settings (colours, borders, shadow,
 * physics, hover effects, entrance, visibility, ...) stay block-level and
 * never move with a button; the only block-level attributes an operation
 * writes are the group layout ones that removing down to one button clears.
 *
 * render.php implements the same normalization in PHP (kinetichub_mb_*); keep
 * the two in step. Where the stored value is loosely typed, both follow PHP's
 * empty() the way render.php always has, so the same JSON reads the same on
 * either side.
 *
 * No WordPress imports: plain data in, plain data out.
 */

// Button 1 plus up to three additional buttons.
export const MAX_BUTTONS = 4;

// Button 1 has always rendered this label when its text is empty.
export const PRIMARY_FALLBACK_TEXT = 'Discover More';
export const BADGE_FALLBACK_TEXT = 'New';

/*
 * Solid is the historical filled button and Outline the historical Outline
 * Mode. Soft is new in 1.2.0. Button 1 keeps Outline in its legacy `isOutline`
 * attribute and stores `buttonStyle` only for Soft (see getPrimaryStyle), so
 * a block that never chooses Soft rolls back to 1.1.0 unchanged.
 */
export const BUTTON_STYLES = ['solid', 'soft', 'outline'];

// An additional button with no valid style of its own.
export const ADDED_BUTTON_STYLE = 'outline';

export const ICON_TYPES = ['arrow', 'chevron', 'play', 'plus', 'download', 'external', 'cart', 'check'];
export const ICON_POSITIONS = ['left', 'right'];
export const STATUS_TYPES = ['dot', 'radar', 'sparkles', 'badge'];

// Group attributes. Unset (or invalid) they fall back to these defaults.
// Layout, mobile layout and gap only mean something with two or more buttons (see removeButton).
export const GROUP_LAYOUT_ATTRIBUTES = ['buttonLayout', 'buttonMobileLayout', 'buttonGap'];
export const BUTTON_LAYOUTS = ['row', 'stack'];
export const BUTTON_MOBILE_LAYOUTS = ['auto', 'stack', 'full-width'];
export const DEFAULT_BUTTON_GAP = 12;
export const MIN_BUTTON_GAP = 0;
export const MAX_BUTTON_GAP = 100;

/*
 * What each button carries for itself. On an item these are its keys; on
 * Button 1 each is the top-level attribute of the same name, except
 * buttonStyle, which Button 1 splits into isOutline + buttonStyle.
 */
export const BUTTON_KEYS = [
    'text',
    'url',
    'openInNewTab',
    'linkRel',
    'buttonStyle',
    'showIcon',
    'iconType',
    'iconPosition',
    'showStatusIndicator',
    'statusType',
    'badgeText',
    'enablePulse',
];

// The top-level attributes that make up Button 1: the only ones a list operation writes besides `buttons`.
export const PRIMARY_ATTRIBUTES = [
    'text',
    'url',
    'openInNewTab',
    'linkRel',
    'isOutline',
    'buttonStyle',
    'showIcon',
    'iconType',
    'iconPosition',
    'showStatusIndicator',
    'statusType',
    'badgeText',
    'enablePulse',
];

/**
 * PHP's empty() for a JSON value: null, false, 0, '', '0', [] and {} are empty.
 *
 * @param {*} value Stored value.
 * @return {boolean} Whether PHP's empty() is true for it.
 */
export const isEmptyValue = (value) => {
    if (value === undefined || value === null || value === false || value === 0 || value === '' || value === '0') {
        return true;
    }

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }

    return false;
};

/*
 * An item is any JSON object. Arrays count too: after PHP decodes the block
 * comment it cannot tell [] from {}, and core re-serializes an empty {} as []
 * in places, so render.php treats both as an (empty) item and so does this.
 */
const isItem = (value) => value !== null && typeof value === 'object';

const toText = (value) => (typeof value === 'string' ? value : '');
const oneOf = (list, value, fallback) => (list.includes(value) ? value : fallback);

const cloneValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(cloneValue);
    }

    if (isItem(value)) {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }

    return value;
};

// A new object: the item's own keys (every one, known or not) with `changes` applied; an undefined change removes the key.
const withChanges = (item, changes) => {
    const next = { ...item };

    Object.keys(changes).forEach((key) => {
        if (changes[key] === undefined) {
            delete next[key];
        } else {
            next[key] = changes[key];
        }
    });

    return next;
};

const storedButtons = (attributes) => (attributes && Array.isArray(attributes.buttons) ? attributes.buttons : []);

/**
 * The stored items that render as Buttons 2-4, with their position in `buttons`.
 * Entries that are not objects are skipped (and left where they are); items
 * past the fourth button stay stored but do not render.
 * Mirrors kinetichub_mb_button_items().
 *
 * @param {Object} attributes Block attributes.
 * @return {Array<{index: number, item: Object}>} At most MAX_BUTTONS - 1 entries.
 */
export const getButtonEntries = (attributes) => {
    const stored = storedButtons(attributes);
    const entries = [];

    for (let index = 0; index < stored.length && entries.length < MAX_BUTTONS - 1; index++) {
        if (isItem(stored[index])) {
            entries.push({ index, item: stored[index] });
        }
    }

    return entries;
};

export const getButtonCount = (attributes) => 1 + getButtonEntries(attributes).length;

/**
 * What is stored for one button, as stored: the block attributes for Button 1,
 * the item for an additional button. For fields that edit the stored value
 * (a URL field shows what was typed, not the '#' an empty URL renders as).
 *
 * @param {Object} attributes Block attributes.
 * @param {number} index      Button position, 0 for Button 1.
 * @return {Object} The stored source; an empty object for a position that does not exist.
 */
export const getStoredButton = (attributes, index) => {
    if (index === 0) {
        return isItem(attributes) ? attributes : {};
    }

    const entry = getButtonEntries(attributes)[index - 1];

    return entry ? entry.item : {};
};

/**
 * Button 1's style, from its legacy attributes.
 *
 * @param {Object} attributes Block attributes.
 * @return {string} 'soft', 'outline' or 'solid'.
 */
export const getPrimaryStyle = (attributes) => {
    const source = isItem(attributes) ? attributes : {};

    if (source.buttonStyle === 'soft') {
        return 'soft';
    }

    return isEmptyValue(source.isOutline) ? 'solid' : 'outline';
};

/**
 * One button's own settings, normalized. Button 1 is read from the top-level
 * attributes and keeps its historical label fallback; an additional button's
 * label is kept as stored, empty or not.
 * Mirrors kinetichub_mb_normalize_button().
 *
 * @param {*}       source    Block attributes (Button 1) or a stored item.
 * @param {boolean} isPrimary Whether this is Button 1.
 * @return {Object} isPrimary plus every BUTTON_KEYS entry.
 */
export const normalizeButton = (source, isPrimary) => {
    const stored = isItem(source) ? source : {};
    const text = toText(stored.text);
    const url = toText(stored.url);
    const linkRel = toText(stored.linkRel);
    const badgeText = toText(stored.badgeText);

    return {
        isPrimary: !!isPrimary,
        text: isPrimary && isEmptyValue(text) ? PRIMARY_FALLBACK_TEXT : text,
        url: isEmptyValue(url) ? '#' : url,
        openInNewTab: !isEmptyValue(stored.openInNewTab),
        linkRel: isEmptyValue(linkRel) ? '' : linkRel,
        buttonStyle: isPrimary ? getPrimaryStyle(stored) : oneOf(BUTTON_STYLES, stored.buttonStyle, ADDED_BUTTON_STYLE),
        showIcon: !isEmptyValue(stored.showIcon),
        iconType: oneOf(ICON_TYPES, stored.iconType, 'arrow'),
        iconPosition: oneOf(ICON_POSITIONS, stored.iconPosition, 'right'),
        showStatusIndicator: !isEmptyValue(stored.showStatusIndicator),
        statusType: oneOf(STATUS_TYPES, stored.statusType, 'dot'),
        badgeText: isEmptyValue(badgeText) ? BADGE_FALLBACK_TEXT : badgeText,
        enablePulse: !isEmptyValue(stored.enablePulse),
    };
};

/**
 * Every button of the block, in order: Button 1, then up to three items.
 * Mirrors kinetichub_mb_get_buttons().
 *
 * @param {Object} attributes Block attributes.
 * @return {Object[]} Normalized buttons (see normalizeButton), 1 to MAX_BUTTONS long.
 */
export const getButtons = (attributes) => [
    normalizeButton(attributes, true),
    ...getButtonEntries(attributes).map(({ item }) => normalizeButton(item, false)),
];

// Whitespace for the empty-label rule: ASCII whitespace and the no-break space.
const LABEL_WHITESPACE = /[ \t\n\r\f\v\u00a0]/g;

export const isBlankLabel = (text) => typeof text !== 'string' || text.replace(LABEL_WHITESPACE, '') === '';

/**
 * Whether the frontend renders this button. Button 1 always does (with its
 * fallback label); an additional button with an empty or whitespace-only
 * label does not, although it stays stored.
 * Mirrors kinetichub_mb_button_is_rendered().
 *
 * @param {Object} button A normalized button.
 * @return {boolean} Whether it renders.
 */
export const isButtonRendered = (button) => !!button && (button.isPrimary || !isBlankLabel(button.text));

export const getRenderedButtons = (attributes) => getButtons(attributes).filter(isButtonRendered);

/**
 * The block-level group settings, and whether the block renders group markup
 * at all. It does once there is an additional button, once Button 1 is Soft,
 * or once any group attribute holds a valid value; otherwise the block renders
 * the legacy single-button markup.
 * Mirrors kinetichub_mb_group_settings().
 *
 * @param {Object} attributes Block attributes.
 * @return {{count: number, isGroup: boolean, layout: string, mobileLayout: string, gap: number}} Settings.
 */
export const getGroupSettings = (attributes) => {
    const stored = isItem(attributes) ? attributes : {};
    const count = getButtonCount(stored);
    const hasLayout = BUTTON_LAYOUTS.includes(stored.buttonLayout);
    const hasMobileLayout = BUTTON_MOBILE_LAYOUTS.includes(stored.buttonMobileLayout);
    const hasGap = typeof stored.buttonGap === 'number' && Number.isFinite(stored.buttonGap);

    return {
        count,
        isGroup: count > 1 || stored.buttonStyle === 'soft' || hasLayout || hasMobileLayout || hasGap,
        layout: hasLayout ? stored.buttonLayout : 'row',
        mobileLayout: hasMobileLayout ? stored.buttonMobileLayout : 'auto',
        // Clamped, then rounded half up: the same float operations as PHP's floor( x + 0.5 ).
        gap: hasGap ? Math.floor(Math.min(MAX_BUTTON_GAP, Math.max(MIN_BUTTON_GAP, stored.buttonGap)) + 0.5) : DEFAULT_BUTTON_GAP,
    };
};

/**
 * The rel attribute a button renders with. A new-tab link lowercases the
 * tokens and adds noopener + noreferrer once each; otherwise rel is as given.
 * render.php sanitizes the stored value first (sanitize_text_field), then
 * applies this. Mirrors kinetichub_mb_resolve_rel().
 *
 * @param {string}  linkRel      Sanitized rel value.
 * @param {boolean} openInNewTab Whether the link opens in a new tab.
 * @return {string} The rel value; empty for none.
 */
export const resolveRel = (linkRel, openInNewTab) => {
    const rel = toText(linkRel);

    if (!openInNewTab) {
        return rel;
    }

    // ASCII-only lowercase and ASCII whitespace, as PHP's strtolower() and preg_split( '/\s+/' ).
    const tokens = rel
        .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
        .split(/[ \t\n\r\f\v]+/)
        .filter((token) => token !== '' && token !== '0');

    tokens.push('noopener', 'noreferrer');

    return [...new Set(tokens)].join(' ');
};

/**
 * Button 1 as an item: every per-button value it renders with, including its
 * fallback label, so it looks and reads the same wherever it moves.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} An item holding every BUTTON_KEYS entry.
 */
export const primaryToItem = (attributes) => {
    const button = normalizeButton(attributes, true);

    return Object.fromEntries(BUTTON_KEYS.map((key) => [key, button[key]]));
};

// Button 1's style attributes for a style; null for a value that is not a style.
const primaryStylePatch = (style) => {
    if (!BUTTON_STYLES.includes(style)) {
        return null;
    }

    return {
        isOutline: style === 'outline',
        buttonStyle: style === 'soft' ? 'soft' : undefined,
    };
};

/**
 * An item as Button 1's top-level attributes. Only BUTTON_KEYS can move there:
 * the top level has no place for an item's other keys, so a button promoted
 * to Button 1 leaves them behind.
 *
 * @param {Object} item A stored item.
 * @return {Object} A patch of PRIMARY_ATTRIBUTES.
 */
export const itemToPrimaryPatch = (item) => {
    const button = normalizeButton(item, false);
    const patch = {};

    BUTTON_KEYS.forEach((key) => {
        if (key !== 'buttonStyle') {
            patch[key] = button[key];
        }
    });

    return { ...patch, ...primaryStylePatch(button.buttonStyle) };
};

const isPosition = (attributes, index) => Number.isInteger(index) && index >= 0 && index < getButtonCount(attributes);

/**
 * Change one button's own settings.
 * Button 1: only BUTTON_KEYS are written, to the top-level attributes
 * (buttonStyle as isOutline/buttonStyle). An additional button: `changes` is
 * merged into the stored item, every other key of which is kept.
 *
 * @param {Object} attributes Block attributes.
 * @param {number} index      Button position, 0 for Button 1.
 * @param {Object} changes    Keys to set; an undefined value removes the key.
 * @return {Object|null} The patch, or null when there is nothing to change.
 */
export const updateButton = (attributes, index, changes) => {
    if (!isPosition(attributes, index) || !isItem(changes)) {
        return null;
    }

    if (index === 0) {
        const patch = {};

        BUTTON_KEYS.forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(changes, key)) {
                return;
            }

            if (key === 'buttonStyle') {
                Object.assign(patch, primaryStylePatch(changes.buttonStyle));
            } else {
                patch[key] = changes[key];
            }
        });

        return Object.keys(patch).length ? patch : null;
    }

    const entry = getButtonEntries(attributes)[index - 1];
    const buttons = storedButtons(attributes).slice();

    buttons[entry.index] = withChanges(entry.item, changes);

    return { buttons };
};

/**
 * Append a button.
 *
 * @param {Object} attributes Block attributes.
 * @param {Object} [item]     Settings for the new button, over an empty label and ADDED_BUTTON_STYLE.
 * @return {Object|null} The patch, or null at MAX_BUTTONS.
 */
export const addButton = (attributes, item = {}) => {
    if (getButtonCount(attributes) >= MAX_BUTTONS) {
        return null;
    }

    const created = withChanges({ text: '', buttonStyle: ADDED_BUTTON_STYLE }, isItem(item) ? item : {});

    return { buttons: [...storedButtons(attributes), created] };
};

/**
 * Duplicate a button, complete with its own content and style, right after it.
 *
 * @param {Object} attributes Block attributes.
 * @param {number} index      Button position, 0 for Button 1.
 * @return {Object|null} The patch, or null at MAX_BUTTONS or for a position that does not exist.
 */
export const duplicateButton = (attributes, index) => {
    if (!isPosition(attributes, index) || getButtonCount(attributes) >= MAX_BUTTONS) {
        return null;
    }

    const buttons = storedButtons(attributes).slice();

    if (index === 0) {
        // Ahead of every stored entry, so the copy is Button 2.
        buttons.unshift(primaryToItem(attributes));
    } else {
        const entry = getButtonEntries(attributes)[index - 1];

        buttons.splice(entry.index + 1, 0, cloneValue(entry.item));
    }

    return { buttons };
};

/**
 * Remove a button. Removing Button 1 promotes Button 2 into the top-level
 * attributes.
 *
 * When only Button 1 is left, the same patch clears the group layout
 * attributes as well: with one button they mean nothing, and left set they
 * would keep the block in group markup. A Solid or Outline button that is
 * left alone therefore renders the legacy single-button markup again. Button
 * 1's style is not touched: Soft is a style of its own, not a layout, so a
 * Soft button stays Soft (and in group markup).
 *
 * @param {Object} attributes Block attributes.
 * @param {number} index      Button position, 0 for Button 1.
 * @return {Object|null} The patch, or null for the last remaining button or a position that does not exist.
 */
export const removeButton = (attributes, index) => {
    if (!isPosition(attributes, index) || getButtonCount(attributes) <= 1) {
        return null;
    }

    const entries = getButtonEntries(attributes);
    const removed = entries[index === 0 ? 0 : index - 1];
    const buttons = storedButtons(attributes).filter((stored, position) => position !== removed.index);
    const patch = index === 0 ? { ...itemToPrimaryPatch(removed.item), buttons } : { buttons };

    if (getButtonCount({ buttons }) === 1) {
        GROUP_LAYOUT_ATTRIBUTES.forEach((key) => {
            if (attributes[key] !== undefined) {
                patch[key] = undefined;
            }
        });
    }

    return patch;
};

/**
 * Move a button to another position. Items move as they are stored, every key
 * included. A move that involves position 0 swaps data between the top-level
 * attributes and `buttons`: Button 1 is demoted as primaryToItem(), and the
 * item that takes its place is promoted as itemToPrimaryPatch().
 *
 * @param {Object} attributes Block attributes.
 * @param {number} from       Current position.
 * @param {number} to         New position.
 * @return {Object|null} The patch, or null when nothing moves.
 */
export const moveButton = (attributes, from, to) => {
    if (!isPosition(attributes, from) || !isPosition(attributes, to) || from === to) {
        return null;
    }

    const entries = getButtonEntries(attributes);
    // Position 0 is Button 1, which lives in the top-level attributes: null here.
    const order = [null, ...entries.map(({ item }) => item)];
    const [moved] = order.splice(from, 1);

    order.splice(to, 0, moved);

    const buttons = storedButtons(attributes).slice();

    // The items take the stored positions the buttons occupied, so anything else stored stays where it was.
    entries.forEach((entry, position) => {
        const item = order[position + 1];

        buttons[entry.index] = item === null ? primaryToItem(attributes) : item;
    });

    return order[0] === null ? { buttons } : { ...itemToPrimaryPatch(order[0]), buttons };
};
