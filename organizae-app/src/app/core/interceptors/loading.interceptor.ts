import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { ApplicationService } from '../services/application.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const appService = inject(ApplicationService);
  appService.showProgressBar(true);
  return next(req).pipe(
    finalize(() => appService.showProgressBar(false))
  );
};
