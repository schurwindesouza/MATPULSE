import React, { useState, useRef } from 'react';
import {
  IconUploadCloud,
  IconFileSpreadsheet,
  IconCheckCircle,
  IconAlertTriangle,
  IconAlertCircle,
  IconArrowRight,
  IconArrowLeft,
  IconX,
  IconBuilding,
  IconSparkles,
  IconRefresh,
  IconDatabase,
} from '../components/icons/Icons';
import { useNavigate } from 'react-router-dom';
import importService from '../services/importService';
import matchingService from '../services/matchingService';
import materialService from '../services/materialService';

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
  const [materialStats, setMaterialStats] = useState(null);
  const [pipelineStats, setPipelineStats] = useState(null);

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

      try {
        const [mStats, pStats] = await Promise.all([
          materialService.getStats(),
          matchingService.getMatchingStats(),
        ]);
        setMaterialStats(mStats);
        setPipelineStats(pStats);
      } catch (statsErr) {
        console.error('Failed to load updated stats after harmonization', statsErr);
      }
    } catch (err) {
      setError(err.message || 'Failed to execute AI harmonization pipeline');
    } finally {
      setIsHarmonizing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Local Readability Protection */}
      <div className="glass-header-scrim p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight text-shadow-protect">Import Material Master</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-400/30">
              <IconUploadCloud className="w-3.5 h-3.5" />
              <span>CSV / XLSX Ingestion</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300/90 mt-1 text-shadow-protect">
            Upload, schema-map, and validate enterprise CPSE catalog files with the AI harmonization pipeline.
          </p>
        </div>
      </div>

      {/* 4-Step Workflow Indicator */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : isCurrent
                        ? 'bg-blue-600 text-white border border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {isCompleted ? <IconCheckCircle className="w-4 h-4 text-emerald-400" /> : step.id}
                  </div>
                  <div className="hidden sm:block">
                    <p
                      className={`text-xs font-semibold ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Step {step.id}</p>
                  </div>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-colors duration-300 ${
                      isCompleted ? 'bg-emerald-500/60' : 'bg-white/10'
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
        <div className="p-4 rounded-xl glass-panel bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-start justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-start gap-2.5">
            <IconAlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">Import Error</p>
              <p className="mt-0.5 text-rose-200/90">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded text-rose-400 hover:text-rose-200 transition"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: FILE UPLOAD */}
      {currentStep === 1 && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-blue-400/80 bg-blue-500/15 shadow-[0_0_30px_rgba(59,130,246,0.25)]'
                : 'border-white/20 hover:border-blue-400/50 bg-white/[0.02] hover:bg-white/[0.05]'
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

            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-400/30 text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(59,130,246,0.25)]">
              <IconUploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white">
              Drag & drop your CPSE material catalog file here
            </h3>
            <p className="text-xs text-slate-300/80 mt-1 max-w-md mx-auto">
              Supports CSV (.csv) and Microsoft Excel (.xlsx) files up to 15 MB. Automatic header detection and schema mapping.
            </p>

            <div className="mt-5">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(59,130,246,0.4)] transition"
              >
                Browse Files
              </button>
            </div>
          </div>

          {/* Selected File Card */}
          {file && (
            <div className="p-4 rounded-xl glass-card bg-white/[0.04] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-400 shadow-sm">
                  <IconFileSpreadsheet className="w-5 h-5" />
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
                  className="px-3 py-1.5 rounded-lg glass-btn-secondary text-xs text-slate-300 font-medium transition"
                >
                  Remove
                </button>
                <button
                  onClick={handleProceedToMapping}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg glass-btn-primary text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <IconRefresh className="w-3.5 h-3.5 animate-spin" />
                      <span>Inspecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Mapping</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
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
        <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">Map Catalog Columns to MATPULSE Schema</h2>
              <p className="text-xs text-slate-300/80">
                Match your uploaded spreadsheet headers to the standard master data fields.
              </p>
            </div>
            <div className="text-xs font-mono text-blue-300 bg-blue-500/15 px-3 py-1 rounded-full border border-blue-400/30">
              {fileHeaders.length} columns detected
            </div>
          </div>

          {/* Mapping Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden glass-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.04] text-slate-400 uppercase text-[10px] font-semibold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">MATPULSE Master Field</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Uploaded File Column</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {Object.entries(targetFields).map(([fieldKey, fieldInfo]) => (
                  <tr key={fieldKey} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-medium text-white">
                      {fieldInfo.label}
                      <span className="block font-mono text-[10px] text-slate-400">{fieldKey}</span>
                    </td>
                    <td className="py-3 px-4">
                      {fieldInfo.required ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">OPTIONAL</span>
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
                        className="w-full max-w-xs px-3 py-1.5 bg-slate-900/90 border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-blue-400"
                      >
                        <option value="" className="bg-slate-900 text-slate-400">-- Do not map --</option>
                        {fileHeaders.map((header) => (
                          <option key={header} value={header} className="bg-slate-900 text-white">
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
            <div className="p-4 rounded-xl glass-panel bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs shadow-lg">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <IconBuilding className="w-4 h-4 text-amber-400" />
                <span>No CPSE Column Mapped — Specify Organization</span>
              </div>
              <p className="text-amber-200/90 text-[11px]">
                Since your uploaded file does not include a dedicated CPSE column, select the organization that will be assigned to all records:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={defaultCpse}
                  onChange={(e) => setDefaultCpse(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900/90 border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="" className="bg-slate-900 text-slate-400">-- Select CPSE Organization --</option>
                  {COMMON_CPSES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                  <option value="__CUSTOM__" className="bg-slate-900 text-amber-300">Other / Custom CPSE...</option>
                </select>

                {defaultCpse === '__CUSTOM__' && (
                  <input
                    type="text"
                    placeholder="Enter CPSE acronym (e.g. NHPC)"
                    value={customCpse}
                    onChange={(e) => setCustomCpse(e.target.value.toUpperCase())}
                    className="px-3 py-1.5 bg-slate-900/90 border border-white/20 rounded-lg text-xs text-white font-mono uppercase focus:outline-none focus:border-blue-400"
                  />
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-btn-secondary text-xs font-medium text-slate-200 transition"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleProceedToValidation}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <IconRefresh className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>Validate Dataset</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATE & PREVIEW */}
      {currentStep === 3 && validationReport && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-base font-bold text-white">Dataset Validation & Preview</h2>
              <p className="text-xs text-slate-300/80">
                Review validation results and inspect parsed records before committing to the database.
              </p>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl glass-card bg-white/[0.04] border border-white/10">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Rows</span>
              <span className="font-mono text-2xl font-bold text-white mt-1 block">
                {validationReport.total_rows}
              </span>
            </div>

            <div className="p-4 rounded-xl glass-card bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-semibold text-emerald-300 block">✓ Valid Records</span>
              <span className="font-mono text-2xl font-bold text-emerald-400 mt-1 block">
                {validationReport.valid_count}
              </span>
            </div>

            <div className="p-4 rounded-xl glass-card bg-amber-500/10 border border-amber-500/30">
              <span className="text-[10px] uppercase font-semibold text-amber-300 block">⚠ Duplicates (Skip)</span>
              <span className="font-mono text-2xl font-bold text-amber-400 mt-1 block">
                {validationReport.duplicate_count}
              </span>
            </div>

            <div className="p-4 rounded-xl glass-card bg-rose-500/10 border border-rose-500/30">
              <span className="text-[10px] uppercase font-semibold text-rose-300 block">✕ Invalid Rows</span>
              <span className="font-mono text-2xl font-bold text-rose-400 mt-1 block">
                {validationReport.invalid_count}
              </span>
            </div>
          </div>

          {/* Duplicate Records Explanatory Notice */}
          {validationReport.duplicate_count > 0 && validationReport.valid_count === 0 && (
            <div className="p-4 rounded-xl glass-panel bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
              <div className="flex items-start gap-2.5">
                <IconAlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-100">
                    {validationReport.duplicate_count} duplicate material codes were found. Existing records were not imported again.
                  </p>
                  <p className="text-amber-200/90 leading-relaxed">
                    No new material records were imported. These material codes already exist in the Material Master. Duplicate rows are not data errors; existing records are preserved without duplication.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/materials')}
                className="px-3.5 py-1.5 rounded-lg glass-btn-secondary text-xs font-semibold text-white border border-amber-400/40 shadow-sm transition whitespace-nowrap self-start sm:self-center"
              >
                View in Material Master
              </button>
            </div>
          )}

          {validationReport.duplicate_count > 0 && validationReport.valid_count > 0 && (
            <div className="p-4 rounded-xl glass-panel bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-2.5 text-xs shadow-lg">
              <IconAlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-100">
                  {validationReport.duplicate_count} duplicate material codes were found. Existing records were not imported again.
                </p>
                <p className="text-amber-200/90 mt-0.5">
                  The {validationReport.valid_count} new unique records will be imported into the Material Master catalog, while duplicate codes already in the database will be safely skipped.
                </p>
              </div>
            </div>
          )}

          {/* Warnings Callout */}
          {validationReport.warnings && validationReport.warnings.length > 0 && (
            <div className="p-4 rounded-xl glass-panel bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs shadow-lg">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <IconAlertTriangle className="w-4 h-4 text-amber-400" />
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
              <span className="text-xs font-semibold text-white">
                Sample Valid Records (showing first {validationReport.preview_records.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Material Master Schema Preview
              </span>
            </div>

            <div className="border border-white/10 rounded-xl overflow-x-auto glass-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-slate-400 uppercase text-[10px] font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">CPSE</th>
                    <th className="py-2.5 px-3">Material Code</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {validationReport.preview_records.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2 px-3 font-mono font-medium text-blue-300 text-[11px]">{r.cpse}</td>
                      <td className="py-2 px-3 font-mono text-white font-semibold text-[11px]">{r.material_code}</td>
                      <td className="py-2 px-3 truncate max-w-[260px] text-slate-200" title={r.description}>
                        {r.description}
                      </td>
                      <td className="py-2 px-3 text-slate-400">{r.category || '—'}</td>
                      <td className="py-2 px-3 font-mono text-slate-300">{r.uom || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-btn-secondary text-xs font-medium text-slate-200 transition"
            >
              <IconArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Mapping</span>
            </button>

            {validationReport.valid_count === 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">All records already exist in Material Master.</span>
                <button
                  onClick={() => navigate('/materials')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition"
                >
                  <span>View Material Master</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleExecuteImport}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(16,185,129,0.35)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <IconRefresh className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing Records...</span>
                  </>
                ) : (
                  <>
                    <IconDatabase className="w-3.5 h-3.5" />
                    <span>Import {validationReport.valid_count} Valid Records</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: HARMONIZE */}
      {currentStep === 4 && importResult && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          {/* Import Complete Banner */}
          <div className="p-5 rounded-xl glass-card bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <IconCheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Catalog Import Complete</h2>
                <p className="text-xs text-emerald-300 mt-0.5">
                  <strong>{importResult.records_imported}</strong> material master records successfully imported into the SQLite database.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {importResult.records_skipped} duplicate codes skipped • {importResult.records_rejected} invalid rows rejected.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/materials')}
              className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-semibold text-white transition self-start sm:self-center"
            >
              View in Materials Master
            </button>
          </div>

          {/* AI Harmonization In-Progress Banner */}
          {isHarmonizing && (
            <div className="p-4 rounded-xl glass-panel bg-blue-500/15 border border-blue-400/30 text-blue-200 flex items-start gap-3 text-xs shadow-lg animate-pulse">
              <IconRefresh className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-white">AI Harmonization in Progress</p>
                <p className="text-blue-200/90 leading-relaxed">
                  Analyzing material records and generating cross-CPSE match recommendations... Please keep this page open while the matching engine completes.
                </p>
              </div>
            </div>
          )}

          {/* AI Harmonization Action Card */}
          <div className="p-6 rounded-2xl glass-card bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-400">
                <IconSparkles className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Run AI Harmonization on Imported Catalog</h3>
            </div>
            <p className="text-xs text-slate-300/80 leading-relaxed max-w-2xl">
              Now that the new material records are stored in the Material Master catalog, trigger the sentence transformer and technical attribute matching engine to identify equivalent items across existing CPSE catalogs (BHEL, NTPC, ONGC, SAIL, IOCL, etc.).
            </p>

            <button
              onClick={handleRunHarmonization}
              disabled={isHarmonizing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl glass-btn-primary text-white text-xs font-semibold shadow-[0_0_25px_rgba(59,130,246,0.35)] transition disabled:opacity-50"
            >
              {isHarmonizing ? (
                <>
                  <IconRefresh className="w-4 h-4 animate-spin" />
                  <span>Analyzing CPSE catalogs with AI Matching Engine...</span>
                </>
              ) : (
                <>
                  <IconSparkles className="w-4 h-4" />
                  <span>Run AI Harmonization</span>
                </>
              )}
            </button>
          </div>

          {/* Harmonization Results */}
          {harmonizationResult && (
            <div className="p-5 rounded-2xl glass-panel bg-blue-500/10 border border-blue-400/20 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    AI Harmonization Results
                  </h4>
                  <p className="text-xs text-slate-200 mt-1">
                    Evaluated cross-CPSE candidate pairs. Found <strong className="text-white">{harmonizationResult.total_candidates}</strong> potential recommendations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/reviews')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-btn-primary text-white text-xs font-semibold transition"
                  >
                    <span>View Review Queue</span>
                    <IconArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate('/matching')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn-secondary text-slate-200 text-xs font-semibold transition"
                  >
                    <span>AI Matching</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-4 rounded-xl glass-card bg-white/[0.04] border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Materials Analyzed</span>
                  <span className="font-mono text-xl font-bold text-white mt-1 block">
                    {materialStats?.total_materials ?? '—'}
                  </span>
                </div>
                <div className="p-4 rounded-xl glass-card bg-white/[0.04] border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Candidate Matches</span>
                  <span className="font-mono text-xl font-bold text-blue-400 mt-1 block">
                    {pipelineStats?.total_recommendations ?? harmonizationResult.total_candidates}
                  </span>
                </div>
                <div className="p-4 rounded-xl glass-card bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-300 block uppercase font-medium">High Confidence</span>
                  <span className="font-mono text-xl font-bold text-emerald-400 mt-1 block">
                    {pipelineStats?.high_confidence_count ?? '—'}
                  </span>
                </div>
                <div className="p-4 rounded-xl glass-card bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] text-amber-300 block uppercase font-medium">Requiring Review</span>
                  <span className="font-mono text-xl font-bold text-amber-400 mt-1 block">
                    {pipelineStats?.review_required_count ?? '—'}
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
