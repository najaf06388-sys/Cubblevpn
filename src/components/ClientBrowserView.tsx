import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Download,
  Search,
  Grid,
  List,
  Eye,
  CheckCircle,
  Upload,
  HardDrive,
  Play,
  Film,
  Music,
  FileText,
  Image as ImageIcon,
  Check,
  Archive,
  RefreshCw,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { FileCategory, SharedFile, NetworkConfig, TransferLog } from '../types/bubble';
import { formatBytes, formatDate } from '../utils/mockMedia';

interface ClientBrowserViewProps {
  config: NetworkConfig;
  files: SharedFile[];
  onPreviewFile: (file: SharedFile) => void;
  onUploadFromClient: (file: SharedFile) => void;
  onLogTransfer: (log: TransferLog) => void;
}

export const ClientBrowserView: React.FC<ClientBrowserViewProps> = ({
  config,
  files,
  onPreviewFile,
  onUploadFromClient,
  onLogTransfer,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filter files
  const filteredFiles = files.filter((f) => {
    const matchesCategory = selectedCategory === 'all' || f.type === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.folder.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f) => f.id));
    }
  };

  // Download a single file
  const handleDownloadSingle = async (file: SharedFile) => {
    try {
      const startTime = Date.now();
      onLogTransfer({
        id: `dl-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        direction: 'download',
        device: 'Mobile 2 (Browser)',
        timestamp: startTime,
        status: 'completed',
        progress: 100,
        speed: '18.4 MB/s',
      });

      // Trigger browser download
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download error', e);
    }
  };

  // Download batch as ZIP
  const handleDownloadZip = async () => {
    const targetFiles =
      selectedFileIds.length > 0
        ? files.filter((f) => selectedFileIds.includes(f.id))
        : files;
    if (targetFiles.length === 0) return;

    setIsZipping(true);
    setZipProgress(10);

    try {
      const zip = new JSZip();
      const folder = zip.folder('Bubble_Transfer') || zip;

      for (let i = 0; i < targetFiles.length; i++) {
        const file = targetFiles[i];
        setZipProgress(Math.round(((i + 1) / targetFiles.length) * 80));

        // If file has blob, use it, else fetch blob
        if (file.blob) {
          folder.file(file.name, file.blob);
        } else {
          try {
            const resp = await fetch(file.url);
            const blob = await resp.blob();
            folder.file(file.name, blob);
          } catch (err) {
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
      a.download = `Bubble_Files_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      onLogTransfer({
        id: `dl-zip-${Date.now()}`,
        fileName: `Bubble_Files_Archive (${targetFiles.length} files).zip`,
        fileSize: content.size,
        direction: 'download',
        device: 'Mobile 2 (Browser)',
        timestamp: Date.now(),
        status: 'completed',
        progress: 100,
        speed: '24.1 MB/s',
      });

      setSelectedFileIds([]);
    } catch (e) {
      console.error('ZIP generation error', e);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  // Client uploads photo/video to Host
  const handleClientUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedList = Array.from(e.target.files);

    uploadedList.forEach((file, idx) => {
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
      } else if (file.type.includes('pdf')) {
        cat = 'document';
        folder = 'Documents';
      }

      const objectUrl = URL.createObjectURL(file);
      const newFile: SharedFile = {
        id: `client-upload-${Date.now()}-${idx}`,
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

      onUploadFromClient(newFile);
      onLogTransfer({
        id: `ul-${Date.now()}-${idx}`,
        fileName: file.name,
        fileSize: file.size,
        direction: 'upload',
        device: 'Mobile 2 -> Host Mobile',
        timestamp: Date.now(),
        status: 'completed',
        progress: 100,
        speed: '16.8 MB/s',
      });
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Mobile 2 Browser Top Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white">
                Connected to {config.deviceModel}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                WiFi LAN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Host IP: <span className="font-mono text-cyan-300">{config.ipAddress}</span> • Device:{' '}
              <span className="text-slate-300">Zong EVO / Local Hotspot</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleClientUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition active:scale-95 shadow-sm"
              title="Upload photos or videos from Mobile 2 into Mobile 1"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Send Files to Host</span>
            </button>

            {/* BIG PROMINENT DOWNLOAD ZIP BUTTON */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping || files.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50"
              title="Download files as ZIP archive directly to your mobile"
            >
              {isZipping ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              <span>
                {isZipping
                  ? `Zipping ${zipProgress}%...`
                  : selectedFileIds.length > 0
                  ? `⬇️ Download (${selectedFileIds.length}) ZIP`
                  : `⬇️ Download All (${files.length}) ZIP`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Download Help Banner */}
      <div className="rounded-2xl bg-indigo-950/40 border border-indigo-500/30 p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">How to download to your phone: </span>
            <span className="text-slate-300">
              Tap the green <strong className="text-emerald-400">[Save]</strong> button on any file, or tap the big <strong className="text-indigo-300">[Download All ZIP]</strong> button to save all photos &amp; videos into your phone&apos;s Downloads folder!
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Files', icon: HardDrive },
              { id: 'image', label: 'Photos (DCIM)', icon: ImageIcon },
              { id: 'video', label: 'Videos', icon: Film },
              { id: 'audio', label: 'Audio', icon: Music },
              { id: 'document', label: 'Documents', icon: FileText },
            ] as const
          ).map((cat) => {
            const Icon = cat.icon;
            const count =
              cat.id === 'all' ? files.length : files.filter((f) => f.type === cat.id).length;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & View Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Select All & Summary Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 hover:text-slate-200 transition"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                selectedFileIds.length > 0 && selectedFileIds.length === filteredFiles.length
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'border-slate-600 bg-slate-800'
              }`}
            >
              {selectedFileIds.length > 0 && <Check className="w-3 h-3" />}
            </div>
            <span>
              {selectedFileIds.length === filteredFiles.length
                ? 'Deselect All'
                : `Select All (${filteredFiles.length})`}
            </span>
          </button>
          {selectedFileIds.length > 0 && (
            <span className="text-indigo-400 font-medium">({selectedFileIds.length} selected)</span>
          )}
        </div>

        <div>Showing {filteredFiles.length} items</div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-3">
          <HardDrive className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">No files found</h4>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Add photos or videos on Mobile 1 to see them here.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredFiles.map((file) => {
            const isSelected = selectedFileIds.includes(file.id);

            return (
              <div
                key={file.id}
                className={`group relative rounded-2xl bg-slate-900 border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => onPreviewFile(file)}
                  className="relative aspect-video sm:aspect-square bg-slate-950 flex items-center justify-center cursor-pointer overflow-hidden"
                >
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-500">
                      {file.type === 'video' ? (
                        <Film className="w-8 h-8 text-purple-400" />
                      ) : file.type === 'audio' ? (
                        <Music className="w-8 h-8 text-amber-400" />
                      ) : file.type === 'document' ? (
                        <FileText className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-sky-400" />
                      )}
                    </div>
                  )}

                  {/* Play icon overlay for videos */}
                  {file.type === 'video' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Select Checkbox (top-left) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectFile(file.id);
                    }}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-lg flex items-center justify-center shadow-md transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white ring-2 ring-white/30'
                        : 'bg-black/60 text-transparent hover:text-white/60 border border-white/20'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  {/* Type badge */}
                  <span className="absolute bottom-2 right-2 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/70 text-slate-200 backdrop-blur-xs">
                    {file.type}
                  </span>
                </div>

                {/* File Details & Download button */}
                <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h5
                      title={file.name}
                      onClick={() => onPreviewFile(file)}
                      className="text-xs font-semibold text-slate-200 truncate cursor-pointer hover:text-cyan-300 transition"
                    >
                      {file.name}
                    </h5>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>{formatBytes(file.size)}</span>
                      <span className="text-indigo-400">{file.folder}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => onPreviewFile(file)}
                      className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleDownloadSingle(file)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition active:scale-95"
                      title="Download file to this device"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
          {filteredFiles.map((file) => {
            const isSelected = selectedFileIds.includes(file.id);

            return (
              <div
                key={file.id}
                className={`p-3 sm:p-4 flex items-center justify-between gap-3 transition ${
                  isSelected ? 'bg-indigo-950/30' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleSelectFile(file.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div
                    onClick={() => onPreviewFile(file)}
                    className="relative w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer group"
                  >
                    {file.thumbnailUrl ? (
                      <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                    ) : file.type === 'video' ? (
                      <Film className="w-5 h-5 text-purple-400" />
                    ) : file.type === 'audio' ? (
                      <Music className="w-5 h-5 text-amber-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      onClick={() => onPreviewFile(file)}
                      className="text-xs sm:text-sm font-semibold text-slate-200 truncate cursor-pointer hover:text-cyan-300 transition"
                    >
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span className="text-indigo-400">{file.folder}</span>
                      <span>•</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onPreviewFile(file)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadSingle(file)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
