/**
 * Kinetic Cursor Reveal - Frontend Physics Engine
 * Version: 1.0.0
 */
(function() {
    'use strict';

    let globalMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let isMouseTracking = false;
    let pointerRafId = null;
    let globalPointerController = null;
    let domObserver = null;
    const activeInstances = new Set();

    const isVideo = (url) => {
        return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);
    };

    const cleanupBlock = (wrapper) => {
        wrapper._kh_cr_isDestroyed = true;

        if (wrapper._kh_cr_animFrameId) {
            cancelAnimationFrame(wrapper._kh_cr_animFrameId);
            wrapper._kh_cr_animFrameId = null;
        }

        /* <fs_premium_only> */
        if (wrapper._kh_cr_entranceObserver) {
            wrapper._kh_cr_entranceObserver.disconnect();
            wrapper._kh_cr_entranceObserver = null;
        }
        /* </fs_premium_only> */

        // Pause any active videos before DOM restore
        if (wrapper._kh_cr_floatingBox) {
            wrapper._kh_cr_floatingBox.querySelectorAll('video').forEach(v => v.pause());
        }

        if (wrapper._kh_cr_floatingBox && wrapper._kh_cr_floatingBox.parentNode) {
            if (wrapper._kh_cr_floatingBox.parentNode !== wrapper) {
                wrapper.appendChild(wrapper._kh_cr_floatingBox);
            }
        }
        
        wrapper.classList.remove('kh-cr-ready');
        activeInstances.delete(wrapper);

        if (activeInstances.size === 0) {
            if (globalPointerController) {
                globalPointerController.abort();
                globalPointerController = null;
                isMouseTracking = false;
            }
            if (pointerRafId) {
                cancelAnimationFrame(pointerRafId);
                pointerRafId = null;
            }
        }
    };

    const initCursorReveals = () => {
        const wrappers = document.querySelectorAll('.kh-cr-wrapper:not(.is-editor-preview):not(.kh-cr-ready)');
        if (!wrappers.length) return;

        const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!isTouchDevice && !isMouseTracking && !prefersReducedMotion) {
            globalPointerController = new AbortController();
            window.addEventListener('pointermove', (e) => {
                if (!pointerRafId) {
                    pointerRafId = requestAnimationFrame(() => {
                        globalMouse.x = e.pageX;
                        globalMouse.y = e.pageY;
                        pointerRafId = null;
                    });
                }
            }, { passive: true, signal: globalPointerController.signal });
            isMouseTracking = true;
        }

        /* <fs_premium_only> */
        const initEntrance = (wrapper) => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('kh-cr-animated');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.25 });
            if (wrapper.hasAttribute('data-entrance')) observer.observe(wrapper);
            wrapper._kh_cr_entranceObserver = observer;
        };
        /* </fs_premium_only> */

        wrappers.forEach(wrapper => {
            wrapper.classList.add('kh-cr-ready');
            wrapper._kh_cr_isDestroyed = false;
            activeInstances.add(wrapper);
            
            /* <fs_premium_only> */
            initEntrance(wrapper);
            /* </fs_premium_only> */

            const blockId = wrapper.dataset.blockid;
            const floatingBox = document.querySelector(`.kh-cr-floating-box-${blockId}`);
            if (!floatingBox) return;

            wrapper._kh_cr_floatingBox = floatingBox;

            const items = wrapper.querySelectorAll('.kh-cr-item');
            const layer1 = floatingBox.querySelector('.kh-cr-layer-1');
            const layer2 = floatingBox.querySelector('.kh-cr-layer-2');
            const closeBtn = floatingBox.querySelector('.kh-cr-close-btn');

            // FREE defaults
            let lerpAmount = 0.08;
            let offsetX = 0;
            let offsetY = 0;
            let enableTilt = false;
            let enableMagnetic = false;
            let innerParallax = false;
            let mediaLayer = 'over';
            let mobileAction = 'tap';

            /* <fs_premium_only> */
            lerpAmount = parseFloat(wrapper.dataset.lerp) || 0.08;
            offsetX = parseInt(wrapper.dataset.offx) || 0;
            offsetY = parseInt(wrapper.dataset.offy) || 0;
            enableTilt = wrapper.dataset.tilt === 'true';
            enableMagnetic = wrapper.dataset.magnetic === 'true';
            innerParallax = wrapper.dataset.innerParallax === 'true';
            mediaLayer = wrapper.dataset.layer || 'over';
            mobileAction = prefersReducedMotion ? 'always' : (wrapper.dataset.mobileAction || 'tap');
            if (prefersReducedMotion) wrapper.dataset.mobileAction = 'always';
            /* </fs_premium_only> */

            /* <fs_premium_only> */
            if ((isTouchDevice || prefersReducedMotion) && (mobileAction === 'hide' || mobileAction === 'always')) {
                if (floatingBox.parentNode !== wrapper) {
                    wrapper.appendChild(floatingBox);
                }
                floatingBox.style.display = 'none';
                return;
            }
            /* </fs_premium_only> */

            if (mediaLayer === 'over') {
                document.body.appendChild(floatingBox);
            }
            
            floatingBox.setAttribute('data-mobile-action', mobileAction);

            let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            let rotation = 0;
            let isHovering = false;
            let activeLayer = 1;
            wrapper._kh_cr_animFrameId = null;
            let hoveredItem = null;

            const renderMediaToLayer = (url, layer) => {
                layer.textContent = ''; 
                if (!url) return;

                if (isVideo(url)) {
                    const video = document.createElement('video');
                    video.src = url;
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    layer.appendChild(video);
                } else {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = 'Reveal Media';
                    layer.appendChild(img);
                }
            };

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    if (hoveredItem) {
                        hoveredItem.dataset.tapped = 'false'; 
                        endReveal(hoveredItem);
                    }
                });
            }

            items.forEach(item => {
                // Keyboard navigation for accessibility
                item.addEventListener('keydown', (e) => {
                    if (wrapper._kh_cr_isDestroyed) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const link = item.querySelector('a.kh-cr-link-overlay');
                        if (link) {
                            link.click();
                        }
                    }
                });

                item.addEventListener('focusin', () => {
                    if (wrapper._kh_cr_isDestroyed) return;
                    const rect = item.getBoundingClientRect();
                    globalMouse.x = rect.left + window.scrollX + (rect.width / 2);
                    globalMouse.y = rect.top + window.scrollY + (rect.height / 2);
                    triggerReveal(item);
                });
                
                item.addEventListener('focusout', () => {
                    if (!wrapper._kh_cr_isDestroyed) endReveal(item);
                });

                item.addEventListener('pointerenter', () => {
                    if (isTouchDevice || wrapper._kh_cr_isDestroyed) return; 
                    triggerReveal(item);
                });

                item.addEventListener('pointerleave', () => {
                    if (isTouchDevice || wrapper._kh_cr_isDestroyed) return;
                    endReveal(item);
                });

                if (isTouchDevice && mobileAction === 'tap') {
                    const link = item.querySelector('a.kh-cr-link-overlay');
                    const handleTapLogic = (e) => {
                        if (wrapper._kh_cr_isDestroyed) return;
                        if (item.dataset.tapped !== 'true') {
                            e.preventDefault(); 
                            e.stopImmediatePropagation(); 
                            
                            items.forEach(el => {
                                if (el !== item) el.dataset.tapped = 'false';
                            });
                            
                            if (hoveredItem && hoveredItem !== item) endReveal(hoveredItem);
                            
                            item.dataset.tapped = 'true';
                            triggerReveal(item);
                        }
                    };

                    if (link) link.addEventListener('click', handleTapLogic);
                    else item.addEventListener('click', handleTapLogic);
                }
            });

            const triggerReveal = (item) => {
                if (wrapper._kh_cr_isDestroyed) return;
                hoveredItem = item;
                item.classList.add('is-magnetic-active'); 
                
                if (!isHovering && !isTouchDevice) {
                    pos.x = globalMouse.x;
                    pos.y = globalMouse.y;
                }

                const newMediaUrl = item.dataset.media;
                
                if (newMediaUrl) {
                    const nextLayer = activeLayer === 1 ? layer2 : layer1;
                    const currentLayer = activeLayer === 1 ? layer1 : layer2;
                    
                    renderMediaToLayer(newMediaUrl, nextLayer);
                    nextLayer.classList.add('is-visible');
                    currentLayer.classList.remove('is-visible');
                    
                    setTimeout(() => {
                        if (!wrapper._kh_cr_isDestroyed && !currentLayer.classList.contains('is-visible')) {
                            currentLayer.textContent = ''; 
                        }
                    }, 500);

                    activeLayer = activeLayer === 1 ? 2 : 1;
                }
                
                isHovering = true;
                floatingBox.classList.add('is-active');
                
                if (!wrapper._kh_cr_animFrameId && !isTouchDevice) animate(); 
            };

            const endReveal = (item) => {
                if (wrapper._kh_cr_isDestroyed) return;
                isHovering = false;
                hoveredItem = null;
                floatingBox.classList.remove('is-active');
                
                // Pause active videos
                const currentLayer = activeLayer === 1 ? layer1 : layer2;
                const activeVideo = currentLayer.querySelector('video');
                if (activeVideo) {
                    activeVideo.pause();
                }
                
                item.classList.remove('is-magnetic-active'); 
                item.dataset.tapped = 'false'; 
                
                /* <fs_premium_only> */
                const titleWrapper = item.querySelector('.kh-cr-title-wrapper');
                if (titleWrapper && enableMagnetic) titleWrapper.style.transform = `translate3d(0, 0, 0)`;
                /* </fs_premium_only> */

                floatingBox.style.transform = '';
            };

            const animate = () => {
                if (wrapper._kh_cr_isDestroyed) return;

                if (isHovering || Math.abs(globalMouse.x - pos.x) > 0.1 || Math.abs(globalMouse.y - pos.y) > 0.1) {
                    
                    const diffX = globalMouse.x - pos.x;
                    const diffY = globalMouse.y - pos.y;
                    
                    pos.x += diffX * lerpAmount;
                    pos.y += diffY * lerpAmount;

                    /* <fs_premium_only> */
                    if (enableTilt) {
                        rotation = Math.min(Math.max(diffX * 0.12, -12), 12);
                    }
                    /* </fs_premium_only> */

                    let targetX = pos.x;
                    let targetY = pos.y;

                    /* <fs_premium_only> */
                    if (mediaLayer === 'under') {
                        const rect = wrapper.getBoundingClientRect();
                        targetX = pos.x - (rect.left + window.scrollX);
                        targetY = pos.y - (rect.top + window.scrollY);
                    }
                    /* </fs_premium_only> */

                    const finalX = targetX + offsetX;
                    const finalY = targetY + offsetY;

                    // Viewport clamp
                    const boxW = floatingBox.offsetWidth || 350;
                    const boxH = floatingBox.offsetHeight || 400;
                    const maxX = (document.documentElement.scrollWidth) - (boxW / 2);
                    const maxY = (document.documentElement.scrollHeight) - (boxH / 2);
                    const clampedX = Math.max(boxW / 2, Math.min(finalX, maxX));
                    const clampedY = Math.max(boxH / 2, Math.min(finalY, maxY));

                    floatingBox.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0) translate(-50%, -50%) rotate(${rotation}deg)`;

                    /* <fs_premium_only> */
                    if (innerParallax) {
                        const innerX = diffX * -0.6;
                        const innerY = diffY * -0.6;
                        const currentLayer = activeLayer === 1 ? layer1 : layer2;
                        const mediaTarget = currentLayer.querySelector('img, video');
                        if (mediaTarget) mediaTarget.style.transform = `translate3d(${innerX}px, ${innerY}px, 0) scale(1.15)`;
                    }

                    if (enableMagnetic && hoveredItem) {
                        const titleWrapper = hoveredItem.querySelector('.kh-cr-title-wrapper');
                        if (titleWrapper) {
                            const rect = hoveredItem.getBoundingClientRect();
                            const centerX = rect.left + window.scrollX + (rect.width / 2);
                            const centerY = rect.top + window.scrollY + (rect.height / 2);
                            
                            const magnetStrength = 0.08;
                            const moveX = (globalMouse.x - centerX) * magnetStrength;
                            const moveY = (globalMouse.y - centerY) * magnetStrength;
                            
                            titleWrapper.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
                        }
                    }
                    /* </fs_premium_only> */
                    
                    wrapper._kh_cr_animFrameId = requestAnimationFrame(animate);
                } else {
                    cancelAnimationFrame(wrapper._kh_cr_animFrameId);
                    wrapper._kh_cr_animFrameId = null;
                }
            };
        });
    };

    let ajaxTimer;

    const ensureDomObserver = () => {
        if (domObserver) return;
        domObserver = new MutationObserver((mutations) => {
            let shouldInit = false;
            
            mutations.forEach(m => {
                if (m.removedNodes.length) {
                    m.removedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.classList && node.classList.contains('kh-cr-wrapper')) {
                                cleanupBlock(node);
                            } else if (node.querySelectorAll) {
                                node.querySelectorAll('.kh-cr-wrapper').forEach(cleanupBlock);
                            }
                        }
                    });
                }

                if (m.addedNodes.length) {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (node.classList?.contains('kh-cr-wrapper') || node.querySelector?.('.kh-cr-wrapper'))) {
                            shouldInit = true;
                        }
                    });
                }
            });

            if (shouldInit) {
                clearTimeout(ajaxTimer);
                ajaxTimer = setTimeout(initCursorReveals, 150);
            }
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
    };

    const initCursorRevealsAndObserve = () => {
        initCursorReveals();
        ensureDomObserver();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCursorRevealsAndObserve);
    } else {
        initCursorRevealsAndObserve();
    }

})();