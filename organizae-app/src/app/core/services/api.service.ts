import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../../config/environment.token';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly http = inject(HttpClient);
  protected readonly env = inject(ENVIRONMENT);

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.http.get<T>(`${this.env.apiUrl}${path}`, { params });
  }

  getWithParams<T>(path: string, params: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.env.apiUrl}${path}`, { params });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.env.apiUrl}${path}`, body);
  }

  postForm<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.env.apiUrl}${path}`, formData);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.env.apiUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.env.apiUrl}${path}`);
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(`${this.env.apiUrl}${path}`, { responseType: 'blob' });
  }
}
