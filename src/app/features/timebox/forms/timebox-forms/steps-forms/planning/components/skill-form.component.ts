import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-skill-form',
  imports: [CommonModule, FormsModule],
  template: `<div
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
      class="relative bg-white rounded-sm shadow-lg w-[300px] h-fit overflow-y-auto z-10"
    >
      <button
        class="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
        (click)="handleClose()"
      >
        ✕
      </button>

      <div class="content-modal w-full px-4 py-8 flex flex-col gap-4">
        <h1 class=" text-[14px] font-semibold">Añadir Skills</h1>

        <div class="eje flex flex-col gap-2">
          <label class=" text-[12px]" for="aplicativo">Tipo Skill</label>
          <div class="relative w-full">
            <button
              class="w-full inline-flex start justify-between gap-2 text-sm bg-[var(--backgroundLight)] border border-[var(--lines)] px-3 py-2 cursor-pointer rounded-sm"
              (click)="toggleDropdown()"
            >
              <div class="w-full inline-flex gap-2">
                <span class="text-[12px]">{{
                  tipeSeleccionado || 'Tipo'
                }}</span>
              </div>
              <svg
                width="16px"
                height="16px"
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
                    <g id="F-Chevron">
                      <polyline
                        fill="none"
                        id="Down"
                        points="5 8.5 12 15.5 19 8.5"
                        stroke="#0B0B0B"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      ></polyline>
                    </g>
                  </g>
                </g>
              </svg>
            </button>

            <ul
              *ngIf="isDropdownOpen"
              class="absolute flex flex-col gap-1 w-full mt-1 bg-white shadow-lg rounded-md z-10 border-0 "
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
          <label class=" text-[12px]" for="nombreSkill">Nombre</label>
          <input
            [(ngModel)]="nombre"
            placeholder="Escribe aquí"
            id="Frontend / Angular"
            class="border border-[var(--lines)] py-2 rounded-sm text-[12px] px-2 placeholder:text-[var(--disabled)]"
            type="text"
          />
        </div>
        <button
          (click)="addSkill()"
          class="w-full cursor-pointer text-sm  inline-flex items-center justify-center py-2 bg-[var(--primary)] text-[var(--lightText)]  rounded-sm"
        >
          Añadir
        </button>
      </div>
    </div>
  </div> `,
})
export class SkillFormComponent {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() info = new EventEmitter<{ tipo: string; nombre: string }>();

  tipeSeleccionado = '';

  opciones = ['Conceptual', 'Tecnológica'];

  nombre = '';

  isDropdownOpen = false;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption(opcion: string) {
    this.tipeSeleccionado = opcion;
    this.isDropdownOpen = false;
  }

  addSkill() {
    if (!this.nombre.trim() || !this.tipeSeleccionado.trim()) return;
    this.info.emit({
      tipo:
        this.tipeSeleccionado == 'Conceptual' ? 'Conceptuales' : 'Tecnológicas',
      nombre: this.nombre,
    });
    this.tipeSeleccionado = '';
    this.nombre = '';
    this.handleClose();
  }

  handleClose() {
    this.close.emit();
  }
}
