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

        if (block._kh_sd_observer) {
            block._kh_sd_observer.disconnect();
            block._kh_sd_observer = null;
        }

        // The shared DOM observer stays attached for the lifetime of the page. It used
        // to disconnect once the last divider was removed, but it is only created once
        // at startup, so a later AJAX insertion was never detected: initAll never ran
        // and the new divider stayed at its opacity:0 start state.
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

                // Scrub mode draws the line from --kh-div-progress, and the scroll
                // engine that writes it lives past this return, so the property was
                // left at its 0 default: is-animated is outranked by the .tether-scrub
                // rules and the divider stayed invisible. Present the completed state,
                // exactly as the mobile-static intercept below already does. 'hide' is
                // deliberately excluded - that divider is meant to stay gone.
                if (isScrub && rmBehavior !== 'hide') {
                    block.style.setProperty('--kh-div-progress', '1');
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

                            // One block per observer, so nothing is left to watch once it
                            // has revealed. Drop the stored reference too, so cleanupBlock
                            // never disconnects an observer that is already finished.
                            obs.disconnect();
                            if (entry.target._kh_sd_observer === obs) {
                                entry.target._kh_sd_observer = null;
                            }
                        }
                    });
                }, { rootMargin, threshold: 0 });

                // Keep the reference reachable: a block removed before it ever reveals
                // would otherwise leave an observer that no cleanup path can stop, and a
                // re-inserted node would gain a second one.
                block._kh_sd_observer = observer;
                observer.observe(block);
            
        });
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