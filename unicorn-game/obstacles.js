// obstacles.js
class Water {
    constructor() {
        this.x = CONFIG.CANVAS_WIDTH;
        this.y = CONFIG.CANVAS_HEIGHT - CONFIG.PLATFORM_HEIGHT;
        this.width = 100 + Math.random() * 100;
        this.height = CONFIG.PLATFORM_HEIGHT;
    }

    draw(ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= CONFIG.GAME_SPEED;
    }
}

class ObstacleManager {
    constructor() {
        this.obstacles = [];
    }

    update() {
        if (Math.random() < 0.02 && this.obstacles.length < 3) {
            this.obstacles.push(new Water());
        }

        this.obstacles.forEach((obstacle, index) => {
            obstacle.update();
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(index, 1);
            }
        });
    }

    draw(ctx) {
        this.obstacles.forEach(obstacle => obstacle.draw(ctx));
    }

    checkCollision(unicorn) {
        return this.obstacles.some(obstacle => 
            unicorn.x < obstacle.x + obstacle.width &&
            unicorn.x + unicorn.width > obstacle.x &&
            unicorn.y + unicorn.height > obstacle.y
        );
    }
}