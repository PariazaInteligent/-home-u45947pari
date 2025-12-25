/**
 * Parallax Scroll Helper - build manual pentru bypass execution policy
 */

const motion = {
    parallax: {
        // EXAGERAT TEMPORAR PENTRU DEBUG VIZUAL - trebuie să se vadă CLAR
        mobile: { subtle: 0.15, normal: 0.30, intense: 0.40 },   // 15-40% deplasare
        desktop: { subtle: 0.30, normal: 0.40, intense: 0.50 },  // 30-50% FOARTE VIZIBIL
        reduceIntensity: 0.01,
    },
};

const isMobile = () => window.innerWidth < 768;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getIntensity = (intensity = 'normal') => {
    if (prefersReducedMotion()) return motion.parallax.reduceIntensity;
    const device = isMobile() ? 'mobile' : 'desktop';
    return motion.parallax[device][intensity];
};

export const applyParallax = (element, options = {}) => {
    const { intensity = 'normal', direction = 'up' } = options;
    const parallaxIntensity = getIntensity(intensity);
    const multiplier = direction === 'down' ? 1 : -1;

    const handleScroll = () => {
        const rect = element.getBoundingClientRect();
        const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);

        if (scrollProgress >= 0 && scrollProgress <= 1) {
            const offset = scrollProgress * 100 * parallaxIntensity * multiplier;
            element.style.transform = `translateY(${offset}px)`;
        }
    };

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
    handleScroll();
};

export const initParallax = () => {
    const elements = document.querySelectorAll('[data-parallax]');

    elements.forEach((element) => {
        const intensity = element.dataset.parallax || 'normal';
        const direction = element.dataset.parallaxDirection || 'up';
        applyParallax(element, { intensity, direction });
    });
};

// Auto-init
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initParallax);
    } else {
        initParallax();
    }
}
