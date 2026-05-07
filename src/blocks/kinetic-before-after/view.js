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

            
                handle.style.left = `${percent}%`;
                handle.style.top = ''; 
            

            
                const clipVal = 100 - percent;
                if (percent <= 0 && !isReverse) before.style.clipPath = 'inset(0 100% 0 0)';
                else if (percent >= 100 && !isReverse) before.style.clipPath = 'none';
                else {
                    before.style.clipPath = isReverse ? `inset(0 0 0 ${percent}%)` : `inset(0 ${clipVal}% 0 0)`;
                    
            

            

            circle.setAttribute('aria-valuenow', Math.round(percent));
        };

        const renderLoop = () => {
            if (slider._kh_ba_isDestroyed) return;

            
                currentPercent = targetPercent;
                renderStyles(currentPercent);
                localRafId = null;
            ;

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
            ;

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
        
        

        inner.addEventListener('mousedown', (e) => {
            if (e.target.closest('.kh-ba-circle') || e.target.closest('.kh-ba-handle')) return;
            if (!activeRect) activeRect = inner.getBoundingClientRect();
            
            
            if (isClickMode && !isHoverMode) {
                if (!isDragging && !isIntroPlaying) {
                    let clickTarget = getPercentFromEvent(e);
                    
                    updateTarget(clickTarget);
                }
            }
        }, { signal: baseSignal });

        
        
        inner.addEventListener('touchstart', (e) => {
            if (e.target.closest('.kh-ba-circle') || e.target.closest('.kh-ba-handle')) return;
            if (!activeRect) activeRect = inner.getBoundingClientRect();
            
            if (isClickMode && !isHoverMode) {
                if (!isDragging && !isIntroPlaying) {
                    let touchTarget = getPercentFromEvent(e);
                    
                    updateTarget(touchTarget);
                }
            }
        }, { passive: true, signal: baseSignal });
        
        

        

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
                    
                    else {
                        isIntroPlaying = false;
                    }
                }
            } else {
                if (isDragging) endDrag();
                
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