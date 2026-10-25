(function () {
  'use strict';
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var tabs = Array.from(document.querySelectorAll('.about-tabs button'));
  var panels = Array.from(document.querySelectorAll('.about-panel'));
  if (tabs.length && panels.length) {
    var tablist = document.querySelector('.about-tabs');
    tablist.hidden = false;
    tablist.setAttribute('role', 'tablist');
    function activate(index, focus) {
      tabs.forEach(function (tab, i) {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus();
      if (!motion.matches && panels[index].animate) panels[index].animate([
        { opacity: .5, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }
      ], { duration: 220, easing: 'ease-out' });
    }
    tabs.forEach(function (tab, i) {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panels[i].id);
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', tab.id);
      panels[i].tabIndex = 0;
      tab.addEventListener('click', function () { activate(i, false); });
      tab.addEventListener('keydown', function (event) {
        var next = event.key === 'ArrowRight' ? (i + 1) % tabs.length :
          event.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length :
          event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
        if (next >= 0) { event.preventDefault(); activate(next, true); }
      });
    });
    activate(0, false);
  }
  var composer = document.querySelector('.contact-composer');
  if (!composer) return;
  composer.querySelectorAll('[data-enhance]').forEach(function (node) { node.hidden = false; });
  var topics = Array.from(composer.querySelectorAll('.contact-topic'));
  var draft = composer.querySelector('#contact-draft');
  var email = composer.querySelector('.contact-send');
  var hint = composer.querySelector('.contact-topic-hint');
  var subject = 'Let\u2019s discuss a project';
  function update() {
    var body = draft.value.trim();
    email.href = 'mailto:hey.roushan.k@gmail.com?subject=' + encodeURIComponent(subject) + (body ? '&body=' + encodeURIComponent(body) : '');
  }
  topics.forEach(function (button) {
    button.addEventListener('click', function () {
      topics.forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)); });
      subject = button.dataset.subject;
      hint.textContent = button.dataset.hint;
      update();
    });
  });
  draft.addEventListener('input', update);
  update();
})();
