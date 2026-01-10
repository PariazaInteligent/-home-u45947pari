import { PrismaClient } from '@pariaza/database';

interface ParsedBenefit {
    icon: string;
    category: string;
    description: string;
    order: number;
}

interface CachedTier {
    tierCode: string;
    tierName: string;
    iconEmoji: string;
    feeDiscountPct: number;
    thresholds: {
        minInvestment: number;
        minStreak: number;
        minLoyalty: number;
    };
    benefits: ParsedBenefit[];
    version: number;
    cachedAt: number;
}

class TierCacheService {
    private cache: Map<string, CachedTier> = new Map();
    private readonly TTL = 3600000; // 1 hour in milliseconds
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async getTier(tierCode: string, lang: string = 'ro'): Promise<CachedTier | null> {
        const cacheKey = `${tierCode}:${lang}`;
        const cached = this.cache.get(cacheKey);

        // Check cache hit and expiration
        if (cached && (Date.now() - cached.cachedAt) < this.TTL) {
            return cached;
        }

        // Cache miss or expired - fetch from DB
        const tierData = await this.prisma.leagueTier.findUnique({
            where: { tierCode }
        });

        if (!tierData) return null;

        // Parse benefits with i18n support
        const benefits = this.parseBenefits(tierData.benefitsJson, lang);

        const cachedTier: CachedTier = {
            tierCode: tierData.tierCode,
            tierName: tierData.tierName,
            iconEmoji: tierData.iconEmoji || '🌱',
            feeDiscountPct: Number(tierData.feeDiscountPct),
            thresholds: {
                minInvestment: Number(tierData.minInvestment),
                minStreak: tierData.minStreak,
                minLoyalty: tierData.minLoyalty
            },
            benefits,
            version: tierData.benefitsVersion || 1,
            cachedAt: Date.now()
        };

        // Store in cache
        this.cache.set(cacheKey, cachedTier);
        return cachedTier;
    }

    private parseBenefits(jsonStr: string | null, lang: string): ParsedBenefit[] {
        if (!jsonStr) return [];

        try {
            const parsed = JSON.parse(jsonStr);

            // Check if i18n structure exists
            if (typeof parsed === 'object' && parsed[lang]) {
                const langBenefits = parsed[lang];
                if (Array.isArray(langBenefits)) {
                    return langBenefits.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                }
            }

            // Fallback: check for 'ro' if requested lang not found
            if (typeof parsed === 'object' && parsed.ro && lang !== 'ro') {
                const roBenefits = parsed.ro;
                if (Array.isArray(roBenefits)) {
                    return roBenefits.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                }
            }

            // Fallback: direct array (old format)
            if (Array.isArray(parsed)) {
                return parsed.sort((a, b) => (a.order || 0) - (b.order || 0));
            }

            // Unable to parse - return empty
            return [];
        } catch (error) {
            console.error(`[TierCache] Invalid JSON for tier benefits:`, error);
            return [];
        }
    }

    invalidate(tierCode: string): void {
        // Remove all language variants for this tier
        const keysToDelete: string[] = [];
        this.cache.forEach((_, key) => {
            if (key.startsWith(`${tierCode}:`)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`[TierCache] Invalidated cache for tier: ${tierCode}`);
    }

    clear(): void {
        this.cache.clear();
        console.log('[TierCache] All cache cleared');
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
let tierCacheServiceInstance: TierCacheService | null = null;

export function getTierCacheService(prisma: PrismaClient): TierCacheService {
    if (!tierCacheServiceInstance) {
        tierCacheServiceInstance = new TierCacheService(prisma);
    }
    return tierCacheServiceInstance;
}

export type { CachedTier, ParsedBenefit };
