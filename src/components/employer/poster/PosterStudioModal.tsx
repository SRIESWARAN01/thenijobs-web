'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Download, Sparkles, Check, CheckSquare, Square,
  Eye, RefreshCw, Loader2, ExternalLink, QrCode, FileText, Image as ImageIcon,
  CheckCircle2, AlertCircle, Layers, MessageCircle, Copy
} from 'lucide-react';
import { PosterData, GeneratedPoster, TemplateId } from '@/lib/poster/types';
import { generateAll10Posters, renderPoster } from '@/lib/poster/posterCanvasEngine';
import { downloadPostersAsZip } from '@/lib/poster/posterZipService';
import { downloadPosterImage, downloadPosterAsPdf } from '@/lib/poster/posterExportService';
import { sharePosterOnWhatsApp, copyPublicJobLink } from '@/lib/poster/posterShareService';
import { useToast } from '@/contexts/ToastContext';

interface PosterStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PosterData;
}

export default function PosterStudioModal({ isOpen, onClose, data }: PosterStudioModalProps) {
  const toast = useToast();
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'warning') toast.warning(message);
    else toast.info(message);
  };

  const [posters, setPosters] = useState<GeneratedPoster[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<TemplateId>>(new Set());
  const [previewPoster, setPreviewPoster] = useState<GeneratedPoster | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const handleGenerateAll = useCallback(async () => {
    try {
      setLoading(true);
      const generated = await generateAll10Posters(data);
      setPosters(generated);
      // Default: all selected for convenient ZIP download
      setSelectedIds(new Set(generated.map(p => p.templateId)));
      showToast('Successfully generated 10 unique job poster designs!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate posters', 'error');
    } finally {
      setLoading(false);
    }
  }, [data]);

  // Generate on first open
  useEffect(() => {
    if (isOpen && posters.length === 0 && !loading) {
      handleGenerateAll();
    }
  }, [isOpen, posters.length, loading, handleGenerateAll]);

  const handleRegenerateSingle = async (templateId: TemplateId) => {
    try {
      setGeneratingTemplate(templateId);
      const updated = await renderPoster(templateId, data);
      setPosters(prev => prev.map(p => p.templateId === templateId ? updated : p));
      if (previewPoster?.templateId === templateId) {
        setPreviewPoster(updated);
      }
      showToast('Regenerated poster design!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate poster', 'error');
    } finally {
      setGeneratingTemplate(null);
    }
  };

  // Selection toggles
  const toggleSelect = (id: TemplateId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(posters.map(p => p.templateId)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // ZIP Downloads
  const handleDownloadAllZip = async () => {
    if (posters.length === 0) return;
    try {
      setIsZipping(true);
      const res = await downloadPostersAsZip(posters, data, 'All_10');
      showToast(`Downloaded all 10 posters in ${res.filename}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create ZIP', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSelectedZip = async () => {
    const selectedList = posters.filter(p => selectedIds.has(p.templateId));
    if (selectedList.length === 0) {
      showToast('Please select at least one poster to download as ZIP', 'info');
      return;
    }
    try {
      setIsZipping(true);
      const res = await downloadPostersAsZip(selectedList, data, `${selectedList.length}_Selected`);
      showToast(`Downloaded ${res.count} selected posters in ZIP!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create ZIP', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Individual Downloads
  const handleDownloadImage = (poster: GeneratedPoster, format: 'png' | 'jpeg', idx: number) => {
    try {
      const filename = downloadPosterImage(poster, data, format, idx);
      showToast(`Downloaded ${filename}`, 'success');
    } catch (err: any) {
      showToast('Download failed', 'error');
    }
  };

  const handleDownloadPdf = (poster: GeneratedPoster, idx: number) => {
    try {
      const filename = downloadPosterAsPdf(poster, data, idx);
      showToast(`Exported print-ready PDF: ${filename}`, 'success');
    } catch (err: any) {
      showToast('PDF Export failed', 'error');
    }
  };

  // WhatsApp Share
  const handleWhatsApp = async (poster: GeneratedPoster, idx: number) => {
    try {
      setSharingId(poster.templateId);
      const res = await sharePosterOnWhatsApp(poster, data, idx);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'info');
      }
    } catch (err: any) {
      showToast('Could not share poster', 'error');
    } finally {
      setSharingId(null);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyPublicJobLink(data);
    if (ok) {
      setCopiedLink(true);
      showToast('Copied public job application URL to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-6xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  THENIJOBS AI Job Poster Studio
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  10 Unique Designs
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-md mt-0.5">
                {data.title} • <span className="text-white font-medium">{data.companyName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleCopyLink}
              title="Copy Public URL"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all tap-target-auto"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all tap-target-auto"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* SUBHEADER: QR Verification & Batch Controls */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* QR Destination Info */}
          <div className="flex items-center gap-2 text-slate-700 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-xs flex-wrap">
            <QrCode size={16} className="text-indigo-600 flex-shrink-0" />
            <span className="font-semibold text-slate-900">QR Scans To:</span>
            <a
              href={data.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-[280px]"
            >
              {data.publicUrl}
              <ExternalLink size={12} />
            </a>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
              Verified Public Destination
            </span>
          </div>

          {/* Batch Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-200/80 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={selectAll}
                className="px-2.5 py-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-white transition-all"
              >
                Select All (10)
              </button>
              <button
                onClick={deselectAll}
                className="px-2.5 py-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-white transition-all"
              >
                Clear
              </button>
            </div>

            {/* Download Selected ZIP */}
            <button
              onClick={handleDownloadSelectedZip}
              disabled={isZipping || selectedIds.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-xs disabled:opacity-40 transition-all tap-target-auto"
            >
              {isZipping ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Download Selected ({selectedIds.size})</span>
            </button>

            {/* Download All 10 ZIP */}
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping || posters.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-sm disabled:opacity-40 transition-all tap-target-auto"
            >
              {isZipping ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
              <span>Download All 10 (ZIP)</span>
            </button>

            {/* Regenerate All */}
            <button
              onClick={handleGenerateAll}
              disabled={loading}
              title="Regenerate all 10 posters"
              className="p-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-slate-700 transition-all tap-target-auto"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        {/* POSTER GRID / BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center animate-pulse shadow-lg">
                  <Sparkles size={28} className="text-white" />
                </div>
                <Loader2 size={24} className="animate-spin text-blue-500 absolute -top-2 -right-2" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900">Rendering 10 Professional Posters</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Synthesizing distinct typography, layouts, QR barcodes, and Tamil/English presets...
                </p>
              </div>
            </div>
          ) : posters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle size={40} className="text-amber-500 mb-2" />
              <h3 className="text-base font-bold text-gray-800">No posters generated yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Click the generate button below to create 10 unique, print-ready posters for this job.
              </p>
              <button
                onClick={handleGenerateAll}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
              >
                Generate 10 Posters Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {posters.map((poster, idx) => {
                const isSelected = selectedIds.has(poster.templateId);
                const isRegenerating = generatingTemplate === poster.templateId;
                const isSharingThis = sharingId === poster.templateId;

                return (
                  <div
                    key={poster.templateId}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col group ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* Card Header & Checkbox */}
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSelect(poster.templateId)}
                          className="text-slate-600 hover:text-blue-600 transition-colors"
                          title={isSelected ? 'Deselect' : 'Select'}
                        >
                          {isSelected ? (
                            <CheckSquare size={17} className="text-blue-600" />
                          ) : (
                            <Square size={17} className="text-slate-400" />
                          )}
                        </button>
                        <span className="text-xs font-bold text-gray-800 truncate">
                          #{idx + 1} {poster.templateName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {poster.templateId === 'social_story' && (
                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                            9:16 Status
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                          {poster.templateNameTa}
                        </span>
                      </div>
                    </div>

                    {/* Poster Thumbnail Image with Hover Preview Action */}
                    <div
                      className={`relative bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center ${
                        poster.templateId === 'social_story' ? 'aspect-[9/16]' : 'aspect-[4/5]'
                      }`}
                      onClick={() => setPreviewPoster(poster)}
                    >
                      <img
                        src={poster.dataUrlPng}
                        alt={poster.templateName}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      />

                      {/* Overlay action on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                          <Eye size={14} /> Full Preview
                        </span>
                      </div>

                      {/* Loading badge if regenerating */}
                      {isRegenerating && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
                          <Loader2 size={24} className="animate-spin text-blue-400" />
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="p-3 space-y-2 bg-white flex-1 flex flex-col justify-between">
                      {/* WhatsApp Share Button */}
                      <button
                        onClick={() => handleWhatsApp(poster, idx + 1)}
                        disabled={isSharingThis}
                        className={`w-full py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all tap-target-auto ${
                          poster.templateId === 'social_story'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 ring-2 ring-emerald-400/40'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isSharingThis ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <MessageCircle size={14} />
                        )}
                        <span>{poster.templateId === 'social_story' ? '📱 Set WhatsApp Status' : 'Share on WhatsApp'}</span>
                      </button>

                      {/* Export buttons row */}
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <button
                          onClick={() => handleDownloadImage(poster, 'png', idx + 1)}
                          title="Download high-resolution PNG"
                          className="py-1.5 px-1 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-[11px] font-semibold text-gray-700 flex items-center justify-center gap-1 transition-all"
                        >
                          <Download size={12} className="text-blue-600" /> PNG
                        </button>
                        <button
                          onClick={() => handleDownloadImage(poster, 'jpeg', idx + 1)}
                          title="Download compressed JPEG"
                          className="py-1.5 px-1 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 text-[11px] font-semibold text-gray-700 flex items-center justify-center gap-1 transition-all"
                        >
                          <ImageIcon size={12} className="text-purple-600" /> JPG
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(poster, idx + 1)}
                          title="Download print-ready A4 PDF"
                          className="py-1.5 px-1 rounded-lg border border-gray-200 hover:bg-rose-50 hover:border-rose-300 text-[11px] font-semibold text-gray-700 flex items-center justify-center gap-1 transition-all"
                        >
                          <FileText size={12} className="text-rose-600" /> PDF
                        </button>
                      </div>

                      {/* Regenerate single button */}
                      <button
                        onClick={() => handleRegenerateSingle(poster.templateId)}
                        disabled={isRegenerating}
                        className="w-full py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition-colors"
                      >
                        <RefreshCw size={11} className={isRegenerating ? 'animate-spin' : ''} />
                        <span>Regenerate Style</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FULL SIZE POSTER PREVIEW MODAL */}
        {previewPoster && (
          <div
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
            onClick={() => setPreviewPoster(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95"
              onClick={e => e.stopPropagation()}
            >
              {/* Preview Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
                <div>
                  <h3 className="text-sm sm:text-base font-bold">{previewPoster.templateName}</h3>
                  <p className="text-xs text-slate-400">{previewPoster.templateNameTa} • 1080 × {previewPoster.height}px</p>
                </div>
                <button
                  onClick={() => setPreviewPoster(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Large Image View */}
              <div className="flex-1 bg-slate-950 overflow-y-auto p-4 flex items-center justify-center">
                <img
                  src={previewPoster.dataUrlPng}
                  alt={previewPoster.templateName}
                  className="max-h-[68vh] object-contain rounded-xl shadow-2xl"
                />
              </div>

              {/* Preview Actions Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Print-ready vector quality (300 DPI equivalent)
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleWhatsApp(previewPoster, 1)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs tap-target-auto"
                  >
                    <MessageCircle size={15} /> Share on WhatsApp
                  </button>
                  <button
                    onClick={() => handleDownloadImage(previewPoster, 'png', 1)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs tap-target-auto"
                  >
                    <Download size={15} /> Download PNG
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(previewPoster, 1)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs tap-target-auto"
                  >
                    <FileText size={15} /> Print PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
