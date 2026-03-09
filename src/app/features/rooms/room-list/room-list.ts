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
  currentPage = 1;
  pageSize = 6; // Show 6 rooms per page
  paginatedRooms: any[] = [];
  totalPages = 1;

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
        this.rooms = data.filter((room: any) => !room.parentRoomId);
        this.totalPages = Math.ceil(this.rooms.length / this.pageSize);
        this.updatePaginatedRooms();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  updatePaginatedRooms() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRooms = this.rooms.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedRooms();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedRooms();
    }
  }

  enterRoom(room: any) {
    this.router.navigate(['/chat', room._id]);
  }

  goToCreateRoom() {
    this.router.navigate(['/rooms/create']);
  }
}
