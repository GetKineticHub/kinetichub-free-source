/**
 * Kinetic Magnetic Button - Frontend Physics Engine
 * Version: 1.0.0
 */

(function () {
    'use strict';

    /*
     * Button groups (a .kh-mb-group wrapper holding up to four buttons).
     *
     * Every button owns half of each gap to a neighbour. Its hitbox reaches at
     * most that half at rest, and the stylesheet keeps the hitbox at rest while
     * the button moves, so only the visible button can travel: layoutGroup()
     * limits that travel per side, so the button, grown by its hover scale and
     * moved by its hover effect, stops 1px short of the neighbour, also while
     * the two hand over from one to the other. A side with no neighbour keeps the
     * standalone 15px hitbox and 30px travel, both kept inside the viewport.
     * Where a gap is too narrow even for the hover scale, the scale is lowered
     * for that button. Standalone buttons are never measured and move exactly
     * as before.
     */
    const SIDES = ['top', 'right', 'bottom', 'left'];
    const HITBOX = 15;
    const TRAVEL = 30;
    const HOVER_SCALE = 1.05;
    // Hover effects that move the button on hover, in px, towards the side they move it to.
    const EFFECT_SHIFT = { 'lift-up': { top: 6 }, 'push-down': { bottom: 4 } };

    // Whether a button has an effect that loops for as long as it is shown (pulse, radar ring, sparkles).
    const hasLoopingEffect = (btn) => btn.classList.contains('is-pulsing') || !!btn.querySelector('.kh-mb-status-radar, .kh-mb-status-sparkles');

    // Layout position in the document, transforms excluded (a moving or entering button reads the same).
    const layoutBox = (el) => {
        let left = 0;
        let top = 0;
        for (let node = el; node; node = node.offsetParent) {
            left += node.offsetLeft;
            top += node.offsetTop;
        }
        return { left, top, width: el.offsetWidth, height: el.offsetHeight };
    };

    // Global State Manager (Singleton Pattern)
    const KineticManager = {
        instances: new Map(),
        globalMouse: { x: 0, y: 0 },
        isTracking: false,
        abortController: null,
        activeUpdateNode: null,
        viewObserver: null,
        
        mutationObserver: null,
        initTimer: null,
        groups: new Map(),
        groupObserver: null,
        // Buttons between pointerdown and the pointerup / pointercancel that ends the press.
        pressed: new Set(),
        // Without the physics (touch, reduced motion): only pauses the looping effects out of view.
        loopObserver: null,

        init() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches) {
                this.initStatic();
                return;
            }

            this.setupObservers();
            this.scanDOM();
            this.setupMutationObserver();
        },

        initStatic() {
            document.querySelectorAll('.kh-mb-button:not(.js-ready)').forEach(btn => {
                btn.classList.add('js-ready');
            });
            document.querySelectorAll('.kh-mb-wrapper:not(.is-inview)').forEach(wrapper => {
                wrapper.classList.add('is-inview');
            });

            const looping = Array.from(document.querySelectorAll('.kh-mb-button')).filter(hasLoopingEffect);
            if (looping.length > 0 && typeof window.IntersectionObserver !== 'undefined') {
                this.loopObserver = new window.IntersectionObserver((entries) => {
                    entries.forEach(entry => entry.target.classList.toggle('kh-mb-offscreen', !entry.isIntersecting));
                }, { rootMargin: '100px' });
                looping.forEach(btn => this.loopObserver.observe(btn));
            }
        },

        setupObservers() {
            if (!this.viewObserver) {
                this.viewObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const instance = this.instances.get(entry.target);
                        if (instance) {
                            instance.setInView(entry.isIntersecting);
                        }
                    });
                }, { rootMargin: '100px' });
            }

            
        },

        startTracking() {
            if (this.isTracking) return;
            this.isTracking = true;
            this.abortController = new AbortController();

            const options = { passive: true, signal: this.abortController.signal };

            document.addEventListener('pointermove', (e) => {
                this.globalMouse.x = e.clientX;
                this.globalMouse.y = e.clientY;
            }, options);

            document.addEventListener('scroll', () => {
                if (this.activeUpdateNode) {
                    const instance = this.instances.get(this.activeUpdateNode);
                    if (instance) instance.updateRect();
                }
            }, options);

            // A press ends wherever the pointer is released; only the button that was pressed eases back.
            const release = () => {
                this.pressed.forEach(instance => instance.onGlobalPointerUp());
                this.pressed.clear();
            };
            window.addEventListener('pointerup', release, options);
            window.addEventListener('pointercancel', release, options);
        },

        stopTracking() {
            if (!this.isTracking || this.instances.size > 0) return;
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
            this.isTracking = false;
        },

        scanDOM() {
            document.querySelectorAll('.kh-mb-wrapper:not(.is-inview)').forEach(wrapper => {
                
                    wrapper.classList.add('is-inview');
                
            });

            const buttons = document.querySelectorAll('.kh-mb-button:not(.js-ready)');
            if (buttons.length > 0) {
                this.startTracking();
                buttons.forEach(btn => {
                    if (!this.instances.has(btn)) {
                        this.instances.set(btn, new KineticButton(btn, this));
                    }
                });
            }
        },

        setupMutationObserver() {
            if (this.mutationObserver) return;

            this.mutationObserver = new MutationObserver(mutations => {
                let needsScan = false;

                mutations.forEach(mutation => {
                    if (mutation.removedNodes.length) {
                        mutation.removedNodes.forEach(node => {
                            if (node.nodeType !== 1) return;
                            
                            if (node.classList && node.classList.contains('kh-mb-button')) {
                                this.destroyInstance(node);
                            } else if (node.querySelectorAll) {
                                node.querySelectorAll('.kh-mb-button').forEach(btn => this.destroyInstance(btn));
                            }
                        });
                    }

                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType !== 1) return;
                            if (node.classList?.contains('kh-mb-wrapper') || node.querySelector?.('.kh-mb-wrapper')) {
                                needsScan = true;
                            }
                        });
                    }
                });

                if (needsScan) {
                    clearTimeout(this.initTimer);
                    this.initTimer = setTimeout(() => this.scanDOM(), 150);
                }
            });

            this.mutationObserver.observe(document.body, { childList: true, subtree: true });
        },

        // One observer for every group: a resize of the viewport, a wrapper or a button re-measures the groups.
        joinGroup(instance) {
            const wrapper = instance.wrapper;
            let members = this.groups.get(wrapper);

            if (!members) {
                members = new Set();
                this.groups.set(wrapper, members);
            }
            members.add(instance);

            if (typeof window.ResizeObserver === 'undefined') {
                this.layoutGroup(wrapper, members);
                return;
            }

            if (!this.groupObserver) {
                this.groupObserver = new window.ResizeObserver(() => this.layoutGroups());
                this.groupObserver.observe(document.documentElement);
            }
            if (members.size === 1) {
                this.groupObserver.observe(wrapper);
            }
            this.groupObserver.observe(instance.el);
        },

        leaveGroup(instance, wrapper) {
            const members = this.groups.get(wrapper);
            if (!members) {
                return;
            }

            members.delete(instance);
            if (this.groupObserver) {
                this.groupObserver.unobserve(instance.el);
            }

            if (members.size > 0) {
                this.layoutGroup(wrapper, members);
                return;
            }

            this.groups.delete(wrapper);
            if (this.groupObserver) {
                this.groupObserver.unobserve(wrapper);
                if (this.groups.size === 0) {
                    this.groupObserver.disconnect();
                    this.groupObserver = null;
                }
            }
        },

        layoutGroups() {
            this.groups.forEach((members, wrapper) => this.layoutGroup(wrapper, members));
        },

        // Reads every member's layout box first, then writes each member's limits: one layout pass per group.
        layoutGroup(wrapper, members) {
            // Hidden (display: none on this device): no geometry. The observer fires again once it shows.
            if (!wrapper.offsetWidth && !wrapper.offsetHeight) {
                return;
            }

            const buttons = Array.from(members);
            const boxes = buttons.map((instance) => layoutBox(instance.el));
            const viewport = document.documentElement.clientWidth;
            // The exact gap: layout boxes are whole pixels, so a measured gap can be off by one either way.
            const gap = parseFloat(window.getComputedStyle(wrapper).columnGap) || 0;

            buttons.forEach((instance, index) => instance.applyGroupLayout(boxes, index, viewport, gap));
        },

        destroyInstance(node) {
            const instance = this.instances.get(node);
            if (instance) {
                instance.destroy();
                this.instances.delete(node);
            }
            
            // Release document-level tracking when no instances remain.
            // Shared observers stay alive for the page lifetime so buttons
            // injected later (AJAX) are still detected and initialised.
            if (this.instances.size === 0) {
                this.stopTracking();
            }
        }
    };

    // Kinetic Engine Button Instance
    class KineticButton {
        constructor(element, manager) {
            this.el = element;
            this.manager = manager;
            this.contentWrap = this.el.querySelector('.kh-mb-content-wrap');
            this.wrapper = this.el.closest('.kh-mb-wrapper');
            this.abortController = new AbortController();
            
            this.config = {
                strength: parseFloat(this.el.dataset.strength || '0.3'),
                range: parseFloat(this.el.dataset.range || '60'),
                parallax: this.el.dataset.parallax === 'true',
                scale: this.el.dataset.scale === 'true'
            };

            this.state = {
                currentX: 0, currentY: 0, targetX: 0, targetY: 0,
                currentScale: 1, targetScale: 1,
                pointerInside: false, focusInside: false, inView: false,
                isAnimating: false, isDestroyed: false,
                centerX: 0, centerY: 0, width: 0
            };

            this.animFrameId = null;
            this.boundAnimate = this.animate.bind(this);
            this.stretchScope = null;
            this.resizeTimeout = null;
            this.looping = hasLoopingEffect(this.el);

            // Group members only (see layoutGroup): per-side travel limits, the hover scale, the last hitbox write.
            this.group = null;
            this.limits = null;
            this.hoverScale = HOVER_SCALE;
            this.groupStyle = '';

            this.init();
        }

        init() {
            this.el.classList.add('js-ready');
            this.manager.viewObserver.observe(this.el);
            this.setupListeners();
            

            if (this.wrapper && this.wrapper.classList.contains('kh-mb-group')) {
                this.group = this.wrapper;
                // No travel until the group has been measured (the observer does that before the first paint).
                this.limits = { top: 0, right: 0, bottom: 0, left: 0 };
                this.manager.joinGroup(this);
            }
        }

        /**
         * This button's share of its group, from every member's layout box:
         * per side, the free space to the nearest neighbour (a diagonal
         * neighbour counts along the axis where the two are further apart) and
         * to the viewport's side edges. Sets the hitbox reach, the hover scale
         * and the travel limits described at the top of this file.
         *
         * @param {Object[]} boxes    Layout box of every member of the group (see layoutBox).
         * @param {number}   index    This button's entry in boxes.
         * @param {number}   viewport Viewport width without the scrollbar.
         * @param {number}   gap      The group's CSS gap in px.
         */
        applyGroupLayout(boxes, index, viewport, gap) {
            const box = boxes[index];
            const free = { top: Infinity, right: Infinity, bottom: Infinity, left: Infinity };
            // Whole-pixel boxes: a distance within rounding of the gap is the gap.
            const exact = (distance) => (Math.abs(distance - gap) <= 1.5 ? gap : distance);

            // Half the nearest neighbour's size along each side's axis, for its hover growth.
            const neighbourHalf = { top: 0, right: 0, bottom: 0, left: 0 };

            boxes.forEach((other, position) => {
                if (position === index) {
                    return;
                }

                const dx = exact(Math.max(other.left - (box.left + box.width), box.left - (other.left + other.width)));
                const dy = exact(Math.max(other.top - (box.top + box.height), box.top - (other.top + other.height)));
                let side = other.top > box.top ? 'bottom' : 'top';
                let distance = dy;
                let size = other.height;

                if (dx >= dy) {
                    side = other.left > box.left ? 'right' : 'left';
                    distance = dx;
                    size = other.width;
                }

                if (Math.max(0, distance) < free[side]) {
                    free[side] = Math.max(0, distance);
                    neighbourHalf[side] = size / 2;
                }
            });

            // Less a pixel for rounding: reaching past the edge would make the page scroll sideways.
            const edge = { top: Infinity, right: viewport - (box.left + box.width) - 1, bottom: Infinity, left: box.left - 1 };
            const effect = EFFECT_SHIFT[this.el.dataset.effect] || {};
            const half = { top: box.height / 2, right: box.width / 2, bottom: box.height / 2, left: box.width / 2 };
            const opposite = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
            const room = {};

            /*
             * Room for the visible button: 1px short of a neighbour, up to the
             * viewport edge. A hover effect's shift is instant, so it is kept
             * free on both sides of a gap: this button's own shift towards the
             * neighbour, or the neighbour's (the same effect) towards this one
             * while this one is still easing back.
             */
            SIDES.forEach((side) => {
                const shift = Math.max(effect[side] || 0, free[side] === Infinity ? 0 : effect[opposite[side]] || 0);
                room[side] = Math.min(free[side] - 1, edge[side] - (effect[side] || 0)) - (free[side] === Infinity ? 0 : shift);
            });

            // The script scales the button and the stylesheet its fill layer by the same factor, so it grows by scale² - 1.
            let scale = this.config.scale ? HOVER_SCALE : 1;
            SIDES.forEach((side) => {
                if (this.config.scale && room[side] !== Infinity) {
                    scale = Math.min(scale, Math.sqrt(Math.max(1, 1 + (room[side] / half[side]))));
                }
            });

            /*
             * Travel and growth ease at different rates, so while two
             * neighbours hand over they can add up to the larger travel plus
             * the larger growth. Travel keeps room for whichever of the two
             * grows more (the neighbour's full hover scale, to be safe).
             */
            const growth = (scale * scale) - 1;
            const neighbourGrowth = this.config.scale ? (HOVER_SCALE * HOVER_SCALE) - 1 : 0;
            const hit = {};
            const limits = {};
            SIDES.forEach((side) => {
                const grows = Math.max(growth * half[side], neighbourGrowth * neighbourHalf[side]);
                hit[side] = Math.floor(Math.max(0, Math.min(HITBOX, free[side] / 2, edge[side])) * 100) / 100;
                limits[side] = Math.max(0, Math.min(TRAVEL, room[side] - grows));
            });

            this.limits = limits;
            this.hoverScale = scale;

            const written = `${hit.top},${hit.right},${hit.bottom},${hit.left},${scale}`;
            if (written === this.groupStyle) {
                return;
            }
            this.groupStyle = written;

            this.el.style.setProperty('--kh-mb-hit-t', `${hit.top}px`);
            this.el.style.setProperty('--kh-mb-hit-r', `${hit.right}px`);
            this.el.style.setProperty('--kh-mb-hit-b', `${hit.bottom}px`);
            this.el.style.setProperty('--kh-mb-hit-l', `${hit.left}px`);
            if (this.config.scale && scale < HOVER_SCALE) {
                this.el.style.setProperty('--kh-mb-fx-scale', `${scale}`);
            } else {
                this.el.style.removeProperty('--kh-mb-fx-scale');
            }
        }

        

        setupListeners() {
            const options = { passive: true, signal: this.abortController.signal };

            this.el.addEventListener('pointerenter', () => {
                this.state.pointerInside = true;
                if (this.config.scale) this.state.targetScale = this.hoverScale;
                
                this.updateRect();
                
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    if (this.state.pointerInside) this.updateRect();
                }, 300);

                this.manager.activeUpdateNode = this.el;
                this.ensureAnimation();
            }, options);

            this.el.addEventListener('pointerleave', () => {
                this.state.pointerInside = false;
                this.state.targetX = 0;
                this.state.targetY = 0;
                this.state.targetScale = 1;
                
                clearTimeout(this.resizeTimeout);

                if (this.manager.activeUpdateNode === this.el) {
                    this.manager.activeUpdateNode = null;
                }
                this.ensureAnimation();
            }, options);

            this.el.addEventListener('pointerdown', () => {
                this.state.targetScale = 0.93;
                this.manager.pressed.add(this);
                this.ensureAnimation();
            }, options);

            this.el.addEventListener('focusin', () => {
                this.state.focusInside = true;
                if (this.config.scale) this.state.targetScale = this.hoverScale;
                this.state.targetX = 0;
                this.state.targetY = 0;
                this.ensureAnimation();
            }, { signal: this.abortController.signal });

            this.el.addEventListener('focusout', () => {
                this.state.focusInside = false;
                this.state.targetScale = 1;
                this.ensureAnimation();
            }, { signal: this.abortController.signal });
        }

        updateRect() {
            if (this.state.isDestroyed) return;
            const rect = this.el.getBoundingClientRect();
            this.state.centerX = rect.left + (rect.width / 2);
            this.state.centerY = rect.top + (rect.height / 2);
            this.state.width = rect.width;
        }

        setInView(value) {
            this.state.inView = value;
            // Pauses the looping effects (pulse, radar ring, sparkles) while out of view; see the stylesheet.
            if (this.looping) {
                this.el.classList.toggle('kh-mb-offscreen', !value);
            }
            if (value && (this.state.pointerInside || this.state.isAnimating)) {
                this.ensureAnimation();
            }
        }

        onGlobalPointerUp() {
            this.state.targetScale = (this.state.pointerInside && this.config.scale) ? this.hoverScale : 1;
            this.ensureAnimation();
        }

        ensureAnimation() {
            if (this.state.isDestroyed) return;
            if (!this.state.isAnimating && this.state.inView) {
                this.state.isAnimating = true;
                this.el.classList.add('kh-mb-magnetic-active');
                // A group member takes its first step with the next frame, as the neighbour it takes over from
                // eases back: stepping now would put it one step ahead, past the room layoutGroup() left it.
                if (this.group) {
                    this.animFrameId = window.requestAnimationFrame(this.boundAnimate);
                } else {
                    this.animate();
                }
            }
        }

        animate() {
            if (this.state.isDestroyed) {
                this.animFrameId = null;
                return;
            }

            if (!this.state.inView) {
                this.stopAnimation();
                return;
            }

            if (this.state.pointerInside && !this.state.focusInside) {
                const diffX = this.manager.globalMouse.x - this.state.centerX;
                const diffY = this.manager.globalMouse.y - this.state.centerY;

                if (Math.sqrt((diffX * diffX) + (diffY * diffY)) < this.config.range + (this.state.width / 2)) {
                    if (this.limits) {
                        this.state.targetX = Math.max(-this.limits.left, Math.min(this.limits.right, diffX * this.config.strength));
                        this.state.targetY = Math.max(-this.limits.top, Math.min(this.limits.bottom, diffY * this.config.strength));
                    } else {
                        const limit = 30;
                        this.state.targetX = Math.max(-limit, Math.min(limit, diffX * this.config.strength));
                        this.state.targetY = Math.max(-limit, Math.min(limit, diffY * this.config.strength));
                    }
                } else {
                    this.state.targetX = 0;
                    this.state.targetY = 0;
                }
            }

            this.state.currentX += (this.state.targetX - this.state.currentX) * 0.15;
            this.state.currentY += (this.state.targetY - this.state.currentY) * 0.15;
            this.state.currentScale += (this.state.targetScale - this.state.currentScale) * 0.25;

            const settled =
                Math.abs(this.state.targetX - this.state.currentX) <= 0.05 &&
                Math.abs(this.state.targetY - this.state.currentY) <= 0.05 &&
                Math.abs(this.state.targetScale - this.state.currentScale) <= 0.005;

            // Only the pull follows the pointer frame by frame. Anything else (keyboard focus, a
            // release, leaving) has a fixed target, so the loop ends once the button reaches it.
            const tracking = this.state.pointerInside && !this.state.focusInside;

            if (!settled || tracking) {
                this.el.style.setProperty('--kh-js-x', `${this.state.currentX}px`);
                this.el.style.setProperty('--kh-js-y', `${this.state.currentY}px`);
                this.el.style.setProperty('--kh-js-scale', this.state.currentScale);

                if (this.config.parallax && this.contentWrap) {
                    this.contentWrap.style.setProperty('--kh-js-px', `${0.3 * this.state.currentX}px`);
                    this.contentWrap.style.setProperty('--kh-js-py', `${0.3 * this.state.currentY}px`);
                }
                
                this.animFrameId = requestAnimationFrame(this.boundAnimate);
                return;
            }

            // Settled: at rest, or held where it was sent (a focused button stays scaled up) with no frames running.
            if (this.state.targetX === 0 && this.state.targetY === 0 && this.state.targetScale === 1) {
                this.resetTransform();
            } else {
                this.holdTransform();
            }
            this.stopAnimation();
        }

        holdTransform() {
            this.state.currentX = this.state.targetX;
            this.state.currentY = this.state.targetY;
            this.state.currentScale = this.state.targetScale;

            this.el.style.setProperty('--kh-js-x', `${this.state.currentX}px`);
            this.el.style.setProperty('--kh-js-y', `${this.state.currentY}px`);
            this.el.style.setProperty('--kh-js-scale', this.state.currentScale);

            if (this.config.parallax && this.contentWrap) {
                this.contentWrap.style.setProperty('--kh-js-px', `${0.3 * this.state.currentX}px`);
                this.contentWrap.style.setProperty('--kh-js-py', `${0.3 * this.state.currentY}px`);
            }
        }

        stopAnimation() {
            this.state.isAnimating = false;
            this.el.classList.remove('kh-mb-magnetic-active');
            if (this.animFrameId) {
                cancelAnimationFrame(this.animFrameId);
                this.animFrameId = null;
            }
        }

        resetTransform() {
            this.el.style.setProperty('--kh-js-x', '0px');
            this.el.style.setProperty('--kh-js-y', '0px');
            this.el.style.setProperty('--kh-js-scale', '1');
            
            if (this.contentWrap) {
                this.contentWrap.style.setProperty('--kh-js-px', '0px');
                this.contentWrap.style.setProperty('--kh-js-py', '0px');
            }
        }

        destroy() {
            this.state.isDestroyed = true;
            this.manager.pressed.delete(this);
            this.stopAnimation();
            this.resetTransform();

            if (this.group) {
                this.manager.leaveGroup(this, this.group);
                ['--kh-mb-hit-t', '--kh-mb-hit-r', '--kh-mb-hit-b', '--kh-mb-hit-l', '--kh-mb-fx-scale'].forEach((name) => this.el.style.removeProperty(name));
                this.group = null;
                this.limits = null;
            }

            clearTimeout(this.resizeTimeout);
            
            if (this.abortController) {
                this.abortController.abort();
            }
            
            if (this.manager.viewObserver) {
                this.manager.viewObserver.unobserve(this.el);
            }

            

            if (this.manager.activeUpdateNode === this.el) {
                this.manager.activeUpdateNode = null;
            }

            this.el.classList.remove('js-ready');
            
            if (this.stretchScope) {
                delete this.stretchScope._kh_mb_stretched;
                this.stretchScope.style.cursor = '';
            }

            this.wrapper = null;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => KineticManager.init());
    } else {
        KineticManager.init();
    }

})();