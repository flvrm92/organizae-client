import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';

import { routes } from './app.routes';

registerLocaleData(localePtBr, 'pt-BR');
import { ENVIRONMENT } from './config/environment.token';
import { environment } from '../environments/environment';
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor])),
    provideAnimationsAsync(),
    { provide: ENVIRONMENT, useValue: environment },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ]
};
