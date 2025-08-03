import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Realiza una petición GET
   */
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<any>(`${this.baseUrl}${endpoint}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Realiza una petición GET y extrae los datos de la respuesta del backend
   */
  getData<T>(endpoint: string): Observable<T> {
    return this.http.get<any>(`${this.baseUrl}${endpoint}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Realiza una petición POST
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Realiza una petición PUT
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Realiza una petición DELETE
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Maneja los errores de las peticiones HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';
    
    // Verificar si estamos en el navegador y ErrorEvent está disponible
    if (typeof window !== 'undefined' && typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor o entorno SSR
      if (error.status === 0) {
        errorMessage = 'Error de conexión. Verifique su conexión a internet.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (error.status >= 500) {
        errorMessage = 'Error interno del servidor.';
      } else {
        errorMessage = `Error ${error.status}: ${error.message || 'Error desconocido'}`;
      }
    }
    
    console.error('Error en API:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
} 