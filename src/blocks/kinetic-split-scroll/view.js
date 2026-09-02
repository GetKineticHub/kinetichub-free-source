/**
 * Kinetic Split Scroll - Frontend Physics Engine
 * Version: 1.0.0
  (Global GC, Layout Caching & Anti-Zombie RAF)
 */
(function() {
    'use strict';

    const VIEWPORT_OBSERVER_MARGIN = '100px 0px';
    // Enough steps that a clone scrolling past produces ratio changes to compare,
    // without turning an intersection observer into a scroll listener.
    const CLONE_RELEVANCE_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];
    const FADE_UP_MARGIN = '0px 0px -10% 0px';
    
    const INIT_DELAY_MS = 150;
    

    let isMobile = window.matchMedia('(max-width: 768px)').matches;
    let viewportHeight = window.innerHeight;

    // One retained query, one mutable current value. The stylesheet re-evaluates
    // prefers-reduced-motion the moment the preference changes, so a boolean captured
    // once at script start drifts out of step with the CSS that hides the motion
    // control - which left a video looping behind a button nobody could reach. Every
    // consumer below reads this variable rather than a copy taken at binding time.
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

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

        // Owns listeners bound straight onto this block's own elements. Those
        // elements survive a removal still carrying their handlers, so a node
        // taken out and put back would gain a second set on every re-init.
        // Aborting drops them all; nulling keeps a second cleanup a no-op.
        if (wrapper._kh_ss_localAbort) {
            wrapper._kh_ss_localAbort.abort();
            wrapper._kh_ss_localAbort = null;
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
        wrapper._kh_ss_localAbort = new AbortController();

        const scrollCol = wrapper.querySelector('.kh-ss-scroll-col');
        if (!scrollCol) return;

        const pinnedCol = wrapper.querySelector('.kh-ss-pinned-col');
        const mediaInner = wrapper.querySelector('.kh-ss-media-inner');
        const mediaLayers = wrapper.querySelectorAll('.kh-ss-media-layer');
        const progressFill = wrapper.querySelector('.kh-ss-progress-fill');
        
        
        const textNodes = Array.from(scrollCol.children);
        const enableStickyMobile = wrapper.dataset.stickyMobile === 'true';

        // The change listener below lives exactly as long as an instance does. With
        // every block gone there is nothing left to hear a preference change, so a
        // block initialised later reads the preference again rather than trusting the
        // value the module captured at script start. Ahead of every RM-dependent
        // decision this instance is about to make.
        prefersReducedMotion = reducedMotionQuery.matches;

        // -----------------------------------------------------------------
        // Continuous decorative motion: B5-30 video, B5-31 Ken Burns.
        //
        // One owner per instance, and it owns ONLY motion that starts by
        // itself. Smart Swap, progress, percentage, dots, the scroll engine
        // and sticky behaviour are functional state and are deliberately not
        // reachable from anything below - pausing motion is not pausing the
        // block.
        //
        // Fail-closed: nothing starts until this instance has found its
        // button and registered a handler on it. A script that never runs, or
        // cached markup whose control was stripped, therefore leaves a static
        // block rather than motion nobody can stop.
        // -----------------------------------------------------------------
        const claimsMotionControl = wrapper.classList.contains('kh-ss-has-motion-control');
        const motionControl = claimsMotionControl ? wrapper.querySelector('.kh-ss-motion-control') : null;
        const motionToggle = claimsMotionControl ? wrapper.querySelector('.kh-ss-motion-toggle') : null;
        const motionPauseLabel = motionToggle ? (motionToggle.dataset.labelPause || motionToggle.getAttribute('aria-label') || '') : '';
        const motionResumeLabel = motionToggle ? (motionToggle.dataset.labelResume || motionPauseLabel) : '';

        let motionControlReady = false;
        let userPausedMotion = false;

        // Inline-mobile clone relevance. All three live and die with this instance;
        // nothing about the current clone is shared between blocks.
        let cloneObserver = null;
        let currentCloneWrap = null;
        const cloneIntersectionRatios = new Map();

        // Strictly this block's own media. Author content in the scroll column
        // may legitimately carry its own <video> with its own controls, and this
        // control must never start or stop that. The closest() test also keeps a
        // nested block's media out of an outer block's set.
        const getInstanceVideos = () => Array.from(
            wrapper.querySelectorAll('.kh-ss-media-layer video, .kh-ss-mobile-media-clone video')
        ).filter((video) => video.closest('.kh-ss-wrapper') === wrapper);

        // Which presentation is on screen. The class is written by the mobile inline
        // sync below and is the only thing deciding whether the pinned column or the
        // inline clones are the media the reader actually sees.
        const isInlineMobilePresentation = () => wrapper.classList.contains('has-mobile-inline-media');

        // Ownership is the whole set; playable is the part of it presented right now.
        // Everything outside this subset is motion the reader cannot see, which is
        // exactly what must never be started.
        const getCurrentPlayableVideos = () => {
            if (isInlineMobilePresentation()) {
                // Fail-closed: until the relevance observer has named a clone there is
                // no current media here, so nothing is playable.
                if (!currentCloneWrap || !wrapper.contains(currentCloneWrap)) return [];

                const cloneVideo = currentCloneWrap.querySelector('video');
                return cloneVideo ? [cloneVideo] : [];
            }

            return Array.from(
                wrapper.querySelectorAll('.kh-ss-media-layer.is-active video')
            ).filter((video) => video.closest('.kh-ss-wrapper') === wrapper);
        };

        // What the button is for. A video later in the list is not motion the reader
        // is looking at, and the indicator glow is deliberately not a term here - it
        // must never be the reason a control appears.
        const hasCurrentRelevantMotion = () => {
            if (getCurrentPlayableVideos().length > 0) return true;

            

            return false;
        };

        const isMotionPaused = () => !motionControlReady || userPausedMotion || prefersReducedMotion;

        // Every term the start decision rested on, re-read at resolution. A play()
        // request outlives the state that issued it: the layer can go inactive, a
        // resize can take the clone out of the document, the instance can be torn
        // down. Any of those and this exact element must not be left running.
        const isStillPlayable = (video) => {
            if (wrapper._kh_ss_isDestroyed) return false;
            if (!wrapper.contains(video)) return false;
            if (video.closest('.kh-ss-wrapper') !== wrapper) return false;
            if (isMotionPaused()) return false;
            return getCurrentPlayableVideos().indexOf(video) !== -1;
        };

        const startPlayback = (video) => {
            const playRequest = video.play();
            if (!playRequest || typeof playRequest.then !== 'function') return;

            playRequest.then(() => {
                if (!isStillPlayable(video)) video.pause();
            }).catch(() => {
                // Autoplay policy refusal, or a pause() that interrupted this
                // request. Neither is a plugin error; neither is retried.
            });
        };

        // The button is pre-rendered by render.php as a capability and is never
        // created or destroyed here. Native hidden withdraws it from sight, pointer,
        // tab order and the accessibility tree in one move - but only because the
        // stylesheet restores display:none against this container own display:flex.
        const setControlAvailability = (relevant) => {
            if (!motionControl) return;

            if (relevant) {
                motionControl.removeAttribute('hidden');
                return;
            }

            if (motionControl.hasAttribute('hidden')) return;

            // Hiding a container that holds focus drops the caret to <body> and loses
            // the reader place in the document. Hand focus to the section first;
            // tabindex -1 keeps the wrapper reachable programmatically without adding
            // a Tab stop of its own.
            if (motionControl.contains(document.activeElement)) {
                if (!wrapper.hasAttribute('tabindex')) wrapper.setAttribute('tabindex', '-1');

                try {
                    wrapper.focus({ preventScroll: true });
                } catch (error) {
                    wrapper.focus();
                }
            }

            motionControl.setAttribute('hidden', '');
        };

        const reconcileMotion = () => {
            if (!claimsMotionControl || wrapper._kh_ss_isDestroyed) return;

            const ownedVideos = getInstanceVideos();
            const currentPlayableVideos = getCurrentPlayableVideos();
            const relevant = hasCurrentRelevantMotion();
            const paused = isMotionPaused();

            // Unconditional, and ahead of every other decision: media that is not the
            // media on screen never plays, whatever the control says.
            ownedVideos.forEach((video) => {
                if (currentPlayableVideos.indexOf(video) === -1) video.pause();
            });

            currentPlayableVideos.forEach((video) => {
                if (paused) video.pause();
                else startPlayback(video);
            });

            setControlAvailability(relevant);

            // Only while a control is actually offered. Left applied behind a hidden
            // button it would freeze the indicator glow with no way to release it -
            // the trapped-motion shape this batch exists to prevent. The intent is
            // kept in userPausedMotion, which nothing here writes.
            wrapper.classList.toggle('kh-ss-motion-paused', relevant && paused);

            if (motionToggle) {
                motionToggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
                motionToggle.setAttribute('aria-label', paused ? motionResumeLabel : motionPauseLabel);
            }
        };

        if (claimsMotionControl && motionToggle) {
            motionToggle.addEventListener('click', () => {
                // The only writer of user intent. Nothing else clears it, so a
                // pause survives hover, focus, scroll, media swaps and the mobile
                // clone rebuild.
                userPausedMotion = !userPausedMotion;
                reconcileMotion();
            }, { signal: wrapper._kh_ss_localAbort.signal });

            // Only now. The button exists and its handler is registered, so the
            // readiness class means "this control works", not "view.js ran".
            motionControlReady = true;
            wrapper.classList.add('kh-ss-motion-control-ready');
        }

        reconcileMotion();

        // Bounded to this instance. The shared assignment is idempotent across
        // instances, and each handler then reconciles only its own closure, so two
        // blocks on one page settle independently. userPausedMotion is deliberately
        // untouched: a preference changing is not the user withdrawing a pause they
        // made by hand, and it must still hold when the preference goes back off.
        const reducedMotionChangeHandler = (event) => {
            prefersReducedMotion = event.matches;
            reconcileMotion();
        };

        reducedMotionQuery.addEventListener('change', reducedMotionChangeHandler);
        wrapper._kh_ss_cleanupCallbacks.push(() => {
            reducedMotionQuery.removeEventListener('change', reducedMotionChangeHandler);
        });

                const removeMobileMediaClones = () => {
            Array.from(scrollCol.children)
                .filter((child) => child.classList && child.classList.contains('kh-ss-mobile-media-clone'))
                .forEach((child) => child.remove());
        };

        // -----------------------------------------------------------------
        // Inline-mobile clone relevance.
        //
        // Non-sticky mobile halts the scroll engine, so nothing that already
        // exists knows which clone the reader is on - progress, active index and
        // Smart Swap are all frozen in this mode. One observer per instance
        // supplies that single missing fact and nothing else: it never touches
        // playback, it names the current clone and hands back to the reconciler.
        // -----------------------------------------------------------------
        const getMobileCloneWraps = () => Array.from(
            scrollCol.querySelectorAll('.kh-ss-mobile-media-clone')
        ).filter((clone) => clone.closest('.kh-ss-wrapper') === wrapper);

        const pickCurrentCloneWrap = () => {
            const candidates = [];

            cloneIntersectionRatios.forEach((ratio, clone) => {
                if (ratio > 0 && wrapper.contains(clone)) candidates.push({ clone: clone, ratio: ratio });
            });

            if (!candidates.length) return null;

            // Adjacent clones routinely intersect together, so the one that is
            // showing has to be decided rather than assumed. Most visible first,
            // then nearest the middle of the viewport, then document order - every
            // step total, so one scroll position always names one clone.
            const viewportCentre = (window.innerHeight || 0) / 2;
            const cloneOrder = getMobileCloneWraps();

            candidates.forEach((candidate) => {
                const rect = candidate.clone.getBoundingClientRect();
                candidate.distance = Math.abs((rect.top + rect.bottom) / 2 - viewportCentre);
                candidate.index = parseInt(candidate.clone.dataset.index, 10);
                if (isNaN(candidate.index)) candidate.index = Number.MAX_SAFE_INTEGER;
                candidate.order = cloneOrder.indexOf(candidate.clone);
            });

            candidates.sort((a, b) => {
                if (Math.abs(a.ratio - b.ratio) > 0.01) return b.ratio - a.ratio;
                if (Math.abs(a.distance - b.distance) > 1) return a.distance - b.distance;
                if (a.index !== b.index) return a.index - b.index;
                return a.order - b.order;
            });

            return candidates[0].clone;
        };

        const ensureCloneObserver = () => {
            // Null, not the existing handle. Teardown has already disconnected it,
            // and returning it would let a late caller observe nodes on a dead
            // observer - reviving exactly the lifecycle cleanup just ended.
            if (wrapper._kh_ss_isDestroyed) return null;

            if (cloneObserver || !('IntersectionObserver' in window)) return cloneObserver;

            cloneObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    cloneIntersectionRatios.set(
                        entry.target,
                        entry.isIntersecting ? entry.intersectionRatio : 0
                    );
                });

                const nextCloneWrap = pickCurrentCloneWrap();
                if (nextCloneWrap === currentCloneWrap) return;

                // State only. Starting or stopping media from inside an observer
                // would make this a second playback owner; there is exactly one.
                currentCloneWrap = nextCloneWrap;
                reconcileMotion();
            }, { threshold: CLONE_RELEVANCE_THRESHOLDS });

            // Registered where instance teardown already disconnects observers.
            wrapper._kh_ss_observers.push(cloneObserver);

            return cloneObserver;
        };

        const observeMobileClones = () => {
            if (wrapper._kh_ss_isDestroyed) return;

            const observer = ensureCloneObserver();
            if (!observer) return;

            getMobileCloneWraps().forEach((clone) => observer.observe(clone));
        };

        // Pause through the reconciler, then remove. Dropping a playing clone out of
        // the document and trusting the engine to stop it is exactly the assumption
        // this refuses to make - so relevance is cleared first, while the old nodes
        // are still attached, which is what makes the one owner pause them.
        const retireMobileMediaClones = () => {
            if (currentCloneWrap) {
                currentCloneWrap = null;
                reconcileMotion();
            }

            if (cloneObserver) cloneObserver.disconnect();
            cloneIntersectionRatios.clear();

            removeMobileMediaClones();
        };

        const syncMobileInlineMedia = () => {
            // Ahead of everything: a destroyed instance rebuilds nothing, touches no
            // presentation class and leaves the pinned column exactly as teardown
            // left it. Cleanup has already removed the clones, so there is also
            // nothing left to retire.
            if (wrapper._kh_ss_isDestroyed) return;

            retireMobileMediaClones();

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
                        // Never self-starting. A clone is reconciled by the same
                        // per-instance motion owner as the media it was cloned
                        // from, so a rebuild cannot resurrect motion the user
                        // paused. Assigning false also drops the attribute.
                        mediaClone.autoplay = false;
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

            // Rebuilt clones carry no relevance at all; the observer names one on its
            // first callback and the reconciler acts then. Until it does, nothing
            // here is current, so nothing plays.
            observeMobileClones();
        };

        wrapper._kh_ss_RemoveMobileMediaClones = removeMobileMediaClones;

        // Clones are rebuilt wholesale, so the fresh <video> nodes carry no play
        // state of their own. Handing straight back to the one owner is what keeps
        // a user pause - or reduced motion - true across a resize.
        const syncMobileInlineMediaAndReconcile = () => {
            if (wrapper._kh_ss_isDestroyed) return;

            syncMobileInlineMedia();
            reconcileMotion();
        };

        // Owned by this instance so teardown can cancel it. Removing the listener
        // does not withdraw a frame that is already queued, and that callback would
        // otherwise run after cleanup and rebuild clones and an observer for a block
        // that no longer exists.
        let mobileInlineMediaRafId = null;

        const mobileInlineMediaResizeHandler = () => {
            if (wrapper._kh_ss_isDestroyed) return;

            // One pending frame at a time. A resize burst collapses into the single
            // sync that the last event would have produced anyway.
            if (mobileInlineMediaRafId !== null) return;

            mobileInlineMediaRafId = window.requestAnimationFrame(() => {
                // Cleared first: the slot must be free even if the sync below throws,
                // or no later resize could ever queue another frame.
                mobileInlineMediaRafId = null;

                if (wrapper._kh_ss_isDestroyed) return;

                syncMobileInlineMediaAndReconcile();
            });
        };

        window.addEventListener('resize', mobileInlineMediaResizeHandler, { passive: true });
        wrapper._kh_ss_cleanupCallbacks.push(() => {
            window.removeEventListener('resize', mobileInlineMediaResizeHandler);

            if (mobileInlineMediaRafId !== null) {
                cancelAnimationFrame(mobileInlineMediaRafId);
                mobileInlineMediaRafId = null;
            }
        });

        syncMobileInlineMediaAndReconcile();
        
        const enableSmartSwap = scrollCol.dataset.smartswap === 'true';
        const textEffect = scrollCol.dataset.texteffect;
        const mediaCount = parseInt(scrollCol.dataset.mediacount) || 0;
        const stickyOffset = parseInt(wrapper.dataset.offset) || 0;
        
        // Smart Addons State Extraction
        

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

        

        // Viewport eligibility and engine ownership are two different truths. The
        // master observer below owns this one and nothing else writes it, so a
        // resize can tell a block that is merely halted for mobile apart from one
        // that is genuinely off screen - isEngineRunning alone cannot say which.
        let isInViewport = false;
        let isEngineRunning = false;
        let lastActiveIndex = -1; 
        
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

            

            if (progressFill) progressFill.style.transform = `scaleY(${progress})`;
            
            

            // Reduced Motion must not reach this gate. Which media matches the
            // section being read is functional state, not decoration; only the
            // trip between them is decorative, and the stylesheet makes that
            // instant under reduced motion.
            if (mediaCount > 1 && enableSmartSwap) {
                let activeIndex = Math.floor(progress * mediaCount);
                activeIndex = Math.min(mediaCount - 1, activeIndex);

                if (activeIndex !== lastActiveIndex) {
                    mediaLayers.forEach((layer, index) => {
                        if (index === activeIndex) layer.classList.add('is-active');
                        else layer.classList.remove('is-active');
                    });
                    
                    
                    lastActiveIndex = activeIndex;

                    // Functional state is settled above and stays untouched by what
                    // follows. The motion owner only reacts to it - no playback call
                    // belongs in this block.
                    reconcileMotion();
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
                        isInViewport = true;
                        if (!isEngineRunning) {
                            isEngineRunning = true;
                            renderLoop(); 
                        }
                    } else {
                        isInViewport = false;
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
            // No observer to own eligibility here, so it is unconditional - the same
            // declaration this branch already makes about the engine itself.
            isInViewport = true;
            isEngineRunning = true;
            renderLoop();
        }

        const engineResizeHandler = () => {
            // Geometry and viewport height can both move while the page never
            // scrolls, and renderLoop short-circuits on an unchanged scrollY. Drop
            // the cached value so the next frame is allowed to recompute; the loop
            // itself is unchanged and stays the only thing that calculates. (B5-16)
            lastScrollY = -1;

            // The observer only fires when intersection changes, and crossing the
            // mobile breakpoint does not change it. A block that halted for
            // non-sticky mobile while on screen therefore has no other event coming
            // and would stay dead. Viewport truth still belongs to the observer -
            // this only asks whether the mode we are now in should be running. (B5-12)
            const shouldRun = isInViewport && !(isMobile && !enableStickyMobile);

            if (shouldRun && !isEngineRunning) {
                isEngineRunning = true;
                wrapper._kh_ss_animFrameId = requestAnimationFrame(renderLoop);
            }
        };

        window.addEventListener('resize', engineResizeHandler, { passive: true });
        wrapper._kh_ss_cleanupCallbacks.push(() => {
            window.removeEventListener('resize', engineResizeHandler);
        });
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