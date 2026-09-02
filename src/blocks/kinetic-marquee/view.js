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

    /* ----------------------------------------------------------------------
     * Full-width bleed.
     *
     * Gutenberg "Full Width" has to escape whatever the theme wrapped the block
     * in. Percentage math can only ever fill the parent, so the stylesheet's
     * layers 1-2 stop at the nearest constrained container. This reads the real
     * geometry once per alignfull instance and writes it back as custom
     * properties on that instance - no global body/html mutation, no polling,
     * no permanent rAF.
     *
     * The width is document.documentElement.clientWidth: the layout viewport
     * excluding a classic scrollbar. Placing the inline-start edge at viewport 0
     * and the end edge at clientWidth puts the block exactly on the edge of the
     * scrollable area, so it cannot grow documentElement.scrollWidth. 100vw
     * would include the scrollbar and is precisely what must not be used here.
     *
     * The offset is derived from the PARENT's content-box edge, never from the
     * block's own rect: the parent's box is unaffected by the child's margins, so
     * the measurement stays correct however many times it re-runs.
     * -------------------------------------------------------------------- */
    const bleedInstances = new Set();
    let bleedObserver = null;
    let bleedTimer = null;

    const measureBleed = (marquee) => {
        const parent = marquee.parentElement;
        if (!parent) return;

        const viewportWidth = document.documentElement.clientWidth;
        if (!viewportWidth) return;

        // Flex/grid/table parents size their children themselves; a breakout margin
        // there is meaningless at best and disruptive at worst, so those stay on the
        // stylesheet's percentage layers.
        const parentStyle = window.getComputedStyle(parent);
        if (/flex|grid|table/.test(parentStyle.display)) return;

        const parentRect = parent.getBoundingClientRect();
        const isRtl = window.getComputedStyle(marquee).direction === 'rtl';

        let startGap;
        if (isRtl) {
            const borderEnd = parseFloat(parentStyle.borderRightWidth) || 0;
            const padEnd = parseFloat(parentStyle.paddingRight) || 0;
            startGap = viewportWidth - (parentRect.right - borderEnd - padEnd);
        } else {
            const borderStart = parseFloat(parentStyle.borderLeftWidth) || 0;
            const padStart = parseFloat(parentStyle.paddingLeft) || 0;
            startGap = parentRect.left + borderStart + padStart;
        }

        const nextWidth = viewportWidth + 'px';
        const nextStart = (-startGap) + 'px';

        // Write only on change, so re-measuring can never feed a ResizeObserver loop.
        if (marquee._kh_mq_bleedW === nextWidth && marquee._kh_mq_bleedS === nextStart) return;
        marquee._kh_mq_bleedW = nextWidth;
        marquee._kh_mq_bleedS = nextStart;

        marquee.style.setProperty('--kh-mq-bleed-w', nextWidth);
        marquee.style.setProperty('--kh-mq-bleed-s', nextStart);
        marquee.classList.add('kh-mq-bleed');
    };

    const remeasureAllBleed = () => {
        clearTimeout(bleedTimer);
        bleedTimer = setTimeout(() => {
            bleedInstances.forEach(measureBleed);
        }, 120);
    };

    const initBleed = (marquee) => {
        if (!marquee.classList.contains('alignfull')) return;
        bleedInstances.add(marquee);

        // One shared observer on the root element for every instance. It covers window
        // resize and zoom, and - unlike the resize event - also fires when a vertical
        // scrollbar appears or disappears and clientWidth genuinely changes.
        if (!bleedObserver && 'ResizeObserver' in window) {
            bleedObserver = new ResizeObserver(remeasureAllBleed);
            bleedObserver.observe(document.documentElement);
        }

        measureBleed(marquee);
    };

    const teardownBleed = (marquee) => {
        if (!bleedInstances.has(marquee)) return;
        bleedInstances.delete(marquee);

        marquee.classList.remove('kh-mq-bleed');
        marquee.style.removeProperty('--kh-mq-bleed-w');
        marquee.style.removeProperty('--kh-mq-bleed-s');
        marquee._kh_mq_bleedW = null;
        marquee._kh_mq_bleedS = null;

        if (bleedInstances.size === 0) {
            clearTimeout(bleedTimer);
            bleedTimer = null;
            if (bleedObserver) {
                bleedObserver.disconnect();
                bleedObserver = null;
            }
        }
    };

    /* ----------------------------------------------------------------------
     * Loop-seam geometry.
     *
     * Each group is animated by translateX(-100%), i.e. by ITS OWN current
     * border-box width, so the seam only lands correctly while both groups
     * measure the same. An item's width is its image's width - style.scss gives
     * the image height:100%/width:auto and the editor stores no intrinsic
     * dimensions - so an item has no settled width until its image has loaded,
     * and every deferred image that arrives later relays out the track under a
     * running animation. That is the intermittent jump between images.
     *
     * The fix decouples layout from loading instead of forcing loads. One
     * intrinsic ratio is resolved per DISTINCT origin index and written to every
     * clone that shares it as `aspect-ratio: auto W / H`. The two-value form is
     * exactly the mechanism width/height attributes use: with a definite height
     * and width:auto, a replaced element takes height x ratio, whether or not it
     * has loaded, and the natural ratio takes over once it does - to the same
     * value. So both groups reach identical, final widths before anything moves,
     * and every clone keeps whatever loading policy render.php gave it.
     * -------------------------------------------------------------------- */

    // The persistent motion control owns the 'user' pause reason and nothing else. It
    // must not also feed the hover/focus reasons: a keyboard user has to keep focus on
    // the button to operate it, so a focus reason created by the button itself would
    // leave the marquee paused after Resume and make the control look broken.
    const isMotionControl = (node) => !!(node && node.closest && node.closest('.kh-mq-pause-toggle'));

    // The single owner of "this instance has no automatic motion". Reduced motion and
    // Auto Motion off are different reasons for the same fact, and every motion-only
    // initialisation below is gated on the fact rather than on either reason. A
    // predicate rather than a stored field: nothing to initialise, nothing to clear in
    // cleanupBlock, and no way for it to drift out of step with the markup. kh-mq-static
    // is server-rendered, so it is already on the element before this ever runs.
    const hasNoAutoMotion = (marquee) => prefersReducedMotion
        || !!(marquee && marquee.classList && marquee.classList.contains('kh-mq-static'));

    // Only reached when a resource fires neither load nor error (a stalled host).
    // Matches FALLBACK_TIMEOUT in the Video Modal rather than inventing a constant.
    const GEOMETRY_SETTLE_DEADLINE = 3000;

    const applyOriginRatio = (imgs, naturalW, naturalH) => {
        if (!(naturalW > 0) || !(naturalH > 0)) return;
        const ratio = `auto ${naturalW} / ${naturalH}`;
        imgs.forEach((img) => { img.style.aspectRatio = ratio; });
    };

    // Broken resource: hide every copy at once, so the two groups stay symmetric
    // now instead of diverging as each clone fails on its own schedule. Same result
    // the per-image error handler in initMarquee produces, applied up front.
    const hideOriginCopies = (imgs) => {
        imgs.forEach((img) => { img.style.display = 'none'; });
    };

    const stabilizeGeometry = (marquee, myGen, onReady) => {
        const byOrigin = new Map();

        marquee.querySelectorAll('.kh-mq-marquee-item').forEach((item) => {
            const img = item.querySelector('img');
            if (!img) return;
            const key = item.getAttribute('data-kh-mq-origin-index') || '0';
            let entry = byOrigin.get(key);
            if (!entry) {
                entry = { src: img.src, imgs: [] };
                byOrigin.set(key, entry);
            }
            entry.imgs.push(img);
        });

        // Origin indices still waiting on a resource. An entry leaves this set exactly
        // once, by going terminal, and motion is only released when the set is empty.
        const pending = new Set();
        let settled = false;

        // Declared here, not at the setTimeout below, and initialised rather than left
        // bare. finish() is reachable SYNCHRONOUSLY from the pending.size === 0 path -
        // i.e. before the deadline is ever armed - so a binding introduced at the
        // setTimeout would still be in its temporal dead zone when finish() read it.
        // As a `let ... = null` it is readable from this point onward, and on that
        // synchronous path it correctly reads null: no timer was armed, so there is
        // none to clear.
        let localTimer = null;

        // A generation is invalidated by teardown as well as by the next init, so this
        // is the one question every asynchronous terminal path has to ask. The two
        // listeners below are the only ones in this file not bound to the instance
        // AbortController - they cannot be, because a detached probe outlives the
        // element's controller - so they are exactly the callbacks that can arrive
        // after a cleanup, into a generation that no longer owns anything here.
        const owns = () => marquee._kh_mq_gen === myGen;

        const finish = () => {
            if (settled) return;
            if (!owns()) return;
            settled = true;
            // Clear the element's timer slot only while this invocation still owns that
            // exact handle. A newer generation may already have stored its own timer
            // there, and clearing it would strip that generation of its bounded release
            // and leave the marquee gated forever.
            if (localTimer && marquee._kh_mq_geometryTimer === localTimer) {
                clearTimeout(localTimer);
                marquee._kh_mq_geometryTimer = null;
            }
            onReady();
        };

        // The only writer of track geometry. entry.resolved makes each origin index
        // terminal on first settle, so a load or error that arrives after the deadline
        // released motion is ignored outright and can never resize a clone mid-flight.
        // The ownership test sits ahead of that flag deliberately: a stale generation
        // must not even mark an entry resolved, because entry.imgs are live DOM nodes
        // the CURRENT generation is still measuring.
        const resolveOrigin = (entry, apply) => {
            if (entry.resolved) return;
            if (!owns()) return;
            entry.resolved = true;
            apply();
            pending.delete(entry);
            if (pending.size === 0) finish();
        };

        byOrigin.forEach((entry) => {
            const first = entry.imgs[0];

            // Settled already - an eager head item that has arrived, or a warm cache.
            // Read it straight off the element: no request, nothing to wait for.
            if (first.complete) {
                entry.resolved = true;
                if (first.naturalWidth > 0) {
                    applyOriginRatio(entry.imgs, first.naturalWidth, first.naturalHeight);
                } else {
                    hideOriginCopies(entry.imgs);
                }
                return;
            }
            if (!entry.src) {
                entry.resolved = true;
                return;
            }

            pending.add(entry);

            // An eager element is already fetching, so measure THAT request rather than
            // starting a second one. A lazy clone parked far outside the viewport may
            // never load on its own, so those - and only those - get one detached probe,
            // and at most one per DISTINCT origin index rather than one per clone. The
            // probe is never inserted into the document, so it is never laid out and
            // never rasterised for painting. Whether the clones that share its URL then
            // reuse the response is normal browser request/cache dedup, not something
            // this script controls or can promise.
            const source = first.getAttribute('loading') === 'lazy' ? new Image() : first;

            source.addEventListener('load', () => {
                resolveOrigin(entry, () => applyOriginRatio(entry.imgs, source.naturalWidth, source.naturalHeight));
            }, { once: true });
            source.addEventListener('error', () => {
                resolveOrigin(entry, () => hideOriginCopies(entry.imgs));
            }, { once: true });

            if (source !== first) source.src = entry.src;
        });

        if (pending.size === 0) {
            finish();
            return;
        }

        localTimer = setTimeout(() => {
            // A deadline that outlives its generation must do nothing at all: hiding
            // images here would blank copies the current generation is measuring, and
            // is exactly the path a marquee removed without a cleanup still reaches.
            if (!owns()) return;

            // Bounded release. Anything still outstanding goes terminal HERE, before
            // motion starts, taking the same hidden/zero-width outcome the error path
            // uses - so both groups lose the identical width at the identical instant
            // and the geometry motion begins on is final. A stalled resource that
            // arrives later finds entry.resolved already set and changes nothing.
            pending.forEach((entry) => {
                entry.resolved = true;
                hideOriginCopies(entry.imgs);
            });
            pending.clear();
            finish();
        }, GEOMETRY_SETTLE_DEADLINE);
        marquee._kh_mq_geometryTimer = localTimer;
    };

    const cleanupBlock = (marquee) => {
        // Invalidate whatever generation is still settling. Teardown has to advance
        // this as well as init does: a node torn down and reinserted inside the
        // geometry window would otherwise let the old generation's load, error and
        // deadline callbacks write geometry into the new one, clear its timer, and
        // hand motion over on top of it.
        marquee._kh_mq_gen = (marquee._kh_mq_gen || 0) + 1;

        // Withdraw control readiness first, so the stylesheet parks the CSS engine for
        // the whole of teardown instead of letting the keyframes run against a marquee
        // whose control is about to stop working. Restore the button's baseline here
        // too: the reconciler bails out once the reason Sets are nulled below, so it
        // cannot be the one to reset a node that may be reinserted later.
        marquee.classList.remove('kh-mq-control-ready');
        if (marquee._kh_mq_control) {
            marquee._kh_mq_control.setAttribute('aria-pressed', 'false');
            marquee._kh_mq_control = null;
        }

        // Remove from active instances tracking
        activeInstances.delete(marquee);
        teardownBleed(marquee);

        // Unobserve this specific instance
        if (globalObserver) globalObserver.unobserve(marquee);

        // These two only ever watch marquees, so with no instances left they have
        // nothing to watch, and the next initMarquee recreates each lazily.
        //
        // domObserver is deliberately NOT torn down here. It watches document.body and
        // is the only post-load bootstrap able to notice a marquee inserted later:
        // initAll has exactly three callers and the other two are one-shot page-load
        // events. Disconnecting it at zero instances left nothing in the file capable
        // of observing the next insertion, so nothing could ever recreate it and every
        // later insertion stayed dead for the rest of the page's life. It is a
        // page-lifetime singleton.
        if (activeInstances.size === 0) {
            if (globalObserver) {
                globalObserver.disconnect();
                globalObserver = null;
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
        if (marquee._kh_mq_geometryTimer) {
            clearTimeout(marquee._kh_mq_geometryTimer);
            marquee._kh_mq_geometryTimer = null;
        }
        marquee.classList.remove('is-geometry-pending');
        
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

        // Interaction state has to leave with the instance. A detached node keeps its
        // properties and its classes, so a pause reason left behind meant the same node
        // re-inited straight into a paused animation - and, because the reconciler
        // reads the Sets rather than the classes, into one nothing could clear.
        marquee._kh_mq_pauseReasons = null;
        marquee._kh_mq_slowReasons = null;
        marquee.classList.remove('is-paused-by-js');
        marquee.classList.remove('is-paused-by-touch');
        marquee.classList.remove('is-slow-by-js');
        marquee.classList.remove('js-anim-active');

        // Published only when the CSS engine took ownership. Removing it means a
        // re-init starts from the stylesheet's own normal-duration contract again.
        marquee.style.removeProperty('--kh-mq-duration-slow');

        marquee.classList.remove('js-ready');
    };

    const initMarquee = (marquee) => {
        if (marquee.classList.contains('js-ready')) return;
        marquee.classList.add('js-ready');
        
        // Add to active instances tracking
        activeInstances.add(marquee);
        initBleed(marquee);

        // Monotonic, per element, advanced by teardown too. Everything asynchronous
        // started below captures this value and checks it before touching the element.
        marquee._kh_mq_gen = (marquee._kh_mq_gen || 0) + 1;
        const myGen = marquee._kh_mq_gen;

        // Independent causes, independently owned. Motion resumes when a Set is empty
        // and not before, so ending one cause can never resume motion another still
        // wants stopped. A future user-operated Pause control joins by owning a 'user'
        // reason and needs no change to the reconciler.
        marquee._kh_mq_pauseReasons = new Set();
        marquee._kh_mq_slowReasons = new Set();

        marquee._kh_mq_abortController = new AbortController();
        const { signal } = marquee._kh_mq_abortController;

        // Derived once, used by every motion-only branch in this function. The
        // reconciler reads the same predicate directly, because it is also called from
        // observers that never see this scope.
        const noAutoMotion = hasNoAutoMotion(marquee);

        /* ------------------------------------------------------------------
         * Persistent motion control.
         *
         * Bound here, before any motion is set up, because the stylesheet parks the
         * keyframes for every container that claims a control until this code proves
         * one is actually usable. That ordering is the whole no-JS contract: script
         * missing, or failing before this point, leaves a static row of logos and a
         * hidden button rather than uncontrollable motion and a dead control.
         *
         * Reduced motion is excluded outright - there is no automatic movement to
         * control, the stylesheet hides the button, and no readiness class is needed.
         * Auto Motion off is excluded for the same reason and reaches this branch
         * doubly false: render.php emits neither the class nor the button, so no
         * readiness is claimed and no nocontrol reason is taken.
         * ---------------------------------------------------------------- */
        if (!noAutoMotion && marquee.classList.contains('kh-mq-has-motion-control')) {
            const motionControl = marquee.querySelector('.kh-mq-pause-toggle');

            if (motionControl) {
                marquee._kh_mq_control = motionControl;

                motionControl.addEventListener('click', () => {
                    // Owns one reason. The reconciler stays the only writer of engine
                    // state, of the state classes and of aria-pressed - this handler
                    // touches no animation and no class.
                    const reasons = marquee._kh_mq_pauseReasons;
                    if (!reasons) return;
                    if (reasons.has('user')) reasons.delete('user'); else reasons.add('user');
                    reconcileMotionState(marquee);
                }, { signal });

                // Only now. The reason Set exists, the element was found, and the
                // handler is registered under this instance's AbortController, so the
                // class means "the control works" - strictly more than "view.js ran".
                marquee.classList.add('kh-mq-control-ready');
            } else {
                // Markup claims a control but carries none - stale cached HTML, or a
                // filter that stripped it. The stylesheet gate only parks the CSS
                // engine, and WAAPI would still move a marquee nobody could stop, so
                // take a pause reason that no interaction clears.
                marquee._kh_mq_pauseReasons.add('nocontrol');
            }
        }

        const images = marquee.querySelectorAll('img');
        images.forEach((img) => {
            img.addEventListener('error', () => { img.style.display = 'none'; }, { signal, passive: true });
        });

        const groups = marquee.querySelectorAll('.kh-mq-marquee-group');

        const startMotion = () => {
            // The generation test is the load-bearing one. cleanupBlock drops js-ready,
            // but a torn-down node can be reinserted and re-inited, which restores that
            // class - and would otherwise let a stale generation's settle start a second
            // set of animations over the live ones, unreachable by any later cleanup.
            if (marquee._kh_mq_gen !== myGen) return;
            if (!marquee.classList.contains('js-ready')) return;

            // Hoisted out of the try so the catch can publish the fallback slow
            // duration from it. The initial value is the same default the parse below
            // falls back to, so a throw before the parse still yields a sane time.
            let durationMs = 30000;

            try {
                let durStr = marquee.style.getPropertyValue('--kh-mq-duration');
                if (!durStr) durStr = window.getComputedStyle(marquee).getPropertyValue('--kh-mq-duration');

                let parsedSeconds = parseFloat((durStr || '').replace(/[^\d.]/g, ''));
                if (isNaN(parsedSeconds) || parsedSeconds <= 0) parsedSeconds = 30;
                durationMs = parsedSeconds * 1000;

                const isReversed = marquee.classList.contains('is-reversed');

                // Both groups in one synchronous step, so they become ready in the
                // same frame and share a start time.
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
                // Creation is per group, so group 1 can succeed and group 2 throw. A
                // live WAAPI animation on one group while the CSS keyframes drive the
                // other is exactly the desynchronised seam this file exists to prevent,
                // so unwind what was created and let one engine own both groups.
                groups.forEach(group => {
                    if (!group._kh_mq_anim) return;
                    // Guarded so a failing cancel cannot escape and skip the pending
                    // class removal below, which is what hands motion to the CSS engine.
                    try { group._kh_mq_anim.cancel(); } catch (cancelErr) { /* nothing left to undo */ }
                    group._kh_mq_anim = null;
                });
                marquee.classList.remove('js-anim-active');

                // The CSS keyframes now own motion, and a keyframe animation has no
                // playbackRate - only a duration. Publish the slow time as a concrete
                // value so the stylesheet needs no CSS arithmetic, and publish it only
                // here, on the path that actually needs it. --kh-mq-duration itself is
                // untouched and stays the normal-speed contract.
                marquee.style.setProperty('--kh-mq-duration-slow', (durationMs / 0.3 / 1000).toFixed(2) + 's');

                console.warn('Kinetic Marquee JS engine failed, delegating to CSS engine.');
            }

            // Unconditional, and after the try: if WAAPI threw, this hands motion
            // back to the CSS keyframes rather than leaving the marquee static.
            marquee.classList.remove('is-geometry-pending');

            // The block can be hovered, focused, tapped or scrolled out of view while
            // geometry settles. Those handlers only add and remove reasons, because
            // there was no animation to act on yet, so one reconcile applies whatever
            // accumulated - to WAAPI here, or to the CSS engine on the fallback path.
            // The addon fields are still unset at this point, so its addon verdict is
            // necessarily "not eligible"; initMarquee reconciles again once they exist.
            reconcileMotionState(marquee);
        };

        if (!noAutoMotion) {
            // Hold the CSS engine until both groups have final widths, then hand over.
            // With no automatic motion there is nothing to protect - the stylesheet
            // removes the animation outright - so nothing is gated, nothing is fetched
            // to measure, and startMotion, which is this call's terminal, never runs.
            marquee.classList.add('is-geometry-pending');
            stabilizeGeometry(marquee, myGen, startMotion);
        }

        if (!globalObserver && 'IntersectionObserver' in window) {
            globalObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const target = entry.target;

                    // Owns exactly one reason. Re-entry deletes 'offscreen' and nothing
                    // else, so it can no longer resume a marquee a hover, a focus or a
                    // tap still wants stopped - which is what the old _kh_mq_manuallyPaused
                    // veto was approximating, and getting wrong in both directions.
                    //
                    // The Set is null between teardown and re-init, and an entry queued
                    // before unobserve can still be delivered, so check before writing.
                    if (!target._kh_mq_pauseReasons) return;

                    if (entry.isIntersecting) {
                        target._kh_mq_pauseReasons.delete('offscreen');
                    } else {
                        target._kh_mq_pauseReasons.add('offscreen');
                    }
                    reconcileMotionState(target);
                });
            }, { rootMargin: '100px 0px', threshold: 0 });
        }
        if (globalObserver) globalObserver.observe(marquee);

        if (isTouchDevice && marquee.classList.contains('is-pause-hover')) {
            marquee.addEventListener('click', (e) => {
                // Skip pause logic if clicking on a link - let navigation happen. The
                // motion control joins that exclusion for the same ownership reason: a
                // button click bubbles to here too, so without it one tap on Pause
                // would toggle 'user' AND 'touch' and the marquee would stay stopped
                // after Resume. A selector guard rather than stopPropagation, so the
                // container keeps deciding what its own listener ignores.
                if (e.target.closest('a, .kh-mq-pause-toggle')) return;

                // Toggles its own reason and nothing else. is-paused-by-touch is now
                // written by the reconciler as display state for the indicator, rather
                // than being the state this handler toggles and then reads back.
                const reasons = marquee._kh_mq_pauseReasons;
                if (!reasons) return;
                if (reasons.has('touch')) reasons.delete('touch'); else reasons.add('touch');
                reconcileMotionState(marquee);
            }, { signal });
        }

        // Hover, focus and their reasons exist to modulate automatic motion. With none
        // running they would accumulate state the reconciler can only apply to engines
        // that are not there, so the whole region is skipped - the same gate reduced
        // motion already used, now stated once for both reasons.
        if (!noAutoMotion) {
            const isPauseHover = marquee.classList.contains('is-pause-hover');
            const isSlowHover = marquee.classList.contains('is-slow-hover');

            // Handlers no longer touch the engine at all - they state a reason and let
            // the one reconciler decide what that means for both engines together.
            const setReason = (kind, reason, on) => {
                const reasons = 'slow' === kind ? marquee._kh_mq_slowReasons : marquee._kh_mq_pauseReasons;
                if (!reasons) return;
                if (on) reasons.add(reason); else reasons.delete(reason);
                reconcileMotionState(marquee);
            };

            // focusout fires on the container when focus moves BETWEEN two links inside
            // it, and its relatedTarget is the incoming element. Without this test that
            // reads as "focus left", so every tab step through the track produced a
            // play() immediately followed by the next focusin's pause(). relatedTarget
            // is null when focus leaves the document entirely - that IS a departure, and
            // it clears only the focus reason, never a hover, touch or offscreen one.
            // The motion control counts as outside this region. Focus arriving on it
            // must therefore CLEAR the content focus reason rather than preserve it -
            // otherwise pressing Resume, which requires holding focus on the button,
            // would leave the marquee paused by a reason the user cannot see.
            //
            // The extra conjunct only fires when relatedTarget IS the control, so link
            // A -> link B still reads as contained and still produces no play/pause
            // thrash. That 4A contract is untouched.
            const focusLeft = (e) => !(e && e.relatedTarget && marquee.contains(e.relatedTarget) && !isMotionControl(e.relatedTarget));

            if (isSlowHover) {
                marquee.addEventListener('pointerenter', () => { if (!isTouchDevice) setReason('slow', 'hover', true); }, { passive: true, signal });
                marquee.addEventListener('pointerleave', () => { if (!isTouchDevice) setReason('slow', 'hover', false); }, { passive: true, signal });
                marquee.addEventListener('focusin', (e) => { if (!isMotionControl(e.target)) setReason('slow', 'focus', true); }, { passive: true, signal });
                marquee.addEventListener('focusout', (e) => { if (focusLeft(e)) setReason('slow', 'focus', false); }, { passive: true, signal });
            }

            if (isPauseHover) {
                marquee.addEventListener('pointerenter', () => { if (!isTouchDevice) setReason('pause', 'hover', true); }, { passive: true, signal });
                marquee.addEventListener('pointerleave', () => { if (!isTouchDevice) setReason('pause', 'hover', false); }, { passive: true, signal });
                marquee.addEventListener('focusin', (e) => { if (!isMotionControl(e.target)) setReason('pause', 'focus', true); }, { passive: true, signal });
                marquee.addEventListener('focusout', (e) => { if (focusLeft(e)) setReason('pause', 'focus', false); }, { passive: true, signal });
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

        // The one forced addon sample, and the only addon work that does not go
        // through the RAF the reconciler owns. With no automatic motion it would
        // sample once and never again: whichever logo sat at the centre on load
        // would keep is-center-active - and its scale and glow - while manual
        // scrolling carried every other logo past it. Same gate as every other
        // motion-only branch above, for the same reason.
        if (!noAutoMotion) {
            updateAddonState(marquee, true);
        }

        // startMotion may already have reconciled - synchronously, from a warm cache -
        // but the addon fields above were still unset then, so its addon verdict could
        // only be "not eligible". Reconcile once more now the instance is fully
        // described, so the loop is started or left stopped on complete information.
        reconcileMotionState(marquee);
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
        // No updateIndicatorState here any more. It derives entirely from classes the
        // reconciler owns, and the reconciler runs on every transition that could
        // change them, so a per-frame call could only ever re-apply the same value -
        // and it was the last state writer outside the single owner.
        updateAddonState(marquee, false);
        marquee._kh_mq_rafId = requestAnimationFrame(() => addonLoop(marquee));
    };

    const startAddonLoop = (marquee) => {
        if (marquee._kh_mq_rafId) return;
        marquee._kh_mq_rafId = requestAnimationFrame(() => addonLoop(marquee));
    };

    const stopAddonLoop = (marquee) => {
        if (!marquee._kh_mq_rafId) return;
        cancelAnimationFrame(marquee._kh_mq_rafId);
        marquee._kh_mq_rafId = null;
    };

    /* ----------------------------------------------------------------------
     * The single owner of motion state.
     *
     * Pause and slow each have several independent causes - a pointer, keyboard focus,
     * a tap, leaving the viewport - and every cause used to write the engine directly,
     * through one shared boolean and a class three of them wrote in common. So ending
     * one cause resumed motion another still wanted stopped: focusout cleared a live
     * hover pause, and an IntersectionObserver re-entry could clear either.
     *
     * Handlers now only state a reason. Motion resumes when a Set is empty and not
     * before, which is what makes the reasons genuinely independent rather than merely
     * ordered. Both engines are driven from the same two derived booleans here, so the
     * CSS fallback can no longer disagree with WAAPI about whether the track is paused.
     * -------------------------------------------------------------------- */
    const reconcileMotionState = (marquee) => {
        const pauseReasons = marquee._kh_mq_pauseReasons;
        const slowReasons = marquee._kh_mq_slowReasons;
        if (!pauseReasons || !slowReasons) return;

        const paused = pauseReasons.size > 0;
        const slowed = slowReasons.size > 0;

        // Engine 1: WAAPI, while it owns motion. playbackRate is set before the
        // pause/play call so a marquee that is both slowed and paused resumes at the
        // rate it should, not at the rate it happened to stop with.
        if (marquee.classList.contains('js-anim-active')) {
            marquee.querySelectorAll('.kh-mq-marquee-group').forEach((group) => {
                if (!group._kh_mq_anim) return;
                group._kh_mq_anim.playbackRate = slowed ? 0.3 : 1;
                if (paused) group._kh_mq_anim.pause(); else group._kh_mq_anim.play();
            });
        }

        // Engine 2: the CSS keyframes. These two classes are the entire fallback
        // contract - is-paused-by-js already carried animation-play-state and now
        // means "one or more pause reasons", and is-slow-by-js selects the published
        // slow duration. No second pause class competes with them.
        marquee.classList.toggle('is-paused-by-js', paused);
        marquee.classList.toggle('is-slow-by-js', slowed);

        // Display only, for the indicator stylesheet. Not read back as engine state.
        marquee.classList.toggle('is-paused-by-touch', pauseReasons.has('touch'));

        // The control reports what the USER asked for, not whether the track happens to
        // be stopped. Deriving it from pauseReasons.size would flip the button to
        // "pressed" every time a pointer crossed the marquee or it scrolled out of
        // view, which is not something the visitor did and not something Resume would
        // undo. has('user') is the only reading that matches the toggle's meaning.
        //
        // Sole runtime writer: no hover, focus, touch, IO or click handler sets this.
        if (marquee._kh_mq_control) {
            marquee._kh_mq_control.setAttribute('aria-pressed', pauseReasons.has('user') ? 'true' : 'false');
        }

        updateIndicatorState(marquee);

        // Sampling the centre item is worth nothing while nothing moves, and the loop
        // used to re-arm every frame regardless of pause or viewport. Its per-frame
        // updateIndicatorState call was already redundant: every transition routes
        // through here. The addon flags are undefined until late in initMarquee, which
        // reads as ineligible - correct, and initMarquee reconciles again once set.
        const addonEnabled = marquee._kh_mq_progressEnabled || marquee._kh_mq_centerHighlightEnabled;
        const addonEligible = !hasNoAutoMotion(marquee)
            && addonEnabled
            && marquee.classList.contains('js-ready')
            && !marquee.classList.contains('is-geometry-pending')
            && !paused;

        if (addonEligible) startAddonLoop(marquee); else stopAddonLoop(marquee);
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