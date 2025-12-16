import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormArray,
  Validators,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
// Importa tus componentes de fase
import { PlanningComponent } from './steps-forms/planning/planning.component';
import { KickoffComponent } from './steps-forms/kickoff/kickoff.component';
import { RefinementComponent } from './steps-forms/refinement/refinement.component';
import { QaComponent } from './steps-forms/qa/qa.component';
import { CloseComponent } from './steps-forms/close/close.component';

// Importa tus interfaces
import {
  Timebox,
  Postulacion,
} from '../../../../shared/interfaces/timebox.interface';
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

  // Método para manejar las solicitudes de guardado automático desde los componentes hijos
  handleTimeboxSaveRequest(timeboxData: Timebox): void {
    this.formSubmit.emit(timeboxData);
  }

  isTimeboxPublished: boolean = false; // Indica si el Timebox ya ha sido publicado

  constructor(private fb: FormBuilder) {}

  // Método para verificar si el formulario de planning es válido
  isPlanningValid(): boolean {
    const planningForm = this.form.get('planning') as FormGroup;
    if (!planningForm) return false;

    // Forzar validación de todos los campos
    this.validatePlanningForm();

    return planningForm.valid;
  }

  // Método para forzar validación del formulario de planning
  validatePlanningForm(): void {
    const planningForm = this.form.get('planning') as FormGroup;
    if (!planningForm) return;

    // Marcar todos los campos como touched para mostrar errores
    Object.keys(planningForm.controls).forEach((key) => {
      const control = planningForm.get(key);
      if (control) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    });
  }

  getEntregableError(): string {
    const entregable = this.form.get('entregable') as FormControl;
    let error = '';
    if (entregable.errors) {
      if (entregable.errors['required']) {
        error = 'Este campo es requerido';
      }
    }
    return error;
  }

  getTipoTimeboxError(): string {
    const tipoTimebox = this.form.get('tipoTimebox') as FormControl;
    let error = '';
    if (tipoTimebox.errors) {
      if (tipoTimebox.errors['required']) {
        error = 'Este campo es requerido';
      }
    }

    return error;
  }

  // Método para obtener errores de validación del planning
  getPlanningErrors(): { [key: string]: string } | string {
    const planningForm = this.form.get('planning') as FormGroup;
    if (!planningForm) return {};

    const errors: { [key: string]: string } = {};

    Object.keys(planningForm.controls).forEach((key) => {
      const control = planningForm.get(key);
      if (control) {
        // Mostrar errores incluso si no está touched para debugging
        if (control.errors) {
          if (control.errors['required']) {
            errors[key] = 'Este campo es obligatorio';
          } else if (control.errors['minlength']) {
            const requiredLength = control.errors['minlength'].requiredLength;
            errors[key] = `Mínimo ${requiredLength} caracteres`;
          }
        }
      }
    });

    return errors;
  }

  // Método para obtener nombres de campos legibles
  getFieldDisplayName(fieldKey: string): string {
    const fieldNames: { [key: string]: string } = {
      nombre: 'Nombre del timebox',
      codigo: 'Código',
      descripcion: 'Descripción',
      entregable: 'Entregable',
      tipoTimebox: 'Tipo de timebox',
      eje: 'Eje',
      aplicativo: 'Aplicativo',
      alcance: 'Alcance',
      esfuerzo: 'Esfuerzo',
      fechaInicio: 'Fecha de inicio',
      teamLeader: 'Team Leader',
    };
    return fieldNames[fieldKey] || fieldKey;
  }

  currentStepName = '';
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
    } else {
      console.log('🔍 FormsComponent - timeboxData NO tiene ID o está vacío');
    }

    this.currentStepName = this.steps[this.currentStepIndex].name.toLowerCase();
  }

  // ✅ MÉTODO PARA OBTENER EL ID DEL TIMEBOX DE MANERA SEGURA
  getTimeboxId(): string {
    const id = this.timeboxData?.id;
    return id || '';
  }

  //--- Formulario padre ---//

  /**Inicializa el parent form de las fases del timebox */
  createForm() {
    this.form = this.fb.group({
      entregable: ['', [Validators.required]],
      tipoTimebox: ['', [Validators.required]],
      businessAnalyst: [''],
      estado: [''],
      created_at: [''],
      planning: this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        codigo: ['', [Validators.required, Validators.minLength(2)]],
        descripcion: ['', [Validators.required, Validators.minLength(10)]],
        eje: ['', Validators.required],
        aplicativo: ['', Validators.required],
        alcance: ['', Validators.required],
        esfuerzo: ['', Validators.required],
        fechaInicio: ['', Validators.required],
        teamLeader: ['', Validators.required],
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
        revisiones: this.fb.array([]),
        fechaFase: [''],
        completada: [false],
      }),
      entrega: this.fb.group({
        id: [''],
        fechaEntrega: [''],
        responsable: [''],
        participantes: this.fb.array([]),
        adjuntosEntregables: this.fb.array([]),
        adjuntosEvidencias: this.fb.array([]),
        observaciones: [''],
      }),
      qa: this.fb.group({
        fechaFase: [''],
        // Estado General de la Consolidación
        estadoConsolidacion: ['Pendiente'], // Ej: 'Pendiente', 'En Progreso', 'Completado', 'Bloqueado'
        // Detalles del Despliegue (Deployment)
        fechaPreparacionEntorno: [null], // Usar null para fechas si no están seleccionadas
        entornoPruebas: [''], // Ej: 'Staging', 'Pre-producción'
        versionDespliegue: [''],
        responsableDespliegue: [''],
        observacionesDespliegue: [''], // Para texto largo (párrafos)

        // Detalles del Testing
        resultadosPruebas: [''], // Resumen de los resultados, ej: '150/160 casos de prueba OK'
        bugsIdentificados: [''], // Conteo o referencia, ej: '5 abiertos, 2 críticos'
        responsableQA: [''],

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

    // Mapear campos del backend al formulario
    this.form.get('entregable')?.patchValue(timebox.entregableId);
    this.form.get('tipoTimebox')?.patchValue(timebox.tipoTimebox);
    this.form.get('estado')?.patchValue(timebox.estado);
    this.form.get('created_at')?.patchValue(timebox.created_at);
    // Si hay datos de fases, usarlos; si no, inicializar con datos básicos
    if (timebox.fases) {
      // Patch específico para planning con logging detallado
      if (timebox.fases.planning) {
        // Hacer patch de todos los campos excepto arrays
        const planningData = {
          nombre: timebox.fases.planning.nombre || '',
          codigo: timebox.fases.planning.codigo || '',
          descripcion: timebox.fases.planning.descripcion || '',
          eje: timebox.fases.planning.eje || '',
          aplicativo: timebox.fases.planning.aplicativo || '',
          alcance: timebox.fases.planning.alcance || '',
          esfuerzo: timebox.fases.planning.esfuerzo || '',
          adjuntos: timebox.fases.planning.adjuntos || [],
          fechaInicio:
            this.getFormattedDate(timebox.fases.planning.fechaInicio) || '',
          teamLeader: timebox.fases.planning.teamLeader || null,
          completada: timebox.fases.planning.completada || false,
        };

        this.form.get('planning')?.patchValue(planningData);

        // Establecer tipoTimebox por separado
        this.form.get('planning.tipoTimebox')?.setValue(timebox.tipoTimebox);
        this.form.get('planning.entregable')?.setValue(timebox.entregableId);

        // Verificar que se aplicó correctamente
        setTimeout(() => {
          console.log(
            '🔍 Planning form after patch:',
            this.form.get('planning')?.value
          );
        }, 100);
      }

      this.form.get('kickOff')?.patchValue(timebox.fases.kickOff || {});
      this.form.get('refinement')?.patchValue(timebox.fases.refinement || {});
      this.form.get('qa')?.patchValue(timebox.fases.qa || {});
      this.form.get('close')?.patchValue(timebox.fases.close || {});
    } else {
      // Inicializar con datos básicos del timebox
      const basicPlanningData = {
        nombre: '',
        codigo: '',
        descripcion: '',
        tipoTimebox: timebox.tipoTimebox,
        eje: '',
        aplicativo: '',
        alcance: '',
        esfuerzo: '',
        fechaInicio: '',
        teamLeader: null,
        adjuntos: [],
        skills: [],
        cumplimiento: [],
        completada: false,
        entregable: timebox.entregableId,
      };
      this.form.get('planning')?.patchValue(basicPlanningData);
    }

    if (timebox.entrega) {
      this.form.get('entrega')?.patchValue(timebox.entrega || {});
    }

    // Llenar FormArrays específicos para cada fase.
    if (timebox.fases?.planning) {
      const planningGroup = this.form.get('planning') as FormGroup;

      // Patch específico para teamLeader
      if (timebox.fases.planning.teamLeader) {
        console.log(
          '🔍 Setting teamLeader in form:',
          timebox.fases.planning.teamLeader
        );
        planningGroup
          .get('teamLeader')
          ?.setValue(timebox.fases.planning.teamLeader);
        // Forzar propagación para que el hijo sincronice su input
        const tlCtrl = planningGroup.get('teamLeader');
        tlCtrl?.markAsTouched();
        tlCtrl?.markAsDirty();
        tlCtrl?.updateValueAndValidity({ emitEvent: true });
      }

      // Patch específico para completada
      if (timebox.fases.planning.completada !== undefined) {
        console.log(
          '🔍 Setting completada in form:',
          timebox.fases.planning.completada
        );
        planningGroup
          .get('completada')
          ?.setValue(timebox.fases.planning.completada);
      }

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

      if (timebox.fases.close.adjuntosEvidencias) {
        timebox.fases.close.adjuntosEvidencias?.forEach((adj) =>
          (closeGroup.get('adjuntosEvidencias') as FormArray).push(
            this.createAdjuntoGroup(adj)
          )
        );
      }
    }

    if (timebox.entrega) {
      const entregaGroup = this.form.get('entrega') as FormGroup;
      timebox.entrega.adjuntosEntregables?.forEach((adj) =>
        (entregaGroup.get('adjuntosEntregables') as FormArray).push(
          this.createAdjuntoGroup(adj)
        )
      );
    }

    if (timebox.publicacionOferta) {
      const publicacionGroup = this.form.get('publicacionOferta') as FormGroup;
      timebox.publicacionOferta.postulaciones?.forEach((postulacion) => {
        (publicacionGroup.get('postulaciones') as FormArray).push(
          this.createPostulacionGroup(postulacion)
        );
      });
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
    this.form
      .get('planning')
      ?.patchValue({ completada: false, fechaCompletado: '' });
    this.form
      .get('kickOff')
      ?.patchValue({ completada: false, fechaCompletado: '' });
    this.form.get('refinement')?.patchValue({
      completada: false,
      fechaCompletado: '',
    });
    this.form.get('qa')?.patchValue({ completada: false, fechaCompletado: '' });
    this.form.get('close')?.patchValue({
      cumplimiento: 'Total',
      completada: false,
      fechaCompletado: '',
    });
    // entrega no tiene 'completada' en tu interfaz
    console.log('FormsComponent: Form reset to initial state.');
  }

  //--- Helpers para crear grupos del formulario ---//
  getFormattedDate(date: string | undefined): string {
    if (!date) return '';
    const dateToDate = new Date(date);
    return formatDate(dateToDate, false);
  }
  /**Crea un grupo para una revisión */
  private createRevisionGroup(revision?: SolicitudRevision): FormGroup {
    return this.fb.group({
      tipo: [revision?.tipo || 'Revision'],
      fechaSolicitud: [revision?.fechaSolicitud || ''],
      participantes: this.fb.array([]),
      adjuntos: this.fb.array([]),
      listaAcuerdos: this.fb.array([]),
      cierreSolicitud: this.fb.group({
        completada: [false],
        fechaDeRealizacion: [''],
      }),
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
        solicitado:
          publicacionOfertaControl.controls['solicitado'].value || false, // Asumiendo que publicar implica que fue solicitado
        publicado: publicacionOfertaControl.controls['publicado'].value || true,
        fechaPublicacion:
          publicacionOfertaControl.controls['fechaPublicacion'].value ||
          fechaPub.toISOString(),
        postulaciones:
          publicacionOfertaControl.controls['postulaciones'].value || [],
      });
      this.isTimeboxPublished = true; // Actualiza la bandera local
    } else if (!publicar && publicacionOfertaControl.get('publicado')?.value) {
      // Opción para despublicar, si fuera necesario, o simplemente no hacer nada si ya está publicado
      // Por ahora, solo nos interesa publicarlo.
    }
  }
  /**Crea un grupo para una postulación */
  private createPostulacionGroup(postulacion: Postulacion): FormGroup {
    return this.fb.group({
      id: [postulacion.id || ''],
      rol: [postulacion.rol || ''],
      desarrollador: [postulacion.desarrollador || ''],
      fechaPostulacion: [postulacion.fechaPostulacion || ''],
      estadoSolicitud: [postulacion.estadoSolicitud || ''],
      asignacion: this.fb.group({
        asignado: [postulacion.asignacion.asignado || false],
        fechaAsignacion: [postulacion.asignacion.fechaAsignacion || ''],
      }),
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
      return 'Completar Timebox';
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
      const prevStep = this.currentStepIndex;
      this.currentStepIndex++;

      this.stepChange.emit(this.currentStepIndex);
      this.stepCompleted.emit(prevStep); // ⬅️ el paso recién completado
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
      // Marcar todos los campos como touched para mostrar errores
      currentStepFormGroup.markAllAsTouched();

      // Si es el paso de planning, mostrar mensaje específico
      if (this.currentStepIndex === 0) {
        alert(
          'El formulario de Planning tiene campos obligatorios sin completar. Por favor, revisa los campos marcados en rojo.'
        );
      } else {
        alert(
          `El formulario de la fase '${
            this.steps[this.currentStepIndex].name
          }' tiene errores. Por favor, revisa los campos.`
        );
      }
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
        // Es un Timebox existente, verificar si todos los campos requeridos están llenos
        const planningForm = this.form.get('planning') as FormGroup;
        const requiredFields = [
          'nombre',
          'codigo',
          'eje',
          'aplicativo',
          'alcance',
          'esfuerzo',
          'fechaInicio',
          'entregable'
        ];
        const allRequiredFieldsFilled = requiredFields.every((field) => {
          const value = planningForm.get(field)?.value;
          return (
            value && (typeof value === 'string' ? value.trim() !== '' : true)
          );
        });

        // Validar teamLeader por separado ya que puede ser un objeto o string
        const teamLeaderValue = planningForm.get('teamLeader')?.value;
        const teamLeaderValid =
          teamLeaderValue &&
          (typeof teamLeaderValue === 'string'
            ? teamLeaderValue.trim() !== ''
            : typeof teamLeaderValue === 'object'
            ? teamLeaderValue.id || teamLeaderValue.nombre
            : false);

        if (
          allRequiredFieldsFilled &&
          teamLeaderValid &&
          !planningForm.get('completada')?.value
        ) {
          // Si todos los campos requeridos están llenos y la fase no está completada, completar la fase
          this.saveFormAndEmit(phaseKey, true, true, false);
        } else {
          // Solo guardar cambios sin completar la fase
          this.saveFormAndEmit(phaseKey, false, true, false);
        }
      }
    }
    // Lógica específica para KICKOFF
    else if (this.currentStepIndex === this.getKickOffStepIndex()) {
      const allRolesAssigned = this.areAllKickOffRolesAssigned();

      if (this.isTimeboxPublished) {
        // Si ya está publicado, solo guardar cambios y avanzar si todos los roles están asignados.
        this.saveFormAndEmit(
          phaseKey,
          allRolesAssigned,
          allRolesAssigned,
          false
        ); // <--- CORREGIDO: marcar como completada si todos los roles están asignados
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
          // Si FALTAN roles por asignar: Publicar automáticamente sin confirmación
          this.saveFormAndEmit(phaseKey, false, false, true);
        }
      }
    } else if (
      this.buttonText() === 'Completar Timebox' &&
      !isPhaseCompletedInForm
    ) {
      this.phaseToConfirmName = 'close';
      this.showConfirmModal = true;
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
      //Vemos si la fase actual está completada o no
      const isPhaseCurrentlyCompleted =
        groupToUpdate.get('completada')?.value || false;

      //Creamos una fecha
      const fechaCompletado = new Date();

      //Si no está completada
      if (!isPhaseCurrentlyCompleted) {
        //Cambiamos valores de la fase a completada:true y fechaFase: fecha actual
        groupToUpdate.get('completada')?.setValue(true);
        groupToUpdate.get('fechaFase')?.setValue(fechaCompletado.toISOString());
        // Notificar al stepper que esta fase se ha completado.
        //Obtenemos el index del paso actual
        const index = this.steps.findIndex(
          (s) =>
            this.getPhaseKeyFromStepName(s.name.toLowerCase()) === keyToUpdate
        );

        //si el paso actual no es -1
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
      entregableId: formValues.entregable,
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

    // ✅ LÓGICA MEJORADA para el estado final del Timebox
    if (publishTimebox) {
      // Si se está publicando, cambiar estado a "Disponible"
      updatedTimebox.estado = 'Disponible';
    } else {
      // ✅ Verificar si todas las fases están completadas para marcar como Finalizado
      const todasLasFasesCompletadas =
        updatedTimebox.fases?.planning?.completada &&
        updatedTimebox.fases?.kickOff?.completada &&
        updatedTimebox.fases?.refinement?.completada &&
        updatedTimebox.fases?.qa?.completada &&
        updatedTimebox.fases?.close?.completada;

      if (todasLasFasesCompletadas) {
        updatedTimebox.estado = 'Finalizado';
      } else if (
        keyToUpdate === 'close' &&
        groupToUpdate.get('completada')?.value
      ) {
        // ✅ Caso especial: Si se está completando Close, verificar si todas las fases están completadas
        const closeCompletado = groupToUpdate.get('completada')?.value;
        const otrasFasesCompletadas =
          updatedTimebox.fases?.planning?.completada &&
          updatedTimebox.fases?.kickOff?.completada &&
          updatedTimebox.fases?.refinement?.completada &&
          updatedTimebox.fases?.qa?.completada;

        if (closeCompletado && otrasFasesCompletadas) {
          updatedTimebox.estado = 'Finalizado';
        }
      } else {
        // ✅ Mantener el estado actual si no se cumplen las condiciones
        console.log(
          '🔍 saveFormAndEmit: Manteniendo estado actual:',
          updatedTimebox.estado
        );
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
