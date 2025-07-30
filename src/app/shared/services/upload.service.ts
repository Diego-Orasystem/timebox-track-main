import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  status: boolean;
  message: string;
  data: {
    id: string;
    nombre: string;
    url: string;
    tipo: string;
    file_size: number;
    mime_type: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo al servidor
   * @param file El archivo a subir
   * @returns Observable con la respuesta del servidor
   */
  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Obtiene información de un archivo por ID
   * @param id ID del archivo
   * @returns Observable con la información del archivo
   */
  getFileById(id: string): Observable<UploadResponse> {
    return this.http.get<UploadResponse>(`${this.apiUrl}/upload/${id}`);
  }

  /**
   * Elimina un archivo por ID
   * @param id ID del archivo
   * @returns Observable con la respuesta del servidor
   */
  deleteFile(id: string): Observable<{status: boolean, message: string}> {
    return this.http.delete<{status: boolean, message: string}>(`${this.apiUrl}/upload/${id}`);
  }
} 