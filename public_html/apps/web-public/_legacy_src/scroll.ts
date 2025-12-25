/**
 * Scroll Controller - 3 Beats Cinematic POLISH
 * Camera easing custom + Ledger pulse beat
 */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Scene1 } from './scene/scene';

gsap.registerPlugin(ScrollTrigger);

// DEBUG flag - OFF by default
const DEBUG_SCROLL = false;

export class ScrollController {
    private lenis: Lenis | null = null;
    private scene: Scene1;
    private prefersReducedMotion: boolean;

    constructor(scene: Scene1) {
        this.scene = scene;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!this.prefersReducedMotion) {
            this.initLenis();
            this.setupScrollTriggerProxy();
            this.initBeats();
        } else {
            console.info('[Scroll] Prefers-reduced-motion - doar breathing activ');
        }
    }

    private initLenis(): void {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        this.lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            this.lenis!.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        if (DEBUG_SCROLL) console.info('[Scroll] Lenis initialized');
    }

    private setupScrollTriggerProxy(): void {
        const lenisInstance = this.lenis;

        ScrollTrigger.scrollerProxy(document.documentElement, {
            scrollTop(value) {
                if (arguments.length && lenisInstance) {
                    lenisInstance.scrollTo(value as number, { immediate: true });
                    return value as number;
                }
                return lenisInstance ? lenisInstance.animatedScroll : document.documentElement.scrollTop;
            },

            getBoundingClientRect() {
                return {
                    top: 0,
                    left: 0,
                    width: window.innerWidth,
                    height: window.innerHeight,
                };
            },
        });

        ScrollTrigger.refresh();
        if (DEBUG_SCROLL) console.info('[Scroll] Proxy configured');
    }

    private initBeats(): void {
        this.initBeat1();
        this.initBeat2();
        this.initBeat3();
    }

    private initBeat1(): void {
        // Beat 1 (0-30%): Wide + breathing + micro lift
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                scroller: document.documentElement,
                start: 'top top',
                end: '30% top',
                scrub: 1,
                markers: DEBUG_SCROLL,
                onUpdate: DEBUG_SCROLL ? (self) => console.log('[Beat1]', self.progress.toFixed(3)) : undefined,
            },
        });

        // Camera micro lift - EASING CUSTOM smooth
        tl.to(this.scene.camera.position, {
            y: 2.5,
            duration: 1,
            ease: 'power2.inOut', // Smooth cinematografic
        });

        if (DEBUG_SCROLL) console.info('[Beat1] Wide + breathing initialized');
    }

    private initBeat2(): void {
        // Beat 2 (30-65%): Dolly in + reveal rings
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                scroller: document.documentElement,
                start: '30% top',
                end: '65% top',
                scrub: 1,
                markers: DEBUG_SCROLL,
                onUpdate: DEBUG_SCROLL ? (self) => console.log('[Beat2]', self.progress.toFixed(3)) : undefined,
            },
        });

        // Camera dolly forward + orbit subtil - EASING CUSTOM premium
        tl.to(this.scene.camera.position, {
            z: 8,
            y: 3,
            x: 1,
            duration: 1,
            ease: 'power3.inOut', // Smooth premium
        })
            .to(this.scene.camera.rotation, {
                y: 0.05, // Micro orbit
                duration: 1,
                ease: 'power2.out',
            }, '<'); // Simultan

        // Reveal rings - trigger scene method
        tl.add(() => {
            this.scene.revealRings();
        }, 0.3);

        // REVEAL CARD 1 (Strategy) - Content Layer - DISABLED FOR DEBUG STATIC CHECK
        /*
        const cardStrategy = document.querySelector('.feature-card[data-beat="2"]');
        if (cardStrategy) {
            tl.to(cardStrategy, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power2.out',
            }, 0.2); // Start devreme
        }
        */

        if (DEBUG_SCROLL) console.info('[Beat2] Dolly + reveal rings initialized');
    }

    private initBeat3(): void {
        // Beat 3 (65-100%): Portal traverse + UI overlay ready + LEDGER PULSE
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                scroller: document.documentElement,
                start: '65% top',
                end: '100% top',
                scrub: 1,
                markers: DEBUG_SCROLL,
                onUpdate: (self) => {
                    if (DEBUG_SCROLL) console.log('[Beat3]', self.progress.toFixed(3));
                    // LEDGER PULSE pe scroll progress (0-1)
                    this.scene.setLedgerPulse(self.progress);
                },
                onEnter: async () => {
                    // Trigger UI overlay state: ready
                    const overlay = document.querySelector('.data-overlay');
                    if (overlay) {
                        overlay.classList.remove('loading');
                        overlay.classList.add('ready');
                    }

                    // TRIGGER LOADING METRICS la scroll 65%+ (elimină flash loading la boot)
                    const { loadMetricsData } = await import('./main');
                    loadMetricsData();
                },
            },
        });

        // Camera traverse prin portal - EASING CUSTOM expo premium
        tl.to(this.scene.camera.position, {
            z: 2,
            y: 0.5,
            x: 0,
            duration: 1,
            ease: 'expo.inOut', // Smooth premium cinematografic
        });

        // Camera rotate pentru portal effect - EASING CUSTOM
        tl.to(this.scene.camera.rotation, {
            z: 0.1,
            duration: 1,
            ease: 'power3.out', // Decelerate smooth
        }, '<');

        // REVEAL CARD 2 (Transparency) - Content Layer - DISABLED FOR DEBUG STATIC CHECK
        /*
        const cardTransparency = document.querySelector('.feature-card[data-beat="3"]');
        if (cardTransparency) {
            tl.to(cardTransparency, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power2.out',
            }, 0.1);
        }
        */

        if (DEBUG_SCROLL) console.info('[Beat3] Portal traverse + ledger pulse initialized');
    }

    update(): void {
        // Lenis e pe gsap.ticker
    }

    dispose(): void {
        if (this.lenis) {
            this.lenis.destroy();
            gsap.ticker.remove((time) => {
                this.lenis!.raf(time * 1000);
            });
        }

        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
}
