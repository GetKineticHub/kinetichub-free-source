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

import { InspectorHelp, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';


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
            
        }), [handleColor, handleIconColor,
            
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
        

        // handleStyle is destructured inside a premium region, so it does not exist in
        // FREE. Same shape as editorPulseEffect above, and as render.php, where the
        // FREE default is 'classic' and PRO overrides it from the attribute.
        let editorHandleStyle = 'classic';
        

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
                            label={labelWithHelp(__('Image Ratio (Crop)', 'kinetichub'), __('Auto leaves each image at its own proportions, so two images that were not shot alike will not line up. Any fixed ratio crops both into the same box, which guarantees they do.', 'kinetichub'))}
                            value={aspectRatio} 
                            options={[
                                {label: __('Auto (Original)', 'kinetichub'), value:'auto'}, 
                                {label: __('16:9 (Widescreen)', 'kinetichub'), value:'16/9'}, 
                                {label: __('1:1 (Square)', 'kinetichub'), value:'1/1'}, 
                                {label: __('4:3 (Standard)', 'kinetichub'), value:'4/3'}, 
                                {label: __('3:4 (Portrait)', 'kinetichub'), value:'3/4'}
                            ]} 
                            onChange={(v) => setAttributes({ aspectRatio: v })}
                        />

                        <hr style={{margin: '20px 0'}} />

                        
                        
                        <ProNote
                            text={__('The before image can carry its own treatment: grayscale, sepia, blur, invert or high contrast, plus a colour wash with adjustable opacity - all applied to that side alone.', 'kinetichub')}
                        />
                        

                        <SelectControl 
                            label={labelWithHelp(__('After Image Filter', 'kinetichub'), __('Applies to the after image only. Leave it at None when the before filter is already carrying the contrast between the two.', 'kinetichub'))}
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
                        />
                        {afterFilter === 'blur' && (
                            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                <RangeControl 
                                    label={labelWithHelp(__('Blur Intensity (px)', 'kinetichub'), __('Blur radius in pixels, applied to the after image only - the way to build a sharp-against-soft focus comparison.', 'kinetichub'))}
                                    value={afterBlurIntensity} 
                                    onChange={(v) => setAttributes({ afterBlurIntensity: v })} 
                                    min={1} max={20}
                                />
                            </div>
                        )}
                        {afterFilter === 'color' && (
                            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                <ColorPalette value={afterOverlayColor} enableAlpha={true} onChange={(v) => setAttributes({ afterOverlayColor: v })} />
                                <RangeControl 
                                    label={labelWithHelp(__('Opacity', 'kinetichub'), __('How strongly the colour covers the after image. 0 leaves it untouched, 1 replaces it with solid colour.', 'kinetichub'))}
                                    value={afterOverlayOpacity} 
                                    onChange={(v) => setAttributes({ afterOverlayOpacity: v })} 
                                    min={0} max={1} step={0.1}
                                />
                            </div>
                        )}
                    </PanelBody>

                    
                    
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <ProNote
                            text={__('Depth and guidance for the comparison itself: an inner parallax that shifts both images against the divider, a hold-to-peek mode that springs back on release, and a badge that follows the cursor to invite the first drag.', 'kinetichub')}
                        />
                    </PanelBody>
                    

                    <PanelBody title={__('🚀 Engine & Transitions', 'kinetichub')} initialOpen={false}>
                        
                        
                        <ProNote
                            text={__('The reveal itself opens up: a vertical split, an angled diagonal cut, a fade with no edge, and the option to reverse which image is uncovered. Interaction gains hover-to-slide, inertia that lets the divider glide on after release, snapping to the quarter points, and four styles for the intro animation.', 'kinetichub')}
                        />
                        
                        <RangeControl label={labelWithHelp(__('Start Position (%)', 'kinetichub'), __('Where the divider rests before anyone touches it. 0 shows the after image alone, 100 shows the before image alone.', 'kinetichub'))} value={initialOffset} onChange={(v) => setAttributes({ initialOffset: v })} min={0} max={100} />
                        <ToggleControl 
                            label={labelWithHelp(__('Enable Hover Zoom', 'kinetichub'), __('Both images scale up slightly while the pointer is over the block.', 'kinetichub'))}
                            checked={hoverZoom} 
                            onChange={(v) => setAttributes({ hoverZoom: v })}
                            
                        />
                        <hr/>
                        <ToggleControl label={labelWithHelp(__('Auto-Play Intro Animation', 'kinetichub'), __('Plays a one-off reveal the first time the block scrolls into view, then hands control back to the visitor. It is skipped for anyone who asks for reduced motion.', 'kinetichub'))} checked={autoPlayIntro} onChange={(v) => setAttributes({ autoPlayIntro: v })} />
                        
                        

                        
                        <ToggleControl 
                            label={labelWithHelp(__('Click to Move', 'kinetichub'), __('A click anywhere on the image jumps the divider to that point, so the comparison works without a drag.', 'kinetichub'))}
                            checked={clickToMove} 
                            onChange={(v) => setAttributes({ clickToMove: v })}
                        />
                        
                    </PanelBody>

                    <PanelBody title={__('🎛️ Handle & Pulse', 'kinetichub')} initialOpen={false}>
                        
                        <SelectControl 
                            label={labelWithHelp(__('Divider Line Style', 'kinetichub'), __('The line between the two images, not the handle sitting on it. Solid is a plain rule, Neon adds a glow around it, and Gradient fades the line out towards its ends.', 'kinetichub'))}
                            value={dividerStyle} 
                            options={[
                                {label: __('Solid Line', 'kinetichub'), value: 'solid'}, 
                                {label: __('Neon Glow', 'kinetichub'), value: 'neon'}, 
                                {label: __('Faded Gradient', 'kinetichub'), value: 'gradient'}
                            ]} 
                            onChange={(v) => setAttributes({ dividerStyle: v })}
                        />
                        
                        
                        <ProNote
                            text={__('The handle can take other shapes - a minimal dot, or a text handle in place of the arrows - and carry a looping attention effect: a soft glow, a sonar ripple, fluid morphing, magnetic focus, glassmorphism or target brackets.', 'kinetichub')}
                        />
                        
                        <p style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                            {__('Handle Background Color', 'kinetichub')}
                            <InspectorHelp
                                label={__('Handle Background Color', 'kinetichub')}
                                text={__('Fill of the circle the visitor drags. It has to stay visible against both images - a handle that disappears into a bright sky is a comparison nobody finds.', 'kinetichub')}
                            />
                        </p>
                        <ColorPalette value={handleColor} enableAlpha={true} onChange={(v) => setAttributes({ handleColor: v })} />
                        
                        <p style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                            {__('Icon / Text Color', 'kinetichub')}
                            <InspectorHelp
                                label={__('Icon / Text Color', 'kinetichub')}
                                text={__('Colour of the arrows or text inside the handle. This one needs to contrast with the handle fill above it, not with the images.', 'kinetichub')}
                            />
                        </p>
                        <ColorPalette value={handleIconColor} enableAlpha={true} onChange={(v) => setAttributes({ handleIconColor: v })} />
                    </PanelBody>

                    
                    
                    <PanelBody title={__('📱 Mobile Settings', 'kinetichub')} initialOpen={false}>
                        <ProNote
                            text={__('Phones can be treated separately: a taller crop just for screens 768px and under, and the option to drop the Before and After captions where they would sit over the images.', 'kinetichub')}
                        />
                    </PanelBody>
                    

                    <PanelBody title={__('🏷️ Labels & Styling', 'kinetichub')} initialOpen={false}>
                        <ToggleControl 
                            label={labelWithHelp(__('Show Labels', 'kinetichub'), __('Puts a caption on each side of the divider so the visitor knows which image they are looking at.', 'kinetichub'))}
                            checked={showLabels} 
                            onChange={(v) => setAttributes({ showLabels: v })}
                        />
                        {showLabels && (
                            <>
                                <TextControl 
                                    label={labelWithHelp(__('Before Label', 'kinetichub'), __('Caption for the before side. "Old", "Original" and "Then" all work as well as the default.', 'kinetichub'))}
                                    value={beforeLabel} 
                                    onChange={(v) => setAttributes({ beforeLabel: v })}
                                />
                                <TextControl 
                                    label={labelWithHelp(__('After Label', 'kinetichub'), __('Caption for the after side. "New", "Improved" and "Now" all work as well as the default.', 'kinetichub'))}
                                    value={afterLabel} 
                                    onChange={(v) => setAttributes({ afterLabel: v })}
                                />
                                <ToggleControl 
                                    label={labelWithHelp(__('Hide Labels While Moving', 'kinetichub'), __('The captions fade out while the divider is being dragged and come back when it stops, so nothing sits over the images mid-comparison.', 'kinetichub'))}
                                    checked={hideLabelsOnMove} 
                                    onChange={(v) => setAttributes({ hideLabelsOnMove: v })}
                                />
                                
                                
                                
                                <ProNote
                                    text={__('The captions can be styled rather than left at white on translucent black - text colour and label background are both open, alpha included.', 'kinetichub')}
                                />
                                
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
                                    {/*
                                      * One icon producer, gated exactly like render.php: classic draws the
                                      * chevrons, minimal draws nothing, text swaps in the label. There used to
                                      * be a second, unconditional copy in a FREE-only region beside this one.
                                      * Only the strip-built packages ever separated the two, so the unstripped
                                      * dev build rendered both: the editor showed doubled chevrons and Handle
                                      * Style could never clear them. editorHandleStyle keeps the FREE build
                                      * correct without needing that duplicate.
                                      */}
                                    {editorHandleStyle === 'classic' && <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isHoriz ? 'none' : 'rotate(90deg)' }}><polyline points="9 18 3 12 9 6"></polyline><polyline points="15 18 21 12 15 6"></polyline></svg>}
                                    
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
                        <KineticEditorNotice message={__('Slider dragging and kinetic motion run on the live frontend.', 'kinetichub')} />
                    )}
                </div>
            </>
        );
    },
    save: () => null 
});