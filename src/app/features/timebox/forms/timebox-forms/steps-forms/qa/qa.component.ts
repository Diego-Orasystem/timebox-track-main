import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import {
  FormGroup,
  FormArray,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms'; // Solo necesitamos FormGroup y FormArray, no FormBuilder aquí
import { Adjuntos } from '../../../../../../shared/interfaces/fases-timebox.interface';

@Component({
  selector: 'app-qa', // Selector para tu componente QA
  templateUrl: './qa.component.html',
  standalone: true, // Asumo que es standalone, si no, quítalo
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./qa.component.css'], // O .scss si usas SASS
})
export class QaComponent implements OnInit {
  form!: FormGroup;
  @Input() formGroupName!: string;
  // Ya no necesitamos FormBuilder inyectado en este componente si no lo construimos aquí
  constructor(private rootFormGroup: FormGroupDirective) {}

  ngOnInit(): void {
    this.form = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;
  }

  // Getter para adjuntosQA (Necesario para el HTML si se gestiona aquí directamente)
  // Este getter asume que `qaForm` es el FormGroup completo de QA.
  get adjuntosformArray(): FormArray {
    return this.form.get('adjuntosQA') as FormArray;
  }

  /**
   * Método auxiliar para la descarga de archivos.
   * Este método ahora asume que recibe un objeto `Adjunto` plano.
   */
  downloadFileDirect(adjunto: Adjuntos): void {
    if (adjunto && adjunto.url) {
      const url = adjunto.url;
      const a = document.createElement('a');
      a.href = url;
      a.download = adjunto.nombre || 'download';
      a.click();
    } else {
      console.warn(
        'No se puede descargar el archivo: Formato desconocido o sin URL',
        adjunto
      );
    }
  }

  // Las interfaces se mantienen aquí para referencia, pero idealmente
  // deberían estar en un archivo de modelos/interfaces compartido.
}
