/* ===================================================================
   Variant 1 · opening
   Donker scherm, duizenden puntjes vormen een narrenkap in een borduurring,
   met de naam erover. Daarna spatten ze uiteen als confetti en kleurt het
   scherm naar de huisstijl. Werkt ook als je het bestand direct opent (geen afbeeldingen uitgelezen).
   =================================================================== */
(function () {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // alleen bij het eerste bezoek in deze sessie, en niet als je via een link naar een sectie springt (bv. #contact)
  let seen = false;
  try { seen = sessionStorage.getItem('hh-intro') === '1'; } catch (e) { /* geen opslag: gewoon tonen */ }
  const force = /[?&]intro/.test(location.search);
  if (!force && (reduced || /[?&]skip/.test(location.search) || location.hash || seen)) { intro.remove(); return; }
  try { sessionStorage.setItem('hh-intro', '1'); } catch (e) { /* negeren */ }
  document.documentElement.classList.add('intro-lock');

  const cv = intro.querySelector('canvas'), ctx = cv.getContext('2d');
  let W, H, dpr, pts = [], CY = 0, SZ = 0;
  const PAL = ['255,236,248', '255,236,248', '255,236,248', '255,236,248', '228,190,214', '237,11,240'];
  const CONF = ['#ED0BF0', '#086ABD', '#ffd34d', '#ffffff', '#D6B0C8'];
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  /* vorm tekenen op een verborgen canvas en de witte pixels bemonsteren */
  function shapePoints() {
    const s = SZ, off = document.createElement('canvas');
    off.width = off.height = Math.round(s);
    const o = off.getContext('2d'), k = s / 48;
    o.fillStyle = o.strokeStyle = '#fff';
    o.save(); o.translate(s * .5 - 24 * k * .74, s * .5 - 23 * k * .74 - s * .02); o.scale(k * .74, k * .74);
    const hat = new Path2D('M9 35c0-9-2-15-4-19 7 2 12 6 14 12 1-8 3-15 5-20 2 5 4 12 5 20 2-6 7-10 14-12-2 4-4 10-4 19z');
    o.fill(hat); o.fillRect(9, 35, 30, 6);
    [[5, 13.5], [24, 5.5], [43, 13.5]].forEach(([x, y]) => { o.beginPath(); o.arc(x, y, 2.8, 0, 6.29); o.fill(); });
    o.restore();
    // borduurring van stippen eromheen
    o.lineWidth = s * .018; o.beginPath(); o.arc(s / 2, s / 2, s * .46, 0, 6.29); o.stroke();
    o.lineWidth = s * .006; o.setLineDash([s * .012, s * .02]); o.beginPath(); o.arc(s / 2, s / 2, s * .41, 0, 6.29); o.stroke();
    const data = o.getImageData(0, 0, off.width, off.height).data, step = Math.max(4, Math.round(s / 150)), out = [];
    for (let y = 0; y < off.height; y += step) for (let x = 0; x < off.width; x += step) {
      if (data[(y * off.width + x) * 4 + 3] > 120) out.push([x - s / 2, y - s / 2]);
    }
    return { out, step };
  }

  function build() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // de vorm past altijd in de ruimte boven de titel, zodat de tekst nooit overlapt
    const titleTop = intro.querySelector('.intro-title').getBoundingClientRect().top;
    const top = Math.min(72, H * .08), gap = Math.max(24, H * .04);
    const avail = Math.max(120, titleTop - gap - top);
    SZ = Math.round(Math.min(W * .84, avail, 760)); CY = top + avail / 2;
    const { out, step } = shapePoints();
    pts = out.map(([x, y]) => {
      const a = Math.random() * 6.29, r = Math.max(W, H) * (.5 + Math.random() * .6);
      return {
        tx: W / 2 + x, ty: CY + y, sx: W / 2 + Math.cos(a) * r, sy: CY + Math.sin(a) * r,
        c: PAL[(Math.random() * PAL.length) | 0], conf: CONF[(Math.random() * CONF.length) | 0],
        d: Math.random() * .45, tw: Math.random() * 6.29, size: Math.max(1.8, step * .5),
        vx: (Math.random() - .5) * 14, vy: -4 - Math.random() * 10, rot: Math.random() * 6.29,
      };
    });
  }

  let t0 = performance.now(), leaving = 0, done = false, mx = 0, my = 0;
  const FORM = 1700, HOLD = 1500;
  function leave() { if (!leaving) { leaving = performance.now(); intro.classList.add('is-leaving'); } }

  function frame(now) {
    if (done) return;
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    const lp = leaving ? clamp((now - leaving) / 1500) : 0;
    for (const p of pts) {
      let x, y, a = 1;
      const f = ease(clamp((t / FORM - p.d) / (1 - p.d)));
      x = p.sx + (p.tx - p.sx) * f + mx * (p.ty / H - .5) * 10;
      y = p.sy + (p.ty - p.sy) * f + my * (p.tx / W - .5) * 10;
      const tw = .78 + .22 * Math.sin(now / 420 + p.tw);
      if (lp > 0) {
        // uiteen als confetti: naar buiten, vallen, draaien
        const e = lp * lp, dx = p.tx - W / 2, dy = p.ty - CY;
        x += dx * e * 1.6 + p.vx * lp * 30; y += dy * e * 1.6 + (p.vy * lp + lp * lp * 22) * 30; a = 1 - clamp((lp - .55) / .45);
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + lp * 8); ctx.globalAlpha = a; ctx.fillStyle = lp > .12 ? p.conf : `rgb(${p.c})`;
        ctx.fillRect(-p.size, -p.size * .5, p.size * 2.2, p.size * 1.1); ctx.restore();
        continue;
      }
      ctx.fillStyle = `rgba(${p.c},${(f * tw).toFixed(3)})`;
      ctx.fillRect(x, y, p.size, p.size);
    }
    intro.style.setProperty('--p', clamp(t / (FORM + HOLD)).toFixed(3));
    if (!leaving && t > FORM + HOLD) leave();
    if (lp >= 1) { finish(); return; }
    requestAnimationFrame(frame);
  }
  function finish() {
    done = true; intro.classList.add('is-gone');
    document.documentElement.classList.remove('intro-lock');
    setTimeout(() => intro.remove(), 900);
  }

  build(); requestAnimationFrame(frame);
  addEventListener('resize', () => { if (!leaving) build(); });
  addEventListener('pointermove', (e) => { mx = e.clientX / W - .5; my = e.clientY / H - .5; });
  intro.querySelector('.intro-skip').addEventListener('click', (e) => { e.stopPropagation(); leave(); });
  intro.addEventListener('click', leave);
  addEventListener('wheel', () => { if (performance.now() - t0 > 600) leave(); }, { passive: true, once: true });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') leave(); }, { once: true });
})();
