/**
 * Kinetic Hero Mesh - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType, getBlockType } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps, InnerBlocks, InspectorControls, MediaUpload, MediaUploadCheck, MediaPlaceholder } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, ColorPalette, SelectControl, Button, ResizableBox } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/* <fs_premium_only> */
import { KineticVisibilityControls } from '../../components/VisibilityControls';
/* </fs_premium_only> */
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
            /* <fs_premium_only> */
            liquidViscosity, liquidRGBShift, liquidIntensity,
            gradientFlowSpeed, gradientIntensity, useImageInMesh, meshColor1, meshColor2, meshColor3,
            fxScale, fxSpeed,
            /* </fs_premium_only> */
            plexusColor, plexusDensity, plexusDistance, plexusSpeed, plexusInteraction, plexusLineWidth,
            align, parallaxEffect, enableGrain
        } = attributes;

        const modesWithImage = [
            'classic',
            /* <fs_premium_only> */
            'liquid', 'refractive',
            /* </fs_premium_only> */
        ];
        const isPlaceholder = !mediaUrl && modesWithImage.includes(bgMode);

        const hasNativeBg = attributes.backgroundColor || (attributes.style && attributes.style.color && attributes.style.color.background);
        let baseEditorColor = '';
        if (!hasNativeBg) {
            /* <fs_premium_only> */
            baseEditorColor = bgMode === 'gradient' ? '#1e293b' : '#0f172a';
            /* </fs_premium_only> */
            /* <fs_free_only> */
            baseEditorColor = '#0f172a';
            /* </fs_free_only> */
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
            /* <fs_premium_only> */
            'data-viscosity': liquidViscosity || 0.1,
            'data-rgb': liquidRGBShift || 0.5,
            'data-liquid-int': liquidIntensity || 0.02,
            'data-use-img-mesh': useImageInMesh ? 'true' : 'false',
            'data-mesh-colors': `${meshColor1 || '#3b82f6'},${meshColor2 || '#8b5cf6'},${meshColor3 || '#ec4899'}`,
            'data-grad-speed': gradientFlowSpeed || 0.5,
            'data-grad-int': gradientIntensity || 0.8,
            'data-fx-scale': fxScale || 20,
            'data-fx-speed': fxSpeed || 1.0,
            /* </fs_premium_only> */
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
                            label={__('Generative Engine Mode', 'kinetichub')} value={bgMode}
                            options={[
                                { label: __('Neural Network (Plexus)', 'kinetichub'), value: 'plexus' },
                                { label: __('Classic Static', 'kinetichub'), value: 'classic' },
                                /* <fs_premium_only> */
                                { label: __('Gradient Mesh (Blobs)', 'kinetichub'), value: 'gradient' },
                                { label: __('Liquid Displacement', 'kinetichub'), value: 'liquid' },
                                { label: __('Refractive Lens (Crystal)', 'kinetichub'), value: 'refractive' },
                                { label: __('Aurora Silk Ribbons', 'kinetichub'), value: 'aurora' },
                                /* </fs_premium_only> */
                            ]}
                            onChange={(v) => setAttributes({ bgMode: v })}
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
                                    label={__('Image Fit', 'kinetichub')}
                                    value={objectFit}
                                    options={[
                                        { label: __('Cover', 'kinetichub'), value: 'cover' },
                                        { label: __('Contain', 'kinetichub'), value: 'contain' },
                                        { label: __('Fill', 'kinetichub'), value: 'fill' }
                                    ]}
                                    onChange={(v) => setAttributes({ objectFit: v })}
                                />
                                <SelectControl
                                    label={__('Image Position', 'kinetichub')}
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
                                    label={__('Enable Parallax Effect', 'kinetichub')} 
                                    checked={parallaxEffect} 
                                    onChange={(v) => setAttributes({ parallaxEffect: v })} 
                                    help={__('Creates a fixed 3D scrolling effect.', 'kinetichub')}
                                />
                                <hr style={{margin: '20px 0'}} />
                            </>
                        )}

                        <RangeControl label={__('Desktop Height (vh)', 'kinetichub')} value={heroHeightDesktop} onChange={(v) => setAttributes({ heroHeightDesktop: v })} min={20} max={200} />
                        <RangeControl label={__('Mobile Height (vh)', 'kinetichub')} value={heroHeightMobile} onChange={(v) => setAttributes({ heroHeightMobile: v })} min={20} max={200} />
                        <SelectControl
                            label={__('Vertical Alignment', 'kinetichub')} value={contentAlign}
                            options={[ { label: __('Top', 'kinetichub'), value: 'top' }, { label: __('Center', 'kinetichub'), value: 'center' }, { label: __('Bottom', 'kinetichub'), value: 'bottom' } ]}
                            onChange={(v) => setAttributes({ contentAlign: v })}
                        />

                    </PanelBody>

                    {/* <fs_premium_only> */}
                    {bgMode === 'gradient' && (
                        <PanelBody title={__('🌈 Mesh Lava Colors', 'kinetichub')} initialOpen={false}>
                            <ToggleControl label={__('Blend over Image', 'kinetichub')} checked={useImageInMesh} onChange={(v) => setAttributes({ useImageInMesh: v })} />
                            {useImageInMesh && (
                                <MediaUploadCheck>
                                    <MediaUpload onSelect={(m) => setAttributes({ mediaUrl: m.url, mediaId: m.id })} allowedTypes={['image']} render={({ open }) => (<Button variant="secondary" onClick={open} style={{ width: '100%', marginBottom: '15px', justifyContent: 'center' }}>{mediaUrl ? __('Change Source Image', 'kinetichub') : __('Set Source Image', 'kinetichub')}</Button>)} />
                                </MediaUploadCheck>
                            )}
                            <RangeControl label={__('Layer Opacity', 'kinetichub')} value={gradientIntensity} onChange={(v) => setAttributes({ gradientIntensity: v })} min={0.1} max={1.0} step={0.1} />
                            <RangeControl label={__('Flow Speed', 'kinetichub')} value={gradientFlowSpeed} onChange={(v) => setAttributes({ gradientFlowSpeed: v })} min={0.1} max={2.0} step={0.1} />

                            <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '15px' }}>{__('Mesh Node Colors', 'kinetichub')}</p>
                            <ColorPalette value={meshColor1} onChange={(v) => setAttributes({ meshColor1: v })} enableAlpha={true} />
                            <ColorPalette value={meshColor2} onChange={(v) => setAttributes({ meshColor2: v })} enableAlpha={true} />
                            <ColorPalette value={meshColor3} onChange={(v) => setAttributes({ meshColor3: v })} enableAlpha={true} />
                        </PanelBody>
                    )}
                    {/* </fs_premium_only> */}

                    {bgMode === 'plexus' && (
                        <PanelBody title={__('🌌 Plexus Settings', 'kinetichub')} initialOpen={true}>
                            <RangeControl label={__('Node Density', 'kinetichub')} value={plexusDensity} onChange={(v) => setAttributes({ plexusDensity: v })} min={10} max={100} step={1} />
                            <RangeControl label={__('Movement Speed', 'kinetichub')} value={plexusSpeed} onChange={(v) => setAttributes({ plexusSpeed: v })} min={0.1} max={3.0} step={0.1} />
                            <RangeControl label={__('Connection Distance', 'kinetichub')} value={plexusDistance} onChange={(v) => setAttributes({ plexusDistance: v })} min={20} max={200} step={1} />
                            <RangeControl label={__('Line Width', 'kinetichub')} value={plexusLineWidth} onChange={(v) => setAttributes({ plexusLineWidth: v })} min={0.5} max={3.0} step={0.5} />
                            <SelectControl 
                                label={__('Cursor Interaction', 'kinetichub')} value={plexusInteraction} 
                                options={[ {label: __('Repel (Push)', 'kinetichub'), value: 'repel'}, {label: __('Attract (Pull)', 'kinetichub'), value: 'attract'}, {label: __('Constellation (Lines)', 'kinetichub'), value: 'constellation'}, {label: __('None', 'kinetichub'), value: 'none'} ]} 
                                onChange={(v) => setAttributes({ plexusInteraction: v })} 
                            />
                            <p style={{ marginBottom: '5px', fontWeight: 'bold', marginTop: '15px' }}>{__('Network Color', 'kinetichub')}</p>
                            <ColorPalette value={plexusColor} onChange={(v) => setAttributes({ plexusColor: v })} enableAlpha={true} />
                        </PanelBody>
                    )}

                    {/* <fs_premium_only> */}
                    {['liquid', 'refractive', 'aurora'].includes(bgMode) && (
                        <PanelBody title={__('🌊 WebGL Engine Settings', 'kinetichub')} initialOpen={true}>
                            {bgMode === 'liquid' && (
                                <>
                                    <RangeControl label={__('Liquid Viscosity', 'kinetichub')} value={liquidViscosity} onChange={(v) => setAttributes({ liquidViscosity: v })} min={0.01} max={0.5} step={0.01} />
                                    <RangeControl label={__('RGB Shift / Chromatic Aberration', 'kinetichub')} value={liquidRGBShift} onChange={(v) => setAttributes({ liquidRGBShift: v })} min={0.1} max={2.0} step={0.1} />
                                    <RangeControl label={__('Wave Intensity', 'kinetichub')} value={liquidIntensity} onChange={(v) => setAttributes({ liquidIntensity: v })} min={0.01} max={0.1} step={0.01} />
                                </>
                            )}

                            {bgMode === 'refractive' && (
                                <RangeControl label={__('Crystal Scale', 'kinetichub')} value={fxScale} onChange={(v) => setAttributes({ fxScale: v })} min={5} max={50} step={1} />
                            )}

                            {bgMode === 'aurora' && (
                                <RangeControl label={__('Flow Speed', 'kinetichub')} value={fxSpeed} onChange={(v) => setAttributes({ fxSpeed: v })} min={0.1} max={3.0} step={0.1} />
                            )}
                        </PanelBody>
                    )}
                    {/* </fs_premium_only> */}

                    {/* <fs_free_only> */}
                    <PanelBody title={__('🚀 More Engines', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                            {__('Gradient Mesh, Liquid Displacement, Refractive Lens, and Aurora Silk engines are available in Kinetic Hero Mesh Pro.', 'kinetichub')}
                        </p>
                    </PanelBody>
                    {/* </fs_free_only> */}

                    <PanelBody title={__('✨ Composition (Overlay)', 'kinetichub')} initialOpen={false}>
                        <SelectControl 
                            label={__('Overlay Blend Mode', 'kinetichub')} value={blendMode} 
                            options={[ { label: __('Normal', 'kinetichub'), value: 'normal' }, { label: __('Multiply', 'kinetichub'), value: 'multiply' }, { label: __('Overlay', 'kinetichub'), value: 'overlay' }, { label: __('Screen', 'kinetichub'), value: 'screen' }, { label: __('Color Dodge', 'kinetichub'), value: 'color-dodge' }, { label: __('Difference', 'kinetichub'), value: 'difference' } ]}
                            onChange={(v) => setAttributes({ blendMode: v })}
                        />
                        <p style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>{__('Overlay Tint Color', 'kinetichub')}</p>
                        <ColorPalette value={overlayColor} onChange={(v) => setAttributes({ overlayColor: v })} enableAlpha={true} />
                        <RangeControl label={__('Opacity Level', 'kinetichub')} value={overlayOpacity} onChange={(v) => setAttributes({ overlayOpacity: v })} min={0} max={1} step={0.1} />
                        <hr style={{margin: '20px 0'}} />
                        <ToggleControl 
                            label={__('Enable Film Grain Noise', 'kinetichub')} 
                            checked={enableGrain} 
                            onChange={(v) => setAttributes({ enableGrain: v })} 
                            help={__('Applies a cinematic noise overlay to the entire hero block.', 'kinetichub')}
                        />
                    </PanelBody>

                    {/* <fs_premium_only> */}
                    <KineticVisibilityControls attributes={attributes} setAttributes={setAttributes} />
                    {/* </fs_premium_only> */}
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

                        </div>
                    </ResizableBox>
                </div>
            </>
        );
    },
    
    save: () => <InnerBlocks.Content />
});