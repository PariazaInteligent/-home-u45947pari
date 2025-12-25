
import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    console.log('Inserting test trade...');

    const trade = await prisma.trade.create({
        data: {
            sport: 'Fotbal',
            event: 'Macarthur Sydney vs Brisbane Roar',
            market: 'Corner In Interval De Timp. 46-60',
            selection: 'Da', // Shortened from "Da (Echipa 1)" based on image "Da"
            odds: new Decimal(1.7),
            stake: new Decimal(11.42),
            potentialWin: new Decimal(19.41),
            status: 'SETTLED_WIN',
            resultAmount: new Decimal(19.41),
            settledAt: new Date('2025-12-19T10:00:00Z'), // Past date
            createdAt: new Date('2025-12-19T07:41:00Z'),
            createdBy: 'system', // Required field
            // No bookmaker field in schema
        }
    });

    // Create settlement event as well since public.routes.ts checks for it for Edge calculation
    // "settlement_events: { providerOdds: { not: null } }"
    await prisma.settlementEvent.create({
        data: {
            tradeId: trade.id,
            settledBy: 'system',
            providerResult: 'WIN',
            providerOdds: new Decimal(1.7), // Assuming closing odds were same or similar
            settledAt: new Date(),
        }
    })

    console.log('Trade inserted:', trade);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
