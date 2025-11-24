import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormGroupDirective,
  FormArray,
  FormControl,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MejoraFormComponent } from './components/mejora-form.component';
import { AdjuntosFormComponent } from '../../../../../../shared/components/modals/adjuntos-form.component';
import { ChecklistFormComponent } from '../../../../../../shared/components/modals/checklist-form.component';
import { PersonaSelectorComponent } from '../../../../../../shared/components/modals/persona-selector.component';
import { formatDate } from '../../../../../../shared/helpers/date-formatter';
import { GeneradorOrdenesPagoService } from '../../../../../finanzas/services/generador-ordenes-pago.service';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-close',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdjuntosFormComponent,
    ChecklistFormComponent,
    PersonaSelectorComponent,
    MejoraFormComponent,
    RouterModule,
  ],
  templateUrl: './close.component.html',
  styleUrl: './close.component.css',
})
export class CloseComponent implements OnInit, OnChanges {
  form!: FormGroup;
  @Input() formGroupName!: string;
  @Input() timeboxId: string = '';

  optionsCumplimiento = ['Total', 'Parcial'];
  generandoOrdenes = false; // ✅ Indicador de estado para la generación de órdenes

  // ✅ PROPIEDADES PARA MOSTRAR ÓRDENES GENERADAS
  ordenesGeneradas: any[] = [];
  ordenesExistentes = false;
  mostrarOrdenes = false;
  errorGeneracion = '';

  constructor(
    private fb: FormBuilder,
    public rootFormGroup: FormGroupDirective,
    private generadorOrdenesService: GeneradorOrdenesPagoService
  ) {}

  ngOnInit(): void {
    this.form = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;
    this.getTimeboxPayOrders();
  }

  // ✅ IMPLEMENTAR OnChanges PARA DETECTAR CAMBIOS EN EL INPUT
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeboxId']) {
      const currentValue = changes['timeboxId'].currentValue;
      const previousValue = changes['timeboxId'].previousValue;

      if (currentValue) {
        console.log(
          '✅ CloseComponent ngOnChanges - ID del timebox actualizado:',
          currentValue
        );
      } else {
        console.log(
          '⚠️ CloseComponent ngOnChanges - ID del timebox está vacío'
        );
      }
    }
  }

  //Consultar Timebox con ordenes de pago vigentes
  async getTimeboxPayOrders() {
    this.ordenesExistentes =
      await this.generadorOrdenesService.verificarOrdenesExistentes(
        this.timeboxId
      );

    console.log('Ordenes existentes? : ', this.ordenesExistentes);
  }

  getData() {
    return this.form.value;
  }

  //Responsable
  showModalAprobador = false;

  openModalAprobador() {
    this.showModalAprobador = true;
  }

  closeModalAprobador() {
    this.showModalAprobador = false;
  }

  get aprobador(): FormControl {
    return this.form.controls['aprobador'] as FormControl;
  }

  handlePersonaSeleccionada(event: { tipo: string; persona: string }) {
    if (event.tipo === 'responsable') {
      this.aprobador.setValue(event.persona);
      this.closeModalAprobador();
    }
  }
  eliminarAprobador() {
    this.aprobador.setValue(null);
  }

  //Checklist
  showModalChecklist = false;

  openModalChecklist() {
    this.showModalChecklist = true;
  }

  closeModalChecklist() {
    this.showModalChecklist = false;
  }

  get checklist(): FormArray {
    return this.form.get('checklist') as FormArray;
  }

  addItemChecklist(item: { label: string; checked: boolean }) {
    const acuerdoGroup = this.fb.group({
      label: [item.label],
      checked: [item.checked],
    });

    this.checklist.push(acuerdoGroup);
  }

  eliminarChecklist(index: number) {
    this.checklist.removeAt(index);
  }

  //Adjuntos
  showModalAdjuntos = false;

  openModalAdjuntos() {
    this.showModalAdjuntos = true;
  }

  closeModalAdjuntos() {
    this.showModalAdjuntos = false;
  }

  get adjuntos(): FormArray {
    return this.form.get('adjuntos') as FormArray;
  }

  getAdjuntosFormArray(): FormArray {
    return this.form.get('adjuntos') as FormArray;
  }

  recibirArchivo(files: File[]) {
    const adjuntos = this.getAdjuntosFormArray();
    files.forEach((file) => {
      adjuntos.push(
        this.fb.group({
          nombre: [file.name],
          url: [''],
        })
      );
    });
    this.closeModalAdjuntos();
  }

  downloadFile(adjuntoControl: AbstractControl) {
    const adjuntoValue = adjuntoControl.value;
    if (adjuntoValue && adjuntoValue.url) {
      const url = adjuntoValue.url;
      const a = document.createElement('a');
      a.href = url;
      a.download = adjuntoValue.nombre || 'download';
      a.click();
    } else if (adjuntoValue instanceof File) {
      const url = window.URL.createObjectURL(adjuntoValue);
      const a = document.createElement('a');
      a.href = url;
      a.download = adjuntoValue.name;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      console.warn(
        'No se puede descargar el archivo: Formato desconocido o sin URL',
        adjuntoValue
      );
    }
  }

  eliminarAdjunto(index: number) {
    this.adjuntos.removeAt(index);
  }
  //Mejoras
  showModalMejoras = false;

  openModalMejoras() {
    this.showModalMejoras = true;
  }

  closeModalMejoras() {
    this.showModalMejoras = false;
  }

  get mejoras(): FormArray {
    return this.form.get('mejoras') as FormArray;
  }

  addMejora(info: { tipo: string; nombre: string }) {
    const mejorasGroup = this.fb.group({
      tipo: [info.tipo],
      nombre: [info.nombre],
    });

    this.mejoras.push(mejorasGroup);
  }

  get groupedMejoras() {
    const grouped: { [tipo: string]: FormGroup[] } = {};

    this.mejoras.controls.forEach((mejorasGroup: any) => {
      const tipo = mejorasGroup.get('tipo')?.value;
      if (!grouped[tipo]) {
        grouped[tipo] = [];
      }
      grouped[tipo].push(mejorasGroup);
    });

    return grouped;
  }

  eliminarMejora(index: number) {
    this.mejoras.removeAt(index);
  }

  // ✅ MÉTODO PARA GENERAR ÓRDENES DE PAGO AUTOMÁTICAS
  async generarOrdenesPagoAutomaticas() {
    try {
      this.generandoOrdenes = true; // ✅ Activar indicador de carga
      this.errorGeneracion = ''; // ✅ Limpiar errores anteriores
      this.ordenesGeneradas = []; // ✅ Limpiar órdenes anteriores

      console.log(
        '💰 CloseComponent: Iniciando generación automática de órdenes de pago...'
      );

      // Obtener el ID del timebox desde el formulario padre
      const timeboxId = this.obtenerTimeboxId();
      if (!timeboxId) {
        console.warn('⚠️ No se pudo obtener el ID del timebox');
        this.errorGeneracion = 'No se pudo obtener el ID del timebox';
        this.generandoOrdenes = false; // ✅ Desactivar indicador
        return;
      }

      // Verificar si ya existen órdenes para este timebox
      this.ordenesExistentes =
        await this.generadorOrdenesService.verificarOrdenesExistentes(
          timeboxId
        );

      console.log('Ordenes existentes? : ', this.ordenesExistentes);

      if (this.ordenesExistentes) {
        console.log('ℹ️ Ya existen órdenes de pago para este timebox');
        this.errorGeneracion = 'Ya existen órdenes de pago para este timebox';
        return;
      }

      // Generar las órdenes de pago automáticamente
      const ordenesGeneradas =
        await this.generadorOrdenesService.generarOrdenesPagoAutomaticas(
          timeboxId
        );

      if (ordenesGeneradas && ordenesGeneradas.length > 0) {
        console.log(
          '✅ Órdenes de pago generadas exitosamente:',
          ordenesGeneradas.length
        );

        // ✅ ALMACENAR Y MOSTRAR LAS ÓRDENES GENERADAS
        this.ordenesGeneradas = ordenesGeneradas;
        this.mostrarOrdenes = true;

        // Mostrar resumen al usuario
        this.mostrarResumenOrdenesGeneradas(ordenesGeneradas);
      } else {
        console.log(
          'ℹ️ No se generaron órdenes de pago (posiblemente no hay team mobilization configurado)'
        );
        this.errorGeneracion =
          'No se generaron órdenes de pago. Verifica que haya team mobilization configurado.';
      }
    } catch (error) {
      console.error('❌ Error generando órdenes de pago automáticas:', error);
      this.errorGeneracion =
        'Error generando órdenes de pago. Revisa la consola para más detalles.';
    } finally {
      this.generandoOrdenes = false; // ✅ Desactivar indicador al finalizar
    }
  }

  // Función para saber si se generaron ordenes o no

  // ✅ Obtener el ID del timebox desde el formulario padre
  private obtenerTimeboxId(): string | null {
    try {
      // ✅ Primero intentar usar el input timeboxId
      if (this.timeboxId) {
        console.log('🔍 Timebox ID encontrado desde input:', this.timeboxId);
        return this.timeboxId;
      }

      // ✅ Si no hay input, intentar obtener el ID desde diferentes ubicaciones del formulario
      const rootForm = this.rootFormGroup.control;
      console.log('🔍 obtenerTimeboxId() - rootForm existe:', !!rootForm);

      // Buscar en diferentes niveles del formulario
      const timeboxId =
        rootForm.get('id')?.value ||
        rootForm.get('timeboxId')?.value ||
        rootForm.get('timebox.id')?.value;

      console.log('🔍 obtenerTimeboxId() - ID desde formulario:', timeboxId);
      console.log(
        '🔍 obtenerTimeboxId() - rootForm.get("id"):',
        rootForm.get('id')?.value
      );
      console.log(
        '🔍 obtenerTimeboxId() - rootForm.get("timeboxId"):',
        rootForm.get('timeboxId')?.value
      );

      return timeboxId;
    } catch (error) {
      console.error('❌ Error obteniendo ID del timebox:', error);
      return null;
    }
  }

  // ✅ Mostrar resumen de las órdenes generadas
  private mostrarResumenOrdenesGeneradas(ordenes: any[]) {
    const resumen = ordenes
      .map(
        (orden) =>
          `• ${orden.developerName} (${
            orden.rol
          }): $${orden.monto.toLocaleString('es-CL')} CLP`
      )
      .join('\n');

    const mensaje = `✅ Órdenes de pago generadas exitosamente!\n\n${resumen}\n\nTotal: ${ordenes.length} órdenes generadas.`;

    alert(mensaje);
  }

  // ✅ Calcular total de todas las órdenes generadas
  calcularTotalOrdenes(): number {
    return this.ordenesGeneradas.reduce(
      (total, orden) => total + orden.monto,
      0
    );
  }

  emitValue(option: string) {
    this.form.get('cumplimiento')?.setValue(option);
  }

  /** Formatear fecha con el formato "Vie 05 may. 2025 hhmm hrs" */
  getFormattedDate(date: string | undefined): string {
    if (date == undefined || date == '') return '';

    const dateToDate = new Date(date);
    return formatDate(dateToDate);
  }
}
