import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const trades = await prisma.trade.findMany({
    where: { userId: session.id, status: 'Closed' },
  });

  return <AnalyticsClient trades={trades} />;
}
