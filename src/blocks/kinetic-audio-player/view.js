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

            /* <fs_premium_only> */
            if (playerInstance.magnetRafId) {
                cancelAnimationFrame(playerInstance.magnetRafId);
            }

            if (playerInstance.btn && playerInstance.btn.parentNode === document.body) {
                playerInstance.btn.remove();
            }
            /* </fs_premium_only> */

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
                    /* <fs_premium_only> */
                    window.khApPlayers.forEach(p => {
                        if (p.config.pauseTab && !p.audio.paused) p.audio.pause();
                    });
                    /* </fs_premium_only> */
                } else {
                    /* <fs_premium_only> */
                    setTimeout(() => { window.khApPlayers.forEach(p => { if(p.checkStickyState) p.checkStickyState(); }); }, 600);
                    /* </fs_premium_only> */
                }
            }, { signal: globalSignal });

            /* <fs_premium_only> */
            window.addEventListener('beforeunload', () => {
                window.khApPlayers.forEach(p => {
                    if (p.config.remember && !p.audio.paused && p.audio.currentTime > 0) {
                        try { localStorage.setItem(p.storageKey, p.audio.currentTime); } catch(e){}
                    }
                });
            }, { signal: globalSignal });
            /* </fs_premium_only> */

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
                    if (!btn.closest('.kh-ap-wrapper').classList.contains('kh-ready')) {
                        initPlayer(btn);
                    }
                });
            }, 150);
        }
    };

    const initPlayer = (btn) => {
        btn.classList.remove('kh-ap-editor-preview');
        /* <fs_premium_only> */
        btn.classList.remove('is-floating', 'is-sticky-top', 'is-sticky-style-box', 'is-sticky-style-pill', 'is-sticky-style-custom');
        /* </fs_premium_only> */
        
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
        const blockIdMatch = wrapper.className.match(/kh-ap-([a-zA-Z0-9\-]+)/);
        const blockId = blockIdMatch ? blockIdMatch[0] : `kh-ap-${generateId()}`;
        
        let config = {
            timeMode: btn.dataset.timemode,
            isCompact: btn.dataset.compact === 'true',
            hasSeekbar: btn.classList.contains('has-seekbar'),
            allowVisuals: !prefersReducedMotion
        };

        /* <fs_premium_only> */
        config.sticky = btn.dataset.sticky;
        config.stickyStyle = btn.dataset.stickyStyle || 'pill';
        config.remember = btn.dataset.remember === 'true';
        config.pauseTab = btn.dataset.pausetab === 'true';
        config.disableMobSeek = btn.dataset.disableMobSeek === 'true';
        config.magnetic = btn.dataset.magnetic === 'true';
        /* </fs_premium_only> */

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
        /* <fs_premium_only> */
        playerInstance.dismissed = false;
        playerInstance.storageKey = `kh_ap_pos_${blockId}`;
        playerInstance.magnetRafId = null;
        /* </fs_premium_only> */
        window.khApPlayers.push(playerInstance);
        instances.set(wrapper, playerInstance);

        if (!config.allowVisuals) {
            /* <fs_premium_only> */
            btn.classList.remove('kh-ap-glow-soft-ambient', 'kh-ap-glow-neon-cyberpunk', 'kh-ap-glow-pulsing-aura');
            /* </fs_premium_only> */
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

        /* <fs_premium_only> */
        if (config.remember) {
            try {
                const savedTime = localStorage.getItem(playerInstance.storageKey);
                if (savedTime) {
                    audio.addEventListener('loadedmetadata', function setTime() {
                        if (wrapper._kh_ap_isDestroyed) return;
                        if (parseFloat(savedTime) < audio.duration) { 
                            audio.currentTime = parseFloat(savedTime); 
                        }
                        updateVisuals();
                    }, { once: true, signal });
                }
            } catch(err) {}
        }
        /* </fs_premium_only> */

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
        /* <fs_premium_only> */
        const stickyClass = config.sticky === 'floating' ? 'is-floating' : 'is-sticky-top';
        const styleClass = `is-sticky-style-${config.stickyStyle}`;

        checkStickyState = () => {
            if (wrapper._kh_ap_isDestroyed || config.sticky === 'none' || initialLoadDelay) return;
            const isPlaying = !audio.paused;
            const isCurrentlySticky = btn.classList.contains(stickyClass);
            const isTargetInstance = (window.khApActiveAudioElement === audio);
            let shouldStick = isTargetInstance && !isIntersecting && !playerInstance.dismissed;

            if (!isCurrentlySticky && !isPlaying) shouldStick = false;

            if (shouldStick && !isCurrentlySticky) {
                wrapper.style.minHeight = `${wrapper.offsetHeight}px`;
                document.body.appendChild(btn);
                btn.getBoundingClientRect();
                btn.classList.add(stickyClass, styleClass);
                if (!audio.paused) startMotor();
            } else if (!shouldStick && isCurrentlySticky) {
                btn.classList.remove(stickyClass, styleClass);
                wrapper.appendChild(btn);
                setTimeout(() => { 
                    if (!wrapper._kh_ap_isDestroyed && !btn.classList.contains(stickyClass)) wrapper.style.minHeight = ''; 
                }, 300);
                if (!audio.paused && isIntersecting) startMotor();
                else stopMotor();
            }
        };
        /* </fs_premium_only> */
        playerInstance.checkStickyState = checkStickyState;

        const stopAllOtherPlayers = () => {
            window.khApPlayers.forEach(p => {
                if (p.audio !== audio) {
                    if (!p.audio.paused) p.audio.pause();
                    /* <fs_premium_only> */
                    if (p.btn.classList.contains('is-floating') || p.btn.classList.contains('is-sticky-top')) {
                        p.btn.classList.remove('is-floating', 'is-sticky-top', 'is-sticky-style-box', 'is-sticky-style-pill', 'is-sticky-style-custom');
                        if (p.wrapper) {
                            p.wrapper.appendChild(p.btn);
                            p.wrapper.style.minHeight = '';
                        }
                    }
                    /* </fs_premium_only> */
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

        const startMotor = () => {
            if (window.kinetichub && window.kinetichub.Engine) {
                window.kinetichub.Engine.subscribe(playerInstance.id, updateVisuals);
            } else {
                const loop = () => {
                    if (wrapper._kh_ap_isDestroyed) return;
                    updateVisuals();
                    if (!audio.paused) playerInstance.rafId = requestAnimationFrame(loop);
                };
                loop();
            }
        };

        const stopMotor = () => {
            if (window.kinetichub && window.kinetichub.Engine) {
                window.kinetichub.Engine.unsubscribe(playerInstance.id);
            } else if (playerInstance.rafId) {
                cancelAnimationFrame(playerInstance.rafId);
                playerInstance.rafId = null;
            }
        };

        const onAudioPause = () => {
            updateUIState(false);
            checkStickyState();
            stopMotor();
            /* <fs_premium_only> */
            if (config.remember && audio.currentTime > 0) { 
                try { localStorage.setItem(playerInstance.storageKey, audio.currentTime); } catch(e){} 
            }
            /* </fs_premium_only> */
        };

        const onAudioPlay = () => { 
            updateUIState(true); 
            checkStickyState();
            startMotor();
        };

        const onAudioEnded = () => {
            updateUIState(false);
            audio.currentTime = 0; 
            
            if (!config.isCompact && progressFill) progressFill.style.transform = 'scaleX(0)';
            else if (config.isCompact && circleFill) circleFill.style.strokeDashoffset = 2 * Math.PI * 48;
            
            if (timeDisplay && config.timeMode !== 'none') timeDisplay.textContent = "00:00";

            /* <fs_premium_only> */
            if (config.remember) { 
                try { localStorage.removeItem(playerInstance.storageKey); } catch(e){} 
            }
            /* </fs_premium_only> */
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

        /* <fs_premium_only> */
        /* PRO: Magnetic Physics Engine with LERP */
        let magnetActive = false;
        let magnetTargetX = 0, magnetTargetY = 0;
        let magnetCurrentX = 0, magnetCurrentY = 0;

        const magnetTick = () => {
            if (wrapper._kh_ap_isDestroyed) return;
            magnetCurrentX += (magnetTargetX - magnetCurrentX) * 0.15;
            magnetCurrentY += (magnetTargetY - magnetCurrentY) * 0.15;
            
            const isHovered = (magnetTargetX !== 0 || magnetTargetY !== 0);
            const scale = isHovered ? 1.02 : 1;

            btn.style.transform = `translate(${magnetCurrentX}px, ${magnetCurrentY}px) scale(${scale})`;

            if (!isHovered && Math.abs(magnetCurrentX) < 0.2 && Math.abs(magnetCurrentY) < 0.2) {
                btn.style.transform = '';
                magnetActive = false;
                if (window.kinetichub?.Engine && audio.paused) {
                    window.kinetichub.Engine.unsubscribe(playerInstance.id + '_magnet');
                } else if (playerInstance.magnetRafId) {
                    cancelAnimationFrame(playerInstance.magnetRafId);
                    playerInstance.magnetRafId = null;
                }
            } else if (!window.kinetichub?.Engine) {
                playerInstance.magnetRafId = requestAnimationFrame(magnetTick);
            }
        };

        const onWrapperMouseMove = (e) => {
            const rect = btn.getBoundingClientRect();
            const btnCenterX = rect.left + rect.width / 2;
            const btnCenterY = rect.top + rect.height / 2;
            
            const strength = config.isCompact ? 0.3 : 0.1; 
            magnetTargetX = (e.clientX - btnCenterX) * strength;
            magnetTargetY = (e.clientY - btnCenterY) * strength;

            if (!magnetActive) {
                magnetActive = true;
                if (window.kinetichub?.Engine) window.kinetichub.Engine.subscribe(playerInstance.id + '_magnet', magnetTick);
                else playerInstance.magnetRafId = requestAnimationFrame(magnetTick);
            }
        };
        const onWrapperMouseLeave = () => { magnetTargetX = 0; magnetTargetY = 0; };
        const onBtnMouseDown = () => { if(magnetActive) btn.style.transform = `translate(${magnetCurrentX}px, ${magnetCurrentY}px) scale(0.96)`; };
        const onBtnMouseUp = () => { if(magnetActive) btn.style.transform = `translate(${magnetCurrentX}px, ${magnetCurrentY}px) scale(1.02)`; };

        if (config.magnetic && config.allowVisuals) {
            wrapper.addEventListener('mousemove', onWrapperMouseMove, { passive: true, signal });
            wrapper.addEventListener('mouseleave', onWrapperMouseLeave, { passive: true, signal });
            btn.addEventListener('mousedown', onBtnMouseDown, { passive: true, signal });
            btn.addEventListener('mouseup', onBtnMouseUp, { passive: true, signal });
        }
        /* </fs_premium_only> */

        const handleSeek = (e) => {
            if (e.cancelable) e.preventDefault(); 
            e.stopPropagation();
            /* <fs_premium_only> */
            if (config.disableMobSeek && window.innerWidth <= 768) return;
            /* </fs_premium_only> */
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

        /* <fs_premium_only> */
        const dismissBtn = btn.querySelector('.kh-ap-sticky-dismiss');
        const onDismissClick = (e) => {
            e.preventDefault(); e.stopPropagation();
            playerInstance.dismissed = true;
            checkStickyState();
        };
        if (dismissBtn) {
            dismissBtn.addEventListener('click', onDismissClick, { signal });
        }
        /* </fs_premium_only> */

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
            /* <fs_premium_only> */
            if (isIntersecting) {
                playerInstance.dismissed = false; 
            }
            /* </fs_premium_only> */
            checkStickyState();
            
            let shouldRunMotor = !audio.paused && isIntersecting;
            /* <fs_premium_only> */
            const isSticky = btn.classList.contains('is-floating') || btn.classList.contains('is-sticky-top');
            shouldRunMotor = !audio.paused && (isIntersecting || isSticky);
            /* </fs_premium_only> */

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