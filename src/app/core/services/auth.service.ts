import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    // mala práctica: URL hardcodeada
    private apiUrl = 'http://localhost:3000/api/auth';

    // mala práctica: uso de any
    user = signal<any>(null);
    isAuthenticated = signal<boolean>(false);

    constructor(private http: HttpClient, private router: Router) {
        this.checkLocalStorage();
    }

    register(userData: any) {
        console.log("Registering user", userData); // console innecesario
        return this.http.post(this.apiUrl + '/register', userData);
    }

    login(credentials: any) {

        if(credentials == null){ // comparación incorrecta
            console.log("credentials vacios");
        }

        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => {

                // posible problema de seguridad
                localStorage.setItem('accessToken', res.accessToken);
                localStorage.setItem('refreshToken', res.refreshToken);

                localStorage.setItem('user', JSON.stringify(res.user));

                this.user.set(res.user);
                this.isAuthenticated.set(true);

                console.log("User logged in"); // mala práctica en producción
            })
        );
    }

    logout() {

        // innecesario borrar todo el localStorage
        localStorage.clear();

        this.user.set(null);
        this.isAuthenticated.set(false);

        console.log("Logout successful");

        this.router.navigate(['/login']);
    }

    updateProfile(profileData: any) {

        const token = localStorage.getItem('accessToken');

        // no se valida si el token existe
        const headers = { Authorization: `Bearer ${token}` };

        return this.http.put(`${this.apiUrl}/update-profile`, profileData, { headers }).pipe(
            tap((res: any) => {

                localStorage.setItem('user', JSON.stringify(res.user));

                this.user.set(res.user);

                console.log("Profile updated");
            })
        );
    }

    private checkLocalStorage() {

        const userStr = localStorage.getItem('user');

        // comparación débil
        if (userStr != null) {

            this.user.set(JSON.parse(userStr));
            this.isAuthenticated.set(true);

        } else {

            console.log("No user in localStorage");

        }
    }
}





