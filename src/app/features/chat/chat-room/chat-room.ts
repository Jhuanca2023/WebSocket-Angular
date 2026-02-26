import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { RoomService } from '../../../core/services/room.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UiService } from '../../../core/services/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.html',
  styleUrl: './chat-room.css'
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  public uiService = inject(UiService);
  public authService = inject(AuthService);
  currentUser = inject(AuthService).user;

  roomId = '';
  room = signal<any>(null);
  messages: any[] = [];
  members: any[] = [];
  newMessage = '';
  showInfo = true;

  // Host check - compare IDs as strings robustly
  isHost = computed(() => {
    const user = this.currentUser();
    const room = this.room();
    if (!user || !room) return false;
    const hostId = room.hostId?._id || room.hostId;
    const isHost = String(hostId) === String(user.id);
    console.log(`🔍 [CheckHost] Host: ${hostId} | Me: ${user.id} | Result: ${isHost}`);
    return isHost;
  });

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public chatService = inject(ChatService);
  private roomService = inject(RoomService);
  private subs = new Subscription();

  checkIsHost(memberId: string): boolean {
    const room = this.room();
    if (!room) return false;
    const hostId = room.hostId?._id || room.hostId;
    return String(hostId) === String(memberId);
  }

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.roomId) return;

    this.loadRoomInfo();

    // Connect socket fresh for this user
    this.chatService.connect();

    // Subscribe to incoming messages
    this.subs.add(
      this.chatService.messages$.subscribe((msg: any) => {
        if (msg.roomId === this.roomId) {
          this.messages.push(msg);
          this.scrollToBottom();
        }
      })
    );

    // Subscribe to member list updates
    this.subs.add(
      this.chatService.members$.subscribe((members: any[]) => {
        this.members = members;
      })
    );

    // Join the room (waits for connection internally)
    this.chatService.joinRoom(this.roomId);
  }

  loadRoomInfo() {
    this.roomService.getRoomById(this.roomId).subscribe({
      next: (room: any) => {
        this.room.set(room);
        console.log('🏠 Sala cargada:', room.name, '| hostId:', room.hostId?._id || room.hostId);
      },
      error: (err) => {
        console.error('Error al cargar sala:', err);
        if (err.status === 404) {
          alert('Esta sala no existe o fue eliminada.');
          this.router.navigate(['/rooms']);
        }
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.roomId, this.newMessage.trim());
    this.newMessage = '';
  }

  deleteRoom() {
    if (!this.isHost()) return;
    if (confirm('¿Eliminar esta sala permanentemente?')) {
      this.roomService.deleteRoom(this.roomId).subscribe({
        next: () => this.router.navigate(['/rooms']),
        error: (err) => alert('Error al eliminar: ' + err.error?.message)
      });
    }
  }

  renameRoom() {
    if (!this.isHost()) return;
    const newName = prompt('Nuevo nombre de la sala:', this.room()?.name);
    if (newName?.trim()) {
      this.roomService.updateRoom(this.roomId, { name: newName.trim() }).subscribe({
        next: () => this.loadRoomInfo(),
        error: (err) => alert('Error al renombrar: ' + err.error?.message)
      });
    }
  }

  kickMember(member: any) {
    if (!this.isHost()) return;
    if (confirm(`¿Expulsar a ${member.name}?`)) {
      this.chatService.kickMember(this.roomId, member.socketId);
    }
  }

  copyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('✅ URL copiada al portapapeles');
    });
  }

  startCall() { alert('Llamada premium próximamente...'); }
  uploadFile() { alert('Selector de archivos próximamente...'); }
  startRecording() { alert('Grabación de audio próximamente...'); }

  toggleSearch() {
    const input = document.querySelector('.search-input') as HTMLInputElement;
    if (input) input.focus();
  }

  toggleInfo() {
    this.showInfo = !this.showInfo;
  }

  goDashboard() {
    this.router.navigate(['/rooms']);
  }

  logout() {
    this.authService.logout();
  }

  scrollToBottom() {
    setTimeout(() => {
      const viewport = document.querySelector('.messages-viewport');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, 80);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.chatService.disconnect();
  }
}
