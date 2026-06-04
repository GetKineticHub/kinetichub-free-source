/**
 * Kinetic Shadow Controls (Global Component)
 * Version: 1.0.0
  (Reusable Prop Drilling)
 */
import { ToggleControl, SelectControl, RangeControl } from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export const KineticShadowControls = ({ attributes, setAttributes }) => {
    const { 
        containerShadow, shadowStyle, shadowSoftness, 
        mobileShadowSoftness, shadowOpacity, hoverShadowOpacity, 
        shadowColor, hoverShadowColor 
    } = attributes;

    // Technical Note: Dynamic unmount if the parent block doesn't support depth physics
    if (typeof containerShadow === 'undefined' && typeof shadowSoftness === 'undefined') {
        return null;
    }

    return (
        <>
            {typeof containerShadow !== 'undefined' && (
                <ToggleControl 
                    label={__('Enable Container Shadow', 'kinetichub')} 
                    checked={containerShadow} 
                    onChange={(v) => setAttributes({ containerShadow: v })} 
                />
            )}
            
            {containerShadow && typeof shadowStyle !== 'undefined' && (
                <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', marginTop: '10px', marginBottom: '15px' }}>
                    <SelectControl 
                        label={__('Shadow Style', 'kinetichub')} 
                        value={shadowStyle} 
                        options={[
                            {label: __('Soft (Classic)', 'kinetichub'), value: 'soft'}, 
                            {label: __('Crisp (Solid)', 'kinetichub'), value: 'crisp'}, 
                            {label: __('Floating (Diffused)', 'kinetichub'), value: 'float'}, 
                            {label: __('Dynamic Glow', 'kinetichub'), value: 'glow'},
                            {label: __('Elegant Luxury', 'kinetichub'), value: 'elegant'}
                        ]} 
                        onChange={(v) => setAttributes({ shadowStyle: v })} 
                        help={__('Dynamic Glow uses the accent/handle color automatically!', 'kinetichub')}
                    />
                </div>
            )}

            {typeof shadowSoftness !== 'undefined' && (
                <RangeControl 
                    label={__('Blur / Softness (Desktop)', 'kinetichub')} 
                    value={shadowSoftness} 
                    onChange={(v)=>setAttributes({shadowSoftness:v})} 
                    min={0} max={100} 
                />
            )}

            {typeof mobileShadowSoftness !== 'undefined' && (
                <RangeControl 
                    label={__('Blur / Softness (Mobile)', 'kinetichub')} 
                    value={mobileShadowSoftness} 
                    onChange={(v)=>setAttributes({mobileShadowSoftness:v})} 
                    min={0} max={100} 
                />
            )}

            {typeof shadowOpacity !== 'undefined' && (
                <RangeControl 
                    label={__('Base Shadow Opacity', 'kinetichub')} 
                    value={shadowOpacity} 
                    onChange={(v)=>setAttributes({shadowOpacity:v})} 
                    min={0} max={1} step={0.05} 
                />
            )}

            {typeof hoverShadowOpacity !== 'undefined' && (
                <RangeControl 
                    label={__('Hover Shadow Opacity', 'kinetichub')} 
                    value={hoverShadowOpacity} 
                    onChange={(v)=>setAttributes({hoverShadowOpacity:v})} 
                    min={0} max={1} step={0.05} 
                />
            )}

            {typeof shadowColor !== 'undefined' && (
                <PanelColorSettings 
                    title={__('Advanced Shadow Colors', 'kinetichub')} 
                    colorSettings={[
                        {
                            value: shadowColor, 
                            onChange: (v)=>setAttributes({shadowColor: v}), 
                            label: __('Base Shadow', 'kinetichub')
                        }, 
                        {
                            value: hoverShadowColor, 
                            onChange: (v)=>setAttributes({hoverShadowColor: v}), 
                            label: __('Hover Shadow', 'kinetichub')
                        }
                    ]} 
                />
            )}
        </>
    );
};