/* Shared behaviour for all "scroll" pages: hero diagonal lines,
   grid-icon color swap on scroll, and scroll-reveal animations. */
(function () {
  const svg = document.getElementById('heroLines');
  if (!svg) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const angle = -30 * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const count = 20;
  const spread = Math.max(W, H) * 1.4;
  const step = spread / count;
  const cx = W * 0.5;
  const cy = H * 0.5;

  for (let i = 0; i < count; i++) {
    const offset = (i - count / 2 + 0.5) * step;
    const px = cx + offset * Math.cos(angle + Math.PI / 2);
    const py = cy + offset * Math.sin(angle + Math.PI / 2);
    const halfLen = spread * 0.7;
    const x1 = px - halfLen * cos, y1 = py - halfLen * sin;
    const x2 = px + halfLen * cos, y2 = py + halfLen * sin;

    const dist = Math.abs(offset);
    const maxDist = spread / 2;
    const opacity = Math.max(0, 0.18 - (dist / maxDist) * 0.16).toFixed(3);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', `rgba(140,148,220,${opacity})`);
    line.setAttribute('stroke-width', '1');

    const len = Math.hypot(x2 - x1, y2 - y1);
    line.setAttribute('stroke-dasharray', len);
    line.setAttribute('stroke-dashoffset', len);

    const delay = 0.1 + (i / count) * 0.6;
    const dur = 0.8 + Math.random() * 0.4;
    line.style.animation = `drawLine ${dur}s ease ${delay}s forwards`;
    svg.appendChild(line);
  }
})();

/* ── Grid icon color switch on scroll ── */
const gridIcon = document.getElementById('gridIcon');
const heroEl = document.querySelector('.hero');

if (gridIcon && heroEl) {
  const heroHeight = heroEl.offsetHeight;

  window.addEventListener('scroll', () => {
    if (window.scrollY > heroHeight * 0.7) {
      gridIcon.classList.remove('dark-mode');
      gridIcon.classList.add('light-mode');
    } else {
      gridIcon.classList.remove('light-mode');
      gridIcon.classList.add('dark-mode');
    }
  });
}

/* ── Scroll reveal ── */
const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');

if (revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));
}

/* ── Tag filter (used on Writeups / Notes listing pages) ── */
function initTagFilter() {
  const filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return;

  const buttons = filterBar.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('[data-tags]');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const tags = (card.dataset.tags || '').split(',');
        const show = filter === 'all' || tags.includes(filter);
        card.style.display = show ? '' : 'none';
      });
    });
  });
}
document.addEventListener('DOMContentLoaded', initTagFilter);
