/**
 * Kinetic Pulse Controls (Global Component)
 * Version: 1.0.0
 
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const KineticPulseControls = ({ attributes, setAttributes }) => {
    const { pulseEffect } = attributes;

    // Technical Note: Prevents rendering if attribute is absent in parent block.json
    if (typeof pulseEffect === 'undefined') return null;

    return (
        <SelectControl 
            label={__('Pulse Effect', 'kinetichub')} 
            value={pulseEffect} 
            options={[
                {label: __('None', 'kinetichub'), value: 'none'},
                {label: __('Soft Glow', 'kinetichub'), value: 'glow'},
                {label: __('Sonar Ripple', 'kinetichub'), value: 'sonar'},
                {label: __('Fluid Morphing', 'kinetichub'), value: 'morph'},
                {label: __('Magnetic Focus', 'kinetichub'), value: 'magnetic'},
                {label: __('Glassmorphism', 'kinetichub'), value: 'glass'},
                {label: __('Target Brackets', 'kinetichub'), value: 'brackets'}
            ]} 
            onChange={(v) => setAttributes({ pulseEffect: v })} 
        />
    );
};