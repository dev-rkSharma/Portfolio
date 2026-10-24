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

  // map "#skills" -> the <a>, so we can highlight from the section id; links
  // that go to a separate page name their homepage section in data-spy
  var linkFor = {};
  navLinks.forEach(function (link) {
    var href = link.getAttribute("href") || "";
    var id = link.getAttribute("data-spy") || (href.charAt(0) === "#" ? href.slice(1) : "");
    if (id) linkFor[id] = link;
  });

  var watched = Object.keys(linkFor)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  // The active section is the last one whose top has crossed 40% of the
  // viewport; at the very bottom of the page the last section wins, so short
  // closing sections (contacts) still light up.
  if (watched.length) {
    var currentLink = null;
    var spyQueued = false;
    var updateSpy = function () {
      spyQueued = false;
      var line = window.innerHeight * 0.4;
      var current = null;
      watched.forEach(function (section) {
        if (section.getBoundingClientRect().top <= line) current = section;
      });
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = watched[watched.length - 1];
      var link = current ? linkFor[current.id] : null;
      if (link === currentLink) return;
      currentLink = link;
      navLinks.forEach(function (l) {
        l.classList.remove("is-active");
        l.removeAttribute("aria-current");
      });
      if (link) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "location");
      }
    };
    var queueSpy = function () {
      if (spyQueued) return;
      spyQueued = true;
      requestAnimationFrame(updateSpy);
    };
    window.addEventListener("scroll", queueSpy, { passive: true });
    window.addEventListener("resize", queueSpy);
    updateSpy();
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

  /* ---------- 5b. Agent trace rotation --------------------------------- */
  /* Decorative readout in the hero, styled as an AIP agent working through a
     request. Static on the first step for prefers-reduced-motion — same
     convention as the stat counters below, which just render the end value. */
  var AGENT_STEPS = [
    "receive_request()",
    "call_llm(summarize)",
    "ai_analyst.recommend()",
    "respond() ✓"
  ];
  var agentTraceText = document.querySelector(".agent-trace__text");

  /* typed out character by character, held, then backspaced before the next
     step — reads as a live agent console rather than a slideshow */
  var TYPE_MS = 45, ERASE_MS = 22, HOLD_MS = 1300, GAP_MS = 250;

  if (agentTraceText && !reduceMotion) {
    var agentStepIndex = 0;
    var agentChars = AGENT_STEPS[0].length;

    function typeStep() {
      var target = AGENT_STEPS[agentStepIndex];
      if (agentChars < target.length) {
        agentChars += 1;
        agentTraceText.textContent = target.slice(0, agentChars);
        window.setTimeout(typeStep, TYPE_MS);
      } else {
        window.setTimeout(eraseStep, HOLD_MS);
      }
    }

    function eraseStep() {
      var current = AGENT_STEPS[agentStepIndex];
      if (agentChars > 0) {
        agentChars -= 1;
        agentTraceText.textContent = current.slice(0, agentChars) || "\u200B";
        window.setTimeout(eraseStep, ERASE_MS);
      } else {
        agentStepIndex = (agentStepIndex + 1) % AGENT_STEPS.length;
        window.setTimeout(typeStep, GAP_MS);
      }
    }

    window.setTimeout(eraseStep, HOLD_MS);
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

  var COPY_ICONS = {
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    failed: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
  };

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

    var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "copy-btn__icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    btn.appendChild(icon);

    function setState(iconName, name) {
      icon.innerHTML = COPY_ICONS[iconName];
      btn.title = name;
      btn.setAttribute("aria-label", name);
    }

    setState("copy", "Copy email address");

    var timer = null;
    btn.addEventListener("click", function () {
      writeClipboard(email).then(function () {
        btn.classList.add("is-copied");
        setState("check", "Email address copied");
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

  /* ---------- 9. Console easter egg ------------------------------------ */
  if (window.console && console.log) {
    console.log(
      "%c  #  Roushan Kumar %c— Palantir Foundry developer, data engineer\n\n" +
      "%c  Poking around in devtools? Let's talk:\n" +
      "%c  github.com/dev-rkSharma\n" +
      "%c  linkedin.com/in/roushan-kumar",
      "color:#C778DD;font-family:monospace;font-size:14px;font-weight:600;",
      "color:#ABB2BF;font-family:monospace;font-size:12px;",
      "color:#ABB2BF;font-family:monospace;font-size:12px;",
      "color:#949CA8;font-family:monospace;font-size:12px;",
      "color:#949CA8;font-family:monospace;font-size:12px;"
    );
  }

  /* ---------- 10. Command palette (Ctrl/Cmd+K) -------------------------- */
  /* Injected wholesale — no markup lives in any of the 5 HTML files.
     Section anchors (#skills etc.) only exist on index.html, so from any
     other page they're qualified as index.html#id instead. */
  var HOME_PAGE = "index.html";
  var onHomePage = /(^|\/)(index\.html)?$/.test(window.location.pathname);

  function destFor(hash) {
    return onHomePage ? hash : HOME_PAGE + hash;
  }

  var COMMANDS = [
    { label: "Home", hint: "Page", href: onHomePage ? "#home" : HOME_PAGE },
    { label: "Projects", hint: "Page", href: "projects.html" },
    { label: "Skills", hint: "Section", href: destFor("#skills") },
    { label: "Experience", hint: "Section", href: destFor("#experience") },
    { label: "Badges", hint: "Section", href: destFor("#badges") },
    { label: "About", hint: "Page", href: "about.html" },
    { label: "Contacts", hint: "Page", href: "contacts.html" },
    { label: "Download Résumé", hint: "PDF", href: "assets/Roushan-Kumar-Resume.pdf", download: true },
    { label: "GitHub", hint: "External", href: "https://github.com/dev-rkSharma", external: true },
    { label: "LinkedIn", hint: "External", href: "https://www.linkedin.com/in/roushan-kumar", external: true },
    { label: "Email", hint: "Mailto", href: "mailto:dev.rksharma1892@gmail.com" },
    { label: "Terminal", hint: "Press `", action: "fx:terminal" }
  ];

  var cmdk = null, cmdkInput = null, cmdkList = null, cmdkTrigger = null;
  var cmdkMatches = [];
  var cmdkSelected = 0;
  var cmdkOpenedFrom = null;

  function buildPalette() {
    cmdkTrigger = document.createElement("button");
    cmdkTrigger.type = "button";
    cmdkTrigger.className = "cmdk-trigger";
    cmdkTrigger.setAttribute("aria-haspopup", "dialog");
    cmdkTrigger.innerHTML =
      '<span class="hash" aria-hidden="true">#</span>' +
      '<span class="cmdk-trigger__label">search</span>' +
      "<kbd>" + (isMac() ? "⌘K" : "Ctrl K") + "</kbd>";
    cmdkTrigger.addEventListener("click", function () { openPalette(cmdkTrigger); });
    document.body.appendChild(cmdkTrigger);

    cmdk = document.createElement("div");
    cmdk.className = "cmdk";
    cmdk.id = "cmdk";
    cmdk.hidden = true;
    cmdk.innerHTML =
      '<div class="cmdk__backdrop"></div>' +
      '<div class="cmdk__panel" role="dialog" aria-modal="true" aria-label="Command palette">' +
      '  <div class="cmdk__input-row">' +
      '    <span class="hash" aria-hidden="true">#</span>' +
      '    <input class="cmdk__input" type="text" placeholder="jump to…" ' +
      '           aria-label="Search commands" autocomplete="off" spellcheck="false">' +
      "    <kbd>esc</kbd>" +
      "  </div>" +
      '  <ul class="cmdk__list" role="listbox"></ul>' +
      "</div>";
    document.body.appendChild(cmdk);

    cmdkInput = cmdk.querySelector(".cmdk__input");
    cmdkList = cmdk.querySelector(".cmdk__list");

    cmdk.querySelector(".cmdk__backdrop").addEventListener("click", function () { closePalette(); });
    cmdkInput.addEventListener("input", function () { renderMatches(cmdkInput.value); });
    cmdkInput.addEventListener("keydown", handlePaletteKeydown);
    cmdkList.addEventListener("click", function (e) {
      var item = e.target.closest(".cmdk__item");
      if (item) activateCommand(cmdkMatches[Number(item.dataset.index)]);
    });
  }

  function isMac() {
    return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  }

  function renderMatches(query) {
    var q = query.trim().toLowerCase();
    cmdkMatches = !q
      ? COMMANDS
      : COMMANDS.filter(function (c) { return c.label.toLowerCase().indexOf(q) !== -1; });
    cmdkSelected = 0;

    if (!cmdkMatches.length) {
      cmdkList.innerHTML = '<li class="cmdk__empty">No matches</li>';
      return;
    }

    cmdkList.innerHTML = cmdkMatches.map(function (c, i) {
      return '<li class="cmdk__item" role="option" data-index="' + i + '" ' +
        'aria-selected="' + (i === cmdkSelected ? "true" : "false") + '">' +
        '<span class="cmdk__item-label">' + c.label + "</span>" +
        '<span class="cmdk__item-hint">' + c.hint + "</span></li>";
    }).join("");
  }

  function moveSelection(delta) {
    if (!cmdkMatches.length) return;
    cmdkSelected = (cmdkSelected + delta + cmdkMatches.length) % cmdkMatches.length;
    Array.prototype.forEach.call(cmdkList.children, function (li, i) {
      li.setAttribute("aria-selected", String(i === cmdkSelected));
    });
    var active = cmdkList.children[cmdkSelected];
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  function activateCommand(command) {
    if (!command) return;
    closePalette();
    if (command.action) {
      // handled elsewhere (js/extras.js listens for these)
      document.dispatchEvent(new CustomEvent(command.action));
    } else if (command.external) {
      window.open(command.href, "_blank", "noopener");
    } else if (command.download) {
      var a = document.createElement("a");
      a.href = command.href;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.location.href = command.href;
    }
  }

  function handlePaletteKeydown(e) {
    if (e.key === "Escape") { e.preventDefault(); closePalette(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); moveSelection(1); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); moveSelection(-1); return; }
    if (e.key === "Enter") { e.preventDefault(); activateCommand(cmdkMatches[cmdkSelected]); }
  }

  function openPalette(opener) {
    if (!cmdk) buildPalette();
    cmdkOpenedFrom = opener || document.activeElement;
    cmdk.hidden = false;
    cmdkInput.value = "";
    renderMatches("");
    document.body.classList.add("is-locked");
    window.setTimeout(function () { cmdkInput.focus(); }, 0);
  }

  function closePalette() {
    if (!cmdk || cmdk.hidden) return;
    cmdk.hidden = true;
    document.body.classList.remove("is-locked");
    if (cmdkOpenedFrom && typeof cmdkOpenedFrom.focus === "function") cmdkOpenedFrom.focus();
  }

  function isPaletteOpen() {
    return !!cmdk && !cmdk.hidden;
  }

  buildPalette();

  document.addEventListener("keydown", function (e) {
    var key = (e.key || "").toLowerCase();
    if ((e.metaKey || e.ctrlKey) && key === "k") {
      e.preventDefault();
      isPaletteOpen() ? closePalette() : openPalette(null);
    }
  });
})();
