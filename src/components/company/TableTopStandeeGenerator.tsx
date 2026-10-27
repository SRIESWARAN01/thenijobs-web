'use client';

import { useState, useEffect } from 'react';
import { Download, QrCode, Printer, Check, Share2, Sparkles, Building2, Phone, MapPin, Eye, FileText, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { generateTableTopStandeePdf, type StandeeMode, type StandeeSize, type StandeeTheme } from '@/lib/pdf/tableTopStandeeGenerator';

interface TableTopStandeeGeneratorProps {
  company: {
    id: string;
    slug?: string;
    name: string;
    tagline?: string;
    location?: string;
    district?: string;
    phone?: string;
    whatsapp?: string;
    logoUrl?: string;
    companyLogo?: string;
  };
}

export default function TableTopStandeeGenerator({ company }: TableTopStandeeGeneratorProps) {
  const [mode, setMode] = useState<StandeeMode>('hiring');
  const [size, setSize] = useState<StandeeSize>('a5');
  const [theme, setTheme] = useState<StandeeTheme>('blue');
  const [customHeadline, setCustomHeadline] = useState('');
  const [customSubtext, setCustomSubtext] = useState('');
  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const websiteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${company.slug || company.id}`
    : `https://www.thenijobs.com/${company.slug || company.id}`;

  const locationDisplay = company.location
    ? `${company.location}, ${company.district || 'Theni'} District`
    : `${company.district || 'Theni'} District`;

  const phoneDisplay = company.whatsapp || company.phone || '+91 93605 19460';

  useEffect(() => {
    QRCode.toDataURL(websiteUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: theme === 'blue' ? '#1E40AF' : theme === 'emerald' ? '#065F46' : '#0F172A',
        light: '#FFFFFF',
      },
    }).then(url => setQrPreviewUrl(url)).catch(err => console.error(err));
  }, [websiteUrl, theme]);

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      const doc = await generateTableTopStandeePdf({
        mode,
        size,
        theme,
        companyName: company.name || 'Company',
        tagline: company.tagline,
        location: locationDisplay,
        phone: phoneDisplay,
        websiteUrl,
        logoUrl: company.logoUrl || company.companyLogo,
        customHeadline: customHeadline.trim() || undefined,
        customSubtext: customSubtext.trim() || undefined,
      });

      const safeName = (company.name || 'standee').toLowerCase().replace(/[^a-z0-9]/g, '_');
      doc.save(`THENIJOBS_${safeName}_${mode}_standee_${size.toUpperCase()}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('[Standee PDF Generation Error]:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToWhatsApp = () => {
    const text = `📢 ${company.name} Table-Top Standee is ready!\nPrint and place this on your cash counter so visitors can scan and apply or view your products:\n🔗 ${websiteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="font-outfit space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
          <QrCode size={14} /> Printable Table-Top Standee Generator
        </div>
        <h2 className="text-xl sm:text-2xl font-black">
          Generate Cash Counter QR Standee (மேஜை ஸ்டாண்டி)
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
          1-Click printable PDF standee designed to sit on your billing counter. Visitors point their smartphone camera to instantly apply for jobs or browse your catalog!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-2">
              1. Standee Purpose (ஸ்டாண்டி நோக்கம்)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('hiring')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'hiring'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-xs font-black text-blue-900">💼 We Are Hiring</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">வேலைக்கு ஆட்கள் தேவை</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('catalog')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'catalog'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-xs font-black text-emerald-900">🛍️ Products & Offers</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">தயாரிப்புகள் & சலுகைகள்</span>
              </button>
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-2">
              2. Print Size (அளவு)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSize('a5')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  size === 'a5'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="block text-xs font-bold">A5 Counter Standee (Compact)</span>
                <span className="block text-[10px] text-gray-500">148 × 210 mm • Ideal for Cash Counters</span>
              </button>
              <button
                type="button"
                onClick={() => setSize('a4')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  size === 'a4'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="block text-xs font-bold">A4 Full Standee (Poster)</span>
                <span className="block text-[10px] text-gray-500">210 × 297 mm • Ideal for Entrance Glass</span>
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-2">
              3. Standee Color Style
            </label>
            <div className="flex gap-3">
              {[
                { id: 'blue', label: 'Theni Royal Blue', bg: 'bg-blue-800' },
                { id: 'emerald', label: 'Forest Emerald', bg: 'bg-emerald-800' },
                { id: 'navy', label: 'Classic Slate', bg: 'bg-slate-900' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as StandeeTheme)}
                  className={`flex-1 p-2.5 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    theme === t.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${t.bg} shrink-0`} />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Copy (Optional) */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Custom Headline (Optional)
              </label>
              <input
                type="text"
                placeholder={mode === 'hiring' ? 'e.g. URGENT CASHIER & SALES STAFF NEEDED' : 'e.g. SPECIAL 20% DISCOUNT ON ALL SPICES'}
                value={customHeadline}
                onChange={e => setCustomHeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Download & Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex-1 px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating Print PDF...
                </>
              ) : downloadSuccess ? (
                <>
                  <Check size={16} className="text-emerald-300" />
                  PDF Downloaded!
                </>
              ) : (
                <>
                  <Download size={16} />
                  Download Printable PDF ({size.toUpperCase()})
                </>
              )}
            </button>

            <button
              onClick={handleShareToWhatsApp}
              className="px-4 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 size={16} /> WhatsApp Link
            </button>
          </div>
        </div>

        {/* Live Visual Standee Mockup Column */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
            <Eye size={14} /> Live Print Preview ({size.toUpperCase()} Standee)
          </p>

          <div
            className={`w-full max-w-[340px] bg-white rounded-3xl border-2 shadow-2xl overflow-hidden transition-all duration-300 ${
              theme === 'blue'
                ? 'border-blue-900'
                : theme === 'emerald'
                ? 'border-emerald-900'
                : 'border-slate-900'
            }`}
          >
            {/* Standee Header */}
            <div
              className={`p-4 text-center text-white ${
                theme === 'blue'
                  ? 'bg-blue-800'
                  : theme === 'emerald'
                  ? 'bg-emerald-800'
                  : 'bg-slate-900'
              }`}
            >
              <span className="block text-[8px] font-bold tracking-widest text-amber-300 uppercase">
                THENIJOBS.COM • OFFICIAL DIRECTORY
              </span>
              <h3 className="text-base font-black truncate mt-0.5">
                {company.name.toUpperCase()}
              </h3>
              <p className="text-[10px] text-white/80 truncate">
                {locationDisplay}
              </p>
            </div>

            {/* Standee Body */}
            <div className="p-5 text-center flex flex-col items-center">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 tracking-wider mb-1">
                {mode === 'hiring' ? '⚡ WE ARE HIRING!' : '🛍️ SPECIAL OFFERS'}
              </span>
              <h4 className="text-sm font-black text-gray-900 leading-tight mb-0.5">
                {customHeadline || (mode === 'hiring' ? 'வேலைக்கு ஆட்கள் தேவை!' : 'எங்கள் தயாரிப்புகள்')}
              </h4>
              <p className="text-[10px] text-gray-500 max-w-[240px] mb-3">
                {mode === 'hiring'
                  ? 'Scan to view all open vacancies and apply on THENIJOBS in 1 tap.'
                  : 'Scan to browse our digital catalog, prices, and daily offers.'}
              </p>

              {/* QR Code Container */}
              <div className="p-2.5 bg-white border-2 border-dashed border-gray-300 rounded-2xl shadow-sm mb-3">
                {qrPreviewUrl ? (
                  <img src={qrPreviewUrl} alt="Standee QR Code" className="w-36 h-36 rounded-lg" />
                ) : (
                  <div className="w-36 h-36 bg-gray-100 flex items-center justify-center text-gray-400">
                    <QrCode size={40} />
                  </div>
                )}
              </div>

              {/* Scan Pill */}
              <div
                className={`px-3 py-1 rounded-full text-[9px] font-bold text-white mb-3 shadow-xs ${
                  theme === 'blue'
                    ? 'bg-blue-800'
                    : theme === 'emerald'
                    ? 'bg-emerald-800'
                    : 'bg-slate-900'
                }`}
              >
                📱 POINT CAMERA TO SCAN • கேமராவில் ஸ்கேன் செய்க
              </div>

              {/* Contact Footer */}
              <div className="w-full pt-2 border-t border-gray-100 text-[10px] text-gray-600 flex items-center justify-center gap-3">
                <span className="font-bold">{phoneDisplay}</span>
              </div>
            </div>

            {/* Folding Guide Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-dashed border-gray-300 text-center text-[8px] font-bold text-gray-400 tracking-wider">
              ✂️ FOLD HERE FOR CASH COUNTER TABLE-TOP DISPLAY
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
