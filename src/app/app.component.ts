import { Component, OnInit } from '@angular/core';
import { SHARED_COMPONENTS } from './shared/shared.components';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from './shared/services/config.service';
import { AuthService } from './shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [SHARED_COMPONENTS, RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
})
export class AppComponent implements OnInit {
  title = 'timebox-track';

  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Mostrar información de configuración en la consola
    this.configService.logEnvironmentInfo();
  }

  // Mover la propiedad aquí para evitar el error de inicialización
  get isAuthenticated$() {
    return this.authService.isAuthenticated$;
  }
}
