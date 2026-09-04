'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle,
  XCircle, Copy, ArrowRight, ArrowLeft, RefreshCw, Check,
  ShieldCheck, Building2, Search, Filter, Sparkles, Loader2,
  Lock, Eye, Trash2, Sliders, ExternalLink, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useToast } from '@/contexts/ToastContext';
import {
  parseExcelFile,
  detectColumnMappings,
  analyzeCompanyDataset,
  generateCompanyTemplateExcel,
  exportCreatedCredentialsToExcel,
  AI_PROMPT_TEMPLATE,
  CATEGORY_GUIDE_ROWS,
  DISTRICT_TOWNS_DATA,
  STANDARD_CATEGORIES,
  type RawExcelRow,
  type ColumnMapping,
  type AnalyzedCompanyRow,
  type StandardCompanyFields,
} from '@/lib/excel/companyExcelService';
import {
  executeBulkCompanyImport,
  type BulkImportProgress,
  type BulkImportResult,
  type BulkImportOptions,
} from '@/lib/firebase/bulkCompanyService';

const DISTRICT_OPTIONS = ['Theni', 'Periyakulam', 'Cumbum', 'Bodinayakanur', 'Chinnamanur', 'Andipatti', 'Uthamapalayam', 'Madurai', 'Dindigul', 'Chennai', 'Coimbatore'];
const CATEGORY_OPTIONS = [...STANDARD_CATEGORIES];

export default function BulkCompanyImportPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing companies from database for real-time duplicate checking
  const { data: existingCompanies, loading: dbLoading } = useCollection<any>('companies');

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // File parsing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [rawRows, setRawRows] = useState<RawExcelRow[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState('');

  // Column mappings
  const [columns, setColumns] = useState<ColumnMapping[]>([]);

  // Analyzed rows
  const [analyzedRows, setAnalyzedRows] = useState<AnalyzedCompanyRow[]>([]);
  const [summary, setSummary] = useState({ validCount: 0, warningCount: 0, duplicateCount: 0, errorCount: 0 });

  // Filtering & Search in Curation Table
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'valid' | 'warning' | 'duplicate' | 'error' | 'selected'>('all');

  // Import options
  const [importOptions, setImportOptions] = useState<BulkImportOptions>({
    overrideStatus: 'verified',
    overrideDistrict: '',
    overrideCategory: '',
    isPremium: false,
    isFeatured: false,
    createUserAccounts: true,
    adminUid: user?.uid || 'admin',
  });

  // Import execution state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<BulkImportProgress | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  // Category & AI Prompt Guide modal state
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<'prompt' | 'categories' | 'districts'>('prompt');
  const [copyPromptSuccess, setCopyPromptSuccess] = useState(false);

  const handleCopyAiPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopyPromptSuccess(true);
    toast.success('AI Prompt Copied! 🤖', 'Paste this prompt into Claude or ChatGPT to get 100% correctly formatted company data.');
    setTimeout(() => setCopyPromptSuccess(false), 3000);
  };

  // 1. Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    if (!isExcel) {
      toast.error('Invalid File', 'Please upload a valid .xlsx, .xls or .csv file');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      const { sheetName: sName, rows, headers } = await parseExcelFile(file);
      if (!rows.length) {
        throw new Error('The uploaded sheet contains no data rows.');
      }

      setSheetName(sName);
      setRawRows(rows);
      setRawHeaders(headers);

      // Auto-detect columns
      const detectedMappings = detectColumnMappings(headers, rows);
      setColumns(detectedMappings);

      // Run initial analysis
      const analysis = analyzeCompanyDataset(rows, detectedMappings, existingCompanies || []);
      setAnalyzedRows(analysis.analyzedRows);
      setSummary(analysis.summary);

      toast.success('File Analyzed! 📊', `Found ${rows.length} rows and ${headers.length} columns.`);
      setCurrentStep(2);
    } catch (err: any) {
      console.error(err);
      toast.error('Parse Error', err.message || 'Failed to read file.');
    } finally {
      setIsParsing(false);
    }
  };

  // 2. Re-analyze when columns are toggled/changed
  const handleColumnToggle = (idx: number, isIncluded: boolean) => {
    const updated = [...columns];
    updated[idx].isIncluded = isIncluded;
    setColumns(updated);
  };

  const handleColumnTargetChange = (idx: number, target: keyof StandardCompanyFields | 'ignore') => {
    const updated = [...columns];
    updated[idx].targetField = target;
    updated[idx].isIncluded = target !== 'ignore';
    setColumns(updated);
  };

  const applyColumnMappings = () => {
    const analysis = analyzeCompanyDataset(rawRows, columns, existingCompanies || []);
    setAnalyzedRows(analysis.analyzedRows);
    setSummary(analysis.summary);
    setCurrentStep(3);
  };

  // 3. Row Selection & Curation Actions
  const toggleRowSelection = (id: string) => {
    setAnalyzedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  const selectAll = (statusFilter?: 'all' | 'valid' | 'non-error') => {
    setAnalyzedRows((prev) =>
      prev.map((r) => {
        if (statusFilter === 'valid') return { ...r, isSelected: r.status === 'valid' };
        if (statusFilter === 'non-error') return { ...r, isSelected: r.status !== 'error' && r.status !== 'duplicate' };
        return { ...r, isSelected: true };
      })
    );
  };

  const deselectAll = () => {
    setAnalyzedRows((prev) => prev.map((r) => ({ ...r, isSelected: false })));
  };

  const selectedCount = analyzedRows.filter((r) => r.isSelected).length;

  // 4. Run Import
  const handleStartImport = async () => {
    if (selectedCount === 0) {
      toast.warning('No Rows Selected', 'Please select at least one company row to import.');
      return;
    }

    setIsImporting(true);
    setCurrentStep(4);

    try {
      const finalOptions: BulkImportOptions = {
        ...importOptions,
        adminUid: user?.uid || 'admin',
      };

      const result = await executeBulkCompanyImport(analyzedRows, finalOptions, (prog) => {
        setImportProgress(prog);
      });

      setImportResult(result);
      setCurrentStep(5);
      toast.success(
        'Import Completed! 🎉',
        `Successfully added ${result.successful} companies to Firebase (${result.failed} failed).`
      );
    } catch (err: any) {
      console.error(err);
      toast.error('Import Error', err.message || 'An error occurred during database writing.');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered rows for curation preview table
  const filteredRows = analyzedRows.filter((r) => {
    const matchSearch =
      r.mapped.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (r.mapped.phone || '').includes(tableSearch) ||
      (r.mapped.district || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
      (r.mapped.category || '').toLowerCase().includes(tableSearch.toLowerCase());

    if (!matchSearch) return false;

    if (tableFilter === 'valid') return r.status === 'valid';
    if (tableFilter === 'warning') return r.status === 'warning';
    if (tableFilter === 'duplicate') return r.status === 'duplicate';
    if (tableFilter === 'error') return r.status === 'error';
    if (tableFilter === 'selected') return r.isSelected;
    return true;
  });

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold mb-1">
            <Link href="/admin/businesses" className="hover:text-blue-600 transition-colors">
              Business Management
            </Link>
            <span>/</span>
            <span className="text-blue-600">Bulk Import Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Bulk Company Import &amp; Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Analyze, validate, filter, and import multiple businesses into Firebase with automated logins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAiPrompt}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            {copyPromptSuccess ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copyPromptSuccess ? 'AI Prompt Copied!' : 'Copy AI Prompt (Claude / GPT)'}
          </button>
          <button
            type="button"
            onClick={() => {
              setGuideTab('categories');
              setShowGuideModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <HelpCircle size={14} />
            Categories Guide
          </button>
          <button
            type="button"
            onClick={generateCompanyTemplateExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Download Multi-Sheet Template
          </button>
          <Link
            href="/admin/businesses"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Back to Companies
          </Link>
        </div>
      </div>

      {/* Wizard Progress Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
        {[
          { step: 1, label: '1. Upload Excel' },
          { step: 2, label: '2. Select Columns' },
          { step: 3, label: '3. Curate Data' },
          { step: 4, label: '4. Import to Firebase' },
          { step: 5, label: '5. Results & Logins' },
        ].map((s) => (
          <div
            key={s.step}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStep === s.step
                ? 'bg-blue-600 text-white shadow-xs'
                : currentStep > s.step
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-slate-500 bg-gray-50'
            }`}
          >
            {currentStep > s.step ? <Check size={14} className="text-emerald-600" /> : <span>{s.step}.</span>}
            <span className="truncate">{s.label.split('. ')[1]}</span>
          </div>
        ))}
      </div>

      {/* ── STEP 1: UPLOAD & FORMAT CHECK ────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet size={28} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">
              Upload Company List Spreadsheet
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Upload any <code className="px-1.5 py-0.5 bg-gray-100 rounded text-blue-700 font-mono">.xlsx</code>, <code className="px-1.5 py-0.5 bg-gray-100 rounded text-blue-700 font-mono">.xls</code>, or <code className="px-1.5 py-0.5 bg-gray-100 rounded text-blue-700 font-mono">.csv</code> file. The system will inspect every column, validate records, and highlight duplicates.
            </p>
          </div>

          {/* AI Auto-Match Tip Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-indigo-950">
                  ✨ Smart AI Category Auto-Matching Active
                </p>
                <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                  When using Claude / AI data, non-standard names (e.g. &ldquo;Hospital&rdquo;, &ldquo;Agri Store&rdquo;, &ldquo;Textile Mill&rdquo;) are automatically mapped to official categories so zero rows fail!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyAiPrompt}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-xs cursor-pointer"
            >
              <Copy size={13} />
              {copyPromptSuccess ? 'Prompt Copied!' : 'Copy AI Prompt'}
            </button>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {isParsing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <p className="text-sm font-bold text-gray-700">Analyzing Excel file structure...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-xs">
                  <Upload size={22} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Click to browse or drag &amp; drop file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Supports Excel Workbook (.xlsx, .xls) and CSV</p>
                </div>
              </>
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-amber-900 leading-relaxed">
              <p className="font-bold text-amber-950">How the Bulk Analysis System Works:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                <li><strong>Auto Column Detection:</strong> Standard fields (Name, Phone, Category, Address, Email, Logo) are automatically recognized.</li>
                <li><strong>Data Integrity:</strong> Duplicate phone numbers or companies already in Firebase are flagged before importing.</li>
                <li><strong>Automated Login Credentials:</strong> Optional auto-creation of Firebase Auth logins so business owners can manage their profiles.</li>
                <li><strong>No Admin Disconnection:</strong> Built with isolated Auth instances so your current admin session remains active.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: SELECT COLUMNS & MAPPINGS ─────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Column Selection &amp; Field Mapping
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sheet: <span className="font-bold text-blue-600">{sheetName}</span> · Total rows: <span className="font-bold text-gray-800">{rawRows.length}</span>. Choose which columns to import or exclude.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Change File
              </button>
              <button
                type="button"
                onClick={applyColumnMappings}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                Next: Curate Data <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {columns.map((col, idx) => (
              <div
                key={col.excelColumn}
                className={`p-4 rounded-2xl border transition-all ${
                  col.isIncluded
                    ? 'border-blue-200 bg-blue-50/20'
                    : 'border-gray-200 bg-gray-50/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.isIncluded}
                      onChange={(e) => handleColumnToggle(idx, e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-black text-gray-900 truncate max-w-[180px]">
                      {col.excelColumn}
                    </span>
                  </label>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${col.isIncluded ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                    {col.isIncluded ? 'Included' : 'Ignored'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Map to Field:
                    </label>
                    <select
                      value={col.targetField}
                      onChange={(e) => handleColumnTargetChange(idx, e.target.value as any)}
                      disabled={!col.isIncluded}
                      className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="ignore">❌ Ignore (Do Not Import)</option>
                      <option value="name">🏢 Company Name *</option>
                      <option value="phone">📞 Phone Number *</option>
                      <option value="whatsapp">💬 WhatsApp Number</option>
                      <option value="category">🏷️ Category</option>
                      <option value="district">📍 District</option>
                      <option value="address">🗺️ Full Address</option>
                      <option value="ownerName">👤 Owner / MD Name</option>
                      <option value="contactPerson">👥 Contact Person</option>
                      <option value="email">✉️ Email Address</option>
                      <option value="website">🌐 Website URL</option>
                      <option value="logoUrl">🖼️ Logo Image URL</option>
                      <option value="bannerUrl">🎨 Cover/Banner URL</option>
                      <option value="tagline">💡 Tagline</option>
                      <option value="description">📝 Description / About</option>
                      <option value="employeeCount">👥 Employee Count</option>
                      <option value="proofNumber">📜 GST / MSME Number</option>
                      <option value="verificationStatus">✅ Verification Status</option>
                    </select>
                  </div>

                  {col.sampleValue && (
                    <p className="text-[11px] text-gray-500 truncate bg-white/80 px-2 py-1 rounded-lg border border-gray-100">
                      Sample: <span className="text-gray-800 font-medium font-mono">{col.sampleValue}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: DATA CURATION & VALIDATION ───────────────────────────────── */}
      {currentStep === 3 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
          {/* Top summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setTableFilter('valid')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                tableFilter === 'valid' ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/30' : 'border-emerald-100 bg-emerald-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-800">Valid Rows</p>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <p className="text-xl font-black text-emerald-950 mt-1">{summary.validCount}</p>
            </div>

            <div
              onClick={() => setTableFilter('warning')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                tableFilter === 'warning' ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30' : 'border-amber-100 bg-amber-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-amber-800">Warnings</p>
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <p className="text-xl font-black text-amber-950 mt-1">{summary.warningCount}</p>
            </div>

            <div
              onClick={() => setTableFilter('duplicate')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                tableFilter === 'duplicate' ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-400/30' : 'border-purple-100 bg-purple-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-purple-800">Duplicates</p>
                <Copy size={16} className="text-purple-600" />
              </div>
              <p className="text-xl font-black text-purple-950 mt-1">{summary.duplicateCount}</p>
            </div>

            <div
              onClick={() => setTableFilter('error')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                tableFilter === 'error' ? 'border-red-500 bg-red-50/60 ring-2 ring-red-400/30' : 'border-red-100 bg-red-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-red-800">Missing/Error</p>
                <XCircle size={16} className="text-red-600" />
              </div>
              <p className="text-xl font-black text-red-950 mt-1">{summary.errorCount}</p>
            </div>
          </div>

          {/* Quick Selection Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Select:</span>
              <button
                type="button"
                onClick={() => selectAll('non-error')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                All Safe Rows
              </button>
              <button
                type="button"
                onClick={() => selectAll('valid')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                100% Valid Only
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Deselect All
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                disabled={selectedCount === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                Configure &amp; Import ({selectedCount}) <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Curation Data Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedCount === analyzedRows.length && analyzedRows.length > 0}
                      onChange={(e) => (e.target.checked ? selectAll('non-error') : deselectAll())}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </th>
                  <th className="p-3 w-12">#</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Website / Domain</th>
                  <th className="p-3">Login User Email</th>
                  <th className="p-3">Validation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => toggleRowSelection(r.id)}
                    className={`cursor-pointer transition-colors ${
                      r.isSelected ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50 opacity-75'
                    }`}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={r.isSelected}
                        onChange={() => toggleRowSelection(r.id)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </td>
                    <td className="p-3 text-slate-500 font-mono">{r.originalIndex + 1}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === 'valid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'duplicate'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.status === 'valid' && <CheckCircle2 size={10} />}
                        {r.status === 'warning' && <AlertTriangle size={10} />}
                        {r.status === 'duplicate' && <Copy size={10} />}
                        {r.status === 'error' && <XCircle size={10} />}
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-900 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        {r.mapped.logoUrl ? (
                          <img
                            src={r.mapped.logoUrl}
                            alt=""
                            className="w-6 h-6 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                            {(r.mapped.name || 'C').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-gray-900">{r.mapped.name}</p>
                          {r.mapped.services && (
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              {typeof r.mapped.services === 'string' ? r.mapped.services.split(',').length : r.mapped.services.length} services listed
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{r.mapped.category || '—'}</td>
                    <td className="p-3 text-gray-600">{r.mapped.district || 'Theni'}</td>
                    <td className="p-3 font-mono text-gray-700">{r.mapped.phone || '—'}</td>
                    <td className="p-3 text-gray-600 truncate max-w-[140px]">
                      {r.mapped.website ? (
                        <span className="text-blue-600 font-medium">{r.mapped.website}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 truncate max-w-[150px]">
                      {r.mapped.accountEmail || r.mapped.email ? (
                        <span className="font-mono text-[11px] text-gray-800">{r.mapped.accountEmail || r.mapped.email}</span>
                      ) : (
                        <span className="text-slate-500 italic">Auto-generated</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500">
                      {r.issues.length > 0 ? (
                        <div className="space-y-0.5">
                          {r.issues.map((iss, i) => (
                            <p
                              key={i}
                              className={`text-[11px] leading-tight ${
                                r.status === 'error'
                                  ? 'text-red-600 font-medium'
                                  : r.status === 'duplicate'
                                  ? 'text-purple-700 font-medium'
                                  : 'text-amber-700'
                              }`}
                            >
                              • {iss}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-medium">Ready to import</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back to Columns
            </button>
            <p className="text-xs font-bold text-gray-500">
              Selected <span className="text-blue-600 font-black">{selectedCount}</span> of {analyzedRows.length} rows for Firebase import
            </p>
          </div>
        </div>
      )}

      {/* ── STEP 4: IMPORT OPTIONS & LIVE EXECUTION ──────────────────────────── */}
      {currentStep === 4 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Sliders size={26} />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">
                Configure Bulk Import Settings
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                You are about to import <strong className="text-blue-600">{selectedCount} businesses</strong> into THENIJOBS Firebase Database.
              </p>
            </div>

            {/* Options Panel */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Initial Verification Status:
                  </label>
                  <select
                    value={importOptions.overrideStatus}
                    onChange={(e) => setImportOptions({ ...importOptions, overrideStatus: e.target.value as any })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="verified">✅ Verified &amp; Active (Recommended)</option>
                    <option value="pending">⏳ Pending Admin Verification</option>
                    <option value="under_review">🔍 Under Review</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">
                    Default District (if empty):
                  </label>
                  <select
                    value={importOptions.overrideDistrict}
                    onChange={(e) => setImportOptions({ ...importOptions, overrideDistrict: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Use District from Excel</option>
                    {DISTRICT_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* User Account Provisioning Toggle */}
              <div className="pt-3 border-t border-gray-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="createUserAccounts"
                  checked={importOptions.createUserAccounts}
                  onChange={(e) => setImportOptions({ ...importOptions, createUserAccounts: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <label htmlFor="createUserAccounts" className="cursor-pointer space-y-0.5">
                  <span className="text-xs font-bold text-gray-900 block">
                    Automatically Create Business Login Accounts (Firebase Auth)
                  </span>
                  <span className="text-[11px] text-gray-500 block leading-relaxed">
                    Creates an employer login with a secure password for each company. You will be able to download the complete credentials Excel file at the end to send to shop owners.
                  </span>
                </label>
              </div>

              {/* Featured / Premium Flags */}
              <div className="pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.isPremium}
                    onChange={(e) => setImportOptions({ ...importOptions, isPremium: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-xs font-semibold text-gray-800">Grant Standard Plan Access</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.isFeatured}
                    onChange={(e) => setImportOptions({ ...importOptions, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-xs font-semibold text-gray-800">Highlight on Homepage Featured</span>
                </label>
              </div>
            </div>

            {/* Live Progress Box if Importing */}
            {isImporting && importProgress && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-blue-900 flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600" size={16} />
                    Importing: {importProgress.currentCompanyName}
                  </span>
                  <span className="text-blue-700">{importProgress.percentage}%</span>
                </div>

                <div className="w-full bg-blue-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${importProgress.percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-blue-800 font-semibold">
                  <span>Processed: {importProgress.processed} / {importProgress.total}</span>
                  <span className="text-emerald-700">✓ Succeeded: {importProgress.successCount}</span>
                  {importProgress.errorCount > 0 && (
                    <span className="text-red-600">✗ Failed: {importProgress.errorCount}</span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isImporting && (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Back to Curation
                </button>
                <button
                  type="button"
                  onClick={handleStartImport}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Building2 size={16} />
                  Execute Bulk Import ({selectedCount} Companies)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 5: RESULTS & LOGINS DOWNLOAD ────────────────────────────────── */}
      {currentStep === 5 && importResult && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Bulk Import Successfully Executed!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Successfully wrote <strong className="text-emerald-700">{importResult.successful} company profiles</strong> to Firebase Firestore.
            </p>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
              <p className="text-2xl font-black text-emerald-900">{importResult.successful}</p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5">Companies Created</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
              <p className="text-2xl font-black text-blue-900">{importResult.createdCredentials.length}</p>
              <p className="text-xs font-bold text-blue-700 mt-0.5">User Logins Provisioned</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
              <p className="text-2xl font-black text-gray-900">{importResult.failed}</p>
              <p className="text-xs font-bold text-gray-600 mt-0.5">Errors / Skipped</p>
            </div>
          </div>

          {/* Credentials Download Action Card */}
          {importResult.createdCredentials.length > 0 && (
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 text-center space-y-3">
              <Lock size={28} className="text-blue-600 mx-auto" />
              <div>
                <h3 className="text-sm font-black text-blue-950">
                  Business Owner Login Credentials Generated
                </h3>
                <p className="text-xs text-blue-800 mt-0.5 max-w-md mx-auto">
                  Download the complete credentials sheet containing company names, emails, passwords, and portal URLs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportCreatedCredentialsToExcel(importResult.createdCredentials)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Download size={15} />
                Download Created Logins (.xlsx)
              </button>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/admin/businesses"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors text-center"
            >
              View All Companies in Admin
            </Link>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setRawRows([]);
                setAnalyzedRows([]);
                setImportResult(null);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-center"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: CATEGORIES & AI PROMPT GUIDE ───────────────────────────── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900">
                    THENIJOBS AI Import &amp; Categories Reference
                  </h3>
                  <p className="text-xs text-gray-500">Official platform categories, keywords &amp; Claude/GPT prompt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-white gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGuideTab('prompt')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  guideTab === 'prompt'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                🤖 AI Extraction Prompt
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('categories')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  guideTab === 'categories'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                🏷️ Allowed Categories ({STANDARD_CATEGORIES.length})
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('districts')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  guideTab === 'districts'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                📍 Districts &amp; Towns
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Tab 1: AI Prompt */}
              {guideTab === 'prompt' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                    <div>
                      <p className="font-black text-indigo-950 text-xs sm:text-sm">Copy Prompt for Claude / ChatGPT</p>
                      <p className="text-[11px] text-indigo-800 mt-0.5">
                        Paste this directly into Claude along with your raw list of companies to get a 100% error-free Excel file.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAiPrompt}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md cursor-pointer transition-all"
                    >
                      {copyPromptSuccess ? <Check size={14} /> : <Copy size={14} />}
                      {copyPromptSuccess ? 'Copied!' : 'Copy Entire Prompt'}
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-96 border border-slate-800">
                    {AI_PROMPT_TEMPLATE}
                  </pre>
                </div>
              )}

              {/* Tab 2: Categories Guide */}
              {guideTab === 'categories' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-[11px] text-emerald-900">
                    💡 <strong>Smart AI Fuzzy Matcher Active:</strong> Even if your Excel sheet has partial names like &ldquo;Hospital&rdquo;, &ldquo;Clinic&rdquo;, &ldquo;Agri&rdquo;, &ldquo;Textile&rdquo;, or &ldquo;Software Store&rdquo;, the system will automatically map them into the exact official categories below without failing!
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-black text-[11px]">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Official Category</th>
                          <th className="py-2.5 px-3">Includes Keywords &amp; Sub-types</th>
                          <th className="py-2.5 px-3">Sample Companies</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {CATEGORY_GUIDE_ROWS.map((cat, i) => (
                          <tr key={cat['Official Category Name']} className="hover:bg-blue-50/40">
                            <td className="py-2 px-3 font-bold text-slate-500">{i + 1}</td>
                            <td className="py-2 px-3 font-bold text-blue-700 whitespace-nowrap">
                              {cat['Official Category Name']}
                            </td>
                            <td className="py-2 px-3 text-gray-600 leading-normal max-w-xs">
                              {cat['Included Businesses & Keywords']}
                            </td>
                            <td className="py-2 px-3 text-gray-500 italic">
                              {cat['Example Companies']}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Districts Reference */}
              {guideTab === 'districts' && (
                <div className="space-y-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 text-[11px] text-purple-900">
                    📍 <strong>Recognized Districts &amp; Taluks in Theni:</strong> The system automatically assigns businesses located in any of the taluks below to their respective district hub.
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-black text-[11px]">
                          <th className="py-2.5 px-3">District / Region</th>
                          <th className="py-2.5 px-3">Major Taluks, Towns &amp; Localities</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {DISTRICT_TOWNS_DATA.map((dist) => (
                          <tr key={dist.District} className="hover:bg-purple-50/30">
                            <td className="py-2.5 px-3 font-bold text-purple-800 whitespace-nowrap">
                              {dist.District}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              {dist['Major Taluks & Towns']}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={generateCompanyTemplateExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              >
                <Download size={13} />
                Download Multi-Sheet Template (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
