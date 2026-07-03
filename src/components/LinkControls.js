/**
 * Kinetic Link Controls (Global Component)
 * Version: 1.0.0
 */

import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const KineticLinkControls = ({ attributes, setAttributes }) => {
    const {
        url = '',
        openInNewTab = false,
        linkRel = '',
        stretchedLink = false
    } = attributes;

    return (
        <PanelBody title={__('🔗 Link Settings', 'kinetichub')} initialOpen={false}>
            <TextControl
                label={__('Target URL', 'kinetichub')}
                value={url}
                onChange={(value) => setAttributes({ url: value })}
                help={__('Enter https://...', 'kinetichub')}
            />

            {url && (
                <>
                    <ToggleControl
                        label={__('Open in New Tab', 'kinetichub')}
                        checked={!!openInNewTab}
                        onChange={(value) => setAttributes({ openInNewTab: !!value })}
                    />

                    <TextControl
                        label={__('Rel (SEO)', 'kinetichub')}
                        value={linkRel}
                        onChange={(value) => setAttributes({ linkRel: value })}
                        help={__('e.g., nofollow, noopener', 'kinetichub')}
                    />

                    
                </>
            )}
        </PanelBody>
    );
};