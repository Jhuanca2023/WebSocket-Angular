import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';

    // Using signals for reactive state management
    user = signal<any>(null);
    isAuthenticated = signal<boolean>(false);

    constructor(private http: HttpClient, private router: Router) {
        this.checkLocalStorage();
    }

    register(userData: any) {
        return this.http.post(`${this.apiUrl}/register`, userData);
    }

    login(credentials: any) {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => {
                localStorage.setItem('accessToken', res.accessToken);
                localStorage.setItem('refreshToken', res.refreshToken);
                localStorage.setItem('user', JSON.stringify(res.user));
                this.user.set(res.user);
                this.isAuthenticated.set(true);
            })
        );
    }

    logout() {
        localStorage.clear();
        this.user.set(null);
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
    }

    updateProfile(profileData: any) {
        const token = localStorage.getItem('accessToken');
        const headers = { Authorization: `Bearer ${token}` };
        return this.http.put(`${this.apiUrl}/update-profile`, profileData, { headers }).pipe(
            tap((res: any) => {
                localStorage.setItem('user', JSON.stringify(res.user));
                this.user.set(res.user);
            })
        );
    }

    private checkLocalStorage() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.user.set(JSON.parse(userStr));
            this.isAuthenticated.set(true);
        }
    }
}
