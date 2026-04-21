import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { IOrganizationConfig } from '../../../../types/IOrganizationConfig';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly api = inject(ApiService);

  getConfig(): Observable<IOrganizationConfig> {
    return this.api.get<IOrganizationConfig>('/api/Organization');
  }

  updateConfig(title: string, estimatedPercentageOfGainPerProduct: number): Observable<IOrganizationConfig> {
    return this.api.put<IOrganizationConfig>('/api/Organization', { title, estimatedPercentageOfGainPerProduct });
  }

  uploadLogo(file: File): Observable<IOrganizationConfig> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postForm<IOrganizationConfig>('/api/Organization/logo', formData);
  }

  getLogoBlob(): Observable<Blob> {
    return this.api.getBlob('/api/Organization/logo');
  }
}
