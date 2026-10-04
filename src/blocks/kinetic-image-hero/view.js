/**
 * Kinetic Image Hero - Frontend Motion
 *
 * Enqueued by render.php only for a hero that needs it. The stylesheet owns
 * every movement; this script does the three things CSS cannot do alone:
 *
 * - Reveal: arms a hero that is not yet on screen (its images wait in their
 *   starting state), runs the reveal once it is meaningfully in view and its
 *   images are ready, and lets go when it ends. A hero already on screen
 *   with its images painted is never hidden. The content entrance is a plain
 *   CSS animation from the first paint; the only thing done here is to hold
 *   the text of a hero the visitor has not reached yet, and release it
 *   together with the images. Text already on screen is never held.
 * - Scroll: writes --kh-ih-progress, -1 to 1, where the hero stands in the
 *   viewport (0 at its centre).
 * - Pointer: where the pointer is across the composition, -1 to 1, in two
 *   forms. Reactive Spotlight's --kh-ih-pointer-x / -y start where the
 *   pointer enters (the light fades in there) and follow it closely. Pointer
 *   Depth's --kh-ih-parallax-x / -y ride a critically damped spring: the
 *   layers ease out of rest as the pointer arrives, trail it a little, and
 *   ease home when it leaves -- never a jump, even on a quick re-entry.
 *
 * One requestAnimationFrame per hero at most, and only while there is work:
 * scroll and pointer input are stored, then consumed by that frame. Geometry
 * is measured once and cached, and measured again only after a resize or a
 * change in the page's height -- never on a pointer or scroll event. Reads
 * come before writes in every frame, and a value is written only when it
 * changed. A hero that is off screen does no work.
 *
 * Every hero is independent: its own listeners (one AbortController), its
 * own frame, its own reveal. Observers are shared and released when the last
 * hero goes; a hero removed from the page is cleaned up, and one added later
 * is picked up. Reduced motion runs nothing, and nothing is left hidden.
 */
(function () {
    'use strict';

    const SCROLL_CLASSES = ['kh-ih-motion-scroll', 'kh-ih-motion-scroll-hover'];
    const DEPTH_CLASS = 'kh-ih-addon-pointer-depth';
    const SPOTLIGHT_CLASS = 'kh-ih-addon-spotlight';
    const POINTER_CLASSES = [DEPTH_CLASS, SPOTLIGHT_CLASS];
    const REVEAL_CLASSES = ['kh-ih-reveal-fade-rise', 'kh-ih-reveal-scale', 'kh-ih-reveal-clip', 'kh-ih-reveal-blur-sharp'];
    const REVEAL_ANIMATIONS = ['kh-ih-fade-rise', 'kh-ih-scale-in', 'kh-ih-clip-in', 'kh-ih-blur-in'];
    const CONTENT_CLASSES = ['kh-ih-content-in-fade-rise', 'kh-ih-content-in-clip', 'kh-ih-content-in-blur-sharp'];
    const CONTENT_ANIMATIONS = ['kh-ih-content-rise', 'kh-ih-content-clip', 'kh-ih-content-blur'];

    // Longest reveal the stylesheet can run (1.1s, plus 0.12s per staggered
    // plane): the fallback that lets go of a reveal whose animationend never
    // arrives -- a slot hidden at this breakpoint, an animation suppressed.
    const REVEAL_FALLBACK_MS = 1100 + 2 * 120 + 300;

    // The same for the text: its longest wait (three quarters of 1.1s), three
    // 0.09s steps, and its 0.8s entrance.
    const CONTENT_FALLBACK_MS = 825 + 3 * 90 + 800 + 300;

    // The longest a reveal waits for its images before it runs anyway.
    const IMAGE_WAIT_MS = 900;

    // Pointer Depth's spring, in radians per second: a moving pointer is
    // trailed by about 2 / rate seconds, and a layer leaving rest is 90% of
    // the way to the pointer after about 3.9 / rate.
    const PARALLAX_RATE = 13;

    // Below these the spring is at rest (position, and velocity per second).
    const SETTLED = 0.0005;
    const SETTLED_VELOCITY = 0.01;

    const hasAny = (el, list) => list.some((name) => el.classList.contains(name));
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const Manager = {
        instances: new Map(),
        reduceQuery: null,
        pointerQuery: null,
        activityObserver: null,
        revealObserver: null,
        resizeObserver: null,
        mutationObserver: null,
        abortController: null,
        scanTimer: null,

        start() {
            this.reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

            // A change of either preference rebuilds every hero from scratch:
            // reduced motion switches everything off (and un-hides anything
            // armed), a new pointer type switches the pointer engine.
            const rebuild = () => {
                this.destroyAll();
                this.scan();
            };

            if (typeof this.reduceQuery.addEventListener === 'function') {
                this.reduceQuery.addEventListener('change', rebuild);
                this.pointerQuery.addEventListener('change', rebuild);
            }

            this.scan();
            this.watchDom();
        },

        scan() {
            if (this.reduceQuery.matches) {
                return;
            }

            document.querySelectorAll('.kh-ih-hero').forEach((el) => {
                if (this.instances.has(el)) {
                    return;
                }

                const hero = new ImageHero(el, this);

                if (!hero.needsWork()) {
                    return;
                }

                this.acquire();
                this.instances.set(el, hero);
                hero.init();
            });
        },

        // Shared observers and window listeners exist only while at least one
        // hero needs them.
        acquire() {
            if (this.abortController) {
                return;
            }

            this.abortController = new AbortController();
            const options = { passive: true, signal: this.abortController.signal };

            window.addEventListener('scroll', () => this.instances.forEach((hero) => hero.onScroll()), options);
            window.addEventListener('resize', () => this.instances.forEach((hero) => hero.invalidate()), options);

            // Fonts and late images above a hero move it without resizing it.
            window.addEventListener('load', () => this.instances.forEach((hero) => hero.invalidate()), options);

            this.activityObserver = new window.IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const hero = this.instances.get(entry.target);

                    if (hero) {
                        hero.setInView(entry.isIntersecting);
                    }
                });
            }, { rootMargin: '10% 0px' });

            this.revealObserver = new window.IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const hero = this.instances.get(entry.target);

                    if (hero && entry.isIntersecting) {
                        hero.onRevealVisible();
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

            if (typeof window.ResizeObserver === 'function') {
                this.resizeObserver = new window.ResizeObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.target === document.documentElement) {
                            this.instances.forEach((hero) => hero.invalidate());
                            return;
                        }

                        const hero = this.instances.get(entry.target);

                        if (hero) {
                            hero.invalidate();
                        }
                    });
                });
                this.resizeObserver.observe(document.documentElement);
            }
        },

        release() {
            if (this.instances.size > 0 || !this.abortController) {
                return;
            }

            this.abortController.abort();
            this.abortController = null;
            this.activityObserver.disconnect();
            this.activityObserver = null;
            this.revealObserver.disconnect();
            this.revealObserver = null;

            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        },

        destroy(el) {
            const hero = this.instances.get(el);

            if (!hero) {
                return;
            }

            hero.destroy();
            this.instances.delete(el);
            this.release();
        },

        destroyAll() {
            Array.from(this.instances.keys()).forEach((el) => this.destroy(el));
        },

        // Stays for the page's lifetime, like the other KineticHub blocks, so a
        // hero added later (AJAX, a page builder) is still picked up.
        watchDom() {
            if (this.mutationObserver || typeof window.MutationObserver !== 'function') {
                return;
            }

            this.mutationObserver = new window.MutationObserver((mutations) => {
                let added = false;

                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType !== 1) {
                            return;
                        }

                        if (node.classList.contains('kh-ih-hero')) {
                            this.destroy(node);
                        }

                        node.querySelectorAll('.kh-ih-hero').forEach((el) => this.destroy(el));
                    });

                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && (node.classList.contains('kh-ih-hero') || node.querySelector('.kh-ih-hero'))) {
                            added = true;
                        }
                    });
                });

                if (added) {
                    clearTimeout(this.scanTimer);
                    this.scanTimer = setTimeout(() => this.scan(), 150);
                }
            });

            this.mutationObserver.observe(document.body, { childList: true, subtree: true });
        },
    };

    class ImageHero {
        constructor(el, manager) {
            this.el = el;
            this.manager = manager;
            this.media = el.querySelector(':scope > .kh-ih-media');
            this.scroll = hasAny(el, SCROLL_CLASSES);
            this.pointer = hasAny(el, POINTER_CLASSES) && manager.pointerQuery.matches && !!this.media;
            this.depth = this.pointer && el.classList.contains(DEPTH_CLASS);
            this.spotlight = this.pointer && el.classList.contains(SPOTLIGHT_CLASS);
            this.imageReveal = hasAny(el, REVEAL_CLASSES);
            this.contentReveal = hasAny(el, CONTENT_CLASSES);
            this.reveal = (this.imageReveal || this.contentReveal) && !el.classList.contains('kh-ih-reveal-done');

            // What this hero's reveal actually waits on, decided when it is armed.
            this.armImages = false;
            this.holdContent = false;

            this.abortController = null;
            this.rafId = 0;
            this.inView = false;
            this.dirty = true;
            this.destroyed = false;
            this.lastTime = 0;

            // Page coordinates, measured once and again only when invalidated.
            this.geometry = { top: 0, height: 0, mediaLeft: 0, mediaTop: 0, mediaWidth: 1, mediaHeight: 1 };
            this.progress = null;

            this.pointerInside = false;
            this.snap = false;
            this.clientX = 0;
            this.clientY = 0;
            this.target = { x: 0, y: 0 };

            // Spotlight: eased position, and what was last written.
            this.current = { x: 0, y: 0 };
            this.written = { x: 0, y: 0 };

            // Pointer Depth: the spring's position and velocity (per second).
            this.parallax = { x: 0, y: 0 };
            this.velocity = { x: 0, y: 0 };
            this.parallaxWritten = { x: 0, y: 0 };

            this.revealTimer = 0;
            this.revealPending = 0;

            // The reveal's own listeners (image load, animationend) go the moment it ends.
            this.revealAbort = null;

            this.frame = this.frame.bind(this);
        }

        needsWork() {
            return this.scroll || this.pointer || this.reveal;
        }

        init() {
            this.abortController = new AbortController();

            if (this.scroll || this.pointer) {
                this.manager.activityObserver.observe(this.el);

                if (this.manager.resizeObserver) {
                    this.manager.resizeObserver.observe(this.el);
                }
            }

            if (this.pointer) {
                this.listenPointer();
            }

            if (this.reveal) {
                this.armReveal();
            }
        }

        /*
         * Reveal.
         */
        displayedImages() {
            return Array.from(this.el.querySelectorAll('.kh-ih-slot')).filter((slot) => window.getComputedStyle(slot).display !== 'none')
                .map((slot) => slot.querySelector('.kh-ih-img'))
                .filter(Boolean);
        }

        contentItems() {
            const content = this.el.querySelector(':scope > .kh-ih-content-layer > .kh-ih-content');

            return content ? Array.from(content.children) : [];
        }

        armReveal() {
            const rect = this.el.getBoundingClientRect();
            const onScreen = rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;

            // What the visitor may already have seen is never taken away:
            // images already painted on screen, and text on screen at all --
            // its entrance started with the first paint.
            this.armImages = this.imageReveal && !(onScreen && this.displayedImages().every((img) => img.complete));
            this.holdContent = this.contentReveal && !onScreen;

            if (!this.armImages && !this.holdContent) {
                this.revealPending = 2;
                this.finishReveal();
                return;
            }

            this.revealAbort = new AbortController();

            if (this.armImages) {
                this.el.classList.add('kh-ih-reveal-armed');
            }

            if (this.holdContent) {
                this.el.classList.add('kh-ih-content-held');
            }

            this.manager.revealObserver.observe(this.el);
        }

        onRevealVisible() {
            if (this.destroyed || !this.revealAbort || this.revealPending) {
                return;
            }

            this.manager.revealObserver.unobserve(this.el);

            // Run as the images arrive rather than over a half-loaded frame,
            // but never wait long for them.
            const waiting = this.armImages ? this.displayedImages().filter((img) => !img.complete) : [];
            const { signal } = this.revealAbort;
            let remaining = waiting.length;

            const run = () => {
                if (this.revealPending !== 1) {
                    return;
                }

                this.revealPending = 2;
                clearTimeout(this.revealTimer);
                this.runReveal();
            };

            this.revealPending = 1;

            if (!remaining) {
                run();
                return;
            }

            waiting.forEach((img) => {
                const settle = () => {
                    remaining--;

                    if (remaining <= 0) {
                        run();
                    }
                };

                img.addEventListener('load', settle, { once: true, signal });
                img.addEventListener('error', settle, { once: true, signal });
            });

            this.revealTimer = setTimeout(run, IMAGE_WAIT_MS);
        }

        runReveal() {
            if (this.destroyed) {
                return;
            }

            const { signal } = this.revealAbort;
            const items = this.holdContent ? this.contentItems() : [];
            let remaining = (this.armImages ? this.displayedImages().length : 0) + items.length;

            this.el.addEventListener('animationend', (event) => {
                // animationend bubbles: count only this hero's own slots and
                // text, and only their entrance keyframes.
                const isSlot = event.target.classList.contains('kh-ih-slot') && event.target.closest('.kh-ih-hero') === this.el;
                const isItem = items.includes(event.target);

                if (!(isSlot && REVEAL_ANIMATIONS.includes(event.animationName)) && !(isItem && CONTENT_ANIMATIONS.includes(event.animationName))) {
                    return;
                }

                remaining--;

                if (remaining <= 0) {
                    this.finishReveal();
                }
            }, { signal });

            // Armed and run swap in one step: the keyframes' starting state
            // (held through each plane's delay) is the armed state, so nothing
            // flashes between them. Held text is released in the same step,
            // and starts from its own first keyframe.
            if (this.armImages) {
                this.el.classList.add('kh-ih-reveal-run');
                this.el.classList.remove('kh-ih-reveal-armed');
            }

            this.el.classList.remove('kh-ih-content-held');

            if (remaining <= 0) {
                this.finishReveal();
                return;
            }

            this.revealTimer = setTimeout(() => this.finishReveal(), Math.max(this.armImages ? REVEAL_FALLBACK_MS : 0, this.holdContent ? CONTENT_FALLBACK_MS : 0));
        }

        finishReveal() {
            clearTimeout(this.revealTimer);
            this.revealTimer = 0;

            if (this.destroyed || this.revealPending === 3) {
                return;
            }

            this.revealPending = 3;

            if (this.revealAbort) {
                this.revealAbort.abort();
                this.revealAbort = null;
            }

            this.el.classList.remove('kh-ih-reveal-run', 'kh-ih-reveal-armed', 'kh-ih-content-held');
            this.el.classList.add('kh-ih-reveal-done');

            // A hero whose only job was the reveal has nothing left to do.
            if (!this.scroll && !this.pointer) {
                this.manager.destroy(this.el);
            }
        }

        /*
         * Scroll and pointer.
         */
        listenPointer() {
            const options = { passive: true, signal: this.abortController.signal };
            const isFine = (event) => event.pointerType === 'mouse' || event.pointerType === 'pen';

            this.el.addEventListener('pointerenter', (event) => {
                if (!isFine(event)) {
                    return;
                }

                this.pointerInside = true;
                this.clientX = event.clientX;
                this.clientY = event.clientY;

                // The spotlight starts wherever the pointer is, not from the
                // centre: it is fading in there. The layers never jump; they
                // ease out of wherever they are.
                this.snap = true;
                this.requestFrame();
            }, options);

            this.el.addEventListener('pointermove', (event) => {
                if (!this.pointerInside || !isFine(event)) {
                    return;
                }

                this.clientX = event.clientX;
                this.clientY = event.clientY;
                this.requestFrame();
            }, options);

            this.el.addEventListener('pointerleave', () => {
                if (!this.pointerInside) {
                    return;
                }

                this.pointerInside = false;
                this.requestFrame();
            }, options);
        }

        setInView(inView) {
            this.inView = inView;

            if (inView) {
                this.invalidate();
            } else if (this.rafId && !this.pointerInside) {
                window.cancelAnimationFrame(this.rafId);
                this.rafId = 0;
                this.lastTime = 0;
            }
        }

        invalidate() {
            this.dirty = true;
            this.requestFrame();
        }

        onScroll() {
            // The pointer target moves with the page even when the pointer
            // does not.
            if ((this.scroll && this.inView) || this.pointerInside) {
                this.requestFrame();
            }
        }

        requestFrame() {
            if (this.destroyed || this.rafId || (!this.inView && !this.pointerInside && !this.isSettling())) {
                return;
            }

            this.rafId = window.requestAnimationFrame(this.frame);
        }

        isSettling() {
            const away = (value, limit) => Math.abs(value) > limit;

            return this.pointer && (
                away(this.current.x, SETTLED) || away(this.current.y, SETTLED)
                || away(this.parallax.x, SETTLED) || away(this.parallax.y, SETTLED)
                || away(this.velocity.x, SETTLED_VELOCITY) || away(this.velocity.y, SETTLED_VELOCITY)
            );
        }

        measure() {
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            const rect = this.el.getBoundingClientRect();

            this.geometry.top = rect.top + scrollY;
            this.geometry.height = rect.height;

            if (this.pointer) {
                const media = this.media.getBoundingClientRect();

                this.geometry.mediaLeft = media.left + scrollX;
                this.geometry.mediaTop = media.top + scrollY;
                this.geometry.mediaWidth = media.width || 1;
                this.geometry.mediaHeight = media.height || 1;
            }

            this.dirty = false;
        }

        frame(time) {
            this.rafId = 0;

            if (this.destroyed) {
                return;
            }

            if (!this.el.isConnected) {
                this.manager.destroy(this.el);
                return;
            }

            // Reads.
            if (this.dirty) {
                this.measure();
            }

            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            const viewport = window.innerHeight;
            let again = false;

            // Writes.
            if (this.scroll) {
                const centre = this.geometry.top - scrollY + this.geometry.height / 2;
                const reach = viewport / 2 + this.geometry.height / 2;
                const progress = reach > 0 ? clamp((centre - viewport / 2) / reach, -1, 1) : 0;

                if (this.progress === null || Math.abs(progress - this.progress) > 0.0005) {
                    this.progress = progress;
                    this.el.style.setProperty('--kh-ih-progress', progress.toFixed(4));
                }
            }

            if (this.pointer) {
                if (this.pointerInside) {
                    const g = this.geometry;
                    this.target.x = clamp(((this.clientX + scrollX - g.mediaLeft) / g.mediaWidth) * 2 - 1, -1, 1);
                    this.target.y = clamp(((this.clientY + scrollY - g.mediaTop) / g.mediaHeight) * 2 - 1, -1, 1);
                } else {
                    this.target.x = 0;
                    this.target.y = 0;
                }

                // Frame-rate independent: the same feel at 60 and 120Hz.
                const elapsed = this.lastTime ? Math.min(64, time - this.lastTime) : 16.667;
                let settled = true;

                if (this.spotlight) {
                    if (this.snap) {
                        this.current.x = this.target.x;
                        this.current.y = this.target.y;
                    } else {
                        const ease = 1 - Math.pow(1 - 0.12, elapsed / 16.667);

                        this.current.x += (this.target.x - this.current.x) * ease;
                        this.current.y += (this.target.y - this.current.y) * ease;
                    }

                    settled = Math.abs(this.target.x - this.current.x) < 0.001 && Math.abs(this.target.y - this.current.y) < 0.001;

                    if (settled) {
                        this.current.x = this.target.x;
                        this.current.y = this.target.y;
                    }

                    this.writePointer();
                }

                this.snap = false;

                if (this.depth) {
                    settled = this.stepParallax(elapsed / 1000) && settled;
                    this.writeParallax();
                }

                again = !settled;
            }

            this.lastTime = again ? time : 0;

            if (again) {
                this.rafId = window.requestAnimationFrame(this.frame);
            }
        }

        /*
         * One step of Pointer Depth's critically damped spring toward the
         * target, solved exactly, so it holds at any frame rate and settles
         * without bouncing. The velocity carries over, so a pointer that
         * leaves and comes straight back turns the layers round without a
         * jolt. Returns whether the spring has come to rest on the target.
         */
        stepParallax(dt) {
            const decay = Math.exp(-PARALLAX_RATE * dt);
            let settled = true;

            ['x', 'y'].forEach((axis) => {
                const offset = this.parallax[axis] - this.target[axis];
                const velocity = this.velocity[axis];
                const drive = velocity + PARALLAX_RATE * offset;
                const nextOffset = (offset + drive * dt) * decay;
                const nextVelocity = (velocity - PARALLAX_RATE * drive * dt) * decay;

                if (Math.abs(nextOffset) < SETTLED && Math.abs(nextVelocity) < SETTLED_VELOCITY) {
                    this.parallax[axis] = this.target[axis];
                    this.velocity[axis] = 0;
                } else {
                    this.parallax[axis] = this.target[axis] + nextOffset;
                    this.velocity[axis] = nextVelocity;
                    settled = false;
                }
            });

            return settled;
        }

        writePointer() {
            this.writePair(this.current, this.written, '--kh-ih-pointer');
        }

        writeParallax() {
            this.writePair(this.parallax, this.parallaxWritten, '--kh-ih-parallax');
        }

        // A value is written only when it changed at the precision written.
        writePair(value, written, name) {
            const x = Math.round(value.x * 10000) / 10000;
            const y = Math.round(value.y * 10000) / 10000;

            if (x !== written.x) {
                this.el.style.setProperty(`${name}-x`, String(x));
                written.x = x;
            }

            if (y !== written.y) {
                this.el.style.setProperty(`${name}-y`, String(y));
                written.y = y;
            }
        }

        /*
         * Teardown: every listener, observer entry, frame and timer, and every
         * inline value and state class this instance wrote. A finished reveal
         * stays finished (kh-ih-reveal-done), so a hero re-initialised after
         * a temporary detach never replays it; an unfinished one is simply
         * shown.
         */
        destroy() {
            this.destroyed = true;

            if (this.rafId) {
                window.cancelAnimationFrame(this.rafId);
                this.rafId = 0;
            }

            clearTimeout(this.revealTimer);
            this.revealTimer = 0;

            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }

            if (this.revealAbort) {
                this.revealAbort.abort();
                this.revealAbort = null;
            }

            const { activityObserver, revealObserver, resizeObserver } = this.manager;

            if (activityObserver) {
                activityObserver.unobserve(this.el);
            }

            if (revealObserver) {
                revealObserver.unobserve(this.el);
            }

            if (resizeObserver) {
                resizeObserver.unobserve(this.el);
            }

            this.el.classList.remove('kh-ih-reveal-armed', 'kh-ih-reveal-run', 'kh-ih-content-held');
            this.el.style.removeProperty('--kh-ih-progress');
            this.el.style.removeProperty('--kh-ih-pointer-x');
            this.el.style.removeProperty('--kh-ih-pointer-y');
            this.el.style.removeProperty('--kh-ih-parallax-x');
            this.el.style.removeProperty('--kh-ih-parallax-y');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Manager.start());
    } else {
        Manager.start();
    }
})();
