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
    'Estado',
  ];

  @Input() timeboxes: Timebox[] = [];
  selectedTimebox: Timebox = {} as Timebox;

  @Output() timeboxSelected = new EventEmitter<Timebox>();

  // Usamos ngOnChanges para reaccionar a los cambios en el input 'timeboxes'
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeboxes']) {
      console.log('Timeboxes recibidos en tabla:', this.timeboxes);
    }
  }

  onSelectTimebox(tbx: Timebox): void {
    this.selectedTimebox = tbx;
    this.timeboxSelected.emit(tbx);
  }

  getFormattedDate(date: string | undefined): string {
    console.log('🔍 getFormattedDate recibió:', date);
    if (date == undefined || date == null || date === '') return '';
    const dateToDate = new Date(date);
    const formatted = formatDate(dateToDate, false); // false para mostrar solo fecha sin horas
    console.log('🔍 getFormattedDate retorna:', formatted);
    return formatted;
  }


}
