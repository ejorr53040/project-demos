/* ═══════════════════════════════════════════════════════════════════════════
   ejorr/systems — pixel engine
   Sprites, ordered dithering and generated scenes. Requires tokens.css.

   Everything reads its colour from the tokens at draw time, so a theme flip
   repaints instead of showing a palette baked into an image. There are no
   binary assets: sprites are string grids, gradients are generated.

   API
     drawSprite(canvas, name, scale)        name from SPRITES, scale 3-5
     addSprite(name, rows)                  rows: array of equal-length strings
     drawWash(canvas, w, h, ramp, mode)     mode: v | h | diag | radial
     drawMeter(canvas, pct, ramp)           dithered progress meter
     drawScene(canvas)                      generated landscape
     blueRamp() warmRamp() greenRamp()      token-backed 5-step ramps
     onThemeChange(fn)                      repaint hook — always wire this

   Sprite grid characters
     .  transparent    1  --b2   2  --b4   3  --b6   4  --text
     5  --o3           6  --o4   7  --o6   8  --surface   9  --ok
   ═══════════════════════════════════════════════════════════════════════════ */

var SPRITES = {
  /* 12x12. Keep new sprites on this grid so they scale with the others. */
  pin: ["....6666....", "..66666666..", ".6661111666.", "666111111666", "666111111666",
        ".6611111166.", "..66666666..", "...666666...", "....6666....",
        ".....66.....", ".....6......", "............"],
  cube: ["....4444....", "..44111144..", "441111111144", "431111111124", "433311112224",
         "433333222224", "433333222224", "433333222224", "433333222224", "443333222244",
         "..44332244..", "....4444...."],
  clip: ["............", "..44444444..", "..41111114..", "..41331114..", "..41111114..",
         "..41331114..", "..41611614..", "..41166114..", "..41111114..", "..41331114..",
         "..44444444..", "............"],
  lens: ["...444......", "..41114.....", ".4111114....", ".4111114....", ".4111114....",
         "..41114.....", "...444......", ".....66.....", "......66....", ".......66...",
         "........66..", "............"]
};

function addSprite(name, rows) {
  var w = rows[0].length;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].length !== w) throw new Error("sprite " + name + ": row " + i + " is " + rows[i].length + ", expected " + w);
  }
  SPRITES[name] = rows;
}

function V(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function hex2rgb(h) {
  h = h.trim().replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function spritePalette() {
  var m = { "1": "--b2", "2": "--b4", "3": "--b6", "4": "--text",
            "5": "--o3", "6": "--o4", "7": "--o6", "8": "--surface", "9": "--ok" };
  var out = { ".": null };
  for (var k in m) out[k] = V(m[k]);
  return out;
}

function drawSprite(cv, name, scale) {
  var rows = SPRITES[name];
  if (!rows) throw new Error("unknown sprite: " + name);
  scale = scale || 4;
  var pal = spritePalette(), w = rows[0].length, h = rows.length;
  cv.width = w * scale; cv.height = h * scale;
  var g = cv.getContext("2d");
  g.clearRect(0, 0, cv.width, cv.height);
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var c = pal[rows[y].charAt(x)];
      if (!c) continue;
      g.fillStyle = c;
      g.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

/* 4x4 Bayer ordered dither. This is what makes the gradients "smooth pixel"
   rather than CSS gradients: every pixel is a real palette step. */
var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

function ditherFill(g, w, h, ramp, fn) {
  var img = g.createImageData(w, h), d = img.data, n = ramp.length, rgb = [], i;
  for (i = 0; i < n; i++) rgb.push(hex2rgb(ramp[i]));
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var t = fn(w > 1 ? x / (w - 1) : 0, h > 1 ? y / (h - 1) : 0);
      if (t < 0) t = 0; if (t > 1) t = 1;
      var v = t * (n - 1), lo = Math.floor(v), f = v - lo;
      var th = (BAYER[y & 3][x & 3] + 0.5) / 16;
      var k = lo + (f > th ? 1 : 0);
      if (k > n - 1) k = n - 1;
      var c = rgb[k], o = (y * w + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

function blueRamp()  { return [V("--b1"), V("--b2"), V("--b3"), V("--b4"), V("--b5")]; }
function warmRamp()  { return [V("--o1"), V("--o2"), V("--o3"), V("--o4"), V("--o5")]; }
function greenRamp() { return [V("--g1"), V("--g2"), V("--g3"), V("--g4"), V("--g5")]; }

/* Render small, upscale with CSS + image-rendering:pixelated. Native size is
   the pixel size — do not render at CSS size or the dither disappears. */
function drawWash(cv, w, h, ramp, mode) {
  cv.width = w; cv.height = h;
  var fns = {
    v: function (x, y) { return y; },
    h: function (x) { return x; },
    diag: function (x, y) { return (x + y) / 2; },
    radial: function (x, y) { var dx = x - 0.5, dy = y - 0.5; return Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2); }
  };
  ditherFill(cv.getContext("2d"), w, h, ramp, fns[mode] || fns.v);
}

/* The empty track is the ramp's first step, so one pass draws track and fill. */
function drawMeter(cv, pct, ramp) {
  var w = 76, h = 9, f = pct / 100;
  cv.width = w; cv.height = h;
  ditherFill(cv.getContext("2d"), w, h, ramp, function (x) {
    if (x > f) return 0;
    return 0.3 + 0.7 * (f > 0 ? x / f : 0);
  });
}

/* Generated scene: dithered sky, a disc, three stepped ridges. Deterministic. */
function drawScene(cv) {
  var w = 200, h = 52, xx, yy;
  cv.width = w; cv.height = h;
  var g = cv.getContext("2d");
  ditherFill(g, w, h, [V("--b1"), V("--b2"), V("--b3"), V("--b4")], function (x, y) { return y * 0.94; });

  var sx = 152, sy = 17, r = 8;
  g.fillStyle = V("--o4");
  for (yy = -r; yy <= r; yy++) for (xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) g.fillRect(sx + xx, sy + yy, 1, 1);
  g.fillStyle = V("--o2");
  for (yy = -r; yy <= r; yy++) for (xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r && xx + yy < -3) g.fillRect(sx + xx, sy + yy, 1, 1);

  function ridge(base, amp, step, col, phase) {
    g.fillStyle = col;
    for (var x = 0; x < w; x += step) {
      var yb = Math.round(base + Math.sin((x + phase) * 0.042) * amp + Math.sin((x + phase) * 0.105) * amp * 0.42);
      g.fillRect(x, yb, step, h - yb);
    }
  }
  ridge(30, 6, 4, V("--b5"), 0);
  ridge(38, 4, 3, V("--b6"), 55);
  ridge(45, 2, 2, V("--b7"), 110);
}

/* Wire this on every page that draws. Covers the OS theme and an in-page
   toggle that stamps data-theme. */
function onThemeChange(fn) {
  try {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  } catch (e) { /* no matchMedia: a static render is still correct */ }
  try {
    new MutationObserver(fn).observe(document.documentElement,
      { attributes: true, attributeFilter: ["data-theme"] });
  } catch (e) { /* ditto */ }
}

/* Convenience: paint everything marked up declaratively, then keep it in sync.
     <canvas data-sprite="pin">            <canvas data-strip="warm">
     <canvas data-scene>                   <canvas data-meter="86"> */
function paintAll() {
  var RAMPS = { warm: warmRamp, green: greenRamp, blue: blueRamp };
  var i, list;
  list = document.querySelectorAll("[data-scene]");
  for (i = 0; i < list.length; i++) drawScene(list[i]);
  list = document.querySelectorAll("[data-sprite]");
  for (i = 0; i < list.length; i++) drawSprite(list[i], list[i].getAttribute("data-sprite"), +(list[i].getAttribute("data-scale") || 4));
  list = document.querySelectorAll("[data-strip]");
  for (i = 0; i < list.length; i++) drawWash(list[i], 160, 8, (RAMPS[list[i].getAttribute("data-strip")] || blueRamp)(), "h");
  list = document.querySelectorAll("[data-meter]");
  for (i = 0; i < list.length; i++) drawMeter(list[i], +list[i].getAttribute("data-meter"), blueRamp());
}
