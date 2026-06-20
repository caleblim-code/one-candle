import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import DailyNotesClient from './DailyNotesClient';

export default async function DailyNotesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const journals = await prisma.dailyJournal.findMany({
    where: { userId: session.id },
    orderBy: { date: 'desc' }
  });

  const trades = await prisma.trade.findMany({
    where: { userId: session.id },
    orderBy: { entryDate: 'asc' }
  });

  return <DailyNotesClient initialJournals={journals} initialTrades={trades} />;
}
