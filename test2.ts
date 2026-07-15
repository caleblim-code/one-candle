import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const goal = await prisma.goal.findFirst();
  const trades = await prisma.trade.findMany({ orderBy: { entryDate: 'asc' } });
  
  let analyticsCount = 0;
  let goalsVolumeCount = 0;
  
  const localStartDate = new Date(goal.startDate.getTime() - 480 * 60000);
  const localEndDate = new Date(goal.endDate.getTime() - 480 * 60000);

  trades.forEach(t => {
    // Analytics logic for "This Month" (July 2026)
    const tradeDate = new Date(t.exitDate || t.entryDate);
    const localTradeDate = new Date(tradeDate.getTime() + 8 * 3600000);
    if (localTradeDate.getUTCMonth() === 6 && localTradeDate.getUTCFullYear() === 2026) {
      analyticsCount++;
    }
    
    // Goals Volume logic
    if (t.entryDate >= localStartDate && t.entryDate <= localEndDate) {
      goalsVolumeCount++;
    }
  });
  
  console.log(`Analytics July Trades: ${analyticsCount}`);
  console.log(`Goals Volume Trades: ${goalsVolumeCount}`);
  
  // Trades Today (July 15th local)
  let tradesTodayServer = 0;
  let tradesTodayLocal = 0;
  
  const now = new Date('2026-07-15T14:16:00.000Z'); // Current UTC time
  const todayStartServer = new Date(now);
  todayStartServer.setHours(0, 0, 0, 0);
  const todayEndServer = new Date(now);
  todayEndServer.setHours(23, 59, 59, 999);
  
  const localNow = new Date(now.getTime() + 8 * 3600000);
  const localTodayStart = new Date(localNow);
  localTodayStart.setUTCHours(0, 0, 0, 0);
  const localTodayEnd = new Date(localNow);
  localTodayEnd.setUTCHours(23, 59, 59, 999);
  
  const todayStartUTC = new Date(localTodayStart.getTime() - 8 * 3600000);
  const todayEndUTC = new Date(localTodayEnd.getTime() - 8 * 3600000);

  trades.forEach(t => {
    if (t.entryDate >= todayStartServer && t.entryDate <= todayEndServer) {
      tradesTodayServer++;
    }
    if (t.entryDate >= todayStartUTC && t.entryDate <= todayEndUTC) {
      tradesTodayLocal++;
    }
  });
  console.log(`Trades Today (Server UTC): ${tradesTodayServer}`);
  console.log(`Trades Today (Local +8): ${tradesTodayLocal}`);
  
}
main().finally(() => prisma.$disconnect());
