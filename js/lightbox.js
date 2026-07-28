/* Lightweight gallery lightbox — no dependencies.
   Any <figure><img> inside a .gal grid becomes clickable and opens a
   full-size overlay with caption + prev/next. Keyboard: Esc closes,
   ← / → navigate. Clicking the backdrop closes. */
(function () {
  var figs = Array.prototype.slice.call(document.querySelectorAll('.gal figure'));
  // Only figures that actually contain a real image (skip "video coming soon" slots)
  var items = figs
    .map(function (fig) {
      var img = fig.querySelector('img');
      if (!img) return null;
      var cap = fig.querySelector('figcaption');
      return { img: img, src: img.getAttribute('src'), alt: img.getAttribute('alt') || '',
               cap: cap ? cap.textContent.trim() : '' };
    })
    .filter(Boolean);
  if (!items.length) return;

  var idx = 0;

  // Build the overlay once
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-hidden', 'true');
  lb.innerHTML =
    '<button class="lb-close" type="button" aria-label="Close">&times;</button>' +
    '<button class="lb-nav lb-prev" type="button" aria-label="Previous photo">&#8249;</button>' +
    '<button class="lb-nav lb-next" type="button" aria-label="Next photo">&#8250;</button>' +
    '<figure class="lb-stage">' +
      '<img class="lb-img" alt="">' +
      '<figcaption class="lb-cap"></figcaption>' +
    '</figure>';
  document.body.appendChild(lb);

  var lbImg = lb.querySelector('.lb-img');
  var lbCap = lb.querySelector('.lb-cap');
  var lastFocus = null;

  function render() {
    var it = items[idx];
    lbImg.setAttribute('src', it.src);
    lbImg.setAttribute('alt', it.alt);
    lbCap.textContent = it.cap;
    lbCap.style.display = it.cap ? '' : 'none';
  }

  function open(i) {
    idx = i;
    lastFocus = document.activeElement;
    render();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }

  function close() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(dir) {
    idx = (idx + dir + items.length) % items.length;
    render();
  }

  // Wire each gallery image
  items.forEach(function (it, i) {
    it.img.classList.add('lb-thumb');
    it.img.setAttribute('tabindex', '0');
    it.img.setAttribute('role', 'button');
    it.img.setAttribute('aria-label', 'View photo: ' + (it.cap || it.alt || 'photo'));
    it.img.addEventListener('click', function () { open(i); });
    it.img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // Basic swipe on touch
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
})();
