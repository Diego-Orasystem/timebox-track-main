import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatDate } from '../../../../shared/helpers/date-formatter'; // Assuming this path is correct
import { OrdenDePago } from '../../../../shared/interfaces/orden-de-pago.interface'; // Assuming this path is correct

@Component({
  selector: 'app-modal-aprobacion-pago',
  imports: [CommonModule, FormsModule],
  templateUrl: 'modal-aprobacion-pago.component.html',
  standalone: true,
})
export class ModalAprobacionPagoComponent {
  @Input() show = false;
  @Input() pago: OrdenDePago = {} as OrdenDePago;
  @Output() close = new EventEmitter<void>();

  fileName: string | null = null;
  selectedFile: File | null = null;

  estadoAcordeon: boolean[] = [];

  /**
   * Emite el evento de cierre del modal.
   */
  handleClose(): void {
    this.close.emit();
  }

  /**
   * Calcula el monto total sumando el monto base y el porcentaje de entrega anticipada.
   * @param monto Monto base.
   * @param porcentaje Porcentaje de entrega anticipada.
   * @returns Monto total calculado.
   */
  calcularMontoTotal(monto: number, porcentaje: number): number {
    return monto + (monto * porcentaje) / 100;
  }

  /**
   * Calcula el monto de retención del SII (14.5%) sobre el monto total.
   * @param montoTotal Monto total sobre el cual aplicar la retención.
   * @returns Monto de retención del SII.
   */
  calcularMontoSII(montoTotal: number): number {
    return (montoTotal * 14.5) / 100;
  }

  /**
   * Formatea un valor numérico como moneda chilena (CLP).
   * @param value El número a formatear.
   * @returns El número formateado como string de moneda.
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0, // No decimales para pesos chilenos
      maximumFractionDigits: 0,
    }).format(value);
  }

  /** Función para sumar los totales de las ordenes de pago */
  sumarTotalesOrdenesDePago(ordenes: OrdenDePago[]): number {
    let total = 0;

    for (const orden of ordenes) {
      for (const item of orden.ordenDePago) {
        total += this.calcularMontoTotal(
          item.montoBase,
          item.porcentajeEntregaAnt
        );
      }
    }

    return total;
  }

  /**
   * Formatea un valor numérico como porcentaje.
   * @param value El número a formatear.
   * @returns El número formateado como string de porcentaje.
   */
  formatPercentage(value: number): string {
    return `${value}%`;
  }

  /**
   * Formatea una fecha con el formato "Vie 05 may. 2025 hhmm hrs".
   * Asume que `formatDate` es una función externa que maneja este formato.
   * @param date La fecha a formatear (string o undefined).
   * @returns La fecha formateada o un string vacío si es inválida.
   */
  getFormattedDate(date: string | undefined): string {
    if (!date) return '';
    const dateToDate = new Date(date);
    return formatDate(dateToDate);
  }

  /**
   * Maneja la selección de un archivo por parte del usuario.
   * @param event El evento de cambio del input de archivo.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0]; // Guarda el objeto File
      this.fileName = this.selectedFile.name;
      console.log('Archivo seleccionado:', this.fileName, this.selectedFile);

      // Limpia el valor del input file para permitir la selección del mismo archivo
      input.value = '';
    } else {
      this.selectedFile = null;
      this.fileName = null;
    }
  }

  /**
   * Elimina el archivo seleccionado.
   * @param event El evento del clic del mouse.
   */
  removeFile(event: MouseEvent): void {
    // Detenemos la propagación del evento para evitar que se active el (click) del contenedor
    event.stopPropagation();
    this.fileName = null;
    this.selectedFile = null;
    console.log('Archivo eliminado.');
  }
}
