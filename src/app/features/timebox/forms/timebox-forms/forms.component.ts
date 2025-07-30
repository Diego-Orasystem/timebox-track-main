import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormArray,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
// Importa tus componentes de fase
import { PlanningComponent } from './steps-forms/planning/planning.component';
import { KickoffComponent } from './steps-forms/kickoff/kickoff.component';
import { RefinementComponent } from './steps-forms/refinement/refinement.component';
import { QaComponent } from './steps-forms/qa/qa.component';
import { CloseComponent } from './steps-forms/close/close.component';

// Importa tus interfaces
import { Timebox } from '../../../../shared/interfaces/timebox.interface';
import { formatDate } from '../../../../shared/helpers/date-formatter'; // Asegúrate de que esta ruta sea correcta
import {
  Persona,
  Adjuntos,
  Checklist,
  Mejora,
  Skill,
  SolicitudRevision,
} from '../../../../shared/interfaces/fases-timebox.interface';

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PlanningComponent,
    KickoffComponent,
    RefinementComponent,
    QaComponent,
    CloseComponent,
  ],
  templateUrl: './forms.component.html',
})
export class FormsComponent implements OnInit {
  form!: FormGroup;

  @Input() steps!: { name: string; completed: boolean }[];
  @Input() currentStepIndex = 0;
  @Input() mode: 'create' | 'read' | 'edit' = 'create'; // Recibe el modo del padre
  @Input() role: 'admin' | 'dev' = 'admin';

  @Input() timeboxData: Timebox = {} as Timebox; // Recibe el Timebox completo del padre

  showConfirmModal: boolean = false;
  phaseToConfirmName: string = '';

  @Output() formSubmit = new EventEmitter<Timebox>(); // Emite el Timebox completo
  @Output() stepCompleted = new EventEmitter<number>();
  @Output() stepChange = new EventEmitter<number>();

  isTimeboxPublished: boolean = false; // Indica si el Timebox ya ha sido publicado

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.createForm();

    if (this.timeboxData && this.timeboxData.id) {
      this.patchFormValues(this.timeboxData);
      // Inicializa el estado de publicación al cargar el Timebox
      this.isTimeboxPublished =
        this.timeboxData.publicacionOferta?.publicado || false;
      if (this.mode === 'read') {
        this.form.disable();
      }
    }
  }

  //--- Formulario padre ---//

  /**Inicializa el parent form de las fases del timebox */
  createForm() {
    this.form = this.fb.group({
      tipoTimebox: [''],
      businessAnalyst: [''],
      estado: [''],
      planning: this.fb.group({
        nombre: [''],
        codigo: [''],
        descripcion: [''],
        tipoTimebox: [''],
        eje: [''],
        aplicativo: [''],
        alcance: [''],
        esfuerzo: [''],
        fechaInicio: [''],
        teamLeader: [''],
        adjuntos: this.fb.array([]),
        skills: this.fb.array([]),
        cumplimiento: this.fb.array([]),
        completada: [false],
        fechaFase: [''],
      }),
      kickOff: this.fb.group({
        teamMovilization: this.fb.group({
          businessAmbassador: [null],
          solutionDeveloper: [null],
          solutionTester: [null],
          businessAdvisor: [null],
          technicalAdvisor: [null],
        }),
        adjuntos: this.fb.array([]),
        participantes: this.fb.array([]),
        listaAcuerdos: this.fb.array([]),
        completada: [false],
        fechaFase: [''],
      }),
      refinement: this.fb.group({
        revisiones: this.fb.array([this.createRevisionGroup()]),
        fechaFase: [''],
        completada: [false],
      }),
      entrega: this.fb.group({
        id: [''],
        fechaEntrega: ['', Validators.required],
        responsable: ['', Validators.required],
        participantes: this.fb.array([]),
        adjuntosEntregables: this.fb.array([]),
        adjuntosEvidencias: this.fb.array([]),
        observaciones: [''],
      }),
      qa: this.fb.group({
        fechaFase: [''],
        // Estado General de la Consolidación
        estadoConsolidacion: ['Pendiente', Validators.required], // Ej: 'Pendiente', 'En Progreso', 'Completado', 'Bloqueado'
        progresoConsolidacion: [0, [Validators.min(0), Validators.max(100)]], // 0-100%

        // Detalles del Despliegue (Deployment)
        fechaPreparacionEntorno: [null], // Usar null para fechas si no están seleccionadas
        entornoPruebas: [''], // Ej: 'Staging', 'Pre-producción'
        versionDespliegue: [''],
        responsableDespliegue: [''],
        observacionesDespliegue: [''], // Para texto largo (párrafos)

        // Detalles del Testing
        planPruebasUrl: [''], // URL a un Confluence, Jira, etc.
        resultadosPruebas: [''], // Resumen de los resultados, ej: '150/160 casos de prueba OK'
        bugsIdentificados: [''], // Conteo o referencia, ej: '5 abiertos, 2 críticos'
        urlBugs: [''], // URL al sistema de gestión de incidencias (Jira, Bugzilla, etc.)
        responsableQA: [''],

        // Pruebas de Aceptación de Usuario (UAT)
        fechaInicioUAT: [null],
        fechaFinUAT: [null],
        estadoUAT: ['Pendiente'], // Ej: 'Pendiente', 'En Progreso', 'Aprobado', 'Rechazado'
        responsableUAT: [''],
        feedbackUAT: [''], // Para texto largo (párrafos)

        // Adjuntos relacionados con QA (Reportes, Actas, etc.)
        adjuntosQA: this.fb.array([]), // Un FormArray para manejar múltiples archivos
        completada: [false],
      }),
      close: this.fb.group({
        adjuntos: this.fb.array([]),
        checklist: this.fb.array([]),
        cumplimiento: ['Total'],
        observaciones: [''],
        aprobador: [null],
        evMadurezAplicativo: [''],
        mejoras: this.fb.array([]),
        solicitudCierre: this.createRevisionGroup(), // Si es un FormGroup y no un FormArray
        completada: [false],
        fechaFase: [''],
      }),
      publicacionOferta: this.fb.group({
        solicitado: [false],
        publicado: [false],
        fechaPublicacion: [''],
        postulaciones: this.fb.array([]),
      }),
    });
  }
  /**Patchea los valores del form al recibir un timebox existente */
  patchFormValues(timebox: Timebox): void {
    this.resetFormArrays(); // Limpia los FormArrays antes de rellenarlos
    
    console.log('🔍 Parchando formulario con timebox:', timebox);
    
    // Mapear campos del backend al formulario
    this.form.get('tipoTimebox')?.patchValue(timebox.tipoTimebox || timebox.tipo_timebox_id);
    this.form.get('estado')?.patchValue(timebox.estado);
    
    // Si hay datos de fases, usarlos; si no, inicializar con datos básicos
    if (timebox.fases) {
      this.form.get('planning')?.patchValue(timebox.fases.planning || {});
      this.form.get('kickOff')?.patchValue(timebox.fases.kickOff || {});
      this.form.get('refinement')?.patchValue(timebox.fases.refinement || {});
      this.form.get('qa')?.patchValue(timebox.fases.qa || {});
      this.form.get('close')?.patchValue(timebox.fases.close || {});
    } else {
      // Inicializar con datos básicos del timebox
      const basicPlanningData = {
        nombre: timebox.tipo_nombre || '',
        codigo: '',
        descripcion: timebox.tipo_definicion || '',
        tipoTimebox: timebox.tipo_timebox_id || timebox.tipoTimebox,
        eje: '',
        aplicativo: '',
        alcance: '',
        esfuerzo: '',
        fechaInicio: '',
        teamLeader: '',
        adjuntos: [],
        skills: [],
        cumplimiento: [],
        completada: false
      };
      this.form.get('planning')?.patchValue(basicPlanningData);
    }
    
    if (timebox.entrega) {
      this.form.get('entrega')?.patchValue(timebox.entrega || {});
    }

    // Llenar FormArrays específicos para cada fase.
    if (timebox.fases?.planning) {
      const planningGroup = this.form.get('planning') as FormGroup;
      timebox.fases.planning.adjuntos?.forEach((adj) =>
        (planningGroup.get('adjuntos') as FormArray).push(
          this.createAdjuntoGroup(adj)
        )
      );
      timebox.fases.planning.skills?.forEach((skill) =>
        (planningGroup.get('skills') as FormArray).push(
          this.createSkillGroup(skill)
        )
      );
      timebox.fases.planning.cumplimiento?.forEach((check) =>
        (planningGroup.get('cumplimiento') as FormArray).push(
          this.createChecklistGroup(check)
        )
      );
    }

    if (timebox.fases?.kickOff) {
      const kickoffGroup = this.form.get('kickOff') as FormGroup;
      timebox.fases.kickOff.adjuntos?.forEach((adj) =>
        (kickoffGroup.get('adjuntos') as FormArray).push(
          this.createAdjuntoGroup(adj)
        )
      );
      timebox.fases.kickOff.participantes?.forEach((part) =>
        (kickoffGroup.get('participantes') as FormArray).push(
          this.createPersonaGroup(part)
        )
      );
      timebox.fases.kickOff.listaAcuerdos?.forEach((acuerdo) =>
        (kickoffGroup.get('listaAcuerdos') as FormArray).push(
          this.createChecklistGroup(acuerdo)
        )
      );
    }

    if (timebox.fases?.refinement) {
      const refinementGroup = this.form.get('refinement') as FormGroup;

      while ((refinementGroup.get('revisiones') as FormArray)?.length > 0) {
        (refinementGroup.get('revisiones') as FormArray).removeAt(0);
      }

      if (
        timebox.fases.refinement.revisiones &&
        timebox.fases.refinement.revisiones.length > 0
      ) {
        timebox.fases.refinement.revisiones.forEach((rev) =>
          (refinementGroup.get('revisiones') as FormArray).push(
            this.createRevisionGroup(rev)
          )
        );
      } else if (
        (refinementGroup.get('revisiones') as FormArray).length === 0
      ) {
        (refinementGroup.get('revisiones') as FormArray).push(
          this.createRevisionGroup()
        );
      }

      const revisionesFormArray = refinementGroup.get(
        'revisiones'
      ) as FormArray;

      timebox.fases.refinement.revisiones?.forEach((rev, indexRevision) => {
        // Asegúrate de que el FormGroup de la revisión actual exista antes de intentar acceder a sus propiedades
        const currentRevisionFormGroup = revisionesFormArray.at(
          indexRevision
        ) as FormGroup;

        if (currentRevisionFormGroup) {
          while (
            (currentRevisionFormGroup.get('adjuntos') as FormArray)?.length > 0
          ) {
            (currentRevisionFormGroup.get('adjuntos') as FormArray).removeAt(0);
          }
          while (
            (currentRevisionFormGroup.get('participantes') as FormArray)
              ?.length > 0
          ) {
            (
              currentRevisionFormGroup.get('participantes') as FormArray
            ).removeAt(0);
          }
          while (
            (currentRevisionFormGroup.get('listaAcuerdos') as FormArray)
              ?.length > 0
          ) {
            (
              currentRevisionFormGroup.get('listaAcuerdos') as FormArray
            ).removeAt(0);
          }

          if (rev.adjuntos && rev.adjuntos.length > 0) {
            const adjuntosFormArray = currentRevisionFormGroup.get(
              'adjuntos'
            ) as FormArray;
            rev.adjuntos.forEach((adj) => {
              adjuntosFormArray.push(this.createAdjuntoGroup(adj));
            });
          }

          if (rev.participantes && rev.participantes.length > 0) {
            const participantesFormArray = currentRevisionFormGroup.get(
              'participantes'
            ) as FormArray;
            rev.participantes.forEach((part) => {
              participantesFormArray.push(this.createPersonaGroup(part));
            });
          }

          if (rev.listaAcuerdos && rev.listaAcuerdos.length > 0) {
            const listaAcuerdosFormArray = currentRevisionFormGroup.get(
              'listaAcuerdos'
            ) as FormArray;
            rev.listaAcuerdos.forEach((acuerdo) => {
              listaAcuerdosFormArray.push(this.createChecklistGroup(acuerdo));
            });
          }
        }
      });
    }

    if (timebox.fases?.qa) {
      const qaGroup = this.form.get('qa') as FormGroup; // Obtienes el FormGroup 'qa'

      qaGroup.patchValue(timebox.fases.qa); // Parchea los valores directamente

      // Manejo del FormArray adjuntosQA
      const adjuntosQAFormArray = qaGroup.get('adjuntosQA') as FormArray;
      adjuntosQAFormArray.clear(); // Limpia los adjuntos existentes

      if (
        timebox.fases.qa.adjuntosQA &&
        timebox.fases.qa.adjuntosQA.length > 0
      ) {
        timebox.fases.qa.adjuntosQA.forEach((adjunto) => {
          adjuntosQAFormArray.push(
            this.fb.group({
              nombre: [adjunto.nombre],
              url: [adjunto.url],
              type: [adjunto.type],
            })
          );
        });
      }
    }

    if (timebox.fases?.close) {
      const closeGroup = this.form.get('close') as FormGroup;
      timebox.fases.close.adjuntos?.forEach((adj) =>
        (closeGroup.get('adjuntos') as FormArray).push(
          this.createAdjuntoGroup(adj)
        )
      );
      timebox.fases.close.checklist?.forEach((check) =>
        (closeGroup.get('checklist') as FormArray).push(
          this.createChecklistGroup(check)
        )
      );
      timebox.fases.close.mejoras?.forEach((mejora) =>
        (closeGroup.get('mejoras') as FormArray).push(
          this.createMejoraGroup(mejora)
        )
      );
      if (timebox.fases.close.solicitudCierre) {
        (closeGroup.get('solicitudCierre') as FormGroup).patchValue(
          timebox.fases.close.solicitudCierre
        );
      }
    }

    if (timebox.entrega) {
      const entregaGroup = this.form.get('entrega') as FormGroup;
      timebox.entrega.participantes?.forEach((part) =>
        (entregaGroup.get('participantes') as FormArray).push(
          this.createPersonaGroup(part)
        )
      );
      timebox.entrega.adjuntosEntregables?.forEach((adj) =>
        (entregaGroup.get('adjuntosEntregables') as FormArray).push(
          this.createAdjuntoGroup(adj)
        )
      );
      timebox.entrega.adjuntosEvidencias?.forEach((adj) =>
        (entregaGroup.get('adjuntosEvidencias') as FormArray).push(
          this.createAdjuntoGroup(adj)
        )
      );
    }
  }
  /**Helper Resetea los arrays del form */
  private resetFormArrays(): void {
    // Claves del formulario que corresponden a los grupos de fase/entrega
    const formGroupKeys = [
      'planning',
      'kickOff',
      'refinement',
      'qa',
      'close',
      'entrega',
    ];

    const arraysToClearByGroup: { [key: string]: string[] } = {
      planning: ['adjuntos', 'skills', 'cumplimiento'],
      kickOff: ['adjuntos', 'participantes', 'listaAcuerdos'],
      refinement: ['revisiones', 'participantes', 'adjuntos', 'listaAcuerdos'],
      close: ['adjuntos', 'checklist', 'mejoras'],
      entrega: ['participantes', 'adjuntosEntregables', 'adjuntosEvidencias'],
    };

    formGroupKeys.forEach((groupKey) => {
      const group = this.form.get(groupKey) as FormGroup;
      if (group && arraysToClearByGroup[groupKey]) {
        arraysToClearByGroup[groupKey].forEach((arrayName) => {
          const formArray = group.get(arrayName) as FormArray;
          if (formArray) {
            formArray.clear();
            // Para 'refinement.revisiones', asegura al menos uno después de limpiar
            if (groupKey === 'refinement' && arrayName === 'revisiones') {
              formArray.push(this.createRevisionGroup());
            }
          }
        });
      }
    });
  }
  /**Resetea y limpia el formulario padre */
  resetForm(): void {
    this.form.reset();
    this.resetFormArrays(); // Limpia los FormArrays y los reinicializa si es necesario

    // Restablece valores por defecto para los controles específicos de fase en la raíz
    this.form.get('planning')?.patchValue({ completada: false, fechaFase: '' });
    this.form.get('kickOff')?.patchValue({ completada: false, fechaFase: '' });
    this.form.get('refinement')?.patchValue({
      completada: false,
      fechaFase: '',
    });
    this.form.get('qa')?.patchValue({ completada: false, fechaFase: '' });
    this.form.get('close')?.patchValue({
      cumplimiento: 'Total',
      completada: false,
      fechaFase: '',
    });
    // entrega no tiene 'completada' en tu interfaz
    console.log('FormsComponent: Form reset to initial state.');
  }

  //--- Helpers para crear grupos del formulario ---//

  /**Crea un grupo para una revisión */
  private createRevisionGroup(revision?: SolicitudRevision): FormGroup {
    return this.fb.group({
      tipo: [revision?.tipo || 'Revision'],
      fechaSolicitud: [revision?.fechaSolicitud || ''],
      participantes: this.fb.array([]),
      adjuntos: this.fb.array([]),
      listaAcuerdos: this.fb.array([]),
      completada: [revision?.completada || false],
    });
  }
  /**Método para actualizar la publicación de la oferta */
  private updatePublicacionOfertaStatus(publicar: boolean): void {
    const publicacionOfertaControl = this.form.get(
      'publicacionOferta'
    ) as FormGroup;
    const fechaPub = new Date();

    if (publicar && !publicacionOfertaControl.get('publicado')?.value) {
      publicacionOfertaControl.patchValue({
        solicitado: false, // Asumiendo que publicar implica que fue solicitado
        publicado: true,
        fechaPublicacion: fechaPub.toISOString(),
      });
      this.isTimeboxPublished = true; // Actualiza la bandera local
    } else if (!publicar && publicacionOfertaControl.get('publicado')?.value) {
      // Opción para despublicar, si fuera necesario, o simplemente no hacer nada si ya está publicado
      // Por ahora, solo nos interesa publicarlo.
    }
  }
  /**Crea un grupo para una postulación */
  private createPostulacionGroup(): FormGroup {
    return this.fb.group({
      fechaPostulacion: [''],
      desarrollador: [''],
    });
  }
  /**Crea un grupo de persona */
  private createPersonaGroup(persona?: Persona): FormGroup {
    return this.fb.group({
      persona: [persona?.nombre || ''],
      rol: [persona?.rol || ''],
      email: [persona?.email || ''],
    });
  }
  /**Crea un grupo para adjuntos */
  private createAdjuntoGroup(adjunto?: Adjuntos): FormGroup {
    return this.fb.group({
      type: [adjunto?.type || 'archivo'],
      nombre: [adjunto?.nombre || ''],
      url: [adjunto?.url || ''],
    });
  }
  /**Crea un grupo para skills */
  private createSkillGroup(skill?: Skill): FormGroup {
    return this.fb.group({
      tipo: [skill?.tipo || ''],
      nombre: [skill?.nombre || ''],
    });
  }
  /**Crea un grupo para un checklist */
  private createChecklistGroup(item?: Checklist): FormGroup {
    return this.fb.group({
      label: [item?.label || ''],
      checked: [item?.checked || false],
    });
  }
  /**Crea un grupo para mejoras */
  private createMejoraGroup(mejora?: Mejora): FormGroup {
    return this.fb.group({
      tipo: [mejora?.tipo || ''],
      descripcion: [mejora?.descripcion || ''],
    });
  }

  //--- Helpers ---//

  /**
   * Verifica si existen roles no asignados en la fase de KickOff
   * basándose en los valores actuales del formulario.
   */
  private areAllKickOffRolesAssigned(): boolean {
    const teamMovilization = this.form.get('kickOff.teamMovilization')?.value;
    if (!teamMovilization) {
      return false; // Si el FormGroup no existe o es nulo, no se han asignado roles
    }

    const roles = [
      'businessAmbassador',
      'solutionDeveloper',
      'solutionTester',
      'businessAdvisor',
      'technicalAdvisor',
    ];
    // Retorna true si TODOS los roles tienen un valor (no null, no cadena vacía)
    return roles.every((role) => {
      const assignedPerson = teamMovilization[role];
      return (
        assignedPerson !== null &&
        assignedPerson !== '' &&
        (typeof assignedPerson !== 'object' || assignedPerson.nombre)
      );
    });
  }

  /** Helper para definir el texto del botón principal del formulario */
  buttonText(): string {
    const currentStepName =
      this.steps[this.currentStepIndex].name.toLowerCase();
    const phaseKey = this.getPhaseKeyFromStepName(currentStepName);
    const currentStepFormGroup = this.form.get(phaseKey) as FormGroup;
    const isPhaseCompleted =
      phaseKey !== 'entrega'
        ? currentStepFormGroup?.get('completada')?.value || false
        : false;

    if (this.currentStepIndex === this.getPlanningStepIndex()) {
      return this.timeboxData && this.timeboxData.id
        ? 'Guardar Cambios'
        : 'Guardar Timebox';
    }

    if (this.currentStepIndex === this.getKickOffStepIndex()) {
      // En KickOff, el botón puede ser "Guardar y Publicar" o "Completar Fase y Publicar"
      // Si ya está publicado, simplemente "Guardar Cambios"
      if (this.isTimeboxPublished) {
        return 'Guardar Cambios';
      }
      // Si no está publicado, pero se pueden asignar roles y publicar la oferta
      return 'Guardar y Publicar';
    }

    // Para otras fases:
    if (isPhaseCompleted) {
      return 'Guardar Cambios'; // Si la fase ya está completada, solo permite guardar cambios.
    }

    // Si es el último paso y no está completado, el botón es "Completar Fase".
    if (this.currentStepIndex === this.steps.length - 1 && !isPhaseCompleted) {
      return 'Completar Fase';
    }

    // Por defecto para otras fases no completadas.
    return 'Completar Fase';
  }
  /** Helper para mapear nombres de pasos a claves de formulario/interfaz */
  private getPhaseKeyFromStepName(stepName: string): string {
    switch (stepName) {
      case 'kickoff':
        return 'kickOff'; // Corrección de camelCase
      case 'entrega': // Cambiado de 'Entrega' para consistencia con toLowerCase
        return 'entrega';
      case 'cierre':
        return 'close'; // Si 'cierre' es el nombre del paso en tu stepper
      default:
        return stepName; // planning, refinement, qa ya coinciden
    }
  }
  /** Helper para determinar si el paso actual es la fase planning */
  getPlanningStepIndex(): number {
    return this.steps.findIndex((s) => s.name.toLowerCase() === 'planning');
  }
  /** Helper para determinar si el paso actual es la fase kick off */
  getKickOffStepIndex(): number {
    return this.steps.findIndex(
      (step) => step.name.toLowerCase() === 'kickoff'
    );
  }

  /** Función para avanzar un paso en el stepper.
   * Esta función ahora es PRIVADA y solo se llama cuando se decide avanzar.
   */
  private emitirPasoAStepper(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.stepChange.emit(this.currentStepIndex);
      this.stepCompleted.emit(this.currentStepIndex);
    }
  }

  // --- Lógica del Botón "Completar Fase" / "Guardar Cambios" ---

  /**Función para manejar la acción del botón principal de cada paso */
  handleCompletarPaso(): void {
    const currentStepName =
      this.steps[this.currentStepIndex].name.toLowerCase();
    const phaseKey = this.getPhaseKeyFromStepName(currentStepName);
    const currentStepFormGroup = this.form.get(phaseKey) as FormGroup;

    if (!currentStepFormGroup.valid) {
      alert(
        `El formulario de la fase '${
          this.steps[this.currentStepIndex].name
        }' tiene errores. Por favor, revisa los campos.`
      );
      currentStepFormGroup.markAllAsTouched();
      return;
    }

    const isPhaseCompletedInForm =
      currentStepFormGroup.get('completada')?.value;

    // Lógica específica para PLANNING (creación inicial o solo guardar)
    if (this.currentStepIndex === this.getPlanningStepIndex()) {
      if (!this.timeboxData.id) {
        // Es un Timebox nuevo, siempre pedirá confirmación de creación
        this.phaseToConfirmName = 'planning-create';
        this.showConfirmModal = true;
      } else {
        // Es un Timebox existente, solo guardar cambios sin completar la fase ni avanzar
        this.saveFormAndEmit(phaseKey, false, true, false); // <--- CAMBIO AQUÍ: avanzar después de guardar
      }
    }
    // Lógica específica para KICKOFF
    else if (this.currentStepIndex === this.getKickOffStepIndex()) {
      const allRolesAssigned = this.areAllKickOffRolesAssigned();

      if (this.isTimeboxPublished) {
        // Si ya está publicado, solo guardar cambios y avanzar si todos los roles están asignados.
        this.saveFormAndEmit(phaseKey, false, allRolesAssigned, false); // <--- CAMBIO AQUÍ: avanzar condicionalmente
        if (!allRolesAssigned) {
          alert(
            'Roles de Team Movilization incompletos. Se guardaron los cambios, pero la fase KickOff no se marcó como completada y no se avanzó de paso.'
          );
        }
      } else {
        // El Timebox NO ha sido publicado aún.
        if (allRolesAssigned) {
          // Si TODOS los roles están asignados: Publicar, completar KickOff y avanzar.
          this.phaseToConfirmName = 'kickoff-publish-and-complete';
          this.showConfirmModal = true;
        } else {
          // Si FALTAN roles por asignar: Publicar, PERO NO completar KickOff y NO avanzar.
          this.phaseToConfirmName = 'kickoff-publish-only';
          this.showConfirmModal = true;
        }
      }
    }
    // Lógica para otras fases (Refinement, QA, Close)
    else if (
      this.buttonText() === 'Completar Fase' &&
      !isPhaseCompletedInForm
    ) {
      // Se pide confirmación para completar estas fases
      this.phaseToConfirmName = currentStepName;
      this.showConfirmModal = true;
    } else {
      // Este else es para cuando el botón dice "Guardar Cambios" para fases ya completadas
      // o situaciones donde no se necesita confirmación para solo guardar.
      // Aquí también se avanza, ya que la fase ya está completada o es "Entrega".
      this.saveFormAndEmit(phaseKey, false, true, false); // <--- CAMBIO AQUÍ: avanzar después de guardar
    }
  }

  /**
   * Guarda los datos del formulario y emite el Timebox actualizado.
   * Decide si la fase debe marcarse como completada, si se debe avanzar al siguiente paso y si debe publicarse.
   * @param keyToUpdate La clave de la fase o entrega a actualizar (ej. 'planning', 'kickOff', 'entrega').
   * @param completePhase Indica si se debe intentar marcar la fase como completada.
   * @param advanceStep Indica si se debe avanzar al siguiente paso del stepper.
   * @param publishTimebox Indica si se debe actualizar el estado de publicación de la oferta.
   */
  private saveFormAndEmit(
    keyToUpdate: string,
    completePhase: boolean,
    advanceStep: boolean,
    publishTimebox: boolean
  ): void {
    const groupToUpdate = this.form.get(keyToUpdate) as FormGroup;

    if (!groupToUpdate?.valid) {
      alert(
        `Formulario de ${keyToUpdate} inválido. Por favor, revisa los campos.`
      );
      groupToUpdate?.markAllAsTouched();
      return;
    }

    // Lógica para marcar la fase como completada
    if (completePhase) {
      const isPhaseCurrentlyCompleted =
        groupToUpdate.get('completada')?.value || false;

      const fechaFase = new Date();
      if (!isPhaseCurrentlyCompleted) {
        groupToUpdate.get('completada')?.setValue(true);
        groupToUpdate.get('fechaFase')?.setValue(fechaFase.toISOString());
        // Notificar al stepper que esta fase se ha completado.
        const index = this.steps.findIndex(
          (s) =>
            this.getPhaseKeyFromStepName(s.name.toLowerCase()) === keyToUpdate
        );
        if (index !== -1) {
          this.steps[index].completed = true; // Actualiza el estado del paso en el array `steps`
          this.stepCompleted.emit(index); // Emite para que el padre actualice el ícono de completado
        }
      }
    }

    // Lógica para publicar el Timebox
    if (publishTimebox) {
      this.updatePublicacionOfertaStatus(true);
    }

    // Obtener todos los valores del formulario
    const formValues = this.form.getRawValue();

    // Crear el objeto Timebox actualizado
    const updatedTimebox: Timebox = {
      ...this.timeboxData, // Mantener los datos existentes del Timebox
      tipoTimebox: formValues.tipoTimebox,
      // Fusionar las fases, asegurando que las sub-propiedades no se pierdan si son nulas en el formulario
      fases: {
        ...this.timeboxData.fases, // Mantener fases existentes
        planning: {
          ...this.timeboxData.fases?.planning,
          ...formValues.planning,
        },
        kickOff: { ...this.timeboxData.fases?.kickOff, ...formValues.kickOff },
        refinement: {
          ...this.timeboxData.fases?.refinement,
          ...formValues.refinement,
        },
        qa: { ...this.timeboxData.fases?.qa, ...formValues.qa },
        close: { ...this.timeboxData.fases?.close, ...formValues.close },
      },
      entrega: { ...this.timeboxData.entrega, ...formValues.entrega }, // Fusionar entrega
      publicacionOferta: {
        ...this.timeboxData.publicacionOferta,
        ...formValues.publicacionOferta,
      },
    };

    // Lógica para el estado final del Timebox si es el último paso y está completado
    const isLastStep = this.currentStepIndex === this.steps.length - 1;
    if (isLastStep) {
      if (groupToUpdate.get('completada')?.value || keyToUpdate === 'entrega') {
        updatedTimebox.estado = 'Finalizado';
      }
    }

    // Emitir el formulario completo
    this.formSubmit.emit(updatedTimebox);

    // Decidir si avanzar al siguiente paso
    if (advanceStep) {
      this.emitirPasoAStepper();
    }
  }

  /**Confirmar paso completado / publicación */
  confirmCompletion(): void {
    this.showConfirmModal = false; // Ocultar el modal

    const currentStepName =
      this.steps[this.currentStepIndex].name.toLowerCase();
    const phaseKey = this.getPhaseKeyFromStepName(currentStepName);

    if (this.phaseToConfirmName === 'planning-create') {
      // Caso: Confirmar la creación inicial del Timebox (desde Planning)
      this.saveFormAndEmit(phaseKey, true, true, false); // Completar Planning y avanzar. No se publica aquí.
    } else if (this.phaseToConfirmName === 'kickoff-publish-and-complete') {
      // Caso: Confirmar publicación Y completado de KickOff (todos los roles asignados)
      this.saveFormAndEmit(phaseKey, true, true, true); // Completar KickOff, avanzar, y publicar
    } else if (this.phaseToConfirmName === 'kickoff-publish-only') {
      // Caso: Confirmar solo publicación de KickOff (faltan roles por asignar)
      this.saveFormAndEmit(phaseKey, false, false, true); // NO completar KickOff, NO avanzar, SÍ publicar
      alert(
        'El Timebox ha sido publicado con roles pendientes. La fase KickOff no se ha marcado como completada y no se avanzó de paso.'
      );
    } else {
      // Caso: Confirmar "Completar Etapa" (para Refinement, QA, Close)
      this.saveFormAndEmit(phaseKey, true, true, false); // Completar la fase y avanzar. No se publica aquí.
    }

    this.phaseToConfirmName = ''; // Limpiar el estado después de la acción
  }

  /**Cancelar confirmación */
  cancelConfirmation(): void {
    this.showConfirmModal = false;
    this.phaseToConfirmName = '';
  }
}
