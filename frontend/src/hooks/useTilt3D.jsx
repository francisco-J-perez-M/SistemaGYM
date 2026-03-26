// hooks/useTilt3D.js
// Aplica efecto de inclinación 3D + glow en las stat cards.
//
// Uso básico:
//   const tiltRef = useTilt3D();
//   <div className="stat-card" ref={tiltRef}>...</div>
//
// Uso en lista (para kpi-grid):
//   const tiltRef = useTilt3D({ intensity: 10 });
//   <div className="kpi-grid" ref={tiltRef}>...</div>
//   // Aplica automáticamente a todos los .stat-card hijos

import { useEffect, useRef, useCallback } from 'react';

/**
 * @param {object} options
 * @param {number}  options.intensity  - Grados máximos de rotación (default: 10)
 * @param {boolean} options.applyToChildren - Si true, busca .stat-card dentro del ref (default: true)
 */
export function useTilt3D({ intensity = 10, applyToChildren = true } = {}) {
  const ref = useRef(null);

  const getCards = useCallback(() => {
    if (!ref.current) return [];
    if (applyToChildren) {
      return Array.from(ref.current.querySelectorAll('.stat-card'));
    }
    return [ref.current];
  }, [applyToChildren]);

  useEffect(() => {
    const cards = getCards();
    if (!cards.length) return;

    const handlers = cards.map(card => {
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 a 0.5
        const y = (e.clientY - rect.top)  / rect.height - 0.5;

        // Rotación 3D suave
        card.style.transform = `
          perspective(1200px)
          rotateY(${x * intensity}deg)
          rotateX(${-y * intensity}deg)
          translateY(-4px)
        `;

        // Posición del glow radial (CSS custom properties)
        const mx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
        const my = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
        card.style.setProperty('--mx', mx);
        card.style.setProperty('--my', my);
      };

      const onLeave = () => {
        // Vuelve a posición natural con transición suave
        card.style.transform = '';
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      };

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);

      return { card, onMove, onLeave };
    });

    return () => {
      handlers.forEach(({ card, onMove, onLeave }) => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    };
  }, [getCards, intensity]);

  return ref;
}


// ─────────────────────────────────────────────
// hooks/useScrollReveal.js (incluido aquí)
// Agrega la clase .visible a elementos con .reveal
// cuando entran en el viewport.
//
// Uso:
//   useScrollReveal();   // en App.js o en el layout raíz
//
//   <div className="reveal reveal-delay-1">Contenido</div>
//   <div className="reveal reveal-delay-2">Contenido</div>
// ─────────────────────────────────────────────
export function useScrollReveal(selector = '.reveal') {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Dejar de observar después de revelar (no rebota)
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [selector]);
}