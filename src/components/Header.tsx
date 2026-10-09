import React from 'react';
import { Wifi, Smartphone, Radio, FileCode2, Settings, Download, MonitorCheck } from 'lucide-react';
import { NetworkConfig } from '../types/bubble';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  activeTab: 'server' | 'browser' | 'native-apk' | 'settings';
  setActiveTab: (tab: 'server' | 'browser' | 'native-apk' | 'settings') => void;
  config: NetworkConfig;
  dualView: boolean;
  setDualView: (val: boolean) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  dualView,
  setDualView,
  onOpenSettings,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <span className="text-xl">🫧</span>
              {config.isServerRunning && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Bubble
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                    WiFi Share
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 hidden sm:flex">
                <Wifi className="w-3 h-3 text-cyan-400" />
                <span>{config.ssid}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[11px] text-slate-300">{config.ipAddress}</span>
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Dual Simulator button on desktop */}
            <button
              onClick={() => setDualView(!dualView)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                dualView
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
              title="Compare Host Mobile and Second Mobile side by side"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{dualView ? 'Dual Mobile Active' : 'Simulate 2 Mobiles'}</span>
            </button>

            {/* Direct Project ZIP Download Button */}
            <a
              href="/bubble-app.zip"
              download="bubble-app.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-orange-500/20 active:scale-95 transition"
              title="Download full project as .zip file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </a>

            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Bubble App</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install on iOS</span>
              </button>
            )}

            {isInstalled && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                <MonitorCheck className="w-3 h-3" /> Installed
              </span>
            )}

            {/* Router Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 transition"
              title="WiFi & IP Router Config"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'server'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Mobile 1 (Server Host)</span>
            {config.isServerRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'browser'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile 2 (Browser Explorer)</span>
          </button>

          <button
            onClick={() => setActiveTab('native-apk')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'native-apk'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Android APK & FTP Code</span>
          </button>
        </div>
      </div>

      {/* iOS Install Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🫧</span> Install Bubble on iPhone / iPad
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              1. Tap the <strong className="text-white">Share</strong> button (box with arrow) in Safari.<br />
              2. Scroll down and choose <strong className="text-white">Add to Home Screen</strong>.<br />
              3. Tap <strong className="text-indigo-400">Add</strong> at the top right.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
