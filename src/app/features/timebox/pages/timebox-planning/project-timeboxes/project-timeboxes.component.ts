import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Timebox } from '../../../../../shared/interfaces/timebox.interface';
import { TimeboxTableComponent } from '../../../components/timebox-table/timebox-table.component';
import { ProductService } from '../../../services/product.service';
import { ModalCreateComponent } from '../../../components/modal-create-timebox/modal-create.component';

@Component({
  selector: 'app-project-timeboxes-page',
  standalone: true,
  imports: [CommonModule, TimeboxTableComponent, ModalCreateComponent], // Importa el componente de tabla
  template: `
    <div class="header flex items-center justify-between w-full mb-4">
      <div class="flex flex-col place-content-center select-none">
        <h1 class="text-md font-extrabold text-[var(--text-dark)]">
          Timeboxes
        </h1>
        <p class="text-sm text-[var(--text-medium)]">
          Planifica, gestiona y publica timeboxes.
        </p>
      </div>
      <button
        (click)="openCreateModal()"
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
        <span class="text-xs font-medium">Nuevo Timebox</span>
      </button>
    </div>
    <timebox-table
      [timeboxes]="projectTimeboxes"
      (timeboxSelected)="onTimeboxSelected($event)"
    ></timebox-table>
    <app-modal-create
      [show]="showModal"
      (close)="closeModal()"
      [mode]="modalMode"
      [timeboxData]="selectedTimebox"
      [entregableId]="entregableId"
      (timeboxOutput)="handleTimeboxSave($event)"
    ></app-modal-create>
  `,
})
export class ProjectTimeboxesPageComponent implements OnInit, OnDestroy {
  projectTimeboxes: Timebox[] = [];
  entregableId: string | null = null;
  showModal: boolean = false;
  modalMode: 'create' | 'read' | 'edit' = 'create';
  selectedTimebox: Timebox = {} as Timebox;
  private routeSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Suscribirse a los parámetros de la ruta para obtener el entregableId
    this.routeSubscription = this.route.parent?.paramMap.subscribe((params) => {
      // Usamos .parent para acceder al ':entregableId' de la ruta padre (ProjectDetailComponent)
      this.entregableId = params.get('productId');
      if (this.entregableId) {
        this.loadProjectTimeboxes();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe(); // Limpiar la suscripción
  }

  loadProjectTimeboxes(): void {
    if (this.entregableId) {
      this.productService
        .getTimeboxesByEntregableId(this.entregableId)
        .subscribe({
          next: (timeboxes: Timebox[]) => {
            this.projectTimeboxes = timeboxes || [];
            console.log('Timeboxes cargados:', this.projectTimeboxes);
          },
          error: (error: any) => {
            console.error('Error cargando timeboxes del proyecto:', error);
            this.projectTimeboxes = [];
          },
        });
    }
  }

  openCreateModal(): void {
    this.selectedTimebox = {} as Timebox; // Asegura un objeto vacío para creación
    this.modalMode = 'create';
    this.showModal = true;
  }

  // Método llamado desde la tabla/lista para editar un timebox
  onTimeboxSelected(timebox: Timebox): void {
    console.log('Timebox Seleccionado: ', JSON.stringify(timebox, null, 2));

    // Mapear los datos del backend al formato que espera el frontend
    this.selectedTimebox = {
      ...timebox,
      // Mapear campos del backend a campos del frontend
      tipoTimebox: timebox.tipoTimebox,
      businessAnalyst: timebox.businessAnalyst,
      // Asegurar que las fases estén inicializadas y mapear campos específicos
      fases: timebox.fases
        ? {
            planning: timebox.fases.planning
              ? {
                  ...timebox.fases.planning,
                  // Mapear fecha_inicio del backend a fechaInicio del frontend
                  fechaInicio:
                    timebox.fases.planning.fecha_inicio ||
                    timebox.fases.planning.fechaInicio ||
                    '',
                  adjuntos: timebox.fases.planning.adjuntos || [],
                  // El teamLeader ya viene correctamente formateado desde la API
                  teamLeader: timebox.fases.planning.teamLeader || undefined,
                }
              : undefined,
            kickOff: timebox.fases.kickOff,
            refinement: timebox.fases.refinement,
            qa: timebox.fases.qa,
            close: timebox.fases.close,
          }
        : {
            planning: undefined,
            kickOff: undefined,
            refinement: undefined,
            qa: undefined,
            close: undefined,
          },
    };
    console.log('🔍 Timebox seleccionado para editar:', this.selectedTimebox);

    this.modalMode = 'edit';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTimebox = {} as Timebox; // Limpia el timebox seleccionado al cerrar
    this.modalMode = 'create'; // Resetea el modo a 'create' al cerrar
    this.loadProjectTimeboxes(); // Opcional: recargar timeboxes por si hubo cambios y el modal no lo hizo
  }

  handleTimeboxSave(timeboxFromModal: Timebox): void {
    if (!this.entregableId) {
      console.error('❌ No hay entregableId');
      return;
    }

    if (timeboxFromModal.id) {
      console.log('🔄 Actualizando timebox existente:', timeboxFromModal.id);
      // Actualizar timebox existente
      this.productService
        .updateTimebox(this.entregableId, timeboxFromModal)
        .subscribe({
          next: (resultTimebox: Timebox) => {
            console.log('✅ Timebox actualizado exitosamente:', resultTimebox);
            this.selectedTimebox = { ...resultTimebox };
            this.loadProjectTimeboxes();
          },
          error: (error: any) => {
            console.error('❌ Error actualizando timebox:', error);
            alert('Error al actualizar el timebox. Inténtalo de nuevo.');
          },
        });
    } else {
      console.log('🔄 Creando nuevo timebox...');
      // Crear nuevo timebox
      this.productService
        .createTimebox(this.entregableId, timeboxFromModal)
        .subscribe({
          next: (resultTimebox: Timebox) => {
            console.log('✅ Timebox creado exitosamente:', resultTimebox);
            this.selectedTimebox = { ...resultTimebox };
            this.loadProjectTimeboxes();
          },
          error: (error: any) => {
            console.error('Error creando timebox:', error);
            alert('Error al crear el timebox. Inténtalo de nuevo.');
          },
        });
    }
  }
}
