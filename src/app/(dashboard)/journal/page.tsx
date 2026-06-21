import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import JournalClient from './JournalClient';

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  const params = await searchParams;
  const accountId = params.account || 'all';
  const session = await getSession();
  if (!session) redirect('/login');

  return <JournalClient accountId={accountId} />;
}
