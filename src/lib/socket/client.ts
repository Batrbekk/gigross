import { io, Socket } from 'socket.io-client';

export interface SocketEvents {
  // Аукционные события
  bid_update: (data: {
    lotId: string;
    bidId: string;
    amount: number;
    currency: string;
    bidderId: string;
    bidderName: string;
    message?: string;
    previousPrice: number;
    newPrice: number;
    lotTitle: string;
    timeRemaining: number;
    timestamp: Date;
  }) => void;

  bid_placed: (data: {
    lotId: string;
    amount: number;
    bidderId: string;
    bidderName: string;
    message?: string;
    timestamp: Date;
  }) => void;

  lot_status_update: (data: {
    lotId: string;
    status: string;
    timestamp: Date;
  }) => void;

  auction_ended: (data: {
    lotId: string;
    winner?: {
      userId: string;
      name: string;
      amount: number;
    };
    timestamp: Date;
  }) => void;

  lot_info: (data: {
    lotId: string;
    message: string;
    timestamp: Date;
  }) => void;

  // Уведомления
  notification: (data: {
    type: string;
    title: string;
    message: string;
    data?: any;
    timestamp: Date;
  }) => void;

  // Ошибки
  bid_error: (data: {
    error: string;
  }) => void;

  // Системные события
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

export class SocketClient {
  private static instance: SocketClient;
  private socket: Socket | null = null;
  private accessToken: string | null = null;
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public connect(accessToken: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.accessToken = accessToken;

      this.socket = io({
        auth: {
          token: accessToken,
        },
        autoConnect: true,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Socket.io connected');
        this.reattachEventListeners();
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason);
      });

      // Автоматическое переподключение с новым токеном
      this.socket.on('disconnect', () => {
        if (this.accessToken) {
          setTimeout(() => {
            this.reconnect();
          }, 5000);
        }
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  public reconnect(): void {
    if (this.accessToken) {
      this.disconnect();
      this.connect(this.accessToken);
    }
  }

  // Методы для работы с аукционами
  public joinAuction(lotId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_auction', lotId);
    }
  }

  public leaveAuction(lotId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_auction', lotId);
    }
  }

  public placeBid(lotId: string, amount: number, message?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('place_bid', { lotId, amount, message });
    }
  }

  // Универсальные методы для событий
  public on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback as any);

    if (this.socket?.connected) {
      this.socket.on(event, callback as any);
    }
  }

  public off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    if (callback) {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback as any);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.delete(event);
    }

    if (this.socket?.connected) {
      if (callback) {
        this.socket.off(event, callback as any);
      } else {
        this.socket.off(event);
      }
    }
  }

  private reattachEventListeners(): void {
    if (!this.socket) return;

    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(callback => {
        this.socket!.on(event, callback as any);
      });
    });
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

// Хук для использования в React компонентах
export const useSocket = () => {
  return SocketClient.getInstance();
};
