/* Skills: one view at a time (tree or list) plus a compact explorer.
   Badges: track filters over a single grid of course completions. */
(function () {
  'use strict';
  var skills = document.getElementById('skills');
  if (skills) {
    var figure = skills.querySelector('.section-figure');
    var list = skills.querySelector('.skills');
    var explorer = skills.querySelector('.work-explorer');
    var chips = Array.prototype.slice.call(skills.querySelectorAll('.skill-box__body li'));

    if (figure && list) {
      var bar = document.createElement('div');
      bar.className = 'skill-views';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Skills view');
      var views = { tree: 'Skill tree', list: 'Skill list' }, buttons = {};
      Object.keys(views).forEach(function (key) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = views[key];
        b.addEventListener('click', function () { show(key); });
        buttons[key] = b;
        bar.appendChild(b);
      });
      figure.before(bar);
      // the explorer reads best after whichever view is showing
      if (explorer) list.after(explorer);

      var show = function (key) {
        figure.classList.toggle('is-view-hidden', key !== 'tree');
        list.classList.toggle('is-view-hidden', key !== 'list');
        Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-pressed', String(k === key)); });
        // the canvas sizes itself on resize; it may have been measured while hidden
        if (key === 'tree') window.dispatchEvent(new Event('resize'));
      };
      show(matchMedia('(max-width: 699px)').matches ? 'list' : 'tree');
    }

    // skill chips pick a skill, like tapping a node in the tree
    var pick = function (label) { document.dispatchEvent(new CustomEvent('portfolio:skill-select', { detail: { label: label } })); };
    chips.forEach(function (li) {
      var label = li.textContent.trim();
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.addEventListener('click', function () {
        pick(window.portfolioSelectedSkill === label ? '' : label);
        if (explorer) explorer.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
      });
    });

    // the explorer stays a compact prompt until a skill is chosen
    var status = explorer && explorer.querySelector('.work-explorer__status');
    var sync = function (label) {
      chips.forEach(function (li) { li.classList.toggle('is-selected', !!label && li.textContent.trim() === label); });
      if (!explorer) return;
      explorer.classList.toggle('is-idle', !label);
      if (!label && status) status.textContent = 'Pick a skill here, tap a node in the tree, or click a skill to see the projects behind it.';
    };
    document.addEventListener('portfolio:skill-select', function (e) { sync(e.detail.label || ''); });
    sync(window.portfolioSelectedSkill || '');
  }

  var board = document.querySelector('[data-badge-board]');
  if (board) {
    var tracks = board.querySelector('.badge-tracks');
    var tiles = Array.prototype.slice.call(board.querySelectorAll('.badge-grid > li'));
    tracks.hidden = false;
    tracks.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-track]');
      if (!btn) return;
      var track = btn.dataset.track;
      tracks.querySelectorAll('[data-track]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      tiles.forEach(function (li) { li.hidden = track !== 'all' && li.dataset.track !== track; });
    });
  }
})();
