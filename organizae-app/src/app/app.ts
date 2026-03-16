import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Navigation } from './core/navigation/navigation';
import { ProgressBar } from './core/progress-bar/progress-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, ProgressBar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);

  readonly isAuthRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        return url === '/login' || url.startsWith('/login');
      })
    ),
    { initialValue: true }
  );
}

