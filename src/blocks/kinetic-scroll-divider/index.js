/**
 * Kinetic Scroll Divider - Editor Interface
 * Version: 1.0.2
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ColorPalette, ToggleControl, GradientPicker, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorNote, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';

import metadata from './block.json';

const dividerIcon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

/*
 * The curated center icons. kinetichub_sd_center_icon_svg() in render.php draws
 * the same shapes on the frontend, so keep the two lists in step.
 */
const CENTER_ICON_SHAPES = {
    diamond: <path d="M12 3 21 12 12 21 3 12Z" />,
    sparkle: <path d="M12 3c.6 4.8 4.2 8.4 9 9-4.8.6-8.4 4.2-9 9-.6-4.8-4.2-8.4-9-9 4.8-.6 8.4-4.2 9-9Z" />,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    dot: <circle cx="12" cy="12" r="4.5" fill="currentColor" />,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    chevron: <polyline points="6 9 12 15 18 9" />,
};

const renderCenterIcon = (icon) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {Object.prototype.hasOwnProperty.call(CENTER_ICON_SHAPES, icon) ? CENTER_ICON_SHAPES[icon] : CENTER_ICON_SHAPES.diamond}
    </svg>
);

registerBlockType(metadata.name, {
    icon: dividerIcon,
    edit: (props) => {
        const { attributes, setAttributes, isSelected } = props;
        const {
            lineColor, lineOpacity, thickness, widthPercent, duration,
            alignment, borderStyle, animStyle, visibility, spacingPreset,
            glowEffect, glowIntensity,
            maxWidthPx, triggerOffset, mobileBehavior, mobileWidthPercent,
            reducedMotionBehavior, glowColorMode, staticOnMobile,
            lineType, gradientColor, scrollTether, easingMode, opacityCurve,
            centerMode, centerIcon, centerIconSize, centerText, centerTextSize,
            centerTextUppercase, centerColor, centerGap,
            centerBadge, centerBadgeColor, centerBadgePadding, centerBadgeRadius
        } = attributes;

        /* --- Center element: mirrors render.php, where a text center without text stays the plain divider --- */
        const trimmedCenterText = typeof centerText === 'string' ? centerText.trim() : '';
        let editorCenterMode = ['icon', 'text'].includes(centerMode) ? centerMode : 'none';
        if (editorCenterMode === 'text' && trimmedCenterText === '') {
            editorCenterMode = 'none';
        }
        const hasCenter = editorCenterMode !== 'none';
        let editorCenterBadge = 'none';

        /* --- MASTER-safe editor variable defaults (FREE values) --- */
        let editorLineType = 'solid';
        let editorOpacityCurve = 'soft';
        let editorScrollTether = 'trigger';
        let editorEasingMode = 'smooth';
        let editorGlowIntensity = 'low';
        let editorGlowColorMode = 'same';
        let editorMobileBehavior = 'same';
        let editorReducedMotionBehavior = 'static';
        let editorStaticOnMobile = false;
        let editorMaxWidthPx = 0;
        let editorTriggerOffset = 0;

        

        const cssVars = {
            '--kh-div-c': lineColor || '#10b981',
            '--kh-div-o': lineOpacity,
            '--kh-div-h': `${thickness}px`,
            '--kh-div-w': `${widthPercent}%`,
            '--kh-div-dur': `${duration}s`,
        };

        

        // Same ranges and integer truncation as render.php, so the preview cannot drift from the frontend.
        const clampPx = (value, min, max, fallback) => Math.trunc(Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback)));

        if (hasCenter) {
            cssVars['--kh-div-center-gap'] = `${clampPx(centerGap, 0, 64, 16)}px`;
            cssVars['--kh-div-center-size'] = editorCenterMode === 'icon'
                ? `${clampPx(centerIconSize, 12, 64, 20)}px`
                : `${clampPx(centerTextSize, 11, 40, 14)}px`;
            if (centerColor) {
                cssVars['--kh-div-center-c'] = centerColor;
            }

            
        }

        const editorClasses = [
            'kh-scroll-divider-container',
            'is-animated',
            `align-${alignment}`,
            `anim-${animStyle}`,
            `style-${borderStyle}`,
            `space-${spacingPreset || 'normal'}`,
            `type-${editorLineType}`,
            `curve-${editorOpacityCurve}`,
            `vis-${visibility}`,
            `tether-${editorScrollTether}`,
            `easing-${editorEasingMode}`,
            glowEffect ? `has-glow glow-${editorGlowIntensity} glow-mode-${editorGlowColorMode}` : '',
            `mob-${editorMobileBehavior}`,
            editorStaticOnMobile ? 'mob-static' : '',
            `rm-${editorReducedMotionBehavior}`,
            hasCenter ? `has-center center-${editorCenterMode}` : '',
            hasCenter && editorCenterMode === 'text' && centerTextUppercase ? 'center-upper' : '',
            hasCenter && editorCenterBadge !== 'none' ? `center-badge-${editorCenterBadge}` : '',
            isSelected ? 'is-selected-in-editor' : '',
        ].filter(Boolean).join(' ');

        const blockProps = useBlockProps({
            className: editorClasses,
            style: cssVars
        });

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('🎨 Styling & Geometry', 'kinetichub')} initialOpen={true}>
                        
                        

                        {editorLineType !== 'gradient' && (
                            <div style={{ marginBottom: '15px' }}>
                                <p style={{ fontWeight: 'bold', marginTop: 0, marginBottom: '10px' }}>{__('Line Color', 'kinetichub')}</p>
                                <ColorPalette 
                                    value={lineColor} 
                                    onChange={(v) => setAttributes({ lineColor: v || '#10b981' })} 
                                />
                            </div>
                        )}
                        
                        <RangeControl label={__('Line Opacity', 'kinetichub')} value={lineOpacity} onChange={(v) => setAttributes({ lineOpacity: v })} min={0.1} max={1} step={0.1} />
                        <RangeControl label={__('Thickness (px)', 'kinetichub')} value={thickness} onChange={(v) => setAttributes({ thickness: v })} min={1} max={20} />
                        <RangeControl label={__('Width (%)', 'kinetichub')} value={widthPercent} onChange={(v) => setAttributes({ widthPercent: v })} min={10} max={100} />
                        
                        
                        
                        {/* The seat the width cap takes in PRO. The gradient it names is
                          * chosen at the top of the same panel, so both halves of what PRO
                          * adds to the line itself are found in one place. */}
                        <ProNote
                            text={__('Gradient line colors, and a maximum width in pixels that stops the divider growing past a set size on wide screens.', 'kinetichub')}
                        />
                        

                        <SelectControl 
                            label={labelWithHelp(__('Vertical Spacing', 'kinetichub'), __('A quick preset. For precise control use the native Padding option in the block sidebar — it overrides this preset.', 'kinetichub'))}
                            value={spacingPreset || 'normal'} 
                            options={[
                                { label: __('Tight', 'kinetichub'), value: 'tight' }, 
                                { label: __('Normal', 'kinetichub'), value: 'normal' }, 
                                { label: __('Spacious', 'kinetichub'), value: 'spacious' }
                            ]} 
                            onChange={(v) => setAttributes({ spacingPreset: v })} 
                        />
                        <SelectControl label={__('Alignment', 'kinetichub')} value={alignment} options={[{ label: __('Left', 'kinetichub'), value: 'left' }, { label: __('Center', 'kinetichub'), value: 'center' }, { label: __('Right', 'kinetichub'), value: 'right' }]} onChange={(v) => setAttributes({ alignment: v })} />
                        <SelectControl label={__('Border Style', 'kinetichub')} value={borderStyle} options={[{ label: __('Solid', 'kinetichub'), value: 'solid' }, { label: __('Dashed', 'kinetichub'), value: 'dashed' }, { label: __('Dotted', 'kinetichub'), value: 'dotted' }]} onChange={(v) => setAttributes({ borderStyle: v })} />
                    </PanelBody>

                    <PanelBody title={__('💠 Center Element', 'kinetichub')} initialOpen={false}>
                        <SelectControl
                            label={labelWithHelp(__('Center Element', 'kinetichub'), __('Breaks the line in the middle with a small icon or a short label, and the line draws around it. None keeps the plain divider.', 'kinetichub'))}
                            value={['icon', 'text'].includes(centerMode) ? centerMode : 'none'}
                            options={[
                                { label: __('None', 'kinetichub'), value: 'none' },
                                { label: __('Icon', 'kinetichub'), value: 'icon' },
                                { label: __('Text', 'kinetichub'), value: 'text' }
                            ]}
                            onChange={(v) => setAttributes(
                                // Start a text center with a word, so choosing Text shows something at once.
                                v === 'text' && trimmedCenterText === ''
                                    ? { centerMode: v, centerText: __('Section', 'kinetichub') }
                                    : { centerMode: v }
                            )}
                        />

                        {centerMode === 'icon' && (
                            <>
                                <SelectControl
                                    label={__('Icon', 'kinetichub')}
                                    value={centerIcon}
                                    options={[
                                        { label: __('Diamond', 'kinetichub'), value: 'diamond' },
                                        { label: __('Sparkle', 'kinetichub'), value: 'sparkle' },
                                        { label: __('Star', 'kinetichub'), value: 'star' },
                                        { label: __('Dot', 'kinetichub'), value: 'dot' },
                                        { label: __('Heart', 'kinetichub'), value: 'heart' },
                                        { label: __('Chevron Down', 'kinetichub'), value: 'chevron' }
                                    ]}
                                    onChange={(v) => setAttributes({ centerIcon: v })}
                                />
                                <RangeControl label={__('Icon Size (px)', 'kinetichub')} value={centerIconSize} onChange={(v) => setAttributes({ centerIconSize: v })} min={12} max={64} />
                            </>
                        )}

                        {centerMode === 'text' && (
                            <>
                                <TextControl
                                    label={__('Label', 'kinetichub')}
                                    help={__('A word or two reads best. Left empty, the divider shows its plain line.', 'kinetichub')}
                                    value={centerText}
                                    onChange={(v) => setAttributes({ centerText: v })}
                                />
                                <RangeControl label={__('Text Size (px)', 'kinetichub')} value={centerTextSize} onChange={(v) => setAttributes({ centerTextSize: v })} min={11} max={40} />
                                <ToggleControl label={__('Uppercase Letters', 'kinetichub')} checked={!!centerTextUppercase} onChange={(v) => setAttributes({ centerTextUppercase: v })} />
                            </>
                        )}

                        {(centerMode === 'icon' || centerMode === 'text') && (
                            <>
                                <div style={{ marginBottom: '15px' }}>
                                    <p style={{ fontWeight: 'bold', marginTop: 0, marginBottom: '10px' }}>{centerMode === 'icon' ? __('Icon Color', 'kinetichub') : __('Text Color', 'kinetichub')}</p>
                                    <ColorPalette
                                        value={centerColor}
                                        onChange={(v) => setAttributes({ centerColor: v || '' })}
                                    />
                                </div>
                                {!centerColor && (
                                    <InspectorNote
                                        text={centerMode === 'icon' && editorLineType !== 'gradient'
                                            ? __('Unset, the icon uses the line color.', 'kinetichub')
                                            : __('Unset, it uses the text color of the page.', 'kinetichub')}
                                    />
                                )}
                                <RangeControl
                                    label={labelWithHelp(__('Gap (px)', 'kinetichub'), __('The space between the center element and the line on each side.', 'kinetichub'))}
                                    value={centerGap}
                                    onChange={(v) => setAttributes({ centerGap: v })}
                                    min={0}
                                    max={64}
                                />

                                
                                
                                {/* Only once a center element is chosen, where the badge
                                  * controls would be: they style that element and nothing else. */}
                                <ProNote
                                    text={__('A badge behind the center element: a soft tinted fill or an outline ring, with its own color, padding and corner radius.', 'kinetichub')}
                                />
                                
                            </>
                        )}
                    </PanelBody>

                    <PanelBody title={__('🎬 Scroll Animation', 'kinetichub')} initialOpen={false}>
                        

                        <SelectControl label={labelWithHelp(__('Draw Animation', 'kinetichub'), __('The editor shows the finished line; the draw itself plays on the live frontend.', 'kinetichub'))} value={animStyle} options={[{ label: __('Draw from Center', 'kinetichub'), value: 'draw-center' }, { label: __('Draw from Left', 'kinetichub'), value: 'draw-left' }, { label: __('Draw from Right', 'kinetichub'), value: 'draw-right' }, { label: __('Fade In', 'kinetichub'), value: 'fade-in' }]} onChange={(v) => setAttributes({ animStyle: v })} />
                        
                        {editorScrollTether !== 'scrub' && (
                            <RangeControl label={__('Animation Duration (s)', 'kinetichub')} value={duration} onChange={(v) => setAttributes({ duration: v })} min={0.2} max={4} step={0.1} />
                        )}
                        
                        
                        
                        {/* Last in the panel either way: the easing, curve and offset
                          * controls sit here, and the engine mode they follow is the first
                          * thing this panel asks in PRO. */}
                        <ProNote
                            text={__('Scroll-tethered scrubbing that ties the draw to the scrollbar, easing and opacity curves, and a trigger offset that moves where the animation starts.', 'kinetichub')}
                        />
                        
                    </PanelBody>

                    <PanelBody title={__('✨ Glow Effects', 'kinetichub')} initialOpen={false}>
                        <ToggleControl label={__('Enable Neon Glow', 'kinetichub')} checked={glowEffect} onChange={(v) => setAttributes({ glowEffect: v })} />
                        {glowEffect && (
                            <>
                                
                                
                                {/* Only once the glow is switched on, where its two premium
                                  * controls would be. No stand-in control: a select offering the
                                  * value it already holds cannot do anything. */}
                                <ProNote
                                    text={__('Medium and High glow intensity, plus glow color modes — a white tint, or a soft mix with the line color.', 'kinetichub')}
                                />
                                
                            </>
                        )}
                    </PanelBody>

                    <PanelBody title={__('📱 Visibility & Mobile', 'kinetichub')} initialOpen={false}>
                        <SelectControl 
                            label={__('Device Visibility', 'kinetichub')} 
                            value={visibility} 
                            options={[
                                { label: __('All Devices', 'kinetichub'), value: 'all' },
                                { label: __('Desktop Only', 'kinetichub'), value: 'desktop' },
                                { label: __('Mobile Only', 'kinetichub'), value: 'mobile' }
                            ]} 
                            onChange={(v) => setAttributes({ visibility: v })} 
                        />

                        
                        
                        {/* After Device Visibility, which FREE keeps: everything PRO adds
                          * here is the same question asked on a smaller screen. */}
                        <ProNote
                            text={__('Mobile handling for the divider — thinner, shorter or hidden on small screens — a static mobile version with no draw animation, and control over what visitors who prefer reduced motion see.', 'kinetichub')}
                        />
                        
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps} style={{...blockProps.style, minHeight: '40px'}}>
                    {hasCenter ? (
                        <div className="kh-divider-split">
                            <div className="kh-divider-track kh-divider-track-start">
                                <div className="kh-divider-line"></div>
                            </div>
                            {editorCenterMode === 'icon' ? (
                                <span className="kh-divider-center kh-divider-center-icon">{renderCenterIcon(centerIcon)}</span>
                            ) : (
                                <span className="kh-divider-center kh-divider-center-text" dir="auto">{trimmedCenterText}</span>
                            )}
                            <div className="kh-divider-track kh-divider-track-end">
                                <div className="kh-divider-line"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="kh-divider-track" style={{ border: isSelected ? '1px dashed #cbd5e1' : 'none' }}>
                            <div className="kh-divider-line"></div>
                        </div>
                    )}
                </div>
            </>
        );
    },
    save: () => null
});
