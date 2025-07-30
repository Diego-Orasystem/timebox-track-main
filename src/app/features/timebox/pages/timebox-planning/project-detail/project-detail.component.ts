import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterModule,
  ActivatedRoute,
  Router,
} from '@angular/router'; // Importa ActivatedRoute y Router
import { Subscription } from 'rxjs'; // Para manejar las suscripciones
import { Project } from '../../../../../shared/interfaces/project.interface';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule], // RouterModule ya incluye routerLink y routerLinkActive
  template: `
    <style>
      /* Tus estilos existentes para .radio-inputs y .radio, .name */
      .radio-inputs {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        border-radius: 5px;
        background-color: var(--lines);
        box-sizing: border-box;
        box-shadow: 0 0 0px 1px rgba(0, 0, 0, 0.06);
        padding: 0.25rem;
        width: 400px; /* Puedes ajustar el ancho */
        font-size: 14px;
      }

      .radio-inputs .radio {
        flex: 1 1 auto;
        text-align: center;
      }

      .radio-inputs .radio input {
        display: none; /* Asegura que el input de radio nativo no se vea */
      }

      .radio-inputs .radio .name {
        display: flex;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        border: none;
        padding: 0.5rem 0;
        color: var(--darkText); /* Color de texto por defecto */
        transition: all 0.15s ease-in-out;
      }

      /* --- ESTILOS PARA EL TAB ACTIVO (LO NUEVO/MODIFICADO) --- */
      .radio-inputs .radio .name.tab-active {
        background-color: var(
          --backgroundLight
        ); /* Fondo blanco o claro para el tab activo */
        font-weight: 600; /* Texto en negrita para el tab activo */
        color: var(
          --primary
        ); /* Cambia el color del texto a tu color primario */
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
          0 1px 2px 0 rgba(0, 0, 0, 0.06); /* Una sombra sutil para darle elevación */
      }

      /* Estilo para el hover de los tabs NO activos */
      .radio-inputs .radio .name:not(.tab-active):hover {
        background-color: var(
          --backgroundHover
        ); /* Un gris muy claro o un poco más oscuro que el fondo de los radios inactivos */
        color: var(
          --darkText
        ); /* Asegura que el texto sea legible al hacer hover */
      }
    </style>

    <div class=" p-10 flex flex-col gap-4">
      <div class="header inline-flex items-center justify-between w-full">
        <div class="flex flex-col place-content-center select-none w-full">
          <h2 class="text-lg font-bold mb-3" [style.color]="'var(--primary)'">
            {{ currentProject?.nombre }}
          </h2>
          <p class="text-sm text-[var(--text-medium)]">
            Gestiona el contenido de tu proyecto.
          </p>
        </div>
        <div class="inline-flex  items-center justify-end">
          <div class="radio-inputs">
            <label class="radio">
              <a
                [routerLink]="['./folders']"
                routerLinkActive="tab-active"
                class="name"
              >
                Carpetas
              </a>
            </label>
            <label class="radio">
              <a
                [routerLink]="['./timeboxes']"
                routerLinkActive="tab-active"
                [routerLinkActiveOptions]="{ exact: true }"
                class="name"
              >
                Timeboxes
              </a>
            </label>
          </div>
        </div>
      </div>

      <router-outlet></router-outlet>
    </div>
  `,
})
export class ProjectDetailComponent implements OnInit {
  currentProject: Project | undefined;
  private routeSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router, // Inyecta Router para la redirección inicial
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const projectId = params.get('projectId');
      if (projectId) {
        this.projectService.getProjectById(projectId).subscribe({
          next: (project) => {
            this.currentProject = project;
          },
          error: (error) => {
            console.error('Error cargando proyecto:', error);
            this.currentProject = undefined;
          }
        });

        // --- Lógica para asegurar que una pestaña esté activa por defecto ---
        // Si no hay una ruta hija activa (ej. /:projectId directamente),
        // redirige a la ruta 'timeboxes' por defecto.
        if (this.router.url === `/` + projectId) {
          // Verifica si la URL actual es solo el ID del proyecto
          this.router.navigate(['./timeboxes'], { relativeTo: this.route });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe(); // Limpiar la suscripción al destruir el componente
  }
}
