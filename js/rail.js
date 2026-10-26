/* ==========================================================================
   Project rail — horizontal, snap-scrolling project track.
   Native scrolling does the work (touch, trackpad, shift+wheel, tabbing to a
   card all just scroll). On top of that: prev/next buttons, a counter and
   progress bar, mouse drag with momentum, arrow keys, and group filters.
   Without JS the track is still a plain scrollable row of cards.
   ========================================================================== */
(function () {
  "use strict";

  var rail = document.querySelector("[data-rail]");
  if (!rail) return;

  var viewport = rail.querySelector(".proj-rail__viewport");
  var cards = Array.prototype.slice.call(rail.querySelectorAll(".card"));
  var prevBtn = rail.querySelector("[data-rail-prev]");
  var nextBtn = rail.querySelector("[data-rail-next]");
  var currentEl = rail.querySelector("[data-rail-current]");
  var totalEl = rail.querySelector("[data-rail-total]");
  var thumb = rail.querySelector(".proj-rail__thumb");
  var filters = Array.prototype.slice.call(rail.querySelectorAll(".proj-filter"));
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var LABELS = { case: "CASE STUDY", personal: "PERSONAL", additional: "ADDITIONAL" };

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function visible() { return cards.filter(function (c) { return !c.hidden; }); }
  function maxScroll() { return Math.max(0, viewport.scrollWidth - viewport.clientWidth); }

  // snap targets: each visible card's left edge, clamped to the scroll range
  function stops() {
    var base = viewport.querySelector(".proj-rail__track").offsetLeft, max = maxScroll(), out = [];
    visible().forEach(function (c) {
      var x = Math.min(c.offsetLeft - base, max);
      if (!out.length || x - out[out.length - 1] > 1) out.push(x);
    });
    return out.length ? out : [0];
  }

  // number the preview bars by position in the rail, so the counter and the
  // labels tell the same story
  function relabel() {
    visible().forEach(function (c, i) {
      var label = c.querySelector(".card__preview-bar > span");
      if (label) label.textContent = (LABELS[c.dataset.group] || "PROJECT") + " / " + pad(i + 1);
    });
  }

  /* ---------- state readout --------------------------------------------- */
  var ticking = false;
  function sync() {
    ticking = false;
    var max = maxScroll(), x = viewport.scrollLeft, n = visible().length;
    var p = max > 0 ? Math.min(Math.max(x / max, 0), 1) : 0;
    rail.classList.toggle("can-prev", x > 2);
    rail.classList.toggle("can-next", x < max - 2);
    rail.classList.toggle("is-static", max <= 2);
    prevBtn.disabled = x <= 2;
    nextBtn.disabled = x >= max - 2;
    currentEl.textContent = range();
    totalEl.textContent = pad(n);
    thumb.style.setProperty("--rail-size", max > 0 ? Math.max(viewport.clientWidth / viewport.scrollWidth, 0.08).toFixed(4) : "1");
    thumb.style.setProperty("--rail-pos", p.toFixed(4));
  }
  // "01–03": the cards at least ~60% inside the viewport right now
  function range() {
    var vl = viewport.scrollLeft, vr = vl + viewport.clientWidth;
    var base = viewport.querySelector(".proj-rail__track").offsetLeft, first = 0, last = 0;
    visible().forEach(function (c, i) {
      var l = c.offsetLeft - base, r = l + c.offsetWidth;
      if ((Math.min(r, vr) - Math.max(l, vl)) / c.offsetWidth >= 0.6) { if (!first) first = i + 1; last = i + 1; }
    });
    if (!first) return "01";
    return first === last ? pad(first) : pad(first) + "–" + pad(last);
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(sync); } }
  viewport.addEventListener("scroll", queue, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(queue).observe(viewport);
  else window.addEventListener("resize", queue);

  /* ---------- eased glide ----------------------------------------------- */
  // Snap is switched off while we animate scrollLeft ourselves, then restored
  // once we land exactly on a snap point — so it never fights the glide.
  var glide = 0;
  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
  function stopGlide() {
    if (!glide) return;
    cancelAnimationFrame(glide);
    glide = 0;
    rail.classList.remove("is-gliding");
  }
  function glideTo(target, duration) {
    stopGlide();
    target = Math.min(Math.max(target, 0), maxScroll());
    var from = viewport.scrollLeft, dist = target - from;
    if (Math.abs(dist) < 1) return;
    if (motion.matches) { viewport.scrollLeft = target; return; }
    duration = duration || Math.min(900, 420 + Math.abs(dist) * 0.35);
    rail.classList.add("is-gliding");
    var t0 = 0;
    glide = requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;
      var t = Math.min((now - t0) / duration, 1);
      viewport.scrollLeft = from + dist * easeOut(t);
      if (t < 1) glide = requestAnimationFrame(step);
      else { glide = 0; rail.classList.remove("is-gliding"); }
    });
  }
  ["wheel", "touchstart"].forEach(function (type) {
    viewport.addEventListener(type, stopGlide, { passive: true });
  });

  function step(dir) {
    var x = viewport.scrollLeft, s = stops(), target;
    if (dir > 0) target = s.filter(function (v) { return v > x + 2; })[0];
    else target = s.filter(function (v) { return v < x - 2; }).pop();
    if (target === undefined) target = dir > 0 ? maxScroll() : 0;
    glideTo(target);
  }
  prevBtn.addEventListener("click", function () { step(-1); });
  nextBtn.addEventListener("click", function () { step(1); });

  viewport.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var map = { ArrowRight: 1, ArrowLeft: -1 };
    if (map[e.key]) { e.preventDefault(); step(map[e.key]); }
    else if (e.key === "Home" && e.target === viewport) { e.preventDefault(); glideTo(0); }
    else if (e.key === "End" && e.target === viewport) { e.preventDefault(); glideTo(maxScroll()); }
  });

  /* ---------- mouse drag with momentum ---------------------------------- */
  // Touch and pens keep native scrolling; only a mouse needs a drag handler.
  var drag = null, suppressClick = false;
  viewport.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0 || maxScroll() <= 2) return;
    stopGlide();
    drag = { id: e.pointerId, x: e.clientX, left: viewport.scrollLeft, moved: false, samples: [{ x: e.clientX, t: e.timeStamp }] };
  });
  viewport.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 6) return;
      drag.moved = true;
      rail.classList.add("is-dragging");
      viewport.setPointerCapture(drag.id);
    }
    viewport.scrollLeft = drag.left - dx;
    drag.samples.push({ x: e.clientX, t: e.timeStamp });
    if (drag.samples.length > 5) drag.samples.shift();
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (!d.moved) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    rail.classList.remove("is-dragging");
    // release velocity from the last few samples, projected ~280ms ahead,
    // then settle on the nearest card edge to that projection
    var a = d.samples[0], b = d.samples[d.samples.length - 1];
    var v = b.t > a.t && e.timeStamp - b.t < 80 ? (b.x - a.x) / (b.t - a.t) : 0;
    var projected = viewport.scrollLeft - v * 280;
    var s = stops(), best = s[0];
    s.forEach(function (x) { if (Math.abs(x - projected) < Math.abs(best - projected)) best = x; });
    glideTo(best, 650);
  }
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  // a drag must never also open the case study it started on
  viewport.addEventListener("click", function (e) {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  viewport.addEventListener("dragstart", function (e) { e.preventDefault(); });

  /* ---------- filters --------------------------------------------------- */
  var filtering = null;
  function animateIn(list) {
    if (motion.matches || !Element.prototype.animate) return;
    list.forEach(function (c, i) {
      c.animate(
        [{ opacity: 0, transform: "translate3d(32px,0,0) scale(.98)" }, { opacity: 1, transform: "none" }],
        { duration: 700, delay: Math.min(i, 4) * 60, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }
      );
    });
  }
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.getAttribute("aria-pressed") === "true") return;
      filters.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      var group = btn.dataset.filter;
      var out = visible();
      var apply = function () {
        stopGlide();
        cards.forEach(function (c) { c.hidden = group !== "all" && c.dataset.group !== group; });
        viewport.scrollLeft = 0;
        relabel();
        sync();
        animateIn(visible().slice(0, 5));
      };
      if (filtering) filtering.forEach(function (a) { a.cancel(); });
      if (motion.matches || !Element.prototype.animate) { apply(); return; }
      filtering = out.map(function (c) {
        return c.animate([{ opacity: 1 }, { opacity: 0, transform: "translate3d(-16px,0,0)" }],
          { duration: 180, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" });
      });
      Promise.all(filtering.map(function (a) { return a.finished; })).then(function () {
        filtering.forEach(function (a) { a.cancel(); });
        filtering = null;
        apply();
      }, function () {});
    });
  });

  /* ---------- entrance -------------------------------------------------- */
  // The whole rail rises in as one piece; the first cards follow in a short
  // stagger. Cards in the rail are excluded from the page's side-throw reveal.
  if ("IntersectionObserver" in window && !motion.matches && Element.prototype.animate) {
    rail.style.opacity = "0";
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      rail.style.opacity = "";
      rail.animate([{ opacity: 0, transform: "translate3d(0,28px,0)" }, { opacity: 1, transform: "none" }],
        { duration: 900, easing: "cubic-bezier(.16,1,.3,1)" });
      animateIn(visible().slice(0, 4));
    }, { rootMargin: "0px 0px -12% 0px" });
    io.observe(rail);
  }

  rail.classList.add("is-ready");
  relabel();
  sync();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
})();
