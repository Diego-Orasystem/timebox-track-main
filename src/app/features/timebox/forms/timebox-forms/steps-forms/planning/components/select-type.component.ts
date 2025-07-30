import { CommonModule, NgIf, NgFor } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeboxType } from '../../../../../../../shared/interfaces/timebox.interface';
import { Observable } from 'rxjs';
import { TimeboxTypeService } from '../../../../../pages/timebox-maintainer/services/timebox-maintainer.service';

@Component({
  selector: 'app-select-timebox-type',
  imports: [CommonModule, FormsModule, NgIf, NgFor], // Explicitly include NgIf and NgFor
  standalone: true,
  template: `
    <div class="relative w-full">
      <button
        class="group w-full inline-flex text-start items-center gap-2 text-[12px] bg-[var(--backgroundLight)] px-3 py-2 cursor-pointer rounded-md transition-all duration-200 ease-in-out border border-transparent hover:bg-slate-200 hover:border-slate-200"
        (click)="toggleDropdown()"
      >
        <div class="w-full inline-flex  items-center gap-2">
          <svg
            class="w-5 h-4 text-black"
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
                d="M10 12L12 14L14 10"
                stroke="#0B0B0B"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z"
                stroke="#0B0B0B"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </svg>
          {{ selectedTimeboxTypeName || 'Tipo timebox' }}
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
        class="absolute flex flex-col gap-1 w-full mt-1 bg-white shadow-lg rounded-md z-10 border-0 overflow-y-auto"
      >
        <li
          *ngFor="let opcion of opciones$ | async"
          class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[12px] "
          (click)="selectOption(opcion)"
        >
          {{ opcion.nombre }}
        </li>
      </ul>
    </div>
  `,
})
export class SelectTimeboxTypeComponent implements OnInit, OnChanges {
  @Input() timeboxTypeId: string | null = null; // Input to receive the ID from the parent

  selectedTimeboxTypeName: string = ''; // Stores the name for display

  opciones$!: Observable<TimeboxType[]>;

  isDropdownOpen = false;

  @Output() timeboxTypeChange = new EventEmitter<string>(); // Emitting the ID string

  constructor(private timeboxTypeService: TimeboxTypeService) {}
  ngOnInit(): void {
    this.opciones$ = this.timeboxTypeService.getAllTimeboxTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si el Input 'timeboxTypeId' ha cambiado
    if (changes['timeboxTypeId']) {
      const newTypeId = changes['timeboxTypeId'].currentValue;

      // Usar getValue() para obtener el valor actual del BehaviorSubject del servicio
      // Esto es síncrono y asegura que tienes los datos disponibles si ya se cargaron
      const currentOptions =
        this.timeboxTypeService.timeboxTypesSubject.getValue();

      const selectedType = currentOptions.find((opt) => opt.id === newTypeId);

      if (
        selectedType &&
        selectedType.nombre !== this.selectedTimeboxTypeName
      ) {
        this.selectedTimeboxTypeName = selectedType.nombre;
      } else if (!selectedType && (newTypeId === null || newTypeId === '')) {
        // Manejar el caso donde el input es nulo o vacío (ej. resetear el formulario)
        this.selectedTimeboxTypeName = '';
      }
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption(opcion: TimeboxType) {
    // Receive the full TimeboxType object
    this.selectedTimeboxTypeName = opcion.nombre;
    this.timeboxTypeChange.emit(opcion.id); // Emit the ID
    this.isDropdownOpen = false;
  }

  // onChange is not used in your template for this component
  onChange(value: string) {
    console.log(value);
    this.timeboxTypeChange.emit(value);
  }
}
