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

/* <fs_premium_only> */
import { KineticEntranceControls } from '../../components/EntranceControls';
/* </fs_premium_only> */
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
            /* <fs_premium_only> */
            baseReset.enableGlass = false;
            baseReset.glassOpacity = 0.2;
            baseReset.blurIntensity = 10;
            baseReset.tiltEffect = false;
            baseReset.magneticHover = false;
            baseReset.enableParallax = false;
            /* </fs_premium_only> */
            const presets = {
                reset: { ...baseReset },
                soft_elevate: { ...baseReset, preset: 'soft_elevate', hoverIntensity: 15, shadowSoftness: 40, shadowOpacity: 0.05, hoverShadowOpacity: 0.15 },
                minimal_scale: { ...baseReset, preset: 'minimal_scale', animationType: 'scale', hoverIntensity: 5, shadowSoftness: 10 },
                /* <fs_premium_only> */
                pro_glass: { ...baseReset, preset: 'pro_glass', enableGlass: true, glassOpacity: 0.15, blurIntensity: 15, shadowSoftness: 30, shadowOpacity: 0.05 },
                tech_trace: { ...baseReset, preset: 'tech_trace', animationType: 'trace', hoverIntensity: 0, hoverBorderColor: '#0073aa' },
                kinetic_3d: { ...baseReset, preset: 'kinetic_3d', animationType: 'none', hoverIntensity: 10, tiltEffect: true, enableParallax: true, shadowSoftness: 30 },
                /* </fs_premium_only> */
            };
            if(presets[type]) {
                setAttributes(presets[type]);
            }
        };

        const presetOptions = [
            { label: __('Custom', 'kinetichub'), value: 'custom' }, 
            { label: __('Soft Elevate', 'kinetichub'), value: 'soft_elevate' }, 
            { label: __('Minimal Scale', 'kinetichub'), value: 'minimal_scale' }, 
            /* <fs_premium_only> */
            { label: __('Pro Glass', 'kinetichub'), value: 'pro_glass' }, 
            { label: __('Tech Trace', 'kinetichub'), value: 'tech_trace' },
            { label: __('Kinetic 3D', 'kinetichub'), value: 'kinetic_3d' },
            /* </fs_premium_only> */
        ];

        const animOptions = [
            {label: __('None', 'kinetichub'), value: 'none'},
            {label: __('Lift (Z-Axis)', 'kinetichub'), value: 'lift'},
            {label: __('Scale (Grow)', 'kinetichub'), value: 'scale'},
            {label: __('Tilt (CSS)', 'kinetichub'), value: 'tilt'},
            /* <fs_premium_only> */
            {label: __('Trace (Border)', 'kinetichub'), value: 'trace'},
            {label: __('Shine', 'kinetichub'), value: 'shine'},
            {label: __('Sink (Click effect)', 'kinetichub'), value: 'sink'},
            /* </fs_premium_only> */
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
        /* <fs_premium_only> */
        isPhysicsActive = tiltEffect || magneticHover;
        /* </fs_premium_only> */

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

        /* <fs_premium_only> */
        cssVars['--kh-box-blur'] = `${blurIntensity}px`;
        cssVars['--kh-box-glass-o'] = glassOpacity;
        if (spotlightGlow) {
            cssVars['--kh-box-spot-c'] = spotlightColor;
            cssVars['--kh-box-spot-sz'] = `${spotlightSize}px`;
        }
        if (filmGrain) {
            cssVars['--kh-box-grain-o'] = grainOpacity;
        }
        if (crispEdge) {
            cssVars['--kh-box-edge-c'] = edgeColor;
        }
        /* </fs_premium_only> */

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
            /* <fs_premium_only> */
            enableGlass ? 'kh-box-is-glass' : '',
            enableParallax ? 'has-parallax' : '',
            spotlightGlow ? 'has-spotlight' : '',
            filmGrain ? 'has-grain' : '',
            idleLevitation ? 'has-idle-levitation' : '',
            crispEdge ? 'has-crisp-edge' : '',
            /* </fs_premium_only> */
        ].filter(Boolean).join(' ');

        let editorDataAttrs = {};
        /* <fs_premium_only> */
        editorDataAttrs = {
            'data-tilt': tiltEffect,
            'data-magnetic': magneticHover,
            'data-parallax': enableParallax,
            'data-spotlight': spotlightGlow,
        };
        /* </fs_premium_only> */

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

                    {/* <fs_premium_only> */}
                    <PanelBody title={__('🧠 Kinetic Physics', 'kinetichub')} initialOpen={false}>
                        <ToggleControl 
                            label={__('3D Mouse Tilt', 'kinetichub')} 
                            checked={tiltEffect} 
                            onChange={(v) => {
                                setAttributes({ tiltEffect: v });
                                if (v) setAttributes({ animationType: 'none' });
                            }} 
                            help={__('Hardware-accelerated 3D tracking. Overrides standard CSS hover animations (Lift/Scale).', 'kinetichub')} 
                        />
                        <ToggleControl 
                            label={__('Magnetic Hover', 'kinetichub')} 
                            checked={magneticHover} 
                            onChange={(v) => {
                                setAttributes({ magneticHover: v });
                                if (v) setAttributes({ animationType: 'none' });
                            }} 
                            help={__('The entire box organically follows the mouse cursor.', 'kinetichub')}
                        />
                        <ToggleControl 
                            label={__('Inner Parallax Layers', 'kinetichub')} 
                            checked={enableParallax} 
                            onChange={(v) => setAttributes({enableParallax:v})} 
                            help={__('Inner blocks move in the opposite direction of the 3D tilt, creating intense depth.', 'kinetichub')}
                        />
                    </PanelBody>
                    {/* </fs_premium_only> */}
                    {/* <fs_free_only> */}
                    <PanelBody title={__('🧠 Kinetic Physics', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#6b7280', padding: '10px 0' }}>
                            {__('3D Mouse Tilt, Magnetic Hover, and Inner Parallax Layers are available in PRO.', 'kinetichub')}
                        </p>
                    </PanelBody>
                    {/* </fs_free_only> */}

                    {/* <fs_premium_only> */}
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <ToggleControl 
                            label={__('Interactive Spotlight Glow', 'kinetichub')} 
                            checked={spotlightGlow} 
                            onChange={(v) => setAttributes({ spotlightGlow: v })} 
                            help={__('Renders a radial flashlight effect that dynamically follows the cursor. Best used on dark backgrounds.', 'kinetichub')}
                        />
                        {spotlightGlow && (
                            <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '15px' }}>
                                <p style={{marginTop:0, fontWeight:'bold', fontSize:'12px'}}>{__('Spotlight Color (RGBA support)', 'kinetichub')}</p>
                                <ColorPalette value={spotlightColor} onChange={(v) => setAttributes({ spotlightColor: v })} enableAlpha={true} />
                                <RangeControl label={__('Spotlight Size (px)', 'kinetichub')} value={spotlightSize} onChange={(v) => setAttributes({ spotlightSize: v })} min={100} max={1000} />
                            </div>
                        )}
                        <hr/>
                        <ToggleControl label={__('Cinematic Film Grain', 'kinetichub')} checked={filmGrain} onChange={(v) => setAttributes({ filmGrain: v })} />
                        {filmGrain && (
                            <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '15px' }}>
                                <RangeControl label={__('Grain Opacity', 'kinetichub')} value={grainOpacity} onChange={(v) => setAttributes({ grainOpacity: v })} min={0.01} max={0.5} step={0.01} />
                            </div>
                        )}
                        <hr/>
                        <ToggleControl 
                            label={__('Idle Levitation', 'kinetichub')} 
                            checked={idleLevitation} 
                            onChange={(v) => setAttributes({ idleLevitation: v })} 
                            help={__('The box will breathe and float on the Y-axis when the user is not interacting with it.', 'kinetichub')}
                        />
                        <hr/>
                        <ToggleControl label={__('Crisp Inner 3D Edge', 'kinetichub')} checked={crispEdge} onChange={(v) => setAttributes({ crispEdge: v })} />
                        {crispEdge && (
                            <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '15px' }}>
                                <p style={{marginTop:0, fontWeight:'bold', fontSize:'12px'}}>{__('Edge Highlight Color', 'kinetichub')}</p>
                                <ColorPalette value={edgeColor} onChange={(v) => setAttributes({ edgeColor: v })} enableAlpha={true} />
                            </div>
                        )}
                    </PanelBody>
                    {/* </fs_premium_only> */}
                    {/* <fs_free_only> */}
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <p style={{ fontSize: '13px', color: '#6b7280', padding: '10px 0' }}>
                            {__('Spotlight Glow, Film Grain, Idle Levitation, and Crisp Edge are available in PRO.', 'kinetichub')}
                        </p>
                    </PanelBody>
                    {/* </fs_free_only> */}

                    {/* <fs_premium_only> */}
                    <KineticEntranceControls attributes={attributes} setAttributes={setAttributes} />
                    {/* </fs_premium_only> */}

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
                                            
                                            {/* <fs_premium_only> */}
                                            <SelectControl label={__('Easing Mode', 'kinetichub')} value={easing} options={[{label: __('Smooth (Default)', 'kinetichub'), value: 'smooth'}, {label: __('Bouncy (Elastic)', 'kinetichub'), value: 'bouncy'}, {label: __('Snappy (Fast)', 'kinetichub'), value: 'snappy'}]} onChange={(v) => setAttributes({ easing: v })} />
                                            
                                            {(!isPhysicsActive && (animationType === 'lift' || animationType === 'scale')) && (
                                                <RangeControl label={__('Rotation Angle', 'kinetichub')} value={rotation} onChange={(v) => setAttributes({ rotation: v })} min={-15} max={15} />
                                            )}
                                            {/* </fs_premium_only> */}

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
                                            {/* <fs_premium_only> */}
                                            <RangeControl label={__('Blur / Softness (Mobile)', 'kinetichub')} value={mobileShadowSoftness} onChange={(v) => setAttributes({ mobileShadowSoftness: v })} min={0} max={100} />
                                            {/* </fs_premium_only> */}
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
                                            
                                            {/* <fs_premium_only> */}
                                            <p style={{ fontSize: '13px', marginBottom: '5px', padding: '0 16px', fontWeight: 'bold', marginTop: '10px' }}>{__('Hover Text Color', 'kinetichub')}</p>
                                            <div style={{ padding: '0 16px' }}>
                                                <ColorPalette value={hoverTextColor} onChange={(v)=>setAttributes({hoverTextColor:v})} enableAlpha={true} />
                                            </div>
                                            {/* </fs_premium_only> */}
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
                        
                        {/* <fs_premium_only> */}
                        <ToggleControl 
                            label={__('Enable Glassmorphism', 'kinetichub')} 
                            checked={enableGlass} 
                            onChange={(v)=>setAttributes({enableGlass:v})} 
                            help={__('Controls the white overlay opacity. Set to 0 for pure blur, or 0.2 for a frosted look.', 'kinetichub')}
                        />
                        {enableGlass && (
                            <div style={{ background: '#f0f5ff', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                <strong>{__('Glassmorphism Engine', 'kinetichub')}</strong>
                                <RangeControl label={__('White Layer Opacity', 'kinetichub')} value={glassOpacity} onChange={(v)=>setAttributes({glassOpacity:v})} min={0} max={1} step={0.05} />
                                <RangeControl label={__('Backdrop Blur Strength', 'kinetichub')} value={blurIntensity} onChange={(v)=>setAttributes({blurIntensity:v})} min={0} max={40} />
                            </div>
                        )}
                        {/* </fs_premium_only> */}
                    </PanelBody>
                    
                    <KineticVisibilityControls attributes={attributes} setAttributes={setAttributes} />
                </InspectorControls>

                <div {...blockProps}>
                    {/* <fs_premium_only> */}
                    {filmGrain && <div className="kh-box-grain" aria-hidden="true"></div>}
                    {spotlightGlow && <div className="kh-box-spotlight" aria-hidden="true"></div>}
                    {crispEdge && <div className="kh-box-crisp-edge" aria-hidden="true"></div>}
                    {/* </fs_premium_only> */}
                    
                    <div className="kh-box-inner-content">
                        <InnerBlocks />
                    </div>
                    
                    <div className="kh-box-editor-badge" style={{ position:'absolute', top:'4px', right:'4px', padding:'2px 5px', fontSize:'9px', opacity:0.3, fontWeight:'bold', userSelect:'none', zIndex: 10 }}>
                        KB {minHeight > 0 && `| ${minHeight}px`} {boxWidth > 0 && `| W: ${boxWidth}%`}
                    </div>

                    {/* <fs_premium_only> */}
                    {isSelected && (
                        <div style={{ position: 'relative', width: '100%', zIndex: 99, marginTop: '15px' }}>
                            <KineticEditorNotice message={__('Interaction physics execute on live frontend.', 'kinetichub')} />
                        </div>
                    )}
                    {/* </fs_premium_only> */}
                </div>
            </>
        );
    },
    save: () => <InnerBlocks.Content />
});