/**
 * Kinetic Overlay Controls (Global Component)
 * Version: 1.0.0
 
 */
import { PanelBody, RangeControl, ColorPalette } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const KineticOverlayControls = ({ attributes, setAttributes }) => {
    const { 
        overlayTint = "#000000", 
        overlayOpacity = 0 
    } = attributes;

    return (
        <PanelBody title={__('🌑 Overlay & Tint', 'kinetichub')} initialOpen={false}>
            <p style={{marginBottom:'5px', fontSize:'12px', fontWeight:'bold'}}>{__('Overlay Color', 'kinetichub')}</p>
            <ColorPalette 
                value={overlayTint} 
                onChange={(v) => setAttributes({ overlayTint: v })} 
            />
            <RangeControl 
                label={__('Tint Opacity', 'kinetichub')} 
                value={overlayOpacity} 
                onChange={(v) => setAttributes({ overlayOpacity: v })} 
                min={0} max={1} step={0.05} 
            />
        </PanelBody>
    );
};