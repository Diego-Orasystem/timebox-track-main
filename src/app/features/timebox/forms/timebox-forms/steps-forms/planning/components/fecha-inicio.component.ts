import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-fecha-inicio',
  imports: [CommonModule, ReactiveFormsModule],
  template: `<div class="w-full">
    <button
      *ngIf="!isEditingFechaInicio"
      class="group w-full inline-flex text-start items-center gap-2 text-[12px] bg-[var(--backgroundLight)] px-3 py-2 cursor-pointer rounded-md transition-all duration-200 ease-in-out border border-transparent hover:bg-slate-200 hover:border-slate-200"
      (click)="isEditingFechaInicio = true"
    >
      <svg
        class="w-4 h-4 text-black "
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="#000000"
      >
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <title></title>
          <g id="Complete">
            <g id="Clock">
              <g>
                <polyline
                  fill="none"
                  points="11.9 5.9 11.9 11.9 12 12 14.1 14.1"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                ></polyline>
                <circle
                  cx="12"
                  cy="12"
                  data-name="Circle"
                  fill="none"
                  id="Circle-2"
                  r="10"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                ></circle>
              </g>
            </g>
          </g>
        </g>
      </svg>
      {{ fechaInicio || 'Fecha inicio' }}
    </button>

    <!-- Input de fecha -->
    <div
      class="group w-full inline-flex text-start items-center gap-2 text-[12px] bg-[var(--backgroundLight)] px-3 py-2 cursor-pointer rounded-md transition-all duration-200 ease-in-out border border-transparent hover:bg-slate-200 hover:border-slate-200"
      *ngIf="isEditingFechaInicio"
    >
      <input
        type="date"
        class="cursor-pointer w-full h-full p-2"
        [formControl]="fechaControl"
        (blur)="isEditingFechaInicio = false"
      />
    </div>
  </div> `,
})
export class FechaInicioComponent implements OnInit, OnChanges {
  isEditingFechaInicio = false;
  @Input() fechaInicio: string = '';

  @Output() fechaInicioChange = new EventEmitter<string>();
  fechaControl = new FormControl<string | null>(null);

  ngOnInit() {
    this.fechaControl.valueChanges.subscribe((value) => {
      if (value) {
        this.fechaInicioChange.emit(value);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['fechaInicio'] &&
      changes['fechaInicio'].currentValue !== this.fechaControl.value
    ) {
      this.fechaControl.patchValue(changes['fechaInicio'].currentValue, {
        emitEvent: false,
      });
    }
  }

  onFechaChange() {
    this.fechaInicioChange.emit(this.fechaInicio);
    this.isEditingFechaInicio = false;
  }
}
