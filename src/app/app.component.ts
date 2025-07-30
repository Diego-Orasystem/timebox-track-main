import { Component } from '@angular/core';
import { SHARED_COMPONENTS } from './shared/shared.components';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [SHARED_COMPONENTS, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
})
export class AppComponent {
  title = 'timebox-track';
}
