'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, Award, Eye, Download, XCircle } from 'lucide-react';
import { verifyCertificate, getDefaultTemplate } from '@/lib/firebase/lmsService';
import CertificateGenerator from '@/components/academy/CertificateGenerator';
import type { Certificate, CertificateTemplate } from '@/lib/types/lms';

export default function PublicVerificationPage() {
  const params = useParams();
  const certNumber = params?.certNumber as string;
  const router = useRouter();

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certNumber) return;

    const performVerification = async () => {
      try {
        const cert = await verifyCertificate(certNumber);
        if (cert) {
          setCertificate(cert);
          const defaultT = await getDefaultTemplate();
          setTemplate(defaultT);
        }
      } catch (err) {
        console.error('Error during verification:', err);
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [certNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070714] text-white flex flex-col items-center justify-center font-outfit">
        <Loader2 className="animate-spin text-violet-400 mb-2" size={36} />
        <p className="text-sm text-gray-400">Verifying credential ID in Firestore...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070714] text-white font-outfit py-16 px-4 flex flex-col justify-center items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Verification Alert Banner */}
        <div className="flex justify-center">
          {certificate ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-3.5 rounded-2xl text-emerald-400 shadow-xl max-w-md w-full">
              <ShieldCheck size={28} className="shrink-0 animate-pulse" />
              <div className="text-left text-xs">
                <p className="font-black uppercase tracking-wider">Credential Verified</p>
                <p className="text-gray-400 mt-0.5">This certificate is valid, authentic, and registered on THENIJOBS.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 px-6 py-3.5 rounded-2xl text-rose-400 shadow-xl max-w-md w-full">
              <XCircle size={28} className="shrink-0" />
              <div className="text-left text-xs">
                <p className="font-black uppercase tracking-wider">Verification Failed</p>
                <p className="text-gray-400 mt-0.5">The provided certificate ID was not found or is no longer valid.</p>
              </div>
            </div>
          )}
        </div>

        {certificate ? (
          <div className="space-y-6">
            {/* Embedded visually generated mockup canvas */}
            <CertificateGenerator certificate={certificate} template={template} />

            {/* Back Home button */}
            <div className="text-center">
              <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors underline font-medium">
                Go to THENIJOBS Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 max-w-sm mx-auto">
            <p className="text-sm text-gray-500">
              Please double check the URL verification parameter or contact support if you believe this is an error.
            </p>
            <Link href="/" className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] font-semibold text-xs uppercase tracking-wider text-center block transition-colors">
              Back to Homepage
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
