let isMenu = false;

const btn = document.getElementById('arrowBtn');
const navLinks = document.querySelectorAll('#navList a');

btn.addEventListener('click', () => {
  isMenu = !isMenu;
  document.body.classList.toggle('menu-open', isMenu);

  if (isMenu) {
    navLinks.forEach((a, i) => {
      a.style.transitionDelay = `${0.25 + i * 0.08}s`;
      setTimeout(() => a.classList.add('is-visible'), 10);
    });
  } else {
    navLinks.forEach(a => {
      a.classList.remove('is-visible');
      a.style.transitionDelay = '0s';
    });
  }

  setTimeout(() => drawLines(!isMenu), 50);
});

/* ── Draw diagonal lines ── */
function drawLines(darkMode) {
  const svg = document.getElementById('linesCanvas');
  svg.innerHTML = '';

  const W = window.innerWidth;
  const H = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const centerX = darkMode ? W * 0.5  : W * 0.58;
  const centerY = darkMode ? H * 0.5  : H * 0.55;
  const angle = -30 * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const count = 20;
  const spread = Math.max(W, H) * 1.4;
  const step = spread / count;

  const strokeR = darkMode ? 140 : 55;
  const strokeG = darkMode ? 148 : 65;
  const strokeB = darkMode ? 220 : 110;
  const baseOp = darkMode ? 0.18 : 0.2;

  for (let i = 0; i < count; i++) {
    const offset = (i - count / 2 + 0.5) * step;
    const px = centerX + offset * Math.cos(angle + Math.PI / 2);
    const py = centerY + offset * Math.sin(angle + Math.PI / 2);
    const halfLen = spread * 0.7;
    const x1 = px - halfLen * cos;
    const y1 = py - halfLen * sin;
    const x2 = px + halfLen * cos;
    const y2 = py + halfLen * sin;

    const dist = Math.abs(offset);
    const maxDist = spread / 2;
    const opacity = Math.max(0, baseOp - (dist / maxDist) * 0.17).toFixed(3);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', `rgba(${strokeR},${strokeG},${strokeB},${opacity})`);
    line.setAttribute('stroke-width', '1');

    const length = Math.hypot(x2 - x1, y2 - y1);
    line.setAttribute('stroke-dasharray', length);
    line.setAttribute('stroke-dashoffset', length);

    const delay = 0.1 + (i / count) * 0.55;
    const dur = 0.8 + Math.random() * 0.35;
    line.style.animation = `drawLine ${dur}s ease ${delay}s forwards`;

    svg.appendChild(line);
  }
}

drawLines(true);

const observer = new MutationObserver(() => {
  const dark = !document.body.classList.contains('menu-open');
  drawLines(dark);
});
observer.observe(document.body, { attributeFilter: ['class'] });

window.addEventListener('resize', () => {
  const dark = !document.body.classList.contains('menu-open');
  drawLines(dark);
});
