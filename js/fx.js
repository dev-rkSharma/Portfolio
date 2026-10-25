/* ==========================================================================
   Portfolio — modern effects layer
   Pairs with css/fx.css. Pure progressive enhancement, no dependencies:
   with JS off, or under prefers-reduced-motion, the page is simply static.
   Pointer-driven effects (glow, ring, tilt, magnetic, spotlight) only run on
   devices with a fine, hovering pointer — never on touch.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var raf = window.requestAnimationFrame;

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  /* ---------- 0. Dot rasterizer (shared) ------------------------------- */
  /* Used by the journey panel morph and the pixel-hover on boxes. */
  function isClear(c) {
    return !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
  }

  function lift(c) {
    var m = c.match(/\d+(\.\d+)?/g);
    if (!m) return c;
    var k = 0.35;
    return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(+m[i] + (255 - m[i]) * k); }).join(",") + ")";
  }

  function boxPath(o, x, y, w, h, r) {
    o.beginPath();
    if (o.roundRect) o.roundRect(x, y, w, h, r);
    else o.rect(x, y, w, h);
  }

  // Draw `root` the way it looks (frame, fills, chips, gradients, text,
  // images) into an offscreen canvas, then sample it into dots positioned
  // relative to (ox, oy) in viewport space.
  //   opts.maxDots  cap for "ink" dots (sampling step grows to fit)
  //   opts.media    Map(element -> decoded Image) for large inline SVGs
  function rasterizeBox(root, ox, oy, opts) {
    opts = opts || {};
    var maxDots = opts.maxDots || 4000;
    var sb = { left: ox, top: oy };
    var cb = root.getBoundingClientRect();
    var w = Math.ceil(cb.width), h = Math.ceil(cb.height);
    if (!w || !h) return [];

    var off = document.createElement("canvas");
    off.width = w; off.height = h;
    var o = off.getContext("2d");

    // boxes: the frame + dividers, chips, tags, badges, buttons, bars
    [root].concat($all("*", root)).forEach(function (n) {
      if (n.closest("svg") || n.tagName === "CANVAS" || n.tagName === "IMG") return;
      var r = n.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var cs = getComputedStyle(n);
      var x = r.left - cb.left, y = r.top - cb.top;
      var rad = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.height / 2);
      var clipText = (cs.backgroundClip || cs.webkitBackgroundClip) === "text";
      if (clipText) {
        // gradient *text* — painted in the text pass below, not as a block
      } else if (cs.backgroundImage.indexOf("gradient") !== -1) {
        var g = o.createLinearGradient(x, 0, x + r.width, 0);
        g.addColorStop(0, "#C778DD"); g.addColorStop(0.55, "#61AFEF"); g.addColorStop(1, "#56B6C2");
        o.fillStyle = g; boxPath(o, x, y, r.width, r.height, rad); o.fill();
      } else if (n !== root && !isClear(cs.backgroundColor)) {
        o.fillStyle = cs.backgroundColor; boxPath(o, x, y, r.width, r.height, rad); o.fill();
      }
      // borders: a full frame as one rounded outline, otherwise side by side
      // (the header/pager dividers are single-side borders)
      var sides = ["Top", "Right", "Bottom", "Left"].filter(function (side) {
        return (parseFloat(cs["border" + side + "Width"]) || 0) > 0 &&
               cs["border" + side + "Style"] !== "none" && !isClear(cs["border" + side + "Color"]);
      });
      if (!sides.length) return;
      o.lineWidth = 1.5;
      if (sides.length === 4) {
        o.strokeStyle = lift(cs.borderTopColor);
        boxPath(o, x + 0.75, y + 0.75, r.width - 1.5, r.height - 1.5, rad); o.stroke();
      } else {
        sides.forEach(function (side) {
          o.strokeStyle = lift(cs["border" + side + "Color"]);
          o.beginPath();
          if (side === "Top")    { o.moveTo(x, y + 0.75); o.lineTo(x + r.width, y + 0.75); }
          if (side === "Bottom") { o.moveTo(x, y + r.height - 0.75); o.lineTo(x + r.width, y + r.height - 0.75); }
          if (side === "Left")   { o.moveTo(x + 0.75, y); o.lineTo(x + 0.75, y + r.height); }
          if (side === "Right")  { o.moveTo(x + r.width - 0.75, y); o.lineTo(x + r.width - 0.75, y + r.height); }
          o.stroke();
        });
      }
    });

    // images: <img> directly; large inline SVGs from the pre-decoded map
    $all("img, svg", root).forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (opts.noImages) return;
      var src = n.tagName === "IMG" ? (n.complete ? n : null) : (opts.media && opts.media.get(n));
      if (src) {
        try { o.drawImage(src, r.left - cb.left, r.top - cb.top, r.width, r.height); } catch (e) { /* tainted/broken: skip */ }
      }
    });

    // small icons: redraw their real shapes (paths, circles, rects) so tech
    // logos and line icons survive as recognisable dot glyphs
    $all("svg", root).forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (!r.width || r.width > 48 || (opts.media && opts.media.get(n))) return;
      var vb = (n.getAttribute("viewBox") || "0 0 24 24").split(/[\s,]+/).map(Number);
      var k = r.width / (vb[2] || 24);
      o.save();
      o.translate(r.left - cb.left - vb[0] * k, r.top - cb.top - vb[1] * k);
      o.scale(k, k);
      $all("path, circle, rect", n).forEach(function (shape) {
        var cs = getComputedStyle(shape), path;
        if (shape.tagName === "path") {
          path = new Path2D(shape.getAttribute("d") || "");
        } else {
          path = new Path2D();
          var a = function (name) { return parseFloat(shape.getAttribute(name)) || 0; };
          if (shape.tagName === "circle") path.arc(a("cx"), a("cy"), a("r"), 0, Math.PI * 2);
          else path.rect(a("x"), a("y"), a("width"), a("height"));
        }
        if (cs.fill && cs.fill !== "none" && !isClear(cs.fill)) { o.fillStyle = cs.fill; o.fill(path); }
        if (cs.stroke && cs.stroke !== "none" && !isClear(cs.stroke)) {
          o.strokeStyle = cs.stroke;
          o.lineWidth = Math.max(parseFloat(cs.strokeWidth) || 1, 1.6);
          o.lineCap = "round"; o.lineJoin = "round";
          o.stroke(path);
        }
      });
      o.restore();
    });

    // bullets (they're ::before pseudo-elements, so not in the DOM)
    $all(".milestone__list li, .entry__list li", root).forEach(function (n) {
      var r = n.getBoundingClientRect();
      o.fillStyle = "#C778DD";
      o.beginPath(); o.arc(r.left - cb.left + 3, r.top - cb.top + parseFloat(getComputedStyle(n).fontSize) * 0.85, 3, 0, Math.PI * 2); o.fill();
    });

    // text, word by word at its real layout position
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var range = document.createRange();
    var tn;
    while ((tn = walker.nextNode())) {
      if (!tn.textContent.trim() || !tn.parentNode || tn.parentNode.closest("svg")) continue;
      var cs = getComputedStyle(tn.parentNode);
      o.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
      var gradText = (cs.backgroundClip || cs.webkitBackgroundClip) === "text";
      if (gradText) {
        var pr = tn.parentNode.getBoundingClientRect();
        var tg = o.createLinearGradient(pr.left - cb.left, 0, pr.right - cb.left, 0);
        tg.addColorStop(0, "#C778DD"); tg.addColorStop(0.55, "#61AFEF"); tg.addColorStop(1, "#56B6C2");
        o.fillStyle = tg;
      } else {
        o.fillStyle = cs.color;
      }
      o.textBaseline = "middle";
      if ("letterSpacing" in o) o.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      var re = /\S+/g, m;
      while ((m = re.exec(tn.textContent))) {
        range.setStart(tn, m.index);
        range.setEnd(tn, m.index + m[0].length);
        var rects = range.getClientRects();
        if (!rects.length) continue;
        var word = cs.textTransform === "uppercase" ? m[0].toUpperCase() : m[0];
        o.fillText(word, rects[0].left - cb.left, rects[0].top - cb.top + rects[0].height / 2);
      }
    }

    var data;
    try {
      data = o.getImageData(0, 0, w, h).data;
    } catch (e) {
      // a drawn image tainted the canvas (e.g. file:// preview) — redo without images
      if (opts.noImages) return [];
      return rasterizeBox(root, ox, oy, Object.assign({}, opts, { noImages: true }));
    }
    var step = 3, pts;
    do {
      pts = [];
      for (var y = 0; y < h; y += step) {
        var sy = cb.top + y;
        for (var x = 0; x < w; x += step) {
          var k = (y * w + x) * 4;
          if (data[k + 3] < 110) continue;
          pts.push({ x: cb.left - sb.left + x, y: sy - sb.top, r: data[k], g: data[k + 1], b: data[k + 2] });
        }
      }
      step += 1;
    } while (pts.length > maxDots && step < 8);

    // sparse dotted texture for the box body, so the box itself (not just
    // its ink) dissolves and re-forms. opts.texture === false skips it (text).
    var rad0 = parseFloat(getComputedStyle(root).borderTopLeftRadius) || 0;
    for (var by = 6; opts.texture !== false && by < h - 6; by += 11) {
      for (var bx = 6; bx < w - 6; bx += 11) {
        var inCorner = (bx < rad0 || bx > w - rad0) && (by < rad0 || by > h - rad0);
        if (inCorner) continue;
        pts.push({ x: cb.left - sb.left + bx + (Math.random() - 0.5) * 3,
                   y: cb.top - sb.top + by + (Math.random() - 0.5) * 3,
                   r: 72, g: 78, b: 92, faint: true });
      }
    }
    return pts;
  }

  /* ---------- 1. Scroll progress bar ----------------------------------- */
  /* Not motion for its own sake — it's a position indicator, so it stays on
     under reduced motion (it only moves when the user scrolls). */
  var bar = el("div", "fx-progress");
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var progressTicking = false;
  function syncProgress() {
    progressTicking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    bar.style.setProperty("--p", p.toFixed(4));
  }
  window.addEventListener("scroll", function () {
    if (progressTicking) return;
    progressTicking = true;
    raf(syncProgress);
  }, { passive: true });
  window.addEventListener("resize", syncProgress);
  syncProgress();

  /* ---------- 1b. Journey: 3D network + pixel-swap detail panel ---------- */
  /* The <ol class="roadmap"> in the markup is the source of truth and the
     no-JS / screen-reader version. When JS runs it's visually hidden (still
     read by assistive tech) and replaced on screen by a pinned "flight":

       .j3d          tall scroll track, one screen-ish per stop
       .j3d__stage   sticky viewport: canvas network + detail panel

     Scroll position along .j3d picks the stop. The canvas draws a 3D
     constellation (plain 2D-canvas perspective projection, no WebGL) with the
     stops as bright nodes on a helix; the camera turns so the current stop
     faces front. The panel swaps stops with a pixel dissolve/build. Under
     reduced motion the network renders static and the panel swaps instantly. */
  var roadmap = document.querySelector(".roadmap");

  if (roadmap && document.createElement("canvas").getContext) {
    var stopEls = $all(".milestone", roadmap);
    var N = stopEls.length;
    var STOPS = stopEls.map(function (m, i) {
      var kind = (m.className.match(/milestone--(\w+)/) || [])[1] || "work";
      return {
        i: i,
        kind: kind,
        now: m.classList.contains("is-now"),
        year: m.querySelector(".milestone__year").textContent,
        title: m.getAttribute("data-label") || "",
        html: m.querySelector(".milestone__card").innerHTML
      };
    });

    /* --- DOM -------------------------------------------------------- */
    var track = el("div", "j3d");
    track.setAttribute("aria-hidden", "true");
    track.style.setProperty("--stops", String(N));
    track.innerHTML =
      '<div class="j3d__stage">' +
      '  <canvas class="j3d__net"></canvas>' +
      '  <p class="j3d__year"></p>' +
      '  <p class="j3d__hint">scroll to fly &darr;</p>' +
      '  <div class="j3d__panel">' +
      '    <div class="j3d__top"><span class="j3d__count"></span><span class="j3d__bar"><i></i></span></div>' +
      '    <div class="j3d__body"><div class="j3d__content"></div></div>' +
      '    <ol class="j3d__pager">' + STOPS.map(function (s) {
             return '<li><button type="button" tabindex="-1" data-go="' + s.i + '" class="is-' + s.kind + '">' + s.year + "</button></li>";
           }).join("") + "</ol>" +
      "  </div>" +
      '  <canvas class="j3d__fx"></canvas>' +
      "</div>";
    roadmap.parentNode.insertBefore(track, roadmap.nextSibling);
    roadmap.classList.add("roadmap--sr");

    var stage = track.querySelector(".j3d__stage");
    var net = track.querySelector(".j3d__net");
    var ctx = net.getContext("2d");
    var yearEl = track.querySelector(".j3d__year");
    var countEl = track.querySelector(".j3d__count");
    var barEl = track.querySelector(".j3d__bar i");
    var content = track.querySelector(".j3d__content");
    var panel = track.querySelector(".j3d__panel");
    var pagerBtns = $all(".j3d__pager button", track);

    /* --- scroll -> stop position ------------------------------------- */
    var pos = 0;          // continuous stop position, 0 .. N-1
    var current = -1;     // stop shown in the panel

    function trackRange() {
      var top = track.getBoundingClientRect().top + window.scrollY;
      var span = track.offsetHeight - stage.offsetHeight;
      return { top: top, span: Math.max(span, 1) };
    }
    function readScroll() {
      var r = trackRange();
      var p = Math.min(Math.max((window.scrollY - r.top) / r.span, 0), 1);
      pos = p * (N - 1);
      barEl.style.transform = "scaleX(" + p.toFixed(4) + ")";
      var idx = Math.round(pos);
      if (idx !== current) showStop(idx);
    }
    function scrollToStop(i, smooth) {
      var r = trackRange();
      window.scrollTo({ top: r.top + (i / (N - 1)) * r.span + 2, behavior: smooth === false ? "auto" : "smooth" });
    }

    /* --- detail panel + particle morph -------------------------------- */
    /* Changing stop morphs the whole panel through dots:
         1. rasterize the panel as it is on screen (frame, header, bar,
            text, chips, badges, pager) and sample it into small dots
         2. hide the real panel; the dots burst outward and swirl
         3. swap in the next stop, rasterize it the same way
         4. the dots fly along curved paths into the new panel's shape,
            recolouring on the way, then the real panel fades back in
       The dot canvas (.j3d__fx) covers the whole stage, so the burst can
       spill out over the network. If the stop changes mid-morph, the latest
       stop wins at the next swap point. */
    var DOT = 2;              // dot size, CSS px
    var BURST_MS = 520, FORM_MS = 900;
    var MAX_DOTS = 4200;      // ink dots; the box texture adds a sparse layer on top
    var TINTS = [[199, 120, 221], [97, 175, 239], [86, 182, 194], [255, 255, 255]];
    var morphing = false, shown = -1;
    var dots = [];

    var fx = track.querySelector(".j3d__fx");
    var fctx = fx.getContext("2d");

    function fillPanel(i) {
      var s = STOPS[i];
      shown = i;
      content.setAttribute("data-kind", s.kind);
      content.classList.toggle("is-now", s.now);
      content.innerHTML = s.html;
      // the panel is aria-hidden; keep its links out of the tab order too
      $all("a, button", content).forEach(function (a) { a.setAttribute("tabindex", "-1"); });
      countEl.innerHTML = "Stop <b>" + String(i + 1).padStart(2, "0") + "</b> / " + String(N).padStart(2, "0");
      yearEl.textContent = s.year;
      pagerBtns.forEach(function (b, j) {
        b.classList.toggle("is-here", j === i);
        b.classList.toggle("is-done", j < i);
      });
    }

    function sizeFx() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      fx.width = Math.round(stage.offsetWidth * dpr);
      fx.height = Math.round(stage.offsetHeight * dpr);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rasterize() {
      var sb = stage.getBoundingClientRect();
      return rasterizeBox(panel, sb.left, sb.top, { maxDots: MAX_DOTS });
    }

    function drawDots() {
      fctx.clearRect(0, 0, stage.offsetWidth, stage.offsetHeight);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (d.a <= 0.01) continue;
        fctx.fillStyle = "rgba(" + (d.r | 0) + "," + (d.g | 0) + "," + (d.b | 0) + "," + d.a.toFixed(3) + ")";
        fctx.fillRect(d.x - DOT / 2, d.y - DOT / 2, DOT, DOT);
      }
    }

    function animate(ms, step, done) {
      var t0 = performance.now();
      (function frame(now) {
        // rAF timestamps can precede performance.now() by a frame — clamp at 0
        var t = Math.min(Math.max((now - t0) / ms, 0), 1);
        step(t);
        drawDots();
        if (t < 1) raf(frame); else done();
      })(t0);
    }

    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    // 2. the current panel bursts into a drifting cloud
    function burst(done) {
      var cb = panel.getBoundingClientRect(), sb = stage.getBoundingClientRect();
      var cx = cb.left - sb.left + cb.width / 2, cy = cb.top - sb.top + cb.height / 2;
      dots.forEach(function (d) {
        var ang = Math.atan2(d.y - cy, d.x - cx) + (Math.random() - 0.5) * 1.8;
        var dist = 30 + Math.random() * 170;
        d.ox = d.x; d.oy = d.y;
        d.sx = d.x + Math.cos(ang) * dist;
        d.sy = d.y + Math.sin(ang) * dist - Math.random() * 30;
        d.px = -Math.sin(ang); d.py = Math.cos(ang);              // swirl direction
        d.sw = (Math.random() - 0.5) * 90;
        d.del = Math.random() * 0.35;
        // tint toward the accent palette while airborne
        var tint = TINTS[(Math.random() * TINTS.length) | 0];
        d.or = d.r; d.og = d.g; d.ob = d.b;
        d.tr = tint[0]; d.tg = tint[1]; d.tb = tint[2];
      });
      animate(BURST_MS, function (t) {
        dots.forEach(function (d) {
          var lt = clamp01((t - d.del) / (1 - d.del)), e = easeOut(lt), s = Math.sin(lt * Math.PI) * d.sw;
          d.x = d.ox + (d.sx - d.ox) * e + d.px * s;
          d.y = d.oy + (d.sy - d.oy) * e + d.py * s;
          d.a = 1 - 0.3 * e;
          d.r = d.or + (d.tr - d.or) * e * 0.7;
          d.g = d.og + (d.tg - d.og) * e * 0.7;
          d.b = d.ob + (d.tb - d.ob) * e * 0.7;
        });
      }, done);
    }

    // 4. the cloud flies into the shape of the next panel
    function form(targets, done) {
      for (var s = dots.length - 1; s > 0; s--) {                 // shuffle: any dot can land anywhere
        var j = (Math.random() * (s + 1)) | 0, tmp = dots[s]; dots[s] = dots[j]; dots[j] = tmp;
      }
      var next = [];
      targets.forEach(function (tg, i) {
        var d = dots[i];
        if (!d) {                                                  // more dots needed: spawn from the cloud
          var src = dots.length ? dots[(Math.random() * dots.length) | 0] : tg;
          d = { x: src.x + (Math.random() - 0.5) * 60, y: src.y + (Math.random() - 0.5) * 60,
                r: src.r, g: src.g, b: src.b, a: 0 };
        }
        d.fx = d.x; d.fy = d.y; d.fa = d.a;
        d.fr = d.r; d.fg = d.g; d.fb = d.b;
        d.tx = tg.x; d.ty = tg.y; d.tr = tg.r; d.tg = tg.g; d.tb = tg.b;
        var mx = (d.fx + d.tx) / 2, my = (d.fy + d.ty) / 2;
        var dx = d.tx - d.fx, dy = d.ty - d.fy, len = Math.sqrt(dx * dx + dy * dy) || 1;
        var bend = (Math.random() - 0.5) * Math.min(len, 160);
        d.cx = mx - (dy / len) * bend; d.cy = my + (dx / len) * bend;  // curved flight
        d.del = Math.random() * 0.42;
        d.dead = false;
        next.push(d);
      });
      dots.slice(targets.length).forEach(function (d) {            // leftovers drift off and fade
        d.dead = true; d.fx = d.x; d.fy = d.y; d.fa = d.a;
        d.tx = d.x + (Math.random() - 0.5) * 120; d.ty = d.y + (Math.random() - 0.5) * 120;
        d.del = Math.random() * 0.3;
        next.push(d);
      });
      dots = next;

      animate(FORM_MS, function (t) {
        dots.forEach(function (d) {
          var lt = clamp01((t - d.del) / (1 - d.del)), e = easeInOut(lt), u = 1 - e;
          if (d.dead) {
            d.x = d.fx + (d.tx - d.fx) * e; d.y = d.fy + (d.ty - d.fy) * e; d.a = d.fa * u;
            return;
          }
          d.x = u * u * d.fx + 2 * u * e * d.cx + e * e * d.tx;
          d.y = u * u * d.fy + 2 * u * e * d.cy + e * e * d.ty;
          d.r = d.fr + (d.tr - d.fr) * e; d.g = d.fg + (d.tg - d.fg) * e; d.b = d.fb + (d.tb - d.fb) * e;
          d.a = d.fa + (1 - d.fa) * e;
        });
      }, done);
    }

    function morphTo() {
      morphing = true;
      sizeFx();
      fx.style.transition = "none";
      fx.style.opacity = "1";
      dots = rasterize().map(function (p) { p.a = 1; return p; });
      drawDots();                                   // dots on top first, then hide the panel — no flash
      panel.style.transition = "none";
      panel.style.opacity = "0";

      burst(function () {
        fillPanel(current);                         // latest stop wins
        form(rasterize(), function () {
          panel.style.transition = "opacity 260ms ease";
          panel.style.opacity = "1";
          fx.style.transition = "opacity 260ms ease";
          fx.style.opacity = "0";
          window.setTimeout(function () {
            dots = [];
            fctx.clearRect(0, 0, stage.offsetWidth, stage.offsetHeight);
            morphing = false;
            if (shown !== current) morphTo();
          }, 270);
        });
      });
    }

    function showStop(i) {
      current = i;
      if (shown === -1 || reduceMotion) { fillPanel(i); return; }
      if (!morphing && shown !== i) morphTo();
    }

    pagerBtns.forEach(function (b) {
      b.addEventListener("click", function () { scrollToStop(Number(b.getAttribute("data-go"))); });
    });

    /* --- 3D network --------------------------------------------------- */
    var seed = 20210801;
    function rand() {               // mulberry32 — same constellation every load
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    var HELIX_R = 170, HELIX_STEP = 1.05, HELIX_DY = 90;
    function stopPoint(s) {         // s may be fractional
      var th = s * HELIX_STEP;
      return { x: HELIX_R * Math.cos(th), y: (s - (N - 1) / 2) * HELIX_DY, z: HELIX_R * Math.sin(th) };
    }
    var stopPts = STOPS.map(function (s) { return stopPoint(s.i); });

    var amb = [];
    var yHalf = (N - 1) / 2 * HELIX_DY + 170;
    for (var a = 0; a < 150; a++) {
      var p;
      if (a < 70) {                 // cluster around the journey helix
        var s = rand() * (N - 1), base = stopPoint(s), ang = rand() * Math.PI * 2, off = 40 + rand() * 110;
        p = { x: base.x + Math.cos(ang) * off, y: base.y + (rand() - 0.5) * 120, z: base.z + Math.sin(ang) * off };
      } else {                      // looser outer cloud
        var u = rand() * Math.PI * 2, rr = 120 + rand() * 230;
        p = { x: Math.cos(u) * rr, y: (rand() * 2 - 1) * yHalf, z: Math.sin(u) * rr };
      }
      p.tw = rand() * Math.PI * 2;  // twinkle phase
      amb.push(p);
    }
    // precompute the net: ambient pairs, and each stop's nearest neighbours
    var LINK = 105, links = [], stopLinks = [];
    for (var i1 = 0; i1 < amb.length; i1++) {
      for (var j1 = i1 + 1; j1 < amb.length; j1++) {
        var dx = amb[i1].x - amb[j1].x, dy = amb[i1].y - amb[j1].y, dz = amb[i1].z - amb[j1].z;
        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < LINK) links.push([i1, j1, 1 - d / LINK]);
      }
    }
    stopPts.forEach(function (sp, si) {
      amb.map(function (p, k) {
        var dx = p.x - sp.x, dy = p.y - sp.y, dz = p.z - sp.z;
        return { k: k, d: dx * dx + dy * dy + dz * dz };
      }).sort(function (x, y) { return x.d - y.d; }).slice(0, 4).forEach(function (n) { stopLinks.push([si, n.k]); });
    });

    var W = 0, H = 0, DPR = 1;
    function sizeNet() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = net.offsetWidth; H = net.offsetHeight;
      net.width = Math.round(W * DPR); net.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    var yaw = -Math.PI / 2, pitch = 0.32, camY = stopPts[0].y;
    var mx = 0, my = 0, smx = 0, smy = 0;
    var CAM_D = 760;

    function project(p, cy, cs, sy, sp, cx0, cy0, f) {
      var x = p.x * cy + p.z * sy;
      var z = -p.x * sy + p.z * cy;
      var y = p.y - camY;
      var y2 = y * cs - z * sp;
      var z2 = y * sp + z * cs;
      var k = f / (CAM_D - z2);
      return { x: cx0 + x * k, y: cy0 + y2 * k, k: k, z: z2 };
    }

    function depthAlpha(z) { return Math.min(Math.max((z + 420) / 760, 0.08), 1); }

    var screenStops = [];
    function render(time) {
      var mobile = W < 700;
      var targetYaw = pos * HELIX_STEP - Math.PI / 2 + smx * 0.35 + (reduceMotion ? 0 : Math.sin(time * 0.00025) * 0.08);
      yaw += (targetYaw - yaw) * (reduceMotion ? 1 : 0.07);
      pitch += ((0.3 + smy * 0.2) - pitch) * 0.07;
      var targetCamY = stopPoint(pos).y;
      camY += (targetCamY - camY) * (reduceMotion ? 1 : 0.08);
      smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;

      var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var cx0 = mobile ? W / 2 : W * 0.29, cy0 = H * (mobile ? 0.3 : 0.52);
      var f = Math.min(W * (mobile ? 1.1 : 0.62), H * (mobile ? 0.62 : 1)) * 1.05;

      ctx.clearRect(0, 0, W, H);
      var P = amb.map(function (p) { return project(p, cyw, cp, syw, sp, cx0, cy0, f); });
      var S = stopPts.map(function (p) { return project(p, cyw, cp, syw, sp, cx0, cy0, f); });
      screenStops = S;

      // ambient net
      ctx.lineWidth = 1;
      links.forEach(function (l) {
        var a = P[l[0]], b = P[l[1]];
        var al = l[2] * Math.min(depthAlpha(a.z), depthAlpha(b.z)) * 0.32;
        if (al < 0.02) return;
        ctx.strokeStyle = "rgba(171,178,191," + al.toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      // stops plugged into the net
      stopLinks.forEach(function (l) {
        var a = S[l[0]], b = P[l[1]];
        var lit = l[0] <= pos + 0.01;
        var al = depthAlpha(a.z) * (lit ? 0.45 : 0.18);
        ctx.strokeStyle = (lit ? "rgba(199,120,221," : "rgba(171,178,191,") + al.toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });

      // journey path: travelled = gradient + glow, ahead = dashed
      var STEPS = 14;
      for (var seg = 0; seg < N - 1; seg++) {
        for (var q = 0; q < STEPS; q++) {
          var s0 = seg + q / STEPS, s1 = seg + (q + 1) / STEPS;
          var A = project(stopPoint(s0), cyw, cp, syw, sp, cx0, cy0, f);
          var B = project(stopPoint(s1), cyw, cp, syw, sp, cx0, cy0, f);
          var done = s1 <= pos + 0.001;
          var dAl = depthAlpha((A.z + B.z) / 2);
          if (done) {
            var mix = s0 / (N - 1);
            var col = "rgba(" + Math.round(199 - 102 * mix) + "," + Math.round(120 + 55 * mix) + "," + Math.round(221 + 18 * mix) + ",";
            ctx.setLineDash([]);
            ctx.lineWidth = 7 * A.k; ctx.strokeStyle = col + (0.12 * dAl).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
            ctx.lineWidth = 2.4 * A.k; ctx.strokeStyle = col + (0.95 * dAl).toFixed(3) + ")";
          } else {
            ctx.setLineDash([3, 6]);
            ctx.lineWidth = 1.4 * A.k; ctx.strokeStyle = "rgba(171,178,191," + (0.4 * dAl).toFixed(3) + ")";
          }
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      // data packets running along the travelled path
      if (!reduceMotion && pos > 0.05) {
        for (var pk = 0; pk < 3; pk++) {
          var ps = ((time * 0.00035 + pk / 3) % 1) * pos;
          var pp = project(stopPoint(ps), cyw, cp, syw, sp, cx0, cy0, f);
          ctx.fillStyle = "rgba(255,255,255," + (0.9 * depthAlpha(pp.z)).toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(pp.x, pp.y, 2.2 * pp.k, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ambient dots
      P.forEach(function (p, k) {
        var tw = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(time * 0.002 + amb[k].tw);
        ctx.fillStyle = "rgba(205,210,220," + (depthAlpha(p.z) * 0.8 * tw).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.6 * p.k, 0.6), 0, Math.PI * 2); ctx.fill();
      });

      // stop nodes, back to front
      var order = S.map(function (p, i) { return i; }).sort(function (a, b) { return S[a].z - S[b].z; });
      var active = Math.round(pos);
      order.forEach(function (i) {
        var p = S[i], st = STOPS[i];
        var passed = i <= pos + 0.01, isActive = i === active;
        var hue = st.kind === "edu" ? "97,175,239" : st.kind === "next" ? "152,195,121" : "199,120,221";
        var r = (isActive ? 11 : 7) * p.k;
        var al = depthAlpha(p.z);

        if (isActive) {
          var halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
          halo.addColorStop(0, "rgba(" + hue + ",0.45)");
          halo.addColorStop(1, "rgba(" + hue + ",0)");
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx.fill();
          if (!reduceMotion) {
            var ping = (time % 1800) / 1800;
            ctx.strokeStyle = "rgba(" + hue + "," + (0.8 * (1 - ping)).toFixed(3) + ")";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, r * (1.2 + ping * 2.2), 0, Math.PI * 2); ctx.stroke();
          }
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(" + hue + "," + al.toFixed(3) + ")";
        ctx.fillStyle = passed ? "rgba(" + hue + "," + al.toFixed(3) + ")" : "rgba(30,33,39," + al.toFixed(3) + ")";
        if (st.kind === "next") ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        if (passed) {
          ctx.fillStyle = "rgba(255,255,255," + (0.9 * al).toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.38, 0, Math.PI * 2); ctx.fill();
        }

        // labels: year on every stop, title on the active one
        ctx.textBaseline = "middle";
        ctx.font = "600 " + Math.round((isActive ? 13 : 11) * Math.max(p.k, 0.7)) + "px 'IBM Plex Mono', monospace";
        ctx.fillStyle = "rgba(255,255,255," + (isActive ? 1 : 0.55 * al).toFixed(3) + ")";
        ctx.fillText(st.year, p.x + r + 8, p.y - (isActive ? 8 : 0));
        if (isActive && !mobile) {
          ctx.font = "500 12px 'IBM Plex Mono', monospace";
          ctx.fillStyle = "rgba(171,178,191,0.9)";
          var t = st.title.length > 24 ? st.title.slice(0, 23) + "…" : st.title;
          ctx.fillText(t, p.x + r + 8, p.y + 10);
        }
      });
    }

    var visible = false, loopOn = false;
    function loop(time) {
      if (!visible) { loopOn = false; return; }
      render(time);
      if (reduceMotion) { loopOn = false; return; }
      raf(loop);
    }
    function kick() {
      if (loopOn || !visible) return;
      loopOn = true;
      raf(loop);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        kick();
      }).observe(stage);
    } else {
      visible = true;
    }

    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    });
    stage.addEventListener("pointerleave", function () { mx = 0; my = 0; });
    // click a stop node to fly to it
    net.addEventListener("click", function (e) {
      var r = net.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      var best = -1, bd = 26 * 26;
      screenStops.forEach(function (p, i) {
        var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
        if (d < bd) { bd = d; best = i; }
      });
      if (best >= 0) scrollToStop(best);
    });

    var scrollTick = false;
    window.addEventListener("scroll", function () {
      if (scrollTick) return;
      scrollTick = true;
      raf(function () { scrollTick = false; readScroll(); if (reduceMotion) kick(); });
    }, { passive: true });

    function relayout() { sizeNet(); readScroll(); if (reduceMotion) kick(); }
    if ("ResizeObserver" in window) new ResizeObserver(function () { raf(relayout); }).observe(stage);
    else window.addEventListener("resize", relayout);
    relayout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(kick);

    /* --- walkthrough: auto-fly stop to stop -------------------------- */
    var tourBtn = document.querySelector(".trip__tour");
    if (tourBtn) {
      tourBtn.hidden = false;
      var TOUR_DWELL = reduceMotion ? 3200 : 2900;
      var touring = false, tourTimer = null, hud = null;

      var buildHud = function () {
        hud = el("div", "tour-hud");
        hud.setAttribute("role", "status");
        hud.setAttribute("aria-live", "polite");
        hud.innerHTML =
          '<span class="tour-hud__label"></span>' +
          '<span class="tour-hud__dots" aria-hidden="true">' + STOPS.map(function () { return "<i></i>"; }).join("") + "</span>" +
          '<button class="tour-hud__stop" type="button" aria-label="End tour">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg></button>';
        hud.querySelector(".tour-hud__stop").addEventListener("click", function () { endTour(); });
        document.body.appendChild(hud);
      };
      var hudAt = function (i) {
        hud.querySelector(".tour-hud__label").innerHTML = "<b>Stop " + (i + 1) + "/" + N + "</b> &middot; " + STOPS[i].title;
        Array.prototype.forEach.call(hud.querySelectorAll(".tour-hud__dots i"), function (dot, j) {
          dot.classList.toggle("is-on", j < i);
          dot.classList.toggle("is-here", j === i);
        });
      };
      var goTo = function (i) {
        if (!touring) return;
        if (i >= N) {
          hud.querySelector(".tour-hud__label").innerHTML = "<b>Trip complete</b> &middot; thanks for riding along";
          tourTimer = window.setTimeout(endTour, 2200);
          return;
        }
        scrollToStop(i, !reduceMotion);
        hudAt(i);
        tourTimer = window.setTimeout(function () { goTo(i + 1); }, TOUR_DWELL);
      };
      var onTourKey = function (e) {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End", "Escape"].indexOf(e.key) !== -1) endTour();
      };
      var endTour = function () {
        if (!touring) return;
        touring = false;
        window.clearTimeout(tourTimer);
        document.body.classList.remove("is-touring");
        tourBtn.setAttribute("aria-pressed", "false");
        if (hud) hud.classList.remove("is-open");
        window.removeEventListener("wheel", endTour);
        window.removeEventListener("touchstart", endTour);
        window.removeEventListener("keydown", onTourKey);
      };
      var startTour = function () {
        if (!hud) buildHud();
        touring = true;
        document.body.classList.add("is-touring");
        tourBtn.setAttribute("aria-pressed", "true");
        hud.classList.add("is-open");
        goTo(0);
        // any manual scroll intent hands control back to the visitor
        window.addEventListener("wheel", endTour, { passive: true, once: true });
        window.addEventListener("touchstart", endTour, { passive: true, once: true });
        window.addEventListener("keydown", onTourKey);
      };

      tourBtn.setAttribute("aria-pressed", "false");
      tourBtn.addEventListener("click", function () { touring ? endTour() : startTour(); });
    }
  }

  if (reduceMotion) return;

  /* ---------- 2. Sequential, weighted letters with sand impacts ---------- */
  (function () {
    var title=document.querySelector('.hero__title');
    if(!title||!Element.prototype.animate)return;
    title.dataset.introState='pending';
    var original=title.innerHTML,animations=[],done=false,started=false,startScroll=scrollY;
    var preference=matchMedia('(prefers-reduced-motion: reduce)');
    var canvas=null,context=null,frame=0,grains=[],landings=[],epoch=0;
    function finish(){
      if(done)return;done=true;cancelAnimationFrame(frame);animations.forEach(function(a){a.cancel();});
      if(canvas)canvas.remove();grains=[];landings=[];
      title.innerHTML=original;title.classList.remove('letter-assembly','cinematic-title');title.removeAttribute('aria-label');
      title.dataset.introState='ready';document.dispatchEvent(new CustomEvent('hero-title-ready'));
      window.removeEventListener('resize',finish);window.removeEventListener('scroll',onScroll);
      preference.removeEventListener('change',finish);document.removeEventListener('visibilitychange',onVisibility);
    }
    function onScroll(){if(started&&Math.abs(scrollY-startScroll)>12)finish();}
    function onVisibility(){if(document.hidden)finish();}
    function dust(now){
      if(done)return;var elapsed=now-epoch;
      landings.forEach(function(landing){
        if(landing.emitted||elapsed<landing.time)return;landing.emitted=true;
        landing.points.forEach(function(point){grains.push({x:point.x,y:point.y,start:now,life:650+Math.random()*450,vx:45+Math.random()*110,vy:-18-Math.random()*50,size:.65+Math.random()*1.1,color:landing.color});});
      });
      context.clearRect(0,0,innerWidth,innerHeight);
      grains=grains.filter(function(p){var age=(now-p.start)/p.life;if(age>=1)return false;var seconds=(now-p.start)/1000;
        context.globalAlpha=(1-age)*.8;context.fillStyle=p.color;
        var x=p.x+p.vx*seconds,y=p.y+p.vy*seconds+12*seconds*seconds;
        context.fillRect(x,y,p.size*(1-age*.5),p.size);return true;
      });context.globalAlpha=1;
      if(landings.every(function(l){return l.emitted;})&&!grains.length){finish();return;}
      frame=requestAnimationFrame(dust);
    }
    var fonts=document.fonts?document.fonts.ready:Promise.resolve();
    Promise.race([fonts,new Promise(function(resolve){setTimeout(resolve,650);})]).then(function(){
      if(done)return;if(preference.matches||document.hidden||scrollY>innerHeight*.5){finish();return;}
      title.setAttribute('aria-label',title.textContent.replace(/\s+/g,' ').trim());
      var letters=[];
      function split(node){Array.from(node.childNodes).forEach(function(child){
        if(child.nodeType===3){var fragment=document.createDocumentFragment();child.textContent.split(/(\s+)/).forEach(function(word){
          if(!word)return;if(/^\s+$/.test(word)){fragment.appendChild(document.createTextNode(word));return;}
          var group=document.createElement('span');group.className='assembly-word';group.setAttribute('aria-hidden','true');
          Array.from(word).forEach(function(char){var letter=document.createElement('span');letter.className='assembly-letter';letter.textContent=char;group.appendChild(letter);letters.push(letter);});fragment.appendChild(group);
        });child.replaceWith(fragment);}else if(child.nodeType===1)split(child);
      });}
      title.classList.add('letter-assembly','cinematic-title');split(title);
      var positions=letters.map(function(letter){var r=letter.getBoundingClientRect(),cs=getComputedStyle(letter);return {rect:r,font:cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily,accent:!!letter.closest('em')};});
      canvas=document.createElement('canvas');canvas.className='title-sand';canvas.setAttribute('aria-hidden','true');
      var dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
      context=canvas.getContext('2d');if(!context){finish();return;}context.scale(dpr,dpr);document.body.appendChild(canvas);
      var mask=document.createElement('canvas'),ink=mask.getContext('2d');
      var cadence=innerWidth<900?65:75,duration=780;
      startScroll=scrollY;started=true;epoch=performance.now();
      letters.forEach(function(letter,index){
        var entry=positions[index],rect=entry.rect,side=index%4,x=0,y=0;
        if(side===0)x=-rect.right-35;else if(side===1)x=innerWidth-rect.left+35;
        else if(side===2)y=-rect.bottom-35;else y=innerHeight-rect.top+35;
        if(side<2)y=-80;else x=(index%2?1:-1)*85;
        var tilt=(side%2?1:-1)*28;
        var animation=letter.animate([
          {opacity:0,transform:'translate3d('+x+'px,'+y+'px,-250px) rotateY('+tilt+'deg) rotateZ('+(tilt*.4)+'deg) scale(1.25)',offset:0,easing:'cubic-bezier(.45,0,.8,.4)'},
          {opacity:1,transform:'translate3d('+(x*.025)+'px,-18px,18px) rotateY(4deg) scale(1.02)',offset:.58,easing:'cubic-bezier(.5,0,.9,.65)'},
          {opacity:1,transform:'translate3d(0,3px,0) scale(1.055,.91)',offset:.78,easing:'cubic-bezier(.2,.7,.3,1)'},
          {opacity:1,transform:'translate3d(0,-1px,0) scale(.995,1.015)',offset:.9},
          {opacity:1,transform:'translate3d(0,0,0) scale(1)',offset:1}
        ],{duration:duration,delay:index*cadence,easing:'linear',fill:'backwards'});animations.push(animation);
        // Sample the actual glyph silhouette; only a small, bounded dust cloud is live.
        var points=[];mask.width=Math.max(1,Math.ceil(rect.width));mask.height=Math.max(1,Math.ceil(rect.height));
        ink.font=entry.font;ink.textBaseline='middle';ink.fillStyle='#fff';ink.fillText(letter.textContent,0,mask.height*.5);
        var pixels=ink.getImageData(0,0,mask.width,mask.height).data,candidates=[];
        for(var py=0;py<mask.height;py+=3)for(var px=0;px<mask.width;px+=3)if(pixels[(py*mask.width+px)*4+3]>90)candidates.push({x:rect.left+px,y:rect.top+py});
        for(var p=0;p<18&&candidates.length;p++)points.push(candidates[Math.floor(Math.random()*candidates.length)]);
        landings.push({time:index*cadence+duration*.78,points:points,color:entry.accent?'#c5acf5':'#e4d8c3',emitted:false});
      });
      frame=requestAnimationFrame(dust);
      setTimeout(finish,letters.length*cadence+duration+1500);
    }).catch(finish);
    window.addEventListener('resize',finish);window.addEventListener('scroll',onScroll,{passive:true});
    preference.addEventListener('change',finish);document.addEventListener('visibilitychange',onVisibility);
  })();


  /* ---------- 3. Scroll cue under the hero (homepage only) --------------- */
  var hero = document.querySelector(".hero");
  var nextSection = hero && document.getElementById("projects");
  if (hero && nextSection) {
    var cue = el("div", "fx-scroll-cue");
    cue.innerHTML =
      '<a href="#projects" aria-label="Scroll to projects">' +
      '<span class="fx-scroll-cue__mouse" aria-hidden="true"></span>' +
      '<span aria-hidden="true">scroll</span></a>';
    hero.appendChild(cue);
  }

  /* ---------- 4. Readable heading reveal ------------------------------- */
  // Keep the actual heading text unchanged throughout the animation.
  var titles = $all(".section-title, .page-head__title");
  if ("IntersectionObserver" in window && titles.length) {
    var titleObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (entry.target.animate) entry.target.animate([
          { opacity: 0.6, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
      });
    }, { threshold: 0.3 });
    titles.forEach(function (title) { titleObserver.observe(title); });
  }

  if (!finePointer) return;

  /* ---------- 6. Cursor glow + trailing ring ----------------------------- */
  /* The native cursor is kept — the ring is a companion, not a replacement,
     so nothing about clicking or text selection changes. */
  var glow = el("div", "fx-glow");
  var ring = el("div", "fx-ring");
  glow.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);
  document.body.appendChild(ring);

  var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 3;
  var ringX = mouseX, ringY = mouseY, glowX = mouseX, glowY = mouseY;
  var INTERACTIVE = "a, button, summary, input, [role='option'], .card, .skill-box li, .card__tech li";

  document.addEventListener("pointermove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    document.body.classList.add("fx-has-pointer");
  }, { passive: true });
  document.addEventListener("pointerleave", function () {
    document.body.classList.remove("fx-has-pointer");
  });
  document.documentElement.addEventListener("mouseleave", function () {
    document.body.classList.remove("fx-has-pointer");
  });
  document.addEventListener("pointerover", function (e) {
    ring.classList.toggle("is-hover", !!(e.target.closest && e.target.closest(INTERACTIVE)));
  });
  document.addEventListener("pointerdown", function () { ring.classList.add("is-down"); });
  document.addEventListener("pointerup", function () { ring.classList.remove("is-down"); });

  (function loop() {
    ringX += (mouseX - ringX) * 0.22;
    ringY += (mouseY - ringY) * 0.22;
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    ring.style.transform = "translate3d(" + ringX.toFixed(1) + "px," + ringY.toFixed(1) + "px,0)";
    glow.style.transform = "translate3d(" + glowX.toFixed(1) + "px," + glowY.toFixed(1) + "px,0)";
    raf(loop);
  })();

  /* ---------- 6b. Pixel dust on box hover ------------------------------- */
  /* Subtle by design: the box never disappears. Hovering lifts a light
     dust of dots off the box — mostly from its frame, plus some ink near
     where the pointer came in — which drifts outward, tints to the accent
     palette and fades. Same rasterizer as the journey panel. One box at a
     time; scrolling clears it. */
  var PIX_BOXES = ".card, .badge-group, .certs--cards li, .contacts__box, .badge-more, .stats";
  var DUST_MAX = 420, DUST_COOLDOWN = 900;
  var PIX_TINTS = [[199, 120, 221], [97, 175, 239], [86, 182, 194], [255, 255, 255]];
  var pixLayer = null, pixCtx = null, pixRun = null;

  function pixCanvas() {
    if (!pixLayer) {
      pixLayer = el("canvas", "fx-pixels");
      pixLayer.setAttribute("aria-hidden", "true");
      document.body.appendChild(pixLayer);
      pixCtx = pixLayer.getContext("2d");
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    pixLayer.width = Math.round(window.innerWidth * dpr);
    pixLayer.height = Math.round(window.innerHeight * dpr);
    pixCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return pixCtx;
  }

  function endPix() {
    if (!pixRun) return;
    pixRun.box.fxPixEnd = performance.now();
    pixRun.done = true;
    pixRun = null;
    if (pixCtx) pixCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function runDust(box, px, py) {
    endPix();
    var r = box.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var EDGE = 4;

    var dust = rasterizeBox(box, 0, 0, { maxDots: 2600 }).filter(function (d) {
      if (d.faint) return false;
      var edge = d.x - r.left < EDGE || r.right - d.x < EDGE || d.y - r.top < EDGE || r.bottom - d.y < EDGE;
      var near = (d.x - px) * (d.x - px) + (d.y - py) * (d.y - py) < 110 * 110;
      return Math.random() < (edge ? 0.45 : near ? 0.3 : 0.025);
    });
    if (dust.length > DUST_MAX) {
      dust.sort(function () { return Math.random() - 0.5; });
      dust.length = DUST_MAX;
    }
    if (!dust.length) return;

    dust.forEach(function (d) {
      var ang = Math.atan2(d.y - cy, d.x - cx) + (Math.random() - 0.5) * 1.4;
      var dist = 10 + Math.random() * 34;
      var tint = PIX_TINTS[(Math.random() * PIX_TINTS.length) | 0];
      d.hx = d.x; d.hy = d.y;
      d.dx = Math.cos(ang) * dist; d.dy = Math.sin(ang) * dist - 6 - Math.random() * 14;
      d.or = d.r; d.og = d.g; d.ob = d.b; d.tr = tint[0]; d.tg = tint[1]; d.tb = tint[2];
      d.del = Math.random() * 220;
      d.life = 650 + Math.random() * 450;
      d.size = Math.random() < 0.25 ? 3 : 2;
    });

    var ctx = pixCanvas();
    var run = pixRun = { box: box, done: false };
    var t0 = performance.now(), end = 220 + 1100;

    (function frame(now) {
      if (run.done) return;
      var t = Math.max(now - t0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = 0; i < dust.length; i++) {
        var d = dust[i];
        var lt = (t - d.del) / d.life;
        if (lt <= 0 || lt >= 1) continue;
        var e = 1 - Math.pow(1 - lt, 3);
        var c = Math.min(lt * 1.6, 1);
        var a = lt < 0.15 ? lt / 0.15 : 1 - (lt - 0.15) / 0.85;
        ctx.fillStyle = "rgba(" + ((d.or + (d.tr - d.or) * c) | 0) + "," + ((d.og + (d.tg - d.og) * c) | 0) + "," +
                        ((d.ob + (d.tb - d.ob) * c) | 0) + "," + (a * 0.9).toFixed(3) + ")";
        ctx.fillRect(d.hx + d.dx * e - d.size / 2, d.hy + d.dy * e - d.size / 2, d.size, d.size);
      }
      if (t < end) raf(frame); else endPix();
    })(t0);
  }

  $all(PIX_BOXES).forEach(function (box) {
    if (box.closest(".roadmap--sr")) return;
    box.addEventListener("pointerenter", function (e) {
      if (pixRun && pixRun.box === box) return;
      if (box.fxPixEnd && performance.now() - box.fxPixEnd < DUST_COOLDOWN) return;
      runDust(box, e.clientX, e.clientY);
    });
  });
  window.addEventListener("scroll", endPix, { passive: true });
  window.addEventListener("resize", endPix);

  /* ---------- 7. Spotlight borders --------------------------------------- */
  var SPOT = ".card, .milestone__card, .certs--cards li, .skill-box, .badge-group, .badge-more, .stats, .contacts__box";
  $all(SPOT).forEach(function (node) {
    node.classList.add("fx-spot");
    node.addEventListener("pointermove", function (e) {
      var r = node.getBoundingClientRect();
      node.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
      node.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
    });
  });

  /* ---------- 8. 3D tilt -------------------------------------------------- */
  var TILT_MAX = 6; // degrees
  $all(".card, .badge-group").forEach(function (node) {
    node.classList.add("fx-tilt");
    var frame = 0;

    node.addEventListener("pointermove", function (e) {
      if (frame) return;
      frame = raf(function () {
        frame = 0;
        var r = node.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        node.style.transform =
          "perspective(900px) rotateX(" + (-py * TILT_MAX).toFixed(2) + "deg) rotateY(" +
          (px * TILT_MAX).toFixed(2) + "deg)";
      });
    });
    node.addEventListener("pointerenter", function () {
      node.style.transition = "transform 120ms ease-out, border-color 140ms ease, translate 220ms ease, box-shadow 300ms ease, opacity 500ms ease";
    });
    node.addEventListener("pointerleave", function () {
      node.style.transition = "transform 600ms cubic-bezier(.2,.7,.2,1), border-color 140ms ease, translate 220ms ease, box-shadow 300ms ease, opacity 500ms ease";
      node.style.transform = "";
    });
  });

  /* ---------- 9. Magnetic buttons ---------------------------------------- */
  $all(".btn, .section-head__link, .cmdk-trigger, .rail__list a, .footer__socials a").forEach(function (node) {
    var strength = node.classList.contains("btn") ? 0.3 : 0.4;
    node.addEventListener("pointermove", function (e) {
      var r = node.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      node.style.transform = "translate(" + (dx * strength).toFixed(1) + "px," + (dy * strength).toFixed(1) + "px)";
    });
    node.addEventListener("pointerleave", function () {
      node.style.transform = "";
    });
  });

  /* ---------- 10. Parallax on decorative dot grids + hero halo ----------- */
  var parallax = $all(".decor");
  var heroVisual = document.querySelector(".hero__visual");
  if (parallax.length || heroVisual) {
    var pTicking = false;
    document.addEventListener("pointermove", function (e) {
      if (pTicking) return;
      pTicking = true;
      raf(function () {
        pTicking = false;
        var nx = e.clientX / window.innerWidth - 0.5;
        var ny = e.clientY / window.innerHeight - 0.5;
        parallax.forEach(function (d, i) {
          var depth = (i % 2 ? -1 : 1) * 18;
          d.style.transform = "translate3d(" + (nx * depth).toFixed(1) + "px," + (ny * depth).toFixed(1) + "px,0)";
        });
        var img = heroVisual && heroVisual.querySelector(".hero__img");
        if (img && !img.closest(".portrait-3d")) img.style.transform = "translate3d(" + (nx * -10).toFixed(1) + "px," + (ny * -8).toFixed(1) + "px,0)";
      });
    }, { passive: true });
  }
})();
