import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const trades = await prisma.trade.findMany({ orderBy: { entryDate: 'desc' }, take: 10 });
  trades.forEach(t => console.log(t.entryDate.toISOString(), t.exitDate?.toISOString(), t.pnl));
}
main().finally(() => prisma.$disconnect());
