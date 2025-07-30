import { Component, Input, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-close',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdjuntosFormComponent,
    ChecklistFormComponent,
    PersonaSelectorComponent,
    MejoraFormComponent,
  ],
  templateUrl: './close.component.html',
  styleUrl: './close.component.css',
})
export class CloseComponent implements OnInit {
  form!: FormGroup;
  @Input() formGroupName!: string;

  optionsCumplimiento = ['Total', 'Parcial'];

  constructor(
    private fb: FormBuilder,
    private rootFormGroup: FormGroupDirective
  ) {}

  ngOnInit(): void {
    this.form = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;
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

  emitValue(option: string) {
    this.form.get('cumplimiento')?.setValue(option);
  }
}
