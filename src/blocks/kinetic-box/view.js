/**
 * Kinetic Box - Physics Engine
 * Version: 1.0.0
 
 */
(function() {
    'use strict';

    /* <fs_premium_only> */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
    /* </fs_premium_only> */

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

    /* <fs_premium_only> */
    const initPhysics = (box) => {
        if (prefersReducedMotion || isTouch) return;

        const isTilt = box.dataset.tilt === 'true';
        const isMagnetic = box.dataset.magnetic === 'true';
        const isParallax = box.dataset.parallax === 'true';
        const isSpotlight = box.dataset.spotlight === 'true';
        const inner = box.querySelector('.kh-box-inner-content');

        box._kh_box_abortController = new AbortController();
        const { signal } = box._kh_box_abortController;

        let state = {
            clientX: 0, clientY: 0,
            currX: 0, currY: 0,
            currMagX: 0, currMagY: 0,
            isHovering: false,
            rafId: null
        };

        let boxRect = { width: 0, height: 0, left: 0, absoluteTop: 0 };

        const updateRect = () => {
            const rect = box.getBoundingClientRect();
            boxRect.width = rect.width;
            boxRect.height = rect.height;
            boxRect.left = rect.left;
            boxRect.absoluteTop = rect.top + window.scrollY; 
        };

        const handleMouseMove = (e) => {
            state.clientX = e.clientX;
            state.clientY = e.clientY;
        };

        const update = () => {
            if (box._kh_box_isDestroyed || !document.contains(box)) {
                cleanupBlock(box);
                return;
            }

            if (!state.isHovering && Math.abs(state.currX) < 0.01 && Math.abs(state.currMagX) < 0.01) {
                box.classList.remove('is-physics-active');
                box.classList.remove('is-physics-returning');
                box.style.transform = '';
                if (inner) inner.style.transform = '';
                state.rafId = null;
                box._kh_box_rafId = null;
                return;
            }

            const currentTop = boxRect.absoluteTop - window.scrollY;
            const currentCenterX = boxRect.left + (boxRect.width / 2);
            const currentCenterY = currentTop + (boxRect.height / 2);

            const rawX = state.clientX - boxRect.left;
            const rawY = state.clientY - currentTop;
            const mouseX = boxRect.width > 0 ? (state.clientX - currentCenterX) / (boxRect.width / 2) : 0;
            const mouseY = boxRect.height > 0 ? (state.clientY - currentCenterY) / (boxRect.height / 2) : 0;

            if (isSpotlight && state.isHovering) {
                box.style.setProperty('--mouse-x', `${rawX}px`);
                box.style.setProperty('--mouse-y', `${rawY}px`);
            }

            const targetX = state.isHovering ? mouseX : 0;
            const targetY = state.isHovering ? mouseY : 0;

            state.currX = lerp(state.currX, targetX, 0.1);
            state.currY = lerp(state.currY, targetY, 0.1);

            let transformStr = '';

            if (isTilt) {
                const tiltAngle = 15;
                transformStr += `rotateX(${state.currY * -tiltAngle}deg) rotateY(${state.currX * tiltAngle}deg) `;
            }

            if (isMagnetic) {
                const magStrength = 20;
                state.currMagX = lerp(state.currMagX, targetX * magStrength, 0.15);
                state.currMagY = lerp(state.currMagY, targetY * magStrength, 0.15);
                transformStr += `translate3d(${state.currMagX}px, ${state.currMagY}px, 0) `;
            }

            if (isTilt || isMagnetic) {
                box.style.transform = transformStr;
            }

            if (isParallax && inner) {
                const pStrength = 12;
                inner.style.transform = `translate3d(${state.currX * -pStrength}px, ${state.currY * -pStrength}px, 20px)`;
            }

            state.rafId = requestAnimationFrame(update);
            box._kh_box_rafId = state.rafId;
        };

        box.addEventListener('mouseenter', () => {
            state.isHovering = true;
            updateRect(); 
            box.classList.add('is-physics-active');
            box.classList.remove('is-physics-returning');
            if (!state.rafId) {
                state.rafId = requestAnimationFrame(update);
                box._kh_box_rafId = state.rafId;
            }
        }, { passive: true, signal });

        box.addEventListener('mousemove', handleMouseMove, { passive: true, signal });

        box.addEventListener('mouseleave', () => {
            state.isHovering = false;
            box.classList.add('is-physics-returning');
        }, { passive: true, signal });

        box.addEventListener('focusin', () => {
            state.isHovering = true;
            updateRect();
            box.classList.add('is-physics-active');
            box.classList.remove('is-physics-returning');
        }, { passive: true, signal });

        box.addEventListener('focusout', () => {
            state.isHovering = false;
            box.classList.add('is-physics-returning');
        }, { passive: true, signal });
    };
    /* </fs_premium_only> */

    const initEntrance = (box) => {
        if (box.classList.contains('kh-box-ready')) return;
        box.classList.add('kh-box-ready');
        box._kh_box_isDestroyed = false;
        activeInstances.add(box);

        let hasEntrance = false;
        /* <fs_premium_only> */
        hasEntrance = box.hasAttribute('data-entrance');
        if (hasEntrance) {
            if (!globalEntranceObserver) {
                globalEntranceObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('kh-box-animated');
                            globalEntranceObserver.unobserve(entry.target); 
                        }
                    });
                }, { threshold: 0.15 });
            }
            globalEntranceObserver.observe(box);
        }
        /* </fs_premium_only> */

        if (!hasEntrance) {
            box.style.opacity = 1;
        }

        /* <fs_premium_only> */
        if (box.dataset.tilt === 'true' || box.dataset.magnetic === 'true' || box.dataset.parallax === 'true' || box.dataset.spotlight === 'true') {
            initPhysics(box);
        }
        /* </fs_premium_only> */
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