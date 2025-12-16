import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Product, Entregable } from '../../../../shared/interfaces/product.interface';
import { EntregableService } from '../../../timebox/services/entregable.service';

@Component({
  selector: 'app-modal-create-entregable',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-create-entregable.component.html',
})
export class ModalCreateEntregableComponent implements OnChanges, OnInit {
  @Input() show: boolean = false;
  @Input() mode: 'create' | 'edit' = 'create';

  // NEW: product context and data to edit
  @Input() productId?: string;
  @Input() products$?: Observable<Product[]>;
  @Input() entregables$?: Observable<Entregable[]>;
  @Input() entregableData?: Entregable;

  // NEW: outputs
  @Output() close = new EventEmitter<void>();
  @Output() entregableOutput = new EventEmitter<Partial<Entregable>>();

  productName: string = '';                    // nombre del producto para cabecera

  entregableForm: FormGroup;
  selectedFiles: File[] = [];
  
  // Opciones para los selects
  tipoOptions: ('Release' | 'Increment')[] = ['Release', 'Increment'];

  private cachedEntregables: Entregable[] = [];

  constructor(private fb: FormBuilder, private entregableService: EntregableService) {
    this.entregableForm = this.fb.group({
      productId: ['', [Validators.required]],
      tipo: ['Release', [Validators.required]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      entregableId: [''],
      documentacion: [[]]
    });
  }

  ngOnInit(): void {
    // Si viene productId, setear en el form y resolver nombre
    if (this.productId) {
      this.entregableForm.patchValue({ productId: this.productId });
      this.resolveProductName();
    }

    // Suscripción para validar tipo vs entregable padre
    this.entregableForm.get('entregableId')?.valueChanges.subscribe(() => this.validateTipoMatchesParent());
    this.entregableForm.get('tipo')?.valueChanges.subscribe(() => this.validateTipoMatchesParent());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && this.productId) {
      this.entregableForm.patchValue({ productId: this.productId });
      this.resolveProductName();
    }

    if (changes['entregableData'] && this.entregableData && this.mode === 'edit') {
      this.entregableForm.patchValue({
        productId: this.entregableData.productId,
        tipo: this.entregableData.tipo,
        nombre: this.entregableData.nombre,
        descripcion: this.entregableData.descripcion,
        entregableId: this.entregableData.entregableId || ''
      });
    }
    
    // Actualizar productId si cambia desde el padre
    if (changes['productId'] && this.productId) {
      this.entregableForm.patchValue({ productId: this.productId });
    }

    // Cachear entregables cuando cambie el input entregables$
    if (changes['entregables$'] && this.entregables$) {
      this.entregables$.subscribe(list => {
        this.cachedEntregables = Array.isArray(list) ? list : [];
        // Revalidar si cambió el listado
        this.validateTipoMatchesParent();
      });
    }
  }

  // Validación: si hay entregable padre, el tipo debe coincidir
  private validateTipoMatchesParent(): void {
    const parentId = this.entregableForm.get('entregableId')?.value;
    const tipo = this.entregableForm.get('tipo')?.value;

    // Limpiar error previo
    const tipoCtrl = this.entregableForm.get('tipo');
    if (!tipoCtrl) return;
    tipoCtrl.setErrors(null);

    if (!parentId) return; // No hay padre, no hay restricción

    const parent = this.cachedEntregables.find(e => e.id === parentId);
    if (!parent) return;

    if (parent.tipo !== tipo) {
      // Setear error en el control tipo
      tipoCtrl.setErrors({ tipoMismatchWithParent: true });
      tipoCtrl.markAsTouched();
    }
  }

  handleClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onSubmit(): void {
    this.validateTipoMatchesParent();

    if (this.entregableForm.valid) {
      const formValue = this.entregableForm.value;

      // payload base para API
      const payload: Partial<Entregable> = {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        productId: this.productId || formValue.productId,
        tipo: formValue.tipo,
        entregableId: formValue.entregableId || null,
        documentacion: this.selectedFiles.length > 0 ? this.processFiles() : (this.entregableData?.documentacion || [])
      };

      if (this.mode === 'create') {
        // Crear entregable
        this.entregableService.create(payload).subscribe({
          next: (created) => {
            this.entregableOutput.emit(created);
            this.handleClose();
          },
          error: (err) => {
            console.error('Error creando entregable:', err);
            this.entregableForm.markAllAsTouched();
          }
        });
      } else {
        // Actualizar entregable existente
        if (!this.entregableData?.id) {
          console.warn('No hay ID de entregable para actualizar.');
          return;
        }
        this.entregableService.update(this.entregableData.id, payload).subscribe({
          next: (updated) => {
            this.entregableOutput.emit(updated);
            this.handleClose();
          },
          error: (err) => {
            console.error('Error actualizando entregable:', err);
            this.entregableForm.markAllAsTouched();
          }
        });
      }
    } else {
      this.entregableForm.markAllAsTouched();
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  private processFiles(): any[] {
    // Aquí procesarías los archivos según tu lógica de negocio
    // Por ahora retornamos un array con la metadata de los archivos
    return this.selectedFiles.map(file => ({
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size,
      fechaSubida: new Date().toISOString()
    }));
  }

  private resetForm(): void {
    this.entregableForm.reset({
      productId: this.productId || '',
      tipo: 'Release'
    });
    this.selectedFiles = [];
  }

  // Helpers para validación
  isFieldInvalid(fieldName: string): boolean {
    const field = this.entregableForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.entregableForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es obligatorio';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  shouldShowProductSelector(): boolean {
    return !this.productId; // mostrar selector solo si no viene productId
  }

  getFilteredEntregables(): Entregable[] | null {
    if (!this.entregables$) return null;
    
    const currentProductId = this.entregableForm.get('productId')?.value;
    if (!currentProductId) return null;

    return null; // Esto se manejará en el template con el async pipe
  }

  private resolveProductName(): void {
    if (!this.products$ || !this.productId) {
      this.productName = '';
      return;
    }
    this.products$.subscribe(products => {
      const p = products?.find(pr => pr.id === this.productId);
      this.productName = p?.nombre ?? '';
    });
  }

  getProductName(products: Product[] | null | undefined, productId?: string): string {
    if (!products || !productId) return '—';
    const p = products.find(pr => pr.id === productId);
    return p?.nombre ?? '—';
  }
}