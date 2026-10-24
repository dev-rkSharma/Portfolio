/* The network is decorative. Existing content and interactions work without it. */
(function () {
  'use strict';
  var visual = document.querySelector('.hero__visual');
  if (!visual) return;
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 520 520');
  svg.setAttribute('class', 'network');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  var points = [[70,160],[420,100],[460,320],[100,410],[260,35],[260,475]];
  var markup = '<circle class="network__orbit" cx="260" cy="260" r="177"/><circle class="network__orbit network__orbit--outer" cx="260" cy="260" r="230"/><ellipse class="network__orbit" cx="260" cy="260" rx="230" ry="100" transform="rotate(-35 260 260)"/>';
  points.forEach(function (p, i) {
    var path = 'M' + p[0] + ',' + p[1] + ' Q260,' + (i % 2 ? 100 : 420) + ' 260,260';
    markup += '<g class="network__group"><path class="network__line" d="' + path + '"/><path class="network__pulse" pathLength="100" style="animation-delay:-' + i + 's" d="' + path + '"/><circle class="network__node" cx="' + p[0] + '" cy="' + p[1] + '" r="12"/><circle class="network__core" cx="' + p[0] + '" cy="' + p[1] + '" r="3"/></g>';
  });
  markup += '<text class="network__label" x="310" y="47">CONNECTED INTELLIGENCE</text>';
  svg.innerHTML = markup;
  visual.prepend(svg);
  ['ONTOLOGY / CONNECTED', 'AIP / AGENTIC SYSTEMS'].forEach(function (label, i) {
    var tag = document.createElement('span');
    tag.className = 'orbit-tag orbit-tag--' + (i ? 'b' : 'a');
    tag.textContent = label;
    tag.setAttribute('aria-hidden', 'true');
    visual.appendChild(tag);
  });
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(hover: hover) and (pointer: fine)');
  var frame = 0;
  visual.addEventListener('pointermove', function (event) {
    if (motion.matches || !fine.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(function () {
      var rect = visual.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - .5;
      var y = (event.clientY - rect.top) / rect.height - .5;
      svg.style.transform = 'perspective(800px) rotateY(' + x * 9 + 'deg) rotateX(' + -y * 9 + 'deg)';
    });
  });
  function reset() { cancelAnimationFrame(frame); svg.style.transform = ''; }
  visual.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
  // Pause decorative loops when the hero is offscreen or the tab is hidden.
  var visible = true;
  function pause() {
    visual.querySelectorAll('.network__orbit--outer, .network__pulse, .orbit-tag').forEach(function (node) {
      node.style.animationPlayState = visible && !document.hidden ? 'running' : 'paused';
    });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; pause(); }).observe(visual);
  document.addEventListener('visibilitychange', pause);
})();
