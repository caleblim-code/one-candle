import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import JournalClient from './JournalClient';

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
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
    orderBy: { entryDate: 'desc' },
    include: { playbook: { select: { id: true, name: true } } }
  });

  return <JournalClient initialTrades={trades} />;
}
