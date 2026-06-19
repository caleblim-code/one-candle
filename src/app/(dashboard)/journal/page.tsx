import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import JournalClient from './JournalClient';

export default async function JournalPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const trades = await prisma.trade.findMany({
    where: { userId: session.id },
    orderBy: { entryDate: 'desc' },
    include: { playbook: { select: { id: true, name: true } } }
  });

  return <JournalClient initialTrades={trades} />;
}
