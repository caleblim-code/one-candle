import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PlaybooksClient from './PlaybooksClient';

export default async function PlaybooksPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const playbooks = await prisma.playbook.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    include: { trades: true }
  });

  return <PlaybooksClient initialPlaybooks={playbooks} />;
}
