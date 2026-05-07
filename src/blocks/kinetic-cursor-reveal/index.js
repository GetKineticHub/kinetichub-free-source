/**
 * Kinetic Cursor Reveal - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ColorPalette, Button, TextControl, ToggleControl, Notice, Flex, FlexItem, __experimentalDivider as Divider } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';


import metadata from './block.json';

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
             = attributes;

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
        let editorStyle = { color: '#1a1a1a' };
        

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

        let previewFontSize = 40;
        let previewSubtitleSize = 13;
        let previewSubtitleColor = '#666666';
        let previewSubtitleSpacing = 3;
        let previewContainerShadow = false;
        

        return (
            <>
                <InspectorControls>
                    {/* ITEM EDITOR PANEL */}
                    <PanelBody title={__('📝 List Items', 'kinetichub')} initialOpen={true}>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                            {__('Add and edit your list items with titles, subtitles, media, and links.', 'kinetichub')}
                        </p>

                        
                        {items.length >= 3 && (
                            <div style={{ marginBottom: '15px', padding: '10px 12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', fontSize: '12px', color: '#856404' }}>
                                {__('FREE version supports up to 3 items. More items not included in this build.', 'kinetichub')}
                            </div>
                        )}
                        

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
                                                            <Button onClick={() => updateItem(index, 'mediaUrl', '')} isDestructive size="small" style={{ position: 'absolute', top: '5px', right: '5px' }}>
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
                            <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', padding: '10px 0' }}>
                                {__('Up to 50 items not included in this build.', 'kinetichub')}
                            </p>
                        )}
                        

                        {items.length > 0 && (
                            <>
                                <Divider style={{ margin: '20px 0' }} />
                                <ToggleControl label={__('Open Links in New Tab', 'kinetichub')} checked={openInNewTab} onChange={(v) => setAttributes({ openInNewTab: v })} help={__('Applies to all items with links', 'kinetichub')} />
                            </>
                        )}
                    </PanelBody>

                    
                    
                    <PanelBody title={__('✍️ Text Styling', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#6b7280', padding: '10px 0' }}>{__('Text reveal styles, font sizes, focus dimming, and accent colors are not included in this build.', 'kinetichub')}</p>
                    </PanelBody>
                    

                    
                    
                    <PanelBody title={__('🏷️ Subtitle Styling', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#6b7280', padding: '10px 0' }}>{__('Subtitle color, size, and spacing customization are not included in this build.', 'kinetichub')}</p>
                    </PanelBody>
                    

                    
                    
                    <PanelBody title={__('🎬 Media Settings', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#6b7280', padding: '10px 0' }}>{__('Media styles, blend modes, layer control, masks, filters, width, and aspect ratio are not included in this build.', 'kinetichub')}</p>
                    </PanelBody>
                    

                    
                    
                    <PanelBody title={__('⚡ Physics Engine', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#6b7280', padding: '10px 0' }}>{__('Magnetic hover, inner parallax, offset positioning, smoothness, and velocity tilt are not included in this build.', 'kinetichub')}</p>
                    </PanelBody>
                    

                    
                </InspectorControls>

                {/* PREVIEW */}
                <div {...blockProps}>
                    <div className="kh-cr-editor-preview" style={{ padding: '30px 20px', textAlign: 'center', border: '2px dashed #e0e0e0', borderRadius: '12px', background: '#fafafa', overflow: 'hidden' }}>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px', fontWeight: '500' }}>{__('✨ Editor Preview - Interactive features appear on frontend', 'kinetichub')}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start', maxWidth: '100%', overflow: 'hidden' }}>
                            {items.map((item, index) => (
                                <div key={index} style={{ width: '100%', padding: '16px 20px', background: '#fff', borderRadius: '8px', boxShadow: previewContainerShadow ? '0 4px 12px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.04)', textAlign: 'left', border: '1px solid #f0f0f0', transition: 'all 0.3s ease' }}>
                                    {item.title && ( <div style={{ fontSize: `${previewFontSize}px`, fontWeight: 'bold', color: '#1a1a1a', marginBottom: item.subtitle ? '6px' : '0', wordWrap: 'break-word' }}>{item.title}</div> )}
                                    {item.subtitle && ( <div style={{ fontSize: `${previewSubtitleSize}px`, color: previewSubtitleColor || '#666', textTransform: 'uppercase', letterSpacing: `${previewSubtitleSpacing}px`, opacity: 0.8 }}>{item.subtitle}</div> )}
                                    {item.mediaUrl && ( <div style={{ marginTop: '12px', fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}><span>📸</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{item.mediaUrl.split('/').pop()}</span></div> )}
                                    {item.url && ( <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}><span>🔗</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>{item.url}</span></div> )}
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '20px', padding: '12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px' }}>
                            <p style={{ fontSize: '11px', color: '#856404', margin: 0, lineHeight: '1.5' }}>
                                💡 <strong>{__('Preview shows basic layout only.', 'kinetichub')}</strong><br />
                                {__('Hover effects, physics, and animations appear on frontend.', 'kinetichub')}<br />
                                {__('Edit items using the "List Items" panel on the right →', 'kinetichub')}
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    },
    save: () => null,
});