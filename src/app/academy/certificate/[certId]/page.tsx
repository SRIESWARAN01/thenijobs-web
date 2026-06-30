'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Share2, Printer, Sparkles } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { normaliseTimestamps } from '@/lib/firebase/serializers';
import CertificateGenerator from '@/components/academy/CertificateGenerator';
import { getDefaultTemplate } from '@/lib/firebase/lmsService';
import type { Certificate, CertificateTemplate } from '@/lib/types/lms';

export default function CertificatePage() {
  const router = useRouter();
  const params = useParams();
  const certId = params?.certId as string;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certId) return;

    const loadCertificateData = async () => {
      try {
        const snap = await getDoc(doc(db, 'certificates', certId));
        if (!snap.exists()) {
          alert('Certificate not found');
          router.push('/academy');
          return;
        }

        const cert = { id: snap.id, ...normaliseTimestamps(snap.data()) } as Certificate;
        setCertificate(cert);

        // Fetch default layout template
        const defaultT = await getDefaultTemplate();
        setTemplate(defaultT);
      } catch (err) {
        console.error('Error loading certificate:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCertificateData();
  }, [certId, router]);

  const handleShare = async () => {
    if (!certificate) return;
    const shareUrl = `${window.location.origin}/verify/certificate/${certificate.certificateNumber}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certification - ${certificate.courseName}`,
          text: `I just earned a professional verified certificate for "${certificate.courseName}" on THENIJOBS Learning Academy! Check it out.`,
          url: shareUrl,
        });
      } catch (err) {
        console.warn('Web Share API aborted:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Verification link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070714] text-white flex flex-col items-center justify-center font-outfit">
        <Loader2 className="animate-spin text-violet-400 mb-2" size={36} />
        <p className="text-sm text-gray-400">Loading certificate details...</p>
      </div>
    );
  }

  if (!certificate) return null;

  return (
    <main className="min-h-screen bg-[#070714] text-white font-outfit pb-16">
      <section className="pt-24 pb-8 max-w-4xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/academy')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors uppercase font-black">
            <ArrowLeft size={14} /> Academy Catalog
          </button>
          
          <div className="flex gap-2">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-xs font-semibold transition-colors">
              <Share2 size={13} /> Share Link
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-xs font-semibold transition-colors">
              <Printer size={13} /> Print Layout
            </button>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            ✓ Certified Professional Credential
          </div>
          <h1 className="text-2xl font-black text-white">Course Graduation Certificate</h1>
          <p className="text-xs text-gray-400">Issued by THENIJOBS Academy on completion of all syllabus requirements</p>
        </div>

        {/* Certificate preview generator */}
        <CertificateGenerator certificate={certificate} template={template} />
      </section>
    </main>
  );
}
