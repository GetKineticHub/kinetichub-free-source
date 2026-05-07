/**
 * Kinetic Entrance Controls (Global Component)
 * Version: 1.0.0
 
 */
import { PanelBody, SelectControl, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const KineticEntranceControls = ({ attributes, setAttributes }) => {
    const { entranceAnimation = "none", entranceDelay = 0 } = attributes;

    return (
        <PanelBody title={__('🚀 Entrance Engine', 'kinetichub')} initialOpen={false}>
            <SelectControl 
                label={__('Entrance Animation', 'kinetichub')}
                value={entranceAnimation} 
                options={[
                    {label: __('None', 'kinetichub'), value:'none'},
                    {label: __('Fade In', 'kinetichub'), value:'fade'},
                    {label: __('Slide Up', 'kinetichub'), value:'slide'},
                    {label: __('Zoom In', 'kinetichub'), value:'zoom'}
                ]} 
                onChange={(v)=>setAttributes({entranceAnimation:v})} 
            />
            <RangeControl 
                label={__('Animation Delay (s)', 'kinetichub')}
                value={entranceDelay} 
                onChange={(v)=>setAttributes({entranceDelay:v})} 
                min={0} max={2} step={0.1}
                help={__('Delays the entrance animation on page load.', 'kinetichub')}
            />
        </PanelBody>
    );
};