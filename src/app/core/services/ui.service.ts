import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    profileModalOpen = signal(false);
    loading = signal(false);

    showLoading() { this.loading.set(true); }
    hideLoading() { this.loading.set(false); }

    openProfileModal() {
        this.profileModalOpen.set(true);
    }

    closeProfileModal() {
        this.profileModalOpen.set(false);
    }
}
