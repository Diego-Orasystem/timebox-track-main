import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-stepper',
  imports: [CommonModule],
  templateUrl: './stepper.component.html',
})
export class StepperComponent {
  @Input() activeStep: number = 0;
  @Input() puedeAvanzarA!: (index: number) => boolean;
  @Output() stepChange = new EventEmitter<number>();

  @Input() steps: { name: string; completed: boolean }[] = [];

  // 👉 Paso pendiente más próximo (el primero que NO está completado)
  get firstPendingStepIndex(): number {
    const index = this.steps.findIndex((step) => !step.completed);
    // Si todos los pasos están completados, devolvemos el último
    return index === -1 ? this.steps.length - 1 : index;
  }

  onStepClick(index: number) {
    if (this.puedeAvanzarA && this.puedeAvanzarA(index)) {
      this.stepChange.emit(index);
    }
  }
}
