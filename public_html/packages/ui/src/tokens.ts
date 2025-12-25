// Design Tokens - Pariaza Inteligent
// Sistema de design centralizată cu culori neon, spacing și motion presets

export const colors = {
    // Neon primaries
    neon: {
        cyan: '#00F0FF',
        magenta: '#FF00E5',
        yellow: '#FFE600',
        green: '#00FF8C',
        purple: '#A855F7',
    },

    // Dark mode base
    dark: {
        bg: '#0A0A0F',
        bgElevated: '#14141F',
        bgCard: '#1A1A2E',
        border: '#2A2A3E',
        text: '#E5E5F0',
        textMuted: '#9090A5',
    },

    // Light mode base
    light: {
        bg: '#FAFAFA',
        bgElevated: '#FFFFFF',
        bgCard: '#F5F5F7',
        border: '#E0E0E5',
        text: '#1A1A1F',
        textMuted: '#70707A',
    },

    // Semantic colors
    success: '#00FF8C',
    warning: '#FFE600',
    error: '#FF4D6D',
    info: '#00F0FF',
} as const;

export const spacing = {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
} as const;

export const motion = {
    // Durate unice pentru brand
    duration: {
        instant: '100ms',
        fast: '200ms',
        normal: '300ms',
        slow: '500ms',
        verySlow: '800ms',
    },

    // Easing curves distinctive
    easing: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        snappy: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },

    // Parallax scroll intensități (mobile-first cu desktop enhancement)
    parallax: {
        mobile: {
            subtle: 0.02,    // 2% deplasare pe scroll - aproape imperceptibil
            normal: 0.05,    // 5% - vizibil dar nu distrage atenția
            intense: 0.08,   // 8% - maxim pentru mobil (performance)
        },
        desktop: {
            subtle: 0.05,    // 5% - se observă ușor
            normal: 0.15,    // 15% - efect cinematografic
            intense: 0.30,   // 30% - dramatic, folosit cu moderație
        },
        // Pentru prefers-reduced-motion - aproape static
        reduceIntensity: 0.01,
    },

    // Presets pentru animații comune
    presets: {
        fadeIn: {
            duration: '300ms',
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards',
        },
        slideUp: {
            duration: '500ms',
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            fill: 'forwards',
        },
        glow: {
            duration: '800ms',
            easing: 'ease-in-out',
            fill: 'forwards',
            iterationCount: 'infinite',
            direction: 'alternate',
        },
    },
} as const;

export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

export const typography = {
    fontFamily: {
        sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', monospace",
    },

    fontSize: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        base: '1rem',       // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
        '5xl': '3rem',      // 48px
        '6xl': '3.75rem',   // 60px
    },

    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
} as const;

export const shadows = {
    neonCyan: '0 0 20px rgba(0, 240, 255, 0.5)',
    neonMagenta: '0 0 20px rgba(255, 0, 229, 0.5)',
    neonYellow: '0 0 20px rgba(255, 230, 0, 0.5)',
    cardDark: '0 4px 20px rgba(0, 0, 0, 0.4)',
    cardLight: '0 4px 20px rgba(0, 0, 0, 0.08)',
} as const;

// Export design system complet
export const designSystem = {
    colors,
    spacing,
    motion,
    breakpoints,
    typography,
    shadows,
} as const;

export type DesignSystem = typeof designSystem;
