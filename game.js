const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const livesEl = document.querySelector("#lives");
const levelEl = document.querySelector("#level");
const seasonNameEl = document.querySelector("#season-name");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const resetButton = document.querySelector("#reset-button");
const seasonButtons = [...document.querySelectorAll(".season-pill")];

const seasons = {
  spring: {
    name: "Printemps",
    emoji: "🌸",
    sky: ["#214f84", "#8edfd0", "#fff1b8"],
    palette: ["#ff75b7", "#ffb3d5", "#86e6b8", "#f8ee8f", "#b48cff"],
    particle: ["🌸", "🌿", "✨"],
  },
  summer: {
    name: "Été",
    emoji: "☀️",
    sky: ["#08356c", "#1db5e8", "#ffe66f"],
    palette: ["#ffb000", "#ff6b35", "#00d4ff", "#35e27a", "#fff05a"],
    particle: ["☀️", "🍉", "✨"],
  },
  autumn: {
    name: "Automne",
    emoji: "🍂",
    sky: ["#2d163f", "#b85c38", "#ffd06f"],
    palette: ["#8f3f16", "#d65a31", "#f6a23a", "#ffd166", "#7f5539"],
    particle: ["🍂", "🍁", "✨"],
  },
  winter: {
    name: "Hiver",
    emoji: "❄️",
    sky: ["#08172f", "#457b9d", "#e8fbff"],
    palette: ["#bde0fe", "#a2d2ff", "#caf0f8", "#ffffff", "#8ecae6"],
    particle: ["❄️", "✦", "✨"],
  },
};

const state = {
  seasonKey: "spring",
  score: 0,
  lives: 3,
  level: 1,
  running: false,
  paused: false,
  bricks: [],
  particles: [],
  stars: [],
  paddle: { x: 400, y: 570, width: 150, height: 18, speed: 0 },
  ball: { x: 480, y: 535, radius: 10, dx: 5, dy: -6, stuck: true },
};

function resizeCanvasForHiDpi() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function width() { return canvas.getBoundingClientRect().width; }
function height() { return canvas.getBoundingClientRect().height; }
function currentSeason() { return seasons[state.seasonKey]; }

function resetBall(stuck = true) {
  state.ball.x = state.paddle.x + state.paddle.width / 2;
  state.ball.y = state.paddle.y - 18;
  state.ball.dx = (Math.random() > 0.5 ? 1 : -1) * (4.6 + state.level * 0.45);
  state.ball.dy = -(5.5 + state.level * 0.35);
  state.ball.stuck = stuck;
}

function buildStars() {
  state.stars = Array.from({ length: 85 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.9 + 0.35,
    a: Math.random() * 0.5 + 0.18,
  }));
}

function buildBricks() {
  const cols = 10;
  const rows = Math.min(5 + state.level, 8);
  const gap = 8;
  const top = 76;
  const margin = 42;
  const brickWidth = (width() - margin * 2 - gap * (cols - 1)) / cols;
  const brickHeight = 28;
  state.bricks = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const wave = Math.sin((col + row + state.level) * 0.72) * 7;
      state.bricks.push({
        x: margin + col * (brickWidth + gap),
        y: top + row * (brickHeight + gap) + wave,
        width: brickWidth,
        height: brickHeight,
        strength: 1 + Math.floor((row + state.level) / 4),
        color: currentSeason().palette[(row + col) % currentSeason().palette.length],
        alive: true,
      });
    }
  }
}

function syncHud() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
  levelEl.textContent = state.level;
  seasonNameEl.textContent = currentSeason().name;
}

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.running = false;
  state.paused = false;
  state.paddle.width = Math.max(112, width() * 0.16);
  state.paddle.x = (width() - state.paddle.width) / 2;
  state.paddle.y = height() - 52;
  state.particles = [];
  buildStars();
  buildBricks();
  resetBall(true);
  syncHud();
  showOverlay("Prêt à éclore ?", "Déplacez la raquette avec la souris, le tactile ou les flèches. Appuyez sur Espace pour lancer.");
}

function showOverlay(title, message) {
  overlay.querySelector("h2").textContent = title;
  overlay.querySelector("p").textContent = message;
  overlay.classList.remove("hidden");
}

function hideOverlay() { overlay.classList.add("hidden"); }

function launch() {
  if (!state.running) {
    state.running = true;
    state.paused = false;
  }
  if (state.ball.stuck) state.ball.stuck = false;
  hideOverlay();
}

function drawBackground() {
  const w = width();
  const h = height();
  const season = currentSeason();
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  season.sky.forEach((color, index) => gradient.addColorStop(index / (season.sky.length - 1), color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  state.stars.forEach((star) => {
    ctx.globalAlpha = star.a + Math.sin(Date.now() / 700 + star.x * 20) * 0.12;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(star.x * w, star.y * h * 0.72, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "white";
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.ellipse(w * (0.08 + i * 0.18), h * (0.76 + Math.sin(i) * 0.04), 90, 22, -0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function drawBricks() {
  state.bricks.forEach((brick) => {
    if (!brick.alive) return;
    ctx.save();
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = brick.color;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    roundRect(brick.x, brick.y, brick.width, brick.height, 9);
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fillRect(brick.x + 10, brick.y + 6, brick.width - 20, 4);
    ctx.restore();
  });
}

function drawPaddle() {
  const p = state.paddle;
  const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.5, currentSeason().palette[0]);
  gradient.addColorStop(1, currentSeason().palette[2]);
  ctx.save();
  ctx.shadowColor = currentSeason().palette[0];
  ctx.shadowBlur = 24;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  roundRect(p.x, p.y, p.width, p.height, 12);
  ctx.restore();
}

function drawBall() {
  const b = state.ball;
  const halo = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.radius * 4.4);
  halo.addColorStop(0, "rgba(255,255,255,0.8)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius * 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();
}

function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      text: currentSeason().particle[Math.floor(Math.random() * currentSeason().particle.length)],
      color,
      dx: (Math.random() - 0.5) * 5,
      dy: -Math.random() * 5 - 1,
      life: 1,
      size: Math.random() * 10 + 13,
    });
  }
}

function drawParticles() {
  state.particles = state.particles.filter((particle) => particle.life > 0);
  state.particles.forEach((particle) => {
    particle.x += particle.dx;
    particle.y += particle.dy;
    particle.dy += 0.08;
    particle.life -= 0.018;
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.font = `${particle.size}px serif`;
    ctx.fillText(particle.text, particle.x, particle.y);
    ctx.restore();
  });
}

function updateBall() {
  const b = state.ball;
  const p = state.paddle;
  if (b.stuck) {
    b.x = p.x + p.width / 2;
    b.y = p.y - 18;
    return;
  }

  b.x += b.dx;
  b.y += b.dy;

  if (b.x < b.radius || b.x > width() - b.radius) b.dx *= -1;
  if (b.y < b.radius) b.dy *= -1;

  const hitsPaddle = b.y + b.radius > p.y && b.y - b.radius < p.y + p.height && b.x > p.x && b.x < p.x + p.width;
  if (hitsPaddle && b.dy > 0) {
    const impact = (b.x - (p.x + p.width / 2)) / (p.width / 2);
    b.dx = impact * (6.5 + state.level * 0.25);
    b.dy = -Math.abs(b.dy) - 0.05;
    spawnParticles(b.x, p.y, currentSeason().palette[1], 5);
  }

  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    const hit = b.x + b.radius > brick.x && b.x - b.radius < brick.x + brick.width && b.y + b.radius > brick.y && b.y - b.radius < brick.y + brick.height;
    if (!hit) continue;
    b.dy *= -1;
    brick.strength -= 1;
    state.score += 25 * state.level;
    spawnParticles(b.x, b.y, brick.color, 13);
    if (brick.strength <= 0) brick.alive = false;
    break;
  }

  if (b.y > height() + 40) {
    state.lives -= 1;
    if (state.lives <= 0) {
      state.running = false;
      showOverlay("Fin de saison", `Score final : ${state.score}. Relancez une année magique !`);
    } else {
      resetBall(true);
      showOverlay("Encore une chance", "Appuyez sur Espace pour renvoyer l'étoile.");
    }
  }

  if (state.bricks.every((brick) => !brick.alive)) {
    state.level += 1;
    state.score += 250;
    buildBricks();
    resetBall(true);
    showOverlay("Saison sublimée !", "Niveau suivant : les briques deviennent plus coriaces.");
  }
  syncHud();
}

function updatePaddle() {
  const p = state.paddle;
  p.x += p.speed;
  p.x = Math.max(12, Math.min(width() - p.width - 12, p.x));
}

function loop() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
  drawParticles();
  if (state.running && !state.paused) {
    updatePaddle();
    updateBall();
  }
  requestAnimationFrame(loop);
}

function pointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.touches?.[0]?.clientX ?? event.clientX;
  state.paddle.x = clientX - rect.left - state.paddle.width / 2;
}

window.addEventListener("resize", () => {
  resizeCanvasForHiDpi();
  state.paddle.y = height() - 52;
  buildBricks();
  resetBall(state.ball.stuck);
});
canvas.addEventListener("mousemove", pointerMove);
canvas.addEventListener("touchmove", (event) => {
  event.preventDefault();
  pointerMove(event);
}, { passive: false });

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") state.paddle.speed = -9;
  if (event.key === "ArrowRight") state.paddle.speed = 9;
  if (event.code === "Space") launch();
});
window.addEventListener("keyup", (event) => {
  if (["ArrowLeft", "ArrowRight"].includes(event.key)) state.paddle.speed = 0;
});

seasonButtons.forEach((button) => {
  button.addEventListener("click", () => {
    seasonButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.seasonKey = button.dataset.season;
    document.documentElement.style.setProperty("--accent", currentSeason().palette[0]);
    document.documentElement.style.setProperty("--accent-2", currentSeason().palette[2]);
    buildBricks();
    syncHud();
  });
});

startButton.addEventListener("click", launch);
pauseButton.addEventListener("click", () => {
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? "Reprendre" : "Pause";
  if (state.paused) showOverlay("Pause enchantée", "La partie est suspendue dans un souffle de saison.");
  if (!state.paused) hideOverlay();
});
resetButton.addEventListener("click", resetGame);

resizeCanvasForHiDpi();
resetGame();
loop();
