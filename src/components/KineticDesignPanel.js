/**
 * kinetichub - Global Design Panel Component
  (Clean Component Export)
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const KineticDesignPanel = ({ 
    children, 
    title = __('🎨 Design & Layout', 'kinetichub'), 
    initialOpen = false,
    className = ''
}) => {
    return (
        <PanelBody title={title} initialOpen={initialOpen} className={className}>
            {children}
        </PanelBody>
    );
};