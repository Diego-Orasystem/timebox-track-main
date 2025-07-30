import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Define a type for a time slot
interface TimeSlot {
  start: string;
  end: string;
}

// Define a type for the availability structure
interface Availability {
  [day: string]: TimeSlot[];
}
@Component({
  selector: 'dev-modal-horario',
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="show"
      class="fixed inset-0 flex items-center justify-center z-50 "
    >
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black opacity-30 backdrop-blur-lg"
        (click)="handleClose()"
      ></div>

      <!-- Contenido del modal -->
      <div
        class="relative bg-white rounded-sm shadow-lg w-[450px] max-h-[85vh] flex flex-col z-10 px-6 py-4"
      >
        <div class="title-modal w-full gap-2 mb-8 sticky top-0 bg-white z-20 ">
          <h1 class="font-bold text-xl">Indica tu disponibilidad horaria</h1>
          <p class="text-sm">
            Selecciona los días y rangos horarios en los que estás disponible
            para una reunión.
          </p>
        </div>
        <div class="content-modal w-full flex flex-col gap-3 overflow-y-auto">
          <div
            *ngFor="let day of daysOfWeek"
            class="border border-gray-200 rounded-md p-4 bg-white shadow-sm"
          >
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm font-semibold text-gray-800">{{ day }}</span>
              <input
                type="checkbox"
                class="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                [checked]="
                  currentAvailability[day] &&
                  currentAvailability[day].length > 0
                "
                (change)="toggleDaySelection(day, $event)"
              />
            </label>

            <!-- Render time slots only if the day is selected -->
            <div
              *ngIf="
                currentAvailability[day] && currentAvailability[day].length > 0
              "
              class="space-y-3 mt-4"
            >
              <div
                *ngFor="let slot of currentAvailability[day]; let i = index"
                class="flex items-center gap-3"
              >
                <input
                  type="time"
                  class="w-full p-2 border border-gray-300 rounded-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                  [(ngModel)]="slot.start"
                  (change)="handleTimeChange(day)"
                  [attr.aria-label]="
                    'Hora de inicio para ' + day + ' slot ' + (i + 1)
                  "
                />
                <span class="text-gray-500">-</span>
                <input
                  type="time"
                  class="w-full p-2 border border-gray-300 rounded-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                  [(ngModel)]="slot.end"
                  (change)="handleTimeChange(day)"
                  [attr.aria-label]="
                    'Hora de fin para ' + day + ' slot ' + (i + 1)
                  "
                />
                <button
                  (click)="removeTimeSlot(day, i)"
                  class="p-2 text-red-600 hover:text-red-800 transition-colors duration-200 cursor-pointer"
                  [attr.aria-label]="'Eliminar rango horario para ' + day"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <button
                (click)="addTimeSlot(day)"
                class="mt-3 w-full bg-indigo-50 px-4 py-2 text-indigo-700 rounded-sm hover:bg-indigo-100 transition-colors duration-200 flex items-center justify-center text-sm font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Añadir Rango Horario
              </button>
            </div>
          </div>
          <div class="inline-flex w-full justify-between items-center mt-4">
            <button
              (click)="emitAvailabilityChange()"
              class="w-40 text-[var(--lightText)] bg-[var(--primary)] hover:bg-[var(--primaryDark)] px-2 py-3 font-bold rounded-sm transition duration-200 ease-in-out text-sm cursor-pointer"
            >
              Guardar
            </button>
            <button
              (click)="handleClose()"
              class="w-40 text-[var(--darkText)] bg-slate-200 hover:bg-slate-300 px-2 py-3 font-bold rounded-sm transition duration-200 ease-in-out text-sm cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModalHorarioComponent {
  daysOfWeek: string[] = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ];

  currentAvailability: Availability = {};

  @Input() show = false;
  @Input() modo: 'Revision' | 'Cierre' = 'Revision';
  @Output() close = new EventEmitter<void>();

  @Output() onAvailabilityChange = new EventEmitter<Availability>();

  emitAvailabilityChange() {
    this.onAvailabilityChange.emit(this.currentAvailability);
  }

  addTimeSlot(day: string): void {
    if (!this.currentAvailability[day]) {
      this.currentAvailability[day] = [];
    }
    this.currentAvailability[day].push({ start: '', end: '' });
  }

  removeTimeSlot(day: string, indexToRemove: number): void {
    if (this.currentAvailability[day]) {
      this.currentAvailability[day] = this.currentAvailability[day].filter(
        (_, index) => index !== indexToRemove
      );
      // If no slots left for the day, remove the day entry entirely
      if (this.currentAvailability[day].length === 0) {
        delete this.currentAvailability[day];
      }
    }
  }

  handleTimeChange(day: string): void {}

  toggleDaySelection(day: string, event: any) {
    const checked = event.target.checked;
    if (checked) {
      if (
        !this.currentAvailability[day] ||
        this.currentAvailability[day].length === 0
      ) {
        this.currentAvailability[day] = [{ start: '09:00', end: '17:00' }];
        // Reasignamos el objeto para que Angular detecte cambios
        this.currentAvailability = { ...this.currentAvailability };
      }
    } else {
      // Eliminamos el día del objeto
      const updated = { ...this.currentAvailability };
      delete updated[day];
      this.currentAvailability = updated;
    }
  }

  handleClose() {
    this.close.emit();
  }
}
