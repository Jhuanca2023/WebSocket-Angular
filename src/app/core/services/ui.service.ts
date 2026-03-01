import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    profileModalOpen = signal(false);

    openProfileModal() {
        this.profileModalOpen.set(true);
    }

    closeProfileModal() {
        this.profileModalOpen.set(false);
    }
}
