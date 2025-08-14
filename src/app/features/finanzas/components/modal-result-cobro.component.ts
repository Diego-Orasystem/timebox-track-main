import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-result-cobro',
  imports: [CommonModule, FormsModule],
  template: `
    <style>
      .card {
        width: 400px;
        height: fit-content;
        background-color: rgb(255, 255, 255);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px 30px;
        gap: 20px;
        position: relative;
        overflow: hidden;
        box-shadow: 2px 2px 20px rgba(0, 0, 0, 0.062);
      }

      .titleHeading {
        font-size: 1.2em;
        font-weight: 800;
        color: rgb(26, 26, 26);
      }

      .modalDescription {
        text-align: center;
        font-size: 0.7em;
        font-weight: 600;
        color: rgb(99, 99, 99);
      }

      .modalDescription a {
        --tw-text-opacity: 1;
        color: rgb(59 130 246);
      }

      .modalDescription a:hover {
        -webkit-text-decoration-line: underline;
        text-decoration-line: underline;
      }

      .buttonContainer {
        display: flex;
        gap: 20px;
        flex-direction: row;
        width: 100%;
      }
    </style>
    <div
      *ngIf="show"
      class="fixed inset-0 flex items-center justify-center z-50"
    >
      <!-- Overlay de fondo -->
      <div
        class="absolute inset-0 bg-black opacity-30 backdrop-blur-lg"
        (click)="handleClose()"
      ></div>

      <!-- Contenedor principal del modal (la tarjeta) -->
      <div class="card">
        <div class="">
          <svg
            fill="#5046E5"
            width="64px"
            height="64px"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                fill-rule="evenodd"
                d="M12,2 C17.5228475,2 22,6.4771525 22,12 C22,17.5228475 17.5228475,22 12,22 C6.4771525,22 2,17.5228475 2,12 C2,6.4771525 6.4771525,2 12,2 Z M12,4 C7.581722,4 4,7.581722 4,12 C4,16.418278 7.581722,20 12,20 C16.418278,20 20,16.418278 20,12 C20,7.581722 16.418278,4 12,4 Z M15.2928932,8.29289322 L10,13.5857864 L8.70710678,12.2928932 C8.31658249,11.9023689 7.68341751,11.9023689 7.29289322,12.2928932 C6.90236893,12.6834175 6.90236893,13.3165825 7.29289322,13.7071068 L9.29289322,15.7071068 C9.68341751,16.0976311 10.3165825,16.0976311 10.7071068,15.7071068 L16.7071068,9.70710678 C17.0976311,9.31658249 17.0976311,8.68341751 16.7071068,8.29289322 C16.3165825,7.90236893 15.6834175,7.90236893 15.2928932,8.29289322 Z"
              ></path>
            </g>
          </svg>
        </div>
        <!-- Título del modal -->
        <div class="titleHeading">
          <ng-container [ngSwitch]="result">
            <ng-container *ngSwitchCase="'success'"
              >Operación exitosa</ng-container
            >
            <ng-container *ngSwitchCase="'error'">Error</ng-container>
          </ng-container>
        </div>

        <!-- Descripción del modal -->
        <div class="modalDescription">
          <ng-container [ngSwitch]="result">
            <ng-container *ngSwitchCase="'success'"
              >La solicitud de cobro fue ingresada exitosamente, proximamente
              podrá ver el estado de esta en la sección
              <b>Mis pagos</b>.</ng-container
            >
            <ng-container *ngSwitchCase="'error'"
              >Algo ocurrió. Por favor, intente nuevamente.
            </ng-container>
          </ng-container>
        </div>

        <!-- Contenedor de botones -->
        <div class="buttonContainer">
          <button
            (click)="handleClose()"
            class="px-4 py-2 text-sm w-full font-medium text-white bg-[var(--primary)] rounded-sm hover:bg-[var(--primaryDark)] focus:outline-none cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
})
export class ModalResultCobroComponent {
  @Input() show = false;
  @Input() result: 'success' | 'error' = 'success';
  @Output() close = new EventEmitter<void>();

  handleClose() {
    this.close.emit();
  }
}
