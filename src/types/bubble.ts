export type FileCategory = 'all' | 'image' | 'video' | 'audio' | 'document' | 'other';

export interface SharedFile {
  id: string;
  name: string;
  size: number; // in bytes
  type: FileCategory;
  mimeType: string;
  url: string; // Blob URL, Data URL, or Remote URL
  thumbnailUrl?: string;
  uploadedAt: number;
  downloadCount: number;
  folder: 'DCIM' | 'Camera' | 'Videos' | 'Music' | 'Documents' | 'Downloads';
  blob?: Blob;
}

export interface NetworkConfig {
  ssid: string;
  ipAddress: string;
  port: number;
  webPort: number;
  gateway: string;
  isServerRunning: boolean;
  anonymousLogin: boolean;
  username: string;
  password: string;
  readOnly: boolean;
  deviceModel: string;
  roomCode: string;
  networkType: 'zong_evo' | 'home_router' | 'mobile_hotspot' | 'custom';
}

export interface TransferLog {
  id: string;
  fileName: string;
  fileSize: number;
  direction: 'upload' | 'download';
  device: string;
  timestamp: number;
  status: 'completed' | 'transferring' | 'failed';
  progress: number;
  speed: string;
}

export interface ConnectedPeer {
  id: string;
  name: string;
  ip: string;
  connectedAt: number;
  lastActive: number;
}
