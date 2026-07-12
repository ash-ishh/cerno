const header = document.querySelector('[data-header]');

const updateHeader = () => {
  header?.classList.toggle('scrolled', window.scrollY > 40);
};
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// Re-apply deep links after web fonts settle so headings are not shifted under the fixed nav.
window.addEventListener('load', async () => {
  if (!window.location.hash) return;
  await document.fonts?.ready;
  window.setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' }), 60);
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const loopSteps = [...document.querySelectorAll('[data-step]')];
const loopLabels = ['Focus Thread', 'Live discovery', 'Personal judgment', 'Finite briefing'];
const loopNodes = [...document.querySelectorAll('.loop-node')];
let activeStep = 0;
let loopTimer;

const setLoopStep = (index) => {
  activeStep = index;
  loopSteps.forEach((step, stepIndex) => step.classList.toggle('active', stepIndex === index));
  loopNodes.forEach((node, nodeIndex) => {
    node.style.opacity = nodeIndex === index ? '1' : '.45';
    node.style.transform = nodeIndex === index ? 'scale(1.08)' : 'scale(1)';
  });
  const label = document.querySelector('[data-loop-label]');
  if (label) label.textContent = loopLabels[index];
};

const restartLoop = () => {
  window.clearInterval(loopTimer);
  loopTimer = window.setInterval(() => setLoopStep((activeStep + 1) % loopSteps.length), 2800);
};

loopSteps.forEach((step, index) => {
  step.addEventListener('click', () => {
    setLoopStep(index);
    restartLoop();
  });
});

if (loopSteps.length) {
  setLoopStep(0);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) restartLoop();
}

// Keyboard-friendly presentation navigation between major sections.
const presentationSections = ['top', 'product', 'agency', 'proof', 'stack'];
document.addEventListener('keydown', (event) => {
  if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) return;
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName)) return;
  const direction = ['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1;
  const currentY = window.scrollY + window.innerHeight * 0.35;
  const positions = presentationSections.map((id) => document.getElementById(id)).filter(Boolean);
  let index = positions.findIndex((section, sectionIndex) => {
    const next = positions[sectionIndex + 1];
    return section.offsetTop <= currentY && (!next || next.offsetTop > currentY);
  });
  index = Math.max(0, Math.min(positions.length - 1, index + direction));
  positions[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
