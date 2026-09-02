/**
 * Kinetic Split Scroll - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, InnerBlocks, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, ColorPalette, SelectControl, Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';


import { KineticOverlayControls } from '../../components/OverlayControls';
import { KineticImageFitControls } from '../../components/ImageFitControls';

import { KineticEditorNotice } from '../../components/EditorNotice';

import { InspectorHelp, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';


import metadata from './block.json';

const BLOCKS_TEMPLATE = [
    ['core/spacer', { height: '50px' }],
    ['core/heading', { level: 2, content: 'Scroll to explore...' }],
    ['core/paragraph', { content: 'Add your descriptive content here. As the user scrolls through this text, the pinned media on the opposite side will stay in place.' }],
    ['core/spacer', { height: '100vh' }],
    ['core/heading', { level: 2, content: 'Next Section' }],
    ['core/paragraph', { content: 'If Smart Swap is enabled, the pinned image will crossfade to the next image in your gallery.' }],
    ['core/spacer', { height: '50vh' }]
];

registerBlockType(metadata.name, {
    icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="8" height="16" rx="1" stroke="currentColor" strokeWidth="2"/>
            <rect x="13" y="4" width="8" height="16" rx="1" fill="currentColor" opacity="0.3"/>
            <path d="M15 8H19M15 12H19M15 16H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),

    edit: (props) => {
        const { attributes, setAttributes, isSelected } = props;
        const { 
            pinnedSide, columnRatio, stickyOffset, stackOnMobile, enableStickyMobile,
            mediaItems, enableSmartSwap, imageSize, objectFit, objectPosition,
            indicatorType, accentColor, mediaShape, enableKenBurns,
            overlayTint, overlayOpacity, textEffect, enableSnap, align,
            pinnedBgColor, containerShadow, shadowStyle, shadowColor, hoverShadowColor,
            shadowSoftness, mobileShadowSoftness, shadowOpacity, hoverShadowOpacity,
            dotsInteractive, swapTransition, innerParallax, ambientGlow, ambientGlowColor, ambientGlowSpread,
            scrollBgMorphing, bgMorphStart, bgMorphEnd
        } = attributes;

        let maxMedia = 3;
        

        const onAddMedia = (media) => {
            const newItems = [...mediaItems]; 
            newItems.push({ 
                id: media.id, 
                url: media.url, 
                alt: media.alt || '', 
                sizes: media.sizes || {} 
            });
            setAttributes({ mediaItems: newItems });
        };

        const onRemoveMedia = (index) => {
            setAttributes({ mediaItems: mediaItems.filter((_, i) => i !== index) });
        };

        const onMoveMedia = (index, direction) => {
            const targetIndex = index + direction;

            if (targetIndex < 0 || targetIndex >= mediaItems.length) {
                return;
            }

            const newItems = [...mediaItems];
            [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
            setAttributes({ mediaItems: newItems });
        };

        const getMediaUrl = (item) => {
            if (item.sizes && item.sizes[imageSize]) {
                return item.sizes[imageSize].url;
            }
            return item.url; 
        };

        const isVideoUrl = (url) => url && url.match(/\.(mp4|webm)$/i);

        let leftWidth = '50%'; let rightWidth = '50%';
        if (columnRatio === '40/60') { leftWidth = '40%'; rightWidth = '60%'; }
        if (columnRatio === '60/40') { leftWidth = '60%'; rightWidth = '40%'; }
        
        const pinnedWidth = pinnedSide === 'left' ? leftWidth : rightWidth;
        const scrollWidth = pinnedSide === 'left' ? rightWidth : leftWidth;
        
        const isPlaceholder = mediaItems.length === 0;

        // FREE-safe normalized values for editor classes and data attributes
        let editorTextEffect = ['none', 'fade-up'].includes(textEffect) ? textEffect : 'none';
        let editorSwapTrans = 'fade';
        let editorKenBurns = false;
        let editorBgMorph = false;
        let editorShadowClass = '';
        let editorMediaShape = 'default';
        let editorParallax = false;
        let editorDotsInteractive = false;
        let editorAmbientGlow = false;

        

        // FREE-safe indicator options
        let editorIndicatorOptions = [
            {label: __('Vertical Line', 'kinetichub'), value: 'line'},
            {label: __('None', 'kinetichub'), value: 'none'}
        ];
        

        // FREE-safe text effect options
        let editorTextEffectOptions = [
            {label: __('None (Standard)', 'kinetichub'), value: 'none'}, 
            {label: __('Fade Up on Enter', 'kinetichub'), value: 'fade-up'}
        ];
        

        const cssVars = {
            '--kh-ss-pin-w': pinnedWidth, 
            '--kh-ss-scroll-w': scrollWidth, 
            '--kh-ss-offset': `${stickyOffset}px`, 
            '--kh-ss-fit': objectFit, 
            '--kh-ss-pos': objectPosition, 
            '--kh-ss-tint': overlayTint, 
            '--kh-ss-tint-op': overlayOpacity, 
            '--kh-ss-accent': accentColor || 'var(--kh-accent, #10b981)', 
            '--kh-ss-dir': pinnedSide === 'left' ? 'row' : 'row-reverse', 
            '--kh-ss-mob-dir': stackOnMobile === 'media-first' ? 'column' : 'column-reverse',
            '--kh-ss-pin-bg': pinnedBgColor,
            '--kh-ss-glow-c': ambientGlowColor,
            '--kh-ss-glow-s': `${ambientGlowSpread}px`,
            '--kh-ss-bg-start': bgMorphStart,
            '--kh-ss-bg-end': bgMorphEnd,
            ...(containerShadow && shadowColor && { '--kh-ss-shadow-c': shadowColor }),
            ...(containerShadow && hoverShadowColor && { '--kh-ss-shadow-c-hov': hoverShadowColor }),
            ...(containerShadow && shadowSoftness !== undefined && { '--kh-ss-shadow-blur': `${shadowSoftness}px` }),
            ...(containerShadow && mobileShadowSoftness !== undefined && { '--kh-ss-shadow-blur-mob': `${mobileShadowSoftness}px` }),
            ...(containerShadow && shadowOpacity !== undefined && { '--kh-ss-shadow-o': shadowOpacity }),
            ...(containerShadow && hoverShadowOpacity !== undefined && { '--kh-ss-shadow-o-hov': hoverShadowOpacity })
        };

        

        const standardClasses = `kh-ss-wrapper ${align ? `align${align}` : ''} ${editorKenBurns ? 'has-ken-burns' : ''} text-fx-${editorTextEffect} ${editorShadowClass} ${enableStickyMobile ? 'has-mobile-sticky' : ''} swap-trans-${editorSwapTrans} ${editorBgMorph ? 'has-bg-morph' : ''}`.replace(/\s+/g, ' ').trim();

        const blockProps = useBlockProps({
            className: isPlaceholder ? 'kh-ss-placeholder-wrapper' : standardClasses,
            style: isPlaceholder 
                ? { ...cssVars, padding: '30px', border: '2px dashed #ccc', background: '#f9f9f9', borderRadius: '8px', maxWidth: '100%' } 
                : cssVars,
            'data-shape': editorMediaShape,
            'data-offset': stickyOffset,
            'data-sticky-mobile': enableStickyMobile ? 'true' : 'false',
            'data-parallax': editorParallax ? 'true' : 'false',
            'data-dots-interactive': editorDotsInteractive ? 'true' : 'false',
            'data-bg-morph': editorBgMorph ? 'true' : 'false'
        });

        if (isPlaceholder) {
            return (
                <div {...blockProps}>
                    <Placeholder
                        icon="layout"
                        label={__('Kinetic Split Scroll', 'kinetichub')}
                        instructions={__('Select or upload images/videos to initialize the split-screen layout.', 'kinetichub')}
                        className="kh-ss-editor-placeholder"
                    >
                        <MediaUploadCheck>
                            <MediaUpload
                                onSelect={onAddMedia}
                                allowedTypes={['image', 'video']}
                                render={({ open }) => (
                                    <Button variant="primary" onClick={open}>{__('Set Media Gallery', 'kinetichub')}</Button>
                                )}
                            />
                        </MediaUploadCheck>
                    </Placeholder>
                </div>
            );
        }

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('🖼️ Pinned Media Gallery', 'kinetichub')} initialOpen={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{__('Gallery Items', 'kinetichub')}</p>
                            
                            <span style={{ fontSize: '10px', color: '#64748b' }}>{__('Max 3 items', 'kinetichub')}</span>
                            
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            {mediaItems.map((item, index) => {
                                const url = getMediaUrl(item);
                                return (
                                <div key={item.id || index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', background: '#f0f0f0', padding: '5px', borderRadius: '4px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '2px', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isVideoUrl(url) ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
                                        ) : (
                                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.alt || __('Thumbnail', 'kinetichub')} />
                                        )}
                                    </div>
                                    <span style={{ flex: 1, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{__('Media', 'kinetichub')} {index + 1}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                        <Button
                                            isSmall
                                            icon="arrow-up-alt2"
                                            aria-label={__('Move media up', 'kinetichub')}
                                            title={__('Move media up', 'kinetichub')}
                                            disabled={index === 0}
                                            onClick={() => onMoveMedia(index, -1)}
                                        />
                                        <Button
                                            isSmall
                                            icon="arrow-down-alt2"
                                            aria-label={__('Move media down', 'kinetichub')}
                                            title={__('Move media down', 'kinetichub')}
                                            disabled={index === mediaItems.length - 1}
                                            onClick={() => onMoveMedia(index, 1)}
                                        />
                                        <Button
                                            isDestructive
                                            isSmall
                                            icon="trash"
                                            aria-label={__('Remove media', 'kinetichub')}
                                            title={__('Remove media', 'kinetichub')}
                                            onClick={() => onRemoveMedia(index)}
                                        />
                                    </div>
                                </div>
                            )})}
                        </div>
                        <MediaUploadCheck>
                            <MediaUpload
                                onSelect={onAddMedia}
                                allowedTypes={['image', 'video']}
                                render={({ open }) => (
                                    <Button 
                                        variant="secondary" 
                                        onClick={open} 
                                        disabled={mediaItems.length >= maxMedia}
                                        style={{ width: '100%', justifyContent: 'center' }}>
                                        {mediaItems.length >= maxMedia ? __('Gallery Full', 'kinetichub') : __('+ Add Media', 'kinetichub')}
                                    </Button>
                                )}
                            />
                        </MediaUploadCheck>
                        <hr/>
                        <SelectControl 
                            label={labelWithHelp(__('Image Resolution', 'kinetichub'), __('Which registered size WordPress serves for each gallery image. The pinned media fills half the viewport, so Large is usually enough; Full sends the original file and is the slowest to load.', 'kinetichub'))}
                            value={imageSize} 
                            options={[
                                {label: __('Full (Highest Quality)', 'kinetichub'), value: 'full'}, 
                                {label: __('Large (Optimized)', 'kinetichub'), value: 'large'},
                                {label: __('Medium (Faster)', 'kinetichub'), value: 'medium'}
                            ]} 
                            onChange={(v) => setAttributes({ imageSize: v })} 
                        />
                        <ToggleControl label={labelWithHelp(__('Smart Media Swap (Crossfade)', 'kinetichub'), __('The pinned media changes as the reader passes through the text column, one gallery item per section. With a single item there is nothing to swap to and the media simply stays put.', 'kinetichub'))} checked={enableSmartSwap} onChange={(v) => setAttributes({ enableSmartSwap: v })} />
                    </PanelBody>

                    
                    
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <ProNote
                            text={__('Extra motion and atmosphere for the pinned column: wipe, circle and diagonal swap transitions in place of the crossfade, an inner parallax on the image, an ambient glow behind it, and a section background that morphs from one colour to another as the reader scrolls.', 'kinetichub')}
                        />
                    </PanelBody>
                    

                    <KineticImageFitControls attributes={attributes} setAttributes={setAttributes} />

                    <PanelBody title={__('📐 Pinned Media Design', 'kinetichub')} initialOpen={false}>
                        
                        
                        <ProNote
                            text={__('The pinned media can be cut to a shape rather than filling the column - a floating card with its own shadow, an arch window or a tall pill - and given a slow Ken Burns zoom while the reader is stopped on it.', 'kinetichub')}
                        />
                        
                        <hr/>
                        <p style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                            {__('Pinned Area Background', 'kinetichub')}
                            <InspectorHelp
                                label={__('Pinned Area Background', 'kinetichub')}
                                text={__('Colour behind the pinned media. It shows wherever the media does not cover the column - around a shaped mask, or in the gaps left when Image Fit is set to Contain.', 'kinetichub')}
                            />
                        </p>
                        <ColorPalette value={pinnedBgColor} onChange={(v) => setAttributes({ pinnedBgColor: v })} enableAlpha={true} />
                    </PanelBody>

                    <KineticOverlayControls attributes={attributes} setAttributes={setAttributes} />

                    <PanelBody title={__('📜 Scroll Effects', 'kinetichub')} initialOpen={false}>
                        <SelectControl 
                            label={labelWithHelp(__('Text Column Effect', 'kinetichub'), __('How the blocks in the scrolling column arrive. None leaves them static; Fade Up brings each one in as it enters the viewport.', 'kinetichub'))}
                            value={editorTextEffect} 
                            options={editorTextEffectOptions} 
                            onChange={(v) => setAttributes({ textEffect: v })} 
                        />
                        <ToggleControl label={labelWithHelp(__('Magnetic Snap to Content', 'kinetichub'), __('Uses browser scroll snapping to settle the page on whichever text block is nearest, instead of stopping anywhere. It is switched off below 768px, where the layout is stacked.', 'kinetichub'))} checked={enableSnap} onChange={(v) => setAttributes({ enableSnap: v })} />
                    </PanelBody>

                    <PanelBody title={__('📍 Progress Indicator', 'kinetichub')} initialOpen={false}>
                        <SelectControl 
                            label={labelWithHelp(__('Indicator Style', 'kinetichub'), __('The scroll-progress marker beside the pinned media. Vertical Line fills as the reader moves through the section; None hides it. The indicator is hidden on screens 768px and under whatever this is set to.', 'kinetichub'))}
                            value={indicatorType} 
                            options={editorIndicatorOptions} 
                            onChange={(v) => setAttributes({ indicatorType: v })} 
                        />
                        
                        <ProNote
                            text={__('Two more ways to show progress: pagination dots, one per gallery item, and a floating percentage readout. The dots can also be made clickable, so a reader can jump straight to a section.', 'kinetichub')}
                        />
                        
                        {indicatorType !== 'none' && (
                            <>
                                <p style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                    {__('Accent Color', 'kinetichub')}
                                    <InspectorHelp
                                        label={__('Accent Color', 'kinetichub')}
                                        text={__('Colour of the progress indicator itself. Left empty it follows the theme accent KineticHub is using.', 'kinetichub')}
                                    />
                                </p>
                                <ColorPalette value={accentColor} onChange={(v) => setAttributes({ accentColor: v })} enableAlpha={true} />
                            </>
                        )}
                    </PanelBody>

                    <PanelBody title={__('📐 Layout Settings', 'kinetichub')} initialOpen={false}>
                        <SelectControl label={__('Pinned Side', 'kinetichub')} value={pinnedSide} options={[{label: __('Left', 'kinetichub'), value: 'left'}, {label: __('Right', 'kinetichub'), value: 'right'}]} onChange={(v) => setAttributes({ pinnedSide: v })} />
                        <SelectControl label={labelWithHelp(__('Column Ratio', 'kinetichub'), __('Widths of the two columns as left/right - always in that order, whichever side is pinned. 60/40 gives the left column the larger share.', 'kinetichub'))} value={columnRatio} options={[{label: '50/50', value: '50/50'}, {label: '40/60', value: '40/60'}, {label: '60/40', value: '60/40'}]} onChange={(v) => setAttributes({ columnRatio: v })} />
                        <SelectControl label={labelWithHelp(__('Mobile Stacking', 'kinetichub'), __('Which column comes first once the two stack, at 768px and below. It has no effect on the side-by-side desktop layout.', 'kinetichub'))} value={stackOnMobile} options={[{label: __('Media on Top', 'kinetichub'), value: 'media-first'}, {label: __('Text on Top', 'kinetichub'), value: 'text-first'}]} onChange={(v) => setAttributes({ stackOnMobile: v })} />
                        
                        <RangeControl label={labelWithHelp(__('Sticky Top Offset (px)', 'kinetichub'), __('How far below the top of the viewport the pinned column comes to rest. Raise it to clear a fixed header that would otherwise cover the media.', 'kinetichub'))} value={stickyOffset} onChange={(v) => setAttributes({ stickyOffset: v })} min={0} max={200} />
                        
                        <hr/>
                        <ToggleControl 
                            label={labelWithHelp(__('Enable Sticky Media on Mobile', 'kinetichub'), __('Keeps the media pinned once the columns stack at 768px and below. Left off, the media scrolls away with the rest of the page, which suits short text.', 'kinetichub'))}
                            checked={enableStickyMobile} 
                            onChange={(v) => setAttributes({ enableStickyMobile: v })} 
                        />
                    </PanelBody>

                    
                    
                    <PanelBody title={__('📦 Custom Shadows', 'kinetichub')} initialOpen={false}>
                        <ProNote
                            text={__('Container shadows with their own colour, softness and opacity - including separate hover and mobile values - plus per-device visibility, so the whole block can be shown on desktop and hidden on phones.', 'kinetichub')}
                        />
                    </PanelBody>
                    

                </InspectorControls>

                <div {...blockProps}>
                    <div className="kh-ss-pinned-col">
                        
                        <div className="kh-ss-media-inner">
                            {mediaItems.map((item, index) => {
                                const url = getMediaUrl(item);
                                return (
                                <div key={item.id || index} className={`kh-ss-media-layer ${index === 0 ? 'is-active' : ''}`} data-index={index}>
                                    {isVideoUrl(url) ? (
                                        <video src={url} autoPlay loop muted playsInline style={{width: '100%', height: '100%', objectFit: objectFit, objectPosition: objectPosition}}></video>
                                    ) : (
                                        <img src={url} alt={item.alt || __('Image', 'kinetichub')} />
                                    )}
                                </div>
                            )})}
                            <div className="kh-ss-overlay-tint" aria-hidden="true"></div>
                        </div>

                        {indicatorType !== 'none' && (
                            <div className={`kh-ss-indicator-wrap pos-${pinnedSide} ${indicatorType === 'percentage' ? 'has-percentage' : ''} ${indicatorType === 'dots' ? 'has-dots' : ''}`}>
                                {indicatorType === 'line' && <div className="kh-ss-progress-line" aria-hidden="true"><div className="kh-ss-progress-fill"></div></div>}
                                {indicatorType === 'dots' && mediaItems.map((_, i) => {
                                    const dotLabel = `${__('Go to section', 'kinetichub')} ${i + 1}`;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`kh-ss-dot ${i===0?'is-active':''}`}
                                            data-dot-index={i}
                                            aria-label={dotLabel}
                                            title={dotLabel}
                                        ></button>
                                    );
                                })}
                                {indicatorType === 'percentage' && <div className="kh-ss-percentage">0%</div>}
                            </div>
                        )}

                        {/*
                          * The pinning, the crossfade between gallery items and the
                          * parallax are all driven by page scroll, and none of it runs
                          * in Gutenberg -- the editor shows the first media layer,
                          * standing still.
                          *
                          * Anchored inside the pinned column, which the editor
                          * stylesheet gives position: relative and a real 600px
                          * height, so the toast has a containing block with genuine
                          * height instead of the zero-height line an empty wrapper
                          * would give it. The indicator sits at top: 50%, so the
                          * bottom corner it settles into is clear of it.
                          *
                          * isPlaceholder is already false by the time this renders --
                          * that state returns earlier -- and is named anyway so the
                          * condition still reads correctly if that return ever moves.
                          */}
                        {isSelected && !isPlaceholder && (
                            <KineticEditorNotice message={__('Scroll-driven transitions and media motion run on the live frontend.', 'kinetichub')} />
                        )}
                    </div>

                    <div className="kh-ss-scroll-col">
                        <div style={{ padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', marginBottom: '20px', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                            {__('↓ Drop Content Blocks Below ↓', 'kinetichub')}
                        </div>
                        <InnerBlocks template={BLOCKS_TEMPLATE} />
                    </div>
                </div>
            </>
        );
    },
    save: () => <InnerBlocks.Content /> 
});