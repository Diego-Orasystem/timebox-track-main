import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Role {
  id: string;
  name: string;
  description: string;
  level: string;
  sueldo_base_semanal: number;
  moneda: string;
  fecha_inicio: string;
  is_active: boolean;
}

export interface SueldoUpdate {
  sueldo_base_semanal: number;
  moneda?: string;
}

export interface SueldoStats {
  total_roles: number;
  roles_con_sueldo: number;
  total_semanal: number;
  total_mensual: number;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  // Obtener todos los roles con sueldos
  getAllRoles(): Observable<{ success: boolean; data: Role[]; message: string }> {
    return this.http.get<{ success: boolean; data: Role[]; message: string }>(this.apiUrl);
  }

  // Obtener un rol específico
  getRoleById(id: string): Observable<{ success: boolean; data: Role; message: string }> {
    return this.http.get<{ success: boolean; data: Role; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Actualizar sueldo de un rol
  updateRoleSueldo(id: string, sueldoData: SueldoUpdate): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.put<{ success: boolean; message: string; data: any }>(`${this.apiUrl}/${id}/sueldo`, sueldoData);
  }

  // Obtener estadísticas de sueldos
  getSueldosStats(): Observable<{ success: boolean; data: SueldoStats; message: string }> {
    return this.http.get<{ success: boolean; data: SueldoStats; message: string }>(`${this.apiUrl}/stats`);
  }
}
