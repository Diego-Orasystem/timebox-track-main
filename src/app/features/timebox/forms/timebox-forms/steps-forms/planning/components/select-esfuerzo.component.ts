import {
  CommonModule,
  NgIf, // Ensure NgIf is imported explicitly if not implicitly resolved
  NgFor, // Ensure NgFor is imported explicitly if not implicitly resolved
} from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  Input, // Import Input
  OnChanges, // Import OnChanges
  SimpleChanges, // Import SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select-esfuerzo',
  imports: [CommonModule, FormsModule, NgIf, NgFor], // Explicitly include NgIf and NgFor
  standalone: true, // Assuming this is a standalone component
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
            fill="none"
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
                d="M3 9H21M7 3V5M17 3V5M6 13H8M6 17H8M11 13H13M11 17H13M16 13H18M16 17H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"
                stroke="#0B0B0B"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </g>
          </svg>
          {{ esfuerzoSeleccionado || 'Esfuerzo' }}
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
export class SelectEsfuerzoComponent implements OnChanges {
  // Implement OnChanges
  @Input() esfuerzo: string | null = null; // New Input property

  esfuerzoSeleccionado: string = '';

  opciones = ['1 sem', '2 sem', '3 sem'];

  isDropdownOpen = false;

  @Output() esfuerzoChange = new EventEmitter<string>();

  // Implement ngOnChanges to react to input property changes
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['esfuerzo'] &&
      changes['esfuerzo'].currentValue !== this.esfuerzoSeleccionado
    ) {
      this.esfuerzoSeleccionado = changes['esfuerzo'].currentValue || '';
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption(opcion: string) {
    this.esfuerzoSeleccionado = opcion;
    this.esfuerzoChange.emit(opcion);
    this.isDropdownOpen = false;
  }

  onChange(value: string) {
    this.esfuerzoChange.emit(value);
  }
}
