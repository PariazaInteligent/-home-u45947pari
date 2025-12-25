/**
 * Parallax Scroll Helper - Pariaza Inteligent
 * 
 * Helper pentru aplicare parallax scroll cu:
 * - Detectare viewport (mobil vs desktop)
 * - Respect pentru prefers-reduced-motion
 * - Intensități diferite per device
 */

import { motion } from './tokens';

interface ParallaxOptions {
    intensity?: 'subtle' | 'normal' | 'intense';
    direction?: 'up' | 'down';
}

/**
 * Detectare dacă device-ul este mobil (width < 768px)
 */
const isMobile = (): boolean => {
    return window.innerWidth < 768;
};

/**
 * Verificare dacă user preferă reduced motion
 */
const prefersReducedMotion = (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Obține intensitatea parallax bazată pe device și preferințe
 */
const getIntensity = (intensity: 'subtle' | 'normal' | 'intense' = 'normal'): number => {
    if (prefersReducedMotion()) {
        return motion.parallax.reduceIntensity;
    }

    const device = isMobile() ? 'mobile' : 'desktop';
    return motion.parallax[device][intensity];
};

/**
 * Aplică parallax scroll pe element
 * 
 * Usage:
 * ```typescript
 * const elements = document.querySelectorAll('[data-parallax]');
 * elements.forEach(el => {
 *   applyParallax(el as HTMLElement, { intensity: 'normal', direction: 'up' });
 * });
 * ```
 */
export const applyParallax = (
    element: HTMLElement,
    options: ParallaxOptions = {}
): void => {
    const { intensity = 'normal', direction = 'up' } = options;
    const parallaxIntensity = getIntensity(intensity);
    const multiplier = direction === 'down' ? 1 : -1;

    const handleScroll = () => {
        const rect = element.getBoundingClientRect();
        const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);

        // Aplică transformare doar când elementul e vizibil
        if (scrollProgress >= 0 && scrollProgress <= 1) {
            const offset = scrollProgress * 100 * parallaxIntensity * multiplier;
            element.style.transform = `translateY(${offset}px)`;
        }
    };

    // Listener cu throttle pentru performance
    let ticking = false;
    const throttledScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial call
};

/**
 * Inițializare automată pentru toate elementele cu data-parallax
 * 
 * Usage în HTML:
 * <div data-parallax="normal" data-parallax-direction="up">Content</div>
 */
export const initParallax = (): void => {
    const elements = document.querySelectorAll<HTMLElement>('[data-parallax]');

    elements.forEach((element) => {
        const intensity = (element.dataset.parallax as 'subtle' | 'normal' | 'intense') || 'normal';
        const direction = (element.dataset.parallaxDirection as 'up' | 'down') || 'up';

        applyParallax(element, { intensity, direction });
    });
};

// Auto-init când DOM e ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initParallax);
    } else {
        initParallax();
    }
}
