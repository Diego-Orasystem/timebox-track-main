import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Timebox } from '../../../../shared/interfaces/timebox.interface';
import { formatDate } from '../../../../shared/helpers/date-formatter';
import { SolicitudRevision } from '../../../../shared/interfaces/fases-timebox.interface';

@Component({
  selector: 'timebox-table',
  imports: [CommonModule],
  templateUrl: './timebox-table.component.html',
  styleUrl: './timebox-table.component.css',
  standalone: true,
})
export class TimeboxTableComponent implements OnChanges {
  tableLabels = [
    'Timebox',
    'Tipo',
    'Esfuerzo',
    'Fecha Inicio Planning',
    'Fecha Entrega',
    'Solicitud Vigente',
    'Estado',
  ];

  @Input() timeboxes: Timebox[] = [];
  selectedTimebox: Timebox = {} as Timebox;

  @Output() timeboxSelected = new EventEmitter<Timebox>();

  // Usamos ngOnChanges para reaccionar a los cambios en el input 'timeboxes'
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeboxes']) {
    }
  }

  onSelectTimebox(tbx: Timebox): void {
    this.selectedTimebox = tbx;
    this.timeboxSelected.emit(tbx);
  }

  getFormattedDate(date: string | undefined): string {
    if (date == undefined || date == '') return '';
    const dateToDate = new Date(date);
    return formatDate(dateToDate);
  }

  revisionPendiente(tbx: Timebox): boolean {
    const refinement = tbx.fases.refinement;
    if (!refinement || !refinement.revisiones) {
      return false;
    }

    return refinement?.revisiones?.some((solicitud: SolicitudRevision) => {
      return (
        solicitud.cierreSolicitud &&
        solicitud.cierreSolicitud.completada === false
      );
    });
  }

  getTipoPendiente(
    timebox: Timebox
  ): 'Entrega' | 'Cierre' | 'Revision' | 'Ninguno' {
    const refinement = timebox.fases?.refinement;
    const close = timebox.fases?.close;
    const entrega = timebox.entrega;

    // Prioridad: 1. Cierre, 2. Revisión, 3. Entrega

    // A) Solicitud de Cierre pendiente en la fase 'Close'
    if (
      close &&
      close.solicitudCierre &&
      close.solicitudCierre.cierreSolicitud &&
      close.solicitudCierre.cierreSolicitud.completada === false
    ) {
      return 'Cierre';
    }

    // B) Revisión pendiente en la fase 'Refinement'
    if (
      refinement &&
      refinement.revisiones &&
      Array.isArray(refinement.revisiones)
    ) {
      const revisionPendiente = refinement.revisiones.some(
        (solicitud) =>
          solicitud.cierreSolicitud &&
          solicitud.cierreSolicitud.completada === false
      );
      if (revisionPendiente) {
        return 'Revision';
      }
    }

    // C) Entrega pendiente (si existe el objeto entrega pero no tiene fecha)
    if (entrega && !entrega.fechaEntrega) {
      return 'Entrega';
    }

    return 'Ninguno'; // Si no se cumple ninguna de las condiciones anteriores
  }
}
