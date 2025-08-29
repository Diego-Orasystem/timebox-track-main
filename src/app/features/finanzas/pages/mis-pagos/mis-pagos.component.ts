import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService } from '../../services/finanzas.service';
import { UploadService } from '../../../../shared/services/upload.service';
import { ModalDetallePagoComponent } from '../../components/modal-detalle-pago/modal-detalle-pago.component';
import { OrdenDePagoIndividual } from '../../../../shared/interfaces/orden-de-pago.interface';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../shared/services/auth.service';

// Interfaces
interface Pago {
  id: string;
  orden_pago_id: string;
  monto: number;
  moneda: string;
  metodo: string;
  referencia: string;
  fecha_pago: string | null;
  created_at: string;
  archivo_url?: string;
  archivo_tipo?: string;
  archivo_size?: number;
}

interface OrdenPago {
  id: string;
  developer_id: string;
  developer_nombre?: string; // ✅ Nombre del developer
  monto: string;
  moneda: string;
  concepto: string;
  fecha_emision: string;
  estado: string;
  created_at: string;
  updated_at: string;
  pagos: Pago[];
}

@Component({
  selector: 'app-mis-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetallePagoComponent],
  templateUrl: './mis-pagos.component.html',
  styleUrl: './mis-pagos.component.css'
})
export class MisPagosComponent implements OnInit {
  // Propiedades principales
  pagos: OrdenPago[] = [];
  loading = false;
  developerIdConfigurado = false;
  
  // ✅ Control de acceso
  isAdmin = false;
  currentUserId = '';
  currentUserName = '';
  
  // Usuario por defecto: Juan Pérez
  private readonly USUARIO_POR_DEFECTO = {
    id: 'c4ec45fc-1939-43c6-9d4b-2be658567c79',
    nombre: 'Juan Pérez'
  };

  // Inyección de servicios usando inject()
  private finanzasService = inject(FinanzasService);
  private uploadService = inject(UploadService);
  private authService = inject(AuthService);

  // Propiedades para filtros
  filterState: string = 'Todos';
  filterMoneda: string = 'Todas';
  filterMetodo: string = 'Todos';
  filterEstado: string = 'Todos';
  filterFecha: string = 'Todas';

  // Propiedades para el modal de comprobantes
  showModalComprobantes = false;
  pagoSeleccionado: Pago | null = null;
  comprobantes: Pago[] = [];

  // Propiedades para el modal de detalle de cobro
  showModalDetalleCobro = false;
  pagoToDetalleCobro: OrdenDePagoIndividual | null = null;

  // Labels de la tabla
  tableLabels = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'monto', label: 'Monto' },
    { key: 'moneda', label: 'Moneda' },
    { key: 'developer', label: 'Developer' }, // ✅ Nueva columna para developer
    { key: 'metodo', label: 'Método' },
    { key: 'referencia', label: 'Referencia' },
    { key: 'orden', label: 'Orden' },
    { key: 'acciones', label: 'Acciones' }
  ];

  // URL base del backend para archivos
  private readonly backendUrl = 'http://localhost:3000';

  ngOnInit() {
    this.verificarRolUsuario();
    this.configurarDeveloperIdPorDefecto();
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

  // ✅ Configurar developerId con control de acceso
  private configurarDeveloperIdPorDefecto() {
    let developerId = window.localStorage.getItem('developerId');
    
    // ✅ Si es admin, puede ver todos los pagos
    if (this.isAdmin) {
      console.log('🔐 Usuario admin - Puede ver todos los pagos');
      this.developerIdConfigurado = true;
      this.cargarMisPagosAdmin(); // ID vacío para admin = ver todos
      return;
    }
    
    // ✅ Si no es admin, SOLO puede ver sus propios pagos
    if (!developerId) {
      developerId = this.currentUserId;
    }
    
    // ✅ VERIFICACIÓN CRÍTICA: Usuario no admin solo puede ver sus propios pagos
    if (!this.isAdmin && developerId !== this.currentUserId) {
      console.warn('🚫 ACCESO DENEGADO: Usuario intentando ver pagos de otro usuario');
      console.warn('🚫 Usuario actual:', this.currentUserId);
      console.warn('🚫 Intentando acceder a:', developerId);
      
      // Forzar redirección a sus propios pagos
      developerId = this.currentUserId;
      
      // Limpiar localStorage para evitar futuros accesos no autorizados
      window.localStorage.removeItem('developerId');
    }
    
    // Configurar developerId en localStorage
    window.localStorage.setItem('developerId', developerId);
    this.developerIdConfigurado = true;
    
    console.log('🔐 Cargando pagos para usuario:', {
      developerId,
      isAdmin: this.isAdmin,
      currentUserId: this.currentUserId,
      currentUserName: this.currentUserName
    });
    
    // ✅ VERIFICACIÓN FINAL: Asegurar que se use el ID correcto
    if (!this.isAdmin && developerId !== this.currentUserId) {
      console.error('❌ ERROR CRÍTICO: Usuario no autorizado - Forzando ID correcto');
      developerId = this.currentUserId;
    }
    
    // Cargar pagos
    this.cargarMisPagos(developerId);
  }

  // Cargar mis pagos
  async cargarMisPagos(developerId: string) {
    try {
      this.loading = true;
      console.log('🔄 Cargando mis pagos para developerId:', developerId);
      
      const response: any = await this.finanzasService.getMisPagos(developerId).toPromise();
      
      console.log('📡 Respuesta completa:', response);
      
      if (response && response.status && response.data) {
        // Respuesta con estructura {status, data}
        this.pagos = response.data;
        console.log('✅ Pagos cargados (con status):', this.pagos.length);
      } else if (Array.isArray(response)) {
        // Respuesta directa como array
        this.pagos = response;
        console.log('✅ Pagos cargados (array directo):', this.pagos.length);
      } else {
        console.log('❌ Formato de respuesta no reconocido:', response);
        this.pagos = [];
        return;
      }
      
      // Log de tipos de pagos
      if (this.pagos.length > 0) {
        this.pagos.forEach((orden, index) => {
          console.log(`📊 Orden ${index + 1}:`, {
            id: orden.id,
            totalPagos: orden.pagos.length,
            tipos: orden.pagos.map(p => p.metodo),
            comprobantes: orden.pagos.filter(p => p.metodo === 'Comprobante').length,
            otros: orden.pagos.filter(p => p.metodo !== 'Comprobante').length
          });
        });
      }
      
      this.developerIdConfigurado = true;
    } catch (error) {
      console.error('❌ Error cargando mis pagos:', error);
      this.pagos = [];
    } finally {
      this.loading = false;
    }
  }

  // ✅ Cargar mis pagos para administradores (todos los pagos)
  async cargarMisPagosAdmin() {
    try {
      this.loading = true;
      console.log('🔐 Cargando TODOS los pagos (vista admin)');
      
      const response: any = await this.finanzasService.getMisPagos('').toPromise();
      
      console.log('📡 Respuesta completa (admin):', response);
      
      if (response && response.status && response.data) {
        // Respuesta con estructura {status, data}
        this.pagos = response.data;
        console.log('✅ Pagos cargados para admin (con status):', this.pagos.length);
      } else if (Array.isArray(response)) {
        // Respuesta directa como array
        this.pagos = response;
        console.log('✅ Pagos cargados para admin (array directo):', this.pagos.length);
      } else {
        console.log('❌ Formato de respuesta no reconocido (admin):', response);
        this.pagos = [];
        return;
      }
      
      // Log de tipos de pagos
      if (this.pagos.length > 0) {
        this.pagos.forEach((orden, index) => {
          console.log(`📊 Orden ${index + 1} (admin):`, {
            id: orden.id,
            developer_id: orden.developer_id,
            totalPagos: orden.pagos.length,
            tipos: orden.pagos.map(p => p.metodo),
            comprobantes: orden.pagos.filter(p => p.metodo === 'Comprobante').length,
            otros: orden.pagos.filter(p => p.metodo !== 'Comprobante').length
          });
        });
      }
      
      this.developerIdConfigurado = true;
    } catch (error) {
      console.error('❌ Error cargando pagos para admin:', error);
      this.pagos = [];
    } finally {
      this.loading = false;
    }
  }

  // Aplicar filtros
  applyFilters() {
    console.log('🔍 Aplicando filtros:', {
      estado: this.filterState,
      moneda: this.filterMoneda,
      metodo: this.filterMetodo,
      fecha: this.filterFecha
    });
  }

  // Obtener pagos filtrados (mostrar 1 registro consolidado por orden)
  get pagosFiltrados() {
    if (!this.pagos || this.pagos.length === 0) {
      console.log('🔍 No hay pagos para filtrar');
      return [];
    }
    
    console.log('🔍 Pagos originales:', this.pagos.length);
    
    // Mostrar 1 registro consolidado por orden
    const pagosConsolidados = this.pagos.map(orden => {
      // Obtener el pago principal (Anticipo) y el comprobante representativo
      const pagoAnticipo = orden.pagos.find(p => p.metodo === 'Anticipo');
      const comprobantes = orden.pagos.filter(p => p.metodo === 'Comprobante');
      const tieneComprobantes = comprobantes.length > 0;
      
      // Crear un registro consolidado
      const registroConsolidado = {
        ...orden,
        // Información del pago principal
        monto: pagoAnticipo?.monto || orden.monto,
        moneda: pagoAnticipo?.moneda || 'CLP',
        fechaPago: pagoAnticipo?.fecha_pago || null,
        referencia: pagoAnticipo?.referencia || '',
        // Estado del pago
        estado: orden.estado,
        // Información de comprobantes
        tieneComprobantes,
        totalComprobantes: comprobantes.length,
        // Para el modal
        comprobantes: comprobantes
      };
      
      console.log(`🔍 Orden ${orden.id} consolidada:`, {
        monto: registroConsolidado.monto,
        tieneComprobantes: registroConsolidado.tieneComprobantes,
        totalComprobantes: registroConsolidado.totalComprobantes
      });
      
      return registroConsolidado;
    });
    
    console.log('🔍 Órdenes consolidadas:', pagosConsolidados.length);
    
    // Aplicar filtros adicionales si es necesario
    if (this.filterState && this.filterState !== 'Todos') {
      const filtrados = pagosConsolidados.filter(orden => 
        orden.estado === this.filterState || 
        (this.filterState === 'Pagado' && orden.tieneComprobantes)
      );
      console.log(`🔍 Filtrados por ${this.filterState}:`, filtrados.length);
      return filtrados;
    }
    
    return pagosConsolidados;
  }

  // Obtener total de pagos principales (excluyendo comprobantes)
  getTotalPagos(): number {
    if (!this.pagos || this.pagos.length === 0) return 0;
    
    return this.pagos.reduce((total, orden) => {
      // Solo contar pagos principales, no comprobantes
      const pagosPrincipales = orden.pagos.filter(pago => pago.metodo !== 'Comprobante');
      return total + pagosPrincipales.length;
    }, 0);
  }

  // Obtener total de monto de pagos principales (excluyendo comprobantes)
  getTotalMonto(): string {
    if (!this.pagos || this.pagos.length === 0) return '0.00';
    
    const total = this.pagos.reduce((total, orden) => {
      // Solo sumar montos de pagos principales, no comprobantes
      const pagosPrincipales = orden.pagos.filter(pago => pago.metodo !== 'Comprobante');
      const montoOrden = pagosPrincipales.reduce((sum, pago) => {
        return sum + (Number(pago.monto) || 0);
      }, 0);
      return total + montoOrden;
    }, 0);
    
    return total.toFixed(2);
  }

  // Obtener moneda principal
  getMonedaPrincipal(): string {
    if (!this.pagos || this.pagos.length === 0) return '';
    const primerPago = this.pagos[0]?.pagos[0];
    return primerPago?.moneda || '';
  }

  // Abrir modal de comprobantes para una orden consolidada
  verComprobantes(orden: any) {
    console.log('🔍 verComprobantes() llamado con orden:', orden);
    console.log('🔍 Estado actual showModalComprobantes:', this.showModalComprobantes);
    
    // Usar la información consolidada
    this.pagoSeleccionado = {
      id: orden.id,
      orden_pago_id: orden.id,
      monto: orden.monto,
      moneda: orden.moneda,
      metodo: 'Comprobante',
      referencia: orden.referencia,
      fecha_pago: orden.fechaPago,
      created_at: orden.created_at,
      archivo_url: undefined,
      archivo_tipo: undefined,
      archivo_size: undefined
    };
    
    console.log('🔍 pagoSeleccionado establecido:', this.pagoSeleccionado);
    
    // Usar los comprobantes de la orden consolidada
    this.comprobantes = orden.comprobantes || [];
    console.log(`🔍 Encontrados ${this.comprobantes.length} comprobantes para la orden ${orden.id}`);
    console.log('🔍 Comprobantes:', this.comprobantes);
    
    this.showModalComprobantes = true;
    console.log('🔍 showModalComprobantes establecido a true');
    console.log('🔍 Estado final:', {
      showModalComprobantes: this.showModalComprobantes,
      pagoSeleccionado: this.pagoSeleccionado,
      comprobantes: this.comprobantes
    });
  }

  // Cerrar modal de comprobantes
  cerrarModalComprobantes() {
    this.showModalComprobantes = false;
    this.pagoSeleccionado = null;
    this.comprobantes = [];
  }

  // Abrir modal de detalle de cobro
  verDetalleCobro(pago: Pago) {
    // Convertir Pago a OrdenDePagoIndividual
    this.pagoToDetalleCobro = this.convertirPagoToOrdenDePago(pago);
    this.showModalDetalleCobro = true;
  }

  // Convertir Pago a OrdenDePagoIndividual
  private convertirPagoToOrdenDePago(pago: Pago): OrdenDePagoIndividual {
    // Buscar la orden que contiene este pago
    const orden = this.pagos.find(o => o.pagos.some(p => p.id === pago.id));
    
    if (!orden) {
      throw new Error('Orden no encontrada para el pago');
    }

    return {
      idOrden: orden.id,
      fechaOrdenDePago: orden.fecha_emision,
      dataTimebox: {
        idTimebox: this.extraerTimeboxId(orden.concepto),
        nombreTimebox: this.extraerNombreTimebox(orden.concepto),
        fechaEntrega: orden.fecha_emision
      },
      ordenDePago: {
        colaborador: {
          id: pago.id,
          nombre: orden.developer_id,
          email: '',
          rol: 'Desarrollador'
        },
        montoBase: Number(orden.monto),
        porcentajeEntregaAnt: 25, // Por defecto 25% para anticipo
        glosa: orden.concepto,
        estado: orden.estado === 'Pagada' ? 'Pagado' : 'Solicitado'
      }
    };
  }

  // Extraer ID del timebox del concepto
  private extraerTimeboxId(concepto: string): string {
    const match = concepto.match(/Timebox ([a-f0-9-]+)/);
    return match ? match[1] : 'unknown';
  }

  // Extraer nombre del timebox del concepto
  private extraerNombreTimebox(concepto: string): string {
    const match = concepto.match(/Timebox ([a-f0-9-]+) - Rol: (.+)/);
    return match ? `Timebox ${match[1]} - ${match[2]}` : concepto;
  }

  // Construir URL completa para archivos
  getFileUrl(archivoUrl: string | undefined): string {
    if (!archivoUrl) return '';
    
    // Si ya es una URL completa, devolverla tal como está
    if (archivoUrl.startsWith('http://') || archivoUrl.startsWith('https://')) {
      return archivoUrl;
    }
    
    // Si es una ruta relativa, construir la URL completa
    if (archivoUrl.startsWith('/')) {
      return this.backendUrl + archivoUrl;
    }
    
    // Si no tiene slash inicial, agregarlo
    return this.backendUrl + '/' + archivoUrl;
  }

  // Cerrar modal de detalle de cobro
  closeModalDetalleCobro() {
    this.showModalDetalleCobro = false;
    this.pagoToDetalleCobro = null;
  }

  // Métodos de utilidad
  formatDate(date: string | null): string {
    if (!date) return 'Pendiente';
    return new Date(date).toLocaleDateString('es-ES');
  }

  formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? Number(amount) : amount;
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatFileSize(bytes: number | undefined): string {
    if (bytes === undefined || bytes === null) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  }

  getMetodoClasses(metodo: string): string {
    switch (metodo) {
      case 'Comprobante':
        return 'bg-green-100 text-green-800';
      case 'Anticipo':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getEstadoClasses(estado: string): string {
    switch (estado) {
      case 'Pagada':
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Métodos de configuración de usuario (para testing)
  configurarDeveloperIdTemporal() {
    const nuevoId = prompt('Ingresa el nuevo developerId:');
    if (nuevoId) {
      window.localStorage.setItem('developerId', nuevoId);
      this.cargarMisPagos(nuevoId);
    }
  }

  configurarDeveloperIdParaTesting() {
    const nuevoId = prompt('Ingresa el developerId para testing:');
    if (nuevoId) {
      window.localStorage.setItem('developerId', nuevoId);
      this.cargarMisPagos(nuevoId);
    }
  }

  limpiarConfiguracion() {
    window.localStorage.removeItem('developerId');
    this.developerIdConfigurado = false;
    this.pagos = [];
  }

  getCurrentDeveloperId(): string {
    return window.localStorage.getItem('developerId') || 'No configurado';
  }

  isJuanPerez(): boolean {
    const currentId = window.localStorage.getItem('developerId');
    return currentId === this.USUARIO_POR_DEFECTO.id;
  }

  configurarJuanPerez() {
    window.localStorage.setItem('developerId', this.USUARIO_POR_DEFECTO.id);
    this.cargarMisPagos(this.USUARIO_POR_DEFECTO.id);
  }
}
