// Triangle Entity - Obstacle
import { CONFIG } from '../config.js';

export class Triangle {
    constructor(scene, x, z) {
        this.scene = scene;
        this.laneIndex = CONFIG.LANE_POSITIONS.indexOf(x);
        this.x = x;
        this.z = z;
        this.hit = false;
        
        // Create mesh
        this.mesh = this.createMesh();
        this.mesh.position.set(x, CONFIG.TRIANGLE.HOVER_HEIGHT, z);
        scene.add(this.mesh);
    }
    
    createMesh() {
        // Create a spiky danger obstacle
        const spikeGroup = new THREE.Group();
        
        const mainColor = CONFIG.TRIANGLE.COLOR;  // Crimson
        const darkColor = 0x8B0000;               // Dark red
        const warnColor = 0xFF4500;               // Orange-red glow
        
        // Main spike (cone)
        const geometry = new THREE.ConeGeometry(
            CONFIG.TRIANGLE.RADIUS,
            CONFIG.TRIANGLE.HEIGHT,
            6  // hexagonal base
        );
        const material = new THREE.MeshLambertMaterial({ 
            color: mainColor
        });
        const mainSpike = new THREE.Mesh(geometry, material);
        spikeGroup.add(mainSpike);
        
        // Warning base ring
        const baseGeometry = new THREE.TorusGeometry(CONFIG.TRIANGLE.RADIUS * 0.8, 0.08, 8, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: warnColor });
        const baseRing = new THREE.Mesh(baseGeometry, baseMaterial);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.y = -CONFIG.TRIANGLE.HEIGHT * 0.4;
        spikeGroup.add(baseRing);
        
        // Small side spikes
        const smallSpikeGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);
        const smallSpikeMaterial = new THREE.MeshLambertMaterial({ color: darkColor });
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const smallSpike = new THREE.Mesh(smallSpikeGeometry, smallSpikeMaterial);
            smallSpike.position.set(
                Math.cos(angle) * CONFIG.TRIANGLE.RADIUS * 0.6,
                -CONFIG.TRIANGLE.HEIGHT * 0.2,
                Math.sin(angle) * CONFIG.TRIANGLE.RADIUS * 0.6
            );
            smallSpike.rotation.z = -Math.cos(angle) * 0.4;
            smallSpike.rotation.x = Math.sin(angle) * 0.4;
            spikeGroup.add(smallSpike);
        }
        
        return spikeGroup;
    }
    
    update(deltaTime) {
        // Rotate for visibility
        this.mesh.rotation.y += CONFIG.TRIANGLE.ROTATION_SPEED;
    }
    
    onHit() {
        this.hit = true;
        this.scene.remove(this.mesh);
    }
    
    getPosition() {
        return { x: this.x, z: this.z };
    }
    
    getLane() {
        return this.laneIndex;
    }
    
    isHit() {
        return this.hit;
    }
    
    dispose() {
        this.scene.remove(this.mesh);
        // Handle group or single mesh
        if (this.mesh.children) {
            this.mesh.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        } else {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
    }
}


