import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ItemCreationModalComponent } from '../../../../../shared/components/modals/item-creation-modal.component';

import { ProjectContent } from '../../../../../shared/interfaces/project.interface';
import { ProjectService } from '../../../services/project.service';

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
        this.currentParentIdForModal = this.currentProjectId;
        this.loadContents(this.currentProjectId);
        // Si es el proyecto raíz, el nombre de la carpeta será el nombre del proyecto
        this.projectService.getProjectById(this.currentProjectId).subscribe({
          next: (project) => {
            this.currentFolderName = project
              ? project.nombre
              : 'Proyecto no encontrado';
          },
          error: (error) => {
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
      next: (projects) => {
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
      error: (error) => {
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

  loadContents(parentId: string): void {
    // Llama a tu servicio para obtener el contenido hijo del parentId
    this.projectService.getContentsByParent(parentId).subscribe({
      next: (contents) => {
        this.folders = contents;
        console.log('Contenido cargado:', contents);
      },
      error: (error) => {
        console.error('Error cargando contenido:', error);
        this.folders = [];
        
        // Si el error es "Contenido no encontrado", redirigir al proyecto padre
        if (error.message && error.message.includes('Contenido no encontrado')) {
          console.log('Contenido no encontrado, redirigiendo al proyecto padre...');
          if (this.currentProjectId) {
            this.router.navigate(['/timebox-planning', this.currentProjectId, 'folders']);
          }
        }
      }
    });
  }

  selectFolder(item: ProjectContent): void {
    // Si el item es una carpeta, navega a ella; de lo contrario, puedes manejar la apertura del documento/video/imagen
    if (item.tipo === 'Carpeta') {
      this.router.navigate([item.id], { relativeTo: this.route });
    } else {
      console.log(`Abriendo ${item.tipo}: ${item.nombre}`, item.adjunto?.url);
      
      if (item.adjunto && item.adjunto.url) {
        // Construir la URL completa
        const fullUrl = `http://localhost:3000${item.adjunto.url}`;
        console.log('URL completa del archivo:', fullUrl);
        
        // Abrir el archivo en una nueva pestaña
        window.open(fullUrl, '_blank');
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
    if (this.currentParentIdForModal) {
      this.projectService.addContentToParent(
        this.currentParentIdForModal,
        newItem // newItem ya tiene 'tipo', 'nombre', 'descripcion', 'adjunto'
      ).subscribe({
        next: (addedItem) => {
          // Actualiza la lista de contenido para reflejar el nuevo ítem
          if (this.currentParentIdForModal) {
            this.loadContents(this.currentParentIdForModal);
          }
          console.log('Nuevo ítem añadido:', addedItem);
          
          // Recargar los proyectos para mantener sincronizados los datos en memoria
          this.projectService.reloadProjects();
        },
        error: (error) => {
          console.error('Error al añadir el ítem:', error);
          alert('Error al crear el ítem. Inténtalo de nuevo.');
        }
      });
    } else {
      console.error('No se pudo determinar el padre para añadir el ítem.');
    }
  }
}
