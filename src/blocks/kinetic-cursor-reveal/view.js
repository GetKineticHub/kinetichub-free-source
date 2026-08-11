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

        

        wrappers.forEach(wrapper => {
            wrapper.classList.add('kh-cr-ready');
            wrapper._kh_cr_isDestroyed = false;
            activeInstances.add(wrapper);
            
            

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
                
                

                floatingBox.style.transform = '';
            };

            const animate = () => {
                if (wrapper._kh_cr_isDestroyed) return;

                if (isHovering || Math.abs(globalMouse.x - pos.x) > 0.1 || Math.abs(globalMouse.y - pos.y) > 0.1) {
                    
                    const diffX = globalMouse.x - pos.x;
                    const diffY = globalMouse.y - pos.y;
                    
                    pos.x += diffX * lerpAmount;
                    pos.y += diffY * lerpAmount;

                    

                    const targetX = pos.x;
                    const targetY = pos.y;

                    // Page coordinate of the box's containing-block origin. 'over' moves the
                    // box to document.body, so its containing block is the initial one and the
                    // origin is the document origin. 'under' leaves it an absolute child of the
                    // relatively positioned wrapper, so the origin is the wrapper's PADDING box
                    // (clientLeft/clientTop add the border widths that getBoundingClientRect,
                    // which reports the border box, includes). Everything below stays in page
                    // space for both modes; the origin is subtracted only at the transform write.
                    let originX = 0;
                    let originY = 0;

                    

                    const finalX = targetX + offsetX;
                    const finalY = targetY + offsetY;

                    // Viewport clamp (use clientWidth/clientHeight + scroll offset, not
                    // scrollWidth/scrollHeight, which grows to include any overflow the
                    // box itself is causing and stops clamping anything useful)
                    const boxW = floatingBox.offsetWidth || 350;
                    const boxH = floatingBox.offsetHeight || 400;

                    // rotate() is the last function in the transform below, so it spins the
                    // box around its own centre and the painted axis-aligned box is larger
                    // than the layout box. Clamping the layout half-extents let about half
                    // of that extra envelope past the viewport edge and grew scrollWidth.
                    // Derive the envelope from the layout size and the angle we are about to
                    // write, so the clamp never has to read back a transformed rect.
                    const rotationRad = rotation * Math.PI / 180;
                    const absCos = Math.abs(Math.cos(rotationRad));
                    const absSin = Math.abs(Math.sin(rotationRad));
                    const halfW = ((boxW * absCos) + (boxH * absSin)) / 2;
                    const halfH = ((boxW * absSin) + (boxH * absCos)) / 2;

                    const viewW = document.documentElement.clientWidth;
                    const viewH = document.documentElement.clientHeight;
                    const minX = window.scrollX + halfW;
                    const maxX = window.scrollX + viewW - halfW;
                    const minY = window.scrollY + halfH;
                    const maxY = window.scrollY + viewH - halfH;

                    // Envelope wider/taller than the viewport: centre it rather than let the
                    // bounds invert and pin the box hard against one edge.
                    const clampedX = minX > maxX
                        ? window.scrollX + (viewW / 2)
                        : Math.max(minX, Math.min(finalX, maxX));
                    const clampedY = minY > maxY
                        ? window.scrollY + (viewH / 2)
                        : Math.max(minY, Math.min(finalY, maxY));

                    // Page space -> containing-block space. originX/originY are 0 for 'over',
                    // so this is arithmetically unchanged there.
                    const transformX = clampedX - originX;
                    const transformY = clampedY - originY;

                    floatingBox.style.transform = `translate3d(${transformX}px, ${transformY}px, 0) translate(-50%, -50%) rotate(${rotation}deg)`;

                    
                    
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