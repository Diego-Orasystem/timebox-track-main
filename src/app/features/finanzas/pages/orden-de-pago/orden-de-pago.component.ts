import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService } from '../../services/finanzas.service';
import { AuthService } from '../../../../shared/services/auth.service';

interface OrdenPago {
  id: string;
  developer_id: string;
  developer_nombre?: string; // ✅ Nombre del developer
  monto: number;
  moneda: string;
  concepto: string;
  fecha_emision: string;
  estado: 'Pendiente' | 'Aprobada' | 'Pagada' | 'Rechazada';
  created_at: string;
  updated_at: string;
  pagos?: any[];
}

@Component({
  selector: 'app-orden-de-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orden-de-pago.component.html',
  styleUrl: './orden-de-pago.component.css'
})
export class OrdenDePagoComponent implements OnInit {
  ordenes: OrdenPago[] = [];
  ordenesFiltradas: OrdenPago[] = [];
  loading = false;
  estado = '';
  moneda = '';
  
  // ✅ Control de acceso
  isAdmin = false;
  currentUserId = '';
  currentUserName = '';
  
  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;
  
  // Modales
  showModalDetalle = false;
  showModalComprobante = false;
  ordenSeleccionada: OrdenPago | null = null;
  
  // Comprobante
  archivoSeleccionado: File | null = null;
  referenciaPago = '';
  
  // Math para template
  Math = Math;

  constructor(
    private finanzasService: FinanzasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.verificarRolUsuario();
    this.cargar();
  }
  
  // ✅ Verificar rol del usuario para control de acceso
  private verificarRolUsuario() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.currentUserId = currentUser.id;
        this.currentUserName = currentUser.first_name + ' ' + currentUser.last_name;
        
        // Verificar si es admin
        this.isAdmin = this.authService.hasRole('Platform Administrator') || 
                      this.authService.hasRole('admin') ||
                      this.authService.hasRole('Admin');
        
        console.log('🔐 Control de acceso - Usuario:', {
          id: this.currentUserId,
          nombre: this.currentUserName,
          isAdmin: this.isAdmin
        });
      } else {
        console.warn('⚠️ No se pudo obtener el usuario autenticado');
        this.currentUserId = '';
        this.currentUserName = '';
        this.isAdmin = false;
      }
    } catch (error) {
      console.error('❌ Error al verificar rol de usuario:', error);
      this.currentUserId = '';
      this.currentUserName = '';
      this.isAdmin = false;
    }
  }

  cargar(): void {
    this.loading = true;
    this.finanzasService.getOrdenesPago(this.estado).subscribe({
      next: (data) => { 
        this.ordenes = data; 
        this.aplicarFiltros();
        this.loading = false; 
      },
      error: (error) => { 
        console.error('Error cargando órdenes:', error);
        this.ordenes = []; 
        this.ordenesFiltradas = [];
        this.loading = false; 
      }
    });
  }

  filtrar(estado: string): void {
    this.estado = estado;
    this.aplicarFiltros();
  }

  filtrarPorMoneda(moneda: string): void {
    this.moneda = moneda;
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let filtradas = [...this.ordenes];
    
    // Filtrar por estado
    if (this.estado) {
      filtradas = filtradas.filter(orden => orden.estado === this.estado);
    }
    
    // Filtrar por moneda
    if (this.moneda) {
      filtradas = filtradas.filter(orden => orden.moneda === this.moneda);
    }
    
    this.ordenesFiltradas = filtradas;
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  private calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.ordenesFiltradas.length / this.itemsPorPagina);
  }

  // Paginación
  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  // Modales
  verDetalle(orden: OrdenPago): void {
    this.ordenSeleccionada = orden;
    this.showModalDetalle = true;
  }

  cerrarModalDetalle(): void {
    this.showModalDetalle = false;
    this.ordenSeleccionada = null;
  }

  // Acciones de órdenes
  async aprobarOrden(orden: OrdenPago): Promise<void> {
    if (confirm(`¿Estás seguro de que quieres aprobar la orden de pago por ${this.formatCurrency(orden.monto)} ${orden.moneda}?`)) {
      try {
        await this.finanzasService.updateEstadoOrden(orden.id, 'Aprobada').toPromise();
        this.mostrarMensaje('✅ Orden aprobada exitosamente');
        this.cargar(); // Recargar datos
      } catch (error) {
        console.error('Error aprobando orden:', error);
        this.mostrarMensaje('❌ Error al aprobar la orden', 'error');
      }
    }
  }

  async rechazarOrden(orden: OrdenPago): Promise<void> {
    const motivo = prompt('Motivo del rechazo:');
    if (motivo) {
      try {
        await this.finanzasService.updateEstadoOrden(orden.id, 'Rechazada').toPromise();
        this.mostrarMensaje('❌ Orden rechazada exitosamente');
        this.cargar(); // Recargar datos
      } catch (error) {
        console.error('Error rechazando orden:', error);
        this.mostrarMensaje('❌ Error al rechazar la orden', 'error');
      }
    }
  }

  async marcarComoPagada(orden: OrdenPago): Promise<void> {
    if (confirm(`¿Confirmas que la orden por ${this.formatCurrency(orden.monto)} ${orden.moneda} ha sido pagada?`)) {
      try {
        await this.finanzasService.updateEstadoOrden(orden.id, 'Pagada').toPromise();
        this.mostrarMensaje('💰 Orden marcada como pagada');
        this.cargar(); // Recargar datos
      } catch (error) {
        console.error('Error marcando como pagada:', error);
        this.mostrarMensaje('❌ Error al marcar como pagada', 'error');
      }
    }
  }

  // Comprobante
  adjuntarComprobante(orden: OrdenPago): void {
    this.ordenSeleccionada = orden;
    this.showModalComprobante = true;
  }

  cerrarModalComprobante(): void {
    this.showModalComprobante = false;
    this.ordenSeleccionada = null;
    this.archivoSeleccionado = null;
    this.referenciaPago = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB.');
        return;
      }
      this.archivoSeleccionado = file;
    }
  }

  async subirComprobante(): Promise<void> {
    if (!this.archivoSeleccionado || !this.ordenSeleccionada) {
      return;
    }

    // DEBUG: Log de datos a enviar
    console.log('🔍 DEBUG Frontend - Datos a enviar:');
    console.log('📁 Orden ID:', this.ordenSeleccionada.id);
    console.log('📄 Archivo:', this.archivoSeleccionado);
    console.log('🔑 Referencia:', this.referenciaPago);
    console.log('📋 Referencia length:', this.referenciaPago.length);
    console.log('📋 Referencia trimmed:', this.referenciaPago.trim().length);

    try {
      await this.finanzasService.subirComprobante(
        this.ordenSeleccionada.id,
        this.archivoSeleccionado,
        this.referenciaPago
      ).toPromise();
      
      this.mostrarMensaje('📎 Comprobante subido exitosamente');
      this.cerrarModalComprobante();
      this.cargar(); // Recargar datos
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
      this.mostrarMensaje('❌ Error al subir el comprobante', 'error');
    }
  }

  // Utilidades
  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  }

  getEstadoClasses(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Aprobada':
        return 'bg-blue-100 text-blue-800';
      case 'Pagada':
        return 'bg-green-100 text-green-800';
      case 'Rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' = 'success'): void {
    // Aquí podrías implementar un sistema de notificaciones
    // Por ahora usamos alert
    alert(mensaje);
  }
}
