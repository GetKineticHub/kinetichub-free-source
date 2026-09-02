/**
 * Kinetic Cursor Reveal - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ColorPalette, Button, TextControl, ToggleControl, Flex, FlexItem, __experimentalDivider as Divider } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';


import metadata from './block.json';

import { InspectorHelp, InspectorNote, InspectorNotice, labelWithHelp } from '../../components/InspectorUX';
import { KineticEditorNotice } from '../../components/EditorNotice';

import { ProNote } from '../../components/InspectorUX';


const kineticCursorIcon = <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 12H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M14.5 11L18.5 19L20 17.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconUp = <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;
const IconDown = <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconTrash = <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconImage = <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;

const generateId = () => window.crypto && crypto.randomUUID ? crypto.randomUUID().split('-')[0] : Math.random().toString(36).substr(2, 9);

registerBlockType(metadata.name, {
    icon: kineticCursorIcon,
    edit: (props) => {
        const { attributes, setAttributes, isSelected, clientId } = props;
        const {
            blockId, items, openInNewTab,
            fontSize, mobileFontSize,
            subtitleColor, subtitleSize, subtitleSpacing,
            mediaWidth, mediaRatio, revealMask, hoverFilter,
            itemGap, showItemBorder, itemBorderColor,
            
        } = attributes;

        const prevClientIdRef = useRef(clientId);

        // Generate unique blockId on first mount
        useEffect(() => {
            if (!blockId || prevClientIdRef.current !== clientId) {
                setAttributes({ blockId: `kh-cr-${generateId()}` });
                prevClientIdRef.current = clientId;
            }
        }, [blockId, clientId, setAttributes]);

        // Ensure at least 2 items exist with defaults
        useEffect(() => {
            if (!items || items.length === 0) {
                setAttributes({
                    items: [
                        { title: 'Brand Identity', subtitle: 'Strategy & Logo', mediaUrl: '', url: '' },
                        { title: 'Web Experience', subtitle: 'FSE Development', mediaUrl: '', url: '' }
                    ]
                });
            }
        }, [items, setAttributes]);

        let editorClassName = `kh-cr-editor-wrapper ${blockId || ''}`;
        let editorStyle = {
            '--kh-cr-font-size': `${fontSize}px`,
            '--kh-cr-font-mob': `${mobileFontSize}px`,
            '--kh-cr-scale': fontSize > 0 ? ((fontSize + 10) / fontSize).toFixed(3) : '1',
            '--kh-cr-scale-mob': mobileFontSize > 0 ? (Math.max(10, mobileFontSize + 10) / mobileFontSize).toFixed(3) : '1',
            '--kh-cr-accent': 'var(--kh-accent, #10b981)',
            '--kh-cr-sub-color': subtitleColor || '#666666',
            '--kh-cr-sub-size': `${subtitleSize}px`,
            '--kh-cr-sub-space': `${subtitleSpacing}px`,
            '--kh-cr-item-gap': `${itemGap ?? 50}px`,
            '--kh-cr-item-border-w': (showItemBorder !== false) ? '1px' : '0px',
            '--kh-cr-item-border-c': itemBorderColor || 'rgba(127,127,127,0.15)',
            color: '#1a1a1a'
        };
        

        const blockProps = useBlockProps({
            className: editorClassName,
            style: editorStyle
        });

        // Item manipulation functions
        const updateItem = (index, field, value) => {
            const newItems = [...items];
            newItems[index] = { ...newItems[index], [field]: value };
            setAttributes({ items: newItems });
        };

        let maxItems = 3;
        

        const addItem = () => {
            if (items.length >= maxItems) {
                return;
            }
            setAttributes({
                items: [...items, { title: '', subtitle: '', mediaUrl: '', url: '' }]
            });
        };

        const deleteItem = (index) => {
            if (items.length <= 1) return;
            const newItems = items.filter((_, i) => i !== index);
            setAttributes({ items: newItems });
        };

        const moveItem = (index, direction) => {
            const newItems = [...items];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newItems.length) return;
            [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
            setAttributes({ items: newItems });
        };

        const canAddMore = items.length < maxItems;

        const previewFontSize = fontSize;
        const previewSubtitleSize = subtitleSize;
        const previewSubtitleColor = subtitleColor;
        const previewSubtitleSpacing = subtitleSpacing;
        let previewContainerShadow = false;
        

        return (
            <>
                <InspectorControls>
                    {/* ITEM EDITOR PANEL */}
                    <PanelBody title={__('📝 List Items', 'kinetichub')} initialOpen={true}>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                            {__('Add and edit your list items with titles, subtitles, media, and links.', 'kinetichub')}
                        </p>

                        {items.map((item, index) => (
                            <div key={index} style={{
                                background: '#f8f9fa',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '15px'
                            }}>
                                <Flex justify="space-between" align="center" style={{ marginBottom: '10px' }}>
                                    <FlexItem>
                                        <strong style={{ fontSize: '13px' }}>Item {index + 1}</strong>
                                    </FlexItem>
                                    <FlexItem>
                                        <Flex gap={1}>
                                            {index > 0 && (
                                                <Button icon={IconUp} onClick={() => moveItem(index, 'up')} size="small" label={__('Move up', 'kinetichub')} />
                                            )}
                                            {index < items.length - 1 && (
                                                <Button icon={IconDown} onClick={() => moveItem(index, 'down')} size="small" label={__('Move down', 'kinetichub')} />
                                            )}
                                            {items.length > 1 && (
                                                <Button icon={IconTrash} onClick={() => deleteItem(index)} size="small" isDestructive label={__('Delete item', 'kinetichub')} />
                                            )}
                                        </Flex>
                                    </FlexItem>
                                </Flex>

                                <TextControl label={__('Title', 'kinetichub')} value={item.title} onChange={(v) => updateItem(index, 'title', v)} placeholder={__('Enter title...', 'kinetichub')} help={__('Main text shown for this item', 'kinetichub')} />
                                <TextControl label={__('Subtitle (Optional)', 'kinetichub')} value={item.subtitle} onChange={(v) => updateItem(index, 'subtitle', v)} placeholder={__('Enter subtitle...', 'kinetichub')} help={__('Small text below title', 'kinetichub')} />

                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase' }}>
                                        {__('Media (Image/Video)', 'kinetichub')}
                                    </label>
                                    <MediaUploadCheck>
                                        <MediaUpload
                                            onSelect={(media) => updateItem(index, 'mediaUrl', media.url)}
                                            allowedTypes={['image', 'video']}
                                            value={item.mediaUrl}
                                            render={({ open }) => (
                                                <div>
                                                    {item.mediaUrl ? (
                                                        <div style={{ position: 'relative', marginBottom: '10px' }}>
                                                            {item.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                                                                <video src={item.mediaUrl} style={{ width: '100%', borderRadius: '4px', maxHeight: '150px', objectFit: 'cover' }} />
                                                            ) : (
                                                                <img src={item.mediaUrl} alt="" style={{ width: '100%', borderRadius: '4px', maxHeight: '150px', objectFit: 'cover' }} />
                                                            )}
                                                            <Button onClick={() => updateItem(index, 'mediaUrl', '')} isDestructive size="small" style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,255,255,0.92)', border: '1px solid #cc1818', borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
                                                                {__('Remove', 'kinetichub')}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button onClick={open} variant="secondary" icon={IconImage} style={{ width: '100%', justifyContent: 'center', padding: '40px 10px', border: '2px dashed #ddd' }}>
                                                            {__('Upload Media', 'kinetichub')}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </MediaUploadCheck>
                                    <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>{__('Image or video that appears on hover', 'kinetichub')}</p>
                                </div>

                                <TextControl label={__('Link URL (Optional)', 'kinetichub')} value={item.url} onChange={(v) => updateItem(index, 'url', v)} placeholder="https://" type="url" help={__('Where clicking this item should navigate', 'kinetichub')} />
                            </div>
                        ))}

                        {canAddMore && (
                            <Button variant="primary" onClick={addItem} style={{ width: '100%', justifyContent: 'center' }}>
                                {__('+ Add New Item', 'kinetichub')}
                            </Button>
                        )}

                        
                        {!canAddMore && (
                            <ProNote
                                text={__('Three items is the cap here. Fifty are available, which is what a full portfolio or services index needs.', 'kinetichub')}
                            />
                        )}
                        

                        {items.length > 0 && (
                            <>
                                <Divider style={{ margin: '20px 0' }} />
                                <ToggleControl label={__('Open Links in New Tab', 'kinetichub')} checked={openInNewTab} onChange={(v) => setAttributes({ openInNewTab: v })} help={__('Applies to all items with links', 'kinetichub')} />
                            </>
                        )}
                    </PanelBody>

                    <PanelBody title={__('✍️ Text Styling', 'kinetichub')} initialOpen={false}>
                        <RangeControl label={labelWithHelp(__('Font Size (Desktop)', 'kinetichub'), __('Resting size of the item titles in pixels, used above 768px. This block is usually set far larger than body copy - the list is the headline.', 'kinetichub'))} value={fontSize} onChange={(v) => setAttributes({ fontSize: v })} min={10} max={300} />
                        <RangeControl label={labelWithHelp(__('Font Size (Mobile)', 'kinetichub'), __('Title size in pixels at 768px and below, where the desktop size would usually break the line.', 'kinetichub'))} value={mobileFontSize} onChange={(v) => setAttributes({ mobileFontSize: v })} min={10} max={200} />
                        
                        
                        <ProNote
                            text={__('The titles themselves can react: outline-to-solid, blur-into-focus and lift reveals, a hover size the text grows to, dimming of every other row, and an accent colour for the active one.', 'kinetichub')}
                        />
                        
                    </PanelBody>

                    <PanelBody title={__('🏷️ Subtitle Styling', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>{__('Subtitle Color', 'kinetichub')}</p>
                        <ColorPalette value={subtitleColor} onChange={(v) => setAttributes({ subtitleColor: v })} />
                        <RangeControl label={labelWithHelp(__('Subtitle Size', 'kinetichub'), __('Size of the small line under each title, in pixels. It is rendered in uppercase, which reads smaller than the same value in sentence case.', 'kinetichub'))} value={subtitleSize} onChange={(v) => setAttributes({ subtitleSize: v })} min={8} max={100} />
                        <RangeControl label={labelWithHelp(__('Letter Spacing', 'kinetichub'), __('Extra space between the subtitle letters, in pixels. A little tracking is what makes small uppercase text legible.', 'kinetichub'))} value={subtitleSpacing} onChange={(v) => setAttributes({ subtitleSpacing: v })} min={0} max={50} />
                    </PanelBody>

                    <PanelBody title={__('📐 List Layout', 'kinetichub')} initialOpen={false}>
                        <RangeControl
                            label={labelWithHelp(__('Item Vertical Spacing', 'kinetichub'), __('Padding above and below each row, in pixels. It sets how much of the page the list occupies and how far the pointer travels between items.', 'kinetichub'))}
                            value={itemGap ?? 50}
                            onChange={(v) => setAttributes({ itemGap: v })}
                            min={0}
                            max={100}
                            step={5}
                        />
                        <ToggleControl
                            label={labelWithHelp(__('Show Item Divider', 'kinetichub'), __('Draws a hairline under every row. With generous spacing the list often reads better without it.', 'kinetichub'))}
                            checked={showItemBorder !== false}
                            onChange={(v) => setAttributes({ showItemBorder: v })}
                        />
                        {(showItemBorder !== false) && (
                            <>
                                <p style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '5px' }}>
                                    {__('Divider Color', 'kinetichub')}
                                </p>
                                <ColorPalette
                                    value={itemBorderColor || undefined}
                                    onChange={(v) => setAttributes({ itemBorderColor: v || '' })}
                                    enableAlpha={true}
                                />
                            </>
                        )}
                    </PanelBody>

                    <PanelBody title={__('🎬 Media Settings', 'kinetichub')} initialOpen={false}>
                        <RangeControl label={labelWithHelp(__('Media Width', 'kinetichub'), __('Width of the floating preview in pixels, between 100 and 1200. Height is not set directly - it follows from this width and the aspect ratio below.', 'kinetichub'))} value={mediaWidth} onChange={(v) => setAttributes({ mediaWidth: v })} min={100} max={1200} />
                        <SelectControl label={labelWithHelp(__('Media Aspect Ratio', 'kinetichub'), __('Shape of the floating preview. Height comes from the width above at this ratio, so a tall ratio on a wide preview makes a large picture.', 'kinetichub'))} value={mediaRatio} options={[ { label: __('4:5 Portrait', 'kinetichub'), value: '4/5' }, { label: __('1:1 Square', 'kinetichub'), value: '1/1' }, { label: __('16:9 Landscape', 'kinetichub'), value: '16/9' }, { label: __('21:9 Ultrawide', 'kinetichub'), value: '21/9' } ]} onChange={(v) => setAttributes({ mediaRatio: v })} />
                        <SelectControl label={labelWithHelp(__('Reveal Mask', 'kinetichub'), __('How the preview arrives once a row is hovered: a plain fade, a circle opening out, a diagonal wipe, or a curtain.', 'kinetichub'))} value={revealMask} options={[ { label: __('Fade', 'kinetichub'), value: 'fade' }, { label: __('Circle Expand', 'kinetichub'), value: 'circle' }, { label: __('Diagonal Wipe', 'kinetichub'), value: 'diagonal' }, { label: __('Curtain', 'kinetichub'), value: 'curtain' } ]} onChange={(v) => setAttributes({ revealMask: v })} />
                        <SelectControl label={labelWithHelp(__('Hover Filter', 'kinetichub'), __('Grayscale to Color starts the preview desaturated and brings the colour up as it settles. None shows it as uploaded.', 'kinetichub'))} value={hoverFilter} options={[ { label: __('None', 'kinetichub'), value: 'none' }, { label: __('Grayscale to Color', 'kinetichub'), value: 'grayscale' } ]} onChange={(v) => setAttributes({ hoverFilter: v })} />
                        
                        
                        <ProNote
                            text={__('The floating preview can be styled and layered: glass, vignette, polaroid and glow treatments, optical blend modes that let the titles read through the image, a choice of painting it over or under the list, and a film-grain overlay.', 'kinetichub')}
                        />
                        
                    </PanelBody>

                    
                    
                    <PanelBody title={__('⚡ Physics Engine', 'kinetichub')} initialOpen={false}>
                        <ProNote
                            text={__('How the preview follows the cursor becomes adjustable: the smoothing that makes it trail and glide, X and Y offsets from the pointer, a velocity tilt as it swings, a magnetic pull on the hovered title, and parallax inside the frame.', 'kinetichub')}
                        />
                    </PanelBody>
                    

                    
                </InspectorControls>

                {/* PREVIEW */}
                <div {...blockProps}>
                    {/*
                      * position: relative is what the toast is anchored to. It is
                      * absolutely positioned, and without a positioned ancestor here it
                      * would settle against the editor canvas instead of this preview.
                      */}
                    <div className="kh-cr-editor-preview" style={{ position: 'relative', padding: '30px 20px', textAlign: 'center', border: '2px dashed #e0e0e0', borderRadius: '12px', background: '#fafafa', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', maxWidth: '100%', overflow: 'hidden' }}>
                            {items.map((item, index) => (
                                <div key={index} style={{ width: '100%', paddingTop: `${itemGap ?? 50}px`, paddingBottom: `${itemGap ?? 50}px`, paddingLeft: '20px', paddingRight: '20px', background: '#fff', borderRadius: '8px', boxShadow: previewContainerShadow ? '0 4px 12px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.04)', textAlign: 'left', border: '1px solid #f0f0f0', borderBottom: (showItemBorder !== false) ? `1px solid ${itemBorderColor || 'rgba(127,127,127,0.15)'}` : '1px solid #f0f0f0', transition: 'all 0.3s ease' }}>
                                    {item.title && ( <div style={{ fontSize: `${previewFontSize}px`, fontWeight: 'bold', color: '#1a1a1a', marginBottom: item.subtitle ? '6px' : '0', wordWrap: 'break-word' }}>{item.title}</div> )}
                                    {item.subtitle && ( <div style={{ fontSize: `${previewSubtitleSize}px`, color: previewSubtitleColor || '#666', textTransform: 'uppercase', letterSpacing: `${previewSubtitleSpacing}px`, opacity: 0.8 }}>{item.subtitle}</div> )}
                                    {item.mediaUrl && ( <div style={{ marginTop: '12px', fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}><span>📸</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{item.mediaUrl.split('/').pop()}</span></div> )}
                                    {item.url && ( <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}><span>🔗</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>{item.url}</span></div> )}
                                </div>
                            ))}
                        </div>
                        {/*
                          * Two different things were being said in one panel, and only one
                          * of them is transient. "The interactive parts run on the
                          * frontend" was also being said twice, once here and once at the
                          * top of this preview; it is the toast now, said once.
                          *
                          * What stays printed is the authoring consequence: a list item
                          * with no reveal image renders nothing at all. That is a thing to
                          * go and fix, so it has to still be here after the next click --
                          * KineticEditorNotice hides itself on any interaction, which is
                          * exactly why this line is not inside one.
                          */}
                        <div style={{ marginTop: '20px', padding: '12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px' }}>
                            <p style={{ fontSize: '11px', color: '#856404', margin: 0, lineHeight: '1.5' }}>
                                💡 {__('If no reveal image is selected, nothing will appear on the frontend.', 'kinetichub')}
                            </p>
                        </div>

                        <KineticEditorNotice message={__('Hover effects, physics, and animations appear on frontend.', 'kinetichub')} />
                    </div>
                </div>
            </>
        );
    },
    save: () => null,
});