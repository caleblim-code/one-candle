import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import InsightsClient from './InsightsClient';

export default async function InsightsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <InsightsClient />
    </div>
  );
}
