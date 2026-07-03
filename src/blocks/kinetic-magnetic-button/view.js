/**
 * Kinetic Magnetic Button - Frontend Physics Engine
 * Version: 1.0.0
 */

(function () {
    'use strict';

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

            window.addEventListener('pointerup', () => {
                this.instances.forEach(instance => instance.onGlobalPointerUp());
            }, options);
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

        destroyInstance(node) {
            const instance = this.instances.get(node);
            if (instance) {
                instance.destroy();
                this.instances.delete(node);
            }
            
            // CRITICAL: Cleanup all observers when no instances remain
            if (this.instances.size === 0) {
                this.stopTracking();
                
                if (this.mutationObserver) {
                    this.mutationObserver.disconnect();
                    this.mutationObserver = null;
                }
                
                if (this.viewObserver) {
                    this.viewObserver.disconnect();
                    this.viewObserver = null;
                }
                
                
            }
        }
    };

    // Kinetic Engine Button Instance
    class KineticButton {
        constructor(element, manager) {
            this.el = element;
            this.manager = manager;
            this.contentWrap = this.el.querySelector('.kh-mb-content-wrap');
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

            this.init();
        }

        init() {
            this.el.classList.add('js-ready');
            this.manager.viewObserver.observe(this.el);
            this.setupListeners();
            
        }

        

        setupListeners() {
            const options = { passive: true, signal: this.abortController.signal };

            this.el.addEventListener('pointerenter', () => {
                this.state.pointerInside = true;
                if (this.config.scale) this.state.targetScale = 1.05;
                
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
                this.ensureAnimation();
            }, options);

            this.el.addEventListener('focusin', () => {
                this.state.focusInside = true;
                if (this.config.scale) this.state.targetScale = 1.05;
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
            if (value && (this.state.pointerInside || this.state.isAnimating)) {
                this.ensureAnimation();
            }
        }

        onGlobalPointerUp() {
            this.state.targetScale = (this.state.pointerInside && this.config.scale) ? 1.05 : 1;
            this.ensureAnimation();
        }

        ensureAnimation() {
            if (this.state.isDestroyed) return;
            if (!this.state.isAnimating && this.state.inView) {
                this.state.isAnimating = true;
                this.el.classList.add('kh-mb-magnetic-active');
                this.animate();
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
                    const limit = 30;
                    this.state.targetX = Math.max(-limit, Math.min(limit, diffX * this.config.strength));
                    this.state.targetY = Math.max(-limit, Math.min(limit, diffY * this.config.strength));
                } else {
                    this.state.targetX = 0;
                    this.state.targetY = 0;
                }
            }

            this.state.currentX += (this.state.targetX - this.state.currentX) * 0.15;
            this.state.currentY += (this.state.targetY - this.state.currentY) * 0.15;
            this.state.currentScale += (this.state.targetScale - this.state.currentScale) * 0.25;

            const shouldContinue = 
                Math.abs(this.state.targetX - this.state.currentX) > 0.05 ||
                Math.abs(this.state.targetY - this.state.currentY) > 0.05 ||
                Math.abs(this.state.targetScale - this.state.currentScale) > 0.005 ||
                this.state.pointerInside || 
                this.state.focusInside;

            if (shouldContinue) {
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

            this.resetTransform();
            this.stopAnimation();
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
            this.stopAnimation();
            this.resetTransform();
            
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
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => KineticManager.init());
    } else {
        KineticManager.init();
    }

})();