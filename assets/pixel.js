/* ═══════════════════════════════════════════════════════════════════════════
   ejorr/systems — pixel engine
   Icons, ordered dithering and generated scenes. Requires tokens.css.

   Everything reads its colour from the tokens at draw time, so a theme flip
   repaints instead of showing a palette baked into an image. There are no
   binary assets: icons are string grids, gradients and scenes are generated.

   API
     drawSprite(canvas, name, scale)        name from SPRITES, scale 3-5
     addSprite(name, rows)                  rows: array of equal-length strings
     drawWash(canvas, w, h, ramp, mode)     mode: v | h | diag | radial
     drawMeter(canvas, pct, ramp)           dithered progress meter
     drawScene(canvas, name)                name from SCENES
     blueRamp() warmRamp() greenRamp()      token-backed 5-step ramps
     onThemeChange(fn)                      repaint hook — always wire this

   Icon grid characters
     .  transparent    1  --b2   2  --b4   3  --b6   4  --text
     5  --o3           6  --o4   7  --o6   8  --surface   9  --ok
   ═══════════════════════════════════════════════════════════════════════════ */

var SPRITES = {
  /* ── restored, rebuilt on a symmetric grid ────────────────────────────── */
  pin: ["....6666....", "..66666666..", ".6666666666.", "666111111666", "666111111666", "666111111666", ".6661111666.", "..66666666..", "...666666...", "....6666....", ".....66.....", "............"],
  code: ["............", "............", "...44..44...", "..44....44..", ".44......44.", "44........44", "44........44", ".44......44.", "..44....44..", "...44..44...", "............", "............"],
  spark: [".....66.....", ".....66.....", ".....66.....", "....6666....", "...666666...", "666666666666", "666666666666", "...666666...", "....6666....", ".....66.....", ".....66.....", ".....66....."],
  globe: ["............", "....4444....", "..44122144..", "..41122114..", ".4111221114.", ".4222222224.", ".4222222224.", ".4111221114.", "..41122114..", "..44122144..", "....4444....", "............"],
  /* ── existing ─────────────────────────────────────────────────────────── */
  cube: ["....4444....", "..44111144..", "441111111144", "431111111124", "433311112224",
         "433333222224", "433333222224", "433333222224", "433333222224", "443333222244",
         "..44332244..", "....4444...."],
  clip: ["............", "..44444444..", "..41111114..", "..41331114..", "..41111114..",
         "..41331114..", "..41611614..", "..41166114..", "..41111114..", "..41331114..",
         "..44444444..", "............"],
  lens: ["...444......", "..41114.....", ".4111114....", ".4111114....", ".4111114....",
         "..41114.....", "...444......", ".....66.....", "......66....", ".......66...",
         "........66..", "............"],

  /* ── navigation & control ─────────────────────────────────────────────── */
  arrow: ["............", "............", "............", "......44....", ".......44...",
          ".444444444..", ".444444444..", ".......44...", "......44....", "............",
          "............", "............"],
  caret: ["............", "............", "...44.......", "....44......", ".....44.....",
          "......44....", "......44....", ".....44.....", "....44......", "...44.......",
          "............", "............"],
  check: ["............", "............", ".........99.", "........99..", ".......99...",
          "..9....99...", "..99..99....", "...9999.....", "....99......", "............",
          "............", "............"],
  cross: ["............", "............", "..44....44..", "...44..44...", "....4444....",
          ".....44.....", ".....44.....", "....4444....", "...44..44...", "..44....44..",
          "............", "............"],
  plus:  ["............", "............", ".....44.....", ".....44.....", ".....44.....",
          "..44444444..", "..44444444..", ".....44.....", ".....44.....", ".....44.....",
          "............", "............"],
  minus: ["............", "............", "............", "............", "............",
          "..44444444..", "..44444444..", "............", "............", "............",
          "............", "............"],
  menu:  ["............", "............", ".4444444444.", ".4444444444.", "............",
          ".4444444444.", ".4444444444.", "............", ".4444444444.", ".4444444444.",
          "............", "............"],
  gear:  ["............", "...44..44...", "...444444...", "..44444444..", "..44444444..",
          "44444..44444", "44444..44444", "..44444444..", "..44444444..", "...444444...",
          "...44..44...", "............"],
  home:  ["............", ".....44.....", "....4444....", "...444444...", "..44444444..",
          ".4444444444.", "..41111114..", "..41166114..", "..41166114..", "..44444444..",
          "............", "............"],
  download: ["............", ".....44.....", ".....44.....", ".....44.....", ".....44.....",
             "..44444444..", "...444444...", "....4444....", ".....44.....", "............",
             "..44444444..", "............"],
  upload: ["............", ".....44.....", "....4444....", "...444444...", "..44444444..",
           ".....44.....", ".....44.....", ".....44.....", ".....44.....", "............",
           "..44444444..", "............"],

  /* ── files & records ──────────────────────────────────────────────────── */
  file:  ["............", "..44444444..", "..41111114..", "..41444114..", "..41111114..",
          "..41444414..", "..41111114..", "..41444414..", "..41111114..", "..44444444..",
          "............", "............"],
  folder:["............", "............", ".4444.......", ".4444444444.", ".4111111114.",
          ".4111111114.", ".4111111114.", ".4111111114.", ".4111111114.", ".4444444444.",
          "............", "............"],
  stack: ["..44444444..", "..41111114..", "..44444444..", "............", "..44444444..",
          "..41111114..", "..44444444..", "............", "..44444444..", "..41111114..",
          "..44444444..", "............"],
  book:  ["............", ".4444444444.", ".4111661114.", ".4111661114.", ".4111661114.",
          ".4111661114.", ".4111661114.", ".4111661114.", ".4111661114.", ".4444444444.",
          "............", "............"],
  calendar: ["............", "..4..44..4..", "..44444444..", "..44444444..", "..41111114..",
             "..41616114..", "..41111114..", "..41161614..", "..41111114..", "..44444444..",
             "............", "............"],
  grid:  ["............", ".4444444444.", ".4111411114.", ".4111411114.", ".4444444444.",
          ".4111411114.", ".4111411114.", ".4444444444.", ".4111411114.", ".4444444444.",
          "............", "............"],

  /* ── engineering ──────────────────────────────────────────────────────── */
  terminal: ["............", ".4444444444.", ".4111111114.", ".4661111114.", ".4166111114.", ".4661111114.", ".4111111114.", ".4116666114.", ".4111111114.", ".4444444444.", "............", "............"],
  branch: ["...66.......", "..6666......", "...66.......", "....44......", "....44..66..", "....4446666.", "....44..66..", "....44......", "....44......", "...66.......", "..6666......", "...66......."],
  bug:   ["............", "..4......4..", "...4....4...", "...444444...", ".4446666444.",
          "...466664...", ".4446666444.", "...466664...", "...466664...", "....4444....",
          "............", "............"],
  database: ["............", "...444444...", "..41111114..", "..44444444..", "..41111114..",
             "..41111114..", "..44444444..", "..41111114..", "..41111114..", "..44444444..",
             "...444444...", "............"],
  server: ["............", ".4444444444.", ".4911111114.", ".4111111114.", ".4444444444.",
           ".4911111114.", ".4111111114.", ".4444444444.", ".4911111114.", ".4111111114.",
           ".4444444444.", "............"],
  key:   ["............", "............", "...4444.....", "..411114....", "..41..144444",
          "..41..14444.", "..411114.4.4", "...4444.....", "............", "............",
          "............", "............"],
  lock:  ["............", "....4444....", "...44..44...", "...44..44...", "..44444444..",
          "..41111114..", "..41166114..", "..41166114..", "..41111114..", "..44444444..",
          "............", "............"],
  shield:["............", "..44444444..", "..41111114..", "..41199114..", "..41999914..",
          "..41199114..", "..41111114..", "...411114...", "....4114....", ".....44.....",
          "............", "............"],
  cloud: ["............", "............", "....4444....", "...411114...", "..41111114..",
          ".4111111114.", ".4111111114.", ".4444444444.", "............", "............",
          "............", "............"],
  flask: ["............", "...44..44...", "...44..44...", "...44..44...", "..44....44..",
          "..41111114..", ".4111111114.", ".4166666614.", ".4666666664.", ".4444444444.",
          "............", "............"],

  /* ── data & time ──────────────────────────────────────────────────────── */
  chart: ["............", "............", "..........44", "..........44", "....44....44",
          "....44....44", "....44.66.44", "44..44.66.44", "44..44.66.44", "44..44.66.44",
          "44..44.66.44", "............"],
  trend: ["............", "............", "............", "..........6.", ".........6..",
          "....6...6...", "...6.6.6....", "..6...6.....", ".6..........", "............",
          ".2222222222.", "............"],
  clock: ["............", "....4444....", "..44....44..", ".4........4.", ".4...4....4.",
          ".4...4....4.", ".4...466..4.", ".4........4.", "..44....44..", "....4444....",
          "............", "............"],
  bolt:  ["............", "......6666..", ".....6666...", "....6666....", "...66666666.",
          "..66666666..", ".....6666...", "....6666....", "...6666.....", "..6666......",
          "............", "............"],

  /* ── signals ──────────────────────────────────────────────────────────── */
  mail:  ["............", "............", ".4444444444.", ".4411111144.", ".4141111414.",
          ".4114114114.", ".4111441114.", ".4111111114.", ".4111111114.", ".4444444444.",
          "............", "............"],
  bell: ["............", ".....44.....", "....4444....", "...411114...", "...411114...", "..41111114..", "..41111114..", ".4111111114.", ".4444444444.", ".....66.....", "....6666....", "............"],
  flag:  ["............", "..46666666..", "..46666666..", "..46666666..", "..46666666..",
          "..4.........", "..4.........", "..4.........", "..4.........", "..4.........",
          ".44444......", "............"],
  star: ["............", ".....66.....", ".....66.....", "....6666....", "666666666666", ".6666666666.", "..66666666..", "...666666...", "...66..66...", "..66....66..", ".66......66.", "............"],
  warn: ["............", ".....66.....", "....6666....", "....6..6....", "...66..66...", "...66..66...", "..666..666..", "..666..666..", ".6666666666.", ".6666..6666.", "666666666666", "............"],
  info:  ["............", "....4444....", "..44....44..", ".4...66...4.", ".4........4.",
          ".4...66...4.", ".4...66...4.", ".4...66...4.", "..44....44..", "....4444....",
          "............", "............"],
  user:  ["............", "....4444....", "...411114...", "...411114...", "....4444....",
          "............", "..44444444..", ".4111111114.", ".4111111114.", ".4111111114.",
          "............", "............"],

  /* ── world ────────────────────────────────────────────────────────────── */
  rocket:["............", ".....44.....", "....4114....", "....4114....", "...411114...",
          "...416614...", "...411114...", "..41111114..", "..44.44.44..", "...6..6..6..",
          "....6.6.6...", "............"],
  mountain: ["............", "............", "............", ".....44.....", "....4334....", "....4334....", "...433334...", "..44333344..", "..43333334..", ".4433333344.", "444444444444", "............"],
  cactus:["............", ".....99.....", ".....99.....", "..9..99..9..", "..9..99..9..",
          "..99999..9..", ".....99..9..", ".....99999..", ".....99.....", ".....99.....",
          "....9999....", "............"]
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
/* ═══════════════════════════════════════════════════════════════════════════
   Generated scenes — hero imagery
   Every scene is deterministic, drawn at 240x72 native, and reads its colour
   from the tokens at draw time, so one function serves both themes.
   ═══════════════════════════════════════════════════════════════════════════ */

var SCENE_W = 240, SCENE_H = 72;

function _ctx(cv, w, h) {
  cv.width = w; cv.height = h;
  var g = cv.getContext("2d");
  g.clearRect(0, 0, w, h);
  return g;
}

function _lum(hex) {
  var c = hex2rgb(hex);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/* The ramps invert with the theme, which is right for depth but wrong for
   anything the world decides: snow is pale in both themes. _pale() and
   _deep() pick the END of the ramp rather than an index. */
function _pale() { return _lum(V("--b1")) > _lum(V("--b7")) ? V("--b1") : V("--b7"); }
function _deep() { return _lum(V("--b1")) > _lum(V("--b7")) ? V("--b7") : V("--b1"); }

/* ── sky ──────────────────────────────────────────────────────────────────
   A sky is FLAT BANDS with a dithered seam between them, not dither end to
   end. Dithering the whole field reads as noise and fights everything drawn
   in front of it; confining it to a few rows at each step keeps the smooth-
   pixel character and leaves the sky quiet. `blend` is the seam depth in
   pixels — raise it for a softer sky, drop it to 0 for hard bands. */
function _bandSky(g, w, h, ramp, horizon, blend) {
  var n = ramp.length, bandH = horizon / (n - 1);
  blend = blend === undefined ? 5 : blend;
  var edge = 1 - Math.min(1, blend / bandH);
  ditherFill(g, w, h, ramp, function (x, y) {
    var t = Math.min(1, (y * h) / horizon) * (n - 1);
    var lo = Math.floor(t), f = t - lo;
    if (f <= edge) return lo / (n - 1);                        /* flat band */
    return (lo + (f - edge) / (1 - edge)) / (n - 1);           /* the seam   */
  });
}

/* Sunset: page ground overhead, the accent orange at the horizon. --o4 is
   the one accent value identical in both themes, so the glow lands in the
   same place whichever theme is on. */
function _sunsetSky(g, w, h, horizon) {
  _bandSky(g, w, h, [V("--o1"), V("--o2"), V("--o3"), V("--o4")], horizon, 5);
}

/* Alpine: deepest overhead, clearing toward the horizon. */
function _alpineSky(g, w, h, horizon) {
  _bandSky(g, w, h, [V("--b4"), V("--b3"), V("--b2"), V("--b1")], horizon, 5);
}

/* ── parts ──────────────────────────────────────────────────────────────── */

function _disc(g, cx, cy, r, col) {
  g.fillStyle = col;
  for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++)
    if (x * x + y * y <= r * r) g.fillRect(cx + x, cy + y, 1, 1);
}

/* Horizontal cuts through a disc — the retro sun. Clipped to the circle. */
function _discBands(g, cx, cy, r, col, from, step) {
  g.fillStyle = col;
  for (var y = from; y <= r; y += step) {
    var hw = Math.floor(Math.sqrt(r * r - y * y));
    g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1);
  }
}

function _ridge(g, w, h, base, amp, step, col, phase, freq) {
  g.fillStyle = col;
  for (var x = 0; x < w; x += step) {
    var y = Math.round(base + Math.sin((x + phase) * freq) * amp
                            + Math.sin((x + phase) * freq * 2.7) * amp * 0.36);
    g.fillRect(x, y, step, h - y);
  }
}

/* A saguaro: trunk plus two elbowed arms. */
function _cactus(g, x, base, ht, col) {
  g.fillStyle = col;
  var tw = ht > 22 ? 4 : 3;
  g.fillRect(x, base - ht, tw, ht);
  var a = base - Math.round(ht * 0.50), al = Math.round(ht * 0.30);
  g.fillRect(x - 5, a, 5, 2);
  g.fillRect(x - 5, a - al, 2, al);
  var b = base - Math.round(ht * 0.68), bl = Math.round(ht * 0.36);
  g.fillRect(x + tw, b, 5, 2);
  g.fillRect(x + tw + 3, b - bl, 2, bl);
}

/* Terrain height of a peak at x — so a pylon stands ON the slope. */
function _peakY(cx, baseY, topY, halfL, halfR, x) {
  var d = x < cx ? (cx - x) / halfL : (x - cx) / halfR;
  if (d >= 1) return baseY;
  return topY + Math.round(d * (baseY - topY) / 2) * 2;
}

/* A peak, stepped to whole pixels, with a ragged snow line. */
function _peak(g, w, cx, baseY, topY, halfL, halfR, rock, snow, snowTo) {
  for (var x = cx - halfL; x <= cx + halfR; x++) {
    if (x < 0 || x >= w) continue;
    var y = _peakY(cx, baseY, topY, halfL, halfR, x);
    if (y >= baseY) continue;
    g.fillStyle = rock;
    g.fillRect(x, y, 1, baseY - y);
    if (snow) {
      var edge = snowTo + Math.round(Math.sin(x * 0.8) * 1.5 + Math.sin(x * 0.31) * 1.5);
      if (y < edge) { g.fillStyle = snow; g.fillRect(x, y, 1, Math.min(edge - y, baseY - y)); }
    }
  }
}

function _tree(g, x, base, ht, col) {
  g.fillStyle = col;
  for (var y = 0; y < ht; y++) {
    var ww = 1 + (y >> 1) * 2;
    g.fillRect(x - (ww >> 1), base - ht + y, ww, 1);
  }
  g.fillRect(x, base, 1, 2);
}

/* ── the scenes ─────────────────────────────────────────────────────────── */

function desertDunes(cv) {
  var w = SCENE_W, h = SCENE_H, g = _ctx(cv, w, h);
  _sunsetSky(g, w, h, 46);
  _disc(g, 178, 30, 13, V("--o5"));
  _discBands(g, 178, 30, 13, V("--o3"), 1, 4);
  _ridge(g, w, h, 44, 5, 4, V("--o3"), 0, 0.030);
  _ridge(g, w, h, 53, 4, 3, V("--o5"), 70, 0.042);
  _cactus(g, 44, 58, 20, V("--o6"));
  _cactus(g, 66, 56, 13, V("--o6"));
  _ridge(g, w, h, 62, 3, 2, V("--o6"), 140, 0.055);
}

function desertMesa(cv) {
  var w = SCENE_W, h = SCENE_H, g = _ctx(cv, w, h);
  _sunsetSky(g, w, h, 48);
  _disc(g, 142, 30, 17, V("--o4"));
  _discBands(g, 142, 30, 17, V("--o2"), 2, 5);
  /* a butte is a flat top with two stepped shoulders */
  function butte(x, wd, top, base, col) {
    g.fillStyle = col;
    g.fillRect(x + 4, top, wd - 8, 2);
    g.fillRect(x + 2, top + 2, wd - 4, 2);
    g.fillRect(x, top + 4, wd, base - top - 4);
  }
  butte(4, 50, 30, 50, V("--o3"));
  butte(192, 44, 34, 50, V("--o3"));
  _ridge(g, w, h, 50, 2, 4, V("--o5"), 20, 0.030);
  butte(92, 42, 36, 60, V("--o5"));
  _ridge(g, w, h, 61, 2, 3, V("--o6"), 120, 0.050);
  _cactus(g, 40, 72, 30, V("--o6"));
  _cactus(g, 212, 70, 18, V("--o6"));
}

function desertSaguaro(cv) {
  var w = SCENE_W, h = SCENE_H, g = _ctx(cv, w, h);
  _sunsetSky(g, w, h, 56);
  _disc(g, 62, 36, 19, V("--o4"));
  _discBands(g, 62, 36, 19, V("--o2"), 3, 5);
  _ridge(g, w, h, 50, 3, 6, V("--o3"), 0, 0.022);
  g.fillStyle = V("--o5");
  g.fillRect(0, 56, w, h - 56);
  _cactus(g, 150, 56, 30, V("--o5"));
  _cactus(g, 186, 56, 18, V("--o5"));
  g.fillStyle = V("--o6");
  g.fillRect(0, 62, w, h - 62);
  _cactus(g, 40, 72, 34, V("--o6"));
  _cactus(g, 92, 72, 20, V("--o6"));
  _cactus(g, 216, 72, 25, V("--o6"));
}

function skiLift(cv) {
  var w = SCENE_W, h = SCENE_H, g = _ctx(cv, w, h), i, x, y;
  var PALE = _pale(), CX = 88, BASE = 66, TOP = 10, HL = 66, HR = 104;
  _alpineSky(g, w, h, 50);
  _disc(g, 30, 18, 8, V("--o4"));
  _peak(g, w, 150, 58, 34, 44, 60, V("--b4"), PALE, 40);
  _peak(g, w, CX, BASE, TOP, HL, HR, V("--b6"), PALE, 28);

  /* groomed piste: a run that widens as it comes down the right face.
     It starts below the snow line, or it would merge with the cap. */
  for (y = 30; y < BASE; y++) {
    var t = (y - 30) / (BASE - 30);
    var pc = CX + 12 + Math.round(t * 54 + Math.sin(y * 0.14) * 4);
    var half = 3 + Math.round(t * 7);
    for (x = pc - half; x <= pc + half; x++) {
      if (x < 0 || x >= w || y < _peakY(CX, BASE, TOP, HL, HR, x)) continue;
      g.fillStyle = PALE;
      g.fillRect(x, y, 1, 1);
    }
    /* slalom gates, every ninth row */
    if (y % 9 === 4) {
      g.fillStyle = V("--o4");
      g.fillRect(pc - half, y - 2, 1, 3);
      g.fillRect(pc + half, y - 2, 1, 3);
    }
  }

  /* chairlift: one cable from the summit to a base station on the right */
  var x0 = CX + 4, y0 = 14, x1 = 232, y1 = 56;
  function cableY(px) { return Math.round(y0 + (y1 - y0) * (px - x0) / (x1 - x0)); }
  g.fillStyle = _deep();
  for (x = x0; x <= x1; x++) g.fillRect(x, cableY(x), 1, 1);
  for (i = 0; i < 3; i++) {
    x = x0 + Math.round((x1 - x0) * (i + 0.7) / 3.4);
    y = cableY(x);
    var ground = Math.min(BASE, _peakY(CX, BASE, TOP, HL, HR, x));
    g.fillStyle = _deep();
    g.fillRect(x, y, 2, ground - y);
    g.fillRect(x - 3, y - 2, 8, 2);
  }
  for (i = 0; i < 4; i++) {
    x = x0 + 14 + Math.round((x1 - x0 - 20) * i / 4);
    y = cableY(x);
    g.fillStyle = V("--o4");
    g.fillRect(x, y + 1, 1, 3);
    g.fillRect(x - 2, y + 4, 5, 3);
  }

  g.fillStyle = V("--g5");
  g.fillRect(0, 66, w, h - 66);
  for (i = 6; i < w; i += 13) _tree(g, i, 66, 5 + ((i * 3) % 4), V("--g5"));
}

var SCENES = {
  "desert-dunes":   desertDunes,
  "desert-mesa":    desertMesa,
  "desert-saguaro": desertSaguaro,
  "ski-lift":       skiLift
};

function drawScene(cv, name) {
  (SCENES[name] || SCENES["desert-dunes"])(cv);
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
     <canvas data-icon="gear" data-scale="4">   <canvas data-strip="warm">
     <canvas data-scene="ski-peaks">            <canvas data-meter="86"> */
function paintAll() {
  var RAMPS = { warm: warmRamp, green: greenRamp, blue: blueRamp };
  var i, list;
  list = document.querySelectorAll("[data-scene]");
  for (i = 0; i < list.length; i++) drawScene(list[i], list[i].getAttribute("data-scene"));
  list = document.querySelectorAll("[data-icon],[data-sprite]");
  for (i = 0; i < list.length; i++) {
    drawSprite(list[i], list[i].getAttribute("data-icon") || list[i].getAttribute("data-sprite"),
               +(list[i].getAttribute("data-scale") || 4));
  }
  list = document.querySelectorAll("[data-strip]");
  for (i = 0; i < list.length; i++) drawWash(list[i], 160, 8, (RAMPS[list[i].getAttribute("data-strip")] || blueRamp)(), "h");
  list = document.querySelectorAll("[data-meter]");
  for (i = 0; i < list.length; i++) drawMeter(list[i], +list[i].getAttribute("data-meter"), blueRamp());
}
