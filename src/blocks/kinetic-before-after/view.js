/**
 * Kinetic Before/After - Core Interaction Engine
 * Version: 1.0.1
 */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const instances = new Map();
    let domObserver = null;
    let ajaxTimer;

    const handleDomMutations = (mutations) => {
        let shouldInit = false;
        mutations.forEach(m => {
            if (m.removedNodes.length) {
                m.removedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('kh-ba-container')) cleanupBlock(node);
                        else if (node.querySelectorAll) node.querySelectorAll('.kh-ba-container').forEach(cleanupBlock);
                    }
                });
            }
            if (m.addedNodes.length) {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (node.classList?.contains('kh-ba-container') || node.querySelector?.('.kh-ba-container'))) {
                        shouldInit = true;
                    }
                });
            }
        });

        if (shouldInit) {
            clearTimeout(ajaxTimer);
            ajaxTimer = setTimeout(runAll, 150);
        }
    };

    const startDomObserver = () => {
        if (domObserver) return;
        domObserver = new MutationObserver(handleDomMutations);
        domObserver.observe(document.body, { childList: true, subtree: true });
    };

    const cleanupBlock = (slider) => {
        slider._kh_ba_isDestroyed = true; 
        if (instances.has(slider)) {
            const cleanupFn = instances.get(slider);
            if (typeof cleanupFn === 'function') cleanupFn();
            instances.delete(slider);
        }
        slider.classList.remove('kh-ready');

        if (instances.size === 0 && domObserver) {
            domObserver.disconnect();
            domObserver = null;
        }
    };

    const initSlider = (slider) => {
        if (slider.classList.contains('kh-ready')) return;
        if (!domObserver) startDomObserver();
        slider.classList.add('kh-ready');
        slider._kh_ba_isDestroyed = false;
        slider.style.opacity = 1;

        const inner = slider.querySelector('.kh-ba-inner');
        const before = slider.querySelector('.kh-ba-before');
        const after = slider.querySelector('.kh-ba-after');
        const handle = slider.querySelector('.kh-ba-handle');
        const circle = slider.querySelector('.kh-ba-circle');
        /* <fs_premium_only> */
        const badge = slider.querySelector('.kh-ba-cursor-badge');
        /* </fs_premium_only> */
        
        if (!inner || !before || !handle || !circle) return;

        const beforeImg = before.querySelector('.kh-ba-img');
        const afterImg = after ? after.querySelector('.kh-ba-img') : null;

        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        const orientation = slider.dataset.orientation;
        const transition = slider.dataset.transition; 
        const isHoriz = orientation === 'horizontal';
        
        const isClickMode = slider.dataset.click === 'true';
        const initialOffset = parseFloat(slider.dataset.offset) || 50;

        let isHoverMode = false;
        let isSnapMode = false;
        let isReverse = false;
        let hasInertia = false;
        let slantDeg = 15;
        let hasParallax = false;
        let isPeekMode = false;
        /* <fs_premium_only> */
        isHoverMode = slider.dataset.hover === 'true';
        isSnapMode = slider.dataset.snap === 'true';
        isReverse = slider.dataset.reverse === 'true';
        hasInertia = slider.dataset.inertia === 'true' && !prefersReducedMotion;
        slantDeg = parseFloat(slider.dataset.slant) || 15;
        hasParallax = slider.dataset.parallax === 'true';
        isPeekMode = slider.dataset.peek === 'true';
        /* </fs_premium_only> */

        /* <fs_premium_only> */
        if (transition === 'diagonal') {
            slider.style.setProperty('--kh-ba-slant', `${slantDeg}deg`);
        }
        /* </fs_premium_only> */

        let isDragging = false;
        let isIntroPlaying = false;
        let isPeeking = false;
        let prePeekPercent = initialOffset;
        
        let currentPercent = initialOffset; 
        let targetPercent = initialOffset;  
        
        let activeRect = null; 
        let localRafId = null;
        let resizeRafId = null;

        const baseAbortController = new AbortController();
        const baseSignal = baseAbortController.signal;
        let dragAbortController = null;

        const resizeObserver = new ResizeObserver(() => {
            if (slider._kh_ba_isDestroyed) return;
            if (resizeRafId) cancelAnimationFrame(resizeRafId);
            resizeRafId = requestAnimationFrame(() => {
                if (inner) activeRect = inner.getBoundingClientRect();
                renderStyles(currentPercent); 
            });
        });
        resizeObserver.observe(inner);

        const renderStyles = (percent) => {
            before.style.transition = 'none';
            handle.style.transition = 'none';

            /* <fs_premium_only> */
            if (isHoriz) {
            /* </fs_premium_only> */
                handle.style.left = `${percent}%`;
                handle.style.top = ''; 
            /* <fs_premium_only> */
            } else {
                handle.style.top = `${percent}%`;
                handle.style.left = '';
            }
            /* </fs_premium_only> */

            /* <fs_premium_only> */
            if (transition === 'fade') {
                before.style.opacity = isReverse ? (percent / 100) : ((100 - percent) / 100);
                before.style.clipPath = 'none';
            } else if (transition === 'diagonal' && isHoriz) {
                const rectHeight = activeRect ? activeRect.height : inner.offsetHeight;
                const rectWidth = activeRect ? activeRect.width : inner.offsetWidth;
                if (rectWidth === 0) return; 
                
                const slantPx = Math.tan(slantDeg * Math.PI / 180) * (rectHeight / 2);
                const slantPct = (slantPx / rectWidth) * 100;

                before.style.clipPath = isReverse 
                    ? `polygon(calc(${percent}% + ${slantPct}%) 0, 100% 0, 100% 100%, calc(${percent}% - ${slantPct}%) 100%)`
                    : `polygon(0 0, calc(${percent}% + ${slantPct}%) 0, calc(${percent}% - ${slantPct}%) 100%, 0 100%)`;
            } else {
            /* </fs_premium_only> */
                const clipVal = 100 - percent;
                if (percent <= 0 && !isReverse) before.style.clipPath = 'inset(0 100% 0 0)';
                else if (percent >= 100 && !isReverse) before.style.clipPath = 'none';
                else {
                    before.style.clipPath = isReverse ? `inset(0 0 0 ${percent}%)` : `inset(0 ${clipVal}% 0 0)`;
                    /* <fs_premium_only> */
                    if (!isHoriz) {
                        before.style.clipPath = isReverse ? `inset(${percent}% 0 0 0)` : `inset(0 0 ${clipVal}% 0)`;
                    }
                    /* </fs_premium_only> */
                }
            /* <fs_premium_only> */
            }
            /* </fs_premium_only> */

            /* <fs_premium_only> */
            if (hasParallax) {
                const shiftAfter = (percent - 50) * -0.15;
                const shiftBefore = (percent - 50) * 0.15;
                const baseScale = 'scale(1.1)';
                if (afterImg) afterImg.style.transform = isHoriz ? `translate3d(${shiftAfter}%, 0, 0) ${baseScale}` : `translate3d(0, ${shiftAfter}%, 0) ${baseScale}`;
                if (beforeImg) beforeImg.style.transform = isHoriz ? `translate3d(${shiftBefore}%, 0, 0) ${baseScale}` : `translate3d(0, ${shiftBefore}%, 0) ${baseScale}`;
            } else {
                // Reset transform when parallax is disabled to allow CSS hover zoom to work
                if (afterImg) afterImg.style.transform = '';
                if (beforeImg) beforeImg.style.transform = '';
            }
            /* </fs_premium_only> */

            circle.setAttribute('aria-valuenow', Math.round(percent));
        };

        const renderLoop = () => {
            if (slider._kh_ba_isDestroyed) return;

            /* <fs_premium_only> */
            if (hasInertia && !isIntroPlaying) {
                if (Math.abs(currentPercent - targetPercent) > 0.05) {
                    const friction = isDragging ? 0.4 : 0.1;
                    currentPercent = lerp(currentPercent, targetPercent, friction);
                    renderStyles(currentPercent);
                    localRafId = requestAnimationFrame(renderLoop);
                } else {
                    currentPercent = targetPercent;
                    renderStyles(currentPercent);
                    localRafId = null;
                }
            } else {
            /* </fs_premium_only> */
                currentPercent = targetPercent;
                renderStyles(currentPercent);
                localRafId = null;
            /* <fs_premium_only> */
            }
            /* </fs_premium_only> */
        };

        const updateTarget = (val) => {
            targetPercent = Math.max(0, Math.min(100, val));
            if (!localRafId) {
                localRafId = requestAnimationFrame(renderLoop);
            }
        };

        const getPercentFromEvent = (e) => {
            if (!activeRect || !activeRect.width || !activeRect.height) return targetPercent;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let p = isHoriz ? ((clientX - activeRect.left) / activeRect.width) * 100 : ((clientY - activeRect.top) / activeRect.height) * 100;
            return Math.max(0, Math.min(100, p));
        };

        /* <fs_premium_only> */
        const applySnap = (val) => {
            if (!isSnapMode) return val;
            const points = [0, 25, 50, 75, 100];
            const threshold = isHoverMode ? 3 : 6;
            for (let p of points) { if (Math.abs(val - p) < threshold) return p; }
            return val;
        };
        /* </fs_premium_only> */

        const onMove = (e) => {
            if (!isDragging && !isHoverMode) return;
            if (e.cancelable && e.type === 'touchmove') e.preventDefault(); 
            updateTarget(getPercentFromEvent(e));
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            slider.classList.remove('is-moving');
            
            if (dragAbortController) {
                dragAbortController.abort();
                dragAbortController = null;
            }
            /* <fs_premium_only> */
            if (isSnapMode) updateTarget(applySnap(targetPercent));
            /* </fs_premium_only> */
        };

        const startDrag = (e) => {
            isDragging = true;
            isIntroPlaying = false; 
            if (isPeeking) isPeeking = false;
            slider.classList.add('is-moving');
            
            if (!activeRect || activeRect.width === 0) {
                activeRect = inner.getBoundingClientRect();
            }
            updateTarget(getPercentFromEvent(e));

            dragAbortController = new AbortController();
            const dragSignal = dragAbortController.signal;

            window.addEventListener('mousemove', onMove, { passive: false, signal: dragSignal });
            window.addEventListener('mouseup', endDrag, { signal: dragSignal });
            window.addEventListener('touchmove', onMove, { passive: false, signal: dragSignal });
            window.addEventListener('touchend', endDrag, { signal: dragSignal });
        };

        circle.addEventListener('mousedown', (e) => { e.stopPropagation(); startDrag(e); }, { signal: baseSignal });
        circle.addEventListener('touchstart', (e) => { e.stopPropagation(); startDrag(e); }, { passive: false, signal: baseSignal });
        circle.addEventListener('click', (e) => e.stopPropagation(), { signal: baseSignal });
        
        /* <fs_premium_only> */
        const startPeek = (e) => {
            if (!isPeekMode || isDragging || slider.classList.contains('is-moving')) return;
            isPeeking = true;
            prePeekPercent = targetPercent;
            const p = getPercentFromEvent(e);
            updateTarget(p > 50 ? 0 : 100);
        };

        const endPeek = () => {
            if (isPeeking) {
                isPeeking = false;
                if (!isDragging) updateTarget(prePeekPercent);
            }
        };
        /* </fs_premium_only> */

        inner.addEventListener('mousedown', (e) => {
            if (e.target.closest('.kh-ba-circle') || e.target.closest('.kh-ba-handle')) return;
            if (!activeRect) activeRect = inner.getBoundingClientRect();
            
            /* <fs_premium_only> */
            if (isPeekMode) {
                startPeek(e);
            } else
            /* </fs_premium_only> */
            if (isClickMode && !isHoverMode) {
                if (!isDragging && !isIntroPlaying) {
                    let clickTarget = getPercentFromEvent(e);
                    /* <fs_premium_only> */
                    clickTarget = applySnap(clickTarget);
                    /* </fs_premium_only> */
                    updateTarget(clickTarget);
                }
            }
        }, { signal: baseSignal });

        /* <fs_premium_only> */
        window.addEventListener('mouseup', endPeek, { signal: baseSignal });
        /* </fs_premium_only> */
        
        inner.addEventListener('touchstart', (e) => {
            if (e.target.closest('.kh-ba-circle') || e.target.closest('.kh-ba-handle')) return;
            if (!activeRect) activeRect = inner.getBoundingClientRect();
            /* <fs_premium_only> */
            if (isPeekMode) {
                startPeek(e);
            } else
            /* </fs_premium_only> */
            if (isClickMode && !isHoverMode) {
                if (!isDragging && !isIntroPlaying) {
                    let touchTarget = getPercentFromEvent(e);
                    /* <fs_premium_only> */
                    touchTarget = applySnap(touchTarget);
                    /* </fs_premium_only> */
                    updateTarget(touchTarget);
                }
            }
        }, { passive: true, signal: baseSignal });
        
        /* <fs_premium_only> */
        window.addEventListener('touchend', endPeek, { signal: baseSignal });
        /* </fs_premium_only> */

        /* <fs_premium_only> */
        if (isHoverMode || badge) {
            inner.addEventListener('mouseenter', () => {
                activeRect = inner.getBoundingClientRect(); 
                inner.classList.add('is-hovering');
                if (isHoverMode && !isPeeking) slider.classList.add('is-moving');
            }, { passive: true, signal: baseSignal });
            
            inner.addEventListener('mousemove', (e) => {
                if (badge && activeRect) {
                    const bx = e.clientX - activeRect.left;
                    const by = e.clientY - activeRect.top;
                    badge.style.left = `${bx}px`;
                    badge.style.top = `${by}px`;
                }
                if (isHoverMode && !isDragging && !isIntroPlaying && !isPeeking && activeRect) {
                    updateTarget(applySnap(getPercentFromEvent(e)));
                }
            }, { passive: true, signal: baseSignal });
            
            inner.addEventListener('mouseleave', () => {
                inner.classList.remove('is-hovering');
                if (isHoverMode) {
                    slider.classList.remove('is-moving');
                    if (!isDragging && !isIntroPlaying && !isPeeking) {
                        updateTarget(initialOffset);
                    }
                }
            }, { passive: true, signal: baseSignal });
        }
        /* </fs_premium_only> */

        circle.addEventListener('keydown', (e) => {
            const step = 5;
            let newVal = targetPercent;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newVal += step;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newVal -= step;
            if (e.key === 'Home') newVal = 0;
            if (e.key === 'End') newVal = 100;

            if (newVal !== targetPercent) {
                e.preventDefault(); 
                let newTarget = Math.max(0, Math.min(100, newVal));
                /* <fs_premium_only> */
                if (isSnapMode) newTarget = applySnap(newTarget);
                /* </fs_premium_only> */
                updateTarget(newTarget);
                
                slider.classList.add('is-moving');
                setTimeout(() => { if(!isDragging && !slider._kh_ba_isDestroyed) slider.classList.remove('is-moving'); }, 400);
            }
        }, { signal: baseSignal });

        const localObserver = new IntersectionObserver((entries) => {
            if (slider._kh_ba_isDestroyed) return;
            if (entries[0].isIntersecting) {
                if (slider.dataset.intro === 'true' && !prefersReducedMotion) {
                    slider.dataset.intro = 'false'; 
                    isIntroPlaying = true;
                    const introType = slider.dataset.introStyle || 'slide';
                    
                    if (introType === 'slide') {
                        before.style.transition = 'clip-path 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                        handle.style.transition = `${isHoriz ? 'left' : 'top'} 0.4s cubic-bezier(0.25, 1, 0.5, 1)`;
                        const nudge = initialOffset > 10 ? initialOffset - 10 : initialOffset + 10;
                        setTimeout(() => {
                            if(isDragging || slider._kh_ba_isDestroyed) return;
                            renderStyles(nudge);
                            setTimeout(() => {
                                if(isDragging || slider._kh_ba_isDestroyed) return;
                                renderStyles(initialOffset);
                                setTimeout(() => { isIntroPlaying = false; }, 400);
                            }, 500);
                        }, 300);
                    }
                    /* <fs_premium_only> */
                    else if (introType === 'fade') {
                        inner.style.transition = 'opacity 1s cubic-bezier(0.25, 1, 0.5, 1)';
                        inner.style.opacity = '1';
                        setTimeout(() => { isIntroPlaying = false; inner.style.transition = ''; }, 1000);
                    } else if (introType === 'scale') {
                        inner.style.transition = 'transform 1s cubic-bezier(0.25, 1, 0.5, 1), opacity 1s ease';
                        inner.style.transform = 'scale(1)';
                        inner.style.opacity = '1';
                        setTimeout(() => { isIntroPlaying = false; inner.style.transition = ''; inner.style.transform = ''; }, 1000);
                    } else if (introType === 'blur') {
                        inner.style.transition = 'filter 1s ease, opacity 1s ease';
                        inner.style.filter = 'blur(0px)';
                        inner.style.opacity = '1';
                        setTimeout(() => { isIntroPlaying = false; inner.style.transition = ''; inner.style.filter = ''; }, 1000);
                    }
                    /* </fs_premium_only> */
                    else {
                        isIntroPlaying = false;
                    }
                }
            } else {
                if (isDragging) endDrag();
                /* <fs_premium_only> */
                if (isPeeking) endPeek();
                /* </fs_premium_only> */
            }
        }, { threshold: 0.1 });
        
        localObserver.observe(slider);
        
        activeRect = inner.getBoundingClientRect();
        renderStyles(currentPercent);

        instances.set(slider, () => {
            localObserver.unobserve(slider);
            resizeObserver.unobserve(inner);
            if (resizeRafId) cancelAnimationFrame(resizeRafId);
            if (localRafId) cancelAnimationFrame(localRafId);
            
            baseAbortController.abort();
            if (dragAbortController) dragAbortController.abort();
        });
    };

    const runAll = () => document.querySelectorAll('.kh-ba-container:not(.kh-ready)').forEach(initSlider);
    runAll();

    startDomObserver();

    window.addEventListener('pagehide', () => {
        if (domObserver) {
            domObserver.disconnect();
            domObserver = null;
        }
        clearTimeout(ajaxTimer);
    }, { once: true });
});