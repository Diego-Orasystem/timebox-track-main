import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  GLOBAL_DELIVERABLES,
  GLOBAL_EVIDENCES,
} from '../../../data/mock-timebox-category-type';
import {
  TimeboxType,
  TimeboxCategory,
} from '../../../../../shared/interfaces/timebox.interface';
import { TimeboxApiService } from '../../../services/timebox-api.service';

@Injectable({
  providedIn: 'root',
})
export class TimeboxTypeService {
  // Usamos BehaviorSubject para que los componentes puedan suscribirse a los cambios
  timeboxTypesSubject = new BehaviorSubject<TimeboxType[]>([]);
  private timeboxCategoriesSubject = new BehaviorSubject<TimeboxCategory[]>([]);

  private globalDeliverablesSubject = new BehaviorSubject<string[]>(
    GLOBAL_DELIVERABLES
  );
  private globalEvidencesSubject = new BehaviorSubject<string[]>(
    GLOBAL_EVIDENCES
  );

  // Observable para que los componentes se suscriban a los tipos de timebox
  timeboxTypes$: Observable<TimeboxType[]> =
    this.timeboxTypesSubject.asObservable();
  // Observable para las categorías
  timeboxCategories$: Observable<TimeboxCategory[]> =
    this.timeboxCategoriesSubject.asObservable();

  globalDeliverables$: Observable<string[]> =
    this.globalDeliverablesSubject.asObservable();
  globalEvidences$: Observable<string[]> =
    this.globalEvidencesSubject.asObservable();

  constructor(private timeboxApiService: TimeboxApiService) {
    // Cargar tipos de timebox reales desde el backend
    this.loadTimeboxTypes();
    this.loadTimeboxCategories();
  }

  loadTimeboxTypes(): void {
    this.timeboxApiService.getAllTimeboxTypes().subscribe({
      next: (types) => {
        this.timeboxTypesSubject.next(types);
      },
      error: (error) => {
        console.error('Error cargando tipos de timebox:', error);
        this.timeboxTypesSubject.next([]);
      }
    });
  }

  loadTimeboxCategories(): void {
    this.timeboxApiService.getTimeboxCategories().subscribe({
      next: (categories) => {
        this.timeboxCategoriesSubject.next(categories);
      },
      error: (error) => {
        console.error('Error cargando categorías de timebox:', error);
        this.timeboxCategoriesSubject.next([]);
      }
    });
  }

  /**
   * Obtiene todos los tipos de timebox.
   */
  getAllTimeboxTypes(): Observable<TimeboxType[]> {
    return this.timeboxTypes$;
  }

  /**
   * Obtiene un tipo de timebox por su ID.
   * @param id El ID del tipo de timebox.
   */
  getTimeboxTypeById(id: string): Observable<TimeboxType | undefined> {
    const types = this.timeboxTypesSubject.getValue();
    return of(types.find((type) => type.id === id));
  }

  /**
   * Obtiene todas las categorías de timebox.
   */
  getAllTimeboxCategories(): Observable<TimeboxCategory[]> {
    return this.timeboxCategories$;
  }

  private createSlug(text: string): string {
    return text
      .toString()
      .normalize('NFD') // Normaliza caracteres unicode (ej: é -> e)
      .replace(/[\u0300-\u036f]/g, '') // Remueve diacríticos/acentos
      .toLowerCase() // Convierte a minúsculas
      .trim() // Elimina espacios al inicio/fin
      .replace(/\s+/g, '-') // Reemplaza espacios con guiones
      .replace(/[^\w-]+/g, '') // Elimina caracteres no alfanuméricos excepto guiones
      .replace(/--+/g, '-'); // Reemplaza múltiples guiones con uno solo
  }

  /**
   * Añade un nuevo tipo de timebox.
   * @param newType El nuevo tipo de timebox a añadir.
   */
  addTimeboxType(newType: Omit<TimeboxType, 'id'>): Observable<TimeboxType> {
    return this.timeboxApiService.createTimeboxType(newType).pipe(
      tap((createdType) => {
        // Agregar a la lista local
        const currentTypes = this.timeboxTypesSubject.getValue();
        this.timeboxTypesSubject.next([...currentTypes, createdType]);
      }),
      catchError((error) => {
        console.error('Error al crear tipo de timebox:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza un tipo de timebox existente.
   * @param updatedType Los datos actualizados del tipo de timebox.
   */
  updateTimeboxType(updatedType: TimeboxType): Observable<TimeboxType | null> {
    return this.timeboxApiService.updateTimeboxType(updatedType.id, updatedType).pipe(
      tap((updatedType) => {
        // Actualizar en la lista local
        const currentTypes = this.timeboxTypesSubject.getValue();
        const index = currentTypes.findIndex((type) => type.id === updatedType.id);
        if (index > -1) {
          const updatedList = [...currentTypes];
          updatedList[index] = updatedType;
          this.timeboxTypesSubject.next(updatedList);
        }
      }),
      catchError((error) => {
        console.error('Error al actualizar tipo de timebox:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina un tipo de timebox por su ID.
   * @param id El ID del tipo de timebox a eliminar.
   */
  deleteTimeboxType(id: string): Observable<boolean> {
    return this.timeboxApiService.deleteTimeboxType(id).pipe(
      tap((success) => {
        if (success) {
          // Eliminar de la lista local
          const currentTypes = this.timeboxTypesSubject.getValue();
          const updatedList = currentTypes.filter((type) => type.id !== id);
          this.timeboxTypesSubject.next(updatedList);
        }
      }),
      catchError((error) => {
        console.error('Error al eliminar tipo de timebox:', error);
        throw error;
      })
    );
  }

  getAllGlobalDeliverables(): Observable<string[]> {
    return this.globalDeliverables$;
  }

  addGlobalDeliverable(deliverable: string): void {
    const currentDeliverables = this.globalDeliverablesSubject.getValue();
    if (!currentDeliverables.includes(deliverable)) {
      // Evita duplicados
      this.globalDeliverablesSubject.next([
        ...currentDeliverables,
        deliverable,
      ]);
    }
  }

  // Nuevos métodos para evidencias globales
  getAllGlobalEvidences(): Observable<string[]> {
    return this.globalEvidences$;
  }

  addGlobalEvidences(evidence: string): void {
    const currentEvidences = this.globalEvidencesSubject.getValue();
    if (!currentEvidences.includes(evidence)) {
      // Evita duplicados
      this.globalEvidencesSubject.next([...currentEvidences, evidence]);
    }
  }
}
