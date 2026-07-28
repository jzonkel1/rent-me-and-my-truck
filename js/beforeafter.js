/* Before/After comparison slider — drag, touch, or click to compare.
   Defaults to 80% "before" showing so visitors drag left to reveal the after.
   Wires every [data-ba] element. Vanilla port of the reference component. */
(function () {
  function initBA(el) {
    var before = el.querySelector('.ba-before');
    var divider = el.querySelector('.ba-divider');
    var handle = el.querySelector('.ba-handle');
    var cue = el.querySelector('.ba-cue');
    if (!before || !divider || !handle) return;
    var pos = 80, dragging = false, touched = false;

    function apply() {
      before.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      divider.style.left = pos + '%';
      handle.style.left = pos + '%';
      if (cue && touched) cue.classList.add('gone');
    }
    function setFromX(clientX) {
      var r = el.getBoundingClientRect();
      pos = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
      apply();
    }

    el.addEventListener('mousedown', function (e) { e.preventDefault(); dragging = true; touched = true; setFromX(e.clientX); });
    window.addEventListener('mousemove', function (e) { if (dragging) setFromX(e.clientX); });
    window.addEventListener('mouseup', function () { dragging = false; });
    // click anywhere to jump
    el.addEventListener('click', function (e) { touched = true; setFromX(e.clientX); });

    el.addEventListener('touchstart', function (e) { dragging = true; touched = true; setFromX(e.touches[0].clientX); }, { passive: true });
    el.addEventListener('touchmove', function (e) { if (dragging) { e.preventDefault(); setFromX(e.touches[0].clientX); } }, { passive: false });
    el.addEventListener('touchend', function () { dragging = false; });

    // keyboard support on the handle
    handle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { pos = Math.max(0, pos - 4); touched = true; apply(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { pos = Math.min(100, pos + 4); touched = true; apply(); e.preventDefault(); }
    });

    apply();
  }
  document.querySelectorAll('[data-ba]').forEach(initBA);
})();
