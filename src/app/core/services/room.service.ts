import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class RoomService {
    private apiUrl = 'http://localhost:3000/api/rooms';

    constructor(private http: HttpClient) { }

    private getHeaders() {
        const token = localStorage.getItem('accessToken');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    getRooms() {
        return this.http.get(this.apiUrl, { headers: this.getHeaders() });
    }

    createRoom(roomData: any) {
        return this.http.post(this.apiUrl, roomData, { headers: this.getHeaders() });
    }

    getRoomById(id: string) {
        return this.http.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }
}
