import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EntregableService } from '../../../../../services/entregable.service';
import { Entregable } from '../../../../../../../shared/interfaces/product.interface';

@Component({
  selector: 'app-select-entregable',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor],
  providers: [EntregableService],
  standalone: true,
  template: `
    <div class="relative w-full">
      <button
        class="group w-full inline-flex text-start items-center gap-2 text-[12px] bg-[var(--backgroundLight)] px-3 py-2 cursor-pointer rounded-md transition-all duration-200 ease-in-out border border-transparent hover:bg-slate-200 hover:border-slate-200"
        (click)="toggleDropdown()"
      >
        <div class="w-full inline-flex gap-2 items-center">
          <!-- Icono de Entregable (documento) -->
          <svg class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              d="M7 3h6l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              d="M13 3v5h5" />
          </svg>
          {{ labelSeleccionado || 'Seleccionar entregable' }}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-black">
          <polyline points="5 8.5 12 15.5 19 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <ul
        *ngIf="isDropdownOpen"
        class="absolute flex flex-col gap-1 w-full mt-1 bg-white shadow-lg rounded-md z-10 border-0 "
      >
        <li
          *ngFor="let e of entregables"
          class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[12px] flex items-center gap-2"
          (click)="selectEntregable(e)"
          [title]="e.descripcion || e.nombre"
        >
          <!-- Ícono según tipo -->
          <ng-container [ngSwitch]="e.tipo">
            <!-- Release -->
            <svg *ngSwitchCase="'Release'" class="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                d="M5 12h14M12 5v14" />
            </svg>
            <!-- Sprint -->
            <svg *ngSwitchCase="'Sprint'" class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                d="M4 7h11a4 4 0 0 1 0 8H7M4 7v10M7 21v-3" />
            </svg>
            <!-- Milestone -->
            <svg *ngSwitchCase="'Milestone'" class="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                d="M5 3h14l-2 6 2 6H5l2-6-2-6z" />
            </svg>
            <!-- Default: documento -->
            <svg *ngSwitchDefault class="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                d="M7 3h6l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                d="M13 3v5h5" />
            </svg>
          </ng-container>

          {{ e.nombre }}
          <span class="text-[10px] text-gray-500" *ngIf="e.tipo">({{ e.tipo }})</span>
        </li>
      </ul>
    </div>
  `,
})
export class SelectEntregableComponent implements OnInit {
  // Permite setear un entregable preseleccionado desde el padre
  @Input() entregableId?: string | null;
  @Output() entregableChange = new EventEmitter<{ id: string; nombre: string }>();

  entregables: Entregable[] = [];
  labelSeleccionado: string = '';
  isDropdownOpen = false;

  constructor(private entregableService: EntregableService) {}

  ngOnInit(): void {
    this.entregableService.getAll().subscribe({
      next: (list) => {
        this.entregables = list || [];
        // Si viene un ID preseleccionado, reflejarlo
        if (this.entregableId) {
          const pre = this.entregables.find((e) => e.id === this.entregableId);
          if (pre) {
            this.labelSeleccionado = pre.nombre;
            this.entregableChange.emit({ id: pre.id, nombre: pre.nombre });
          }
        }
      },
      error: (err) => {
        console.error('Error cargando entregables:', err);
        this.entregables = [];
      },
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectEntregable(e: Entregable): void {
    this.labelSeleccionado = e.nombre;
    this.entregableChange.emit({ id: e.id, nombre: e.nombre });
    this.isDropdownOpen = false;
  }
}
