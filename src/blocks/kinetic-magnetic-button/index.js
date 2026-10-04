/**
 * Kinetic Magnetic Button - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor';
import {
    PanelBody,
    RangeControl,
    ToggleControl,
    ColorPalette,
    SelectControl,
    TabPanel,
    TextControl,
    Button
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

// Assuming these external components exist and are properly exported
import { KineticVisibilityControls } from '../../components/VisibilityControls';
import { KineticBorderControls } from '../../components/BorderControls';
import { KineticEditorNotice } from '../../components/EditorNotice';
import { InspectorHelp, InspectorNote, InspectorNotice, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';


import metadata from './block.json';
import {
    MAX_BUTTONS,
    getButtons,
    getGroupSettings,
    getStoredButton,
    isBlankLabel,
    addButton,
    duplicateButton,
    removeButton,
    moveButton,
    updateButton
} from './button-model';

/*
 * The most buttons an author can give one block: the largest entry this build
 * offers. Storage and the frontend still take MAX_BUTTONS, so a block saved
 * with more keeps and renders every one of them, and they can all still be
 * edited, moved and removed; only adding and duplicating stop here.
 */
const AUTHORED_BUTTON_LIMITS = [
    2,
    
];
const MAX_AUTHORED_BUTTONS = Math.max(...AUTHORED_BUTTON_LIMITS);

// --- SVG Icons ---
const colorsIcon = (
    <svg width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 10 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 16C6.68629 16 4 13.3137 4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10C16 13.3137 13.3137 16 10 16Z" fill="url(#paint0_linear)" />
        <circle cx="10" cy="7" r="1.5" fill="#FCA5A5" />
        <circle cx="13" cy="10" r="1.5" fill="#FCD34D" />
        <circle cx="10" cy="13" r="1.5" fill="#6EE7B7" />
        <circle cx="7" cy="10" r="1.5" fill="#93C5FD" />
        <defs>
            <linearGradient id="paint0_linear" x1="2" y1="2" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#EC4899" />
            </linearGradient>
        </defs>
    </svg>
);

const contentIcon = (
    <svg width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="M4 4C4 2.89543 4.89543 2 6 2H14C15.1046 2 16 2.89543 16 4V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V4Z" stroke="url(#paint1_linear)" strokeWidth="1.5" />
        <path d="M7 6H13" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 10H13" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 14H10" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="paint1_linear" x1="4" y1="2" x2="16" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
    </svg>
);

const physicsIcon = (
    <svg width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="M10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3Z" stroke="url(#paint2_linear)" strokeWidth="1.5" />
        <path d="M10 6V14" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 10H14" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="10" r="2" fill="#F472B6" />
        <defs>
            <linearGradient id="paint2_linear" x1="3" y1="3" x2="17" y2="17" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#F472B6" />
            </linearGradient>
        </defs>
    </svg>
);

const shadowIcon = (
    <svg width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C7.23858 2 5 4.23858 5 7C5 9.76142 7.23858 12 10 12C12.7614 12 15 9.76142 15 7C15 4.23858 12.7614 2 10 2Z" stroke="url(#paint3_linear)" strokeWidth="1.5" />
        <path d="M10 12V18" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 18H13" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 15H10.01" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
        <defs>
            <linearGradient id="paint3_linear" x1="5" y1="2" x2="15" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBBF24" />
                <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
        </defs>
    </svg>
);

const spacingIcon = (
    <svg width="20" height="20" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
        <line x1="12" y1="12" x2="21" y2="12" />
        <line x1="16" y1="8" x2="21" y2="12" />
        <line x1="16" y1="16" x2="21" y2="12" />
    </svg>
);

const PanelTitle = ({ icon, text }) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <span style={{ fontWeight: 500 }}>{text}</span>
    </span>
);

const renderIcon = (type) => {
    switch (type) {
        case 'play':
            return (
                <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            );
        case 'plus':
            return (
                <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            );
        case 'chevron':
            return (
                <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            );
        case 'download':
            return (
                <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            );
        case 'external':
            return (
                <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
            );
        case 'cart':
            return (
                <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
            );
        case 'check':
            return (
                <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            );
        case 'arrow':
        default:
            return (
                <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                </svg>
            );
    }
};

// --- Editor-only contrast helpers (do not affect saved markup) ---
const CONTRAST_MIN_RATIO = 4.5;

// Normalizes #RGB / #RRGGBB and simple rgb()/rgba() strings to {r,g,b,a}.
// Returns null for anything we can't safely reason about (CSS vars,
// transparent, gradients, empty strings, unsupported formats).
const kbNormalizeColorForContrast = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const color = value.trim();

    if (color === '') {
        return null;
    }

    const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
            hex = hex.split('').map((ch) => ch + ch).join('');
        }
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
            a: 1
        };
    }

    const rgbMatch = color.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+)\s*)?\)$/i);
    if (rgbMatch) {
        return {
            r: Math.min(255, parseInt(rgbMatch[1], 10)),
            g: Math.min(255, parseInt(rgbMatch[2], 10)),
            b: Math.min(255, parseInt(rgbMatch[3], 10)),
            a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
        };
    }

    // var(--...), transparent, gradients, named colors, etc. are unsupported.
    return null;
};

const kbRelativeLuminance = ({ r, g, b }) => {
    const channel = (raw) => {
        const srgb = raw / 255;
        return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

// Returns a contrast ratio (1-21) or null when either color is not a
// concrete, fully opaque color we can safely evaluate.
const kbGetContrastRatio = (colorA, colorB) => {
    const a = kbNormalizeColorForContrast(colorA);
    const b = kbNormalizeColorForContrast(colorB);

    if (!a || !b || a.a < 1 || b.a < 1) {
        return null;
    }

    const luminanceA = kbRelativeLuminance(a);
    const luminanceB = kbRelativeLuminance(b);
    const lighter = Math.max(luminanceA, luminanceB);
    const darker = Math.min(luminanceA, luminanceB);

    return (lighter + 0.05) / (darker + 0.05);
};

const buttonsIcon = (
    <svg width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <rect x="1.75" y="6.75" width="7.5" height="6.5" rx="3.25" stroke="url(#paint4_linear)" strokeWidth="1.5" />
        <rect x="10.75" y="6.75" width="7.5" height="6.5" rx="3.25" stroke="#6EE7B7" strokeWidth="1.5" />
        <defs>
            <linearGradient id="paint4_linear" x1="2" y1="6" x2="9" y2="14" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981" />
                <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
    </svg>
);

// A label's plain text for the button list: labels are RichText HTML (<strong>, <em>, entities).
const plainLabel = (html) => {
    if (typeof html !== 'string') {
        return '';
    }

    if (!/[<&]/.test(html)) {
        return html;
    }

    return new window.DOMParser().parseFromString(html, 'text/html').body.textContent || '';
};

const Edit = (props) => {
    const { attributes, setAttributes, isSelected } = props;

    const {
        magneticStrength,
        magneticRange,
        textSeparation,
        hoverScale,
        hoverEffect,
        showIconNormal,
        iconSize,
        mobileIconSize,
        statusDotColor,
        badgeTextColor,
        bgColor,
        textColor,
        bgHoverColor,
        textHoverColor,
        glassmorphism,
        ghostTextHover,
        neonGlow,
        borderWidth,
        borderColor,
        borderHoverColor,
        borderStyle,
        borderRadius,
        enableShadow,
        shadowColor,
        shadowX,
        shadowY,
        shadowBlur,
        shadowSpread,
        shadowHoverColor,
        shadowHoverX,
        shadowHoverY,
        shadowHoverBlur,
        shadowHoverSpread,
        paddingV,
        paddingH,
        customFontSize,
        mobileFontSize,
        align,
        stretchedLink
    } = attributes;

    /*
     * The buttons, through the model: Button 1 is the top-level attributes,
     * Buttons 2-4 the items in `buttons`. Reading never writes, so opening
     * or selecting a block leaves it exactly as saved; only the controls
     * below write, one setAttributes() patch per action.
     */
    const buttons = getButtons(attributes);
    const group = getGroupSettings(attributes);
    const count = buttons.length;

    // The button the Inspector edits: editor state, never saved. Button 1 unless another is chosen.
    const [selectedButton, setSelectedButton] = useState(0);
    const activeIndex = Math.min(selectedButton, count - 1);
    const active = buttons[activeIndex];
    const activeNumber = activeIndex + 1;
    const activeStored = getStoredButton(attributes, activeIndex);
    const storedText = (key) => (typeof activeStored[key] === 'string' ? activeStored[key] : '');

    // Shared settings are offered while at least one button uses them: the fill ones while a button is
    // filled (Solid or Soft), the text colour and shadow while one is Solid.
    const hasFilled = buttons.some((button) => button.buttonStyle !== 'outline');
    const hasSolid = buttons.some((button) => button.buttonStyle === 'solid');
    const hasOutline = buttons.some((button) => button.buttonStyle === 'outline');
    const allOutline = !hasFilled;

    // Core logic aligned with render.php and view.js; the style is per button.
    const getStyleColors = (buttonStyle) => {
        const isOutline = buttonStyle === 'outline';
        const isSoft = buttonStyle === 'soft';
        const brand = bgColor || 'var(--kh-accent, #10b981)';

        let activeBg = isOutline ? 'transparent' : brand;
        let activeText = isOutline ? brand : (textColor || '#ffffff');
        const activeBorderColor = isOutline ? brand : (borderColor || 'transparent');
        const activeBorderWidth = isOutline && borderWidth === 0 ? 2 : borderWidth;

        let activeBgHover = bgHoverColor || (isOutline ? brand : activeBg);
        let activeTextHover = textHoverColor || (isOutline ? (textColor || '#ffffff') : activeText);
        let activeBorderHoverColor = borderHoverColor || activeBorderColor;

        // Soft: a tint of the colour, the label in that colour shaded towards the text around the block (see render.php).
        if (isSoft) {
            activeBg = `color-mix(in srgb, ${brand} 14%, transparent)`;
            activeText = `color-mix(in srgb, ${brand} 56%, currentColor)`;
            activeBgHover = bgHoverColor || `color-mix(in srgb, ${brand} 12%, transparent)`;
            activeTextHover = bgHoverColor && textHoverColor ? textHoverColor : activeText;
        }

        // In a group the transparent default keeps an Outline or Soft border on hover (see render.php).
        if (group.isGroup && (isOutline || isSoft) && activeBorderHoverColor === 'transparent') {
            activeBorderHoverColor = activeBorderColor;
        }

        const shadowBase = enableShadow && !isOutline && !isSoft
            ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor || 'rgba(0,0,0,0.1)'}`
            : 'none';

        const activeHoverShadow = enableShadow && !isOutline && !isSoft
            ? `${shadowHoverX}px ${shadowHoverY}px ${shadowHoverBlur}px ${shadowHoverSpread}px ${shadowHoverColor || 'rgba(0,0,0,0.15)'}`
            : 'none';

        return {
            normalContrast: kbGetContrastRatio(activeBg, activeText),
            hoverContrast: kbGetContrastRatio(activeBgHover, activeTextHover),
            cssVars: {
                '--kh-mb-bg': activeBg,
                '--kh-mb-text': activeText,
                '--kh-mb-bg-hov': activeBgHover,
                '--kh-mb-text-hov': activeTextHover,
                '--kh-mb-bw': `${activeBorderWidth}px`,
                '--kh-mb-bc': activeBorderColor,
                '--kh-mb-bc-hov': activeBorderHoverColor,
                '--kh-mb-bs': borderStyle || 'solid',
                '--kh-mb-br': `${borderRadius}px`,
                '--kh-mb-pad-v': `${paddingV}px`,
                '--kh-mb-pad-h': `${paddingH}px`,
                '--kh-mb-shadow': shadowBase,
                '--kh-mb-shadow-hov': activeHoverShadow,
                '--kh-mb-dot': statusDotColor || 'var(--kh-accent, #10b981)',
                '--kh-mb-badge-txt': badgeTextColor || '#ffffff',
                '--kh-mb-font': customFontSize > 0 ? `${customFontSize}px` : 'inherit',
                '--kh-mb-font-mob': mobileFontSize > 0 ? `${mobileFontSize}px` : (customFontSize > 0 ? `${customFontSize}px` : 'inherit'),
                '--kh-mb-icon-sz': `${iconSize}px`,
                '--kh-mb-icon-sz-mob': mobileIconSize > 0 ? `${mobileIconSize}px` : `${iconSize}px`,
                '--kh-mb-range': `${magneticRange}px`,
                '--kh-mb-pulse': bgColor || 'var(--kh-accent, #10b981)',
                // Soft glows and ripples in the full colour (see render.php).
                ...(isSoft ? { '--kh-mb-glow': bgHoverColor || brand } : {})
            }
        };
    };

    const styleColors = {
        solid: getStyleColors('solid'),
        soft: getStyleColors('soft'),
        outline: getStyleColors('outline')
    };

    // Editor-only contrast warning, for each style in use. null ratio (CSS var/transparent/gradient/
    // unsupported, and Soft's mixed colours) never triggers a warning; only concrete, opaque colors do.
    const usedColors = [hasSolid ? styleColors.solid : null, hasOutline ? styleColors.outline : null].filter(Boolean);
    const hasLowNormalContrast = usedColors.some(({ normalContrast }) => normalContrast !== null && normalContrast < CONTRAST_MIN_RATIO);
    const hasLowHoverContrast = usedColors.some(({ hoverContrast }) => hoverContrast !== null && hoverContrast < CONTRAST_MIN_RATIO);

    const alignmentMap = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end'
    };
    const justify = alignmentMap[align] || 'center';

    const effectiveHoverScale = hoverEffect === 'lift-up' ? false : hoverScale;

    const wrapperProps = useBlockProps({
        className: 'kh-mb-wrapper',
        style: { flexWrap: 'wrap', justifyContent: justify }
    });

    const getButtonClasses = (button) => {
        const isOutlineButton = button.buttonStyle === 'outline';

        return [
            'kh-mb-button',
            group.isGroup ? `kh-mb-style-${button.buttonStyle}` : '',
            glassmorphism && !isOutlineButton ? 'is-glass' : '',
            button.enablePulse ? 'is-pulsing' : '',
            showIconNormal ? 'icon-always-visible' : '',
            
        ].filter(Boolean).join(' ');
    };

    const renderStatus = (button) => {
        if (!button.showStatusIndicator) return null;

        switch (button.statusType) {
            case 'radar':
                return <span className="kh-mb-status-radar" aria-hidden="true" />;
            case 'sparkles':
                return (
                    <span className="kh-mb-status-sparkles" aria-hidden="true">
                        <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                        </svg>
                    </span>
                );
            case 'badge':
                return (
                    <span className="kh-mb-status-badge">
                        {button.badgeText}
                    </span>
                );
            case 'dot':
            default:
                return <span className="kh-mb-status-dot" aria-hidden="true" />;
        }
    };

    // --- Button list operations: one model patch, one setAttributes() call each. ---
    const updateActive = (changes) => {
        const patch = updateButton(attributes, activeIndex, changes);
        if (patch) {
            setAttributes(patch);
        }
    };

    // Adding and duplicating stop at MAX_AUTHORED_BUTTONS; every other operation works on any stored button.
    const canAddButton = count < MAX_AUTHORED_BUTTONS;

    // A block saved with more buttons than can be added here is already past the limit, and keeps them all.
    let capNote = '';
    if (count > MAX_AUTHORED_BUTTONS) {
        capNote = sprintf(
            /* translators: 1: number of buttons in the block, 2: the most buttons that can be added. */
            __('This block has %1$d buttons. Every one stays on the page and can be edited, moved or removed; new buttons can be added up to %2$d.', 'kinetichub'),
            count,
            MAX_AUTHORED_BUTTONS
        );
    } else if (!canAddButton) {
        capNote = sprintf(
            /* translators: %d: the most buttons one block holds. */
            __('That is the most one block holds: %d buttons.', 'kinetichub'),
            MAX_AUTHORED_BUTTONS
        );
    }

    const onAddButton = () => {
        const patch = canAddButton ? addButton(attributes, { text: __('Learn More', 'kinetichub') }) : null;
        if (patch) {
            setAttributes(patch);
            setSelectedButton(count);
        }
    };

    const onDuplicateButton = (index) => {
        const patch = canAddButton ? duplicateButton(attributes, index) : null;
        if (patch) {
            setAttributes(patch);
            setSelectedButton(index + 1);
        }
    };

    // The selection stays on the same button; if that is the one removed, it moves to the button taking its place.
    const onRemoveButton = (index) => {
        const patch = removeButton(attributes, index);
        if (patch) {
            setAttributes(patch);
            setSelectedButton(activeIndex > index ? activeIndex - 1 : Math.min(activeIndex, count - 2));
        }
    };

    // The selection follows the button it was on, wherever the move takes it.
    const onMoveButton = (index, to) => {
        const patch = moveButton(attributes, index, to);
        if (patch) {
            setAttributes(patch);
            if (activeIndex === index) {
                setSelectedButton(to);
            } else if (activeIndex === to) {
                setSelectedButton(index);
            }
        }
    };

    const renderButton = (button, index) => {
        const style = { ...styleColors[button.buttonStyle].cssVars };

        // Editor only: the button the Inspector is editing, and an empty label that the site will not render.
        if (isSelected && count > 1 && index === activeIndex) {
            style.outline = '2px solid var(--wp-admin-theme-color, #3858e9)';
            style.outlineOffset = '4px';
        }
        if (!button.isPrimary && isBlankLabel(button.text)) {
            style.opacity = 0.6;
        }

        return (
            <div
                key={`button-${index}`}
                className={getButtonClasses(button)}
                style={style}
                data-effect={hoverEffect || 'none'}
                data-strength={magneticStrength}
                data-range={magneticRange}
                data-parallax={textSeparation ? 'true' : 'false'}
                data-scale={effectiveHoverScale ? 'true' : 'false'}
                onFocus={() => setSelectedButton(index)}
            >
                <span className="kh-mb-hitbox" aria-hidden="true" />
                <span className="kh-mb-button-fx" aria-hidden="true" />

                <span className="kh-mb-content-wrap" style={{ pointerEvents: 'auto' }}>
                    {renderStatus(button)}

                    {button.showIcon && button.iconPosition === 'left' && (
                        <span className="kh-mb-icon kh-mb-icon-left pos-left" aria-hidden="true">
                            {renderIcon(button.iconType)}
                        </span>
                    )}

                    {/* Button 1 keeps the unkeyed RichText it always had; the others need keys of their own for the editor's selection. */}
                    <RichText
                        identifier={index === 0 ? undefined : `buttons-${index}-text`}
                        tagName="span"
                        className="kh-mb-text-inner"
                        value={index === 0 ? attributes.text : button.text}
                        onChange={(value) => {
                            const patch = updateButton(attributes, index, { text: value });
                            if (patch) {
                                setAttributes(patch);
                            }
                        }}
                        allowedFormats={['core/bold', 'core/italic']}
                        placeholder={index === 0 ? __('Discover More', 'kinetichub') : __('Button text', 'kinetichub')}
                    />

                    {button.showIcon && button.iconPosition === 'right' && (
                        <span className="kh-mb-icon kh-mb-icon-right pos-right" aria-hidden="true">
                            {renderIcon(button.iconType)}
                        </span>
                    )}
                </span>
            </div>
        );
    };

    const hasIcon = buttons.some((button) => button.showIcon);
    const hasBadge = buttons.some((button) => button.showStatusIndicator && button.statusType === 'badge');
    const hasMarker = buttons.some((button) => button.showStatusIndicator && button.statusType !== 'badge');

    let statusColorLabel = __('Primary Accent Color', 'kinetichub');
    if (hasBadge) {
        statusColorLabel = hasMarker ? __('Status & Badge Color', 'kinetichub') : __('Badge Background Color', 'kinetichub');
    }

    return (
        <>
            <InspectorControls>
                <PanelBody title={<PanelTitle icon={buttonsIcon} text={__('Buttons', 'kinetichub')} />} initialOpen={true}>
                    <div role="group" aria-label={__('Buttons in this block', 'kinetichub')}>
                        {buttons.map((button, index) => {
                            const number = index + 1;
                            const isEmpty = !button.isPrimary && isBlankLabel(button.text);
                            const rowText = isEmpty ? __('Empty: not shown on the site', 'kinetichub') : plainLabel(button.text).trim();

                            return (
                                <div
                                    // Position is the identity: moving a button moves its data, not this row.
                                    key={`button-${index}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '4px', background: '#f0f0f0', borderRadius: '4px' }}
                                >
                                    <Button
                                        variant="tertiary"
                                        size="small"
                                        isPressed={index === activeIndex}
                                        onClick={() => setSelectedButton(index)}
                                        /* translators: 1: button position, 2: the button's label. */
                                        label={sprintf(__('Button %1$d: %2$s', 'kinetichub'), number, rowText)}
                                        showTooltip={false}
                                        style={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', gap: '6px' }}
                                    >
                                        <span aria-hidden="true" style={{ fontWeight: 600 }}>{number}</span>
                                        <span aria-hidden="true" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: isEmpty ? 'italic' : 'normal' }}>
                                            {rowText}
                                        </span>
                                    </Button>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                        <Button
                                            size="small"
                                            icon="arrow-up-alt2"
                                            /* translators: %d: button position. */
                                            label={sprintf(__('Move button %d up', 'kinetichub'), number)}
                                            disabled={index === 0}
                                            onClick={() => onMoveButton(index, index - 1)}
                                        />
                                        <Button
                                            size="small"
                                            icon="arrow-down-alt2"
                                            /* translators: %d: button position. */
                                            label={sprintf(__('Move button %d down', 'kinetichub'), number)}
                                            disabled={index === count - 1}
                                            onClick={() => onMoveButton(index, index + 1)}
                                        />
                                        <Button
                                            size="small"
                                            icon="admin-page"
                                            /* translators: %d: button position. */
                                            label={sprintf(__('Duplicate button %d', 'kinetichub'), number)}
                                            disabled={!canAddButton}
                                            onClick={() => onDuplicateButton(index)}
                                        />
                                        <Button
                                            size="small"
                                            icon="trash"
                                            isDestructive
                                            /* translators: %d: button position. */
                                            label={sprintf(__('Remove button %d', 'kinetichub'), number)}
                                            disabled={count <= 1}
                                            onClick={() => onRemoveButton(index)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Button
                        variant="secondary"
                        onClick={onAddButton}
                        disabled={!canAddButton}
                        style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
                    >
                        {__('Add button', 'kinetichub')}
                    </Button>

                    {!canAddButton && (
                        <div style={{ marginTop: '12px' }}>
                            <InspectorNote text={capNote} />
                        </div>
                    )}

                    {count > 1 && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                            <SelectControl
                                label={__('Layout', 'kinetichub')}
                                value={group.layout}
                                options={[
                                    { label: __('Row', 'kinetichub'), value: 'row' },
                                    { label: __('Column', 'kinetichub'), value: 'stack' }
                                ]}
                                onChange={(value) => setAttributes({ buttonLayout: value })}
                            />

                            <SelectControl
                                label={labelWithHelp(__('Alignment', 'kinetichub'), __('The block alignment, the same setting as the alignment button in the block toolbar. It lines a row up along the line and the buttons of a column across it.', 'kinetichub'))}
                                value={align || 'center'}
                                options={[
                                    { label: __('Left', 'kinetichub'), value: 'left' },
                                    { label: __('Center', 'kinetichub'), value: 'center' },
                                    { label: __('Right', 'kinetichub'), value: 'right' }
                                ]}
                                onChange={(value) => setAttributes({ align: value })}
                            />

                            <RangeControl
                                label={labelWithHelp(__('Gap', 'kinetichub'), __('Space between the buttons in pixels, both across a row and between lines or stacked buttons.', 'kinetichub'))}
                                value={group.gap}
                                onChange={(value) => setAttributes({ buttonGap: Number.isFinite(value) ? value : undefined })}
                                min={0}
                                max={48}
                            />

                            <SelectControl
                                label={labelWithHelp(__('On Mobile', 'kinetichub'), __('At 768px and under. Auto keeps the desktop layout, and a row still wraps when it runs out of room. Stack puts the buttons in a column. Full Width stacks them and stretches each one across the available width.', 'kinetichub'))}
                                value={group.mobileLayout}
                                options={[
                                    { label: __('Auto', 'kinetichub'), value: 'auto' },
                                    { label: __('Stack', 'kinetichub'), value: 'stack' },
                                    { label: __('Full Width', 'kinetichub'), value: 'full-width' }
                                ]}
                                onChange={(value) => setAttributes({ buttonMobileLayout: value })}
                            />
                        </div>
                    )}
                </PanelBody>

                <PanelBody
                    title={(
                        <PanelTitle
                            icon={contentIcon}
                            /* translators: %d: button position. */
                            text={count > 1 ? sprintf(__('Button %d', 'kinetichub'), activeNumber) : __('Button', 'kinetichub')}
                        />
                    )}
                    initialOpen={true}
                >
                    {count > 1 && (
                        <div style={{ paddingTop: '4px' }}>
                            <InspectorNote
                                /* translators: %d: button position. */
                                text={sprintf(__('These settings apply to Button %d only. Colours, sizes, icon and status styling, physics and effects in the panels below are shared by every button.', 'kinetichub'), activeNumber)}
                            />
                        </div>
                    )}

                    <SelectControl
                        label={labelWithHelp(__('Style', 'kinetichub'), __('Solid fills the button with the background colour. Soft is the quieter style for a secondary action: a light tint of that colour, with the label in the colour itself, shaded to stay readable on light and dark sections. Outline empties the fill and draws the border and the label in that colour instead; a border width of 0 is raised to 2px. The text colour and the shadow apply to Solid buttons, glassmorphism and the border settings to Solid and Soft, and each is hidden while no button uses it.', 'kinetichub'))}
                        value={active.buttonStyle}
                        options={[
                            { label: __('Solid', 'kinetichub'), value: 'solid' },
                            { label: __('Soft', 'kinetichub'), value: 'soft' },
                            { label: __('Outline', 'kinetichub'), value: 'outline' }
                        ]}
                        onChange={(value) => updateActive({ buttonStyle: value })}
                    />

                    <TextControl
                        label={__('Target URL', 'kinetichub')}
                        value={storedText('url')}
                        onChange={(value) => updateActive({ url: value })}
                        help={__('Enter https://…', 'kinetichub')}
                    />

                    {storedText('url') && (
                        <>
                            <ToggleControl
                                label={__('Open in New Tab', 'kinetichub')}
                                checked={active.openInNewTab}
                                onChange={(value) => updateActive({ openInNewTab: !!value })}
                            />

                            <TextControl
                                label={__('Rel (SEO)', 'kinetichub')}
                                value={storedText('linkRel')}
                                onChange={(value) => updateActive({ linkRel: value })}
                                help={__('e.g., nofollow, noopener', 'kinetichub')}
                            />

                            
                        </>
                    )}

                    <ToggleControl
                        label={__('Enable Icon', 'kinetichub')}
                        checked={active.showIcon}
                        onChange={(value) => updateActive({ showIcon: value })}
                    />

                    {active.showIcon && (
                        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                            <SelectControl
                                label={__('Icon Type', 'kinetichub')}
                                value={active.iconType}
                                options={[
                                    { label: __('Arrow Standard', 'kinetichub'), value: 'arrow' },
                                    { label: __('Chevron Elegant', 'kinetichub'), value: 'chevron' },
                                    { label: __('Play Video', 'kinetichub'), value: 'play' },
                                    { label: __('Plus Symbol', 'kinetichub'), value: 'plus' },
                                    { label: __('Download', 'kinetichub'), value: 'download' },
                                    { label: __('External Link', 'kinetichub'), value: 'external' },
                                    { label: __('Shopping Cart', 'kinetichub'), value: 'cart' },
                                    { label: __('Checkmark', 'kinetichub'), value: 'check' }
                                ]}
                                onChange={(value) => updateActive({ iconType: value })}
                            />

                            <SelectControl
                                label={__('Position', 'kinetichub')}
                                value={active.iconPosition}
                                options={[
                                    { label: __('Right', 'kinetichub'), value: 'right' },
                                    { label: __('Left', 'kinetichub'), value: 'left' }
                                ]}
                                onChange={(value) => updateActive({ iconPosition: value })}
                            />
                        </div>
                    )}

                    <ToggleControl
                        label={__('Show Status Indicator', 'kinetichub')}
                        checked={active.showStatusIndicator}
                        onChange={(value) => updateActive({ showStatusIndicator: value })}
                    />

                    {active.showStatusIndicator && (
                        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                            <SelectControl
                                label={__('Indicator Type', 'kinetichub')}
                                value={active.statusType}
                                options={[
                                    { label: __('Static Dot', 'kinetichub'), value: 'dot' },
                                    { label: __('Live Radar Ring', 'kinetichub'), value: 'radar' },
                                    { label: __('AI Sparkles', 'kinetichub'), value: 'sparkles' },
                                    { label: __('Notification Badge', 'kinetichub'), value: 'badge' }
                                ]}
                                onChange={(value) => updateActive({ statusType: value })}
                            />

                            {active.statusType === 'badge' && (
                                <TextControl
                                    label={__('Badge Text', 'kinetichub')}
                                    value={storedText('badgeText')}
                                    placeholder={__('New', 'kinetichub')}
                                    onChange={(value) => updateActive({ badgeText: value })}
                                />
                            )}
                        </div>
                    )}

                    <ToggleControl
                        label={labelWithHelp(__('Pulse Animation', 'kinetichub'), __('A ring that expands out of the button every two seconds to draw the eye, in the background colour. It is drawn as a box shadow, so it replaces the configured shadow for as long as it runs, and it stops while the pointer is over the button. Visitors who ask for reduced motion never see it.', 'kinetichub'))}
                        checked={active.enablePulse}
                        onChange={(value) => updateActive({ enablePulse: value })}
                    />
                </PanelBody>

                <PanelBody title={<PanelTitle icon={colorsIcon} text={__('Colors & Styling', 'kinetichub')} />} initialOpen={false}>
                    {hasLowNormalContrast && (
                        <InspectorNotice>
                            {__('Low contrast: normal button text may be hard to read. Aim for at least 4.5:1.', 'kinetichub')}
                        </InspectorNotice>
                    )}

                    {hasLowHoverContrast && (
                        <InspectorNotice>
                            {__('Low contrast: hover button text may be hard to read. Aim for at least 4.5:1.', 'kinetichub')}
                        </InspectorNotice>
                    )}

                    {hasSolid && (
                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                            <p style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                                {__('Accessible Presets', 'kinetichub')}
                            </p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => setAttributes({ bgColor: '#047857', textColor: '#ffffff' })}
                                >
                                    {__('Green / White', 'kinetichub')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => setAttributes({ bgColor: '#111827', textColor: '#ffffff' })}
                                >
                                    {__('Dark / White', 'kinetichub')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => setAttributes({ bgColor: '#ffffff', textColor: '#111827' })}
                                >
                                    {__('White / Dark', 'kinetichub')}
                                </Button>
                            </div>
                        </div>
                    )}

                    <TabPanel
                        className="kh-mb-tabs"
                        activeClass="is-active"
                        tabs={[
                            { name: 'normal', title: __('Normal', 'kinetichub') },
                            { name: 'hover', title: __('Hover', 'kinetichub') }
                        ]}
                    >
                        {(tab) => (
                            <div style={{ marginTop: '15px' }}>
                                {tab.name === 'normal' && (
                                    <>
                                        <p style={{ marginBottom: '5px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                            {allOutline ? __('Primary Brand Color', 'kinetichub') : __('Background Color', 'kinetichub')}
                                            <InspectorHelp
                                                label={allOutline ? __('Primary Brand Color', 'kinetichub') : __('Background Color', 'kinetichub')}
                                                text={__('One colour drives several parts of every button. It fills a Solid button, tints a Soft one and colours its label; on an Outline button it becomes the border and the label instead. It is also the colour of the pulse ring, whatever the style.', 'kinetichub')}
                                            />
                                        </p>
                                        <ColorPalette value={bgColor} onChange={(value) => setAttributes({ bgColor: value })} enableAlpha={true} />

                                        {hasSolid && (
                                            <>
                                                <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '10px' }}>
                                                    {__('Text Color', 'kinetichub')}
                                                </p>
                                                <ColorPalette value={textColor} onChange={(value) => setAttributes({ textColor: value })} enableAlpha={true} />
                                            </>
                                        )}

                                        {hasFilled && (
                                            <>
                                                <ToggleControl
                                                    label={labelWithHelp(__('Glassmorphism (Blur BG)', 'kinetichub'), __('Drops the solid fill and blurs whatever sits behind the button by 12px instead. The hover background override is not painted while this is on, so plan the hover state around the text and border colours.', 'kinetichub'))}
                                                    checked={glassmorphism}
                                                    onChange={(value) => setAttributes({ glassmorphism: value })}
                                                />
                                            </>
                                        )}
                                    </>
                                )}

                                {tab.name === 'hover' && (
                                    <>
                                        <p style={{ marginBottom: '5px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                            {__('Hover Background Override', 'kinetichub')}
                                            <InspectorHelp
                                                label={__('Hover Background Override', 'kinetichub')}
                                                text={__('Left empty, an outline button fills with its brand colour on hover and a solid button keeps its normal fill. The colour is painted by an overlay layer inside the button, which glassmorphism turns transparent, so the two do not combine.', 'kinetichub')}
                                            />
                                        </p>
                                        <ColorPalette value={bgHoverColor} onChange={(value) => setAttributes({ bgHoverColor: value })} enableAlpha={true} />

                                        <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '10px' }}>
                                            {__('Hover Text Override', 'kinetichub')}
                                        </p>
                                        <ColorPalette value={textHoverColor} onChange={(value) => setAttributes({ textHoverColor: value })} enableAlpha={true} />

                                        <hr />

                                        
                                        <ProNote
                                            text={__('Ten further hover treatments in place of the plain colour fade - a glass shine, four directional sweeps, a float, a tactile press, a sonar ripple, a glitch and an inner outline reveal - plus a neon glow that pulses around the button and a ghost mode that hollows the label out on hover.', 'kinetichub')}
                                        />
                                        

                                        

                                        {hoverEffect !== 'lift-up' && (
                                            <ToggleControl
                                                label={labelWithHelp(__('Scale Up on Hover', 'kinetichub'), __('Grows the button to 105% while the pointer is over it, and on keyboard focus as well. A press always dips it to 93%, whether this is on or not.', 'kinetichub'))}
                                                checked={hoverScale}
                                                onChange={(value) => setAttributes({ hoverScale: value })}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </TabPanel>
                </PanelBody>

                <PanelBody title={<PanelTitle icon={spacingIcon} text={__('Dimensions & Sizing', 'kinetichub')} />} initialOpen={false}>
                    <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                        <p style={{ marginTop: 0, fontWeight: 'bold', fontSize: '13px' }}>
                            {__('Font Size (Custom Override)', 'kinetichub')}
                        </p>
                        <RangeControl
                            label={labelWithHelp(__('Desktop Size', 'kinetichub'), __('Label size in pixels. 0 hands the size back to the theme.', 'kinetichub'))}
                            value={customFontSize}
                            onChange={(value) => setAttributes({ customFontSize: value })}
                            min={0}
                            max={100}
                        />
                        <RangeControl
                            label={labelWithHelp(__('Mobile Size', 'kinetichub'), __('Label size in pixels at 768px and under. 0 keeps the desktop size on small screens.', 'kinetichub'))}
                            value={mobileFontSize}
                            onChange={(value) => setAttributes({ mobileFontSize: value })}
                            min={0}
                            max={100}
                        />
                    </div>

                    <RangeControl
                        label={__('Top/Bottom Padding', 'kinetichub')}
                        value={paddingV}
                        onChange={(value) => setAttributes({ paddingV: value })}
                        min={0}
                        max={100}
                    />

                    <RangeControl
                        label={__('Left/Right Padding', 'kinetichub')}
                        value={paddingH}
                        onChange={(value) => setAttributes({ paddingH: value })}
                        min={0}
                        max={150}
                    />

                    
                    <ProNote
                        text={__('Per-device visibility for the button as well: show it on desktop and hide it at 768px and under, or the other way round, without keeping a second copy of the block.', 'kinetichub')}
                    />
                    
                </PanelBody>

                {(hasIcon || hasBadge || hasMarker) && (
                    <PanelBody title={<PanelTitle icon={contentIcon} text={__('Icons & Status', 'kinetichub')} />} initialOpen={false}>
                        {hasIcon && (
                            <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                <ToggleControl
                                    label={labelWithHelp(__('Always Visible', 'kinetichub'), __('By default the icon is hidden and slides into view only while the pointer is over the button. Turn this on to keep it in place at all times.', 'kinetichub'))}
                                    checked={showIconNormal}
                                    onChange={(value) => setAttributes({ showIconNormal: value })}
                                />

                                <hr />

                                <RangeControl
                                    label={__('Icon Size (Desktop)', 'kinetichub')}
                                    value={iconSize}
                                    onChange={(value) => setAttributes({ iconSize: value })}
                                    min={10}
                                    max={60}
                                />

                                <RangeControl
                                    label={labelWithHelp(__('Icon Size (Mobile)', 'kinetichub'), __('Applies at 768px and under, replacing the desktop icon size there.', 'kinetichub'))}
                                    value={mobileIconSize}
                                    onChange={(value) => setAttributes({ mobileIconSize: value })}
                                    min={10}
                                    max={60}
                                />
                            </div>
                        )}

                        {(hasBadge || hasMarker) && (
                            <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: 0 }}>
                                    {statusColorLabel}
                                </p>
                                <ColorPalette value={statusDotColor} onChange={(value) => setAttributes({ statusDotColor: value })} enableAlpha={true} />

                                {hasBadge && (
                                    <>
                                        <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '10px' }}>
                                            {__('Badge Text Color', 'kinetichub')}
                                        </p>
                                        <ColorPalette value={badgeTextColor} onChange={(value) => setAttributes({ badgeTextColor: value })} enableAlpha={true} />
                                    </>
                                )}
                            </div>
                        )}
                    </PanelBody>
                )}

                <PanelBody title={<PanelTitle icon={physicsIcon} text={__('Physics Engine', 'kinetichub')} />} initialOpen={false}>
                    <div>
                        <RangeControl
                            label={labelWithHelp(__('Magnetic Pull', 'kinetichub'), __('How much of the pointer offset the button copies while the pointer is over it: at 0.3 it moves three tenths of the way towards the cursor. Travel is capped at 30px in each direction whatever the value, so raising it makes the button reach that limit sooner rather than travel further.', 'kinetichub'))}
                            value={magneticStrength}
                            onChange={(value) => setAttributes({ magneticStrength: value })}
                            min={0.1}
                            max={0.8}
                            step={0.1}
                        />

                        <RangeControl
                            label={labelWithHelp(__('Detection Range', 'kinetichub'), __('How far the pull reaches in pixels, measured from the centre of the button and added to half its width. Past that distance the button settles back to rest. It does not attract the pointer from across the page: the pull only runs once the pointer is over the button.', 'kinetichub'))}
                            value={magneticRange}
                            onChange={(value) => setAttributes({ magneticRange: value })}
                            min={20}
                            max={150}
                        />

                        <ToggleControl
                            label={labelWithHelp(__('3D Text Parallax', 'kinetichub'), __('The label and icon drift as well, at roughly a third of the travel of the button itself, so the face reads as floating above the surface rather than painted on it.', 'kinetichub'))}
                            checked={textSeparation}
                            onChange={(value) => setAttributes({ textSeparation: value })}
                        />

                        
                        <ProNote
                            text={__('Motion on arrival as well: the button can fade, slide up or zoom in the first time it scrolls into view, with a delay of up to two seconds so a row of buttons can land one after another.', 'kinetichub')}
                        />
                        
                    </div>
                </PanelBody>

                {hasSolid && (
                    <PanelBody title={<PanelTitle icon={shadowIcon} text={__('Box Shadow / Glow', 'kinetichub')} />} initialOpen={false}>
                        <ToggleControl
                            label={labelWithHelp(__('Enable Shadow', 'kinetichub'), __('Draws the drop shadow beneath the Solid buttons from the colour and blur below; Soft and Outline buttons never cast one. The panel is only offered while at least one button is Solid, and the pulse animation replaces the shadow for as long as it is running.', 'kinetichub'))}
                            checked={enableShadow}
                            onChange={(value) => setAttributes({ enableShadow: value })}
                        />

                        {enableShadow && (
                            <div style={{ marginTop: '15px' }}>
                                <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>
                                    {__('Shadow Color', 'kinetichub')}
                                </p>
                                <ColorPalette value={shadowColor} onChange={(value) => setAttributes({ shadowColor: value })} enableAlpha={true} />

                                <RangeControl label={__('Blur', 'kinetichub')} value={shadowBlur} onChange={(value) => setAttributes({ shadowBlur: value })} min={0} max={100} />
                            </div>
                        )}
                    </PanelBody>
                )}

                {hasFilled && (
                    <KineticBorderControls attributes={attributes} setAttributes={setAttributes} />
                )}

                

                
            </InspectorControls>

            <div {...wrapperProps}>
                {/*
                  * Group markup mirrors the frontend's group wrapper (same
                  * classes and variables, so the same layout rules apply), one
                  * level down: this wrapper keeps its wrapping flex line for the
                  * notice lane below. A single Solid or Outline button renders
                  * straight into the wrapper exactly as before 1.2.0.
                  */}
                {group.isGroup ? (
                    <div
                        className={`kh-mb-group kh-mb-layout-${group.layout} kh-mb-mobile-${group.mobileLayout}`}
                        style={{ '--kh-mb-gap': `${group.gap}px`, '--kh-mb-align': justify, justifyContent: justify, flex: '0 0 100%', minWidth: 0 }}
                    >
                        {buttons.map(renderButton)}
                    </div>
                ) : renderButton(buttons[0], 0)}

                {/*
                  * .kh-mb-wrapper is a flex row exactly as tall as the button,
                  * so a toast anchored straight to it lands across the button's
                  * own right-hand half -- over the label, and over the icon when
                  * one is on the right.
                  *
                  * This lane is a full-width second flex line beneath the
                  * button, which is what the wrapper's flex-wrap is for. It has
                  * real flow height, the button's alignment is untouched because
                  * justify-content still applies to the button's own line, and
                  * nothing of the button sits underneath the toast.
                  *
                  * Editor only: render.php emits the frontend button and never
                  * this element.
                  */}
                {isSelected && (
                    <div style={{ flex: '0 0 100%', position: 'relative', minHeight: '52px' }}>
                        <KineticEditorNotice message={__('Magnetic interaction and motion effects run on the live frontend.', 'kinetichub')} />
                    </div>
                )}
            </div>
        </>
    );
};

registerBlockType(metadata.name, {
    icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 11V8C5 4.13401 8.13401 1 12 1C15.866 1 19 4.13401 19 8V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <rect x="3" y="11" width="4" height="10" rx="1" fill="currentColor" />
            <rect x="17" y="11" width="4" height="10" rx="1" fill="currentColor" />
        </svg>
    ),

    edit: Edit,

    save: () => null
});
