'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import CompanyIDCard from '@/components/id-card/CompanyIDCard';

export default function EmployerIDCardPage() {
  const { user } = useAuth();
  const { data: companies, loading } = useCollection<any>(
    'companies',
    [where('ownerId', '==', user?.uid || '')],
    { skip: !user?.uid },
  );
  const company = companies?.[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500" size={28} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 sm:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No Company Found</h2>
          <p className="text-sm text-gray-500 mb-4">Register your company first to get a Digital ID Card.</p>
          <Link
            href="/company/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-900 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            Register Company
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = company.verificationStatus === 'verified';

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <CreditCard size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Company Digital ID Card
            </h1>
            <p className="text-xs text-gray-500">Your official THENIJOBS digital business card</p>
          </div>
        </div>
      </div>

      {!isVerified && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Pending Verification</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Your company is awaiting admin approval. The ID Card is a preview — it will be fully active once verified.
            </p>
          </div>
        </div>
      )}

      {/* Card Display */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center">
        <CompanyIDCard company={company} />
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 How to use your Digital ID Card</h3>
        <ul className="space-y-1.5 text-xs text-blue-700">
          <li>• Share with customers and partners as a digital business card</li>
          <li>• Print and display at your office or shop</li>
          <li>• QR code links directly to your THENIJOBS company portfolio</li>
          <li>• Download as PNG for WhatsApp, email, or printing</li>
        </ul>
      </div>
    </div>
  );
}
