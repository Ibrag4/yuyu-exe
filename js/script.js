"use strict";

/* =====================================================================
   1. EDIT ME: ALL GIFT AND BIRTHDAY CONTENT LIVES HERE
   ---------------------------------------------------------------------
   - title:   the heading of the popup
   - message: the personal memory or message
   - caption: short text under the photo (can be "" to hide it)
   - image:   path to the photo. Put photos in assets/images/
   The 5 gifts appear in the level in this order (1 = first one found).
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
   2. BASIC SETUP
   ===================================================================== */
const W = 800, H = 450;          // canvas size (the CSS scales it to fit the screen)
const GY = 380;                  // ground height (y position of the floor)
const LEVEL_W = 4000;            // total level length
const GATE_X = 3450;             // gate that opens when all 5 gifts are found
const CAKE_X = 3750;             // where the cake sits
const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

/* =====================================================================
   3. LEVEL DATA
   ===================================================================== */
// Ramps (funboxes): walk up one side, over the top, and down the other.
const ramps = [
  { x: 400,  w: 150, h: 60 },
  { x: 1250, w: 150, h: 60 },
  { x: 2850, w: 160, h: 70 },
  { x: 3150, w: 150, h: 60 }
];
// Platforms: rails (thin, with legs) and boxes. You can land on top from above.
const platforms = [
  { x: 700,  y: 315, w: 150, type: "rail" },
  { x: 1000, y: 330, w: 70,  type: "box"  },
  { x: 1450, y: 330, w: 70,  type: "box"  },
  { x: 1520, y: 280, w: 70,  type: "box"  },
  { x: 1800, y: 310, w: 200, type: "rail" },
  { x: 2200, y: 300, w: 180, type: "rail" },
  { x: 2450, y: 320, w: 70,  type: "box"  },
  { x: 2550, y: 290, w: 160, type: "rail" }
];
// Where each of the 5 gifts floats (same order as CONFIG.gifts)
const giftSpots = [
  { x: 465, y: 285 }, { x: 760, y: 275 }, { x: 1545, y: 240 },
  { x: 2280, y: 260 }, { x: 2918, y: 280 }
];

/* =====================================================================
   4. GAME STATE
   ===================================================================== */
let state = "start";   // "start" | "play" | "paused" | "modal" | "end"
let time = 0;
let p, gifts, coins, coinCount, giftsFound;
const keys = { left: false, right: false, jump: false };

// Returns the floor height at horizontal position x (ground or ramp surface).
function surfaceY(x) {
  let y = GY;
  for (const r of ramps) {
    if (x >= r.x && x <= r.x + r.w) {
      const slope = (r.w - 60) / 2;                       // length of each sloped side
      const t = Math.min(1, Math.min(x - r.x, r.x + r.w - x) / slope);
      y = Math.min(y, GY - r.h * t);
    }
  }
  return y;
}

// Starts (or restarts) everything from the beginning.
function resetGame() {
  p = { x: 60, y: GY - 28, w: 20, h: 28, vx: 0, vy: 0, face: 1, onGround: true };
  gifts = CONFIG.gifts.slice(0, 5).map((g, i) => ({ ...giftSpots[i], w: 24, h: 24, got: false, data: g }));
  coins = [];
  for (let x = 220; x < 3400; x += 130) coins.push({ x, y: surfaceY(x) - 45, w: 12, h: 12, got: false });
  platforms.forEach((pl) => {
    for (let i = 1; i <= 3; i++) coins.push({ x: pl.x + (pl.w * i) / 4 - 6, y: pl.y - 40, w: 12, h: 12, got: false });
  });
  coinCount = 0;
  giftsFound = 0;
  updateHud();
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* =====================================================================
   5. UPDATE: physics, collisions, collecting (runs every frame)
   ===================================================================== */
function update(s) {
  // Horizontal movement
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  p.vx = dir * 3.2;
  if (dir) p.face = dir;
  p.x += p.vx * s;
  p.x = Math.max(0, Math.min(LEVEL_W - p.w, p.x));

  // The gate blocks the way until all 5 gifts are found
  if (giftsFound < 5 && p.x + p.w > GATE_X) {
    p.x = GATE_X - p.w;
    toast("Find all 5 gifts to open the gate! 🎁");
  }

  // Jump and gravity
  const wasGround = p.onGround;
  if (keys.jump && p.onGround) { p.vy = -12.5; p.onGround = false; }
  p.vy = Math.min(p.vy + 0.62 * s, 14);
  const prevFeet = p.y + p.h;
  p.y += p.vy * s;

  // Landing on the ground / ramps
  const feet = p.y + p.h;
  const cx = p.x + p.w / 2;
  const gy = surfaceY(cx);
  p.onGround = false;
  if (feet >= gy || (wasGround && p.vy >= 0 && gy - feet <= 6)) {
    p.y = gy - p.h; p.vy = 0; p.onGround = true;   // "stick" to the floor going downhill too
  }

  // Landing on rails and boxes (only when falling from above)
  if (!p.onGround && p.vy >= 0) {
    for (const pl of platforms) {
      if (cx > pl.x - 4 && cx < pl.x + pl.w + 4 && prevFeet <= pl.y + 2 && p.y + p.h >= pl.y) {
        p.y = pl.y - p.h; p.vy = 0; p.onGround = true;
        break;
      }
    }
  }

  // Collect stars
  for (const c of coins) {
    if (!c.got && overlap(p, c)) { c.got = true; coinCount++; updateHud(); }
  }
  // Collect gifts (opens the popup)
  gifts.forEach((g) => {
    if (!g.got && state === "play" && overlap(p, g)) {
      g.got = true; giftsFound++; updateHud(); openGift(g.data);
    }
  });
  // Collect the cake (only after all 5 gifts)
  const cake = { x: CAKE_X, y: GY - 45, w: 50, h: 45 };
  if (state === "play" && giftsFound >= 5 && overlap(p, cake)) startFinale();

  // Progress bar
  const pct = Math.min(100, Math.round((p.x / CAKE_X) * 100));
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
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

/* =====================================================================
   6. GIFT POPUP (with a cute fallback if the photo is missing)
   ===================================================================== */
function openGift(g) {
  state = "modal";
  $("giftTitle").textContent = g.title || "A gift!";
  $("giftMessage").textContent = g.message || "";
  $("giftCaption").textContent = g.caption || "";
  $("giftCaption").classList.toggle("hidden", !g.caption);

  const img = $("giftImg"), fb = $("giftFallback");
  const showFallback = () => { img.classList.add("hidden"); fb.classList.remove("hidden"); };
  img.classList.remove("hidden"); fb.classList.add("hidden");
  img.onerror = showFallback;                  // image missing -> show the fallback box
  if (g.image) img.src = g.image; else showFallback();

  $("giftModal").classList.remove("hidden");
  $("giftClose").focus();
}

function closeGift() {
  $("giftModal").classList.add("hidden");
  state = "play";
  if (giftsFound === 5) toast("The gate is open! Find the cake 🎂");
}

/* =====================================================================
   7. BIRTHDAY FINALE: cake, sparkles and confetti
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
  for (let i = 0; i < 160; i++) confetti.push(newConfetti(true));
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
  // Cake + sparkles
  cakeCtx.clearRect(0, 0, 160, 120);
  drawCake(cakeCtx, 16, 24, 8);
  for (let i = 0; i < 8; i++) {
    const on = Math.floor(time * 4 + i) % 3 === 0;
    if (on) sparkle(cakeCtx, 10 + ((i * 47) % 140), 8 + ((i * 29) % 100), 3);
  }
  // Confetti
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
   8. DRAWING (all pixel art is made from small rectangles)
   ===================================================================== */
// Yuyu: 10x14 pixel grid. Letters are colors from PAL; "." is transparent.
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

function drawSprite(rows, x, y, scale, flip) {
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[flip ? row.length - 1 - c : c];
      if (ch !== ".") { ctx.fillStyle = PAL[ch]; ctx.fillRect(x + c * scale, y + r * scale, scale, scale); }
    }
  });
}

function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(x, y, w, h); }

function sparkle(c, x, y, s) {
  rect(c, x, y - s, s, s * 3, "#fff6a8");
  rect(c, x - s, y, s * 3, s, "#fff6a8");
}

// Pixel cake (used in the level AND on the finale screen). s = pixel size.
function drawCake(c, x, y, s) {
  const u = (a, b, w, h, col) => rect(c, x + a * s, y + b * s, w * s, h * s, col);
  u(-1, 14, 18, 1, "#ffffff");           // plate
  u(0, 8, 16, 6, "#ff9ec4");             // bottom layer
  u(0, 8, 16, 1, "#ffffff");
  [2, 7, 12].forEach((a) => u(a, 9, 1, 2, "#ffffff"));   // frosting drips
  u(3, 3, 10, 5, "#fff1c9");             // top layer
  u(3, 3, 10, 1, "#ffffff");
  const flicker = Math.floor(time * 6) % 2;
  [["#6c8cff", 5], ["#ffd34d", 8], ["#8fe3c8", 11]].forEach(([col, a]) => {
    u(a, 0, 1, 3, col);                  // candle
    u(a, flicker ? -2 : -1, 1, flicker ? 2 : 1, "#ffb347");   // flame
  });
}

function drawBackground(cam) {
  const g = ctx.createLinearGradient(0, 0, 0, GY);
  g.addColorStop(0, "#bde7ff"); g.addColorStop(1, "#ffe3f1");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  rect(ctx, 650, 40, 50, 50, "#fff3a0");                       // sun
  for (let i = 0; i < 9; i++) {                                // slow clouds
    const cx = ((((i * 300 - cam * 0.25 - time * 6) % 2700) + 2700) % 2700) - 200;
    rect(ctx, cx, 60 + (i % 3) * 40, 70, 16, "#fff");
    rect(ctx, cx + 14, 48 + (i % 3) * 40, 40, 14, "#fff");
  }
  for (let x = 0; x < W; x += 20) {                            // pixel hills
    const h = Math.round((50 + 30 * Math.sin((x + cam * 0.5) / 90)) / 10) * 10;
    rect(ctx, x, GY - h, 20, h, "#c9f0d8");
  }
}

function draw() {
  const cam = Math.max(0, Math.min(LEVEL_W - W, p.x + p.w / 2 - W / 2));
  drawBackground(cam);
  ctx.save();
  ctx.translate(-Math.round(cam), 0);

  // Ground
  rect(ctx, cam, GY, W + 20, H - GY, "#b88be0");
  rect(ctx, cam, GY, W + 20, 8, "#8fe3c8");
  for (let x = Math.floor(cam / 40) * 40; x < cam + W + 40; x += 40) rect(ctx, x, GY + 24, 20, 4, "#a174cf");

  // Ramps
  ramps.forEach((r) => {
    const s = (r.w - 60) / 2;
    ctx.fillStyle = "#e9b872";
    ctx.beginPath();
    ctx.moveTo(r.x, GY); ctx.lineTo(r.x + s, GY - r.h);
    ctx.lineTo(r.x + r.w - s, GY - r.h); ctx.lineTo(r.x + r.w, GY);
    ctx.fill();
    rect(ctx, r.x + s, GY - r.h, 60, 4, "#ffffff");           // metal coping on top
  });

  // Rails and boxes
  platforms.forEach((pl) => {
    if (pl.type === "rail") {
      rect(ctx, pl.x + 8, pl.y, 4, GY - pl.y, "#8a8fa8");
      rect(ctx, pl.x + pl.w - 12, pl.y, 4, GY - pl.y, "#8a8fa8");
      rect(ctx, pl.x, pl.y, pl.w, 5, "#d5dbef");
      rect(ctx, pl.x, pl.y, pl.w, 2, "#ffffff");
    } else {
      rect(ctx, pl.x, pl.y, pl.w, GY - pl.y, "#4a3560");
      rect(ctx, pl.x + 3, pl.y + 3, pl.w - 6, GY - pl.y - 3, "#ff9ec4");
      rect(ctx, pl.x + 3, pl.y + 3, pl.w - 6, 4, "#ffd1e3");
    }
  });

  // Gate (closed until all 5 gifts are found)
  rect(ctx, GATE_X, GY - 90, 8, 90, "#4a3560");
  rect(ctx, GATE_X + 40, GY - 90, 8, 90, "#4a3560");
  if (giftsFound < 5) {
    for (let i = 0; i < 4; i++) rect(ctx, GATE_X + 8, GY - 80 + i * 20, 32, 6, "#ff6fa5");
    ctx.fillStyle = "#4a3560"; ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillText("🎁 " + giftsFound + "/5", GATE_X - 4, GY - 100);
  }

  // Stars
  coins.forEach((c) => {
    if (c.got) return;
    const bob = Math.round(Math.sin(time * 4 + c.x) * 2);
    rect(ctx, c.x + 4, c.y + bob, 4, 12, "#ffd34d");
    rect(ctx, c.x, c.y + 4 + bob, 12, 4, "#ffd34d");
  });

  // Gifts
  gifts.forEach((g) => {
    if (g.got) return;
    const y = g.y + Math.round(Math.sin(time * 3 + g.x) * 3);
    rect(ctx, g.x, y, 24, 24, "#4a3560");
    rect(ctx, g.x + 2, y + 2, 20, 20, "#ff6fa5");
    rect(ctx, g.x + 10, y, 4, 24, "#fff");
    rect(ctx, g.x, y + 10, 24, 4, "#fff");
    rect(ctx, g.x + 4, y - 6, 6, 6, "#ffd34d"); rect(ctx, g.x + 14, y - 6, 6, 6, "#ffd34d");
  });

  // Cake (faded until the gate opens)
  ctx.globalAlpha = giftsFound >= 5 ? 1 : 0.35;
  drawCake(ctx, CAKE_X, GY - 45, 3);
  ctx.globalAlpha = 1;
  if (giftsFound >= 5 && Math.floor(time * 3) % 2) sparkle(ctx, CAKE_X + 60, GY - 60, 3);

  // Player (with skateboard)
  const px = Math.round(p.x), py = Math.round(p.y);
  drawSprite(SPRITE, px, py - 4, 2, p.face < 0);
  rect(ctx, px - 4, py + p.h - 5, 28, 3, "#7a4bd1");
  rect(ctx, px, py + p.h - 2, 4, 3, "#fff");
  rect(ctx, px + 16, py + p.h - 2, 4, 3, "#fff");

  ctx.restore();
}

/* =====================================================================
   9. GAME LOOP
   ===================================================================== */
let last = 0;
function loop(now) {
  const s = Math.min((now - last) / 16.67, 2.5) || 1;   // keeps speed steady on any screen
  last = now;
  time = now / 1000;
  if (state === "play") update(s);
  draw();
  requestAnimationFrame(loop);
}

/* =====================================================================
   10. CONTROLS: keyboard, touch and buttons
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

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", " "].includes(k) && state === "play") e.preventDefault();
  if (k === "arrowleft" || k === "a") keys.left = true;
  if (k === "arrowright" || k === "d") keys.right = true;
  if (k === "arrowup" || k === "w" || k === " ") keys.jump = true;
  if (k === "p") togglePause();
  if (k === "r" && state !== "start") startGame();
  if (k === "escape" && state === "modal") closeGift();
});
window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "arrowleft" || k === "a") keys.left = false;
  if (k === "arrowright" || k === "d") keys.right = false;
  if (k === "arrowup" || k === "w" || k === " ") keys.jump = false;
});

// Hold-to-press touch buttons
function holdButton(id, key) {
  const el = $(id);
  const on = (e) => { e.preventDefault(); keys[key] = true; };
  const off = (e) => { e.preventDefault(); keys[key] = false; };
  el.addEventListener("pointerdown", on);
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => el.addEventListener(ev, off));
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}
holdButton("btnLeft", "left");
holdButton("btnRight", "right");
holdButton("btnJump", "jump");

$("startBtn").addEventListener("click", startGame);
$("replayBtn").addEventListener("click", startGame);
$("restartBtn").addEventListener("click", (e) => { e.currentTarget.blur(); if (state !== "start") startGame(); });
$("pauseBtn").addEventListener("click", (e) => { e.currentTarget.blur(); togglePause(); });
$("resumeBtn").addEventListener("click", togglePause);
$("giftClose").addEventListener("click", closeGift);

// Start: build the level and begin drawing (the game waits on the start screen)
resetGame();
requestAnimationFrame(loop);