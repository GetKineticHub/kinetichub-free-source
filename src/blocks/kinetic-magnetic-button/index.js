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
    TextControl
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

// Assuming these external components exist and are properly exported
import { KineticEntranceControls } from '../../components/EntranceControls';
import { KineticVisibilityControls } from '../../components/VisibilityControls';
import { KineticLinkControls } from '../../components/LinkControls';
import { KineticBorderControls } from '../../components/BorderControls';
import { KineticEditorNotice } from '../../components/EditorNotice';

import metadata from './block.json';

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

registerBlockType(metadata.name, {
    icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 11V8C5 4.13401 8.13401 1 12 1C15.866 1 19 4.13401 19 8V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <rect x="3" y="11" width="4" height="10" rx="1" fill="currentColor" />
            <rect x="17" y="11" width="4" height="10" rx="1" fill="currentColor" />
        </svg>
    ),

    edit: (props) => {
        const { attributes, setAttributes, isSelected } = props;

        const {
            text,
            isOutline,
            magneticStrength,
            magneticRange,
            textSeparation,
            hoverScale,
            hoverEffect,
            enablePulse,
            showIcon,
            showIconNormal,
            iconType,
            iconPosition,
            iconSize,
            mobileIconSize,
            showStatusIndicator,
            statusType,
            statusDotColor,
            badgeText,
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

        // Core logic aligned with render.php and view.js
        const activeBg = isOutline ? 'transparent' : (bgColor || 'var(--kh-accent, #10b981)');
        const activeText = isOutline ? (bgColor || 'var(--kh-accent, #10b981)') : (textColor || '#ffffff');
        const activeBorderColor = isOutline ? (bgColor || 'var(--kh-accent, #10b981)') : (borderColor || 'transparent');
        const activeBorderWidth = isOutline && borderWidth === 0 ? 2 : borderWidth;

        const activeBgHover = bgHoverColor || (isOutline ? (bgColor || 'var(--kh-accent, #10b981)') : activeBg);
        const activeTextHover = textHoverColor || (isOutline ? (textColor || '#ffffff') : activeText);
        const activeBorderHoverColor = borderHoverColor || activeBorderColor;

        const shadowBase = enableShadow && !isOutline
            ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor || 'rgba(0,0,0,0.1)'}`
            : 'none';

        const activeHoverShadow = enableShadow && !isOutline
            ? `${shadowHoverX}px ${shadowHoverY}px ${shadowHoverBlur}px ${shadowHoverSpread}px ${shadowHoverColor || 'rgba(0,0,0,0.15)'}`
            : 'none';

        const cssVars = {
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
            '--kh-mb-pulse': bgColor || 'var(--kh-accent, #10b981)'
        };

        const wrapperProps = useBlockProps({
            className: 'kh-mb-wrapper',
            style: { justifyContent: align || 'center' }
        });

        const btnClasses = [
            'kh-mb-button',
            glassmorphism && !isOutline ? 'is-glass' : '',
            enablePulse ? 'is-pulsing' : '',
            showIconNormal ? 'icon-always-visible' : '',
            
        ].filter(Boolean).join(' ');

        const renderStatus = () => {
            if (!showStatusIndicator) return null;

            switch (statusType) {
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
                            {badgeText || 'New'}
                        </span>
                    );
                case 'dot':
                default:
                    return <span className="kh-mb-status-dot" aria-hidden="true" />;
            }
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody title={<PanelTitle icon={colorsIcon} text={__('Colors & Styling', 'kinetichub')} />} initialOpen={true}>
                        <ToggleControl
                            label={__('Outline Mode (Transparent)', 'kinetichub')}
                            checked={isOutline}
                            onChange={(value) => setAttributes({ isOutline: value })}
                            help={__('Automatically converts the button to an outline style using the background color as the border.', 'kinetichub')}
                        />

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
                                            <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>
                                                {isOutline ? __('Primary Brand Color', 'kinetichub') : __('Background Color', 'kinetichub')}
                                            </p>
                                            <ColorPalette value={bgColor} onChange={(value) => setAttributes({ bgColor: value })} enableAlpha={true} />

                                            {!isOutline && (
                                                <>
                                                    <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '10px' }}>
                                                        {__('Text Color', 'kinetichub')}
                                                    </p>
                                                    <ColorPalette value={textColor} onChange={(value) => setAttributes({ textColor: value })} enableAlpha={true} />
                                                    <ToggleControl
                                                        label={__('Glassmorphism (Blur BG)', 'kinetichub')}
                                                        checked={glassmorphism}
                                                        onChange={(value) => setAttributes({ glassmorphism: value })}
                                                    />
                                                </>
                                            )}

                                            <ToggleControl
                                                label={__('Pulse Animation', 'kinetichub')}
                                                checked={enablePulse}
                                                onChange={(value) => setAttributes({ enablePulse: value })}
                                            />
                                        </>
                                    )}

                                    {tab.name === 'hover' && (
                                        <>
                                            <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>
                                                {__('Hover Background Override', 'kinetichub')}
                                            </p>
                                            <ColorPalette value={bgHoverColor} onChange={(value) => setAttributes({ bgHoverColor: value })} enableAlpha={true} />

                                            <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '10px' }}>
                                                {__('Hover Text Override', 'kinetichub')}
                                            </p>
                                            <ColorPalette value={textHoverColor} onChange={(value) => setAttributes({ textHoverColor: value })} enableAlpha={true} />

                                            <hr />

                                            
                                            <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '10px' }}>
                                                {__('This free build includes the core hover effect. Additional hover styles are not included in this build.', 'kinetichub')}
                                            </p>
                                            

                                            

                                            <ToggleControl
                                                label={__('Scale Up on Hover', 'kinetichub')}
                                                checked={hoverScale}
                                                onChange={(value) => setAttributes({ hoverScale: value })}
                                            />
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
                                label={__('Desktop Size', 'kinetichub')}
                                value={customFontSize}
                                onChange={(value) => setAttributes({ customFontSize: value })}
                                min={0}
                                max={100}
                            />
                            <RangeControl
                                label={__('Mobile Size', 'kinetichub')}
                                value={mobileFontSize}
                                onChange={(value) => setAttributes({ mobileFontSize: value })}
                                min={0}
                                max={100}
                                help={__('Leave blank to inherit desktop size.', 'kinetichub')}
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
                    </PanelBody>

                    <PanelBody title={<PanelTitle icon={contentIcon} text={__('Icons & Content', 'kinetichub')} />} initialOpen={false}>
                        <div>
                            <ToggleControl
                                label={__('Enable Icon', 'kinetichub')}
                                checked={showIcon}
                                onChange={(value) => setAttributes({ showIcon: value })}
                            />

                            {showIcon && (
                                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                    <SelectControl
                                        label={__('Icon Type', 'kinetichub')}
                                        value={iconType}
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
                                        onChange={(value) => setAttributes({ iconType: value })}
                                    />

                                    <SelectControl
                                        label={__('Position', 'kinetichub')}
                                        value={iconPosition}
                                        options={[
                                            { label: __('Right', 'kinetichub'), value: 'right' },
                                            { label: __('Left', 'kinetichub'), value: 'left' }
                                        ]}
                                        onChange={(value) => setAttributes({ iconPosition: value })}
                                    />

                                    <ToggleControl
                                        label={__('Always Visible', 'kinetichub')}
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
                                        label={__('Icon Size (Mobile)', 'kinetichub')}
                                        value={mobileIconSize}
                                        onChange={(value) => setAttributes({ mobileIconSize: value })}
                                        min={10}
                                        max={60}
                                    />
                                </div>
                            )}

                            <ToggleControl
                                label={__('Show Status Indicator', 'kinetichub')}
                                checked={showStatusIndicator}
                                onChange={(value) => setAttributes({ showStatusIndicator: value })}
                            />

                            {showStatusIndicator && (
                                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                    <SelectControl
                                        label={__('Indicator Type', 'kinetichub')}
                                        value={statusType}
                                        options={[
                                            { label: __('Static Dot', 'kinetichub'), value: 'dot' },
                                            { label: __('Live Radar Ring', 'kinetichub'), value: 'radar' },
                                            { label: __('AI Sparkles', 'kinetichub'), value: 'sparkles' },
                                            { label: __('Notification Badge', 'kinetichub'), value: 'badge' }
                                        ]}
                                        onChange={(value) => setAttributes({ statusType: value })}
                                    />

                                    {statusType === 'badge' ? (
                                        <>
                                            <TextControl
                                                label={__('Badge Text', 'kinetichub')}
                                                value={badgeText}
                                                onChange={(value) => setAttributes({ badgeText: value })}
                                            />
                                            <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '10px' }}>
                                                {__('Badge Background Color', 'kinetichub')}
                                            </p>
                                            <ColorPalette value={statusDotColor} onChange={(value) => setAttributes({ statusDotColor: value })} enableAlpha={true} />

                                            <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '10px' }}>
                                                {__('Badge Text Color', 'kinetichub')}
                                            </p>
                                            <ColorPalette value={badgeTextColor} onChange={(value) => setAttributes({ badgeTextColor: value })} enableAlpha={true} />
                                        </>
                                    ) : (
                                        <>
                                            <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '10px' }}>
                                                {__('Primary Accent Color', 'kinetichub')}
                                            </p>
                                            <ColorPalette value={statusDotColor} onChange={(value) => setAttributes({ statusDotColor: value })} enableAlpha={true} />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </PanelBody>

                    <PanelBody title={<PanelTitle icon={physicsIcon} text={__('Physics Engine', 'kinetichub')} />} initialOpen={false}>
                        <div>
                            <RangeControl
                                label={__('Magnetic Pull', 'kinetichub')}
                                value={magneticStrength}
                                onChange={(value) => setAttributes({ magneticStrength: value })}
                                min={0.1}
                                max={0.8}
                                step={0.1}
                            />

                            <RangeControl
                                label={__('Detection Range', 'kinetichub')}
                                value={magneticRange}
                                onChange={(value) => setAttributes({ magneticRange: value })}
                                min={20}
                                max={150}
                            />

                            <ToggleControl
                                label={__('3D Text Parallax', 'kinetichub')}
                                checked={textSeparation}
                                onChange={(value) => setAttributes({ textSeparation: value })}
                            />
                        </div>
                    </PanelBody>

                    {!isOutline && (
                        <PanelBody title={<PanelTitle icon={shadowIcon} text={__('Box Shadow / Glow', 'kinetichub')} />} initialOpen={false}>
                            <ToggleControl
                                label={__('Enable Shadow', 'kinetichub')}
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

                    <KineticLinkControls attributes={attributes} setAttributes={setAttributes} />

                    {!isOutline && (
                        <KineticBorderControls attributes={attributes} setAttributes={setAttributes} />
                    )}

                    

                    
                </InspectorControls>

                <div {...wrapperProps}>
                    <div
                        className={btnClasses}
                        style={cssVars}
                        data-effect={hoverEffect || 'none'}
                        data-strength={magneticStrength}
                        data-range={magneticRange}
                        data-parallax={textSeparation ? 'true' : 'false'}
                        data-scale={hoverScale ? 'true' : 'false'}
                    >
                        <span className="kh-mb-hitbox" aria-hidden="true" />
                        <span className="kh-mb-button-fx" aria-hidden="true" />

                        <span className="kh-mb-content-wrap" style={{ pointerEvents: 'auto' }}>
                            {renderStatus()}

                            {showIcon && iconPosition === 'left' && (
                                <span className="kh-mb-icon kh-mb-icon-left pos-left" aria-hidden="true">
                                    {renderIcon(iconType)}
                                </span>
                            )}

                            <RichText
                                tagName="span"
                                className="kh-mb-text-inner"
                                value={text}
                                onChange={(value) => setAttributes({ text: value })}
                                allowedFormats={['core/bold', 'core/italic']}
                                placeholder={__('Discover More', 'kinetichub')}
                            />

                            {showIcon && iconPosition === 'right' && (
                                <span className="kh-mb-icon kh-mb-icon-right pos-right" aria-hidden="true">
                                    {renderIcon(iconType)}
                                </span>
                            )}
                        </span>
                    </div>

                    {isSelected && <KineticEditorNotice />}
                </div>
            </>
        );
    },

    save: () => null
});
