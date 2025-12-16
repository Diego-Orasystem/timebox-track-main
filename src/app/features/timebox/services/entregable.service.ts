import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { Entregable } from '../../../shared/interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class EntregableService {
  constructor(private apiService: ApiService) {}

  // Obtener todos los entregables
  getAll(): Observable<Entregable[]> {
    return this.apiService
      .getData<{ status: boolean; message: string; data: Entregable[] }>('/entregables/all')
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error obteniendo entregables:', error);
          return of([]);
        })
      );
  }

  // Obtener entregable por ID
  getById(id: string): Observable<Entregable> {
    return this.apiService
      .getData<{ status: boolean; message: string; data: Entregable }>(`/entregables/${id}`)
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error(`Error obteniendo entregable ${id}:`, error);
          return throwError(() => new Error(`Entregable con ID ${id} no encontrado`));
        })
      );
  }

  // Crear entregable
  create(entregable: Partial<Entregable>): Observable<Entregable> {
    const payload = {
      nombre: entregable.nombre,
      descripcion: entregable.descripcion,
      productId: entregable.productId, // contexto del producto
      tipo: entregable.tipo,
      entregableId: entregable.entregableId || null, // padre opcional
      documentacion: entregable.documentacion || [],
    };

    return this.apiService
      .post<{ status: boolean; message: string; data: Entregable }>('/entregables', payload)
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error creando entregable:', error);
          return throwError(() => new Error('Error al crear el entregable'));
        })
      );
  }

  // Actualizar entregable
  update(id: string, updateData: Partial<Entregable>): Observable<Entregable> {
    return this.apiService
      .put<{ status: boolean; message: string; data: Entregable }>(`/entregables/${id}`, updateData)
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error(`Error actualizando entregable ${id}:`, error);
          return throwError(() => new Error(`Error al actualizar el entregable con ID ${id}`));
        })
      );
  }

  // Eliminar entregable
  delete(id: string): Observable<boolean> {
    return this.apiService
      .delete<{ status: boolean; message: string }>(`/entregables/${id}`)
      .pipe(
        map((response) => response.status),
        catchError((error) => {
          console.error(`Error eliminando entregable ${id}:`, error);
          return throwError(() => new Error(`Error al eliminar el entregable con ID ${id}`));
        })
      );
  }

  // (Opcional) Entregables por producto
  getByProductId(productId: string): Observable<Entregable[]> {
    return this.apiService
      .getData<{ status: boolean; message: string; data: Entregable[] }>(`/entregables/product/${productId}`)
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error(`Error obteniendo entregables del producto ${productId}:`, error);
          return of([]);
        })
      );
  }
}