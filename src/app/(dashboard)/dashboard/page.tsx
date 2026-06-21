import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardOverviewClient from './DashboardOverviewClient';

export default async function DashboardOverview({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  const accountId = params.account || 'all';
  const session = await getSession();
  if (!session) redirect('/login');

  return <DashboardOverviewClient accountId={accountId} />;
}
