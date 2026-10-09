import Peer, { DataConnection } from 'peerjs';
import { SharedFile, TransferLog } from '../types/bubble';

export type BubbleSyncEvent =
  | { type: 'peer_connected'; peerId: string; deviceName: string }
  | { type: 'peer_disconnected'; peerId: string }
  | { type: 'files_updated'; files: SharedFile[] }
  | { type: 'file_received'; file: SharedFile }
  | { type: 'transfer_progress'; log: TransferLog };

export class BubbleSyncService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: ((event: BubbleSyncEvent) => void)[] = [];
  public peerId: string = '';
  public isHost: boolean = false;
  private currentFiles: SharedFile[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('bubble_local_sync');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data, 'broadcast');
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }
  }

  public subscribe(callback: (event: BubbleSyncEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private emit(event: BubbleSyncEvent) {
    this.listeners.forEach((l) => l(event));
  }

  public initHost(roomCode: string, initialFiles: SharedFile[], onReady: (id: string) => void) {
    this.isHost = true;
    this.currentFiles = initialFiles;
    const cleanId = `bubble-${roomCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    try {
      this.peer = new Peer(cleanId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.peerId = id;
        onReady(id);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn, true);
      });

      this.peer.on('error', (err) => {
        console.warn('Peer error (host):', err);
        // Fallback ID if room is taken
        if (err.type === 'unavailable-id') {
          const fallback = `bubble-${roomCode}-${Math.random().toString(36).substring(2, 6)}`;
          this.peer = new Peer(fallback);
          this.peer.on('open', (id) => {
            this.peerId = id;
            onReady(id);
          });
          this.peer.on('connection', (conn) => this.setupConnection(conn, true));
        }
      });
    } catch (e) {
      console.error('Failed to init PeerJS host', e);
    }
  }

  public connectToHost(roomCode: string, deviceName: string, onConnected?: () => void) {
    this.isHost = false;
    const cleanId = `bubble-${roomCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    try {
      this.peer = new Peer({
        debug: 1,
      });

      this.peer.on('open', () => {
        if (!this.peer) return;
        const conn = this.peer.connect(cleanId, {
          metadata: { deviceName },
        });

        conn.on('open', () => {
          this.setupConnection(conn, false);
          conn.send({ type: 'GET_FILES', deviceName });
          if (onConnected) onConnected();
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Peer client connection error:', err);
      });
    } catch (e) {
      console.error('Failed to connect to Peer host', e);
    }
  }

  private setupConnection(conn: DataConnection, isIncoming: boolean) {
    this.connections.set(conn.peer, conn);

    conn.on('open', () => {
      const device = conn.metadata?.deviceName || (isIncoming ? 'Mobile 2 (Browser)' : 'Host Phone');
      this.emit({
        type: 'peer_connected',
        peerId: conn.peer,
        deviceName: device,
      });

      if (this.isHost) {
        // Send current file catalogue immediately
        conn.send({
          type: 'FILES_LIST',
          files: this.currentFiles.map((f) => ({
            ...f,
            blob: undefined, // don't send heavy blob in metadata index
          })),
        });
      }
    });

    conn.on('data', (data: any) => {
      this.handleIncomingMessage(data, conn.peer);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.emit({ type: 'peer_disconnected', peerId: conn.peer });
    });
  }

  private handleIncomingMessage(msg: any, senderId: string) {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'GET_FILES' && this.isHost) {
      this.broadcastMessage({
        type: 'FILES_LIST',
        files: this.currentFiles.map((f) => ({
          ...f,
          blob: undefined,
        })),
      });
    } else if (msg.type === 'FILES_LIST') {
      this.emit({ type: 'files_updated', files: msg.files });
    } else if (msg.type === 'UPLOAD_FILE') {
      const newFile: SharedFile = msg.file;
      this.currentFiles = [newFile, ...this.currentFiles];
      this.emit({ type: 'file_received', file: newFile });
      this.emit({ type: 'files_updated', files: this.currentFiles });
    }
  }

  public updateFiles(files: SharedFile[]) {
    this.currentFiles = files;
    this.broadcastMessage({
      type: 'FILES_LIST',
      files: files.map((f) => ({ ...f, blob: undefined })),
    });
  }

  public sendUploadedFile(file: SharedFile) {
    this.broadcastMessage({
      type: 'UPLOAD_FILE',
      file,
    });
  }

  private broadcastMessage(msg: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        // Ignore broadcast channel errors
      }
    }

    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  public destroy() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }
}

export const bubbleSync = new BubbleSyncService();
