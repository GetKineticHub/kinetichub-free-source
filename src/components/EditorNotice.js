/**
 * Kinetic Editor Notice (Global Component)
 * Version: 1.0.0
 * (Event Listener Cleanup & A11y)
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const KineticEditorNotice = ({
    message = __('Animations & generative effects are active on the frontend only.', 'kinetichub'),
    status = 'info'
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    const hideNotice = useCallback(() => {
        setIsVisible((previousValue) => {
            if (!previousValue) {
                return previousValue;
            }

            setIsFading(true);
            setTimeout(() => setIsVisible(false), 300);

            return previousValue;
        });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            hideNotice();
        }, 4000);

        const handleInteraction = () => hideNotice();

        document.addEventListener('mousedown', handleInteraction);
        document.addEventListener('keydown', handleInteraction);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
        };
    }, [hideNotice]);

    if (!isVisible) {
        return null;
    }

    const isWarning = status === 'warning';

    return (
        <div
            className={`kinetic-editor-notice kinetic-editor-notice-${isWarning ? 'warning' : 'info'}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={__('Editor notification', 'kinetichub')}
            style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: isWarning ? 'rgba(120, 53, 15, 0.9)' : 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                color: '#f8fafc',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                opacity: isFading ? 0 : 1,
                transform: isFading ? 'translateY(10px)' : 'translateY(0)',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            }}
        >
            <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>

            <span>{message}</span>
        </div>
    );
};