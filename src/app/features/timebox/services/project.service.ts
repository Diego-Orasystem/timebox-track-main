import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Project, ProjectContent } from '../../../shared/interfaces/project.interface';
import { Timebox } from '../../../shared/interfaces/timebox.interface';
import { ApiService } from '../../../shared/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private projectsSubject = new BehaviorSubject<Project[]>([]);

  constructor(private apiService: ApiService) {
    // Cargar proyectos desde el backend al inicializar
    this.loadProjectsFromApi();
  }

  /**
   * Transforma un timebox del formato del backend al formato del frontend
   */
  private transformTimeboxFromBackend(timebox: any): Timebox {
    // console.log('🔍 transformTimeboxFromBackend - timebox recibido:', timebox);
    // console.log('🔍 transformTimeboxFromBackend - planning recibido:', timebox.fases?.planning);
    // console.log('🔍 transformTimeboxFromBackend - teamLeader recibido:', timebox.fases?.planning?.teamLeader);

    return {
      ...timebox,
      // Mapear campos del backend al frontend
      tipoTimebox: timebox.tipo_timebox_id || timebox.tipoTimebox,
      projectId: timebox.project_id || timebox.projectId,
      // Asegurar que fases existe con estructura básica y mapear correctamente
      fases: timebox.fases ? {
        planning: timebox.fases.planning ? {
          ...timebox.fases.planning,
          // Mapear campos específicos del backend
          fechaInicio: timebox.fases.planning.fecha_inicio || timebox.fases.planning.fechaInicio || '',
          // El teamLeader ya viene correctamente formateado desde la API
          teamLeader: timebox.fases.planning.teamLeader || undefined,
          // Los skills ya vienen correctamente formateados desde la API
          skills: timebox.fases.planning.skills || [],
          // El cumplimiento ya viene correctamente formateado desde la API
          cumplimiento: timebox.fases.planning.cumplimiento || []
        } : undefined,
        kickOff: timebox.fases.kickOff ? {
          ...timebox.fases.kickOff,
          // Mapear campos específicos del backend si es necesario
          fechaFase: timebox.fases.kickOff.fecha_fase || timebox.fases.kickOff.fechaFase || ''
        } : undefined,
        refinement: timebox.fases.refinement,
        qa: timebox.fases.qa,
        close: timebox.fases.close
      } : {
        planning: undefined,
        kickOff: undefined,
        refinement: undefined,
        qa: undefined,
        close: undefined
      },
      // Asegurar que entrega existe
      entrega: timebox.entrega || undefined,
      // Asegurar que publicacionOferta existe
      publicacionOferta: timebox.publicacionOferta || undefined
    };
  }

  /**
   * Carga los proyectos desde el backend
   */
  private loadProjectsFromApi(): void {
    this.apiService.getData<{status: boolean, message: string, data: Project[]}>('/project/all')
      .pipe(catchError(error => {
        console.error('Error cargando proyectos:', error);
        return of({status: false, message: 'Error', data: []});
      }))
      .subscribe(response => {
        if (response.status && response.data) {
          this.projectsSubject.next(response.data);
        }
      });
  }

  /**
   * Obtiene todos los proyectos
   */
  getProjects(): Observable<Project[]> {
    return this.apiService.getData<{status: boolean, message: string, data: Project[]}>('/project/all')
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error obteniendo proyectos:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene un proyecto por ID
   */
  getProjectById(id: string): Observable<Project> {
    return this.apiService.getData<{status: boolean, message: string, data: Project}>(`/project/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error(`Error obteniendo proyecto ${id}:`, error);
          return throwError(() => new Error(`Proyecto con ID ${id} no encontrado`));
        })
      );
  }

  /**
   * Crea un nuevo proyecto
   */
  createProject(nombre: string, descripcion: string): Observable<Project> {
    const projectData = {
      nombre,
      descripcion
    };

    return this.apiService.post<{status: boolean, message: string, data: Project}>('/project', projectData)
      .pipe(
        map(response => {
          // Actualizar la lista local
          this.loadProjectsFromApi();
          return response.data;
        }),
        catchError(error => {
          console.error('Error creando proyecto:', error);
          return throwError(() => new Error('Error al crear el proyecto'));
        })
      );
  }

  /**
   * Actualiza un proyecto existente
   */
  updateProject(id: string, updateData: Partial<Project>): Observable<Project> {
    return this.apiService.put<{status: boolean, message: string, data: Project}>(`/project/${id}`, updateData)
      .pipe(
        map(response => {
          // Actualizar la lista local
          this.loadProjectsFromApi();
          return response.data;
        }),
        catchError(error => {
          console.error(`Error actualizando proyecto ${id}:`, error);
          return throwError(() => new Error(`Error al actualizar el proyecto con ID ${id}`));
        })
      );
  }

  /**
   * Elimina un proyecto
   */
  deleteProject(id: string): Observable<boolean> {
    return this.apiService.delete<{status: boolean, message: string}>(`/project/${id}`)
      .pipe(
        map(response => {
          // Actualizar la lista local
          this.loadProjectsFromApi();
          return response.status;
        }),
        catchError(error => {
          console.error(`Error eliminando proyecto ${id}:`, error);
          return throwError(() => new Error(`Error al eliminar el proyecto con ID ${id}`));
        })
      );
  }

  /**
   * Obtiene los timeboxes de un proyecto específico
   */
  getTimeboxesByProjectId(projectId: string): Observable<Timebox[]> {
    return this.apiService.getData<{status: boolean, message: string, data: Timebox[]}>(`/project/${projectId}/timeboxes`)
      .pipe(
        map(response => response.data.map(timebox => this.transformTimeboxFromBackend(timebox))),
        catchError(error => {
          console.error(`Error obteniendo timeboxes del proyecto ${projectId}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Actualiza un timebox en un proyecto
   */
  updateTimebox(projectId: string, timebox: Timebox): Observable<Timebox> {
    // Mapear los campos del frontend al formato esperado por el backend
    const timeboxData = {
      tipoTimeboxId: timebox.tipoTimebox, // Mapear tipoTimebox a tipoTimeboxId
      businessAnalystId: timebox.businessAnalyst?.nombre || null,
      estado: timebox.estado,
      // Enviar las fases completas
      fases: timebox.fases || {},
      entrega: timebox.entrega || null,
      publicacionOferta: timebox.publicacionOferta || null
    };

    // Debug: verificar qué se está enviando al backend
    console.log('🔍 ProjectService.updateTimebox - timebox original:', timebox);
    console.log('🔍 ProjectService.updateTimebox - timeboxData enviado al backend:', timeboxData);
    console.log('🔍 ProjectService.updateTimebox - fases enviadas:', timeboxData.fases);
    console.log('🔍 ProjectService.updateTimebox - planning enviado:', timeboxData.fases.planning);
    console.log('🔍 ProjectService.updateTimebox - teamLeader enviado:', timeboxData.fases.planning?.teamLeader);

    return this.apiService.put<{status: boolean, message: string, data: Timebox}>(`/project/${projectId}/timeboxes/${timebox.id}`, timeboxData)
      .pipe(
        map(response => {
          console.log('🔍 ProjectService.updateTimebox - respuesta del backend:', response);
          const transformedTimebox = this.transformTimeboxFromBackend(response.data);
          console.log('🔍 ProjectService.updateTimebox - timebox transformado:', transformedTimebox);
          console.log('🔍 ProjectService.updateTimebox - teamLeader después de transformar:', transformedTimebox.fases?.planning?.teamLeader);
          return transformedTimebox;
        }),
        catchError(error => {
          console.error(`Error actualizando timebox ${timebox.id} en proyecto ${projectId}:`, error);
          return throwError(() => new Error(`Error al actualizar timebox con ID ${timebox.id}`));
        })
      );
  }

  /**
   * Crea un nuevo timebox en un proyecto
   */
  createTimebox(projectId: string, timebox: Omit<Timebox, 'id'>): Observable<Timebox> {
    // Mapear los campos del frontend al formato esperado por el backend
    const timeboxData = {
      tipoTimeboxId: timebox.tipoTimebox, // Mapear tipoTimebox a tipoTimeboxId
      projectId: projectId,
      businessAnalystId: timebox.businessAnalyst?.nombre || null,
      estado: timebox.estado || 'En Definición',
      // Enviar las fases completas
      fases: timebox.fases || {},
      entrega: timebox.entrega || null,
      publicacionOferta: timebox.publicacionOferta || null
    };

    return this.apiService.post<{status: boolean, message: string, data: Timebox}>(`/project/${projectId}/timeboxes`, timeboxData)
      .pipe(
        map(response => this.transformTimeboxFromBackend(response.data)),
        catchError(error => {
          console.error(`Error creando timebox en proyecto ${projectId}:`, error);
          return throwError(() => new Error('Error al crear el timebox'));
        })
      );
  }

  /**
   * Obtiene el contenido raíz de un proyecto específico
   */
  getProjectRootContent(projectId: string): Observable<ProjectContent[]> {
    console.log('🔍 getProjectRootContent llamado con projectId:', projectId);
    return this.apiService.getData<{status: boolean, message: string, data: Project}>(`/project/${projectId}/content`)
      .pipe(
        map(response => {
          console.log('📦 Respuesta completa del API:', response);
          // La nueva estructura del backend devuelve el contenido directamente en response.data.contenido
          if (response.data && response.data.contenido) {
            console.log('✅ Contenido encontrado:', response.data.contenido);
            return response.data.contenido;
          }
          console.log('❌ No se encontró contenido en la respuesta');
          return [];
        }),
        catchError(error => {
          console.error('Error obteniendo contenido del proyecto:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene el contenido hijo de una carpeta específica
   */
  getFolderContent(contentId: string): Observable<ProjectContent[]> {
    return this.apiService.getData<{status: boolean, message: string, data: any}>(`/project/content/${contentId}`)
      .pipe(
        map(response => {
          // La nueva estructura del backend devuelve el contenido directamente en response.data.contenido
          if (response.data && response.data.contenido) {
            return response.data.contenido;
          }
          return [];
        }),
        catchError(error => {
          console.error('Error obteniendo contenido de la carpeta:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene el contenido de un proyecto por ID de padre
   * @deprecated Usar getProjectRootContent o getFolderContent en su lugar
   */
  getContentsByParent(parentId: string | null): Observable<ProjectContent[]> {
    // Para contenido, necesitamos usar el endpoint que obtiene el proyecto con contenido
    // Como no sabemos qué proyecto, podemos obtener todos y filtrar
    return this.getProjects().pipe(
      map(projects => {
        const allContents: ProjectContent[] = [];
        for (const project of projects) {
          // Verificar si el proyecto tiene contenido directo (nueva estructura)
          if (project.contenido) {
            const contents = this.findContentsByParent(project.contenido, parentId);
            allContents.push(...contents);
          }
          // Verificar también la estructura antigua con apps
          if (project.apps) {
            for (const app of project.apps) {
              if (app.contenido) {
                const contents = this.findContentsByParent(app.contenido, parentId);
                allContents.push(...contents);
              }
            }
          }
        }
        return allContents;
      }),
      catchError(error => {
        console.error('Error obteniendo contenido:', error);
        return of([]);
      })
    );
  }

  /**
   * Añade contenido a un padre específico
   */
  addContentToParent(parentId: string | null, projectId: string, content: Omit<ProjectContent, 'id'>): Observable<ProjectContent> {
    // Crear el payload con los nombres de campos que espera el backend
    const contentData: any = {
      nombre: content.nombre,
      tipo: content.tipo,
      descripcion: content.descripcion,
      projectId
    };

    // Solo agregar parentId si no es null
    if (parentId !== null && parentId !== undefined && parentId !== '') {
      contentData.parentId = parentId;
    }

    // Agregar adjuntoId si existe en el contenido
    if ('adjuntoId' in content) {
      contentData.adjuntoId = (content as any).adjuntoId;
    }



    return this.apiService.post<{status: boolean, message: string, data: ProjectContent}>('/project/content', contentData)
      .pipe(
        map(response => {
          // Actualizar la lista local
          this.loadProjectsFromApi();
          return response.data;
        }),
        catchError(error => {
          console.error('Error añadiendo contenido:', error);
          return throwError(() => new Error('Error al añadir contenido'));
        })
      );
  }

  /**
   * Recarga los proyectos (para uso interno)
   */
  reloadProjects(): void {
    this.loadProjectsFromApi();
  }

  // Métodos auxiliares privados

  private findContentsByParent(contents: ProjectContent[], parentId: string | null): ProjectContent[] {
    const result: ProjectContent[] = [];

    for (const content of contents) {
      if (content.parent_id === parentId) {
        result.push(content);
      }
      if (content.contenido) {
        result.push(...this.findContentsByParent(content.contenido, parentId));
      }
    }

    return result;
  }

  private findContentById(contents: ProjectContent[], id: string): ProjectContent | null {
    for (const content of contents) {
      if (content.id === id) {
        return content;
      }
      if (content.contenido) {
        const found = this.findContentById(content.contenido, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }


}
