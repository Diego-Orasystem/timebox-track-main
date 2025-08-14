import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-item-creation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="show"
      class="fixed inset-0 overflow-y-auto h-full w-full flex items-center justify-center z-50"
    >
      <div
        class="absolute inset-0 bg-black opacity-30 backdrop-blur-lg"
        (click)="handleClose()"
      ></div>
      <div class="bg-white p-6 rounded-md shadow-xl w-1/3 relative">
        <button
          class="absolute top-2 right-6 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
          (click)="handleClose()"
        >
          ✕
        </button>
        <h2 class="text-xl font-bold mb-4">
          {{ mode === 'create' ? 'Crear nuevo item' : 'Editar item' }}
        </h2>
        <div>
          <div class="mb-4" *ngIf="showTypeSelection">
            <label for="itemType" class="text-xs font-semibold">Nuevo</label>
            <select
              id="itemType"
              [(ngModel)]="selectedTypeItem"
              class="block w-full py-2 px-3 border border-gray-300 bg-white rounded-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm text-gray-700"
              (change)="onTypeChange()"
            >
              <option disabled [selected]="!selectedTypeItem">
                Selecciona un tipo
              </option>
              <option *ngFor="let type of availableTypes" [value]="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label
              for="name"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Nombre</label
            >
            <input
              type="text"
              id="name"
              name="name"
              [(ngModel)]="itemName"
              class="block w-full px-3 py-2 rounded-sm border border-gray-100 focus:border-[var(--primary)] focus:ring-0 text-sm"
              required
            />
          </div>
          <div class="mb-4">
            <label
              for="description"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Descripción</label
            >
            <textarea
              id="description"
              name="description"
              [(ngModel)]="itemDescription"
              rows="3"
              class="block w-full px-3 py-2 rounded-sm border border-gray-100 focus:border-[var(--primary)] focus:ring-0 text-sm"
            ></textarea>
          </div>

          <label
            class="block flex-1 mb-4"
            *ngIf="
              selectedTypeItem === 'Documento' ||
              selectedTypeItem === 'Video' ||
              selectedTypeItem === 'Imagen' ||
              selectedTypeItem === 'Imágen'
            "
          >
            <span class="sr-only">Choose file</span>
            <input
              (change)="handleFileSelected($event)"
              type="file"
              class="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-[var(--primary)] hover:file:bg-indigo-100 cursor-pointer"
            />
            <span *ngIf="selectedFile" class="mt-2 text-sm text-gray-500"
              >Archivo seleccionado: {{ selectedFile.name }}</span
            >
          </label>

          <div class="flex justify-end space-x-2">
            <button
              type="button"
              (click)="handleClose()"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              (click)="onSubmit()"
              class="px-4 py-2 bg-[var(--primary)] text-white rounded-sm hover:bg-[var(--primaryDark)]"
            >
              {{ mode === 'create' ? 'Crear' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ItemCreationModalComponent implements OnInit, OnChanges {
  @Input() show: boolean = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() itemData: any; // Datos del elemento si estamos en modo 'edit'

  // Si estamos creando un ítem dentro de un padre (proyecto o carpeta), este será su ID
  @Input() parentId: string | null = null;
  // El tipo de ítem que se va a crear o editar. Puede ser un solo tipo (e.g., 'Proyecto' para la vista de proyectos)
  // o null si el modal debe ofrecer varias opciones (e.g., en una vista de contenido de carpeta).
  @Input() itemTypeContext:
    | 'Proyecto'
    | 'Carpeta'
    | 'Documento'
    | 'Video'
    | 'Imagen'
    | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() itemSaved = new EventEmitter<any>(); // Emitirá el nuevo/actualizado item

  itemName: string = '';
  itemDescription: string = '';
  selectedTypeItem: string = ''; // El tipo seleccionado por el usuario en el dropdown
  availableTypes: string[] = []; // Opciones disponibles en el dropdown
  showTypeSelection: boolean = true; // Controla la visibilidad del select de tipo

  selectedFile: File | null = null;

  constructor(private uploadService: UploadService) {}

  ngOnInit(): void {
    this.initializeModal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reinicializar cuando cambien las propiedades de entrada importantes
    if ((changes['show'] && changes['show'].currentValue) || 
        changes['itemTypeContext'] || 
        changes['parentId'] || 
        changes['mode']) {
      this.initializeModal();
    }
  }

  private initializeModal(): void {
    // Si `itemTypeContext` está definido, significa que el modal se invoca para crear
    // un tipo específico de ítem (ej. solo 'Proyecto').
    // Si es null, se permite al usuario elegir entre los tipos de contenido.
    if (this.itemTypeContext === 'Proyecto') {
      this.availableTypes = ['Proyecto'];
      this.showTypeSelection = false; // No mostrar el select si solo hay una opción predefinida
    } else if (this.parentId) {
      // Si hay un parentId, significa que estamos creando contenido dentro de un proyecto/carpeta
      this.availableTypes = ['Carpeta', 'Documento', 'Video', 'Imagen'];
      this.showTypeSelection = true;
    } else {
      // Caso por defecto si no hay context ni parentId, ofrecer todos (ej. desde una vista global de creación)
      this.availableTypes = [
        'Proyecto',
        'Carpeta',
        'Documento',
        'Video',
        'Imagen',
      ];
      this.showTypeSelection = true;
    }

    // Establecer el tipo seleccionado inicialmente
    if (this.itemTypeContext) {
      this.selectedTypeItem = this.itemTypeContext;
    } else if (this.parentId) {
      // Si hay parentId, usar 'Carpeta' como tipo por defecto
      this.selectedTypeItem = 'Carpeta';
    } else if (this.availableTypes.length > 0) {
      // Si no hay un contexto específico y hay opciones, seleccionar la primera por defecto
      this.selectedTypeItem = this.availableTypes[0];
    }

    if (this.mode === 'edit' && this.itemData) {
      this.itemName = this.itemData.nombre || '';
      this.itemDescription = this.itemData.descripcion || '';
      this.selectedTypeItem = this.itemData.tipo || ''; // En edición, se muestra el tipo actual
      // Lógica para previsualizar archivo si existe en modo edición
      if (
        this.itemData.adjunto &&
        (this.selectedTypeItem === 'Documento' ||
          this.selectedTypeItem === 'Video' ||
          this.selectedTypeItem === 'Imagen' ||
          this.selectedTypeItem === 'Imágen')
      ) {
        // En un caso real, no tendrías el objeto File original al editar,
        // solo el nombre/URL. Aquí podrías simularlo o mostrar un placeholder.
        // this.fileName = this.itemData.adjunto.nombre;
        // this.fileUrl = this.itemData.adjunto.url;
      }
    }
  }

  // Permite reaccionar si el usuario cambia el tipo en el select
  onTypeChange(): void {
    // Si cambia el tipo a uno que requiere archivo, el input de archivo aparecerá automáticamente por el *ngIf
    // Si cambia a 'Proyecto' o 'Carpeta', el input de archivo desaparecerá.
    this.selectedFile = null; // Limpiar el archivo seleccionado si el tipo cambia
  }

  handleClose(): void {
    this.close.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.itemName = '';
    this.itemDescription = '';
    this.selectedFile = null;
    this.initializeModal();
  }

  handleFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedTypeItem || !this.itemName) {
      alert('Por favor, selecciona un tipo y proporciona un nombre.');
      return;
    }

    const newItem: any = {
      nombre: this.itemName,
      descripcion: this.itemDescription,
    };

    // Si estamos creando un proyecto (no contenido dentro de un proyecto)
    if (this.selectedTypeItem === 'Proyecto') {
      // Para proyectos, no necesitamos tipo ni parentId
      newItem.fechaCreacion = new Date().toISOString();
      this.itemSaved.emit(newItem);
      this.handleClose();
      return;
    }

    // Para contenido dentro de proyectos, usar la estructura correcta
    newItem.tipo = this.selectedTypeItem;
    if (this.parentId) {
      newItem.parentId = this.parentId;
    }

    // Lógica para manejar adjuntos (documentos, videos, imágenes)
    if (
      this.selectedTypeItem === 'Documento' ||
      this.selectedTypeItem === 'Video' ||
      this.selectedTypeItem === 'Imagen' ||
      this.selectedTypeItem === 'Imágen'
    ) {
      if (this.selectedFile) {
        try {
          // Subir el archivo usando el servicio
          this.uploadService.uploadFile(this.selectedFile).subscribe({
            next: (uploadResult) => {
              // Agregar el adjuntoId al nuevo item
              newItem.adjuntoId = uploadResult.data.id;
              
              // Continuar con la creación del item
              this.itemSaved.emit(newItem);
              this.handleClose();
            },
            error: (error) => {
              console.error('Error al subir archivo:', error);
              alert(`Error al subir archivo: ${error.message || 'Error desconocido'}`);
            }
          });
          return; // Salir aquí para evitar que se ejecute el código siguiente
        } catch (error) {
          console.error('Error al subir archivo:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir archivo';
          alert(`Error al subir archivo: ${errorMessage}`);
          return;
        }
      } else if (this.mode === 'create') {
        alert('Por favor, selecciona un archivo para este tipo de ítem.');
        return;
      }
      // En modo 'edit', si no se selecciona un nuevo archivo, se asume que se mantiene el existente.
      if (
        this.mode === 'edit' &&
        this.itemData?.adjuntoId &&
        !this.selectedFile
      ) {
        newItem.adjuntoId = this.itemData.adjuntoId;
      }
    } else if (this.selectedTypeItem === 'Carpeta') {
      newItem.contenido = []; // Una carpeta empieza vacía
    }

    // Solo emitir si no hay archivo (los archivos se manejan en el subscribe)
    if (!this.selectedFile) {
      this.itemSaved.emit(newItem); // Emitimos el objeto con los datos
      this.handleClose(); // Cerrar el modal
    }
  }
}
