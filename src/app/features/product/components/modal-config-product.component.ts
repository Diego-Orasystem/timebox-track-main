import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../../shared/interfaces/product.interface';
import { Persona } from '../../../shared/interfaces/fases-timebox.interface';
import { ProductService } from '../../timebox/services/product.service';
import { TimeboxApiService } from '../../timebox/services/timebox-api.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-modal-config-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-config-product.component.html',
})
export class ModalConfigProductComponent implements OnChanges, OnInit {
  @Input() show: boolean = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() productData?: Product; 
  @Output() close = new EventEmitter<void>();
  @Output() productOutput = new EventEmitter<Product>();

  productForm: FormGroup;
  personas$!: Observable<Persona[]>;
  selectedFiles: File[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private timeboxApiService: TimeboxApiService
  ) {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      idResponsable: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Cargar personas para el selector
    this.personas$ = this.timeboxApiService.getPersonas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 Modal ngOnChanges:', changes); // Debug log
    
    if (changes['productData'] && this.productData && this.mode === 'edit') {
      console.log('📝 Datos del producto recibidos:', this.productData); // Debug log
      
      this.productForm.patchValue({
        nombre: this.productData.nombre,
        descripcion: this.productData.descripcion || '',
        idResponsable: this.productData.idResponsable || ''
      });
      
      console.log('📋 Valores del form después del patch:', this.productForm.value); // Debug log
    }

    // Reset form cuando cambia a modo create
    if (changes['mode'] && this.mode === 'create') {
      this.resetForm();
    }
  }

  handleClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onSubmit(): void {
    if (this.productForm.valid && !this.isLoading) {
      this.isLoading = true;
      const formValue = this.productForm.value;

      if (this.mode === 'create') {
        // Crear nuevo producto
        this.productService.createProduct(formValue)
          .subscribe({
            next: (product) => {
              // Actualizar el responsable si se seleccionó uno
              if (formValue.idResponsable) {
                const updateData: Partial<Product> = { 
                  idResponsable: formValue.idResponsable 
                };
                
                this.productService.updateProduct(product.id, updateData)
                  .subscribe({
                    next: (updatedProduct) => {
                      this.productOutput.emit(updatedProduct);
                      this.handleClose();
                      this.isLoading = false;
                    },
                    error: (error) => {
                      console.error('Error actualizando responsable:', error);
                      // Aún así emitimos el producto creado
                      this.productOutput.emit(product);
                      this.handleClose();
                      this.isLoading = false;
                    }
                  });
              } else {
                this.productOutput.emit(product);
                this.handleClose();
                this.isLoading = false;
              }
            },
            error: (error) => {
              console.error('Error creando producto:', error);
              this.isLoading = false;
            }
          });
      } else {
        // Editar producto existente
        const updateData: Partial<Product> = {
          nombre: formValue.nombre,
          descripcion: formValue.descripcion,
          idResponsable: formValue.idResponsable
        };

        this.productService.updateProduct(this.productData!.id, updateData)
          .subscribe({
            next: (updatedProduct) => {
              this.productOutput.emit(updatedProduct);
              this.handleClose();
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error actualizando producto:', error);
              this.isLoading = false;
            }
          });
      }
    } else {
      this.productForm.markAllAsTouched();
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

  private resetForm(): void {
    this.productForm.reset();
    this.selectedFiles = [];
    this.isLoading = false;
  }

  // Helpers para validación
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es obligatorio';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
}