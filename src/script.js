const board = document.querySelector(".board");

const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");

const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");

const highScoreElement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");

// =========================
// GAME SETTINGS
// =========================

const gameSpeed = 300;

const desktopCellSize = 50;
const mobileMinCellSize = 24;

let rows = 0;
let cols = 0;

let cellWidth = desktopCellSize;
let cellHeight = desktopCellSize;


// =========================
// GAME STATE
// =========================

let highScore =
    Number(localStorage.getItem("highScore")) || 0;

let score = 0;

let minutes = 0;
let seconds = 0;

let intervalId = null;
let timerIntervalId = null;

let food = {
    x: 0,
    y: 0
};

let snake = [
    {
        x: 1,
        y: 3
    }
];

let direction = "down";

let blocks = [];

let gameStarted = false;


// =========================
// INITIAL UI
// =========================

highScoreElement.innerText = highScore;
scoreElement.innerText = score;
timeElement.innerText = "00-00";


// =========================
// BOARD SIZE
// =========================

function calculateBoardSize() {

    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;

    if (
        boardWidth <= 0 ||
        boardHeight <= 0
    ) {
        return;
    }


    const isMobile =
        window.matchMedia(
            "(max-width: 600px)"
        ).matches;


    if (isMobile) {

        /*
         * Choose a practical number of columns
         * based on available width.
         */

        const targetCellSize =
            Math.max(
                mobileMinCellSize,
                Math.min(
                    32,
                    Math.floor(boardWidth / 12)
                )
            );

        cols = Math.max(
            8,
            Math.floor(
                boardWidth / targetCellSize
            )
        );

    } else {

        cols = Math.max(
            8,
            Math.floor(
                boardWidth / desktopCellSize
            )
        );
    }


    cellWidth =
        boardWidth / cols;


    /*
     * Keep cells approximately square.
     */

    rows = Math.max(
        8,
        Math.floor(
            boardHeight / cellWidth
        )
    );


    cellHeight =
        boardHeight / rows;


    board.style.gridTemplateColumns =
        `repeat(${cols}, 1fr)`;

    board.style.gridTemplateRows =
        `repeat(${rows}, 1fr)`;
}


// =========================
// CREATE BOARD
// =========================

function createBoard() {

    board.innerHTML = "";

    blocks = [];

    calculateBoardSize();


    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            const block =
                document.createElement("div");

            block.classList.add("block");

            board.appendChild(block);

            blocks[`${row}-${col}`] = block;
        }
    }
}


// =========================
// FOOD
// =========================

function generateFood() {

    let newFood;

    const totalCells =
        rows * cols;

    /*
     * Safety limit prevents an infinite
     * loop if the snake fills the board.
     */

    let attempts = 0;

    do {

        newFood = {
            x: Math.floor(
                Math.random() * rows
            ),

            y: Math.floor(
                Math.random() * cols
            )
        };

        attempts++;

    } while (
        snake.some(
            segment =>
                segment.x === newFood.x &&
                segment.y === newFood.y
        ) &&
        attempts < totalCells
    );


    if (attempts < totalCells) {
        food = newFood;
    }
}


function showFood() {

    const foodBlock =
        blocks[`${food.x}-${food.y}`];

    if (foodBlock) {
        foodBlock.classList.add("food");
    }
}


function removeFood() {

    const foodBlock =
        blocks[`${food.x}-${food.y}`];

    if (foodBlock) {
        foodBlock.classList.remove("food");
    }
}


// =========================
// SNAKE
// =========================

function showSnake() {

    snake.forEach(
        (segment, index) => {

            const block =
                blocks[
                    `${segment.x}-${segment.y}`
                ];

            if (!block) {
                return;
            }

            block.classList.add("fill");

            if (index === 0) {
                block.classList.add("head");
            }
        }
    );
}


function removeSnake() {

    snake.forEach(segment => {

        const block =
            blocks[
                `${segment.x}-${segment.y}`
            ];

        if (!block) {
            return;
        }

        block.classList.remove("fill");
        block.classList.remove("head");
    });
}


// =========================
// NEXT HEAD
// =========================

function getNextHead() {

    const head = snake[0];

    if (direction === "left") {

        return {
            x: head.x,
            y: head.y - 1
        };

    }

    if (direction === "right") {

        return {
            x: head.x,
            y: head.y + 1
        };

    }

    if (direction === "up") {

        return {
            x: head.x - 1,
            y: head.y
        };

    }

    return {
        x: head.x + 1,
        y: head.y
    };
}


// =========================
// SCORE
// =========================

function updateScore() {

    scoreElement.innerText = score;


    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "highScore",
            highScore.toString()
        );

        highScoreElement.innerText =
            highScore;
    }
}


// =========================
// TIMER
// =========================

function updateTimer() {

    seconds += 1;


    if (seconds === 60) {

        minutes += 1;
        seconds = 0;
    }


    const formattedMinutes =
        String(minutes).padStart(2, "0");

    const formattedSeconds =
        String(seconds).padStart(2, "0");


    timeElement.innerText =
        `${formattedMinutes}-${formattedSeconds}`;
}


function startTimer() {

    stopTimer();


    timerIntervalId =
        setInterval(
            updateTimer,
            1000
        );
}


function stopTimer() {

    clearInterval(
        timerIntervalId
    );

    timerIntervalId = null;
}


function resetTimer() {

    stopTimer();

    minutes = 0;
    seconds = 0;

    timeElement.innerText = "00-00";
}


// =========================
// GAME OVER
// =========================

function gameOver() {

    clearInterval(intervalId);

    intervalId = null;

    stopTimer();

    gameStarted = false;

    modal.style.display = "flex";

    startGameModal.style.display = "none";

    gameOverModal.style.display = "flex";
}


// =========================
// GAME RENDER
// =========================

function render() {

    if (!gameStarted) {
        return;
    }


    const head =
        getNextHead();


    // Wall collision

    if (
        head.x < 0 ||
        head.x >= rows ||
        head.y < 0 ||
        head.y >= cols
    ) {

        gameOver();

        return;
    }


    // Food collision

    const ateFood =
        head.x === food.x &&
        head.y === food.y;


    /*
     * If food is not eaten, the tail will
     * move away during this frame, so it
     * doesn't count as a collision.
     */

    const bodyToCheck =
        ateFood
            ? snake
            : snake.slice(0, -1);


    const hitSnake =
        bodyToCheck.some(
            segment =>
                segment.x === head.x &&
                segment.y === head.y
        );


    if (hitSnake) {

        gameOver();

        return;
    }


    removeSnake();

    snake.unshift(head);


    if (ateFood) {

        score += 10;

        updateScore();

        removeFood();

        generateFood();

        showFood();

    } else {

        snake.pop();
    }


    showSnake();
}


// =========================
// START GAME
// =========================

startButton.addEventListener(
    "click",
    startGame
);


function startGame() {

    if (gameStarted) {
        return;
    }


    modal.style.display = "none";

    startGameModal.style.display = "none";

    gameOverModal.style.display = "none";


    /*
     * Recalculate the board before starting.
     */

    createBoard();


    /*
     * Keep the initial snake inside
     * the newly calculated board.
     */

    snake = [
        {
            x: Math.min(
                1,
                rows - 1
            ),

            y: Math.min(
                3,
                cols - 1
            )
        }
    ];


    score = 0;

    scoreElement.innerText = score;


    direction = "down";


    generateFood();

    showSnake();

    showFood();


    gameStarted = true;


    intervalId =
        setInterval(
            render,
            gameSpeed
        );


    resetTimer();

    startTimer();
}


// =========================
// RESTART GAME
// =========================

restartButton.addEventListener(
    "click",
    restartGame
);


function restartGame() {

    clearInterval(intervalId);

    intervalId = null;

    stopTimer();


    gameStarted = false;


    snake = [
        {
            x: 1,
            y: 3
        }
    ];


    score = 0;

    scoreElement.innerText = score;

    highScoreElement.innerText =
        highScore;


    direction = "down";


    resetTimer();


    modal.style.display = "none";


    createBoard();


    snake = [
        {
            x: Math.min(
                1,
                rows - 1
            ),

            y: Math.min(
                3,
                cols - 1
            )
        }
    ];


    generateFood();

    showSnake();

    showFood();


    gameStarted = true;


    intervalId =
        setInterval(
            render,
            gameSpeed
        );


    startTimer();
}


// =========================
// CHANGE DIRECTION
// =========================

function changeDirection(
    newDirection
) {

    if (!gameStarted) {
        return;
    }


    if (
        newDirection === "up" &&
        direction !== "down"
    ) {

        direction = "up";

    } else if (
        newDirection === "right" &&
        direction !== "left"
    ) {

        direction = "right";

    } else if (
        newDirection === "left" &&
        direction !== "right"
    ) {

        direction = "left";

    } else if (
        newDirection === "down" &&
        direction !== "up"
    ) {

        direction = "down";
    }
}


// =========================
// KEYBOARD CONTROLS
// =========================

document.addEventListener(
    "keydown",
    event => {

        // Start / restart with Enter or Space
        if (
            event.code === "Enter" ||
            event.code === "Space"
        ) {

            event.preventDefault();

            if (
                startGameModal.style.display !== "none"
            ) {

                startGame();

            } else if (
                gameOverModal.style.display !== "none"
            ) {

                restartGame();
            }

            return;
        }


        // Snake movement
        const keyDirections = {
            ArrowUp: "up",
            ArrowRight: "right",
            ArrowDown: "down",
            ArrowLeft: "left"
        };


        const newDirection =
            keyDirections[event.code];


        if (!newDirection) {
            return;
        }


        event.preventDefault();


        changeDirection(
            newDirection
        );
    }
);

// =========================
// SWIPE CONTROLS
// =========================

let touchStartX = 0;
let touchStartY = 0;


board.addEventListener(
    "touchstart",
    event => {

        const touch =
            event.changedTouches[0];

        touchStartX =
            touch.clientX;

        touchStartY =
            touch.clientY;

    },
    {
        passive: true
    }
);


board.addEventListener(
    "touchend",
    event => {

        const touch =
            event.changedTouches[0];

        const deltaX =
            touch.clientX - touchStartX;

        const deltaY =
            touch.clientY - touchStartY;


        const minimumSwipeDistance = 25;


        if (
            Math.abs(deltaX) <
                minimumSwipeDistance &&
            Math.abs(deltaY) <
                minimumSwipeDistance
        ) {
            return;
        }


        if (
            Math.abs(deltaX) >
            Math.abs(deltaY)
        ) {

            if (deltaX > 0) {
                changeDirection("right");
            } else {
                changeDirection("left");
            }

        } else {

            if (deltaY > 0) {
                changeDirection("down");
            } else {
                changeDirection("up");
            }
        }
    },
    {
        passive: true
    }
);


// =========================
// RESPONSIVE RESIZE
// =========================

let resizeTimeout = null;


window.addEventListener(
    "resize",
    () => {

        clearTimeout(resizeTimeout);


        resizeTimeout =
            setTimeout(() => {

                if (!gameStarted) {

                    createBoard();

                    return;
                }


                /*
                 * Don't rebuild the board while
                 * the game is running. This prevents
                 * the snake from suddenly changing
                 * coordinates during gameplay.
                 */

            }, 150);
    }
);


// =========================
// INITIAL BOARD
// =========================

createBoard();