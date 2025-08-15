// =================================
// 1. 기본 설정 및 변수 선언
// =================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'START';
let score = 0;
let level = 1;
let lives = 3;
let animationFrameId;

let highScore = parseInt(localStorage.getItem('brickBreakerHighScore')) || 0;

const ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 3;
let dy = -3;

const paddleHeight = 20;
const paddleWidth = 100;
let paddleX = (canvas.width - paddleWidth) / 2;

let rightPressed = false;
let leftPressed = false;

let brickRowCount = 5;
let brickColumnCount = 11;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 50;
let brickOffsetLeft = 60;
let bricks = [];

// =================================
// 2. 에셋 로드 (이미지 및 사운드)
// =================================
const sounds = {
    hit: new Audio('sounds/hit.wav'),
    lose: new Audio('sounds/lose.wav')
};

const assets = {
    ball: new Image(),
    paddle: new Image(),
    brick: new Image(),
    brickHit: new Image(),
};
assets.ball.src = 'images/ball.png';
assets.paddle.src = 'images/paddle.png';
assets.brick.src = 'images/brick.png';
assets.brickHit.src = 'images/brick-hit.png';

let assetsLoaded = 0;
const totalAssets = Object.keys(assets).length;

for (let key in assets) {
    assets[key].onload = () => {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
            initGame();
        }
    };
}

// =================================
// 3. 게임 초기화 및 스테이지 설정
// =================================
function initBricks() {
    bricks = [];
    brickColumnCount = 5 + level * 2;
    brickRowCount = 2 + level;
    
    if (brickColumnCount > 11) brickColumnCount = 11;
    if (brickRowCount > 7) brickRowCount = 7;

    const totalBricksWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
    brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;

    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const brickStatus = Math.random() < level * 0.15 ? 2 : 1;
            bricks[c][r] = { x: 0, y: 0, status: brickStatus };
        }
    }
}

function resetBallAndPaddle() {
    x = canvas.width / 2;
    y = canvas.height - 50;
    dx = 3 + (level * 0.3);
    dy = -3 - (level * 0.3);
    paddleX = (canvas.width - paddleWidth) / 2;
}

function nextLevel() {
    lives++;
    level++;
    alert(`LEVEL ${level} START!\n\n✨ 목숨 +1 ✨`);
    resetBallAndPaddle();
    initBricks();
}

function gameOver() {
    cancelAnimationFrame(animationFrameId);
    sounds.lose.play();

    let alertMessage = `GAME OVER. 최종 점수: ${score}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('brickBreakerHighScore', highScore);
        alertMessage += `\n\n🎉 최고 기록을 달성했습니다!`;
    }
    
    alert(alertMessage);
    document.location.reload();
}

// =================================
// 4. 이벤트 리스너 (키보드 조작)
// =================================
document.addEventListener("keydown", e => {
    if (gameState === 'PLAYING') {
        if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
        else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    }

    if (e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') gameState = 'PAUSED';
        else if (gameState === 'PAUSED') gameState = 'PLAYING';
    }
    
    if (gameState === 'START' && e.key === 'Enter') {
        gameState = 'PLAYING';
        Object.values(sounds).forEach(sound => {
            sound.play();
            sound.pause();
            sound.currentTime = 0;
        });
    }
}, false);

document.addEventListener("keyup", e => {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}, false);

// =================================
// 5. 충돌 감지 및 게임 로직
// =================================
function collisionDetection() {
    let activeBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status > 0) {
                activeBricks++;
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status--;
                    if(b.status === 0) {
                        score += 10;
                    } else {
                        score += 5;
                    }
                }
            }
        }
    }
    if (activeBricks === 0) {
        nextLevel();
    }
}

// =================================
// 6. 그리기(Rendering) 함수
// =================================

// [수정] '엔딩' 문구가 추가된 시작 화면 함수
function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = "60px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("벽돌깨기 게임", canvas.width / 2, canvas.height / 2 - 150);
    
    ctx.font = "28px Arial";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, canvas.height / 2 - 80);

    const xOffset = 250;
    ctx.font = "24px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("좌우 방향키(← →)로 패들을 움직이세요", canvas.width / 2 - xOffset, canvas.height / 2);
    ctx.fillText("'P' 키로 게임을 일시정지 할 수 있습니다", canvas.width / 2 - xOffset, canvas.height / 2 + 40);

    ctx.fillText("Move paddle with Arrow Keys (← →)", canvas.width / 2 + xOffset, canvas.height / 2);
    ctx.fillText("Press 'P' to pause the game", canvas.width / 2 + xOffset, canvas.height / 2 + 40);

    ctx.fillStyle = "#FF0000";
    ctx.font = "bold 24px Arial";
    ctx.fillText("이 게임은 엔딩이 존재합니다", canvas.width / 2 - xOffset, canvas.height / 2 + 80);
    ctx.fillText("This game has an ending.", canvas.width / 2 + xOffset, canvas.height / 2 + 80);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "32px Arial";
    ctx.fillStyle = "#FFFF00";
    ctx.fillText("Press Enter to Start", canvas.width / 2, canvas.height / 2 + 150);
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = "50px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
}

function drawUI() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "#fff";
    
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 20, 30);
    
    ctx.textAlign = "center";
    ctx.fillText("Level: " + level, canvas.width / 2, 30);

    ctx.textAlign = "right";
    ctx.fillText("High Score: " + highScore, canvas.width - 20, 30);
    ctx.fillText("Lives: " + lives, canvas.width - 20, 55);
}

function drawObjects() {
    ctx.drawImage(assets.paddle, paddleX, canvas.height - paddleHeight - 20, paddleWidth, paddleHeight);
    ctx.drawImage(assets.ball, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status > 0) {
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;
                const sprite = b.status === 2 ? assets.brickHit : assets.brick;
                ctx.drawImage(sprite, brickX, brickY, brickWidth, brickHeight);
            }
        }
    }
}

// =================================
// 7. 메인 게임 루프
// =================================
function gameLoop() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawObjects();
    drawUI();

    if (gameState === 'START') {
        drawStartScreen();
    } else if (gameState === 'PAUSED') {
        drawPauseScreen();
    } else if (gameState === 'PLAYING') {
        collisionDetection();

        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
            dx = -dx;
            sounds.hit.currentTime = 0;
            sounds.hit.play();
        }
        if (y + dy < ballRadius) {
            dy = -dy;
            sounds.hit.currentTime = 0;
            sounds.hit.play();
        } else if (y + dy > canvas.height - ballRadius - 20) {
            if (x > paddleX && x < paddleX + paddleWidth) {
                dy = -dy;
                sounds.hit.currentTime = 0;
                sounds.hit.play();
            } else {
                lives--;
                if (lives < 0) {
                    gameOver();
                    return;
                } else {
                    sounds.lose.play();
                    alert("남은 생명: " + lives);
                    resetBallAndPaddle();
                }
            }
        }

        if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
        if (leftPressed && paddleX > 0) paddleX -= 7;

        x += dx;
        y += dy;
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// =================================
// 8. 게임 시작
// =================================
function initGame() {
    resetBallAndPaddle();
    initBricks();
    gameState = 'START';
    gameLoop();
}