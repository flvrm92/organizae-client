import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ILoginResponse } from '../../../types/ILoginResponse';
import { ENVIRONMENT } from '../../config/environment.token';

const TOKEN_KEY = 'organizae_token';
const EXPIRES_KEY = 'organizae_expires';
const ORG_KEY = 'organizae_org_id';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly env = inject(ENVIRONMENT);

  login(email: string, password: string): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(`${this.env.apiUrl}/api/Auth/login`, { email, password }).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(EXPIRES_KEY, res.expiresAtUtc);
          const orgId = this.extractOrganizationId(res.token);
          if (orgId) localStorage.setItem(ORG_KEY, orgId);
        }
      })
    );
  }

  changePassword(email: string, currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.env.apiUrl}/api/Auth/change-password`, {
      email, currentPassword, newPassword
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    localStorage.removeItem(ORG_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getOrganizationId(): string {
    return localStorage.getItem(ORG_KEY) ?? '';
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const expires = localStorage.getItem(EXPIRES_KEY);
    if (!expires) return false;
    return new Date(expires) > new Date();
  }

  private extractOrganizationId(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded['organizationId'] ?? decoded['org_id'] ?? decoded['organization_id'] ?? null;
    } catch {
      return null;
    }
  }
}
