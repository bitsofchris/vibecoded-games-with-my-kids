// Game Controller - Main game logic and render loop
import { CONFIG } from './config.js';
import { Cat } from './entities/Cat.js';
import { Spawner } from './systems/Spawner.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { LevelManager } from './systems/LevelManager.js';
import { Snow } from './systems/Snow.js';
import { SoundManager } from './systems/SoundManager.js';

export class Game {
    constructor(canvas, settings = null) {
        this.canvas = canvas;
        
        // Game settings (from settings panel)
        this.settings = {
            yarnDensity: 1.5,
            obstacleDensity: 2,
            catSpeed: 1,
            startingLevel: 1
        };
        if (settings) {
            this.applySettings(settings);
        }
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.phase = 'collection';  // 'collection', 'transition', 'water', 'end'
        
        // Level system
        this.currentLevel = this.settings.startingLevel;
        
        // Stun state (when hitting obstacles)
        this.isStunned = false;
        this.stunEndTime = 0;
        this.stunDuration = 500;  // milliseconds
        
        // Level screen pause (don't scroll while showing level number)
        this.levelScreenVisible = false;
        
        // Bridge completion state
        this.bridgeComplete = false;
        this.ranOutOfYarn = false;  // Track if cat ran out of yarn before reaching shore
        
        // Stats
        this.distanceTraveled = 0;
        this.yarnCollected = 0;
        this.bridgeDistance = 0;
        
        // Touch state for swipe detection
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchStartTime = null;
        
        // Objects
        this.groundTiles = [];
        this.snowTiles = [];  // Snow banks alongside the path
        this.yarns = [];
        this.triangles = [];
        this.bridges = [];
        
        // Spawning state
        this.lastSpawnZ = 0;
        this.nextRowZ = -10;  // First row spawns at Z = -10
        
        // Three.js setup
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLighting();
        
        // Load textures
        this.textureLoader = new THREE.TextureLoader();
        
        // Ground texture
        this.groundTexture = this.textureLoader.load('kenney_pattern-pack/PNG/Default/pattern_22.png');
        this.groundTexture.wrapS = THREE.RepeatWrapping;
        this.groundTexture.wrapT = THREE.RepeatWrapping;
        this.groundTexture.repeat.set(2, 1);
        
        
        // Create player
        this.cat = new Cat(this.scene);
        
        // Create spawner system
        this.spawner = new Spawner(this.scene, this.currentLevel, this.getYarnRequired());
        // Apply density settings to spawner
        this.spawner.setDensitySettings(this.settings.yarnDensity, this.settings.obstacleDensity);
        
        // Create collision system
        this.collisionSystem = new CollisionSystem();
        this.collisionSystem.setCallbacks(
            (yarn) => this.onYarnCollect(yarn),
            (triangle) => this.onTriangleHit(triangle)
        );
        
        // Create sound manager
        this.soundManager = new SoundManager();
        
        // Create level manager
        this.levelManager = new LevelManager(this.scene, this.soundManager);
        
        // Create snow particle system
        this.snow = new Snow(this.scene);
        
        // Initial ground tiles
        this.spawnInitialGround();
        
        // Pre-generate the entire level (yarn, triangles)
        const levelEndDistance = this.getLevelEndDistance();
        const easyEndDistance = this.getEasyEndDistance();
        const mediumEndDistance = this.getMediumEndDistance();
        const yarnRequired = this.getYarnRequired();
        this.spawner.generateFullLevel(levelEndDistance, easyEndDistance, mediumEndDistance);
        
        // Create water and island at start (visible in distance)
        this.levelManager.createWater(levelEndDistance, yarnRequired);
        
        // Position camera to follow cat
        this.updateCameraPosition(true);
        
        // UI references
        this.yarnCountEl = document.getElementById('yarn-count');
        this.distanceCountEl = document.getElementById('distance-count');
        this.messageEl = document.getElementById('message-display');
        this.endScreenEl = document.getElementById('end-screen');
        this.scoreBreakdownEl = document.getElementById('score-breakdown');
        this.levelScreenEl = document.getElementById('level-screen');
        this.levelNumberEl = document.getElementById('level-number');
        this.failScreenEl = document.getElementById('fail-screen');
        this.successScreenEl = document.getElementById('success-screen');
        this.titleScreenEl = document.getElementById('title-screen');
        
        // Input handling
        this.setupInput();
        
        // Bind animate for requestAnimationFrame
        this.animate = this.animate.bind(this);
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    applySettings(settings) {
        // Update internal settings
        this.settings.yarnDensity = settings.yarnDensity;
        this.settings.obstacleDensity = settings.obstacleDensity;
        this.settings.catSpeed = settings.catSpeed;
        this.settings.startingLevel = settings.startingLevel;
        
        // If game hasn't started yet, regenerate the level with new settings
        if (!this.isRunning && this.spawner) {
            this.currentLevel = this.settings.startingLevel;
            
            // Reset and regenerate level with new settings
            this.spawner.reset();
            this.spawner.setLevelInfo(this.currentLevel, this.getYarnRequired());
            this.spawner.setDensitySettings(this.settings.yarnDensity, this.settings.obstacleDensity);
            
            // Reset level manager
            this.levelManager.reset();
            
            // Regenerate level
            const levelEndDistance = this.getLevelEndDistance();
            const easyEndDistance = this.getEasyEndDistance();
            const mediumEndDistance = this.getMediumEndDistance();
            const yarnRequired = this.getYarnRequired();
            this.spawner.generateFullLevel(levelEndDistance, easyEndDistance, mediumEndDistance);
            this.levelManager.createWater(levelEndDistance, yarnRequired);
        } else if (this.spawner) {
            // Game is running, just update density for next level
            this.spawner.setDensitySettings(this.settings.yarnDensity, this.settings.obstacleDensity);
        }
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(CONFIG.BACKGROUND_COLOR);
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // Initial position - will be updated properly once cat exists
        this.camera.position.set(0, CONFIG.CAMERA.OFFSET_Y, CONFIG.CAMERA.OFFSET_Z);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(
            CONFIG.AMBIENT_LIGHT.COLOR,
            CONFIG.AMBIENT_LIGHT.INTENSITY
        );
        this.scene.add(ambient);
        
        // Directional light
        const directional = new THREE.DirectionalLight(
            CONFIG.DIRECTIONAL_LIGHT.COLOR,
            CONFIG.DIRECTIONAL_LIGHT.INTENSITY
        );
        directional.position.set(
            CONFIG.DIRECTIONAL_LIGHT.POSITION.x,
            CONFIG.DIRECTIONAL_LIGHT.POSITION.y,
            CONFIG.DIRECTIONAL_LIGHT.POSITION.z
        );
        this.scene.add(directional);
    }
    
    setupInput() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Touch/click controls
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Touch swipe controls
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });
        
        // Restart button - support both click and touch for iOS
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            const handleRestart = () => this.restart();
            restartBtn.addEventListener('click', handleRestart);
            restartBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleRestart();
            });
        }
        
        // Retry button (on fail screen) - support both click and touch for iOS
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            const handleRetry = () => this.retryLevel();
            retryBtn.addEventListener('click', handleRetry);
            retryBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleRetry();
            });
        }
        
        // Next level button (on success screen) - support both click and touch for iOS
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            const handleNextLevel = () => this.startNextLevel();
            nextLevelBtn.addEventListener('click', handleNextLevel);
            nextLevelBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleNextLevel();
            });
        }
        
        // Quit buttons (on fail/success screens) - return to main menu
        const quitFailBtn = document.getElementById('quit-fail-btn');
        if (quitFailBtn) {
            const handleQuit = () => this.quitToMainMenu();
            quitFailBtn.addEventListener('click', handleQuit);
            quitFailBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleQuit();
            });
        }
        
        const quitSuccessBtn = document.getElementById('quit-success-btn');
        if (quitSuccessBtn) {
            const handleQuit = () => this.quitToMainMenu();
            quitSuccessBtn.addEventListener('click', handleQuit);
            quitSuccessBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleQuit();
            });
        }
    }
    
    getYarnRequired() {
        // Base requirement + per-level increase
        return CONFIG.LEVEL.BASE_YARN_REQUIRED + (this.currentLevel - 1) * CONFIG.LEVEL.YARN_PER_LEVEL;
    }
    
    getLevelEndDistance() {
        // Scale level length by 12.5% per level (10-15% range)
        // Level 1 = 150, Level 2 = 168.75, Level 3 = 189.84, etc.
        // Cap at 5x base level distance (max 750 for base 150)
        const maxDistance = CONFIG.BASE_LEVEL_DISTANCE * 5;
        const calculatedDistance = CONFIG.BASE_LEVEL_DISTANCE * Math.pow(CONFIG.LEVEL_LENGTH_MULTIPLIER, this.currentLevel - 1);
        return Math.min(calculatedDistance, maxDistance);
    }
    
    getEasyEndDistance() {
        // Easy section is 65% of level length
        return this.getLevelEndDistance() * CONFIG.DIFFICULTY.EASY_PERCENT;
    }
    
    getMediumEndDistance() {
        // Medium section ends at 85% of level length
        return this.getLevelEndDistance() * CONFIG.DIFFICULTY.MEDIUM_PERCENT;
    }
    
    handleKeyDown(e) {
        // Restart any time
        if (e.key === 'r' || e.key === 'R') {
            this.restart();
            return;
        }
        
        // Skip end sequence
        if (this.phase === 'water' && (e.key === ' ' || e.code === 'Space')) {
            // Could skip to end - for now just ignore
            return;
        }
        
        // Lane switching (only during collection phase)
        if (this.phase !== 'collection') return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            this.cat.switchLane(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            this.cat.switchLane(1);
        }
    }
    
    handleClick(e) {
        if (this.phase !== 'collection') return;
        
        // Left half = left, right half = right
        const halfWidth = window.innerWidth / 2;
        if (e.clientX < halfWidth) {
            this.cat.switchLane(-1);
        } else {
            this.cat.switchLane(1);
        }
    }
    
    handleTouchStart(e) {
        if (this.phase !== 'collection') return;
        
        // Prevent default touch behaviors (scrolling, zooming)
        e.preventDefault();
        
        // Use first touch only (ignore multi-touch)
        const touch = e.touches[0];
        if (!touch) return;
        
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = performance.now();
    }
    
    handleTouchMove(e) {
        // Prevent default to avoid scrolling during swipe
        e.preventDefault();
    }
    
    handleTouchEnd(e) {
        if (this.phase !== 'collection') {
            this.resetTouchState();
            return;
        }
        
        // Prevent default touch behaviors
        e.preventDefault();
        
        // Check if we have valid touch start data
        if (this.touchStartX === null || this.touchStartY === null || this.touchStartTime === null) {
            this.resetTouchState();
            return;
        }
        
        // Get end position from changedTouches (touches array may be empty on touchend)
        const touch = e.changedTouches[0];
        if (!touch) {
            this.resetTouchState();
            return;
        }
        
        const endX = touch.clientX;
        const endY = touch.clientY;
        const endTime = performance.now();
        
        // Calculate swipe delta
        const deltaX = endX - this.touchStartX;
        const deltaY = endY - this.touchStartY;
        const duration = endTime - this.touchStartTime;
        
        // Reset touch state
        this.resetTouchState();
        
        // Validate swipe
        const minDistance = 50; // pixels
        const minVelocity = 0.3; // pixels per millisecond
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // Check if swipe is valid:
        // 1. Minimum horizontal distance
        // 2. Primarily horizontal (horizontal distance > vertical distance)
        // 3. Minimum velocity
        if (absDeltaX >= minDistance && 
            absDeltaX > absDeltaY && 
            absDeltaX / duration >= minVelocity) {
            // Determine direction: positive deltaX = swipe right, negative = swipe left
            const direction = deltaX > 0 ? 1 : -1;
            this.cat.switchLane(direction);
        }
    }
    
    handleTouchCancel(e) {
        // Reset touch state if touch is cancelled
        this.resetTouchState();
    }
    
    resetTouchState() {
        this.touchStartX = null;
        this.touchStartY = null;
        this.touchStartTime = null;
    }
    
    spawnInitialGround() {
        // Create ground tiles from behind the cat to ahead
        for (let z = 10; z > -CONFIG.SPAWN_AHEAD_DISTANCE; z -= CONFIG.GROUND.DEPTH) {
            this.spawnGroundTile(z);
        }
    }
    
    spawnGroundTile(z) {
        const geometry = new THREE.BoxGeometry(
            CONFIG.GROUND.WIDTH,
            CONFIG.GROUND.HEIGHT,
            CONFIG.GROUND.DEPTH
        );
        
        // Use textured material for the top, solid for sides
        const topMaterial = new THREE.MeshLambertMaterial({ 
            map: this.groundTexture,
            color: 0xCCCCCC  // Slight tint
        });
        const sideMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x555555  // Dark sides
        });
        
        // Create materials array: [right, left, top, bottom, front, back]
        const materials = [
            sideMaterial, sideMaterial,
            topMaterial, sideMaterial,
            sideMaterial, sideMaterial
        ];
        
        const tile = new THREE.Mesh(geometry, materials);
        
        tile.position.set(0, -CONFIG.GROUND.HEIGHT / 2, z);
        this.scene.add(tile);
        this.groundTiles.push(tile);
        
        // Spawn snow banks on both sides of the road
        this.spawnSnowBanks(z);
        
        return tile;
    }
    
    spawnSnowBanks(z) {
        const snowWidth = 20;  // Extra wide to fill entire screen
        const snowHeight = 0.15;  // Slightly lower than road to create raised road effect
        
        // Snow material - clean icy white with subtle shine (no texture - pure snow look)
        const snowTopMaterial = new THREE.MeshPhongMaterial({
            color: 0xE8F4FF,        // Very light icy blue-white
            specular: 0xaaddff,     // Icy blue specular highlights
            shininess: 25           // Subtle shine like packed snow
        });
        const snowSideMaterial = new THREE.MeshLambertMaterial({
            color: 0xCCDDEE  // Light blue-white for snow sides
        });
        
        const snowMaterials = [
            snowSideMaterial, snowSideMaterial,
            snowTopMaterial, snowSideMaterial,
            snowSideMaterial, snowSideMaterial
        ];
        
        // Left snow bank
        const leftGeometry = new THREE.BoxGeometry(snowWidth, snowHeight, CONFIG.GROUND.DEPTH);
        const leftSnow = new THREE.Mesh(leftGeometry, snowMaterials);
        const leftX = -(CONFIG.GROUND.WIDTH / 2 + snowWidth / 2);
        leftSnow.position.set(leftX, -snowHeight / 2 - 0.1, z);  // Slightly lower than road
        this.scene.add(leftSnow);
        this.snowTiles.push(leftSnow);
        
        // Right snow bank
        const rightGeometry = new THREE.BoxGeometry(snowWidth, snowHeight, CONFIG.GROUND.DEPTH);
        const rightSnow = new THREE.Mesh(rightGeometry, snowMaterials.map(m => m.clone()));
        const rightX = CONFIG.GROUND.WIDTH / 2 + snowWidth / 2;
        rightSnow.position.set(rightX, -snowHeight / 2 - 0.1, z);
        this.scene.add(rightSnow);
        this.snowTiles.push(rightSnow);
    }
    
    updateGround() {
        const catZ = this.cat.z;
        
        // Spawn new tiles ahead, stopping RIGHT at the water edge (no gap)
        const spawnThreshold = catZ - CONFIG.SPAWN_AHEAD_DISTANCE;
        const waterEdge = this.levelManager.waterStartZ || -this.getLevelEndDistance();  // Tiles go right up to water
        const lastTile = this.groundTiles[this.groundTiles.length - 1];
        
        if (lastTile && lastTile.position.z > spawnThreshold) {
            const newZ = lastTile.position.z - CONFIG.GROUND.DEPTH;
            // Only spawn if the tile edge won't overlap water
            if (newZ + CONFIG.GROUND.DEPTH / 2 > waterEdge) {
                this.spawnGroundTile(newZ);
            }
        }
        
        // Remove tiles behind
        const despawnThreshold = catZ + CONFIG.DESPAWN_BEHIND_DISTANCE;
        while (this.groundTiles.length > 0 && this.groundTiles[0].position.z > despawnThreshold) {
            const tile = this.groundTiles.shift();
            this.scene.remove(tile);
            tile.geometry.dispose();
            // Handle array of materials
            if (Array.isArray(tile.material)) {
                tile.material.forEach(m => m.dispose());
            } else {
                tile.material.dispose();
            }
            
            // Also remove corresponding snow tiles (2 per ground tile - left and right)
            for (let i = 0; i < 2 && this.snowTiles.length > 0; i++) {
                const snowTile = this.snowTiles.shift();
                this.scene.remove(snowTile);
                snowTile.geometry.dispose();
                if (Array.isArray(snowTile.material)) {
                    snowTile.material.forEach(m => m.dispose());
                } else {
                    snowTile.material.dispose();
                }
            }
        }
    }
    
    updateCameraPosition(instant = false) {
        const targetX = 0;
        const targetY = this.cat.y + CONFIG.CAMERA.OFFSET_Y;
        const targetZ = this.cat.z + CONFIG.CAMERA.OFFSET_Z;
        
        if (instant) {
            this.camera.position.set(targetX, targetY, targetZ);
        } else {
            // Smooth follow
            const speed = CONFIG.CAMERA.FOLLOW_SPEED;
            this.camera.position.x += (targetX - this.camera.position.x) * speed;
            this.camera.position.y += (targetY - this.camera.position.y) * speed;
            this.camera.position.z += (targetZ - this.camera.position.z) * speed;
        }
        
        // Look at cat
        this.camera.lookAt(this.cat.mesh.position);
    }
    
    updateUI() {
        if (this.yarnCountEl) {
            this.yarnCountEl.textContent = this.cat.getStackCount();
        }
        if (this.distanceCountEl) {
            this.distanceCountEl.textContent = Math.floor(this.distanceTraveled);
        }
    }
    
    showMessage(text) {
        if (this.messageEl) {
            this.messageEl.textContent = text;
            this.messageEl.classList.remove('hidden');
        }
    }
    
    hideMessage() {
        if (this.messageEl) {
            this.messageEl.classList.add('hidden');
        }
    }
    
    showEndScreen(title, scoreData) {
        if (this.endScreenEl) {
            const h1 = this.endScreenEl.querySelector('h1');
            if (h1) h1.textContent = title;
            
            if (this.scoreBreakdownEl) {
                this.scoreBreakdownEl.innerHTML = `
                    <div class="score-line">Distance: ${Math.floor(scoreData.distance)} × ${CONFIG.DISTANCE_POINTS} = ${scoreData.distance * CONFIG.DISTANCE_POINTS}</div>
                    <div class="score-line">Yarn Collected: ${scoreData.yarn} × ${CONFIG.YARN_POINTS} = ${scoreData.yarn * CONFIG.YARN_POINTS}</div>
                    <div class="score-line">Bridge Distance: ${scoreData.bridge} × ${CONFIG.BRIDGE_POINTS} = ${scoreData.bridge * CONFIG.BRIDGE_POINTS}</div>
                    <div class="total">Total Score: ${scoreData.total}</div>
                `;
            }
            
            this.endScreenEl.classList.remove('hidden');
        }
    }
    
    hideEndScreen() {
        if (this.endScreenEl) {
            this.endScreenEl.classList.add('hidden');
        }
    }
    
    start() {
        this.isRunning = true;
        this.animate();
    }
    
    renderOnce() {
        // Render a single frame (for title screen background)
        this.renderer.render(this.scene, this.camera);
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.animate);
        
        if (this.isPaused) return;
        
        // Update game based on phase
        switch (this.phase) {
            case 'collection':
                this.updateCollection();
                break;
            case 'transition':
                this.updateTransition();
                break;
            case 'water':
                this.updateWater();
                break;
            case 'end':
                // Just render, no updates
                break;
        }
        
        // Always update these
        this.cat.update();
        this.updateCameraPosition();
        this.updateUI();
        
        // Update snow particles
        this.snow.update(this.camera.position);
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    updateCollection() {
        // Don't scroll while level screen is showing
        if (this.levelScreenVisible) {
            return;
        }
        
        // Check if stunned
        if (this.isStunned) {
            if (performance.now() >= this.stunEndTime) {
                this.isStunned = false;
                // Reset cat color
                this.cat.resetColors();
            } else {
                // Flash cat red while stunned
                const flash = Math.sin(performance.now() * 0.02) > 0;
                if (flash) {
                    this.cat.setFlashColor(0xFF0000);
                } else {
                    this.cat.resetColors();
                }
                
                // Still update cat position (for tail) but don't move forward
                this.cat.update();
                return;
            }
        }
        
        // Move cat forward (apply speed multiplier from settings)
        this.cat.moveForward(CONFIG.FORWARD_SPEED * this.settings.catSpeed);
        this.distanceTraveled = Math.abs(this.cat.z);
        
        // Update ground
        this.updateGround();
        
        // Update spawner (spawn/despawn objects)
        this.spawner.update(this.cat.z, this.distanceTraveled);
        
        // Check collisions
        this.collisionSystem.checkCollisions(
            this.cat,
            this.spawner.getYarns(),
            this.spawner.getTriangles()
        );
        
        // Check for level end
        if (this.distanceTraveled >= this.getLevelEndDistance()) {
            this.startTransition();
        }
    }
    
    onYarnCollect(yarn) {
        this.yarnCollected++;
        // Add visual yarn to cat's stack (Phase 5 will enhance this)
        this.cat.addToStack(yarn.getColor());
        // Play pickup sound
        this.soundManager.playPickup();
    }
    
    onTriangleHit(triangle) {
        // Stun the cat - stop scrolling briefly
        this.isStunned = true;
        this.stunEndTime = performance.now() + this.stunDuration;
        
        // Remove yarn from stack if we have any
        if (this.cat.getStackCount() > 0) {
            this.cat.removeFromStack();
        }
        
        // Play damage sound
        this.soundManager.playDamage();
        
        // Screen shake effect
        this.triggerScreenShake();
    }
    
    triggerScreenShake() {
        const originalPosition = this.camera.position.clone();
        const shakeIntensity = 0.3;
        const shakeDuration = 200;
        const startTime = performance.now();
        
        const shake = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed < shakeDuration) {
                const decay = 1 - (elapsed / shakeDuration);
                this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity * decay;
                this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity * decay;
                requestAnimationFrame(shake);
            }
        };
        shake();
    }
    
    updateTransition() {
        // Force cat to center lane
        this.cat.forceLane(1);
        
        // Slow forward movement (apply speed multiplier)
        this.cat.moveForward(CONFIG.WATER_SPEED * this.settings.catSpeed);
        this.distanceTraveled = Math.abs(this.cat.z);
        
        // Update ground (no more spawning)
        this.updateGround();
        
        // Check if reached water
        const waterStartZ = this.levelManager.waterStartZ || -this.getLevelEndDistance();
        if (this.cat.z <= waterStartZ) {
            this.startWater();
        }
    }
    
    updateWater() {
        // Build bridge using yarn (if not complete yet)
        if (!this.bridgeComplete) {
            const done = this.levelManager.buildBridge(this.cat, () => {
                // Bridge building complete
                this.bridgeDistance = this.levelManager.getBridgeDistance();
                const yarnRequired = this.getYarnRequired();
                
                // Check if we ran out of yarn before reaching shore
                if (this.cat.getStackCount() === 0 && this.bridgeDistance < yarnRequired) {
                    this.ranOutOfYarn = true;
                }
                this.bridgeComplete = true;
            });
        }
        
        // Move cat forward across the bridge
        const lastBridgeZ = this.levelManager.getLastBridgeZ();
        const shoreZ = this.levelManager.waterStartZ - this.levelManager.waterDepth;
        
        // If ran out of yarn, stop at end of bridge
        if (this.ranOutOfYarn) {
            // Walk to end of bridge, then end game
            if (this.cat.z > lastBridgeZ + 0.5) {
                this.cat.moveForward(CONFIG.WATER_SPEED * this.settings.catSpeed);
            } else {
                // Reached end of incomplete bridge - end game (failure)
                this.endGame();
            }
        } else {
            // Still have yarn or completed bridge - continue forward
            if (this.cat.z > lastBridgeZ + 0.5 || this.bridgeComplete) {
                this.cat.moveForward(CONFIG.WATER_SPEED * this.settings.catSpeed);
            }
            
            // Check if cat has reached the shore/island (victory condition)
            if (this.bridgeComplete && this.cat.z <= shoreZ) {
                this.endGame();
            }
        }
        
        // Update ground behind (keep some visible)
        this.updateGround();
    }
    
    startTransition() {
        this.phase = 'transition';
        this.showMessage('Approaching Ice!');
        
        // Water already created at start - no need to create or clear
        // Objects behind the cat are already despawned naturally
    }
    
    startWater() {
        this.phase = 'water';
        this.hideMessage();
    }
    
    clearSpawnedObjects() {
        // Clear all spawned yarns and triangles for clean water section
        const yarns = this.spawner.getYarns();
        const triangles = this.spawner.getTriangles();
        
        for (const yarn of yarns) {
            yarn.dispose();
        }
        for (const triangle of triangles) {
            triangle.dispose();
        }
        
        // Reset spawner arrays
        this.spawner.yarns = [];
        this.spawner.triangles = [];
    }
    
    endGame() {
        this.phase = 'end';
        this.hideMessage();
        
        // Calculate score
        const distance = Math.floor(this.distanceTraveled);
        const yarn = this.yarnCollected;
        const bridge = this.bridgeDistance;
        const total = (distance * CONFIG.DISTANCE_POINTS) + 
                      (yarn * CONFIG.YARN_POINTS) + 
                      (bridge * CONFIG.BRIDGE_POINTS);
        
        // Check if player reached the island (success)
        // Need to build bridge equal to yarn requirement (each yarn = 1 unit of bridge)
        const yarnRequired = this.getYarnRequired();
        const reachedIsland = bridge >= yarnRequired;
        
        if (reachedIsland) {
            this.soundManager.playVictory();
            this.showSuccessScreen();
        } else {
            this.showFailScreen();
        }
    }
    
    showLevelScreen() {
        // Always set the pause flag
        this.levelScreenVisible = true;
        
        if (this.levelScreenEl && this.levelNumberEl) {
            this.levelNumberEl.textContent = this.currentLevel;
            this.levelScreenEl.classList.remove('hidden');
        }
    }
    
    hideLevelScreen() {
        if (this.levelScreenEl) {
            this.levelScreenEl.classList.add('fade-out');
            setTimeout(() => {
                this.levelScreenEl.classList.add('hidden');
                this.levelScreenEl.classList.remove('fade-out');
                // Clear the pause flag after fade completes
                this.levelScreenVisible = false;
            }, 500);
        } else {
            // Clear the flag immediately if element doesn't exist
            this.levelScreenVisible = false;
        }
    }
    
    showFailScreen() {
        if (this.failScreenEl) {
            const yarnNeeded = this.getYarnRequired();
            const yarnHad = this.yarnCollected;
            const levelEl = this.failScreenEl.querySelector('.fail-level');
            const statsEl = this.failScreenEl.querySelector('.fail-stats');
            
            if (levelEl) levelEl.textContent = `Level ${this.currentLevel}`;
            if (statsEl) {
                statsEl.innerHTML = `
                    <p>You collected ${yarnHad} yarn</p>
                    <p>You needed ${yarnNeeded} to cross</p>
                `;
            }
            
            this.failScreenEl.classList.remove('hidden');
        }
    }
    
    hideFailScreen() {
        if (this.failScreenEl) {
            this.failScreenEl.classList.add('hidden');
        }
    }
    
    showSuccessScreen() {
        if (this.successScreenEl) {
            const levelEl = this.successScreenEl.querySelector('.success-level');
            if (levelEl) levelEl.textContent = `Level ${this.currentLevel} Complete!`;
            
            this.successScreenEl.classList.remove('hidden');
        }
    }
    
    hideSuccessScreen() {
        if (this.successScreenEl) {
            this.successScreenEl.classList.add('hidden');
        }
    }
    
    retryLevel() {
        // Restart the same level
        this.hideFailScreen();
        this.hideTitleScreen();
        
        // Show level screen FIRST (pauses scrolling)
        this.showLevelScreen();
        
        // Then reset the level (but don't override levelScreenVisible)
        this.resetLevelKeepingPause();
        
        // Auto-hide level screen after a delay (2 seconds pause before starting)
        setTimeout(() => {
            this.hideLevelScreen();
        }, 2000);
    }
    
    hideTitleScreen() {
        if (this.titleScreenEl) {
            this.titleScreenEl.classList.add('hidden');
        }
    }
    
    startNextLevel() {
        // Advance to next level
        this.hideSuccessScreen();
        this.currentLevel++;
        
        // Show level screen FIRST (pauses scrolling)
        this.showLevelScreen();
        
        // Then reset the level
        this.resetLevelKeepingPause();
        
        // Auto-hide level screen after a delay (2 seconds pause before starting)
        setTimeout(() => {
            this.hideLevelScreen();
        }, 2000);
    }
    
    resetLevelKeepingPause() {
        // Reset level but don't touch levelScreenVisible (used when level screen is already shown)
        this.phase = 'collection';
        this.distanceTraveled = 0;
        this.yarnCollected = 0;
        this.bridgeDistance = 0;
        this.bridgeComplete = false;
        this.ranOutOfYarn = false;
        this.nextRowZ = -10;
        this.isStunned = false;
        this.stunEndTime = 0;
        // Note: Do NOT reset levelScreenVisible here
        
        // Reset cat
        this.cat.reset();
        
        // Reset spawner
        this.spawner.reset();
        this.spawner.setLevelInfo(this.currentLevel, this.getYarnRequired());
        this.spawner.setDensitySettings(this.settings.yarnDensity, this.settings.obstacleDensity);
        
        // Reset level manager
        this.levelManager.reset();
        
        // Clear objects
        this.clearObjects();
        
        // Respawn ground
        this.groundTiles = [];
        this.snowTiles = [];
        this.spawnInitialGround();
        
        // Re-generate level and water
        const levelEndDistance = this.getLevelEndDistance();
        const easyEndDistance = this.getEasyEndDistance();
        const mediumEndDistance = this.getMediumEndDistance();
        const yarnRequired = this.getYarnRequired();
        this.spawner.generateFullLevel(levelEndDistance, easyEndDistance, mediumEndDistance);
        this.levelManager.createWater(levelEndDistance, yarnRequired);
        
        // Hide UI
        this.hideMessage();
        this.hideEndScreen();
        
        // Update camera instantly
        this.updateCameraPosition(true);
    }
    
    resetLevel() {
        // Reset state for a new run (same or next level)
        this.phase = 'collection';
        this.distanceTraveled = 0;
        this.yarnCollected = 0;
        this.bridgeDistance = 0;
        this.bridgeComplete = false;
        this.ranOutOfYarn = false;
        this.nextRowZ = -10;
        this.isStunned = false;
        this.stunEndTime = 0;
        this.levelScreenVisible = false;
        
        // Reset cat
        this.cat.reset();
        
        // Reset spawner
        this.spawner.reset();
        this.spawner.setLevelInfo(this.currentLevel, this.getYarnRequired());
        this.spawner.setDensitySettings(this.settings.yarnDensity, this.settings.obstacleDensity);
        
        // Reset level manager
        this.levelManager.reset();
        
        // Clear objects
        this.clearObjects();
        
        // Respawn ground
        this.groundTiles = [];
        this.snowTiles = [];
        this.spawnInitialGround();
        
        // Re-generate level and water
        const levelEndDistance = this.getLevelEndDistance();
        const easyEndDistance = this.getEasyEndDistance();
        const mediumEndDistance = this.getMediumEndDistance();
        const yarnRequired = this.getYarnRequired();
        this.spawner.generateFullLevel(levelEndDistance, easyEndDistance, mediumEndDistance);
        this.levelManager.createWater(levelEndDistance, yarnRequired);
        
        // Hide UI
        this.hideMessage();
        this.hideEndScreen();
        
        // Update camera instantly
        this.updateCameraPosition(true);
    }
    
    restart() {
        // Full restart - reset level to starting level from settings
        this.currentLevel = this.settings.startingLevel;
        this.hideFailScreen();
        this.hideSuccessScreen();
        this.hideTitleScreen();
        this.resetLevel();
    }
    
    quitToMainMenu() {
        // Stop the game and return to title screen
        this.isRunning = false;
        this.currentLevel = this.settings.startingLevel;
        
        // Hide all screens
        this.hideLevelScreen();
        this.hideFailScreen();
        this.hideSuccessScreen();
        this.hideEndScreen();
        this.hideMessage();
        
        // Reset the level
        this.resetLevel();
        
        // Show the title screen
        this.showTitleScreen();
        
        // Render once so scene is visible behind title
        this.renderOnce();
    }
    
    showTitleScreen() {
        if (this.titleScreenEl) {
            this.titleScreenEl.classList.remove('hidden');
            this.titleScreenEl.classList.remove('fade-out');
        }
    }
    
    clearObjects() {
        // Clear ground tiles
        for (const tile of this.groundTiles) {
            this.scene.remove(tile);
            tile.geometry.dispose();
            // Handle array of materials - but DON'T dispose shared textures
            if (Array.isArray(tile.material)) {
                tile.material.forEach(m => {
                    // Don't dispose the map (shared texture) - just the material
                    m.dispose();
                });
            } else {
                tile.material.dispose();
            }
        }
        this.groundTiles = [];
        
        // Clear snow tiles
        for (const tile of this.snowTiles) {
            this.scene.remove(tile);
            tile.geometry.dispose();
            if (Array.isArray(tile.material)) {
                tile.material.forEach(m => m.dispose());
            } else {
                tile.material.dispose();
            }
        }
        this.snowTiles = [];
        
        // Clear yarns
        for (const yarn of this.yarns) {
            this.scene.remove(yarn.mesh);
            yarn.dispose();
        }
        this.yarns = [];
        
        // Clear triangles
        for (const tri of this.triangles) {
            this.scene.remove(tri.mesh);
            tri.dispose();
        }
        this.triangles = [];
        
        // Clear bridges
        for (const bridge of this.bridges) {
            this.scene.remove(bridge.mesh);
            bridge.dispose();
        }
        this.bridges = [];
    }
    
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    dispose() {
        this.isRunning = false;
        this.clearObjects();
        this.cat.dispose();
        this.snow.dispose();
        this.renderer.dispose();
    }
}

