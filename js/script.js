// Game constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gridSize = 40;

// Game state
let snake = [
    { x: 10, y: 10, dir: { x: 1, y: 0 } },  // Head
    { x: 9, y: 10, dir: { x: 1, y: 0 } }    // Tail
];
let direction = { x: 1, y: 0 };
let food = { x: 15, y: 10 };
let score = 0;
let gameOver = false;
let nextDirection = { x: 1, y: 0 };  // Initialize with the current direction
let foodFrame = 0;
const FOOD_FRAMES = 10; // Number of frames/images you have
const foodImages = [];

// Load images
const snakeHeadImg = new Image();
snakeHeadImg.src = 'assets/snake_head.png';

const snakeBodyImg = new Image();
snakeBodyImg.src = 'assets/snake_body.png';

const snakeTailImg = new Image();
snakeTailImg.src = 'assets/snake_tail.png';

const snakeCornerRightImg = new Image();
snakeCornerRightImg.src = 'assets/snake_corner_right.png';

const snakeCornerLeftImg = new Image();
snakeCornerLeftImg.src = 'assets/snake_corner_left.png';

// Load all food images
for (let i = 0; i < FOOD_FRAMES; i++) {
    const img = new Image();
    img.src = `assets/food_${i}.png`; // Name your files food_0.png, food_1.png, etc.
    foodImages.push(img);
}

// At the top with other canvas setup
ctx.imageSmoothingEnabled = false;  // Disable smoothing for pixel art
canvas.style.backgroundColor = 'transparent';  // Set canvas background transparent

// Preload background image
const backgroundImg = new Image();
backgroundImg.src = 'assets/game_background.png';

// Force immediate loading of background
document.body.onload = function() {
    drawBackground();
};

// Update these audio declarations to match your file names
const backgroundMusic = new Audio('assets/background_music.mp3');
const eatSound = new Audio('assets/eat_food.mp3');
const gameOverSound = new Audio('assets/you_lose.mp3');

// Set up audio with fixed volumes
backgroundMusic.loop = true;
backgroundMusic.volume = 0.15;  // Adjust this value (0.0 to 1.0)
eatSound.volume = 0.25;         // Adjust this value (0.0 to 1.0)
gameOverSound.volume = 0.25;    // Adjust this value (0.0 to 1.0)

// Start background music when game starts
function startGame() {
    // Try to play music but handle the promise rejection
    backgroundMusic.play().catch(error => {
        console.log('Autoplay prevented. Press any movement key to start music.');
        // Add keydown handler to start music on first key press
        function startMusicOnKey(e) {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
                 'a', 'A', 'w', 'W', 's', 'S', 'd', 'D'].includes(e.key)) {
                backgroundMusic.play();
                // Remove the key handler after first use
                document.removeEventListener('keydown', startMusicOnKey);
            }
        }
        document.addEventListener('keydown', startMusicOnKey);
    });
}

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
    // Draw the background image if it's loaded
    if (backgroundImg.complete && backgroundImg.naturalHeight !== 0) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    } else {
        // Clear the canvas (transparent) instead of white background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Try to load the background again
        backgroundImg.onload = function() {
            ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        };
    }
}

function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        let segment = snake[i];
        let imageToDraw = snakeBodyImg;  // Default to body image
        let angle = getAngle(segment.dir);

        if (i === 0) {
            // Head is always the first segment
            imageToDraw = snakeHeadImg;
        } else if (i === snake.length - 1) {
            // Tail is always the last segment
            imageToDraw = snakeTailImg;
            const prevSegment = snake[i - 1];
            // Calculate tail angle based on previous segment
            const dx = prevSegment.x - segment.x;
            const dy = prevSegment.y - segment.y;
            if (Math.abs(dx) > 1) angle = dx > 0 ? Math.PI : 0;
            else if (Math.abs(dy) > 1) angle = dy > 0 ? Math.PI/2 : -Math.PI/2;
            else angle = getAngle({ x: dx, y: dy });
        } else if (i > 0 && i < snake.length - 1) {
            // Only check for corners on body segments
            const prevSegment = snake[i - 1];
            const nextSegment = snake[i + 1];
            
            // Simple direction change check
            const dx1 = prevSegment.x - segment.x;
            const dy1 = prevSegment.y - segment.y;
            const dx2 = nextSegment.x - segment.x;
            const dy2 = nextSegment.y - segment.y;

            // Only use corner pieces when there's a clear turn
            if (dx1 !== dx2 && dy1 !== dy2) {
                const isClockwise = (dx1 === 1 && dy2 === 1) || 
                                  (dy1 === 1 && dx2 === -1) || 
                                  (dx1 === -1 && dy2 === -1) || 
                                  (dy1 === -1 && dx2 === 1);
                
                imageToDraw = isClockwise ? snakeCornerRightImg : snakeCornerLeftImg;
                // Adjust angle based on turn direction
                if (isClockwise) {
                    angle = getAngle({ x: dx1, y: dy1 });
                } else {
                    // For counter-clockwise turns, calculate angle based on the turn direction
                    if (dx1 === 1 && dy2 === -1) angle = Math.PI/2;     // From right, turning up
                    else if (dx1 === -1 && dy2 === 1) angle = -Math.PI/2; // From left, turning down
                    else if (dy1 === 1 && dx2 === 1) angle = Math.PI;    // From down, turning right
                    else if (dy1 === -1 && dx2 === -1) angle = 0;       // From up, turning left
                }
            }
        }

        // Draw the segment if image is loaded
        if (imageToDraw.complete && imageToDraw.naturalHeight !== 0) {
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
        foodImages[Math.floor(foodFrame)],
        food.x * gridSize,
        food.y * gridSize,
        gridSize,
        gridSize
    );
    
    // Update frame for ~100 FPS
    foodFrame = (foodFrame + 4.5) % FOOD_FRAMES; // Much faster animation
}

function updatePosition() {
    if (nextDirection.x !== -direction.x || nextDirection.y !== -direction.y) {
        direction = nextDirection;
    }

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
        console.log('Playing eat sound...'); // Debug log
        eatSound.currentTime = 0; // Reset sound to start
        eatSound.play().catch(e => console.error('Error playing eat sound:', e));
        placeFood();
    } else {
        snake.pop();
    }

    // Debugging: Log the snake's state
    console.log('Snake:', snake.map(s => ({ x: s.x, y: s.y, dir: s.dir })));
}

function placeFood() {
    const maxCellsX = canvas.width / gridSize;
    const maxCellsY = canvas.height / gridSize;
    food.x = Math.floor(Math.random() * maxCellsX);
    food.y = Math.floor(Math.random() * maxCellsY);

    // Ensure food doesn't spawn on the snake
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food.x = Math.floor(Math.random() * maxCellsX);
        food.y = Math.floor(Math.random() * maxCellsY);
    }
}

function checkCollision() {
    for (let i = 1; i < snake.length; i++) {
        if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
            gameOver = true;
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
            gameOverSound.play();
            alert(`Game Over! Your score is ${score}`);
            resetGame();
            break;
        }
    }
}

function resetGame() {
    snake = [
        { x: 10, y: 10, dir: { x: 1, y: 0 } },  // Head
        { x: 9, y: 10, dir: { x: 1, y: 0 } }    // Tail
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    food = { x: 15, y: 10 };
    gameOver = false;
    
    // Try to play music but don't force it if browser blocks it
    backgroundMusic.play().catch(error => {
        console.log('Music playback prevented by browser.');
    });
}

// Event listeners
document.addEventListener('keydown', (e) => {
    let proposedDirection = null;
    
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x !== 1) {
                proposedDirection = { x: -1, y: 0 };
            }
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.y !== 1) {
                proposedDirection = { x: 0, y: -1 };
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x !== -1) {
                proposedDirection = { x: 1, y: 0 };
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.y !== -1) {
                proposedDirection = { x: 0, y: 1 };
            }
            break;
    }

    if (proposedDirection) {
        nextDirection = proposedDirection;
    }
});

setInterval(drawGame, 150);

// Add this at the end to start the music when the page loads
window.addEventListener('load', startGame);

// Add single mute variable
let isSoundMuted = false;

// Single toggle button listener
document.getElementById('toggleSound').addEventListener('click', () => {
    isSoundMuted = !isSoundMuted;
    backgroundMusic.muted = isSoundMuted;
    eatSound.muted = isSoundMuted;
    gameOverSound.muted = isSoundMuted;
    
    // Update icon based on mute state
    const volumeIcon = document.querySelector('.volume-icon');
    volumeIcon.src = isSoundMuted ? 'assets/icons/volume-off.png' : 'assets/icons/volume-on.png';
    document.getElementById('toggleSound').classList.toggle('muted', isSoundMuted);
});

// Add this to your existing JavaScript
function setupMobileControls() {
    // Touch controls
    document.getElementById('upButton').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (direction.y !== 1) {
            nextDirection = { x: 0, y: -1 };
        }
    });

    document.getElementById('downButton').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (direction.y !== -1) {
            nextDirection = { x: 0, y: 1 };
        }
    });

    document.getElementById('leftButton').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (direction.x !== 1) {
            nextDirection = { x: -1, y: 0 };
        }
    });

    document.getElementById('rightButton').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (direction.x !== -1) {
            nextDirection = { x: 1, y: 0 };
        }
    });
}

// Call this when the page loads
setupMobileControls();

// Add this line after all your image loading code
drawBackground();  // Initial draw of background
