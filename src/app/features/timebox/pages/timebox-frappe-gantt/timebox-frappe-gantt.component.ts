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
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import Gantt from 'frappe-gantt';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../../../shared/interfaces/project.interface';
import { Timebox } from '../../../../shared/interfaces/timebox.interface';
import { ModalCreateComponent } from '../../components/modal-create-timebox/modal-create.component';

@Component({
  selector: 'app-timebox-frappe-gantt',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCreateComponent],
  templateUrl: './timebox-frappe-gantt.component.html',
  styleUrls: ['./timebox-frappe-gantt.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class TimeboxFrappeGanttComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() colorMap: { [k: string]: string } = {
    'En Definición': '#9CA3AF',
    'Disponible': '#10B981',
    'En Ejecución': '#3B82F6',
    'Finalizado': '#6B7280'
  };
  // Variables para proyectos
  projects$: Observable<Project[]>;
  selectedProjectId = '';
  selectedProjectName = signal<string>('');
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

  // Computed signal para las tareas del Gantt
  ganttTasks = computed(() => {
    const timeboxesList = this.timeboxes();
    return timeboxesList
      .map(tb => this.timeboxToGanttTask(tb))
      .filter(t => !!t.start && !!t.end);
  });

  viewModes = [
    { value: 'Day', label: 'Día' },
    { value: 'Week', label: 'Semana' },
    { value: 'Month', label: 'Mes' },
    { value: 'Year', label: 'Año' }
  ];

  @ViewChild('ganttRoot', { static: false }) ganttRoot!: ElementRef<HTMLDivElement>;

  private ganttInstance: any = null;
  private destroyed$ = new Subject<void>();

  constructor(private projectService: ProjectService) {
    // Effect para renderizar el Gantt cuando cambien las tareas o la vista esté lista
    effect(() => {
      const tasks = this.ganttTasks();
      const isReady = this.viewReady();

      if (isReady && tasks.length > 0) {
        //console.log('Tareas generadas para Gantt:', tasks);
        this.renderGantt(tasks);
      } else if (isReady && tasks.length === 0) {
        //console.warn('No hay tareas válidas con fechas de inicio y fin');
        this.destroyGantt();
      }
    });

    // Cargar proyectos
    this.projects$ = this.projectService.getProjects();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroyGantt();
  }

  onProjectChange(newProjectId: string) {
    console.log('Proyecto seleccionado:', newProjectId);
    this.selectedProjectId = newProjectId;
    //cambio de nombre para el proyecto
    this.projects$.pipe(
      map((projects: Project[]) => projects.find(p => p.id === this.selectedProjectId)?.nombre || '')
    ).subscribe(projectName => {
      this.selectedProjectName.set(projectName);
    });


    this.disabledButton = this.selectedProjectId != '' ? false : true;
    if (!newProjectId) {
      this.timeboxes.set([]);
      this.destroyGantt();
      return;
    }

    this.projectService.getTimeboxesByProjectId(newProjectId)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(timeboxes => {
        this.timeboxes.set(timeboxes);
      });
  }

  private renderGantt(tasks: any[]) {
    if (!this.ganttRoot || !this.ganttRoot.nativeElement) {
      return;
    }

    if (tasks.length === 0) {
      console.warn('No hay tareas para renderizar');
      return;
    }

    this.destroyGantt();

    const el = this.ganttRoot.nativeElement;
    el.innerHTML = '';
    //console.log('Tareas antes del sort:', tasks);
    /*REQUERIMIENTO DE MEJORA SEGUNDO SPRINT*/ 
    //ordernar las task por fecha de creación descendente
    tasks.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
    //console.log('Tareas despues del sort:', tasks);

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
        on_click: (task: any) => this.onTaskClick(task),
        on_date_change: (task: any, start: Date, end: Date) => this.onTaskDateChange(task, start, end),
        on_progress_change: (task: any, progress: number) => void(0),
      };

      /*REQUERIMIENTO DE MEJORA SEGUNDO SPRINT*/ 
      /*Quitar botón Today*/
      this.ganttInstance = new Gantt(el, tasks, ganttOptions);
      const todayBtn = el.querySelector('.today-button');
      if (todayBtn) {
        todayBtn.classList.add('hidden');
      }

      // Acá se fuerza el overflow hidden después de un pequeño delay para evitar un segundo scroll en el container
      setTimeout(() => {
        const ganttContainer = el.querySelector('.gantt-container');
        if (ganttContainer) {
          (ganttContainer as HTMLElement).style.overflowY = 'hidden';
          (ganttContainer as HTMLElement).style.overflowX = 'scroll';
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

  private onTaskClick(task: any) {
    this.selectedTimebox = this.timeboxes().find(tb => tb.id === task.id) || {} as Timebox;
    this.modalMode = 'edit';
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
    if (tb.estado === 'Finalizado') {
      progress = 100;
    } else if (tb.estado === 'En Ejecución') {
      progress = this.calculateProgress(tb);
    } else if (tb.estado === 'Disponible') {
      progress = 10;
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
      createdAt: tb.created_at
    };
  }

  private buildTaskName(tb: Timebox): string {
    const tipo = tb.fases.planning?.nombre || 'Timebox';
    const estado = tb.estado || '';
    return `${tipo} • ${estado}`;
  }

    //*revisar, esto calcula mal WARD*/
  private calculateProgress(tb: Timebox): number {
    const fases = tb.fases || {};
    const fasesCompletadas = Object.values(fases).filter((fase: any) =>
      fase && (fase.completado || fase.fechaFin)
    ).length;
    const totalFases = Object.keys(fases).length || 1;
    return Math.round((fasesCompletadas / totalFases) * 100);
  }

  private extractStartEndFromTimebox(tb: Timebox): { start?: string; end?: string } {
    // Priorizar planning si existe
    const planning = tb.fases?.planning;

    if (planning) {
      //console.log('Planning encontrado para timebox:', tb.id, planning);

      // Usar fechaInicio o fecha_inicio
      const fechaInicio = new Date(planning.fechaInicio) || planning.fecha_inicio;
      // fechaFase podría ser la fecha de fin, o usar fechaCompletado
      const semanas  = this.getSemanasEsfuerzo(planning.esfuerzo);

       /*REQUERIMIENTO DE MEJORA SEGUNDO SPRINT*/
       /*
          acá en vez de tomar la fecha fin que trae el planning, se calcula 
          obteniendo las semanas de esfuerzo y se suman a la fecha inicio
       */
      // sumar semaas a la fecha inicio
      const fechaFin = new Date(fechaInicio).setDate(new Date(fechaInicio).getDate() + (semanas * 7));

      if (fechaInicio) {
        const startDate = new Date(fechaInicio);
        if (!isNaN(startDate.getTime())) {
          const start = startDate.toISOString().split('T')[0];

          // Si hay fecha fin en planning, usarla
          if (fechaFin) {
            const endDate = new Date(fechaFin);
            if (!isNaN(endDate.getTime())) {
              const end = endDate.toISOString().split('T')[0];
              // console.log(`✅ Fechas extraídas de planning para ${tb.id}:`);
              // console.log(`   Inicio: ${start} (${fechaInicio})`);
              // console.log(`   Fin: ${end} (${fechaFin})`);
              return { start, end };
            }
          }

          // Si solo hay fecha inicio, calcular fin por defecto
          const defaultEnd = this.getDefaultEndDate(start);
          //console.log(`⚠️ Solo fecha inicio en planning para ${tb.id}: ${start}, usando fin por defecto: ${defaultEnd}`);
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

      const possibleStartKeys = ['start', 'fechaInicio', 'fecha_inicio', 'fecha'];
      const possibleEndKeys = ['end', 'fechaFin', 'fecha_fin', 'fechaCompletado'];

      possibleStartKeys.forEach(key => {
        const dateValue = fase[key];
        if (dateValue) {
          const d = new Date(dateValue);
          if (!isNaN(d.getTime())) dates.push(d);
        }
      });

      possibleEndKeys.forEach(key => {
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
      entregaKeys.forEach(key => {
        const dateValue = (tb.entrega as any)?.[key];
        if (dateValue) {
          const d = new Date(dateValue);
          if (!isNaN(d.getTime())) dates.push(d);
        }
      });
    }

    if (dates.length === 0) {
      console.warn(`❌ Timebox ${tb.id} no tiene fechas válidas en ninguna fuente`);
      return { start: undefined, end: undefined };
    }

    const minTime = Math.min(...dates.map(d => d.getTime()));
    const maxTime = Math.max(...dates.map(d => d.getTime()));

    const start = new Date(minTime).toISOString().split('T')[0];
    const end = new Date(maxTime).toISOString().split('T')[0];

    console.log(`📅 Fechas extraídas del fallback para ${tb.id}: ${start} - ${end}`);

    return { start, end };
  }

  /**/
  private getSemanasEsfuerzo(option : string) : number {
      switch(option) {
        case '1 sem':
          return 1;
        case '2 sem':
          return 2;
        case '3 sem':
          return 3;
        default:
          return 1;// por defecto una semana que es lo que tiene como escogido el formulario de ingreso en el time box
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
    this.modalMode = this.modalMode;
    this.showModal = true;
    this.selectedTimebox = this.selectedTimebox ? { ...this.selectedTimebox } : {} as Timebox;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTimebox = {} as Timebox; // Limpia el timebox seleccionado al cerrar
    this.modalMode = 'create'; // Resetea el modo a 'create' al cerrar
  }

  handleTimeboxSave(timeboxFromModal: Timebox): void {
    if (!this.selectedProjectId) {
      console.error('❌ No hay projectId');
      return;
    }

    if (timeboxFromModal.id) {
      // Actualizar timebox existente
      this.projectService.updateTimebox(
        this.selectedProjectId,
        timeboxFromModal
      ).subscribe({
        next: (resultTimebox: Timebox) => {
          console.log('✅ Timebox actualizado exitosamente:', resultTimebox);
          this.onProjectChange(this.selectedProjectId); // Recargar timeboxes para incluir los cambios
        },
        error: (error: any) => {
          console.error('❌ Error actualizando timebox:', error);
          alert('Error al actualizar el timebox. Inténtalo de nuevo.');
        }
      });
    } else {
      // Crear nuevo timebox
      this.projectService.createTimebox(
        this.selectedProjectId,
        timeboxFromModal
      ).subscribe({
        next: (resultTimebox: Timebox) => {
          console.log('✅ Timebox creado exitosamente:', resultTimebox);
          this.selectedTimebox = { ...resultTimebox };
          this.onProjectChange(this.selectedProjectId); // Recargar timeboxes para incluir el nuevo
        },
        error: (error: any) => {
          console.error('Error creando timebox:', error);
          alert('Error al crear el timebox. Inténtalo de nuevo.');
        }
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
    const taskBar = ganttContainer.querySelector(`[data-id="${task.id}"]`) ||
                    ganttContainer.querySelector(`.bar-wrapper[task-id="${task.id}"]`) ||
                    ganttContainer.querySelector(`#task-${task.id}`);
    
    if (taskBar) {
      taskBar.classList.add('gantt-highlight');
      taskBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
