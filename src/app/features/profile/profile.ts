import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';

@Component({
    selector: 'app-profile-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css'
})
export class ProfileEditorComponent {
    public authService = inject(AuthService);
    public uiService = inject(UiService);

    selectedImage = signal<string | null>(null);

    // Editor state
    zoom = 1;
    rotation = 0;
    rotationX = 0;
    rotationY = 0;

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.selectedImage.set(e.target.result);
                this.resetAdjustment();
            };
            reader.readAsDataURL(file);
        }
    }

    resetAdjustment() {
        this.zoom = 1;
        this.rotation = 0;
        this.rotationX = 0;
        this.rotationY = 0;
    }

    rotateLeft() { this.rotation -= 90; }
    rotateRight() { this.rotation += 90; }
    flipH() { this.rotationY = this.rotationY === 0 ? 180 : 0; }
    flipV() { this.rotationX = this.rotationX === 0 ? 180 : 0; }

    get transformStyle() {
        return `rotate(${this.rotation}deg) scale(${this.zoom}) rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
    }

    open() {
        this.uiService.openProfileModal();
        const currentUser = this.authService.user();
        if (currentUser?.profileImage) {
            this.selectedImage.set(currentUser.profileImage);
        }
    }

    close() { this.uiService.closeProfileModal(); }

    save() {
        const profileImage = this.selectedImage();

        this.authService.updateProfile({ profileImage }).subscribe({
            next: () => {
                this.close();
            },
            error: (err) => {
                console.error('Error al guardar perfil:', err);
                alert('Hubo un error al guardar tu foto. Intenta de nuevo.');
            }
        });
    }
}
