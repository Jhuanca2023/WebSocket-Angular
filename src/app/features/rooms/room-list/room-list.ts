import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './room-list.html',
  styleUrl: './room-list.css'
})
export class RoomListComponent implements OnInit {
  rooms: any[] = [];
  loading = true;

  private roomService = inject(RoomService);
  private router = inject(Router);
  public authService = inject(AuthService);
  public uiService = inject(UiService);

  ngOnInit() {
    this.loadRooms();
  }

  logout() {
    this.authService.logout();
  }

  loadRooms() {
    this.roomService.getRooms().subscribe({
      next: (data: any) => {
        this.rooms = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  enterRoom(room: any) {
    this.router.navigate(['/chat', room._id]);
  }

  goToCreateRoom() {
    this.router.navigate(['/rooms/create']);
  }
}
