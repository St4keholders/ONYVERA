/**
 * ONYVERA — Hero Section Motion Controller
 * Implementa la secuencia exacta de disparo único definida en PLAN.md
 */

import { animate } from './motion.min.js';

export function initHero(sectionElement) {
  if (!sectionElement) return;

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const enableMotion = sectionElement.dataset.motionEnabled !== 'false';

  const eyebrow = sectionElement.querySelector('.onv-hero__eyebrow');
  const titleWords = sectionElement.querySelectorAll('.onv-hero__word');
  const subtitle = sectionElement.querySelector('.onv-hero__subtitle');
  const shoeEl = sectionElement.querySelector('.onv-hero__art-shoe');
  const footEl = sectionElement.querySelector('.onv-hero__art-foot');
  const points = sectionElement.querySelectorAll('.onv-hero__point');
  const cta = sectionElement.querySelector('.onv-hero__cta-wrapper');

  if (isReduced || !enableMotion) {
    // Estado final estático accesible
    if (shoeEl) {
      shoeEl.style.transform = 'translateY(620px) rotate(5deg)';
      shoeEl.style.opacity = '0';
      shoeEl.style.pointerEvents = 'none';
    }
    if (footEl) footEl.style.transform = 'translateY(-22px)';
    points.forEach(p => {
      p.style.transform = 'translateX(0)';
      p.style.opacity = '1';
    });
    if (cta) {
      cta.style.transform = 'translateY(0)';
      cta.style.opacity = '1';
    }
    return;
  }

  // 1. Animación de entrada inicial (independiente del scroll)
  if (eyebrow) {
    animate(eyebrow, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] }, { duration: 0.4, ease: [0.22, 0.9, 0.3, 1] });
  }

  if (titleWords.length > 0) {
    titleWords.forEach((word, index) => {
      animate(word, { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] }, {
        duration: 0.5,
        delay: 0.15 + (index * 0.09),
        ease: [0.22, 0.9, 0.3, 1]
      });
    });
  }

  if (subtitle) {
    animate(subtitle, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] }, {
      duration: 0.5,
      delay: 0.35,
      ease: [0.22, 0.9, 0.3, 1]
    });
  }

  // 2. Disparo único en el primer gesto de scroll
  let triggered = false;
  const duration = parseFloat(sectionElement.dataset.duration || 0.9);

  function triggerScrollSequence() {
    if (triggered) return;
    triggered = true;

    // Desconectar todos los listeners inmediatamente
    window.removeEventListener('wheel', triggerScrollSequence);
    window.removeEventListener('touchmove', triggerScrollSequence);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('scroll', triggerScrollSequence);

    // Animación del zapato (0 -> 0.55 translateY, 0.80 -> 1 opacity)
    if (shoeEl) {
      animate(shoeEl, {
        transform: ['translateY(0px) rotate(0deg)', 'translateY(620px) rotate(5deg)'],
      }, {
        duration: duration * 0.7,
        ease: [0.22, 0.9, 0.3, 1]
      });

      animate(shoeEl, {
        opacity: [1, 1, 0],
      }, {
        times: [0, 0.8, 1],
        duration: duration,
        ease: 'easeOut'
      }).finished.then(() => {
        shoeEl.style.pointerEvents = 'none';
      });
    }

    // Animación del pie (0.08 -> 0.60 translateY 0 -> -22px)
    if (footEl) {
      animate(footEl, {
        transform: ['translateY(0px)', 'translateY(-22px)'],
      }, {
        delay: duration * 0.08,
        duration: duration * 0.52,
        ease: [0.22, 0.9, 0.3, 1]
      });
    }

    // Puntos a la derecha (stagger 0.35, 0.45, 0.55)
    points.forEach((point, i) => {
      const delays = [0.35, 0.45, 0.55];
      const pointDelay = duration * (delays[i] || 0.35);
      animate(point, {
        transform: ['translateX(22px)', 'translateX(0px)'],
        opacity: [0, 1]
      }, {
        delay: pointDelay,
        duration: duration * 0.25,
        ease: [0.22, 0.9, 0.3, 1]
      });
    });

    // Botón CTA (0.62 -> 0.82)
    if (cta) {
      animate(cta, {
        transform: ['translateY(14px)', 'translateY(0px)'],
        opacity: [0, 1]
      }, {
        delay: duration * 0.62,
        duration: duration * 0.22,
        ease: [0.22, 0.9, 0.3, 1]
      });
    }
  }

  function onKeyDown(e) {
    if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
      triggerScrollSequence();
    }
  }

  window.addEventListener('wheel', triggerScrollSequence, { passive: true, once: true });
  window.addEventListener('touchmove', triggerScrollSequence, { passive: true, once: true });
  window.addEventListener('scroll', triggerScrollSequence, { passive: true, once: true });
  window.addEventListener('keydown', onKeyDown, { passive: true, once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.onv-hero').forEach(hero => {
    initHero(hero);
  });
});
