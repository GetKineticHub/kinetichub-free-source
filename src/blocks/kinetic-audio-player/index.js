/**
 * Kinetic Audio Player Pro - Editor Script
 * Version: 1.0.0
 
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, RichText, MediaPlaceholder, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, ColorPalette, SelectControl, Button, TextControl } from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

import { KineticEntranceControls } from '../../components/EntranceControls';
import { KineticVisibilityControls } from '../../components/VisibilityControls';
import { KineticShadowControls } from '../../components/ShadowControls';
import { KineticEditorNotice } from '../../components/EditorNotice';

const generateId = () => window.crypto && crypto.randomUUID ? crypto.randomUUID().split('-')[0] : Math.random().toString(36).substr(2, 9);

registerBlockType(metadata.name, {
    icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
    ),
    edit: (props) => {
        const { attributes, setAttributes, clientId, isSelected } = props;
        const { 
            blockId, audioUrl, text, subtitle, coverUrl, playerLayout, 
            compactSize, stickyBehavior, stickyPosition, stickyStyle, preloadStrategy,
            showWaveform, waveformStyle, enableSeekbar, disableMobileSeek, 
            allowDownload, enableVolume, timeDisplayMode, glowStyle, magneticHover,
            rememberPosition, pauseOnTabSwitch, bgColor, textColor, accentColor, 
            progressColor, borderRadius, paddingV, paddingH, align,
            containerShadow, shadowStyle
        } = attributes;

        const [isPlaying, setIsPlaying] = useState(false);
        const prevClientIdRef = useRef(clientId);

        // Technical Note: Required for localStorage "Remember Playback" functionality
        useEffect(() => {
            const isDuplicated = prevClientIdRef.current !== clientId;
            if (!blockId || isDuplicated) {
                setAttributes({ blockId: `kh-ap-${generateId()}` });
                prevClientIdRef.current = clientId;
            }
        }, [blockId, clientId, setAttributes]);

        const isCompact = playerLayout === 'compact';
        
        const dynamicStyles = {
            '--kh-ap-bg': bgColor || '#111111',
            '--kh-ap-text': textColor || '#ffffff',
            '--kh-ap-accent': accentColor || 'var(--kh-accent, #10b981)',
            '--kh-ap-progress': enableSeekbar ? (progressColor || 'rgba(255,255,255,0.15)') : 'transparent',
            '--kh-ap-br': isCompact ? '50%' : (borderRadius || 50) + 'px',
            '--kh-ap-pad-v': isCompact ? '0px' : (paddingV || 16) + 'px',
            '--kh-ap-pad-h': isCompact ? '0px' : (paddingH || 32) + 'px',
            '--kh-ap-width': isCompact ? `${compactSize || 160}px` : 'auto',
            '--kh-ap-height': isCompact ? `${compactSize || 160}px` : 'auto',
            '--kh-ap-jc': isCompact ? 'center' : 'flex-start',
        };

        const blockProps = useBlockProps({
            className: `kh-ap-wrapper ${blockId}`,
            style: { display: 'flex', justifyContent: align || 'center', alignItems: 'center', width: '100%' }
        });

        const handleVisualPlay = (e) => {
            e.preventDefault(); e.stopPropagation();
            setIsPlaying(!isPlaying);
        };

        let editorGlowClass = '';
        /* <fs_premium_only> */
        editorGlowClass = glowStyle !== 'none' ? `kh-ap-glow-${glowStyle}` : '';
        /* </fs_premium_only> */

        let editorWaveformStyle = 'default';
        /* <fs_premium_only> */
        editorWaveformStyle = waveformStyle;
        /* </fs_premium_only> */

        let showEditorTools = !isCompact && enableVolume;
        /* <fs_premium_only> */
        showEditorTools = !isCompact && (allowDownload || enableVolume);
        /* </fs_premium_only> */

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('🎧 Audio Source & Media', 'kinetichub')} initialOpen={true}>
                        {!audioUrl ? (
                            <MediaPlaceholder 
                                accept="audio/*" 
                                allowedTypes={['audio']} 
                                multiple={false}
                                labels={{
                                    title: __('Audio Source', 'kinetichub'),
                                    instructions: __('Upload an audio file or pick one from the library.', 'kinetichub')
                                }}
                                onSelect={(media) => {
                                    if (media && media.type === 'audio') {
                                        setAttributes({ audioUrl: media.url });
                                    }
                                }} 
                            />
                        ) : (
                            <div style={{ marginBottom: '15px' }}>
                                <TextControl label={__('Audio URL', 'kinetichub')} value={audioUrl} onChange={(v) => setAttributes({ audioUrl: v })} />
                                <Button variant="secondary" isDestructive onClick={() => setAttributes({ audioUrl: '' })} style={{ width: '100%', justifyContent: 'center' }}>
                                    {__('Remove Audio', 'kinetichub')}
                                </Button>
                            </div>
                        )}
                        <hr/>
                        <MediaUploadCheck>
                            <MediaUpload onSelect={(media) => setAttributes({ coverUrl: media.url })} allowedTypes={['image']} render={({ open }) => (
                                <Button variant="secondary" onClick={open} style={{ width: '100%', justifyContent: 'center' }}>
                                    {coverUrl ? __('Change Cover Image', 'kinetichub') : __('Add Cover Image', 'kinetichub')}
                                </Button>
                            )} />
                        </MediaUploadCheck>
                        {coverUrl && (
                            <Button variant="link" isDestructive onClick={() => setAttributes({ coverUrl: '' })} style={{ marginTop: '5px' }}>
                                {__('Remove Image', 'kinetichub')}
                            </Button>
                        )}
                        
                        <div style={{ marginTop: '20px' }}>
                            <SelectControl 
                                label={__('Preload Strategy', 'kinetichub')} 
                                value={preloadStrategy} 
                                options={[
                                    {label: __('Metadata Only (Recommended)', 'kinetichub'), value: 'metadata'}, 
                                    {label: __('Auto (Load full file)', 'kinetichub'), value: 'auto'}, 
                                    {label: __('None (Do not load)', 'kinetichub'), value: 'none'}
                                ]} 
                                onChange={(v) => setAttributes({ preloadStrategy: v })} 
                                help={__('Controls how much of the file the browser downloads automatically.', 'kinetichub')}
                            />
                        </div>
                    </PanelBody>

                    <PanelBody title={__('⚙️ Layout & Sticky Behavior', 'kinetichub')} initialOpen={false}>
                        <SelectControl label={__('Player Style', 'kinetichub')} value={playerLayout} options={[{label: __('Standard (Extended)', 'kinetichub'), value: 'extended'}, {label: __('Compact (Circle)', 'kinetichub'), value: 'compact'}]} onChange={(v) => setAttributes({ playerLayout: v })} help={__('Extended bar or compact circle.', 'kinetichub')} />
                        {isCompact && <RangeControl label={__('Circle Size (px)', 'kinetichub')} value={compactSize} onChange={(v) => setAttributes({ compactSize: v })} min={60} max={300} step={5} help={__('Diameter of the circle player.', 'kinetichub')} />}
                        <SelectControl label={__('Block Alignment', 'kinetichub')} value={align} options={[{label: 'Left', value: 'flex-start'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'flex-end'}]} onChange={(v) => setAttributes({ align: v })} help={__('Player position in the container.', 'kinetichub')} />
                        
                        {/* <fs_premium_only> */}
                        <hr/>
                        <SelectControl 
                            label={__('Sticky Mode', 'kinetichub')} 
                            value={stickyBehavior} 
                            options={[{label: 'Disabled', value: 'none'}, {label: 'Sticky Top', value: 'sticky-top'}, {label: 'Floating Widget', value: 'floating'}]} 
                            onChange={(v) => setAttributes({ stickyBehavior: v })} 
                            help={__('Pins player while scrolling.', 'kinetichub')}
                        />
                        
                        {stickyBehavior !== 'none' && (
                            <>
                                <SelectControl label={__('Sticky Position', 'kinetichub')} value={stickyPosition} options={[{label: 'Left Side', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right Side', value: 'right'}]} onChange={(v) => setAttributes({ stickyPosition: v })} help={__('Side where the player floats.', 'kinetichub')} />
                                {!isCompact && <SelectControl label={__('Frontend Sticky Style', 'kinetichub')} value={stickyStyle} options={[{label: 'Classic Box', value: 'box'}, {label: 'Modern Pill', value: 'pill'}, {label: 'Custom Glass', value: 'custom'}]} onChange={(v) => setAttributes({ stickyStyle: v })} help={__('Visual shape of the sticky player.', 'kinetichub')} />}
                                
                                <KineticEditorNotice message={__('Notice: Sticky and Floating behaviors are frontend-only features and will not render inside the Gutenberg editor.', 'kinetichub')} status="info" />
                            </>
                        )}
                        {/* </fs_premium_only> */}

                        {/* <fs_free_only> */}
                        <hr/>
                        <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                            {__('Additional sticky and floating options are available in KineticHub Pro, distributed separately from WordPress.org.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}
                        
                        {!isCompact && <SelectControl label={__('Time Display Mode', 'kinetichub')} value={timeDisplayMode} options={[{label: 'Hidden', value: 'none'}, {label: 'Elapsed Time', value: 'elapsed'}, {label: 'Remaining Time', value: 'remaining'}, {label: 'Total Duration', value: 'total'}]} onChange={(v) => setAttributes({ timeDisplayMode: v })} help={__('Shows current, remaining, or total.', 'kinetichub')} />}
                    </PanelBody>

                    <PanelBody title={__('🎨 Colors & Styling', 'kinetichub')} initialOpen={false}>
                        <ColorPalette value={bgColor} onChange={(v) => setAttributes({ bgColor: v })} enableAlpha={true} />
                        <p style={{fontSize: '11px', marginTop:'5px'}}>{__('Text & Icon Color', 'kinetichub')}</p>
                        <ColorPalette value={textColor} onChange={(v) => setAttributes({ textColor: v })} enableAlpha={true} />
                        <p style={{fontSize: '11px', marginTop:'5px'}}>{__('Accent Color', 'kinetichub')}</p>
                        <ColorPalette value={accentColor} onChange={(v) => setAttributes({ accentColor: v })} enableAlpha={true} />
                        <p style={{fontSize: '11px', marginTop:'5px'}}>{__('Progress Background', 'kinetichub')}</p>
                        <ColorPalette value={progressColor} onChange={(v) => setAttributes({ progressColor: v })} enableAlpha={true} />
                        <hr/>
                        {!isCompact && (
                            <>
                                <RangeControl label={__('Border Radius', 'kinetichub')} value={borderRadius} onChange={(v) => setAttributes({ borderRadius: v })} min={0} max={50} help={__('Rounds the player corners.', 'kinetichub')} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                    <RangeControl label={__('Inner V-Padding', 'kinetichub')} value={paddingV} onChange={(v) => setAttributes({ paddingV: v })} min={5} max={40} help={__('Top/bottom space inside player.', 'kinetichub')} />
                                    <RangeControl label={__('Inner H-Padding', 'kinetichub')} value={paddingH} onChange={(v) => setAttributes({ paddingH: v })} min={10} max={60} help={__('Left/right space inside player.', 'kinetichub')} />
                                </div>
                            </>
                        )}
                    </PanelBody>

                    <PanelBody title={__('🧠 Engine & Advanced', 'kinetichub')} initialOpen={false}>
                        {/* <fs_premium_only> */}
                        <ToggleControl label={__('Magnetic Hover Effect', 'kinetichub')} checked={magneticHover} onChange={(v) => setAttributes({ magneticHover: v })} help={__('Player leans toward cursor.', 'kinetichub')} />
                        
                        <SelectControl 
                            label={__('Player Glow Style', 'kinetichub')} 
                            value={glowStyle} 
                            options={[{label: 'None', value: 'none'}, {label: 'Soft Ambient', value: 'soft-ambient'}, {label: 'Neon Cyberpunk', value: 'neon-cyberpunk'}, {label: 'Pulsing Aura', value: 'pulsing-aura'}]} 
                            onChange={(v) => setAttributes({ glowStyle: v })} 
                            help={__('Ambient light around the player.', 'kinetichub')}
                        />
                        <hr/>
                        {/* </fs_premium_only> */}
                        
                        <ToggleControl label={__('Show Animated Waveform', 'kinetichub')} checked={showWaveform} onChange={(v) => setAttributes({ showWaveform: v })} help={__('Animated bars synced to audio.', 'kinetichub')} />
                        {showWaveform && (
                            <>
                                {/* <fs_premium_only> */}
                                <SelectControl 
                                    label={__('Waveform Style', 'kinetichub')} 
                                    value={waveformStyle} 
                                    options={[{label: 'Default (Bars)', value: 'default'}, {label: 'Box (Sharp)', value: 'box'}, {label: 'Pill (Rounded)', value: 'pill'}]} 
                                    onChange={(v) => setAttributes({ waveformStyle: v })} 
                                    help={__('Shape of the visualizer bars.', 'kinetichub')}
                                />
                                {/* </fs_premium_only> */}
                            </>
                        )}
                        
                        <ToggleControl label={__('Enable Interactive Seekbar', 'kinetichub')} checked={enableSeekbar} onChange={(v) => setAttributes({ enableSeekbar: v })} help={__('Click to jump to any position.', 'kinetichub')} />
                        {enableSeekbar && (
                            <>
                                {/* <fs_premium_only> */}
                                <ToggleControl 
                                    label={__('Disable Seek on Mobile', 'kinetichub')} 
                                    checked={disableMobileSeek} 
                                    onChange={(v) => setAttributes({ disableMobileSeek: v })} 
                                    help={__('Prevents accidental seeks on touch.', 'kinetichub')}
                                />
                                {/* </fs_premium_only> */}
                            </>
                        )}

                        {/* <fs_premium_only> */}
                        <ToggleControl 
                            label={__('Remember Playback Position', 'kinetichub')} 
                            checked={rememberPosition} 
                            onChange={(v) => setAttributes({ rememberPosition: v })} 
                            help={__('Saves user progress in localStorage.', 'kinetichub')}
                        />
                        <ToggleControl 
                            label={__('Pause on Tab Switch', 'kinetichub')} 
                            checked={pauseOnTabSwitch} 
                            onChange={(v) => setAttributes({ pauseOnTabSwitch: v })} 
                            help={__('Pauses when browser tab is hidden.', 'kinetichub')}
                        />
                        {/* </fs_premium_only> */}
                        
                        {!isCompact && (
                            <>
                                <ToggleControl label={__('Show Volume Control', 'kinetichub')} checked={enableVolume} onChange={(v) => setAttributes({ enableVolume: v })} help={__('Volume button and slider.', 'kinetichub')} />
                                {/* <fs_premium_only> */}
                                <ToggleControl 
                                    label={__('Allow Audio Download', 'kinetichub')} 
                                    checked={allowDownload} 
                                    onChange={(v) => setAttributes({ allowDownload: v })} 
                                    help={__('Shows download link for the audio.', 'kinetichub')}
                                />
                                {/* </fs_premium_only> */}
                            </>
                        )}

                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '10px' }}>
                            {__('Additional options are available in KineticHub Pro, distributed separately from WordPress.org.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}
                    </PanelBody>

                    <PanelBody title={__('📦 Shadow & Depth', 'kinetichub')} initialOpen={false}>
                        <KineticShadowControls attributes={attributes} setAttributes={setAttributes} />
                    </PanelBody>

                    <KineticEntranceControls attributes={attributes} setAttributes={setAttributes} />

                    <KineticVisibilityControls attributes={attributes} setAttributes={setAttributes} />
                </InspectorControls>

                <div {...blockProps}>
                    <div className={`kh-ap-button kh-ap-editor-preview ${isCompact ? 'is-compact' : 'is-extended'} ${isPlaying ? 'is-playing' : ''} ${editorGlowClass} ${enableSeekbar ? 'has-seekbar' : ''} ${containerShadow ? `has-shadow shadow-${shadowStyle}` : ''}`} style={dynamicStyles}>
                        
                        {!isCompact && (
                            <div className="kh-ap-progress-container" aria-hidden="true">
                                <div className="kh-ap-progress-fill" style={{ width: isPlaying ? '45%' : '0%' }}></div>
                            </div>
                        )}
                        
                        {isCompact && enableSeekbar && (
                            <svg className="kh-ap-progress-circle-svg" aria-hidden="true" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="var(--kh-ap-progress)" strokeWidth="4" />
                            </svg>
                        )}
                        <span className="kh-ap-play-pause-trigger" onClick={handleVisualPlay} style={{ cursor: 'pointer' }}>
                            {coverUrl ? <img src={coverUrl} className="kh-ap-cover-img" alt={__('Cover', 'kinetichub')} /> : (
                                <span className="kh-ap-icon-main">
                                    {isPlaying ? <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}
                                </span>
                            )}
                        </span>
                        {!isCompact && (
                            <span className="kh-ap-text-wrapper">
                                <RichText tagName="span" className="kh-ap-title" value={text} onChange={(v) => setAttributes({ text: v })} placeholder={__('Song Title', 'kinetichub')} onClick={(e) => e.stopPropagation()} />
                                <RichText tagName="span" className="kh-ap-subtitle" value={subtitle} onChange={(v) => setAttributes({ subtitle: v })} placeholder={__('Artist Name', 'kinetichub')} onClick={(e) => e.stopPropagation()} />
                            </span>
                        )}
                        {timeDisplayMode !== 'none' && !isCompact && <span className="kh-ap-time-display">-03:05</span>}
                        {showWaveform && (
                            <div className={`kh-ap-visualizer is-style-${editorWaveformStyle}`} aria-hidden="true">
                                <div className="kh-ap-bar"></div><div className="kh-ap-bar"></div><div className="kh-ap-bar"></div><div className="kh-ap-bar"></div>
                            </div>
                        )}
                        {showEditorTools && (
                            <div className="kh-ap-tools">
                                {enableVolume && (
                                    <div className="kh-ap-vol-wrapper">
                                        <button className="kh-ap-tool-btn kh-ap-vol-btn" onClick={(e) => e.preventDefault()}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button>
                                        <input type="range" className="kh-ap-vol-slider" min="0" max="100" defaultValue="100" readOnly />
                                    </div>
                                )}
                                {/* <fs_premium_only> */}
                                {allowDownload && <a href="#" className="kh-ap-tool-btn kh-ap-dl-btn" onClick={(e) => e.preventDefault()}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a>}
                                {/* </fs_premium_only> */}
                            </div>
                        )}
                    </div>
                    {isSelected && (
                        <KineticEditorNotice message={__('Audio playback & advanced glow physics active on Frontend', 'kinetichub')} />
                    )}
                </div>
            </>
        );
    },
    save: () => null 
});