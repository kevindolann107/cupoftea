// =============================================================
// field.js — draws the ballpark from behind home plate,
// plus the pitcher, the batter, and every pitch and hit.
// =============================================================

const field = document.getElementById("field");
const ctx = field.getContext("2d");

// The ballpark itself is drawn in a 240 x 140 pixel area.
// The canvas stretches to fill the whole window, and the extra space
// becomes more sky on top and more ground on the sides.
const SCENE_W = 240;
const SCENE_H = 140;
const UI_SPACE = 300; // screen pixels kept clear at the top for the scoreboard

let W, H;      // canvas size in pixels
let OX, OY;    // where the ballpark sits inside the canvas
let SCALE;     // how many screen pixels each canvas pixel takes up

function resize() {
  // Biggest whole-number zoom that still leaves room for the scoreboard
  SCALE = 1;
  for (let s = 2; s <= 12; s++) {
    if (SCENE_W * s * 0.85 <= window.innerWidth && SCENE_H * s + UI_SPACE <= window.innerHeight) SCALE = s;
  }
  W = Math.ceil(window.innerWidth / SCALE);
  H = Math.ceil(window.innerHeight / SCALE);
  OX = Math.floor((W - SCENE_W) / 2);
  OY = H - SCENE_H;

  field.width = W;
  field.height = H;
  field.style.width = (W * SCALE) + "px";
  field.style.height = (H * SCALE) + "px";
  drawField();
}

// ---------- The "3D" camera ----------
// These numbers make things far away look smaller and higher up,
// like you're standing behind the catcher.
const CENTER_X = 120;  // home plate is in the middle, left to right
const HORIZON = 20;    // where the field would vanish if it went forever
const A = 18335;       // depth stretch
const D = 173;         // depth offset
const SIDE = 0.00913;  // how wide things look
const LIFT = 0.008;    // how high the ball looks in the air
const WALL_ROW = 52;   // screen row of the center field wall (400 ft)

// Turns a spot on the field (in feet) into a spot on the screen.
// x = feet left/right of home, z = feet out from home, h = feet in the air
function toScreen(x, z, h) {
  const depth = A / (z + D);
  return {
    sx: CENTER_X + x * depth * SIDE,
    sy: HORIZON + depth - h * depth * LIFT
  };
}

// How deep the wall is at each angle: 330 ft down the lines, 400 ft to center
function wallDistance(x, z) {
  const angle = Math.atan2(x, z); // 0 = straight to center field
  return 330 + 70 * Math.cos(angle * 2);
}

// ---------- Colors ----------
const COLORS = {
  h: "#1b2a4a", // helmet / cap
  s: "#e0a77a", // skin
  w: "#f2f2f2", // white uniform
  g: "#b9c2cc", // grey pants
  p: "#ff4f7b", // pink team color
  k: "#111111", // shoes
  m: "#8a5a2b"  // glove
};
const CROWD = ["#ff4f7b", "#7fdbff", "#ffd166", "#ffffff"];
const HIT_COLORS = {
  "Weak grounder": "#9fb3c8",
  "Single": "#7fdbff",
  "Double": "#ff4f7b",
  "HOME RUN!": "#ffd166"
};

// A repeatable "random" number for each pixel, so fans and stars don't flicker
function speck(x, y, every) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) % every === 0;
}

// ---------- Drawing the empty ballpark (done once) ----------
function skyAndStands(x, y, screenY) {
  // Night sky with stars, getting lighter toward the stands
  if (y < HORIZON) {
    if (speck(x, y, 97)) return "#cfe8ff";        // bright stars
    if (speck(x + 7, y, 61)) return "#3d5a80";    // faint stars
    const bands = ["#03070f", "#050d1a", "#07111f", "#091526", "#0b1a2e", "#0e2136"];
    const t = screenY / (OY + HORIZON);
    return bands[Math.min(5, Math.floor(t * 6))];
  }
  // Stands full of fans
  if (y < 44) {
    if (speck(x, y, 6)) return CROWD[(x * 3 + y) % 4];
    return (y - HORIZON) % 6 === 0 ? "#16263d" : "#0f1b2d";
  }
  // Outfield wall with a yellow line on top
  if (y === 44) return "#ffd166";
  return "#134a2a";
}

function groundColor(px, y) {
  // Undo the camera: which spot on the field is this pixel?
  const depth = y - HORIZON;
  const z = A / depth - D;
  const x = (px - CENTER_X) / (depth * SIDE);
  const feetPerPixel = 1 / (depth * SIDE);

  const dist = Math.sqrt(x * x + z * z);
  const fair = z >= Math.abs(x);
  const wall = wallDistance(x, z);

  if (z > 0 && dist > wall) return "#134a2a";                               // wall
  if (z >= 0 && Math.abs(Math.abs(x) - z) < feetPerPixel * 0.7) return "#ffffff"; // foul lines
  if (!fair && z > 0 && dist > wall - 15) return "#a85f30";                 // track (foul side)
  if (fair && dist > wall - 15) return "#a85f30";                           // warning track

  const moundDist = Math.sqrt(x * x + (z - 60.5) * (z - 60.5));
  if (moundDist < 9) return "#d18a50";                                      // mound
  if (Math.abs(x) + Math.abs(z - 63.6) < 52 && z > 8) return infieldGrass(z);
  if (moundDist < 95 && z > -5) return "#c2773d";                           // infield dirt
  if (dist < 14) return "#c2773d";                                          // dirt around home
  if (!fair) return "#24703a";                                              // foul ground

  return infieldGrass(z);                                                   // outfield
}

// Mowing stripes that get thinner as they go back = instant 3D
function infieldGrass(z) {
  return Math.floor(z / 28) % 2 === 0 ? "#2e8b47" : "#34a052";
}

let fieldImage = null;

function drawField() {
  // Color every pixel on the screen
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const wx = x - OX; // position inside the ballpark
      const wy = y - OY;
      ctx.fillStyle = wy < WALL_ROW ? skyAndStands(wx, wy, y) : groundColor(wx, wy);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  drawMoon(W - 34, Math.max(14, Math.floor(OY * 0.35)));

  // Everything below is drawn in ballpark coordinates
  ctx.save();
  ctx.translate(OX, OY);

  // Light towers
  drawLightTower(28);
  drawLightTower(SCENE_W - 28);

  // Bases and home plate
  ctx.fillStyle = "#ffffff";
  base(63.6, 63.6);   // 1st
  base(0, 127.3);     // 2nd
  base(-63.6, 63.6);  // 3rd
  const home = toScreen(0, 0, 0);
  ctx.fillRect(Math.round(home.sx) - 2, Math.round(home.sy), 5, 2);
  ctx.fillRect(Math.round(home.sx) - 1, Math.round(home.sy) + 2, 3, 1);

  // Pitcher's rubber
  const rubber = toScreen(0, 60.5, 0);
  ctx.fillRect(Math.round(rubber.sx) - 2, Math.round(rubber.sy), 4, 1);

  ctx.restore();
  fieldImage = ctx.getImageData(0, 0, W, H);
}

// A big glowing pixel moon
function drawMoon(cx, cy) {
  const glow = [[16, "rgba(255, 79, 123, 0.06)"], [12, "rgba(255, 209, 102, 0.10)"], [9, "rgba(255, 240, 200, 0.18)"]];
  glow.forEach(function (g) {
    disc(cx, cy, g[0], g[1]);
  });
  disc(cx, cy, 7, "#fff1c9");
  disc(cx - 2, cy - 2, 1, "#e8d6a5");  // craters
  disc(cx + 3, cy + 1, 1, "#e8d6a5");
  disc(cx, cy + 4, 1, "#e8d6a5");
}

function disc(cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r + r) ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

function base(x, z) {
  const p = toScreen(x, z, 0);
  ctx.fillRect(Math.round(p.sx) - 1, Math.round(p.sy), 3, 2);
}

function drawLightTower(x) {
  ctx.fillStyle = "#3a4a63";
  ctx.fillRect(x, 8, 1, 36);                     // pole
  ctx.fillStyle = "rgba(255, 240, 180, 0.15)";
  ctx.fillRect(x - 7, 1, 15, 10);                // glow
  ctx.fillStyle = "rgba(255, 240, 180, 0.3)";
  ctx.fillRect(x - 5, 3, 11, 6);
  ctx.fillStyle = "#fff6d0";
  ctx.fillRect(x - 3, 4, 7, 3);                  // the lights
}

// ---------- Sprites (pixel people) ----------
// Each letter is one pixel, colored using COLORS above. "." = see-through.

const PITCHER = [
  [ // 0: set
    "..hhhh..",
    "..ssss..",
    "..ssss..",
    ".wwwwww.",
    "wwwwwwww",
    "swwppwws",
    "swwwwwws",
    "m.wwww..",
    "..pppp..",
    "..gggg..",
    "..g..g..",
    "..g..g..",
    "..g..g..",
    ".kk..kk."
  ],
  [ // 1: leg kick
    "..hhhh..",
    "..ssss..",
    "..ssss..",
    ".wwwwww.",
    "mwwwwwws",
    "mwwppww.",
    ".wwwwwws",
    "..wwww..",
    "..ppppgg",
    "..gggggg",
    "..g....k",
    "..g.....",
    "..g.....",
    ".kk....."
  ],
  [ // 2: throw
    "..hhhh.s",
    "..ssss.s",
    "..ssss.w",
    ".wwwwwww",
    "mwwwwww.",
    "mwwppww.",
    ".wwwwww.",
    "..wwww..",
    "..pppp..",
    "..gggg..",
    ".gg..g..",
    "gg...g..",
    "g....g..",
    "k...kk.."
  ]
];

// The batter, seen from behind (we're looking over his shoulder)
const BATTER = [
  "...hhhh...",
  "..hhhhhh..",
  "..hhhhhh..",
  "...ssss...",
  "..wwwwww..",
  ".wwwwwwww.",
  ".wwwppwww.",
  ".wwwppwww.",
  ".wwwwwwww.",
  ".wwwwwwww.",
  "..wwwwww..",
  "..pppppp..",
  "..gggggg..",
  ".ggg..ggg.",
  ".ggg..ggg.",
  ".ggg..ggg.",
  "ggg....ggg",
  "ggg....ggg",
  "ggg....ggg",
  "kkk....kkk"
];

// Draws a sprite with its feet at (footX, footY)
function drawSprite(rows, footX, footY, scale) {
  const w = rows[0].length * scale;
  const left = Math.round(footX - w / 2);
  const top = Math.round(footY - rows.length * scale);
  rows.forEach(function (row, r) {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      ctx.fillStyle = COLORS[ch];
      ctx.fillRect(left + c * scale, top + r * scale, scale, scale);
    }
  });
}

// Draws a thick line one pixel-blob at a time (used for the bat and arms)
function thickLine(x0, y0, x1, y1, color, size) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), size, size);
  }
}

// Where the pitcher and batter stand
const MOUND = toScreen(0, 60.5, 0);
const BATTER_X = 96;
const BATTER_FEET = 139;
const SHOULDER = { x: 103, y: 110 };

// Bat positions during a swing: stance, contact, follow-through
const GRIP = [
  { x: 102, y: 105 },
  { x: 103, y: 120 },
  { x: 106, y: 104 }
];
const BAT_LENGTH = 22;

function drawBatter(swing) {
  // swing goes 0 (stance) → 0.5 (contact) → 1 (follow-through)
  drawSprite(BATTER, BATTER_X, BATTER_FEET, 2);

  // The bat looks shorter mid-swing, when it's pointing at or away from us
  let grip, angle, length;
  if (swing < 0.5) {
    const t = swing / 0.5;
    grip = mix(GRIP[0], GRIP[1], t);
    angle = -120 + 120 * t;            // bat comes down level through the zone
    length = BAT_LENGTH * (1 - 0.5 * Math.sin(Math.PI * t));
  } else {
    const t = (swing - 0.5) / 0.5;
    grip = mix(GRIP[1], GRIP[2], t);
    angle = -160 * t;                  // and wraps up over the shoulder
    length = BAT_LENGTH * (1 - 0.6 * Math.sin(Math.PI * t));
  }

  const rad = angle * Math.PI / 180;
  const tipX = grip.x + Math.cos(rad) * length;
  const tipY = grip.y + Math.sin(rad) * length;

  thickLine(SHOULDER.x, SHOULDER.y, grip.x, grip.y, COLORS.w, 2); // arms
  thickLine(grip.x, grip.y, tipX, tipY, "#c98b4b", 2);             // bat
  ctx.fillStyle = COLORS.s;
  ctx.fillRect(Math.round(grip.x) - 1, Math.round(grip.y) - 1, 3, 3); // hands
}

function mix(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// ---------- The ball ----------
function drawBall(x, z, h) {
  const ground = toScreen(x, z, 0);
  const ball = toScreen(x, z, h);
  const size = z < 40 ? 3 : 2; // closer = bigger

  if (h > 1) { // shadow on the grass
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(Math.round(ground.sx) - 1, Math.round(ground.sy), size + 1, 1);
  }
  // Dark outline so you can see the ball against the crowd
  const bx = Math.round(ball.sx - size / 2);
  const by = Math.round(ball.sy - size / 2);
  ctx.fillStyle = "#050d1a";
  ctx.fillRect(bx - 1, by - 1, size + 2, size + 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bx, by, size, size);
}

// ---------- At-bat timeline (milliseconds) ----------
const LEG_KICK = 200;
const RELEASE = 450;
const PLATE = 950;        // pitch reaches the plate
const SWING_START = 800;
const SWING_TIME = 300;   // contact happens halfway through = 950

// Each kind of hit: how long it flies and how high it goes (feet)
const FLIGHT = {
  "Weak grounder": { time: 800,  peak: 0 },
  "Single":        { time: 900,  peak: 25 },
  "Double":        { time: 1100, peak: 55 },
  "HOME RUN!":     { time: 1300, peak: 110 }
};

let atBat = null;   // the at-bat being animated right now
let landed = [];    // every spot a ball landed (your spray chart)
let sparks = [];    // home run fireworks

// Call this when the player answers correctly
function playAtBat(hit, feet) {
  // Pick a random direction between the foul lines
  const angle = (Math.random() * 76 - 38) * Math.PI / 180;
  const wall = 330 + 70 * Math.cos(angle * 2);

  let dist = feet;
  if (hit === "HOME RUN!") dist = wall + 250 + Math.random() * 300; // deep into the seats
  else dist = Math.min(feet, wall - 8);                            // everything else stays in

  atBat = {
    start: performance.now(),
    hit: hit,
    endX: Math.sin(angle) * dist,
    endZ: Math.cos(angle) * dist,
    done: false,
    strikeout: false
  };
}

// Call this when time runs out
function playStrikeout() {
  atBat = { start: performance.now(), strikeout: true, done: false };
}

// ---------- Screen effects ----------
function flashStage(className) {
  document.body.classList.remove(className);
  void document.body.offsetWidth; // restart the animation if it ran before
  document.body.classList.add(className);
}

// ---------- Draw everything, 60 times a second ----------
function render(now) {
  ctx.putImageData(fieldImage, 0, 0);
  ctx.save();
  ctx.translate(OX, OY); // draw in ballpark coordinates

  // Spray chart dots
  landed.forEach(function (spot) {
    const x = Math.round(spot.sx) - 1;
    const y = Math.round(spot.sy) - 1;
    ctx.fillStyle = "#050d1a";          // dark outline
    ctx.fillRect(x - 1, y - 1, 4, 4);
    ctx.fillStyle = spot.color;
    ctx.fillRect(x, y, 2, 2);
  });

  let pitcherPose = 0;
  let swing = 0;
  let ball = null;   // {x, z, h}
  let contactFlash = false;

  if (atBat) {
    const t = now - atBat.start;

    // Pitcher windup
    if (t > LEG_KICK && t < RELEASE) pitcherPose = 1;
    else if (t >= RELEASE && t < RELEASE + 350) pitcherPose = 2;

    // The pitch coming in
    if (t >= RELEASE && t < PLATE) {
      const p = (t - RELEASE) / (PLATE - RELEASE);
      ball = { x: 1.5 * p, z: 54 * (1 - p), h: 6 + Math.sin(Math.PI * p) * 2 };
    }

    if (atBat.strikeout) {
      // Ball sails past into the catcher's mitt, field shakes
      if (t >= PLATE && t < PLATE + 80) ball = { x: 1.5, z: -3, h: 5 };
      if (t >= PLATE && !atBat.done) {
        atBat.done = true;
        flashStage("shake");
      }
    } else {
      // The swing
      if (t >= SWING_START) swing = Math.min(1, (t - SWING_START) / SWING_TIME);
      if (t >= PLATE && t < PLATE + 70) contactFlash = true;

      // The hit flying out
      const f = FLIGHT[atBat.hit];
      if (t >= PLATE && t < PLATE + f.time) {
        const p = (t - PLATE) / f.time;
        let h;
        if (atBat.hit === "Weak grounder") {
          h = Math.abs(Math.sin(Math.PI * 3 * p)) * 4 * (1 - p); // little bounces
        } else {
          h = 5 + Math.sin(Math.PI * p) * f.peak - 5 * p;
        }
        ball = { x: atBat.endX * p, z: atBat.endZ * p, h: h };

        // Remember where the ball has been, for a glowing trail
        const spot = toScreen(ball.x, ball.z, ball.h);
        atBat.trail = atBat.trail || [];
        atBat.trail.push({ sx: spot.sx, sy: spot.sy });
        if (atBat.trail.length > 14) atBat.trail.shift();
      }

      // It landed
      if (t >= PLATE + f.time && !atBat.done) {
        atBat.done = true;
        const spot = toScreen(atBat.endX, atBat.endZ, 0);
        landed.push({ sx: spot.sx, sy: spot.sy, color: HIT_COLORS[atBat.hit] });
        if (atBat.hit === "HOME RUN!") launchFireworks(spot.sx, 12); // burst in the sky
      }
    }
  }

  drawSprite(PITCHER[pitcherPose], MOUND.sx, MOUND.sy, 1);

  // Fading trail behind a hit ball
  if (ball && atBat && atBat.trail) {
    ctx.fillStyle = HIT_COLORS[atBat.hit];
    atBat.trail.forEach(function (p, i) {
      ctx.globalAlpha = (i + 1) / atBat.trail.length * 0.8;
      ctx.fillRect(Math.round(p.sx), Math.round(p.sy), 1, 1);
    });
    ctx.globalAlpha = 1;
  }
  if (ball) drawBall(ball.x, ball.z, ball.h);
  drawBatter(swing);

  if (contactFlash) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(118, 117, 5, 1);
    ctx.fillRect(120, 115, 1, 5);
  }

  drawSparks(now);
  ctx.restore();
  requestAnimationFrame(render);
}

// ---------- Home run fireworks ----------
function launchFireworks(x, y) {
  flashStage("homer-flash");
  const start = performance.now();
  for (let i = 0; i < 22; i++) {
    sparks.push({
      x: x, y: y, start: start,
      angle: (i / 22) * Math.PI * 2,
      speed: 18 + Math.random() * 14,
      color: CROWD[i % CROWD.length]
    });
  }
}

function drawSparks(now) {
  sparks = sparks.filter(function (s) { return now - s.start < 1200; });
  sparks.forEach(function (s) {
    const t = (now - s.start) / 1200;
    const r = s.speed * t;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = s.color;
    ctx.fillRect(Math.round(s.x + Math.cos(s.angle) * r), Math.round(s.y + Math.sin(s.angle) * r + t * 6), 2, 2);
  });
  ctx.globalAlpha = 1;
}

// Clear the batter's stance between at-bats
function resetAtBat() {
  atBat = null;
}

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(render);