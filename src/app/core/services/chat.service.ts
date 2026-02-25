import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private socket: Socket | null = null;
    private messageSubject = new Subject<any>();
    private memberSubject = new Subject<any[]>();
    messages$ = this.messageSubject.asObservable();
    members$ = this.memberSubject.asObservable();

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

        this.socket.on('connect_error', (err) => {
            console.error('❌ Error de conexión socket:', err.message);
        });

        this.socket.on('receive-message', (message: any) => {
            this.messageSubject.next(message);
        });

        this.socket.on('room-members', (members: any[]) => {
            this.memberSubject.next(members);
        });

        this.socket.on('error-msg', (msg: string) => {
            alert(msg);
        });

        this.socket.on('kicked', () => {
            alert('Has sido expulsado de la sala');
            window.location.href = '/rooms';
        });

        this.socket.on('disconnect', () => {
            this.connected.set(false);
            console.log('❌ Socket desconectado');
        });
    }

    joinRoom(roomId: string) {
        const sendJoin = () => {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            this.socket?.emit('join-room', {
                roomId,
                userName: user?.name || 'Usuario',
                userAvatar: user?.profileImage
            });
        };

        if (this.socket?.connected) {
            sendJoin();
        } else {
            this.socket?.once('connect', sendJoin);
        }
    }

    kickMember(roomId: string, socketId: string) {
        this.socket?.emit('kick-member', { roomId, targetSocketId: socketId });
    }

    sendMessage(roomId: string, content: string) {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        this.socket?.emit('send-message', {
            roomId,
            content,
            userAvatar: user?.profileImage
        });
    }

    disconnect() {
        this.socket?.disconnect();
    }
}
