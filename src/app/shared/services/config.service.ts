import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  get apiUrl(): string {
    return environment.apiUrl;
  }
  
  get isProduction(): boolean {
    return environment.production;
  }
  
  get environmentInfo(): string {
    if (environment.apiUrl === '/api') {
      return 'Docker/Producción (Mismo servidor)';
    } else if (environment.apiUrl.includes('10.90.0.190')) {
      return 'Docker/Producción (Servidor remoto)';
    } else if (environment.apiUrl.includes('localhost')) {
      return 'Desarrollo Local';
    } else {
      return 'Desconocido';
    }
  }
  
  logEnvironmentInfo(): void {
    console.log('🌐 Configuración de entorno:');
    console.log(`   Modo: ${this.environmentInfo}`);
    console.log(`   API URL: ${this.apiUrl}`);
    console.log(`   Producción: ${this.isProduction}`);
  }
}