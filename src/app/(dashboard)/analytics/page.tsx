import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  const accountId = params.account;
  const session = await getSession();
  if (!session) redirect('/login');

  const whereClause: any = { userId: session.id };
  if (accountId && accountId !== 'all') {
    whereClause.accountId = accountId;
  }

  const trades = await prisma.trade.findMany({
    where: whereClause,
    orderBy: { entryDate: 'desc' }
  });

  const journals = await prisma.dailyJournal.findMany({
    where: { userId: session.id }
  });

  return <AnalyticsClient initialTrades={trades} initialJournals={journals} />;
}
