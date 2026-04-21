import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { Navigation } from './navigation';
import { AuthService } from '../../auth/services/auth.service';
import { OrganizationStore } from '../services/organization.store';
import { ThemeService } from '../../components/theme-toggle/theme.service';

describe('Navigation', () => {
  let component: Navigation;
  let fixture: ComponentFixture<Navigation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navigation],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => false, logout: vi.fn() } },
        {
          provide: OrganizationStore,
          useValue: { displayLogoUrl: () => null, displayTitle: () => '', loadConfig: vi.fn() },
        },
        { provide: ThemeService, useValue: { isDark: signal(false), toggle: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navigation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes a Relatórios section with a Fechamento route', () => {
    expect(component.relatorioItems.length).toBeGreaterThan(0);
    const item = component.relatorioItems.find(i => i.route === '/relatorios/fechamento');
    expect(item).toBeDefined();
    expect(item!.label).toBe('Fechamento');
  });
});
