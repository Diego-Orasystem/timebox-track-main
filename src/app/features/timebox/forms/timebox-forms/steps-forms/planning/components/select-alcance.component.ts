import { CommonModule, NgIf, NgFor } from '@angular/common'; // Import NgIf and NgFor if they are not automatically resolved as standalone
import {
  Component,
  EventEmitter,
  Input, // Import Input
  Output,
  OnChanges, // Import OnChanges
  SimpleChanges, // Import SimpleChanges
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-select-alcance',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor], // Explicitly include NgIf and NgFor if not implicitly handled by Angular 17+ standalone
  standalone: true,
  template: `
    <div class="relative w-full">
      <button
        class="group w-full inline-flex text-start items-center gap-2 text-[12px] bg-[var(--backgroundLight)] px-3 py-2 cursor-pointer rounded-md transition-all duration-200 ease-in-out border border-transparent hover:bg-slate-200 hover:border-slate-200"
        (click)="toggleDropdown()"
      >
        <div class="w-full inline-flex gap-2">
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
                <g id="signal">
                  <g>
                    <path
                      d="M2.5,12A9.5,9.5,0,1,1,12,21.5"
                      fill="none"
                      stroke="#0B0B0B"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    ></path>
                    <path
                      d="M7.5,12A4.5,4.5,0,1,1,12,16.5"
                      fill="none"
                      stroke="#0B0B0B"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    ></path>
                  </g>
                </g>
              </g>
            </g>
          </svg>
          {{ alcanceSeleccionado || 'Alcance' }}
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
  `,
})
export class SelectAlcanceComponent implements OnChanges {
  // Implement OnChanges
  @Input() alcance: string | null = null; // New Input property to receive the value from the parent

  alcanceSeleccionado: string = ''; // Initialize to empty string

  opciones = [
    'Exploratorio',
    'Funcional inicial',
    'Deploy',
    'QA',
    'Mejora Funcional',
    'Mejora Correctiva',
    'Mejora Preventiva',
  ];

  isDropdownOpen = false;

  @Output() alcanceChange = new EventEmitter<string>();

  // Use ngOnChanges to react to input property changes
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['alcance'] &&
      changes['alcance'].currentValue !== this.alcanceSeleccionado
    ) {
      // Update alcanceSeleccionado if the input 'alcance' changes and is different from the current selected value
      this.alcanceSeleccionado = changes['alcance'].currentValue || ''; // Use || '' to handle null/undefined
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption(opcion: string) {
    this.alcanceSeleccionado = opcion;
    this.alcanceChange.emit(opcion);
    this.isDropdownOpen = false;
  }

  // The onChange method is not used in your current template, but keeping it won't hurt.
  onChange(value: string) {
    this.alcanceChange.emit(value);
  }
}
