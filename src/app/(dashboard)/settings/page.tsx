import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <SettingsClient user={{ name: session.name, email: session.email }} />;
}
