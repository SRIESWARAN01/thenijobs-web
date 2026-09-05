'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Loader2, CreditCard, AlertCircle, Sparkles, Building2 } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-outfit">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-xs text-gray-500 font-semibold">Generating your digital visiting card...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
            <Building2 size={26} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">No Company Registered</h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            Register your business profile first to generate your official THENIJOBS Digital Visiting Card with verified QR pass.
          </p>
          <Link
            href="/employer/company-profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Create Company Profile
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = company.verificationStatus === 'verified';

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-outfit text-gray-900 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">
          Digital Business Visiting Card
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Your official company visiting card with instant QR portfolio pass, downloadable in high-resolution for print and WhatsApp sharing.
        </p>
      </div>

      {!isVerified && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-xs">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-bold text-amber-950">Verification in Progress</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Your company profile is currently being verified. This digital card is fully functional for preview and sharing.
            </p>
          </div>
        </div>
      )}

      {/* Card Display Container */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs flex flex-col items-center">
        <CompanyIDCard company={company} />
      </div>

      {/* Usage Guide */}
      <div className="bg-blue-50/70 rounded-3xl p-5 sm:p-6 border border-blue-200 space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          How to utilize your Digital Visiting Card:
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-900 font-medium">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Share via WhatsApp to clients &amp; job seekers for instant company credibility</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Print and place at your office front desk or trade fair booth</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>QR code opens your live verified products &amp; services catalogue</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Download anytime in high-resolution vector format</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
