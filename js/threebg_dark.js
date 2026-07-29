/**
 * Focussium — Animated Space Nebula Background
 * File: js/threebg.js
 * Requires: Three.js r128 loaded via CDN
 * ES5 compatible, no modules
 */

window.initThreeBg = function() {
    var container = document.getElementById('threeJsBg');
    if (!container) {
        console.warn('Focussium BG: #threeJsBg container not found');
        return;
    }

    if (typeof THREE === 'undefined') {
        console.warn('Focussium BG: THREE.js not loaded');
        return;
    }

    var isMobile = window.innerWidth < 768;
    var PARTICLE_COUNT = isMobile ? 1000 : 3000;
    var SPHERE_RADIUS = 120;

    // ---- helpers ----
    function hexToRgb(hex) {
        return {
            r: ((hex >> 16) & 0xff) / 255,
            g: ((hex >> 8) & 0xff) / 255,
            b: (hex & 0xff) / 255
        };
    }

    function randomInSphere(radius) {
        var u = Math.random();
        var v = Math.random();
        var theta = 2 * Math.PI * u;
        var phi = Math.acos(2 * v - 1);
        var r = radius * Math.cbrt(Math.random());
        return {
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi)
        };
    }

    // ---------- SCENE ----------
    var scene = new THREE.Scene();

    // ---------- CAMERA ----------
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // ---------- RENDERER ----------
    var renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
        console.warn('Focussium BG: WebGL not supported');
        return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    var clock = new THREE.Clock();

    // ============ PARTICLES ============
    var positions = new Float32Array(PARTICLE_COUNT * 3);
    var pColors   = new Float32Array(PARTICLE_COUNT * 3);
    var pSizes    = new Float32Array(PARTICLE_COUNT);
    var pOpacities= new Float32Array(PARTICLE_COUNT);
    var velocities = [];

    var colWhite  = hexToRgb(0xF0F4FF);
    var colCyan   = hexToRgb(0x00E5FF);
    var colPurple = hexToRgb(0x7B2DFF);

    for (var i = 0; i < PARTICLE_COUNT; i++) {
        var p = randomInSphere(SPHERE_RADIUS);
        positions[i * 3]     = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;

        pSizes[i] = 0.15 + Math.random() * 0.25;

        var rand = Math.random();
        var c, op;
        if (rand < 0.7) {
            c = colWhite;
            op = 0.3 + Math.random() * 0.3;
        } else if (rand < 0.9) {
            c = colCyan;
            op = 0.5 + Math.random() * 0.3;
        } else {
            c = colPurple;
            op = 0.3 + Math.random() * 0.2;
        }
        pColors[i * 3]     = c.r;
        pColors[i * 3 + 1] = c.g;
        pColors[i * 3 + 2] = c.b;
        pOpacities[i] = op;

        velocities.push({
            x: (Math.random() - 0.5) * 0.002,
            y: (Math.random() - 0.5) * 0.002,
            z: (Math.random() - 0.5) * 0.002
        });
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor',   new THREE.BufferAttribute(pColors, 3));
    geometry.setAttribute('aSize',    new THREE.BufferAttribute(pSizes, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(pOpacities, 1));

    var vertexShader = [
        'attribute float aSize;',
        'attribute float aOpacity;',
        'attribute vec3 aColor;',
        'varying vec3 vColor;',
        'varying float vOpacity;',
        'uniform float uPixelRatio;',
        'uniform float uScale;',
        'void main() {',
        '    vColor = aColor;',
        '    vOpacity = aOpacity;',
        '    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '    float depth = max(-mvPosition.z, 1.0);',
        '    float depthMult = 1.0;',
        '    if (position.z > 20.0) {',
        '        depthMult = 1.0 + (position.z - 20.0) * 0.015;',
        '    } else if (position.z < -20.0) {',
        '        depthMult = 1.0 + (position.z + 20.0) * 0.008;',
        '    }',
        '    depthMult = clamp(depthMult, 0.4, 2.5);',
        '    gl_PointSize = aSize * depthMult * (uScale / depth) * uPixelRatio;',
        '    gl_Position = projectionMatrix * mvPosition;',
        '}'
    ].join('\n');

    var fragmentShader = [
        'varying vec3 vColor;',
        'varying float vOpacity;',
        'void main() {',
        '    vec2 uv = gl_PointCoord - vec2(0.5);',
        '    float dist = length(uv);',
        '    if (dist > 0.5) discard;',
        '    float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;',
        '    vec3 col = vColor + vec3(smoothstep(0.2, 0.0, dist)) * 0.25;',
        '    gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    var pointsMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            uPixelRatio: { value: renderer.getPixelRatio() },
            uScale:      { value: window.innerHeight * 0.5 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    var points = new THREE.Points(geometry, pointsMaterial);
    scene.add(points);

    // ============ NEBULA CLOUDS ============
    function createNebulaTexture() {
        var size = 256;
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
        g.addColorStop(0.25, 'rgba(255,255,255,0.5)');
        g.addColorStop(0.6, 'rgba(255,255,255,0.15)');
        g.addColorStop(1.0, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(canvas);
    }

    var nebulaTexture = createNebulaTexture();
    var nebulaSprites = [];
    var nebulaColorOptions = [0x00E5FF, 0x7B2DFF];

    for (var n = 0; n < 5; n++) {
        var spriteMat = new THREE.SpriteMaterial({
            map: nebulaTexture,
            color: nebulaColorOptions[n % 2],
            transparent: true,
            opacity: 0.03 + Math.random() * 0.03,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            fog: false
        });
        var sprite = new THREE.Sprite(spriteMat);
        var sc = 30 + Math.random() * 30;
        sprite.scale.set(sc, sc, 1);

        var sp = randomInSphere(80);
        sprite.position.set(sp.x, sp.y, sp.z);

        sprite.userData.velocity = {
            x: (Math.random() - 0.5) * 0.002,
            y: (Math.random() - 0.5) * 0.002,
            z: (Math.random() - 0.5) * 0.002
        };

        scene.add(sprite);
        nebulaSprites.push(sprite);
    }

    // ============ ANIMATION LOOP ============
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

        var posAttr = geometry.attributes.position;
        var arr = posAttr.array;
        for (var i = 0; i < PARTICLE_COUNT; i++) {
            var idx = i * 3;
            velocities[i].x += (Math.random() - 0.5) * 0.0001;
            velocities[i].y += (Math.random() - 0.5) * 0.0001;
            velocities[i].z += (Math.random() - 0.5) * 0.0001;
            velocities[i].x *= 0.98;
            velocities[i].y *= 0.98;
            velocities[i].z *= 0.98;
            arr[idx]     += velocities[i].x;
            arr[idx + 1] += velocities[i].y;
            arr[idx + 2] += velocities[i].z;
        }
        posAttr.needsUpdate = true;

        for (var s = 0; s < nebulaSprites.length; s++) {
            var spr = nebulaSprites[s];
            spr.position.x += spr.userData.velocity.x * 0.1;
            spr.position.y += spr.userData.velocity.y * 0.1;
            spr.position.z += spr.userData.velocity.z * 0.1;
        }

        camera.rotation.y += 0.0003;

        timeSinceLastRender = 0;
        renderer.render(scene, camera);
    }

    // ============ VISIBILITY API ============
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            isPaused = true;
        } else if (isPaused) {
            isPaused = false;
            clock.getDelta();
            timeSinceLastRender = 0;
            requestAnimationFrame(animate);
        }
    });

    // ============ RESIZE HANDLER ============
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        var pr = Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pr);
        pointsMaterial.uniforms.uPixelRatio.value = pr;
        pointsMaterial.uniforms.uScale.value = window.innerHeight * 0.5;
    });

    requestAnimationFrame(animate);
};

// Auto initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initThreeBg);
} else {
    window.initThreeBg();
}
