import { ChangeDetectorRef, Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationService } from '../services/application.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-progress-bar',
  imports: [MatProgressBarModule],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBar {
  loading: boolean = false;

  constructor(private applicationService: ApplicationService,
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef
  ) {
    this.applicationService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading: boolean) => {
        this.loading = loading
        this.cdr.detectChanges();
      });
  }
}
