/**
 * Kinetic Box - Editor Script
 * Version: 1.0.0
  (Unified Wrapper + Speed Math)
 */

import { registerBlockType } from '@wordpress/blocks';
import { 
    useBlockProps, InnerBlocks, InspectorControls,
    BlockControls, AlignmentControl, BlockVerticalAlignmentToolbar, BlockAlignmentToolbar
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl, SelectControl, Button, RangeControl, TabPanel, ColorPalette, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';


import { KineticVisibilityControls } from '../../components/VisibilityControls';
import { KineticEditorNotice } from '../../components/EditorNotice';

import metadata from './block.json';
import './style.scss';

const kineticIcon = (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7C4 5.34315 5.34315 4 7 4H17C18.6569 4 20 5.34315 20 7V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V7Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12L12 8L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

registerBlockType(metadata.name, {
    icon: kineticIcon,
    edit: ({ attributes, setAttributes, isSelected }) => {
        const {
            preset, animationType, transitionSpeed, easing, 
            entranceAnimation, entranceDelay, bringToFront,
            zoomImages, zoomIntensity, hasGlow, isGrayscale, enableGlass, glassOpacity, blurIntensity,
            hoverIntensity, mobileIntensity, rotation,
            shadowSoftness, mobileShadowSoftness, shadowOpacity, hoverShadowOpacity, 
            shadowColor, hoverShadowColor, hoverBgColor, hoverBorderColor, hoverTextColor,
            url, linkLabel, openInNewTab, linkRel, stretchedLink, hideOnMobile, hideOnDesktop,
            tiltEffect, magneticHover, enableParallax, minHeight, boxWidth, boxAlign, hAlign, vAlign,
            spotlightGlow, spotlightColor, spotlightSize, filmGrain, grainOpacity, idleLevitation, crispEdge, edgeColor
        } = attributes;

        const applyPreset = (type) => {
            const baseReset = { preset: 'custom', animationType: 'lift', hoverIntensity: 20, shadowSoftness: 20, shadowOpacity: 0.1, hoverShadowOpacity: 0.2, hoverBgColor: '', hoverBorderColor: '', hoverTextColor: '' };
            
            const presets = {
                reset: { ...baseReset },
                soft_elevate: { ...baseReset, preset: 'soft_elevate', hoverIntensity: 15, shadowSoftness: 40, shadowOpacity: 0.05, hoverShadowOpacity: 0.15 },
                minimal_scale: { ...baseReset, preset: 'minimal_scale', animationType: 'scale', hoverIntensity: 5, shadowSoftness: 10 },
                ;
            if(presets[type]) {
                setAttributes(presets[type]);
            }
        };

        const presetOptions = [
            { label: __('Custom', 'kinetichub'), value: 'custom' }, 
            { label: __('Soft Elevate', 'kinetichub'), value: 'soft_elevate' }, 
            { label: __('Minimal Scale', 'kinetichub'), value: 'minimal_scale' }, 
            
        ];

        const animOptions = [
            {label: __('None', 'kinetichub'), value: 'none'},
            {label: __('Lift (Z-Axis)', 'kinetichub'), value: 'lift'},
            {label: __('Scale (Grow)', 'kinetichub'), value: 'scale'},
            {label: __('Tilt (CSS)', 'kinetichub'), value: 'tilt'},
            
        ];

        const hasCustomBg = (hoverBgColor && hoverBgColor.length > 1);
        const hasCustomText = (hoverTextColor && hoverTextColor.length > 1);
        const hasCustomBorder = (hoverBorderColor && hoverBorderColor.length > 1);
        
        const flexHAlign = hAlign === 'center' ? 'center' : (hAlign === 'right' ? 'flex-end' : 'flex-start');
        const flexVAlign = vAlign === 'center' ? 'center' : (vAlign === 'bottom' ? 'flex-end' : 'flex-start');

        // FIX: Matematica pentru maparea vitezei (0.1 slider = 0.6 fizic) pentru a preveni glitch-ul de mouse
        const safeSpeedRaw = Math.max(0.1, Math.min(2.0, transitionSpeed || 0.4));
        const mappedEngineSpeed = (0.6 + ((safeSpeedRaw - 0.1) / 1.9) * 1.4).toFixed(2);

        let isPhysicsActive = false;
        

        let marginL = '0'; let marginR = '0'; let alignSelf = 'center';
        if (boxAlign === 'center') { marginL = 'auto'; marginR = 'auto'; alignSelf = 'center'; }
        else if (boxAlign === 'right') { marginL = 'auto'; marginR = '0'; alignSelf = 'flex-end'; }
        else if (boxAlign === 'left') { marginL = '0'; marginR = 'auto'; alignSelf = 'flex-start'; }

        const cssVars = {
            '--kh-box-speed': `${mappedEngineSpeed}s`,
            '--kh-box-bezier': easing === 'bouncy' ? 'cubic-bezier(0.68, -0.6, 0.32, 1.6)' : (easing === 'snappy' ? 'cubic-bezier(0.25, 1, 0.5, 1)' : 'ease'),
            '--kh-box-intensity': hoverIntensity,
            '--kh-box-m-intensity': mobileIntensity,
            '--kh-box-rot': `${rotation}deg`,
            '--kh-box-shadow-blur': `${shadowSoftness}px`,
            '--kh-box-m-blur': `${mobileShadowSoftness}px`,
            '--kh-box-base-shadow': shadowColor,
            '--kh-box-hover-shadow': hoverShadowColor,
            '--kh-box-hover-bg': hoverBgColor || 'transparent',
            '--kh-box-hover-border': hoverBorderColor || 'transparent',
            '--kh-box-hover-text': hoverTextColor || 'inherit',
            '--kh-box-shadow-o': shadowOpacity,
            '--kh-box-hover-o': hoverShadowOpacity,
            '--kh-box-zoom-int': zoomIntensity,
            '--kh-box-min-h': minHeight > 0 ? `${minHeight}px` : 'auto',
            '--kh-box-w': boxWidth > 0 ? `${boxWidth}%` : '100%',
            '--kh-box-ml': marginL,
            '--kh-box-mr': marginR,
            '--kh-box-align-self': alignSelf,
            '--kh-box-h-align': flexHAlign,
            '--kh-box-v-align': flexVAlign,
            '--kh-box-text-align': hAlign
        };

        

        const classes = [
            'kh-box-wrapper', 'kh-box-editor-preview', 'is-editor-canvas',
            boxWidth > 0 ? 'kh-box-has-custom-width' : '',
            `anim-${animationType}`, `kh-box-ease-${easing}`,
            hasCustomBg ? 'kh-box-change-bg' : '',
            hasCustomText ? 'kh-box-change-text' : '',
            hasCustomBorder ? 'kh-box-change-border' : '',
            zoomImages ? 'kh-box-zoom-img' : '',
            hasGlow ? 'kh-box-glow' : '',
            isGrayscale ? 'kh-box-grayscale' : '',
            bringToFront ? 'kh-box-z-top' : '',
            hideOnMobile ? 'kh-box-hide-mobile' : '',
            hideOnDesktop ? 'kh-box-hide-desktop' : '',
            
        ].filter(Boolean).join(' ');

        let editorDataAttrs = {};
        

        const blockProps = useBlockProps({ className: classes, style: cssVars, ...editorDataAttrs });

        return (
            <>
                <BlockControls group="block">
                    <BlockAlignmentToolbar
                        value={boxAlign}
                        onChange={(val) => setAttributes({ boxAlign: val || 'center' })}
                        controls={['left', 'center', 'right']}
                    />
                    <AlignmentControl value={hAlign} onChange={(val) => setAttributes({ hAlign: val || 'left' })} />
                    <BlockVerticalAlignmentToolbar onChange={(val) => setAttributes({ vAlign: val || 'top' })} value={vAlign} />
                </BlockControls>

                <InspectorControls>
                    <PanelBody title={__('⚡ Quick Presets', 'kinetichub')} initialOpen={true}>
                        <SelectControl 
                            label={__('Style Preset', 'kinetichub')} 
                            value={preset} 
                            onChange={applyPreset} 
                            help={__('Automatically overwrites padding, shadows, and physics with professionally calibrated math.', 'kinetichub')}
                            options={presetOptions} 
                        />
                        <Button isDestructive variant="secondary" onClick={() => applyPreset('reset')} style={{width: '100%', justifyContent:'center'}}>{__('Reset Block', 'kinetichub')}</Button>
                    </PanelBody>

                    <PanelBody title={__('📐 Layout & Size', 'kinetichub')} initialOpen={false}>
                        <RangeControl 
                            label={__('Box Width (%)', 'kinetichub')} 
                            value={boxWidth} 
                            onChange={(v)=>setAttributes({boxWidth:v})} 
                            min={0} max={100} step={1} 
                            help={__('Set to 0 to automatically expand to 100% width.', 'kinetichub')} 
                        />
                        <RangeControl 
                            label={__('Minimum Height (px)', 'kinetichub')} 
                            value={minHeight} 
                            onChange={(v)=>setAttributes({minHeight:v})} 
                            min={0} max={1000} step={10} 
                            help={__('Enforces a strict minimum height for the container. Useful for maintaining symmetry in multi-column grid layouts.', 'kinetichub')} 
                        />
                    </PanelBody>

                    <PanelBody title={__('🔗 Link Settings', 'kinetichub')} initialOpen={false}>
                        <TextControl 
                            label={__('Target URL', 'kinetichub')}
                            value={url} 
                            onChange={(v) => setAttributes({ url: v })} 
                            placeholder="https://"
                            help={__('Leave empty for no link.', 'kinetichub')}
                            __nextHasNoMarginBottom={true} 
                        />

                        {url && (
                            <div style={{ marginTop: '15px' }}>
                                <ToggleControl 
                                    label={__('Make Entire Box Clickable', 'kinetichub')} 
                                    checked={stretchedLink} 
                                    onChange={(v) => setAttributes({ stretchedLink: v })}
                                    help={__('Stretches link over the whole box. Inner buttons stay clickable.', 'kinetichub')}
                                />
                                <ToggleControl 
                                    label={__('Open in New Tab', 'kinetichub')} 
                                    checked={openInNewTab} 
                                    onChange={(v) => setAttributes({ openInNewTab: v })} 
                                />
                                <TextControl 
                                    label={__('Accessible Label (aria-label)', 'kinetichub')} 
                                    value={linkLabel} 
                                    onChange={(v) => setAttributes({ linkLabel: v })} 
                                    placeholder={__('e.g. View our Services', 'kinetichub')}
                                    help={__('Describes the link for screen readers. Recommended.', 'kinetichub')}
                                    __nextHasNoMarginBottom={true} 
                                />
                                <TextControl 
                                    label={__('Link Rel (SEO)', 'kinetichub')} 
                                    value={linkRel} 
                                    onChange={(v) => setAttributes({ linkRel: v })} 
                                    placeholder={openInNewTab ? __('noopener noreferrer (auto)', 'kinetichub') : 'nofollow, sponsored'}
                                    help={__('Optional. Leave empty to use defaults.', 'kinetichub')}
                                    __nextHasNoMarginBottom={true} 
                                />
                            </div>
                        )}

                        {stretchedLink && !url && (
                            <div style={{ marginTop: '10px', padding: '10px 12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', fontSize: '12px', color: '#856404' }}>
                                ⚠️ {__('Stretched link is enabled but no URL is set. Add a URL above.', 'kinetichub')}
                            </div>
                        )}

                        {url && !stretchedLink && (
                            <div style={{ marginTop: '10px', padding: '10px 12px', background: '#e8f4fd', border: '1px solid #90cdf4', borderRadius: '6px', fontSize: '12px', color: '#2b6cb0' }}>
                                ℹ️ {__('URL is set but the box is not clickable. Enable "Make Entire Box Clickable" above to activate the link.', 'kinetichub')}
                            </div>
                        )}
                    </PanelBody>

                    
                    
                    <PanelBody title={__('🧠 Kinetic Physics', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#6b7280', padding: '10px 0' }}>
                            {__('3D Mouse Tilt, Magnetic Hover, and Inner Parallax Layers are not included in this build.', 'kinetichub')}
                        </p>
                    </PanelBody>
                    

                    
                    
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#6b7280', padding: '10px 0' }}>
                            {__('Spotlight Glow, Film Grain, Idle Levitation, and Crisp Edge are not included in this build.', 'kinetichub')}
                        </p>
                    </PanelBody>
                    

                    

                    <PanelBody title={__('⚙️ Detailed Config', 'kinetichub')} initialOpen={false}>
                        <TabPanel className="kh-tab-panel" tabs={[
                            { name: 'anim', title: __('Interact', 'kinetichub') }, 
                            { name: 'shadow', title: __('Depth', 'kinetichub') }, 
                            { name: 'color', title: __('Paint', 'kinetichub') }
                        ]}>
                            {(tab) => (
                                <div style={{paddingTop: '15px'}}>
                                    {tab.name === 'anim' && (
                                        <div className="kh-inline-controls">
                                            {isPhysicsActive ? (
                                                <div style={{ padding: '15px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', color: '#b45309', marginBottom: '15px', borderRadius: '4px' }}>
                                                    <strong>{__('Physics Engine Active', 'kinetichub')}</strong>
                                                    <p style={{ fontSize: '12px', marginTop: '5px', lineHeight: '1.4' }}>{__('Standard CSS animations (Lift, Scale) and Hover Intensities are safely hidden because 3D Tilt or Magnetic Hover is currently driving this box.', 'kinetichub')}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <SelectControl 
                                                        label={__('Hover Interaction Type', 'kinetichub')} 
                                                        value={animationType} 
                                                        options={animOptions} 
                                                        onChange={(v) => setAttributes({ animationType: v })} 
                                                    />
                                                    
                                                    {animationType !== 'none' && animationType !== 'trace' && animationType !== 'shine' && (
                                                        <>
                                                            <RangeControl label={__('Effect Intensity (Desktop)', 'kinetichub')} value={hoverIntensity} onChange={(v) => setAttributes({ hoverIntensity: v })} min={0} max={50} />
                                                            <RangeControl label={__('Effect Intensity (Mobile)', 'kinetichub')} value={mobileIntensity} onChange={(v) => setAttributes({ mobileIntensity: v })} min={0} max={40} />
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            <RangeControl label={__('Transition Speed (s)', 'kinetichub')} value={transitionSpeed} onChange={(v) => setAttributes({ transitionSpeed: v })} min={0.1} max={2.0} step={0.1} />
                                            
                                            

                                            <ToggleControl 
                                                label={__('Bring to Front on Hover', 'kinetichub')} 
                                                checked={bringToFront} 
                                                onChange={(v) => setAttributes({ bringToFront: v })} 
                                                help={__('Forces the box to pop out over adjacent layout elements on hover.', 'kinetichub')}
                                            />
                                        </div>
                                    )}

                                    {tab.name === 'shadow' && (
                                        <div className="kh-inline-controls">
                                            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>{__('Base Shadow Color', 'kinetichub')}</p>
                                            <ColorPalette value={shadowColor} onChange={(v) => setAttributes({ shadowColor: v })} enableAlpha={true} />
                                            <RangeControl label={__('Shadow Opacity', 'kinetichub')} value={shadowOpacity} onChange={(v) => setAttributes({ shadowOpacity: v })} min={0} max={1} step={0.05} />
                                            <RangeControl label={__('Blur / Softness (Desktop)', 'kinetichub')} value={shadowSoftness} onChange={(v) => setAttributes({ shadowSoftness: v })} min={0} max={100} />
                                            
                                            <hr style={{margin: '20px 0'}} />
                                            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>{__('Hover Shadow Color', 'kinetichub')}</p>
                                            <ColorPalette value={hoverShadowColor} onChange={(v) => setAttributes({ hoverShadowColor: v })} enableAlpha={true} />
                                            <RangeControl label={__('Hover Shadow Opacity', 'kinetichub')} value={hoverShadowOpacity} onChange={(v) => setAttributes({ hoverShadowOpacity: v })} min={0} max={1} step={0.05} />
                                        </div>
                                    )}

                                    {tab.name === 'color' && (
                                        <>
                                            <p style={{ fontSize: '13px', marginBottom: '5px', padding: '0 16px', fontWeight: 'bold' }}>{__('Hover Background Color', 'kinetichub')}</p>
                                            <div style={{ padding: '0 16px', marginBottom: '15px' }}>
                                                <ColorPalette value={hoverBgColor} onChange={(v)=>setAttributes({hoverBgColor:v})} enableAlpha={true} />
                                            </div>

                                            <p style={{ fontSize: '13px', marginBottom: '5px', padding: '0 16px', fontWeight: 'bold' }}>{__('Hover Border Color', 'kinetichub')}</p>
                                            <div style={{ padding: '0 16px' }}>
                                                <ColorPalette value={hoverBorderColor} onChange={(v)=>setAttributes({hoverBorderColor:v})} enableAlpha={true} />
                                            </div>
                                            
                                            
                                        </>
                                    )}
                                </div>
                            )}
                        </TabPanel>
                    </PanelBody>

                    <PanelBody title={__('✨ Advanced Visuals', 'kinetichub')} initialOpen={false}>
                        <ToggleControl label={__('Zoom Inner Content', 'kinetichub')} checked={zoomImages} onChange={(v)=>setAttributes({zoomImages:v})} />
                        {zoomImages && (
                            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                                <RangeControl label={__('Zoom Intensity', 'kinetichub')} value={zoomIntensity} onChange={(v)=>setAttributes({zoomIntensity:v})} min={1.02} max={1.50} step={0.02} />
                            </div>
                        )}
                        <ToggleControl label={__('Outer Glow Effect', 'kinetichub')} checked={hasGlow} onChange={(v)=>setAttributes({hasGlow:v})} />
                        <ToggleControl label={__('Grayscale to Color', 'kinetichub')} checked={isGrayscale} onChange={(v)=>setAttributes({isGrayscale:v})} />
                        
                        
                    </PanelBody>
                    
                    <KineticVisibilityControls attributes={attributes} setAttributes={setAttributes} />
                </InspectorControls>

                <div {...blockProps}>
                    
                    
                    <div className="kh-box-inner-content">
                        <InnerBlocks />
                    </div>
                    
                    <div className="kh-box-editor-badge" style={{ position:'absolute', top:'4px', right:'4px', padding:'2px 5px', fontSize:'9px', opacity:0.3, fontWeight:'bold', userSelect:'none', zIndex: 10 }}>
                        KB {minHeight > 0 && `| ${minHeight}px`} {boxWidth > 0 && `| W: ${boxWidth}%`}
                    </div>

                    
                </div>
            </>
        );
    },
    save: () => <InnerBlocks.Content />
});