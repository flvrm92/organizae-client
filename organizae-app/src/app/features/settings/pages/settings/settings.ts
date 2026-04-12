import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { OrganizationService } from '../../services/organization.service';
import { OrganizationStore } from '../../../../core/services/organization.store';
import { ApplicationService } from '../../../../core/services/application.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit, OnDestroy {
  private readonly orgService = inject(OrganizationService);
  readonly orgStore = inject(OrganizationStore);
  private readonly app = inject(ApplicationService);

  title = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  savingTitle = signal(false);
  uploadingLogo = signal(false);

  ngOnInit(): void {
    this.orgService.getConfig().subscribe({
      next: (config) => {
        this.title.set(config.title);
      }
    });
  }

  saveTitle(): void {
    if (!this.title().trim()) return;
    this.savingTitle.set(true);
    this.orgService.updateTitle(this.title().trim()).subscribe({
      next: (config) => {
        this.orgStore.refreshAfterUpdate(config);
        this.app.displayMessage('Título atualizado com sucesso');
        this.savingTitle.set(false);
      },
      error: () => {
        this.app.displayMessage('Erro ao atualizar título');
        this.savingTitle.set(false);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.app.displayMessage('A imagem deve ter no máximo 2MB');
      input.value = '';
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.app.displayMessage('Formato inválido. Use PNG, JPEG ou WebP');
      input.value = '';
      return;
    }

    this.revokePreview();
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  uploadLogo(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.uploadingLogo.set(true);
    this.orgService.uploadLogo(file).subscribe({
      next: (config) => {
        this.orgStore.refreshAfterUpdate(config);
        this.app.displayMessage('Logo atualizado com sucesso');
        this.selectedFile.set(null);
        this.revokePreview();
        this.uploadingLogo.set(false);
      },
      error: () => {
        this.app.displayMessage('Erro ao atualizar logo');
        this.uploadingLogo.set(false);
      }
    });
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrl.set(null);
    }
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }
}
