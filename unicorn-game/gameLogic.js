// gameLogic.js
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.unicorn = new Unicorn();
        this.obstacleManager = new ObstacleManager();
        this.score = 0;
        this.isGameOver = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                this.unicorn.jump();
            }
        });

        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.unicorn.jump();
        });

        this.canvas.addEventListener('click', () => {
            this.unicorn.jump();
        });
    }

    update() {
        if (this.isGameOver) return;

        this.unicorn.update();
        this.obstacleManager.update();

        if (this.obstacleManager.checkCollision(this.unicorn)) {
            this.gameOver();
        }

        this.score++;
    }

    draw() {
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Draw platform
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - CONFIG.PLATFORM_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.PLATFORM_HEIGHT);

        this.unicorn.draw(this.ctx);
        this.obstacleManager.draw(this.ctx);

        // Draw score
        this.ctx.fillStyle = 'black';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Score: ' + Math.floor(this.score / 10), 10, 30);
    }

    gameOver() {
        this.isGameOver = true;
        alert('Game Over! Score: ' + Math.floor(this.score / 10));
    }

    reset() {
        this.unicorn = new Unicorn();
        this.obstacleManager = new ObstacleManager();
        this.score = 0;
        this.isGameOver = false;
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.gameLoop();
    }
}