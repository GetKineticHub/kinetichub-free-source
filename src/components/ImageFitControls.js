/**
 * Kinetic Image Fit Controls (Global Component)
 * Version: 1.0.0
 
 */
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const KineticImageFitControls = ({ attributes, setAttributes, title = __('⚙️ Image Fit Settings', 'kinetichub') }) => {
    const { 
        objectFit = "cover", 
        objectPosition = "center" 
    } = attributes;

    return (
        <PanelBody title={title} initialOpen={false}>
            <SelectControl 
                label={__('Image Fit (Object Fit)', 'kinetichub')} 
                value={objectFit} 
                options={[
                    {label: __('Cover (Fills area, crops edges)', 'kinetichub'), value: 'cover'}, 
                    {label: __('Contain (Shows whole image)', 'kinetichub'), value: 'contain'},
                    {label: __('Fill (Stretches image)', 'kinetichub'), value: 'fill'}
                ]} 
                onChange={(v) => setAttributes({ objectFit: v })} 
            />
            {/* Contain positions the whole image inside the frame with the same value,
              * so hiding the control there left a stored position applied but out of
              * reach. Fill stretches the image to the frame, where it does nothing. */}
            {objectFit !== 'fill' && (
                <SelectControl 
                    label={__('Focal Point', 'kinetichub')} 
                    help={objectFit === 'contain' ? __('With Contain, this is where the whole image sits inside the frame.', 'kinetichub') : undefined}
                    value={objectPosition} 
                    options={[
                        {label: __('Center', 'kinetichub'), value: 'center'}, 
                        {label: __('Top', 'kinetichub'), value: 'top'},
                        {label: __('Bottom', 'kinetichub'), value: 'bottom'},
                        {label: __('Left', 'kinetichub'), value: 'left'},
                        {label: __('Right', 'kinetichub'), value: 'right'}
                    ]} 
                    onChange={(v) => setAttributes({ objectPosition: v })} 
                />
            )}
        </PanelBody>
    );
};