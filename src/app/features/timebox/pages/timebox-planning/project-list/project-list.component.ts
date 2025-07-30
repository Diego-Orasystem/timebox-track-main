import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Asegúrate de importar CommonModule
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../../../shared/interfaces/project.interface';

import { ItemCreationModalComponent } from '../../../../../shared/components/modals/item-creation-modal.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, ItemCreationModalComponent], // Importa tu modal
  template: `
    <div class="p-10 flex flex-col gap-10 w-full">
      <div class="header flex items-center justify-between w-full">
        <div class="flex flex-col place-content-center select-none">
          <h1 class="text-md font-extrabold text-[var(--text-dark)]">
            Gestión de Proyectos
          </h1>
          <p class="text-sm text-[var(--text-medium)]">
            Visualiza y organiza tus proyectos.
          </p>
        </div>
        <button
          (click)="openModal('create')"
          class="max-w-40 cursor-pointer text-[12px] space-x-1 inline-flex items-center justify-between px-5 py-3 bg-[var(--primary)] text-[var(--lightText)] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primaryDark)] transition-colors duration-200"
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
          <span class="text-xs font-medium">Nuevo Proyecto</span>
        </button>
      </div>

      <div class="Table">
        <div
          *ngIf="projects.length > 0; else noProjects"
          class="flex flex-col gap-4"
        >
          <div
            *ngFor="let project of projects"
            (click)="selectProject(project)"
            class="p-6 rounded-sm shadow-sm  hover:shadow-md transition border border-transparent ease-in-out hover:border hover:border-[var(--lines)] flex flex-col cursor-pointer"
            [style.background-color]="'var(--backgroundLight)'"
          >
            <h3
              class="text-xs font-mono mb-2"
              [style.color]="'var(--text-light)'"
            >
              ID:
              <span
                class="font-semibold"
                [style.color]="'var(--text-medium)'"
                >{{ project.id }}</span
              >
            </h3>
            <h2 class="text-lg font-bold mb-3" [style.color]="'var(--primary)'">
              {{ project.nombre }}
            </h2>
            <p class="text-sm text-gray-600">{{ project.descripcion }}</p>
          </div>
        </div>
        <ng-template #noProjects>
          <p class="text-center text-gray-500">No hay proyectos creados aún.</p>
        </ng-template>
      </div>
    </div>

    <app-item-creation-modal
      [show]="showModal"
      [mode]="modalMode"
      itemType="Proyecto"
      (close)="closeModal()"
      (itemSaved)="handleProjectCreated($event)"
    ></app-item-creation-modal>
  `,
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = []; // Reemplaza 'any' con tu interfaz de Proyecto
  showModal: boolean = false;
  modalMode: 'create' | 'edit' = 'create';

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error('Error cargando proyectos:', error);
        this.projects = [];
      }
    });
  }

  selectProject(project: any): void {
    this.router.navigate([project.id]); // Navega a la ruta del proyecto seleccionado
  }

  openModal(mode: 'create' | 'edit'): void {
    this.modalMode = mode;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  handleProjectCreated(newItem: any): void {
    if (newItem.tipo === 'Proyecto') {
      this.projectService.createProject(
        newItem.nombre,
        newItem.descripcion
      ).subscribe({
        next: (newProject) => {
          this.projects.push(newProject);
          console.log('Nuevo Proyecto creado:', newProject);
          // Aquí podrías añadir el nuevo proyecto a tu lista de proyectos mostrada en la vista
        },
        error: (error) => {
          console.error('Error creando proyecto:', error);
          alert('Error al crear el proyecto. Inténtalo de nuevo.');
        }
      });
    } else {
      console.warn('Tipo inesperado al crear proyecto:', newItem.tipo);
    }
    this.closeModal();
  }
}
