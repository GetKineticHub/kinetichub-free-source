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
                canvas.style.left = '0';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
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
            
            /* <fs_premium_only> */
            else if (mode === 'gradient' && canvas) {
                const ctx = canvas.getContext('2d', { alpha: true });
                let useImg = false;
                
                useImg = hero.dataset.useImgMesh === 'true';
                const colors = (hero.dataset.meshColors || '').split(',');
                const gradInt = parseFloat(hero.dataset.gradInt) || 0.8;
                let time = 0;

                // MOBILE OPTIMIZATION: Reduce blob count on mobile
                const isMobile = window.innerWidth <= 768;
                const blobCount = isMobile ? 2 : 3; // 2 blobs on mobile, 3 on desktop

                if (useImg && mediaUrl) {
                    hero._kh_hm_ImgNode = new Image(); 
                    hero._kh_hm_ImgNode.crossOrigin = "anonymous";
                    hero._kh_hm_ImgNode.onerror = () => { 
                        hero._kh_hm_ImgNode = null;
                        useImg = false; // IMPROVED ERROR HANDLING: Disable image blend on error
                    }; 
                    hero._kh_hm_ImgNode.src = mediaUrl;
                }

                hero._kh_hm_ResizeCallback = (w, h, ratio) => { 
                    ctx.setTransform(1, 0, 0, 1, 0, 0); // CRITICAL: Reset transform before scaling
                    ctx.scale(ratio, ratio); 
                };

                activeRenderLoop = () => {
                    if (hero._kh_hm_IsDestroyed || !hero._kh_hm_IsVisible) return;
                    
                    const gradSpeed = parseFloat(hero.dataset.gradSpeed) || 0.5;

                    time += 0.01 * gradSpeed;
                    currentMouse.x += (mouse.x - currentMouse.x) * viscosity; currentMouse.y += (mouse.y - currentMouse.y) * viscosity;
                    
                    ctx.clearRect(0, 0, width, height);
                    if (hero._kh_hm_ImgNode && hero._kh_hm_ImgNode.complete && useImg) {
                        ctx.drawImage(hero._kh_hm_ImgNode, 0, 0, width, height);
                        ctx.globalCompositeOperation = "screen"; 
                    }
                    
                    ctx.globalAlpha = gradInt; 
                    const blobs = [
                        { x: width/2 + Math.sin(time)*200, y: height/2 + Math.cos(time)*200, r: width*0.6, c: colors[0] || 'rgba(59,130,246,1)' },
                        { x: width/2 + Math.cos(time*0.8)*300, y: height/2 + Math.sin(time*0.8)*300, r: width*0.5, c: colors[1] || 'rgba(139,92,246,1)' }
                    ];

                    // Add 3rd blob only on desktop
                    if (blobCount > 2) {
                        blobs.push({ x: currentMouse.x, y: currentMouse.y, r: width*0.4, c: colors[2] || 'rgba(236,72,153,1)' });
                    }

                    blobs.forEach(b => {
                        let g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
                        g.addColorStop(0, b.c); g.addColorStop(1, 'rgba(0,0,0,0)');
                        ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
                    });
                    
                    ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = "source-over"; 
                    hero._kh_hm_ReqId = requestAnimationFrame(activeRenderLoop);
                };
                startEngine();
            }
            /* </fs_premium_only> */
            /* <fs_premium_only> */
            else if (mode === 'aurora' && canvas) {
                const ctx = canvas.getContext('2d', { alpha: true });
                let time = 0;

                // MOBILE OPTIMIZATION: Reduce orb count on mobile
                const isMobile = window.innerWidth <= 768;
                const orbCount = isMobile ? 2 : 4; // 2 orbs on mobile, 4 on desktop

                hero._kh_hm_ResizeCallback = (w, h, ratio) => { 
                    ctx.setTransform(1, 0, 0, 1, 0, 0); // CRITICAL: Reset transform before scaling
                    ctx.scale(ratio, ratio); 
                };

                activeRenderLoop = () => {
                    if (hero._kh_hm_IsDestroyed || !hero._kh_hm_IsVisible) return;
                    
                    const fxSpeed = parseFloat(hero.dataset.fxSpeed) || 1.0;

                    time += 0.005 * fxSpeed;
                    currentMouse.x += (mouse.x - currentMouse.x) * viscosity; currentMouse.y += (mouse.y - currentMouse.y) * viscosity;

                    ctx.clearRect(0, 0, width, height);
                    ctx.globalCompositeOperation = 'screen';
                    
                    const orbs = [
                        { x: width * 0.2 + Math.sin(time) * width * 0.2, y: height * 0.8 + Math.cos(time * 0.8) * height * 0.2, r: width * 0.6, c: [14, 165, 233] },
                        { x: width * 0.8 + Math.cos(time * 1.2) * width * 0.2, y: height * 0.2 + Math.sin(time * 1.5) * height * 0.2, r: width * 0.5, c: [139, 92, 246] }
                    ];

                    // Add additional orbs only on desktop
                    if (orbCount > 2) {
                        orbs.push(
                            { x: width * 0.5 + Math.sin(time * 0.5) * width * 0.3, y: height * 0.5 + Math.cos(time * 1.1) * height * 0.3, r: width * 0.7, c: [16, 185, 129] },
                            { x: currentMouse.x, y: currentMouse.y, r: width * 0.4, c: [236, 72, 153] }
                        );
                    }

                    orbs.forEach(orb => {
                        let g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
                        g.addColorStop(0, `rgba(${orb.c[0]}, ${orb.c[1]}, ${orb.c[2]}, 0.5)`);
                        g.addColorStop(1, `rgba(${orb.c[0]}, ${orb.c[1]}, ${orb.c[2]}, 0)`);
                        ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
                    });

                    ctx.globalCompositeOperation = 'source-over'; 
                    hero._kh_hm_ReqId = requestAnimationFrame(activeRenderLoop);
                };
                startEngine();
            }
            /* </fs_premium_only> */
            /* <fs_premium_only> */
            else if (['liquid', 'refractive'].includes(mode) && canvas && mediaUrl) {
                hero._kh_hm_InitWebGL = () => {
                    if (hero._kh_hm_IsDestroyed) return;
                    const gl = canvas.getContext('webgl', { depth: false, antialias: false, powerPreference: "high-performance", alpha: true });
                    if (!gl) return;

                    const vs = `attribute vec2 position; varying vec2 vUv; void main() { vUv = position * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(position, 0.0, 1.0); }`;
                    let fs = '';

                    if (mode === 'liquid') {
                        const rgb = parseFloat(hero.dataset.rgb) || 0.5;
                        const liquidInt = parseFloat(hero.dataset.liquidInt) || 0.02;
                        fs = `precision mediump float; uniform sampler2D u_image; uniform vec2 u_mouse; uniform vec2 u_res; uniform float u_time; varying vec2 vUv;
                            void main() { 
                                vec2 aspect = vec2(u_res.x / u_res.y, 1.0); vec2 uv = vUv; vec2 m = u_mouse / u_res; m.y = 1.0 - m.y;
                                float dist = distance(uv * aspect, m * aspect); 
                                float wave = sin(dist * 20.0 - u_time * 5.0) * ${liquidInt.toFixed(4)} * exp(-dist * 5.0);
                                vec2 dUV = uv + normalize(uv - m) * wave; float s = wave * ${rgb.toFixed(2)} * 0.5;
                                gl_FragColor = vec4(texture2D(u_image, dUV + vec2(s, 0.0)).r, texture2D(u_image, dUV).g, texture2D(u_image, dUV - vec2(s, 0.0)).b, 1.0); 
                            }`;
                    } else if (mode === 'refractive') {
                        const scale = (parseFloat(hero.dataset.fxScale) || 20) * 0.005;
                        fs = `precision mediump float; uniform sampler2D u_image; uniform vec2 u_mouse; uniform vec2 u_res; varying vec2 vUv;
                            void main() { 
                                vec2 aspect = vec2(u_res.x / u_res.y, 1.0); vec2 m = u_mouse / u_res; m.y = 1.0 - m.y;
                                float dist = distance(vUv * aspect, m * aspect); vec2 uv = vUv;
                                if(dist < ${scale.toFixed(4)}) { uv += (m - uv) * 0.1; gl_FragColor = texture2D(u_image, uv); } 
                                else { vec4 color = texture2D(u_image, uv); color += texture2D(u_image, uv + vec2(0.01, 0.01)); color += texture2D(u_image, uv - vec2(0.01, 0.01)); gl_FragColor = color / 3.0; } 
                            }`;
                    }

                    const compileWebGL = (gl, vsSource, fsSource) => {
                        const compile = (type, source) => {
                            const s = gl.createShader(type); 
                            gl.shaderSource(s, source); 
                            gl.compileShader(s); 
                            
                            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                                console.warn('Kinetic WebGL Shader Failed:', gl.getShaderInfoLog(s));
                                gl.deleteShader(s);
                                return null;
                            }
                            return s;
                        };
                        const vsShader = compile(gl.VERTEX_SHADER, vsSource);
                        const fsShader = compile(gl.FRAGMENT_SHADER, fsSource);
                        if (!vsShader || !fsShader) return null;

                        const program = gl.createProgram(); 
                        gl.attachShader(program, vsShader); 
                        gl.attachShader(program, fsShader);
                        gl.linkProgram(program); 
                        
                        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                            console.warn('Kinetic WebGL Link Failed:', gl.getProgramInfoLog(program));
                            gl.deleteProgram(program);
                            return null;
                        }
                        
                        gl.useProgram(program);
                        const buffer = gl.createBuffer(); 
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), gl.STATIC_DRAW);
                        const pos = gl.getAttribLocation(program, "position"); 
                        gl.enableVertexAttribArray(pos); 
                        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
                        
                        return { program, buffer, shaders: [vsShader, fsShader] };
                    };

                    const compiledData = compileWebGL(gl, vs, fs);
                    if (!compiledData) {
                        canvas.style.display = 'none';
                        return; 
                    }
                    
                    const program = compiledData.program;
                    const texture = gl.createTexture();
                    
                    hero._kh_hm_glResources = {
                        gl: gl,
                        program: program,
                        buffer: compiledData.buffer,
                        texture: texture,
                        shaders: compiledData.shaders
                    };

                    hero._kh_hm_ImgNode = new Image();
                    hero._kh_hm_ImgNode.crossOrigin = "anonymous";
                    hero._kh_hm_ImgNode.onerror = () => { 
                        // IMPROVED ERROR HANDLING: Hide canvas and stop loop
                        canvas.style.display = 'none';
                        if (hero._kh_hm_ReqId) {
                            cancelAnimationFrame(hero._kh_hm_ReqId);
                            hero._kh_hm_ReqId = null;
                        }
                    };
                    
                    hero._kh_hm_ImgNode.onload = () => {
                        if (hero._kh_hm_IsDestroyed) return;
                        gl.bindTexture(gl.TEXTURE_2D, texture);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hero._kh_hm_ImgNode);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

                        const locMouse = gl.getUniformLocation(program, "u_mouse");
                        const locRes = gl.getUniformLocation(program, "u_res");
                        const locTime = gl.getUniformLocation(program, "u_time");
                        let startTime = Date.now();

                        activeRenderLoop = () => {
                            if (hero._kh_hm_IsDestroyed || !hero._kh_hm_IsVisible) return;
                            
                            const w = width * dpr; const h = height * dpr;
                            currentMouse.x += (mouse.x - currentMouse.x) * viscosity; currentMouse.y += (mouse.y - currentMouse.y) * viscosity;

                            gl.viewport(0, 0, w, h);
                            gl.clearColor(0.0, 0.0, 0.0, 0.0);
                            gl.clear(gl.COLOR_BUFFER_BIT);
                            
                            gl.uniform2f(locMouse, currentMouse.x * dpr, currentMouse.y * dpr);
                            gl.uniform2f(locRes, w, h);
                            if (locTime) gl.uniform1f(locTime, (Date.now() - startTime) * 0.001);

                            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                            hero._kh_hm_ReqId = requestAnimationFrame(activeRenderLoop);
                        };
                        startEngine();
                    };
                    hero._kh_hm_ImgNode.src = mediaUrl;
                };

                canvas.addEventListener('webglcontextlost', (e) => { 
                    e.preventDefault(); 
                    if (hero._kh_hm_ReqId) {
                        cancelAnimationFrame(hero._kh_hm_ReqId); 
                        hero._kh_hm_ReqId = null;
                    }
                }, false);

                canvas.addEventListener('webglcontextrestored', () => { 
                    // IMPROVED CONTEXT RESTORE: Re-init and start loop if visible
                    if (hero._kh_hm_InitWebGL) {
                        hero._kh_hm_InitWebGL();
                        if (hero._kh_hm_IsVisible && hero._kh_hm_StartLoop) {
                            hero._kh_hm_StartLoop();
                        }
                    }
                }, false);

                hero._kh_hm_InitWebGL();
            }
            /* </fs_premium_only> */

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