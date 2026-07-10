import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const goal = await prisma.goal.findFirst();
  console.log('Goal Start:', goal.startDate);
  console.log('Goal End:', goal.endDate);
  
  const trades = await prisma.trade.findMany({
    where: {
      OR: [
        { entryDate: { gte: goal.startDate, lte: goal.endDate } },
        { exitDate: { gte: goal.startDate, lte: goal.endDate } }
      ]
    }
  });
  
  let totalPnl = 0;
  let matches = 0;
  trades.forEach(t => {
    if (t.status === 'Closed' && t.exitDate && t.exitDate >= goal.startDate && t.exitDate <= goal.endDate) {
      if (t.pnl !== null) {
        totalPnl += t.pnl;
        matches++;
      }
    }
  });
  console.log('Total PnL counted for goal:', totalPnl);
  console.log('Matches:', matches);
}
main().finally(() => prisma.$disconnect());
