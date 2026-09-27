import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  IconActivity,
  IconDatabase,
  IconBuilding,
  IconCheckCircle,
  IconLayers,
  IconGitCompare,
  IconUploadCloud,
  IconBarChart,
  IconSettings,
  IconChevronRight,
  IconMenu,
  IconX,
  IconExternalLink,
  IconCheckSquare,
  IconBoxes,
} from '../components/icons/Icons';
import materialService from '../services/materialService';
import matpulseLogo from '../assets/matpulse-logo.png';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: IconActivity },
  { name: 'Materials', path: '/materials', icon: IconBoxes },
  { name: 'Import Catalog', path: '/import', icon: IconUploadCloud },
  { name: 'AI Matching', path: '/matching', icon: IconGitCompare },
  { name: 'Review Queue', path: '/review-queue', icon: IconCheckSquare },
  { name: 'Common Materials', path: '/common-materials', icon: IconLayers },
  { name: 'Analytics', path: '/analytics', icon: IconBarChart },
  { name: 'Settings', path: '/settings', icon: IconSettings },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', text: 'Connecting...' });
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const data = await materialService.checkHealth();
        if (isMounted) {
          if (data?.status === 'healthy') {
            setBackendHealth({ status: 'online', text: 'FastAPI Backend Live' });
          } else {
            setBackendHealth({ status: 'warning', text: 'Backend Responsive' });
          }
        }
      } catch (err) {
        if (isMounted) {
          setBackendHealth({ status: 'offline', text: 'Backend Disconnected' });
        }
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentNav = NAV_ITEMS.find((item) =>
    location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
  ) || NAV_ITEMS[0];

  return (
    <div className="flex min-h-screen bg-transparent text-white font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Glass Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-sidebar flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 min-w-0 group" title="MATPULSE Home">
            <img
              src={matpulseLogo}
              alt="MATPULSE Logo"
              className="h-11 w-auto max-w-[85px] object-contain flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
              style={{ objectFit: 'contain' }}
            />
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-400/30 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-normal leading-tight mt-0.5">
                CPSE Material Standardization
              </p>
            </div>
          </Link>
          <button
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>


        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
            Platform Console
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/30 text-white font-semibold border border-blue-400/50 shadow-lg shadow-blue-500/15 backdrop-blur-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
                )}
              </NavLink>
            );
          })}

          <div className="pt-6">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
              Connected CPSE Catalogs
            </p>
            <div className="px-3 py-2 space-y-1.5 text-xs bg-white/[0.03] rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-mono text-[11px] font-medium">BHEL &bull; NTPC &bull; ONGC</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-mono text-[11px] font-medium">SAIL &bull; IOCL &bull; CIL</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </nav>

        {/* Backend Status Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth.status === 'online'
                    ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80'
                    : backendHealth.status === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                {backendHealth.text}
              </span>
            </div>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors p-1"
              title="FastAPI Swagger UI"
            >
              <IconExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Port 8000 &bull; SQLite Store</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-950/65 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] lg:hidden"
            >
              <IconMenu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
              <Link to="/dashboard" className="text-white font-mono font-medium hover:text-blue-400 transition">
                MATPULSE
              </Link>
              <IconChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-white">{currentNav.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.08] border border-white/15 transition"
              title="View Public Presentation"
            >
              <span>Platform Guide</span>
              <IconExternalLink className="w-3 h-3" />
            </Link>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-medium">Synthetic Demo Dataset Active</span>
            </div>
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-transparent text-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
