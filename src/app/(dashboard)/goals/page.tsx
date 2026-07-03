import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import GoalsClient from './GoalsClient';

export default async function GoalsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <GoalsClient />
    </div>
  );
}
