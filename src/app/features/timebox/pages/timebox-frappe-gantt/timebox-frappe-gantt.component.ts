import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
  signal,
  computed,
  effect,
  ViewEncapsulation,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, forkJoin } from 'rxjs';
import { map, takeUntil, take } from 'rxjs/operators';
import Gantt from 'frappe-gantt';
import { ProductService } from '../../services/product.service';
import { Product, Entregable } from '../../../../shared/interfaces/product.interface';
import { Timebox } from '../../../../shared/interfaces/timebox.interface';
import { ModalCreateComponent } from '../../components/modal-create-timebox/modal-create.component';
import { ModalCreateEntregableComponent } from '../../../entregable/components/modal-create-entregable/modal-create-entregable.component';
import { TimeboxService } from '../../services/timebox.service';

@Component({
  selector: 'app-timebox-frappe-gantt',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCreateComponent, ModalCreateEntregableComponent],
  templateUrl: './timebox-frappe-gantt.component.html',
  styleUrls: ['./timebox-frappe-gantt.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class TimeboxFrappeGanttComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() colorMap: { [k: string]: string } = {
    'En Definición': '#A65F01',
    Disponible: '#4F46E5',
    'En Ejecución': '#4F46E5',
    Finalizado: '#31ae42',
  };
  // Variables para proyectos
  products$: Observable<Product[]>;
  selectedProductId = ''; // RENOMBRADO
  // Signals
  timeboxes = signal<Timebox[]>([]);
  currentViewMode = signal<'Week'>('Week');
  viewReady = signal<boolean>(false);
  // Variables para modal/formulario
  modalMode: 'create' | 'edit' = 'create';
  showModal: boolean = false;
  disabledButton: boolean = true;
  selectedTimebox: Timebox = {} as Timebox;
  selectedTaskId: string = '';

  // Tooltip
  showTooltip = false;
  showEntregableModal = false;
  entregableModalMounted = true; // ← controla el montaje del modal

  entregablesForProduct: Entregable[] = [];

  entregableTimeboxes = new Map<string, Timebox[]>();

  ganttTasks = computed(() => {
    const timeboxesList = this.timeboxes();
    return timeboxesList
      .map((tb) => this.timeboxToGanttTask(tb))
      .filter((t) => !!t.start && !!t.end);
  });

  viewModes = [
    { value: 'Day', label: 'Día' },
    { value: 'Week', label: 'Semana' },
    { value: 'Month', label: 'Mes' },
    { value: 'Year', label: 'Año' },
  ];

  @ViewChild('ganttRoot', { static: false })
  ganttRoot!: ElementRef<HTMLDivElement>;

  private ganttInstance: any = null;
  private destroyed$ = new Subject<void>();
  selectedProjectName = signal<string>('');

  private invalidLogSet = new Set<string>(); // evita logs repetidos
  private entregableTasksCache = new Map<string, any[]>(); // cache tareas por entregable

  constructor(
    private productService: ProductService,
    private timeboxService: TimeboxService
  ) {
    effect(() => {
      const tasks = this.ganttTasks();
      const isReady = this.viewReady();

      if (isReady && tasks.length > 0) {
        this.renderGantt(tasks);
      } else if (isReady && tasks.length === 0) {
        this.destroyGantt();
      }
    });

    // Cargar proyectos
    this.products$ = this.productService.getProjects();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroyGantt();
  }

  onProjectChange(newProductId: string) {
    console.debug('[Gantt] onProjectChange ->', newProductId);
    this.selectedProductId = newProductId;

    // Fuerza recreación del modal de Entregable (ngOnInit vuelve a correr)
    this.remountEntregableModal();

    this.products$
      .pipe(
        map((products: Product[]) =>
          products.find((p) => p.id === this.selectedProductId)?.nombre || ''
        ),
        take(1) // ← evita subs acumuladas
      )
      .subscribe((projectName) => {
        this.selectedProjectName.set(projectName);
      });

    this.disabledButton = this.selectedProductId !== '' ? false : true;

    if (!newProductId) {
      this.timeboxes.set([]);
      this.entregablesForProduct = [];
      this.entregableTimeboxes.clear();
      this.entregableTasksCache.clear();
      this.invalidLogSet.clear();
      this.destroyGantt();
      return;
    }

    this.productService
      .getEntregablesDetailsByProduct(newProductId)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (entregables: Entregable[]) => {
          console.debug('[Gantt] entregables recibidos:', Array.isArray(entregables) ? entregables.length : 0);
          this.entregablesForProduct = Array.isArray(entregables) ? entregables : [];

          if (this.entregablesForProduct.length === 0) {
            this.entregableTimeboxes.clear();
            this.entregableTasksCache.clear();
            this.timeboxes.set([]);
            this.invalidLogSet.clear();
            // No llames render aquí; el efecto se encarga
            return;
          }

          const ids = this.entregablesForProduct.flatMap(e =>
            (Array.isArray(e.timeboxes) ? e.timeboxes : []).map(tb => tb.id)
          );

          if (ids.length === 0) {
            this.entregableTimeboxes.clear();
            this.entregableTasksCache.clear();
            this.timeboxes.set([]);
            this.invalidLogSet.clear();
            return;
          }

          forkJoin(ids.map(id => this.timeboxService.getTimebox(id)))
            .pipe(takeUntil(this.destroyed$))
            .subscribe({
              next: (details) => {
                const detailMap = new Map(details.filter(Boolean).map(d => [d!.id, d!]));

                this.entregableTimeboxes.clear();
                this.entregablesForProduct.forEach(e => {
                  const detailed = (e.timeboxes || [])
                    .map(tb => detailMap.get(tb.id))
                    .filter(Boolean) as Timebox[];
                  this.entregableTimeboxes.set(e.id, detailed);
                });

                const allDetailed = Array.from(this.entregableTimeboxes.values()).flat();

                // Actualiza caches y señal una sola vez
                this.updateTimeboxCaches(allDetailed);

                // No llames render aquí; el efecto se encarga
              },
              error: (err) => {
                console.error('Error obteniendo detalle de timeboxes:', err);
                this.entregableTimeboxes.clear();
                this.entregableTasksCache.clear();
                this.timeboxes.set([]);
                this.invalidLogSet.clear();
              }
            });
        },
        error: (err) => {
          console.error('Error cargando entregables del producto:', err);
          this.entregablesForProduct = [];
          this.entregableTimeboxes.clear();
          this.entregableTasksCache.clear();
          this.timeboxes.set([]);
          this.invalidLogSet.clear();
          this.destroyGantt();
        },
      });
  }

  private updateTimeboxCaches(allDetailed: Timebox[]) {
    this.invalidLogSet.clear();
    this.entregableTasksCache.clear();

    // Cache tareas por entregable y log único por id sin fechas
    this.entregablesForProduct.forEach(e => {
      const tbs = this.entregableTimeboxes.get(e.id) || [];
      const tasks = tbs.map(tb => {
        const { start, end } = this.extractStartEndFromTimebox(tb);
        if (!start || !end) {
          if (!this.invalidLogSet.has(tb.id)) {
            console.warn(`❌ Timebox ${tb.id} no tiene fechas válidas en ninguna fuente`);
            this.invalidLogSet.add(tb.id);
          }
        }
        return this.timeboxToGanttTask(tb);
      });
      this.entregableTasksCache.set(e.id, tasks);
    });

    // Actualiza señal para el efecto
    this.timeboxes.set(allDetailed);
  }

  private renderGantt(tasks: any[]) {
    if (!this.ganttRoot || !this.ganttRoot.nativeElement) return;
    if (tasks.length === 0) {
      console.warn('No hay tareas para renderizar');
      return;
    }
    this.destroyGantt();
    const el = this.ganttRoot.nativeElement;
    el.innerHTML = '';
    tasks.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
    try {
      const ganttOptions: any = {
        view_mode: this.currentViewMode(),
        bar_height: 30,
        bar_corner_radius: 3,
        padding: 15,
        container_height: 650,
        popup_on: 'hover',
        readonly: true,
        language: 'es',
        infinite_padding: false,
        on_click: (task: any) => this.onTaskClick(task),
        on_date_change: (task: any, start: Date, end: Date) =>
          this.onTaskDateChange(task, start, end),
        on_progress_change: (task: any, progress: number) => void 0,
      };
      this.ganttInstance = new Gantt(el, tasks, ganttOptions);
      const todayBtn = el.querySelector('.today-button');
      if (todayBtn) todayBtn.classList.add('hidden');
      setTimeout(() => {
        const ganttContainer = el.querySelector('.gantt-container');
        if (ganttContainer) {
          (ganttContainer as HTMLElement).style.overflowY = 'hidden';
          (ganttContainer as HTMLElement).style.minHeight = '';
          (ganttContainer as HTMLElement).style.height = '100%';
        }
      }, 50);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  private destroyGantt() {
    if (this.ganttRoot && this.ganttRoot.nativeElement) {
      try {
        this.ganttRoot.nativeElement.innerHTML = '';
      } catch (e) {
        console.warn('Error al destruir Gantt DOM:', e);
      }
    }
    this.ganttInstance = null;
  }

  private onTaskClick(task: { id: string }) {
    // Garantizar detalle antes de abrir el modal
    this.timeboxService.getTimebox(task.id)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (tb) => {
          if (!tb) return;
          this.selectedTimebox = { ...tb };
          this.modalMode = 'edit';
          this.showModal = true;
        },
        error: (err) => console.error('Error obteniendo detalle de timebox:', err)
      });
  }

  openCreateModal() {
    this.selectedTimebox = {} as Timebox;
    this.modalMode = 'create';
    this.showModal = true;
  }

  openTimeboxModal() {
    this.showTooltip = false;
    this.modalMode = 'create';
    this.selectedTimebox = {} as Timebox;
    this.openModal();
  }

  private onTaskDateChange(task: any, start: Date, end: Date) {
    const s = this.formatDate(start);
    const e = this.formatDate(end);
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  private timeboxToGanttTask(tb: Timebox): any {
    const { start, end } = this.extractStartEndFromTimebox(tb);

    // Si start y end son iguales, agregar 1 día al end
    let finalEnd = end;
    if (start && end && start === end) {
      const endDate = new Date(end);
      endDate.setDate(endDate.getDate() + 1);
      finalEnd = endDate.toISOString().split('T')[0];
    }
    /*validar todos los progresos de los timebox  WARD*/
    const color = this.colorMap[tb.estado] ?? '#3B82F6';
    let progress = 0;
    switch (tb.estado) {
      case 'En Definición':
        progress = 10;
        break;
      case 'Finalizado':
        progress = 100;
        break;
      default:
        progress = this.calculateProgress(tb);
    }
    const taskName = this.buildTaskName(tb);

    return {
      id: tb.id,
      name: taskName,
      start: start || this.getDefaultStartDate(),
      end: finalEnd || this.getDefaultEndDate(start),
      progress,
      custom_class: `tb-${tb.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      __color: color,
      dependencies: '',
      createdAt: tb.created_at,
    };
  }

  private buildTaskName(tb: Timebox): string {
    const tipo = tb.fases.planning?.nombre || 'Timebox';
    const estado = tb.estado || '';
    return `${tipo}`;
  }

  //*revisar, esto calcula mal WARD*/
  private calculateProgress(tb: Timebox): number {
    let total = 0;
    total += tb.fases.planning?.completada ? 1 : 0;
    total += tb.fases.kickOff?.completada ? 1 : 0;
    total += tb.fases.refinement?.completada ? 1 : 0;
    total += tb.fases.qa?.completada ? 1 : 0;
    total += tb.fases.close?.completada ? 1 : 0;
    return Math.round((total / 5) * 100);
  }

  private extractStartEndFromTimebox(tb: Timebox): {
    start?: string;
    end?: string;
  } {
    // Priorizar planning si existe
    const planning = tb.fases?.planning;

    if (planning) {
      // Usar fechaInicio o fecha_inicio
      const fechaInicio =
        new Date(planning.fechaInicio) || planning.fecha_inicio;
      // fechaFase podría ser la fecha de fin, o usar fechaCompletado
      const semanas = this.getSemanasEsfuerzo(planning.esfuerzo);

      /*REQUERIMIENTO DE MEJORA SEGUNDO SPRINT*/
      /*
          acá en vez de tomar la fecha fin que trae el planning, se calcula 
          obteniendo las semanas de esfuerzo y se suman a la fecha inicio
       */
      // sumar semaas a la fecha inicio
      const fechaFin = new Date(fechaInicio).setDate(
        new Date(fechaInicio).getDate() + semanas * 7
      );

      if (fechaInicio) {
        const startDate = new Date(fechaInicio);
        if (!isNaN(startDate.getTime())) {
          const start = startDate.toISOString().split('T')[0];

          // Si hay fecha fin en planning, usarla
          if (fechaFin) {
            const endDate = new Date(fechaFin);
            if (!isNaN(endDate.getTime())) {
              const end = endDate.toISOString().split('T')[0];
              return { start, end };
            }
          }

          // Si solo hay fecha inicio, calcular fin por defecto
          const defaultEnd = this.getDefaultEndDate(start);
          return { start, end: defaultEnd };
        }
      }
    }

    //console.warn(`❌ Timebox ${tb.id} no tiene planning o fechas válidas en planning`);

    // Fallback: intentar extraer de otras fases
    const dates: Date[] = [];
    const fases = tb.fases || {};

    Object.values(fases).forEach((fase: any) => {
      if (!fase || fase === planning) return; // Saltar planning que ya se revisó

      const possibleStartKeys = [
        'start',
        'fechaInicio',
        'fecha_inicio',
        'fecha',
      ];
      const possibleEndKeys = [
        'end',
        'fechaFin',
        'fecha_fin',
        'fechaCompletado',
      ];

      possibleStartKeys.forEach((key) => {
        const dateValue = fase[key];
        if (dateValue) {
          const d = new Date(dateValue);
          if (!isNaN(d.getTime())) dates.push(d);
        }
      });

      possibleEndKeys.forEach((key) => {
        const dateValue = fase[key];
        if (dateValue) {
          const d = new Date(dateValue);
          if (!isNaN(d.getTime())) dates.push(d);
        }
      });
    });

    // Extraer fecha de entrega
    if (tb.entrega) {
      const entregaKeys = ['start', 'fecha', 'fechaEntrega', 'fecha_entrega'];
      entregaKeys.forEach((key) => {
        const dateValue = (tb.entrega as any)?.[key];
        if (dateValue) {
          const d = new Date(dateValue);
          if (!isNaN(d.getTime())) dates.push(d);
        }
      });
    }

    if (dates.length === 0) {
      // return undefined sin log; el log ocurre en updateTimeboxCaches
      return { start: undefined, end: undefined };
    }

    const minTime = Math.min(...dates.map((d) => d.getTime()));
    const maxTime = Math.max(...dates.map((d) => d.getTime()));

    const start = new Date(minTime).toISOString().split('T')[0];
    const end = new Date(maxTime).toISOString().split('T')[0];

    console.log(
      `📅 Fechas extraídas del fallback para ${tb.id}: ${start} - ${end}`
    );

    return { start, end };
  }

  /**/
  private getSemanasEsfuerzo(option: string): number {
    switch (option) {
      case '1 sem':
        return 1;
      case '2 sem':
        return 2;
      case '3 sem':
        return 3;
      default:
        return 1; // por defecto una semana que es lo que tiene como escogido el formulario de ingreso en el time box
    }
  }

  private getDefaultStartDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private getDefaultEndDate(start?: string): string {
    const baseDate = start ? new Date(start) : new Date();
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 14); // 2 semanas por defecto
    return endDate.toISOString().split('T')[0];
  }

  changeViewMode(mode: string) {
    if (this.ganttInstance && mode) {
      try {
        this.ganttInstance.change_view_mode(mode);
        this.currentViewMode.set(mode as any);
      } catch (error) {
        console.error('Error al cambiar vista:', error);
      }
    }
  }

  //Manejo de modal para crear/editar timebox
  openModal(): void {
    this.showModal = true;
    this.selectedTimebox = this.selectedTimebox
      ? { ...this.selectedTimebox }
      : ({} as Timebox);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTimebox = {} as Timebox; // Limpia el timebox seleccionado al cerrar
    this.modalMode = 'create'; // Resetea el modo a 'create' al cerrar
  }

  handleTimeboxSave(timeboxFromModal: Timebox): void {
    if (!this.selectedProductId) {
      console.error('❌ No hay productId');
      return;
    }

    if (timeboxFromModal.id) {
      this.productService
        .updateTimebox(this.selectedProductId, timeboxFromModal) // usar productId
        .subscribe({
          next: (resultTimebox: Timebox) => {
            this.onProjectChange(this.selectedProductId);
          },
          error: (error: any) => {
            console.error('❌ Error actualizando timebox:', error);
            alert('Error al actualizar el timebox. Inténtalo de nuevo.');
          },
        });
    } else {
      this.productService
        .createTimebox(this.selectedProductId, timeboxFromModal) // usar productId
        .subscribe({
          next: (resultTimebox: Timebox) => {
            this.selectedTimebox = { ...resultTimebox };
            this.onProjectChange(this.selectedProductId);
          },
          error: (error: any) => {
            console.error('Error creando timebox:', error);
            alert('Error al crear el timebox. Inténtalo de nuevo.');
          },
        });
    }
  }

  highlightTask(task: any) {
    this.selectedTaskId = task.id;

    // Remover highlight previo
    const ganttContainer = this.ganttRoot.nativeElement;
    ganttContainer.querySelectorAll('.gantt-highlight').forEach((el: any) => {
      el.classList.remove('gantt-highlight');
    });

    // Agregar highlight a la barra correspondiente
    const taskBar =
      ganttContainer.querySelector(`[data-id="${task.id}"]`) ||
      ganttContainer.querySelector(`.bar-wrapper[task-id="${task.id}"]`) ||
      ganttContainer.querySelector(`#task-${task.id}`);

    if (taskBar) {
      taskBar.classList.add('gantt-highlight');
      taskBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  toggleTooltip() {
    this.showTooltip = !this.showTooltip;
  }

  openEntregableModal() {
    this.showTooltip = false;
    this.showEntregableModal = true;
    this.entregableModalMounted = true; // asegura que esté montado al abrir
  }

  closeEntregableModal() {
    this.showEntregableModal = false;
  }

  handleEntregableSave(entregableData: Partial<Entregable>) {
    this.closeEntregableModal();
    // Refrescar para ver el nuevo entregable y sus timeboxes
    if (this.selectedProductId) {
      this.onProjectChange(this.selectedProductId);
    }
  }

  // Helper: tareas por entregable usando los detalles
  getTasksForEntregable(entregableId: string): any[] {
    const tbs = this.entregableTimeboxes.get(entregableId) || [];
    return tbs.map(tb => this.timeboxToGanttTask(tb));
  }

  // Agregar listener para cerrar tooltip al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const tooltip = target.closest('.relative');
    if (!tooltip) {
      this.showTooltip = false;
    }
  }

  private remountEntregableModal(): void {
    this.entregableModalMounted = false; // destruye el componente
    setTimeout(() => {
      this.entregableModalMounted = true; // crea de nuevo el componente
    }, 0);
  }
}
