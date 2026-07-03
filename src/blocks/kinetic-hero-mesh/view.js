/**
 * Kinetic Hero Mesh Pro - Advanced Generative Engine
 * Version: 1.0.0
 */
(function() {
    'use strict';

    let globalResizeObserver = null;
    let globalViewportObserver = null;
    let domObserver = null; // CRITICAL FIX: Global variable for proper cleanup
    const activeInstances = new Set(); // Track active hero instances

    const cleanupBlock = (hero) => {
        hero._kh_hm_IsDestroyed = true; 

        if (hero._kh_hm_abortController) {
            hero._kh_hm_abortController.abort();
            hero._kh_hm_abortController = null;
        }

        if (globalResizeObserver) globalResizeObserver.unobserve(hero);
        if (globalViewportObserver) globalViewportObserver.unobserve(hero);
        
        activeInstances.delete(hero); // Remove from tracking
        
        if (hero._kh_hm_ReqId) {
            cancelAnimationFrame(hero._kh_hm_ReqId);
            hero._kh_hm_ReqId = null;
        }
        
        if (hero._kh_hm_ImgNode) {
            hero._kh_hm_ImgNode.onload = null;
            hero._kh_hm_ImgNode.onerror = null;
            hero._kh_hm_ImgNode.src = '';
            hero._kh_hm_ImgNode = null;
        }

        if (hero._kh_hm_glResources) {
            const res = hero._kh_hm_glResources;
            if (res.gl) {
                if (res.texture) res.gl.deleteTexture(res.texture);
                if (res.buffer) res.gl.deleteBuffer(res.buffer);
                if (res.program) res.gl.deleteProgram(res.program);
                if (res.shaders && res.shaders.length) {
                    res.shaders.forEach(s => res.gl.deleteShader(s));
                }
                const ext = res.gl.getExtension('WEBGL_lose_context');
                if (ext) ext.loseContext();
            }
            hero._kh_hm_glResources = null;
        } else {
            const canvas = hero.querySelector('.kh-hm-canvas-engine');
            if (canvas) {
                canvas.width = 0; 
                canvas.height = 0;
                try {
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        const ext = gl.getExtension('WEBGL_lose_context');
                        if (ext) ext.loseContext();
                    }
                } catch (e) {
                }
            }
        }
        
        hero.classList.remove('js-ready', 'is-visible');

        // Clean up global observers when no instances remain (except domObserver for AJAX re-init)
        if (activeInstances.size === 0) {
            if (globalResizeObserver) {
                globalResizeObserver.disconnect();
                globalResizeObserver = null;
            }
            if (globalViewportObserver) {
                globalViewportObserver.disconnect();
                globalViewportObserver = null;
            }
            // Note: domObserver stays active to detect AJAX-loaded blocks
        }
    };

    const initHeroMesh = () => {
        const heroes = document.querySelectorAll('.kh-hm-hero-container:not(.js-ready)');
        if (!heroes.length) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!globalResizeObserver) {
            globalResizeObserver = new ResizeObserver((entries) => {
                entries.forEach(entry => {
                    const hero = entry.target;
                    if (hero._kh_hm_SyncDimensions) hero._kh_hm_SyncDimensions();
                });
            });
        }

        if (!globalViewportObserver) {
            globalViewportObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const hero = entry.target;
                    if (entry.isIntersecting) {
                        hero._kh_hm_IsVisible = true;
                        hero.classList.add('is-visible'); 
                        if (hero._kh_hm_SyncDimensions) hero._kh_hm_SyncDimensions();
                        if (hero._kh_hm_StartLoop) hero._kh_hm_StartLoop();
                    } else {
                        hero._kh_hm_IsVisible = false;
                        hero.classList.remove('is-visible');
                        if (hero._kh_hm_StopLoop) hero._kh_hm_StopLoop();
                    }
                });
            }, { rootMargin: '200px 0px' });
        }

        heroes.forEach(hero => {
            hero.classList.add('js-ready');
            activeInstances.add(hero); // Track active instance
            const canvas = hero.querySelector('.kh-hm-canvas-engine');
            const mode = hero.dataset.mode;

            if (prefersReducedMotion && mode !== 'classic') {
                if (canvas) canvas.style.display = 'none';
                return; 
            }

            hero._kh_hm_abortController = new AbortController();
            const { signal } = hero._kh_hm_abortController;

            // MOBILE OPTIMIZATION: Reduce DPR for better performance
            const isMobile = window.innerWidth <= 768;
            const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
            const mediaUrl = hero.dataset.media;
            const viscosity = parseFloat(hero.dataset.viscosity) || 0.1;

            let width = hero.offsetWidth;
            let height = hero.offsetHeight;
            hero._kh_hm_IsVisible = false;
            hero._kh_hm_IsDestroyed = false;
            hero._kh_hm_ReqId = null; 
            let activeRenderLoop = null;

            let mouse = { x: width / 2, y: height / 2 };
            let currentMouse = { x: width / 2, y: height / 2 };

            if (canvas) {
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.right = '0';
                canvas.style.bottom = '0';
                canvas.style.left = '0';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.margin = '0';
                canvas.style.padding = '0';
                canvas.style.display = 'block';
                canvas.style.pointerEvents = 'none';
            }

            hero._kh_hm_SyncDimensions = () => {
                if (hero._kh_hm_IsDestroyed) return;
                const rect = hero.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
                if (canvas && width > 0 && height > 0) {
                    canvas.width = Math.floor(width * dpr);
                    canvas.height = Math.floor(height * dpr);
                }
                if (hero._kh_hm_ResizeCallback) hero._kh_hm_ResizeCallback(width, height, dpr);
            };

            globalResizeObserver.observe(hero);

            hero.addEventListener('mousemove', (e) => {
                if (!hero._kh_hm_IsVisible || hero._kh_hm_IsDestroyed) return; 
                const rect = hero.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            }, { passive: true, signal });

            hero.addEventListener('touchmove', (e) => {
                if (!hero._kh_hm_IsVisible || !e.touches.length || hero._kh_hm_IsDestroyed) return;
                const rect = hero.getBoundingClientRect();
                mouse.x = e.touches[0].clientX - rect.left;
                mouse.y = e.touches[0].clientY - rect.top;
            }, { passive: true, signal });

            hero.addEventListener('mouseleave', () => {
                if (hero._kh_hm_IsDestroyed) return;
                mouse.x = width / 2;
                mouse.y = height / 2;
            }, { passive: true, signal });

            hero._kh_hm_StartLoop = () => {
                if (activeRenderLoop && !hero._kh_hm_ReqId && !hero._kh_hm_IsDestroyed) activeRenderLoop();
            };

            hero._kh_hm_StopLoop = () => {
                if (hero._kh_hm_ReqId) { 
                    cancelAnimationFrame(hero._kh_hm_ReqId); 
                    hero._kh_hm_ReqId = null; 
                }
            };

            const startEngine = () => {
                if (!activeRenderLoop && mode !== 'classic') return;
                if (!hero._kh_hm_IsDestroyed) globalViewportObserver.observe(hero);
            };

            if (mode === 'plexus' && canvas) {
                const ctx = canvas.getContext('2d', { alpha: true });
                let rawDensity = parseInt(hero.dataset.plexusDensity) || 80;
                
                const isMobile = window.innerWidth <= 768;
                const density = isMobile ? Math.min(rawDensity, 40) : rawDensity;

                const pColor = hero.dataset.plexusColor || '#ffffff';
                const speed = parseFloat(hero.dataset.plexusSpeed) || 1.0;
                const pDist = parseInt(hero.dataset.plexusDist) || 150;
                const pWidth = parseFloat(hero.dataset.plexusWidth) || 1.0;
                const pInt = hero.dataset.plexusInt || 'repel';

                let particles = [];
                for(let i = 0; i < density; i++) {
                    particles.push({
                        x: Math.random() * width, y: Math.random() * height,
                        vx: (Math.random() - 0.5) * speed * 2, vy: (Math.random() - 0.5) * speed * 2
                    });
                }

                hero._kh_hm_ResizeCallback = (w, h, ratio) => { 
                    ctx.setTransform(1, 0, 0, 1, 0, 0); // CRITICAL: Reset transform before scaling
                    ctx.scale(ratio, ratio); 
                };

                activeRenderLoop = () => {
                    if (hero._kh_hm_IsDestroyed || !hero._kh_hm_IsVisible) return;
                    
                    currentMouse.x += (mouse.x - currentMouse.x) * viscosity;
                    currentMouse.y += (mouse.y - currentMouse.y) * viscosity;

                    ctx.clearRect(0, 0, width, height);

                    particles.forEach(p => {
                        p.x += p.vx; p.y += p.vy;
                        if (p.x < 0 || p.x > width) p.vx *= -1;
                        if (p.y < 0 || p.y > height) p.vy *= -1;

                        let dx = currentMouse.x - p.x; let dy = currentMouse.y - p.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist > 5) {
                            if (pInt === 'repel' && dist < 150) { 
                                let force = (150 - dist) / 150; p.x -= (dx / dist) * force * 2; p.y -= (dy / dist) * force * 2; 
                            } else if (pInt === 'attract' && dist < 200) { 
                                let force = (200 - dist) / 200; p.x += (dx / dist) * force * 1; p.y += (dy / dist) * force * 1; 
                            }
                        }

                        ctx.fillStyle = pColor;
                        ctx.beginPath(); ctx.arc(p.x, p.y, pWidth * 1.5, 0, Math.PI*2); ctx.fill();
                    });

                    ctx.strokeStyle = pColor; ctx.lineWidth = pWidth;
                    let allNodes = pInt === 'constellation' ? [...particles, { x: currentMouse.x, y: currentMouse.y }] : particles;
                    
                    for(let i = 0; i < allNodes.length; i++) {
                        for(let j = i + 1; j < allNodes.length; j++) {
                            let dx = allNodes[i].x - allNodes[j].x; let dy = allNodes[i].y - allNodes[j].y;
                            let dist = Math.sqrt(dx*dx + dy*dy);
                            if(dist < pDist) {
                                ctx.globalAlpha = 1 - (dist / pDist);
                                ctx.beginPath(); ctx.moveTo(allNodes[i].x, allNodes[i].y); ctx.lineTo(allNodes[j].x, allNodes[j].y); ctx.stroke();
                            }
                        }
                    }
                    ctx.globalAlpha = 1;
                    hero._kh_hm_ReqId = requestAnimationFrame(activeRenderLoop);
                };
                startEngine();
            }
            
            
            
            

            // Classic mode: no render loop but still needs viewport observation for is-visible class (grain animation)
            if (mode === 'classic' && !hero._kh_hm_IsDestroyed) {
                globalViewportObserver.observe(hero);
            }
        });
    };

    let ajaxTimer;

    const ensureDomObserver = () => {
        if (domObserver) return;
        domObserver = new MutationObserver((mutations) => {
            let shouldInit = false;
            mutations.forEach(m => {
                if (m.removedNodes.length) {
                    m.removedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.classList && node.classList.contains('kh-hm-hero-container')) {
                                cleanupBlock(node);
                            } else if (node.querySelectorAll) {
                                node.querySelectorAll('.kh-hm-hero-container').forEach(cleanupBlock);
                            }
                        }
                    });
                }
                if (m.addedNodes.length) {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (node.classList?.contains('kh-hm-hero-container') || node.querySelector?.('.kh-hm-hero-container'))) {
                            shouldInit = true;
                        }
                    });
                }
            });
            if (shouldInit) {
                clearTimeout(ajaxTimer);
                ajaxTimer = setTimeout(initHeroMesh, 150);
            }
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
    };

    const initAndObserve = () => {
        initHeroMesh();
        ensureDomObserver();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAndObserve);
    } else {
        initAndObserve();
    }

})();