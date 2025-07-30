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

  onStepClick(index: number) {
    if (this.puedeAvanzarA && this.puedeAvanzarA(index)) {
      this.stepChange.emit(index);
    }
  }
}
