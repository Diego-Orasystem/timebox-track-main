import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Timebox, TimeboxCategory, TimeboxType, Postulacion } from '../../../shared/interfaces/timebox.interface';
import { Persona } from '../../../shared/interfaces/fases-timebox.interface';
import { ApiService } from '../../../shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class TimeboxApiService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtiene todos los timeboxes
   */
  getAllTimeboxes(): Observable<Timebox[]> {
    return this.apiService.getData<{status: boolean, message: string, data: Timebox[]}>('/timeboxes')
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene un timebox por ID
   */
  getTimeboxById(id: string): Observable<Timebox> {
    return this.apiService.getData<{status: boolean, message: string, data: Timebox}>(`/timeboxes/${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Crea un nuevo timebox
   */
  createTimebox(timebox: Omit<Timebox, 'id'>): Observable<Timebox> {
    return this.apiService.post<{status: boolean, message: string, data: Timebox}>('/timeboxes', timebox)
      .pipe(map(response => response.data));
  }

  /**
   * Actualiza un timebox existente
   */
  updateTimebox(id: string, timebox: Timebox): Observable<Timebox> {
    return this.apiService.put<{status: boolean, message: string, data: Timebox}>(`/timeboxes/${id}`, timebox)
      .pipe(map(response => response.data));
  }

  /**
   * Elimina un timebox
   */
  deleteTimebox(id: string): Observable<boolean> {
    return this.apiService.delete<{ status: boolean, message: string, success: boolean }>(`/timeboxes/${id}`)
      .pipe(map(response => response.success));
  }

  /**
   * Obtiene las categorías de timebox
   */
  getTimeboxCategories(): Observable<TimeboxCategory[]> {
    return this.apiService.getData<{status: boolean, message: string, data: TimeboxCategory[]}>('/timeboxes/categories')
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene todos los tipos de timebox
   */
  getAllTimeboxTypes(): Observable<TimeboxType[]> {
    return this.apiService.getData<{status: boolean, message: string, data: TimeboxType[]}>('/timeboxes/types')
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene un tipo de timebox por ID
   */
  getTimeboxTypeById(typeId: string): Observable<TimeboxType> {
    return this.apiService.getData<{status: boolean, message: string, data: TimeboxType}>(`/timeboxes/types/${typeId}`)
      .pipe(map(response => response.data));
  }

  /**
   * Crea un nuevo tipo de timebox
   */
  createTimeboxType(typeData: Omit<TimeboxType, 'id'>): Observable<TimeboxType> {
    return this.apiService.post<{status: boolean, message: string, data: TimeboxType}>('/timeboxes/types', typeData)
      .pipe(map(response => response.data));
  }

  /**
   * Actualiza un tipo de timebox existente
   */
  updateTimeboxType(id: string, typeData: TimeboxType): Observable<TimeboxType> {
    return this.apiService.put<{status: boolean, message: string, data: TimeboxType}>(`/timeboxes/types/${id}`, typeData)
      .pipe(map(response => response.data));
  }

  /**
   * Elimina un tipo de timebox
   */
  deleteTimeboxType(id: string): Observable<boolean> {
    return this.apiService.delete<{status: boolean, message: string}>(`/timeboxes/types/${id}`)
      .pipe(map(response => response.status));
  }

  /**
   * Crea una nueva categoría de timebox
   */
  createTimeboxCategory(categoryData: Omit<TimeboxCategory, 'id'>): Observable<TimeboxCategory> {
    return this.apiService.post<{status: boolean, message: string, data: TimeboxCategory}>('/timeboxes/categories', categoryData)
      .pipe(map(response => response.data));
  }

  /**
   * Actualiza una categoría de timebox existente
   */
  updateTimeboxCategory(id: string, categoryData: TimeboxCategory): Observable<TimeboxCategory> {
    return this.apiService.put<{status: boolean, message: string, data: TimeboxCategory}>(`/timeboxes/categories/${id}`, categoryData)
      .pipe(map(response => response.data));
  }

  /**
   * Elimina una categoría de timebox
   */
  deleteTimeboxCategory(id: string): Observable<boolean> {
    return this.apiService.delete<{status: boolean, message: string}>(`/timeboxes/categories/${id}`)
      .pipe(map(response => response.status));
  }

  /**
   * Obtiene todas las personas
   */
  getPersonas(): Observable<Persona[]> {
    return this.apiService.getData<{status: boolean, message: string, data: Persona[]}>('/personas')
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene una persona por ID
   */
  getPersonaById(personaId: string): Observable<Persona> {
    return this.apiService.getData<{status: boolean, message: string, data: Persona}>(`/personas/${personaId}`)
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene timeboxes publicados
   */
  getPublishedTimeboxes(): Observable<Timebox[]> {
    return this.apiService.getData<{status: boolean, message: string, data: Timebox[]}>('/timeboxes/published')
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene timeboxes con postulaciones
   */
  getAllTimeboxesWithPostulations(): Observable<Timebox[]> {
    return this.apiService.getData<{status: boolean, message: string, data: Timebox[]}>('/timeboxes/with-postulations')
      .pipe(map(response => response.data));
  }

  /**
   * Asigna un rol a un timebox
   */
  assignRoleToTimebox(
    timeboxId: string,
    postulacionId: string,
    roleKey: string,
    developerName: string
  ): Observable<Timebox> {
    return this.apiService.put<{status: boolean, message: string, data: Timebox}>(`/timeboxes/${timeboxId}/assign-role`, {
      postulacionId,
      roleKey,
      developerName
    }).pipe(map(response => response.data));
  }

  /**
   * Rechaza una postulación
   */
  rejectPostulacion(
    timeboxId: string,
    postulacionId: string
  ): Observable<Timebox> {
    return this.apiService.put<{status: boolean, message: string, data: Timebox}>(`/timeboxes/${timeboxId}/reject-postulation`, {
      postulacionId
    }).pipe(map(response => response.data));
  }

  /**
   * Postula a un timebox
   */
  postularATimebox(
    timeboxId: string,
    newPostulacion: Postulacion
  ): Observable<Timebox> {
    return this.apiService.post<{status: boolean, message: string, data: Timebox}>(`/timeboxes/${timeboxId}/postulate`, newPostulacion)
      .pipe(map(response => response.data));
  }
} 