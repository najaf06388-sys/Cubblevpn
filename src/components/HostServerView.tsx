import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import {
  Power,
  Copy,
  Check,
  QrCode,
  Share2,
  FolderPlus,
  Image,
  Video,
  Music,
  FileText,
  Trash2,
  Eye,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Upload,
  Layers,
  Sparkles,
  Download,
  Archive,
  RefreshCw
} from 'lucide-react';
import { NetworkConfig, SharedFile, TransferLog } from '../types/bubble';
import { formatBytes, formatDate } from '../utils/mockMedia';

interface HostServerViewProps {
  config: NetworkConfig;
  setConfig: React.Dispatch<React.SetStateAction<NetworkConfig>>;
  files: SharedFile[];
  setFiles: React.Dispatch<React.SetStateAction<SharedFile[]>>;
  onPreviewFile: (file: SharedFile) => void;
  onOpenClientView: () => void;
  transferLogs: TransferLog[];
  connectedClientsCount: number;
}

export const HostServerView: React.FC<HostServerViewProps> = ({
  config,
  setConfig,
  files,
  setFiles,
  onPreviewFile,
  onOpenClientView,
  transferLogs,
  connectedClientsCount,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct single file download
  const handleDownloadSingle = (file: SharedFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all files as a ZIP package
  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    setIsZipping(true);
    setZipProgress(10);
    try {
      const zip = new JSZip();
      const folder = zip.folder('Bubble_Shared_Files') || zip;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setZipProgress(Math.round(((i + 1) / files.length) * 80));
        if (file.blob) {
          folder.file(file.name, file.blob);
        } else {
          try {
            const resp = await fetch(file.url);
            const blob = await resp.blob();
            folder.file(file.name, blob);
          } catch {
            folder.file(file.name, `Content for ${file.name}`);
          }
        }
      }
      setZipProgress(90);
      const content = await zip.generateAsync({ type: 'blob' });
      setZipProgress(100);
      const zipUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `Bubble_All_Files_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('ZIP download error', e);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  // Compute full browser access URL
  const browserUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?connect=${config.roomCode}`
    : `http://${config.ipAddress}:${config.webPort}/#connect=${config.roomCode}`;

  const ftpUrl = `ftp://${config.ipAddress}:${config.port}`;

  // Generate QR code
  useEffect(() => {
    QRCode.toDataURL(
      browserUrl,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [browserUrl]);

  const toggleServer = () => {
    setConfig((prev) => ({
      ...prev,
      isServerRunning: !prev.isServerRunning,
    }));
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Handle uploading real user files from mobile storage / camera
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedList = Array.from(e.target.files);

    const newSharedFiles: SharedFile[] = uploadedList.map((file, idx) => {
      let cat: SharedFile['type'] = 'other';
      let folder: SharedFile['folder'] = 'Downloads';

      if (file.type.startsWith('image/')) {
        cat = 'image';
        folder = 'DCIM';
      } else if (file.type.startsWith('video/')) {
        cat = 'video';
        folder = 'Videos';
      } else if (file.type.startsWith('audio/')) {
        cat = 'audio';
        folder = 'Music';
      } else if (
        file.type.includes('pdf') ||
        file.type.includes('word') ||
        file.type.includes('text') ||
        file.name.endsWith('.doc') ||
        file.name.endsWith('.pdf')
      ) {
        cat = 'document';
        folder = 'Documents';
      }

      const objectUrl = URL.createObjectURL(file);

      return {
        id: `upload-${Date.now()}-${idx}`,
        name: file.name,
        size: file.size,
        type: cat,
        mimeType: file.type || 'application/octet-stream',
        url: objectUrl,
        thumbnailUrl: cat === 'image' ? objectUrl : undefined,
        uploadedAt: Date.now(),
        downloadCount: 0,
        folder,
        blob: file,
      };
    });

    setFiles((prev) => [...newSharedFiles, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Group files stats
  const photosCount = files.filter((f) => f.type === 'image').length;
  const videosCount = files.filter((f) => f.type === 'video').length;
  const docsCount = files.filter((f) => f.type === 'document').length;
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Network Badge & EVO Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                {config.networkType === 'zong_evo' ? 'Zong EVO 4G Hotspot' : 'Local WiFi Network'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Gateway: {config.gateway}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Host Mobile: <strong className="text-slate-200">{config.deviceModel}</strong> (IP:{' '}
              <span className="font-mono text-cyan-300 font-semibold">{config.ipAddress}</span>)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {connectedClientsCount > 0
                  ? `${connectedClientsCount} Mobile Connected`
                  : 'Ready for Mobile 2'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Server Centerpiece (Power Bubble) */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
            config.isServerRunning
              ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/15 via-cyan-500/5 to-transparent'
              : 'opacity-0'
          }`}
        />

        {/* Big Animated Bubble Power Button */}
        <div className="relative group">
          {config.isServerRunning && (
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-60 blur-xl animate-pulse" />
          )}

          <button
            onClick={toggleServer}
            className={`relative flex flex-col items-center justify-center w-44 h-44 sm:w-52 sm:h-52 rounded-full transition-all duration-500 transform active:scale-95 shadow-2xl ${
              config.isServerRunning
                ? 'bg-gradient-to-b from-indigo-600 via-indigo-700 to-indigo-900 ring-4 ring-cyan-400/80 shadow-cyan-500/40 text-white'
                : 'bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 ring-2 ring-slate-700 text-slate-400 hover:text-white hover:ring-indigo-500/50'
            }`}
          >
            <div
              className={`p-4 rounded-full transition-all duration-500 ${
                config.isServerRunning
                  ? 'bg-white/20 text-cyan-200'
                  : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400'
              }`}
            >
              <Power className={`w-10 h-10 ${config.isServerRunning ? 'animate-pulse' : ''}`} />
            </div>

            <span className="mt-3 text-sm font-bold tracking-wider uppercase">
              {config.isServerRunning ? 'SERVER RUNNING' : 'START SERVER'}
            </span>
            <span className="text-[11px] font-normal text-slate-300/80 mt-0.5">
              {config.isServerRunning ? 'Tap to Stop' : 'Tap to Connect'}
            </span>
          </button>
        </div>

        {/* Server Status Subtext */}
        <div className="mt-6 text-center max-w-md">
          {config.isServerRunning ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Broadcasting on WiFi / Zong EVO device</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Turn on server to access this phone&apos;s photos and videos from your other phone or browser.
            </p>
          )}
        </div>

        {/* Connection Addresses (when server is running) */}
        {config.isServerRunning && (
          <div className="w-full max-w-2xl mt-6 space-y-3.5">
            {/* 1. Browser Web Access */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-cyan-400" />
                  Method 1: Browser Web Access (Recommended)
                </span>
                <span className="text-[10px] text-indigo-300/80 bg-indigo-900/60 px-2 py-0.5 rounded-md border border-indigo-700/50">
                  No App Needed on Mobile 2
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2">
                Open Chrome / Safari on your second mobile and enter this address:
              </p>

              <div className="flex items-center gap-2 bg-slate-950/90 rounded-xl p-2 border border-indigo-500/40">
                <div className="flex-1 font-mono text-xs sm:text-sm text-cyan-300 truncate px-2 select-all font-semibold">
                  {browserUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(browserUrl, 'web')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  title="Copy URL"
                >
                  {copiedType === 'web' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'web' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Show QR Code to scan"
                >
                  <QrCode className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={onOpenClientView}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 border border-slate-700 transition"
                  title="Open Client Explorer in this app"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </button>
              </div>
            </div>

            {/* 2. Classic WiFi FTP Server Access */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-amber-400" />
                  Method 2: FTP File Manager / PC Access
                </span>
                <span className="text-[10px] text-amber-300/80 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                  Port {config.port} • Anonymous
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                For Solid Explorer, CX File Explorer, FileZilla, or Windows Explorer:
              </p>

              <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-2 border border-slate-700/80">
                <div className="flex-1 font-mono text-xs sm:text-sm text-amber-300 truncate px-2 select-all font-semibold">
                  {ftpUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(ftpUrl, 'ftp')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition active:scale-95"
                >
                  {copiedType === 'ftp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'ftp' ? 'Copied' : 'Copy FTP'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shared Storage Breakdown & Add Files Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Shared Mobile Storage
            </h3>
            <p className="text-xs text-slate-400">
              {files.length} items shared • Total {formatBytes(totalSize)} available to Mobile 2
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium active:scale-95 transition"
            >
              <FolderPlus className="w-4 h-4 text-sky-400" />
              <span>+ Add Files</span>
            </button>

            {/* BIG DOWNLOAD ALL ZIP BUTTON */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping || files.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50"
              title="Download all shared photos and videos into a single ZIP archive"
            >
              {isZipping ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              <span>{isZipping ? `Creating ZIP ${zipProgress}%...` : `⬇️ Download All (${files.length}) ZIP`}</span>
            </button>
          </div>
        </div>

        {/* Quick Category Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Photos & DCIM</div>
              <div className="text-[11px] text-slate-400">{photosCount} files</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Videos</div>
              <div className="text-[11px] text-slate-400">{videosCount} files</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Music & Audio</div>
              <div className="text-[11px] text-slate-400">
                {files.filter((f) => f.type === 'audio').length} files
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Documents</div>
              <div className="text-[11px] text-slate-400">{docsCount} files</div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {file.thumbnailUrl ? (
                  <img
                    src={file.thumbnailUrl}
                    alt={file.name}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-800 ring-1 ring-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                    {file.type === 'video' ? (
                      <Video className="w-5 h-5 text-purple-400" />
                    ) : file.type === 'audio' ? (
                      <Music className="w-5 h-5 text-amber-400" />
                    ) : file.type === 'document' ? (
                      <FileText className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Image className="w-5 h-5 text-sky-400" />
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-300 transition">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{formatBytes(file.size)}</span>
                    <span>•</span>
                    <span className="text-indigo-400">{file.folder}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleDownloadSingle(file)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                  title="Download file to device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => onPreviewFile(file)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                  title="Remove from share"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Transfer Log / Activity */}
      {transferLogs.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Live Transfer Activity
          </h4>
          <div className="space-y-2">
            {transferLogs.slice(0, 3).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate text-slate-300">{log.fileName}</span>
                  <span className="text-[10px] text-slate-500">({formatBytes(log.fileSize)})</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-cyan-400 font-mono">{log.speed}</span>
                  <span className="text-[10px] text-slate-400">{log.device}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-400" />
              Scan with Mobile 2
            </h3>
            <p className="text-xs text-slate-400">
              Point your second phone&apos;s camera or Google Lens at this code to open Bubble immediately.
            </p>

            <div className="p-3 bg-white rounded-2xl inline-block shadow-inner">
              {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 mx-auto" />}
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-cyan-300 break-all">
              {browserUrl}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
