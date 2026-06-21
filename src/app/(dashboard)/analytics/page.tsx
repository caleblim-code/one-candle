import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  const accountId = params.account || 'all';
  const session = await getSession();
  if (!session) redirect('/login');

  return <AnalyticsClient accountId={accountId} />;
}
