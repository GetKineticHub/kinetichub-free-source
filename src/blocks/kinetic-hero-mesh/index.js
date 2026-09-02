/**
 * Kinetic Hero Mesh - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType, getBlockType } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps, InnerBlocks, InspectorControls, MediaUpload, MediaUploadCheck, MediaPlaceholder } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, ColorPalette, SelectControl, Button, ResizableBox } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { KineticEditorNotice } from '../../components/EditorNotice';
import { InspectorHelp, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';



import metadata from './block.json';

const getDynamicTemplate = () => {
    const hasTypography = !!getBlockType('kinetichub/typography');
    const hasButton = !!getBlockType('kinetichub/magnetic-button');

    const typographyBlock = hasTypography ? 'kinetichub/typography' : 'core/heading';
    const paragraphBlock = hasTypography ? 'kinetichub/typography' : 'core/paragraph';
    const buttonBlock = hasButton ? 'kinetichub/magnetic-button' : 'core/button';

    return [
        [
            typographyBlock, 
            { 
                content: __('Design the Future', 'kinetichub'),
                tagName: 'h1',
                animationType: 'blur',
                speed: 1.3,
                stagger: 0.12,
                threshold: 0.4,
                triggerAlways: true,
                customFontSize: 52, 
                customFontSizeMobile: 36, 
                customLineHeight: 1.1,
                customLineHeightMobile: 1.2,
                textAlignMobile: 'center', 
                style: { typography: { textAlign: 'center' }, color: { text: '#ffffff' } }
            }
        ],
        [
            paragraphBlock, 
            { 
                content: __('Hardware-accelerated generative layout containers built for extreme performance.', 'kinetichub'),
                tagName: 'p',
                animationType: 'reveal',
                speed: 1.0,
                stagger: 0.05,
                customFontSize: 18,
                customFontSizeMobile: 16,
                customLineHeight: 1.5,
                customLineHeightMobile: 1.4,
                textAlignMobile: 'center',
                style: { typography: { textAlign: 'center' }, color: { text: '#ffffff' } }
            }
        ],
        [
            buttonBlock, 
            { text: __('Explore Now', 'kinetichub'), align: 'center' }
        ]
    ];
};

registerBlockType(metadata.name, {
    icon: 'cover-image',

    edit: (props) => {
        const { attributes, setAttributes, isSelected } = props;
        const {
            bgMode, heroHeightDesktop, heroHeightMobile, contentAlign, mediaUrl,
            objectFit, objectPosition, overlayOpacity, overlayColor, blendMode,
            
            plexusColor, plexusDensity, plexusDistance, plexusSpeed, plexusInteraction, plexusLineWidth,
            align, parallaxEffect, enableGrain
        } = attributes;

        const modesWithImage = [
            'classic',
            
        ];
        const isPlaceholder = !mediaUrl && modesWithImage.includes(bgMode);

        const hasNativeBg = attributes.backgroundColor || (attributes.style && attributes.style.color && attributes.style.color.background);
        let baseEditorColor = '';
        if (!hasNativeBg) {
            
            
            baseEditorColor = '#0f172a';
            
        }

        let finalEditorBackground = baseEditorColor; 
        if (modesWithImage.includes(bgMode) && mediaUrl) {
            const bgSize = objectFit === 'fill' ? '100% 100%' : objectFit;
            finalEditorBackground = `url(${mediaUrl}) ${objectPosition}/${bgSize} no-repeat ${baseEditorColor}`;
        }

        const alignVertical = contentAlign === 'top' ? 'flex-start' : (contentAlign === 'bottom' ? 'flex-end' : 'center');
        const alignClass = align ? `align${align}` : '';

        const blockProps = useBlockProps({
            className: `kh-hm-hero-container kh-hm-editor-preview ${alignClass}`,
            style: { width: '100%', position: 'relative', '--kh-hm-desk-h': `${heroHeightDesktop}vh` },
            'data-mode': bgMode,
            'data-media': mediaUrl,
            'data-plexus-color': plexusColor || '#ffffff',
            'data-plexus-density': plexusDensity || 80,
            'data-plexus-dist': plexusDistance || 150,
            'data-plexus-speed': plexusSpeed || 1.0,
            'data-plexus-width': plexusLineWidth || 1.0,
            'data-plexus-int': plexusInteraction || 'repel',
            
        });

        const innerBlocksProps = useInnerBlocksProps(
            { 
                className: "kh-hm-inner-wrap", 
                style: { width: '100%', display: 'flex', flexDirection: 'column' } 
            },
            { template: getDynamicTemplate() }
        );

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('🏗️ Canvas Settings', 'kinetichub')} initialOpen={true}>
                        <SelectControl
                            label={labelWithHelp(__('Generative Engine Mode', 'kinetichub'), __('Plexus draws a live canvas of drifting nodes that join up with lines whenever they come close enough. Classic Static draws no canvas at all — the background is just your image or colour, which is the lightest option on slower devices.', 'kinetichub'))} value={bgMode}
                            options={[
                                { label: __('Neural Network (Plexus)', 'kinetichub'), value: 'plexus' },
                                { label: __('Classic Static', 'kinetichub'), value: 'classic' },
                                
                            ]}
                            onChange={(v) => setAttributes({ bgMode: v })}
                        />

                        
                        {/* At the control itself, which is the only place the
                          * question "what else could this be?" is actually
                          * asked. Replaces a "More Engines" panel whose entire
                          * content was the fact that it had none. */}
                        <ProNote
                            text={__('Four more canvas engines: Gradient Mesh, animated blobs in three colours of your own; Aurora Silk, drifting fields of coloured light; and two WebGL engines that work on an image you upload — Liquid Displacement ripples it under the cursor, Refractive Lens refracts it through a crystal pattern.', 'kinetichub')}
                        />
                        
                        
                        {modesWithImage.includes(bgMode) && (
                            <div style={{ marginTop: '15px', marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <p style={{ marginTop: 0, fontWeight: 'bold' }}>{__('Source Image', 'kinetichub')}</p>
                                <MediaUploadCheck>
                                    <MediaUpload 
                                        onSelect={(m) => setAttributes({ mediaUrl: m.url, mediaId: m.id })} 
                                        allowedTypes={['image']} 
                                        render={({ open }) => (
                                            <Button variant="secondary" onClick={open} style={{ width: '100%', justifyContent: 'center' }}>
                                                {mediaUrl ? __('Change Image', 'kinetichub') : __('Set Image', 'kinetichub')}
                                            </Button>
                                        )} 
                                    />
                                </MediaUploadCheck>
                            </div>
                        )}

                        {bgMode === 'classic' && (
                            <>
                                <SelectControl
                                    label={labelWithHelp(__('Image Fit', 'kinetichub'), __('Cover fills the hero and crops whatever does not fit. Contain shows the whole image and leaves the background colour around it. Fill stretches the image to the hero, so its proportions change.', 'kinetichub'))}
                                    value={objectFit}
                                    options={[
                                        { label: __('Cover', 'kinetichub'), value: 'cover' },
                                        { label: __('Contain', 'kinetichub'), value: 'contain' },
                                        { label: __('Fill', 'kinetichub'), value: 'fill' }
                                    ]}
                                    onChange={(v) => setAttributes({ objectFit: v })}
                                />
                                <SelectControl
                                    label={labelWithHelp(__('Image Position', 'kinetichub'), __('Which part of the image stays in view when Cover crops it, and where the image sits when Contain leaves space around it. Fill ignores this.', 'kinetichub'))}
                                    value={objectPosition}
                                    options={[
                                        { label: __('Center', 'kinetichub'), value: 'center' },
                                        { label: __('Top', 'kinetichub'), value: 'top' },
                                        { label: __('Bottom', 'kinetichub'), value: 'bottom' },
                                        { label: __('Left', 'kinetichub'), value: 'left' },
                                        { label: __('Right', 'kinetichub'), value: 'right' }
                                    ]}
                                    onChange={(v) => setAttributes({ objectPosition: v })}
                                />
                                <ToggleControl 
                                    label={labelWithHelp(__('Enable Parallax Effect', 'kinetichub'), __('Pins the background image in place so the hero content scrolls over it. Applies to Classic Static only, and falls back to normal scrolling at 768px and below, where fixed backgrounds are unreliable.', 'kinetichub'))}
                                    checked={parallaxEffect} 
                                    onChange={(v) => setAttributes({ parallaxEffect: v })} 
                                />
                                <hr style={{margin: '20px 0'}} />
                            </>
                        )}

                        <RangeControl label={labelWithHelp(__('Desktop Height (vh)', 'kinetichub'), __('A minimum height, as a percentage of the browser window: 100 is one full screen. Content taller than this pushes the hero further down.', 'kinetichub'))} value={heroHeightDesktop} onChange={(v) => setAttributes({ heroHeightDesktop: v })} min={20} max={200} />
                        <RangeControl label={labelWithHelp(__('Mobile Height (vh)', 'kinetichub'), __('The same minimum height, used at 768px and below.', 'kinetichub'))} value={heroHeightMobile} onChange={(v) => setAttributes({ heroHeightMobile: v })} min={20} max={200} />
                        <SelectControl
                            label={__('Vertical Alignment', 'kinetichub')} value={contentAlign}
                            options={[ { label: __('Top', 'kinetichub'), value: 'top' }, { label: __('Center', 'kinetichub'), value: 'center' }, { label: __('Bottom', 'kinetichub'), value: 'bottom' } ]}
                            onChange={(v) => setAttributes({ contentAlign: v })}
                        />

                    </PanelBody>

                    

                    {bgMode === 'plexus' && (
                        <PanelBody title={__('🌌 Plexus Settings', 'kinetichub')} initialOpen={true}>
                            <RangeControl label={labelWithHelp(__('Node Density', 'kinetichub'), __('How many nodes drift across the canvas. Capped at 40 on screens 768px and below, whatever you set here.', 'kinetichub'))} value={plexusDensity} onChange={(v) => setAttributes({ plexusDensity: v })} min={10} max={100} step={1} />
                            <RangeControl label={labelWithHelp(__('Movement Speed', 'kinetichub'), __('How fast the nodes drift. It scales their starting velocity, so higher values also scatter them apart sooner.', 'kinetichub'))} value={plexusSpeed} onChange={(v) => setAttributes({ plexusSpeed: v })} min={0.1} max={3.0} step={0.1} />
                            <RangeControl label={labelWithHelp(__('Connection Distance', 'kinetichub'), __('In pixels. Two nodes are joined by a line once they are closer than this, and the line fades as they drift apart. Large values mean many more lines to draw each frame.', 'kinetichub'))} value={plexusDistance} onChange={(v) => setAttributes({ plexusDistance: v })} min={20} max={200} step={1} />
                            <RangeControl label={labelWithHelp(__('Line Width', 'kinetichub'), __('Thickness of the connecting lines, in pixels.', 'kinetichub'))} value={plexusLineWidth} onChange={(v) => setAttributes({ plexusLineWidth: v })} min={0.5} max={3.0} step={0.5} />
                            <SelectControl 
                                label={labelWithHelp(__('Cursor Interaction', 'kinetichub'), __('Repel pushes nodes away from the pointer within about 150px and Attract pulls them in from about 200px. Constellation leaves the nodes alone and instead draws lines from the pointer to the ones near it. None ignores the pointer, and is the cheapest.', 'kinetichub'))} value={plexusInteraction}
                                options={[ {label: __('Repel (Push)', 'kinetichub'), value: 'repel'}, {label: __('Attract (Pull)', 'kinetichub'), value: 'attract'}, {label: __('Constellation (Lines)', 'kinetichub'), value: 'constellation'}, {label: __('None', 'kinetichub'), value: 'none'} ]} 
                                onChange={(v) => setAttributes({ plexusInteraction: v })} 
                            />
                            <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '15px' }}>{__('Network Color', 'kinetichub')}</p>
                            <ColorPalette value={plexusColor} onChange={(v) => setAttributes({ plexusColor: v })} enableAlpha={true} />
                        </PanelBody>
                    )}

                    

                    <PanelBody title={__('✨ Composition (Overlay)', 'kinetichub')} initialOpen={false}>
                        <SelectControl 
                            label={labelWithHelp(__('Overlay Blend Mode', 'kinetichub'), __('How the tint mixes with the background beneath it. Normal simply lays the colour on top; the others combine the two and cost more to render.', 'kinetichub'))} value={blendMode}
                            options={[ { label: __('Normal', 'kinetichub'), value: 'normal' }, { label: __('Multiply', 'kinetichub'), value: 'multiply' }, { label: __('Overlay', 'kinetichub'), value: 'overlay' }, { label: __('Screen', 'kinetichub'), value: 'screen' }, { label: __('Color Dodge', 'kinetichub'), value: 'color-dodge' }, { label: __('Difference', 'kinetichub'), value: 'difference' } ]}
                            onChange={(v) => setAttributes({ blendMode: v })}
                        />
                        <p style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                            {__('Overlay Tint Color', 'kinetichub')}
                            <InspectorHelp
                                label={__('Overlay Tint Color', 'kinetichub')}
                                text={__('The colour laid over the background, behind your content. It stays invisible until Opacity Level is above 0.', 'kinetichub')}
                            />
                        </p>
                        <ColorPalette value={overlayColor} onChange={(v) => setAttributes({ overlayColor: v })} enableAlpha={true} />
                        <RangeControl label={labelWithHelp(__('Opacity Level', 'kinetichub'), __('How strongly the tint covers the background. Raising it is the usual way to keep text readable over a busy image or a moving canvas.', 'kinetichub'))} value={overlayOpacity} onChange={(v) => setAttributes({ overlayOpacity: v })} min={0} max={1} step={0.1} />
                        <hr style={{margin: '20px 0'}} />
                        <ToggleControl 
                            label={labelWithHelp(__('Enable Film Grain Noise', 'kinetichub'), __('Lays a fine noise texture over the whole hero. The texture drifts slowly while the hero is on screen, and holds still for visitors who ask for reduced motion.', 'kinetichub'))}
                            checked={enableGrain} 
                            onChange={(v) => setAttributes({ enableGrain: v })} 
                        />

                        
                        {/* Last thing in the last panel FREE has, which is
                          * exactly where the PRO Visibility panel begins. */}
                        <ProNote
                            text={__('Per-device visibility, for hiding the whole hero at 768px and below or on desktop only — useful when a lighter block takes its place on small screens.', 'kinetichub')}
                        />
                        
                    </PanelBody>

                    
                </InspectorControls>

                <div {...blockProps}>
                    <ResizableBox
                        className="kh-hm-resizable-wrap"
                        size={{ height: 'auto' }}
                        minHeight={`${heroHeightDesktop}vh`}
                        enable={{ top: false, right: false, bottom: true, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                        onResizeStop={(event, direction, elt, delta) => {
                            const newHeightVh = Math.round((elt.offsetHeight / window.innerHeight) * 100);
                            setAttributes({ heroHeightDesktop: newHeightVh });
                        }}
                        showHandle={isSelected}
                        style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ background: finalEditorBackground, position: 'relative', overflow: 'hidden', height: '100%', minHeight: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            
                            {bgMode !== 'classic' && (
                                <canvas className="kh-hm-canvas-engine" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}></canvas>
                            )}
                            
                            <div className="kh-hm-editor-overlay" style={{ background: overlayColor, opacity: overlayOpacity, mixBlendMode: blendMode, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, margin: 0, padding: 0 }}></div>
                            
                            {isPlaceholder && (
                                <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(5px)' }}>
                                    <div style={{ width: '90%', maxWidth: '400px', background: '#fff', border: '2px dashed #cbd5e1', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                        <MediaPlaceholder
                                            icon="cover-image"
                                            labels={{ title: __('Upload Source Image', 'kinetichub'), instructions: __('Required for this engine mode.', 'kinetichub') }}
                                            onSelect={(m) => setAttributes({ mediaUrl: m.url, mediaId: m.id })}
                                            accept="image/*"
                                            allowedTypes={['image']}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="kh-hm-content-layer" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: alignVertical, padding: '5% 10%', boxSizing: 'border-box', width: '100%' }}>
                                <div {...innerBlocksProps} />
                            </div>

                            {/*
                              * Classic Static draws no canvas at all, so what the
                              * editor shows there is what ships and there is nothing
                              * to say. Every other mode is a generative canvas that
                              * does not run in Gutenberg, which is the one thing an
                              * author cannot tell by looking.
                              *
                              * Not gated on edition: Plexus is in FREE too, and is no
                              * better previewed there.
                              *
                              * Held back while the media placeholder is up -- that
                              * overlay is the thing to read first, and it sits at
                              * z-index 50 over this corner anyway.
                              *
                              * Anchored to the preview surface directly above, which
                              * is position: relative and at least heroHeightDesktop
                              * tall, so the toast sits in open background.
                              */}
                            {isSelected && bgMode !== 'classic' && !isPlaceholder && (
                                <KineticEditorNotice message={__('Generative mesh effects and animation render on the live frontend.', 'kinetichub')} />
                            )}

                        </div>
                    </ResizableBox>
                </div>
            </>
        );
    },
    
    save: () => <InnerBlocks.Content />
});