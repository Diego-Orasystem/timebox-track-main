import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { StepperComponent } from '../stepper/stepper.component';
import { Timebox } from '../../../../shared/interfaces/timebox.interface';
import { FormsComponent } from '../../forms/timebox-forms/forms.component';

@Component({
  selector: 'app-modal-create',
  standalone: true, // Asegúrate de que sea standalone si no lo es ya
  imports: [CommonModule, FormsComponent, StepperComponent],
  templateUrl: './modal-create.component.html',
})
export class ModalCreateComponent implements OnChanges {
  activeStep = 0;

  @Input() show: boolean = false;
  // El modo ahora es más flexible, puede ser establecido por el padre o internamente
  @Input() mode: 'create' | 'edit' | 'read' = 'create';
  @Output() close = new EventEmitter<void>();

  @Input() timeboxData: Timebox = {} as Timebox;
  @Output() timeboxOutput = new EventEmitter<Timebox>();

  @Input() projectId: string | null = null;
  @Input() folderId: string | null = null;

  steps = [
    { name: 'planning', completed: false },
    { name: 'kickoff', completed: false },
    { name: 'refinement', completed: false },
    { name: 'qa', completed: false },
    { name: 'close', completed: false },
  ];

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    // Detectar cambios en timeboxData (esto se ejecuta después del `show` si ambos cambian en la misma tick)
    if (changes['timeboxData'] && changes['timeboxData'].currentValue) {
      // Si el timeboxData que llega tiene un ID, es una edición/lectura.
      // Actualizamos el modo interno y los pasos basados en los datos.
      if (changes['timeboxData'].currentValue.id) {
        this.mode = 'edit'; // Confirmamos el modo 'edit' si hay un ID
        this.initializeStepsFromTimeboxData();
      } else {
        // Si el timeboxData está vacío o no tiene ID, asumimos creación.
        // Esto cubre el caso de 'openCreateModal()' en el padre.
        this.mode = 'create';
        this.resetInternalStateForCreation(); // Resetear también si el timeboxData es vacío
      }
    }

    // Detectar cambio explícito en el modo (aunque timeboxData a menudo lo guiará)
    if (changes['mode'] && changes['mode'].currentValue) {
      if (
        changes['mode'].currentValue === 'create' &&
        (!this.timeboxData || Object.keys(this.timeboxData).length === 0)
      ) {
        this.resetInternalStateForCreation();
      }
    }
  }

  initializeStepsFromTimeboxData() {
    if (this.timeboxData && this.timeboxData.fases) {
      this.steps.forEach((step) => {
        const phaseNameKey = step.name === 'kickoff' ? 'kickOff' : step.name;
        const phaseData =
          this.timeboxData.fases[phaseNameKey as keyof Timebox['fases']];
        step.completed = phaseData?.completada ?? false;
      });

      // Determinar el paso activo: el primero no completado o el último paso si todos están completos
      const firstIncompleteIndex = this.steps.findIndex((s) => !s.completed);
      this.activeStep =
        firstIncompleteIndex !== -1
          ? firstIncompleteIndex
          : this.steps.length - 1; // Si todo está completado, ir al último paso
    } else {
      // Si no hay timeboxData o fases para inicializar, resetea a estado inicial de creación.
      this.resetInternalStateForCreation();
    }
  }

  puedeAvanzarA = (index: number): boolean => {
    if (index <= this.activeStep) return true; // Siempre puedes ir a un paso anterior o el actual
    return this.steps[index - 1]?.completed ?? false; // Solo puedes ir al siguiente si el anterior está completo
  };

  handleStepChange(step: number) {
    if (this.puedeAvanzarA(step)) {
      this.activeStep = step;
    } else {
      console.log(
        'ModalCreateComponent: No se puede avanzar al paso:',
        step,
        'El paso anterior no está completo.'
      );
    }
  }

  handleClose(): void {
    this.close.emit();
    this.resetInternalStateForClosing(); // Llama a un método de reseteo para el cierre
  }

  handleStepCompleted(index: number): void {
    this.steps[index].completed = true;
    this.updateStepsCompletedState();
    this.activeStep = Math.min(index + 1, this.steps.length - 1); // Avanza al siguiente paso
  }

  // Método dedicado para resetear el estado interno al INICIO de una CREACIÓN
  private resetInternalStateForCreation(): void {
    this.activeStep = 0;
    this.steps.forEach((step) => (step.completed = false));
    // No reseteamos timeboxData ni mode aquí, ya que el padre los maneja en este escenario.
  }

  // Método dedicado para resetear el estado interno al CERRAR el modal
  private resetInternalStateForClosing(): void {
    this.timeboxData = {} as Timebox; // Limpiar datos para evitar que persistan en el DOM oculto
    this.mode = 'create'; // Volver a modo creación por defecto
    this.activeStep = 0; // Resetear stepper al primer paso
    this.steps.forEach((step) => (step.completed = false)); // Resetear estados de pasos
  }

  // Esto es para recalcular el estado 'completed' de los pasos si es necesario
  private updateStepsCompletedState(): void {
    // Si `timeboxData` no tiene fases, no hay nada que actualizar desde los datos.
    if (!this.timeboxData || !this.timeboxData.fases) {
      return;
    }
    this.steps.forEach((step) => {
      const phaseNameKey = step.name === 'kickoff' ? 'kickOff' : step.name;
      const phaseData =
        this.timeboxData.fases[phaseNameKey as keyof Timebox['fases']];
      step.completed = phaseData?.completada ?? false;
    });
  }

  onFormSubmit(formData: Timebox): void {
    console.log('🔄 ModalCreateComponent: onFormSubmit llamado con:', formData);
    console.log('🔍 ModalCreateComponent: timeboxData original:', this.timeboxData);
    
    const timeboxToSave: Timebox = {
      ...this.timeboxData,
      tipoTimebox: formData.tipoTimebox,
      estado: formData.estado,
      fases: formData.fases,
      entrega: formData.entrega,
      projectId: this.projectId!,
      publicacionOferta: formData.publicacionOferta,
    };

    console.log('📤 ModalCreateComponent: Emitiendo timeboxOutput:', timeboxToSave);
    console.log('🔍 ModalCreateComponent: timeboxToSave ID:', timeboxToSave.id);
    this.timeboxOutput.emit(timeboxToSave);
    console.log('✅ ModalCreateComponent: timeboxOutput emitido');
  }
}
