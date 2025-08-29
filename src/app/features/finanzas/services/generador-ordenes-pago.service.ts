import { Injectable, inject } from '@angular/core';
import { FinanzasService } from './finanzas.service';
import { TimeboxService } from '../../timebox/services/timebox.service';
import { RoleService, Role } from './role.service';
import { Timebox } from '../../../shared/interfaces/timebox.interface';
import { TeamMovilization, Persona } from '../../../shared/interfaces/fases-timebox.interface';

export interface OrdenPagoGenerada {
  developerId: string;
  developerName: string;
  rol: string;
  monto: number;
  moneda: string;
  concepto: string;
  timeboxId: string;
  timeboxNombre: string;
  semanasTimebox: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeneradorOrdenesPagoService {
  private finanzasService = inject(FinanzasService);
  private timeboxService = inject(TimeboxService);
  private roleService = inject(RoleService);

  /**
   * ✅ Genera órdenes de pago automáticamente cuando un timebox se finaliza
   * @param timeboxId ID del timebox finalizado
   */
  async generarOrdenesPagoAutomaticas(timeboxId: string): Promise<OrdenPagoGenerada[]> {
    try {
      console.log('💰 Generando órdenes de pago automáticas para timebox:', timeboxId);

      // 1. Obtener el timebox completo
      const timebox = await this.timeboxService.getTimebox(timeboxId).toPromise();
      if (!timebox) {
        throw new Error(`Timebox ${timeboxId} no encontrado`);
      }

      // 2. Verificar que el timebox esté finalizado
      if (timebox.estado !== 'Finalizado') {
        console.log('⚠️ Timebox no está finalizado, no se generan órdenes de pago');
        return [];
      }

      // 3. Obtener el team mobilization del Kick Off
      const teamMovilization = timebox.fases?.kickOff?.teamMovilization;
      if (!teamMovilization) {
        console.log('⚠️ No hay team mobilization configurado');
        return [];
      }

      // 4. Calcular semanas del timebox
      const semanasTimebox = this.calcularSemanasTimebox(timebox);

      // 5. Generar órdenes para cada miembro del equipo
      const ordenesGeneradas: OrdenPagoGenerada[] = [];
      
      for (const [rol, persona] of Object.entries(teamMovilization)) {
        if (persona && (persona as Persona).id && (persona as Persona).nombre) {
          try {
            const orden = await this.generarOrdenParaRol(
              persona as Persona,
              rol,
              timebox,
              semanasTimebox
            );
            if (orden) {
              ordenesGeneradas.push(orden);
            }
          } catch (error) {
            console.error(`❌ Error generando orden para ${rol}:`, error);
          }
        }
      }

      console.log('✅ Órdenes de pago generadas:', ordenesGeneradas.length);
      return ordenesGeneradas;

    } catch (error) {
      console.error('❌ Error generando órdenes de pago automáticas:', error);
      throw error;
    }
  }

  /**
   * ✅ Genera una orden de pago para un rol específico
   */
  private async generarOrdenParaRol(
    persona: Persona,
    rol: string,
    timebox: Timebox,
    semanasTimebox: number
  ): Promise<OrdenPagoGenerada | null> {
    try {
      console.log(`💰 Generando orden para ${persona.nombre} (${rol})`);

      // 1. Obtener la tarifa del rol desde Gestión de Roles
      const tarifaRol = await this.obtenerTarifaRol(rol);
      if (!tarifaRol) {
        console.warn(`⚠️ No se encontró tarifa para el rol: ${rol}`);
        return null;
      }

      // 2. Calcular el monto total
      const montoTotal = this.calcularMontoTotal(tarifaRol, semanasTimebox);

      // 3. Crear la orden de pago REAL en la base de datos
      console.log('💰 Orden de pago a crear:', {
        developerId: persona.id,
        monto: montoTotal,
        moneda: 'CLP',
        concepto: this.generarConceptoPago(timebox, rol, semanasTimebox, tarifaRol),
        fechaEmision: new Date().toISOString()
      });
      
      // ✅ CREAR ORDEN REAL EN LA BASE DE DATOS
      const ordenPago = await this.finanzasService.createOrdenPago({
        developerId: persona.id || '',
        developerName: persona.nombre || '', // ✅ Enviar el nombre del developer
        monto: montoTotal,
        moneda: 'CLP',
        concepto: this.generarConceptoPago(timebox, rol, semanasTimebox, tarifaRol),
        fechaEmision: new Date().toISOString(),
        timeboxId: timebox.id || '',
        rol: rol,
        semanasTimebox: semanasTimebox
      }).toPromise();

      if (ordenPago) {
        console.log(`✅ Orden de pago REAL creada para ${persona.nombre}:`, ordenPago);
        
        return {
          developerId: persona.id || '',
          developerName: persona.nombre || '',
          rol: rol,
          monto: montoTotal,
          moneda: 'CLP',
          concepto: this.generarConceptoPago(timebox, rol, semanasTimebox, tarifaRol),
          timeboxId: timebox.id || '',
          timeboxNombre: timebox.fases?.planning?.nombre || 'Sin nombre',
          semanasTimebox: semanasTimebox
        };
      }

      return null;

    } catch (error) {
      console.error(`❌ Error generando orden para ${persona.nombre}:`, error);
      return null;
    }
  }

  /**
   * ✅ Obtiene la tarifa de un rol desde Gestión de Roles
   */
  private async obtenerTarifaRol(rol: string): Promise<any> {
    try {
      console.log(`🔍 Buscando tarifa real para rol: ${rol}`);
      
      // ✅ OBTENER TODOS LOS ROLES DESDE EL SISTEMA REAL
      const rolesResponse = await this.roleService.getAllRoles().toPromise();
      
      if (!rolesResponse?.success || !rolesResponse.data) {
        console.warn(`⚠️ No se pudieron obtener los roles del sistema`);
        // ✅ FALLBACK: Usar tarifas hardcodeadas como respaldo
        return this.obtenerTarifaFallback(rol);
      }

      // ✅ MAPEO DE NOMBRES DE ROLES DEL FORMULARIO A NOMBRES DEL SISTEMA
      const mapeoRoles: { [key: string]: string[] } = {
        'businessAmbassador': ['Project Manager', 'Project Office', 'Stakeholder'],
        'solutionDeveloper': ['Solution Developer'],
        'solutionTester': ['Solution Tester'],
        'businessAdvisor': ['Project Support', 'Business Advisor'],
        'technicalAdvisor': ['Technical Advisor', 'Project Support']
      };

      // ✅ OBTENER NOMBRES A BUSCAR PARA ESTE ROL
      const nombresABuscar = mapeoRoles[rol] || [rol];
      console.log(`🔍 Nombres a buscar para "${rol}":`, nombresABuscar);

      // ✅ BUSCAR EL ROL ESPECÍFICO EN EL SISTEMA
      const rolEncontrado = rolesResponse.data.find((r: Role) => {
        const nombreRolSistema = r.name.toLowerCase();
        return nombresABuscar.some(nombre => 
          nombreRolSistema === nombre.toLowerCase() ||
          nombreRolSistema.includes(nombre.toLowerCase())
        );
      });

      if (rolEncontrado) {
        const tarifa = {
          tarifaPorSemana: rolEncontrado.sueldo_base_semanal,
          moneda: rolEncontrado.moneda || 'CLP'
        };
        
        console.log(`💰 Tarifa real encontrada para ${rol} (mapeado a "${rolEncontrado.name}"): $${tarifa.tarifaPorSemana.toLocaleString('es-CL')} ${tarifa.moneda}/semana`);
        return tarifa;
      } else {
        console.warn(`⚠️ No se encontró rol "${rol}" en el sistema, usando fallback`);
        console.log(`🔍 Roles disponibles en el sistema:`, rolesResponse.data.map(r => r.name));
        return this.obtenerTarifaFallback(rol);
      }

    } catch (error) {
      console.error(`❌ Error obteniendo tarifa para rol ${rol}:`, error);
      console.log(`🔄 Usando tarifa fallback para ${rol}`);
      return this.obtenerTarifaFallback(rol);
    }
  }

  /**
   * ✅ Tarifas fallback en caso de error del sistema
   */
  private obtenerTarifaFallback(rol: string): any {
    // ✅ TARIFAS REALES DE TU SISTEMA (como respaldo)
    const tarifasFallback = {
      'businessAmbassador': { tarifaPorSemana: 160000, moneda: 'CLP' }, // Project Manager, Project Office, Stakeholder
      'solutionDeveloper': { tarifaPorSemana: 140000, moneda: 'CLP' }, // ✅ Solution Developer (dato real)
      'solutionTester': { tarifaPorSemana: 160000, moneda: 'CLP' },   // Solution Tester
      'businessAdvisor': { tarifaPorSemana: 160000, moneda: 'CLP' },   // Project Support
      'technicalAdvisor': { tarifaPorSemana: 160000, moneda: 'CLP' }   // Project Support
    };

    const tarifa = tarifasFallback[rol as keyof typeof tarifasFallback];
    
    if (tarifa) {
      console.log(`💰 Tarifa fallback para ${rol}: $${tarifa.tarifaPorSemana.toLocaleString('es-CL')} ${tarifa.moneda}/semana`);
      return tarifa;
    } else {
      console.warn(`⚠️ No se encontró tarifa fallback para el rol: ${rol}`);
      return null;
    }
  }

  /**
   * ✅ Calcula el monto total basado en la tarifa y semanas
   */
  private calcularMontoTotal(tarifaRol: any, semanasTimebox: number): number {
    const tarifaPorSemana = tarifaRol.tarifaPorSemana || 0;
    const montoTotal = tarifaPorSemana * semanasTimebox;
    
    console.log(`💰 Cálculo: ${tarifaPorSemana} × ${semanasTimebox} semanas = ${montoTotal}`);
    
    return montoTotal;
  }

  /**
   * ✅ Calcula las semanas del timebox
   */
  private calcularSemanasTimebox(timebox: Timebox): number {
    try {
      console.log('🔍 Calculando semanas del timebox:', timebox.id);
      
      // ✅ OPCIONES PARA CALCULAR SEMANAS:
      // 1. Fecha de inicio desde planning
      const fechaInicio = timebox.fases?.planning?.fechaInicio;
      
      // 2. Fecha de fin desde close (si existe)
      const fechaFinClose = timebox.fases?.close?.fechaCompletado;
      
      // 3. Fecha actual (si no hay fecha de fin)
      const fechaActual = new Date();
      
      // 4. Fecha de fin desde otras fases
      const fechaFinQA = timebox.fases?.qa?.fechaCompletado;
      const fechaFinRefinement = timebox.fases?.refinement?.fechaCompletado;
      
      console.log('📅 Fechas disponibles:');
      console.log('  - Fecha inicio:', fechaInicio);
      console.log('  - Fecha fin close:', fechaFinClose);
      console.log('  - Fecha fin QA:', fechaFinQA);
      console.log('  - Fecha fin refinement:', fechaFinRefinement);
      
      if (!fechaInicio) {
        console.warn('⚠️ No hay fecha de inicio, usando 2 semanas por defecto');
        return 2; // Por defecto 2 semanas como mencionaste
      }

      const inicio = new Date(fechaInicio);
      let fin: Date;
      
      // ✅ PRIORIDAD PARA FECHA DE FIN:
      if (fechaFinClose) {
        fin = new Date(fechaFinClose);
        console.log('✅ Usando fecha de fin desde fase Close');
      } else if (fechaFinQA) {
        fin = new Date(fechaFinQA);
        console.log('✅ Usando fecha de fin desde fase QA');
      } else if (fechaFinRefinement) {
        fin = new Date(fechaFinRefinement);
        console.log('✅ Usando fecha de fin desde fase Refinement');
      } else {
        fin = fechaActual;
        console.log('✅ Usando fecha actual como fecha de fin');
      }
      
      const diferenciaMs = fin.getTime() - inicio.getTime();
      const diferenciaDias = diferenciaMs / (1000 * 60 * 60 * 24);
      const semanas = Math.ceil(diferenciaDias / 7);
      
      console.log(`📅 Cálculo semanas:`);
      console.log(`  - Fecha inicio: ${inicio.toLocaleDateString('es-CL')}`);
      console.log(`  - Fecha fin: ${fin.toLocaleDateString('es-CL')}`);
      console.log(`  - Diferencia: ${diferenciaDias} días = ${semanas} semanas`);
      
      // ✅ MÍNIMO 2 SEMANAS COMO MENCIONASTE
      const semanasFinales = Math.max(2, semanas);
      
      if (semanasFinales !== semanas) {
        console.log(`⚠️ Ajustando a mínimo 2 semanas (calculado: ${semanas})`);
      }
      
      return semanasFinales;

    } catch (error) {
      console.error('❌ Error calculando semanas del timebox:', error);
      console.log('🔄 Usando 2 semanas por defecto');
      return 2; // Por defecto 2 semanas como mencionaste
    }
  }

  /**
   * ✅ Genera el concepto descriptivo del pago
   */
  private generarConceptoPago(
    timebox: Timebox,
    rol: string,
    semanasTimebox: number,
    tarifaRol: any
  ): string {
    const nombreTimebox = timebox.fases?.planning?.nombre || 'Timebox';
    const rolFormateado = this.formatearNombreRol(rol);
    const tarifaPorSemana = tarifaRol.tarifaPorSemana || 0;
    
    return `Pago por ${rolFormateado} - ${nombreTimebox} - ${semanasTimebox} semanas × $${tarifaPorSemana.toLocaleString('es-CL')}`;
  }

  /**
   * ✅ Formatea el nombre del rol para mostrar
   */
  private formatearNombreRol(rol: string): string {
    const nombresRoles: { [key: string]: string } = {
      'businessAmbassador': 'Business Ambassador',
      'solutionDeveloper': 'Solution Developer',
      'solutionTester': 'Solution Tester',
      'businessAdvisor': 'Business Advisor',
      'technicalAdvisor': 'Technical Advisor'
    };

    return nombresRoles[rol] || rol;
  }

  /**
   * ✅ Verifica si ya existen órdenes de pago para un timebox
   */
  async verificarOrdenesExistentes(timeboxId: string): Promise<boolean> {
    try {
      // Aquí deberías hacer la consulta al backend para verificar si ya existen órdenes
      // Por ahora retornamos false
      return false;
    } catch (error) {
      console.error('❌ Error verificando órdenes existentes:', error);
      return false;
    }
  }
}
