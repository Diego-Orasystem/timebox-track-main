import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
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
  @Input() entregables: Entregable[] = []; // ← lista recibida desde el padre

  // NEW: outputs
  @Output() close = new EventEmitter<void>();
  @Output() entregableOutput = new EventEmitter<Partial<Entregable>>();

  productName: string = '';                    // nombre del producto para cabecera

  entregableForm: FormGroup;
  selectedFiles: File[] = [];
  
  // Opciones para los selects
  tipoOptions: ('Release' | 'Increment')[] = ['Release', 'Increment'];

  private cachedEntregables: Entregable[] = [];

  // Estado UI
  saving = false; // ← deshabilita el botón mientras guarda

  constructor(
    private fb: FormBuilder,
    private entregableService: EntregableService,
    private cdr: ChangeDetectorRef,                 // ← inyecta CD
  ) {
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
    if (this.productId) {
      this.entregableForm.patchValue({ productId: this.productId });
    }
    console.log('Entregables$ en OnInit:');
    console.log(this.entregables$);
    this.resolveProductName();
    // Suscripción para validar tipo vs entregable padre
    this.entregableForm.get('entregableId')?.valueChanges.subscribe(() => this.validateTipoMatchesParent());
    this.entregableForm.get('tipo')?.valueChanges.subscribe(() => this.validateTipoMatchesParent());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && this.productId) {
      this.entregableForm.patchValue({ productId: this.productId });
      this.entregableForm.get('entregableId')?.setValue(''); // ← limpiar selección
      // Fuerza actualización visual del select
      this.cdr.detectChanges();
    }
    if (changes['entregables']) {
      this.cachedEntregables = Array.isArray(this.entregables) ? this.entregables : [];
      this.validateTipoMatchesParent();
      this.cdr.detectChanges(); // ← refrescar template
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
    if (changes['entregables']) {
      this.cachedEntregables = Array.isArray(this.entregables) ? this.entregables : [];
      // Debug rápido
      console.debug('[ModalEntregable] recibidos:', this.cachedEntregables.length);
      this.validateTipoMatchesParent();
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

  // Filtra por productId; si no existe en el item, intenta project_id. Si no hay pid, no filtra.
  filteredEntregables(list?: Entregable[] | null): Entregable[] {
    const source = Array.isArray(list)
      ? list
      : (this.cachedEntregables.length ? this.cachedEntregables : this.entregables);

    if (!Array.isArray(source)) return [];
    const pid = this.entregableForm.get('productId')?.value || this.productId || null;
    const selfId = this.entregableData?.id;

    return source.filter(e => {
      const itemPid = (e as any).productId ?? (e as any).project_id ?? null;
      const sameProduct = !pid || itemPid === pid; // ← si no hay pid, no filtra
      return sameProduct && e.id !== selfId;
    });
  }

  onSubmit(): void {
    this.validateTipoMatchesParent();

    if (this.entregableForm.invalid || this.saving) {
      this.entregableForm.markAllAsTouched();
      return;
    }

    const formValue = this.entregableForm.value;
    const payload: Partial<Entregable> = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      productId: this.productId || formValue.productId,
      tipo: formValue.tipo,
      entregableId: formValue.entregableId || null,
      documentacion: this.selectedFiles.length > 0
        ? this.processFiles()
        : (this.entregableData?.documentacion || [])
    };

    this.saving = true; // ← bloquear botón

    if (this.mode === 'create') {
      this.entregableService.create(payload)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
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
      if (!this.entregableData?.id) {
        console.warn('No hay ID de entregable para actualizar.');
        this.saving = false;
        return;
      }
      this.entregableService.update(this.entregableData.id, payload)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
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