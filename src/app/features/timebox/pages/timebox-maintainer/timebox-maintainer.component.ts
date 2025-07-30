import { Component } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  ReactiveFormsModule,
  FormControl,
  FormsModule,
} from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs'; // Importar combineLatest y map
import {
  TimeboxType,
  TimeboxCategory,
} from '../../../../shared/interfaces/timebox.interface';
import { TimeboxTypeService } from './services/timebox-maintainer.service';
import { CommonModule } from '@angular/common'; // Asegúrate de que CommonModule esté importado

@Component({
  selector: 'app-timebox-maintainer',
  imports: [CommonModule, ReactiveFormsModule, FormsModule], // Asegúrate de que ReactiveFormsModule también esté aquí
  templateUrl: './timebox-maintainer.component.html',
  styleUrl: './timebox-maintainer.component.css',
})
export class TimeboxMaintainerComponent {
  //Table
  tableLabels = [
    'Nombre y Definición',
    'Categoría',
    'Entregables',
    'Evidencias',
    'Acciones',
  ];

  timeboxTypes$: Observable<TimeboxType[]>;
  timeboxCategories$: Observable<TimeboxCategory[]>;
  timeboxTypeForm: FormGroup;
  selectedTimeboxType: TimeboxType | null = null;
  formMode: 'create' | 'edit' = 'create';

  private categoriesCache: TimeboxCategory[] = [];
  allGlobalDeliverables$: Observable<string[]>;
  allGlobalEvidences$: Observable<string[]>;

  // Nuevo estado para controlar la visibilidad del modal
  showModal: boolean = false;

  // Nuevos FormControls temporales para los inputs de añadir
  newDeliverableControl = new FormControl('');
  newEvidenciaControl = new FormControl('');

  // Propiedad para el término de búsqueda
  searchTerm: string = '';
  // BehaviorSubject para emitir cambios en el término de búsqueda
  private searchTerm$ = new BehaviorSubject<string>('');
  // Observable para los tipos de timebox filtrados
  filteredTimeboxTypes$: Observable<TimeboxType[]>;

  constructor(
    private fb: FormBuilder,
    private timeboxTypeService: TimeboxTypeService
  ) {
    this.timeboxTypeForm = this.fb.group({
      id: [''],
      nombre: ['', Validators.required],
      definicion: [''],
      categoriaId: ['', Validators.required],
      entregablesComunes: this.fb.array([]),
      evidenciasCierre: this.fb.array([]),
    });

    this.timeboxTypes$ = this.timeboxTypeService.getAllTimeboxTypes();
    this.timeboxCategories$ = this.timeboxTypeService.getAllTimeboxCategories();

    this.allGlobalDeliverables$ =
      this.timeboxTypeService.getAllGlobalDeliverables();
    this.allGlobalEvidences$ = this.timeboxTypeService.getAllGlobalEvidences();

    this.timeboxCategories$.subscribe((categories) => {
      this.categoriesCache = categories;
    });

    // Combinar los observables de tipos de timebox y término de búsqueda
    this.filteredTimeboxTypes$ = combineLatest([
      this.timeboxTypes$,
      this.searchTerm$,
    ]).pipe(
      map(([types, term]) => {
        if (!term) {
          return types; // Si no hay término de búsqueda, devuelve todos los tipos
        }
        const lowerCaseTerm = term.toLowerCase();
        return types.filter((type) =>
          type.nombre.toLowerCase().includes(lowerCaseTerm)
        );
      })
    );
  }

  // Método que se llama cuando el valor del input de búsqueda cambia
  applySearchFilter(): void {
    this.searchTerm$.next(this.searchTerm);
  }

  // --- Métodos para el manejo del Modal ---
  openCreateModal(): void {
    this.formMode = 'create';
    this.resetForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  closeModalAndResetForm(): void {
    this.closeModal();
    this.resetForm();
  }

  // --- Getters para FormArray en el template ---
  get entregablesComunes(): FormArray {
    return this.timeboxTypeForm.get('entregablesComunes') as FormArray;
  }

  get evidenciasCierre(): FormArray {
    return this.timeboxTypeForm.get('evidenciasCierre') as FormArray;
  }

  getCategoryName(categoryId: string | undefined): string {
    if (!categoryId) return 'Categoría Desconocida';
    const category = this.categoriesCache.find((cat) => cat.id === categoryId);
    return category ? category.nombre : 'Categoría Desconocida';
  }

  // --- Métodos para añadir/eliminar elementos de los FormArray ---
  addEntregable(): void {
    const value = this.newDeliverableControl.value?.trim();
    if (
      value &&
      !this.entregablesComunes.controls.some(
        (control) => control.value === value
      )
    ) {
      this.entregablesComunes.push(this.fb.control(value));
      this.timeboxTypeService.addGlobalDeliverable(value);
      this.newDeliverableControl.reset();
    }
  }

  removeEntregable(index: number): void {
    this.entregablesComunes.removeAt(index);
  }

  addEvidencia(): void {
    const value = this.newEvidenciaControl.value?.trim();
    if (
      value &&
      !this.evidenciasCierre.controls.some((control) => control.value === value)
    ) {
      this.evidenciasCierre.push(this.fb.control(value));
      this.timeboxTypeService.addGlobalEvidences(value);
      this.newEvidenciaControl.reset();
    }
  }

  removeEvidencia(index: number): void {
    this.evidenciasCierre.removeAt(index);
  }

  // --- CRUD Operations ---

  editTimeboxType(type: TimeboxType): void {
    this.selectedTimeboxType = type;
    this.formMode = 'edit';
    this.timeboxTypeForm.reset();
    this.clearFormArrays();

    // Usar campos del backend si están disponibles, sino usar campos del frontend
    const entregables = type.entregables_comunes || type.entregablesComunes || [];
    const evidencias = type.evidencias_cierre || type.evidenciasCierre || [];

    this.timeboxTypeForm.patchValue({
      ...type,
      categoriaId: type.categoria_id || type.categoriaId
    });

    entregables.forEach((item) =>
      this.entregablesComunes.push(this.fb.control(item))
    );
    evidencias.forEach((item) =>
      this.evidenciasCierre.push(this.fb.control(item))
    );

    this.showModal = true;
  }

  onSubmit(): void {
    if (this.timeboxTypeForm.invalid) {
      this.timeboxTypeForm.markAllAsTouched();
      console.error('Formulario inválido. Revise los campos.');
      return;
    }

    const formData: TimeboxType = {
      ...this.timeboxTypeForm.value,
      categoria_id: this.timeboxTypeForm.value.categoriaId, // Enviar como categoria_id al backend
      entregablesComunes: this.timeboxTypeForm.value.entregablesComunes || [],
      evidenciasCierre: this.timeboxTypeForm.value.evidenciasCierre || [],
    };

    console.log('🔍 Datos del formulario a enviar:', formData);

    if (this.formMode === 'create') {
      this.timeboxTypeService.addTimeboxType(formData).subscribe(
        (res) => {
          console.log('Tipo de Timebox creado:', res);
          this.closeModalAndResetForm();
          this.searchTerm$.next(this.searchTerm); // Refrescar la lista filtrada
        },
        (error) => console.error('Error al crear tipo de Timebox:', error)
      );
    } else {
      this.timeboxTypeService.updateTimeboxType(formData).subscribe(
        (res) => {
          if (res) {
            console.log('Tipo de Timebox actualizado:', res);
            this.closeModalAndResetForm();
            // Forzar recarga completa de datos y categorías
            this.timeboxTypeService.loadTimeboxTypes();
            this.timeboxTypeService.loadTimeboxCategories();
            // Pequeño delay para asegurar que los datos se actualicen
            setTimeout(() => {
              this.searchTerm$.next(this.searchTerm); // Refrescar la lista filtrada
            }, 100);
          } else {
            console.warn('No se pudo actualizar el tipo de Timebox.');
          }
        },
        (error) => console.error('Error al actualizar tipo de Timebox:', error)
      );
    }
  }

  deleteTimeboxType(id: string): void {
    if (
      confirm('¿Estás seguro de que quieres eliminar este tipo de Timebox?')
    ) {
      this.timeboxTypeService.deleteTimeboxType(id).subscribe(
        (success) => {
          if (success) {
            console.log('Tipo de Timebox eliminado.');
            this.resetForm();
            this.searchTerm$.next(this.searchTerm); // Refrescar la lista filtrada
          } else {
            console.warn('No se encontró el tipo de Timebox para eliminar.');
          }
        },
        (error) => console.error('Error al eliminar tipo de Timebox:', error)
      );
    }
  }

  resetForm(): void {
    this.timeboxTypeForm.reset();
    this.clearFormArrays();
    this.selectedTimeboxType = null;
    this.formMode = 'create';
    this.newDeliverableControl.reset();
    this.newEvidenciaControl.reset();
  }

  private clearFormArrays(): void {
    while (this.entregablesComunes.length !== 0) {
      this.entregablesComunes.removeAt(0);
    }
    while (this.evidenciasCierre.length !== 0) {
      this.evidenciasCierre.removeAt(0);
    }
  }
}
