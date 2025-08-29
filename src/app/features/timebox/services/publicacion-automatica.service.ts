import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PublicacionAutomatica {
  id: string;
  timeboxId: string;
  rol: string;
  sueldoSemanal: number;
  moneda: string;
  semanasProyecto: number;
  financiamientoTotal: number;
  publicado: boolean;
  fechaPublicacion?: string;
}

export interface RolDisponible {
  key: string;
  nombre: string;
  sueldoSemanal: number;
  moneda: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicacionAutomaticaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los roles disponibles para un timebox
   */
  getRolesDisponibles(timeboxId: string): Observable<RolDisponible[]> {
    return this.http.get<RolDisponible[]>(`${this.apiUrl}/timeboxes/${timeboxId}/roles-disponibles`);
  }

  /**
   * Crea publicaciones automáticas para todos los roles disponibles
   */
  crearPublicacionesAutomaticas(timeboxId: string): Observable<PublicacionAutomatica[]> {
    return this.http.post<PublicacionAutomatica[]>(`${this.apiUrl}/timeboxes/${timeboxId}/publicaciones-automaticas`, {});
  }

  /**
   * Publica una oferta específica
   */
  publicarOferta(publicacionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/publicaciones/${publicacionId}/publicar`, {});
  }

  /**
   * Obtiene todas las publicaciones de un timebox
   */
  getPublicacionesPorTimebox(timeboxId: string): Observable<PublicacionAutomatica[]> {
    return this.http.get<PublicacionAutomatica[]>(`${this.apiUrl}/timeboxes/${timeboxId}/publicaciones`);
  }

  /**
   * Calcula el financiamiento total para un rol
   */
  calcularFinanciamiento(sueldoSemanal: number, semanasProyecto: number): number {
    return sueldoSemanal * semanasProyecto;
  }

  /**
   * Convierte el esfuerzo del planning a semanas
   */
  parsearEsfuerzoA semanas(esfuerzo: string): number {
    if (!esfuerzo) return 1;
    
    const match = esfuerzo.match(/(\d+)\s*sem/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    // Si no es formato "X sem", asumir 1 semana
    return 1;
  }
}



