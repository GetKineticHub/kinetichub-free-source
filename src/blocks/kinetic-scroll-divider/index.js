/**
 * Kinetic Scroll Divider - Editor Interface
 * Version: 1.0.2
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ColorPalette, ToggleControl, GradientPicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

const dividerIcon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

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
            lineType, gradientColor, scrollTether, easingMode, opacityCurve
        } = attributes;

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

        /* <fs_premium_only> */
        editorLineType = lineType || 'solid';
        editorOpacityCurve = opacityCurve || 'soft';
        editorScrollTether = scrollTether || 'trigger';
        editorEasingMode = easingMode || 'smooth';
        editorGlowIntensity = glowIntensity || 'low';
        editorGlowColorMode = glowColorMode || 'same';
        editorMobileBehavior = mobileBehavior || 'same';
        editorReducedMotionBehavior = reducedMotionBehavior || 'static';
        editorStaticOnMobile = staticOnMobile;
        editorMaxWidthPx = maxWidthPx || 0;
        editorTriggerOffset = triggerOffset || 0;
        /* </fs_premium_only> */

        const cssVars = {
            '--kh-div-c': lineColor || '#10b981',
            '--kh-div-o': lineOpacity,
            '--kh-div-h': `${thickness}px`,
            '--kh-div-w': `${widthPercent}%`,
            '--kh-div-dur': `${duration}s`,
        };

        /* <fs_premium_only> */
        if (editorLineType === 'gradient' && gradientColor) {
            cssVars['--kh-div-grad'] = gradientColor;
        }
        if (editorMaxWidthPx > 0) {
            cssVars['--kh-div-max-w'] = `${editorMaxWidthPx}px`;
        }
        if (editorTriggerOffset !== 0) {
            cssVars['--kh-div-offset'] = `${editorTriggerOffset}%`;
        }
        if (editorMobileBehavior === 'custom-shorter' && mobileWidthPercent) {
            cssVars['--kh-div-mob-w'] = `${mobileWidthPercent}%`;
        }
        /* </fs_premium_only> */

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
                        
                        {/* <fs_premium_only> */}
                        <div style={{ marginBottom: '15px' }}>
                            <SelectControl 
                                label={__('Color Mode', 'kinetichub')} 
                                value={lineType || 'solid'} 
                                options={[
                                    { label: __('Solid Color', 'kinetichub'), value: 'solid' },
                                    { label: __('Gradient', 'kinetichub'), value: 'gradient' }
                                ]} 
                                onChange={(v) => setAttributes({ lineType: v })} 
                            />
                        </div>

                        {editorLineType === 'gradient' && (
                            <div style={{ marginBottom: '15px' }}>
                                <p style={{ fontWeight: 'bold', marginTop: 0, marginBottom: '10px' }}>{__('Gradient Setup', 'kinetichub')}</p>
                                <GradientPicker
                                    value={gradientColor || 'linear-gradient(90deg, #10b981 0%, #047857 100%)'}
                                    onChange={(v) => setAttributes({ gradientColor: v })}
                                    gradients={[
                                        { name: __('Cosmic', 'kinetichub'), gradient: 'linear-gradient(90deg, #ff00cc 0%, #333399 100%)', slug: 'cosmic' },
                                        { name: __('Emerald', 'kinetichub'), gradient: 'linear-gradient(90deg, #10b981 0%, #047857 100%)', slug: 'emerald' },
                                        { name: __('Sunset', 'kinetichub'), gradient: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)', slug: 'sunset' }
                                    ]}
                                />
                            </div>
                        )}
                        {/* </fs_premium_only> */}

                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '10px' }}>
                            {__('Gradient colors are a PRO feature, removed from FREE builds.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}

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
                        
                        {/* <fs_premium_only> */}
                        <RangeControl label={__('Max Width Restriction (px)', 'kinetichub')} value={maxWidthPx} onChange={(v) => setAttributes({ maxWidthPx: v })} min={0} max={2000} />
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                            {__('Max Width Restriction is a PRO feature, removed from FREE builds.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}

                        <SelectControl 
                            label={__('Vertical Spacing', 'kinetichub')} 
                            value={spacingPreset || 'normal'} 
                            options={[
                                { label: __('Tight', 'kinetichub'), value: 'tight' }, 
                                { label: __('Normal', 'kinetichub'), value: 'normal' }, 
                                { label: __('Spacious', 'kinetichub'), value: 'spacious' }
                            ]} 
                            onChange={(v) => setAttributes({ spacingPreset: v })} 
                            help={__('Quick spacing preset. For precise control, use the native Padding option in the block sidebar — it overrides this preset.', 'kinetichub')}
                        />
                        <SelectControl label={__('Alignment', 'kinetichub')} value={alignment} options={[{ label: __('Left', 'kinetichub'), value: 'left' }, { label: __('Center', 'kinetichub'), value: 'center' }, { label: __('Right', 'kinetichub'), value: 'right' }]} onChange={(v) => setAttributes({ alignment: v })} />
                        <SelectControl label={__('Border Style', 'kinetichub')} value={borderStyle} options={[{ label: __('Solid', 'kinetichub'), value: 'solid' }, { label: __('Dashed', 'kinetichub'), value: 'dashed' }, { label: __('Dotted', 'kinetichub'), value: 'dotted' }]} onChange={(v) => setAttributes({ borderStyle: v })} />
                    </PanelBody>

                    <PanelBody title={__('🎬 Scroll Animation', 'kinetichub')} initialOpen={false}>
                        {/* <fs_premium_only> */}
                        <div style={{ marginBottom: '15px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                            <SelectControl 
                                label={__('Engine Mode', 'kinetichub')} 
                                value={scrollTether || 'trigger'} 
                                options={[
                                    { label: __('Trigger Once (Default)', 'kinetichub'), value: 'trigger' },
                                    { label: __('Tie to Scrollbar (Scrubbing)', 'kinetichub'), value: 'scrub' }
                                ]} 
                                onChange={(v) => setAttributes({ scrollTether: v })}
                            />
                        </div>
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '10px' }}>
                            {__('Scrubbing Engine Mode is a PRO feature, removed from FREE builds.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}

                        <SelectControl label={__('Draw Animation', 'kinetichub')} value={animStyle} options={[{ label: __('Draw from Center', 'kinetichub'), value: 'draw-center' }, { label: __('Draw from Left', 'kinetichub'), value: 'draw-left' }, { label: __('Draw from Right', 'kinetichub'), value: 'draw-right' }, { label: __('Fade In', 'kinetichub'), value: 'fade-in' }]} onChange={(v) => setAttributes({ animStyle: v })} />
                        
                        {editorScrollTether !== 'scrub' && (
                            <RangeControl label={__('Animation Duration (s)', 'kinetichub')} value={duration} onChange={(v) => setAttributes({ duration: v })} min={0.2} max={4} step={0.1} />
                        )}
                        
                        {/* <fs_premium_only> */}
                        <SelectControl 
                            label={__('Advanced Easing', 'kinetichub')} 
                            value={easingMode || 'smooth'} 
                            options={[
                                { label: __('Smooth (Ease Out)', 'kinetichub'), value: 'smooth' },
                                { label: __('Linear (Constant)', 'kinetichub'), value: 'linear' },
                                { label: __('Bouncy (Overshoot)', 'kinetichub'), value: 'bouncy' }
                            ]} 
                            onChange={(v) => setAttributes({ easingMode: v })} 
                        />
                        <SelectControl 
                            label={__('Opacity Curve', 'kinetichub')} 
                            value={opacityCurve || 'soft'} 
                            options={[
                                { label: __('Soft', 'kinetichub'), value: 'soft' },
                                { label: __('Linear', 'kinetichub'), value: 'linear' },
                                { label: __('Snappy', 'kinetichub'), value: 'snappy' }
                            ]} 
                            onChange={(v) => setAttributes({ opacityCurve: v })} 
                        />
                        <RangeControl label={__('Trigger Offset (%)', 'kinetichub')} value={triggerOffset} onChange={(v) => setAttributes({ triggerOffset: v })} min={-50} max={50} />
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                            {__('Advanced Easing, Opacity Curve, and Trigger Offset are PRO features, removed from FREE builds.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}
                    </PanelBody>

                    <PanelBody title={__('✨ Glow Effects', 'kinetichub')} initialOpen={false}>
                        <ToggleControl label={__('Enable Neon Glow', 'kinetichub')} checked={glowEffect} onChange={(v) => setAttributes({ glowEffect: v })} />
                        {glowEffect && (
                            <>
                                {/* <fs_premium_only> */}
                                <SelectControl label={__('Glow Intensity', 'kinetichub')} value={glowIntensity} options={[{ label: __('Low', 'kinetichub'), value: 'low' }, { label: __('Medium', 'kinetichub'), value: 'medium' }, { label: __('High', 'kinetichub'), value: 'high' }]} onChange={(v) => setAttributes({ glowIntensity: v })} />
                                <SelectControl label={__('Glow Color Mode', 'kinetichub')} value={glowColorMode} options={[{ label: __('Same as Line', 'kinetichub'), value: 'same' }, { label: __('White Tint', 'kinetichub'), value: 'white-tint' }, { label: __('Soft Mix', 'kinetichub'), value: 'soft-mix' }]} onChange={(v) => setAttributes({ glowColorMode: v })} />
                                {/* </fs_premium_only> */}
                                {/* <fs_free_only> */}
                                <SelectControl label={__('Glow Intensity', 'kinetichub')} value={'low'} options={[{ label: __('Low', 'kinetichub'), value: 'low' }]} onChange={() => setAttributes({ glowIntensity: 'low' })} />
                                <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                                    {__('Medium/High intensity and advanced glow color modes are PRO features, removed from FREE builds.', 'kinetichub')}
                                </p>
                                {/* </fs_free_only> */}
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

                        {/* <fs_premium_only> */}
                        <SelectControl 
                            label={__('Mobile Behavior', 'kinetichub')} 
                            value={mobileBehavior} 
                            options={[
                                { label: __('Same as Desktop', 'kinetichub'), value: 'same' },
                                { label: __('Thinner (1px)', 'kinetichub'), value: 'thinner' },
                                { label: __('Shorter (50%)', 'kinetichub'), value: 'shorter' },
                                { label: __('Custom Shorter', 'kinetichub'), value: 'custom-shorter' },
                                { label: __('Hide', 'kinetichub'), value: 'hide' }
                            ]} 
                            onChange={(v) => setAttributes({ mobileBehavior: v })} 
                        />

                        {mobileBehavior === 'custom-shorter' && (
                            <RangeControl label={__('Mobile Width (%)', 'kinetichub')} value={mobileWidthPercent} onChange={(v) => setAttributes({ mobileWidthPercent: v })} min={10} max={100} />
                        )}

                        <ToggleControl 
                            label={__('Static on Mobile', 'kinetichub')} 
                            checked={staticOnMobile} 
                            onChange={(v) => setAttributes({ staticOnMobile: v })} 
                            help={__('Instantly show divider on mobile without animation.', 'kinetichub')}
                        />

                        <SelectControl 
                            label={__('Reduced Motion Behavior', 'kinetichub')} 
                            value={reducedMotionBehavior} 
                            options={[
                                { label: __('Static (Show Immediately)', 'kinetichub'), value: 'static' },
                                { label: __('Fade In', 'kinetichub'), value: 'fade' },
                                { label: __('Hide', 'kinetichub'), value: 'hide' }
                            ]} 
                            onChange={(v) => setAttributes({ reducedMotionBehavior: v })} 
                        />
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '10px' }}>
                            {__('Mobile Behavior, Static on Mobile, and Reduced Motion Behavior are PRO features, removed from FREE builds.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps} style={{...blockProps.style, minHeight: '40px'}}>
                    <div className="kh-divider-track" style={{ border: isSelected ? '1px dashed #cbd5e1' : 'none' }}>
                        <div className="kh-divider-line"></div>
                    </div>
                </div>
            </>
        );
    },
    save: () => null
});
