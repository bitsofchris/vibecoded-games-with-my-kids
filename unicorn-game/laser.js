// laser.js
class Laser {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.LASER_WIDTH;
        this.height = CONFIG.LASER_HEIGHT;
        this.speed = CONFIG.LASER_SPEED;
    }

    update() {
        this.x += this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = CONFIG.LASER_COLOR;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}