import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  apiUrl: string;
}

export const ENVIRONMENT = new InjectionToken<AppEnvironment>('app.environment');
