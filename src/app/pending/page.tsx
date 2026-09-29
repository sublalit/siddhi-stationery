import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock3, Package } from 'lucide-react';
import { getSessionApproval } from '@/lib/sessionApproval';

export default async function PendingApprovalPage() {
  const { user, isApproved } = await getSessionApproval();
  if (user && isApproved) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00aeef] via-[#00a2df] to-[#008fca] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-50 text-[#00aeef] flex items-center justify-center">
          <Package className="w-7 h-7" />
        </div>
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock3 className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Waiting for approval</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your account has been created and is waiting for Admin approval.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
