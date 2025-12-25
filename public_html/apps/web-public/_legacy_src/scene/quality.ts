/**
 * Auto Quality Management - Mobile Premium
 * Monitorizează FPS și reduce calitate automat pe device-uri weak
 * Mobile: pixelRatio max 1.25, shadows OFF by default
 */

export class QualityManager {
    private fpsHistory: number[] = [];
    private lastTime = performance.now();
    private frameCount = 0;

    public pixelRatio = 1;
    public shadows = true;
    public antialias = true;

    constructor() {
        // Detectare device inițială
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

        // Mobile premium: pixelRatio max 1.25, shadows OFF
        this.pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2);
        this.shadows = !isMobile; // Shadows OFF pe mobil pentru performance
        this.antialias = true;
    }

    update(): void {
        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        // Calculează FPS la fiecare secundă
        if (elapsed >= 1000) {
            const fps = (this.frameCount * 1000) / elapsed;
            this.fpsHistory.push(fps);

            // Păstrează ultimele 5 secunde
            if (this.fpsHistory.length > 5) {
                this.fpsHistory.shift();
            }

            // Auto-reduce quality dacă FPS < 30
            const avgFps = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;

            if (avgFps < 30 && this.pixelRatio > 1) {
                this.pixelRatio = 1;
                console.warn('[Quality] Reduced pixelRatio to 1 (FPS:', avgFps.toFixed(1), ')');
            }

            if (avgFps < 25 && this.shadows) {
                this.shadows = false;
                console.warn('[Quality] Disabled shadows (FPS:', avgFps.toFixed(1), ')');
            }

            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    getCurrentFPS(): number {
        return this.fpsHistory.length > 0
            ? this.fpsHistory[this.fpsHistory.length - 1]
            : 60;
    }
}
