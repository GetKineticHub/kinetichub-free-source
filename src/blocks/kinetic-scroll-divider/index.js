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

        

        const cssVars = {
            '--kh-div-c': lineColor || '#10b981',
            '--kh-div-o': lineOpacity,
            '--kh-div-h': `${thickness}px`,
            '--kh-div-w': `${widthPercent}%`,
            '--kh-div-dur': `${duration}s`,
        };

        

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
                        
                        

                        
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '10px' }}>
                            {__('Available in KineticHub Pro.', 'kinetichub')}
                        </p>
                        

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
                        
                        
                        
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                            {__('Available in KineticHub Pro.', 'kinetichub')}
                        </p>
                        

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
                        
                        
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginBottom: '10px' }}>
                            {__('Available in KineticHub Pro.', 'kinetichub')}
                        </p>
                        

                        <SelectControl label={__('Draw Animation', 'kinetichub')} value={animStyle} options={[{ label: __('Draw from Center', 'kinetichub'), value: 'draw-center' }, { label: __('Draw from Left', 'kinetichub'), value: 'draw-left' }, { label: __('Draw from Right', 'kinetichub'), value: 'draw-right' }, { label: __('Fade In', 'kinetichub'), value: 'fade-in' }]} onChange={(v) => setAttributes({ animStyle: v })} />
                        
                        {editorScrollTether !== 'scrub' && (
                            <RangeControl label={__('Animation Duration (s)', 'kinetichub')} value={duration} onChange={(v) => setAttributes({ duration: v })} min={0.2} max={4} step={0.1} />
                        )}
                        
                        
                        
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                            {__('Available in KineticHub Pro.', 'kinetichub')}
                        </p>
                        
                    </PanelBody>

                    <PanelBody title={__('✨ Glow Effects', 'kinetichub')} initialOpen={false}>
                        <ToggleControl label={__('Enable Neon Glow', 'kinetichub')} checked={glowEffect} onChange={(v) => setAttributes({ glowEffect: v })} />
                        {glowEffect && (
                            <>
                                
                                
                                <SelectControl label={__('Glow Intensity', 'kinetichub')} value={'low'} options={[{ label: __('Low', 'kinetichub'), value: 'low' }]} onChange={() => setAttributes({ glowIntensity: 'low' })} />
                                <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                                    {__('Available in KineticHub Pro.', 'kinetichub')}
                                </p>
                                
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

                        
                        
                        <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '10px' }}>
                            {__('Available in KineticHub Pro.', 'kinetichub')}
                        </p>
                        
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
