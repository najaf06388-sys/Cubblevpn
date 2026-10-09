import React from 'react';
import { X, Download, Film, Music, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { SharedFile } from '../types/bubble';
import { formatBytes, formatDate } from '../utils/mockMedia';

interface FilePreviewModalProps {
  file: SharedFile | null;
  onClose: () => void;
  onDownload: (file: SharedFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{file.name}</h4>
            <p className="text-xs text-slate-400">
              {formatBytes(file.size)} • {file.folder} • {formatDate(file.uploadedAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Stage */}
        <div className="flex-1 bg-black flex items-center justify-center p-2 sm:p-4 overflow-auto min-h-[300px]">
          {file.type === 'image' ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : file.type === 'video' ? (
            <div className="w-full max-w-2xl">
              <video
                src={file.url}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[65vh] rounded-xl shadow-2xl bg-black"
              />
            </div>
          ) : file.type === 'audio' ? (
            <div className="w-full max-w-md p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center shadow-inner">
                <Music className="w-8 h-8" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white">{file.name}</h5>
                <p className="text-xs text-slate-400 mt-1">{formatBytes(file.size)}</p>
              </div>
              <audio src={file.url} controls className="w-full mt-2" />
            </div>
          ) : (
            <div className="w-full max-w-md p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white">{file.name}</h5>
                <p className="text-xs text-slate-400 mt-1">
                  MIME: {file.mimeType} • Size: {formatBytes(file.size)}
                </p>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <span>Open Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
