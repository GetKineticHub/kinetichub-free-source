/**
 * Kinetic Before/After - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, MediaPlaceholder } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, TextControl, ColorPalette, SelectControl, Button, Placeholder } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { columns } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

import { KineticVisibilityControls } from '../../components/VisibilityControls';
import { KineticShadowControls } from '../../components/ShadowControls';
import { KineticEditorNotice } from '../../components/EditorNotice';

registerBlockType(metadata.name, {
    icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2"/>
            <path d="M9 12l-3-3m0 0l-3 3m3-3v12" transform="translate(4, -3) rotate(-90, 6, 12)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 12l3-3m0 0l3 3m-3-3v12" transform="translate(-4, -3) rotate(90, 18, 12)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),

    edit: (props) => {
        const { attributes, setAttributes, isSelected } = props;
        const { 
            beforeImage, afterImage, initialOffset, aspectRatio,
            /* <fs_premium_only> */
            orientation, mobileAspectRatio, transitionStyle, diagonalSlant, reverseReveal,
            handleStyle, pulseEffect, beforeFilter, blurIntensity,
            hoverSlide, magneticSnap, enableInertia,
            labelColor, labelBg,
            overlayColor, overlayOpacity,
            cursorBadge, cursorBadgeText, innerParallax, holdToPeek,
            hideLabelsMobile, introStyle,
            /* </fs_premium_only> */
            hoverZoom,
            dividerStyle, handleColor, handleIconColor, showLabels, beforeLabel, afterLabel,
            containerShadow, shadowStyle, forceFullWidth,
            afterFilter, afterBlurIntensity, afterOverlayColor, afterOverlayOpacity,
            clickToMove, autoPlayIntro, hideLabelsOnMove
        } = attributes;

        let isHoriz = true;
        /* <fs_premium_only> */
        isHoriz = orientation === 'horizontal';
        /* </fs_premium_only> */

        const safeOffset = Math.max(0, Math.min(100, initialOffset));

        let activeBeforeFilter = 'none';
        /* <fs_premium_only> */
        activeBeforeFilter = 'none';
        if (beforeFilter.includes('grayscale')) activeBeforeFilter = 'grayscale(100%)';
        else if (beforeFilter.includes('sepia')) activeBeforeFilter = 'sepia(100%)';
        else if (beforeFilter.includes('blur')) activeBeforeFilter = `blur(${blurIntensity}px)`;
        else if (beforeFilter.includes('invert')) activeBeforeFilter = 'invert(100%)';
        else if (beforeFilter.includes('contrast')) activeBeforeFilter = 'contrast(150%)';
        /* </fs_premium_only> */

        let activeAfterFilter = 'none';
        if (afterFilter.includes('grayscale')) activeAfterFilter = 'grayscale(100%)';
        else if (afterFilter.includes('sepia')) activeAfterFilter = 'sepia(100%)';
        else if (afterFilter.includes('blur')) activeAfterFilter = `blur(${afterBlurIntensity}px)`;
        else if (afterFilter.includes('invert')) activeAfterFilter = 'invert(100%)';
        else if (afterFilter.includes('contrast')) activeAfterFilter = 'contrast(150%)';

        let activeOverlayOpacity = 0;
        /* <fs_premium_only> */
        activeOverlayOpacity = beforeFilter === 'color' ? Math.max(0, Math.min(1, overlayOpacity)) : 0;
        /* </fs_premium_only> */
        const activeAfterOverlayOpacity = afterFilter === 'color' ? Math.max(0, Math.min(1, afterOverlayOpacity)) : 0;

        const dynamicStyles = useMemo(() => ({
            '--kh-ba-handle': handleColor,
            '--kh-ba-icon-c': handleIconColor, 
            '--kh-ba-label-c': '#ffffff',
            '--kh-ba-label-bg': 'rgba(0,0,0,0.5)',
            '--kh-ba-overlay-c': '#000000',
            /* <fs_premium_only> */
            '--kh-ba-label-c': labelColor,
            '--kh-ba-label-bg': labelBg,
            '--kh-ba-overlay-c': overlayColor,
            /* </fs_premium_only> */
            '--kh-ba-overlay-o': activeOverlayOpacity,
            '--kh-ba-a-overlay-c': afterOverlayColor,
            '--kh-ba-a-overlay-o': activeAfterOverlayOpacity,
            ...(aspectRatio !== 'auto' && { '--kh-ba-aspect': aspectRatio }),
            /* <fs_premium_only> */
            ...(mobileAspectRatio !== 'inherit' && { '--kh-ba-aspect-mobile': mobileAspectRatio })
            /* </fs_premium_only> */
        }), [handleColor, handleIconColor,
            /* <fs_premium_only> */
            labelColor, labelBg, overlayColor, mobileAspectRatio,
            /* </fs_premium_only> */
            activeOverlayOpacity, afterOverlayColor, activeAfterOverlayOpacity, aspectRatio]);

        let innerClasses = `kh-ba-inner ${aspectRatio !== 'auto' ? 'has-aspect-ratio' : ''}`;
        /* <fs_premium_only> */
        innerClasses = `kh-ba-inner ${mobileAspectRatio !== 'inherit' ? 'has-mobile-aspect' : ''} ${aspectRatio !== 'auto' ? 'has-aspect-ratio' : ''}`;
        /* </fs_premium_only> */

        const shadowClass = containerShadow ? `has-shadow shadow-${shadowStyle}` : '';
        let blockClassName = `kh-ba-container kh-ba-preview kh-ba-horizontal ${shadowClass} kh-ba-trans-slide kh-ba-handle-classic kh-ba-divider-${dividerStyle} ${hoverZoom ? 'has-hover-zoom' : ''} ${forceFullWidth ? 'is-forced-fullwidth' : ''}`;
        /* <fs_premium_only> */
        blockClassName = `kh-ba-container kh-ba-preview kh-ba-${orientation} ${shadowClass} kh-ba-trans-${transitionStyle} kh-ba-handle-${handleStyle} kh-ba-divider-${dividerStyle} ${hoverZoom ? 'has-hover-zoom' : ''} ${hideLabelsMobile ? 'hide-labels-mobile' : ''} ${forceFullWidth ? 'is-forced-fullwidth' : ''}`;
        /* </fs_premium_only> */
        const blockProps = useBlockProps({
            className: blockClassName,
            style: dynamicStyles
        });

        let layerStyle = {};
        const clipVal = 100 - safeOffset;
        layerStyle.clipPath = `inset(0 ${clipVal}% 0 0)`;
        /* <fs_premium_only> */
        if (transitionStyle === 'fade') {
            layerStyle.clipPath = 'none';
            layerStyle.opacity = reverseReveal ? (safeOffset / 100) : ((100 - safeOffset) / 100);
        } else if (transitionStyle === 'diagonal' && isHoriz) {
            const slantFallback = diagonalSlant || 15; 
            layerStyle.clipPath = reverseReveal 
                ? `polygon(calc(${safeOffset}% + ${slantFallback}%) 0, 100% 0, 100% 100%, calc(${safeOffset}% - ${slantFallback}%) 100%)`
                : `polygon(0 0, calc(${safeOffset}% + ${slantFallback}%) 0, calc(${safeOffset}% - ${slantFallback}%) 100%, 0 100%)`;
        } else if (isHoriz) {
            layerStyle.clipPath = reverseReveal ? `inset(0 0 0 ${safeOffset}%)` : `inset(0 ${clipVal}% 0 0)`;
        } else {
            layerStyle.clipPath = reverseReveal ? `inset(${safeOffset}% 0 0 0)` : `inset(0 0 ${clipVal}% 0)`;
        }
        /* </fs_premium_only> */

        let editorPulseEffect = 'none';
        /* <fs_premium_only> */
        editorPulseEffect = pulseEffect;
        /* </fs_premium_only> */

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('🖼️ Images & Filters', 'kinetichub')} initialOpen={true}>
                        {/* <fs_premium_only> */}
                        {beforeImage?.url && afterImage?.url && (
                            <Button variant="primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '20px' }}
                                onClick={() => {
                                    setAttributes({ beforeImage: afterImage, afterImage: beforeImage, beforeLabel: afterLabel, afterLabel: beforeLabel });
                                }}>
                                {__('🔄 Swap Before & After', 'kinetichub')}
                            </Button>
                        )}
                        {/* </fs_premium_only> */}
                        <p><strong>{__('Before Image', 'kinetichub')}</strong></p>
                        {!beforeImage?.url ? (
                            <MediaPlaceholder accept="image/*" onSelect={(m) => setAttributes({beforeImage: {url: m.url, alt: m.alt}})} allowedTypes={['image']} />
                        ) : (
                            <div style={{marginBottom:'10px'}}>
                                <img src={beforeImage.url} style={{maxHeight:'100px'}} alt="" /><br/>
                                <Button variant="secondary" onClick={() => setAttributes({beforeImage: null})}>{__('Remove', 'kinetichub')}</Button>
                            </div>
                        )}
                        <p><strong>{__('After Image', 'kinetichub')}</strong></p>
                        {!afterImage?.url ? (
                            <MediaPlaceholder accept="image/*" onSelect={(m) => setAttributes({afterImage: {url: m.url, alt: m.alt}})} allowedTypes={['image']} />
                        ) : (
                            <div>
                                <img src={afterImage.url} style={{maxHeight:'100px'}} alt="" /><br/>
                                <Button variant="secondary" onClick={() => setAttributes({afterImage: null})}>{__('Remove', 'kinetichub')}</Button>
                            </div>
                        )}
                        <hr/>
                        <SelectControl 
                            label={__('Image Ratio (Crop)', 'kinetichub')} 
                            value={aspectRatio} 
                            options={[
                                {label: __('Auto (Original)', 'kinetichub'), value:'auto'}, 
                                {label: __('16:9 (Widescreen)', 'kinetichub'), value:'16/9'}, 
                                {label: __('1:1 (Square)', 'kinetichub'), value:'1/1'}, 
                                {label: __('4:3 (Standard)', 'kinetichub'), value:'4/3'}, 
                                {label: __('3:4 (Portrait)', 'kinetichub'), value:'3/4'}
                            ]} 
                            onChange={(v) => setAttributes({ aspectRatio: v })}
                            help={__('Forces both images to same height. Auto preserves original.', 'kinetichub')}
                        />

                        <hr style={{margin: '20px 0'}} />

                        {/* <fs_premium_only> */}
                        <SelectControl 
                            label={__('Before Image Filter', 'kinetichub')} 
                            value={beforeFilter} 
                            options={[
                                {label: __('Color Overlay', 'kinetichub'), value:'color'},
                                {label: __('Grayscale', 'kinetichub'), value:'grayscale'}, 
                                {label: __('Sepia', 'kinetichub'), value:'sepia'}, 
                                {label: __('Blur', 'kinetichub'), value:'blur'},
                                {label: __('Invert Colors', 'kinetichub'), value:'invert'},
                                {label: __('High Contrast', 'kinetichub'), value:'contrast'},
                                {label: __('None', 'kinetichub'), value:'none'}
                            ]} 
                            onChange={(v) => setAttributes({ beforeFilter: v })}
                            help={__('Grayscale is classic for before/after comparisons.', 'kinetichub')}
                        />
                        {beforeFilter === 'blur' && (
                            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                <RangeControl 
                                    label={__('Blur Intensity (px)', 'kinetichub')} 
                                    value={blurIntensity} 
                                    onChange={(v) => setAttributes({ blurIntensity: v })} 
                                    min={1} max={20}
                                    help={__('Higher = more blur.', 'kinetichub')}
                                />
                            </div>
                        )}
                        {beforeFilter === 'color' && (
                            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                <ColorPalette value={overlayColor} enableAlpha={true} onChange={(v) => setAttributes({ overlayColor: v })} />
                                <RangeControl 
                                    label={__('Opacity', 'kinetichub')} 
                                    value={overlayOpacity} 
                                    onChange={(v) => setAttributes({ overlayOpacity: v })} 
                                    min={0} max={1} step={0.1}
                                    help={__('0 = transparent, 1 = fully opaque.', 'kinetichub')}
                                />
                            </div>
                        )}
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginTop: '8px' }}>
                            {__('Before image filter: None (original). Additional filters available in PRO.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}

                        <SelectControl 
                            label={__('After Image Filter', 'kinetichub')} 
                            value={afterFilter} 
                            options={[
                                {label: __('Color Overlay', 'kinetichub'), value:'color'},
                                {label: __('Grayscale', 'kinetichub'), value:'grayscale'}, 
                                {label: __('Sepia', 'kinetichub'), value:'sepia'}, 
                                {label: __('Blur', 'kinetichub'), value:'blur'},
                                {label: __('Invert Colors', 'kinetichub'), value:'invert'},
                                {label: __('High Contrast', 'kinetichub'), value:'contrast'},
                                {label: __('None', 'kinetichub'), value:'none'}
                            ]} 
                            onChange={(v) => setAttributes({ afterFilter: v })}
                            help={__('Apply different effects to after image.', 'kinetichub')}
                        />
                        {afterFilter === 'blur' && (
                            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                <RangeControl 
                                    label={__('Blur Intensity (px)', 'kinetichub')} 
                                    value={afterBlurIntensity} 
                                    onChange={(v) => setAttributes({ afterBlurIntensity: v })} 
                                    min={1} max={20}
                                    help={__('Useful for focus comparison effects.', 'kinetichub')}
                                />
                            </div>
                        )}
                        {afterFilter === 'color' && (
                            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                <ColorPalette value={afterOverlayColor} enableAlpha={true} onChange={(v) => setAttributes({ afterOverlayColor: v })} />
                                <RangeControl 
                                    label={__('Opacity', 'kinetichub')} 
                                    value={afterOverlayOpacity} 
                                    onChange={(v) => setAttributes({ afterOverlayOpacity: v })} 
                                    min={0} max={1} step={0.1}
                                    help={__('Darkens or tints the after image.', 'kinetichub')}
                                />
                            </div>
                        )}
                    </PanelBody>

                    {/* <fs_premium_only> */}
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <ToggleControl 
                            label={__('Inner Image Parallax', 'kinetichub')} 
                            checked={innerParallax} 
                            onChange={(v) => setAttributes({ innerParallax: v })} 
                            disabled={hoverZoom}
                            help={hoverZoom 
                                ? __('Conflicts with Hover Zoom. Disable it first.', 'kinetichub')
                                : __('Images shift slightly as slider moves, creating depth.', 'kinetichub')
                            }
                        />
                        <ToggleControl 
                            label={__('Hold-to-Peek UX', 'kinetichub')} 
                            checked={holdToPeek} 
                            onChange={(v) => setAttributes({ holdToPeek: v })} 
                            help={__('Slider snaps back when released. Quick before/after peeks.', 'kinetichub')}
                        />
                        <ToggleControl 
                            label={__('Action Cursor Badge', 'kinetichub')} 
                            checked={cursorBadge} 
                            onChange={(v) => setAttributes({ cursorBadge: v })} 
                            help={__('Floating label follows cursor. Guides users to interact.', 'kinetichub')}
                        />
                        {cursorBadge && <TextControl label={__('Badge Text', 'kinetichub')} value={cursorBadgeText} onChange={(v) => setAttributes({ cursorBadgeText: v })} help={__('Short text for cursor badge. E.g., "Slide", "Compare".', 'kinetichub')} />}
                    </PanelBody>
                    {/* </fs_premium_only> */}
                    {/* <fs_free_only> */}
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic' }}>
                            {__('Inner parallax, hold-to-peek, and cursor badge are available in PRO.', 'kinetichub')}
                        </p>
                    </PanelBody>
                    {/* </fs_free_only> */}

                    <PanelBody title={__('🚀 Engine & Transitions', 'kinetichub')} initialOpen={false}>
                        {/* <fs_premium_only> */}
                        <SelectControl 
                            label={__('Transition Style', 'kinetichub')} 
                            value={transitionStyle} 
                            options={[
                                {label: __('Classic Slide', 'kinetichub'), value: 'slide'}, 
                                {label: __('Diagonal Split', 'kinetichub'), value: 'diagonal'}, 
                                {label: __('Opacity Fade', 'kinetichub'), value: 'fade'}
                            ]} 
                            onChange={(v) => setAttributes({ transitionStyle: v })}
                            help={__('Slide is smooth, Diagonal is angular, Fade is subtle.', 'kinetichub')}
                        />
                        {transitionStyle === 'diagonal' && isHoriz && (
                            <RangeControl 
                                label={__('Diagonal Slant Angle', 'kinetichub')} 
                                value={diagonalSlant} 
                                onChange={(v) => setAttributes({ diagonalSlant: v })} 
                                min={5} max={40}
                                help={__('Lower = horizontal, higher = vertical angle.', 'kinetichub')}
                            />
                        )}
                        {transitionStyle !== 'diagonal' && (
                            <SelectControl 
                                label={__('Orientation', 'kinetichub')} 
                                value={orientation} 
                                options={[
                                    {label: __('Horizontal', 'kinetichub'), value: 'horizontal'}, 
                                    {label: __('Vertical', 'kinetichub'), value: 'vertical'}
                                ]} 
                                onChange={(v) => setAttributes({ orientation: v })}
                                help={__('Horizontal = left-right, Vertical = top-bottom.', 'kinetichub')}
                            />
                        )}
                        <ToggleControl 
                            label={__('Reverse Reveal Direction', 'kinetichub')} 
                            checked={reverseReveal} 
                            onChange={(v) => setAttributes({ reverseReveal: v })} 
                            help={__('Flips which image appears on top.', 'kinetichub')}
                        />
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginBottom: '10px' }}>
                            {__('Transition styles (diagonal, fade), vertical orientation, and reverse reveal are available in PRO.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}
                        <RangeControl label={__('Start Position (%)', 'kinetichub')} value={initialOffset} onChange={(v) => setAttributes({ initialOffset: v })} min={0} max={100} help={__('Initial slider position. 50% = equal split.', 'kinetichub')} />
                        <ToggleControl 
                            label={__('Enable Hover Zoom', 'kinetichub')} 
                            checked={hoverZoom} 
                            onChange={(v) => setAttributes({ hoverZoom: v })}
                            help={__('Images zoom slightly on hover.', 'kinetichub')}
                            /* <fs_premium_only> */
                            disabled={innerParallax}
                            help={innerParallax 
                                ? __('Conflicts with Parallax. Disable it first.', 'kinetichub')
                                : __('Images zoom slightly on hover.', 'kinetichub')
                            }
                            /* </fs_premium_only> */
                        />
                        <hr/>
                        <ToggleControl label={__('Auto-Play Intro Animation', 'kinetichub')} checked={autoPlayIntro} onChange={(v) => setAttributes({ autoPlayIntro: v })} help={__('Dramatic reveal when block first appears.', 'kinetichub')} />
                        
                        {/* <fs_premium_only> */}
                        {autoPlayIntro && (
                            <SelectControl 
                                label={__('Intro Animation Style', 'kinetichub')} 
                                value={introStyle} 
                                options={[
                                    {label: __('Hardware Slide', 'kinetichub'), value: 'slide'}, 
                                    {label: __('Smooth Fade', 'kinetichub'), value: 'fade'}, 
                                    {label: __('Scale Focus', 'kinetichub'), value: 'scale'}, 
                                    {label: __('Blur Reveal', 'kinetichub'), value: 'blur'}
                                ]} 
                                onChange={(v) => setAttributes({ introStyle: v })}
                                help={__('Slide is performant, Fade/Scale/Blur are cinematic.', 'kinetichub')}
                            />
                        )}
                        {/* </fs_premium_only> */}

                        {/* <fs_premium_only> */}
                        <ToggleControl 
                            label={__('Hover to Slide', 'kinetichub')} 
                            checked={hoverSlide} 
                            onChange={(v) => setAttributes({ hoverSlide: v })} 
                            help={__('Slider follows mouse without clicking.', 'kinetichub')}
                        />
                        {/* </fs_premium_only> */}
                        <ToggleControl 
                            label={__('Click to Move', 'kinetichub')} 
                            checked={clickToMove} 
                            onChange={(v) => setAttributes({ clickToMove: v })}
                            help={__('Click anywhere to jump slider to that position.', 'kinetichub')}
                        />
                        {/* <fs_premium_only> */}
                        <ToggleControl 
                            label={__('Kinetic Glide (Inertia)', 'kinetichub')} 
                            checked={enableInertia} 
                            onChange={(v) => setAttributes({ enableInertia: v })} 
                            help={__('Slider continues moving after release, like flicking.', 'kinetichub')}
                        />
                        <ToggleControl 
                            label={__('Magnetic Snap', 'kinetichub')} 
                            checked={magneticSnap} 
                            onChange={(v) => setAttributes({ magneticSnap: v })} 
                            help={__('Gently pulls toward center (50%) when close.', 'kinetichub')}
                        />
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginTop: '8px' }}>
                            {__('Hover-to-slide, inertia, and magnetic snap are available in PRO.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}
                    </PanelBody>

                    <PanelBody title={__('🎛️ Handle & Pulse', 'kinetichub')} initialOpen={false}>
                        {/* <fs_premium_only> */}
                        <SelectControl 
                            label={__('Handle Style', 'kinetichub')} 
                            value={handleStyle} 
                            options={[
                                {label: __('Classic Arrows', 'kinetichub'), value: 'classic'}, 
                                {label: __('Minimal Dot', 'kinetichub'), value: 'minimal'}, 
                                {label: __('Text (Drag)', 'kinetichub'), value: 'text'}
                            ]} 
                            onChange={(v) => setAttributes({ handleStyle: v })}
                            help={__('Classic = circular handle with arrows. Minimal = small dot. Text = label-based "Drag" handle.', 'kinetichub')}
                        />
                        {/* </fs_premium_only> */}
                        <SelectControl 
                            label={__('Divider Line Style', 'kinetichub')} 
                            value={dividerStyle} 
                            options={[
                                {label: __('Solid Line', 'kinetichub'), value: 'solid'}, 
                                {label: __('Neon Glow', 'kinetichub'), value: 'neon'}, 
                                {label: __('Faded Gradient', 'kinetichub'), value: 'gradient'}
                            ]} 
                            onChange={(v) => setAttributes({ dividerStyle: v })}
                            help={__('Style of the vertical/horizontal divider line. Solid = simple and clean, Neon = glowing accent, Gradient = subtle fade effect.', 'kinetichub')}
                        />
                        {/* <fs_premium_only> */}
                        <SelectControl 
                            label={__('Pulse Effect', 'kinetichub')} 
                            value={pulseEffect} 
                            options={[
                                {label: __('None', 'kinetichub'), value: 'none'},
                                {label: __('Soft Glow', 'kinetichub'), value: 'glow'},
                                {label: __('Sonar Ripple', 'kinetichub'), value: 'sonar'},
                                {label: __('Fluid Morphing', 'kinetichub'), value: 'morph'},
                                {label: __('Magnetic Focus', 'kinetichub'), value: 'magnetic'},
                                {label: __('Glassmorphism', 'kinetichub'), value: 'glass'},
                                {label: __('Target Brackets', 'kinetichub'), value: 'brackets'}
                            ]} 
                            onChange={(v) => setAttributes({ pulseEffect: v })}
                            help={__('Adds animated attention effect to the handle.', 'kinetichub')}
                        />
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginTop: '8px' }}>
                            {__('Handle styles and pulse effects are available in PRO.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}
                        <p style={{fontWeight:'bold', marginTop:'10px', marginBottom:'5px'}}>{__('Handle Background Color', 'kinetichub')}</p>
                        <p style={{fontSize:'12px', color:'#757575', marginBottom:'8px'}}>{__('Background color of the slider handle circle. Choose high contrast for visibility against your images.', 'kinetichub')}</p>
                        <ColorPalette value={handleColor} enableAlpha={true} onChange={(v) => setAttributes({ handleColor: v })} />
                        
                        <p style={{fontWeight:'bold', marginTop:'10px', marginBottom:'5px'}}>{__('Icon / Text Color', 'kinetichub')}</p>
                        <p style={{fontSize:'12px', color:'#757575', marginBottom:'8px'}}>{__('Color of the arrows, text, or icon inside the handle. Should contrast with handle background.', 'kinetichub')}</p>
                        <ColorPalette value={handleIconColor} enableAlpha={true} onChange={(v) => setAttributes({ handleIconColor: v })} />
                    </PanelBody>

                    {/* <fs_premium_only> */}
                    <PanelBody title={__('📱 Mobile Settings', 'kinetichub')} initialOpen={false}>
                        <SelectControl 
                            label={__('Mobile Aspect Ratio', 'kinetichub')} 
                            value={mobileAspectRatio} 
                            options={[
                                {label: __('Same as Desktop', 'kinetichub'), value:'inherit'}, 
                                {label: __('1:1 (Square)', 'kinetichub'), value:'1/1'}, 
                                {label: __('4:3 (Standard)', 'kinetichub'), value:'4/3'}, 
                                {label: __('3:4 (Portrait)', 'kinetichub'), value:'3/4'}
                            ]} 
                            onChange={(v) => setAttributes({ mobileAspectRatio: v })}
                            help={__('Use a different aspect ratio on mobile devices. "Same as Desktop" keeps your main setting. 1:1 or 3:4 optimize for portrait mobile screens.', 'kinetichub')}
                        />
                        <ToggleControl 
                            label={__('Hide Labels on Mobile', 'kinetichub')} 
                            checked={hideLabelsMobile} 
                            onChange={(v) => setAttributes({ hideLabelsMobile: v })} 
                            help={__('Removes Before/After labels on small screens. Saves space on mobile where labels may overlap images or feel cluttered.', 'kinetichub')}
                        />
                    </PanelBody>
                    {/* </fs_premium_only> */}
                    {/* <fs_free_only> */}
                    <PanelBody title={__('📱 Mobile Settings', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic' }}>
                            {__('Mobile aspect ratio and hide-labels-on-mobile are available in PRO.', 'kinetichub')}
                        </p>
                    </PanelBody>
                    {/* </fs_free_only> */}

                    <PanelBody title={__('🏷️ Labels & Styling', 'kinetichub')} initialOpen={false}>
                        <ToggleControl 
                            label={__('Show Labels', 'kinetichub')} 
                            checked={showLabels} 
                            onChange={(v) => setAttributes({ showLabels: v })}
                            help={__('Display "Before" and "After" text labels on the images. Helps users understand which side is which.', 'kinetichub')}
                        />
                        {showLabels && (
                            <>
                                <TextControl 
                                    label={__('Before Label', 'kinetichub')} 
                                    value={beforeLabel} 
                                    onChange={(v) => setAttributes({ beforeLabel: v })}
                                    help={__('Custom text for the before image label. Default: "Before". Try "Old", "Original", "Then", etc.', 'kinetichub')}
                                />
                                <TextControl 
                                    label={__('After Label', 'kinetichub')} 
                                    value={afterLabel} 
                                    onChange={(v) => setAttributes({ afterLabel: v })}
                                    help={__('Custom text for the after image label. Default: "After". Try "New", "Improved", "Now", etc.', 'kinetichub')}
                                />
                                <ToggleControl 
                                    label={__('Hide Labels While Moving', 'kinetichub')} 
                                    checked={hideLabelsOnMove} 
                                    onChange={(v) => setAttributes({ hideLabelsOnMove: v })}
                                    help={__('Before/After labels fade out when slider is moving. Reduces visual clutter during interaction.', 'kinetichub')}
                                />
                                
                                {/* <fs_premium_only> */}
                                <p style={{fontWeight:'bold', marginTop:'10px', marginBottom:'5px'}}>{__('Label Text Color', 'kinetichub')}</p>
                                <p style={{fontSize:'12px', color:'#757575', marginBottom:'8px'}}>{__('Text color of the labels. Choose high contrast against label background for readability.', 'kinetichub')}</p>
                                <ColorPalette value={labelColor} enableAlpha={true} onChange={(v) => setAttributes({ labelColor: v })} />
                                <p style={{fontWeight:'bold', marginTop:'10px', marginBottom:'5px'}}>{__('Label Background', 'kinetichub')}</p>
                                <p style={{fontSize:'12px', color:'#757575', marginBottom:'8px'}}>{__('Background color behind label text. Semi-transparent black (rgba(0,0,0,0.5)) works well on most images.', 'kinetichub')}</p>
                                <ColorPalette value={labelBg} enableAlpha={true} onChange={(v) => setAttributes({ labelBg: v })} />
                                {/* </fs_premium_only> */}
                                {/* <fs_free_only> */}
                                <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginTop: '8px' }}>
                                    {__('Label color customization is available in PRO.', 'kinetichub')}
                                </p>
                                {/* </fs_free_only> */}
                            </>
                        )}
                        <hr/>
                        <ToggleControl 
                            label={__('Force True Full Width (Nuclear)', 'kinetichub')} 
                            checked={forceFullWidth} 
                            onChange={(v) => setAttributes({ forceFullWidth: v })}
                            help={__('Forces the block to span the entire browser width, breaking out of content container. Use with caution - may conflict with theme layouts.', 'kinetichub')}
                        />
                    </PanelBody>

                    <PanelBody title={__('📦 Global Shadows', 'kinetichub')} initialOpen={false}>
                        <KineticShadowControls attributes={attributes} setAttributes={setAttributes} />
                    </PanelBody>

                    <KineticVisibilityControls attributes={attributes} setAttributes={setAttributes} />
                </InspectorControls>

                <div {...blockProps}>
                    {beforeImage?.url && afterImage?.url ? (
                        <div className={innerClasses} style={aspectRatio !== 'auto' ? { aspectRatio: `var(--kh-ba-aspect)` } : {}}>
                            <div className="kh-ba-layer kh-ba-after">
                                <div className="kh-ba-img-wrap" style={{ filter: activeAfterFilter }}><img src={afterImage.url} className="kh-ba-img" alt={afterImage.alt || "After"} /></div>
                                <div className="kh-ba-overlay kh-ba-overlay-after" aria-hidden="true"></div>
                                {showLabels && <span className="kh-ba-label kh-ba-label-after">{afterLabel}</span>}
                            </div>
                            <div className="kh-ba-layer kh-ba-before" style={layerStyle}>
                                <div className="kh-ba-img-wrap" style={{ filter: activeBeforeFilter }}><img src={beforeImage.url} className="kh-ba-img" alt={beforeImage.alt || "Before"} /></div>
                                <div className="kh-ba-overlay kh-ba-overlay-before" aria-hidden="true"></div>
                                {showLabels && <span className="kh-ba-label kh-ba-label-before">{beforeLabel}</span>}
                            </div>
                            <div className="kh-ba-handle" style={{ left: isHoriz ? `${safeOffset}%` : '0', top: isHoriz ? '0' : `${safeOffset}%` }}>
                                <button className={`kh-ba-circle pulse-${editorPulseEffect}`}>
                                    {/* <fs_premium_only> */}
                                    {handleStyle === 'classic' && <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isHoriz ? 'none' : 'rotate(90deg)' }}><polyline points="9 18 3 12 9 6"></polyline><polyline points="15 18 21 12 15 6"></polyline></svg>}
                                    {handleStyle === 'text' && <span className="kh-ba-handle-text">Drag</span>}
                                    {/* </fs_premium_only> */}
                                    {/* <fs_free_only> */}
                                    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 3 12 9 6"></polyline><polyline points="15 18 21 12 15 6"></polyline></svg>
                                    {/* </fs_free_only> */}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="kh-ba-placeholder-wrapper" style={{background: '#f8f9fa', border: '2px dashed #ccc', borderRadius: '8px', padding: '40px 20px', position: 'relative'}}>
                            <Placeholder icon={columns} label={__('Kinetic Before/After', 'kinetichub')} instructions={__('Upload or select your Before and After images using the sidebar controls on the right.', 'kinetichub')}>
                                <div style={{fontSize: '13px', opacity: 0.7, marginTop: '10px'}}>{__('Hint: For best results, use images with similar dimensions or use the Aspect Ratio setting.', 'kinetichub')}</div>
                            </Placeholder>
                        </div>
                    )}

                    {isSelected && beforeImage?.url && afterImage?.url && (
                        <KineticEditorNotice message={__('Slider Engine & Kinetic Physics active on Frontend', 'kinetichub')} />
                    )}
                </div>
            </>
        );
    },
    save: () => null 
});