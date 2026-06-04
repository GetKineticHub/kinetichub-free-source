/**
 * Kinetic Ambient Aura - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ColorPalette/* <fs_premium_only> */, ToggleControl/* </fs_premium_only> */ } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

const auraIcon = <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.3"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;

registerBlockType(metadata.name, {
    icon: auraIcon,
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const { 
            color, opacity, spread, falloff, shape, positionType, 
            offsetX, offsetY/* <fs_premium_only> */,
            zIndex, blendMode, mobileBehavior, disableBlendMobile
            /* </fs_premium_only> */
        } = attributes;

        /* <fs_premium_only> */
        const isPro = window.khData?.isPro === true;

        const proLabel = (text) => (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{text}</span>
                {!isPro && <span style={{ fontSize: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', marginLeft: '10px' }}>PRO</span>}
            </span>
        );
        /* </fs_premium_only> */

        let currentShape = 'circle';
        let cssShape = 'circle';
        let cssRatio = '1';
        let editorZIndex = -1;
        let editorBlendMode = 'normal';

        /* <fs_premium_only> */
        currentShape = isPro ? shape : 'circle';
        cssShape = currentShape === 'ellipse-horizontal' || currentShape === 'ellipse-vertical' ? 'ellipse' : 'circle';
        cssRatio = currentShape === 'ellipse-horizontal' ? '1.5' : (currentShape === 'ellipse-vertical' ? '0.65' : '1');
        editorZIndex = isPro ? zIndex : -1;
        editorBlendMode = isPro ? blendMode : 'normal';
        /* </fs_premium_only> */

        let shapeLabel = __('Shape', 'kinetichub');
        /* <fs_premium_only> */
        shapeLabel = proLabel(__('Shape', 'kinetichub'));
        /* </fs_premium_only> */

        const blockProps = useBlockProps({
            className: `kh-ambient-aura kh-aura-pos-${positionType}`,
            style: {
                '--kh-aura-c': color,
                '--kh-aura-o': opacity,
                '--kh-aura-s': `${spread}px`,
                '--kh-aura-f': `${falloff}%`,
                '--kh-aura-pos': positionType,
                '--kh-aura-x': `${offsetX}%`,
                '--kh-aura-y': `${offsetY}%`,
                '--kh-aura-z': editorZIndex,
                '--kh-aura-blend': editorBlendMode,
                '--kh-aura-sh': cssShape,
                '--kh-aura-ratio': cssRatio
            }
        });

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('💡 Aura Appearance', 'kinetichub')} initialOpen={true}>
                        <p style={{marginBottom: '10px', fontWeight: 'bold'}}>{__('Glow Color', 'kinetichub')}</p>
                        <ColorPalette 
                            value={color} 
                            onChange={(v) => setAttributes({ color: v })} 
                            enableAlpha={true}
                        />
                        <hr style={{margin: '20px 0'}} />
                        
                        <SelectControl 
                            label={shapeLabel} 
                            value={currentShape} 
                            help={__('Circle or stretched oval form.', 'kinetichub')}
                            options={[
                                {label: __('Circle', 'kinetichub'), value: 'circle'},
                                /* <fs_premium_only> */
                                {label: __('Ellipse (Horizontal)', 'kinetichub'), value: 'ellipse-horizontal'},
                                {label: __('Ellipse (Vertical)', 'kinetichub'), value: 'ellipse-vertical'}
                                /* </fs_premium_only> */
                            ]} 
                            onChange={(v) => setAttributes({ shape: v })} 
                        />
                        
                        <RangeControl 
                            label={__('Intensity (Opacity)', 'kinetichub')} 
                            value={opacity} 
                            onChange={(v) => setAttributes({ opacity: v })} 
                            min={0.01} max={0.35} step={0.01} 
                            help={__('Higher = more visible glow.', 'kinetichub')}
                        />
                        <RangeControl 
                            label={__('Spread Radius (px)', 'kinetichub')} 
                            value={spread} 
                            onChange={(v) => setAttributes({ spread: v })} 
                            min={200} max={2500} step={50} 
                            help={__('How wide the glow extends.', 'kinetichub')}
                        />
                        <RangeControl 
                            label={__('Softness Falloff (%)', 'kinetichub')} 
                            help={__('Higher = softer edges.', 'kinetichub')}
                            value={falloff} 
                            onChange={(v) => setAttributes({ falloff: v })} 
                            min={30} max={100} step={1} 
                        />
                    </PanelBody>

                    <PanelBody title={__('📍 Positioning & Layout', 'kinetichub')} initialOpen={false}>
                        <SelectControl 
                            label={__('Behavior', 'kinetichub')} 
                            value={positionType} 
                            help={__('Fixed follows scroll. Absolute stays put.', 'kinetichub')}
                            options={[
                                {label: __('Fixed (Global Page Glow)', 'kinetichub'), value: 'fixed'},
                                {label: __('Absolute (Container/Hero Only)', 'kinetichub'), value: 'absolute'}
                            ]} 
                            onChange={(v) => setAttributes({ positionType: v })} 
                        />
                        <RangeControl 
                            label={__('Position X (%)', 'kinetichub')} 
                            value={offsetX} 
                            onChange={(v) => setAttributes({ offsetX: v })} 
                            min={-50} max={150} 
                            help={__('Horizontal center of the glow.', 'kinetichub')}
                        />
                        <RangeControl 
                            label={__('Position Y (%)', 'kinetichub')} 
                            value={offsetY} 
                            onChange={(v) => setAttributes({ offsetY: v })} 
                            min={-50} max={150} 
                            help={__('Negative moves it above the block.', 'kinetichub')}
                        />
                        
                        {/* <fs_premium_only> */}
                        <div style={{ marginTop: '15px' }}>
                            <RangeControl 
                                label={proLabel(__('Z-Index Layer', 'kinetichub'))} 
                                value={zIndex} 
                                onChange={(v) => setAttributes({ zIndex: v })} 
                                min={-10} max={100} 
                                help={__('Layer order. Negative = behind content.', 'kinetichub')}
                            />
                        </div>
                        {/* </fs_premium_only> */}
                    </PanelBody>
                    
                    <PanelBody title={__('⚙️ Advanced & Performance', 'kinetichub')} initialOpen={false}>
                        {/* <fs_premium_only> */}
                        <SelectControl 
                            label={proLabel(__('Optical Blend Mode', 'kinetichub'))} 
                            value={blendMode} 
                            help={__('How glow mixes with content below.', 'kinetichub')}
                            options={[
                                {label: __('Normal (Fastest)', 'kinetichub'), value: 'normal'},
                                {label: __('Screen (Lighten)', 'kinetichub'), value: 'screen'},
                                {label: __('Overlay', 'kinetichub'), value: 'overlay'},
                                {label: __('Color Dodge', 'kinetichub'), value: 'color-dodge'}
                            ]} 
                            onChange={(v) => setAttributes({ blendMode: v })} 
                        />
                        <hr style={{margin: '20px 0'}} />
                        <SelectControl 
                            label={proLabel(__('Mobile Behavior', 'kinetichub'))} 
                            value={mobileBehavior} 
                            help={__('Glow appearance on small screens.', 'kinetichub')}
                            options={[
                                {label: __('Reduce Opacity (Recommended)', 'kinetichub'), value: 'reduce'},
                                {label: __('Hide Completely', 'kinetichub'), value: 'hide'},
                                {label: __('Show Unchanged', 'kinetichub'), value: 'show'}
                            ]} 
                            onChange={(v) => setAttributes({ mobileBehavior: v })} 
                        />
                        <ToggleControl 
                            label={proLabel(__('Disable Blend Mode on Mobile', 'kinetichub'))} 
                            checked={disableBlendMobile} 
                            onChange={(v) => setAttributes({ disableBlendMobile: v })} 
                            help={__('Improves performance on mobile.', 'kinetichub')}
                        />
                        {/* </fs_premium_only> */}
                        {/* <fs_free_only> */}
                        <p style={{ fontSize: '12px', color: '#757575', fontStyle: 'italic', margin: '10px 0 0' }}>
                            {__('Additional shape, blend, mobile, and layering options are available in KineticHub Pro, distributed separately from WordPress.org.', 'kinetichub')}
                        </p>
                        {/* </fs_free_only> */}
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps}>
                    <span className="kh-aura-editor-placeholder">
                        ✨ {__('Aura:', 'kinetichub')} {positionType.toUpperCase()} | Z: {editorZIndex}
                    </span>
                </div>
            </>
        );
    },
    save: () => null 
});