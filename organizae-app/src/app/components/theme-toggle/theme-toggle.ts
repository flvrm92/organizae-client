import { Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [MatIconButton, MatIconModule, MatTooltipModule],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle {
  readonly themeService = inject(ThemeService);
}
