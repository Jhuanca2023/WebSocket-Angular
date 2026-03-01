import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private socket: Socket | null = null;
    private messageSubject = new Subject<any>();
    private memberSubject = new BehaviorSubject<any[]>([]);
    messages$ = this.messageSubject.asObservable();
    members$ = this.memberSubject.asObservable();
    private currentRoomId: string | null = null;
    connected = signal<boolean>(false);
    connectionError = signal<string | null>(null);

    constructor(private router: Router) { }

    connect() {
        // Always create a fresh socket
        this.forceDisconnect();

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('⚠️ No hay token — redirigiendo al login');
            this.router.navigate(['/login']);
            return;
        }

        console.log('🔌 Intentando conectar socket...');

        this.socket = io('http://localhost:3000', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        let isFirstConnection = true;

        this.socket.on('connect', () => {
            this.connected.set(true);
            this.connectionError.set(null);
            console.log('✅ Socket conectado:', this.socket?.id, isFirstConnection ? '(primera vez)' : '(reconexión)');

            // Only auto-rejoin on RECONNECTIONS, not the first connection
            // First connection: joinRoom() handles it via once('connect')
            if (!isFirstConnection && this.currentRoomId) {
                console.log('🔄 Reconexión → re-enviando join-room para sala:', this.currentRoomId);
                this.sendJoinRoom(this.currentRoomId);
            }
            isFirstConnection = false;
        });

        this.socket.on('connect_error', (err) => {
            console.error('❌ Error socket:', err.message);
            this.connected.set(false);
            this.connectionError.set(err.message);

            // Auth error → redirect to login
            if (err.message.toLowerCase().includes('auth') ||
                err.message.toLowerCase().includes('token') ||
                err.message.toLowerCase().includes('invalid')) {
                console.warn('🔐 Token inválido/expirado → redirigiendo al login');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setTimeout(() => this.router.navigate(['/login']), 500);
            }
        });

        this.socket.on('receive-message', (message: any) => {
            this.messageSubject.next(message);
        });

        this.socket.on('room-members', (members: any[]) => {
            console.log('👥 Miembros recibidos:', members.length, members.map(m => m.name));
            this.memberSubject.next(members);
        });

        this.socket.on('error-msg', (msg: string) => {
            alert(msg);
        });

        this.socket.on('kicked', () => {
            alert('Has sido expulsado de la sala');
            this.router.navigate(['/rooms']);
        });

        this.socket.on('disconnect', (reason) => {
            this.connected.set(false);
            console.log('❌ Socket desconectado:', reason);
        });
    }

    private sendJoinRoom(roomId: string) {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        console.log('🏠 Enviando join-room →', roomId, '| usuario:', user?.name);
        this.socket?.emit('join-room', {
            roomId,
            userName: user?.name || 'Usuario',
            userAvatar: user?.profileImage
        });
    }

    joinRoom(roomId: string) {
        this.currentRoomId = roomId; // Store for auto-rejoin on reconnect

        if (this.socket?.connected) {
            this.sendJoinRoom(roomId);
        } else if (this.socket) {
            this.socket.once('connect', () => {
                console.log('🔗 Socket listo, enviando join-room...');
                this.sendJoinRoom(roomId);
            });
        } else {
            console.error('❌ Socket no inicializado. Llama a connect() primero.');
        }
    }

    kickMember(roomId: string, socketId: string) {
        this.socket?.emit('kick-member', { roomId, targetSocketId: socketId });
    }

    sendMessage(roomId: string, content: string) {
        if (!this.socket?.connected) {
            console.warn('⚠️ Socket desconectado. Reintentando conexión...');
            this.connect();
            return;
        }
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        console.log('✉️ Emitiendo send-message:', content, 'para sala:', roomId);
        this.socket.emit('send-message', {
            roomId,
            content,
            userAvatar: user?.profileImage
        });
    }

    private forceDisconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.connected.set(false);
        }
    }

    disconnect() {
        this.currentRoomId = null; // Clear room tracking
        this.forceDisconnect();
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}
