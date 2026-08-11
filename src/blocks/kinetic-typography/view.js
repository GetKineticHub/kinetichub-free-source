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

        

        activeInstances.delete(block);
        block.classList.remove('kh-ty-linked', 'kh-ty-active', 'kh-ty-anim-done');

        if (activeInstances.size === 0 && globalObserver) {
            globalObserver.disconnect();
            globalObserver = null;
        }
    };

    

    const startEffect = (block) => {
        if (!block || block._kh_ty_isDestroyed) return;

        

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

                    const triggerAlways = block.dataset.triggerAlways === 'true';

                    

                    if (isVisible && (meetsThreshold || isHugeBlock || isScrolledPast)) {
                        

                        if (!block.classList.contains('kh-ty-active')) {
                            

                            startEffect(block);
                            block._kh_ty_hasAnimated = true;
                        }

                        let shouldUnobserve = !triggerAlways;

                        

                        if (shouldUnobserve) {
                            globalObserver.unobserve(block);
                        }
                    }

                    
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