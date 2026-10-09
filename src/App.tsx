/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HostServerView } from './components/HostServerView';
import { ClientBrowserView } from './components/ClientBrowserView';
import { NativeAndroidGuide } from './components/NativeAndroidGuide';
import { RouterConfigModal } from './components/RouterConfigModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { NetworkConfig, SharedFile, TransferLog } from './types/bubble';
import { getInitialFiles } from './utils/mockMedia';
import { bubbleSync } from './services/bubbleSync';
import { Smartphone, Radio, Wifi, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'server' | 'browser' | 'native-apk' | 'settings'>('server');
  const [dualView, setDualView] = useState(false);
  const [files, setFiles] = useState<SharedFile[]>(getInitialFiles());
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [connectedClientsCount, setConnectedClientsCount] = useState(0);

  // Default network configuration tailored for Zong EVO 4G & Local WiFi router
  const [config, setConfig] = useState<NetworkConfig>({
    ssid: 'Zong 4G Evo Hotspot',
    ipAddress: '192.168.8.105',
    port: 2221,
    webPort: 3000,
    gateway: '192.168.8.1',
    isServerRunning: true,
    anonymousLogin: true,
    username: 'bubble',
    password: '',
    readOnly: false,
    deviceModel: 'Samsung Galaxy A54',
    roomCode: '8821',
    networkType: 'zong_evo',
  });

  const [transferLogs, setTransferLogs] = useState<TransferLog[]>([
    {
      id: 'init-log-1',
      fileName: 'VID_Family_Trip_4K.mp4',
      fileSize: 28.5 * 1024 * 1024,
      direction: 'download',
      device: 'Mobile 2 (Chrome)',
      timestamp: Date.now() - 120000,
      status: 'completed',
      progress: 100,
      speed: '22.4 MB/s',
    },
  ]);

  // Check if URL has ?connect=roomCode (indicates Mobile 2 opened via QR code or link)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const connectParam = params.get('connect');
      if (connectParam) {
        setConfig((prev) => ({ ...prev, roomCode: connectParam }));
        setActiveTab('browser');
        // Connect to host peer
        bubbleSync.connectToHost(connectParam, 'Mobile 2 (Browser)', () => {
          setConnectedClientsCount((c) => Math.max(1, c + 1));
        });
      } else {
        // Initialize as Host peer
        bubbleSync.initHost(config.roomCode, files, () => {
          // Ready as host
        });
      }
    }

    const unsubscribe = bubbleSync.subscribe((event) => {
      if (event.type === 'peer_connected') {
        setConnectedClientsCount((c) => c + 1);
      } else if (event.type === 'peer_disconnected') {
        setConnectedClientsCount((c) => Math.max(0, c - 1));
      } else if (event.type === 'files_updated') {
        setFiles(event.files);
      } else if (event.type === 'file_received') {
        setFiles((prev) => [event.file, ...prev]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [config.roomCode]);

  // Sync files whenever Host files change
  useEffect(() => {
    bubbleSync.updateFiles(files);
  }, [files]);

  const handleUploadFromClient = (file: SharedFile) => {
    setFiles((prev) => [file, ...prev]);
    bubbleSync.sendUploadedFile(file);
  };

  const handleLogTransfer = (log: TransferLog) => {
    setTransferLogs((prev) => [log, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        dualView={dualView}
        setDualView={setDualView}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {dualView ? (
          /* Dual Phone Simulation Mode (Split view for testing two phones on one screen) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Phone 1: Server Host */}
            <div className="rounded-3xl border border-indigo-500/40 bg-slate-900/60 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Mobile 1: Server Host (Bubble App)
                    </h3>
                    <p className="text-[11px] text-slate-400">Shares camera, photos, &amp; videos</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                  {config.ipAddress}
                </span>
              </div>

              <HostServerView
                config={config}
                setConfig={setConfig}
                files={files}
                setFiles={setFiles}
                onPreviewFile={(f) => setPreviewFile(f)}
                onOpenClientView={() => setActiveTab('browser')}
                transferLogs={transferLogs}
                connectedClientsCount={connectedClientsCount}
              />
            </div>

            {/* Phone 2: Browser Explorer */}
            <div className="rounded-3xl border border-cyan-500/40 bg-slate-900/60 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Mobile 2: Browser Client
                    </h3>
                    <p className="text-[11px] text-slate-400">Chrome / Safari / File Manager</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Connected
                </span>
              </div>

              <ClientBrowserView
                config={config}
                files={files}
                onPreviewFile={(f) => setPreviewFile(f)}
                onUploadFromClient={handleUploadFromClient}
                onLogTransfer={handleLogTransfer}
              />
            </div>
          </div>
        ) : (
          /* Normal Single View Mode */
          <div>
            {activeTab === 'server' && (
              <HostServerView
                config={config}
                setConfig={setConfig}
                files={files}
                setFiles={setFiles}
                onPreviewFile={(f) => setPreviewFile(f)}
                onOpenClientView={() => setActiveTab('browser')}
                transferLogs={transferLogs}
                connectedClientsCount={connectedClientsCount}
              />
            )}

            {activeTab === 'browser' && (
              <ClientBrowserView
                config={config}
                files={files}
                onPreviewFile={(f) => setPreviewFile(f)}
                onUploadFromClient={handleUploadFromClient}
                onLogTransfer={handleLogTransfer}
              />
            )}

            {activeTab === 'native-apk' && <NativeAndroidGuide />}
          </div>
        )}
      </main>

      {/* Router Settings Modal */}
      {showSettingsModal && (
        <RouterConfigModal
          config={config}
          setConfig={setConfig}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={(f) => {
          const a = document.createElement('a');
          a.href = f.url;
          a.download = f.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }}
      />
    </div>
  );
}
