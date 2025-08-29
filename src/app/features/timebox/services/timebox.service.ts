// src/app/services/timebox.service.ts

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Timebox,
  TimeboxCategory,
  TimeboxType,
  Postulacion,
} from '../../../shared/interfaces/timebox.interface';
import {
  Persona,
  TeamMovilization,
} from '../../../shared/interfaces/fases-timebox.interface';
import { TimeboxApiService } from './timebox-api.service';

@Injectable({
  providedIn: 'root',
})
export class TimeboxService {
  // Esta será la lista global y centralizada de todos los Timeboxes,
  // independientemente del proyecto al que pertenezcan.
  private allTimeboxes: Timebox[] = [];

  constructor(private timeboxApiService: TimeboxApiService) {
    // Cargar timeboxes desde el backend al inicializar
    this.loadTimeboxes();
  }

  /**
   * Carga los timeboxes desde el backend
   */
  private loadTimeboxes(): void {
    this.timeboxApiService.getAllTimeboxes().subscribe({
      next: (timeboxes) => {
        this.allTimeboxes = timeboxes;
      },
      error: (error) => {
        console.error('Error cargando timeboxes:', error);
        this.allTimeboxes = [];
      }
    });
  }

  /**
   * **MÉTODO CRÍTICO**: Registra o actualiza un Timebox en la colección global del servicio.
   * Este método es llamado por ProjectService cuando un Timebox es creado/actualizado/eliminado
   * dentro del contexto de un proyecto. Permite a TimeboxService mantener su propia vista actualizada.
   * @param timebox El Timebox a añadir o actualizar.
   * @param action La acción a realizar ('add', 'update', 'delete').
   */
  public registerOrUpdateTimebox(
    timebox: Timebox,
    action: 'add' | 'update' | 'delete'
  ): void {
    const existingIndex = this.allTimeboxes.findIndex(
      (tb) => tb.id === timebox.id
    );

    switch (action) {
      case 'add':
        if (existingIndex === -1) {
          this.allTimeboxes.push(JSON.parse(JSON.stringify(timebox))); // Copia profunda
          console.log(`Timebox ${timebox.id} añadido a la colección global.`);
        } else {
          // Si ya existe, esto puede indicar que ya se actualizó, simplemente lo sobrescribimos.
          this.allTimeboxes[existingIndex] = JSON.parse(
            JSON.stringify(timebox)
          );
          console.warn(
            `Timebox ${timebox.id} ya existe, fue sobrescrito (acción 'add').`
          );
        }
        break;
      case 'update':
        if (existingIndex > -1) {
          this.allTimeboxes[existingIndex] = JSON.parse(
            JSON.stringify(timebox)
          ); // Copia profunda
          console.log(
            `Timebox ${timebox.id} actualizado en la colección global.`
          );
        } else {
          console.warn(
            `Timebox ${timebox.id} no encontrado para actualizar en TimeboxService. Se añadirá como nuevo.`
          );
          this.allTimeboxes.push(JSON.parse(JSON.stringify(timebox))); // Añádelo si no existe
        }
        break;
      case 'delete':
        if (existingIndex > -1) {
          this.allTimeboxes.splice(existingIndex, 1);
          console.log(
            `Timebox ${timebox.id} eliminado de la colección global.`
          );
        } else {
          console.warn(
            `Timebox ${timebox.id} no encontrado para eliminar en TimeboxService.`
          );
        }
        break;
      default:
        console.warn(
          `Acción desconocida para registerOrUpdateTimebox: ${action}`
        );
    }
  }

  /**
   * Determina el estado de un Timebox basándose en su contenido.
   * Esta lógica pertenece aquí, en TimeboxService.
   * @param timebox El objeto Timebox para determinar su estado.
   * @returns El estado calculado del Timebox.
   */
  private determineTimeboxState(timebox: Timebox): Timebox['estado'] {
    // ✅ PRIORIDAD 1: Si la fase Close está completada, el timebox está Finalizado
    if (timebox.fases?.close?.completada) {
      console.log('🔍 determineTimeboxState: Close completada → Finalizado');
      return 'Finalizado';
    }
    
    // ✅ PRIORIDAD 2: Si todas las fases están completadas, el timebox está Finalizado
    const todasLasFasesCompletadas = 
      timebox.fases?.planning?.completada &&
      timebox.fases?.kickOff?.completada &&
      timebox.fases?.refinement?.completada &&
      timebox.fases?.qa?.completada;
    
    if (todasLasFasesCompletadas) {
      console.log('🔍 determineTimeboxState: Todas las fases completadas → Finalizado');
      return 'Finalizado';
    }
    
    // ✅ PRIORIDAD 3: Si hay un Solution Developer asignado, está En Ejecución
    if (
      timebox.fases?.kickOff?.teamMovilization?.solutionDeveloper?.nombre &&
      timebox.fases.kickOff.teamMovilization.solutionDeveloper.nombre.trim() !== ''
    ) {
      console.log('🔍 determineTimeboxState: Solution Developer asignado → En Ejecución');
      return 'En Ejecución';
    }
    
    // ✅ PRIORIDAD 4: Si está publicado, está Disponible
    if (timebox.publicacionOferta?.publicado) {
      console.log('🔍 determineTimeboxState: Publicado → Disponible');
      return 'Disponible';
    }
    
    // ✅ PRIORIDAD 5: Por defecto, está En Definición
    console.log('🔍 determineTimeboxState: Por defecto → En Definición');
    return 'En Definición';
  }

  /**
   * Crea un nuevo Timebox con un ID único y lo inicializa.
   * Este método es llamado por ProjectService, pero la lógica de inicialización del Timebox es de TimeboxService.
   * @param projectId El ID del proyecto al que se asociará este Timebox (para referencia interna).
   * @param initialTimeboxData Los datos iniciales del nuevo Timebox.
   * @returns El Timebox creado.
   */
  createTimebox(projectId: string, initialTimeboxData: Timebox): Timebox {
    const newTimebox: Timebox = {
      id: uuidv4(),
      projectId: projectId,
      appId: initialTimeboxData.appId || 'default-app',
      tipoTimebox: initialTimeboxData.tipoTimebox || 'default-type',
      businessAnalyst: initialTimeboxData.businessAnalyst,
      estado: initialTimeboxData.estado || 'En Definición',
      publicacionOferta: initialTimeboxData.publicacionOferta,
      fases: initialTimeboxData.fases || {},
      entrega: initialTimeboxData.entrega,
      compensacionEconomica: initialTimeboxData.compensacionEconomica || {
        skills: [],
        esfuerzoHH: 0,
        entregaAnticipada: {
          duracionEstimadaDias: 0,
          valorBase: 0,
          bonificaciones: []
        }
      }
    };

    newTimebox.estado = this.determineTimeboxState(newTimebox); // Determinar estado inicial
    this.registerOrUpdateTimebox(newTimebox, 'add'); // Registrarlo en la colección global

    return JSON.parse(JSON.stringify(newTimebox)); // Devuelve una copia
  }

  /**
   * Actualiza un Timebox existente.
   * @param updatedTimeboxData Los datos actualizados del Timebox.
   * @returns El Timebox actualizado o null si no se encuentra.
   */
  updateTimebox(updatedTimeboxData: Timebox): Timebox | null {
    const index = this.allTimeboxes.findIndex(
      (tb) => tb.id === updatedTimeboxData.id
    );

    if (index > -1) {
      const currentTb = this.allTimeboxes[index];

      // Fusionar las fases y la entrega para mantener la granularidad
      const mergedFases = {
        ...currentTb.fases,
        ...updatedTimeboxData.fases,
      };

      const mergedEntrega = updatedTimeboxData.entrega
        ? { ...currentTb.entrega, ...updatedTimeboxData.entrega }
        : currentTb.entrega;

      const mergedTb: Timebox = {
        ...currentTb,
        ...updatedTimeboxData,
        fases: mergedFases,
        entrega: mergedEntrega,
        publicacionOferta:
          updatedTimeboxData.publicacionOferta || currentTb.publicacionOferta,
        // Asegúrate de que el projectId se mantiene
        projectId: updatedTimeboxData.projectId || currentTb.projectId,
      };

      mergedTb.estado = this.determineTimeboxState(mergedTb); // Re-determinar el estado
      this.registerOrUpdateTimebox(mergedTb, 'update'); // Actualizar en la colección global
      return JSON.parse(JSON.stringify(mergedTb));
    } else {
      console.error(
        `Timebox con ID ${updatedTimeboxData.id} no encontrado en TimeboxService para actualizar.`
      );
      return null;
    }
  }

  /**
   * Elimina un Timebox de la colección global del servicio.
   * @param timeboxId El ID del Timebox a eliminar.
   * @returns true si se eliminó, false en caso contrario.
   */
  deleteTimebox(timeboxId: string): boolean {
    const initialLength = this.allTimeboxes.length;
    this.allTimeboxes = this.allTimeboxes.filter((tb) => tb.id !== timeboxId);
    const wasDeleted = this.allTimeboxes.length < initialLength;
    if (wasDeleted) {
      console.log(`Timebox ${timeboxId} eliminado de la colección global.`);
    } else {
      console.warn(
        `Timebox ${timeboxId} no encontrado para eliminar en TimeboxService.`
      );
    }
    return wasDeleted;
  }

  /**
   * Obtiene todos los Timeboxes para un proyecto específico.
   * Este es el método que ProjectService llamará ahora.
   * @param projectId El ID del proyecto.
   * @returns Un array de Timeboxes asociados a ese proyecto.
   */
  getTimeboxesForProject(projectId: string): Timebox[] {
    return JSON.parse(
      JSON.stringify(
        this.allTimeboxes.filter((tb) => tb.projectId === projectId)
      )
    );
  }

  // **MÉTODOS EXISTENTES / MEJORADOS**

  // Obtiene todos los Timeboxes con postulaciones, útil para el mantenedor
  getAllTimeboxesWithPostulations(): Observable<Timebox[]> {
    return this.timeboxApiService.getAllTimeboxesWithPostulations();
  }

  assignRoleToTimebox(
    timeboxId: string,
    postulacionId: string,
    roleKey: string,
    developerName: string
  ): Observable<Timebox> {
    return this.timeboxApiService.assignRoleToTimebox(timeboxId, postulacionId, roleKey, developerName);
  }

  rejectPostulacion(
    timeboxId: string,
    postulacionId: string
  ): Observable<Timebox> {
    return this.timeboxApiService.rejectPostulacion(timeboxId, postulacionId);
  }

  postularATimebox(
    timeboxId: string,
    newPostulacion: Postulacion
  ): Observable<Timebox> {
    return this.timeboxApiService.postularATimebox(timeboxId, newPostulacion);
  }

  getPublishedTimeboxes(): Observable<Timebox[]> {
    return this.timeboxApiService.getPublishedTimeboxes();
  }

  getTimebox(id: string): Observable<Timebox | undefined> {
    return this.timeboxApiService.getTimeboxById(id);
  }

  getTimeboxCategories(): Observable<TimeboxCategory[]> {
    return this.timeboxApiService.getTimeboxCategories();
  }

  getAllTimeboxTypes(): Observable<TimeboxType[]> {
    return this.timeboxApiService.getAllTimeboxTypes();
  }

  getTimeboxTypeById(typeId: string): Observable<TimeboxType | undefined> {
    return this.timeboxApiService.getTimeboxTypeById(typeId);
  }

  getPersonas(): Observable<Persona[]> {
    return this.timeboxApiService.getPersonas();
  }

  getPersonaById(personaId: string): Observable<Persona | undefined> {
    return this.timeboxApiService.getPersonaById(personaId);
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = `Código de error: ${error.status || 'N/A'}\nMensaje: ${
        error.message || 'Error del servidor'
      }`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
