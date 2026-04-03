// Cat Entity - Player character
import { CONFIG } from '../config.js';

export class Cat {
    constructor(scene) {
        this.scene = scene;
        
        // Position state
        this.laneIndex = 1;  // 0=left, 1=center, 2=right
        this.x = CONFIG.LANE_POSITIONS[this.laneIndex];
        this.y = CONFIG.CAT.HEIGHT / 2;
        this.z = 0;
        
        // Lane switching state
        this.isTransitioning = false;
        this.transitionStart = 0;
        this.transitionFromX = 0;
        this.transitionToX = 0;
        
        // Stack of collected yarn (visual meshes) - now a tail!
        this.stack = [];
        this.tailPositions = [];  // Track X positions for wave effect
        
        // Create the mesh
        this.mesh = this.createMesh();
        this.mesh.position.set(this.x, this.y, this.z);
        scene.add(this.mesh);
        
        // Tail config
        this.tailSpacing = 0.6;  // Distance between tail segments
        this.tailHeight = 0.5;   // Height of tail above ground
        this.waveSpeed = 0.15;   // How fast tail follows (0-1)
    }
    
    createMesh() {
        // Create a rounder, more cat-like shape
        const catGroup = new THREE.Group();
        
        const bodyColor = CONFIG.CAT.COLOR;  // Orange
        const stripeColor = 0xCC6600;        // Darker orange for stripes
        const bellyColor = 0xFFDAAB;         // Lighter belly
        const innerEarColor = 0xFFB6C1;      // Pink inner ear
        const noseColor = 0xFF69B4;          // Pink nose
        
        // Body - elongated sphere (capsule-like) for rounder look
        const bodyGeometry = new THREE.SphereGeometry(0.35, 16, 12);
        bodyGeometry.scale(1, 0.8, 1.4);  // Flatten and stretch
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        catGroup.add(body);
        
        // Belly (lighter underside)
        const bellyGeometry = new THREE.SphereGeometry(0.25, 12, 8);
        bellyGeometry.scale(0.9, 0.5, 1.2);
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: bellyColor });
        const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
        belly.position.set(0, -0.15, 0);
        catGroup.add(belly);
        
        // Head (rounder sphere at front)
        const headGeometry = new THREE.SphereGeometry(0.28, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.15, -0.45);
        catGroup.add(head);
        
        // Cheeks (make face rounder)
        const cheekGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        const cheekMaterial = new THREE.MeshLambertMaterial({ color: bellyColor });
        const leftCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
        leftCheek.position.set(-0.15, 0.05, -0.55);
        catGroup.add(leftCheek);
        const rightCheek = new THREE.Mesh(cheekGeometry, cheekMaterial);
        rightCheek.position.set(0.15, 0.05, -0.55);
        catGroup.add(rightCheek);
        
        // Ears (triangular cones)
        const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 4);
        const earMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.15, 0.4, -0.4);
        leftEar.rotation.z = -0.3;
        leftEar.rotation.x = 0.2;
        catGroup.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.15, 0.4, -0.4);
        rightEar.rotation.z = 0.3;
        rightEar.rotation.x = 0.2;
        catGroup.add(rightEar);
        
        // Inner ears (pink)
        const innerEarGeometry = new THREE.ConeGeometry(0.05, 0.1, 4);
        const innerEarMaterial = new THREE.MeshLambertMaterial({ color: innerEarColor });
        const leftInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
        leftInnerEar.position.set(-0.15, 0.38, -0.42);
        leftInnerEar.rotation.z = -0.3;
        leftInnerEar.rotation.x = 0.2;
        catGroup.add(leftInnerEar);
        
        const rightInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
        rightInnerEar.position.set(0.15, 0.38, -0.42);
        rightInnerEar.rotation.z = 0.3;
        rightInnerEar.rotation.x = 0.2;
        catGroup.add(rightInnerEar);
        
        // Nose (small pink triangle)
        const noseGeometry = new THREE.ConeGeometry(0.04, 0.05, 3);
        const noseMaterial = new THREE.MeshLambertMaterial({ color: noseColor });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 0.08, -0.7);
        nose.rotation.x = Math.PI / 2;
        catGroup.add(nose);
        
        // Eyes (cute round eyes)
        const eyeWhiteGeometry = new THREE.SphereGeometry(0.06, 8, 8);
        const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const pupilGeometry = new THREE.SphereGeometry(0.035, 8, 8);
        const pupilMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 }); // Green eyes
        const pupilCenterGeometry = new THREE.SphereGeometry(0.02, 6, 6);
        const pupilCenterMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        // Left eye
        const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        leftEyeWhite.position.set(-0.1, 0.2, -0.62);
        catGroup.add(leftEyeWhite);
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.1, 0.2, -0.67);
        catGroup.add(leftPupil);
        const leftPupilCenter = new THREE.Mesh(pupilCenterGeometry, pupilCenterMaterial);
        leftPupilCenter.position.set(-0.1, 0.2, -0.7);
        catGroup.add(leftPupilCenter);
        
        // Right eye
        const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
        rightEyeWhite.position.set(0.1, 0.2, -0.62);
        catGroup.add(rightEyeWhite);
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.1, 0.2, -0.67);
        catGroup.add(rightPupil);
        const rightPupilCenter = new THREE.Mesh(pupilCenterGeometry, pupilCenterMaterial);
        rightPupilCenter.position.set(0.1, 0.2, -0.7);
        catGroup.add(rightPupilCenter);
        
        // Stripes on body (curved on the round body)
        const stripeMaterial = new THREE.MeshLambertMaterial({ color: stripeColor });
        for (let i = 0; i < 3; i++) {
            const stripeGeometry = new THREE.TorusGeometry(0.32 - i * 0.03, 0.025, 6, 12, Math.PI);
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(0, 0.1, -0.1 + i * 0.15);
            stripe.rotation.x = Math.PI / 2;
            stripe.rotation.z = Math.PI;
            catGroup.add(stripe);
        }
        
        // Short stubby legs (cylinder with rounded ends simulated by spheres)
        const legGeometry = new THREE.CylinderGeometry(0.06, 0.07, 0.18, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        
        const legPositions = [
            { x: -0.18, z: -0.25 },  // Front left
            { x: 0.18, z: -0.25 },   // Front right
            { x: -0.18, z: 0.2 },    // Back left
            { x: 0.18, z: 0.2 }      // Back right
        ];
        
        for (const pos of legPositions) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos.x, -0.32, pos.z);
            catGroup.add(leg);
            
            // Paw (small sphere at bottom)
            const pawGeometry = new THREE.SphereGeometry(0.07, 8, 6);
            const pawMaterial = new THREE.MeshLambertMaterial({ color: bellyColor });
            const paw = new THREE.Mesh(pawGeometry, pawMaterial);
            paw.position.set(pos.x, -0.42, pos.z);
            catGroup.add(paw);
        }
        
        // Tail stub (the yarn balls are the main tail now)
        const tailBaseGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const tailBaseMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        const tailBase = new THREE.Mesh(tailBaseGeometry, tailBaseMaterial);
        tailBase.position.set(0, 0.05, 0.45);
        catGroup.add(tailBase);
        
        return catGroup;
    }
    
    update(deltaTime) {
        // Handle lane transition
        if (this.isTransitioning) {
            const elapsed = performance.now() - this.transitionStart;
            const progress = Math.min(elapsed / CONFIG.LANE_SWITCH_DURATION, 1);
            
            // Smooth easing (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);
            this.x = this.transitionFromX + (this.transitionToX - this.transitionFromX) * eased;
            
            if (progress >= 1) {
                this.isTransitioning = false;
                this.x = this.transitionToX;
            }
        }
        
        // Update mesh position
        this.mesh.position.x = this.x;
        this.mesh.position.z = this.z;
        
        // Update tail with wave effect
        this.updateTail();
    }
    
    updateTail() {
        // Each tail segment follows the one in front with a delay
        // First segment follows the cat, rest follow each other
        
        for (let i = 0; i < this.stack.length; i++) {
            const yarn = this.stack[i];
            
            // Target X position (follows the segment in front)
            let targetX;
            if (i === 0) {
                targetX = this.x;  // First segment follows cat
            } else {
                targetX = this.tailPositions[i - 1];  // Follow previous segment
            }
            
            // Smooth follow (wave effect)
            if (this.tailPositions[i] === undefined) {
                this.tailPositions[i] = this.x;
            }
            this.tailPositions[i] += (targetX - this.tailPositions[i]) * this.waveSpeed;
            
            // Position the yarn ball
            const zOffset = (i + 1) * this.tailSpacing;  // Behind the cat
            
            // Add subtle wave motion
            const waveOffset = Math.sin(Date.now() * 0.005 + i * 0.5) * 0.05;
            const bounceOffset = Math.sin(Date.now() * 0.008 + i * 0.3) * 0.08;
            
            yarn.mesh.position.set(
                this.tailPositions[i] + waveOffset,
                this.tailHeight + bounceOffset,
                this.z + zOffset
            );
        }
    }
    
    moveForward(speed) {
        this.z -= speed;  // Negative Z is forward
    }
    
    switchLane(direction) {
        // direction: -1 = left, +1 = right
        if (this.isTransitioning) return false;
        
        const newLaneIndex = this.laneIndex + direction;
        
        // Bounds check
        if (newLaneIndex < 0 || newLaneIndex > 2) return false;
        
        // Start transition
        this.laneIndex = newLaneIndex;
        this.isTransitioning = true;
        this.transitionStart = performance.now();
        this.transitionFromX = this.x;
        this.transitionToX = CONFIG.LANE_POSITIONS[newLaneIndex];
        
        return true;
    }
    
    // Force cat to specific lane (for water section)
    forceLane(laneIndex) {
        if (this.laneIndex === laneIndex && !this.isTransitioning) return;
        
        this.laneIndex = laneIndex;
        this.isTransitioning = true;
        this.transitionStart = performance.now();
        this.transitionFromX = this.x;
        this.transitionToX = CONFIG.LANE_POSITIONS[laneIndex];
    }
    
    // Add yarn to visual tail
    addToStack(color) {
        const geometry = new THREE.SphereGeometry(CONFIG.YARN.RADIUS, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color });
        const yarnMesh = new THREE.Mesh(geometry, material);
        
        // Position behind cat (will be updated in updateTail)
        const zOffset = (this.stack.length + 1) * this.tailSpacing;
        yarnMesh.position.set(this.x, this.tailHeight, this.z + zOffset);
        
        // Add to scene directly (not as child, for independent positioning)
        this.scene.add(yarnMesh);
        // Store both mesh and color for FIFO consumption
        this.stack.push({ mesh: yarnMesh, color });
        this.tailPositions.push(this.x);
        
        return yarnMesh;
    }
    
    // Remove first yarn from tail (FIFO - first collected, first used)
    removeFromStack() {
        if (this.stack.length === 0) return null;
        
        const firstYarn = this.stack.shift(); // Remove from front (FIFO)
        this.tailPositions.shift(); // Remove corresponding position
        this.scene.remove(firstYarn.mesh);
        firstYarn.mesh.geometry.dispose();
        firstYarn.mesh.material.dispose();
        
        // Return the color for bridge building
        return firstYarn.color;
    }
    
    getStackCount() {
        return this.stack.length;
    }
    
    // Get current lane for collision detection
    getLane() {
        return this.laneIndex;
    }
    
    getPosition() {
        return { x: this.x, y: this.y, z: this.z };
    }
    
    // Flash the cat a color (for stun effect)
    setFlashColor(color) {
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.userData.originalColor = child.userData.originalColor || child.material.color.getHex();
                child.material.color.setHex(color);
            }
        });
    }
    
    // Reset to original colors
    resetColors() {
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material && child.userData.originalColor !== undefined) {
                child.material.color.setHex(child.userData.originalColor);
            }
        });
    }
    
    // Reset for game restart
    reset() {
        // Clear stack/tail
        while (this.stack.length > 0) {
            this.removeFromStack();
        }
        this.tailPositions = [];
        
        // Reset position
        this.laneIndex = 1;
        this.x = CONFIG.LANE_POSITIONS[1];
        this.z = 0;
        this.isTransitioning = false;
        
        this.mesh.position.set(this.x, this.y, this.z);
    }
    
    dispose() {
        // Clean up stack
        while (this.stack.length > 0) {
            this.removeFromStack();
        }
        
        // Clean up main mesh (now a group)
        this.scene.remove(this.mesh);
        if (this.mesh.children) {
            this.mesh.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}

