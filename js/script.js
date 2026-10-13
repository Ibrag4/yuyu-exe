"use strict";

/* =====================================================================
   1. EDIT ME: ALL GIFT AND BIRTHDAY CONTENT LIVES HERE
   ---------------------------------------------------------------------
   - title:   the heading of the popup
   - message: the personal memory or message
   - caption: short text under the photo (can be "" to hide it)
   - image:   path to the photo. Put photos in assets/images/
   The gifts show up in this order (first in the list = first one found).
   If an image is missing, a cute "Photo coming soon" box shows instead.
   ===================================================================== */
const CONFIG = {
  gifts: [
    {
      title: "Gift #1: Field Trip Day",
      message: "Placeholder memory: remember that day we wandered around with no plan and still had the best time?",
      caption: "The very first adventure",
      image: "assets/images/field-trip-01-placeholder.svg"
    },
    {
      title: "Gift #2: Round Two",
      message: "Placeholder memory: write something you love about this moment here.",
      caption: "Still laughing about this one",
      image: "assets/images/field-trip-02-placeholder.svg"
    },
    {
      title: "Gift #3: Good Times",
      message: "Placeholder memory: another little story that makes you smile.",
      caption: "",
      image: "assets/images/field-trip-03-placeholder.svg"
    },
    {
      title: "Gift #4: Secret Memory",
      message: "Placeholder memory: something only the two of you would understand.",
      caption: "Shhh, top secret",
      image: "assets/images/secret-memory-placeholder.svg"
    },
    {
      title: "Gift #5: The Last One",
      message: "Placeholder memory: the final gift! Say something thoughtful before the cake.",
      caption: "Almost at the cake!",
      image: "assets/images/final-photo-placeholder.svg"
    }
  ],

  // Birthday ending (shown after the cake is collected)
  finale: {
    title: "Happy Birthday, Yuyu!",
    message: "Placeholder: I hope your day is full of cake, good music and your favorite people. Thank you for being so fun to have around. Here's to another great year!",
    signature: "— With sprinkles and good vibes ✨"
  }
};

/* =====================================================================
   2. GAME SETTINGS (change these numbers to make it easier or harder)
   ===================================================================== */
const W = 640, H = 320;      // canvas size (CSS scales it to any screen)
const GY = 262;              // ground height
const BASE_SPEED = 4.5;      // how fast Yuyu skates
const GRAV = 0.75;           // gravity
const JUMP = 13.5;           // jump power
const FIRST_GIFT = 800;      // distance of the first gift
const GIFT_GAP = 1300;       // distance between gifts
const CAKE_GAP = 900;        // distance from the 5th gift to the cake
const TOTAL = FIRST_GIFT + GIFT_GAP * 4 + CAKE_GAP;   // used by the progress bar

const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

/* =====================================================================
   3. GAME STATE
   ===================================================================== */
let state = "start";   // "start" | "play" | "paused" | "modal" | "end"
let time = 0, shake = 0, jumpBuf = 0;
let p, dist, obstacles, coins, gift, cake, cakeAt, atCake;
let giftsFound, coinCount, nextGiftAt, nextObAt;

// Starts (or restarts) everything from the beginning.
function resetGame() {
  p = { x: 90, y: GY - 40, w: 22, h: 40, vy: 0, onGround: true, noCut: false, stumble: 0, inv: 0 };
  dist = 0; obstacles = []; coins = []; gift = null; cake = null;
  cakeAt = Infinity; atCake = false;
  giftsFound = 0; coinCount = 0; nextGiftAt = FIRST_GIFT; nextObAt = 500;
  jumpBuf = 0; shake = 0;
  updateHud();
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* =====================================================================
   4. UPDATE: the world scrolls, Yuyu stays in place (like the Chrome dino)
   ===================================================================== */
function spawnObstacle() {
  const types = [
    { t: "cone", w: 18, h: 26 },   // jump over
    { t: "box",  w: 34, h: 30 },   // jump over
    { t: "rail", w: 72, h: 22 },   // jump over
    { t: "ramp", w: 64, h: 26 }    // ride it: launches you high!
  ];
  const o = { ...types[Math.floor(Math.random() * types.length)], x: W + 20, used: false };
  obstacles.push(o);
  if (o.t === "ramp") {   // stars in the air after a ramp
    for (let i = 0; i < 3; i++) coins.push({ x: o.x + o.w + 40 + i * 30, y: GY - 120 - (i === 1 ? 10 : 0), w: 12, h: 12, got: false });
  } else {                // a little arc of stars above the obstacle shows when to jump
    [[-26, 50], [0, 64], [26, 50]].forEach(([dx, h]) =>
      coins.push({ x: o.x + o.w / 2 + dx - 6, y: GY - o.h - h, w: 12, h: 12, got: false }));
  }
}

function update(s) {
  // Speed: half speed for a moment after a stumble, zero while walking to the cake
  const speed = atCake ? 0 : BASE_SPEED * (p.stumble > 0 ? 0.5 : 1);
  const dx = speed * s;
  dist += dx;
  if (p.stumble > 0) p.stumble -= s;
  if (p.inv > 0) p.inv -= s;
  if (shake > 0) shake -= s;

  // Jump (a tap a few frames early still counts) and gravity
  if (jumpBuf > 0) {
    jumpBuf -= s;
    if (p.onGround) { p.vy = -JUMP; p.onGround = false; p.noCut = false; jumpBuf = 0; }
  }
  p.vy += GRAV * s;
  p.y += p.vy * s;
  if (p.y >= GY - p.h) { p.y = GY - p.h; p.vy = 0; p.onGround = true; p.noCut = false; }
  else p.onGround = false;

  // Scroll everything to the left
  obstacles.forEach((o) => (o.x -= dx));
  coins.forEach((c) => (c.x -= dx));
  if (gift) gift.x -= dx;
  if (cake) cake.x -= dx;
  obstacles = obstacles.filter((o) => o.x + o.w > -20);
  coins = coins.filter((c) => !c.got && c.x > -20);

  // Spawn obstacles, the next gift and finally the cake
  const lastStretch = giftsFound >= 5 && dist >= cakeAt - 300;   // clear path to the cake
  if (!lastStretch && dist >= nextObAt) { spawnObstacle(); nextObAt = dist + 380 + Math.random() * 260; }
  if (!gift && giftsFound < 5 && dist >= nextGiftAt)
    gift = { x: W + 20, y: GY - 100, w: 24, h: 24, data: CONFIG.gifts[giftsFound] };
  if (gift && gift.x < -40) { gift = null; nextGiftAt = dist + 500; }   // missed it? it comes back
  if (!cake && giftsFound >= 5 && dist >= cakeAt) cake = { x: W + 20, y: GY - 45, w: 50, h: 45 };

  // Collisions (the hitbox is a bit smaller than the drawing = friendlier)
  const hb = { x: p.x + 4, y: p.y + 4, w: p.w - 8, h: p.h - 4 };
  for (const o of obstacles) {
    if (!overlap(hb, { x: o.x + 2, y: GY - o.h, w: o.w - 4, h: o.h })) continue;
    if (o.t === "ramp") {
      if (!o.used) { o.used = true; p.vy = -15.5; p.onGround = false; p.noCut = true; }
    } else if (p.inv <= 0) {
      p.inv = 70; p.stumble = 40; p.vy = -6; p.onGround = false; shake = 8;   // oops! no game over
      toast("Oops! 🙈");
    }
  }
  for (const c of coins) if (!c.got && overlap(hb, c)) { c.got = true; coinCount++; updateHud(); }

  // Gift collected -> open the popup
  if (gift && overlap(hb, gift)) {
    const data = gift.data;
    gift = null; giftsFound++;
    nextGiftAt = dist + GIFT_GAP;
    if (giftsFound === 5) cakeAt = dist + CAKE_GAP;
    p.inv = 60;
    updateHud(); openGift(data);
    return;
  }

  // Cake: the world stops and Yuyu walks up to it
  if (cake) {
    if (!atCake && cake.x - (p.x + p.w) <= 110) atCake = true;
    if (atCake) {
      p.x += 2.5 * s;
      if (overlap(p, cake)) { startFinale(); return; }
    }
  }

  // Progress bar
  const pct = atCake ? 100 : Math.round(Math.min(giftsFound < 5 ? 0.95 : 1, dist / TOTAL) * 100);
  $("progressBar").style.width = pct + "%";
  $("progressWrap").setAttribute("aria-valuenow", pct);
}

function updateHud() {
  $("giftCount").textContent = "🎁 " + giftsFound + "/5";
  $("coinCount").textContent = "⭐ " + coinCount;
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1200);
}

/* =====================================================================
   5. GIFT POPUP (with a cute fallback if the photo is missing)
   ===================================================================== */
function openGift(g) {
  state = "modal";
  jumpBuf = 0;
  $("giftTitle").textContent = g.title || "A gift!";
  $("giftMessage").textContent = g.message || "";
  $("giftCaption").textContent = g.caption || "";
  $("giftCaption").classList.toggle("hidden", !g.caption);

  const img = $("giftImg"), fb = $("giftFallback");
  const showFallback = () => { img.classList.add("hidden"); fb.classList.remove("hidden"); };
  img.classList.remove("hidden"); fb.classList.add("hidden");
  img.onerror = showFallback;                       // missing image -> fallback box
  if (g.image) img.src = g.image; else showFallback();

  $("giftModal").classList.remove("hidden");
  $("giftClose").focus();
}

function closeGift() {
  $("giftModal").classList.add("hidden");
  state = "play";
  if (giftsFound === 5) toast("All gifts found! Cake time 🎂");
}

/* =====================================================================
   6. BIRTHDAY FINALE: cake, sparkles and confetti
   ===================================================================== */
const cakeCtx = $("cakeCanvas").getContext("2d");
const confCanvas = $("confetti"), confCtx = confCanvas.getContext("2d");
let confetti = [], finaleOn = false;
const CONF_COLORS = ["#ff6fa5", "#ffd34d", "#8fe3c8", "#cdb4ff", "#6c8cff", "#fff"];

function startFinale() {
  state = "end";
  $("finaleTitle").textContent = CONFIG.finale.title;
  $("finaleMessage").textContent = CONFIG.finale.message;
  $("finaleSign").textContent = CONFIG.finale.signature;
  confCanvas.width = window.innerWidth;
  confCanvas.height = window.innerHeight;
  confetti = [];
  for (let i = 0; i < 140; i++) confetti.push(newConfetti(true));
  $("finale").classList.remove("hidden");
  $("replayBtn").focus();
  finaleOn = true;
  requestAnimationFrame(finaleLoop);
}

function newConfetti(randomY) {
  return {
    x: Math.random() * confCanvas.width,
    y: randomY ? Math.random() * -confCanvas.height : -10,
    vy: 1.5 + Math.random() * 2.5, vx: Math.random() * 2 - 1,
    size: 5 + Math.random() * 5,
    color: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)]
  };
}

function finaleLoop() {
  if (!finaleOn) return;
  cakeCtx.clearRect(0, 0, 160, 120);
  drawCake(cakeCtx, 16, 24, 8);
  for (let i = 0; i < 8; i++) {
    if (Math.floor(time * 4 + i) % 3 === 0) sparkle(cakeCtx, 10 + ((i * 47) % 140), 8 + ((i * 29) % 100), 3);
  }
  confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
  confetti.forEach((c, i) => {
    c.x += c.vx; c.y += c.vy;
    if (c.y > confCanvas.height) confetti[i] = newConfetti(false);
    confCtx.fillStyle = c.color;
    confCtx.fillRect(Math.round(c.x), Math.round(c.y), c.size, c.size);
  });
  requestAnimationFrame(finaleLoop);
}

/* =====================================================================
   7. DRAWING (all pixel art is made from small rectangles)
   ===================================================================== */
// Yuyu: 10x14 pixel grid, drawn 3x bigger. Letters are colors from PAL.
const SPRITE = [
  "..hhhhhbb.",
  ".hhhhhhhh.",
  "hssssssssh",
  "hsessssesh",
  "hspssssPsh",
  ".ssssssss.",
  "..cccccc..",
  ".sccccccs.",
  ".sccccccs.",
  "..cccccc..",
  "..nnnnnn..",
  "..nn..nn..",
  "..kk..kk..",
  ".kkk..kkk."
];
const PAL = { h: "#5b3a6e", s: "#ffd9b8", e: "#2b1b3a", p: "#ff9ec4", P: "#ff9ec4", c: "#8fe3c8", n: "#6c8cff", k: "#ffffff", b: "#ff6fa5" };

function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }

function sparkle(c, x, y, s) {
  rect(c, x, y - s, s, s * 3, "#fff6a8");
  rect(c, x - s, y, s * 3, s, "#fff6a8");
}

// Pixel cake (used in the level AND on the finale screen). s = pixel size.
function drawCake(c, x, y, s) {
  const u = (a, b, w, h, col) => rect(c, x + a * s, y + b * s, w * s, h * s, col);
  u(-1, 14, 18, 1, "#ffffff");                              // plate
  u(0, 8, 16, 6, "#ff9ec4"); u(0, 8, 16, 1, "#ffffff");     // bottom layer
  [2, 7, 12].forEach((a) => u(a, 9, 1, 2, "#ffffff"));      // frosting drips
  u(3, 3, 10, 5, "#fff1c9"); u(3, 3, 10, 1, "#ffffff");     // top layer
  const flicker = Math.floor(time * 6) % 2;
  [["#6c8cff", 5], ["#ffd34d", 8], ["#8fe3c8", 11]].forEach(([col, a]) => {
    u(a, 0, 1, 3, col);                                     // candle
    u(a, flicker ? -2 : -1, 1, flicker ? 2 : 1, "#ffb347"); // flame
  });
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, GY);
  g.addColorStop(0, "#bde7ff"); g.addColorStop(1, "#ffe3f1");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  rect(ctx, 540, 30, 40, 40, "#fff3a0");                                   // sun
  for (let i = 0; i < 6; i++) {                                            // clouds
    const cx = ((((i * 230 - dist * 0.15 - time * 5) % 1400) + 1400) % 1400) - 120;
    rect(ctx, cx, 40 + (i % 3) * 32, 60, 14, "#fff");
    rect(ctx, cx + 12, 30 + (i % 3) * 32, 34, 12, "#fff");
  }
  for (let x = 0; x < W; x += 16) {                                        // pixel hills
    const h = Math.round((40 + 26 * Math.sin((x + dist * 0.3) / 70)) / 8) * 8;
    rect(ctx, x, GY - h, 16, h, "#c9f0d8");
  }
  rect(ctx, 0, GY, W, H - GY, "#b88be0");                                  // ground
  rect(ctx, 0, GY, W, 6, "#8fe3c8");
  for (let x = -(dist % 40); x < W; x += 40) rect(ctx, x, GY + 20, 18, 4, "#a174cf");
}

function drawObstacle(o) {
  const top = GY - o.h;
  if (o.t === "cone") {
    ctx.fillStyle = "#ff9a3c";
    ctx.beginPath(); ctx.moveTo(o.x, GY); ctx.lineTo(o.x + o.w, GY); ctx.lineTo(o.x + o.w / 2, top); ctx.fill();
    rect(ctx, o.x + 4, GY - 12, o.w - 8, 4, "#fff");
    rect(ctx, o.x - 2, GY - 3, o.w + 4, 3, "#e57f22");
  } else if (o.t === "box") {
    rect(ctx, o.x, top, o.w, o.h, "#4a3560");
    rect(ctx, o.x + 3, top + 3, o.w - 6, o.h - 3, "#ff9ec4");
    rect(ctx, o.x + 3, top + 3, o.w - 6, 4, "#ffd1e3");
  } else if (o.t === "rail") {
    rect(ctx, o.x + 6, top, 4, o.h, "#8a8fa8");
    rect(ctx, o.x + o.w - 10, top, 4, o.h, "#8a8fa8");
    rect(ctx, o.x, top, o.w, 5, "#d5dbef");
    rect(ctx, o.x, top, o.w, 2, "#ffffff");
  } else {   // ramp: a wedge that rises to the right
    ctx.fillStyle = "#e9b872";
    ctx.beginPath(); ctx.moveTo(o.x, GY); ctx.lineTo(o.x + o.w, GY); ctx.lineTo(o.x + o.w, top); ctx.fill();
    rect(ctx, o.x + o.w - 4, top, 4, o.h, "#fff");
  }
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate(Math.round(Math.random() * 4 - 2), Math.round(Math.random() * 4 - 2));
  drawBackground();

  obstacles.forEach(drawObstacle);

  coins.forEach((c) => {                                       // stars
    const b = Math.round(Math.sin(time * 6 + c.x / 20) * 2);
    rect(ctx, c.x + 4, c.y + b, 4, 12, "#ffd34d");
    rect(ctx, c.x, c.y + 4 + b, 12, 4, "#ffd34d");
  });

  if (gift) {                                                  // gift box
    const y = gift.y + Math.round(Math.sin(time * 4) * 3);
    rect(ctx, gift.x, y, 24, 24, "#4a3560");
    rect(ctx, gift.x + 2, y + 2, 20, 20, "#ff6fa5");
    rect(ctx, gift.x + 10, y, 4, 24, "#fff");
    rect(ctx, gift.x, y + 10, 24, 4, "#fff");
    rect(ctx, gift.x + 4, y - 6, 6, 6, "#ffd34d"); rect(ctx, gift.x + 14, y - 6, 6, 6, "#ffd34d");
    if (Math.floor(time * 4) % 2) sparkle(ctx, gift.x + 30, y - 8, 2);
  }

  if (cake) {
    drawCake(ctx, cake.x, cake.y, 3);
    if (Math.floor(time * 3) % 2) sparkle(ctx, cake.x + 58, cake.y - 6, 3);
  }

  // Yuyu on her skateboard (blinks after a stumble)
  if (!(p.inv > 0 && Math.floor(p.inv / 5) % 2)) {
    const feet = p.y + p.h;
    const bob = p.onGround && !atCake ? Math.floor(time * 12) % 2 : 0;
    const sx = p.x - 4, sy = feet - 46 + bob;
    SPRITE.forEach((row, r) => {
      for (let c = 0; c < row.length; c++)
        if (row[c] !== ".") rect(ctx, sx + c * 3, sy + r * 3, 3, 3, PAL[row[c]]);
    });
    rect(ctx, p.x - 6, feet - 5, 34, 3, "#7a4bd1");            // board
    rect(ctx, p.x, feet - 2, 5, 3, "#fff");                    // wheels
    rect(ctx, p.x + 17, feet - 2, 5, 3, "#fff");
  }
  ctx.restore();
}

/* =====================================================================
   8. GAME LOOP
   ===================================================================== */
let last = 0;
function loop(now) {
  const s = Math.min((now - last) / 16.67, 2.5) || 1;   // same speed on any phone or screen
  last = now;
  time = now / 1000;
  if (state === "play") update(s);
  draw();
  requestAnimationFrame(loop);
}

/* =====================================================================
   9. CONTROLS: tap anywhere, keyboard and buttons
   ===================================================================== */
function startGame() {
  resetGame();
  ["startScreen", "pauseScreen", "giftModal", "finale"].forEach((id) => $(id).classList.add("hidden"));
  finaleOn = false;
  state = "play";
}

function togglePause() {
  if (state === "play") { state = "paused"; $("pauseScreen").classList.remove("hidden"); $("resumeBtn").focus(); }
  else if (state === "paused") { state = "play"; $("pauseScreen").classList.add("hidden"); }
}

function pressJump() { if (state === "play") jumpBuf = 8; }
function releaseJump() {                      // letting go early = shorter hop (like the dino)
  if (state === "play" && !p.noCut && p.vy < -7) p.vy = -7;
}

// Touch / mouse: press anywhere on the game area to jump (the top bar keeps its own buttons)
$("app").addEventListener("pointerdown", (e) => {
  if (e.target.closest("#hud")) return;
  e.preventDefault();
  pressJump();
});
window.addEventListener("pointerup", releaseJump);
window.addEventListener("pointercancel", releaseJump);

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowup" || k === "w" || k === " ") {
    if (state === "play") e.preventDefault();
    if (!e.repeat) pressJump();
  }
  if (k === "p") togglePause();
  if (k === "r" && state !== "start") startGame();
  if (k === "escape" && state === "modal") closeGift();
});
window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowup" || k === "w" || k === " ") releaseJump();
});

// Auto-pause if the phone locks or you switch apps
document.addEventListener("visibilitychange", () => { if (document.hidden && state === "play") togglePause(); });

$("startBtn").addEventListener("click", startGame);
$("replayBtn").addEventListener("click", startGame);
$("restartBtn").addEventListener("click", (e) => { e.currentTarget.blur(); if (state !== "start") startGame(); });
$("pauseBtn").addEventListener("click", (e) => { e.currentTarget.blur(); togglePause(); });
$("resumeBtn").addEventListener("click", togglePause);
$("giftClose").addEventListener("click", closeGift);

// Build the first scene and begin drawing (the game waits on the start screen)
resetGame();
requestAnimationFrame(loop);