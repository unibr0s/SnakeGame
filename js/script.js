// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gridSize = 40;

// Game state
let snake = [{ x: 10, y: 10, dir: { x: 1, y: 0 } }];
let direction = { x: 1, y: 0 };
let food = { x: 15, y: 10 };
let score = 0;
let gameOver = false;

// Load images
const snakeHeadImg = new Image();
snakeHeadImg.src = 'assets/snake_head.png';

const snakeBodyImg = new Image();
snakeBodyImg.src = 'assets/snake_body.png';

const snakeTailImg = new Image();
snakeTailImg.src = 'assets/snake_tail.png';

const foodImg = new Image();
foodImg.src = 'assets/food.png';

const snakeCornerRightImg = new Image();
snakeCornerRightImg.src = 'assets/snake_corner_right.png';

const snakeCornerLeftImg = new Image();
snakeCornerLeftImg.src = 'assets/snake_corner_left.png';

// Game functions
function drawGame() {
    if (gameOver) return;
    updatePosition();
    drawBackground();
    drawFood();
    drawSnake();
    checkCollision();
    scoreDisplay.textContent = `Score: ${score}`;
}

function drawBackground() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        let segment = snake[i];
        let imageToDraw;
        let angle = getAngle(segment.dir);

        if (i === 0) {
            // Head
            imageToDraw = snakeHeadImg;
        } else if (i === snake.length - 1) {
            // Tail
            imageToDraw = snakeTailImg;
            const prevSegment = snake[i - 1];
            const dx = prevSegment.x - segment.x;
            const dy = prevSegment.y - segment.y;
            if (Math.abs(dx) > 1) angle = dx > 0 ? Math.PI : 0;
            else if (Math.abs(dy) > 1) angle = dy > 0 ? Math.PI/2 : -Math.PI/2;
            else angle = getAngle({ x: dx, y: dy });
        } else {
            // Body segments
            imageToDraw = snakeBodyImg;  // Default to body image
            
            // Get previous segment's direction
            if (i > 0) {
                const prevSegment = snake[i - 1];
                const dx = prevSegment.x - segment.x;
                const dy = prevSegment.y - segment.y;
                
                // Calculate angle based on actual position difference
                if (Math.abs(dx) > 1) angle = dx > 0 ? Math.PI : 0;
                else if (Math.abs(dy) > 1) angle = dy > 0 ? Math.PI/2 : -Math.PI/2;
                else angle = getAngle({ x: dx, y: dy });
            }
        }

        ctx.save();
        ctx.translate(
            segment.x * gridSize + gridSize / 2,
            segment.y * gridSize + gridSize / 2
        );
        ctx.rotate(angle);
        ctx.drawImage(imageToDraw, -gridSize / 2, -gridSize / 2, gridSize, gridSize);
        ctx.restore();
    }
}

function getAngle(direction) {
    if (direction.x === 1) return 0;        // Right
    if (direction.x === -1) return Math.PI; // Left
    if (direction.y === 1) return Math.PI * 0.5;  // Down
    if (direction.y === -1) return Math.PI * 1.5; // Up
    return 0;
}

function drawFood() {
    ctx.drawImage(
        foodImg,
        food.x * gridSize,
        food.y * gridSize,
        gridSize,
        gridSize
    );
}

function updatePosition() {
    const newHead = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y,
        dir: direction
    };

    const maxCellsX = canvas.width / gridSize;
    const maxCellsY = canvas.height / gridSize;

    if (newHead.x < 0) newHead.x = maxCellsX - 1;
    else if (newHead.x >= maxCellsX) newHead.x = 0;
    if (newHead.y < 0) newHead.y = maxCellsY - 1;
    else if (newHead.y >= maxCellsY) newHead.y = 0;

    snake.unshift(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
        score++;
        placeFood();
    } else {
        snake.pop();
    }
}

function placeFood() {
    const maxCellsX = canvas.width / gridSize;
    const maxCellsY = canvas.height / gridSize;
    food.x = Math.floor(Math.random() * maxCellsX);
    food.y = Math.floor(Math.random() * maxCellsY);
}

function checkCollision() {
    for (let i = 1; i < snake.length; i++) {
        if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
            gameOver = true;
            alert(`Game Over! Your score is ${score}`);
            resetGame();
            break;
        }
    }
}

function resetGame() {
    snake = [{ x: 10, y: 10, dir: { x: 1, y: 0 } }];
    direction = { x: 1, y: 0 };
    score = 0;
    food = { x: 15, y: 10 };
    gameOver = false;
}

// Event listeners
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (snake[0].dir.x !== 1) {
                direction = { x: -1, y: 0 };
            }
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (snake[0].dir.x !== 0 || snake[0].dir.y !== 1) {
                direction = { x: 0, y: -1 };
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (snake[0].dir.x !== -1) {
                direction = { x: 1, y: 0 };
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (snake[0].dir.x !== 0 || snake[0].dir.y !== -1) {
                direction = { x: 0, y: 1 };
            }
            break;
    }
});

// Start game loop
setInterval(drawGame, 150);
