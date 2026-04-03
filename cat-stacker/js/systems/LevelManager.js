// Level Manager - Phases, water section, scoring
import { CONFIG } from '../config.js';
import { Bridge } from '../entities/Bridge.js';

export class LevelManager {
    constructor(scene, soundManager) {
        this.scene = scene;
        this.soundManager = soundManager;
        this.bridges = [];
        this.waterPlane = null;
        this.waterSurface = null;
        this.iceStreaks = [];  // White streaks on ice
        this.shorePlane = null;
        
        // Bridge building state
        this.waterStartZ = CONFIG.WATER.START_Z;  // Default, will be updated per level
        this.waterDepth = CONFIG.WATER.DEPTH;     // Default, will be updated per level
        this.nextBridgeZ = CONFIG.WATER.START_Z;
        this.bridgeTimer = 0;
        this.bridgeBuildInterval = 200; // ms between bridge pieces
    }
    
    createWater(levelEndDistance, yarnRequired) {
        // Calculate water start position based on level end distance
        this.waterStartZ = -levelEndDistance;
        // Water depth equals yarn requirement (each yarn = 1 unit of bridge)
        this.waterDepth = yarnRequired;
        this.nextBridgeZ = this.waterStartZ;
        // Extra wide ICE plane - fills entire screen
        const iceWidth = 60;
        const iceGeometry = new THREE.PlaneGeometry(iceWidth, this.waterDepth);
        
        // Solid light blue icy material with shine
        const iceMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccee,       // Light icy blue
            specular: 0xffffff,    // White specular highlights
            shininess: 100,        // High shininess for glossy ice
            transparent: true,
            opacity: 0.95
        });
        
        this.waterSurface = new THREE.Mesh(iceGeometry, iceMaterial);
        this.waterSurface.rotation.x = -Math.PI / 2;
        this.waterSurface.position.set(0, 0.02, this.waterStartZ - this.waterDepth / 2);
        this.scene.add(this.waterSurface);
        
        // Add white streaks across the ice for frozen look
        this.createIceStreaks(iceWidth);
        
        // No extra geometry - keeping it clean
        this.waterPlane = null;
        
        // Island (goal) - snowy white ground
        const islandGroup = new THREE.Group();
        
        // Main island platform - snowy white
        const islandGeometry = new THREE.BoxGeometry(8, 1, 12);
        
        // Create materials array for island: snowy white top, icy sides
        const islandTopMaterial = new THREE.MeshPhongMaterial({
            color: 0xE8F4FF,        // Icy white like snow banks
            specular: 0xaaddff,
            shininess: 25
        });
        const islandSideMaterial = new THREE.MeshLambertMaterial({
            color: 0xCCDDEE  // Light blue-white sides
        });
        
        // Materials: [right, left, top, bottom, front, back]
        const islandMaterials = [
            islandSideMaterial, islandSideMaterial,
            islandTopMaterial, islandSideMaterial,
            islandSideMaterial, islandSideMaterial
        ];
        
        const island = new THREE.Mesh(islandGeometry, islandMaterials);
        island.position.set(0, 0, 0);
        islandGroup.add(island);
        
        // Christmas Tree - big cone with lights on brown trunk
        const christmasTreeGroup = new THREE.Group();
        
        // Tree trunk (brown vertical rectangle/cylinder)
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Saddle brown
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(0, 0.6, 0);
        christmasTreeGroup.add(trunk);
        
        // Tree cone (green)
        const treeConeGeometry = new THREE.ConeGeometry(1.5, 4, 12);
        const treeConeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
        const treeCone = new THREE.Mesh(treeConeGeometry, treeConeMaterial);
        treeCone.position.set(0, 3.2, 0);
        christmasTreeGroup.add(treeCone);
        
        // Star on top
        const starGeometry = new THREE.OctahedronGeometry(0.3, 0);
        const starMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.3 }); // Gold
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(0, 5.4, 0);
        star.rotation.y = Math.PI / 4;
        christmasTreeGroup.add(star);
        
        // Christmas lights (small colored spheres around the tree)
        const lightColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF69B4, 0x00FFFF]; // Red, green, blue, yellow, pink, cyan
        for (let layer = 0; layer < 4; layer++) {
            const y = 1.8 + layer * 0.9;
            const radius = 1.2 - layer * 0.25;
            const lightsPerLayer = 6 - layer;
            for (let i = 0; i < lightsPerLayer; i++) {
                const angle = (i / lightsPerLayer) * Math.PI * 2 + layer * 0.5;
                const lightGeometry = new THREE.SphereGeometry(0.12, 8, 8);
                const lightMaterial = new THREE.MeshLambertMaterial({
                    color: lightColors[(layer + i) % lightColors.length],
                    emissive: lightColors[(layer + i) % lightColors.length],
                    emissiveIntensity: 0.5
                });
                const light = new THREE.Mesh(lightGeometry, lightMaterial);
                light.position.set(
                    Math.cos(angle) * radius,
                    y,
                    Math.sin(angle) * radius
                );
                christmasTreeGroup.add(light);
            }
        }
        
        christmasTreeGroup.position.set(0, 0.5, -3);
        islandGroup.add(christmasTreeGroup);
        
        // Snowman
        const snowmanGroup = new THREE.Group();
        
        // Bottom ball (largest)
        const bottomBallGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const snowMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            specular: 0xaaddff,
            shininess: 20
        });
        const bottomBall = new THREE.Mesh(bottomBallGeometry, snowMaterial);
        bottomBall.position.set(0, 0.6, 0);
        snowmanGroup.add(bottomBall);
        
        // Middle ball
        const middleBallGeometry = new THREE.SphereGeometry(0.45, 16, 16);
        const middleBall = new THREE.Mesh(middleBallGeometry, snowMaterial);
        middleBall.position.set(0, 1.4, 0);
        snowmanGroup.add(middleBall);
        
        // Head (smallest)
        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const head = new THREE.Mesh(headGeometry, snowMaterial);
        head.position.set(0, 2.1, 0);
        snowmanGroup.add(head);
        
        // Carrot nose
        const noseGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);
        const noseMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 }); // Orange
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 2.1, 0.35);
        nose.rotation.x = Math.PI / 2;
        snowmanGroup.add(nose);
        
        // Coal eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const coalMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const leftEye = new THREE.Mesh(eyeGeometry, coalMaterial);
        leftEye.position.set(-0.12, 2.2, 0.3);
        snowmanGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, coalMaterial);
        rightEye.position.set(0.12, 2.2, 0.3);
        snowmanGroup.add(rightEye);
        
        // Coal smile (arc of small spheres)
        for (let i = 0; i < 5; i++) {
            const smileAngle = (i - 2) * 0.2;
            const smilePiece = new THREE.Mesh(eyeGeometry, coalMaterial);
            smilePiece.position.set(
                Math.sin(smileAngle) * 0.15,
                2.0 - Math.abs(i - 2) * 0.03,
                0.32
            );
            snowmanGroup.add(smilePiece);
        }
        
        // Top hat
        const hatBrimGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
        const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const hatBrim = new THREE.Mesh(hatBrimGeometry, hatMaterial);
        hatBrim.position.set(0, 2.42, 0);
        snowmanGroup.add(hatBrim);
        
        const hatTopGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 16);
        const hatTop = new THREE.Mesh(hatTopGeometry, hatMaterial);
        hatTop.position.set(0, 2.62, 0);
        snowmanGroup.add(hatTop);
        
        // Red hat band
        const hatBandGeometry = new THREE.CylinderGeometry(0.21, 0.21, 0.06, 16);
        const hatBandMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
        const hatBand = new THREE.Mesh(hatBandGeometry, hatBandMaterial);
        hatBand.position.set(0, 2.48, 0);
        snowmanGroup.add(hatBand);
        
        // Stick arms
        const armGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3728 }); // Brown
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.7, 1.4, 0);
        leftArm.rotation.z = Math.PI / 3;
        snowmanGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.7, 1.4, 0);
        rightArm.rotation.z = -Math.PI / 3;
        snowmanGroup.add(rightArm);
        
        // Coal buttons on middle ball
        for (let i = 0; i < 3; i++) {
            const button = new THREE.Mesh(eyeGeometry, coalMaterial);
            button.position.set(0, 1.2 + i * 0.15, 0.43);
            snowmanGroup.add(button);
        }
        
        snowmanGroup.position.set(2.5, 0.5, 0);
        islandGroup.add(snowmanGroup);
        
        // Presents - boxes with ribbons
        const presentConfigs = [
            { size: [0.8, 0.6, 0.8], pos: [-2, 0.8, -1], boxColor: 0xDC143C, ribbonColor: 0xFFFFFF }, // Red with white
            { size: [0.6, 0.5, 0.6], pos: [-1.2, 0.75, 0.5], boxColor: 0x228B22, ribbonColor: 0xFFD700 }, // Green with gold
            { size: [0.7, 0.7, 0.7], pos: [1.8, 0.85, -0.5], boxColor: 0x4169E1, ribbonColor: 0xFFFFFF }, // Blue with white
            { size: [0.5, 0.4, 0.5], pos: [1.2, 0.7, 1], boxColor: 0x9370DB, ribbonColor: 0xFFD700 }, // Purple with gold
            { size: [0.6, 0.55, 0.6], pos: [-0.5, 0.775, 1.5], boxColor: 0xFF69B4, ribbonColor: 0xFFFFFF }, // Pink with white
        ];
        
        for (const config of presentConfigs) {
            const presentGroup = new THREE.Group();
            
            // Box
            const boxGeometry = new THREE.BoxGeometry(...config.size);
            const boxMaterial = new THREE.MeshLambertMaterial({ color: config.boxColor });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            presentGroup.add(box);
            
            // Horizontal ribbon (wraps around box)
            const hRibbonGeometry = new THREE.BoxGeometry(config.size[0] + 0.02, 0.08, config.size[2] + 0.02);
            const ribbonMaterial = new THREE.MeshLambertMaterial({ color: config.ribbonColor });
            const hRibbon = new THREE.Mesh(hRibbonGeometry, ribbonMaterial);
            hRibbon.position.y = config.size[1] * 0.2;
            presentGroup.add(hRibbon);
            
            // Vertical ribbon (crosses the horizontal)
            const vRibbonGeometry = new THREE.BoxGeometry(0.08, config.size[1] + 0.02, config.size[2] + 0.02);
            const vRibbon = new THREE.Mesh(vRibbonGeometry, ribbonMaterial);
            presentGroup.add(vRibbon);
            
            // Bow on top (two small tilted boxes)
            const bowGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.15);
            const bow1 = new THREE.Mesh(bowGeometry, ribbonMaterial);
            bow1.position.set(-0.1, config.size[1] / 2 + 0.05, 0);
            bow1.rotation.z = 0.4;
            presentGroup.add(bow1);
            
            const bow2 = new THREE.Mesh(bowGeometry, ribbonMaterial);
            bow2.position.set(0.1, config.size[1] / 2 + 0.05, 0);
            bow2.rotation.z = -0.4;
            presentGroup.add(bow2);
            
            presentGroup.position.set(...config.pos);
            presentGroup.rotation.y = Math.random() * 0.5 - 0.25; // Slight random rotation
            islandGroup.add(presentGroup);
        }
        
        // Position the whole island
        islandGroup.position.set(0, -0.5, this.waterStartZ - this.waterDepth - 6);
        this.scene.add(islandGroup);
        this.shorePlane = islandGroup;
    }
    
    createIceStreaks(iceWidth) {
        // Create random white streaks across the ice surface
        const streakMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4
        });
        
        const numStreaks = 12;
        const iceStartZ = this.waterStartZ;
        const iceEndZ = this.waterStartZ - this.waterDepth;
        
        for (let i = 0; i < numStreaks; i++) {
            // Random streak dimensions
            const streakWidth = 0.1 + Math.random() * 0.3;
            const streakLength = 3 + Math.random() * 8;
            
            const streakGeometry = new THREE.PlaneGeometry(streakWidth, streakLength);
            const streak = new THREE.Mesh(streakGeometry, streakMaterial.clone());
            
            // Random position across ice
            const x = (Math.random() - 0.5) * (iceWidth - 2);
            const z = iceStartZ - Math.random() * this.waterDepth;
            
            streak.rotation.x = -Math.PI / 2;
            streak.rotation.z = (Math.random() - 0.5) * 0.3;  // Slight random angle
            streak.position.set(x, 0.03, z);  // Just above ice surface
            
            this.scene.add(streak);
            this.iceStreaks.push(streak);
        }
    }
    
    buildBridge(cat, onBridgeComplete) {
        const now = performance.now();
        
        // Rate limit bridge building
        if (now - this.bridgeTimer < this.bridgeBuildInterval) {
            return false;
        }
        
        // Check if cat has yarn to spend
        if (cat.getStackCount() <= 0) {
            onBridgeComplete();
            return true;  // Done building (no more yarn)
        }
        
        // Consume one yarn (FIFO - first collected, first used) and get its color
        const yarnColor = cat.removeFromStack();
        
        // Build bridge piece with the consumed yarn's color
        const bridge = new Bridge(this.scene, this.nextBridgeZ, yarnColor);
        this.bridges.push(bridge);
        
        // Play bridge building sound
        if (this.soundManager) {
            this.soundManager.playBridge();
        }
        
        // Move to next position
        this.nextBridgeZ -= CONFIG.YARN_BRIDGE_DISTANCE;
        this.bridgeTimer = now;
        
        // Check if reached the shore
        const shoreZ = this.waterStartZ - this.waterDepth;
        if (this.nextBridgeZ <= shoreZ) {
            onBridgeComplete();
            return true;
        }
        
        return false;
    }
    
    getBridgeDistance() {
        return this.bridges.length * CONFIG.YARN_BRIDGE_DISTANCE;
    }
    
    getBridgeCount() {
        return this.bridges.length;
    }
    
    getLastBridgeZ() {
        if (this.bridges.length === 0) {
            return this.waterStartZ;
        }
        return this.bridges[this.bridges.length - 1].getZ();
    }
    
    reset() {
        // Clean up bridges
        for (const bridge of this.bridges) {
            bridge.dispose();
        }
        this.bridges = [];
        
        // Remove water (waterPlane may be null in new simpler approach)
        if (this.waterPlane) {
            this.scene.remove(this.waterPlane);
            if (this.waterPlane.geometry) this.waterPlane.geometry.dispose();
            if (this.waterPlane.material) this.waterPlane.material.dispose();
            this.waterPlane = null;
        }
        
        // Remove water surface
        if (this.waterSurface) {
            this.scene.remove(this.waterSurface);
            this.waterSurface.geometry.dispose();
            this.waterSurface.material.dispose();
            this.waterSurface = null;
        }
        
        // Remove ice streaks
        for (const streak of this.iceStreaks) {
            this.scene.remove(streak);
            streak.geometry.dispose();
            streak.material.dispose();
        }
        this.iceStreaks = [];
        
        // Remove shore/island
        if (this.shorePlane) {
            this.scene.remove(this.shorePlane);
            // Recursively dispose all children in the group
            this.disposeObject(this.shorePlane);
            this.shorePlane = null;
        }
        
        this.nextBridgeZ = this.waterStartZ || CONFIG.WATER.START_Z;
        this.bridgeTimer = 0;
    }
    
    disposeObject(object) {
        // Recursively dispose an object and all its children
        if (object.children && object.children.length > 0) {
            // Make a copy of children array since we're modifying it
            const children = [...object.children];
            for (const child of children) {
                this.disposeObject(child);
            }
        }
        
        // Dispose geometry
        if (object.geometry) {
            object.geometry.dispose();
        }
        
        // Dispose material(s)
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(m => m.dispose());
            } else {
                object.material.dispose();
            }
        }
    }
    
    dispose() {
        this.reset();
    }
}

