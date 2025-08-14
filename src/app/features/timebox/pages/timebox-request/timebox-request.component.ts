// src/app/pages/timebox-requests/timebox-requests.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import {
  switchMap,
  map,
  tap,
  catchError,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import {
  Postulacion,
  Timebox,
} from '../../../../shared/interfaces/timebox.interface';
import { TimeboxService } from '../../services/timebox.service';
import { formatDate } from '../../../../shared/helpers/date-formatter';
import { RequestDetailsModalComponent } from './components/request-details-modal.component';

export interface FlattenedRequest {
  timeboxId: string;
  timeboxName: string;
  timeboxStatus: string;
  projectId: string;
  postulacion: Postulacion;
  requestStatus: 'pending' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-timebox-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RequestDetailsModalComponent],
  templateUrl: './timebox-requests.component.html',
})
export class TimeboxRequestsComponent implements OnInit {
  filteredRequests$!: Observable<FlattenedRequest[]>;
  error: string | null = null; // Mantenemos el error para mensajes en la UI

  // Propiedades que se vincularán directamente al ngModel en el HTML
  searchTerm: string = '';
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';

  // BehaviorSubject para los filtros (internos, observados por combineLatest)
  searchTermSubject = new BehaviorSubject<string>('');
  statusFilterSubject = new BehaviorSubject<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');

  // Usamos este BehaviorSubject para forzar la recarga de datos principal
  private refreshTriggerSubject = new BehaviorSubject<boolean>(true);

  constructor(private timeboxService: TimeboxService) {}

  ngOnInit(): void {
    // Sincroniza los valores iniciales de las propiedades con los BehaviorSubject
    // usando setTimeout(..., 0) para evitar el ExpressionChangedAfterItHasBeenCheckedError
    // Esto asegura que la primera emisión ocurra después del ciclo de detección de cambios inicial.
    setTimeout(() => {
      this.searchTermSubject.next(this.searchTerm);
      this.statusFilterSubject.next(this.statusFilter);
      this.refreshTriggerSubject.next(true); // Dispara la carga inicial
    }, 0);

    this.filteredRequests$ = combineLatest([
      this.refreshTriggerSubject.asObservable(),
      this.searchTermSubject
        .asObservable()
        .pipe(debounceTime(300), distinctUntilChanged()),
      this.statusFilterSubject.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([_, searchTerm, statusFilter]) => {
        this.error = null; // Limpiar errores anteriores antes de una nueva carga

        return this.timeboxService.getAllTimeboxesWithPostulations().pipe(
          map((timeboxes) =>
            this.flattenTimeboxRequests(timeboxes, searchTerm, statusFilter)
          ),
          // Removido tap para isLoading = false
          catchError((err) => {
            console.error('Error al cargar solicitudes:', err);
            this.error =
              'No se pudieron cargar las solicitudes. Por favor, intente de nuevo.';
            return of([]);
          })
        );
      })
    );
  }

  // --- Lógica de Procesamiento y Filtrado (sin cambios) ---
  private flattenTimeboxRequests(
    timeboxes: Timebox[],
    searchTerm: string,
    statusFilter: 'all' | 'pending' | 'approved' | 'rejected'
  ): FlattenedRequest[] {
    const requests: FlattenedRequest[] = [];
    timeboxes.forEach((timebox) => {
      if (
        timebox.publicacionOferta?.postulaciones &&
        timebox.publicacionOferta.postulaciones.length > 0
      ) {
        timebox.publicacionOferta.postulaciones.forEach((postulacion) => {
          const requestStatus = this.getRequestStatus(postulacion);

          if (statusFilter === 'all' || statusFilter === requestStatus) {
            requests.push({
              timeboxId: timebox.id!,
              timeboxName:
                timebox.fases?.planning?.nombre || 'Timebox sin nombre',
              timeboxStatus: timebox.estado,
              projectId: timebox.projectId,
              postulacion,
              requestStatus,
            });
          }
        });
      }
    });

    const lowerSearchTerm = searchTerm.toLowerCase();
    return requests.filter(
      (req) =>
        req.timeboxName.toLowerCase().includes(lowerSearchTerm) ||
        req.postulacion.desarrollador.toLowerCase().includes(lowerSearchTerm) ||
        req.postulacion.rol.toLowerCase().includes(lowerSearchTerm) ||
        req.postulacion.id.toLowerCase().includes(lowerSearchTerm)
    );
  }

  getRequestStatus(
    postulacion: Postulacion
  ): 'pending' | 'approved' | 'rejected' {
    if (postulacion.estadoSolicitud === 'Aprobada') {
      return 'approved';
    } else if (postulacion.estadoSolicitud === 'Rechazada') {
      return 'rejected';
    }
    return 'pending';
  }

  // --- Acciones del Team Leader (sin cambios) ---

  // Propiedades para el modal
  selectedRequest: FlattenedRequest | null = null;
  showDetailsModal = false;

  viewRequestDetails(request: FlattenedRequest): void {
    this.selectedRequest = request;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.selectedRequest = null;
    this.showDetailsModal = false;
  }

  acceptRequest(request: FlattenedRequest): void {
    if (request.requestStatus !== 'pending') {
      alert('Esta solicitud ya no está pendiente.');
      return;
    }

    if (
      confirm(
        `¿Estás seguro de que quieres asignar a ${request.postulacion.desarrollador} como ${request.postulacion.rol} en el Timebox "${request.timeboxName}"?`
      )
    ) {
      this.timeboxService
        .assignRoleToTimebox(
          request.timeboxId,
          request.postulacion.id,
          request.postulacion.rol,
          request.postulacion.desarrollador
        )
        .subscribe({
          next: (updatedTimebox) => {
            alert(
              `¡${request.postulacion.desarrollador} ha sido asignado como ${request.postulacion.rol} en "${request.timeboxName}"!`
            );
            this.refreshRequests();
          },
          error: (err) => {
            console.error('Error al asignar rol:', err);
            alert(
              `Error al asignar el rol: ${err.message || 'Error desconocido'}`
            );
          },
        });
    }
  }

  rejectRequest(request: FlattenedRequest): void {
    if (request.requestStatus !== 'pending') {
      alert('Esta solicitud ya no está pendiente.');
      return;
    }

    if (
      confirm(
        `¿Estás seguro de que quieres rechazar la postulación de ${request.postulacion.desarrollador} para el rol ${request.postulacion.rol} en el Timebox "${request.timeboxName}"?`
      )
    ) {
      this.timeboxService
        .rejectPostulacion(request.timeboxId, request.postulacion.id)
        .subscribe({
          next: (updatedTimebox) => {
            alert(
              `Postulación de ${request.postulacion.desarrollador} para "${request.timeboxName}" rechazada.`
            );
            this.refreshRequests();
          },
          error: (err) => {
            console.error('Error al rechazar postulación:', err);
            alert(
              `Error al rechazar la postulación: ${
                err.message || 'Error desconocido'
              }`
            );
          },
        });
    }
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.searchTermSubject.next(term);
  }

  onStatusFilterChange(
    status: 'all' | 'pending' | 'approved' | 'rejected'
  ): void {
    this.statusFilter = status;
    this.statusFilterSubject.next(status);
  }

  refreshRequests(): void {
    this.refreshTriggerSubject.next(true);
  }

  getFormattedDate(date: string | undefined): string {
    if (date == undefined || date == '') return '';
    const dateToDate = new Date(date);
    return formatDate(dateToDate);
  }
}
