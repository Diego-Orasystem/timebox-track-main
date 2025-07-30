import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-eje-aplicativo',
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
        <h1 class=" text-[14px] font-semibold">Eje y Aplicativo</h1>
        <div class="eje flex flex-col gap-2">
          <label class=" text-[12px]" for="eje">Eje de desarrollo</label>
          <input
            [(ngModel)]="eje"
            placeholder="Escribe aquí"
            id="eje"
            class="border border-[var(--lines)] py-2 rounded-sm text-[12px] px-2 placeholder:text-[var(--disabled)]"
            type="text"
          />
          <label class=" text-[12px]" for="aplicativo">Aplicativo</label>
          <input
            [(ngModel)]="aplicativo"
            placeholder="Escribe aquí"
            id="aplicativo"
            class="border border-[var(--lines)] py-2 rounded-sm text-[12px] px-2 placeholder:text-[var(--disabled)]"
            type="text"
          />
        </div>
        <button
          (click)="save()"
          class="w-full cursor-pointer text-sm  inline-flex items-center justify-center py-2 bg-[var(--primary)] text-[var(--lightText)]  rounded-sm"
        >
          Guardar
        </button>
      </div>
    </div>
  </div> `,
})
export class ModalEjeAplicativoComponent {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() info = new EventEmitter<{ eje: string; aplicativo: string }>();
  eje = '';
  aplicativo = '';

  save() {
    if (!this.eje.trim() || !this.aplicativo.trim()) return;
    this.info.emit({ eje: this.eje, aplicativo: this.aplicativo });
    this.eje = '';
    this.aplicativo = '';
    this.handleClose();
  }

  handleClose() {
    this.close.emit();
  }
}
