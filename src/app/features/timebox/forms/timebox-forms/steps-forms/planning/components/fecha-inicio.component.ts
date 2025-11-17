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
import { formatDate } from '../../../../../../../shared/helpers/date-formatter';

@Component({
  selector: 'app-fecha-inicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="w-full">
      <!-- Botón que muestra la fecha -->
      <button
        *ngIf="!isEditingFechaInicio"
        class="group w-full inline-flex text-start items-center gap-2 text-[12px] bg-[var(--backgroundLight)] px-3 py-2 cursor-pointer rounded-md transition-all duration-200 ease-in-out border border-transparent hover:bg-slate-200 hover:border-slate-200"
        (click)="isEditingFechaInicio = true"
      >
        <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
          ></circle>
          <polyline
            points="12,6 12,12 16,14"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          ></polyline>
        </svg>
        {{ fechaInicio ? formatDateDisplay(fechaInicio) : 'Fecha inicio' }}
      </button>

      <!-- Input de fecha -->
      <div
        *ngIf="isEditingFechaInicio"
        class="group w-full inline-flex text-start items-center gap-2 text-[12px] bg-[var(--backgroundLight)] px-3 py-2 rounded-md border hover:bg-slate-200 hover:border-slate-200"
      >
        <input
          type="date"
          class="cursor-pointer w-full h-full p-2"
          [formControl]="fechaControl"
          (change)="onFechaChange()"
          (blur)="isEditingFechaInicio = false"
        />
      </div>
    </div>
  `,
})
export class FechaInicioComponent implements OnInit, OnChanges {
  @Input() fechaInicio: string = '';
  @Output() fechaInicioChange = new EventEmitter<string>();

  isEditingFechaInicio = false;
  fechaControl = new FormControl<string | null>(null);

  ngOnInit() {
    this.fechaControl.valueChanges.subscribe((value) => {
      if (value) {
        this.fechaInicioChange.emit(value);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fechaInicio']) {
      const newValue = changes['fechaInicio'].currentValue;
      if (newValue) {
        const inputValue = this.toInputDateFormat(newValue);
        this.fechaControl.patchValue(inputValue, { emitEvent: false });
      }
    }
  }

  onFechaChange() {
    const selectedValue = this.fechaControl.value;
    if (!selectedValue) return;

    // ⚡️ Guardar y emitir la fecha seleccionada sin modificar zona horaria
    this.fechaInicioChange.emit(selectedValue);
    this.isEditingFechaInicio = false;
  }

  /** Muestra la fecha con tu formato, sin perder el día */
  formatDateDisplay(date: string): string {
    // Si viene en formato 'YYYY-MM-DD', crearla manualmente como fecha local
    let localDate: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map(Number);
      localDate = new Date(y, m - 1, d); // ⚠️ crea la fecha local sin UTC
    } else {
      localDate = new Date(date);
    }
    return formatDate(localDate, false);
  }

  /** Convierte una fecha en cualquier formato a 'YYYY-MM-DD' */
  private toInputDateFormat(date: string): string {
    // Si ya viene como 'YYYY-MM-DD', la devolvemos igual
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
