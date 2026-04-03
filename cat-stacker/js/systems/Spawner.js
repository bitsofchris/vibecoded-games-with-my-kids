// Spawner System - Pre-generated level
import { CONFIG } from '../config.js';
import { Yarn } from '../entities/Yarn.js';
import { Triangle } from '../entities/Triangle.js';

export class Spawner {
    constructor(scene, currentLevel = 1, yarnRequired = 75) {
        this.scene = scene;
        this.yarns = [];
        this.triangles = [];
        this.generated = false;
        this.currentLevel = currentLevel;
        this.yarnRequired = yarnRequired;
        
        // Density settings (from game settings panel)
        this.yarnDensity = 1.5;      // Default: 1.5x yarn required
        this.obstacleDensity = 2;    // Default: 2x yarn required for max obstacles
    }
    
    setLevelInfo(currentLevel, yarnRequired) {
        this.currentLevel = currentLevel;
        this.yarnRequired = yarnRequired;
    }
    
    setDensitySettings(yarnDensity, obstacleDensity) {
        this.yarnDensity = yarnDensity;
        this.obstacleDensity = obstacleDensity;
    }
    
    getDifficulty(distance, easyEnd, mediumEnd) {
        if (distance < easyEnd) return 'easy';
        if (distance < mediumEnd) return 'medium';
        return 'hard';
    }
    
    selectPattern(difficulty, levelScaling, needsMoreYarn, atObstacleLimit) {
        const patterns = CONFIG.PATTERNS[difficulty];
        
        // If we need more yarn, favor patterns with more yarns
        if (needsMoreYarn) {
            // First try to find patterns with 3 yarns (maximum)
            const maxYarnPatterns = patterns.filter(p => {
                const yarnCount = (p.match(/Y/g) || []).length;
                return yarnCount === 3;
            });
            if (maxYarnPatterns.length > 0) {
                return maxYarnPatterns[Math.floor(Math.random() * maxYarnPatterns.length)];
            }
            
            // Fallback to patterns with 2+ yarns
            const yarnPatterns = patterns.filter(p => {
                const yarnCount = (p.match(/Y/g) || []).length;
                return yarnCount >= 2;
            });
            if (yarnPatterns.length > 0) {
                return yarnPatterns[Math.floor(Math.random() * yarnPatterns.length)];
            }
        }
        
        // If at obstacle limit, avoid patterns with obstacles
        if (atObstacleLimit) {
            const safePatterns = patterns.filter(p => !p.includes('T'));
            if (safePatterns.length > 0) {
                return safePatterns[Math.floor(Math.random() * safePatterns.length)];
            }
        }
        
        // Apply level-based probability adjustments
        // Patterns with more obstacles get slightly higher weight at higher levels
        const weightedPatterns = patterns.map(pattern => {
            const yarnCount = (pattern.match(/Y/g) || []).length;
            const obstacleCount = (pattern.match(/T/g) || []).length;
            
            // Base weight
            let weight = 1.0;
            
            // Slightly reduce weight for high-yarn patterns as level increases
            if (yarnCount >= 2) {
                weight *= (1 - levelScaling);
            }
            
            // Slightly increase weight for patterns with obstacles as level increases
            if (obstacleCount > 0) {
                weight *= (1 + levelScaling * 0.5); // Half the scaling for obstacles
            }
            
            return { pattern, weight };
        });
        
        // Select pattern based on weights
        const totalWeight = weightedPatterns.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        for (const { pattern, weight } of weightedPatterns) {
            random -= weight;
            if (random <= 0) {
                return pattern;
            }
        }
        
        // Fallback to random selection
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    
    spawnRow(zPosition, difficulty, levelScaling, needsMoreYarn, atObstacleLimit) {
        const pattern = this.selectPattern(difficulty, levelScaling, needsMoreYarn, atObstacleLimit);
        
        let yarnCount = 0;
        let obstacleCount = 0;
        
        // Parse pattern: Y = Yarn, T = Triangle, X = Empty
        for (let i = 0; i < 3; i++) {
            const char = pattern[i];
            const x = CONFIG.LANE_POSITIONS[i];
            
            if (char === 'Y') {
                const yarn = new Yarn(this.scene, x, zPosition);
                this.yarns.push(yarn);
                yarnCount++;
            } else if (char === 'T') {
                // Only spawn obstacle if we haven't exceeded limit
                if (!atObstacleLimit) {
                    const triangle = new Triangle(this.scene, x, zPosition);
                    this.triangles.push(triangle);
                    obstacleCount++;
                }
            }
            // 'X' = empty, do nothing
        }
        
        return { yarns: yarnCount, obstacles: obstacleCount };
    }
    
    // Pre-generate the entire level at once
    generateFullLevel(levelEndDistance, easyEndDistance, mediumEndDistance) {
        if (this.generated) return;
        
        // Calculate targets based on level requirements and density settings
        const targetYarnCount = this.yarnDensity * this.yarnRequired;  // Use density setting
        const maxObstacleCount = this.obstacleDensity * this.yarnRequired;  // Use density setting
        
        // Track counts during generation
        let yarnCount = 0;
        let obstacleCount = 0;
        
        // Calculate level scaling factor (1-2% reduction per level)
        const levelScaling = Math.min(0.02 * (this.currentLevel - 1), 0.2); // Cap at 20% max reduction
        
        // Generate rows from start to just before water
        // Leave some empty space before water for visual clarity
        const startZ = -10;
        const endZ = -(levelEndDistance - 5);  // Stop 5 units before water
        const levelLength = startZ - endZ;
        
        // Dynamic row spacing based on yarn density
        // At 1x density, use normal spacing (7). At higher density, reduce spacing to fit more rows.
        // Calculate how many rows we need: targetYarnCount / avgYarnsPerRow (assume ~2 yarns/row average)
        const avgYarnsPerRow = 2;
        const neededRows = Math.ceil(targetYarnCount / avgYarnsPerRow);
        const minRowSpacing = 2.5;  // Minimum spacing to prevent overlap
        const maxRowSpacing = CONFIG.ROW_SPACING;
        
        // Calculate spacing to fit needed rows, clamped to min/max
        let rowSpacing = Math.max(minRowSpacing, Math.min(maxRowSpacing, levelLength / neededRows));
        
        // Calculate total rows to estimate progress
        const totalRows = Math.floor(levelLength / rowSpacing);
        let rowsGenerated = 0;
        
        for (let z = startZ; z > endZ; z -= rowSpacing) {
            const distance = Math.abs(z);
            const difficulty = this.getDifficulty(distance, easyEndDistance, mediumEndDistance);
            rowsGenerated++;
            
            // Check if we need to enforce constraints
            const needsMoreYarn = yarnCount < targetYarnCount;
            const atObstacleLimit = obstacleCount >= maxObstacleCount;
            
            // If we're past 80% of level and still need yarn, be more aggressive
            const progress = rowsGenerated / totalRows;
            const criticalYarnNeed = needsMoreYarn && progress > 0.8;
            
            // Spawn row with level-based adjustments
            const rowCounts = this.spawnRow(z, difficulty, levelScaling, needsMoreYarn || criticalYarnNeed, atObstacleLimit);
            yarnCount += rowCounts.yarns;
            obstacleCount += rowCounts.obstacles;
        }
        
        this.generated = true;
    }
    
    update(catZ, distance) {
        // No dynamic spawning - level is pre-generated
        
        // Update all objects (rotation animations)
        for (const yarn of this.yarns) {
            if (!yarn.isCollected()) {
                yarn.update();
            }
        }
        
        for (const triangle of this.triangles) {
            if (!triangle.isHit()) {
                triangle.update();
            }
        }
        
        // Despawn objects behind cat
        this.despawn(catZ);
    }
    
    despawn(catZ) {
        const despawnThreshold = catZ + CONFIG.DESPAWN_BEHIND_DISTANCE;
        
        // Remove yarns behind camera
        this.yarns = this.yarns.filter(yarn => {
            if (yarn.z > despawnThreshold || yarn.isCollected()) {
                yarn.dispose();
                return false;
            }
            return true;
        });
        
        // Remove triangles behind camera
        this.triangles = this.triangles.filter(triangle => {
            if (triangle.z > despawnThreshold || triangle.isHit()) {
                triangle.dispose();
                return false;
            }
            return true;
        });
    }
    
    getYarns() {
        return this.yarns.filter(y => !y.isCollected());
    }
    
    getTriangles() {
        return this.triangles.filter(t => !t.isHit());
    }
    
    reset() {
        // Clean up all objects
        for (const yarn of this.yarns) {
            yarn.dispose();
        }
        for (const triangle of this.triangles) {
            triangle.dispose();
        }
        
        this.yarns = [];
        this.triangles = [];
        this.generated = false;
    }
    
    dispose() {
        this.reset();
    }
}

