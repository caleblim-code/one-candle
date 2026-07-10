import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const trades = await prisma.trade.findMany({ orderBy: { entryDate: 'asc' } });
  trades.forEach(t => {
    if (t.status === 'Closed' && t.pnl !== null) {
      console.log(t.entryDate.toISOString().slice(0, 10), 'to', t.exitDate?.toISOString().slice(0, 10), 'PnL:', t.pnl);
    }
  });
}
main().finally(() => prisma.$disconnect());
