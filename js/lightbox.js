/* Lightweight media lightbox — no dependencies.
   Photos: any <figure><img> inside a .gal grid.
   Videos: any <figure data-video="..."> inside a .vidwall grid.
   Click to open full-size; prev/next within the same group; Esc / backdrop
   closes; ← / → navigate; swipe on touch. */
(function () {
  function collectImages() {
    return Array.prototype.slice.call(document.querySelectorAll('.gal figure')).map(function (fig) {
      var img = fig.querySelector('img'); if (!img) return null;
      var cap = fig.querySelector('figcaption');
      return { el: img, type: 'img', src: img.getAttribute('src'), alt: img.getAttribute('alt') || '',
               cap: cap ? cap.textContent.trim() : '' };
    }).filter(Boolean);
  }
  function collectVideos() {
    return Array.prototype.slice.call(document.querySelectorAll('.vidwall figure[data-video]')).map(function (fig) {
      var cap = fig.querySelector('figcaption');
      return { el: fig, type: 'video', src: fig.getAttribute('data-video'),
               poster: fig.getAttribute('data-poster') || '', cap: cap ? cap.textContent.trim() : '' };
    });
  }

  var groups = { img: collectImages(), video: collectVideos() };
  if (!groups.img.length && !groups.video.length) return;

  // Overlay (built once)
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-hidden', 'true');
  lb.innerHTML =
    '<button class="lb-close" type="button" aria-label="Close">&times;</button>' +
    '<button class="lb-nav lb-prev" type="button" aria-label="Previous">&#8249;</button>' +
    '<button class="lb-nav lb-next" type="button" aria-label="Next">&#8250;</button>' +
    '<figure class="lb-stage"><div class="lb-media"></div><figcaption class="lb-cap"></figcaption></figure>';
  document.body.appendChild(lb);

  var media = lb.querySelector('.lb-media');
  var cap = lb.querySelector('.lb-cap');
  var cur = { group: 'img', i: 0 };
  var lastFocus = null;

  function stopVideo() {
    var v = media.querySelector('video');
    if (v) { v.pause(); }
  }

  function render() {
    var it = groups[cur.group][cur.i];
    stopVideo();
    if (it.type === 'video') {
      media.innerHTML = '<video class="lb-video" controls autoplay playsinline preload="auto"' +
        (it.poster ? ' poster="' + it.poster + '"' : '') + ' src="' + it.src + '"></video>';
    } else {
      media.innerHTML = '<img class="lb-img" src="' + it.src + '" alt="' + it.alt.replace(/"/g, '&quot;') + '">';
    }
    cap.textContent = it.cap;
    cap.style.display = it.cap ? '' : 'none';
    // only show nav if more than one in the group
    var multi = groups[cur.group].length > 1;
    lb.querySelector('.lb-prev').style.display = multi ? '' : 'none';
    lb.querySelector('.lb-next').style.display = multi ? '' : 'none';
  }

  function open(group, i) {
    cur.group = group; cur.i = i;
    lastFocus = document.activeElement;
    render();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function close() {
    stopVideo();
    media.innerHTML = '';
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function step(d) {
    var g = groups[cur.group];
    cur.i = (cur.i + d + g.length) % g.length;
    render();
  }

  function wire(group) {
    groups[group].forEach(function (it, i) {
      var t = it.el;
      t.classList.add('lb-thumb');
      t.setAttribute('tabindex', '0');
      t.setAttribute('role', 'button');
      t.setAttribute('aria-label', (it.type === 'video' ? 'Play video: ' : 'View photo: ') + (it.cap || it.alt || ''));
      t.addEventListener('click', function () { open(group, i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(group, i); }
      });
    });
  }
  wire('img'); wire('video');

  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === media) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
})();
