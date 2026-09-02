/**
 * Kinetic Ambient Aura - Editor Script
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ColorPalette } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorNote, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';

import metadata from './block.json';

const auraIcon = <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.3"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;

registerBlockType(metadata.name, {
    icon: auraIcon,
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const { 
            color, opacity, spread, falloff, shape, positionType, 
            offsetX, offsetY
        } = attributes;

        /*
         * FREE-safe defaults. The premium region below overwrites them, so the
         * FREE build keeps the circle/base-layer/normal-blend preview it has
         * always had once that region is stripped.
         *
         * Which edition is running is decided at build time by the fs markers
         * alone. Nothing here reads a runtime tier flag: a premium control that
         * is present is a control the reader owns, so there is nothing to test
         * for and nothing to badge.
         *
         * `shape` is only ever WRITTEN by the premium Shape control, so FREE has
         * no reader for it and the stored value is left exactly as it stands.
         * There is deliberately no FREE Shape control: a select whose only
         * option is the value it already holds cannot do anything.
         */
        let currentShape = 'circle';
        let cssShape = 'circle';
        let cssRatio = '1';
        let editorZIndex = -1;
        let editorBlendMode = 'normal';

        

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
                        <InspectorNote
                            text={__('The glow is not drawn in the editor; the aura renders on the live frontend.', 'kinetichub')}
                        />
                        <p style={{marginBottom: '10px', fontWeight: 'bold'}}>{__('Glow Color', 'kinetichub')}</p>
                        <ColorPalette 
                            value={color} 
                            onChange={(v) => setAttributes({ color: v })} 
                            enableAlpha={true}
                        />
                        <hr style={{margin: '20px 0'}} />

                        
                        {/* The seat the Shape control takes in PRO. Blend modes
                          * answer the same question -- what the glow looks like
                          * -- so they are named here rather than in a panel FREE
                          * would otherwise have no reason to open. */}
                        <ProNote
                            text={__('Elliptical aura shapes, and optical blend modes — Screen, Overlay and Color Dodge — for how the glow mixes with the content beneath it.', 'kinetichub')}
                        />
                        
                        
                        
                        <RangeControl 
                            label={labelWithHelp(__('Intensity (Opacity)', 'kinetichub'), __('Higher values make the glow more visible.', 'kinetichub'))}
                            value={opacity} 
                            onChange={(v) => setAttributes({ opacity: v })} 
                            min={0.01} max={0.35} step={0.01} 
                        />
                        <RangeControl 
                            label={labelWithHelp(__('Spread Radius (px)', 'kinetichub'), __('How far the glow reaches out from its center.', 'kinetichub'))}
                            value={spread} 
                            onChange={(v) => setAttributes({ spread: v })} 
                            min={200} max={2500} step={50} 
                        />
                        <RangeControl 
                            label={labelWithHelp(__('Softness Falloff (%)', 'kinetichub'), __('Higher values fade the edge out more gradually.', 'kinetichub'))}
                            value={falloff} 
                            onChange={(v) => setAttributes({ falloff: v })} 
                            min={30} max={100} step={1} 
                        />
                    </PanelBody>

                    <PanelBody title={__('📍 Positioning & Layout', 'kinetichub')} initialOpen={false}>
                        <SelectControl 
                            label={labelWithHelp(__('Behavior', 'kinetichub'), __('Fixed pins the glow to the screen, so it holds its place while the page scrolls past it. Absolute anchors it to the spot this block sits in, so it scrolls away with the content around it.', 'kinetichub'))}
                            value={positionType} 
                            options={[
                                {label: __('Fixed (Global Page Glow)', 'kinetichub'), value: 'fixed'},
                                {label: __('Absolute (Container/Hero Only)', 'kinetichub'), value: 'absolute'}
                            ]} 
                            onChange={(v) => setAttributes({ positionType: v })} 
                        />
                        <RangeControl 
                            label={labelWithHelp(__('Position X (%)', 'kinetichub'), __('Horizontal center of the glow.', 'kinetichub'))}
                            value={offsetX} 
                            onChange={(v) => setAttributes({ offsetX: v })} 
                            min={-50} max={150} 
                        />
                        <RangeControl 
                            label={labelWithHelp(__('Position Y (%)', 'kinetichub'), __('Vertical center of the glow. Negative values move it above the block.', 'kinetichub'))}
                            value={offsetY} 
                            onChange={(v) => setAttributes({ offsetY: v })} 
                            min={-50} max={150} 
                        />

                        
                        {/* Exactly where the layer control sits in PRO, and the
                          * last thing in the panel either way. The mobile
                          * handling it names belongs to a panel FREE does not
                          * have, so this is the one place to find it. */}
                        <ProNote
                            text={__('Layer (z-index) control, so the aura can sit in front of your content as well as behind it, plus mobile handling — dim, hide or keep the glow on small screens.', 'kinetichub')}
                        />
                        
                        
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
