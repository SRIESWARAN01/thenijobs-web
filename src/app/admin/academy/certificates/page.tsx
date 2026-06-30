'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Loader2, Save, Sparkles, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { getCertificateTemplates, createCertificateTemplate, updateCertificateTemplate } from '@/lib/firebase/lmsService';
import { useAuth } from '@/hooks/useAuth';
import type { CertificateTemplate } from '@/lib/types/lms';

export default function CertificateTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [bgImage, setBgImage] = useState('');
  const [logoPos, setLogoPos] = useState<'top-left' | 'top-center' | 'top-right'>('top-center');
  const [sigImage, setSigImage] = useState('');
  const [sigName, setSigName] = useState('');
  const [sigTitle, setSigTitle] = useState('');
  
  const [primaryColor, setPrimaryColor] = useState('#7C3AED'); // violet-600
  const [secondaryColor, setSecondaryColor] = useState('#10B981'); // emerald-500
  const [accentColor, setAccentColor] = useState('#F59E0B'); // amber-500
  const [textColor, setTextColor] = useState('#F8FAFC'); // slate-50

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const list = await getCertificateTemplates();
      setTemplates(list);
      if (list.length > 0) {
        selectTemplate(list[0]);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (t: CertificateTemplate) => {
    setSelectedId(t.id);
    setName(t.name);
    setBgImage(t.backgroundImage || '');
    setLogoPos(t.logoPosition || 'top-center');
    setSigImage(t.signatureImage || '');
    setSigName(t.signatoryName || '');
    setSigTitle(t.signatoryTitle || '');
    setPrimaryColor(t.colorScheme?.primary || '#7C3AED');
    setSecondaryColor(t.colorScheme?.secondary || '#10B981');
    setAccentColor(t.colorScheme?.accent || '#F59E0B');
    setTextColor(t.colorScheme?.text || '#F8FAFC');
  };

  const handleNewTemplate = () => {
    setSelectedId(null);
    setName('New Certificate Template');
    setBgImage('');
    setLogoPos('top-center');
    setSigImage('');
    setSigName('CEO Name');
    setSigTitle('Managing Director');
    setPrimaryColor('#7C3AED');
    setSecondaryColor('#10B981');
    setAccentColor('#F59E0B');
    setTextColor('#F8FAFC');
  };

  const handleSave = async () => {
    if (!user?.uid || !name.trim()) return;
    setSaving(true);

    const templateData = {
      name: name.trim(),
      backgroundImage: bgImage.trim(),
      logoPosition: logoPos,
      signatureImage: sigImage.trim(),
      signatoryName: sigName.trim(),
      signatoryTitle: sigTitle.trim(),
      colorScheme: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        text: textColor,
      },
      fontFamily: 'Inter, Outfit',
      isDefault: templates.length === 0, // default if first template
      createdBy: user.uid,
    };

    try {
      if (selectedId) {
        await updateCertificateTemplate(selectedId, templateData);
        alert('Template updated successfully!');
      } else {
        await createCertificateTemplate(templateData);
        alert('Template created successfully!');
      }
      await loadTemplates();
    } catch (err) {
      console.error('Save template error:', err);
      alert('Failed to save certificate template');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (t: CertificateTemplate) => {
    setSaving(true);
    try {
      // Set all other templates default flag to false, and this one to true
      await updateCertificateTemplate(t.id, { isDefault: true });
      for (const other of templates) {
        if (other.id !== t.id && other.isDefault) {
          await updateCertificateTemplate(other.id, { isDefault: false });
        }
      }
      alert('Default certificate template updated');
      await loadTemplates();
    } catch (err) {
      console.error('Set default template error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Certificate Templates</h1>
          <p className="text-sm text-gray-400 mt-1">Design and manage certificate styles for course completion</p>
        </div>
        <button onClick={handleNewTemplate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:opacity-90 transition-opacity self-start">
          <Plus size={16} /> Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates Sidebar */}
        <div className="glass-card rounded-2xl p-5 space-y-4 lg:col-span-1 h-fit">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Available Templates</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-violet-400" size={20} />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-xs text-gray-500">No custom templates designed yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} onClick={() => selectTemplate(t)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedId === t.id ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03]'}`}>
                  <div>
                    <p className="text-sm text-white font-semibold">{t.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">By Admin</p>
                  </div>
                  {t.isDefault ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} /> Default
                    </span>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleSetDefault(t); }}
                      className="text-[9px] text-gray-500 hover:text-violet-400 font-bold uppercase hover:underline">
                      Set Default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificate Designer Editor */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6">
          <div className="border-b border-white/[0.06] pb-4 flex justify-between items-center">
            <h2 className="text-base font-bold text-white">{selectedId ? 'Edit Layout Settings' : 'Design New Layout'}</h2>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Layout
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Template Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] px-3.5 py-2 text-sm rounded-xl text-white placeholder:text-gray-600 focus:border-violet-500/30 outline-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Background Image URL</label>
                <input type="text" value={bgImage} onChange={e => setBgImage(e.target.value)} placeholder="https://..."
                  className="w-full bg-white/[0.03] border border-white/[0.08] px-3.5 py-2 text-sm rounded-xl text-white placeholder:text-gray-600 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Logo Placement</label>
                <select value={logoPos} onChange={e => setLogoPos(e.target.value as any)}
                  className="w-full bg-[#0F172A] border border-white/[0.08] px-3.5 py-2 text-sm rounded-xl text-white outline-none">
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
            </div>

            <div className="border-t border-white/[0.05] pt-4">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">Signatory Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Authorized Signatory Name</label>
                  <input type="text" value={sigName} onChange={e => setSigName(e.target.value)} placeholder="CEO / Director Name"
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-3.5 py-2 text-sm rounded-xl text-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Signatory Title</label>
                  <input type="text" value={sigTitle} onChange={e => setSigTitle(e.target.value)} placeholder="e.g., Managing Director"
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-3.5 py-2 text-sm rounded-xl text-white outline-none" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Signature Image URL</label>
                <input type="text" value={sigImage} onChange={e => setSigImage(e.target.value)} placeholder="https://..."
                  className="w-full bg-white/[0.03] border border-white/[0.08] px-3.5 py-2 text-sm rounded-xl text-white outline-none" />
              </div>
            </div>

            {/* Colors */}
            <div className="border-t border-white/[0.05] pt-4">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">Color Scheme</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Primary Accent</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent" />
                    <span className="text-xs text-gray-400 uppercase font-mono">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Secondary Accent</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent" />
                    <span className="text-xs text-gray-400 uppercase font-mono">{secondaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent" />
                    <span className="text-xs text-gray-400 uppercase font-mono">{accentColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Certificate Text</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent" />
                    <span className="text-xs text-gray-400 uppercase font-mono">{textColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Banner */}
            <div className="border-t border-white/[0.05] pt-4 space-y-2">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Live Mockup Preview</h3>
              <div className="border border-white/[0.08] bg-slate-900/60 rounded-2xl p-6 aspect-[1.414/1] flex flex-col justify-between text-center relative overflow-hidden select-none">
                {bgImage && <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-20" />}
                
                <div className={`flex justify-center mb-2`}>
                  <div className="px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={11} /> THENIJOBS ACADEMY
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-black uppercase tracking-widest" style={{ color: primaryColor }}>Certificate of Completion</h4>
                  <p className="text-[10px] text-gray-400 italic">This is proudly presented to</p>
                  <h3 className="text-xl font-bold font-outfit" style={{ color: textColor }}>John Doe</h3>
                  <p className="text-[9px] text-gray-500 max-w-md mx-auto leading-relaxed">
                    for successfully demonstrating industry proficiency and completing the certified professional course curriculum of
                  </p>
                  <h4 className="text-sm font-bold" style={{ color: secondaryColor }}>React & Firebase Seeker Dashboard Implementation</h4>
                </div>

                <div className="flex justify-between items-end border-t border-white/[0.04] pt-4 mt-4">
                  <div className="text-left text-[9px] text-gray-500">
                    <p>Date: June 30, 2026</p>
                    <p className="font-mono mt-0.5">Verify ID: TNI-CERT-MOCK</p>
                  </div>
                  {sigImage ? (
                    <div className="flex flex-col items-center">
                      <img src={sigImage} alt="" className="max-h-8 object-contain pointer-events-none mb-1 filter brightness-110" />
                      <p className="text-[9px] text-white font-bold">{sigName}</p>
                      <p className="text-[7px] text-gray-500 uppercase tracking-wider">{sigTitle}</p>
                    </div>
                  ) : (
                    <div className="text-right text-[9px] text-gray-500">
                      <div className="w-16 h-0.5 bg-gray-700 mx-auto mb-1" />
                      <p className="text-white font-bold">{sigName}</p>
                      <p className="text-[7px] uppercase tracking-wider">{sigTitle}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
