import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoomService } from '../../../core/services/room.service';

@Component({
    selector: 'app-create-room',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './create-room.html',
    styleUrl: './create-room.css'
})
export class CreateRoomComponent {
    roomName = '';
    description = '';
    isPrivate = false;
    loading = false;

    private roomService = inject(RoomService);
    private router = inject(Router);

    createRoom() {
        if (!this.roomName) return;

        this.loading = true;
        const roomData = {
            name: this.roomName,
            description: this.description,
            isPrivate: this.isPrivate
        };

        this.roomService.createRoom(roomData).subscribe({
            next: (res: any) => {
                this.router.navigate(['/chat', res._id]);
            },
            error: (err) => {
                console.error('Error creating room', err);
                this.loading = false;
                alert('Error al crear la sala. Verifica que el backend esté corriendo.');
            }
        });
    }

    goBack() {
        this.router.navigate(['/rooms']);
    }
}
