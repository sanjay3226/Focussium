/**
 * Focussium — Light Theme Apple-Grade Ethereal Atmosphere
 * File: js/threebg_light.js
 * Requires: Three.js r128 loaded via CDN
 * ES5 compatible, no modules
 */

window.initThreeBgLight = function () {
    var container = document.getElementById('threeJsBg');
    if (!container) {
        console.warn('Focussium Light BG: #threeJsBg container not found');
        return;
    }

    if (typeof THREE === 'undefined') {
        console.warn('Focussium Light BG: THREE.js not loaded');
        return;
    }

    container.innerHTML = '';

    var isMobile = window.innerWidth < 768;
    var PARTICLE_COUNT = isMobile ? 400 : 1200;
    var ORB_COUNT = isMobile ? 4 : 8;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    var renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
        console.warn('Focussium Light BG: WebGL not supported');
        return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    var clock = new THREE.Clock();

    // ---------- LIGHTING ----------
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.9);
    scene.add(ambientLight);

    // ============ FLOATING SOFT ETHEREAL ORBS ============
    var orbColors = [0x38B6FF, 0xA78BFA, 0x3DD9B8, 0xFF85A1]; // Sky, Lavender, Mint, Soft Rose
    var orbs = [];

    for (var i = 0; i < ORB_COUNT; i++) {
        var radius = 6 + Math.random() * 8; // Soft large spheres
        var geometry = new THREE.IcosahedronGeometry(radius, 3);

        var colorChoice = orbColors[i % orbColors.length];

        var material = new THREE.MeshBasicMaterial({
            color: colorChoice,
            transparent: true,
            opacity: 0.05 + Math.random() * 0.05, // Ultra soft 5% - 10% opacity
            depthWrite: false
        });

        var orb = new THREE.Mesh(geometry, material);

        var startX = -40 + Math.random() * 80;
        var startY = -40 + Math.random() * 80;
        var startZ = -30 + Math.random() * 40;

        orb.position.set(startX, startY, startZ);

        orb.userData = {
            baseX: startX,
            baseY: startY,
            baseZ: startZ,
            ampX: 3 + Math.random() * 5,
            ampY: 3 + Math.random() * 5,
            speedX: 0.05 + Math.random() * 0.1,
            speedY: 0.05 + Math.random() * 0.1,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2
        };

        scene.add(orb);
        orbs.push(orb);
    }

    // ============ LIGHT DUST PARTICLES ============
    var particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    var particleColors = new Float32Array(PARTICLE_COUNT * 3);

    var colSky = new THREE.Color(0x0284C7);
    var colPurple = new THREE.Color(0x8B5CF6);
    var colRose = new THREE.Color(0xFB7185);

    for (var p = 0; p < PARTICLE_COUNT; p++) {
        particlePositions[p * 3] = -50 + Math.random() * 100;
        particlePositions[p * 3 + 1] = -50 + Math.random() * 100;
        particlePositions[p * 3 + 2] = -30 + Math.random() * 60;

        var rVal = Math.random();
        var c = rVal < 0.4 ? colSky : (rVal < 0.7 ? colPurple : colRose);
        particleColors[p * 3] = c.r;
        particleColors[p * 3 + 1] = c.g;
        particleColors[p * 3 + 2] = c.b;
    }

    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    var particleMat = new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
    });

    var particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    var isPaused = false;
    var timeSinceLastRender = 0;
    var FRAME_INTERVAL = 1 / 60;

    function animate() {
        if (isPaused) return;
        requestAnimationFrame(animate);

        var delta = clock.getDelta();
        timeSinceLastRender += delta;
        if (timeSinceLastRender < FRAME_INTERVAL) return;
        if (timeSinceLastRender > 0.1) timeSinceLastRender = FRAME_INTERVAL;

        var time = clock.elapsedTime;

        for (var o = 0; o < orbs.length; o++) {
            var orb = orbs[o];
            var ud = orb.userData;

            orb.position.x = ud.baseX + Math.sin(time * ud.speedX + ud.phaseX) * ud.ampX;
            orb.position.y = ud.baseY + Math.cos(time * ud.speedY + ud.phaseY) * ud.ampY;

            orb.rotation.x += 0.001;
            orb.rotation.y += 0.001;
        }

        particleSystem.rotation.y += 0.0003;
        particleSystem.rotation.x += 0.0001;

        timeSinceLastRender = 0;
        renderer.render(scene, camera);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            isPaused = true;
        } else if (isPaused) {
            isPaused = false;
            clock.getDelta();
            timeSinceLastRender = 0;
            requestAnimationFrame(animate);
        }
    });

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    requestAnimationFrame(animate);
};
