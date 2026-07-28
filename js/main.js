/* ==========================================================================
   Portfolio — behaviour
   No dependencies. Everything here is progressive enhancement: with JS
   disabled the page still renders and scrolls correctly.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- EDIT: rotating quotes -------------------------------------
     Add more entries and they'll cycle every 8s. Leave one entry (or none)
     and the quote in index.html stays exactly as written.
     -------------------------------------------------------------------- */
  var QUOTES = [
    { text: "In God we trust, all others must bring data.", author: "W. Edwards Deming" },
    { text: "With great power comes great electricity bill", author: "Dr. Who" }
  ];

  var ROTATE_MS = 8000;

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
        navLinks.forEach(function (l) { l.classList.remove("is-active"); });
        link.classList.add("is-active");
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    watched.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- 3. Reveal sections on scroll ----------------------------- */
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
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    document.querySelectorAll(".reveal").forEach(function (el) {
      revealer.observe(el);
    });
  }

  /* ---------- 4. Quote rotation --------------------------------------- */
  var quoteText = document.getElementById("quote-text");
  var quoteAuthor = document.getElementById("quote-author");

  if (quoteText && quoteAuthor && QUOTES.length > 1) {
    var idx = 0;

    setInterval(function () {
      // pause while the tab is hidden
      if (document.hidden) return;

      idx = (idx + 1) % QUOTES.length;
      var q = QUOTES[idx];

      if (reduceMotion) {
        quoteText.textContent = q.text;
        quoteAuthor.textContent = q.author;
        return;
      }

      var box = quoteText.closest(".quote");
      box.style.transition = "opacity 300ms ease";
      box.style.opacity = "0";

      setTimeout(function () {
        quoteText.textContent = q.text;
        quoteAuthor.textContent = q.author;
        box.style.opacity = "1";
      }, 300);
    }, ROTATE_MS);
  }

  /* ---------- 5. Footer year ------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
