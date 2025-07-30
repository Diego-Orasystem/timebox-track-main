import { Component, OnInit } from '@angular/core';
import { SHARED_COMPONENTS } from './shared/shared.components';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from './shared/services/config.service';

@Component({
  selector: 'app-root',
  imports: [SHARED_COMPONENTS, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
})
export class AppComponent implements OnInit {
  title = 'timebox-track';

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    // Mostrar información de configuración en la consola
    this.configService.logEnvironmentInfo();
  }
}
