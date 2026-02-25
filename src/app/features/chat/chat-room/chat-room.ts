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
  roomId = '';
  room: any = null;
  messages: any[] = [];
  members: any[] = [];
  newMessage = '';
  currentUser = inject(AuthService).user;
  public authService = inject(AuthService);
  public uiService = inject(UiService);
  showInfo = true;

  // Permissions
  isHost = computed(() => {
    const user = this.currentUser();
    return user && this.room && this.room.hostId._id === user.id;
  });

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chatService = inject(ChatService);
  private roomService = inject(RoomService);
  private subs = new Subscription();

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';

    if (this.roomId) {
      this.loadRoomInfo();
      this.chatService.connect();

      this.subs.add(
        this.chatService.messages$.subscribe((msg: any) => {
          if (msg.roomId === this.roomId) {
            this.messages.push(msg);
            this.scrollToBottom();
          }
        })
      );

      this.subs.add(
        this.chatService.members$.subscribe((members: any[]) => {
          this.members = members;
        })
      );

      // Join room with full info delayed slightly to ensure socket is connected
      setTimeout(() => {
        this.chatService.joinRoom(this.roomId);
      }, 500);
    }
  }

  loadRoomInfo() {
    this.roomService.getRoomById(this.roomId).subscribe((room: any) => {
      this.room = room;
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.roomId, this.newMessage);
    this.newMessage = '';
    this.scrollToBottom();
  }

  // Management features
  deleteRoom() {
    if (confirm('¿Estás seguro de que quieres eliminar esta sala permanentemente?')) {
      this.roomService.deleteRoom(this.roomId).subscribe(() => {
        this.router.navigate(['/rooms']);
      });
    }
  }

  renameRoom() {
    const newName = prompt('Ingrese el nuevo nombre de la sala:', this.room.name);
    if (newName && newName.trim()) {
      this.roomService.updateRoom(this.roomId, { name: newName }).subscribe(() => {
        this.loadRoomInfo();
      });
    }
  }

  kickMember(member: any) {
    if (confirm(`¿Expulsar a ${member.name}?`)) {
      this.chatService.kickMember(this.roomId, member.socketId);
    }
  }

  copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    alert('URL de la sala copiada al portapapeles');
  }

  // Existing features
  startCall() {
    alert('Iniciando llamada premium con cifrado de punto a punto...');
  }

  toggleSearch() {
    const input = document.querySelector('.search-input') as HTMLInputElement;
    if (input) input.focus();
  }

  uploadFile() {
    alert('Abriendo selector de archivos premium...');
  }

  startRecording() {
    alert('Grabando audio de alta fidelidad...');
  }

  goDashboard() {
    this.router.navigate(['/rooms']);
  }

  toggleInfo() {
    this.showInfo = !this.showInfo;
  }

  logout() {
    this.authService.logout();
  }

  scrollToBottom() {
    setTimeout(() => {
      const viewport = document.querySelector('.messages-viewport');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, 100);
  }

  ngOnDestroy() {
    this.chatService.disconnect();
    this.subs.unsubscribe();
  }
}
