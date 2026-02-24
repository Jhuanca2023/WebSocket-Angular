import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { RoomService } from '../../../core/services/room.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

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
  newMessage = '';
  currentUser = inject(AuthService).user;
  public authService = inject(AuthService);

  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  private roomService = inject(RoomService);

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';

    if (this.roomId) {
      this.loadRoomInfo();
      this.chatService.connect();
      this.chatService.joinRoom(this.roomId);

      this.chatService.messages$.subscribe((msg: any) => {
        if (msg.roomId === this.roomId) {
          this.messages.push(msg);
          this.scrollToBottom();
        }
      });
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
  }

  logout() {
    this.authService.logout();
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  ngOnDestroy() {
    this.chatService.disconnect();
  }
}
