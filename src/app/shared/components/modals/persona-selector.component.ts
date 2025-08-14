import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { TimeboxApiService } from '../../../features/timebox/services/timebox-api.service';
import { Persona } from '../../../shared/interfaces/fases-timebox.interface';

@Component({
  selector: 'app-persona-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="show"
      class="fixed inset-0 flex items-center justify-center z-50"
    >
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black opacity-30 backdrop-blur-lg"
        (click)="handleClose()"
      ></div>

      <!-- Contenido del modal -->
      <div
        class="relative bg-white rounded-sm shadow-lg w-[270px] h-fit overflow-y-auto z-10"
      >
        <button
          class="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
          (click)="handleClose()"
        >
          ✕
        </button>

        <div class="content-modal w-full px-4 py-8 flex flex-col gap-4">
          <h1 class="text-[14px] font-semibold">Añadir persona</h1>

          <!-- Selector -->
          <div class="flex flex-col gap-2">
            <div class="relative w-full">
              <button
                class="w-full inline-flex justify-between gap-2 text-sm bg-[var(--backgroundLight)] border border-[var(--lines)] px-3 py-2 cursor-pointer rounded-sm"
                (click)="toggleDropdown()"
              >
                <div class="w-full inline-flex gap-2">
                  <span class="text-[12px]">{{
                    personaSeleccionada || 'Persona'
                  }}</span>
                </div>
                <svg
                  width="16px"
                  height="16px"
                  viewBox="0 0 24 24"
                  fill="#000000"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline
                    fill="none"
                    points="5 8.5 12 15.5 19 8.5"
                    stroke="#0B0B0B"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  ></polyline>
                </svg>
              </button>

              <ul
                *ngIf="isDropdownOpen"
                class="absolute flex flex-col gap-1 w-full mt-1 bg-white shadow-lg rounded-md z-10 border-0"
              >
                <li
                  *ngFor="let opcion of opciones"
                  class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[12px]"
                  (click)="selectOption(opcion)"
                >
                  {{ opcion }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Botón de agregar -->
          <button
            class="w-full cursor-pointer text-sm inline-flex items-center justify-center py-2 bg-[var(--primary)] text-[var(--lightText)] rounded-sm"
            [disabled]="!personaSeleccionada"
            (click)="addPerson()"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PersonaSelectorComponent implements OnInit {
  @Input() show = false;
  @Input() tipo: 'responsable' | 'participantes' = 'responsable';

  @Output() close = new EventEmitter<void>();
  @Output() personaSeleccionadaChange = new EventEmitter<{
    tipo: string;
    persona: string;
  }>();

  personaSeleccionada = '';
  opciones: string[] = [];
  isDropdownOpen = false;
  personas: Persona[] = [];

  constructor(private timeboxApiService: TimeboxApiService) {}

  ngOnInit(): void {
    // Cargar personas desde la API
    this.timeboxApiService.getPersonas().subscribe({
      next: (personas) => {
        this.personas = personas;
        // Convertir personas a opciones de texto
        this.opciones = personas.map(persona => `${persona.nombre} (${persona.email})`);
      },
      error: (error) => {
        console.error('Error cargando personas:', error);
        this.opciones = [];
      }
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption(opcion: string) {
    this.personaSeleccionada = opcion;
    this.isDropdownOpen = false;
  }

  addPerson() {
    if (!this.personaSeleccionada) return;
    
    // Extraer solo el nombre de la persona (sin el email)
    const personaNombre = this.personaSeleccionada.split(' (')[0];
    
    this.personaSeleccionadaChange.emit({
      tipo: this.tipo,
      persona: personaNombre,
    });
    this.personaSeleccionada = ''; // opcional: limpiar selección
    this.handleClose(); // opcional: cerrar modal tras añadir
  }

  handleClose() {
    this.close.emit();
  }
}
