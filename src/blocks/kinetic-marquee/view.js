/**
 * Kinetic Marquee - Frontend Performance Engine
 * Version: 1.0.2
 */
(function() {
    'use strict';

    let globalObserver = null;
    let domObserver = null;
    let activeInstances = new Set(); // Track active marquee instances
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    const cleanupBlock = (marquee) => {
        // Remove from active instances tracking
        activeInstances.delete(marquee);
        
        // Unobserve this specific instance
        if (globalObserver) globalObserver.unobserve(marquee);
        
        // CRITICAL: Disconnect all observers when no instances remain
        if (activeInstances.size === 0) {
            if (globalObserver) {
                globalObserver.disconnect();
                globalObserver = null;
            }
            if (domObserver) {
                domObserver.disconnect();
                domObserver = null;
            }
        }
        
        if (marquee._kh_mq_abortController) {
            marquee._kh_mq_abortController.abort();
            marquee._kh_mq_abortController = null;
        }
        if (marquee._kh_mq_rafId) {
            cancelAnimationFrame(marquee._kh_mq_rafId);
            marquee._kh_mq_rafId = null;
        }
        
        const groups = marquee.querySelectorAll('.kh-mq-marquee-group');
        groups.forEach(group => {
            if (group._kh_mq_anim) {
                group._kh_mq_anim.cancel();
                group._kh_mq_anim = null;
            }
        });

        marquee._kh_mq_progressSegments = null;
        marquee._kh_mq_indicator = null;
        marquee._kh_mq_items = null;
        marquee._kh_mq_lastSampleTime = 0;
        marquee._kh_mq_activeOriginIndex = -1;

        marquee.classList.remove('js-ready');
    };

    const initMarquee = (marquee) => {
        if (marquee.classList.contains('js-ready')) return;
        marquee.classList.add('js-ready');
        
        // Add to active instances tracking
        activeInstances.add(marquee);

        marquee._kh_mq_abortController = new AbortController();
        const { signal } = marquee._kh_mq_abortController;

        const images = marquee.querySelectorAll('img');
        images.forEach((img) => {
            img.addEventListener('error', () => { img.style.display = 'none'; }, { signal, passive: true });
        });

        const groups = marquee.querySelectorAll('.kh-mq-marquee-group');
        if (!prefersReducedMotion) {
            try {
                let durStr = marquee.style.getPropertyValue('--kh-mq-duration');
                if (!durStr) durStr = window.getComputedStyle(marquee).getPropertyValue('--kh-mq-duration');
                
                let durationMs = parseFloat((durStr || '').replace(/[^\d.]/g, ''));
                if (isNaN(durationMs) || durationMs <= 0) durationMs = 30;
                durationMs *= 1000;

                const isReversed = marquee.classList.contains('is-reversed');

                groups.forEach(group => {
                    group._kh_mq_anim = group.animate([
                        { transform: 'translateX(0)' },
                        { transform: 'translateX(-100%)' }
                    ], {
                        duration: durationMs,
                        iterations: Infinity,
                        direction: isReversed ? 'reverse' : 'normal'
                    });
                });
                
                marquee.classList.add('js-anim-active');
            } catch (err) {
                console.warn('Kinetic Marquee JS engine failed, delegating to CSS engine.');
            }
        }

        if (!globalObserver && 'IntersectionObserver' in window) {
            globalObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const target = entry.target;
                    const targetGroups = target.querySelectorAll('.kh-mq-marquee-group');
                    
                    if (entry.isIntersecting) {
                        if (target._kh_mq_manuallyPaused) return;
                        target.classList.remove('is-paused-by-js');
                        if (target.classList.contains('js-anim-active')) {
                            targetGroups.forEach(g => { if (g._kh_mq_anim) g._kh_mq_anim.play(); });
                        }
                        updateIndicatorState(target);
                    } else {
                        target.classList.add('is-paused-by-js');
                        if (target.classList.contains('js-anim-active')) {
                            targetGroups.forEach(g => { if (g._kh_mq_anim) g._kh_mq_anim.pause(); });
                        }
                        updateIndicatorState(target);
                    }
                });
            }, { rootMargin: '100px 0px', threshold: 0 });
        }
        if (globalObserver) globalObserver.observe(marquee);

        if (isTouchDevice && marquee.classList.contains('is-pause-hover')) {
            marquee.addEventListener('click', (e) => {
                // Skip pause logic if clicking on a link - let navigation happen
                if (e.target.closest('a')) return;
                
                marquee.classList.toggle('is-paused-by-touch');
                const paused = marquee.classList.contains('is-paused-by-touch');
                marquee._kh_mq_manuallyPaused = paused;
                if (marquee.classList.contains('js-anim-active')) {
                    groups.forEach(g => { if (g._kh_mq_anim) paused ? g._kh_mq_anim.pause() : g._kh_mq_anim.play(); });
                }
                updateIndicatorState(marquee);
            }, { signal });
        }

        if (!prefersReducedMotion) {
            const isPauseHover = marquee.classList.contains('is-pause-hover');
            const isSlowHover = marquee.classList.contains('is-slow-hover');

            const applySlow = () => {
                if (marquee.classList.contains('js-anim-active')) {
                    groups.forEach(group => { if (group._kh_mq_anim) group._kh_mq_anim.playbackRate = 0.3; });
                }
                marquee.classList.add('is-slow-by-js');
                updateIndicatorState(marquee);
            };
            const removeSlow = () => {
                if (marquee.classList.contains('js-anim-active')) {
                    groups.forEach(group => { if (group._kh_mq_anim) group._kh_mq_anim.playbackRate = 1; });
                }
                marquee.classList.remove('is-slow-by-js');
                updateIndicatorState(marquee);
            };
            const applyPause = () => {
                marquee._kh_mq_manuallyPaused = true;
                marquee.classList.add('is-paused-by-js');
                if (marquee.classList.contains('js-anim-active')) {
                    groups.forEach(group => { if (group._kh_mq_anim) group._kh_mq_anim.pause(); });
                }
                updateIndicatorState(marquee);
            };
            const removePause = () => {
                marquee._kh_mq_manuallyPaused = false;
                marquee.classList.remove('is-paused-by-js');
                if (marquee.classList.contains('js-anim-active')) {
                    groups.forEach(group => { if (group._kh_mq_anim) group._kh_mq_anim.play(); });
                }
                updateIndicatorState(marquee);
            };

            if (isSlowHover) {
                marquee.addEventListener('pointerenter', () => { if (!isTouchDevice) applySlow(); }, { passive: true, signal });
                marquee.addEventListener('pointerleave', () => { if (!isTouchDevice) removeSlow(); }, { passive: true, signal });
                marquee.addEventListener('focusin', applySlow, { passive: true, signal });
                marquee.addEventListener('focusout', removeSlow, { passive: true, signal });
            }

            if (isPauseHover) {
                marquee.addEventListener('pointerenter', () => { if (!isTouchDevice) applyPause(); }, { passive: true, signal });
                marquee.addEventListener('pointerleave', () => { if (!isTouchDevice) removePause(); }, { passive: true, signal });
                marquee.addEventListener('focusin', applyPause, { passive: true, signal });
                marquee.addEventListener('focusout', removePause, { passive: true, signal });
            }
        }

        marquee._kh_mq_progressEnabled = marquee.dataset.progressRail === 'true';
        marquee._kh_mq_indicatorEnabled = marquee.dataset.interactionIndicator === 'true';
        marquee._kh_mq_centerHighlightEnabled = marquee.dataset.activeCenterHighlight === 'true';
        marquee._kh_mq_originalCount = parseInt(marquee.dataset.originalCount || '0', 10) || 0;
        marquee._kh_mq_progressCount = parseInt(marquee.dataset.progressCount || '0', 10) || 0;

        marquee._kh_mq_progressSegments = marquee.querySelectorAll('.kh-mq-progress-segment');
        marquee._kh_mq_indicator = marquee.querySelector('.kh-mq-interaction-indicator');
        marquee._kh_mq_items = marquee.querySelectorAll('.kh-mq-marquee-item');

        marquee._kh_mq_lastSampleTime = 0;
        marquee._kh_mq_activeOriginIndex = -1;
        marquee._kh_mq_rafId = null;

        updateIndicatorState(marquee);
        updateAddonState(marquee, true);

        if (!prefersReducedMotion && (marquee._kh_mq_progressEnabled || marquee._kh_mq_centerHighlightEnabled)) {
            startAddonLoop(marquee);
        }
    };

    const getOriginIndex = (item) => {
        const raw = item.getAttribute('data-kh-mq-origin-index') || item.dataset.khMqOriginIndex || '0';
        const parsed = parseInt(raw, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const getProgressIndex = (marquee, originIndex) => {
        const progressCount = marquee._kh_mq_progressCount || 0;
        const originalCount = marquee._kh_mq_originalCount || 0;
        if (!progressCount || !originalCount) return 0;
        if (progressCount === originalCount) return originIndex % progressCount;
        return Math.min(progressCount - 1, Math.floor((originIndex / originalCount) * progressCount));
    };

    const clearCenterHighlight = (marquee) => {
        if (!marquee._kh_mq_items || !marquee._kh_mq_items.length) return;
        marquee._kh_mq_items.forEach((item) => item.classList.remove('is-center-active'));
    };

    const updateProgressRail = (marquee, originIndex) => {
        if (!marquee._kh_mq_progressEnabled || !marquee._kh_mq_progressSegments || !marquee._kh_mq_progressSegments.length) return;
        const nextIndex = getProgressIndex(marquee, originIndex);
        marquee._kh_mq_progressSegments.forEach((segment, index) => {
            if (index === nextIndex) { segment.classList.add('is-active'); } 
            else { segment.classList.remove('is-active'); }
        });
    };

    const isPausedState = (marquee) => {
        if (marquee.classList.contains('is-paused-by-js')) return true;
        if (marquee.classList.contains('is-paused-by-touch')) return true;
        return false;
    };

    const updateIndicatorState = (marquee) => {
        if (!marquee || !marquee._kh_mq_indicatorEnabled || !marquee._kh_mq_indicator) return;
        if (marquee.classList.contains('is-paused-by-js') || marquee.classList.contains('is-paused-by-touch')) {
            marquee._kh_mq_indicator.dataset.state = 'paused';
            return;
        }
        if (marquee.classList.contains('is-slow-by-js')) {
            marquee._kh_mq_indicator.dataset.state = 'slow';
            return;
        }
        marquee._kh_mq_indicator.dataset.state = 'running';
    };

    const updateAddonState = (marquee, forceRun) => {
        if (!marquee || !marquee._kh_mq_items || !marquee._kh_mq_items.length) return;

        const now = performance.now();
        const sampleInterval = 120;
        if (!forceRun && (now - marquee._kh_mq_lastSampleTime) < sampleInterval) return;
        marquee._kh_mq_lastSampleTime = now;

        if (isPausedState(marquee)) return;

        const containerRect = marquee.getBoundingClientRect();
        const focusX = containerRect.left + (containerRect.width / 2);

        let closestItem = null;
        let closestDistance = Infinity;

        for (let i = 0; i < marquee._kh_mq_items.length; i++) {
            const item = marquee._kh_mq_items[i];
            const itemRect = item.getBoundingClientRect();
            if (itemRect.right < containerRect.left || itemRect.left > containerRect.right) continue;

            const itemCenter = itemRect.left + (itemRect.width / 2);
            const distance = Math.abs(focusX - itemCenter);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = item;
            }
        }

        if (!closestItem) return;

        const originIndex = getOriginIndex(closestItem);
        if (marquee._kh_mq_centerHighlightEnabled) {
            clearCenterHighlight(marquee);
            closestItem.classList.add('is-center-active');
        }

        if (originIndex !== marquee._kh_mq_activeOriginIndex) {
            marquee._kh_mq_activeOriginIndex = originIndex;
            updateProgressRail(marquee, originIndex);
        }
    };

    const addonLoop = (marquee) => {
        if (!marquee || !marquee.classList.contains('js-ready')) return;
        updateIndicatorState(marquee);
        updateAddonState(marquee, false);
        marquee._kh_mq_rafId = requestAnimationFrame(() => addonLoop(marquee));
    };

    const startAddonLoop = (marquee) => {
        if (marquee._kh_mq_rafId) return;
        marquee._kh_mq_rafId = requestAnimationFrame(() => addonLoop(marquee));
    };

    const initAll = () => {
        document.querySelectorAll('.kh-mq-marquee-container:not(.js-ready)').forEach(initMarquee);
    };

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initAll); } 
    else { initAll(); }

    let ajaxTimer;
    domObserver = new MutationObserver((mutations) => {
        let shouldInit = false;
        mutations.forEach((m) => {
            if (m.removedNodes.length) {
                m.removedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('kh-mq-marquee-container')) { cleanupBlock(node); } 
                        else if (node.querySelectorAll) { node.querySelectorAll('.kh-mq-marquee-container').forEach(cleanupBlock); }
                    }
                });
            }
            if (m.addedNodes.length) {
                m.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && ((node.classList && node.classList.contains('kh-mq-marquee-container')) || (node.querySelector && node.querySelector('.kh-mq-marquee-container')))) {
                        shouldInit = true;
                    }
                });
            }
        });
        if (shouldInit) {
            clearTimeout(ajaxTimer);
            ajaxTimer = setTimeout(initAll, 150);
        }
    });

    domObserver.observe(document.body, { childList: true, subtree: true });

})();