import { redirect } from 'next/navigation';
import { getSessionApproval } from '@/lib/sessionApproval';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isApproved } = await getSessionApproval();

  if (!user) {
    redirect('/login');
  }

  if (!isApproved) {
    redirect('/pending');
  }

  return children;
}
