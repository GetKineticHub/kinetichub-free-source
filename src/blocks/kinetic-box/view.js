/**
 * Kinetic Box - Physics Engine
 * Version: 1.0.0
 
 */
(function() {
    'use strict';

    

    const activeInstances = new Set();
    let globalEntranceObserver = null;
    let globalAbortController = null;

    const cleanupBlock = (box) => {
        box._kh_box_isDestroyed = true; 
        // Readiness guarantees a live Pause listener. Revoke it before the
        // instance signal is aborted, while preserving the visitor's pause.
        box.classList.remove('kh-box-idle-control-ready');

        if (box._kh_box_rafId) {
            cancelAnimationFrame(box._kh_box_rafId);
            box._kh_box_rafId = null;
        }
        
        if (box._kh_box_entranceTimer) {
            clearTimeout(box._kh_box_entranceTimer);
            box._kh_box_entranceTimer = null;
        }
        box._kh_box_completeEntrance = null;
        box._kh_box_idleControl = null;
        if (globalEntranceObserver) {
            globalEntranceObserver.unobserve(box);
        }
        if (box._kh_box_abortController) {
            box._kh_box_abortController.abort();
            box._kh_box_abortController = null;
        }
        
        box.classList.remove('kh-box-ready');
        activeInstances.delete(box);

        if (activeInstances.size === 0 && globalAbortController) {
            globalAbortController.abort();
            globalAbortController = null;
            if (globalEntranceObserver) {
                globalEntranceObserver.disconnect();
                globalEntranceObserver = null;
            }
        }
    };

    

    

    const initEntrance = (box) => {
        if (box.classList.contains('kh-box-ready')) return;
        box.classList.add('kh-box-ready');
        box._kh_box_isDestroyed = false;
        activeInstances.add(box);

        // Exactly one AbortController per instance, created here rather than in
        // initPhysics so every Box has one whether or not the physics engine
        // runs, and so the FREE strip cannot remove the creation while
        // cleanupBlock still aborts it.
        box._kh_box_abortController = new AbortController();
        const { signal } = box._kh_box_abortController;

        let hasEntrance = false;
        

        if (!hasEntrance) {
            box.style.opacity = 1;
        }

        
    };

    const run = () => {
        const boxes = document.querySelectorAll('.kh-box-wrapper:not(.kh-box-ready)');
        if (boxes.length > 0 && !globalAbortController) {
            globalAbortController = new AbortController();
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(run, 200);
            }, { passive: true, signal: globalAbortController.signal });
        }
        boxes.forEach(initEntrance);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        run();
    } else {
        document.addEventListener('DOMContentLoaded', run);
    }

    if (typeof MutationObserver === 'function') {
        let ajaxTimer;
        const domObserver = new MutationObserver((mutations) => {
                let shouldInit = false;
                mutations.forEach(m => {
                    if (m.removedNodes.length) {
                        m.removedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                if (node.classList && node.classList.contains('kh-box-wrapper')) {
                                    cleanupBlock(node);
                                }
                                if (node.querySelectorAll) {
                                    node.querySelectorAll('.kh-box-wrapper').forEach(cleanupBlock);
                                }
                            }
                        });
                    }
                    if (m.addedNodes.length) {
                        m.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && (node.classList?.contains('kh-box-wrapper') || node.querySelector?.('.kh-box-wrapper'))) {
                                shouldInit = true;
                            }
                        });
                    }
                });

                if (shouldInit) {
                    clearTimeout(ajaxTimer);
                    ajaxTimer = setTimeout(run, 150);
                }
            });
            domObserver.observe(document.body, { childList: true, subtree: true });
    }
})();