// Bridge Entity - Bridge piece for water crossing
import { CONFIG } from '../config.js';

export class Bridge {
    constructor(scene, z, color = null) {
        this.scene = scene;
        this.z = z;
        this.color = color || CONFIG.BRIDGE.COLOR;
        
        // Create mesh
        this.mesh = this.createMesh();
        this.mesh.position.set(0, CONFIG.BRIDGE.HEIGHT / 2, z);
        scene.add(this.mesh);
    }
    
    createMesh() {
        const geometry = new THREE.BoxGeometry(
            CONFIG.BRIDGE.WIDTH,
            CONFIG.BRIDGE.HEIGHT,
            CONFIG.BRIDGE.DEPTH
        );
        const material = new THREE.MeshLambertMaterial({ 
            color: this.color 
        });
        return new THREE.Mesh(geometry, material);
    }
    
    getZ() {
        return this.z;
    }
    
    dispose() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}


