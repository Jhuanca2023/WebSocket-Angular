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
import { FileUploadService } from '../../../core/services/file-upload.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerModule],
  templateUrl: './chat-room.html',
  styleUrl: './chat-room.css'
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  public uiService = inject(UiService);
  public authService = inject(AuthService);
  currentUser = inject(AuthService).user;

  roomId = '';
  room = signal<any>(null);          // sala actual (principal o sub-sala)
  rootRoom = signal<any>(null);      // sala principal (para sidebar tipo Discord)
  messages: any[] = [];
  members: any[] = [];
  newMessage = '';
  showInfo = true;
  activeMemberMenu: string | null = null;
  activeMessageMenu: string | null = null; // WhatsApp style context menu
  privateRecipient: any | null = null; // For private messaging
  isSharingScreen = false;
  selectedMember: any | null = null;
  showEmojiPicker = false;
  reactionTargetMessage: any | null = null;
  isRecording = false;
  recordingDuration = 0;
  showScrollDown = false;
  private recorderTimer: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

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
  public router = inject(Router);
  public chatService = inject(ChatService);
  private roomService = inject(RoomService);
  private uploadService = inject(FileUploadService);
  private subs = new Subscription();
  private routeSub?: Subscription;

  checkIsHost(memberId: string): boolean {
    const room = this.room();
    if (!room) return false;
    const hostId = room.hostId?._id || room.hostId;
    return String(hostId) === String(memberId);
  }

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      this.initRoom(id);
    });
  }

  loadRoomInfo() {
    this.roomService.getRoomById(this.roomId).subscribe({
      next: (room: any) => {
        this.room.set(room);
        console.log('🏠 Sala cargada:', room.name, '| hostId:', room.hostId?._id || room.hostId);

        const parentId = room.parentRoomId || room._id || room.id;
        if (room.parentRoomId) {
          // Estamos en una sub-sala → cargar sala principal para el sidebar
          this.roomService.getRoomById(room.parentRoomId).subscribe({
            next: (parent: any) => {
              this.rootRoom.set(parent);
              this.loadSubGroups(parent._id || parent.id);
            },
            error: () => {
              this.rootRoom.set(room);
              this.loadSubGroups(parentId);
            }
          });
        } else {
          // Sala principal
          this.rootRoom.set(room);
          this.loadSubGroups(parentId);
        }
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

  loadMessageHistory() {
    this.roomService.getRoomMessages(this.roomId).subscribe({
      next: (data: any) => {
        this.messages = Array.isArray(data) ? data : [];
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Error al cargar mensajes:', err);
      }
    });
  }

  appendMessage(msg: any) {
    const msgId = msg?._id || msg?.id;
    if (msgId && this.messages.some(m => (m._id || m.id) === msgId)) return;
    this.messages.push(msg);
  }

  private initRoom(id: string) {
    if (this.roomId === id) return;

    // Cleanup previous socket subscriptions
    this.subs.unsubscribe();
    this.subs = new Subscription();

    this.roomId = id;
    this.room.set(null);
    this.rootRoom.set(null);
    this.messages = [];
    this.members = [];
    this.selectedMember = null;
    this.privateRecipient = null;

    this.loadRoomInfo();
    this.loadMessageHistory();

    // Fresh socket connection and subscriptions for this room
    this.chatService.connect();

    this.subs.add(
      this.chatService.messages$.subscribe((msg: any) => {
        if (msg.roomId === this.roomId) {
          this.appendMessage(msg);
          this.scrollToBottomInternal(false);
        }
      })
    );

    this.subs.add(
      this.chatService.members$.subscribe((members: any[]) => {
        this.members = members;
      })
    );

    this.subs.add(
      this.chatService.reactions$.subscribe((reaction: any) => {
        const msg = this.messages.find(m => (m._id || m.id) === reaction.messageId);
        if (msg) {
          if (!msg.reactions) msg.reactions = [];
          msg.reactions.push({ userId: reaction.userId, emoji: reaction.emoji });
        }
      })
    );

    this.chatService.joinRoom(this.roomId);
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const recipientId = this.privateRecipient ? this.privateRecipient.userId : null;
    this.chatService.sendMessage(this.roomId, this.newMessage.trim(), recipientId);

    this.newMessage = '';
    if (this.privateRecipient) {
      // Option: keep private mode or reset
      // this.privateRecipient = null; 
    }
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

  toggleMemberMenu(member: any) {
    if (this.activeMemberMenu === member.userId) {
      this.activeMemberMenu = null;
    } else {
      this.activeMemberMenu = member.userId;
    }
  }

  kickMember(member: any) {
    if (!this.isHost()) return;
    if (confirm(`¿Expulsar a ${member.name}?`)) {
      this.chatService.kickMember(this.roomId, member.socketId);
      this.activeMemberMenu = null;
    }
  }

  muteMember(member: any) {
    alert(`Silenciando a ${member.name}...`);
    this.activeMemberMenu = null;
    // TODO: Implement socket event for mute
  }

  promoteToMod(member: any) {
    alert(`Asignando moderador a ${member.name}...`);
    this.activeMemberMenu = null;
    // TODO: Implement socket event for promotion
  }

  screenStream: MediaStream | null = null;
  async shareScreen() {
    try {
      this.screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      this.isSharingScreen = true;

      await this.captureAndSendScreenPreview();

      const track = this.screenStream?.getVideoTracks()[0];
      if (track) {
        track.onended = () => this.stopScreenShare();
      }
    } catch (err) {
      console.error('Error al compartir pantalla:', err);
    }
  }

  stopScreenShare() {
    this.screenStream?.getTracks().forEach(track => track.stop());
    this.screenStream = null;
    this.isSharingScreen = false;
  }

  openEmojiPicker(targetMsg?: any) {
    if (this.showEmojiPicker && this.reactionTargetMessage === (targetMsg || null)) {
      this.showEmojiPicker = false;
      this.reactionTargetMessage = null;
      return;
    }
    this.reactionTargetMessage = targetMsg || null;
    this.showEmojiPicker = true;
    this.activeMessageMenu = null;
  }

  onEmojiSelected(event: any) {
    const emoji = event?.emoji?.native || event?.emoji?.emoji || event?.emoji || '';
    if (!emoji) return;
    if (this.reactionTargetMessage) {
      this.addReaction(this.reactionTargetMessage, emoji);
    } else {
      this.newMessage = `${this.newMessage}${emoji}`;
    }
    this.showEmojiPicker = false;
    this.reactionTargetMessage = null;
  }

  copyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('✅ URL copiada al portapapeles');
    });
  }

  startCall() {
    this.chatService.sendMessage(this.roomId, 'Iniciando llamada premium...', null, 'TEXT');
    alert('Llamada premium próximamente... (Señal de llamada enviada)');
  }

  uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.uiService.showLoading();
        this.uploadService.upload(file).subscribe({
          next: (res) => {
            if (res.fileUrl) {
              this.chatService.sendMessage(this.roomId, `📄 ${file.name}`, null, 'FILE', res.fileUrl);
              this.uiService.hideLoading();
            }
          },
          error: (err) => {
            alert('Error al subir archivo');
            this.uiService.hideLoading();
          }
        });
      }
    };
    input.click();
  }

  startRecording() {
    if (this.isRecording) {
      this.stopRecording();
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };
      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        this.uploadAudio();
      };
      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingDuration = 0;
      this.recorderTimer = setInterval(() => this.recordingDuration += 1, 1000);
    }).catch((err) => {
      console.error('Error al iniciar grabación:', err);
      alert('No se pudo iniciar la grabación de audio.');
    });
  }

  stopRecording() {
    if (!this.mediaRecorder) return;
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.isRecording = false;
    if (this.recorderTimer) clearInterval(this.recorderTimer);
  }

  uploadAudio() {
    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    if (!blob.size) return;
    const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
    const recipientId = this.privateRecipient ? this.privateRecipient.userId : null;

    this.uiService.showLoading();
    this.uploadService.upload(file).subscribe({
      next: (res) => {
        if (res.fileUrl) {
          this.chatService.sendMessage(this.roomId, 'Audio', recipientId, 'AUDIO', res.fileUrl);
        }
        if (res.progress === 100) {
          this.uiService.hideLoading();
        }
      },
      error: () => {
        this.uiService.hideLoading();
        alert('Error al subir audio');
      }
    });
  }

  toggleMessageMenu(msgId: string) {
    this.activeMessageMenu = this.activeMessageMenu === msgId ? null : msgId;
  }

  addReaction(msg: any, emoji: string) {
    this.chatService.sendReaction(this.roomId, msg._id || msg.id, emoji);
    this.activeMessageMenu = null;
  }

  selectPrivateRecipient(member: any) {
    this.privateRecipient = member;
    this.activeMemberMenu = null;
    alert(`Mensajería privada activada para ${member.name}`);
  }

  viewMember(member: any) {
    this.selectedMember = member;
    if (!this.showInfo) this.showInfo = true;
  }

  createSubGroup() {
    const name = prompt('Nombre del nuevo sub-grupo (ej: Backend, Frontend):');
    if (name?.trim()) {
      this.roomService.createRoom({
        name: name.trim(),
        parentRoomId: this.roomId,
        hostId: (this.currentUser() as any).id
      }).subscribe({
        next: (subRoom: any) => {
          alert(`Sub-grupo "${subRoom.name}" creado con éxito.`);
          const parentId = this.rootRoom()?.id || this.rootRoom()?._id || this.roomId;
          if (parentId) {
            this.loadSubGroups(parentId);
          }
        },
        error: (err) => alert('Error al crear sub-grupo: ' + err.error?.message)
      });
    }
  }

  subGroups: any[] = [];
  loadSubGroups(parentId: string) {
    this.roomService.getRooms().subscribe((rooms: any[]) => {
      this.subGroups = rooms.filter(r => String(r.parentRoomId) === String(parentId));
    });
  }

  moveToSubGroup(memberUserId: string, subRoomId: string) {
    if (!this.isHost()) return;

    // Authorization logic: Update room in backend to include user in authorizedUsers
    const subRoom = this.subGroups.find(r => r._id === subRoomId || r.id === subRoomId);
    if (!subRoom) return;

    const authorized = subRoom.authorizedUsers || [];
    if (!authorized.includes(memberUserId)) {
      authorized.push(memberUserId);
      this.roomService.updateRoom(subRoomId, { authorizedUsers: authorized }).subscribe({
        next: () => {
          alert('Usuario autorizado para entrar a la sub-sala');
          const parentId = this.rootRoom()?.id || this.rootRoom()?._id || this.roomId;
          if (parentId) {
            this.loadSubGroups(parentId);
          }
        },
        error: (err) => alert('Error al autorizar: ' + err.error?.message)
      });
    } else {
      alert('El usuario ya tiene permisos para esta sala.');
    }
  }

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
    this.scrollToBottomInternal(true);
  }

  isImageUrl(url?: string) {
    if (!url) return false;
    return /\.(png|jpe?g|gif|webp)$/i.test(url.split('?')[0]);
  }

  private async captureAndSendScreenPreview() {
    if (!this.screenStream) return;
    const track = this.screenStream.getVideoTracks()[0];
    const imageCapture: any = new (window as any).ImageCapture(track);
    try {
      const bitmap = await imageCapture.grabFrame();
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
      if (!blob) return;
      const file = new File([blob], `screen-${Date.now()}.jpg`, { type: 'image/jpeg' });
      this.uiService.showLoading();
      this.uploadService.upload(file).subscribe({
        next: (res) => {
          if (res.fileUrl) {
            this.chatService.sendMessage(this.roomId, 'Pantalla compartida', null, 'SCREEN_SHARE', res.fileUrl);
          }
          if (res.progress === 100) {
            this.uiService.hideLoading();
          }
        },
        error: () => {
          this.uiService.hideLoading();
          alert('Error al subir vista previa de pantalla');
        }
      });
    } catch (err) {
      console.error('Error al capturar pantalla:', err);
    }
  }

  onMessagesScroll(event: Event) {
    const el = event.target as HTMLElement;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.showScrollDown = distanceFromBottom > 200;
  }

  private scrollToBottomInternal(smooth: boolean) {
    setTimeout(() => {
      const viewport = document.querySelector('.messages-viewport');
      if (!viewport) return;
      if (smooth) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      } else {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 80);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    this.chatService.disconnect();
  }
}
