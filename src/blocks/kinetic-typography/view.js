// view.js
/**
 * Kinetic Typography - Frontend Engine
 * Version: 1.0.0
 */
(function() {
    'use strict';

    let globalObserver = null;
    const activeInstances = new Set();
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cleanupBlock = (block) => {
        if (!block) return;

        block._kh_ty_isDestroyed = true;

        if (block._kh_ty_timers) {
            block._kh_ty_timers.forEach(timer => {
                if (timer.type === 'rAF') cancelAnimationFrame(timer.id);
                if (timer.type === 'timeout') clearTimeout(timer.id);
            });
            block._kh_ty_timers = [];
        }

        if (block._kh_ty_observers) {
            block._kh_ty_observers.forEach(observer => observer.disconnect());
            block._kh_ty_observers = [];
        }

        /* <fs_premium_only> */
        if (block._kh_ty_plexus_raf) {
            cancelAnimationFrame(block._kh_ty_plexus_raf);
            block._kh_ty_plexus_raf = null;
        }

        if (block._kh_ty_resizeHandler) {
            window.removeEventListener('resize', block._kh_ty_resizeHandler);
            if (block._kh_ty_resizeTimeout) clearTimeout(block._kh_ty_resizeTimeout);
            block._kh_ty_resizeHandler = null;
        }

        if (block._kh_ty_plxMouseHandler) {
            block.removeEventListener('mousemove', block._kh_ty_plxMouseHandler);
            block._kh_ty_plxMouseHandler = null;
        }

        if (block._kh_ty_plxMouseLeaveHandler) {
            block.removeEventListener('mouseleave', block._kh_ty_plxMouseLeaveHandler);
            block._kh_ty_plxMouseLeaveHandler = null;
        }

        if (block._kh_ty_abortController) {
            block._kh_ty_abortController.abort();
            block._kh_ty_abortController = null;
        }
        /* </fs_premium_only> */

        activeInstances.delete(block);
        block.classList.remove('kh-ty-linked', 'kh-ty-active', 'kh-ty-anim-done');

        if (activeInstances.size === 0 && globalObserver) {
            globalObserver.disconnect();
            globalObserver = null;
        }
    };

    /* <fs_premium_only> */
    const doScramble = (block, element, originalChar, duration) => {
        const glyphs = 'X01-/_+<>[]{}*&$#@';
        const frames = Math.floor(duration / 16);
        let currentFrame = 0;

        if (!block._kh_ty_timers) block._kh_ty_timers = [];

        const loop = () => {
            if (block._kh_ty_isDestroyed) return;

            currentFrame++;
            element.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];

            if (currentFrame < frames) {
                const id = requestAnimationFrame(loop);
                block._kh_ty_timers.push({ type: 'rAF', id });
            } else {
                element.textContent = originalChar === ' ' ? '\u00A0' : originalChar;
            }
        };

        const initId = requestAnimationFrame(loop);
        block._kh_ty_timers.push({ type: 'rAF', id: initId });
    };

    const initPlexusEngine = (block) => {
        const canvas = block.querySelector('.kh-ty-plexus-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let blockRect = block.getBoundingClientRect();

        const updateDimensions = () => {
            const dpr = window.devicePixelRatio || 1;
            blockRect = block.getBoundingClientRect();

            canvas.width = blockRect.width * dpr;
            canvas.height = blockRect.height * dpr;
            canvas.style.width = `${blockRect.width}px`;
            canvas.style.height = `${blockRect.height}px`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        updateDimensions();

        const pDensity = parseInt(block.dataset.plxDensity, 10) || 60;
        const pSpeed = parseFloat(block.dataset.plxSpeed) || 0.5;
        const pNodeSizeBase = parseFloat(block.dataset.plxNsize) || 1.5;
        const pLineDist = parseInt(block.dataset.plxLdist, 10) || 45;
        const pNodeC = block.dataset.plxNodeC || '#10b981';
        const pLineC = block.dataset.plxLineC || '#10b981';
        const pOpacity = parseFloat(block.dataset.plxOpacity) || 0.8;
        const pCont = block.dataset.plxCont === 'true';
        const pSpread = block.dataset.plxSpread || 'inside';
        const pInteract = block.dataset.plxInteract || 'none';

        block._kh_ty_mouse = { x: null, y: null };

        if (pInteract !== 'none') {
            block._kh_ty_plxMouseHandler = (event) => {
                const rect = block.getBoundingClientRect();
                block._kh_ty_mouse.x = event.clientX - rect.left;
                block._kh_ty_mouse.y = event.clientY - rect.top;
            };

            block._kh_ty_plxMouseLeaveHandler = () => {
                block._kh_ty_mouse.x = null;
                block._kh_ty_mouse.y = null;
            };

            block.addEventListener('mousemove', block._kh_ty_plxMouseHandler, { passive: true });
            block.addEventListener('mouseleave', block._kh_ty_plxMouseLeaveHandler, { passive: true });
        }

        let particles = [];
        const spans = Array.from(block.querySelectorAll('span[aria-hidden="true"]'));

        let letterRects = spans.map(span => {
            const rect = span.getBoundingClientRect();

            return {
                left: rect.left - blockRect.left,
                top: rect.top - blockRect.top,
                right: rect.right - blockRect.left,
                bottom: rect.bottom - blockRect.top,
                width: rect.width,
                height: rect.height
            };
        }).filter(rect => rect.width > 0 && rect.height > 0);

        if (letterRects.length === 0) {
            letterRects = [{
                left: 0,
                top: 0,
                right: blockRect.width,
                bottom: blockRect.height,
                width: blockRect.width,
                height: blockRect.height
            }];
        }

        const particleCount = Math.min(pDensity, 100);

        for (let i = 0; i < particleCount; i++) {
            let bounds;
            let pX;
            let pY;

            if (pSpread === 'inside') {
                bounds = letterRects[Math.floor(Math.random() * letterRects.length)];
                pX = bounds.left + Math.random() * bounds.width;
                pY = bounds.top + Math.random() * bounds.height;
            } else {
                bounds = {
                    left: 0,
                    top: 0,
                    right: blockRect.width,
                    bottom: blockRect.height,
                    width: blockRect.width,
                    height: blockRect.height
                };
                pX = Math.random() * blockRect.width;
                pY = Math.random() * blockRect.height;
            }

            particles.push({
                x: pX,
                y: pY,
                vx: (Math.random() - 0.5) * 1.5 * pSpeed,
                vy: (Math.random() - 0.5) * 1.5 * pSpeed,
                size: Math.random() * pNodeSizeBase + (pNodeSizeBase * 0.5),
                bounds
            });
        }

        const renderPlexus = () => {
            if (block._kh_ty_isDestroyed) return;

            if (!pCont && block.dataset.isAnimating === 'false') {
                return;
            }

            ctx.clearRect(0, 0, blockRect.width, blockRect.height);
            ctx.globalAlpha = pOpacity;
            ctx.fillStyle = pNodeC;
            ctx.strokeStyle = pLineC;

            particles.forEach(particle => {
                if (pInteract !== 'none' && block._kh_ty_mouse.x !== null) {
                    const dx = particle.x - block._kh_ty_mouse.x;
                    const dy = particle.y - block._kh_ty_mouse.y;
                    const interactionRadius = 120;
                    const distSq = dx * dx + dy * dy;
                    const radiusSq = interactionRadius * interactionRadius;

                    if (distSq < radiusSq) {
                        const distance = Math.sqrt(distSq);

                        if (distance > 0) {
                            const force = (interactionRadius - distance) / interactionRadius;

                            if (pInteract === 'repel') {
                                particle.x += (dx / distance) * force * 5;
                                particle.y += (dy / distance) * force * 5;
                            } else if (pInteract === 'attract') {
                                particle.x -= (dx / distance) * force * 1.5;
                                particle.y -= (dy / distance) * force * 1.5;
                            }
                        }
                    }
                }

                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.x <= particle.bounds.left || particle.x >= particle.bounds.right) particle.vx *= -1;
                if (particle.y <= particle.bounds.top || particle.y >= particle.bounds.bottom) particle.vy *= -1;

                particle.x = Math.max(particle.bounds.left, Math.min(particle.bounds.right, particle.x));
                particle.y = Math.max(particle.bounds.top, Math.min(particle.bounds.bottom, particle.y));

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });

            const pLineDistSq = pLineDist * pLineDist;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < pLineDistSq) {
                        const distance = Math.sqrt(distSq);

                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.lineWidth = 1 - (distance / pLineDist);
                        ctx.stroke();
                    }
                }
            }

            block._kh_ty_plexus_raf = requestAnimationFrame(renderPlexus);
        };

        if (block._kh_ty_plexus_raf) {
            cancelAnimationFrame(block._kh_ty_plexus_raf);
        }

        block._kh_ty_plexus_raf = requestAnimationFrame(renderPlexus);
        canvas.style.opacity = '1';

        block._kh_ty_resizeHandler = () => {
            if (block._kh_ty_resizeTimeout) clearTimeout(block._kh_ty_resizeTimeout);

            block._kh_ty_resizeTimeout = setTimeout(() => {
                updateDimensions();

                letterRects = spans.map(span => {
                    const rect = span.getBoundingClientRect();

                    return {
                        left: rect.left - blockRect.left,
                        top: rect.top - blockRect.top,
                        right: rect.right - blockRect.left,
                        bottom: rect.bottom - blockRect.top,
                        width: rect.width,
                        height: rect.height
                    };
                }).filter(rect => rect.width > 0 && rect.height > 0);

                if (letterRects.length > 0) {
                    particles.forEach(particle => {
                        let newRect;

                        if (pSpread === 'inside') {
                            newRect = letterRects[Math.floor(Math.random() * letterRects.length)];
                        } else {
                            newRect = {
                                left: 0,
                                top: 0,
                                right: blockRect.width,
                                bottom: blockRect.height,
                                width: blockRect.width,
                                height: blockRect.height
                            };
                        }

                        particle.bounds = newRect;
                        particle.x = newRect.left + Math.random() * newRect.width;
                        particle.y = newRect.top + Math.random() * newRect.height;
                    });
                }
            }, 150);
        };

        window.addEventListener('resize', block._kh_ty_resizeHandler);
    };

    const triggerLoop = (block) => {
        if (block._kh_ty_isDestroyed) return;

        block.classList.remove('kh-ty-active');

        const loopId = setTimeout(() => {
            if (block._kh_ty_isDestroyed) return;
            startEffect(block);
        }, 150);

        if (!block._kh_ty_timers) block._kh_ty_timers = [];
        block._kh_ty_timers.push({ type: 'timeout', id: loopId });
    };
    /* </fs_premium_only> */

    const startEffect = (block) => {
        if (!block || block._kh_ty_isDestroyed) return;

        /* <fs_premium_only> */
        if (block.dataset.isAnimating === 'true' && block.dataset.trigger === 'hover') return;
        /* </fs_premium_only> */

        block.classList.remove('kh-ty-active', 'kh-ty-anim-done');
        void block.offsetWidth;
        block.classList.add('kh-ty-active');

        if (prefersReducedMotion) {
            block.dataset.isAnimating = 'false';
            block.classList.add('kh-ty-anim-done');
            return;
        }

        block.dataset.isAnimating = 'true';

        if (block._kh_ty_timers) {
            block._kh_ty_timers.forEach(timer => {
                if (timer.type === 'rAF') cancelAnimationFrame(timer.id);
                if (timer.type === 'timeout') clearTimeout(timer.id);
            });
        }

        block._kh_ty_timers = [];

        const spans = block.querySelectorAll('.kh-ty-item');
        const speed = parseFloat(block.dataset.speed) || 0.6;
        let maxDelay = 0;

        /* <fs_premium_only> */
        const isPlexusContinuous = block.dataset.animType === 'plexus' && block.dataset.plxCont === 'true';

        if (block.dataset.animType === 'plexus' && !isPlexusContinuous) {
            initPlexusEngine(block);
        } else if (block.dataset.animType === 'plexus' && isPlexusContinuous && !block._kh_ty_plexus_initialized) {
            initPlexusEngine(block);
            block._kh_ty_plexus_initialized = true;
        }

        const isInfinite = block.dataset.iterations === 'infinite';
        const allowReplayLoop = isInfinite && (block.dataset.animType === 'plexus' || block.dataset.animType === 'scramble');

        if (block.classList.contains('kh-ty-anim-scramble')) {
            spans.forEach(span => {
                const original = span.dataset.char || span.textContent;

                if (!span.dataset.char) span.dataset.char = original;
                if (original.trim() === '') return;

                let delayMs = 0;

                if (span.style.animationDelay) {
                    delayMs = parseFloat(span.style.animationDelay) * 1000;
                }

                if (delayMs > maxDelay) maxDelay = delayMs;

                const timeoutId = setTimeout(() => doScramble(block, span, original, 400), delayMs);
                block._kh_ty_timers.push({ type: 'timeout', id: timeoutId });
            });

            const finishId = setTimeout(() => {
                block.dataset.isAnimating = 'false';
                block.classList.add('kh-ty-anim-done');

                if (allowReplayLoop) {
                    triggerLoop(block);
                }
            }, maxDelay + 400 + 150);

            block._kh_ty_timers.push({ type: 'timeout', id: finishId });
            return;
        }
        /* </fs_premium_only> */

        spans.forEach(span => {
            let delayMs = 0;

            if (span.style.animationDelay) {
                delayMs = parseFloat(span.style.animationDelay) * 1000;
            }

            if (delayMs > maxDelay) maxDelay = delayMs;
        });

        const finishId = setTimeout(() => {
            block.dataset.isAnimating = 'false';
            block.classList.add('kh-ty-anim-done');

            /* <fs_premium_only> */
            if (allowReplayLoop) {
                triggerLoop(block);
            }
            /* </fs_premium_only> */
        }, maxDelay + (speed * 1000) + 150);

        block._kh_ty_timers.push({ type: 'timeout', id: finishId });
    };

    const getObserver = () => {
        if (!globalObserver) {
            const thresholds = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

            globalObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const block = entry.target;
                    const requiredThreshold = parseFloat(block.dataset.threshold) || 0.2;
                    const isVisible = entry.isIntersecting;
                    const meetsThreshold = entry.intersectionRatio >= requiredThreshold;
                    const isHugeBlock = entry.boundingClientRect.height > window.innerHeight * 0.5;
                    const isScrolledPast = entry.boundingClientRect.top <= 0;

                    /* <fs_premium_only> */
                    const triggerAlways = block.dataset.triggerAlways === 'true';
                    const isPlexusContinuous = block.dataset.animType === 'plexus' && block.dataset.plxCont === 'true';
                    /* </fs_premium_only> */

                    if (isVisible && (meetsThreshold || isHugeBlock || isScrolledPast)) {
                        if (!block.classList.contains('kh-ty-active')) {
                            /* <fs_premium_only> */
                            if (isPlexusContinuous && block._kh_ty_hasAnimated) {
                                return;
                            }

                            if (isPlexusContinuous && !block._kh_ty_hasAnimated) {
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        initPlexusEngine(block);
                                        block._kh_ty_plexus_initialized = true;
                                        startEffect(block);
                                        block._kh_ty_hasAnimated = true;
                                    });
                                });
                                return;
                            }

                            if (block.dataset.animType === 'plexus' && !isPlexusContinuous) {
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        startEffect(block);
                                        block._kh_ty_hasAnimated = true;
                                    });
                                });
                                return;
                            }
                            /* </fs_premium_only> */

                            startEffect(block);
                            block._kh_ty_hasAnimated = true;
                        }

                        /* <fs_premium_only> */
                        if (!triggerAlways) {
                            globalObserver.unobserve(block);
                        }
                        /* </fs_premium_only> */

                        /* <fs_free_only> */
                        globalObserver.unobserve(block);
                        /* </fs_free_only> */
                    }

                    /* <fs_premium_only> */
                    if (triggerAlways && !isVisible) {
                        block.classList.remove('kh-ty-active', 'kh-ty-anim-done');
                        block.dataset.isAnimating = 'false';
                        block._kh_ty_hasAnimated = false;

                        if (block._kh_ty_timers) {
                            block._kh_ty_timers.forEach(timer => {
                                if (timer.type === 'rAF') cancelAnimationFrame(timer.id);
                                if (timer.type === 'timeout') clearTimeout(timer.id);
                            });
                            block._kh_ty_timers = [];
                        }

                        if (block._kh_ty_plexus_raf) {
                            cancelAnimationFrame(block._kh_ty_plexus_raf);
                            block._kh_ty_plexus_raf = null;

                            const canvas = block.querySelector('.kh-ty-plexus-canvas');
                            if (canvas) canvas.style.opacity = '0';
                        }
                    }
                    /* </fs_premium_only> */
                });
            }, { threshold: thresholds });
        }

        return globalObserver;
    };

    const initBlock = (block) => {
        if (!block || block.classList.contains('kh-ty-linked')) return;

        block.classList.add('kh-ty-linked');

        if (!block.classList.contains('kh-ty-ready')) {
            block.classList.add('kh-ty-ready');
        }

        block._kh_ty_isDestroyed = false;
        activeInstances.add(block);

        const spans = block.querySelectorAll('.kh-ty-item');

        spans.forEach(span => {
            const delay = span.getAttribute('data-delay');

            if (delay) {
                span.style.animationDelay = delay;
            }
        });

        /* <fs_premium_only> */
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        const trigger = isMobile ? 'scroll' : (block.dataset.trigger || 'scroll');
        const isPlexusContinuous = block.dataset.animType === 'plexus' && block.dataset.plxCont === 'true';

        if (isPlexusContinuous) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    initPlexusEngine(block);
                    block._kh_ty_plexus_initialized = true;

                    setTimeout(() => {
                        if (trigger === 'scroll') {
                            startEffect(block);
                            block._kh_ty_hasAnimated = true;
                        }
                    }, 300);
                });
            });
        }

        if (trigger === 'hover') {
            block._kh_ty_abortController = new AbortController();

            const { signal } = block._kh_ty_abortController;

            const startHoverEffect = () => {
                if (isPlexusContinuous && block._kh_ty_hasAnimated) {
                    return;
                }

                startEffect(block);
                block._kh_ty_hasAnimated = true;
            };

            block.addEventListener('mouseenter', startHoverEffect, { passive: true, signal });
            block.addEventListener('focusin', startHoverEffect, { passive: true, signal });

            if (block.dataset.resetLeave === 'true') {
                const leaveLogic = () => {
                    block.classList.remove('kh-ty-active', 'kh-ty-anim-done');
                    block.dataset.isAnimating = 'false';

                    if (block._kh_ty_timers) {
                        block._kh_ty_timers.forEach(timer => {
                            if (timer.type === 'rAF') cancelAnimationFrame(timer.id);
                            if (timer.type === 'timeout') clearTimeout(timer.id);
                        });
                        block._kh_ty_timers = [];
                    }

                    const canvas = block.querySelector('.kh-ty-plexus-canvas');
                    if (canvas) canvas.style.opacity = '0';
                };

                block.addEventListener('mouseleave', leaveLogic, { passive: true, signal });
                block.addEventListener('focusout', leaveLogic, { passive: true, signal });
            }

            return;
        }
        /* </fs_premium_only> */

        getObserver().observe(block);
    };

    const initAll = () => {
        document.querySelectorAll('.kh-ty-master-typography:not(.kh-ty-linked)').forEach(initBlock);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    const safeObserveDom = () => {
        if (!('MutationObserver' in window)) return;

        let debounceTimer;

        const domObserver = new MutationObserver((mutations) => {
            let shouldInit = false;

            for (let i = 0; i < mutations.length; i++) {
                const mutation = mutations[i];

                if (mutation.removedNodes && mutation.removedNodes.length) {
                    mutation.removedNodes.forEach((node) => {
                        if (node && node.nodeType === 1) {
                            if (node.classList && node.classList.contains('kh-ty-master-typography')) {
                                cleanupBlock(node);
                            } else if (node.querySelectorAll) {
                                const elements = node.querySelectorAll('.kh-ty-master-typography');

                                for (let j = 0; j < elements.length; j++) {
                                    cleanupBlock(elements[j]);
                                }
                            }
                        }
                    });
                }

                if (mutation.addedNodes && mutation.addedNodes.length && !shouldInit) {
                    for (let k = 0; k < mutation.addedNodes.length; k++) {
                        const node = mutation.addedNodes[k];

                        if (node && node.nodeType === 1) {
                            const hasClass = node.classList && node.classList.contains('kh-ty-master-typography');
                            const hasChild = node.querySelector && node.querySelector('.kh-ty-master-typography');

                            if (hasClass || hasChild) {
                                shouldInit = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (shouldInit) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(initAll, 250);
            }
        });

        const startObserve = () => {
            if (!document.body) return;
            domObserver.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false });
        };

        startObserve();

        if (!document.body) {
            document.addEventListener('DOMContentLoaded', startObserve, { once: true });
        }
    };

    safeObserveDom();
})();