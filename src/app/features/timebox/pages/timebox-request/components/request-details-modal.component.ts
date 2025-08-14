import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlattenedRequest } from '../timebox-request.component';
import { formatDate } from '../../../../../shared/helpers/date-formatter';

@Component({
  selector: 'app-request-details-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show" class="fixed inset-0 flex items-center justify-center z-50">
      <div
        class="absolute inset-0 bg-black opacity-30 backdrop-blur-lg"
        (click)="close.emit()"
      ></div>

      <div class="card">
        <div class="flex flex-col gap-4 bg-white rounded-sm shadow-lg p-6 relative z-10 max-w-2xl w-full mx-4">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-lg font-bold text-[var(--darkText)]">
                Detalles de la Solicitud
              </h2>
              <p class="text-sm text-[var(--text-medium)]">
                Información detallada de la postulación
              </p>
            </div>
            <button
              (click)="close.emit()"
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <hr class="border-t border-gray-200" />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Información del Timebox -->
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-[var(--primary)]">
                Información del Timebox
              </h3>
              <div>
                <p class="text-xs text-[var(--text-light)]">ID del Timebox</p>
                <p class="text-sm font-medium">{{ request.timeboxId }}</p>
              </div>
              <div>
                <p class="text-xs text-[var(--text-light)]">Nombre del Timebox</p>
                <p class="text-sm font-medium">{{ request.timeboxName }}</p>
              </div>
              <div>
                <p class="text-xs text-[var(--text-light)]">Estado del Timebox</p>
                <p class="text-sm font-medium">{{ request.timeboxStatus }}</p>
              </div>
            </div>

            <!-- Información de la Postulación -->
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-[var(--primary)]">
                Información de la Postulación
              </h3>
              <div>
                <p class="text-xs text-[var(--text-light)]">Postulante</p>
                <p class="text-sm font-medium">{{ request.postulacion.desarrollador }}</p>
              </div>
              <div>
                <p class="text-xs text-[var(--text-light)]">Rol Solicitado</p>
                <p class="text-sm font-medium">{{ request.postulacion.rol }}</p>
              </div>
              <div>
                <p class="text-xs text-[var(--text-light)]">Fecha de Postulación</p>
                <p class="text-sm font-medium">
                  {{ getFormattedDate(request.postulacion.fechaPostulacion) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[var(--text-light)]">Estado de la Solicitud</p>
                <div
                  class="inline-flex items-center text-xs font-semibold py-1.5 px-3 rounded-full"
                  [ngClass]="{
                    'bg-yellow-100 text-yellow-700': request.requestStatus === 'pending',
                    'bg-green-100 text-green-700': request.requestStatus === 'approved',
                    'bg-red-100 text-red-700': request.requestStatus === 'rejected'
                  }"
                >
                  <span
                    class="w-2.5 h-2.5 rounded-full mr-2"
                    [ngClass]="{
                      'bg-yellow-500': request.requestStatus === 'pending',
                      'bg-green-500': request.requestStatus === 'approved',
                      'bg-red-500': request.requestStatus === 'rejected'
                    }"
                  ></span>
                  <ng-container [ngSwitch]="request.requestStatus">
                    <ng-container *ngSwitchCase="'pending'">Pendiente</ng-container>
                    <ng-container *ngSwitchCase="'approved'">Aprobada</ng-container>
                    <ng-container *ngSwitchCase="'rejected'">Rechazada</ng-container>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex justify-end gap-3 mt-4" *ngIf="request.requestStatus === 'pending'">
            <button
              (click)="reject.emit(request)"
              class="px-4 py-2 text-sm font-medium rounded-sm text-red-500 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500 transition-colors duration-200 cursor-pointer"
            >
              Rechazar
            </button>
            <button
              (click)="accept.emit(request)"
              class="px-4 py-2 text-sm font-medium rounded-sm text-[var(--primary)] hover:text-[var(--primaryDark)] hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500 transition-colors duration-200 cursor-pointer"
            >
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RequestDetailsModalComponent {
  @Input() show = false;
  @Input() request!: FlattenedRequest;
  @Output() close = new EventEmitter<void>();
  @Output() accept = new EventEmitter<FlattenedRequest>();
  @Output() reject = new EventEmitter<FlattenedRequest>();

  getFormattedDate(date: string | undefined): string {
    if (date == undefined || date == '') return '';
    const dateToDate = new Date(date);
    return formatDate(dateToDate);
  }
}
