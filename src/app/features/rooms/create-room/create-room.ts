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
    selectedFile: File | null = null;

    private roomService = inject(RoomService);
    private router = inject(Router);

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
    }

    async createRoom() {
        if (!this.roomName) return;

        this.loading = true;
        let imageUrl = null;

        if (this.selectedFile) {
            // Upload image first
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            try {
                const uploadResponse = await fetch('http://localhost:3000/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: formData
                });
                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    imageUrl = uploadData.url;
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                console.error('Error uploading image', error);
                alert('Error al subir la imagen');
                this.loading = false;
                return;
            }
        }

        const roomData = {
            name: this.roomName,
            description: this.description,
            isPrivate: this.isPrivate,
            imageUrl
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
