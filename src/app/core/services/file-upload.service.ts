import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    private uploadUrl = 'http://127.0.0.1:3000/api/upload';

    constructor(private http: HttpClient) { }

    upload(file: File): Observable<{ progress: number, fileUrl?: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('accessToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        return this.http.post(this.uploadUrl, formData, {
            reportProgress: true,
            observe: 'events',
            headers
        }).pipe(
            map(event => {
                switch (event.type) {
                    case HttpEventType.UploadProgress:
                        const progress = Math.round(100 * event.loaded / (event.total || 1));
                        return { progress };
                    case HttpEventType.Response:
                        return { progress: 100, fileUrl: (event.body as any).fileUrl };
                    default:
                        return { progress: 0 };
                }
            })
        );
    }
}
