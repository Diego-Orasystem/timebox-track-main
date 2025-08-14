import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  constructor(private api: ApiService) {}

  getMisPagos(developerId: string) {
    return this.api
      .get<{ status: boolean; message: string; data: any[] }>(`/finanzas/mis-pagos/${developerId}`)
      .pipe(map((r) => r.data));
  }

  getOrdenesPago(estado?: string) {
    const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    return this.api
      .get<{ status: boolean; message: string; data: any[] }>(`/finanzas/ordenes-pago${qs}`)
      .pipe(map((r) => r.data));
  }

  updateEstadoOrden(ordenId: string, nuevoEstado: string) {
    return this.api
      .put<{ status: boolean; message: string; data: any }>(`/finanzas/ordenes-pago/${ordenId}/estado`, {
        estado: nuevoEstado
      })
      .pipe(map((r) => r.data));
  }

  subirComprobante(ordenId: string, archivo: File, referencia: string) {
    // DEBUG: Log de datos recibidos
    console.log('🔍 DEBUG Service - Datos recibidos:');
    console.log('📁 Orden ID:', ordenId);
    console.log('📄 Archivo:', archivo);
    console.log('🔑 Referencia:', referencia);
    console.log('📋 Referencia length:', referencia.length);

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('referencia', referencia);
    
    // DEBUG: Log de FormData
    console.log('📋 FormData creado:', formData);
    
    return this.api
      .post<{ status: boolean; message: string; data: any }>(`/finanzas/ordenes-pago/${ordenId}/comprobante`, formData)
      .pipe(map((r) => r.data));
  }
}


