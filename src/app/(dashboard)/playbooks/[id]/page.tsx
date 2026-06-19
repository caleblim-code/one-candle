import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PlaybookDetailClient from './PlaybookDetailClient';

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const playbook = await prisma.playbook.findUnique({
    where: { id, userId: session.id },
    include: {
      trades: {
        orderBy: { entryDate: 'asc' }
      }
    }
  });

  if (!playbook) {
    redirect('/playbooks');
  }

  return <PlaybookDetailClient playbook={playbook} />;
}
