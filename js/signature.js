/* Signature: the ontology thread.
   Every main section heading becomes an "object" node — OBJECT 0N · NAME — and one
   thin line threads them down the page gutter. The line fills with scroll and the
   node of the section in view lights up. Labels are decorative (aria-hidden); the
   headings themselves are unchanged for assistive tech. */
(function () {
  'use strict';
  var main = document.querySelector('main');
  if (!main) return;
  var NAMES = { projects: 'Projects', skills: 'Skills', experience: 'Experience', badges: 'Badges', 'about-me': 'About', contacts: 'Contact' };
  var sections = Array.prototype.filter.call(main.querySelectorAll('.section[id]'), function (s) {
    return NAMES[s.id] && s.querySelector('.section-head');
  });
  if (!sections.length) return;

  var objects = sections.map(function (section, i) {
    var head = section.querySelector('.section-head');
    var label = document.createElement('p');
    label.className = 'sig-label';
    label.setAttribute('aria-hidden', 'true');
    label.innerHTML = '<span class="sig-label__id">Object ' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
      '<span class="sig-label__sep">&middot;</span><span class="sig-label__name">' + NAMES[section.id] + '</span>';
    head.before(label);
    return { section: section, label: label, node: null };
  });

  var thread = document.createElement('div');
  thread.className = 'sig-thread';
  thread.setAttribute('aria-hidden', 'true');
  thread.innerHTML = '<span class="sig-thread__line"></span><span class="sig-thread__fill"></span>';
  objects.forEach(function (o) {
    o.node = document.createElement('span');
    o.node.className = 'sig-thread__node';
    thread.appendChild(o.node);
  });
  document.body.appendChild(thread);
  var fill = thread.querySelector('.sig-thread__fill');

  var top = 0, span = 1, frame = 0, active = -1;
  // positions are in page coordinates (the thread hangs off <body>)
  var measure = function () {
    var first = objects[0].label.getBoundingClientRect();
    var x = first.left + scrollX - 34;
    // only when the gutter has room beside the fixed social dock
    var room = first.left - 34 >= 72;
    thread.hidden = !room;
    document.documentElement.classList.toggle('has-sig-thread', room);
    if (!room) return;
    var ys = objects.map(function (o) { var r = o.label.getBoundingClientRect(); return r.top + scrollY + r.height / 2; });
    top = ys[0]; span = Math.max(1, ys[ys.length - 1] - ys[0]);
    thread.style.left = x + 'px';
    thread.style.top = top + 'px';
    thread.style.height = span + 'px';
    objects.forEach(function (o, i) { o.node.style.top = (ys[i] - top) + 'px'; });
    update();
  };
  var update = function () {
    frame = 0;
    var mid = innerHeight * 0.45;
    if (!thread.hidden) fill.style.transform = 'scaleY(' + Math.min(1, Math.max(0, (mid + scrollY - top) / span)).toFixed(4) + ')';
    var now = -1;
    objects.forEach(function (o, i) { if (o.section.getBoundingClientRect().top <= mid) now = i; });
    if (now === active) return;
    active = now;
    objects.forEach(function (o, i) {
      o.label.classList.toggle('is-active', i === now);
      o.label.classList.toggle('is-passed', i < now);
      o.node.classList.toggle('is-active', i === now);
      o.node.classList.toggle('is-passed', i < now);
    });
  };
  var schedule = function () { if (!frame) frame = requestAnimationFrame(update); };
  var remeasure = function () { cancelAnimationFrame(frame); frame = 0; measure(); };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', remeasure);
  addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  // images, the journey canvas and late enhancements change section heights
  if ('ResizeObserver' in window) {
    var pending = 0;
    new ResizeObserver(function () { if (!pending) pending = requestAnimationFrame(function () { pending = 0; measure(); }); }).observe(main);
  }
  measure();
})();
