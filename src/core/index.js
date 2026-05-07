/**
 * kinetichub Core Engine
 * Version: 1.0.0
 * (Strict Encapsulation, Dynamic A11y & Micro-Optimized RAF)
 */

window.kinetichub = window.kinetichub || {};
window.kinetichub.presets = window.kinetichub.presets || {};

const engineSettings = window.kinetichubSettings || {
    globalLerp: 0.08,
    enableMobileMotion: true,
    performanceMode: 'balanced'
};

// --- A11y & Hardware Detection ---
const reducedMotionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = reducedMotionQuery ? reducedMotionQuery.matches : false;

const isTouchDevice = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const isMobileMotionDisabled = !engineSettings.enableMobileMotion && isTouchDevice;

let disableComplexMotion = prefersReducedMotion || isMobileMotionDisabled;

// Listen for dynamic OS-level changes without page refresh
if (reducedMotionQuery && reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener('change', (event) => {
        prefersReducedMotion = event.matches;
        disableComplexMotion = prefersReducedMotion || isMobileMotionDisabled;
    });
}

// --- Global Utilities ---
window.kinetichub.Utils = {
    lerp: (start, end, amount) => {
        const factor = amount ?? engineSettings.globalLerp;

        if (disableComplexMotion) {
            return end;
        }

        return (1 - factor) * start + factor * end;
    },

    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),

    getAngle: (centerX, centerY, endX, endY) => {
        const theta = Math.atan2(endY - centerY, endX - centerX);
        let degrees = (theta * 180 / Math.PI) + 90;

        return degrees < 0 ? degrees + 360 : degrees;
    }
};

// --- Unified Animation Engine ---
class KineticTicker {
    constructor() {
        this.callbacks = new Map();
        this.ticking = false;
        this.lastTime = 0;
        this.rafId = null;
        this.throttleInterval = engineSettings.performanceMode === 'eco' ? 1000 / 30 : 0;

        this.tick = this.tick.bind(this);
    }

    subscribe(id, callback) {
        if (disableComplexMotion) {
            return;
        }

        this.callbacks.set(id, callback);

        if (!this.ticking) {
            this.ticking = true;
            this.lastTime = performance.now();
            this.rafId = requestAnimationFrame(this.tick);
        }
    }

    unsubscribe(id) {
        this.callbacks.delete(id);

        if (this.callbacks.size === 0) {
            this.stop();
        }
    }

    stop() {
        this.ticking = false;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    destroy() {
        this.callbacks.clear();
        this.stop();
    }

    tick(currentTime) {
        if (!this.ticking) {
            return;
        }

        if (this.throttleInterval > 0) {
            const deltaTime = currentTime - this.lastTime;

            if (deltaTime < this.throttleInterval) {
                this.rafId = requestAnimationFrame(this.tick);
                return;
            }

            this.lastTime = currentTime;
        }

        for (const callback of this.callbacks.values()) {
            if (typeof callback === 'function') {
                callback();
            }
        }

        this.rafId = requestAnimationFrame(this.tick);
    }
}

// --- Encapsulation ---
const coreEngine = new KineticTicker();

Object.defineProperty(window.kinetichub, 'Engine', {
    value: Object.freeze({
        subscribe: coreEngine.subscribe.bind(coreEngine),
        unsubscribe: coreEngine.unsubscribe.bind(coreEngine),
        destroy: coreEngine.destroy.bind(coreEngine)
    }),
    writable: false,
    configurable: false
});

window.kinetichub.registerPreset = (blockName, presetData) => {
    if (typeof blockName === 'string' && presetData) {
        window.kinetichub.presets[blockName] = presetData;
    }
};

Object.freeze(window.kinetichub.Utils);