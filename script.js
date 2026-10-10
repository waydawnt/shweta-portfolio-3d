gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. SCENE SETUP
// ==========================================
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xFBFBF9, 6, 15);

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
const loadingManager = new THREE.LoadingManager();
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    loaderBar.style.width = `${progress}%`;
    loaderText.innerText = `${Math.floor(progress)}%`;
};

loadingManager.onLoad = () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        tick(); 
    }, 500);
};

const textureLoader = new THREE.TextureLoader(loadingManager);
const projectGroups = [];

const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.1, roughness: 0.1, transmission: 0.9,
    transparent: true, opacity: 0.85, ior: 1.45, thickness: 0.8,
});

function attachPhysics(group, effectType) {
    const physicsGroup = new THREE.Group();
    physicsGroup.position.z = 0.5; 
    group.add(physicsGroup);

    const terracottaPointMat = new THREE.PointsMaterial({ color: 0xD85A42, size: 0.05, transparent: true, opacity: 0 });
    const charcoalLineMat = new THREE.LineBasicMaterial({ color: 0x1C1C1E, transparent: true, opacity: 0 });

    let activeMesh;
    let customUpdate = () => {}; 

    if (effectType === 'kart') {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(150 * 3);
        for(let i=0; i<150*3; i+=3) {
            pos[i] = (Math.random() - 0.5) * 6; 
            pos[i+1] = (Math.random() - 0.5) * 4; 
            pos[i+2] = (Math.random() - 0.5) * 1; 
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        activeMesh = new THREE.Points(geo, terracottaPointMat);
        
        customUpdate = (localPoint, time) => {
            const positions = activeMesh.geometry.attributes.position.array;
            for(let i=0; i<positions.length; i+=3) {
                positions[i] += 0.15; 
                if(positions[i] > 3) positions[i] = -3; 
                const dist = Math.abs(positions[i] - localPoint.x);
                if (dist < 0.5) {
                    positions[i+1] += (localPoint.y > 0 ? 0.02 : -0.02);
                } else {
                    positions[i+1] += (0 - positions[i+1]) * 0.01; 
                }
            }
            activeMesh.geometry.attributes.position.needsUpdate = true;
        };
    } else if (effectType === 'civic') {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(8 * 3);
        for(let i=0; i<24; i++) pos[i] = (Math.random() - 0.5) * 4;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        activeMesh = new THREE.LineSegments(geo, charcoalLineMat);

        const initialPos = new Float32Array(pos);

        customUpdate = (localPoint, time) => {
            const positions = activeMesh.geometry.attributes.position.array;
            for(let i=0; i<24; i+=3) {
                positions[i] = initialPos[i] + Math.sin(time * 0.5 + i) * 0.5;
                positions[i+1] = initialPos[i+1] + Math.cos(time * 0.5 + i) * 0.5;
                const dist = Math.sqrt(Math.pow(positions[i]-localPoint.x, 2) + Math.pow(positions[i+1]-localPoint.y, 2));
                if (dist < 2) {
                    positions[i] += (localPoint.x - positions[i]) * 0.05;
                    positions[i+1] += (localPoint.y - positions[i+1]) * 0.05;
                }
            }
            activeMesh.geometry.attributes.position.needsUpdate = true;
        };
    } else if (effectType === 'finance') {
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
                positions[i+1] += 0.02; 
                if (positions[i+1] > 2) positions[i+1] = -2; 
                const dx = positions[i] - localPoint.x;
                const dy = positions[i+1] - localPoint.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 1) {
                    positions[i] += dx * 0.05;
                }
            }
            activeMesh.geometry.attributes.position.needsUpdate = true;
        };
    } else if (effectType === 'health') {
        const geo = new THREE.RingGeometry(1.5, 1.6, 64);
        const mat = new THREE.MeshBasicMaterial({ color: 0xD85A42, transparent: true, opacity: 0, side: THREE.DoubleSide });
        activeMesh = new THREE.Mesh(geo, mat);

        customUpdate = (localPoint, time) => {
            const scale = 1 + Math.sin(time * 1.5) * 0.15;
            activeMesh.scale.set(scale, scale, 1);
            activeMesh.position.x += (localPoint.x - activeMesh.position.x) * 0.05;
            activeMesh.position.y += (localPoint.y - activeMesh.position.y) * 0.05;
        };
    } else if (effectType === 'app') {
        const geo = new THREE.PlaneGeometry(6, 0.05);
        const mat = new THREE.MeshBasicMaterial({ color: 0xD85A42, transparent: true, opacity: 0 });
        activeMesh = new THREE.Mesh(geo, mat);

        customUpdate = (localPoint, time) => {
            activeMesh.position.y = Math.sin(time * 2) * 2;
            activeMesh.rotation.z = localPoint.x * 0.05;
        };
    } else if (effectType === 'vr') {
        const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(6.2, 4.2, 0.5));
        activeMesh = new THREE.LineSegments(geo, charcoalLineMat);
        
        customUpdate = (localPoint, time) => {
            activeMesh.rotation.y = localPoint.x * 0.15;
            activeMesh.rotation.x = -localPoint.y * 0.15;
            if (Math.random() > 0.95) {
                activeMesh.position.x = (Math.random() - 0.5) * 0.1;
            } else {
                activeMesh.position.x = 0;
            }
        };
    }

    physicsGroup.add(activeMesh);

    group.userData.hoverIn = () => {
        gsap.to(activeMesh.material, { opacity: 0.6, duration: 0.4 });
        gsap.to(physicsGroup.position, { z: 1.0, duration: 0.6, ease: "back.out(1.5)" });
    };
    
    group.userData.hoverOut = () => {
        gsap.to(activeMesh.material, { opacity: 0, duration: 0.3 });
        gsap.to(physicsGroup.position, { z: 0, duration: 0.5 });
        gsap.to(group.rotation, { x: 0, y: group.userData.baseRotationY, duration: 0.6, ease: "power2.out" });
    };
    
    group.userData.hoverUpdate = (localPoint, time) => {
        const tiltX = (localPoint.x / 3) * 0.15; 
        const tiltY = (localPoint.y / 2) * 0.15; 
        gsap.to(group.rotation, {
            x: -tiltY, y: group.userData.baseRotationY + tiltX, duration: 0.3, ease: "power1.out"
        });
        customUpdate(localPoint, time);
    };
}

function createExplodedProject(imagePath, align, baseZ, effectType) {
    const group = new THREE.Group();
    group.userData.align = align;
    group.userData.baseZ = baseZ;

    // FLAWLESS ORIGINAL IMAGE LOGIC
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

    const glassGeo = new THREE.BoxGeometry(6.4, 4.4, 0.3);
    const glassFrame = new THREE.Mesh(glassGeo, glassMat);
    glassFrame.renderOrder = 1;
    group.add(glassFrame);

    const shadowGeo = new THREE.PlaneGeometry(6.6, 4.6);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1C1C1E, transparent: true, opacity: 0.08 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.z = -0.25;
    group.add(shadowMesh);

    group.userData = { ...group.userData, shadowMesh, imgMesh, glassFrame, isHovered: false };
    
    attachPhysics(group, effectType);
    scene.add(group);
    projectGroups.push(group);
}

// Create projects with abstract alignment ('left' or 'right')
createExplodedProject('assets/go-kart.webp', 'left', -10, 'kart'); 
createExplodedProject('assets/proximate.webp', 'right', -20, 'civic'); 
createExplodedProject('assets/finance.webp', 'left', -30, 'finance'); 
createExplodedProject('assets/uriki.webp', 'right', -40, 'health'); 
createExplodedProject('assets/fortis.webp', 'left', -50, 'app'); 
createExplodedProject('assets/vr-restaurant.webp', 'right', -60, 'vr'); 

// ==========================================
// 3.5 THE SKILL NETWORK (Spider Web Mind Map)
// ==========================================
const skillGroup = new THREE.Group();
scene.add(skillGroup);

const skills = [
    { text: "STRATEGY", pos: [0, 1.5, 0] },
    { text: "UX RESEARCH", pos: [-2, 0.5, 1] },
    { text: "SYSTEMS THINKING", pos: [2, 0.5, -1] },
    { text: "BEHAVIORAL DESIGN", pos: [-1.5, -1.5, 0] },
    { text: "SERVICE DESIGN", pos: [1.5, -1.5, 1] }
];

const nodeElements = [];
const linePositions = [];

function createDataLabel(message) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    context.fillStyle = 'rgba(251, 251, 249, 0)'; 
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = '600 36px Inter, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.letterSpacing = "2px";
    
    context.fillStyle = '#1C1C1E'; 
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4, 1, 1); 
    return sprite;
}

const nodeGeo = new THREE.SphereGeometry(0.1, 16, 16);
const nodeMat = new THREE.MeshBasicMaterial({ color: 0xD85A42 }); 

skills.forEach((skill, index) => {
    const dot = new THREE.Mesh(nodeGeo, nodeMat);
    dot.position.set(skill.pos[0], skill.pos[1], skill.pos[2]);
    skillGroup.add(dot);

    const label = createDataLabel(skill.text);
    label.position.set(skill.pos[0], skill.pos[1] + 0.3, skill.pos[2]);
    skillGroup.add(label);

    nodeElements.push({
        dot: dot, label: label, ox: skill.pos[0], oy: skill.pos[1], oz: skill.pos[2],
        speed: 0.5 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2
    });
    linePositions.push(skill.pos[0], skill.pos[1], skill.pos[2]);
});

const lineGeo = new THREE.BufferGeometry();
lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
const lineIndex = [0,1, 1,3, 3,4, 4,2, 2,0, 0,3, 1,4, 1,2];
lineGeo.setIndex(lineIndex);

const webMat = new THREE.LineBasicMaterial({ color: 0xD85A42, transparent: true, opacity: 0.3 });
const webLines = new THREE.LineSegments(lineGeo, webMat);
skillGroup.add(webLines);

const titleLabel = createDataLabel("CORE COMPETENCIES");
titleLabel.material.color.setHex(0xD85A42); 
titleLabel.scale.set(3, 0.75, 1);
titleLabel.position.set(0, 2.2, 0);
skillGroup.add(titleLabel);

// ==========================================
// 4. GSAP CAMERA FLIGHT
// ==========================================
gsap.to(camera.position, {
    z: -75, 
    ease: "none",
    scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.0 
    }
});

// ==========================================
// 5. RAYCASTING & RESIZING (Dynamic Layout)
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetX = 0, targetY = 0;

window.addEventListener('mousemove', (event) => {
    if (window.innerWidth >= 768) {
        targetX = (event.clientX / window.innerWidth) * 2 - 1;
        targetY = -(event.clientY / window.innerHeight) * 2 + 1;
        mouse.x = targetX;
        mouse.y = targetY;
    }
});

// THE BRAIN: Dynamically positions 3D elements based on the exact screen size
let layout = { mobile: false, xOffset: 3.8, yOffset: 1, scale: 1, webY: 1, webX: -3.5 };

function updateLayout() {
    const w = window.innerWidth;
    
    if (w < 768) {
        // Mobile Phones
        layout = { mobile: true, xOffset: 0, yOffset: 2.5, scale: 0.65, webY: 2.5, webX: 0 };
    } else if (w < 1200) {
        // Laptops & Tablets
        layout = { mobile: false, xOffset: 2.8, yOffset: 1, scale: 0.8, webY: 1, webX: -2.5 };
    } else {
        // Large Desktops
        layout = { mobile: false, xOffset: 3.8, yOffset: 1, scale: 1, webY: 1, webX: -3.5 };
    }

    projectGroups.forEach(group => {
        group.scale.set(layout.scale, layout.scale, layout.scale);
        
        const dir = group.userData.align === 'left' ? -1 : 1;
        group.position.x = layout.mobile ? 0 : dir * layout.xOffset;
        group.position.z = group.userData.baseZ;
        
        const rotY = layout.mobile ? 0 : (group.userData.align === 'left' ? 0.2 : -0.2);
        group.userData.baseRotationY = rotY;
        if (!group.userData.isHovered) group.rotation.y = rotY;
    });

    skillGroup.scale.set(layout.scale, layout.scale, layout.scale);
    skillGroup.position.x = layout.webX;
    
    // PERFECT FIX: Ensure the Spider Web is locked to the exact Z-Depth of the Experience Screen
    skillGroup.position.z = -70; 
}

// Run layout calculator on load and whenever the screen is resized
updateLayout();
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    updateLayout();
});

// ==========================================
// 6. RENDER LOOP
// ==========================================
const clock = new THREE.Clock();
const wavePositions = waveMesh.geometry.attributes.position.array; 

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    for(let i = 0; i < wavePositions.length; i += 3) {
        const x = wavePositions[i];
        const y = wavePositions[i+1];
        wavePositions[i+2] = Math.sin(elapsedTime * 0.5 + x * 0.2) * 0.8 + Math.cos(elapsedTime * 0.5 + y * 0.2) * 0.8;
    }
    waveMesh.geometry.attributes.position.needsUpdate = true;

    if (window.innerWidth >= 768) {
        camera.position.x += (targetX * 1.5 - camera.position.x) * 0.05;
        camera.position.y += (targetY * 1.5 + 2 - camera.position.y) * 0.05;
        
        raycaster.setFromCamera(mouse, camera);

        projectGroups.forEach(group => {
            const intersects = raycaster.intersectObject(group.userData.glassFrame);
            
            if (intersects.length > 0) {
                if (!group.userData.isHovered) {
                    group.userData.isHovered = true;
                    document.body.style.cursor = 'pointer';
                    
                    gsap.to(group.userData.glassFrame.position, { z: 0.6, duration: 0.4 });
                    gsap.to(group.userData.imgMesh.position, { z: 0.65, duration: 0.4 });
                    gsap.to(group.userData.shadowMesh.position, { z: -0.6, duration: 0.4 });
                    
                    if(group.userData.hoverIn) group.userData.hoverIn();
                }
                const localPoint = group.worldToLocal(intersects[0].point.clone());
                if(group.userData.hoverUpdate) group.userData.hoverUpdate(localPoint, elapsedTime);

            } else if (intersects.length === 0 && group.userData.isHovered) {
                group.userData.isHovered = false;
                document.body.style.cursor = 'default';
                
                gsap.to(group.userData.glassFrame.position, { z: 0, duration: 0.4 });
                gsap.to(group.userData.imgMesh.position, { z: 0.05, duration: 0.4 });
                gsap.to(group.userData.shadowMesh.position, { z: -0.25, duration: 0.4 });
                
                if(group.userData.hoverOut) group.userData.hoverOut();
            }
        });
    }

    projectGroups.forEach((group, index) => {
        group.position.y = Math.sin(elapsedTime * 0.5 + index) * 0.2 + layout.yOffset;
    });

    skillGroup.position.y = Math.sin(elapsedTime * 0.5) * 0.2 + layout.webY;
    
    if (window.innerWidth >= 768) {
        skillGroup.rotation.y = targetX * 0.2;
        skillGroup.rotation.x = -targetY * 0.2;
    }
    
    const currentLinePositions = webLines.geometry.attributes.position.array;
    nodeElements.forEach((el, i) => {
        const dx = Math.sin(elapsedTime * el.speed + el.offset) * 0.2;
        const dy = Math.cos(elapsedTime * el.speed * 0.8 + el.offset) * 0.2;
        const dz = Math.sin(elapsedTime * el.speed * 1.2) * 0.2;

        el.dot.position.set(el.ox + dx, el.oy + dy, el.oz + dz);
        el.label.position.set(el.ox + dx, el.oy + dy + 0.3, el.oz + dz);

        const i3 = i * 3;
        currentLinePositions[i3] = el.dot.position.x;
        currentLinePositions[i3+1] = el.dot.position.y;
        currentLinePositions[i3+2] = el.dot.position.z;
    });
    
    webLines.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

if (window.innerWidth >= 768) {
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