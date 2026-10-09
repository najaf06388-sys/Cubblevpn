import { SharedFile } from '../types/bubble';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function getInitialFiles(): SharedFile[] {
  return [
    {
      id: 'file-1',
      name: 'IMG_20261009_Sunset_Beach.jpg',
      size: 4.2 * 1024 * 1024,
      type: 'image',
      mimeType: 'image/jpeg',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
      uploadedAt: Date.now() - 3600000 * 2,
      downloadCount: 3,
      folder: 'DCIM',
    },
    {
      id: 'file-2',
      name: 'VID_Family_Trip_4K.mp4',
      size: 28.5 * 1024 * 1024,
      type: 'video',
      mimeType: 'video/mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=300&q=80',
      uploadedAt: Date.now() - 3600000 * 5,
      downloadCount: 7,
      folder: 'Videos',
    },
    {
      id: 'file-3',
      name: 'DSC_00492_Mountain_View.jpg',
      size: 6.8 * 1024 * 1024,
      type: 'image',
      mimeType: 'image/jpeg',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80',
      uploadedAt: Date.now() - 3600000 * 8,
      downloadCount: 2,
      folder: 'Camera',
    },
    {
      id: 'file-4',
      name: 'Night_Drive_Acoustic.mp3',
      size: 5.4 * 1024 * 1024,
      type: 'audio',
      mimeType: 'audio/mpeg',
      url: 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg',
      thumbnailUrl: undefined,
      uploadedAt: Date.now() - 3600000 * 12,
      downloadCount: 1,
      folder: 'Music',
    },
    {
      id: 'file-5',
      name: 'Trip_Tickets_Reservation.pdf',
      size: 1.2 * 1024 * 1024,
      type: 'document',
      mimeType: 'application/pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      thumbnailUrl: undefined,
      uploadedAt: Date.now() - 3600000 * 18,
      downloadCount: 4,
      folder: 'Documents',
    },
    {
      id: 'file-6',
      name: 'VID_Drone_Coastline.mp4',
      size: 19.8 * 1024 * 1024,
      type: 'video',
      mimeType: 'video/mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
      uploadedAt: Date.now() - 3600000 * 24,
      downloadCount: 5,
      folder: 'Videos',
    },
  ];
}
