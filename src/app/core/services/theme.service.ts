import { Injectable, signal, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    darkMode = signal<boolean>(localStorage.getItem('theme') !== 'light');

    constructor() {
        effect(() => {
            const mode = this.darkMode() ? 'dark' : 'light';
            localStorage.setItem('theme', mode);
            if (this.darkMode()) {
                document.body.classList.remove('light-mode');
            } else {
                document.body.classList.add('light-mode');
            }
        });
    }

    toggleTheme() {
        this.darkMode.update(v => !v);
    }
}
