/* Quote wizard — multi-step, tap-first lead capture.
   Progressive enhancement: posts natively to FormSubmit; JS only drives
   the steps + validation. Wires every .qwiz form on the page. */
(function () {
  function initWizard(form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll('.qstep'));
    if (!steps.length) return;
    // JS is driving: use our custom validation UI. If this script ever fails to
    // load, the form keeps native `required` so empty name/phone still can't submit.
    form.setAttribute('novalidate', 'novalidate');
    var total = steps.length;
    var bar = form.querySelector('.qwiz-bar i');
    var stepLabel = form.querySelector('.qwiz-step');
    var chosen = form.querySelector('.qwiz-chosen');
    var cur = 0;

    function show(i, scroll) {
      cur = Math.max(0, Math.min(i, total - 1));
      steps.forEach(function (s, idx) { s.hidden = idx !== cur; });
      if (bar) bar.style.width = ((cur + 1) / total * 100) + '%';
      if (stepLabel) stepLabel.textContent = 'Step ' + (cur + 1) + ' of ' + total;
      // only nudge into view on user-driven step changes, never on initial load
      if (scroll) { var top = form.getBoundingClientRect().top; if (top < 70) form.scrollIntoView({ block: 'start' }); }
    }

    function setHidden(field, val) {
      var h = form.querySelector('.qf-' + field);
      if (h) h.value = val;
      if (field === 'job' && chosen) chosen.textContent = val;
    }

    // service cards — single-select, auto-advance
    form.querySelectorAll('.qcard').forEach(function (c) {
      c.addEventListener('click', function () {
        var field = c.getAttribute('data-field');
        form.querySelectorAll('.qcard[data-field="' + field + '"]').forEach(function (x) { x.classList.remove('sel'); });
        c.classList.add('sel');
        setHidden(field, c.getAttribute('data-val'));
        show(cur + 1, true);
      });
    });

    // pill groups — single-select, no advance
    form.querySelectorAll('.qpills').forEach(function (group) {
      var field = group.getAttribute('data-field');
      group.querySelectorAll('.qpill').forEach(function (pill) {
        pill.addEventListener('click', function () {
          group.querySelectorAll('.qpill').forEach(function (x) { x.classList.remove('sel'); });
          pill.classList.add('sel');
          setHidden(field, pill.getAttribute('data-val'));
          var qf = group.closest('.qfield');
          if (qf) qf.classList.add('done'); // check off the numbered question
        });
      });
    });

    form.querySelectorAll('.qnext').forEach(function (b) { b.addEventListener('click', function () { show(cur + 1, true); }); });
    form.querySelectorAll('.qback').forEach(function (b) { b.addEventListener('click', function () { show(cur - 1, true); }); });

    // phone auto-format
    var phone = form.querySelector('input[type=tel]');
    if (phone) phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '').slice(0, 10);
      phone.value = d.length > 6 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6)
        : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
    });

    // validation (only the contact step has required fields)
    function fieldOf(el) { return el.closest('.fld'); }
    function valid(el) {
      var v = el.value.trim();
      if (el.type === 'email') return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (el.type === 'tel') return (v.match(/\d/g) || []).length >= 10;
      if (!el.hasAttribute('required')) return true;
      return v !== '';
    }
    function mark(el) { var f = fieldOf(el); if (!f) return true; var ok = valid(el); f.classList.toggle('bad', !ok); return ok; }
    var reqs = form.querySelectorAll('.qstep input[required], .qstep input[type=email]');
    reqs.forEach(function (el) {
      el.addEventListener('blur', function () { mark(el); });
      el.addEventListener('input', function () { if (fieldOf(el) && fieldOf(el).classList.contains('bad')) mark(el); });
    });
    var btn = form.querySelector('.qsubmit');
    form.addEventListener('submit', function (e) {
      // 1) must have picked what needs doing (step 1) — never send a blank job
      var jobField = form.querySelector('.qf-job');
      if (jobField && !jobField.value.trim()) { e.preventDefault(); show(0, true); return; }
      // 2) must have a name + a real 10-digit phone (the contact essentials)
      var firstBad = null;
      reqs.forEach(function (el) { if (!mark(el) && !firstBad) firstBad = el; });
      if (firstBad) { e.preventDefault(); show(total - 1, true); firstBad.focus(); firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      if (btn) { btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Sending…'; }
    });

    show(0);
  }
  document.querySelectorAll('.qwiz').forEach(initWizard);
})();
