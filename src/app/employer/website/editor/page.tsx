'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Save, Eye, EyeOff, Globe, Monitor, Laptop, Tablet, Smartphone,
  Loader2, ChevronDown, ChevronUp, GripVertical, Plus, Trash2, Edit3,
  Palette, Type, Image as ImageIcon, Layout, Settings2, Sparkles, Undo, Redo,
  Check, X, Upload, Send
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { PORTFOLIO_SECTION_DEFS } from '@/lib/constants';
import { getPortfolioSectionsForPlan } from '@/lib/plans';
import type { PortfolioSite, PortfolioSection, PortfolioTheme, EditorState } from '@/lib/types/portfolio';
import { DEFAULT_EDITOR_STATE, DEVICE_SIZES, FONT_OPTIONS } from '@/lib/types/portfolio';
import TemplateRenderer from '@/components/portfolio/TemplateRenderer';

type EditorTab = 'sections' | 'theme' | 'branding' | 'seo';

export default function WebsiteEditorPage() {
  const { user } = useAuth();

  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];

  const { data: sites, loading } = useCollection<any>('portfolioSites', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const initialSite = sites?.[0] as PortfolioSite | undefined;

  const [site, setSite] = useState<PortfolioSite | null>(null);
  const [editor, setEditor] = useState<EditorState>(DEFAULT_EDITOR_STATE);
  const [activeTab, setActiveTab] = useState<EditorTab>('sections');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const planSlug = company?.planSlug || 'free';
  const availableSections = getPortfolioSectionsForPlan(planSlug);

  useEffect(() => {
    if (initialSite && !site) {
      setSite(initialSite);
    }
  }, [initialSite, site]);

  const updateSiteField = useCallback((path: string, value: any) => {
    setSite(prev => {
      if (!prev) return prev;
      const keys = path.split('.');
      const updated = JSON.parse(JSON.stringify(prev));
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
    setEditor(prev => ({ ...prev, isDirty: true }));
  }, []);

  const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
    setSite(prev => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sections.length) return prev;
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
      sections.forEach((s, i) => { s.order = i; });
      return { ...prev, sections };
    });
    setEditor(prev => ({ ...prev, isDirty: true }));
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setSite(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s),
      };
    });
    setEditor(prev => ({ ...prev, isDirty: true }));
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setSite(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) };
    });
    setEditor(prev => ({ ...prev, isDirty: true }));
  }, []);

  const addSection = useCallback((sectionType: string) => {
    const def = PORTFOLIO_SECTION_DEFS.find(d => d.type === sectionType);
    if (!def || !site) return;
    const newSection: PortfolioSection = {
      id: `section-${sectionType}-${Date.now()}`,
      type: sectionType as any,
      title: def.label,
      visible: true,
      order: site.sections.length,
      data: {},
    };
    setSite(prev => prev ? { ...prev, sections: [...prev.sections, newSection] } : prev);
    setEditor(prev => ({ ...prev, isDirty: true }));
  }, [site]);

  const handleSave = async () => {
    if (!site?.id) return;
    setSaving(true);
    try {
      await updateDocument('portfolioSites', site.id, {
        sections: site.sections,
        theme: site.theme,
        branding: site.branding,
        seo: site.seo,
        updatedAt: new Date(),
      });
      setEditor(prev => ({ ...prev, isDirty: false }));
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!site?.id) return;
    setPublishing(true);
    try {
      const newStatus = site.status === 'published' ? 'unpublished' : 'published';
      await updateDocument('portfolioSites', site.id, {
        status: newStatus,
        visibility: newStatus === 'published' ? 'public' : 'private',
        publishedAt: newStatus === 'published' ? new Date() : null,
        updatedAt: new Date(),
      });
      setSite(prev => prev ? { ...prev, status: newStatus as any, visibility: newStatus === 'published' ? 'public' : 'private' } : prev);
    } catch (err) { console.error(err); }
    finally { setPublishing(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Globe size={32} className="text-slate-500" />
        <p className="text-sm text-gray-500">No website found. Please select a template first.</p>
        <Link href="/employer/website/templates" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
          Choose Template
        </Link>
      </div>
    );
  }

  const sortedSections = [...site.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-[calc(100vh-72px)]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── EDITOR TOOLBAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/employer/website" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <ArrowLeft size={14} />
          </Link>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Website Editor</h2>
            <p className="text-[10px] text-gray-500">{site.branding.companyName} • {editor.isDirty ? '● Unsaved changes' : 'All saved'}</p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="hidden md:flex items-center gap-0.5 p-1 bg-gray-100 rounded-lg">
          {([
            { key: 'desktop', icon: Monitor, label: 'Desktop' },
            { key: 'laptop', icon: Laptop, label: 'Laptop' },
            { key: 'tablet', icon: Tablet, label: 'Tablet' },
            { key: 'mobile', icon: Smartphone, label: 'Mobile' },
          ] as const).map(d => {
            const Icon = d.icon;
            return (
              <button key={d.key} onClick={() => setEditor(prev => ({ ...prev, previewDevice: d.key }))}
                title={d.label}
                className={`p-1.5 rounded-md transition-all ${editor.previewDevice === d.key ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-gray-600'}`}>
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={!editor.isDirty || saving}
            className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1.5 transition-all">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
          </button>
          <button onClick={handlePublish} disabled={publishing}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              site.status === 'published' ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}>
            {publishing ? <Loader2 size={13} className="animate-spin" /> : site.status === 'published' ? <><EyeOff size={13} /> Unpublish</> : <><Send size={13} /> Publish</>}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR — Section/Theme Editor */}
        <div className="w-80 bg-white border-r border-gray-100 flex flex-col overflow-hidden flex-shrink-0">
          {/* Editor Tabs */}
          <div className="flex p-1 m-3 mb-0 rounded-xl bg-gray-100">
            {([
              { id: 'sections' as EditorTab, label: 'Sections', icon: Layout },
              { id: 'theme' as EditorTab, label: 'Design', icon: Palette },
              { id: 'branding' as EditorTab, label: 'Brand', icon: ImageIcon },
              { id: 'seo' as EditorTab, label: 'SEO', icon: Settings2 },
            ]).map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                  <Icon size={11} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* SECTIONS TAB */}
            {activeTab === 'sections' && (
              <>
                {sortedSections.map((section, index) => (
                  <div key={section.id} className={`border rounded-xl p-3 transition-all ${section.visible ? 'border-gray-100 bg-white' : 'border-gray-50 bg-gray-50 opacity-60'}`}>
                    <div className="flex items-center gap-2">
                      <GripVertical size={13} className="text-slate-500 cursor-grab flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{section.title}</p>
                        <p className="text-[9px] text-slate-500">{section.type}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronUp size={12} className="text-slate-500" /></button>
                        <button onClick={() => moveSection(index, 'down')} disabled={index === sortedSections.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronDown size={12} className="text-slate-500" /></button>
                        <button onClick={() => toggleSection(section.id)} className={`p-1 rounded hover:bg-gray-100 ${section.visible ? 'text-blue-500' : 'text-slate-500'}`}><Eye size={12} /></button>
                        <button onClick={() => setEditor(prev => ({ ...prev, selectedSectionId: section.id }))} className="p-1 rounded hover:bg-blue-50 text-blue-500"><Edit3 size={12} /></button>
                        <button onClick={() => removeSection(section.id)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Section */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Add Section</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {availableSections.filter(s => !sortedSections.find(ss => ss.type === s.type)).map(sectionDef => (
                      <button key={sectionDef.type} onClick={() => addSection(sectionDef.type)}
                        className="text-left p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                        <p className="text-[10px] font-semibold text-gray-700">{sectionDef.label}</p>
                        <p className="text-[8px] text-slate-500">{sectionDef.tamilLabel}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* THEME TAB */}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Colors</p>
                  {[
                    { key: 'primaryColor', label: 'Primary' },
                    { key: 'secondaryColor', label: 'Secondary' },
                    { key: 'backgroundColor', label: 'Background' },
                    { key: 'textColor', label: 'Text' },
                    { key: 'accentColor', label: 'Accent' },
                  ].map(color => (
                    <div key={color.key} className="flex items-center justify-between py-2">
                      <span className="text-xs text-gray-700">{color.label}</span>
                      <div className="flex items-center gap-2">
                        <input type="color" value={(site.theme as any)[color.key] || '#000000'}
                          onChange={e => updateSiteField(`theme.${color.key}`, e.target.value)}
                          className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer" />
                        <input type="text" value={(site.theme as any)[color.key] || ''}
                          onChange={e => updateSiteField(`theme.${color.key}`, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-[10px] font-mono text-gray-700" />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Typography</p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Body Font</label>
                      <select value={site.theme.fontFamily} onChange={e => updateSiteField('theme.fontFamily', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-base sm:text-xs">
                        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Heading Font</label>
                      <select value={site.theme.headingFont} onChange={e => updateSiteField('theme.headingFont', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-base sm:text-xs">
                        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Style</p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Border Radius</label>
                      <select value={site.theme.borderRadius} onChange={e => updateSiteField('theme.borderRadius', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-base sm:text-xs">
                        <option value="none">None</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="full">Full</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Animation</label>
                      <select value={site.theme.animation} onChange={e => updateSiteField('theme.animation', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-base sm:text-xs">
                        <option value="none">None</option><option value="subtle">Subtle</option><option value="moderate">Moderate</option><option value="dynamic">Dynamic</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BRANDING TAB */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                {[
                  { key: 'companyName', label: 'Company Name', type: 'text' },
                  { key: 'tagline', label: 'Tagline', type: 'text' },
                  { key: 'logo', label: 'Logo URL', type: 'text' },
                  { key: 'favicon', label: 'Favicon URL', type: 'text' },
                  { key: 'coverImage', label: 'Cover Image URL', type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">{field.label}</label>
                    <input type={field.type} value={(site.branding as any)[field.key] || ''}
                      onChange={e => updateSiteField(`branding.${field.key}`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-xs text-gray-900 placeholder-gray-400" />
                  </div>
                ))}
              </div>
            )}

            {/* SEO TAB */}
            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">SEO Title</label>
                  <input type="text" value={site.seo.title} onChange={e => updateSiteField('seo.title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Meta Description</label>
                  <textarea value={site.seo.description} onChange={e => updateSiteField('seo.description', e.target.value)}
                    rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-xs resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Keywords (comma-separated)</label>
                  <input type="text" value={site.seo.keywords?.join(', ') || ''} onChange={e => updateSiteField('seo.keywords', e.target.value.split(',').map((k: string) => k.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-base sm:text-xs" />
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Google Visibility</p>
                      <p className="text-[10px] text-gray-500">Allow search engines to index your site</p>
                    </div>
                    <button onClick={() => updateSiteField('googleIndex', !site.googleIndex)}
                      className={`w-11 h-6 rounded-full transition-all relative ${site.googleIndex ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${site.googleIndex ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — LIVE PREVIEW */}
        <div className="flex-1 bg-gray-100 overflow-auto flex items-start justify-center p-4 sm:p-6">
          <div className="bg-white shadow-xl overflow-auto transition-all duration-300" style={{
            width: DEVICE_SIZES[editor.previewDevice].width,
            maxWidth: '100%',
            minHeight: '500px',
            borderRadius: '12px',
            border: '6px solid #374151',
          }}>
            <div style={{
              transform: editor.previewDevice === 'desktop' ? 'scale(0.6)' : editor.previewDevice === 'laptop' ? 'scale(0.75)' : 'scale(1)',
              transformOrigin: 'top left',
              width: editor.previewDevice === 'desktop' ? '166.7%' : editor.previewDevice === 'laptop' ? '133.3%' : '100%',
            }}>
              <TemplateRenderer site={site} isPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
