import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css'
})
export class PageHeader {
  title = input.required<string>();
  subtitle = input<string>();
  backLink = input<string>();
  backLabel = input<string>('Voltar');
}
