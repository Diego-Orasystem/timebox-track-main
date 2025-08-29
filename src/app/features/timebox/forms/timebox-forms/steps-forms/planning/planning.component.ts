import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
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
        console.log('🔍 PlanningComponent - TeamLeaders cargados:', this.teamLeaders);
      },
      error: (error) => {
        console.error('Error cargando personas:', error);
        this.teamLeaders = [];
      }
    });

    // Log del estado inicial del formulario
    console.log('🔍 PlanningComponent ngOnInit - Form state:', {
      teamLeader: this.form.get('teamLeader')?.value,
      skills: this.form.get('skills')?.value,
      completada: this.form.get('completada')?.value
    });

    const currentTeamLeader: Persona | null =
      this.form.get('teamLeader')?.value;
    console.log('🔍 PlanningComponent ngOnInit - currentTeamLeader:', currentTeamLeader);
    
    if (
      currentTeamLeader &&
      typeof currentTeamLeader === 'object' &&
      currentTeamLeader.nombre
    ) {
      console.log('🔍 Setting teamLeader in search control:', currentTeamLeader.nombre);
      this.teamLeaderSearchControl.setValue(currentTeamLeader.nombre);
    } else {
      console.log('🔍 No hay teamLeader inicial o está mal formateado');
    }

    // Suscribirse a cambios en el grupo planning completo para refrescar UI
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      console.log('🔍 Form value changed:', value);
      this.updateUIFromForm();
    });

    // Suscripción específica al control teamLeader para reflejar cambios programáticos del padre
    const teamLeaderCtrl = this.form.get('teamLeader');
    teamLeaderCtrl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((leader) => {
      if (leader && typeof leader === 'object' && leader.nombre) {
        this.teamLeaderSearchControl.setValue(leader.nombre, { emitEvent: false });
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
    
    console.log('🔍 Updating UI from form:', { teamLeader, skills, completada });
    console.log('🔍 TeamLeader type:', typeof teamLeader);
    console.log('🔍 TeamLeader value:', teamLeader);
    
    // Actualizar Team Leader en el input de búsqueda
    if (teamLeader && typeof teamLeader === 'object' && teamLeader.nombre) {
      console.log('🔍 Setting teamLeader in search control:', teamLeader.nombre);
      this.teamLeaderSearchControl.setValue(teamLeader.nombre, { emitEvent: false });
    } else {
      console.log('🔍 Clearing teamLeader search control - no valid teamLeader found');
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
      if (selectedValue && typeof selectedValue === 'object' && selectedValue.nombre) {
        this.teamLeaderSearchControl.setValue(selectedValue.nombre, { emitEvent: false });
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
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(subKey => {
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

    const currentOptions = this.timeboxTypeService.timeboxTypesSubject.getValue();
    
    if (!currentOptions || currentOptions.length === 0) return [];

    const selectedType = currentOptions.find((opt) => opt.id === typeId);
    
    if (!selectedType || !selectedType.entregablesComunes) return [];

    return selectedType.entregablesComunes;
  }

  getEvidenciasTimebox(): string[] {
    const typeId = this.rootFormGroup.control.get('tipoTimebox')?.value;
    
    if (!typeId) return [];

    const currentOptions = this.timeboxTypeService.timeboxTypesSubject.getValue();
    
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
    return formatDate(dateToDate, false);
  }

  onAlcanceChange(alcance: string) {
    this.form.get('alcance')?.setValue(alcance);
  }

  onEsfuerzoChange(esfuerzo: string) {
    this.form.get('esfuerzo')?.setValue(esfuerzo);
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
    
    // Subir cada archivo al servidor
    files.forEach((file) => {
      // Agregar temporalmente el archivo con estado de carga
      const adjuntoGroup = this.fb.group({
        nombre: [file.name],
        url: ['Subiendo...'],
        uploading: [true],
        adjuntoId: [null as string | null]
      });
      adjuntos.push(adjuntoGroup);
      
      // Subir archivo al servidor
      this.uploadService.uploadFile(file).subscribe({
        next: (uploadResult) => {
          // Actualizar con la URL real del archivo subido
          adjuntoGroup.patchValue({
            url: uploadResult.data.url,
            uploading: false,
            adjuntoId: uploadResult.data.id
          });
          console.log('Archivo subido exitosamente:', uploadResult);
          
          // Guardar automáticamente el timebox para persistir los adjuntos
          this.saveTimeboxAutomatically();
        },
        error: (error) => {
          console.error('Error al subir archivo:', error);
          // Remover el adjunto fallido
          const index = adjuntos.controls.indexOf(adjuntoGroup);
          if (index > -1) {
            adjuntos.removeAt(index);
          }
          alert(`Error al subir archivo ${file.name}: ${error.message || 'Error desconocido'}`);
        }
      });
    });
    
    this.closeModalAdjuntos();
  }

  // Método para guardar automáticamente el timebox
  private saveTimeboxAutomatically() {
    // Obtener el formulario padre para construir el timebox completo
    const parentForm = this.rootFormGroup.control;
    const formValues = parentForm.getRawValue();
    
    // Crear un objeto Timebox básico con los datos del formulario
    const timeboxToSave: Timebox = {
      ...formValues,
      fases: {
        ...formValues.fases,
        planning: {
          ...formValues.planning,
          adjuntos: this.getAdjuntosFormArray().value
        }
      }
    };
    
    console.log('Guardando timebox automáticamente para persistir adjuntos...', timeboxToSave);
    this.autoSaveRequest.emit(timeboxToSave);
  }

  downloadFile(adjuntoControl: AbstractControl) {
    const adjuntoValue = adjuntoControl.value;
    if (adjuntoValue && adjuntoValue.url) {
      // Construir la URL completa usando la URL base del environment
      const baseUrl = environment.apiUrl.replace('/api', ''); // Remover /api para obtener solo el servidor
      const fullUrl = `${baseUrl}${adjuntoValue.url}`;
      
      console.log('🔍 Debug archivo planning:', {
        adjuntoValue: adjuntoValue,
        adjuntoUrl: adjuntoValue.url,
        environmentApiUrl: environment.apiUrl,
        baseUrl: baseUrl,
        fullUrl: fullUrl
      });
      
      // Para PDFs, intentar abrir directamente en el navegador
      if (adjuntoValue.url.includes('.pdf')) {
        // Intentar abrir en nueva pestaña primero
        const newWindow = window.open(fullUrl, '_blank');
        
        // Si el navegador bloquea la nueva ventana, mostrar en modal
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          console.log('Nueva ventana bloqueada, mostrando en modal...');
          
          // Crear un iframe temporal para abrir el PDF
          const iframe = document.createElement('iframe');
          iframe.src = fullUrl;
          iframe.style.width = '100%';
          iframe.style.height = '600px';
          iframe.style.border = 'none';
          
          // Crear una ventana modal para mostrar el PDF
          const modal = document.createElement('div');
          modal.style.position = 'fixed';
          modal.style.top = '0';
          modal.style.left = '0';
          modal.style.width = '100%';
          modal.style.height = '100%';
          modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
          modal.style.zIndex = '9999';
          modal.style.display = 'flex';
          modal.style.justifyContent = 'center';
          modal.style.alignItems = 'center';
          
          const content = document.createElement('div');
          content.style.backgroundColor = 'white';
          content.style.padding = '20px';
          content.style.borderRadius = '8px';
          content.style.width = '90%';
          content.style.height = '90%';
          content.style.position = 'relative';
          
          const closeBtn = document.createElement('button');
          closeBtn.textContent = 'Cerrar';
          closeBtn.style.position = 'absolute';
          closeBtn.style.top = '10px';
          closeBtn.style.right = '10px';
          closeBtn.style.padding = '8px 16px';
          closeBtn.style.backgroundColor = '#f44336';
          closeBtn.style.color = 'white';
          closeBtn.style.border = 'none';
          closeBtn.style.borderRadius = '4px';
          closeBtn.style.cursor = 'pointer';
          closeBtn.onclick = () => document.body.removeChild(modal);
          
          content.appendChild(closeBtn);
          content.appendChild(iframe);
          modal.appendChild(content);
          document.body.appendChild(modal);
        }
      } else {
        // Para otros tipos de archivo, descargar normalmente
        const a = document.createElement('a');
        a.href = fullUrl;
        a.download = adjuntoValue.nombre || 'download';
        a.click();
      }
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
