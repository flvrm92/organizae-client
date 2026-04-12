import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { OrganizationService } from '../../features/settings/services/organization.service';
import { AuthService } from '../../auth/services/auth.service';
import { IOrganizationConfig } from '../../../types/IOrganizationConfig';

@Injectable({ providedIn: 'root' })
export class OrganizationStore implements OnDestroy {
  private readonly organizationService = inject(OrganizationService);
  private readonly auth = inject(AuthService);

  private readonly _title = signal<string>('Organizae');
  private readonly _logoUrl = signal<string | null>(null);
  private readonly _hasLogo = signal<boolean>(false);

  readonly displayTitle = computed(() => this._title());
  readonly displayLogoUrl = computed(() => this._logoUrl());

  loadConfig(): void {
    if (!this.auth.isAuthenticated()) return;

    this.organizationService.getConfig().subscribe({
      next: (config) => {
        this._title.set(config.title);
        this._hasLogo.set(config.hasLogo);
        if (config.hasLogo) {
          this.loadLogo();
        } else {
          this.revokeLogoUrl();
        }
      }
    });
  }

  refreshAfterUpdate(config: IOrganizationConfig): void {
    this._title.set(config.title);
    this._hasLogo.set(config.hasLogo);
    if (config.hasLogo) {
      this.loadLogo();
    } else {
      this.revokeLogoUrl();
    }
  }

  private loadLogo(): void {
    this.organizationService.getLogoBlob().subscribe({
      next: (blob) => {
        this.revokeLogoUrl();
        this._logoUrl.set(URL.createObjectURL(blob));
      }
    });
  }

  private revokeLogoUrl(): void {
    const current = this._logoUrl();
    if (current) {
      URL.revokeObjectURL(current);
      this._logoUrl.set(null);
    }
  }

  ngOnDestroy(): void {
    this.revokeLogoUrl();
  }
}
