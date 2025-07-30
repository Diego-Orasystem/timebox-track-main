import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checklist-form',
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
      class="relative bg-white rounded-sm shadow-lg w-[270px] h-fit overflow-y-auto z-10"
    >
      <button
        class="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
        (click)="handleClose()"
      >
        ✕
      </button>

      <div class="content-modal w-full px-4 py-8 flex flex-col gap-4">
        <h1 class=" text-[14px] font-semibold">Añadir un item al Checklist</h1>
        <div class="eje flex flex-col gap-2">
          <input
            [(ngModel)]="nuevoItem"
            placeholder="Nuevo item"
            id="eje"
            class="border border-[var(--lines)] py-2 rounded-sm text-[12px] px-2 placeholder:text-[var(--disabled)]"
            type="text"
          />
        </div>
        <button
          (click)="addItem()"
          class="w-full cursor-pointer text-sm  inline-flex items-center justify-center py-2 bg-[var(--primary)] text-[var(--lightText)]  rounded-sm"
        >
          Añadir
        </button>
      </div>
    </div>
  </div> `,
})
export class ChecklistFormComponent {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  @Output() item = new EventEmitter<{ label: string; checked: boolean }>();

  nuevoItem = '';

  addItem() {
    if (!this.nuevoItem.trim()) return;
    this.item.emit({ label: this.nuevoItem, checked: false });
    this.nuevoItem = '';
    this.handleClose();
  }

  handleClose() {
    this.close.emit();
  }
}
