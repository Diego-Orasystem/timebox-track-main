import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { UploadService } from '../../services/upload.service';
import { Observable } from 'rxjs';

export interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  responsable?: any;
  adjuntos?: {
    id?: string;
    nombreArchivo: string;
    descripcion?: string;
    url?: string;
  }[];
  fechaCreacion?: string;
}

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      *ngIf="show"
      class="fixed inset-0 flex items-center justify-center bg-black/50  z-50"
      (click)="handleClose()"
    >
      <div
        class="bg-white rounded-lg shadow-2xl p-6 w-11/12 sm:w-1/2 lg:w-1/2 relative max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <!-- Close -->
        <button
          class="absolute top-2 right-4 text-gray-400 hover:text-gray-600 text-lg"
          (click)="handleClose()"
          type="button"
        >
          ✕
        </button>

        <h2 class="text-xl font-bold mb-4">
          {{ mode === 'create' ? 'Crear Producto' : 'Editar Producto' }}
        </h2>

        <form
          [formGroup]="productForm"
          (ngSubmit)="onSubmit()"
          class="space-y-4"
        >
          <!-- Nombre -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Nombre</label
            >
            <input
              type="text"
              formControlName="nombre"
              class="w-full border placeholder:text-gray-500 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-[var(--primary)] text-sm"
              placeholder="Nombre del producto"
            />
            <p
              *ngIf="
                productForm.get('nombre')?.invalid &&
                productForm.get('nombre')?.touched
              "
              class="text-red-500 text-xs mt-1"
            >
              El nombre es obligatorio.
            </p>
          </div>

          <!-- Descripción -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Descripción</label
            >
            <textarea
              formControlName="descripcion"
              rows="3"
              class="w-full border placeholder:text-gray-500 border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-[var(--primary)] text-sm"
              placeholder="Descripción del producto"
            ></textarea>
            <p
              *ngIf="
                productForm.get('descripcion')?.invalid &&
                productForm.get('descripcion')?.touched
              "
              class="text-red-500 text-xs mt-1"
            >
              La descripción es obligatoria.
            </p>
          </div>

          <!-- File input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Documentación (adjuntar)</label
            >

            <input
              type="file"
              (change)="onFilesSelected($event)"
              multiple
              class="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 
                     file:rounded-md file:border-0 file:text-sm file:font-semibold 
                     file:bg-indigo-50 file:text-[var(--primary)] hover:file:bg-indigo-100 cursor-pointer"
            />
            <p class="text-xs text-gray-500 mt-2">
              Puedes seleccionar uno o varios archivos. Se subirán
              automáticamente.
            </p>
          </div>

          <!-- Lista de adjuntos (FormArray) -->
          <div
            formArrayName="adjuntos"
            *ngIf="adjuntos.length > 0"
            class="mt-4"
          >
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Archivos adjuntos</label
            >

            <div
              *ngFor="let adjFG of adjuntos.controls; let i = index"
              [formGroupName]="i"
              class="flex items-start gap-3 p-3 mb-2 border border-gray-200 rounded-md bg-gray-50"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-800 truncate">
                    📎
                    <a
                      *ngIf="adjFG.value.url; else plainName"
                      [href]="adjFG.value.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="underline text-[var(--primary)]"
                      >{{ adjFG.value.nombreArchivo }}</a
                    >
                    <ng-template #plainName>{{
                      adjFG.value.nombreArchivo
                    }}</ng-template>
                  </p>
                </div>

                <input
                  type="text"
                  formControlName="descripcion"
                  placeholder="Nombre o justificación del archivo"
                  class="mt-2 w-full border bg-white border-gray-300 placeholder:text-gray-500 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div class="flex flex-col items-end gap-2">
                <button
                  type="button"
                  (click)="removeAdjunto(i)"
                  class="text-gray-400 hover:text-red-500 cursor-pointer duration-200"
                  title="Eliminar adjunto"
                >
                  x
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              (click)="handleClose()"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="productForm.invalid"
              (click)="onSubmit()"
              class="px-4 py-2 bg-[var(--primary)] text-white rounded-sm hover:bg-[var(--primaryDark)] disabled:opacity-50"
            >
              {{ mode === 'create' ? 'Crear' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ProductModalComponent implements OnInit, OnChanges {
  @Input() show = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() productData: Product | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() productSaved = new EventEmitter<Product>();

  productForm!: FormGroup;

  constructor(private fb: FormBuilder, private uploadService: UploadService) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando cambie productData o se abra el modal, parchear valores
    if (changes['productData'] && !changes['productData'].isFirstChange()) {
      this.patchProductData();
    }
    if (changes['show'] && changes['show'].currentValue) {
      // Si se abre y hay productData (modo edit), cargar
      this.patchProductData();
    }
  }

  private buildForm(): void {
    this.productForm = this.fb.group({
      nombre: [this.productData?.nombre || '', Validators.required],
      descripcion: [this.productData?.descripcion || '', Validators.required],
      adjuntos: this.fb.array([]),
    });

    // Si ya había adjuntos en productData al inicializar, cárgalos
    if (this.productData?.adjuntos?.length) {
      this.productData.adjuntos.forEach((a) => this.pushAdjuntoFromData(a));
    }
  }

  private patchProductData(): void {
    if (!this.productForm) {
      this.buildForm();
      return;
    }
    this.productForm.patchValue({
      nombre: this.productData?.nombre || '',
      descripcion: this.productData?.descripcion || '',
    });

    // limpiar formarray y recargar adjuntos (si existen)
    this.adjuntos.clear();
    if (this.productData?.adjuntos?.length) {
      this.productData.adjuntos.forEach((a) => this.pushAdjuntoFromData(a));
    }
  }

  /** FormArray getter */
  get adjuntos(): FormArray {
    return this.productForm.get('adjuntos') as FormArray;
  }

  /** Empuja un adjunto existente al FormArray */
  private pushAdjuntoFromData(a: {
    id?: string;
    nombreArchivo: string;
    descripcion?: string;
    url?: string;
  }): void {
    const fg = this.fb.group({
      id: [a.id || null],
      nombreArchivo: [a.nombreArchivo || '', Validators.required],
      descripcion: [a.descripcion || ''],
      url: [a.url || null],
    });
    this.adjuntos.push(fg);
  }

  /** Maneja selección de archivos (multiple supported) */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    // Subir cada archivo y añadir al form array
    for (const file of files) {
      // Opcional: mostrar un "placeholder" mientras sube
      const placeholderFG = this.fb.group({
        id: [null],
        nombreArchivo: [`${file.name} (subiendo...)`],
        descripcion: [''],
        url: [null],
      });
      this.adjuntos.push(placeholderFG);
      const indexOfPlaceholder = this.adjuntos.length - 1;

      // Llamada al servicio de subida
      this.uploadFileAndReplace(file).subscribe({
        next: (res) => {
          // asumimos res.data.id y opcional res.data.url
          const data = (res && (res as any).data) || {};
          // Reemplazar los valores del FG placeholder
          const fg = this.adjuntos.at(indexOfPlaceholder) as FormGroup;
          fg.patchValue({
            id: data.id || null,
            nombreArchivo: file.name,
            descripcion: '',
            url: data.url || null,
          });
        },
        error: (err) => {
          console.error('Error subiendo', file.name, err);
          // remover placeholder si falla
          this.adjuntos.removeAt(indexOfPlaceholder);
          alert(`Error al subir ${file.name}`);
        },
      });
    }

    // limpiar input para permitir re-subir mismos archivos
    input.value = '';
  }

  /** Wrapper para uploadService.uploadFile — devuelve Observable<any> */
  private uploadFileAndReplace(file: File): Observable<any> {
    // Si tu UploadService devuelve directamente el observable correcto, úsalo.
    // Aquí asumimos uploadFile(file): Observable<{ data: { id: string, url?: string } }>
    return this.uploadService.uploadFile(file);
  }

  /** Elimina adjunto por índice */
  removeAdjunto(index: number): void {
    // opcional: si el adj tiene id y deseas pedir confirmación o borrar del backend, hazlo aquí.
    this.adjuntos.removeAt(index);
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const value = this.productForm.value;
    const product: Product = {
      id: this.productData?.id || crypto.randomUUID(),
      nombre: value.nombre,
      descripcion: value.descripcion,
      fechaCreacion:
        this.productData?.fechaCreacion || new Date().toISOString(),
      adjuntos: value.adjuntos.map((a: any) => ({
        id: a.id,
        nombreArchivo: a.nombreArchivo,
        descripcion: a.descripcion,
        url: a.url,
      })),
    };

    this.productSaved.emit(product);
    this.handleClose();
  }

  handleClose(): void {
    this.close.emit();
    // reset form but keep structure (in case modal reused)
    if (this.productForm) {
      this.productForm.reset();
      this.adjuntos.clear();
    }
  }
}
