/**
 * Kinetic Split Scroll - Frontend Physics Engine
 * Version: 1.0.0
  (Global GC, Layout Caching & Anti-Zombie RAF)
 */
(function() {
    'use strict';

    const VIEWPORT_OBSERVER_MARGIN = '100px 0px';
    const FADE_UP_MARGIN = '0px 0px -10% 0px';
    /* <fs_premium_only> */
    const FOCUS_MARGIN = '-40% 0px -40% 0px';
    /* </fs_premium_only> */
    const INIT_DELAY_MS = 150;
    /* <fs_premium_only> */
    const PARALLAX_SHIFT_FACTOR = 10;
    const DOT_CLICK_OFFSET = 0.05;
    /* </fs_premium_only> */

    let isMobile = window.matchMedia('(max-width: 768px)').matches;
    let viewportHeight = window.innerHeight;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const blockGeometries = new Map();
    let globalAbortController = null; 

    // Technical Note: Centralized Garbage Collection for detached DOM nodes
    const cleanupBlock = (wrapper) => {
        wrapper._kh_ss_isDestroyed = true; 

        if (wrapper._kh_ss_animFrameId) {
            cancelAnimationFrame(wrapper._kh_ss_animFrameId);
            wrapper._kh_ss_animFrameId = null;
        }
        if (wrapper._kh_ss_observers) {
            wrapper._kh_ss_observers.forEach(obs => obs.disconnect());
            wrapper._kh_ss_observers = [];
        }
                if (wrapper._kh_ss_cleanupCallbacks) {
            wrapper._kh_ss_cleanupCallbacks.forEach((callback) => callback());
            wrapper._kh_ss_cleanupCallbacks = [];
        }

        if (wrapper._kh_ss_RemoveMobileMediaClones) {
            wrapper._kh_ss_RemoveMobileMediaClones();
            wrapper._kh_ss_RemoveMobileMediaClones = null;
        }
        blockGeometries.delete(wrapper);
        wrapper.classList.remove('js-ready');

        // Technical Note: Release global window listeners if no split-scroll blocks remain on the page
        if (blockGeometries.size === 0 && globalAbortController) {
            globalAbortController.abort();
            globalAbortController = null;
        }
    };

    const initBlock = (wrapper) => {
        if (wrapper.classList.contains('js-ready')) return;
        wrapper.classList.add('js-ready'); 

        wrapper._kh_ss_observers = [];
        wrapper._kh_ss_isDestroyed = false;
        wrapper._kh_ss_cleanupCallbacks = [];

        const scrollCol = wrapper.querySelector('.kh-ss-scroll-col');
        if (!scrollCol) return;

        const pinnedCol = wrapper.querySelector('.kh-ss-pinned-col');
        const mediaInner = wrapper.querySelector('.kh-ss-media-inner');
        const mediaLayers = wrapper.querySelectorAll('.kh-ss-media-layer');
        const progressFill = wrapper.querySelector('.kh-ss-progress-fill');
        /* <fs_premium_only> */
        const percentageText = wrapper.querySelector('.kh-ss-percentage');
        const dots = wrapper.querySelectorAll('.kh-ss-dot');
        /* </fs_premium_only> */
        
        const textNodes = Array.from(scrollCol.children);
        const enableStickyMobile = wrapper.dataset.stickyMobile === 'true';

                const removeMobileMediaClones = () => {
            Array.from(scrollCol.children)
                .filter((child) => child.classList && child.classList.contains('kh-ss-mobile-media-clone'))
                .forEach((child) => child.remove());
        };

        const syncMobileInlineMedia = () => {
            removeMobileMediaClones();

            const isInlineMobile = window.matchMedia('(max-width: 768px)').matches;

            if (!isInlineMobile || enableStickyMobile || !mediaLayers.length) {
                wrapper.classList.remove('has-mobile-inline-media');

                if (pinnedCol) {
                    pinnedCol.style.removeProperty('display');
                }

                return;
            }

            const contentItems = Array.from(scrollCol.children)
                .filter((child) => !child.classList.contains('kh-ss-mobile-media-clone'));

            const isSpacerBlock = (child) => {
                return child.classList && child.classList.contains('wp-block-spacer');
            };

            const hasSectionContent = (child) => {
                const hasReadableContent = child.textContent && child.textContent.trim().length > 0;
                const hasInteractiveOrMedia = !!child.querySelector('img, video, picture, button, a, .wp-block-button');
                return hasReadableContent || hasInteractiveOrMedia;
            };

            const sectionGroups = [];
            let currentGroup = [];

            contentItems.forEach((child) => {
                if (isSpacerBlock(child)) {
                    if (currentGroup.length) {
                        sectionGroups.push(currentGroup);
                        currentGroup = [];
                    }

                    return;
                }

                if (hasSectionContent(child)) {
                    currentGroup.push(child);
                }
            });

            if (currentGroup.length) {
                sectionGroups.push(currentGroup);
            }

            const fallbackItems = contentItems.filter((child) => {
                return !isSpacerBlock(child) && hasSectionContent(child);
            });

            const groups = sectionGroups.length ? sectionGroups : fallbackItems.map((item) => [item]);

            if (!groups.length) {
                wrapper.classList.remove('has-mobile-inline-media');

                if (pinnedCol) {
                    pinnedCol.style.removeProperty('display');
                }

                return;
            }

            wrapper.classList.add('has-mobile-inline-media');

            if (pinnedCol) {
                pinnedCol.style.display = 'none';
            }


            const mobileDirection = getComputedStyle(wrapper).getPropertyValue('--kh-ss-mob-dir').trim();
            const insertBeforeTarget = mobileDirection !== 'column-reverse';

            mediaLayers.forEach((layer, index) => {
                const sourceMedia = layer.querySelector('img, video');

                if (!sourceMedia) {
                    return;
                }

                const cloneWrap = document.createElement('div');
                cloneWrap.className = 'kh-ss-mobile-media-clone';
                cloneWrap.dataset.index = String(index);

                const mediaClone = sourceMedia.cloneNode(true);

                    mediaClone.classList.add('kh-ss-mobile-media');
                    mediaClone.removeAttribute('style');
                    mediaClone.removeAttribute('width');
                    mediaClone.removeAttribute('height');

                    cloneWrap.style.cssText = [
                        'display:block',
                        'position:relative',
                        'width:100%',
                        'max-width:100%',
                        'height:auto',
                        'margin:24px auto 32px',
                        'padding:0',
                        'opacity:1',
                        'z-index:1',
                        'overflow:visible',
                        'border-radius:20px',
                        'box-sizing:border-box',
                        'background:transparent',
                        'clip-path:none',
                        'transform:none'
                    ].join(';');

                    mediaClone.style.cssText = [
                        'display:block',
                        'position:static',
                        'width:100%',
                        'max-width:100%',
                        'height:auto',
                        'max-height:none',
                        'margin:0 auto',
                        'object-fit:contain',
                        'object-position:center center',
                        'transform:none'
                    ].join(';');

                    if (mediaClone.tagName === 'VIDEO') {
                        mediaClone.muted = true;
                        mediaClone.loop = true;
                        mediaClone.playsInline = true;
                        mediaClone.autoplay = true;
                        mediaClone.controls = false;
                    }

                cloneWrap.appendChild(mediaClone);

                const targetIndex = Math.min(index, groups.length - 1);
                const targetGroup = groups[targetIndex];

                if (!targetGroup || !targetGroup.length) {
                    return;
                }

                const firstTarget = targetGroup[0];
                const lastTarget = targetGroup[targetGroup.length - 1];

                if (insertBeforeTarget) {
                    scrollCol.insertBefore(cloneWrap, firstTarget);
                } else {
                    lastTarget.insertAdjacentElement('afterend', cloneWrap);
                }
            });
        };

        wrapper._kh_ss_RemoveMobileMediaClones = removeMobileMediaClones;

        const mobileInlineMediaResizeHandler = () => {
            window.requestAnimationFrame(syncMobileInlineMedia);
        };

        window.addEventListener('resize', mobileInlineMediaResizeHandler, { passive: true });
        wrapper._kh_ss_cleanupCallbacks.push(() => {
            window.removeEventListener('resize', mobileInlineMediaResizeHandler);
        });

        syncMobileInlineMedia();
        
        const enableSmartSwap = scrollCol.dataset.smartswap === 'true';
        const textEffect = scrollCol.dataset.texteffect;
        const mediaCount = parseInt(scrollCol.dataset.mediacount) || 0;
        const stickyOffset = parseInt(wrapper.dataset.offset) || 0;
        
        // Smart Addons State Extraction
        /* <fs_premium_only> */
        const hasParallax = wrapper.dataset.parallax === 'true';
        const hasBgMorph = wrapper.dataset.bgMorph === 'true';
        const isDotsInteractive = wrapper.dataset.dotsInteractive === 'true';
        /* </fs_premium_only> */

        // FIX: Dynamic Geometry Recalculation (No Stale Cache when content loads late)
        const resizeObserver = new ResizeObserver(() => {
            try {
                const rect = wrapper.getBoundingClientRect();
                blockGeometries.set(wrapper, {
                    absoluteTop: window.scrollY + rect.top,
                    height: rect.height
                });
            } catch (error) {
                console.error('ResizeObserver error:', error);
            }
        });
        resizeObserver.observe(wrapper);
        wrapper._kh_ss_observers.push(resizeObserver);

        /* <fs_premium_only> */
        // --- Smart Addon: Interactive Click-to-Scroll Dots ---
        if (isDotsInteractive && dots.length > 0 && !isMobile) {
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    const geometry = blockGeometries.get(wrapper);
                    if (!geometry) return;
                    // FIX: Math Safe Guard to prevent backwards jumping on short sections
                    const scrollDistance = Math.max(0, geometry.height - viewportHeight);
                    const targetScroll = geometry.absoluteTop - stickyOffset + ((index + DOT_CLICK_OFFSET) / Math.max(1, mediaCount)) * scrollDistance;
                    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                });
            });
        }
        /* </fs_premium_only> */

        // --- Fade-Up Entrance Observer (FREE feature) ---
        if (textEffect === 'fade-up' && !prefersReducedMotion) {
            const fadeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    } else {
                        entry.target.classList.remove('is-visible');
                    }
                });
            }, { rootMargin: FADE_UP_MARGIN });
            
            textNodes.forEach(node => fadeObserver.observe(node));
            wrapper._kh_ss_observers.push(fadeObserver); 
        }

        /* <fs_premium_only> */
        // --- Focus Effect Observer ---
        if (textEffect === 'focus' && !prefersReducedMotion) {
            const focusObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-focused');
                    } else {
                        entry.target.classList.remove('is-focused');
                    }
                });
            }, { rootMargin: FOCUS_MARGIN });
            
            textNodes.forEach(node => focusObserver.observe(node));
            wrapper._kh_ss_observers.push(focusObserver); 
        }
        /* </fs_premium_only> */

        let isEngineRunning = false;
        let lastActiveIndex = -1; 
        /* <fs_premium_only> */
        let lastPercentInt = -1; 
        /* </fs_premium_only> */
        let lastScrollY = -1; // FIX: CPU Drain tracking

        // Technical Note: 60FPS RAF Engine operating STRICTLY on memory-cached geometrics
        const renderLoop = () => {
            if (wrapper._kh_ss_isDestroyed) return;

            if (isMobile && !enableStickyMobile) {
                isEngineRunning = false;
                return;
            }

            // FIX: Prevent CPU Drain - Halt calculations if scroll position hasn't changed
            if (window.scrollY === lastScrollY) {
                if (isEngineRunning) wrapper._kh_ss_animFrameId = requestAnimationFrame(renderLoop);
                return;
            }
            lastScrollY = window.scrollY;

            const geometry = blockGeometries.get(wrapper);
            if (!geometry) {
                if (isEngineRunning) wrapper._kh_ss_animFrameId = requestAnimationFrame(renderLoop);
                return;
            }

            const currentTop = geometry.absoluteTop - window.scrollY;
            const scrollStart = currentTop - stickyOffset;
            
            // FIX: Division by Zero Safeguard
            const scrollDistance = Math.max(0, geometry.height - viewportHeight);
            let rawProgress = scrollDistance > 0 ? (0 - scrollStart) / scrollDistance : 1;
            const progress = Math.max(0, Math.min(1, rawProgress));

            /* <fs_premium_only> */
            // Smart Addon: Background Morphing
            if (hasBgMorph) {
                wrapper.style.setProperty('--kh-ss-progress-dec', progress.toFixed(3));
            }

            // Smart Addon: Inner Image Parallax (3D Window Effect)
            if (hasParallax && mediaInner && !prefersReducedMotion) {
                const shiftY = (progress - 0.5) * PARALLAX_SHIFT_FACTOR; 
                mediaInner.style.transform = `translate3d(0, ${shiftY}%, 0) scale(1.1)`;
            }
            /* </fs_premium_only> */

            if (progressFill) progressFill.style.transform = `scaleY(${progress})`;
            
            /* <fs_premium_only> */
            if (percentageText) {
                const percentInt = Math.round(progress * 100);
                if (percentInt !== lastPercentInt) {
                    percentageText.textContent = `${percentInt}%`;
                    lastPercentInt = percentInt;
                }
            }
            /* </fs_premium_only> */

            if (mediaCount > 1 && enableSmartSwap && !prefersReducedMotion) {
                let activeIndex = Math.floor(progress * mediaCount);
                activeIndex = Math.min(mediaCount - 1, activeIndex);

                if (activeIndex !== lastActiveIndex) {
                    mediaLayers.forEach((layer, index) => {
                        if (index === activeIndex) layer.classList.add('is-active');
                        else layer.classList.remove('is-active');
                    });
                    
                    /* <fs_premium_only> */
                    if (dots.length > 0) {
                        dots.forEach((dot, index) => {
                            if (index === activeIndex) {
                                dot.classList.add('is-active');
                                dot.setAttribute('aria-current', 'true');
                            } else {
                                dot.classList.remove('is-active');
                                dot.removeAttribute('aria-current');
                            }
                        });
                    }
                    /* </fs_premium_only> */
                    lastActiveIndex = activeIndex;
                }
            }

            if (isEngineRunning) {
                wrapper._kh_ss_animFrameId = requestAnimationFrame(renderLoop);
            }
        };

        if ('IntersectionObserver' in window) {
            const masterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (!isEngineRunning) {
                            isEngineRunning = true;
                            renderLoop(); 
                        }
                    } else {
                        isEngineRunning = false;
                        if (wrapper._kh_ss_animFrameId) {
                            cancelAnimationFrame(wrapper._kh_ss_animFrameId);
                            wrapper._kh_ss_animFrameId = null;
                        }
                    }
                });
            }, { rootMargin: VIEWPORT_OBSERVER_MARGIN, threshold: 0 });

            masterObserver.observe(wrapper);
            wrapper._kh_ss_observers.push(masterObserver); 
        } else {
            isEngineRunning = true;
            renderLoop();
        }
    };

    const initAll = () => {
        const blocks = document.querySelectorAll('.kh-ss-wrapper:not(.js-ready)');
        if (blocks.length > 0) {
            if (!globalAbortController) {
                globalAbortController = new AbortController();
                const { signal } = globalAbortController;
                
                window.addEventListener('resize', () => {
                    isMobile = window.matchMedia('(max-width: 768px)').matches;
                    viewportHeight = window.innerHeight;
                }, { passive: true, signal });
            }
            blocks.forEach(initBlock);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { setTimeout(initAll, INIT_DELAY_MS); });
    } else {
        setTimeout(initAll, INIT_DELAY_MS);
    }

    let ajaxTimer;
    const domObserver = new MutationObserver((mutations) => {
        let shouldInit = false;
        mutations.forEach(m => {
            if (m.removedNodes.length) {
                m.removedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('kh-ss-wrapper')) {
                            cleanupBlock(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('.kh-ss-wrapper').forEach(cleanupBlock);
                        }
                    }
                });
            }

            if (m.addedNodes.length) {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (node.classList?.contains('kh-ss-wrapper') || node.querySelector?.('.kh-ss-wrapper'))) {
                        shouldInit = true;
                    }
                });
            }
        });
        if (shouldInit) {
            clearTimeout(ajaxTimer);
            ajaxTimer = setTimeout(initAll, INIT_DELAY_MS);
        }
    });
    domObserver.observe(document.body, { childList: true, subtree: true });

})();