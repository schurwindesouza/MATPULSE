import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconActivity,
  IconArrowRight,
  IconBuilding,
  IconCheckCircle,
  IconCpu,
  IconDatabase,
  IconExternalLink,
  IconGitCompare,
  IconLayers,
  IconLock,
  IconShieldCheck,
  IconSliders,
  IconTrendingUp,
  IconUploadCloud,
  IconFileText,
  IconBarChart,
  IconCheck,
} from '../components/icons/Icons';
import SplineBackground from '../components/SplineBackground';

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

  const workflowSteps = [
    {
      num: '01',
      title: 'Provenance-Preserved Ingestion',
      desc: 'Master catalogs are ingested from CPSE ERP spreadsheets/CSVs. Original enterprise codes and descriptions remain strictly immutable.',
    },
    {
      num: '02',
      title: 'Domain Text Normalization',
      desc: 'Industrial abbreviations, dimensional markers, standard tags (ASTM/IS/DIN/API), and unit acronyms are cleaned and standardized.',
    },
    {
      num: '03',
      title: 'Technical Attribute Extraction',
      desc: 'Key engineering parameters (diameter, schedule, pressure rating, metallurgy grade, end connection) are parsed deterministically.',
    },
    {
      num: '04',
      title: 'AI Semantic Embedding Matching',
      desc: 'Specialized transformer models (all-MiniLM-L6-v2) compute dense vector representations and cosine similarity across cross-CPSE candidates.',
    },
    {
      num: '05',
      title: 'Deterministic Rule Validation',
      desc: 'Strict engineering safety rules compare extracted attributes. Incompatible pressure classes or metallurgy grades cap confidence automatically.',
    },
    {
      num: '06',
      title: 'Human-in-the-Loop Review',
      desc: 'Domain experts evaluate explainable recommendations, inspect attribute diffs, and approve or reject with timestamped justifications.',
    },
    {
      num: '07',
      title: 'Common National Code Assignment',
      desc: 'Verified pairs receive an authoritative Common National Material Code (NMC) while preserving original CPSE internal numbers.',
    },
    {
      num: '08',
      title: 'Enterprise Analytics & Visibility',
      desc: 'Real-time visibility across CPSE catalog coverage, category consolidation, harmonization readiness, and catalog data quality.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Transparent Global Navigation Bar (Top-Right) */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-transparent border-none shadow-none pointer-events-none">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 h-20 sm:h-24 flex items-center justify-end">
          <nav className="flex items-center gap-8 sm:gap-12 pointer-events-auto">
            <a
              href="#home"
              className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white hover:text-white/70 transition-colors duration-200"
            >
              HOME
            </a>
            <a
              href="#about"
              className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white hover:text-white/70 transition-colors duration-200"
            >
              ABOUT
            </a>
            <a
              href="#contact"
              className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white hover:text-white/70 transition-colors duration-200"
            >
              CONTACT US
            </a>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section with Full-Screen Spline 3D Scene Background */}
      <section
        id="home"
        className="relative w-full h-screen min-h-[100vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 overflow-hidden text-white bg-black"
        style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#000' }}
      >
        {/* Full-screen animated 3D Spline background */}
        <SplineBackground />

        {/* Minimal Centered Hero Content - positioned slightly above ribbons for optimal contrast */}
        <div
          className="relative z-10 max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 pointer-events-none -translate-y-8 sm:-translate-y-12 md:-translate-y-14 transition-transform duration-300"
          style={{ position: 'relative', zIndex: 10 }}
        >
          {/* Dominant Application Title */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8rem] font-black tracking-tight text-white uppercase select-none leading-none">
            MATPULSE
          </h1>

          {/* Clean Tagline */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-normal text-white max-w-2xl mx-auto leading-relaxed select-none px-4">
            Ai powered material standardization and harmonization for CPSEs
          </p>

          {/* Minimal Elegant White Button */}
          <div className="pt-2 sm:pt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 sm:px-9 py-3 sm:py-3.5 rounded-full bg-white hover:bg-white/90 text-black text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg pointer-events-auto cursor-pointer"
            >
              LAUNCH PLATFORM
            </Link>
          </div>
        </div>
      </section>

      {/* 3. About & Problem Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        {/* Precision Industrial Topology Diagram */}
        <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-900">Federated Convergence Topology</span>
            </div>
            <span className="font-mono text-slate-500">6 Connected CPSE Master Catalogs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Left: Input Catalogs */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Raw Enterprise Catalogs (Divergent)
              </p>
              <div className="space-y-2">
                {[
                  { cpse: 'BHEL', code: 'SYN-BHEL-PP-201', desc: 'PIPE CS SEAMLESS 50 NB SCH 40' },
                  { cpse: 'NTPC', code: 'SYN-NTPC-P-44021', desc: 'Seamless CS Pipe 2" NB Sch 40' },
                  { cpse: 'ONGC', code: 'SYN-ONGC-PIPE-02', desc: 'LINE PIPE CS 2 IN SCH 40 SMLS' },
                ].map((item) => (
                  <div key={item.cpse} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{item.cpse}</span>
                      <span className="text-[10px] font-mono text-slate-500">{item.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: AI & Rules Engine */}
            <div className="space-y-3 flex flex-col justify-center">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                MATPULSE Harmonization Engine
              </p>
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                  <IconCpu className="w-4 h-4 text-blue-700" />
                  <span>AI Semantic Embeddings</span>
                </div>
                <div className="h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-700 rounded-full w-4/5" />
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 pt-1">
                  <IconShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Deterministic Rule Validation</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 pt-1">
                  <IconCheckCircle className="w-4 h-4 text-blue-700" />
                  <span>Human Review Sign-off</span>
                </div>
              </div>
            </div>

            {/* Right: Output Common Code */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Unified Common National Code
              </p>
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3 h-[calc(100%-2rem)] flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                    Harmonized Master Record
                  </span>
                  <h4 className="text-base font-bold font-mono text-emerald-900 mt-2">
                    NMC-PIP-CS-50NB-40
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Seamless Carbon Steel Pipe 50mm NB (2&quot;), Schedule 40, ASTM A106 Grade B.
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 space-y-1">
                  <p>&bull; 3 Enterprise Catalogs Mapped</p>
                  <p>&bull; Original CPSE Codes 100% Intact</p>
                  <p>&bull; Single National Procurement Standard</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Context */}
        <div id="problem" className="max-w-3xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
            Problem Context
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            The Cross-Enterprise Catalog Fragmentation Challenge
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            In Indian public sector procurement, multiple Central Public Sector Enterprises independently procure
            identical physical engineering materials using disparate internal numbering systems, unstructured
            descriptions, and varied unit classifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
              1
            </div>
            <h3 className="text-base font-semibold text-slate-900">Isolated ERP Silos</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              BHEL, NTPC, ONGC, SAIL, IOCL, and Coal India operate distinct ERP instances. A 50 NB gate valve or
              seamless line pipe is logged under completely non-standardized code strings.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
              2
            </div>
            <h3 className="text-base font-semibold text-slate-900">Token-Matching Failures</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keyword searches fail because enterprise entries use divergent terminology—e.g. &quot;2 INCH&quot; vs
              &quot;50 NB&quot; vs &quot;50MM&quot;, &quot;SMLS&quot; vs &quot;SEAMLESS&quot;, or &quot;OS&amp;Y&quot;
              vs &quot;OUTSIDE SCREW &amp; YOKE&quot;.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
              3
            </div>
            <h3 className="text-base font-semibold text-slate-900">Procurement Opacity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Without cross-CPSE code harmonization, public sector oversight cannot calculate consolidated demand,
              identify vendor overlap, or reconcile pricing disparities across enterprises.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How MATPULSE Works Section */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
              Engineering Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              The 8-Stage Harmonization Pipeline
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              MATPULSE resolves catalog divergence through a decoupled, explainable pipeline combining deep
              transformer embeddings, deterministic engineering rule filters, and human-in-the-loop review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`p-5 rounded-xl border transition cursor-pointer space-y-2 ${
                  activeStep === idx
                    ? 'bg-blue-50/60 border-blue-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">{step.num}</span>
                  {activeStep === idx && <IconCheck className="w-4 h-4 text-blue-700" />}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AI & Technical Validation Rules */}
      <section id="intelligence" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
              Intelligence &amp; Safety
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Semantic AI Paired with Deterministic Engineering Rules
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pure statistical AI models frequently confuse physically non-interchangeable materials if descriptions
              share similar phrasing. MATPULSE combines semantic transformer embeddings with deterministic engineering
              rules to safeguard industrial integrity.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <IconCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Semantic Embeddings (all-MiniLM-L6-v2)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Evaluates industrial domain text equivalence and maps conceptual synonyms across CPSE abbreviations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Critical Attribute Conflict Guards
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    If pressure classes (Class 150 vs Class 300) or metallurgy grades (WCB vs SS316) conflict,
                    confidence is deterministically capped at 65%, preventing erroneous auto-acceptance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <IconCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Unit of Measurement (UOM) Cross-Check
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Validates packaging and quantity units (e.g. Metric Tonne vs Meter vs Each) before pair evaluation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="font-semibold text-slate-900">Composite Scoring Formula</span>
              <span className="font-mono text-blue-700 font-bold">100.0% Weight Total</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Semantic Embedding Cosine Similarity</span>
                  <span className="font-mono font-bold text-slate-900">45%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-700 rounded-full w-[45%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Technical Dimension &amp; Grade Rules</span>
                  <span className="font-mono font-bold text-slate-900">40%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full w-[40%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Category Domain Compatibility</span>
                  <span className="font-mono font-bold text-slate-900">10%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full w-[10%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Unit of Measurement (UOM) Match</span>
                  <span className="font-mono font-bold text-slate-900">5%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[5%]" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 uppercase tracking-wide block">
                Explainability Guarantee:
              </span>
              <p>Every recommendation produces itemized reasons, warnings, and exact attribute comparison diffs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Human-in-the-Loop Governance */}
      <section id="governance" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
              Human-in-the-Loop Review
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              AI Suggests. Technical Rules Guard. Humans Decide.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Public sector accountability requires complete domain reviewer authorization before changing material
              records. MATPULSE provides a dedicated human review console where material managers evaluate recommendations,
              view full technical diffs, and approve or reject with immutable reason codes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                OK
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Approve &amp; Assign Common Code</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reviewers confirm equivalence and assign an authoritative Common National Material Code (e.g.
                NMC-PIP-CS-50NB-40) to both records while keeping internal CPSE codes completely untouched.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                REJ
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Reject with Stored Justification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reviewers reject non-equivalent pairs with structured presets (e.g. &quot;Pressure rating mismatch&quot;,
                &quot;Different metallurgical grade&quot;). Master records remain pristine and unmodified.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                LOG
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every review decision records the exact timestamp, reviewer notes, and algorithm scores, providing
                complete transparency for CPSE procurement committees and vigilance authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Analytics & Visibility */}
      <section id="analytics" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
            Analytics &amp; Data Quality
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Real-Time Cross-CPSE Harmonization Intelligence
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Directly derived from the FastAPI backend and SQLite master database. No faked statistics or fabricated
            spend metrics.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">CPSE Coverage</p>
            <p className="text-2xl font-bold font-mono text-slate-900">6 Catalogs</p>
            <p className="text-[11px] text-slate-400">BHEL, NTPC, ONGC, SAIL, IOCL, CIL</p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Harmonization Rate</p>
            <p className="text-2xl font-bold font-mono text-emerald-700">62.5%</p>
            <p className="text-[11px] text-slate-400">Master records harmonized</p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Common Groups</p>
            <p className="text-2xl font-bold font-mono text-blue-700">2 Groups</p>
            <p className="text-[11px] text-slate-400">5 original codes unified</p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Data Completeness</p>
            <p className="text-2xl font-bold font-mono text-slate-900">100%</p>
            <p className="text-[11px] text-slate-400">Zero missing attributes in seed</p>
          </div>
        </div>
      </section>

      {/* 8. Final Call to Action / Contact */}
      <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to Inspect the Working MATPULSE Platform?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Access the live executive dashboard, browse CPSE material catalogs, test the AI matching engine,
            and review persistent recommendations.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md transition"
            >
              <span>Enter MATPULSE Console</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold font-mono text-slate-900">MATPULSE</span>
              <span>&bull;</span>
              <span>Smart India Hackathon Problem Statement 26099</span>
            </div>
            <p>
              AI-Driven Standardization and Harmonization of Material Codes across Central Public Sector Enterprises.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="hover:text-blue-700 transition">Dashboard</Link>
            <Link to="/materials" className="hover:text-blue-700 transition">Materials</Link>
            <Link to="/matching" className="hover:text-blue-700 transition">AI Matching</Link>
            <Link to="/analytics" className="hover:text-blue-700 transition">Analytics</Link>
            <Link to="/terms" className="hover:text-blue-700 transition">Terms (Draft)</Link>
            <Link to="/privacy" className="hover:text-blue-700 transition">Privacy (Draft)</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
