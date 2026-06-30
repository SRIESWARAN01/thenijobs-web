'use client';

import { useRef, useState } from 'react';
import { Download, FileText, Loader2, Sparkles, Award } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import QRCodeGenerator from './QRCodeGenerator';
import type { Certificate, CertificateTemplate } from '@/lib/types/lms';

interface CertificateProps {
  certificate: Certificate;
  template?: CertificateTemplate | null;
}

export default function CertificateGenerator({ certificate, template }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Fallback defaults
  const primaryColor = template?.colorScheme?.primary || '#7C3AED'; // violet-600
  const secondaryColor = template?.colorScheme?.secondary || '#10B981'; // emerald-500
  const textColor = template?.colorScheme?.text || '#F8FAFC'; // slate-50

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);

    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Enhance text rendering sharpness in PDF export
        useCORS: true,
        backgroundColor: '#0F172A',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`THENIJOBS-Certification-${certificate.certificateNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Could not export PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = certificate.completionDate
    ? new Date((certificate.completionDate as any).seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  return (
    <div className="space-y-6 text-center">
      {/* Cert Canvas container */}
      <div className="border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl p-0.5 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 max-w-4xl mx-auto">
        <div
          ref={certificateRef}
          className="relative aspect-[1.414/1] w-full bg-[#070714] flex flex-col justify-between p-8 sm:p-12 text-center text-white overflow-hidden select-none border border-white/[0.04] rounded-3xl"
        >
          {/* Decorative frame elements */}
          {template?.backgroundImage ? (
            <img src={template.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none" />
          ) : (
            <div className="absolute inset-0 border-[6px] border-violet-500/10 rounded-2xl m-4 pointer-events-none" />
          )}

          {/* Logo header panel */}
          <div className="flex justify-center">
            <div className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={11} className="text-violet-400" /> THENIJOBS LEARNING ACADEMY
            </div>
          </div>

          {/* Core content */}
          <div className="space-y-3 sm:space-y-4 relative z-10">
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-widest" style={{ color: primaryColor }}>
              Certificate of Completion
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400 italic">This is proudly presented to</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold" style={{ color: textColor }}>
              {certificate.userName}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
              for successfully completing all lesson parameters, passing assessments, and demonstrating verified expertise in the professional curriculum of:
            </p>
            <h3 className="text-base sm:text-xl font-bold" style={{ color: secondaryColor }}>
              {certificate.courseName}
            </h3>
          </div>

          {/* Verification panel & signatures */}
          <div className="flex items-end justify-between border-t border-white/[0.04] pt-6 relative z-10">
            {/* Left QR Code validation */}
            <div className="flex items-center gap-4 text-left">
              <QRCodeGenerator value={certificate.verificationUrl} size={64} includeLogo={false} />
              <div className="text-[9px] text-gray-500 space-y-0.5">
                <p className="font-bold text-white">Scan to Verify</p>
                <p>Date: {formattedDate}</p>
                <p className="font-mono text-[8px] mt-0.5">ID: {certificate.certificateNumber}</p>
              </div>
            </div>

            {/* Right Authorized signature details */}
            <div className="text-center">
              {template?.signatureImage ? (
                <div className="flex flex-col items-center">
                  <img src={template.signatureImage} alt="" className="h-8 object-contain mb-1 filter brightness-110" />
                  <p className="text-[10px] text-white font-bold">{template.signatoryName}</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-wider">{template.signatoryTitle}</p>
                </div>
              ) : (
                <div className="text-center text-[9px] text-gray-500">
                  <div className="w-16 h-0.5 bg-gray-700 mx-auto mb-1" />
                  <p className="text-white font-bold">{template?.signatoryName || 'CEO'}</p>
                  <p className="text-[8px] uppercase tracking-wider">{template?.signatoryTitle || 'Authorized Signature'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 text-white"
      >
        {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {downloading ? 'Downloading...' : 'Download Certificate PDF'}
      </button>
    </div>
  );
}
