// unicorn.js
class Unicorn {
    constructor() {
        this.x = CONFIG.UNICORN_START_X;
        this.y = CONFIG.UNICORN_START_Y;
        this.width = CONFIG.UNICORN_WIDTH;
        this.height = CONFIG.UNICORN_HEIGHT;
        this.speed = 5;
        this.jumpStrength = 15;
        this.yVelocity = 0;
        this.isJumping = false;
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrame = 4;
        this.animationSpeed = 5;
        this.animationCounter = 0;

        this.sprite = new Image();
        this.sprite.src = CONFIG.SPRITE_PATH;
    }

    draw(ctx) {
        ctx.drawImage(
            this.sprite,
            this.frameX * this.width,
            this.frameY * this.height,
            this.width,
            this.height,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    // animate() {
    //     this.animationCounter++;
    //     if (this.animationCounter > this.animationSpeed) {
    //         this.frameX = (this.frameX + 1) % this.maxFrame;
    //         this.animationCounter = 0;
    //     }

    //     this.frameY = this.isJumping ? 1 : 0;
    // }

    update() {
        this.yVelocity += CONFIG.GRAVITY;
        this.y += this.yVelocity;

        if (this.y + this.height > CONFIG.CANVAS_HEIGHT - CONFIG.PLATFORM_HEIGHT) {
            this.y = CONFIG.CANVAS_HEIGHT - CONFIG.PLATFORM_HEIGHT - this.height;
            this.yVelocity = 0;
            this.isJumping = false;
        }

        // this.animate();
    }

    jump() {
        if (!this.isJumping) {
            this.yVelocity = -this.jumpStrength;
            this.isJumping = true;
        }
    }
}