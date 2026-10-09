gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. SCENE SETUP & MOBILE DETECTION
// ==========================================
const isMobile = window.innerWidth < 768;
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xFBFBF9, 0.035);

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 2, 5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xFBFBF9, 1);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// ==========================================
// 2. THE KINETIC DATA TOPOGRAPHY (Wave)
// ==========================================
const waveGeometry = new THREE.PlaneGeometry(100, 100, 120, 120);
const waveMaterial = new THREE.PointsMaterial({ 
    size: 0.035, color: 0x1C1C1E, transparent: true, opacity: 0.5
});
const waveMesh = new THREE.Points(waveGeometry, waveMaterial);
waveMesh.rotation.x = -Math.PI / 2;
waveMesh.position.y = -4; 
scene.add(waveMesh);

// ==========================================
// 3. EXPLODED VIEW & UNIFIED HOVER PHYSICS
// ==========================================
const textureLoader = new THREE.TextureLoader();
const projectGroups = [];

// Shared Ultra-Premium Glass Material
const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.1, roughness: 0.1, transmission: 0.9,
    transparent: true, opacity: 0.85, ior: 1.45, thickness: 0.8,
});

// The Unified Physics Factory (Customized for each project)
function attachPhysics(group, effectType) {
    const physicsGroup = new THREE.Group();
    physicsGroup.position.z = 0.5; // Sit slightly in front of the glass
    group.add(physicsGroup);

    // Common materials for our elegant effects
    const terracottaPointMat = new THREE.PointsMaterial({ color: 0xD85A42, size: 0.05, transparent: true, opacity: 0 });
    const charcoalLineMat = new THREE.LineBasicMaterial({ color: 0x1C1C1E, transparent: true, opacity: 0 });

    let activeMesh;
    let customUpdate = () => {}; // A function we can override for custom math per card

    // --- 1. GO-KART (Play at what cost) -> "Wind Tunnel Particles" ---
    if (effectType === 'kart') {
        // A swarm of particles that streak horizontally across the card, simulating speed
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(150 * 3);
        for(let i=0; i<150*3; i+=3) {
            pos[i] = (Math.random() - 0.5) * 6; // Spread across X
            pos[i+1] = (Math.random() - 0.5) * 4; // Spread across Y
            pos[i+2] = (Math.random() - 0.5) * 1; // Slight Z variance
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        activeMesh = new THREE.Points(geo, terracottaPointMat);
        
        customUpdate = (localPoint, time) => {
            const positions = activeMesh.geometry.attributes.position.array;
            for(let i=0; i<positions.length; i+=3) {
                positions[i] += 0.15; // Move right (Speed)
                if(positions[i] > 3) positions[i] = -3; // Loop back
                // Particles near the mouse get pushed slightly on Y axis (aerodynamics)
                const dist = Math.abs(positions[i] - localPoint.x);
                if (dist < 0.5) {
                    positions[i+1] += (localPoint.y > 0 ? 0.02 : -0.02);
                } else {
                    // Slowly drift back to original horizontal path
                    positions[i+1] += (0 - positions[i+1]) * 0.01; 
                }
            }
            activeMesh.geometry.attributes.position.needsUpdate = true;
        };
    } 
    
    // --- 2. PROXIMATE (Civic Engagement) -> "Connection Network" ---
    else if (effectType === 'civic') {
        // Subtle lines that draw between a few points, simulating people connecting
        const geo = new THREE.BufferGeometry();
        // Just 8 points moving around
        const pos = new Float32Array(8 * 3);
        for(let i=0; i<24; i++) pos[i] = (Math.random() - 0.5) * 4;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        activeMesh = new THREE.LineSegments(geo, charcoalLineMat);

        const initialPos = new Float32Array(pos);

        customUpdate = (localPoint, time) => {
            const positions = activeMesh.geometry.attributes.position.array;
            for(let i=0; i<24; i+=3) {
                // Points slowly drift 
                positions[i] = initialPos[i] + Math.sin(time * 0.5 + i) * 0.5;
                positions[i+1] = initialPos[i+1] + Math.cos(time * 0.5 + i) * 0.5;
                
                // Mouse pulls the nearest point toward it
                const dist = Math.sqrt(Math.pow(positions[i]-localPoint.x, 2) + Math.pow(positions[i+1]-localPoint.y, 2));
                if (dist < 2) {
                    positions[i] += (localPoint.x - positions[i]) * 0.05;
                    positions[i+1] += (localPoint.y - positions[i+1]) * 0.05;
                }
            }
            activeMesh.geometry.attributes.position.needsUpdate = true;
        };
    }

    // --- 3. FINANCE TRACKER -> "Rising Data Nodes" ---
    else if (effectType === 'finance') {
        // Particles that slowly bubble upward like a growth chart
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(60 * 3);
        for(let i=0; i<180; i+=3) {
            pos[i] = (Math.random() - 0.5) * 5;
            pos[i+1] = (Math.random() - 0.5) * 4;
            pos[i+2] = (Math.random() - 0.5) * 0.5;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        activeMesh = new THREE.Points(geo, terracottaPointMat);

        customUpdate = (localPoint, time) => {
            const positions = activeMesh.geometry.attributes.position.array;
            for(let i=0; i<180; i+=3) {
                positions[i+1] += 0.02; // Bubble up
                if (positions[i+1] > 2) positions[i+1] = -2; // Reset to bottom
                
                // If mouse is near, they dodge the cursor slightly
                const dx = positions[i] - localPoint.x;
                const dy = positions[i+1] - localPoint.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 1) {
                    positions[i] += dx * 0.05;
                }
            }
            activeMesh.geometry.attributes.position.needsUpdate = true;
        };
    }

    // --- 4. URIKI (Healthcare/Retiree) -> "Soft Breathing Aura" ---
    else if (effectType === 'health') {
        // A single, large, incredibly soft ring that slowly pulses (represents Ikigai/Wellbeing)
        const geo = new THREE.RingGeometry(1.5, 1.6, 64);
        const mat = new THREE.MeshBasicMaterial({ color: 0xD85A42, transparent: true, opacity: 0, side: THREE.DoubleSide });
        activeMesh = new THREE.Mesh(geo, mat);

        customUpdate = (localPoint, time) => {
            // Very slow, calming pulse in size
            const scale = 1 + Math.sin(time * 1.5) * 0.15;
            activeMesh.scale.set(scale, scale, 1);
            // It subtly tracks the mouse, but slowly
            activeMesh.position.x += (localPoint.x - activeMesh.position.x) * 0.05;
            activeMesh.position.y += (localPoint.y - activeMesh.position.y) * 0.05;
        };
    }

    // --- 5. FORTIS (App UI) -> "Digital Matrix Scanner" ---
    else if (effectType === 'app') {
        // A thin horizontal line that scans up and down the card like a barcode reader
        const geo = new THREE.PlaneGeometry(6, 0.05);
        const mat = new THREE.MeshBasicMaterial({ color: 0xD85A42, transparent: true, opacity: 0 });
        activeMesh = new THREE.Mesh(geo, mat);

        customUpdate = (localPoint, time) => {
            // Scan up and down
            activeMesh.position.y = Math.sin(time * 2) * 2;
            // The line tilts based on mouse position
            activeMesh.rotation.z = localPoint.x * 0.05;
        };
    }

    // --- 6. VR RESTAURANT -> "The Glitching Wireframe" (Keep this as you liked it) ---
    else if (effectType === 'vr') {
        const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(6.2, 4.2, 0.5));
        activeMesh = new THREE.LineSegments(geo, charcoalLineMat);
        
        customUpdate = (localPoint, time) => {
            activeMesh.rotation.y = localPoint.x * 0.15;
            activeMesh.rotation.x = -localPoint.y * 0.15;
            // Add a slight jitter/glitch effect simulating VR instability
            if (Math.random() > 0.95) {
                activeMesh.position.x = (Math.random() - 0.5) * 0.1;
            } else {
                activeMesh.position.x = 0;
            }
        };
    }

    physicsGroup.add(activeMesh);

    // HOVER IN
    group.userData.hoverIn = () => {
        gsap.to(activeMesh.material, { opacity: 0.6, duration: 0.4 });
        gsap.to(physicsGroup.position, { z: 1.0, duration: 0.6, ease: "back.out(1.5)" });
    };
    
    // HOVER OUT
    group.userData.hoverOut = () => {
        gsap.to(activeMesh.material, { opacity: 0, duration: 0.3 });
        gsap.to(physicsGroup.position, { z: 0, duration: 0.5 });
        
        gsap.to(group.rotation, { 
            x: 0, y: group.userData.baseRotationY, duration: 0.6, ease: "power2.out" 
        });
    };
    
    // THE UNIFIED UPDATE LOOP
    group.userData.hoverUpdate = (localPoint, time) => {
        // 1. The universal magnetic tilt (the physical weight of the card)
        const tiltX = (localPoint.x / 3) * 0.15; 
        const tiltY = (localPoint.y / 2) * 0.15; 
        
        gsap.to(group.rotation, {
            x: -tiltY,
            y: group.userData.baseRotationY + tiltX,
            duration: 0.3,
            ease: "power1.out"
        });

        // 2. Run the custom math we defined above for this specific card
        customUpdate(localPoint, time);
    };
}

function createExplodedProject(imagePath, x, y, z, rotationY, effectType) {
    const group = new THREE.Group();
    // Store the base rotation so the card knows where to return after a hover tilt
    group.userData.baseRotationY = rotationY;

    // 1. Image Mesh
    const imgGeo = new THREE.PlaneGeometry(6, 4);
    const imgMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const imgMesh = new THREE.Mesh(imgGeo, imgMat);
    imgMesh.position.z = 0.05;
    imgMesh.renderOrder = 2; 
    group.add(imgMesh);

    textureLoader.load(imagePath, (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        imgMat.map = texture;
        imgMat.needsUpdate = true;
    });

    // 2. Glass Border
    const glassGeo = new THREE.BoxGeometry(6.4, 4.4, 0.3);
    const glassFrame = new THREE.Mesh(glassGeo, glassMat);
    glassFrame.renderOrder = 1;
    group.add(glassFrame);

    // 3. Shadow
    const shadowGeo = new THREE.PlaneGeometry(6.6, 4.6);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1C1C1E, transparent: true, opacity: 0.08 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.z = -0.25;
    group.add(shadowMesh);

    group.position.set(x, y, z);
    group.rotation.y = rotationY;
    
    group.userData = { ...group.userData, shadowMesh, imgMesh, glassFrame, isHovered: false };
    
    // Attach the unified physics engine
    attachPhysics(group, effectType);
    
    scene.add(group);
    projectGroups.push(group);
}

// Ensure .png extensions are used precisely
const p1_X = isMobile ? 0 : -3.8;
const p2_X = isMobile ? 0 : 3.8;

createExplodedProject('assets/go-kart.png', p1_X, 1, -10, isMobile ? 0 : 0.2, 'kart'); 
createExplodedProject('assets/proximate.png', p2_X, 1, -20, isMobile ? 0 : -0.2, 'civic'); 
createExplodedProject('assets/finance.png', p1_X, 1, -30, isMobile ? 0 : 0.2, 'finance'); 
createExplodedProject('assets/uriki.png', p2_X, 1, -40, isMobile ? 0 : -0.2, 'health'); 
createExplodedProject('assets/fortis.png', p1_X, 1, -50, isMobile ? 0 : 0.2, 'app'); 
createExplodedProject('assets/vr-restaurant.png', p2_X, 1, -60, isMobile ? 0 : -0.2, 'vr'); 

// ==========================================
// 4. GSAP CAMERA FLIGHT
// ==========================================
gsap.to(camera.position, {
    z: -65, 
    ease: "none",
    scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.0 // This must remain 1.0 to prevent "lag" behind the text
    }
});

// ==========================================
// 5. RAYCASTING (Interactive Hover)
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetX = 0, targetY = 0;

if (!isMobile) {
    window.addEventListener('mousemove', (event) => {
        targetX = (event.clientX / window.innerWidth) * 2 - 1;
        targetY = -(event.clientY / window.innerHeight) * 2 + 1;
        mouse.x = targetX;
        mouse.y = targetY;
    });
}

// ==========================================
// 6. RENDER LOOP & PHYSICS
// ==========================================
const clock = new THREE.Clock();
const wavePositions = waveMesh.geometry.attributes.position.array; 

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    // Wave physics
    for(let i = 0; i < wavePositions.length; i += 3) {
        const x = wavePositions[i];
        const y = wavePositions[i+1];
        wavePositions[i+2] = Math.sin(elapsedTime * 0.5 + x * 0.2) * 0.8 + Math.cos(elapsedTime * 0.5 + y * 0.2) * 0.8;
    }
    waveMesh.geometry.attributes.position.needsUpdate = true;

    // Camera Parallax & Raycasting Logic
    if (!isMobile) {
        camera.position.x += (targetX * 1.5 - camera.position.x) * 0.05;
        camera.position.y += (targetY * 1.5 + 2 - camera.position.y) * 0.05;
        
        raycaster.setFromCamera(mouse, camera);

        projectGroups.forEach(group => {
            const intersects = raycaster.intersectObject(group.userData.glassFrame);
            
            if (intersects.length > 0) {
                // HOVER TRIGGERED
                if (!group.userData.isHovered) {
                    group.userData.isHovered = true;
                    document.body.style.cursor = 'pointer';
                    
                    gsap.to(group.userData.glassFrame.position, { z: 0.6, duration: 0.4 });
                    gsap.to(group.userData.imgMesh.position, { z: 0.65, duration: 0.4 });
                    gsap.to(group.userData.shadowMesh.position, { z: -0.6, duration: 0.4 });
                    
                    if(group.userData.hoverIn) group.userData.hoverIn();
                }
                
                // Track mouse on the surface of the card for the tilt calculations
                const localPoint = group.worldToLocal(intersects[0].point.clone());
                if(group.userData.hoverUpdate) group.userData.hoverUpdate(localPoint, elapsedTime);

            } else if (intersects.length === 0 && group.userData.isHovered) {
                // MOUSE LEFT THE CARD
                group.userData.isHovered = false;
                document.body.style.cursor = 'default';
                
                gsap.to(group.userData.glassFrame.position, { z: 0, duration: 0.4 });
                gsap.to(group.userData.imgMesh.position, { z: 0.05, duration: 0.4 });
                gsap.to(group.userData.shadowMesh.position, { z: -0.25, duration: 0.4 });
                
                if(group.userData.hoverOut) group.userData.hoverOut();
            }
        });
    }

    // Idle floating for all projects (only applied on Y axis to not break hover tilt)
    projectGroups.forEach((group, index) => {
        group.position.y = Math.sin(elapsedTime * 0.5 + index) * 0.2 + 1;
    });

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
});

window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        tick(); 
    }, 1500); 
});

if (!isMobile) {
    const interactiveBtns = document.querySelectorAll('.magnetic-btn');
    interactiveBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) * 0.4; 
            const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
            gsap.to(btn, { x: x, y: y, duration: 0.6, ease: "power3.out" });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 1.5, ease: "elastic.out(1, 0.3)" });
        });
    });
}