import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormGroupDirective, FormsModule } from '@angular/forms';
import { ModalHorarioComponent } from '../../components/modal-horario/modal-horario.component';

// Asegúrate de que las rutas a tus interfaces sean correctas
import {
  Adjuntos,
  Entrega,
  Skill,
  SolicitudRevision,
  Persona,
  TeamMovilization, // Asegúrate de importar Persona si no lo está
} from '../../../../shared/interfaces/fases-timebox.interface';
import {
  Timebox,
  Postulacion,
} from '../../../../shared/interfaces/timebox.interface';

import { ProjectService } from '../../../timebox/services/project.service';
import { formatDate } from '../../../../shared/helpers/date-formatter';
import { TimeboxService } from '../../../timebox/services/timebox.service';
import { TimeboxTypeService } from '../../../timebox/pages/timebox-maintainer/services/timebox-maintainer.service';
import { AuthService } from '../../../../shared/services/auth.service';
interface FileWithType {
  file: File;
  type: string;
  fechaAdjunto: string;
}
@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalHorarioComponent],
  templateUrl: './inbox.component.html',
  styleUrl: './inbox.component.css',
})
export class InboxComponent implements OnInit {
  rootForm!: FormGroup;
  usuario = '';

  timeboxes: Timebox[] = [];
  timeboxesFiltrados: Timebox[] = [];
  timeboxSeleccionado: Timebox | null = null;

  // Propiedades para manejar la postulación de roles
  rolesDisponibles: string[] = []; // Para almacenar los nombres de los roles
  rolesSeleccionados: string[] = []; // Para almacenar los roles seleccionados por el usuario

  filterState: 'Todos' | 'Disponible' | 'Solicitado' | 'Asignado' | 'Finalizado' =
    'Todos';
  filterSkill: string = '';
  conceptualSkills: string[] = [
    'Frontend',
    'Backend',
    'FullStack',
    'Mobile',
    'QA',
    'UI',
    'UX',
    'DevOps',
    'Cloud',
    'Data Engineering',
  ];

  filterEffort: string = '';
  sortOrder: 'asc' | 'desc' = 'desc';

  dispForm!: FormGroup;
  disponibilidadRevision: {
    [key: string]: { start: string; end: string }[];
  } = {};

  disponibilidadCierre: {
    [key: string]: { start: string; end: string }[];
  } = {};

  // Properties to hold files selected for upload, now including their type
  selectedFiles: { [key: string]: FileWithType[] } = {}; // For Entregables
  selectedEvidences: { [key: string]: FileWithType[] } = {}; // For Evidencias

  // Variables to bind to the type selection dropdowns
  selectedDeliverableType: string | null = null;
  selectedEvidenceType: string | null = null;

  dateFileInput = '';
  showModalHorario = false;
  modalModo: 'Revision' | 'Entrega' | 'Cierre' = 'Revision';
  tbxaEntregar: Timebox | null = null;
  showModalConfirmacion = false;
  operacion: 'Revision' | 'Entrega' | 'Cierre' = 'Entrega';

  constructor(
    private timeboxPublicoService: TimeboxService,
    private projectService: ProjectService,
    private timeboxTypeService: TimeboxTypeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerUsuarioAutenticado();
    this.loadTimeboxes();
  }

  private obtenerUsuarioAutenticado(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        // Construir el nombre completo del usuario
        const nombreCompleto = `${currentUser.first_name} ${currentUser.last_name}`.trim();
        this.usuario = nombreCompleto || currentUser.email || 'Usuario';
        
        console.log('🔐 Usuario autenticado en TaskInbox:', {
          id: currentUser.id,
          nombreCompleto,
          email: currentUser.email,
          roles: currentUser.roles
        });
      } else {
        console.warn('⚠️ No se pudo obtener el usuario autenticado');
        this.usuario = 'Usuario';
      }
    } catch (error) {
      console.error('❌ Error al obtener usuario autenticado:', error);
      this.usuario = 'Usuario';
    }
  }

  /**
   * Formatea el monto del financiamiento o retorna 'No definido' si no existe
   */
  formatFinanciamientoMonto(timebox: Timebox): string {
    // Validar que existan las propiedades antes de acceder a ellas
    const monto = timebox.fases?.kickOff && 'financiamiento' in timebox.fases.kickOff
      ? (timebox.fases.kickOff as any).financiamiento?.montoBase
      : undefined;
    return monto ? this.formatCurrency(monto) : 'No definido';
  }



  // --- Timebox --- //

  /**Cargar todos los timeboxes */
  loadTimeboxes(): void {
    this.timeboxPublicoService.getPublishedTimeboxes().subscribe({
      next: (timeboxes) => {
        console.log('DEBUG - Timeboxes cargados del backend:', timeboxes);
        
        // Debug: Buscar específicamente TEST1108
        const test1108 = timeboxes.find(t => t.fases?.planning?.codigo === 'TEST1108');
        if (test1108) {
          console.log('DEBUG - TEST1108 encontrado en backend:', {
            id: test1108.id,
            codigo: test1108.fases?.planning?.codigo,
            estado: test1108.estado,
            publicacionOferta: test1108.publicacionOferta,
            postulaciones: test1108.publicacionOferta?.postulaciones
          });
        }
        
        this.timeboxes = timeboxes;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error cargando timeboxes:', error);
      }
    });
  }

  /** Aplicar filtros */
  applyFilters(): void {
    console.log('DEBUG - Aplicando filtros. Filtro activo:', this.filterState);
    console.log('DEBUG - Total de timeboxes antes de filtrar:', this.timeboxes.length);
    
    let filtrados = [...this.timeboxes];

    switch (this.filterState) {
      case 'Todos':
        // No filtrar, mostrar todos los timeboxes
        console.log('DEBUG - Mostrando TODOS los timeboxes sin filtros');
        break;
      case 'Disponible':
        filtrados = filtrados.filter(
          (s) => {
            const estadoOk = s.estado === 'Disponible';
            
            // Un timebox está disponible si:
            // 1. Tiene estado "Disponible"
            // 2. Y tiene roles disponibles para postular (no todos los roles están asignados)
            
            // Verificar si hay roles disponibles
            const teamMovilization = s.fases?.kickOff?.teamMovilization;
            const rolesDisponibles = this.getRolesDisponiblesParaTimebox(s);
            const hayRolesDisponibles = rolesDisponibles.length > 0;
            
            // Debug: Log para TODOS los timeboxes
            console.log(`DEBUG - Timebox ${s.fases?.planning?.codigo || 'Sin código'}:`, {
              codigo: s.fases?.planning?.codigo,
              estado: s.estado,
              estadoOk,
              teamMovilization,
              rolesDisponibles,
              hayRolesDisponibles,
              resultado: estadoOk && hayRolesDisponibles
            });
            
            return estadoOk && hayRolesDisponibles;
          }
        );
        break;

      case 'Solicitado':
        filtrados = filtrados.filter(
          (s) =>
            s.estado === 'Disponible' &&
            // Si el usuario se ha postulado a CUALQUIER rol en este Timebox
            s.publicacionOferta?.postulaciones?.some(
              (p) => p.desarrollador === this.usuario
            ) &&
            // Y el rol principal (solutionDeveloper) aún no está asignado
            (!s.fases?.kickOff?.teamMovilization?.solutionDeveloper?.nombre ||
              s.fases?.kickOff?.teamMovilization?.solutionDeveloper?.nombre ===
                '')
        );
        break;

      case 'Asignado':
        filtrados = filtrados.filter(
          (s) =>
            s.estado === 'En Ejecución' &&
            s.fases?.kickOff?.teamMovilization.solutionDeveloper?.nombre ===
              this.usuario
        );
        break;

      case 'Finalizado':
        filtrados = filtrados.filter(
          (s) => s.estado === 'Finalizado' && this.isTimeboxAsignado(s)
        );
        break;
    }

    if (this.filterSkill) {
      filtrados = filtrados.filter((timebox) =>
        timebox.fases.planning?.skills.some(
          (skill) => skill.nombre === this.filterSkill
        )
      );
    }

    if (this.filterEffort !== '' && this.filterEffort !== null) {
      // Check for null instead of empty string
      filtrados = filtrados.filter(
        (timebox) => timebox.fases?.planning?.esfuerzo === this.filterEffort
      );
    }

    filtrados.sort((a, b) => {
      const dateA = a.publicacionOferta?.fechaPublicacion
        ? new Date(a.publicacionOferta.fechaPublicacion)
        : new Date(0);
      const dateB = b.publicacionOferta?.fechaPublicacion
        ? new Date(b.publicacionOferta.fechaPublicacion)
        : new Date(0);

      if (this.sortOrder === 'desc') {
        return dateB.getTime() - dateA.getTime(); // Most recent first
      } else {
        return dateA.getTime() - dateB.getTime(); // Oldest first
      }
    });

    this.timeboxesFiltrados = filtrados;
  }

  /**Timebox seleccionado */
  onSelectTimebox(tbx: Timebox) {
    this.timeboxSeleccionado = tbx;
    this.obtenerRolesDisponibles();

    // Si rolesDisponibles tiene elementos, selecciona el primero. Si no, ponlo a null.
    // this.rolSeleccionadoParaPostular =
    //   this.rolesDisponibles.length > 0 ? this.rolesDisponibles[0] : null;
  }

  // --- Helpers --- //

  /**Helper para obtener los entregables de un timebox existente */
  getEntregablesTimebox(): string[] {
    const typeId = this.timeboxSeleccionado?.tipoTimebox;
    const currentOptions =
      this.timeboxTypeService.timeboxTypesSubject.getValue();
    const selectedType = currentOptions.find((opt: any) => opt.id === typeId);
    return selectedType?.entregablesComunes?.length
      ? (selectedType.entregablesComunes as string[])
      : [];
  }

  /**Helper para obtener las evidencias de un timebox existente */
  getEvidenciasTimebox(): string[] {
    const typeId = this.timeboxSeleccionado?.tipoTimebox;
    const currentOptions =
      this.timeboxTypeService.timeboxTypesSubject.getValue();
    const selectedType = currentOptions.find((opt: any) => opt.id === typeId);
    return selectedType?.evidenciasCierre?.length
      ? (selectedType.evidenciasCierre as string[])
      : [];
  }

  /**Obtener las revisiones de un timebox existente */
  getRevisiones(tbx: Timebox) {
    return tbx.fases.refinement?.revisiones;
  }

  /**
   * Formatea un valor numérico como moneda chilena (CLP).
   * @param value El número a formatear.
   * @returns El número formateado como string de moneda.
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0, // No decimales para pesos chilenos
      maximumFractionDigits: 0,
    }).format(value);
  }

  /** Agrupar las skills por tipo conceptual */
  getConceptualSkills(skills: Skill[]) {
    return skills?.filter((skill) => skill.tipo === 'Conceptual');
  }

  /** Agrupar las skills por tipo tecnologica */
  getTecnologicaSkills(skills: Skill[]) {
    return skills?.filter((skill) => skill.tipo === 'Tecnológica');
  }

  /** Obtener los participantes de un timebox */
  getParticipantNames(participants: Persona[] | undefined): string {
    if (!participants || participants.length === 0) {
      return 'N/A';
    }
    return participants.map((p) => p.nombre).join(', ');
  }

  /** Formatear fecha con el formato "Vie 05 may. 2025 hhmm hrs" */
  getFormattedDate(date: string | undefined): string {
    if (date == undefined || date == '') return '';

    const dateToDate = new Date(date);
    return formatDate(dateToDate);
  }

  /**
   * Refresca los datos del timebox seleccionado
   * Útil después de acciones como rechazar postulaciones
   */
  async refrescarTimeboxSeleccionado(): Promise<void> {
    if (!this.timeboxSeleccionado) return;
    
    try {
      console.log('🔄 Refrescando datos del timebox:', this.timeboxSeleccionado.fases?.planning?.codigo);
      
      // Recargar el timebox desde el backend
      const response = await this.timeboxPublicoService.getTimebox(this.timeboxSeleccionado.id).toPromise();
      
      if (response) {
        // Actualizar el timebox en la lista
        const index = this.timeboxes.findIndex(t => t.id === this.timeboxSeleccionado!.id);
        if (index !== -1) {
          this.timeboxes[index] = response;
          this.timeboxSeleccionado = response;
        }
        
        // Recalcular roles disponibles
        this.obtenerRolesDisponibles();
        
        console.log('✅ Timebox refrescado exitosamente');
      }
    } catch (error) {
      console.error('❌ Error refrescando timebox:', error);
    }
  }

  /**Obtener roles disponibles para postulación */
  obtenerRolesDisponibles(): void {
    this.rolesDisponibles = []; // Resetear la lista
    this.rolesSeleccionados = []; // Resetear roles seleccionados

    // Debug: Verificar usuario autenticado
    console.log('DEBUG obtenerRolesDisponibles:', {
      usuario: this.usuario,
      timeboxSeleccionado: this.timeboxSeleccionado?.fases?.planning?.codigo,
      postulaciones: this.timeboxSeleccionado?.publicacionOferta?.postulaciones
    });

    if (this.timeboxSeleccionado) {
      let teamMovilization: TeamMovilization = this.timeboxSeleccionado.fases
        ?.kickOff?.teamMovilization as TeamMovilization;

      if (!teamMovilization) {
        teamMovilization = {
          businessAdvisor: undefined,
          businessAmbassador: undefined,
          solutionDeveloper: undefined,
          solutionTester: undefined,
          technicalAdvisor: undefined,
        };
      }

      // Definimos los roles que son parte de teamMovilization
      const rolesKeys = [
        'businessAmbassador',
        'solutionDeveloper',
        'solutionTester',
        'businessAdvisor',
        'technicalAdvisor',
      ];

      rolesKeys.forEach((roleKey) => {
        // Acceder a la propiedad usando un indexador de cadena
        const roleValue = (teamMovilization as any)[roleKey];
        // Si el rol es `null` o no tiene nombre, significa que no está asignado.
        // Y el usuario actual no se ha postulado ya a este rol en específico.
        // SOLO considerar postulaciones con estado "Pendiente" o "Aprobada"
        // IMPORTANTE: Comparar por ID único del usuario, no por nombre
        const yaPostuladoARolEspecifico =
          this.timeboxSeleccionado?.publicacionOferta?.postulaciones?.some(
            (p) => {
              // Comparar por ID único del usuario si está disponible, sino por nombre
              const esMismoUsuario = p.desarrollador === this.usuario;
              const esMismoRol = p.rol === roleKey;
              const esEstadoActivo = p.estadoSolicitud === 'Pendiente' || p.estadoSolicitud === 'Aprobada';
              
              return esMismoUsuario && esMismoRol && esEstadoActivo;
            }
          );

        // Debug: Log para verificar postulaciones
        if (this.timeboxSeleccionado?.fases?.planning?.codigo === 'TEST1108' || 
            this.timeboxSeleccionado?.fases?.planning?.codigo === 'TBX-TEST-2808') {
          console.log(`DEBUG ${this.timeboxSeleccionado.fases.planning.codigo} - Verificando rol ${roleKey}:`, {
            roleValue,
            yaPostuladoARolEspecifico,
            postulaciones: this.timeboxSeleccionado?.publicacionOferta?.postulaciones,
            usuario: this.usuario,
            esDisponible: (!roleValue || !roleValue.nombre || roleValue.nombre === '') && !yaPostuladoARolEspecifico
          });
          
          // Log detallado de postulaciones para este rol específico
          const postulacionesParaEsteRol = this.timeboxSeleccionado?.publicacionOferta?.postulaciones?.filter(
            (p) => p.rol === roleKey
          );
          console.log(`DEBUG ${this.timeboxSeleccionado.fases.planning.codigo} - Postulaciones para rol ${roleKey}:`, postulacionesParaEsteRol);
          
          // Log detallado de la comparación de usuario
          if (postulacionesParaEsteRol && postulacionesParaEsteRol.length > 0) {
            postulacionesParaEsteRol.forEach((p, index) => {
              console.log(`DEBUG ${this.timeboxSeleccionado?.fases?.planning?.codigo} - Postulación ${index + 1} para ${roleKey}:`, {
                desarrollador: p.desarrollador,
                usuarioActual: this.usuario,
                esMismoUsuario: p.desarrollador === this.usuario,
                rol: p.rol,
                estadoSolicitud: p.estadoSolicitud,
                esEstadoActivo: p.estadoSolicitud === 'Pendiente' || p.estadoSolicitud === 'Aprobada'
              });
            });
          }
        }

        if (
          (!roleValue || !roleValue.nombre || roleValue.nombre === '') &&
          !yaPostuladoARolEspecifico
        ) {
          this.rolesDisponibles.push(roleKey);
        }
      });

      // Debug: Log final de roles disponibles
      console.log('DEBUG obtenerRolesDisponibles - Resultado final:', {
        rolesDisponibles: this.rolesDisponibles,
        rolesSeleccionados: this.rolesSeleccionados
      });
    }
  }

  /**
   * Maneja la selección/deselección de un rol
   */
  toggleRolSeleccionado(rol: string): void {
    const index = this.rolesSeleccionados.indexOf(rol);
    if (index > -1) {
      // Deseleccionar rol
      this.rolesSeleccionados.splice(index, 1);
    } else {
      // Seleccionar rol
      this.rolesSeleccionados.push(rol);
    }
  }

  /**
   * Verifica si un rol está seleccionado
   */
  isRolSeleccionado(rol: string): boolean {
    return this.rolesSeleccionados.includes(rol);
  }

  /**
   * Verifica si hay roles seleccionados
   */
  hayRolesSeleccionados(): boolean {
    return this.rolesSeleccionados.length > 0;
  }

  /**
   * Obtiene el nombre legible de un rol
   */
  getNombreLegibleRol(rol: string): string {
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
   * Obtiene los roles disponibles para un timebox específico
   * (método auxiliar para el filtro)
   */
  getRolesDisponiblesParaTimebox(timebox: Timebox): string[] {
    const rolesDisponibles: string[] = [];
    
    if (!timebox) return rolesDisponibles;

    let teamMovilization: TeamMovilization = timebox.fases
      ?.kickOff?.teamMovilization as TeamMovilization;

    if (!teamMovilization) {
      teamMovilization = {
        businessAdvisor: undefined,
        businessAmbassador: undefined,
        solutionDeveloper: undefined,
        solutionTester: undefined,
        technicalAdvisor: undefined,
      };
    }

    // Debug: Log para el timebox TEST1108
    if (timebox.fases?.planning?.codigo === 'TEST1108') {
      console.log('DEBUG getRolesDisponiblesParaTimebox TEST1108:', {
        teamMovilization,
        rolesDisponibles: []
      });
    }

    // Definimos los roles que son parte de teamMovilization
    const rolesKeys = [
      'businessAmbassador',
      'solutionDeveloper',
      'solutionTester',
      'businessAdvisor',
      'technicalAdvisor',
    ];

    rolesKeys.forEach((roleKey) => {
      // Acceder a la propiedad usando un indexador de cadena
      const roleValue = (teamMovilization as any)[roleKey];
      
      // Si el rol es `null` o no tiene nombre, significa que no está asignado
      if (!roleValue || !roleValue.nombre || roleValue.nombre === '') {
        rolesDisponibles.push(roleKey);
        
        // Debug: Log para el timebox TEST1108
        if (timebox.fases?.planning?.codigo === 'TEST1108') {
          console.log(`DEBUG TEST1108 - Rol ${roleKey} disponible:`, {
            roleValue,
            esNull: !roleValue,
            noTieneNombre: !roleValue?.nombre,
            nombreVacio: roleValue?.nombre === ''
          });
        }
      }
    });

    // Debug: Log final para el timebox TEST1108
    if (timebox.fases?.planning?.codigo === 'TEST1108') {
      console.log('DEBUG TEST1108 - Roles disponibles finales:', rolesDisponibles);
    }

    return rolesDisponibles;
  }

  //Para obtener el rol postulado por el usuario actual
  getRolPostuladoPorUsuario(tbx: Timebox): string | null {
    if (!tbx || !tbx.publicacionOferta?.postulaciones || !this.usuario) {
      return null;
    }
    // Busca una postulación del usuario actual que NO sea 'Interesado General'
    const postulacionEspecifica = tbx.publicacionOferta.postulaciones.find(
      (p) => p.desarrollador === this.usuario && p.rol !== 'Interesado General'
    );
    return postulacionEspecifica ? postulacionEspecifica.rol : null;
  }

  /**Método para definir si un usuario puede postular a un timebox */
  puedePostularATimebox(tbx: Timebox): boolean {
    // Si el Timebox no está seleccionado o no está Disponible, no se puede postular.
    if (!tbx || tbx.estado !== 'Disponible') {
      return false;
    }

    // Un Timebox puede ser postulado si:
    // 1. El usuario no ha hecho una postulación general.
    const noHaPostuladoGeneral = !tbx.publicacionOferta?.postulaciones?.some(
      (p) => p.desarrollador === this.usuario && p.rol === 'Interesado General'
    );

    // 2. O si el usuario puede postular a un rol específico (porque hay roles disponibles para él)
    // Para esto, necesitaríamos que `obtenerRolesDisponibles` ya se haya ejecutado para `tbx`
    // y `this.rolesDisponibles` refleje los roles disponibles para el `timeboxSeleccionado`.
    // Si `this.timeboxSeleccionado === tbx` esto será cierto.
    const hayRolesEspecificosDisponibles = this.rolesDisponibles.length > 0;

    // Puedes postular si no has postulado generalmente O si hay roles específicos para postular.
    // Esto significa que el botón "Postular a este Timebox" estará visible si puedes postular de alguna manera.
    return noHaPostuladoGeneral || hayRolesEspecificosDisponibles;
  }

  /**Helper para determinar si se ha solicitado alguna vez  */
  getEstadoSolicitado(tbx: Timebox): boolean {
    // Debug: Log para el timebox TEST1108
    if (tbx.fases?.planning?.codigo === 'TEST1108') {
      console.log('DEBUG getEstadoSolicitado TEST1108:', {
        postulaciones: tbx.publicacionOferta?.postulaciones,
        usuario: this.usuario,
        resultado: tbx.publicacionOferta?.postulaciones?.some(
          (p) => p.desarrollador === this.usuario
        )
      });
    }
    
    return (
      tbx.publicacionOferta?.postulaciones?.some(
        (p) => p.desarrollador === this.usuario
      ) ?? false
    );
  }

  isTimeboxAsignado(tbx: Timebox): boolean {
    // Un timebox está asignado solo cuando su estado es "En Ejecución"
    // No cuando el usuario tiene postulaciones aprobadas
    return tbx.estado === 'En Ejecución';
  }

  // --- Acciones --- //

  /**
   * Refresca manualmente el timebox seleccionado
   * Útil para probar después de acciones como rechazar postulaciones
   */
  async refrescarManualmente(): Promise<void> {
    if (!this.timeboxSeleccionado) {
      alert('No hay un Timebox seleccionado para refrescar.');
      return;
    }
    
    await this.refrescarTimeboxSeleccionado();
    alert('Timebox refrescado. Revisa la consola para ver los logs de debug.');
  }

  /**Postular a un timebox */
  postularATimebox(): void {
    if (!this.timeboxSeleccionado) {
      alert('No hay un Timebox seleccionado para postular.');
      return;
    }

    if (!this.usuario) {
      alert(
        'No se pudo identificar al desarrollador. Por favor, inicia sesión.'
      );
      return;
    }

    // Verificar que hay roles seleccionados
    if (!this.hayRolesSeleccionados()) {
      alert('Por favor, selecciona al menos un rol para postular.');
      return;
    }

    const tbx = this.timeboxSeleccionado;
    const formattedDate = new Date();

    // Verificar si ya se postuló a este timebox
    const yaPostuladoGeneralmente =
      tbx.publicacionOferta?.postulaciones?.some(
        (p) => p.desarrollador === this.usuario
      );

    if (yaPostuladoGeneralmente) {
      alert('Ya te has postulado a este Timebox.');
      return;
    }

    // Postular solo a los roles seleccionados
    const rolesParaPostular = this.rolesSeleccionados;
    
    if (rolesParaPostular.length === 0) {
      alert('No hay roles seleccionados para postular en este Timebox.');
      return;
    }

    // Crear postulaciones solo para los roles seleccionados
    const nuevasPostulaciones: Postulacion[] = rolesParaPostular.map(rol => ({
      id: Math.random().toString(36).substr(2, 9), // ID único temporal
      rol: rol,
      desarrollador: this.usuario,
      fechaPostulacion: formattedDate.toISOString(),
      estadoSolicitud: 'Pendiente',
      asignacion: {
        asignado: false,
      },
    }));

    if (!tbx.publicacionOferta) {
      return;
    }

    // Asegurar de que el array de postulaciones exista
    if (!tbx.publicacionOferta.postulaciones) {
      tbx.publicacionOferta.postulaciones = [];
    }

    // Agregar solo las nuevas postulaciones de roles seleccionados al timebox
    tbx.publicacionOferta.postulaciones.push(...nuevasPostulaciones);

    // Marcar 'solicitado' si es la primera postulación del usuario al timebox
    if (
      !tbx.publicacionOferta.solicitado &&
      tbx.publicacionOferta.postulaciones.length > 0
    ) {
      tbx.publicacionOferta.solicitado = true;
    }

    // Actualizar el timebox en el servicio de persistencia
    this.projectService.updateTimebox(tbx.projectId, tbx).subscribe({
      next: (updatedTimebox) => {
        this.timeboxSeleccionado = { ...updatedTimebox }; // Actualizar el seleccionado para la UI
        this.loadTimeboxes(); // Recargar la lista para reflejar los cambios en los filtros
        this.obtenerRolesDisponibles(); // Re-calcular los roles disponibles (para que los roles postulados desaparezcan)
        
        const mensajeExito = `¡Te has postulado con éxito a ${rolesParaPostular.length} rol(es) en este Timebox!`;
        alert(mensajeExito);
      },
      error: (error) => {
        console.error('Error al actualizar timebox:', error);
        alert('Error al postular al Timebox. Inténtalo de nuevo.');
      }
    });
  }

  /**Método para definir si el modal de disponibilidad es para una revisión o un cierre. */
  handleAvailabilityChange(
    timebox: Timebox | null,
    disponibilidad: {
      [key: string]: { start: string; end: string }[];
    }
  ) {
    if (this.modalModo === 'Revision') {
      this.solicitarRevision(timebox, disponibilidad);
    } else if (this.modalModo === 'Cierre') {
      this.solicitarCierre(timebox, disponibilidad);
    } else if (this.modalModo === 'Entrega') {
      this.entregarTimebox(timebox, disponibilidad);
    }
  }

  /**Método para realizar la entrega */
  entregarTimebox(
    tbx: Timebox | null,
    disponibilidad: {
      [key: string]: { start: string; end: string }[];
    }
  ): void {
    if (!tbx) return;
    const filesToUpload = this.selectedFiles[tbx.id]; // Obtiene los archivos con tipo (FileWithType[])

    if (!filesToUpload || filesToUpload.length === 0) {
      alert(
        'Debes adjuntar al menos un archivo para poder entregar el timebox.'
      );
      return;
    }

    const formattedDate = new Date();

    const entregables: Adjuntos[] = filesToUpload.map((fileWithType) => ({
      type: fileWithType.type,
      nombre: fileWithType.file.name,
      url: URL.createObjectURL(fileWithType.file),
      fechaAdjunto: formattedDate.toISOString(),
    }));

    const horarioDisponibilidad: {
      [dia: string]: { bloques: { start: string; end: string }[] };
    } = {};

    for (const dia in disponibilidad) {
      const bloques = disponibilidad[dia];
      if (bloques?.length) {
        horarioDisponibilidad[dia] = {
          bloques: bloques.map((bloque) => ({
            start: bloque.start,
            end: bloque.end,
          })),
        };
      }
    }

    const solicitud: SolicitudRevision = {
      tipo: 'Entrega',
      fechaSolicitud: formattedDate.toISOString(),
      horarioDisponibilidad: horarioDisponibilidad,
      cierreSolicitud: {
        completada: false,
      },
    };

    const entrega: Entrega = {
      id: `${tbx.id}-delivery`,
      fechaEntrega: formattedDate.toISOString(),
      adjuntosEntregables: entregables,
      responsable: this.usuario,
      solicitudRevision: solicitud,
      completada: false,
    };

    this.projectService.updateTimebox(tbx.projectId, {
      ...tbx,
      entrega: entrega,
    }).subscribe({
      next: (updatedTimebox) => {
        this.timeboxSeleccionado = { ...updatedTimebox };
        this.loadTimeboxes();
        console.log('Entrega realizada:', updatedTimebox);
        alert('¡Entrega realizada con éxito!');
        // Limpiar los archivos después de la entrega exitosa
        this.selectedFiles[tbx.id] = [];
        this.selectedDeliverableType = null; // Resetear el tipo seleccionado
        this.closeModalHorario();
      },
      error: (error) => {
        console.error('Error al actualizar el timebox:', error);
        alert('Error al entregar el Timebox. Inténtalo de nuevo.');
      }
    });
  }

  /**Método para solicitar el cierre del timebox */
  solicitarCierre(
    tbx: Timebox | null,
    disponibilidad: {
      [key: string]: { start: string; end: string }[];
    }
  ) {
    if (!tbx) return;

    const evidencesToUpload = this.selectedEvidences[tbx.id];
    if (!evidencesToUpload || evidencesToUpload.length === 0) {
      alert(
        'Debes adjuntar al menos una evidencia para poder cerrar el timebox.'
      );
      return;
    }

    const formattedDate = new Date();

    const horarioDisponibilidad: {
      [dia: string]: { bloques: { start: string; end: string }[] };
    } = {};

    for (const dia in disponibilidad) {
      const bloques = disponibilidad[dia];
      if (bloques?.length) {
        horarioDisponibilidad[dia] = {
          bloques: bloques.map((bloque) => ({
            start: bloque.start,
            end: bloque.end,
          })),
        };
      }
    }

    const solicitud: SolicitudRevision = {
      tipo: 'Cierre',
      fechaSolicitud: formattedDate.toISOString(),
      horarioDisponibilidad: horarioDisponibilidad,
      cierreSolicitud: {
        completada: false,
      },
    };

    const evidencias: Adjuntos[] = evidencesToUpload.map((fileWithType) => ({
      type: fileWithType.type,
      nombre: fileWithType.file.name,
      url: URL.createObjectURL(fileWithType.file),
      fechaAdjunto: formattedDate.toISOString(),
    }));

    this.projectService.updateTimebox(tbx.projectId, {
      ...tbx,
      fases: {
        ...tbx.fases,
        close: {
          ...tbx.fases?.close,
          solicitudCierre: solicitud,
          cumplimiento: 'Parcial',
          adjuntosEvidencias: evidencias,
          completada: false,
          aprobador: tbx.fases.close?.aprobador || '',
          evMadurezAplicativo: tbx.fases.close?.evMadurezAplicativo || '',
          mejoras: tbx.fases.close?.mejoras || [],
        } as any,
      },
    }).subscribe({
      next: (updatedTimebox) => {
        this.timeboxSeleccionado = { ...updatedTimebox };
        this.loadTimeboxes();
        console.log('Solicitud de cierre registrada:', updatedTimebox);
        alert('¡Solicitud de cierre registrada con éxito!');
      },
      error: (error) => {
        console.error('Error al actualizar el timebox:', error);
        alert('Error al solicitar el cierre del Timebox. Inténtalo de nuevo.');
      }
    });

    this.closeModalHorario();
  }

  /**Helper para determinar si el usuario puede solicitar el timebox */
  puedeSolicitarTimebox(tbx: Timebox): boolean {
    return (
      tbx.estado === 'Disponible' &&
      !tbx.fases.kickOff?.teamMovilization.solutionDeveloper?.nombre &&
      !this.getEstadoSolicitado(tbx)
    );
  }

  /** Adjuntar un entregable */
  handleFileInput(event: Event, tbxId: string): void {
    const target = event.target as HTMLInputElement;
    const formattedDate = new Date();
    if (target.files && target.files.length > 0) {
      if (!this.selectedDeliverableType) {
        alert(
          'Por favor, selecciona un tipo de entregable antes de añadir el archivo.'
        );
        target.value = ''; // Limpiar el input file
        return;
      }
      const file = target.files[0];
      if (!this.selectedFiles[tbxId]) {
        this.selectedFiles[tbxId] = [];
      }
      this.selectedFiles[tbxId].push({
        file: file,
        type: this.selectedDeliverableType,
        fechaAdjunto: formattedDate.toISOString(),
      });
      target.value = ''; // Limpiar el input para la próxima carga
      this.selectedDeliverableType = null; // Resetear el tipo seleccionado
    }
  }

  /** Adjuntar una evidencia */
  handleEvidenceInput(event: Event, tbxId: string): void {
    const target = event.target as HTMLInputElement;
    const formattedDate = new Date();

    if (target.files && target.files.length > 0) {
      if (!this.selectedEvidenceType) {
        alert(
          'Por favor, selecciona un tipo de evidencia antes de añadir el archivo.'
        );
        target.value = ''; // Limpiar el input file
        return;
      }
      const file = target.files[0];
      if (!this.selectedEvidences[tbxId]) {
        this.selectedEvidences[tbxId] = [];
      }
      this.selectedEvidences[tbxId].push({
        file: file,
        type: this.selectedEvidenceType,
        fechaAdjunto: formattedDate.toISOString(),
      });
      target.value = ''; // Limpiar el input para la próxima carga
      this.selectedEvidenceType = null; // Resetear el tipo seleccionado
    }
  }

  /**Descargar un adjunto */
  downloadFile(fileUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`Descargando: ${fileName} desde ${fileUrl}`);
  }

  /** Eliminar un adjunto de la colección actual*/
  removeFile(index: number, tbxId: string): void {
    if (this.selectedFiles[tbxId]) {
      this.selectedFiles[tbxId].splice(index, 1);
    }
  }

  /** Eliminar una evidencia */
  removeEvidence(index: number, tbxId: string): void {
    if (this.selectedEvidences[tbxId]) {
      this.selectedEvidences[tbxId].splice(index, 1);
    }
  }

  // --- Revisiones --- //
  openRevisiones = new Set<number>();

  /**Helper para determinar si el usuario puede solicitar una revision */
  puedeSolicitarRevision(tbx: Timebox): boolean {
    return (
      tbx.estado === 'En Ejecución' &&
      tbx.fases.kickOff?.teamMovilization.solutionDeveloper?.nombre ===
        this.usuario
    );
  }

  /**Método para solicitar una nueva revisión */
  solicitarRevision(
    tbx: Timebox | null,
    disponibilidad: {
      [key: string]: { start: string; end: string }[];
    }
  ) {
    if (!tbx) return;

    const formattedDate = new Date();

    const horarioDisponibilidad: {
      [dia: string]: { bloques: { start: string; end: string }[] };
    } = {};

    for (const dia in disponibilidad) {
      const bloques = disponibilidad[dia];
      if (bloques?.length) {
        horarioDisponibilidad[dia] = {
          bloques: bloques.map((bloque) => ({
            start: bloque.start,
            end: bloque.end,
          })),
        };
      }
    }

    const solicitud: SolicitudRevision = {
      tipo: 'Revision',
      fechaSolicitud: formattedDate.toISOString(),
      horarioDisponibilidad: horarioDisponibilidad,
      cierreSolicitud: {
        completada: false,
        fechaDeRealizacion: '',
      },
    };

    const currentRevisions = tbx.fases.refinement?.revisiones
      ? [...tbx.fases.refinement.revisiones]
      : [];
    currentRevisions.push(solicitud);

    this.projectService.updateTimebox(tbx.projectId, {
      ...tbx,
      fases: {
        ...tbx.fases,
        refinement: {
          ...tbx.fases.refinement,
          revisiones: currentRevisions,
          completada: false,
        },
      },
    }).subscribe({
      next: (updatedTimebox) => {
        this.timeboxSeleccionado = { ...updatedTimebox };
        this.loadTimeboxes();
        console.log('Solicitud de revisión exitosa', updatedTimebox);
      },
      error: (error) => {
        console.error('Error al actualizar el timebox:', error);
        alert('Error al solicitar revisión. Inténtalo de nuevo.');
      }
    });

    this.closeModalHorario();
  }

  modificarHorarioRevision(
    horario: SolicitudRevision['horarioDisponibilidad']
  ) {
    console.log(horario);
  }

  toggleRevision(i: number) {
    if (this.openRevisiones.has(i)) {
      this.openRevisiones.delete(i);
    } else {
      this.openRevisiones.add(i);
    }
  }

  showInformation = false;
  toggleTbxInformation() {
    this.showInformation = !this.showInformation;
  }

  isInformationOpen(): boolean {
    return this.showInformation ? true : false;
  }

  isRevisionOpen(i: number): boolean {
    return this.openRevisiones.has(i);
  }

  abrirModalRevision() {
    this.modalModo = 'Revision';
    this.showModalHorario = true;
    this.cerrarModalConfirmacion();
  }

  //--- Entrega ---//
  abrirModalEntrega() {
    (this.modalModo = 'Entrega'), (this.showModalHorario = true);
    this.cerrarModalConfirmacion();
  }

  // --- Cierre --- //

  abrirModalCierre() {
    this.modalModo = 'Cierre';
    this.showModalHorario = true;
    this.cerrarModalConfirmacion();
  }

  closeModalHorario() {
    this.showModalHorario = false;
    this.disponibilidadRevision = {};
    this.disponibilidadCierre = {};
  }

  abrirModalConfirmacion(
    tbx: Timebox,
    modo: 'Revision' | 'Entrega' | 'Cierre'
  ): void {
    this.tbxaEntregar = tbx;
    this.showModalConfirmacion = true;
    this.operacion = modo;
  }

  cerrarModalConfirmacion(): void {
    this.showModalConfirmacion = false;
    this.tbxaEntregar = null;
  }

  showModalCobro = false;

  abrirModalCobro() {
    this.showModalCobro = true;
  }
  closeModalCobro() {
    this.showModalCobro = false;
  }
}
