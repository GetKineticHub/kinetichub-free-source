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
import { InspectorHelp, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';


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
            tiltEffect, magneticHover, enableParallax, minHeight, boxWidth, mobileBoxWidth, boxAlign, hAlign, vAlign,
            spotlightGlow, spotlightColor, spotlightSize, filmGrain, grainOpacity, idleLevitation, crispEdge, edgeColor
        } = attributes;

        const applyPreset = (type) => {
            const baseReset = { preset: 'custom', animationType: 'lift', hoverIntensity: 20, shadowSoftness: 20, shadowOpacity: 0.1, hoverShadowOpacity: 0.2, hoverBgColor: '', hoverBorderColor: '', hoverTextColor: '' };
            
            const presets = {
                reset: { ...baseReset },
                soft_elevate: { ...baseReset, preset: 'soft_elevate', hoverIntensity: 15, shadowSoftness: 40, shadowOpacity: 0.05, hoverShadowOpacity: 0.15 },
                minimal_scale: { ...baseReset, preset: 'minimal_scale', animationType: 'scale', hoverIntensity: 5, shadowSoftness: 10 },
                
            };
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
            // Mirrors --kh-box-w when no mobile override is set. Only the <=768px rule reads
            // it, and that rule is gated on kh-box-has-custom-mobile-width below.
            '--kh-box-m-w': mobileBoxWidth > 0 ? `${mobileBoxWidth}%` : (boxWidth > 0 ? `${boxWidth}%` : '100%'),
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
            mobileBoxWidth > 0 ? 'kh-box-has-custom-mobile-width' : '',
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
                            label={labelWithHelp(__('Style Preset', 'kinetichub'), __('Applies a matched set of interaction, shadow and hover-colour values to the panels below, overwriting whatever is already set there. Anything you change afterwards is kept, so the name shown here is a starting point rather than a live description. Reset Block returns the same settings to their defaults.', 'kinetichub'))}
                            value={preset}
                            onChange={applyPreset}
                            options={presetOptions}
                        />
                        <Button isDestructive variant="secondary" onClick={() => applyPreset('reset')} style={{width: '100%', justifyContent:'center'}}>{__('Reset Block', 'kinetichub')}</Button>

                        
                        <ProNote
                            text={__('Three further presets configure the box in a single step: Frosted Glass for a blurred translucent panel, Tech Trace for a border that draws itself on hover, and Kinetic 3D for a pointer-driven tilt with parallax inner content.', 'kinetichub')}
                        />
                        
                    </PanelBody>

                    <PanelBody title={__('📐 Layout & Size', 'kinetichub')} initialOpen={false}>
                        <RangeControl
                            label={labelWithHelp(__('Box Width (%)', 'kinetichub'), __('Width of the box as a percentage of the space it sits in. 0 lets it fill that space. Any value above 0 is enforced over the theme layout, including over a full-width alignment.', 'kinetichub'))}
                            value={boxWidth}
                            onChange={(v)=>setAttributes({boxWidth:v})}
                            min={0} max={100} step={1}
                        />
                        <RangeControl
                            label={labelWithHelp(__('Mobile Width (%)', 'kinetichub'), __('Optional width override at 768px and under. 0 keeps the desktop Box Width; any value above 0 sets a separate mobile width, using the same alignment as the desktop box.', 'kinetichub'))}
                            value={mobileBoxWidth}
                            onChange={(v)=>setAttributes({mobileBoxWidth:v})}
                            min={0} max={100} step={1}
                        />
                        <RangeControl
                            label={labelWithHelp(__('Minimum Height (px)', 'kinetichub'), __('A floor for the height of the box: it still grows past this to fit its content. Useful for keeping boxes level across a row of columns whose text runs to different lengths. 0 removes the floor.', 'kinetichub'))}
                            value={minHeight}
                            onChange={(v)=>setAttributes({minHeight:v})}
                            min={0} max={1000} step={10}
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
                        <ProNote
                            text={__('Pointer-driven motion for the whole box: a 3D tilt that tracks the cursor across its surface, a magnetic hover that lets the box follow the cursor, and inner parallax layers that move the content against the tilt for depth.', 'kinetichub')}
                        />
                    </PanelBody>
                    

                    
                    
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <ProNote
                            text={__('Atmosphere layers over the box: a spotlight glow that follows the cursor, cinematic film grain with its own opacity, an idle levitation that keeps the box breathing while nobody is interacting with it, and a crisp inner 3D edge in a colour of your choosing.', 'kinetichub')}
                        />
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
                                                        label={labelWithHelp(__('Hover Interaction Type', 'kinetichub'), __('What the box does while the pointer is over it. Lift raises it, Scale grows it slightly, Tilt rotates it on both axes. Effect Intensity below drives whichever one is chosen.', 'kinetichub'))}
                                                        value={animationType} 
                                                        options={animOptions} 
                                                        onChange={(v) => setAttributes({ animationType: v })} 
                                                    />
                                                    
                                                    {animationType !== 'none' && animationType !== 'trace' && animationType !== 'shine' && (
                                                        <>
                                                            <RangeControl label={labelWithHelp(__('Effect Intensity (Desktop)', 'kinetichub'), __('A single strength figure whose meaning follows the interaction type: for Lift it is the travel in pixels, for Scale and Tilt it is scaled down into a small growth or a few degrees of rotation. 0 leaves the box still.', 'kinetichub'))} value={hoverIntensity} onChange={(v) => setAttributes({ hoverIntensity: v })} min={0} max={30} />
                                                            <RangeControl label={labelWithHelp(__('Effect Intensity (Mobile)', 'kinetichub'), __('Replaces the desktop figure at 768px and under, for the same hover interaction.', 'kinetichub'))} value={mobileIntensity} onChange={(v) => setAttributes({ mobileIntensity: v })} min={0} max={30} />
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            <RangeControl label={labelWithHelp(__('Transition Speed (s)', 'kinetichub'), __('How long the box takes to settle into its hover state and back. The slider is remapped before it reaches the CSS so that very short values cannot fight the pointer: the bottom of the range runs at 0.6s and the top at 2s, rising evenly in between.', 'kinetichub'))} value={transitionSpeed} onChange={(v) => setAttributes({ transitionSpeed: v })} min={0.1} max={2.0} step={0.1} />
                                            
                                            
                                            
                                            <ProNote
                                                text={__('Three more hover types here - Trace, which draws the border on, plus Shine and Sink - along with bouncy and snappy easing curves, a rotation angle to add to Lift and Scale, a hover text colour in the Paint tab and a separate shadow softness for phones in the Depth tab. The box can also animate in the first time it scrolls into view.', 'kinetichub')}
                                            />
                                            

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
                                            <RangeControl label={labelWithHelp(__('Blur / Softness (Desktop)', 'kinetichub'), __('Blur radius of the shadow in pixels. The same figure is used for the resting shadow and the hover shadow, which differ only in colour, opacity and how far they are cast.', 'kinetichub'))} value={shadowSoftness} onChange={(v) => setAttributes({ shadowSoftness: v })} min={0} max={100} />
                                            
                                            <hr style={{margin: '20px 0'}} />
                                            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                                                {__('Hover Shadow Color', 'kinetichub')}
                                                <InspectorHelp
                                                    label={__('Hover Shadow Color', 'kinetichub')}
                                                    text={__('Colour of the shadow while the pointer is over the box. Outer Glow Effect, in Advanced Visuals, also draws its halo in this colour.', 'kinetichub')}
                                                />
                                            </p>
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
                        <ToggleControl label={labelWithHelp(__('Zoom Inner Content', 'kinetichub'), __('Scales images on hover. It reaches only the direct children of the box, so an image sitting inside a nested group or column is not affected.', 'kinetichub'))} checked={zoomImages} onChange={(v)=>setAttributes({zoomImages:v})} />
                        {zoomImages && (
                            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
                                <RangeControl label={__('Zoom Intensity', 'kinetichub')} value={zoomIntensity} onChange={(v)=>setAttributes({zoomIntensity:v})} min={1.02} max={1.50} step={0.02} />
                            </div>
                        )}
                        <ToggleControl label={labelWithHelp(__('Outer Glow Effect', 'kinetichub'), __('Replaces the hover shadow with a wide coloured halo around the box, drawn in the Hover Shadow Color from the Depth tab. The softness and opacity set there do not apply to the halo.', 'kinetichub'))} checked={hasGlow} onChange={(v)=>setAttributes({hasGlow:v})} />
                        <ToggleControl label={labelWithHelp(__('Grayscale to Color', 'kinetichub'), __('The box and everything in it sit desaturated at rest and return to full colour on hover.', 'kinetichub'))} checked={isGrayscale} onChange={(v)=>setAttributes({isGrayscale:v})} />
                        
                        
                        
                        <ProNote
                            text={__('Glassmorphism as well: the background of the box becomes a translucent white layer over a backdrop blur, with the opacity of the layer and the strength of the blur both adjustable.', 'kinetichub')}
                        />
                        
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