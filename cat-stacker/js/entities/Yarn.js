// Yarn Entity - Collectible item
import { CONFIG } from '../config.js';

export class Yarn {
    constructor(scene, x, z) {
        this.scene = scene;
        this.laneIndex = CONFIG.LANE_POSITIONS.indexOf(x);
        this.x = x;
        this.z = z;
        this.collected = false;
        
        // Random color from palette
        this.color = CONFIG.YARN.COLORS[Math.floor(Math.random() * CONFIG.YARN.COLORS.length)];
        
        // Create mesh
        this.mesh = this.createMesh();
        this.mesh.position.set(x, CONFIG.YARN.HOVER_HEIGHT, z);
        scene.add(this.mesh);
    }
    
    createMesh() {
        // Create a yarn ball with wrapped texture effect
        const yarnGroup = new THREE.Group();
        
        // Main ball
        const geometry = new THREE.SphereGeometry(CONFIG.YARN.RADIUS, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: this.color });
        const ball = new THREE.Mesh(geometry, material);
        yarnGroup.add(ball);
        
        // Add "wrap" lines to make it look like yarn (torus rings)
        const wrapColor = this.darkenColor(this.color, 0.7);
        const wrapMaterial = new THREE.MeshLambertMaterial({ color: wrapColor });
        
        // Horizontal wraps
        for (let i = 0; i < 3; i++) {
            const torusGeometry = new THREE.TorusGeometry(CONFIG.YARN.RADIUS * 0.9, 0.02, 8, 16);
            const wrap = new THREE.Mesh(torusGeometry, wrapMaterial);
            wrap.rotation.x = Math.PI / 2;
            wrap.position.y = (i - 1) * 0.12;
            yarnGroup.add(wrap);
        }
        
        // Vertical wraps
        for (let i = 0; i < 2; i++) {
            const torusGeometry = new THREE.TorusGeometry(CONFIG.YARN.RADIUS * 0.85, 0.02, 8, 16);
            const wrap = new THREE.Mesh(torusGeometry, wrapMaterial);
            wrap.rotation.y = (i * Math.PI / 2) + Math.PI / 4;
            yarnGroup.add(wrap);
        }
        
        return yarnGroup;
    }
    
    darkenColor(color, factor) {
        const r = ((color >> 16) & 255) * factor;
        const g = ((color >> 8) & 255) * factor;
        const b = (color & 255) * factor;
        return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
    }
    
    update(deltaTime) {
        // Rotate for visual appeal
        this.mesh.rotation.y += CONFIG.YARN.ROTATION_SPEED;
        
        // Slight bobbing motion
        this.mesh.position.y = CONFIG.YARN.HOVER_HEIGHT + Math.sin(Date.now() * 0.003) * 0.1;
    }
    
    collect() {
        this.collected = true;
        this.scene.remove(this.mesh);
    }
    
    getPosition() {
        return { x: this.x, z: this.z };
    }
    
    getLane() {
        return this.laneIndex;
    }
    
    isCollected() {
        return this.collected;
    }
    
    getColor() {
        return this.color;
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


