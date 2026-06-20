import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

import { prisma } from '@/lib/prisma';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      email: true,
      timezone: true,
      currency: true,
      defaultAsset: true,
      startingBalance: true,
      setupTags: true,
      mistakeTags: true,
    }
  });

  return <SettingsClient user={user} />;
}
