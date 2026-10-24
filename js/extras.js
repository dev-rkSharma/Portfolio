/* ==========================================================================
   Portfolio — extras
   Loaded after main.js and fx.js on every page. Five independent pieces,
   each a no-op on pages that don't have its markup:
     1. "Now" widget       — live IST clock in the hero status line
     2. Nav sliding pill   — glowing pill that glides between nav links
     3. Case-study modal   — project cards open full-screen with a zoom
     4. Terminal           — press ` (or pick "Terminal" in Ctrl+K)
     5. Skills graph       — draggable force-directed skill network
   Everything is progressive enhancement; reduced motion gets the static
   end state of each.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raf = window.requestAnimationFrame;

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- 1. "Now" widget ------------------------------------------- */
  /* Markup lives in index.html (.now) so it reads fine without JS; this only
     keeps the clock current. */
  var nowTime = document.querySelector(".now__time");
  if (nowTime) {
    var tick = function () {
      try {
        nowTime.textContent = new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata"
        }) + " IST";
      } catch (e) { /* very old browser without timeZone support: leave the static text */ }
    };
    tick();
    window.setInterval(tick, 20000);
  }

  /* ---------- 2. Nav sliding pill (desktop) ------------------------------ */
  var navList = document.querySelector(".nav__list");
  var desktop = window.matchMedia("(min-width: 900px)");
  if (navList) {
    var pill = el("li", "nav__pill");
    pill.setAttribute("aria-hidden", "true");
    pill.setAttribute("role", "presentation");
    navList.appendChild(pill);
    var hovering = null;

    var activeLink = function () { return navList.querySelector(".nav__link.is-active"); };
    var movePill = function (link, instant) {
      if (!desktop.matches || !link) { pill.style.opacity = "0"; return; }
      var lr = navList.getBoundingClientRect(), r = link.getBoundingClientRect();
      if (instant) pill.style.transition = "none";
      pill.style.opacity = "1";
      pill.style.width = (r.width + 20).toFixed(1) + "px";
      pill.style.height = (r.height + 10).toFixed(1) + "px";
      pill.style.transform = "translate(" + (r.left - lr.left - 10).toFixed(1) + "px," + (r.top - lr.top - 5).toFixed(1) + "px)";
      if (instant) { void pill.offsetWidth; pill.style.transition = ""; }
    };

    document.body.classList.add("has-nav-pill");
    $all(".nav__link", navList).forEach(function (link) {
      link.addEventListener("pointerenter", function () { hovering = link; movePill(link); });
      // main.js moves .is-active as you scroll — follow it unless hovering
      new MutationObserver(function () { if (!hovering) movePill(activeLink()); })
        .observe(link, { attributes: true, attributeFilter: ["class"] });
    });
    navList.addEventListener("pointerleave", function () { hovering = null; movePill(activeLink()); });
    window.addEventListener("resize", function () { movePill(hovering || activeLink(), true); });
    desktop.addEventListener("change", function () { movePill(activeLink(), true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { movePill(activeLink(), true); });
    movePill(activeLink(), true);
  }

  /* ---------- 3. Case-study modal ---------------------------------------- */
  /* Clicking a project card opens it in a <dialog>, zooming out of the card's
     own rectangle (FLIP) and back into it on close. The dialog shows the same
     content as the card, larger — nothing invented. */
  var cards = $all(".card");
  if (cards.length && window.HTMLDialogElement) {
    var dlg = el("dialog", "cs");
    dlg.setAttribute("aria-labelledby", "cs-title");
    dlg.innerHTML =
      '<div class="cs__panel">' +
      '  <button class="cs__close" type="button" aria-label="Close case study">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
      "  </button>" +
      '  <div class="cs__media"></div>' +
      '  <div class="cs__body">' +
      '    <p class="cs__eyebrow"><span class="hash" aria-hidden="true">#</span>case-study</p>' +
      '    <h2 class="cs__title" id="cs-title"></h2>' +
      '    <ul class="cs__tech card__tech"></ul>' +
      '    <div class="cs__text"></div>' +
      "  </div>" +
      "</div>";
    document.body.appendChild(dlg);
    var csPanel = dlg.querySelector(".cs__panel");
    var openedFrom = null;

    var flip = function (fromRect, reverse, done) {
      if (reduceMotion || !csPanel.animate || !fromRect) { if (done) done(); return; }
      var to = csPanel.getBoundingClientRect();
      var sx = fromRect.width / to.width, sy = fromRect.height / to.height;
      var dx = fromRect.left - to.left, dy = fromRect.top - to.top;
      var start = { transform: "translate(" + dx + "px," + dy + "px) scale(" + sx + "," + sy + ")", opacity: 0.6, borderRadius: "14px" };
      var end = { transform: "none", opacity: 1 };
      var anim = csPanel.animate(reverse ? [end, start] : [start, end], {
        duration: reverse ? 320 : 480, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both"
      });
      anim.onfinish = function () { anim.cancel(); if (done) done(); };
    };

    var openCase = function (card) {
      openedFrom = card;
      var media = card.querySelector(".card__media");
      dlg.querySelector(".cs__media").innerHTML = media ? media.innerHTML : "";
      dlg.querySelector(".cs__title").textContent = (card.querySelector(".card__title") || {}).textContent || "";
      dlg.querySelector(".cs__tech").innerHTML = (card.querySelector(".card__tech") || { innerHTML: "" }).innerHTML;
      var text = "";
      [".card__desc", ".card__contribution", ".card__nda"].forEach(function (sel) {
        var n = card.querySelector(sel);
        if (n) text += '<p class="' + sel.slice(1).replace("card__", "cs__") + '">' + n.innerHTML + "</p>";
      });
      dlg.querySelector(".cs__text").innerHTML = text;
      dlg.showModal();
      document.body.classList.add("is-locked");
      flip(card.getBoundingClientRect(), false);
    };

    var closeCase = function () {
      if (!dlg.open) return;
      var card = openedFrom;
      dlg.classList.add("is-closing");
      flip(card && card.getBoundingClientRect(), true, function () {
        dlg.classList.remove("is-closing");
        dlg.close();
      });
    };
    dlg.addEventListener("close", function () {
      document.body.classList.remove("is-locked");
      if (openedFrom) openedFrom.focus();
    });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeCase(); });
    dlg.querySelector(".cs__close").addEventListener("click", closeCase);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeCase(); });   // backdrop

    cards.forEach(function (card) {
      card.classList.add("is-openable");
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      var t = card.querySelector(".card__title");
      if (t) card.setAttribute("aria-label", "Open case study: " + t.textContent.trim());
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        openCase(card);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCase(card); }
      });
    });
  }

  /* ---------- 4. Terminal ------------------------------------------------- */
  /* Opens with the backtick key (outside text fields) or the "Terminal"
     entry in the Ctrl/Cmd+K palette (main.js dispatches fx:terminal).
     The data below is a hand-kept summary of the site — keep it in step
     with index.html when the CV changes. */
  var HOME = /(^|\/)(index\.html)?$/.test(window.location.pathname) ? "" : "index.html";
  var T = {
    name: "Roushan Kumar",
    role: "Palantir Applied Engineer @ Vanyar",
    tagline: "Palantir Foundry developer building agentic AI on enterprise data.",
    email: "dev.rksharma1892@gmail.com",
    github: "https://github.com/dev-rkSharma",
    linkedin: "https://www.linkedin.com/in/roushan-kumar",
    resume: "assets/Roushan-Kumar-Resume.pdf",
    skills: {
      "agentic-ai": ["AIP Logic & Agents", "AI Analyst", "LLM Pipelines", "AI-FDE", "Pilot"],
      "foundry": ["Ontology", "Pipeline Builder", "Workshop", "AIP", "Quiver", "IST"],
      "data-eng": ["Data Modeling", "Pipeline Engineering", "ETL", "Timeseries", "Process Mining"],
      "analytics": ["Geospatial Analytics", "Data Visualization", "Advanced Analytics"],
      "governance": ["Data Governance", "Access Controls", "Compliance", "API Integrations"],
      "code": ["Python", "SQL", "JavaScript", "TypeScript", "React", "Node.js"]
    },
    journey: [
      ["2021-24", "BCA", "JNVU, Jodhpur"],
      ["2024", "Full-stack Developer", "Dream Team"],
      ["2024-26", "MCA", "Bikaner Technical University"],
      ["2025-26", "Palantir Foundry Developer", "MTAS Solutions"],
      ["2026-now", "Palantir Applied Engineer", "Vanyar"]
    ],
    projects: [
      "Operational Reporting Automation",
      "Timeseries Analytics & Quiver Dashboards",
      "Agentic AI Assistants & LLM Pipelines"
    ],
    certs: [
      "Certified Palantir Foundry Application Developer Professional",
      "Certified Palantir Foundry Aware",
      "Certified Palantir Foundry Data Engineer"
    ]
  };

  var term = null, termOut, termIn, termHistory = [], termHistIdx = 0, termOpener = null;

  function link(href, label, external) {
    return '<a href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + esc(label) + "</a>";
  }
  function row(k, v) { return '<span class="t-key">' + esc(k) + "</span> " + v; }

  var CMDS = {
    help: {
      desc: "list commands",
      run: function () {
        return Object.keys(CMDS).filter(function (k) { return !CMDS[k].hidden; }).map(function (k) {
          return '<span class="t-cmd">' + k.padEnd(11) + "</span>" + esc(CMDS[k].desc);
        }).concat(["", '<span class="t-dim">tip: ↑/↓ history · Tab completes · Esc closes</span>']);
      }
    },
    whoami: {
      desc: "who is this",
      run: function () {
        return ['<span class="t-hl">' + esc(T.name) + "</span> — " + esc(T.role), esc(T.tagline)];
      }
    },
    skills: {
      desc: "skills by area (try: skills foundry)",
      run: function (args) {
        var keys = args[0] ? Object.keys(T.skills).filter(function (k) { return k.indexOf(args[0]) === 0; }) : Object.keys(T.skills);
        if (!keys.length) return ['<span class="t-err">no area "' + esc(args[0]) + '"</span> — areas: ' + Object.keys(T.skills).join(", ")];
        return keys.map(function (k) { return row(k.padEnd(11), esc(T.skills[k].join(" · "))); });
      }
    },
    journey: {
      desc: "education + work, oldest first",
      run: function () {
        return T.journey.map(function (j, i) {
          return '<span class="t-dim">' + (i === T.journey.length - 1 ? "└─" : "├─") + "</span> " +
            row(j[0].padEnd(9), '<span class="t-hl">' + esc(j[1]) + "</span> @ " + esc(j[2]));
        });
      }
    },
    projects: {
      desc: "featured case studies",
      run: function () {
        return T.projects.map(function (p, i) { return '<span class="t-dim">0' + (i + 1) + "</span> " + esc(p); })
          .concat(["", "→ " + link("projects.html", "projects.html") + ' <span class="t-dim">(client work under NDA)</span>']);
      }
    },
    certs: {
      desc: "Palantir certifications",
      run: function () { return T.certs.map(function (c) { return '<span class="t-ok">✓</span> ' + esc(c); }); }
    },
    contact: {
      desc: "how to reach me",
      run: function () {
        return [row("email   ", link("mailto:" + T.email, T.email)),
                row("linkedin", link(T.linkedin, "/in/roushan-kumar", true)),
                row("github  ", link(T.github, "dev-rkSharma", true))];
      }
    },
    resume: {
      desc: "download the résumé (PDF)",
      run: function () {
        var a = document.createElement("a");
        a.href = T.resume; a.download = ""; document.body.appendChild(a); a.click(); a.remove();
        return ['<span class="t-ok">downloading</span> ' + link(T.resume, "Roushan-Kumar-Resume.pdf")];
      }
    },
    open: {
      desc: "open a page: home · projects · about · contacts",
      run: function (args) {
        var pages = { home: HOME || "index.html", projects: "projects.html", about: "about.html", contacts: "contacts.html" };
        var dest = pages[args[0]];
        if (!dest) return ['usage: open <span class="t-cmd">home|projects|about|contacts</span>'];
        window.setTimeout(function () { window.location.href = dest; }, 250);
        return ["opening " + esc(dest) + "…"];
      }
    },
    date: { desc: "local time in India", run: function () {
      return [new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" }) + " IST"];
    } },
    theme: { desc: "change the theme", run: function () { return ["dark. it's always dark here."]; } },
    clear: { desc: "clear the screen", run: function () { termOut.innerHTML = ""; return []; } },
    exit: { desc: "close the terminal", run: function () { window.setTimeout(closeTerm, 120); return []; } },
    sudo: { hidden: true, desc: "", run: function (args) {
      if (args.join(" ") === "hire-me" || args.join(" ") === "hire roushan") {
        return ['<span class="t-ok">[sudo]</span> permission granted.', "→ " + link("mailto:" + T.email + "?subject=Let%27s%20talk", "compose an email")];
      }
      return ['<span class="t-err">nice try.</span> try <span class="t-cmd">sudo hire-me</span>'];
    } },
    ls: { hidden: true, desc: "", run: function () { return ["about.md  journey/  projects/  skills.json  resume.pdf"]; } }
  };

  function print(lines, cls) {
    lines.forEach(function (line, i) {
      var p = el("p", "t-line" + (cls ? " " + cls : ""), line || "&nbsp;");
      if (!reduceMotion) p.style.animationDelay = (i * 28) + "ms";
      termOut.appendChild(p);
    });
    termOut.scrollTop = termOut.scrollHeight;
  }

  function runCmd(raw) {
    var input = raw.trim();
    print(['<span class="t-prompt">roushan@portfolio:~$</span> ' + esc(input)], "t-echo");
    if (!input) return;
    termHistory.push(input); termHistIdx = termHistory.length;
    var parts = input.toLowerCase().split(/\s+/), name = parts.shift();
    var cmd = CMDS[name];
    if (!cmd) { print(['<span class="t-err">command not found:</span> ' + esc(name) + ' — type <span class="t-cmd">help</span>']); return; }
    print(cmd.run(parts));
  }

  function buildTerm() {
    term = el("div", "term");
    term.hidden = true;
    term.innerHTML =
      '<div class="term__backdrop"></div>' +
      '<div class="term__win" role="dialog" aria-modal="true" aria-label="Terminal">' +
      '  <div class="term__bar"><span class="term__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '    <span class="term__title">roushan@portfolio — zsh</span>' +
      '    <button class="term__x" type="button" aria-label="Close terminal">esc</button></div>' +
      '  <div class="term__out" role="log" aria-live="polite"></div>' +
      '  <label class="term__row"><span class="t-prompt">roushan@portfolio:~$</span>' +
      '    <input class="term__in" type="text" autocomplete="off" spellcheck="false" aria-label="Terminal command"></label>' +
      "</div>";
    document.body.appendChild(term);
    termOut = term.querySelector(".term__out");
    termIn = term.querySelector(".term__in");
    term.querySelector(".term__backdrop").addEventListener("click", closeTerm);
    term.querySelector(".term__x").addEventListener("click", closeTerm);
    termIn.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); runCmd(termIn.value); termIn.value = ""; }
      else if (e.key === "Escape") { e.preventDefault(); closeTerm(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (termHistIdx > 0) termIn.value = termHistory[--termHistIdx]; }
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        termHistIdx = Math.min(termHistIdx + 1, termHistory.length);
        termIn.value = termHistory[termHistIdx] || "";
      } else if (e.key === "Tab") {
        e.preventDefault();
        var v = termIn.value.trim().toLowerCase();
        var hits = Object.keys(CMDS).filter(function (k) { return !CMDS[k].hidden && k.indexOf(v) === 0; });
        if (hits.length === 1) termIn.value = hits[0] + " ";
        else if (hits.length > 1) print([hits.join("  ")], "t-dim");
      }
    });
    term.querySelector(".term__win").addEventListener("click", function (e) {
      if (!e.target.closest("a, button")) termIn.focus();
    });
    print([
      '<span class="t-hl">roushan.sh</span> v2026 — interactive CV',
      'type <span class="t-cmd">help</span> to start, or try <span class="t-cmd">whoami</span>, <span class="t-cmd">journey</span>, <span class="t-cmd">skills</span>'
    ]);
  }

  function openTerm() {
    if (!term) buildTerm();
    termOpener = document.activeElement;
    term.hidden = false;
    document.body.classList.add("is-locked");
    window.setTimeout(function () { termIn.focus(); }, 0);
  }
  function closeTerm() {
    if (!term || term.hidden) return;
    term.hidden = true;
    document.body.classList.remove("is-locked");
    if (termOpener && termOpener.focus) termOpener.focus();
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "`" || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    term && !term.hidden ? closeTerm() : openTerm();
  });
  document.addEventListener("fx:terminal", openTerm);

  /* ---------- 5. Skills graph -------------------------------------------- */
  /* Built from the .skill-box markup (hubs = box headings, leaves = chips)
     plus the project cards on the page, linked by their tech tags. Plain 2D
     canvas + a tiny force simulation. Hovering lights a node's neighbourhood
     and the matching project cards / skill chips in the page; nodes can be
     dragged. The original diagram image stays as the no-JS fallback. */
  var figure = document.querySelector("#skills .section-figure");
  var boxes = $all("#skills .skill-box");
  if (figure && boxes.length && document.createElement("canvas").getContext) {
    var wrap = el("div", "sgraph");
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<canvas class="sgraph__canvas"></canvas>' +
      '<p class="sgraph__hint">drag the nodes · hover a skill to see where it was used</p>';
    figure.appendChild(wrap);
    figure.classList.add("has-graph");
    var cv = wrap.querySelector("canvas"), g = cv.getContext("2d");

    var nodes = [], links = [], byKey = {};
    var addNode = function (n) { n.i = nodes.length; n.x = 0; n.y = 0; n.vx = 0; n.vy = 0; nodes.push(n); return n; };
    var addLink = function (a, b, len) { links.push({ a: a, b: b, len: len }); a.adj = (a.adj || []).concat(b); b.adj = (b.adj || []).concat(a); };

    var HUE = ["199,120,221", "97,175,239", "86,182,194", "152,195,121", "229,192,123", "224,108,117", "171,178,191"];
    boxes.forEach(function (box, bi) {
      var head = box.querySelector(".skill-box__head");
      var hub = addNode({ kind: "hub", label: head.textContent.trim(), hue: HUE[bi % HUE.length], r: 15 });
      $all("li", box).forEach(function (li) {
        var ti = window.TechIcons && window.Path2D && window.TechIcons.get(li.textContent);
        var leaf = addNode({ kind: "leaf", label: li.textContent.trim(), hue: hub.hue, r: ti ? 10 : 5, chip: li,
                             icon: ti ? { brand: !!ti.brand, color: ti.color, paths: ti.d.map(function (d) { return new Path2D(d); }) } : null });
        byKey[leaf.label.toLowerCase()] = leaf;
        addLink(hub, leaf, 78);
      });
    });
    $all(".card").forEach(function (card) {
      var title = card.querySelector(".card__title");
      if (!title) return;
      // short label: the title up to its first "&", e.g. "Timeseries Analytics"
      var short = title.textContent.split("&")[0].trim();
      var proj = addNode({ kind: "proj", label: short, hue: "255,255,255", r: 8, card: card });
      $all(".card__tech li", card).forEach(function (li) {
        var t = li.textContent.trim().toLowerCase();
        nodes.forEach(function (n) {
          if (n.kind !== "leaf") return;
          var l = n.label.toLowerCase();
          if (l === t || l.indexOf(t + " ") === 0 || t.indexOf(l + " ") === 0) addLink(proj, n, 150);
        });
      });
      if (!proj.adj) { nodes.pop(); }   // no matching skills: leave it out
    });

    var GW = 0, GH = 0;
    var sizeGraph = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      GW = wrap.clientWidth; GH = GW < 700 ? 540 : Math.max(Math.min(GW * 0.6, 560), 420);
      cv.style.height = GH + "px";
      cv.width = Math.round(GW * dpr); cv.height = Math.round(GH * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeGraph();
    // seed: hubs on a ring, leaves around their hub, projects in the middle
    var hubs = nodes.filter(function (n) { return n.kind === "hub"; });
    hubs.forEach(function (h, i) {
      var a = (i / hubs.length) * Math.PI * 2;
      h.x = GW / 2 + Math.cos(a) * GW * 0.36; h.y = GH / 2 + Math.sin(a) * GH * 0.34;
    });
    nodes.forEach(function (n) {
      if (n.kind === "leaf") { var h = n.adj[0]; n.x = h.x + (Math.random() - 0.5) * 60; n.y = h.y + (Math.random() - 0.5) * 60; }
      if (n.kind === "proj") { n.x = GW / 2 + (Math.random() - 0.5) * 80; n.y = GH / 2 + (Math.random() - 0.5) * 80; }
    });

    var dragging = null, hover = null, energy = 1, running = false, inView = false;

    var step = function () {
      var i, j, a, b, dx, dy, d2, d, f;
      for (i = 0; i < nodes.length; i++) {          // repulsion
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = b.x - a.x; dy = b.y - a.y; d2 = dx * dx + dy * dy + 0.01;
          if (d2 > 250000) continue;
          f = (a.kind === "hub" && b.kind === "hub" ? 9000 : a.kind === "hub" || b.kind === "hub" ? 2600 : 1100) / d2;
          d = Math.sqrt(d2);
          a.vx -= dx / d * f; a.vy -= dy / d * f; b.vx += dx / d * f; b.vy += dy / d * f;
        }
      }
      links.forEach(function (l) {                  // springs
        dx = l.b.x - l.a.x; dy = l.b.y - l.a.y; d = Math.sqrt(dx * dx + dy * dy) || 1;
        f = (d - l.len) * 0.02;
        l.a.vx += dx / d * f; l.a.vy += dy / d * f; l.b.vx -= dx / d * f; l.b.vy -= dy / d * f;
      });
      energy = 0;
      nodes.forEach(function (n) {
        n.vx += (GW / 2 - n.x) * 0.0007; n.vy += (GH / 2 - n.y) * 0.0016;   // gravity (wide, not tall)
        if (n === dragging) { n.vx = n.vy = 0; return; }
        n.vx *= 0.82; n.vy *= 0.82;
        n.x = Math.min(Math.max(n.x + n.vx, 24), GW - 24);
        n.y = Math.min(Math.max(n.y + n.vy, 20), GH - 20);
        energy += Math.abs(n.vx) + Math.abs(n.vy);
      });
    };

    var lit = function (n) {
      if (!hover) return true;
      if (n === hover) return true;
      if (hover.adj && hover.adj.indexOf(n) !== -1) return true;
      // a leaf's projects' other skills stay dim; a project's skills also light their hub
      if (hover.kind === "proj" && n.kind === "hub") return hover.adj.some(function (l) { return l.adj.indexOf(n) !== -1; });
      return false;
    };

    var draw = function () {
      g.clearRect(0, 0, GW, GH);
      links.forEach(function (l) {
        var on = hover && lit(l.a) && lit(l.b) && (l.a === hover || l.b === hover || hover.kind === "proj");
        g.strokeStyle = on ? "rgba(" + (l.a.kind === "proj" ? l.b.hue : l.a.hue) + ",0.85)" : "rgba(171,178,191," + (hover ? 0.06 : 0.16) + ")";
        g.lineWidth = on ? 1.6 : 1;
        if (l.a.kind === "proj") g.setLineDash([3, 4]);
        g.beginPath(); g.moveTo(l.a.x, l.a.y); g.lineTo(l.b.x, l.b.y); g.stroke();
        g.setLineDash([]);
      });
      nodes.forEach(function (n) {
        var on = lit(n), al = on ? 1 : 0.22;
        if (n.kind === "hub" || n === hover) {
          var halo = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
          halo.addColorStop(0, "rgba(" + n.hue + "," + (0.28 * al) + ")"); halo.addColorStop(1, "rgba(" + n.hue + ",0)");
          g.fillStyle = halo; g.beginPath(); g.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = n.kind === "proj" ? "rgba(40,44,51," + al + ")" : "rgba(" + n.hue + "," + al + ")";
        g.strokeStyle = "rgba(" + n.hue + "," + al + ")";
        g.lineWidth = n.kind === "proj" ? 2 : 1;
        g.beginPath();
        if (n.kind === "proj") { g.rect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2); } else { g.arc(n.x, n.y, n.r, 0, Math.PI * 2); }
        if (n.icon) {
          // icon badge: dark disc, hue ring, logo/line icon inside
          g.fillStyle = "rgba(30,33,39," + al + ")";
          g.fill(); g.stroke();
          g.save();
          g.globalAlpha = al;
          g.translate(n.x - n.r * 0.68, n.y - n.r * 0.68);
          g.scale(n.r * 1.36 / 24, n.r * 1.36 / 24);
          n.icon.paths.forEach(function (p2) {
            if (n.icon.brand) { g.fillStyle = n.icon.color; g.fill(p2); }
            else { g.strokeStyle = "rgb(" + n.hue + ")"; g.lineWidth = 2; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(p2); }
          });
          g.restore();
        } else {
          g.fill(); g.stroke();
        }
        // labels — on narrow screens leaf labels only show when highlighted
        if (n.kind === "leaf" && GW < 700 && !(hover && on)) return;
        var big = n.kind !== "leaf";
        g.font = (big ? "600 12px" : "11px") + " 'IBM Plex Mono', monospace";
        g.textBaseline = "middle";
        g.fillStyle = "rgba(" + (n.kind === "leaf" ? "171,178,191" : "255,255,255") + "," + (on ? (n.kind === "leaf" ? 0.85 : 1) : 0.25) + ")";
        var label = n.label.length > 30 ? n.label.slice(0, 29) + "…" : n.label;
        // near the right edge the label goes on the node's left so it isn't clipped
        var flip = n.x + n.r + 6 + g.measureText(label).width > GW - 8;
        g.textAlign = flip ? "right" : "left";
        g.fillText(label, flip ? n.x - n.r - 6 : n.x + n.r + 6, n.y);
        g.textAlign = "left";
      });
    };

    var loop = function () {
      if (!inView) { running = false; return; }
      step(); draw();
      if (energy > 0.15 || dragging) raf(loop); else running = false;
    };
    var wake = function () { energy = 1; if (!running && inView) { running = true; raf(loop); } };

    if (reduceMotion) { for (var k = 0; k < 400; k++) step(); }

    var nodeAt = function (x, y) {
      var best = null, bd = 18 * 18;
      nodes.forEach(function (n) {
        var dx = n.x - x, dy = n.y - y, d = dx * dx + dy * dy;
        if (d < Math.max(bd, n.r * n.r)) { bd = d; best = n; }
      });
      return best;
    };
    var setHover = function (n) {
      if (n === hover) return;
      hover = n;
      cv.style.cursor = n ? (dragging ? "grabbing" : "grab") : "default";
      // mirror the highlight onto the real page
      $all(".card.is-graph-lit, .skill-box__body li.is-graph-lit").forEach(function (x) { x.classList.remove("is-graph-lit"); });
      if (n) nodes.forEach(function (m) {
        if (!lit(m)) return;
        if (m.card) m.card.classList.add("is-graph-lit");
        if (m.chip) m.chip.classList.add("is-graph-lit");
      });
      draw();
    };
    var local = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    cv.addEventListener("pointerdown", function (e) {
      var p = local(e), n = nodeAt(p.x, p.y);
      if (!n) return;
      dragging = n; cv.setPointerCapture(e.pointerId); setHover(n); cv.style.cursor = "grabbing"; wake();
    });
    cv.addEventListener("pointermove", function (e) {
      var p = local(e);
      if (dragging) { dragging.x = p.x; dragging.y = p.y; wake(); return; }
      setHover(nodeAt(p.x, p.y));
    });
    var release = function () { if (dragging) { dragging = null; cv.style.cursor = hover ? "grab" : "default"; wake(); } };
    cv.addEventListener("pointerup", release);
    cv.addEventListener("pointercancel", release);
    cv.addEventListener("pointerleave", function () { if (!dragging) setHover(null); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) { draw(); wake(); } }).observe(wrap);
    } else { inView = true; wake(); }
    window.addEventListener("resize", function () { sizeGraph(); wake(); draw(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    draw();
  }
})();
