/**
 * Kinetic Motion Controls (Global Component)
 * Version: 1.0.0
 
 */
import { RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const KineticMotionControls = ({ attributes, setAttributes }) => {
    const { 
        animationType, transitionSpeed, easing, 
        hoverIntensity, mobileIntensity, rotation, bringToFront 
    } = attributes;

    // Technical Note: Dynamic unmount if block does not utilize these specific attributes
    if (typeof animationType === 'undefined' && typeof hoverIntensity === 'undefined') {
        return null;
    }

    return (
        <>
            {typeof animationType !== 'undefined' && (
                <SelectControl 
                    label={__('Hover Interaction Type', 'kinetichub')} 
                    value={animationType} 
                    options={[
                        {label: __('Lift', 'kinetichub'), value: 'lift'},
                        {label: __('Scale', 'kinetichub'), value: 'scale'},
                        {label: __('Tilt 3D', 'kinetichub'), value: 'tilt'},
                        {label: __('Trace (Border)', 'kinetichub'), value: 'trace'},
                        {label: __('Shine', 'kinetichub'), value: 'shine'},
                        {label: __('Sink (Click effect)', 'kinetichub'), value: 'sink'},
                        {label: __('None', 'kinetichub'), value: 'none'}
                    ]} 
                    onChange={(v)=>setAttributes({animationType:v})} 
                />
            )}

            {typeof hoverIntensity !== 'undefined' && animationType !== 'none' && animationType !== 'trace' && animationType !== 'shine' && (
                <RangeControl 
                    label={__('Effect Intensity (Desktop)', 'kinetichub')} 
                    value={hoverIntensity} 
                    onChange={(v)=>setAttributes({hoverIntensity:v})} 
                    min={0} max={100}
                />
            )}

            {typeof mobileIntensity !== 'undefined' && animationType !== 'none' && animationType !== 'trace' && animationType !== 'shine' && (
                <RangeControl 
                    label={__('Effect Intensity (Mobile)', 'kinetichub')} 
                    value={mobileIntensity} 
                    onChange={(v)=>setAttributes({mobileIntensity:v})} 
                    min={0} max={100}
                />
            )}

            {typeof rotation !== 'undefined' && (animationType === 'lift' || animationType === 'scale') && (
                <RangeControl 
                    label={__('Rotation Angle', 'kinetichub')} 
                    value={rotation} 
                    onChange={(v)=>setAttributes({rotation:v})} 
                    min={-15} max={15}
                />
            )}

            {typeof transitionSpeed !== 'undefined' && (
                <RangeControl 
                    label={__('Transition Speed (s)', 'kinetichub')} 
                    value={transitionSpeed} 
                    onChange={(v)=>setAttributes({transitionSpeed:v})} 
                    min={0.1} max={2} step={0.1}
                />
            )}

            {typeof easing !== 'undefined' && (
                <SelectControl 
                    label={__('Easing Mode', 'kinetichub')} 
                    value={easing} 
                    options={[
                        {label: __('Smooth (Default)', 'kinetichub'), value: 'smooth'},
                        {label: __('Bouncy (Elastic)', 'kinetichub'), value: 'bouncy'},
                        {label: __('Snappy (Fast)', 'kinetichub'), value: 'snappy'}
                    ]} 
                    onChange={(v)=>setAttributes({easing:v})} 
                />
            )}

            {typeof bringToFront !== 'undefined' && (
                <ToggleControl 
                    label={__('Bring to Front on Hover (z-index)', 'kinetichub')} 
                    checked={bringToFront} 
                    onChange={(v)=>setAttributes({bringToFront:v})}
                />
            )}
        </>
    );
};