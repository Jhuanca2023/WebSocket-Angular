import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private socket: Socket | null = null;
    private messageSubject = new Subject<any>();
    messages$ = this.messageSubject.asObservable();

    connected = signal<boolean>(false);

    constructor() { }

    connect() {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        this.socket = io('http://localhost:3000', {
            auth: { token }
        });

        this.socket.on('connect', () => {
            this.connected.set(true);
            console.log('✅ Socket conectado');
        });

        this.socket.on('receive-message', (message: any) => {
            this.messageSubject.next(message);
        });

        this.socket.on('disconnect', () => {
            this.connected.set(false);
            console.log('❌ Socket desconectado');
        });
    }

    joinRoom(roomId: string) {
        this.socket?.emit('join-room', roomId);
    }

    sendMessage(roomId: string, content: string) {
        this.socket?.emit('send-message', { roomId, content });
    }

    disconnect() {
        this.socket?.disconnect();
    }
}
