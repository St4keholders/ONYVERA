/**
 * ONYVERA — Scroll-reveal global controller
 * Implementa el patrón inView con stagger(0.06) definido en PLAN.md
 */

import { animate, inView } from './motion.min.js';

export function initScrollReveal() {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Manejo para secciones con data-onv-reveal
  document.querySelectorAll('[data-onv-reveal]').forEach(section => {
    const items = section.querySelectorAll('[data-onv-reveal-item]');

    if (isReduced) {
      items.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    // Inicializar estilos ocultos
    items.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
    });

    inView(section, () => {
      items.forEach((item, index) => {
        animate(item, {
          opacity: [0, 1],
          transform: ['translateY(16px)', 'translateY(0px)']
        }, {
          duration: 0.42,
          delay: index * 0.06,
          ease: [0.22, 0.9, 0.3, 1]
        });
      });
    }, { amount: 0.15 });
  });

  // 2. Manejo específico para Línea de Tiempo (progreso de trazado + nodos)
  document.querySelectorAll('[data-onv-timeline]').forEach(timeline => {
    const bar = timeline.querySelector('.onv-timeline__bar');
    const nodes = timeline.querySelectorAll('[data-onv-timeline-node]');

    if (isReduced) {
      if (bar) bar.style.transform = 'none';
      nodes.forEach(n => {
        n.style.opacity = '1';
        n.style.transform = 'none';
      });
      return;
    }

    nodes.forEach(n => {
      n.style.opacity = '0';
      n.style.transform = 'translateY(16px)';
    });

    inView(timeline, () => {
      // Animar trazado
      if (bar) {
        animate(bar, {
          opacity: [0, 0.35]
        }, { duration: 0.5, ease: 'easeOut' });
      }

      // Stagger de nodos
      nodes.forEach((node, idx) => {
        animate(node, {
          opacity: [0, 1],
          transform: ['translateY(16px)', 'translateY(0px)']
        }, {
          duration: 0.42,
          delay: 0.1 + (idx * 0.08),
          ease: [0.22, 0.9, 0.3, 1]
        });
      });
    }, { amount: 0.2 });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
});
