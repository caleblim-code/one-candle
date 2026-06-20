import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const trades = await prisma.trade.findMany({
    where: { userId: session.id },
    orderBy: { entryDate: 'desc' }
  });

  const journals = await prisma.dailyJournal.findMany({
    where: { userId: session.id }
  });

  return <AnalyticsClient initialTrades={trades} initialJournals={journals} />;
}
