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

        if (box._kh_box_rafId) {
            cancelAnimationFrame(box._kh_box_rafId);
            box._kh_box_rafId = null;
        }
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
                                } else if (node.querySelectorAll) {
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