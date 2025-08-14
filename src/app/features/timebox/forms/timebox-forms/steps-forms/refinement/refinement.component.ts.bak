import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdjuntosFormComponent } from '../../../../../../shared/components/modals/adjuntos-form.component';
import { ChecklistFormComponent } from '../../../../../../shared/components/modals/checklist-form.component';
import { PersonaSelectorComponent } from '../../../../../../shared/components/modals/persona-selector.component';
import { formatDate } from '../../../../../../shared/helpers/date-formatter';
import { Timebox } from '../../../../../../shared/interfaces/timebox.interface';

@Component({
  selector: 'app-refinement',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdjuntosFormComponent,
    PersonaSelectorComponent,
    ChecklistFormComponent,
  ],
  templateUrl: './refinement.component.html',
  styleUrl: './refinement.component.css',
})
export class RefinementComponent {
  form!: FormGroup;
  @Input() formGroupName!: string;

  // Set para llevar un registro de qué revisiones están abiertas (por su índice)
  openRevisions: Set<number> = new Set<number>();

  // Variables para controlar los modales, ahora se manejarán por revisión activa
  showModalParticipantes: boolean[] = [];
  showModalChecklist: boolean[] = [];
  showModalAdjuntos: boolean[] = [];
  // Arrays para controlar el modal de disponibilidad horario por cada revisión y día
  showModalDisponibilidad: {
    [revisionIndex: number]: { [day: string]: boolean };
  } = {};

  // Días de la semana para iterar en el template
  diasSemana = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ];

  // Emite el valor del FormGroup de la revisión cuando se hace clic en guardar
  @Output() saveRevisionStage = new EventEmitter<any>();
  @Input() timeboxData: Timebox = {} as Timebox;

  constructor(
    private fb: FormBuilder,
    private rootFormGroup: FormGroupDirective
  ) {}

  ngOnInit(): void {
    // Ensure the form is correctly initialized from the root form group
    this.form = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;

    this.revisiones.controls.forEach((_, index) => {
      this.showModalParticipantes[index] = false;
      this.showModalChecklist[index] = false;
      this.showModalAdjuntos[index] = false;
      // Inicializar el estado de los modales de disponibilidad para cada revisión
      this.showModalDisponibilidad[index] = {};
      this.diasSemana.forEach((day) => {
        this.showModalDisponibilidad[index][day] = false;
      });
    });

    // Inicializa los arrays de control de modales para cada revisión existente
    this.revisiones.controls.forEach((_, index) => {
      this.showModalParticipantes[index] = false;
      this.showModalChecklist[index] = false;
      this.showModalAdjuntos[index] = false;
    });
  }

  /**
   * Getter para el FormArray 'revisiones'.
   * @returns FormArray de revisiones.
   */
  get revisiones(): FormArray {
    return this.form.get('revisiones') as FormArray;
  }

  agregarRevision(): void {
    const formattedDate = new Date();
    const nuevaRevision = this.fb.group({
      tipo: ['Revision'],
      fechaSolicitud: [formattedDate.toISOString()],
      adjuntos: this.fb.array([]),
      participantes: this.fb.array([]),
      listaAcuerdos: this.fb.array([]),
      completada: [false],
    });
    this.revisiones.push(nuevaRevision);

    const newIndex = this.revisiones.length - 1;
    this.openRevisions.add(newIndex);

    this.showModalParticipantes[newIndex] = false;
    this.showModalChecklist[newIndex] = false;
    this.showModalAdjuntos[newIndex] = false;
    this.showModalDisponibilidad[newIndex] = {}; // Inicializar para la nueva revisión
    this.diasSemana.forEach((day) => {
      this.showModalDisponibilidad[newIndex][day] = false;
    });
  }

  eliminarRevision(index: number): void {
    this.revisiones.removeAt(index);
    this.openRevisions.delete(index);

    const newOpenRevisions = new Set<number>();
    this.openRevisions.forEach((openIndex) => {
      if (openIndex > index) {
        newOpenRevisions.add(openIndex - 1);
      } else if (openIndex < index) {
        newOpenRevisions.add(openIndex);
      }
    });
    this.openRevisions = newOpenRevisions;

    this.showModalParticipantes.splice(index, 1);
    this.showModalChecklist.splice(index, 1);
    this.showModalAdjuntos.splice(index, 1);
    // Eliminar el estado de disponibilidad horaria para la revisión eliminada
    delete this.showModalDisponibilidad[index];
    // Reajustar las claves si es necesario (ej. si usas índices consecutivos)
    const newShowModalDisponibilidad: {
      [revisionIndex: number]: { [day: string]: boolean };
    } = {};
    Object.keys(this.showModalDisponibilidad).forEach((key) => {
      const oldIndex = parseInt(key, 10);
      if (oldIndex < index) {
        newShowModalDisponibilidad[oldIndex] =
          this.showModalDisponibilidad[oldIndex];
      } else if (oldIndex > index) {
        newShowModalDisponibilidad[oldIndex - 1] =
          this.showModalDisponibilidad[oldIndex];
      }
    });
    this.showModalDisponibilidad = newShowModalDisponibilidad;
  }

  toggleRevision(index: number): void {
    if (this.openRevisions.has(index)) {
      this.openRevisions.delete(index);
    } else {
      this.openRevisions.add(index);
    }
  }

  isRevisionOpen(index: number): boolean {
    return this.openRevisions.has(index);
  }

  // --- Métodos para Adjuntos ---
  getAdjuntosFormArray(revisionIndex: number): FormArray {
    const revisionGroup = this.revisiones.at(revisionIndex) as FormGroup;
    return revisionGroup.get('adjuntos') as FormArray;
  }

  openModalAdjuntos(revisionIndex: number) {
    this.showModalAdjuntos[revisionIndex] = true;
  }

  closeModalAdjuntos(revisionIndex: number) {
    this.showModalAdjuntos[revisionIndex] = false;
  }

  recibirArchivo(files: File[], revisionIndex: number) {
    const adjuntos = this.getAdjuntosFormArray(revisionIndex);
    files.forEach((file) => {
      adjuntos.push(
        this.fb.group({
          nombre: [file.name],
          url: [''],
        })
      );
    });
    this.closeModalAdjuntos(revisionIndex);
  }

  downloadFileDirect(adjunto: any): void {
    const tempControl = this.fb.control(adjunto);
    this.downloadFile(tempControl);
  }

  downloadFile(adjuntoControl: AbstractControl) {
    const adjuntoValue = adjuntoControl.value;
    if (adjuntoValue && adjuntoValue.url) {
      const url = adjuntoValue.url;
      const a = document.createElement('a');
      a.href = url;
      a.download = adjuntoValue.nombre || 'download';
      a.click();
    } else if (adjuntoValue instanceof File) {
      const url = window.URL.createObjectURL(adjuntoValue);
      const a = document.createElement('a');
      a.href = url;
      a.download = adjuntoValue.name;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      console.warn(
        'No se puede descargar el archivo: Formato desconocido o sin URL',
        adjuntoValue
      );
    }
  }

  eliminarAdjunto(revisionIndex: number, adjuntoIndex: number) {
    this.getAdjuntosFormArray(revisionIndex).removeAt(adjuntoIndex);
  }

  // --- Métodos para Participantes ---
  getParticipantesFormArray(revisionIndex: number): FormArray {
    const revisionGroup = this.revisiones.at(revisionIndex) as FormGroup;
    return revisionGroup.get('participantes') as FormArray;
  }

  openModalParticipantes(revisionIndex: number) {
    this.showModalParticipantes[revisionIndex] = true;
  }

  closeModalParticipantes(revisionIndex: number) {
    this.showModalParticipantes[revisionIndex] = false;
  }

  handlePersonaSeleccionada(
    event: { tipo: string; persona: string },
    revisionIndex: number
  ) {
    if (event.tipo === 'participantes' && event.persona) {
      const participantes = this.getParticipantesFormArray(revisionIndex);
      const participanteGroup = this.fb.group({
        persona: [event.persona],
        rol: [''],
        email: [''],
      });
      participantes.push(participanteGroup);
      this.closeModalParticipantes(revisionIndex);
    }
  }

  eliminarParticipante(revisionIndex: number, participanteIndex: number) {
    this.getParticipantesFormArray(revisionIndex).removeAt(participanteIndex);
  }

  // --- Métodos para Lista de Acuerdos (Checklist) ---
  getListaAcuerdosFormArray(revisionIndex: number): FormArray {
    const revisionGroup = this.revisiones.at(revisionIndex) as FormGroup;
    return revisionGroup.get('listaAcuerdos') as FormArray;
  }

  openModalChecklist(revisionIndex: number) {
    this.showModalChecklist[revisionIndex] = true;
  }

  closeModalChecklist(revisionIndex: number) {
    this.showModalChecklist[revisionIndex] = false;
  }

  addItemChecklist(
    item: { label: string; checked: boolean },
    revisionIndex: number
  ) {
    const listaAcuerdos = this.getListaAcuerdosFormArray(revisionIndex);
    const acuerdoGroup = this.fb.group({
      label: [item.label],
      checked: [item.checked],
    });
    listaAcuerdos.push(acuerdoGroup);
  }

  eliminarChecklist(revisionIndex: number, checklistIndex: number) {
    this.getListaAcuerdosFormArray(revisionIndex).removeAt(checklistIndex);
  }
}
