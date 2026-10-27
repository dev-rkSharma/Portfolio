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

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduceMotion = motionPreference.matches;
  motionPreference.addEventListener('change', function () { reduceMotion = motionPreference.matches; });
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
      pill.style.width = r.width.toFixed(1) + "px";
      pill.style.height = r.height.toFixed(1) + "px";
      pill.style.transform = "translate(" + (r.left - lr.left).toFixed(1) + "px," + (r.top - lr.top).toFixed(1) + "px)";
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

  /* ---------- 3. Project detail view ------------------------------------ */
  /* Clicking a project card opens a full-screen detail page in a <dialog>:
     sticky bar with prev/next, hero, the architecture diagram, overview,
     contributions as a checklist and a facts sidebar. Everything shown is
     read from the card itself — nothing invented. The URL becomes
     #project/<slug> so a detail page can be linked to directly. */
  var cards = $all(".card");
  if (cards.length && window.HTMLDialogElement) {
    var GROUPS = {
      case: { label: "Client case study", crumb: "Case study", conf: "Client work · NDA-safe" },
      personal: { label: "Personal project", crumb: "Personal", conf: "Personal project" },
      additional: { label: "Additional work", crumb: "Additional", conf: "" }
    };
    var ARROW_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    var ARROW_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
    var dlg = el("dialog", "pd");
    dlg.setAttribute("aria-labelledby", "pd-title");
    dlg.innerHTML =
      '<div class="pd__scroll">' +
      '  <header class="pd__bar">' +
      '    <button class="pd__back" type="button" data-pd-close aria-label="All projects">' + ARROW_L + '<span>All projects</span></button>' +
      '    <p class="pd__crumbs"><span>Projects</span><span class="pd__crumb-sep" aria-hidden="true">/</span><span data-pd-crumb></span></p>' +
      '    <div class="pd__pager">' +
      '      <span class="pd__count" data-pd-count></span>' +
      '      <button class="pd__nav" type="button" data-pd-prev aria-label="Previous project">' + ARROW_L + '</button>' +
      '      <button class="pd__nav" type="button" data-pd-next aria-label="Next project">' + ARROW_R + '</button>' +
      '      <button class="pd__close" type="button" data-pd-close aria-label="Close project">' +
      '        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '    </div>' +
      '    <span class="pd__read" aria-hidden="true"></span>' +
      '  </header>' +
      '  <article class="pd__page">' +
      '    <div class="pd__opening">' +
      '    <header class="pd__hero">' +
      '      <span class="pd__watermark" aria-hidden="true" data-pd-index></span>' +
      '      <p class="pd__series">Selected work <span aria-hidden="true">/</span> Project dossier</p>' +
      '      <p class="pd__eyebrow"><span class="pd__kind" data-pd-kind></span><span class="pd__state" data-pd-state hidden></span></p>' +
      '      <h2 class="pd__title" id="pd-title"></h2>' +
      '      <p class="pd__premise" data-pd-premise hidden></p>' +
      '      <ul class="pd__tech card__tech" aria-label="Technologies"></ul>' +
      '      <div class="pd__signature"><span class="pd__signature-mark" aria-hidden="true">RK</span><span>Engineering portfolio<br><strong>Roushan Kumar</strong></span></div>' +
      '    </header>' +
      '    <figure class="pd__figure">' +
      '      <div class="pd__figbar"><span class="pd__figlabel"><i></i><i></i><i></i>System architecture</span>' +
      '        <button class="pd__zoom" type="button" aria-pressed="false" aria-controls="pd-diagram">Zoom in</button></div>' +
      '      <div class="pd__diagram" id="pd-diagram" tabindex="0" role="region" aria-label="Project architecture diagram"></div>' +
      '      <figcaption class="pd__caption">Zoom in, then drag to pan across the workflow.</figcaption>' +
      '    </figure>' +
      '    </div>' +
      '    <div class="pd__layout">' +
      '      <div class="pd__main"></div>' +
      '      <aside class="pd__aside" aria-label="Project facts">' +
      '        <nav class="pd__contents" aria-label="In this project"><p class="pd__aside-title">In this project</p><div data-pd-contents></div></nav>' +
      '        <div class="pd__facts"><p class="pd__aside-title">Project facts</p><dl></dl></div>' +
      '        <div class="pd__cta"><p>Want the implementation detail behind this, or something similar built?</p>' +
      '          <a class="btn btn--primary" href="#contacts" data-pd-discuss>Discuss this project <span aria-hidden="true">&#8594;</span></a></div>' +
      '      </aside>' +
      '    </div>' +
      '    <nav class="pd__next" aria-label="More projects">' +
      '      <button class="pd__next-card" type="button" data-pd-next-card>' +
      '        <span class="pd__next-preview" aria-hidden="true"></span>' +
      '        <span class="pd__next-label">Next project</span>' +
      '        <span class="pd__next-title" data-pd-next-title></span>' +
      '        <span class="pd__next-arrow" aria-hidden="true">' + ARROW_R + '</span>' +
      '      </button>' +
      '    </nav>' +
      '  </article>' +
      '</div>';
    document.body.appendChild(dlg);

    var scroller = dlg.querySelector(".pd__scroll");
    var page = dlg.querySelector(".pd__page");
    var diagram = dlg.querySelector(".pd__diagram");
    var zoomBtn = dlg.querySelector(".pd__zoom");
    var readBar = dlg.querySelector(".pd__read");
    var edgeProgress=el('span','pd__reading-progress');edgeProgress.setAttribute('aria-hidden','true');dlg.querySelector('.pd__bar').appendChild(edgeProgress);
    var seenSections=new WeakSet();
    var chapterObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting||seenSections.has(entry.target))return;seenSections.add(entry.target);if(!reduceMotion)entry.target.animate([{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'none'}],{duration:550,easing:'cubic-bezier(.16,1,.3,1)'});});},{root:scroller,threshold:.12});
    var markChapter = function () {
      var sections = $all('.pd__section', dlg), active = 0;
      var boundary = dlg.querySelector('.pd__bar').getBoundingClientRect().bottom + 145;
      if (dlg.open) sections.forEach(function(section, i) { if (section.getBoundingClientRect().top <= boundary) active = i; });
      sections.forEach(function(section,i){section.classList.toggle('is-reading',i===active);});
      edgeProgress.style.setProperty('--read-progress',String(scroller.scrollTop/Math.max(1,scroller.scrollHeight-scroller.clientHeight)));
      $all('.pd__jump', dlg).forEach(function(button, i) {
        if (i === active) button.setAttribute('aria-current', 'location');
        else button.removeAttribute('aria-current');
      });
    };
    var list = cards, index = 0, openedFrom = null, prevHash = "", swapping = false, afterClose = null;
    var detailOpener = null;

    var slug = function (card) {
      if (card.id) return card.id;
      var t = (card.querySelector(".card__title") || {}).textContent || "project";
      return t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var text = function (card, sel) { var n = card.querySelector(sel); return n ? n.textContent.trim() : ""; };
    // the body of a "<strong>Label:</strong> text" paragraph, without the label
    var bodyOf = function (n) {
      var c = n.cloneNode(true), s = c.querySelector("strong");
      if (s) s.remove();
      return c.textContent.replace(/\s+/g, " ").trim();
    };
    // "A, B, and C." -> ["A", "B", "C"]; commas inside brackets are kept
    var items = function (s) {
      return s.replace(/\.$/, "").split(/,\s+(?![^()]*\))/).map(function (x) {
        x = x.replace(/^and\s+/i, "").trim();
        return x.charAt(0).toUpperCase() + x.slice(1);
      }).filter(Boolean);
    };

    var setZoom = function (on) {
      diagram.classList.toggle("is-zoomed", on);
      zoomBtn.setAttribute("aria-pressed", String(on));
      zoomBtn.textContent = on ? "Fit to view" : "Zoom in";
      if (!on) diagram.scrollTop = diagram.scrollLeft = 0;
    };
    zoomBtn.addEventListener("click", function () { setZoom(!diagram.classList.contains("is-zoomed")); });
    // drag to pan the zoomed diagram
    var pan = null;
    diagram.addEventListener("pointerdown", function (e) {
      if (!diagram.classList.contains("is-zoomed") || e.pointerType !== "mouse") return;
      pan = { x: e.clientX, y: e.clientY, l: diagram.scrollLeft, t: diagram.scrollTop };
      diagram.setPointerCapture(e.pointerId);
      diagram.classList.add("is-panning");
    });
    diagram.addEventListener("pointermove", function (e) {
      if (!pan) return;
      diagram.scrollLeft = pan.l - (e.clientX - pan.x);
      diagram.scrollTop = pan.t - (e.clientY - pan.y);
    });
    ["pointerup", "pointercancel"].forEach(function (t) {
      diagram.addEventListener(t, function () { pan = null; diagram.classList.remove("is-panning"); });
    });

    var render = function (card) {
      var group = GROUPS[card.dataset.group] || { label: "Project", crumb: "Project", conf: "" };
      var title = text(card, ".card__title");
      var storyArt = card.querySelector('.card__media img');
      var storyKey = storyArt && storyArt.getAttribute('src').match(/project-(\d+)/);
      var story = window.PORTFOLIO_STORIES && storyKey && window.PORTFOLIO_STORIES[storyKey[1]];
      dlg.dataset.storyTheme = story ? story.theme : 'default';
      var status = text(card, ".card__status");
      var state = status ? status.split("·").pop().trim() : "";
      var n = list.indexOf(card) + 1;

      dlg.style.setProperty("--project-accent", getComputedStyle(card).getPropertyValue("--project-accent") || "#b49aff");
      dlg.style.setProperty("--project-tint", getComputedStyle(card).getPropertyValue("--project-tint") || "#b49aff20");
      dlg.querySelector("[data-pd-crumb]").textContent = group.crumb + " " + pad(n);
      dlg.querySelector("[data-pd-count]").innerHTML = pad(n) + '<span aria-hidden="true"> / </span><span class="sr-only"> of </span>' + pad(list.length);
      dlg.querySelector("[data-pd-index]").textContent = pad(n);
      dlg.querySelector("[data-pd-kind]").textContent = group.label;
      var stateEl = dlg.querySelector("[data-pd-state]");
      stateEl.textContent = state;
      stateEl.hidden = !state;
      dlg.querySelector(".pd__title").textContent = title;
      var premise = dlg.querySelector('[data-pd-premise]');
      premise.hidden = !story; premise.textContent = story ? story.short : '';
      dlg.querySelector('.pd__series').firstChild.textContent = story ? story.discipline + ' ' : 'Selected work ';
      dlg.querySelector(".pd__tech").innerHTML = (card.querySelector(".card__tech") || { innerHTML: "" }).innerHTML;

      var art = card.querySelector(".card__media img, .card__media svg");
      diagram.replaceChildren();
      if (art) {
        var copy = art.cloneNode(true);
        if (copy.tagName === "IMG") copy.loading = "eager";
        diagram.appendChild(copy);
      }
      setZoom(false);

      var html = "";
      var desc = card.querySelector(".card__desc");
      if (story) html += '<section class="pd__section"><h3 class="pd__h">Context</h3><p class="pd__lead">' + esc(story.context) + '</p></section>';
      else if (desc) html += '<section class="pd__section"><h3 class="pd__h">Overview</h3><p class="pd__lead">' + desc.innerHTML + "</p></section>";
      if (story) html += '<section class="pd__section"><h3 class="pd__h">Implementation choices</h3><ol class="pd__decisions">' + story.choices.map(function(choice) { return '<li><h4>' + esc(choice[0]) + '</h4><p>' + esc(choice[1]) + '</p></li>'; }).join('') + '</ol></section>';
      var contrib = card.querySelector(".card__contribution");
      if (contrib) {
        var parts = items(bodyOf(contrib));
        html += '<section class="pd__section"><h3 class="pd__h">My contribution</h3>' + (parts.length > 1
          ? '<ul class="pd__checks">' + parts.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>"
          : '<p class="pd__p">' + esc(bodyOf(contrib)) + "</p>") + "</section>";
      }
      var flow = card.querySelector(".card__workflow");
      if (flow) html += '<section class="pd__section pd__section--note"><h3 class="pd__h">Current workflow</h3><p class="pd__p">' + esc(bodyOf(flow)) + "</p></section>";
      if (story) html += '<section class="pd__section pd__section--outcome"><h3 class="pd__h">' + (card.dataset.group === 'personal' ? 'Current build' : 'Delivered capability') + '</h3><p class="pd__p">' + esc(story.result) + '</p>' + (story.boundary ? '<p class="pd__evidence">' + esc(story.boundary) + '</p>' : '') + '</section>';
      var nda = card.querySelector(".card__nda");
      if (nda) html += '<p class="pd__nda">' + nda.innerHTML + "</p>";
      dlg.querySelector(".pd__main").innerHTML = html;
      var chapters = $all('.pd__section', dlg.querySelector('.pd__main'));
      dlg.querySelector('[data-pd-contents]').replaceChildren();
      chapters.forEach(function(section, i) {
        section.id = 'pd-chapter-' + (i + 1);
        var number = el('span', 'pd__chapter-number');
        number.textContent = pad(i + 1);
        number.setAttribute('aria-hidden', 'true');
        section.prepend(number);
        var jump = el('button', 'pd__jump');
        jump.type = 'button';
        jump.dataset.pdChapter = section.id;
        var count = el('span');count.textContent = pad(i + 1);
        var label = el('span');label.textContent = section.querySelector('.pd__h').textContent;
        jump.append(count, label);
        dlg.querySelector('[data-pd-contents]').appendChild(jump);
      });

      var facts = [["Category", group.label], ["Platform", "Palantir Foundry"]];
      if (state) facts.push(["Status", state]);
      if (group.conf) facts.push(["Confidentiality", group.conf]);
      facts.push(["Stack", $all(".card__tech li", card).length + " technologies"]);
      dlg.querySelector(".pd__facts dl").innerHTML = facts.map(function (f) {
        return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>";
      }).join("");

      var next = list[(list.indexOf(card) + 1) % list.length];
      dlg.querySelector("[data-pd-next-title]").textContent = text(next, ".card__title");
      var preview = dlg.querySelector('.pd__next-preview');
      preview.replaceChildren();
      var nextArt = next.querySelector('.card__media img, .card__media svg');
      if (nextArt) {
        var thumbnail = nextArt.cloneNode(true);
        if (thumbnail.tagName === 'IMG') { thumbnail.alt = ''; thumbnail.loading = 'lazy'; }
        preview.appendChild(thumbnail);
      }
      dlg.querySelector(".pd__next").hidden = list.length < 2;
      dlg.querySelector("[data-pd-prev]").disabled = list.length < 2;
      dlg.querySelector("[data-pd-next]").disabled = list.length < 2;
      history.replaceState(null, "", "#project/" + slug(card));
      scroller.scrollTop = 0;
      chapterObserver.disconnect();$all('.pd__section',dlg).forEach(function(section){chapterObserver.observe(section);});
      readBar.style.setProperty("--read", "0");
      markChapter();
    };

    var enter = function () {
      if (reduceMotion || !page.animate) return;
      $all(".pd__hero > *, .pd__figure, .pd__layout", page).forEach(function (n, i) {
        n.animate([{ opacity: 0, transform: "translate3d(0,18px,0)" }, { opacity: 1, transform: "none" }],
          { duration: 340, delay: i * 25, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      });
    };

    var go = function (dir) {
      if (swapping || list.length < 2) return;
      index = (index + dir + list.length) % list.length;
      var card = list[index];
      if (reduceMotion || !page.animate) { render(card); return; }
      swapping = true;
      var out = page.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translate3d(" + (-24 * dir) + "px,0,0)" }],
        { duration: 140, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" });
      out.onfinish = function () {
        render(card);
        out.cancel();
        page.animate([{ opacity: 0, transform: "translate3d(" + (32 * dir) + "px,0,0)" }, { opacity: 1, transform: "none" }],
          { duration: 280, easing: "cubic-bezier(.16,1,.3,1)" }).onfinish = function () { swapping = false; };
      };
    };

    var openCase = function (card, opener) {
      detailOpener = opener || null;
      // follow the rail's current filter, in rail order
      list = cards.filter(function (c) { return !c.hidden; });
      if (list.indexOf(card) < 0) list = cards;
      index = list.indexOf(card);
      openedFrom = card;
      if (!dlg.open) prevHash = /^#project\//.test(location.hash) ? "#projects" : location.hash;
      render(card);
      if (!dlg.open) {
        dlg.showModal();
        document.body.classList.add("is-locked");
        if (!reduceMotion && scroller.animate) {
          scroller.animate([{ opacity: 0, transform: "translate3d(0,32px,0) scale(.985)" }, { opacity: 1, transform: "none" }],
            { duration: 300, easing: "cubic-bezier(.16,1,.3,1)" });
        }
        enter();
        dlg.querySelector(".pd__back").focus({ preventScroll: true });
      }
    };

    var closeCase = function (after) {
      if (!dlg.open || dlg.classList.contains("is-closing")) return;
      dlg.classList.add("is-closing");
      afterClose = typeof after === "function" ? after : null;
      var done = function () {
        dlg.classList.remove("is-closing");
        dlg.close();
      };
      if (reduceMotion || !scroller.animate) { done(); return; }
      scroller.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translate3d(0,24px,0) scale(.99)" }],
        { duration: 180, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" }).onfinish = function () {
        done();
        scroller.getAnimations().forEach(function (a) { a.cancel(); });
      };
    };

    dlg.addEventListener("close", function () {
      document.body.classList.remove("is-locked");
      var after = afterClose;
      afterClose = null;
      if (after) { after(); return; }
      history.replaceState(null, "", prevHash || location.pathname + location.search);
      // land back on the card you were reading last, wherever the pager left you
      var card = list[index] || openedFrom;
      if (detailOpener && detailOpener.isConnected) { detailOpener.focus({ preventScroll: true }); return; }
      if (card) {
        card.scrollIntoView({ block: "nearest", inline: "start" });
        card.focus({ preventScroll: true });
      }
    });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeCase(); });
    dlg.addEventListener("click", function (e) {
      var chapter = e.target.closest('[data-pd-chapter]');
      if (chapter) {
        var target = document.getElementById(chapter.dataset.pdChapter);
        if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
      }
      else if (e.target.closest("[data-pd-close]")) closeCase();
      else if (e.target.closest("[data-pd-prev]")) go(-1);
      else if (e.target.closest("[data-pd-next], [data-pd-next-card]")) go(1);
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest(".pd__diagram, input, textarea")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    dlg.querySelector("[data-pd-discuss]").addEventListener("click", function (e) {
      e.preventDefault();
      var title = dlg.querySelector(".pd__title").textContent;
      closeCase(function () {
        var draft = document.getElementById("contact-draft");
        if (draft && !draft.value.trim()) {
          draft.value = "Hi Roushan, I'd like to know more about “" + title + "”.";
          draft.dispatchEvent(new Event("input", { bubbles: true }));
        }
        var target = document.getElementById("contacts");
        if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        history.replaceState(null, "", "#contacts");
      });
    });

    var reading = false;
    scroller.addEventListener("scroll", function () {
      if (reading) return;
      reading = true;
      raf(function () {
        reading = false;
        var max = scroller.scrollHeight - scroller.clientHeight;
        readBar.style.setProperty("--read", max > 0 ? (scroller.scrollTop / max).toFixed(4) : "0");
        dlg.classList.toggle("is-scrolled", scroller.scrollTop > 8);
        markChapter();
      });
    }, { passive: true });

    cards.forEach(function (card) {
      var image = card.querySelector('.card__media img');
      var key = image && image.getAttribute('src').match(/project-(\d+)/);
      if (key) card.dataset.projectKey = key[1];
      card.classList.add("is-openable");
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      var t = card.querySelector(".card__title");
      if (t) card.setAttribute("aria-label", "Open project: " + t.textContent.trim());
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        openCase(card);
      });
      card.addEventListener("keydown", function (e) {
        if (e.target !== card) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCase(card); }
      });
    });

    document.addEventListener('portfolio:open-project', function(e) {
      var card = cards.filter(function(c) { return c.dataset.projectKey === String(e.detail.key); })[0];
      if (card) openCase(card, e.detail.opener);
    });

    // deep link: index.html#project/<slug> opens straight into the detail page
    var deep = location.hash.match(/^#project\/(.+)$/);
    if (deep) {
      var hit = cards.filter(function (c) { return slug(c) === decodeURIComponent(deep[1]); })[0];
      if (hit) setTimeout(function () { openCase(hit); }, 0);
    }
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
    email: "hey.roushan.k@gmail.com",
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
      "Finance OS (personal / in progress)",
      "AI-Generated Quarterly Reporting Platform",
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
          .concat(["", "→ " + link(HOME + "#projects", "View projects") + ' <span class="t-dim">(client work under NDA; personal projects marked)</span>']);
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
        var pages = { home: HOME + "#home", projects: HOME + "#projects", about: HOME + "#about-me", contacts: HOME + "#contacts" };
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
    var initializeGraph = function () {
    var wrap = el("div", "sgraph");
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<canvas class="sgraph__canvas"></canvas>' +
      '<p class="sgraph__hint">drag to move · tap a skill to explore its projects</p>';
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
        var leaf = addNode({ kind: "leaf", label: li.textContent.trim(), hue: hub.hue, r: ti ? 8 : 5, chip: li,
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
      var proj = addNode({ kind: "proj", label: short, hue: "180,154,255", r: 8, card: card });
      $all(".card__tech li", card).forEach(function (li) {
        var t = li.textContent.trim().toLowerCase();
        nodes.forEach(function (n) {
          if (n.kind !== "leaf") return;
          var l = n.label.toLowerCase();
          if (l === t || l.indexOf(t + " ") === 0 || t.indexOf(l + " ") === 0) addLink(proj, n, 150);
        });
      });
      if (window.portfolioSkillMatches) nodes.forEach(function(n) {
        if (n.kind === 'leaf' && window.portfolioSkillMatches(card,n.label) && (!proj.adj || proj.adj.indexOf(n) === -1)) addLink(proj,n,150);
      });
      if (!proj.adj) { nodes.pop(); }   // no matching skills: leave it out
    });

    // Tree: a "Skills" root -> category hubs -> skill leaves; projects hang off the skills they use.
    var root = addNode({ kind: "root", label: "Skills", hue: "180,154,255", r: 12 });
    nodes.forEach(function (n) {
      if (n.kind === "hub") { n.parent = root; addLink(root, n, 0); }
      if (n.kind === "leaf") n.parent = n.adj[0];
    });
    var treeHeight = function (w) {
      var leaves = nodes.filter(function (n) { return n.kind === "leaf"; }).length;
      var hubs = nodes.filter(function (n) { return n.kind === "hub"; }).length;
      return Math.max(440, leaves * (w < 700 ? 15 : 18) + hubs * 14 + 74);
    };
    var GW = 0, GH = 0;
    var sizeGraph = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var oldWidth = GW, oldHeight = GH;
      GW = wrap.clientWidth; GH = treeHeight(GW);
      if (oldWidth && oldHeight) nodes.forEach(function (n) {
        n.x *= GW / oldWidth; n.y *= GH / oldHeight;
      });
      cv.style.height = GH + "px";
      cv.width = Math.round(GW * dpr); cv.height = Math.round(GH * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeGraph();
    // label widths, for the overlap pass in step() and the edge flip in draw()
    var labelText = function (n) { return n.label.length > 30 ? n.label.slice(0, 29) + "…" : n.label; };
    var measure = function () {
      nodes.forEach(function (n) {
        g.font = (n.kind !== "leaf" ? "600 12px" : "12px") + " 'IBM Plex Mono', monospace";
        n.lw = g.measureText(labelText(n)).width;
      });
    };
    measure();
    // Left-to-right columns: root, categories, skills, projects. Each node
    // springs toward its slot (tx, ty); dragging pulls a node's subtree along.
    var layout = function () {
      var narrow = GW < 700, col = narrow ? [0, .07, .6, .9] : [.05, .2, .43, .74];
      var y = 24, leafGap = narrow ? 15 : 18;
      root.hidden = narrow;
      nodes.forEach(function (n) {
        if (n.kind !== "hub") return;
        var kids = n.adj.filter(function (m) { return m.kind === "leaf"; }), top = y;
        kids.forEach(function (m) { m.tx = GW * col[2]; m.ty = y; y += leafGap; });
        n.tx = Math.max(GW * col[1], n.r + 12); n.ty = (top + y - leafGap) / 2;
        y += 14;
      });
      var hubs = nodes.filter(function (n) { return n.kind === "hub"; });
      root.tx = GW * col[0] + 14; root.ty = hubs.reduce(function (t, h) { return t + h.ty; }, 0) / hubs.length;
      // projects in the order of the skills they use, to keep crossings down
      var projs = nodes.filter(function (n) { return n.kind === "proj"; });
      projs.forEach(function (n) { n.avg = n.adj.reduce(function (t, m) { return t + m.ty; }, 0) / n.adj.length; });
      projs.sort(function (a, b) { return a.avg - b.avg; });
      projs.forEach(function (n, i) { n.tx = GW * col[3]; n.ty = GH * (.12 + .76 * (projs.length > 1 ? i / (projs.length - 1) : .5)); });
    };
    layout();
    // the tree grows out of its root on first view
    nodes.forEach(function (n) {
      n.x = reduceMotion ? n.tx : root.tx + (n.tx - root.tx) * .15;
      n.y = reduceMotion ? n.ty : root.ty + (n.ty - root.ty) * .15;
    });

    var dragging = null, hover = null, selected = null, energy = 1, running = false, inView = false;

    var step = function () {
      energy = 0;
      nodes.forEach(function (n) {
        if (n === dragging) { n.vx = n.vy = 0; return; }
        var tx = n.tx, ty = n.ty, follow;
        // children follow their parent's displacement; projects follow their skills a little
        if (n.parent) { tx += (n.parent.x - n.parent.tx) * .85; ty += (n.parent.y - n.parent.ty) * .85; }
        else if (n.kind === "proj") {
          follow = n.adj.reduce(function (t, m) { t.x += m.x - m.tx; t.y += m.y - m.ty; return t; }, { x: 0, y: 0 });
          tx += follow.x / n.adj.length * .35; ty += follow.y / n.adj.length * .35;
        }
        n.vx = (n.vx + (tx - n.x) * .06) * .8;
        n.vy = (n.vy + (ty - n.y) * .06) * .8;
        n.x = Math.min(Math.max(n.x + n.vx, 12), GW - 12);
        n.y = Math.min(Math.max(n.y + n.vy, 12), GH - 12);
        energy += Math.abs(n.vx) + Math.abs(n.vy) + Math.abs(tx - n.x) * .02 + Math.abs(ty - n.y) * .02;
      });
    };

    var lit = function (n) {
      if (!hover || hover.kind === "root") return true;
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
        if (l.a.hidden) return;
        var p0 = l.a.x < l.b.x ? l.a : l.b, p1 = p0 === l.a ? l.b : l.a, cx = (p0.x + p1.x) / 2;
        g.beginPath(); g.moveTo(p0.x, p0.y); g.bezierCurveTo(cx, p0.y, cx, p1.y, p1.x, p1.y); g.stroke();
        g.setLineDash([]);
      });
      nodes.forEach(function (n) {
        var on = lit(n), al = on ? 1 : 0.22;
        if (n.hidden) return;
        if (n.kind === "hub" || n.kind === "root" || n === hover) {
          var halo = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
          halo.addColorStop(0, "rgba(" + n.hue + "," + (0.28 * al) + ")"); halo.addColorStop(1, "rgba(" + n.hue + ",0)");
          g.fillStyle = halo; g.beginPath(); g.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = n.kind === "proj" ? "rgba(26,22,40," + al + ")" : "rgba(" + n.hue + "," + al + ")";
        g.strokeStyle = "rgba(" + n.hue + "," + al + ")";
        g.lineWidth = n.kind === "proj" ? 2 : 1;
        g.beginPath();
        if (n.kind === "proj") {   // projects are diamonds
          g.moveTo(n.x, n.y - n.r * 1.25); g.lineTo(n.x + n.r * 1.25, n.y); g.lineTo(n.x, n.y + n.r * 1.25); g.lineTo(n.x - n.r * 1.25, n.y); g.closePath();
        } else { g.arc(n.x, n.y, n.r, 0, Math.PI * 2); }
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
        if ((n.kind === "leaf" || n.kind === "proj") && GW < 700 && !(hover && on)) return;
        var big = n.kind !== "leaf";
        g.font = (big ? "600 12px" : "12px") + " 'IBM Plex Mono', monospace";
        g.textBaseline = "middle";
        g.fillStyle = "rgba(" + (n.kind === "leaf" ? "203,210,226" : "255,255,255") + "," + (on ? (n.kind === "leaf" ? 0.85 : 1) : 0.25) + ")";
        var label = labelText(n);
        // near the right edge the label goes on the node's left so it isn't clipped
        var flip = n.x + n.r + 6 + g.measureText(label).width > GW - 8;
        g.textAlign = flip ? "right" : "left";
        g.fillText(label, flip ? n.x - n.r - 6 : n.x + n.r + 6, n.y);
        g.textAlign = "left";
      });
    };

    var loop = function () {
      if (!inView || document.hidden) { running = false; return; }
      step(); draw();
      if (energy > 0.15 || dragging) raf(loop); else running = false;
    };
    var wake = function () { energy = 1; if (!running && inView) { running = true; raf(loop); } };


    var nodeAt = function (x, y) {
      var best = null, bd = 18 * 18;
      nodes.forEach(function (n) {
        if (n.hidden) return;
        var dx = n.x - x, dy = n.y - y, d = dx * dx + dy * dy;
        if (d < Math.max(bd, n.r * n.r)) { bd = d; best = n; }
      });
      return best;
    };
    var setHover = function (n) {
      n = n || selected;
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
    document.addEventListener('portfolio:skill-select', function(e) {
      var label = (e.detail.label || '').toLowerCase();
      selected = byKey[label] || nodes.filter(function(n) { return n.label.toLowerCase() === label; })[0] || null;
      setHover(selected); draw();
    });
    var pressedAt = null;

    cv.addEventListener("pointerdown", function (e) {
      var p = local(e), n = nodeAt(p.x, p.y);
      if (!n) return;
      pressedAt = { x: p.x, y: p.y, node: n };
      dragging = n; cv.setPointerCapture(e.pointerId); setHover(n); cv.style.cursor = "grabbing"; wake();
    });
    cv.addEventListener("pointermove", function (e) {
      var p = local(e);
      if (dragging) { dragging.x = p.x; dragging.y = p.y; wake(); return; }
      setHover(nodeAt(p.x, p.y));
    });
    var release = function (e) {
      if (pressedAt && e.type === 'pointerup' && pressedAt.node.kind !== 'root') {
        var p = local(e), n = pressedAt.node;
        if (Math.hypot(p.x - pressedAt.x, p.y - pressedAt.y) < 6) {
          document.dispatchEvent(new CustomEvent(n.card ? 'portfolio:open-project' : 'portfolio:skill-select', { detail: n.card ? { key: n.card.dataset.projectKey, opener: n.card } : { label: n.label } }));
        }
      }
      pressedAt = null;
      if (dragging) { dragging = null; cv.style.cursor = hover ? 'grab' : 'default'; wake(); }
    };
    cv.addEventListener("pointerup", release);
    cv.addEventListener("pointercancel", release);
    cv.addEventListener("pointerleave", function () { if (!dragging) setHover(null); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) { draw(); wake(); } }).observe(wrap);
    } else { inView = true; wake(); }
    window.addEventListener("resize", function () { sizeGraph(); layout(); wake(); draw(); });
    document.addEventListener('visibilitychange', function() { if (!document.hidden) wake(); });
    motionPreference.addEventListener('change', function() { draw(); wake(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); wake(); draw(); });
    if (window.portfolioSelectedSkill) {
      var savedSkill = window.portfolioSelectedSkill.toLowerCase();
      selected = byKey[savedSkill] || nodes.filter(function(n) { return n.label.toLowerCase() === savedSkill; })[0] || null; setHover(selected);
    }
    draw();
    };
    if ('IntersectionObserver' in window) {
      var graphLoader = new IntersectionObserver(function(entries) {
        if (!entries.some(function(entry) { return entry.isIntersecting; })) return;
        graphLoader.disconnect(); initializeGraph();
      }, { rootMargin: '200px' });
      graphLoader.observe(figure);
    } else initializeGraph();
  }
})();
