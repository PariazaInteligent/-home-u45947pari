// 🎵 SoundManager - Sistema de efecte sonore pentru Pariază Inteligent
// Inspirat din Duolingo - experiență audio captivantă și non-intruzivă

type SoundName =
    | 'success'       // Acțiuni reușite (depunere aprobată, check-in)
    | 'achievement'   // Milestone-uri importante (level up, 100 zile)
    | 'checkin'       // Check-in zilnic specific
    | 'click'         // Click-uri pe butoane importante
    | 'error'         // Erori, validări failed
    | 'notification'  // Notificări noi
    | 'whoosh'        // Tranziții, modals
    | 'coins';        // Puncte loyalty primite

class SoundManagerClass {
    private sounds: Map<SoundName, HTMLAudioElement> = new Map();
    private enabled: boolean = true;
    private volume: number = 0.6; // 60% volum implicit - balansat și plăcut
    private initialized: boolean = false;

    /**
     * Inițializează SoundManager și preîncarcă toate sunetele
     * @param soundsEnabled - Preferința utilizatorului din DB (user.preferences.uiSounds)
     */
    async init(soundsEnabled: boolean = true) {
        if (this.initialized) {
            console.warn('[SoundManager] Already initialized');
            return;
        }

        this.enabled = soundsEnabled;
        console.log(`[SoundManager] 🎵 Initializing with sounds ${soundsEnabled ? 'ENABLED ✅' : 'DISABLED ❌'}`);

        // Lista completă de sunete
        const soundNames: SoundName[] = [
            'success',
            'achievement',
            'checkin',
            'click',
            'error',
            'notification',
            'whoosh',
            'coins'
        ];

        // Preload asyncron pentru a nu bloca UI-ul
        const loadPromises = soundNames.map(async (name) => {
            try {
                const audio = new Audio(`/sounds/${name}.mp3`);
                audio.volume = this.volume;
                audio.preload = 'auto';

                // Așteaptă încărcarea fișierului
                await new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', resolve, { once: true });
                    audio.addEventListener('error', reject, { once: true });
                    // Timeout 5s pentru fiecare sunet
                    setTimeout(reject, 5000);
                });

                this.sounds.set(name, audio);
                //console.log(`[SoundManager] ✓ Loaded: ${name}.mp3`);
            } catch (err) {
                console.warn(`[SoundManager] ✗ Failed to load: ${name}.mp3`);
                // Nu blocăm inițializarea dacă un sunet lipsește
            }
        });

        await Promise.allSettled(loadPromises);
        this.initialized = true;
        console.log(`[SoundManager] 🎉 Initialization complete. Loaded ${this.sounds.size}/${soundNames.length} sounds.`);
    }

    /**
     * Redă un sunet
     * @param soundName - Numele sunetului de redat
     * @param customVolume - Volum custom pentru acest sunet (opțional)
     */
    play(soundName: SoundName, customVolume?: number) {
        if (!this.enabled) {
            return; // Sunetele sunt dezactivate global
        }

        if (!this.initialized) {
            console.warn('[SoundManager] ⚠️ Cannot play sound - not initialized yet');
            return;
        }

        const sound = this.sounds.get(soundName);
        if (!sound) {
            console.warn(`[SoundManager] ⚠️ Sound not found: ${soundName}`);
            return;
        }

        try {
            // Clonăm audio element pentru a permite playback simultan (ex: click + success)
            const clone = sound.cloneNode() as HTMLAudioElement;
            clone.volume = customVolume ?? this.volume;

            // Redăm async și ignorăm autoplay policy errors
            clone.play().catch(err => {
                // NotAllowedError = browser autoplay policy (normal în prima secundă)
                if (err.name !== 'NotAllowedError') {
                    console.error(`[SoundManager] ❌ Playback error for ${soundName}:`, err);
                }
            });
        } catch (err) {
            console.error(`[SoundManager] ❌ Clone/play error for ${soundName}:`, err);
        }
    }

    /**
     * Activează/dezactivează sunetele global
     * @param enabled - True pentru activat, false pentru dezactivat
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        console.log(`[SoundManager] 🔊 Sounds ${enabled ? 'ENABLED ✅' : 'DISABLED ❌'}`);
    }

    /**
     * Setează volumul global pentru toate sunetele
     * @param volume - Valoare între 0 și 1 (0% - 100%)
     */
    setVolume(volume: number) {
        // Clamp între 0 și 1
        this.volume = Math.max(0, Math.min(1, volume));

        // Actualizează volumul pentru toate sunetele pre-încărcate
        this.sounds.forEach(sound => {
            sound.volume = this.volume;
        });

        console.log(`[SoundManager] 🔊 Volume set to ${Math.round(this.volume * 100)}%`);
    }

    /**
     * Returnează starea curentă (pentru debugging)
     */
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled,
            volume: this.volume,
            loadedSounds: Array.from(this.sounds.keys()),
            soundCount: this.sounds.size
        };
    }
}

// Singleton export - o singură instanță globală
export const SoundManager = new SoundManagerClass();

// Type export pentru TypeScript autocomplete
export type { SoundName };
