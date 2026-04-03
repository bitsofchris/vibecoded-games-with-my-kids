// Collision System - Lane-based collision detection
import { CONFIG } from '../config.js';

export class CollisionSystem {
    constructor() {
        // Callbacks for collision events
        this.onYarnCollect = null;
        this.onTriangleHit = null;
    }
    
    setCallbacks(onYarnCollect, onTriangleHit) {
        this.onYarnCollect = onYarnCollect;
        this.onTriangleHit = onTriangleHit;
    }
    
    checkCollisions(cat, yarns, triangles) {
        const catLane = cat.getLane();
        const catZ = cat.z;
        
        // Check yarn collisions
        for (const yarn of yarns) {
            if (yarn.isCollected()) continue;
            
            if (this.isColliding(catLane, catZ, yarn.getLane(), yarn.z)) {
                yarn.collect();
                if (this.onYarnCollect) {
                    this.onYarnCollect(yarn);
                }
            }
        }
        
        // Check triangle collisions
        for (const triangle of triangles) {
            if (triangle.isHit()) continue;
            
            if (this.isColliding(catLane, catZ, triangle.getLane(), triangle.z)) {
                triangle.onHit();
                if (this.onTriangleHit) {
                    this.onTriangleHit(triangle);
                }
            }
        }
    }
    
    isColliding(catLane, catZ, objectLane, objectZ) {
        // Lane must match
        if (catLane !== objectLane) return false;
        
        // Don't collide if cat is already in front of the obstacle
        // (cat's z is less than object's z means cat is ahead)
        if (catZ < objectZ) return false;
        
        // Z distance must be within threshold
        const zDistance = Math.abs(catZ - objectZ);
        return zDistance < CONFIG.COLLISION_THRESHOLD;
    }
}


