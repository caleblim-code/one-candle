import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const goal = await prisma.goal.findFirst();
  const trades = await prisma.trade.findMany({ orderBy: { entryDate: 'asc' } });
  
  let julyCount = 0;
  let julyTrades = [];
  
  // local start date for July 1st in Malaysia (+8, offset -480)
  const localStartDate = new Date(goal.startDate.getTime() - 480 * 60000);
  const localEndDate = new Date(goal.endDate.getTime() - 480 * 60000);

  trades.forEach(t => {
    if (t.entryDate >= localStartDate && t.entryDate <= localEndDate) {
      julyCount++;
      julyTrades.push(t);
    }
  });
  console.log(`Total trades entered in local July: ${julyCount}`);
  console.log(`Total trades in DB: ${trades.length}`);
}
main().finally(() => prisma.$disconnect());
