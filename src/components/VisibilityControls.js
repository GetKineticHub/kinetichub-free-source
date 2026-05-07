/**
 * Kinetic Visibility Controls (Global Component)
 * Version: 1.0.0
 
 */
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const KineticVisibilityControls = ({ attributes, setAttributes }) => {
    const { hideOnMobile = false, hideOnDesktop = false } = attributes;

    return (
        <PanelBody title={__('📱 Visibility', 'kinetichub')} initialOpen={false}>
             <ToggleControl 
                label={__('Hide on Mobile', 'kinetichub')}
                checked={hideOnMobile} 
                onChange={(v)=>setAttributes({hideOnMobile:v})} 
             />
             <ToggleControl 
                label={__('Hide on Desktop', 'kinetichub')}
                checked={hideOnDesktop} 
                onChange={(v)=>setAttributes({hideOnDesktop:v})} 
             />
        </PanelBody>
    );
};