const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreSpan = document.getElementById('score');

let gameRunning = false;
let score = 0;
let player, enemies, keys, attackCooldown, enemySpawnTimer;
let enemyTypes = [
    {
        type: 'stickman',
        color: '#f44',
        w: 40,
        h: 80,
        speedMin: 2,
        speedMax: 4
    },
    {
        type: 'robot',
        color: '#0cf',
        w: 44,
        h: 90,
        speedMin: 1.5,
        speedMax: 2.8
    },
    {
        type: 'dog',
        color: '#fa0',
        w: 50,
        h: 40,
        speedMin: 3,
        speedMax: 5
    }
];

function resetGame() {
    score = 0;
    player = {
        x: 100,
        y: canvas.height - 120,
        w: 40,
        h: 80,
        color: '#fff',
        speed: 6,
        vy: 0,
        jumping: false,
        attacking: false,
        attackFrame: 0,
        crouching: false // Dodano stan kucania
    };
    enemies = [];
    keys = {};
    attackCooldown = 0;
    enemySpawnTimer = 0;
    scoreSpan.textContent = score;
}

function drawStickman(x, y, w, h, color, attacking = false, attackFrame = 0, crouching = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    // 身体
    ctx.beginPath();
    if (crouching) {
        ctx.moveTo(x, y + h * 0.2);
        ctx.lineTo(x, y + h * 0.5);
    } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h * 0.6);
    }
    ctx.stroke();
    // 头
    ctx.beginPath();
    ctx.arc(x, y - h * 0.2 + (crouching ? h * 0.25 : 0), w * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    // 五官（眼睛和嘴巴）
    ctx.save();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    // 眼睛
    let eyeY = y - h * 0.23 + (crouching ? h * 0.25 : 0);
    ctx.beginPath();
    ctx.arc(x - w * 0.12, eyeY, w * 0.06, 0, Math.PI * 2);
    ctx.arc(x + w * 0.12, eyeY, w * 0.06, 0, Math.PI * 2);
    ctx.stroke();
    // 嘴巴
    ctx.beginPath();
    ctx.arc(x, y - h * 0.16 + (crouching ? h * 0.25 : 0), w * 0.11, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
    // 帽子
    ctx.save();
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.32 + (crouching ? h * 0.25 : 0), w * 0.38, h * 0.10, 0, Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.38, y - h * 0.32 + (crouching ? h * 0.25 : 0));
    ctx.lineTo(x + w * 0.38, y - h * 0.32 + (crouching ? h * 0.25 : 0));
    ctx.lineTo(x, y - h * 0.45 + (crouching ? h * 0.25 : 0));
    ctx.closePath();
    ctx.fillStyle = '#2980b9';
    ctx.fill();
    ctx.restore();
    // 披风
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.1);
    ctx.bezierCurveTo(x - w * 0.8, y + h * 0.5, x + w * 0.8, y + h * 0.7, x, y + h * 0.9);
    ctx.lineTo(x, y + h * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // 手
    ctx.beginPath();
    let swordLength = w * 1.2;
    let swordAngle = 0;
    let handX = x + w * 0.7;
    let handY = y + h * 0.3 + (crouching ? h * 0.2 : 0);
    if (attacking && crouching) {
        // 蹲下挥砍
        ctx.moveTo(x, y + h * 0.25);
        ctx.lineTo(x + w * 1.1 + attackFrame * 2, y + h * 0.25 + attackFrame * 0.8);
        ctx.moveTo(x, y + h * 0.25);
        ctx.lineTo(x - w * 0.7, y + h * 0.4);
        swordAngle = Math.PI / 8 + attackFrame * 0.08;
        handX = x + w * 1.1 + attackFrame * 2;
        handY = y + h * 0.25 + attackFrame * 0.8;
    } else if (attacking) {
        // 站立攻击
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x + w * 1.1 + attackFrame * 2, y + h * 0.1 - attackFrame * 1.5);
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x - w * 0.7, y + h * 0.3);
        swordAngle = -Math.PI / 6 + attackFrame * 0.08;
        handX = x + w * 1.1 + attackFrame * 2;
        handY = y + h * 0.1 - attackFrame * 1.5;
    } else if (player && player.jumping) {
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x - w * 0.7, y - h * 0.2);
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x + w * 0.7, y - h * 0.2);
        swordAngle = -Math.PI / 8;
        handX = x + w * 0.7;
        handY = y - h * 0.2;
    } else if (player && (keys['ArrowLeft'] || keys['ArrowRight'] || keys['a'] || keys['d'])) {
        let swing = Math.sin(Date.now() / 120) * w * 0.5;
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x - w * 0.7, y + h * 0.3 + swing);
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x + w * 0.7, y + h * 0.3 - swing);
        swordAngle = swing / w * 0.5;
        handX = x + w * 0.7;
        handY = y + h * 0.3 - swing;
    } else if (crouching) {
        ctx.moveTo(x, y + h * 0.25);
        ctx.lineTo(x - w * 0.7, y + h * 0.4);
        ctx.moveTo(x, y + h * 0.25);
        ctx.lineTo(x + w * 0.7, y + h * 0.4);
        swordAngle = Math.PI / 8;
        handX = x + w * 0.7;
        handY = y + h * 0.4;
    } else {
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x - w * 0.7, y + h * 0.3);
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x + w * 0.7, y + h * 0.3);
        swordAngle = 0;
        handX = x + w * 0.7;
        handY = y + h * 0.3;
    }
    ctx.stroke();
    // 绘制长剑
    ctx.save();
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.translate(handX, handY);
    ctx.rotate(swordAngle);
    ctx.moveTo(0, 0);
    ctx.lineTo(swordLength, 0);
    ctx.stroke();
    // 剑刃高亮
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(swordLength * 0.7, -2);
    ctx.lineTo(swordLength, 0);
    ctx.lineTo(swordLength * 0.7, 2);
    ctx.stroke();
    ctx.restore();
    // 腿
    ctx.beginPath();
    if (player && player.jumping) {
        ctx.moveTo(x, y + h * 0.6);
        ctx.lineTo(x - w * 0.3, y + h * 0.8);
        ctx.moveTo(x, y + h * 0.6);
        ctx.lineTo(x + w * 0.3, y + h * 0.8);
    } else if (player && (keys['ArrowLeft'] || keys['ArrowRight'] || keys['a'] || keys['d'])) {
        let swing = Math.sin(Date.now() / 120) * w * 0.5;
        ctx.moveTo(x, y + h * 0.6);
        ctx.lineTo(x - w * 0.5, y + h + swing);
        ctx.moveTo(x, y + h * 0.6);
        ctx.lineTo(x + w * 0.5, y + h - swing);
    } else if (crouching) {
        ctx.moveTo(x, y + h * 0.5);
        ctx.lineTo(x - w * 0.5, y + h * 0.7);
        ctx.moveTo(x, y + h * 0.5);
        ctx.lineTo(x + w * 0.5, y + h * 0.7);
    } else {
        ctx.moveTo(x, y + h * 0.6);
        ctx.lineTo(x - w * 0.5, y + h);
        ctx.moveTo(x, y + h * 0.6);
        ctx.lineTo(x + w * 0.5, y + h);
    }
    ctx.stroke();
    // 攻击动作
    if (attacking && crouching) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.7, y + h * 0.4);
        ctx.lineTo(x + w * 1.3 + attackFrame * 2, y + h * 0.25 + attackFrame * 0.8);
        ctx.stroke();
    } else if (attacking) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.7, y + h * 0.3);
        ctx.lineTo(x + w * 1.3 + attackFrame * 2, y + h * 0.1 - attackFrame * 1.5);
        ctx.stroke();
    }
    ctx.restore();
}

function drawEnemy(enemy) {
    if (enemy.type === 'stickman') {
        drawStickman(enemy.x, enemy.y, enemy.w, enemy.h, enemy.color);
    } else if (enemy.type === 'robot') {
        // 简单机器人外观
        ctx.save();
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 5;
        ctx.strokeRect(enemy.x - enemy.w/2, enemy.y - enemy.h*0.6, enemy.w, enemy.h*0.6);
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - enemy.h*0.7, enemy.w*0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    } else if (enemy.type === 'dog') {
        // 简单狗外观
        ctx.save();
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y, enemy.w*0.5, enemy.h*0.4, 0, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.w*0.4, enemy.y);
        ctx.lineTo(enemy.x + enemy.w*0.7, enemy.y - enemy.h*0.1);
        ctx.stroke();
        ctx.restore();
    }
}
function spawnEnemy() {
    const y = canvas.height - 120;
    let typeIdx = Math.floor(Math.random() * enemyTypes.length);
    let t = enemyTypes[typeIdx];
    let enemy = {
        x: canvas.width + 40,
        y: t.type === 'dog' ? (canvas.height - 80) : y,
        w: t.w,
        h: t.h,
        color: t.color,
        speed: t.speedMin + Math.random() * (t.speedMax - t.speedMin),
        type: t.type
    };
    enemies.push(enemy);
}

function update() {
    // 玩家移动
    if (!player.crouching) {
        if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
        if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
        // 边界判断，防止角色跑出画布
        if (player.x < 0) player.x = 0;
        if (player.x > canvas.width - player.w) player.x = canvas.width - player.w;
    }
    // 跳跃
    if ((keys['ArrowUp'] || keys['w']) && !player.jumping && !player.crouching) {
        player.vy = -22;
        player.jumping = true;
    }
    player.y += player.vy;
    player.vy += 0.7;
    if (player.y > canvas.height - 120) {
        player.y = canvas.height - 120;
        player.vy = 0;
        player.jumping = false;
    }
    // 攻击冷却
    if (attackCooldown > 0) attackCooldown--;
    if (player.attacking) {
        player.attackFrame++;
        if (player.attackFrame > 8) {
            player.attacking = false;
            player.attackFrame = 0;
        }
    }
    // 敌人移动
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].x -= enemies[i].speed;
        // 攻击判定优化
        let attackYRange = player.crouching ? 60 : 110;
        if (
            player.attacking &&
            player.attackFrame > 1 && player.attackFrame < 8 &&
            enemies[i].x < player.x + player.w * 2.2 &&
            enemies[i].x + enemies[i].w > player.x - player.w * 0.7 &&
            Math.abs(enemies[i].y - player.y) < attackYRange
        ) {
            enemies.splice(i, 1);
            score += 10;
            scoreSpan.textContent = score;
            continue;
        }
        // 玩家被碰到
        if (
            enemies[i].x < player.x + player.w * 0.7 &&
            enemies[i].x + enemies[i].w > player.x - player.w * 0.7 &&
            Math.abs(enemies[i].y - player.y) < 60
        ) {
            gameRunning = false;
        }
        // 敌人出界
        if (enemies[i].x < -60) enemies.splice(i, 1);
    }
    // 敌人生成
    enemySpawnTimer++;
    if (enemySpawnTimer > 60 + Math.random() * 60) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }
}

let windowViewOffset = 0;

function drawBackground() {
    // 绘制车厢地板
    ctx.fillStyle = '#444';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    // 绘制车厢墙壁
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, canvas.width, canvas.height - 40);
    // 绘制窗户
    ctx.fillStyle = '#222';
    ctx.fillRect(120, 60, 580, 120);
    // 绘制窗外流动风景
    let sceneryWidth = 580;
    let sceneryHeight = 120;
    let sceneryX = 120;
    let sceneryY = 60;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sceneryX, sceneryY, sceneryWidth, sceneryHeight);
    ctx.clip();
    // 天空
    ctx.fillStyle = '#7ec0ee';
    ctx.fillRect(sceneryX, sceneryY, sceneryWidth, sceneryHeight);
    // 远山
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = ['#b0e0e6', '#a2c2e2', '#8db6cd'][i];
        ctx.beginPath();
        let baseX = sceneryX - (windowViewOffset * (0.3 + i * 0.2)) % (sceneryWidth + 100);
        ctx.moveTo(baseX, sceneryY + sceneryHeight);
        ctx.lineTo(baseX + 120, sceneryY + 60 + i * 10);
        ctx.lineTo(baseX + 240, sceneryY + sceneryHeight);
        ctx.closePath();
        ctx.fill();
    }
    // 草地
    ctx.fillStyle = '#228b22';
    ctx.fillRect(sceneryX - (windowViewOffset % sceneryWidth), sceneryY + 90, sceneryWidth * 2, 30);
    // 树木
    for (let i = 0; i < 6; i++) {
        let treeX = sceneryX + ((i * 120 - windowViewOffset * 1.2) % (sceneryWidth + 60));
        let treeY = sceneryY + 100;
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(treeX, treeY, 10, 20);
        ctx.beginPath();
        ctx.arc(treeX + 5, treeY, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#228b22';
        ctx.fill();
    }
    ctx.restore();
    // 车厢顶部横梁
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 40, canvas.width, 20);
    // 车厢座椅
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(60 + i * 180, canvas.height - 100, 60, 60);
        ctx.fillStyle = '#deb887';
        ctx.fillRect(60 + i * 180, canvas.height - 110, 60, 20);
    }
    windowViewOffset += 3;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawStickman(player.x, player.y, player.w, player.h, player.color, player.attacking, player.attackFrame, player.crouching);
    enemies.forEach(drawEnemy);
}

function gameLoop() {
    if (!gameRunning) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '24px Arial';
        ctx.fillText('分数: ' + score, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText('点击“开始游戏”重试', canvas.width / 2, canvas.height / 2 + 70);
        ctx.restore();
        return;
    }
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startBtn.onclick = function() {
    resetGame();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
};

document.addEventListener('keydown', function(e) {
    keys[e.key] = true;
    // 蹲下
    if ((e.key === 's' || e.key === 'S') && !player.jumping && gameRunning) {
        player.crouching = true;
    }
    // 攻击
    if ((e.key === ' ' || e.key === 'j') && !player.attacking && attackCooldown === 0 && gameRunning) {
        player.attacking = true;
        player.attackFrame = 0;
        attackCooldown = 18;
    }
});
document.addEventListener('keyup', function(e) {
    keys[e.key] = false;
    if (e.key === 's' || e.key === 'S') {
        player.crouching = false;
    }
});

resetGame();
draw();