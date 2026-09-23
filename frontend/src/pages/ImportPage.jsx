import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Building2,
  Sparkles,
  RefreshCw,
  Layers,
  Database,
  Eye,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import importService from '../services/importService';
import matchingService from '../services/matchingService';
import StatusBadge from '../components/StatusBadge';

const STEPS = [
  { id: 1, name: 'Upload' },
  { id: 2, name: 'Column Mapping' },
  { id: 3, name: 'Validate & Preview' },
  { id: 4, name: 'Harmonize' },
];

const COMMON_CPSES = [
  'BHEL',
  'NTPC',
  'ONGC',
  'SAIL',
  'IOCL',
  'COAL_INDIA',
  'GAIL',
  'NHPC',
  'POWERGRID',
  'BPCL',
  'HPCL',
];

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Step 2: Mapping state
  const [fileHeaders, setFileHeaders] = useState([]);
  const [targetFields, setTargetFields] = useState({});
  const [columnMapping, setColumnMapping] = useState({});
  const [defaultCpse, setDefaultCpse] = useState('');
  const [customCpse, setCustomCpse] = useState('');
  const [sampleRows, setSampleRows] = useState([]);

  // Step 3: Validation state
  const [validationReport, setValidationReport] = useState(null);

  // Step 4: Import execution and AI harmonization state
  const [importResult, setImportResult] = useState(null);
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [harmonizationResult, setHarmonizationResult] = useState(null);

  const navigate = useNavigate();

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    const fn = selectedFile.name.toLowerCase();
    if (!fn.endsWith('.csv') && !fn.endsWith('.xlsx') && !fn.endsWith('.txt')) {
      setError('Unsupported file type. Please upload a CSV (.csv) or Excel (.xlsx) file.');
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 15 MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Step 1 -> 2: Upload and Preview
  const handleProceedToMapping = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      const preview = await importService.previewFile(file);

      setFileHeaders(preview.columns);
      setTargetFields(preview.target_fields);
      setColumnMapping(preview.suggested_mapping || {});
      setSampleRows(preview.sample_rows || []);
      setCurrentStep(2);
    } catch (err) {
      setError(err.message || 'Failed to inspect file columns');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Validate mapped dataset
  const handleProceedToValidation = async () => {
    const effectiveCpse = defaultCpse === '__CUSTOM__' ? customCpse.trim() : defaultCpse;
    const hasCpseMapped = Boolean(columnMapping.cpse);

    if (!hasCpseMapped && !effectiveCpse) {
      setError('Please select or specify a CPSE organization for records without a CPSE column.');
      return;
    }

    if (!columnMapping.material_code) {
      setError('Please map the required "Material Code" field.');
      return;
    }

    if (!columnMapping.description) {
      setError('Please map the required "Description" field.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const report = await importService.validateImport(file, columnMapping, effectiveCpse);
      setValidationReport(report);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || 'Failed to validate dataset');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> 4: Execute database import
  const handleExecuteImport = async () => {
    const effectiveCpse = defaultCpse === '__CUSTOM__' ? customCpse.trim() : defaultCpse;
    try {
      setLoading(true);
      setError(null);
      const res = await importService.executeImport(file, columnMapping, effectiveCpse);
      setImportResult(res);
      setCurrentStep(4);
    } catch (err) {
      setError(err.message || 'Failed to import material catalog records');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Run AI Harmonization
  const handleRunHarmonization = async () => {
    try {
      setIsHarmonizing(true);
      setError(null);
      const res = await matchingService.generateMatches({ top_k: 5, min_confidence: 70.0 });
      setHarmonizationResult(res);
    } catch (err) {
      setError(err.message || 'Failed to execute AI harmonization pipeline');
    } finally {
      setIsHarmonizing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Import Material Master</h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/50">
            <UploadCloud className="w-3 h-3" />
            <span>CSV / XLSX Ingestion</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload and harmonize CPSE material catalog data with the AI matching engine.
        </p>
      </div>

      {/* 4-Step Workflow Indicator */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="hidden sm:block">
                    <p
                      className={`text-xs font-semibold ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-[10px] text-slate-500">Step {step.id}</p>
                  </div>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-colors ${
                      isCompleted ? 'bg-emerald-500/60' : 'bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Import Error</p>
              <p className="mt-0.5 text-rose-300/80">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded text-rose-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: FILE UPLOAD */}
      {currentStep === 1 && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-6 shadow-sm space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-semibold text-white">
              Drag & drop your material master file here
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports CSV (.csv) and Microsoft Excel (.xlsx) up to 15 MB.
            </p>

            <div className="mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                Browse Files
              </button>
            </div>
          </div>

          {/* Selected File Card */}
          {file && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-slate-800 text-indigo-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFile(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                >
                  Remove
                </button>
                <button
                  onClick={handleProceedToMapping}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Inspecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Mapping</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING */}
      {currentStep === 2 && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Map Catalog Columns to MATPULSE Schema</h2>
              <p className="text-xs text-slate-400">
                Match your uploaded spreadsheet headers to the standard master data fields.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {fileHeaders.length} columns detected
            </div>
          </div>

          {/* Mapping Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">MATPULSE Master Field</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Uploaded File Column</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {Object.entries(targetFields).map(([fieldKey, fieldInfo]) => (
                  <tr key={fieldKey} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {fieldInfo.label}
                      <span className="block font-mono text-[10px] text-slate-500">{fieldKey}</span>
                    </td>
                    <td className="py-3 px-4">
                      {fieldInfo.required ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">OPTIONAL</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={columnMapping[fieldKey] || ''}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({
                            ...prev,
                            [fieldKey]: e.target.value || null,
                          }))
                        }
                        className="w-full max-w-xs px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70"
                      >
                        <option value="">-- Do not map --</option>
                        {fileHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CPSE Fallback Option */}
          {!columnMapping.cpse && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>No CPSE Column Mapped — Specify Organization</span>
              </div>
              <p className="text-amber-200/80 text-[11px]">
                Since your uploaded file does not include a dedicated CPSE column, select the organization that will be assigned to all records:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={defaultCpse}
                  onChange={(e) => setDefaultCpse(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select CPSE Organization --</option>
                  {COMMON_CPSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__CUSTOM__">Other / Custom CPSE...</option>
                </select>

                {defaultCpse === '__CUSTOM__' && (
                  <input
                    type="text"
                    placeholder="Enter CPSE acronym (e.g. NHPC)"
                    value={customCpse}
                    onChange={(e) => setCustomCpse(e.target.value.toUpperCase())}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleProceedToValidation}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>Validate Dataset</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATE & PREVIEW */}
      {currentStep === 3 && validationReport && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Dataset Validation & Preview</h2>
              <p className="text-xs text-slate-400">
                Review validation results and inspect parsed records before writing to the database.
              </p>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Rows</span>
              <span className="font-mono text-2xl font-bold text-white mt-1 block">
                {validationReport.total_rows}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
              <span className="text-[10px] uppercase font-semibold text-emerald-400 block">✓ Valid Records</span>
              <span className="font-mono text-2xl font-bold text-emerald-300 mt-1 block">
                {validationReport.valid_count}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
              <span className="text-[10px] uppercase font-semibold text-amber-400 block">⚠ Duplicates (Skip)</span>
              <span className="font-mono text-2xl font-bold text-amber-300 mt-1 block">
                {validationReport.duplicate_count}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40">
              <span className="text-[10px] uppercase font-semibold text-rose-400 block">✕ Invalid Rows</span>
              <span className="font-mono text-2xl font-bold text-rose-300 mt-1 block">
                {validationReport.invalid_count}
              </span>
            </div>
          </div>

          {/* Warnings Callout */}
          {validationReport.warnings && validationReport.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Validation Notices</span>
              </div>
              <ul className="space-y-1 text-amber-200/90 text-xs">
                {validationReport.warnings.map((w, idx) => (
                  <li key={idx}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Sample Valid Records (showing first {validationReport.preview_records.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Material Master Schema Preview
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">CPSE</th>
                    <th className="py-2.5 px-3">Material Code</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {validationReport.preview_records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-mono font-bold text-indigo-300 text-[11px]">{r.cpse}</td>
                      <td className="py-2 px-3 font-mono text-white text-[11px]">{r.material_code}</td>
                      <td className="py-2 px-3 truncate max-w-[260px]" title={r.description}>
                        {r.description}
                      </td>
                      <td className="py-2 px-3 text-slate-400">{r.category || '—'}</td>
                      <td className="py-2 px-3 font-mono">{r.uom || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Mapping</span>
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={loading || validationReport.valid_count === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing Records...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Import {validationReport.valid_count} Valid Records</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: HARMONIZE */}
      {currentStep === 4 && importResult && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-6 shadow-sm space-y-6">
          {/* Import Complete Banner */}
          <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Catalog Import Complete</h2>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  <strong>{importResult.records_imported}</strong> material master records imported into the SQLite database.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {importResult.records_skipped} duplicate codes skipped • {importResult.records_rejected} invalid rows rejected.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/materials')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition self-start sm:self-center"
            >
              View in Materials Master
            </button>
          </div>

          {/* AI Harmonization Action Card */}
          <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Run AI Harmonization on Imported Catalog</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Now that the new material records are stored in the Material Master catalog, trigger the sentence transformer and technical attribute matching engine to identify equivalent items across existing CPSE catalogs (BHEL, NTPC, ONGC, SAIL, IOCL, etc.).
            </p>

            <button
              onClick={handleRunHarmonization}
              disabled={isHarmonizing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isHarmonizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing CPSE catalogs with AI Matching Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Harmonization</span>
                </>
              )}
            </button>
          </div>

          {/* Harmonization Results */}
          {harmonizationResult && (
            <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    AI Harmonization Results
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Evaluated cross-CPSE candidate pairs. Found <strong>{harmonizationResult.total_candidates}</strong> potential recommendations.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/matching')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
                >
                  <span>View AI Matches</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Candidates</span>
                  <span className="font-mono text-lg font-bold text-white mt-0.5 block">
                    {harmonizationResult.total_candidates}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">New Recommendations</span>
                  <span className="font-mono text-lg font-bold text-emerald-400 mt-0.5 block">
                    {harmonizationResult.matches_created}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Existing Pairs</span>
                  <span className="font-mono text-lg font-bold text-slate-400 mt-0.5 block">
                    {harmonizationResult.matches_skipped}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
