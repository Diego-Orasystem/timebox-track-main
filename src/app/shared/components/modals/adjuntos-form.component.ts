import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-adjuntos-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        class="relative bg-white rounded-sm shadow-lg w-[300px] h-fit overflow-y-auto z-10"
      >
        <button
          class="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
          (click)="handleClose()"
        >
          ✕
        </button>

        <div class="content-modal w-full px-4 py-8 flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h1 class="text-[14px] font-semibold">Adjuntar</h1>
            <p class="text-[12px]">Puedes adjuntar hasta 10 archivos</p>
          </div>

          <!-- Botón para elegir archivos -->
          <button
            class="w-full cursor-pointer text-sm inline-flex items-center justify-center py-2 bg-[var(--backgroundActive)] text-[var(--lightText)] rounded-sm"
            (click)="triggerFileInput()"
          >
            Elige archivos
          </button>

          <!-- Mostrar lista de archivos -->
          <div
            *ngIf="selectedFiles.length"
            class="text-[12px] space-y-1 max-h-32 overflow-y-auto"
          >
            <div
              *ngFor="let file of selectedFiles; let i = index"
              class="flex justify-between items-center"
            >
              <span class="truncate">{{ file.name }}</span>
              <button class="text-xs text-red-500 ml-2" (click)="removeFile(i)">
                ✕
              </button>
            </div>
          </div>

          <!-- Botón para confirmar subida -->
          <button
            *ngIf="selectedFiles.length"
            class="w-full py-2 bg-[var(--primary)] text-white rounded-sm text-sm cursor-pointer"
            (click)="submitFiles()"
          >
            Subir
            {{
              selectedFiles.length === 1
                ? 'archivo'
                : selectedFiles.length + ' archivos'
            }}
          </button>

          <!-- Input de tipo file oculto -->
          <input
            type="file"
            #fileInput
            class="hidden"
            multiple
            (change)="onFilesSelected($event)"
          />
        </div>
      </div>
    </div>
  `,
})
export class AdjuntosFormComponent {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() filesSelected = new EventEmitter<File[]>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedFiles: File[] = [];

  handleClose() {
    this.close.emit();
  }

  triggerFileInput() {
    this.fileInputRef.nativeElement.click();
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const newFiles = Array.from(input.files);
      const totalFiles = this.selectedFiles.length + newFiles.length;

      if (totalFiles > 10) {
        alert('Solo puedes adjuntar hasta 10 archivos.');
        return;
      }

      this.selectedFiles.push(...newFiles);
    }

    // Limpiar el input para permitir volver a seleccionar los mismos archivos si se eliminan
    this.fileInputRef.nativeElement.value = '';
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  submitFiles() {
    if (this.selectedFiles.length) {
      this.filesSelected.emit(this.selectedFiles);
      this.selectedFiles = [];
      this.handleClose();
    }
  }
}
