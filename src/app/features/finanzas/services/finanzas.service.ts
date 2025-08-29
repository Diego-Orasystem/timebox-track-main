import { Injectable } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../shared/services/auth.service';

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  // ✅ Obtener pagos con control de acceso
  getMisPagos(developerId: string) {
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = currentUser ? 
      (this.authService.hasRole('Platform Administrator') || 
       this.authService.hasRole('admin') || 
       this.authService.hasRole('Admin')) : false;
    
    // ✅ Si es admin, puede ver todos los pagos
    if (isAdmin) {
      console.log('🔐 Servicio: Usuario admin - Obteniendo todos los pagos');
      return this.api
        .get<{ status: boolean; message: string; data: any[] }>(`/finanzas/mis-pagos/all`)
        .pipe(map((r) => r.data));
    }
    
    // ✅ Si no es admin, solo puede ver sus propios pagos
    // Verificar que el developerId sea válido
    if (!developerId || developerId.trim() === '') {
      developerId = currentUser?.id || '';
    }
    
    if (!developerId || developerId.trim() === '') {
      console.error('❌ Servicio: No se pudo obtener un developerId válido');
      return this.api
        .get<{ status: boolean; message: string; data: any[] }>(`/finanzas/mis-pagos/unauthorized`)
        .pipe(map((r) => r.data));
    }
    
    console.log('🔐 Servicio: Usuario normal - Obteniendo pagos para:', developerId);
    
    return this.api
      .get<{ status: boolean; message: string; data: any[] }>(`/finanzas/mis-pagos/${developerId}`)
      .pipe(map((r) => r.data));
  }

  // ✅ Obtener órdenes de pago con control de acceso
  getOrdenesPago(estado?: string) {
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = currentUser ? 
      (this.authService.hasRole('Platform Administrator') || 
       this.authService.hasRole('admin') || 
       this.authService.hasRole('Admin')) : false;
    
    // ✅ Si es admin, puede ver todas las órdenes
    if (isAdmin) {
      console.log('🔐 Servicio: Usuario admin - Obteniendo todas las órdenes de pago');
      const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
      return this.api
        .get<{ status: boolean; message: string; data: any[] }>(`/finanzas/ordenes-pago${qs}`)
        .pipe(map((r) => r.data));
    }
    
    // ✅ Si no es admin, solo puede ver sus propias órdenes
    const userId = currentUser?.id;
    if (!userId) {
      console.warn('⚠️ Servicio: Usuario no autenticado');
      return this.api
        .get<{ status: boolean; message: string; data: any[] }>(`/finanzas/ordenes-pago/unauthorized`)
        .pipe(map((r) => r.data));
    }
    
    console.log('🔐 Servicio: Usuario normal - Obteniendo órdenes para:', userId);
    const qs = estado ? `?estado=${encodeURIComponent(estado)}&userId=${userId}` : `?userId=${userId}`;
    return this.api
      .get<{ status: boolean; message: string; data: any[] }>(`/finanzas/ordenes-pago/user${qs}`)
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

  // ✅ Crear orden de pago
  createOrdenPago(ordenData: {
    developerId: string;
    developerName?: string; // ✅ Nombre del developer
    monto: number;
    moneda: string;
    concepto: string;
    fechaEmision: string;
    timeboxId: string;
    rol: string;
    semanasTimebox: number;
  }) {
    console.log('💰 FinanzasService: Creando orden de pago:', ordenData);
    
    return this.api
      .post<{ status: boolean; message: string; data: any }>('/finanzas/ordenes-pago', ordenData)
      .pipe(map((r) => r.data));
  }
}


