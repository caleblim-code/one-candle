import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PropFirmClient from './PropFirmClient';

export default async function PropFirmPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const urlAccountId = params.account;

  // Fetch all prop firm accounts for the user
  const propFirmAccounts = await prisma.tradingAccount.findMany({
    where: {
      userId: session.id,
      type: { in: ['Prop Firm Challenge', 'Prop Firm Funded'] }
    },
    include: {
      rules: true,
      payouts: true,
      trades: {
        where: { status: 'Closed' } // For PnL calculation
      }
    }
  });

  return <PropFirmClient accounts={propFirmAccounts} initialAccountId={urlAccountId !== 'all' ? urlAccountId : undefined} />;
}
