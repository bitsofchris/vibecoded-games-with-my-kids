// Snow Particle System - Light snowfall effect
// Uses Three.js Points for efficient particle rendering

export class Snow {
    constructor(scene) {
        this.scene = scene;
        
        // Configuration
        this.particleCount = 400;
        this.spreadX = 30;      // Width of snow area
        this.spreadY = 20;      // Height of snow area
        this.spreadZ = 50;      // Depth of snow area
        this.fallSpeed = 0.03;  // Base fall speed
        this.driftSpeed = 0.01; // Horizontal drift amplitude
        
        // Track time for drift animation
        this.time = 0;
        
        // Create particle system
        this.createParticles();
    }
    
    createParticles() {
        // Create geometry with position attributes
        this.geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = new Float32Array(this.particleCount); // Individual fall speeds
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Random position in a box
            positions[i3] = (Math.random() - 0.5) * this.spreadX;      // x
            positions[i3 + 1] = Math.random() * this.spreadY;          // y
            positions[i3 + 2] = (Math.random() - 0.5) * this.spreadZ;  // z
            
            // Random fall speed variation (0.02 to 0.04)
            velocities[i] = 0.02 + Math.random() * 0.02;
        }
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.velocities = velocities;
        
        // Create material - small white points with transparency
        this.material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.12,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,  // Points get smaller with distance
            depthWrite: false       // Prevents z-fighting artifacts
        });
        
        // Create the Points mesh
        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
    }
    
    update(cameraPosition) {
        this.time += 0.01;
        
        const positions = this.geometry.attributes.position.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Fall down
            positions[i3 + 1] -= this.velocities[i];
            
            // Gentle horizontal drift using sin wave (unique phase per particle)
            positions[i3] += Math.sin(this.time + i * 0.1) * this.driftSpeed;
            
            // Wrap particle to top when it falls below view
            if (positions[i3 + 1] < -2) {
                positions[i3 + 1] = this.spreadY - 2;
                // Randomize x and z position when wrapping
                positions[i3] = (Math.random() - 0.5) * this.spreadX;
                positions[i3 + 2] = (Math.random() - 0.5) * this.spreadZ;
            }
        }
        
        // Move the entire particle system to follow the camera
        this.points.position.x = cameraPosition.x;
        this.points.position.z = cameraPosition.z - this.spreadZ * 0.3; // Slightly ahead
        
        // Mark positions as needing update
        this.geometry.attributes.position.needsUpdate = true;
    }
    
    dispose() {
        this.scene.remove(this.points);
        this.geometry.dispose();
        this.material.dispose();
    }
}

