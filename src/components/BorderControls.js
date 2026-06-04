/**
 * Kinetic Border Controls (Global Component)
 * Version: 1.0.0
 
 */
import { PanelBody, RangeControl, SelectControl } from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export const KineticBorderControls = ({ attributes, setAttributes }) => {
    const { 
        borderRadius = 0, 
        borderWidth = 0, 
        borderStyle = "solid", 
        borderColor = "transparent", 
        borderHoverColor = "transparent" 
    } = attributes;

    return (
        <PanelBody title={__('🔲 Border & Shape', 'kinetichub')} initialOpen={false}>
            <RangeControl 
                label={__('Border Radius', 'kinetichub')} 
                value={borderRadius} 
                onChange={(v) => setAttributes({ borderRadius: v })} 
                min={0} max={100} 
            />
            <RangeControl 
                label={__('Border Width', 'kinetichub')} 
                value={borderWidth} 
                onChange={(v) => setAttributes({ borderWidth: v })} 
                min={0} max={20} 
            />
            
            {borderWidth > 0 && (
                <>
                    <SelectControl 
                        label={__('Border Style', 'kinetichub')} 
                        value={borderStyle} 
                        options={[
                            {label: __('Solid', 'kinetichub'), value: 'solid'}, 
                            {label: __('Dashed', 'kinetichub'), value: 'dashed'},
                            {label: __('Dotted', 'kinetichub'), value: 'dotted'}
                        ]} 
                        onChange={(v) => setAttributes({ borderStyle: v })} 
                    />
                    <PanelColorSettings 
                        title={__('Border Colors', 'kinetichub')}
                        colorSettings={[
                            {
                                value: borderColor, 
                                onChange: (v) => setAttributes({ borderColor: v }), 
                                label: __('Normal Border', 'kinetichub')
                            },
                            {
                                value: borderHoverColor, 
                                onChange: (v) => setAttributes({ borderHoverColor: v }), 
                                label: __('Hover Border', 'kinetichub')
                            }
                        ]} 
                    />
                </>
            )}
        </PanelBody>
    );
};