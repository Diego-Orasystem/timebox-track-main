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
interface FileWithType {
  file: File;
  type: string;
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
  usuario = 'Juan Pérez';

  timeboxes: Timebox[] = [];
  timeboxesFiltrados: Timebox[] = [];
  timeboxSeleccionado: Timebox | null = null;

  // Propiedades para manejar la postulación de roles
  rolesDisponibles: string[] = []; // Para almacenar los nombres de los roles
  rolSeleccionadoParaPostular: string | null = null;

  filterState: 'Disponible' | 'Solicitado' | 'Asignado' | 'Finalizado' =
    'Disponible';
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
  modalModo: 'Revision' | 'Cierre' = 'Revision';
  tbxaEntregar: Timebox | null = null;
  showModalConfirmacion = false;

  constructor(
    private timeboxPublicoService: TimeboxService,
    private projectService: ProjectService,
    private timeboxTypeService: TimeboxTypeService
  ) {}

  ngOnInit(): void {
    this.loadTimeboxes();
  }

  // --- Timebox --- //

  /**Cargar todos los timeboxes */
  loadTimeboxes(): void {
    this.timeboxPublicoService.getPublishedTimeboxes().subscribe({
      next: (timeboxes) => {
        this.timeboxes = timeboxes;
        this.applyFilters();
        console.log('Timeboxes Publicados cargados:', this.timeboxes);
      },
      error: (error) => {
        console.error('Error cargando timeboxes:', error);
        this.timeboxes = [];
        this.applyFilters();
      }
    });
  }

  /** Aplicar filtros */
  applyFilters(): void {
    let filtrados = [...this.timeboxes];

    switch (this.filterState) {
      case 'Disponible':
        filtrados = filtrados.filter(
          (s) =>
            s.estado === 'Disponible' &&
            (!s.fases?.kickOff?.teamMovilization?.solutionDeveloper?.nombre ||
              s.fases?.kickOff?.teamMovilization?.solutionDeveloper?.nombre ===
                '') &&
            !s.publicacionOferta?.postulaciones?.some(
              (p) => p.desarrollador === this.usuario
            )
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
          (s) =>
            s.estado === 'Finalizado' &&
            s.fases?.kickOff?.teamMovilization.solutionDeveloper?.nombre ===
              this.usuario
        );
        break;
    }

    if (this.filterSkill) {
      filtrados = filtrados.filter((timebox) =>
        timebox.fases.planning?.skills?.some(
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
    this.rolSeleccionadoParaPostular =
      this.rolesDisponibles.length > 0 ? this.rolesDisponibles[0] : null;
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
    return tbx.fases?.refinement?.revisiones;
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
    if (date == undefined) return '';
    const dateToDate = new Date(date);
    return formatDate(dateToDate);
  }

  /**Obtener roles disponibles para postulación */
  obtenerRolesDisponibles(): void {
    this.rolesDisponibles = []; // Resetear la lista

    if (this.timeboxSeleccionado) {
      let teamMovilization: TeamMovilization = this.timeboxSeleccionado.fases
        .kickOff?.teamMovilization as TeamMovilization;

      if (!teamMovilization) {
        teamMovilization = {
          businessAdvisor: {
            nombre: '',
          },
          businessAmbassador: {
            nombre: '',
          },
          solutionDeveloper: {
            nombre: '',
          },
          solutionTester: {
            nombre: '',
          },
          technicalAdvisor: {
            nombre: '',
          },
        };
      } else {
        teamMovilization = {
          businessAdvisor: {
            nombre: '',
          },
          businessAmbassador: {
            nombre: '',
          },
          solutionDeveloper: {
            nombre: '',
          },
          solutionTester: {
            nombre: '',
          },
          technicalAdvisor: {
            nombre: '',
          },
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
        // Si el rol es `null` o una cadena vacía, significa que no está asignado.
        // Y el usuario actual no se ha postulado ya a este rol en específico.
        const yaPostuladoARolEspecifico =
          this.timeboxSeleccionado?.publicacionOferta?.postulaciones?.some(
            (p) => p.desarrollador === this.usuario && p.rol === roleKey
          );

        if (
          (roleValue.nombre === null || roleValue.nombre === '') &&
          !yaPostuladoARolEspecifico
        ) {
          this.rolesDisponibles.push(roleKey);
        }
      });

      // Selecciona el primer rol disponible por defecto si hay alguno
      this.rolSeleccionadoParaPostular =
        this.rolesDisponibles.length > 0 ? this.rolesDisponibles[0] : null;
    }
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
    return (
      tbx.publicacionOferta?.postulaciones?.some(
        (p) => p.desarrollador === this.usuario
      ) ?? false
    );
  }

  /**Determinar si un timebox fue asignado */
  getTimeboxAsignado(tbx: Timebox): boolean {
    return (
      tbx.publicacionOferta?.postulaciones?.some(
        (p) => p.asignacion.asignado == true
      ) ?? false
    );
  }

  // --- Acciones --- //

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

    const tbx = this.timeboxSeleccionado;
    const formattedDate = new Date();

    let rolAPostular: string;
    let mensajeExito: string;

    // Si se ha seleccionado un rol en el dropdown
    if (
      this.rolSeleccionadoParaPostular &&
      this.rolSeleccionadoParaPostular !== 'null'
    ) {
      // Asegurarse de que no sea null string
      rolAPostular = this.rolSeleccionadoParaPostular;
      mensajeExito = `¡Te has postulado con éxito al rol de ${rolAPostular} en este Timebox!`;

      // Verificar si ya se postuló a este rol específico
      const yaPostuladoARolEspecifico =
        tbx.publicacionOferta?.postulaciones?.some(
          (p) => p.desarrollador === this.usuario && p.rol === rolAPostular
        );

      if (yaPostuladoARolEspecifico) {
        alert(`Ya te has postulado al rol de ${rolAPostular} en este Timebox.`);
        return;
      }
    } else {
      // Si no se seleccionó un rol (o no hay roles disponibles para seleccionar), es una postulación general
      rolAPostular = 'Interesado General';

      // Verificar si ya se postuló de forma general
      const yaPostuladoGeneralmente =
        tbx.publicacionOferta?.postulaciones?.some(
          (p) =>
            p.desarrollador === this.usuario && p.rol === 'Interesado General'
        );

      if (yaPostuladoGeneralmente) {
        alert('Ya te has postulado a este Timebox de forma general.');
        return;
      }
    }

    // Crea la nueva postulación
    const nuevaPostulacion: Postulacion = {
      id: '1',
      rol: rolAPostular,
      desarrollador: this.usuario,
      fechaPostulacion: formattedDate.toISOString(),
      estadoSolicitud: 'Pendiente',
      asignacion: {
        asignado: false,
      },
    };

    if (!tbx.publicacionOferta) {
      return;
    }

    // Asegurar de que el array de postulaciones exista
    if (!tbx.publicacionOferta.postulaciones) {
      tbx.publicacionOferta.postulaciones = [];
    }

    // Agrega la nueva postulación al timebox
    tbx.publicacionOferta.postulaciones.push(nuevaPostulacion);

    // Marcar 'solicitado' si es la primera postulación del usuario al timebox
    if (
      !tbx.publicacionOferta.solicitado &&
      tbx.publicacionOferta.postulaciones.length > 0
    ) {
      tbx.publicacionOferta.solicitado = true;
    }

    // Actualizar el timebox en el servicio de persistencia
    this.projectService.updateTimebox(tbx.projectId, tbx).subscribe({
      next: (updatedTimebox: Timebox) => {
        this.timeboxSeleccionado = { ...updatedTimebox }; // Actualizar el seleccionado para la UI
        this.loadTimeboxes(); // Recargar la lista para reflejar los cambios en los filtros
        this.obtenerRolesDisponibles(); // Re-calcular los roles disponibles (para que el rol postulado desaparezca)
        alert(mensajeExito);
      },
      error: (error: any) => {
        console.error('Error al postular al Timebox:', error);
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
    }
  }

  /**Método para realizar la entrega */
  entregarTimebox(tbx: Timebox): void {
    const filesToUpload = this.selectedFiles[tbx.id]; // Obtiene los archivos con tipo (FileWithType[])
    const evidencesToUpload = this.selectedEvidences[tbx.id];
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
    }));

    const evidencias: Adjuntos[] = evidencesToUpload.map((fileWithType) => ({
      type: fileWithType.type,
      nombre: fileWithType.file.name,
      url: URL.createObjectURL(fileWithType.file),
    }));

    const entrega: Entrega = {
      id: `${tbx.id}-${formattedDate}`,
      fechaEntrega: formattedDate.toISOString(),
      adjuntosEntregables: entregables,
      adjuntosEvidencias: evidencias,
      responsable: this.usuario,
    };

    this.projectService.updateTimebox(tbx.projectId, {
      ...tbx,
      entrega: entrega,
    }).subscribe({
      next: (updatedTimebox: Timebox) => {
        this.timeboxSeleccionado = { ...updatedTimebox };
        this.loadTimeboxes();
        console.log('Entrega realizada:', updatedTimebox);
        alert('¡Entrega realizada con éxito!');
        // Limpiar los archivos después de la entrega exitosa
        this.selectedFiles[tbx.id] = [];
        this.selectedDeliverableType = null; // Resetear el tipo seleccionado
      },
      error: (error: any) => {
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
      completada: false,
    };

    this.projectService.updateTimebox(tbx.projectId, {
      ...tbx,
      fases: {
        ...tbx.fases,
        close: {
          ...tbx.fases?.close,
          solicitudCierre: solicitud,
          cumplimiento: 'Parcial',
          completada: false,
          aprobador: tbx.fases.close?.aprobador || '',
          evMadurezAplicativo: tbx.fases.close?.evMadurezAplicativo || '',
          mejoras: tbx.fases.close?.mejoras || [],
        } as any,
      },
    }).subscribe({
      next: (updatedTimebox: Timebox) => {
        this.timeboxSeleccionado = { ...updatedTimebox };
        this.loadTimeboxes();
        console.log('Solicitud de cierre registrada:', updatedTimebox);
        alert('¡Solicitud de cierre registrada con éxito!');
      },
      error: (error: any) => {
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
      });
      target.value = ''; // Limpiar el input para la próxima carga
      this.selectedDeliverableType = null; // Resetear el tipo seleccionado
    }
  }

  /** Adjuntar una evidencia */
  handleEvidenceInput(event: Event, tbxId: string): void {
    const target = event.target as HTMLInputElement;
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
      completada: false,
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
      next: (updatedTimebox: Timebox) => {
        this.timeboxSeleccionado = { ...updatedTimebox };
        this.loadTimeboxes();
        console.log('Solicitud de revisión exitosa', updatedTimebox);
      },
      error: (error: any) => {
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

  isRevisionOpen(i: number): boolean {
    return this.openRevisiones.has(i);
  }

  abrirModalRevision() {
    this.modalModo = 'Revision';
    this.showModalHorario = true;
  }

  // --- Cierre --- //

  abrirModalCierre() {
    this.modalModo = 'Cierre';
    this.showModalHorario = true;
  }

  closeModalHorario() {
    this.showModalHorario = false;
    this.disponibilidadRevision = {};
    this.disponibilidadCierre = {};
  }

  abrirModalConfirmacion(tbx: Timebox): void {
    this.tbxaEntregar = tbx;
    this.showModalConfirmacion = true;
  }

  cerrarModalConfirmacion(): void {
    this.showModalConfirmacion = false;
    this.tbxaEntregar = null;
  }

  confirmarEntregaTimebox(): void {
    if (this.tbxaEntregar) {
      this.entregarTimebox(this.tbxaEntregar);
      this.cerrarModalConfirmacion();
    }
  }
}
