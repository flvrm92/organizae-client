import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'organizae_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark = signal(false);
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    const stored = localStorage.getItem(THEME_KEY);
    this._isDark.set(stored === 'dark');
    this.apply();
  }

  toggle(): void {
    this._isDark.update(v => !v);
    localStorage.setItem(THEME_KEY, this._isDark() ? 'dark' : 'light');
    this.apply();
  }

  private apply(): void {
    const html = document.documentElement;
    if (this._isDark()) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}
