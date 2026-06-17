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

            hoverZoom,
            dividerStyle, handleColor, handleIconColor, showLabels, beforeLabel, afterLabel,
            containerShadow, shadowStyle, forceFullWidth,
            afterFilter, afterBlurIntensity, afterOverlayColor, afterOverlayOpacity,
            clickToMove, autoPlayIntro, hideLabelsOnMove
        } = attributes;

        let isHoriz = true;


        const safeOffset = Math.max(0, Math.min(100, initialOffset));

        let activeBeforeFilter = 'none';


        let activeAfterFilter = 'none';
        if (afterFilter.includes('grayscale')) activeAfterFilter = 'grayscale(100%)';
        else if (afterFilter.includes('sepia')) activeAfterFilter = 'sepia(100%)';
        else if (afterFilter.includes('blur')) activeAfterFilter = `blur(${afterBlurIntensity}px)`;
        else if (afterFilter.includes('invert')) activeAfterFilter = 'invert(100%)';
        else if (afterFilter.includes('contrast')) activeAfterFilter = 'contrast(150%)';

        let activeOverlayOpacity = 0;

        const activeAfterOverlayOpacity = afterFilter === 'color' ? Math.max(0, Math.min(1, afterOverlayOpacity)) : 0;

        const dynamicStyles = useMemo(() => ({
            '--kh-ba-handle': handleColor,
            '--kh-ba-icon-c': handleIconColor, 
            '--kh-ba-label-c': '#ffffff',
            '--kh-ba-label-bg': 'rgba(0,0,0,0.5)',
            '--kh-ba-overlay-c': '#000000',

            '--kh-ba-overlay-o': activeOverlayOpacity,
            '--kh-ba-a-overlay-c': afterOverlayColor,
            '--kh-ba-a-overlay-o': activeAfterOverlayOpacity,
            ...(aspectRatio !== 'auto' && { '--kh-ba-aspect': aspectRatio }),
            ), [handleColor, handleIconColor,

            activeOverlayOpacity, afterOverlayColor, activeAfterOverlayOpacity, aspectRatio]);

        let innerClasses = `kh-ba-inner ${aspectRatio !== 'auto' ? 'has-aspect-ratio' : ''}`;


        const shadowClass = containerShadow ? `has-shadow shadow-${shadowStyle}` : '';
        let blockClassName = `kh-ba-container kh-ba-preview kh-ba-horizontal ${shadowClass} kh-ba-trans-slide kh-ba-handle-classic kh-ba-divider-${dividerStyle} ${hoverZoom ? 'has-hover-zoom' : ''} ${forceFullWidth ? 'is-forced-fullwidth' : ''}`;

        const blockProps = useBlockProps({
            className: blockClassName,
            style: dynamicStyles
        });

        let layerStyle = {};
        const clipVal = 100 - safeOffset;
        layerStyle.clipPath = `inset(0 ${clipVal}% 0 0)`;


        let editorPulseEffect = 'none';


        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('🖼️ Images & Filters', 'kinetichub')} initialOpen={true}>

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



                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginTop: '8px' }}>
                            {__('Before image filter: None (original). Additional filters not included in this build.', 'kinetichub')}
                        </p>


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



                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic' }}>
                            {__('Inner parallax, hold-to-peek, and cursor badge are not included in this build.', 'kinetichub')}
                        </p>
                    </PanelBody>


                    <PanelBody title={__('🚀 Engine & Transitions', 'kinetichub')} initialOpen={false}>


                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginBottom: '10px' }}>
                            {__('Transition styles (diagonal, fade), vertical orientation, and reverse reveal are not included in this build.', 'kinetichub')}
                        </p>

                        <RangeControl label={__('Start Position (%)', 'kinetichub')} value={initialOffset} onChange={(v) => setAttributes({ initialOffset: v })} min={0} max={100} help={__('Initial slider position. 50% = equal split.', 'kinetichub')} />
                        <ToggleControl 
                            label={__('Enable Hover Zoom', 'kinetichub')} 
                            checked={hoverZoom} 
                            onChange={(v) => setAttributes({ hoverZoom: v })}
                            help={__('Images zoom slightly on hover.', 'kinetichub')}

                        />
                        <hr/>
                        <ToggleControl label={__('Auto-Play Intro Animation', 'kinetichub')} checked={autoPlayIntro} onChange={(v) => setAttributes({ autoPlayIntro: v })} help={__('Dramatic reveal when block first appears.', 'kinetichub')} />
                        



                        <ToggleControl 
                            label={__('Click to Move', 'kinetichub')} 
                            checked={clickToMove} 
                            onChange={(v) => setAttributes({ clickToMove: v })}
                            help={__('Click anywhere to jump slider to that position.', 'kinetichub')}
                        />


                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginTop: '8px' }}>
                            {__('Hover-to-slide, inertia, and magnetic snap are not included in this build.', 'kinetichub')}
                        </p>

                    </PanelBody>

                    <PanelBody title={__('🎛️ Handle & Pulse', 'kinetichub')} initialOpen={false}>

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


                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginTop: '8px' }}>
                            {__('Handle styles and pulse effects are not included in this build.', 'kinetichub')}
                        </p>

                        <p style={{fontWeight:'bold', marginTop:'10px', marginBottom:'5px'}}>{__('Handle Background Color', 'kinetichub')}</p>
                        <p style={{fontSize:'12px', color:'#757575', marginBottom:'8px'}}>{__('Background color of the slider handle circle. Choose high contrast for visibility against your images.', 'kinetichub')}</p>
                        <ColorPalette value={handleColor} enableAlpha={true} onChange={(v) => setAttributes({ handleColor: v })} />
                        
                        <p style={{fontWeight:'bold', marginTop:'10px', marginBottom:'5px'}}>{__('Icon / Text Color', 'kinetichub')}</p>
                        <p style={{fontSize:'12px', color:'#757575', marginBottom:'8px'}}>{__('Color of the arrows, text, or icon inside the handle. Should contrast with handle background.', 'kinetichub')}</p>
                        <ColorPalette value={handleIconColor} enableAlpha={true} onChange={(v) => setAttributes({ handleIconColor: v })} />
                    </PanelBody>



                    <PanelBody title={__('📱 Mobile Settings', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic' }}>
                            {__('Mobile aspect ratio and hide-labels-on-mobile are not included in this build.', 'kinetichub')}
                        </p>
                    </PanelBody>


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
                                


                                <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', marginTop: '8px' }}>
                                    {__('Label color customization is not included in this build.', 'kinetichub')}
                                </p>

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


                                    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 3 12 9 6"></polyline><polyline points="15 18 21 12 15 6"></polyline></svg>

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