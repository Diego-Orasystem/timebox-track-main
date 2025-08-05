import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ItemCreationModalComponent } from '../../../../../shared/components/modals/item-creation-modal.component';

import { Project, ProjectContent } from '../../../../../shared/interfaces/project.interface';
import { ProjectService } from '../../../services/project.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-folder-detail',
  standalone: true,
  imports: [CommonModule, ItemCreationModalComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="header flex items-center justify-between w-full">
        <div class="flex flex-col place-content-center select-none">
          <div class="inline-flex gap-1 items-center">
            <h1 class="text-sm font-semibold text-[var(--text-medium)]">
              Contenido de
            </h1>
            <h1 class="text-md font-extrabold text-[var(--primary)]">
              {{ currentFolderName || 'Carpeta Raíz' }}
            </h1>
          </div>
          <p class="text-xs text-[var(--text-medium)]">
            Gestiona el contenido de los items del proyecto.
          </p>
        </div>
        <button
          (click)="openModal('create')"
          class="max-w-60 cursor-pointer text-[12px] space-x-2 inline-flex items-center justify-between px-5 py-3 bg-[var(--primary)] text-[var(--lightText)] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primaryDark)] transition-colors duration-200"
        >
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="#FFFFFF"
            stroke="#FFFFFF"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <title></title>
              <g id="Complete">
                <g data-name="add" id="add-2">
                  <g>
                    <line
                      fill="none"
                      stroke="#FFFFFF"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      x1="12"
                      x2="12"
                      y1="19"
                      y2="5"
                    ></line>
                    <line
                      fill="none"
                      stroke="#FFFFFF"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      x1="5"
                      x2="19"
                      y1="12"
                      y2="12"
                    ></line>
                  </g>
                </g>
              </g>
            </g>
          </svg>
          <span class="text-xs font-medium">Nuevo</span>
        </button>
      </div>

      <div class="Table">
        <div
          *ngIf="folders.length > 0; else noFolders"
          class="flex flex-col gap-4"
        >
          <div
            *ngFor="let folder of folders"
            (click)="selectFolder(folder)"
            class="p-6 rounded-sm shadow-sm  hover:shadow-md transition border border-transparent ease-in-out hover:border hover:border-[var(--lines)] flex flex-col cursor-pointer"
            [style.background-color]="'var(--backgroundLight)'"
          >
            <h3
              class="text-xs font-mono mb-2"
              [style.color]="'var(--text-light)'"
            >
              Tipo
              <span
                class="font-semibold"
                [style.color]="'var(--text-medium)'"
                >{{ folder.tipo }}</span
              >
            </h3>
            <h3 class="font-bold">{{ folder.nombre }}</h3>
            <p class="text-sm text-gray-600">{{ folder.descripcion }}</p>
          </div>
        </div>
        <ng-template #noFolders>
          <p class="text-center text-gray-500">
            No hay contenido en este nivel.
          </p>
        </ng-template>
      </div>
    </div>

    <app-item-creation-modal
      [show]="showModal"
      [mode]="modalMode"
      [parentId]="currentParentIdForModal"
      [itemTypeContext]="null"
      (close)="closeModal()"
      (itemSaved)="handleItemSaved($event)"
    ></app-item-creation-modal>
  `,
})
export class FolderDetailComponent implements OnInit {
  currentProjectId: string | null = null;
  currentFolderId: string | null = null;
  currentFolderName: string | null = null;
  currentParentIdForModal: string | null = null; // ID que se pasa al modal como padre
  folders: ProjectContent[] = []; // Cambiado a ProjectContent[] para mayor precisión
  showModal: boolean = false;
  modalMode: 'create' | 'edit' = 'create';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.currentProjectId =
        this.route.parent?.snapshot.paramMap.get('projectId') || null;
      this.currentFolderId = params.get('folderId');

      if (this.currentFolderId) {
        // Estamos en el nivel 3: mostrando contenido de una subcarpeta
        this.currentParentIdForModal = this.currentFolderId;
        this.loadFolderDetails(this.currentFolderId);
        this.loadContents(this.currentFolderId); // Cargar contenido dentro de esta carpeta
      } else if (this.currentProjectId) {
        // Estamos en el nivel 2.1: mostrando contenido del proyecto (carpetas, documentos, etc.)
        // Para contenido a nivel raíz del proyecto, el parentId debe ser null
        this.currentParentIdForModal = null;
        this.loadContents(this.currentProjectId);
        // Si es el proyecto raíz, el nombre de la carpeta será el nombre del proyecto
        this.projectService.getProjectById(this.currentProjectId).subscribe({
          next: (project: Project) => {
            this.currentFolderName = project
              ? project.nombre
              : 'Proyecto no encontrado';
          },
          error: (error: any) => {
            console.error('Error cargando proyecto:', error);
            this.currentFolderName = 'Proyecto no encontrado';
          }
        });
      } else {
        // Manejar el caso donde no hay project ID ni folder ID (ej. ruta inválida)
        this.currentFolderName = 'Contenido no disponible';
        this.folders = [];
      }
    });
  }

  loadFolderDetails(folderId: string): void {
    // Buscar la carpeta en los datos en memoria primero
    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        for (const project of projects) {
          const folder = this.findContentItemById(project.contenido, folderId);
          if (folder && folder.tipo === 'Carpeta') {
            this.currentFolderName = folder.nombre;
            return;
          }
        }
        // Si no se encuentra en memoria, usar un nombre genérico
        this.currentFolderName = 'Subcarpeta';
      },
      error: (error: any) => {
        console.error('Error cargando proyectos:', error);
        this.currentFolderName = 'Subcarpeta';
      }
    });
  }

  // Helper recursivo para encontrar un ProjectContent por su ID
  private findContentItemById(
    contents: ProjectContent[] | undefined,
    id: string
  ): ProjectContent | undefined {
    if (!contents) {
      return undefined;
    }
    for (const item of contents) {
      if (item.id === id) {
        return item;
      }
      if (item.tipo === 'Carpeta' && item.contenido) {
        const foundInSub = this.findContentItemById(item.contenido, id);
        if (foundInSub) {
          return foundInSub;
        }
      }
    }
    return undefined;
  }

  loadContents(idToLoad: string): void {
    console.log('🔍 loadContents llamado con:', {
      idToLoad,
      currentProjectId: this.currentProjectId,
      currentFolderId: this.currentFolderId,
      currentParentIdForModal: this.currentParentIdForModal
    });

    // Determinar si estamos cargando contenido de proyecto raíz o de una carpeta
    if (this.currentFolderId) {
      // Estamos dentro de una carpeta, cargar contenido de la carpeta
      this.projectService.getFolderContent(idToLoad).subscribe({
        next: (contents: ProjectContent[]) => {
          this.folders = contents;
          console.log('📁 Contenido de carpeta cargado:', contents);
        },
        error: (error: any) => {
          console.error('Error cargando contenido de carpeta:', error);
          this.folders = [];
        }
      });
    } else if (this.currentProjectId && idToLoad === this.currentProjectId) {
      // Estamos a nivel raíz del proyecto, cargar contenido raíz
      this.projectService.getProjectRootContent(idToLoad).subscribe({
        next: (contents: ProjectContent[]) => {
          this.folders = contents;
          console.log('🏠 Contenido raíz del proyecto cargado:', contents);
        },
        error: (error: any) => {
          console.error('Error cargando contenido del proyecto:', error);
          this.folders = [];
        }
      });
    } else {
      console.warn('🚨 No se pudo determinar qué tipo de contenido cargar');
      this.folders = [];
    }
  }

  selectFolder(item: ProjectContent): void {
    // Si el item es una carpeta, navega a ella; de lo contrario, puedes manejar la apertura del documento/video/imagen
    if (item.tipo === 'Carpeta') {
      // Navegar a la subcarpeta usando la ruta correcta
      if (this.currentProjectId) {
        this.router.navigate(['projects', this.currentProjectId, 'folders', item.id]);
      } else {
        console.error('No se pudo determinar el projectId para la navegación');
      }
    } else {
      console.log(`Abriendo ${item.tipo}: ${item.nombre}`, item.adjunto?.url);
      
      if (item.adjunto && item.adjunto.url) {
        // Construir la URL completa usando la URL base del environment
        const baseUrl = environment.apiUrl.replace('/api', ''); // Remover /api para obtener solo el servidor
        const fullUrl = `${baseUrl}${item.adjunto.url}`;
        console.log('🔍 Debug archivo:', {
          itemAdjunto: item.adjunto,
          adjuntoUrl: item.adjunto.url,
          environmentApiUrl: environment.apiUrl,
          baseUrl: baseUrl,
          fullUrl: fullUrl
        });
        
        // Para PDFs, intentar abrir directamente en el navegador
        if (item.adjunto.type === 'Documento' && item.adjunto.url.includes('.pdf')) {
          // Intentar abrir en nueva pestaña primero
          const newWindow = window.open(fullUrl, '_blank');
          
          // Si el navegador bloquea la nueva ventana, mostrar en modal
          if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
            console.log('Nueva ventana bloqueada, mostrando en modal...');
            
            // Crear un iframe temporal para abrir el PDF
            const iframe = document.createElement('iframe');
            iframe.src = fullUrl;
            iframe.style.width = '100%';
            iframe.style.height = '600px';
            iframe.style.border = 'none';
            
            // Crear una ventana modal para mostrar el PDF
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
            modal.style.zIndex = '9999';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            
            const content = document.createElement('div');
            content.style.backgroundColor = 'white';
            content.style.padding = '20px';
            content.style.borderRadius = '8px';
            content.style.width = '90%';
            content.style.height = '90%';
            content.style.position = 'relative';
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Cerrar';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '10px';
            closeBtn.style.right = '10px';
            closeBtn.style.padding = '8px 16px';
            closeBtn.style.backgroundColor = '#f44336';
            closeBtn.style.color = 'white';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = () => document.body.removeChild(modal);
            
            content.appendChild(closeBtn);
            content.appendChild(iframe);
            modal.appendChild(content);
            document.body.appendChild(modal);
          }
        } else {
          // Para otros tipos de archivo, abrir en nueva pestaña
          window.open(fullUrl, '_blank');
        }
      } else {
        console.warn('No se encontró adjunto para este item:', item);
        alert('No se puede abrir el archivo. El adjunto no está disponible.');
      }
    }
  }

  openModal(mode: 'create' | 'edit'): void {
    this.modalMode = mode;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  handleItemSaved(newItem: any): void {


    if (this.currentProjectId) {
      this.projectService.addContentToParent(
        this.currentParentIdForModal,
        this.currentProjectId!,
        newItem // newItem ya tiene 'tipo', 'nombre', 'descripcion', 'adjunto'
      ).subscribe({
        next: (addedItem: ProjectContent) => {
          // Actualiza la lista de contenido para reflejar el nuevo ítem
          if (this.currentParentIdForModal) {
            // Si estamos dentro de una carpeta, recargar contenido de esa carpeta
            this.loadContents(this.currentParentIdForModal);
          } else if (this.currentProjectId) {
            // Si estamos a nivel raíz del proyecto, recargar contenido del proyecto
            this.loadContents(this.currentProjectId);
          }
          console.log('Nuevo ítem añadido:', addedItem);
          
          // Recargar los proyectos para mantener sincronizados los datos en memoria
          this.projectService.reloadProjects();
        },
        error: (error: any) => {
          console.error('Error al añadir el ítem:', error);
          alert('Error al crear el ítem. Inténtalo de nuevo.');
        }
      });
    } else {
      console.error('No se pudo determinar el padre para añadir el ítem.');
    }
  }
}
