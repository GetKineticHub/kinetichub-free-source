/**
 * Kinetic Audio Player Pro - Frontend Engine
 * Version: 1.0.0
 
 */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const players = document.querySelectorAll('.kh-ap-button');
    if (players.length === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.khApPlayers = window.khApPlayers || [];
    window.khApActiveAudioElement = null;

    let isGlobalTrackerActive = false;
    let globalAbortController = null;
    let domObserver = null;
    const instances = new Map();

    const cleanupBlock = (wrapper) => {
        wrapper._kh_ap_isDestroyed = true; 

        if (instances.has(wrapper)) {
            const playerInstance = instances.get(wrapper);
            
            if (playerInstance.audio) {
                playerInstance.audio.pause();
                playerInstance.audio.removeAttribute('src');
                playerInstance.audio.load();
            }

            if (playerInstance.abortController) {
                playerInstance.abortController.abort();
            }

            if (playerInstance.observer) {
                playerInstance.observer.disconnect();
            }

            if (playerInstance.rafId) {
                cancelAnimationFrame(playerInstance.rafId);
            }

            

            window.khApPlayers = window.khApPlayers.filter(p => p.id !== playerInstance.id);
            if (window.khApActiveAudioElement === playerInstance.audio) {
                window.khApActiveAudioElement = null;
            }

            instances.delete(wrapper);
        }

        wrapper.classList.remove('kh-ready');

        if (window.khApPlayers.length === 0 && globalAbortController) {
            globalAbortController.abort();
            globalAbortController = null;
            isGlobalTrackerActive = false;
            if (domObserver) {
                domObserver.disconnect();
                domObserver = null;
            }
        }
    };

    const initEntrance = (wrapper) => {
        if (wrapper.classList.contains('kh-ready')) return;
        wrapper.classList.add('kh-ready');

        const entranceObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('kh-animated');
                    entranceObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        if (wrapper.hasAttribute('data-entrance')) {
            entranceObserver.observe(wrapper);
        } else {
            wrapper.style.opacity = 1;
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const initGlobalTrackers = () => {
        if (!isGlobalTrackerActive) {
            globalAbortController = new AbortController();
            const { signal: globalSignal } = globalAbortController;

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    
                } else {
                    
                }
            }, { signal: globalSignal });

            

            isGlobalTrackerActive = true;
        }
        startDomObserver();
    };

    let ajaxTimer;
    const startDomObserver = () => {
        if (domObserver) return;
        domObserver = new MutationObserver(handleDomMutations);
        domObserver.observe(document.body, { childList: true, subtree: true });
    };
    const handleDomMutations = (mutations) => {
        let shouldInit = false;
        mutations.forEach(m => {
            if (m.removedNodes.length) {
                m.removedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('kh-ap-wrapper')) {
                            cleanupBlock(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('.kh-ap-wrapper').forEach(cleanupBlock);
                        }
                    }
                });
            }
            if (m.addedNodes.length) {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (node.classList?.contains('kh-ap-button') || node.querySelector?.('.kh-ap-button'))) {
                        shouldInit = true;
                    }
                });
            }
        });

        if (shouldInit) {
            clearTimeout(ajaxTimer);
            ajaxTimer = setTimeout(() => {
                document.querySelectorAll('.kh-ap-button').forEach(btn => {
                    const wrapper = btn.closest('.kh-ap-wrapper');

                    // A button with no wrapper ancestor is a legitimate lifecycle state, not
                    // an error: the PRO sticky/floating engine appends the button straight to
                    // document.body, which this observer sees as an added node and rescans.
                    // The old code called .classList on the null closest() result and threw,
                    // aborting the whole forEach and any valid candidate after it. Such a
                    // button already owns a live playerInstance, so skipping it is also the
                    // correct outcome - re-initialising would strip its sticky classes and
                    // build a second Audio, listener set and instance for the same player.
                    if (!wrapper) return;

                    // Already initialised (including a sticky button just returned to its
                    // wrapper): cleanupBlock is what clears kh-ready, so a genuinely
                    // destroyed-and-reinserted block still re-initialises below.
                    if (wrapper.classList.contains('kh-ready')) return;

                    initPlayer(btn);
                });
            }, 150);
        }
    };

    const initPlayer = (btn) => {
        btn.classList.remove('kh-ap-editor-preview');
        
        
        const wrapper = btn.closest('.kh-ap-wrapper');
        const audioSrc = btn.dataset.audio;
        if (!audioSrc || !wrapper) return;

        wrapper._kh_ap_isDestroyed = false;
        initEntrance(wrapper);
        initGlobalTrackers();

        const localAbort = new AbortController();
        const { signal } = localAbort;

        const audio = new Audio();
        audio.preload = btn.dataset.preload || 'metadata';
        audio.src = audioSrc;

        const generateId = () => window.crypto && crypto.randomUUID ? crypto.randomUUID().split('-')[0] : Math.random().toString(36).substr(2, 9);
        /*
         * render.php already publishes the unique id as data-block-id, so read that first.
         * The old class regex scanned "kh-ap-wrapper kh-ap-<uid>" left to right and always
         * matched kh-ap-wrapper, so every player on the page resolved to the same identity:
         * Engine subscribe/unsubscribe keys, the PRO magnet key and the PRO Remember
         * Position localStorage key all collided across instances. The class fallback is
         * kept for markup rendered before this fix, but it now skips the kh-ap-wrapper
         * token explicitly. Value format is unchanged: the full "kh-ap-<uid>" string.
         */
        const datasetBlockId = (wrapper.dataset.blockId || '').trim();
        const classBlockId = (wrapper.className.match(/\bkh-ap-(?!wrapper\b)[a-zA-Z0-9_-]+/) || [])[0];
        const blockId = datasetBlockId || classBlockId || `kh-ap-${generateId()}`;
        
        let config = {
            timeMode: btn.dataset.timemode,
            isCompact: btn.dataset.compact === 'true',
            hasSeekbar: btn.classList.contains('has-seekbar'),
            allowVisuals: !prefersReducedMotion
        };

        

        const playerInstance = { 
            id: blockId, 
            audio, 
            btn, 
            wrapper, 
            config,
            abortController: localAbort,
            rafId: null,
            observer: null
        };
        
        window.khApPlayers.push(playerInstance);
        instances.set(wrapper, playerInstance);

        if (!config.allowVisuals) {
            
            const visualizer = btn.querySelector('.kh-ap-visualizer');
            if (visualizer) visualizer.style.display = 'none';
        }

        const onAudioError = () => {
            if (wrapper._kh_ap_isDestroyed) return;
            btn.classList.add('is-error');
            const title = btn.querySelector('.kh-ap-title');
            if (title) title.textContent = 'Audio Unavailable';
            const playIcon = btn.querySelector('.kh-ap-play');
            if (playIcon) playIcon.style.opacity = '0.3';
        };
        audio.addEventListener('error', onAudioError, { signal });

        

        // Architecture Fix: Instant time display initialization
        audio.addEventListener('loadedmetadata', () => {
            if (!wrapper._kh_ap_isDestroyed) updateVisuals();
        }, { signal });

        const updateUIState = (playing) => {
            if (wrapper._kh_ap_isDestroyed) return;
            if (playing) {
                btn.classList.add('is-playing');
                const playBtn = btn.querySelector('.kh-ap-play');
                const pauseBtn = btn.querySelector('.kh-ap-pause');
                if(playBtn) playBtn.style.display = 'none';
                if(pauseBtn) pauseBtn.style.display = 'block';
            } else {
                btn.classList.remove('is-playing');
                const playBtn = btn.querySelector('.kh-ap-play');
                const pauseBtn = btn.querySelector('.kh-ap-pause');
                if(playBtn) playBtn.style.display = 'block';
                if(pauseBtn) pauseBtn.style.display = 'none';
            }
        };

        let isIntersecting = true;
        let initialLoadDelay = true; 
        setTimeout(() => { initialLoadDelay = false; }, 800);

        /* PRO: Sticky/Floating Engine */
        let checkStickyState = () => {};
        
        playerInstance.checkStickyState = checkStickyState;

        const stopAllOtherPlayers = () => {
            window.khApPlayers.forEach(p => {
                if (p.audio !== audio) {
                    if (!p.audio.paused) p.audio.pause();
                    
                }
            });
        };

        const progressFill = btn.querySelector('.kh-ap-progress-fill');
        const circleFill = btn.querySelector('.kh-ap-progress-circle-fill');
        const timeDisplay = btn.querySelector('.kh-ap-time-display');
        const seekLayer = btn.querySelector('.kh-ap-seek-layer');

        const updateVisuals = () => {
            if (wrapper._kh_ap_isDestroyed) return;
            if (audio.paused && !btn.classList.contains('is-playing') && audio.currentTime !== 0 && !audio.readyState) return;

            if (isFinite(audio.duration) && audio.duration > 0) {
                const percent = audio.currentTime / audio.duration;
                
                if (!config.isCompact && progressFill) {
                    progressFill.style.transform = `scaleX(${percent})`;
                } else if (config.isCompact && circleFill) {
                    const circumference = 2 * Math.PI * 48; 
                    circleFill.style.strokeDashoffset = circumference - (percent * circumference);
                }

                if (timeDisplay && config.timeMode !== 'none') {
                    if (config.timeMode === 'elapsed') timeDisplay.textContent = formatTime(audio.currentTime);
                    if (config.timeMode === 'remaining') timeDisplay.textContent = '-' + formatTime(audio.duration - audio.currentTime);
                    if (config.timeMode === 'total') timeDisplay.textContent = formatTime(audio.duration);
                }

                if (seekLayer) {
                    seekLayer.setAttribute('aria-valuenow', Math.round(percent * 100));
                    seekLayer.setAttribute('aria-valuetext', formatTime(audio.currentTime));
                }
            }
        };

        const playTrack = async () => {
            if (audio.error || wrapper._kh_ap_isDestroyed) return;
            stopAllOtherPlayers();
            window.khApActiveAudioElement = audio; 
            try { 
                await audio.play(); 
            } catch (err) { 
                updateUIState(false); 
            }
        };

        /*
         * Progress fill/ring, the time read-out and the seek slider's ARIA state are
         * functional playback feedback, not decorative motion, so this loop has to keep
         * running under prefers-reduced-motion. It used to go through
         * window.kinetichub.Engine, whose subscribe() is a deliberate no-op while complex
         * motion is disabled (reduced motion, or Enable Mobile Motion off on a touch
         * device). The callback was simply never registered and the local fallback below
         * was only reachable when the Engine object was absent entirely, so the progress
         * bar, the clock and aria-valuenow froze for the whole track.
         *
         * A block-local rAF costs nothing here: playback is exclusive - stopAllOtherPlayers
         * pauses every other instance on play - so at most one of these loops ever runs.
         * The PRO magnet loop further down deliberately stays on the Engine: that motion IS
         * decorative and must remain suppressed under reduced motion.
         */
        const motorTick = () => {
            if (wrapper._kh_ap_isDestroyed) {
                playerInstance.rafId = null;
                return;
            }

            updateVisuals();

            if (audio.paused) {
                playerInstance.rafId = null;
                return;
            }

            playerInstance.rafId = requestAnimationFrame(motorTick);
        };

        const startMotor = () => {
            // rafId is the single source of truth for "a motor is already running", so
            // repeat calls (play + checkStickyState + the IntersectionObserver all reach
            // here) cannot stack a second loop.
            if (playerInstance.rafId || wrapper._kh_ap_isDestroyed) return;
            motorTick();
        };

        const stopMotor = () => {
            if (playerInstance.rafId) {
                cancelAnimationFrame(playerInstance.rafId);
                playerInstance.rafId = null;
            }
        };

        const onAudioPause = () => {
            updateUIState(false);
            checkStickyState();
            stopMotor();
            
        };

        const onAudioPlay = () => { 
            updateUIState(true); 
            checkStickyState();
            startMotor();
        };

        const onAudioEnded = () => {
            updateUIState(false);
            // Explicit cancellation: 'ended' does not reliably fire 'pause', and the final
            // zeroed values are written by hand just below - the motor must not tick again
            // afterwards and overwrite them.
            stopMotor();
            audio.currentTime = 0;
            
            if (!config.isCompact && progressFill) progressFill.style.transform = 'scaleX(0)';
            else if (config.isCompact && circleFill) circleFill.style.strokeDashoffset = 2 * Math.PI * 48;
            
            if (timeDisplay && config.timeMode !== 'none') timeDisplay.textContent = "00:00";

            
            checkStickyState();
        };

        audio.addEventListener('pause', onAudioPause, { signal });
        audio.addEventListener('play', onAudioPlay, { signal });
        audio.addEventListener('seeked', updateVisuals, { signal });
        audio.addEventListener('ended', onAudioEnded, { signal });

        const absTrigger = btn.querySelector('.kh-ap-absolute-trigger');
        const onTriggerClick = (e) => {
            e.preventDefault(); e.stopImmediatePropagation(); 
            if (audio.paused) playTrack(); else audio.pause();
        };
        if (absTrigger) {
            absTrigger.addEventListener('click', onTriggerClick, { signal });
        }

        

        const handleSeek = (e) => {
            if (e.cancelable) e.preventDefault(); 
            e.stopPropagation();
            
            if (!isFinite(audio.duration) || audio.duration <= 0) return;

            const rect = btn.getBoundingClientRect();
            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

            if (config.isCompact) {
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const angle = Math.atan2(clientY - cy, clientX - cx);
                let deg = (angle * 180 / Math.PI) + 90;
                if (deg < 0) deg += 360;
                audio.currentTime = (deg / 360) * audio.duration;
            } else {
                const clickX = clientX - rect.left;
                audio.currentTime = (clickX / rect.width) * audio.duration;
            }
            
            updateVisuals();
            if (audio.paused) playTrack();
        };

        const onSeekKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
                updateVisuals();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                audio.currentTime = Math.max(0, audio.currentTime - 5);
                updateVisuals();
            }
        };

        if (seekLayer) {
            seekLayer.addEventListener('click', handleSeek, { signal });
            seekLayer.addEventListener('touchstart', handleSeek, { passive: false, signal });
            seekLayer.addEventListener('keydown', onSeekKeyDown, { signal });
        }

        

        const volSlider = btn.querySelector('.kh-ap-vol-slider');
        const volBtn = btn.querySelector('.kh-ap-vol-btn');
        const onVolBtnClick = (e) => {
            e.stopPropagation();
            if (audio.volume > 0) { 
                audio.dataset.savedVol = audio.volume; 
                audio.volume = 0; 
                volSlider.value = 0; 
            } else { 
                audio.volume = audio.dataset.savedVol || 1; 
                volSlider.value = audio.volume * 100; 
            }
        };
        const onVolSliderInput = (e) => { 
            e.stopPropagation(); 
            audio.volume = e.target.value / 100; 
        };
        const stopPropagation = (e) => e.stopPropagation();

        if (volSlider && volBtn) {
            volBtn.addEventListener('click', onVolBtnClick, { signal });
            volSlider.addEventListener('input', onVolSliderInput, { signal });
            volSlider.addEventListener('click', stopPropagation, { signal });
        }

        // Architecture Fix: Keep motor running if sticky and playing
        const observer = new IntersectionObserver((entries) => {
            isIntersecting = entries[0].isIntersecting;
            
            checkStickyState();
            
            let shouldRunMotor = !audio.paused && isIntersecting;
            

            if (shouldRunMotor) {
                startMotor();
            } else {
                stopMotor();
            }
        }, { threshold: 0 });
        
        playerInstance.observer = observer;
        setTimeout(() => { observer.observe(wrapper); }, 100);
    };

    players.forEach(initPlayer);

    startDomObserver();
});