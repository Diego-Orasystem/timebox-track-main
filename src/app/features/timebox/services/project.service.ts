import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectContent } from '../../../shared/interfaces/project.interface';
import { Timebox } from '../../../shared/interfaces/timebox.interface';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private projects: Project[] = [];
  private projectsSubject = new BehaviorSubject<Project[]>([]);

  constructor() {
    // Cargar datos iniciales
    this.loadInitialData();
  }

  /**
   * Obtiene todos los proyectos
   */
  getProjects(): Observable<Project[]> {
    return of(this.projects);
  }

  /**
   * Obtiene un proyecto por ID
   */
  getProjectById(id: string): Observable<Project> {
    const project = this.projects.find(p => p.id === id);
    if (project) {
      return of(project);
    } else {
      return throwError(() => new Error(`Proyecto con ID ${id} no encontrado`));
    }
  }

  /**
   * Crea un nuevo proyecto
   */
  createProject(nombre: string, descripcion: string): Observable<Project> {
    const newProject: Project = {
      id: uuidv4(),
      nombre,
      descripcion,
      fechaCreacion: new Date().toISOString(),
      contenido: [],
      timeboxes: []
    };

    this.projects.push(newProject);
    this.projectsSubject.next([...this.projects]);
    return of(newProject);
  }

  /**
   * Actualiza un proyecto existente
   */
  updateProject(id: string, updateData: Partial<Project>): Observable<Project> {
    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return throwError(() => new Error(`Proyecto con ID ${id} no encontrado`));
    }

    this.projects[projectIndex] = { ...this.projects[projectIndex], ...updateData };
    this.projectsSubject.next([...this.projects]);
    return of(this.projects[projectIndex]);
  }

  /**
   * Elimina un proyecto
   */
  deleteProject(id: string): Observable<boolean> {
    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return throwError(() => new Error(`Proyecto con ID ${id} no encontrado`));
    }

    this.projects.splice(projectIndex, 1);
    this.projectsSubject.next([...this.projects]);
    return of(true);
  }

  /**
   * Obtiene los timeboxes de un proyecto específico
   */
  getTimeboxesByProjectId(projectId: string): Observable<Timebox[]> {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      return of(project.timeboxes || []);
    }
    return throwError(() => new Error(`Proyecto con ID ${projectId} no encontrado`));
  }

  /**
   * Actualiza un timebox en un proyecto
   */
  updateTimebox(projectId: string, timebox: Timebox): Observable<Timebox> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      return throwError(() => new Error(`Proyecto con ID ${projectId} no encontrado`));
    }

    const timeboxIndex = project.timeboxes.findIndex(t => t.id === timebox.id);
    if (timeboxIndex === -1) {
      return throwError(() => new Error(`Timebox con ID ${timebox.id} no encontrado`));
    }

    project.timeboxes[timeboxIndex] = { ...project.timeboxes[timeboxIndex], ...timebox };
    return of(project.timeboxes[timeboxIndex]);
  }

  /**
   * Crea un nuevo timebox en un proyecto
   */
  createTimebox(projectId: string, timebox: Omit<Timebox, 'id'>): Observable<Timebox> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      return throwError(() => new Error(`Proyecto con ID ${projectId} no encontrado`));
    }

    const newTimebox: Timebox = {
      ...timebox,
      id: uuidv4(),
      projectId: projectId
    };

    if (!project.timeboxes) {
      project.timeboxes = [];
    }
    project.timeboxes.push(newTimebox);

    return of(newTimebox);
  }

  /**
   * Obtiene el contenido de un proyecto por ID de padre
   */
  getContentsByParent(parentId: string | null): Observable<ProjectContent[]> {
    // Buscar en todos los proyectos
    for (const project of this.projects) {
      const contents = this.findContentsByParent(project.contenido, parentId);
      if (contents.length > 0) {
        return of(contents);
      }
    }
    return of([]);
  }

  /**
   * Añade contenido a un padre específico
   */
  addContentToParent(parentId: string | null, projectId: string, content: Omit<ProjectContent, 'id'>): Observable<ProjectContent> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      return throwError(() => new Error(`Proyecto con ID ${projectId} no encontrado`));
    }

    const newContent: ProjectContent = {
      ...content,
      id: uuidv4(),
      project_id: projectId,
      parent_id: parentId || undefined
    };

    if (parentId === null) {
      // Añadir al nivel raíz del proyecto
      project.contenido.push(newContent);
    } else {
      // Buscar el padre y añadir el contenido
      const parent = this.findContentById(project.contenido, parentId);
      if (parent && parent.tipo === 'Carpeta') {
        if (!parent.contenido) {
          parent.contenido = [];
        }
        parent.contenido.push(newContent);
      } else {
        return throwError(() => new Error(`Carpeta padre con ID ${parentId} no encontrada`));
      }
    }

    return of(newContent);
  }

  /**
   * Recarga los proyectos (para uso interno)
   */
  reloadProjects(): void {
    this.projectsSubject.next([...this.projects]);
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

  private loadInitialData(): void {
    // Datos de ejemplo para desarrollo
    const sampleProject: Project = {
      id: 'sample-project-1',
      nombre: 'Proyecto de Ejemplo',
      descripcion: 'Un proyecto de ejemplo para demostrar la funcionalidad',
      fechaCreacion: new Date().toISOString(),
      contenido: [
        {
          id: 'folder-1',
          nombre: 'Documentación',
          tipo: 'Carpeta',
          descripcion: 'Carpeta de documentación del proyecto',
          project_id: 'sample-project-1',
          parent_id: undefined,
          contenido: []
        },
        {
          id: 'folder-2',
          nombre: 'Recursos',
          tipo: 'Carpeta',
          descripcion: 'Carpeta de recursos del proyecto',
          project_id: 'sample-project-1',
          parent_id: undefined,
          contenido: []
        }
      ],
      timeboxes: []
    };

    this.projects = [sampleProject];
    this.projectsSubject.next([...this.projects]);
  }
}