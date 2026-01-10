import { prisma } from '@pariaza/database';
import { emailService } from './email.service.js';

interface DailyReportData {
    user: {
        id: string;
        name: string;
        email: string;
        tier: string;
        streakDays: number;
        loyaltyPoints: number;
        clearanceLevel: number;
    };
    checkIn: {
        completedToday: boolean;
        lastCheckinDate: Date | null;
    };
    personalFinances: {
        currentBalance: number;
        totalDeposits: number;
        totalWithdrawals: number;
        profitLoss: number;
    };
}

interface SendReportsResult {
    totalEligible: number;
    sent: number;
    failed: number;
    skipped: number;
    details: {
        sentTo: string[];
        failed: string[];
        skipped: string[];
    };
}

class DailyReportsService {
    /**
     * Găsește toți utilizatorii care au activat rapoartele zilnice
     * Respectă două preferințe: emailNotifications ȘI dailyReports
     */
    async getUsersWithDailyReportsEnabled() {
        console.log('🔍 [DailyReports] Căutare utilizatori cu rapoarte zilnice activate...');

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { status: 'ACTIVE' },
                    {
                        OR: [
                            {
                                preferences: {
                                    AND: [
                                        { emailNotifications: true },
                                        { dailyReports: true }
                                    ]
                                }
                            },
                            // Fallback: dacă nu există preferințe, considerăm că sunt activate (default behavior)
                            {
                                preferences: null
                            }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                email: true,
                name: true,
                tier: true,
                streakDays: true,
                loyaltyPoints: true,
                clearanceLevel: true,
                lastCheckinAt: true,
                preferences: {
                    select: {
                        emailNotifications: true,
                        dailyReports: true
                    }
                }
            }
        });

        console.log(`✅ [DailyReports] Găsiți ${users.length} utilizatori eligibili`);
        return users;
    }

    /**
     * Colectează toate datele necesare pentru raportul unui utilizator
     */
    async generateDailyReportData(userId: string): Promise<DailyReportData | null> {
        try {
            // Obține info utilizator
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    tier: true,
                    streakDays: true,
                    loyaltyPoints: true,
                    clearanceLevel: true,
                    lastCheckinAt: true
                }
            });

            if (!user) {
                console.warn(`⚠️ [DailyReports] Utilizatorul ${userId} nu a fost găsit`);
                return null;
            }

            // Verifică dacă a făcut check-in astăzi
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const completedToday = user.lastCheckinAt ? user.lastCheckinAt >= today : false;

            // Obține date financiare PERSONALE ale investitorului
            // 1. Calculează balanța din ledger (suma tuturor entry-urilor pentru userId)
            const ledgerBalance = await prisma.ledgerEntry.aggregate({
                where: {
                    account: {
                        userId: userId
                    }
                },
                _sum: {
                    amount: true
                }
            }).catch(() => ({ _sum: { amount: null } }));

            // 2. Total deposits aprobate
            const depositsSum = await prisma.deposit.aggregate({
                where: {
                    userId: userId,
                    status: 'APPROVED'
                },
                _sum: {
                    amount: true
                }
            }).catch(() => ({ _sum: { amount: null } }));

            // 3. Total withdrawals plătite
            const withdrawalsSum = await prisma.withdrawal.aggregate({
                where: {
                    userId: userId,
                    status: 'PAID'
                },
                _sum: {
                    amountPayout: true
                }
            }).catch(() => ({ _sum: { amountPayout: null } }));

            // 4. Profit/Loss din trade-uri settled
            const trades = await prisma.trade.aggregate({
                where: {
                    userId: userId,
                    status: {
                        in: ['SETTLED_WIN', 'SETTLED_LOSS']
                    }
                },
                _sum: {
                    resultAmount: true,
                    stake: true
                }
            }).catch(() => ({ _sum: { resultAmount: null, stake: null } }));

            const profitLoss = Number(trades._sum.resultAmount || 0) - Number(trades._sum.stake || 0);

            const personalFinances = {
                currentBalance: Number(ledgerBalance._sum.amount || 0),
                totalDeposits: Number(depositsSum._sum.amount || 0),
                totalWithdrawals: Number(withdrawalsSum._sum.amountPayout || 0),
                profitLoss: profitLoss
            };

            return {
                user: {
                    id: user.id,
                    name: user.name || 'Investitor',
                    email: user.email,
                    tier: user.tier,
                    streakDays: user.streakDays,
                    loyaltyPoints: user.loyaltyPoints,
                    clearanceLevel: user.clearanceLevel
                },
                checkIn: {
                    completedToday,
                    lastCheckinDate: user.lastCheckinAt
                },
                personalFinances
            };
        } catch (error) {
            console.error(`❌ [DailyReports] Eroare la generare date pentru ${userId}:`, error);
            return null;
        }
    }

    /**
     * Trimite rapoarte zilnice către toți utilizatorii eligibili
     * Funcția principală care rulează zilnic via cron job
     */
    async sendDailyReports(): Promise<SendReportsResult> {
        console.log('📧 [DailyReports] =================================');
        console.log('📧 [DailyReports] Începere trimitere rapoarte zilnice...');
        console.log('📧 [DailyReports] =================================');

        const result: SendReportsResult = {
            totalEligible: 0,
            sent: 0,
            failed: 0,
            skipped: 0,
            details: {
                sentTo: [],
                failed: [],
                skipped: []
            }
        };

        try {
            // Găsește utilizatori eligibili
            const eligibleUsers = await this.getUsersWithDailyReportsEnabled();
            result.totalEligible = eligibleUsers.length;

            if (eligibleUsers.length === 0) {
                console.log('ℹ️ [DailyReports] Nu există utilizatori eligibili pentru rapoarte');
                return result;
            }

            // Trimite raport pentru fiecare utilizator
            for (const user of eligibleUsers) {
                try {
                    // Verifică din nou preferințele (double-check)
                    if (user.preferences && user.preferences.dailyReports === false) {
                        console.log(`⏭️ [DailyReports] Skip ${user.email} - dailyReports: false`);
                        result.skipped++;
                        result.details.skipped.push(user.email);
                        continue;
                    }

                    if (user.preferences && user.preferences.emailNotifications === false) {
                        console.log(`⏭️ [DailyReports] Skip ${user.email} - emailNotifications: false`);
                        result.skipped++;
                        result.details.skipped.push(user.email);
                        continue;
                    }

                    // Generează datele raportului
                    const reportData = await this.generateDailyReportData(user.id);

                    if (!reportData) {
                        console.warn(`⚠️ [DailyReports] Nu s-au putut genera date pentru ${user.email}`);
                        result.failed++;
                        result.details.failed.push(user.email);
                        continue;
                    }

                    // Trimite emailul
                    console.log(`📤 [DailyReports] Trimitere raport către ${user.email}...`);
                    const sent = await emailService.sendDailyReportEmail(reportData);

                    if (sent) {
                        result.sent++;
                        result.details.sentTo.push(user.email);
                        console.log(`✅ [DailyReports] Raport trimis cu succes către ${user.email}`);
                    } else {
                        result.failed++;
                        result.details.failed.push(user.email);
                        console.log(`❌ [DailyReports] Eșuare trimitere către ${user.email}`);
                    }

                } catch (error) {
                    console.error(`❌ [DailyReports] Eroare trimitere către ${user.email}:`, error);
                    result.failed++;
                    result.details.failed.push(user.email);
                }
            }

            // Log final
            console.log('📧 [DailyReports] =================================');
            console.log(`📧 [DailyReports] Trimitere finalizată:`);
            console.log(`📧 [DailyReports]   Eligibili: ${result.totalEligible}`);
            console.log(`📧 [DailyReports]   Trimise: ${result.sent} ✅`);
            console.log(`📧 [DailyReports]   Eșuate: ${result.failed} ❌`);
            console.log(`📧 [DailyReports]   Sărite: ${result.skipped} ⏭️`);
            console.log('📧 [DailyReports] =================================');

            return result;

        } catch (error) {
            console.error('❌ [DailyReports] EROARE CRITICĂ la trimitere rapoarte:', error);
            throw error;
        }
    }

    /**
     * Funcție de test pentru a trimite un raport către un singur utilizator
     * Utilă pentru debugging și testare
     */
    async sendTestReport(userId: string): Promise<boolean> {
        console.log(`🧪 [DailyReports] Test - trimitere raport către userId: ${userId}`);

        try {
            const reportData = await this.generateDailyReportData(userId);

            if (!reportData) {
                console.error('❌ [DailyReports] Nu s-au putut genera date pentru test');
                return false;
            }

            const sent = await emailService.sendDailyReportEmail(reportData);
            console.log(`${sent ? '✅' : '❌'} [DailyReports] Test ${sent ? 'reușit' : 'eșuat'}`);
            return sent;

        } catch (error) {
            console.error('❌ [DailyReports] Eroare la testare:', error);
            return false;
        }
    }
}

// Export singleton instance
export const dailyReportsService = new DailyReportsService();
