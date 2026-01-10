import cron from 'node-cron';
import { dailyReportsService } from '../services/daily-reports.service.js';

/**
 * Cron Job pentru trimiterea automată a rapoartelor zilnice
 * 
 * Schedule: Rulează în fiecare zi la 08:00 dimineața
 * Frecvență: 0 8 * * * (minute=0, hour=8, every day, every month, every day of week)
 */
export function initDailyReportsJob() {
    console.log('🕐 [DailyReports] Inițializare cron job pentru rapoarte zilnice...');

    // Rulare zilnică la 08:00
    cron.schedule('0 8 * * *', async () => {
        console.log('📧 [Cron] =================================');
        console.log('📧 [Cron] DECLANȘARE: Trimitere rapoarte zilnice...');
        console.log('📧 [Cron] Ora: ' + new Date().toLocaleString('ro-RO'));
        console.log('📧 [Cron] =================================');

        try {
            const result = await dailyReportsService.sendDailyReports();

            console.log('✅ [Cron] Rapoarte zilnice trimise cu succes!');
            console.log(`📊 [Cron] Rezumat: ${result.sent}/${result.totalEligible} trimise, ${result.failed} eșuate, ${result.skipped} sărite`);

        } catch (error) {
            console.error('❌ [Cron] EROARE CRITICĂ la trimiterea rapoartelor zilnice:', error);
        }

        console.log('📧 [Cron] =================================');
    }, {
        timezone: 'Europe/Bucharest'  // Folosește timezone-ul României
    });

    console.log('✅ [DailyReports] Cron job inițializat (08:00 AM zilnic, Europe/Bucharest)');
}
