/**
 * Kinetic Video Modal - Frontend Logic
 * Version: 1.0.0
 */
(function() {
    'use strict';

    // ========================================
    // CONSTANTS 
    // ========================================
    const MAGNETIC_FORCE = 0.3;
    const MAGNETIC_LERP = 0.1;
    const THUMBNAIL_MIN_WIDTH = 120;
    const FALLBACK_TIMEOUT = 3000;
    const MODAL_TRANSITION_DURATION = 300;
    const ANNOUNCEMENT_CLEANUP_DELAY = 1000;
    const PRELOAD_MARGIN = '200px';

    // ========================================
    // BROWSER FEATURE DETECTION
    // ========================================
    const hasMatchMedia = typeof window.matchMedia === 'function';
    const prefersReducedMotion = hasMatchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    const lerp = (start, end, factor) => start + (end - start) * factor;

    /**
     *  Announce to screen readers
     */
    const announceToScreenReader = (message) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'screen-reader-text';
        announcement.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), ANNOUNCEMENT_CLEANUP_DELAY);
    };

    /**
     * Create close button SVG using programmatic DOM construction (CSP compliant)
     */
    const createCloseIconSVG = () => {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', '24'); svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
        const line1 = document.createElementNS(svgNS, 'line');
        line1.setAttribute('x1', '18'); line1.setAttribute('y1', '6'); line1.setAttribute('x2', '6'); line1.setAttribute('y2', '18');
        const line2 = document.createElementNS(svgNS, 'line');
        line2.setAttribute('x1', '6'); line2.setAttribute('y1', '6'); line2.setAttribute('x2', '18'); line2.setAttribute('y2', '18');
        svg.appendChild(line1); svg.appendChild(line2);
        return svg;
    };

    /**
     * Create loading spinner for iframe
     */
    const createLoadingSpinner = () => {
        const loader = document.createElement('div');
        loader.className = 'kh-vm-iframe-loader';
        loader.setAttribute('aria-label', 'Loading video');
        loader.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:kh-vm-spin 0.8s linear infinite;';
        
        // Add keyframes if not already present
        if (!document.getElementById('kh-vm-loader-styles')) {
            const style = document.createElement('style');
            style.id = 'kh-vm-loader-styles';
            style.textContent = '@keyframes kh-vm-spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
        
        return loader;
    };

    /**
     * URL Domain Validation
     * Validates that URLs come from allowed domains before processing
     */
    const validateVideoUrl = (url) => {
        const allowedDomains = [
            'youtube.com',
            'youtu.be',
            'youtube-nocookie.com',
            'vimeo.com'
        ];

        // Check for self-hosted video files
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return true;
        }

        // Validate external URLs
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            
            // Check if hostname matches or is subdomain of allowed domains
            const isAllowed = allowedDomains.some(domain => 
                hostname === domain || hostname.endsWith('.' + domain)
            );
            
            return isAllowed;
        } catch (e) {
            // Invalid URL format
            return false;
        }
    };

    /**
     * Parse and validate video URL
     * Returns { src: string, isIframe: boolean }
     */
    const parseVideoUrl = (url, start, autoplay, loop, mute) => {
        let src = '';
        let isIframe = true;

        //  Validate URL before processing
        if (!validateVideoUrl(url)) {
            console.warn('Kinetic Video Modal: URL not from allowed domain:', url);
            return { src: '', isIframe: false };
        }

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const ytId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
            if (ytId) {
                src = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`;
                if (autoplay) src += '&autoplay=1';
                if (mute) src += '&mute=1';
                if (loop) src += `&loop=1&playlist=${ytId}`;
                if (start > 0) src += `&start=${start}`;
            }
        } else if (url.includes('vimeo.com')) {
            const vimeoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)?.[1];
            if (vimeoId) {
                src = `https://player.vimeo.com/video/${vimeoId}?dnt=1`;
                if (autoplay) src += '&autoplay=1';
                if (mute) src += '&muted=1';
                if (loop) src += '&loop=1';
                if (start > 0) src += `#t=${start}s`;
            }
        } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
            isIframe = false;
            src = url;
        } else {
            isIframe = false;
        }

        return { src, isIframe };
    };

    /**
     * Initialize a single video modal block
     */
    const initModalBlock = (container) => {
        container.classList.add('js-ready');
        const triggerZone = container.querySelector('.kh-vm-play-trigger-zone');
        const playBtn = container.querySelector('.kh-vm-play-button');
        
        // ========================================
        // Automatic maxresdefault fallback with timeout
        // ========================================
        const fallbackImg = container.querySelector('.kh-vm-cover-img[data-fallback-src]');
        if (fallbackImg) {
            let fallbackApplied = false;
            
            const applyFallback = () => {
                if (fallbackApplied) return;
                fallbackApplied = true;
                
                const fallbackSrc = fallbackImg.getAttribute('data-fallback-src');
                if (fallbackSrc) {
                    fallbackImg.src = fallbackSrc;
                    fallbackImg.removeAttribute('data-fallback-src');
                }
            };

            // Add timeout to prevent infinite waiting
            const fallbackTimeout = setTimeout(applyFallback, FALLBACK_TIMEOUT);

            if (fallbackImg.complete) {
                clearTimeout(fallbackTimeout);
                if (fallbackImg.naturalWidth <= THUMBNAIL_MIN_WIDTH) {
                    applyFallback();
                }
            } else {
                fallbackImg.addEventListener('load', () => {
                    clearTimeout(fallbackTimeout);
                    if (fallbackImg.naturalWidth <= THUMBNAIL_MIN_WIDTH) {
                        applyFallback();
                    }
                }, { once: true });
                
                fallbackImg.addEventListener('error', () => {
                    clearTimeout(fallbackTimeout);
                    applyFallback();
                }, { once: true });
            }
        }

        if (!triggerZone) return;

        // ========================================
        // EXTRACT DATA ATTRIBUTES
        // ========================================
        const rawUrl = triggerZone.getAttribute('data-url');
        const mode = triggerZone.getAttribute('data-mode') || 'modal';
        const isAutoplay = triggerZone.getAttribute('data-autoplay') === 'true';
        const isLoop = triggerZone.getAttribute('data-loop') === 'true';
        const isMute = triggerZone.getAttribute('data-mute') === 'true';
        const startSec = parseInt(triggerZone.getAttribute('data-start') || '0', 10);

        let activeDialog = null;
        let originalFocus = null;

        /**
         * Build video element (iframe or native video)
         * Added loading state and intelligent preloading
         */
        const buildVideoElement = (parsed, preload) => {
            if (parsed.isIframe) {
                // Wrap iframe with loader
                const wrapper = document.createElement('div');
                wrapper.className = 'kh-vm-iframe-wrapper';
                wrapper.style.position = 'relative';

                wrapper.style.width = '100%';
                wrapper.style.height = '100%';
                
                const loader = createLoadingSpinner();
                wrapper.appendChild(loader);
                
                const iframe = document.createElement('iframe');
                iframe.setAttribute('src', parsed.src);
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.className = 'kh-vm-iframe';
                
                // Remove loader when iframe loads
                iframe.addEventListener('load', () => {
                    if (wrapper.contains(loader)) {
                        loader.remove();
                    }
                }, { once: true });
                
                wrapper.appendChild(iframe);
                return wrapper;
            } else if (parsed.src) {
                const video = document.createElement('video');
                video.setAttribute('src', parsed.src);
                video.className = 'kh-vm-native-video';
                video.controls = true;
                video.playsInline = true;
                if (isAutoplay) video.autoplay = true;
                if (isLoop) video.loop = true;
                if (isMute) video.muted = true;
                
                const preloadAttr = preload || triggerZone.getAttribute('data-preload') || 'metadata';
                video.setAttribute('preload', preloadAttr);
                
                if (startSec > 0) {
                    video.addEventListener('loadedmetadata', () => { 
                        video.currentTime = startSec; 
                    }, { once: true });
                }
                
                // Intelligent preloading with IntersectionObserver
                if ('IntersectionObserver' in window && preloadAttr === 'metadata') {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                video.setAttribute('preload', 'auto');
                                observer.disconnect();
                            }
                        });
                    }, { rootMargin: PRELOAD_MARGIN });
                    observer.observe(video);
                }
                
                return video;
            }
            
            const err = document.createElement('div');
            err.className = 'kh-vm-error-msg';
            err.textContent = 'Unsupported video format.';
            err.style.cssText = 'padding:2rem;text-align:center;color:#ef4444;';
            return err;
        };

        /**
         * Open modal dialog
         */
        const openModal = () => {
            const parsed = parseVideoUrl(rawUrl, startSec, true, isLoop, isMute);
            if (!parsed.src) {
                console.error('Kinetic Video Modal: Invalid or unsupported video URL');
                return;
            }

            originalFocus = document.activeElement;

            const dialogOverlay = document.createElement('div');
            dialogOverlay.className = `kh-vm-dialog-overlay bd-${triggerZone.getAttribute('data-backdrop')} anim-${triggerZone.getAttribute('data-entrance')}`;
            
            const contentWrap = document.createElement('div');
            contentWrap.className = 'kh-vm-dialog-content';
            
            const ratioMatch = container.className.match(/ratio-([a-z0-9]+)/);
            if (ratioMatch) contentWrap.classList.add(ratioMatch[0]);

            const ariaLabel = triggerZone.getAttribute('data-aria-dialog') || 'Video Player';
            contentWrap.setAttribute('role', 'dialog');
            contentWrap.setAttribute('aria-modal', 'true');
            contentWrap.setAttribute('aria-label', ariaLabel);
            contentWrap.setAttribute('tabindex', '-1');

            const closeBtn = document.createElement('button');
            closeBtn.className = 'kh-vm-dialog-close';
            closeBtn.setAttribute('aria-label', triggerZone.getAttribute('data-aria-close') || 'Close Video');
            closeBtn.appendChild(createCloseIconSVG());

            if (triggerZone.getAttribute('data-close-outside') === 'true') {
                dialogOverlay.classList.add('close-outside');
            }

            const mediaEl = buildVideoElement(parsed);
            
            contentWrap.appendChild(mediaEl);
            contentWrap.appendChild(closeBtn);
            dialogOverlay.appendChild(contentWrap);
            document.body.appendChild(dialogOverlay);
            document.body.classList.add('kh-vm-body-scroll-lock');

            // Announce modal opening to screen readers
            announceToScreenReader(`${ariaLabel} opened`);

            void dialogOverlay.offsetWidth;
            dialogOverlay.classList.add('is-open');

            contentWrap.focus();

            /**
             * Focus trap and keyboard controls
             */
            const trapFocus = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    return;
                }
                if (e.key === 'Tab') {
                    const focusables = contentWrap.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), iframe, video');
                    if (focusables.length === 0) { e.preventDefault(); return; }
                    
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
                    } else {
                        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
                    }
                }
            };

            /**
             * Close modal and cleanup
             */
            const closeModal = () => {
                dialogOverlay.classList.remove('is-open');
                document.removeEventListener('keydown', trapFocus);
                document.body.classList.remove('kh-vm-body-scroll-lock');
                
                // Announce closing to screen readers
                announceToScreenReader('Video player closed');
                
                setTimeout(() => {
                    if (document.body.contains(dialogOverlay)) document.body.removeChild(dialogOverlay);
                    if (originalFocus && typeof originalFocus.focus === 'function') originalFocus.focus();
                }, MODAL_TRANSITION_DURATION);
            };

            closeBtn.addEventListener('click', closeModal);
            document.addEventListener('keydown', trapFocus);

            if (triggerZone.getAttribute('data-close-backdrop') === 'true') {
                dialogOverlay.addEventListener('click', (e) => {
                    if (e.target === dialogOverlay) closeModal();
                });
            }
            
            activeDialog = dialogOverlay;
        };

        /**
         * Play video inline (replace preview with video)
         */
        const playInline = () => {
            const parsed = parseVideoUrl(rawUrl, startSec, true, isLoop, isMute);
            if (!parsed.src) {
                console.error('Kinetic Video Modal: Invalid or unsupported video URL');
                return;
            }

            const mediaEl = buildVideoElement(parsed, 'auto'); // Force preload for inline
            mediaEl.classList.add('kh-vm-inline-frame');

            const previewLayer = container.querySelector('.kh-vm-preview-layer');
            
            triggerZone.style.pointerEvents = 'none';
            triggerZone.setAttribute('aria-hidden', 'true');
            
            container.appendChild(mediaEl);
            previewLayer.classList.add('is-inline-hidden');
            
            // Auto-play for native video with fallback muting
            if (mediaEl.tagName === 'VIDEO') {
                mediaEl.play().catch(() => { 
                    mediaEl.muted = true; 
                    mediaEl.play(); 
                });
            }
        };

        /**
         * Attach click handler for play button
         */
        triggerZone.addEventListener('click', () => {
            if (mode === 'inline') playInline();
            else openModal();
        });

        // ========================================
        // MAGNETIC ANIMATION WITH CLEANUP
        // ========================================
        ;

    /**
     * Initialize all video modal blocks on page
     */
    const initAll = () => document.querySelectorAll('.kh-video-modal-container:not(.js-ready)').forEach(initModalBlock);

    // ========================================
    // INITIALIZATION
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    // Watch for dynamically added blocks
    if (typeof MutationObserver === 'function') {
        const domObserver = new MutationObserver((mutations) => {
            for (let m of mutations) {
                if (m.addedNodes.length) {
                    initAll();
                    break;
                }
            }
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
    }
})();