/**
 * Kinetic Scroll Divider - Frontend Physics Engine
 * Version: 1.0.1
 */
(function() {
    'use strict';

    const MOBILE_BREAKPOINT = 768;
    const AJAX_INIT_DELAY = 150;
    const STATIC_REVEAL_DELAY = 50;
    const SCRUB_TRAVEL_DISTANCE = 0.35;

    let activeInstances = new Set();
    let domObserver = null;

    const cleanupBlock = (block) => {
        if (!block.classList.contains('js-ready')) return;
        activeInstances.delete(block);
        block.classList.remove('js-ready');
        if (block._kh_sd_abort) {
            block._kh_sd_abort.abort();
            block._kh_sd_abort = null;
        }

        // Disconnect all observers when no instances remain
        if (activeInstances.size === 0 && domObserver) {
            domObserver.disconnect();
            domObserver = null;
        }
    };

    const initAll = () => {
        document.querySelectorAll('.kh-scroll-divider-container:not(.js-ready)').forEach(block => {
            block.classList.add('js-ready');
            activeInstances.add(block);

            const rmBehavior = block.classList.contains('rm-hide') ? 'hide' : (block.classList.contains('rm-fade') ? 'fade' : 'static');
            const isScrub = block.classList.contains('tether-scrub');
            
            const hasMatchMedia = typeof window.matchMedia === 'function';
            const prefersReducedMotion = hasMatchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Accessibility Hardware Intercept
            if (prefersReducedMotion) {
                if (rmBehavior === 'hide') {
                    block.style.display = 'none';
                } else if (rmBehavior === 'fade') {
                    block.classList.remove('anim-draw-center', 'anim-draw-left', 'anim-draw-right');
                    block.classList.add('anim-fade-in');
                    setTimeout(() => block.classList.add('is-animated'), STATIC_REVEAL_DELAY);
                } else {
                    block.classList.add('is-animated');
                }
                return;
            }

            // Mobile Static Intercept
            if (block.classList.contains('mob-static') && window.innerWidth <= MOBILE_BREAKPOINT) {
                block.classList.add('is-animated');
                if (isScrub) block.style.setProperty('--kh-div-progress', '1');
                return;
            }

            // Failsafe for older environments
            if (typeof IntersectionObserver !== 'function') {
                block.classList.add('is-animated');
                return;
            }

            
                const offsetVal = block.style.getPropertyValue('--kh-div-offset') || '0%';
                const rootMargin = `0px 0px ${offsetVal} 0px`;

                const observer = new IntersectionObserver((entries, obs) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-animated');
                            obs.unobserve(entry.target);
                        }
                    });
                }, { rootMargin, threshold: 0 });

                observer.observe(block);
            );
    };

    // Safeload execution
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    if (typeof MutationObserver === 'function') {
        let ajaxTimer;
        domObserver = new MutationObserver((mutations) => {
            let shouldInit = false;
            for (let i = 0; i < mutations.length; i++) {
                const m = mutations[i];

                // Cleanup removed dividers
                for (let k = 0; k < m.removedNodes.length; k++) {
                    const node = m.removedNodes[k];
                    if (node.nodeType !== 1) continue;
                    if (node.classList?.contains('kh-scroll-divider-container')) {
                        cleanupBlock(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('.kh-scroll-divider-container').forEach(cleanupBlock);
                    }
                }

                for (let j = 0; j < m.addedNodes.length; j++) {
                    const node = m.addedNodes[j];
                    if (node.nodeType === 1 && (node.classList?.contains('kh-scroll-divider-container') || node.querySelector?.('.kh-scroll-divider-container'))) {
                        shouldInit = true;
                        break;
                    }
                }
                if (shouldInit) break;
            }
            if (shouldInit) {
                clearTimeout(ajaxTimer);
                ajaxTimer = setTimeout(initAll, AJAX_INIT_DELAY);
            }
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
    }
})();