import React from 'react';
import { X, Wifi, Radio, Server, Shield, ExternalLink, RefreshCw } from 'lucide-react';
import { NetworkConfig } from '../types/bubble';

interface RouterConfigModalProps {
  config: NetworkConfig;
  setConfig: React.Dispatch<React.SetStateAction<NetworkConfig>>;
  onClose: () => void;
}

export const RouterConfigModal: React.FC<RouterConfigModalProps> = ({
  config,
  setConfig,
  onClose,
}) => {
  const [localConfig, setLocalConfig] = React.useState<NetworkConfig>({ ...config });

  const handleApplyPreset = (preset: 'zong_evo' | 'home_0' | 'home_1') => {
    if (preset === 'zong_evo') {
      setLocalConfig((prev) => ({
        ...prev,
        networkType: 'zong_evo',
        ssid: 'Zong 4G Evo Hotspot',
        gateway: '192.168.8.1',
        ipAddress: '192.168.8.105',
        port: 2221,
      }));
    } else if (preset === 'home_0') {
      setLocalConfig((prev) => ({
        ...prev,
        networkType: 'home_router',
        ssid: 'Home WiFi Router',
        gateway: '192.168.0.1',
        ipAddress: '192.168.0.102',
        port: 2221,
      }));
    } else if (preset === 'home_1') {
      setLocalConfig((prev) => ({
        ...prev,
        networkType: 'home_router',
        ssid: 'TP-Link / Tenda WiFi',
        gateway: '192.168.1.1',
        ipAddress: '192.168.1.100',
        port: 2221,
      }));
    }
  };

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">WiFi &amp; Router Settings</h3>
              <p className="text-xs text-slate-400">Configure Zong EVO, router IP, and FTP port</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Quick Network Presets</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleApplyPreset('zong_evo')}
              className={`p-3 rounded-xl border text-left transition ${
                localConfig.networkType === 'zong_evo'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold">Zong EVO 4G</div>
              <div className="text-[10px] text-slate-400">192.168.8.x</div>
            </button>

            <button
              onClick={() => handleApplyPreset('home_0')}
              className={`p-3 rounded-xl border text-left transition ${
                localConfig.gateway === '192.168.0.1'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold">Router 0.1</div>
              <div className="text-[10px] text-slate-400">192.168.0.x</div>
            </button>

            <button
              onClick={() => handleApplyPreset('home_1')}
              className={`p-3 rounded-xl border text-left transition ${
                localConfig.gateway === '192.168.1.1'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold">Router 1.1</div>
              <div className="text-[10px] text-slate-400">192.168.1.x</div>
            </button>
          </div>
        </div>

        {/* Input Details */}
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Host Mobile Model Name
            </label>
            <input
              type="text"
              value={localConfig.deviceModel}
              onChange={(e) => setLocalConfig({ ...localConfig, deviceModel: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Samsung Galaxy, Xiaomi, Vivo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Local IP Address
              </label>
              <input
                type="text"
                value={localConfig.ipAddress}
                onChange={(e) => setLocalConfig({ ...localConfig, ipAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Router Gateway IP
              </label>
              <input
                type="text"
                value={localConfig.gateway}
                onChange={(e) => setLocalConfig({ ...localConfig, gateway: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                FTP Port (Default 2221)
              </label>
              <input
                type="number"
                value={localConfig.port}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, port: parseInt(e.target.value) || 2221 })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Room Sync Code
              </label>
              <input
                type="text"
                value={localConfig.roomCode}
                onChange={(e) => setLocalConfig({ ...localConfig, roomCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Zong EVO Admin Shortcut */}
        {localConfig.gateway === '192.168.8.1' && (
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs">
            <span className="text-slate-300">Open Zong EVO Web Admin</span>
            <a
              href="http://192.168.8.1"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono font-medium"
            >
              <span>192.168.8.1</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
