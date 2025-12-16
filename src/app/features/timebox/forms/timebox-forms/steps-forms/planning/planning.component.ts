import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormGroupDirective,
  FormArray,
  ReactiveFormsModule,
  AbstractControl,
  FormControl,
} from '@angular/forms';
import { FechaInicioComponent } from './components/fecha-inicio.component';
import { ModalEjeAplicativoComponent } from './components/modal-eje-aplicativo.component';
import { SelectAlcanceComponent } from './components/select-alcance.component';
import { SelectEsfuerzoComponent } from './components/select-esfuerzo.component';
import { SkillFormComponent } from './components/skill-form.component';
import { CommonModule } from '@angular/common';
import { AdjuntosFormComponent } from '../../../../../../shared/components/modals/adjuntos-form.component';
import { ChecklistFormComponent } from '../../../../../../shared/components/modals/checklist-form.component';
import { SelectTimeboxTypeComponent } from './components/select-type.component';
import { TimeboxTypeService } from '../../../../pages/timebox-maintainer/services/timebox-maintainer.service';
import { Persona } from '../../../../../../shared/interfaces/fases-timebox.interface';
import { Timebox } from '../../../../../../shared/interfaces/timebox.interface';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { TimeboxApiService } from '../../../../services/timebox-api.service';
import { formatDate } from '../../../../../../shared/helpers/date-formatter';
import { UploadService } from '../../../../../../shared/services/upload.service';
import { environment } from '../../../../../../../environments/environment';
import { SelectEntregableComponent } from "./components/select-entregable.component";

@Component({
  selector: 'app-planning',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FechaInicioComponent,
    ModalEjeAplicativoComponent,
    SelectAlcanceComponent,
    SelectEsfuerzoComponent,
    SkillFormComponent,
    AdjuntosFormComponent,
    ChecklistFormComponent,
    SelectTimeboxTypeComponent,
    SelectEntregableComponent
],
  templateUrl: './planning.component.html',
})
export class PlanningComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  @Input() formGroupName!: string;

  teamLeaders: Persona[] = []; // Todas las personas elegibles como Team Leader
  filteredTeamLeaders: Persona[] = []; // Personas filtradas para mostrar en el autocomplete
  showTeamLeaderDropdown: boolean = false; // Controla la visibilidad del dropdown
  // Este FormControl solo maneja el TEXTO que el usuario escribe en el input.
  teamLeaderSearchControl = new FormControl<string | null>('');
  private destroy$ = new Subject<void>(); // Para desuscribirse de observables y evitar fugas de memoria

  @Output() autoSaveRequest = new EventEmitter<Timebox>();

  constructor(
    private fb: FormBuilder,
    public rootFormGroup: FormGroupDirective,
    private timeboxTypeService: TimeboxTypeService,
    private timeboxApiService: TimeboxApiService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.form = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;

    // Cargar personas desde la API
    this.timeboxApiService.getPersonas().subscribe({
      next: (personas) => {
        this.teamLeaders = personas.filter(
          (persona) => persona.rol === 'Team Leader'
        );
      },
      error: (error) => {
        console.error('Error cargando personas:', error);
        this.teamLeaders = [];
      },
    });

    const currentTeamLeader: Persona | null =
      this.form.get('teamLeader')?.value;

    if (
      currentTeamLeader &&
      typeof currentTeamLeader === 'object' &&
      currentTeamLeader.nombre
    ) {
      this.teamLeaderSearchControl.setValue(currentTeamLeader.nombre);
    } else {
      console.log('🔍 No hay teamLeader inicial o está mal formateado');
    }

    // Suscribirse a cambios en el grupo planning completo para refrescar UI
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.updateUIFromForm();
    });

    // Suscripción específica al control teamLeader para reflejar cambios programáticos del padre
    const teamLeaderCtrl = this.form.get('teamLeader');
    teamLeaderCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((leader) => {
        if (leader && typeof leader === 'object' && leader.nombre) {
          this.teamLeaderSearchControl.setValue(leader.nombre, {
            emitEvent: false,
          });
        }
      });

    // Forzar una sincronización inicial asincrónica por si el patch del padre ocurre después
    setTimeout(() => this.updateUIFromForm());

    this.teamLeaderSearchControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((value: any) => {
        let searchText: string = '';
        if (typeof value === 'string') {
          searchText = value;
        } else if (value && typeof value === 'object' && value.nombre) {
          // Esto es por si en algún caso se asignara un objeto (aunque no debería pasar aquí)
          searchText = value.nombre;
        }
        this.filterTeamLeaders(searchText);

        // Si el texto en el input no coincide exactamente con el nombre de una persona seleccionada,
        // establece el valor del FormControl 'teamLeader' del formulario padre a null.
        const foundPersona = this.teamLeaders.find(
          (p) => p.nombre.toLowerCase() === searchText.toLowerCase()
        );
        if (!foundPersona && searchText !== '') {
          // Solo si hay texto y no se encuentra
          this.form.get('teamLeader')?.setValue(null);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método para actualizar la UI cuando cambie el formulario
  private updateUIFromForm(): void {
    const teamLeader = this.form.get('teamLeader')?.value;
    const skills = this.form.get('skills')?.value;
    const completada = this.form.get('completada')?.value;

    // Actualizar Team Leader en el input de búsqueda
    if (teamLeader && typeof teamLeader === 'object' && teamLeader.nombre) {
      this.teamLeaderSearchControl.setValue(teamLeader.nombre, {
        emitEvent: false,
      });
    } else {
      console.log(
        '🔍 Clearing teamLeader search control - no valid teamLeader found'
      );
      this.teamLeaderSearchControl.setValue('', { emitEvent: false });
    }
  }

  get teamLeaderFormControl(): FormControl {
    return this.form.get('teamLeader') as FormControl;
  }

  // --- Lógica del Autocompletado ---
  filterTeamLeaders(searchText: string): void {
    const filterValue = searchText.toLowerCase();
    this.filteredTeamLeaders = this.teamLeaders.filter((persona) =>
      persona.nombre.toLowerCase().includes(filterValue)
    );
    this.showTeamLeaderDropdown =
      filterValue.length > 0 && this.filteredTeamLeaders.length > 0;
  }

  selectTeamLeader(persona: Persona): void {
    this.form.get('teamLeader')?.setValue(persona);
    this.teamLeaderSearchControl.setValue(persona.nombre, { emitEvent: false });
    this.showTeamLeaderDropdown = false;
  }

  clearTeamLeader(): void {
    this.teamLeaderSearchControl.setValue('');
    this.form.get('teamLeader')?.setValue(null);
    this.showTeamLeaderDropdown = false;
  }

  onFocusTeamLeaderInput(): void {
    const currentValue = this.teamLeaderSearchControl.value;
    if (typeof currentValue === 'string' && !currentValue) {
      this.filteredTeamLeaders = this.teamLeaders.slice();
    } else if (typeof currentValue === 'string') {
      this.filterTeamLeaders(currentValue);
    } else if (currentValue && currentValue) {
      // Si por alguna razón tuviera un objeto
      this.filterTeamLeaders(currentValue);
    }
    this.showTeamLeaderDropdown = true;
  }

  onBlurTeamLeaderInput(): void {
    setTimeout(() => {
      const selectedValue = this.form.get('teamLeader')?.value;
      const searchText = this.teamLeaderSearchControl.value;

      // Si hay un Team Leader válido en el formulario, priorizar mostrarlo SIEMPRE
      if (
        selectedValue &&
        typeof selectedValue === 'object' &&
        selectedValue.nombre
      ) {
        this.teamLeaderSearchControl.setValue(selectedValue.nombre, {
          emitEvent: false,
        });
      } else {
        // Solo limpiar si el usuario escribió algo que no coincide con ninguna persona
        if (typeof searchText === 'string' && searchText.trim() !== '') {
          const found = this.teamLeaders.find(
            (p) => p.nombre.toLowerCase() === searchText.toLowerCase()
          );
          if (!found) {
            this.teamLeaderSearchControl.setValue('', { emitEvent: false });
            this.form.get('teamLeader')?.setValue(null);
          }
        }
      }
      this.showTeamLeaderDropdown = false;
    }, 150);
  }

  isTeamLeaderInvalid(): boolean {
    const control = this.form.get('teamLeader');
    const searchControl = this.teamLeaderSearchControl;

    // Si el campo es requerido y está vacío (no hay objeto Persona asignado)
    // Asumiendo que 'teamLeader' en el formulario padre puede ser 'required'
    if (control?.hasError('required') && control.touched && !control.value) {
      return true;
    }

    // Si el input de búsqueda tiene texto, pero no se ha seleccionado un objeto Persona válido
    const searchText = searchControl.value;
    if (typeof searchText === 'string' && searchText !== '') {
      const isSelected = this.teamLeaders.some(
        (p) => p.nombre.toLowerCase() === searchText.toLowerCase()
      );
      if (!isSelected) {
        return true; // El texto no corresponde a una selección válida de la lista
      }
    }
    return false;
  }

  getData() {
    return this.form.value;
  }

  // Método para marcar todos los campos como touched para mostrar errores
  markAllFieldsAsTouched(): void {
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach((subKey) => {
            const subControl = control.get(subKey);
            if (subControl) {
              subControl.markAsTouched();
            }
          });
        }
      }
    });
  }

  getTipoTimebox(): string {
    const typeId = this.rootFormGroup.control.get('tipoTimebox')?.value;

    const currentOptions =
      this.timeboxTypeService.timeboxTypesSubject.getValue();

    const selectedType = currentOptions.find((opt) => opt.id === typeId);

    if (!selectedType) return 'No reconocido.';

    return selectedType.nombre;
  }

  getEntregablesTimebox(): string[] {
    const typeId = this.rootFormGroup.control.get('tipoTimebox')?.value;

    if (!typeId) return [];

    const currentOptions =
      this.timeboxTypeService.timeboxTypesSubject.getValue();

    if (!currentOptions || currentOptions.length === 0) return [];

    const selectedType = currentOptions.find((opt) => opt.id === typeId);

    if (!selectedType || !selectedType.entregablesComunes) return [];

    return selectedType.entregablesComunes;
  }

  getEvidenciasTimebox(): string[] {
    const typeId = this.rootFormGroup.control.get('tipoTimebox')?.value;

    if (!typeId) return [];

    const currentOptions =
      this.timeboxTypeService.timeboxTypesSubject.getValue();

    if (!currentOptions || currentOptions.length === 0) return [];

    const selectedType = currentOptions.find((opt) => opt.id === typeId);

    if (!selectedType || !selectedType.evidenciasCierre) return [];

    return selectedType.evidenciasCierre;
  }

  //Eje y aplicativo
  showModalEjeAplicativo = false;

  openModalEjeAplicativo() {
    this.showModalEjeAplicativo = true;
  }

  closeModalEjeAplicativo() {
    this.showModalEjeAplicativo = false;
  }

  saveEjeyAplicativo(info: { eje: string; aplicativo: string }) {
    this.form.controls['eje'].setValue(info.eje);
    this.form.controls['aplicativo'].setValue(info.aplicativo);
    console.log(info);
  }

  onTimeboxTypeChange(type: string) {
    this.rootFormGroup.control.get('tipoTimebox')?.setValue(type);
  }

  onFechaInicioChange(fecha: string) {
    this.form.get('fechaInicio')?.setValue(fecha);
  }

  getFormattedDate(date: string | undefined): string {
    if (!date) return '';
    const dateToDate = new Date(date);
    return formatDate(dateToDate, true);
  }

  onAlcanceChange(alcance: string) {
    this.form.get('alcance')?.setValue(alcance);
  }

  onEsfuerzoChange(esfuerzo: string) {
    this.form.get('esfuerzo')?.setValue(esfuerzo);
  }

  onEntregableChange(entregable: { id: string; nombre: string }) {
    this.rootFormGroup.control.get('entregable')?.setValue(entregable.id);
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

  //Skill
  showModalSkill = false;

  openModalSkill() {
    this.showModalSkill = true;
  }

  closeModalSkill() {
    this.showModalSkill = false;
  }

  get skillsForm(): FormArray {
    return this.form.get('skills') as FormArray;
  }

  addSkill(info: { tipo: string; nombre: string }) {
    const skillGroup = this.fb.group({
      tipo: [info.tipo],
      nombre: [info.nombre],
    });

    this.skillsForm.push(skillGroup);
  }

  get groupedSkills() {
    const grouped: { [tipo: string]: FormGroup[] } = {};

    this.skillsForm.controls.forEach((skillGroup: any) => {
      const tipo = skillGroup.controls['tipo'].value;
      if (!grouped[tipo]) {
        grouped[tipo] = [];
      }
      grouped[tipo].push(skillGroup);
    });

    return grouped;
  }

  eliminarSkill(index: number) {
    this.skillsForm.removeAt(index);
  }

  //Checklist
  showModalChecklist = false;

  openModalChecklist() {
    this.showModalChecklist = true;
  }

  closeModalChecklist() {
    this.showModalChecklist = false;
  }

  get cumplimiento(): FormArray {
    return this.form.get('cumplimiento') as FormArray;
  }

  addItemChecklist(item: { label: string; checked: boolean }) {
    const acuerdoGroup = this.fb.group({
      label: [item.label],
      checked: [item.checked],
    });

    this.cumplimiento.push(acuerdoGroup);
  }

  eliminarChecklist(index: number) {
    this.cumplimiento.removeAt(index);
  }
}
