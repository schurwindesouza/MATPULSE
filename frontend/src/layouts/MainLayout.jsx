import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  GitCompare,
  CheckSquare,
  Layers,
  BarChart3,
  Server,
  Activity,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import materialService from '../services/materialService';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Materials', path: '/materials', icon: Boxes },
  { name: 'AI Matching', path: '/matching', icon: GitCompare },
  { name: 'Review Queue', path: '/review-queue', icon: CheckSquare },
  { name: 'Common Materials', path: '/common-materials', icon: Layers },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
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
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  ) || NAV_ITEMS[0];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white font-mono">MATPULSE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono border border-indigo-800/40">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal leading-tight">
                AI-Powered Material Harmonization
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SIH 26099 Badge */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/60">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">SIH Problem Statement 26099</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Cross-CPSE Material Standardization</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </NavLink>
            );
          })}

          <div className="pt-6">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Connected CPSE Catalogs
            </p>
            <div className="px-3 py-2 space-y-2 text-xs bg-slate-950/40 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-mono text-[11px]">BHEL • NTPC • ONGC</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-mono text-[11px]">SAIL • IOCL • CIL</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
        </nav>

        {/* Backend Status Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth.status === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : backendHealth.status === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-medium text-slate-300 truncate max-w-[130px]">
                {backendHealth.text}
              </span>
            </div>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="FastAPI Swagger UI"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Port 8000 • SQLite</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
              <span className="text-slate-300 font-mono">MATPULSE</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-semibold text-white">{currentNav.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Synthetic Demo Dataset Active</span>
            </div>
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
