/* ==========================================================================
   Portfolio — behaviour
   No dependencies. Everything here is progressive enhancement: with JS
   disabled the page still renders and scrolls correctly.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Mobile menu ------------------------------------------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-locked", open);
  }

  function isMenuOpen() {
    return !!nav && nav.classList.contains("is-open");
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      setMenu(!isMenuOpen());
    });

    // close after tapping a nav link
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    // Escape closes
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isMenuOpen()) {
        setMenu(false);
        burger.focus();
      }
    });

    // if the viewport grows past the mobile breakpoint, drop the overlay state
    window.matchMedia("(min-width: 900px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- 2. Active nav link on scroll ----------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));

  // map "#projects" -> the <a>, so we can highlight from the section id
  var linkFor = {};
  navLinks.forEach(function (link) {
    var id = (link.getAttribute("href") || "").replace("#", "");
    if (id) linkFor[id] = link;
  });

  var watched = Object.keys(linkFor)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && watched.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        // pick the entry closest to the top of the viewport that is intersecting
        var best = null;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) {
            best = entry;
          }
        });
        if (!best) return;

        var link = linkFor[best.target.id];
        if (!link) return;
        navLinks.forEach(function (l) {
          l.classList.remove("is-active");
          l.removeAttribute("aria-current");
        });
        link.classList.add("is-active");
        link.setAttribute("aria-current", "location");
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    watched.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- 3. Sticky header: scrolled state ------------------------- */
  /* Past ~24px of scroll the header grows a hairline bottom border so it reads
     as a layer sitting above the content instead of floating in it.
     This is a *state*, not an animation: the border-colour transition it
     triggers is already neutralised by the prefers-reduced-motion block in
     css/style.css, so the separation still appears for reduced-motion users —
     it just appears instantly. */
  var header = document.querySelector(".header");

  if (header) {
    var SCROLLED_AT = 24;
    var headerTicking = false;

    function syncHeader() {
      headerTicking = false;
      var y = window.scrollY || window.pageYOffset || 0;
      header.classList.toggle("is-scrolled", y > SCROLLED_AT);
    }

    window.addEventListener("scroll", function () {
      if (headerTicking) return;
      headerTicking = true;
      window.requestAnimationFrame(syncHeader);
    }, { passive: true });

    // deep link / restored scroll position: get the state right on first paint
    syncHeader();
  }

  /* ---------- 4. Stagger indices --------------------------------------- */
  /* Replaces the old hardcoded nth-child(2..6) delay ladders in the CSS (one
     for the scroll reveal, one for the above-the-fold card entrance): every
     staggered child publishes its own position as --i, so the effect scales to
     any number of children and can't silently lose its last step when a
     section gains one. CSS reads it as calc(var(--i, 0) * 90ms).

     Runs unconditionally and as early as possible — the first section's cards
     animate on page load, so a late --i would restart their animation-delay
     mid-flight and flash. It's inert under reduced motion: the entrance
     keyframes are `animation: none !important` there, and .reveal is never
     applied, so nothing is left holding a delay. */
  var STAGGER_CAP = 6;          // delay stops growing past the 7th child
  var STAGGER_GROUPS = [".cards", ".skills__grid", ".badge-groups", ".timeline"];

  STAGGER_GROUPS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty("--i", String(Math.min(i, STAGGER_CAP)));
      });
    });
  });

  /* ---------- 5. Reveal sections on scroll ----------------------------- */
  /* The reveal observer also drives the accent data-path draw inside each
     project diagram. All of it is behind !reduceMotion, so a reduced-motion
     visitor gets the finished state immediately and none of it runs. */

  /* --- project diagram: draw the accent data path ---------------------- */
  /* The diagrams ship as external files (<img src="assets/project-*.svg">),
     and JS can't reach into an <img>. So on reveal we fetch the file once and
     swap the <img> for the same markup inline, then animate stroke-dashoffset
     on the elements the asset marks with class="data-path".
     If any of that is unavailable (no fetch, file:// origin, parse error) the
     original <img> is left untouched — already fully drawn. */
  var DRAW_MS = 700;
  var DRAW_STEP = 90;
  var svgCache = {};

  function canInlineSvg() {
    return !!(window.fetch && window.Promise && window.DOMParser);
  }

  function inlineSvg(img) {
    var src = img.getAttribute("src");
    if (!src) return Promise.reject();

    if (!svgCache[src]) {
      svgCache[src] = fetch(src).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      });
    }

    return svgCache[src].then(function (markup) {
      var parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
      var root = parsed.documentElement;
      if (!root || root.nodeName.toLowerCase() !== "svg") throw new Error("not an svg");
      if (!img.parentNode) throw new Error("detached");

      var svg = document.importNode(root, true);
      // let .card__media svg (css) own the box instead of the intrinsic size
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("role", "img");
      if (!svg.getAttribute("aria-label") && img.alt) {
        svg.setAttribute("aria-label", img.alt);
      }
      img.parentNode.replaceChild(svg, img);
      return svg;
    });
  }

  function drawDataPaths(svg) {
    var marked = svg.querySelectorAll(".data-path");
    var step = 0;

    Array.prototype.forEach.call(marked, function (node) {
      // an accent path may be marked directly or as a <g> wrapping several
      var paths = typeof node.getTotalLength === "function"
        ? [node]
        : Array.prototype.slice.call(node.querySelectorAll("path"));

      /* arrowheads are markers on path vertices, so they ignore the dash and
         would hang in mid-air while the line is still drawing — park the
         marker until the lines have arrived */
      var marker = node.getAttribute("marker-end");
      var restoreAt = 0;
      if (marker) node.removeAttribute("marker-end");

      paths.forEach(function (path) {
        if (typeof path.getTotalLength !== "function") return;

        var len;
        try { len = path.getTotalLength(); } catch (e) { return; }
        if (!len) return;

        var delay = step * DRAW_STEP;
        step += 1;
        restoreAt = Math.max(restoreAt, delay + DRAW_MS);

        path.style.transition = "none";
        path.style.strokeDasharray = len + " " + len;
        path.style.strokeDashoffset = String(len);
        void path.getBoundingClientRect();   // flush, so the transition runs
        path.style.transition = "stroke-dashoffset " + DRAW_MS + "ms ease " + delay + "ms";
        path.style.strokeDashoffset = "0";
      });

      if (marker) {
        window.setTimeout(function () {
          node.setAttribute("marker-end", marker);
        }, restoreAt);
      }
    });
  }

  function drawProjectCard(card) {
    var img = card.querySelector(".card__media img");
    if (!img) return;
    inlineSvg(img).then(drawDataPaths).catch(function () {
      /* no-op: the original <img> stays exactly as it was */
    });
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    var targets = document.querySelectorAll("main .section");

    targets.forEach(function (el, i) {
      // never hide the hero — it's above the fold
      if (i === 0) return;
      el.classList.add("reveal");
    });

    var revealer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);

          if (entry.target.classList.contains("card")) {
            drawProjectCard(entry.target);
          } else {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    document.querySelectorAll(".reveal").forEach(function (el) {
      revealer.observe(el);
    });

    /* project cards are observed individually — they can live in the first
       section (projects.html), which is never given .reveal */
    if (canInlineSvg()) {
      document.querySelectorAll(".card").forEach(function (card) {
        if (card.querySelector(".card__media img")) revealer.observe(card);
      });
    }
  }

  /* ---------- 6. Footer year ------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- 7. Stat counters ----------------------------------------- */
  /* Reads a leading integer off the label and counts up to it, keeping any
     suffix ("5+" -> 5, "+"). A label that doesn't start with a digit is left
     alone rather than blanked. */
  var statNums = document.querySelectorAll(".stat__num");

  function animateCount(el) {
    var match = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!match) return;

    var target = parseInt(match[1], 10);
    var suffix = match[2];

    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }

    var duration = 900;
    var start = null;

    el.textContent = "0" + suffix;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statNums.length && "IntersectionObserver" in window) {
    var statsObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    statNums.forEach(function (el) { statsObserver.observe(el); });
  }

  /* ---------- 8. Copy the email address ------------------------------- */
  /* A mailto: link is useless on a webmail-only setup, so the address gets a
     copy button beside it — in the footer (every page) and in the contacts
     list. The button is injected from here, never in the markup: if neither
     the Clipboard API nor the execCommand fallback is usable (http:// or
     file://, i.e. a non-secure context) it simply never appears and the
     mailto link stays the only affordance. */
  var COPY_REVERT_MS = 1200;
  var liveRegion = null;

  function clipboardReady() {
    return !!(navigator.clipboard && window.isSecureContext);
  }

  function canCopy() {
    if (clipboardReady()) return true;
    return !!(document.queryCommandSupported && document.queryCommandSupported("copy"));
  }

  function writeClipboard(text) {
    if (clipboardReady()) return navigator.clipboard.writeText(text);

    // fallback: hidden textarea + execCommand, for non-secure contexts
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);

      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);

      if (ok) resolve(); else reject(new Error("execCommand copy failed"));
    });
  }

  function announce(message) {
    if (!liveRegion) {
      liveRegion = document.createElement("p");
      liveRegion.className = "sr-only";
      liveRegion.setAttribute("role", "status");
      liveRegion.setAttribute("aria-live", "polite");
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = message;
  }

  function makeCopyButton(email) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";

    var label = document.createElement("span");
    label.className = "copy-btn__text";
    label.setAttribute("aria-hidden", "true");
    label.textContent = "copy";
    btn.appendChild(label);

    function setState(text, name) {
      label.textContent = text;
      btn.title = name;
      btn.setAttribute("aria-label", name);
    }

    setState("copy", "Copy email address");

    var timer = null;
    btn.addEventListener("click", function () {
      writeClipboard(email).then(function () {
        btn.classList.add("is-copied");
        setState("copied", "Email address copied");
        announce("Email address copied to clipboard");
      }).catch(function () {
        btn.classList.remove("is-copied");
        setState("failed", "Could not copy — select the address manually");
      }).then(function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          btn.classList.remove("is-copied");
          setState("copy", "Copy email address");
        }, COPY_REVERT_MS);
      });
    });

    return btn;
  }

  function addressOf(link) {
    return (link.getAttribute("href") || "")
      .replace(/^mailto:/i, "")
      .split("?")[0]
      .trim();
  }

  if (canCopy()) {
    // footer, all pages — wrap the link so the button can sit beside it
    var footerEmail = document.querySelector(".footer__email");
    if (footerEmail && addressOf(footerEmail)) {
      var row = document.createElement("span");
      row.className = "email-row";
      footerEmail.parentNode.insertBefore(row, footerEmail);
      row.appendChild(footerEmail);
      row.appendChild(makeCopyButton(addressOf(footerEmail)));
    }

    // contacts.html — the email row inside the "Message me here" box
    var listEmail = document.querySelector('.contacts__list a[href^="mailto:"]');
    if (listEmail && addressOf(listEmail) && listEmail.parentNode) {
      listEmail.parentNode.classList.add("has-copy");
      listEmail.parentNode.appendChild(makeCopyButton(addressOf(listEmail)));
    }
  }
})();
