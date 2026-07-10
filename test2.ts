import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const goal = await prisma.goal.findFirst();
  
  const trades = await prisma.trade.findMany({
    where: { entryDate: { gte: goal.startDate, lte: goal.endDate } }
  });
  
  let totalPnl = 0;
  trades.forEach(t => {
    if (t.status === 'Closed' && t.pnl !== null) {
      totalPnl += t.pnl;
    }
  });
  console.log('Old PnL (by entryDate):', totalPnl);
}
main().finally(() => prisma.$disconnect());
