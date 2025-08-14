import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
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
import { AdjuntosFormComponent } from '../../../../../../shared/components/modals/adjuntos-form.component';
import { ChecklistFormComponent } from '../../../../../../shared/components/modals/checklist-form.component';
import { PersonaSelectorComponent } from '../../../../../../shared/components/modals/persona-selector.component';
import { Persona } from '../../../../../../shared/interfaces/fases-timebox.interface';
import { Timebox } from '../../../../../../shared/interfaces/timebox.interface';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { TimeboxApiService } from '../../../../services/timebox-api.service';
import { environment } from '../../../../../../../environments/environment';
import { UploadService } from '../../../../../../shared/services/upload.service';

@Component({
  selector: 'app-kickoff',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdjuntosFormComponent,
    PersonaSelectorComponent,
    ChecklistFormComponent,
  ],
  templateUrl: './kickoff.component.html',
  styleUrl: './kickoff.component.css',
})
export class KickoffComponent implements OnDestroy {
  form!: FormGroup;
  @Input() formGroupName!: string;

  //Team movilization
  allPersonas: Persona[] = [];
  // Control para el input de búsqueda de cada rol
  businessAmbassadorSearchControl = new FormControl<string | null>('');
  solutionDeveloperSearchControl = new FormControl<string | null>('');
  solutionTesterSearchControl = new FormControl<string | null>('');
  businessAdvisorSearchControl = new FormControl<string | null>('');
  technicalAdvisorSearchControl = new FormControl<string | null>('');

  // Listas filtradas para cada dropdown
  filteredBusinessAmbassador: Persona[] = [];
  filteredSolutionDeveloper: Persona[] = [];
  filteredSolutionTester: Persona[] = [];
  filteredBusinessAdvisor: Persona[] = [];
  filteredTechnicalAdvisor: Persona[] = [];

  // Controla la visibilidad del dropdown para cada rol
  showBusinessAmbassadorDropdown: boolean = false;
  showSolutionDeveloperDropdown: boolean = false;
  showSolutionTesterDropdown: boolean = false;
  showBusinessAdvisorDropdown: boolean = false;
  showTechnicalAdvisorDropdown: boolean = false;

  @Output() rolesAssignedStatusChange = new EventEmitter<boolean>();
  @Output() autoSaveRequest = new EventEmitter<Timebox>();

  private destroy$ = new Subject<void>(); // Para desuscribirse de observables

  constructor(
    private fb: FormBuilder,
    public rootFormGroup: FormGroupDirective,
    private timeboxApiService: TimeboxApiService,
    private uploadService: UploadService
  ) {
    console.log('🚀 KickoffComponent constructor() iniciado');
  }

  ngOnInit(): void {
    console.log('🚀 KickoffComponent ngOnInit() iniciado');
    this.form = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;
    
    // Debug: verificar el timeboxData que se está pasando
    const parentForm = this.rootFormGroup.control;
    const formValues = parentForm.getRawValue();
    console.log('🔍 KickoffComponent ngOnInit - timeboxData:', formValues);
    
    // Suscribirse a cambios en el financiamiento para debug
    const financiamientoGroup = this.form.get('financiamiento');
    if (financiamientoGroup) {
      financiamientoGroup.valueChanges.subscribe(value => {
        console.log('🔍 Financiamiento cambiado:', value);
        // Validar financiamiento cuando cambie
        this.validateFinanciamiento();
      });
    }

    // Cargar todas las personas desde la API
    this.timeboxApiService.getPersonas().subscribe({
      next: (personas) => {
        this.allPersonas = personas;
      },
      error: (error) => {
        console.error('Error cargando personas:', error);
        this.allPersonas = [];
      }
    });

    // Inicializar los inputs de búsqueda si ya hay valores en el formulario
    this.initializeSearchControl(
      'businessAmbassador',
      this.businessAmbassadorSearchControl
    );
    this.initializeSearchControl(
      'solutionDeveloper',
      this.solutionDeveloperSearchControl
    );
    this.initializeSearchControl(
      'solutionTester',
      this.solutionTesterSearchControl
    );
    this.initializeSearchControl(
      'businessAdvisor',
      this.businessAdvisorSearchControl
    );
    this.initializeSearchControl(
      'technicalAdvisor',
      this.technicalAdvisorSearchControl
    );

    // Suscribirse a los cambios de cada input de búsqueda
    this.setupAutocomplete(
      'businessAmbassador',
      this.businessAmbassadorSearchControl
    );
    this.setupAutocomplete(
      'solutionDeveloper',
      this.solutionDeveloperSearchControl
    );
    this.setupAutocomplete('solutionTester', this.solutionTesterSearchControl);
    this.setupAutocomplete(
      'businessAdvisor',
      this.businessAdvisorSearchControl
    );
    this.setupAutocomplete(
      'technicalAdvisor',
      this.technicalAdvisorSearchControl
    );

    // const teamMovilizationGroup = this.form.get(
    //   'teamMovilization'
    // ) as FormGroup;
    // if (teamMovilizationGroup) {
    //   Object.values(teamMovilizationGroup.controls).forEach((control) => {
    //     control.valueChanges
    //       .pipe(takeUntil(this.destroy$))
    //       .subscribe(() => this.emitRolesAssignedStatus());
    //   });
    // }

    // // Emitir el estado inicial
    // this.emitRolesAssignedStatus();
  }

  ngOnDestroy(): void {
    console.log('🚀 KickoffComponent ngOnDestroy() iniciado');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Valida que todos los campos de financiamiento estén completos
   * @returns true si todos los campos están completos, false en caso contrario
   */
  validateFinanciamiento(): boolean {
    const financiamientoGroup = this.form.get('financiamiento');
    if (!financiamientoGroup) {
      console.warn('🔍 No se encontró el grupo de financiamiento');
      return false;
    }

    const moneda = financiamientoGroup.get('moneda')?.value;
    const montoBase = financiamientoGroup.get('montoBase')?.value;
    const porcentajeAnticipado = financiamientoGroup.get('porcentajeAnticipado')?.value;
    // Las observaciones ya no son obligatorias

    // Validaciones adicionales
    const montoBaseValid = montoBase !== null && montoBase !== undefined && montoBase >= 0;
    const porcentajeValid = porcentajeAnticipado !== null && porcentajeAnticipado !== undefined && 
                           porcentajeAnticipado >= 0 && porcentajeAnticipado <= 100;

    const isValid = moneda && montoBaseValid && porcentajeValid;

    console.log('🔍 Validación de financiamiento:', {
      moneda,
      montoBase,
      montoBaseValid,
      porcentajeAnticipado,
      porcentajeValid,
      isValid
    });

    // Marcar campos como touched para mostrar errores
    if (!isValid) {
      financiamientoGroup.get('moneda')?.markAsTouched();
      financiamientoGroup.get('montoBase')?.markAsTouched();
      financiamientoGroup.get('porcentajeAnticipado')?.markAsTouched();
      // No marcar observaciones como touched ya que no son obligatorias
    }

    return isValid;
  }

  /**
   * Verifica si la fase de kickoff puede ser marcada como completada
   * @returns true si puede ser completada, false en caso contrario
   */
  canCompleteKickoff(): boolean {
    const financiamientoValid = this.validateFinanciamiento();
    console.log('🔍 Kickoff puede ser completado:', financiamientoValid);
    return financiamientoValid;
  }

  /**
   * Verifica si todo el formulario de kickoff es válido
   * @returns true si es válido, false en caso contrario
   */
  isKickoffFormValid(): boolean {
    const formValid = this.form.valid;
    const financiamientoValid = this.validateFinanciamiento();
    
    console.log('🔍 Formulario de kickoff válido:', {
      formValid,
      financiamientoValid,
      overallValid: formValid && financiamientoValid
    });
    
    return formValid && financiamientoValid;
  }

  areAllTeamRolesAssigned(): boolean {
    console.log('🚀 areAllTeamRolesAssigned() iniciado');
    const teamMovilizationGroup = this.form.get(
      'teamMovilization'
    ) as FormGroup;
    if (!teamMovilizationGroup) {
      return false; // Si el FormGroup no existe, no se han asignado roles
    }

    const roles = [
      'businessAmbassador',
      'solutionDeveloper',
      'solutionTester',
      'businessAdvisor',
      'technicalAdvisor',
    ];
    for (const role of roles) {
      const control = teamMovilizationGroup.get(role);
      // Un rol se considera "asignado" si su valor no es null o vacío
      if (!control || !control.value) {
        // Verifica si el control existe y tiene un valor
        return false; // Si un rol no está asignado, retorna false
      }
    }
    return true; // Si todos los roles tienen un valor, retorna true
  }

  private emitRolesAssignedStatus(): void {
    console.log('🚀 emitRolesAssignedStatus() iniciado');
    this.rolesAssignedStatusChange.emit(this.areAllTeamRolesAssigned());
  }

  // --- Métodos de inicialización y setup de autocompletado ---

  private initializeSearchControl(
    roleName: string,
    searchControl: FormControl<string | null>
  ): void {
    console.log('🚀 initializeSearchControl() iniciado para roleName:', roleName);
    const currentPerson: Persona | null = this.form.get(
      `teamMovilization.${roleName}`
    )?.value;
    if (
      currentPerson &&
      typeof currentPerson === 'object' &&
      currentPerson.nombre
    ) {
      searchControl.setValue(currentPerson.nombre, { emitEvent: false }); // Usar emitEvent: false para evitar disparar valueChanges al inicio
    } else {
      this.form.get(`teamMovilization.${roleName}`)?.setValue(null);
    }
  }

  private setupAutocomplete(
    roleName: string,
    searchControl: FormControl<string | null>
  ): void {
    console.log('🚀 setupAutocomplete() iniciado para roleName:', roleName);
    searchControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((value: any) => {
        let searchText: string = '';
        if (typeof value === 'string' && value !== null) {
          searchText = value;
        } else if (value && typeof value === 'object' && value.nombre) {
          searchText = value.nombre;
        }
        this.filterPersonasByRole(roleName, searchText);

        // Si el texto en el input no coincide exactamente con el nombre de una persona seleccionada,
        // establece el valor del FormControl del formulario padre a null.
        const foundPersona = this.allPersonas.find(
          (p) => p.nombre.toLowerCase() === searchText.toLowerCase()
        );
        if (!foundPersona && searchText !== '') {
          this.form.get(`teamMovilization.${roleName}`)?.setValue(null);
        }
      });
  }

  filterPersonasByRole(roleName: string, searchText: string): void {
    console.log('🚀 filterPersonasByRole() iniciado para roleName:', roleName, 'searchText:', searchText);
    const filterValue = searchText.toLowerCase();
    const personasForRole = this.allPersonas.filter((persona) =>
      persona.nombre.toLowerCase().includes(filterValue)
    );

    switch (roleName) {
      case 'businessAmbassador':
        this.filteredBusinessAmbassador = personasForRole;
        this.showBusinessAmbassadorDropdown =
          filterValue.length > 0 && personasForRole.length > 0;
        break;
      case 'solutionDeveloper':
        this.filteredSolutionDeveloper = personasForRole;
        this.showSolutionDeveloperDropdown =
          filterValue.length > 0 && personasForRole.length > 0;
        break;
      case 'solutionTester':
        this.filteredSolutionTester = personasForRole;
        this.showSolutionTesterDropdown =
          filterValue.length > 0 && personasForRole.length > 0;
        break;
      case 'businessAdvisor':
        this.filteredBusinessAdvisor = personasForRole;
        this.showBusinessAdvisorDropdown =
          filterValue.length > 0 && personasForRole.length > 0;
        break;
      case 'technicalAdvisor':
        this.filteredTechnicalAdvisor = personasForRole;
        this.showTechnicalAdvisorDropdown =
          filterValue.length > 0 && personasForRole.length > 0;
        break;
      default:
        break;
    }
  }

  selectPersona(roleName: string, persona: Persona): void {
    console.log('🚀 selectPersona() iniciado para roleName:', roleName, 'persona:', persona);
    const teamMovilizationGroup = this.form.get(
      'teamMovilization'
    ) as FormGroup;
    teamMovilizationGroup.get(roleName)?.setValue(persona);

    // Actualiza el input de búsqueda específico
    this.getSearchControlForRole(roleName)?.setValue(persona.nombre, {
      emitEvent: false,
    });

    // Oculta el dropdown específico
    this.setShowDropdownForRole(roleName, false);
    console.log(`Persona seleccionada para ${roleName}:`, persona);
  }

  clearPersona(roleName: string): void {
    console.log('🚀 clearPersona() iniciado para roleName:', roleName);
    this.getSearchControlForRole(roleName)?.setValue(null); // Limpia el texto del input
    const teamMovilizationGroup = this.form.get(
      'teamMovilization'
    ) as FormGroup;
    teamMovilizationGroup.get(roleName)?.setValue(null); // Borra el valor en el FormGroup padre
    this.setShowDropdownForRole(roleName, false); // Oculta el dropdown
  }

  onFocusInput(roleName: string): void {
    console.log('🚀 onFocusInput() iniciado para roleName:', roleName);
    const searchControl = this.getSearchControlForRole(roleName);
    const currentValue = searchControl?.value;

    if (typeof currentValue === 'string' && !currentValue) {
      this.filterPersonasByRole(roleName, ''); // Muestra todas las opciones
    } else if (typeof currentValue === 'string') {
      this.filterPersonasByRole(roleName, currentValue);
    } else if (currentValue) {
      this.filterPersonasByRole(roleName, currentValue);
    }
    this.setShowDropdownForRole(roleName, true); // Siempre muestra el dropdown al enfocar
  }

  onBlurInput(roleName: string): void {
    console.log('🚀 onBlurInput() iniciado para roleName:', roleName);
    setTimeout(() => {
      const teamMovilizationGroup = this.form.get(
        'teamMovilization'
      ) as FormGroup;
      const selectedValue = teamMovilizationGroup.get(roleName)?.value;
      const searchControl = this.getSearchControlForRole(roleName);
      const searchText = searchControl?.value;

      if (
        !selectedValue ||
        typeof selectedValue !== 'object' ||
        !selectedValue.id
      ) {
        if (typeof searchText === 'string' && searchText !== '') {
          const found = this.allPersonas.find(
            (p) => p.nombre.toLowerCase() === searchText.toLowerCase()
          );
          if (!found) {
            searchControl?.setValue(null, { emitEvent: false });
          }
        } else if (searchText === '') {
          teamMovilizationGroup.get(roleName)?.setValue(null);
        }
      } else {
        searchControl?.setValue(selectedValue.nombre, { emitEvent: false });
      }
      this.setShowDropdownForRole(roleName, false);
    }, 150);
  }

  // --- Helpers para obtener controles y estados dinámicamente ---
  private getSearchControlForRole(
    roleName: string
  ): FormControl<string | null> | undefined {
    console.log('🚀 getSearchControlForRole() iniciado para roleName:', roleName);
    switch (roleName) {
      case 'businessAmbassador':
        return this.businessAmbassadorSearchControl;
      case 'solutionDeveloper':
        return this.solutionDeveloperSearchControl;
      case 'solutionTester':
        return this.solutionTesterSearchControl;
      case 'businessAdvisor':
        return this.businessAdvisorSearchControl;
      case 'technicalAdvisor':
        return this.technicalAdvisorSearchControl;
      default:
        return undefined;
    }
  }

  getFilteredPersonasForRole(roleName: string): Persona[] {
    console.log('🚀 getFilteredPersonasForRole() iniciado para roleName:', roleName);
    switch (roleName) {
      case 'businessAmbassador':
        return this.filteredBusinessAmbassador;
      case 'solutionDeveloper':
        return this.filteredSolutionDeveloper;
      case 'solutionTester':
        return this.filteredSolutionTester;
      case 'businessAdvisor':
        return this.filteredBusinessAdvisor;
      case 'technicalAdvisor':
        return this.filteredTechnicalAdvisor;
      default:
        return [];
    }
  }

  getShowDropdownForRole(roleName: string): boolean {
    console.log('🚀 getShowDropdownForRole() iniciado para roleName:', roleName);
    switch (roleName) {
      case 'businessAmbassador':
        return this.showBusinessAmbassadorDropdown;
      case 'solutionDeveloper':
        return this.showSolutionDeveloperDropdown;
      case 'solutionTester':
        return this.showSolutionTesterDropdown;
      case 'businessAdvisor':
        return this.showBusinessAdvisorDropdown;
      case 'technicalAdvisor':
        return this.showTechnicalAdvisorDropdown;
      default:
        return false;
    }
  }

  private setShowDropdownForRole(roleName: string, value: boolean): void {
    console.log('🚀 setShowDropdownForRole() iniciado para roleName:', roleName, 'value:', value);
    switch (roleName) {
      case 'businessAmbassador':
        this.showBusinessAmbassadorDropdown = value;
        break;
      case 'solutionDeveloper':
        this.showSolutionDeveloperDropdown = value;
        break;
      case 'solutionTester':
        this.showSolutionTesterDropdown = value;
        break;
      case 'businessAdvisor':
        this.showBusinessAdvisorDropdown = value;
        break;
      case 'technicalAdvisor':
        this.showTechnicalAdvisorDropdown = value;
        break;
    }
  }

  isRoleInvalid(roleName: string): boolean {
    console.log('🚀 isRoleInvalid() iniciado para roleName:', roleName);
    const control = (this.form.get('teamMovilization') as FormGroup)?.get(
      roleName
    );
    const searchControl = this.getSearchControlForRole(roleName);

    if (control?.hasError('required') && control.touched && !control.value) {
      return true;
    }

    const searchText = searchControl?.value;
    if (typeof searchText === 'string' && searchText !== '') {
      const isSelected = this.allPersonas.some(
        (p) => p.nombre.toLowerCase() === searchText.toLowerCase()
      );
      if (!isSelected) {
        return true;
      }
    }
    return false;
  }

  getData() {
    console.log('🚀 getData() iniciado');
    console.log('🚀 getData() - form.value:', this.form.value);
    console.log('🚀 getData() - form.valid:', this.form.valid);
    console.log('🚀 getData() - form.errors:', this.form.errors);
    console.log('🚀 getData() - formGroupName:', this.formGroupName);
    
    // Debug específico del financiamiento
    const financiamientoValue = this.form.get('financiamiento')?.value;
    console.log('🔍 getData() - financiamiento:', financiamientoValue);
    
    return this.form.value;
  }

  //Responsable
  showModalResponsable = false;

  openModalResponsable() {
    console.log('🚀 openModalResponsable() iniciado');
    this.showModalResponsable = true;
  }

  closeModalResponsable() {
    console.log('🚀 closeModalResponsable() iniciado');
    this.showModalResponsable = false;
  }

  //Persona
  showModalParticipantes = false;

  openModalParticipantes() {
    console.log('🚀 openModalParticipantes() iniciado');
    this.showModalParticipantes = true;
  }

  closeModalParticipantes() {
    console.log('🚀 closeModalParticipantes() iniciado');
    this.showModalParticipantes = false;
  }

  get responsable(): FormControl {
    console.log('🚀 get responsable() iniciado');
    return this.form.controls['responsable'] as FormControl;
  }

  get participantes(): FormArray {
    console.log('🚀 get participantes() iniciado');
    return this.form.controls['participantes'] as FormArray;
  }

  handlePersonaSeleccionada(event: { tipo: string; persona: string }) {
    console.log('🚀 handlePersonaSeleccionada() iniciado con evento:', event);
    if (event.tipo === 'responsable') {
      this.responsable.setValue(event.persona);
      this.closeModalResponsable();
    } else if (event.tipo === 'participantes') {
      // Buscar la persona completa en allPersonas para obtener más información
      const personaCompleta = this.allPersonas.find(p => p.nombre === event.persona);
      
      const participantesGroup = this.fb.group({
        persona: event.persona,
        email: [personaCompleta?.email || ''],
        rol: [personaCompleta?.rol || '']
      });
      this.participantes.push(participantesGroup);
      this.closeModalParticipantes();
    }
  }
  eliminarResponsable() {
    console.log('🚀 eliminarResponsable() iniciado');
    this.responsable.setValue(null);
  }

  eliminarParticipante(index: number) {
    console.log('🚀 eliminarParticipante() iniciado con índice:', index);
    this.participantes.removeAt(index);
  }

  //Checklist
  showModalChecklist = false;

  openModalChecklist() {
    console.log('🚀 openModalChecklist() iniciado');
    this.showModalChecklist = true;
  }

  closeModalChecklist() {
    console.log('🚀 closeModalChecklist() iniciado');
    this.showModalChecklist = false;
  }

  get listaAcuerdos(): FormArray {
    console.log('🚀 get listaAcuerdos() iniciado');
    return this.form.get('listaAcuerdos') as FormArray;
  }

  addItemChecklist(item: { label: string; checked: boolean }) {
    console.log('🚀 addItemChecklist() iniciado con item:', item);
    const acuerdoGroup = this.fb.group({
      label: [item.label],
      checked: [item.checked],
    });

    this.listaAcuerdos.push(acuerdoGroup);
  }

  eliminarChecklist(index: number) {
    console.log('🚀 eliminarChecklist() iniciado con índice:', index);
    this.listaAcuerdos.removeAt(index);
  }

  //Adjuntos
  showModalAdjuntos = false;

  openModalAdjuntos() {
    console.log('🚀 openModalAdjuntos() iniciado');
    this.showModalAdjuntos = true;
  }

  closeModalAdjuntos() {
    console.log('🚀 closeModalAdjuntos() iniciado');
    this.showModalAdjuntos = false;
  }

  get adjuntos(): FormArray {
    console.log('🚀 get adjuntos() iniciado');
    return this.form.get('adjuntos') as FormArray;
  }

  getAdjuntosFormArray(): FormArray {
    console.log('🚀 getAdjuntosFormArray() iniciado');
    return this.form.get('adjuntos') as FormArray;
  }

  recibirArchivo(files: File[]) {
    console.log('🚀 recibirArchivo() iniciado con archivos:', files);
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
      console.log('📤 Subiendo archivo:', file.name);
      this.uploadService.uploadFile(file).subscribe({
        next: (uploadResult) => {
          // Actualizar con la URL real del archivo subido
          adjuntoGroup.patchValue({
            url: uploadResult.data.url,
            uploading: false,
            adjuntoId: uploadResult.data.id
          });
          console.log('✅ Archivo subido exitosamente:', uploadResult);
          
          // Guardar automáticamente el timebox para persistir los adjuntos
          console.log('🔄 Iniciando guardado automático...');
          console.log('📞 Llamando a saveTimeboxAutomatically()...');
          
          // Agregar un pequeño delay para asegurar que el formulario se haya actualizado
          setTimeout(() => {
            this.saveTimeboxAutomatically();
            console.log('✅ saveTimeboxAutomatically() completado');
          }, 100);
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
    console.log('🚀 saveTimeboxAutomatically() iniciado');
    // Obtener el formulario padre para construir el timebox completo
    const parentForm = this.rootFormGroup.control;
    const formValues = parentForm.getRawValue();
    
    console.log('🔍 Debug saveTimeboxAutomatically:');
    console.log('  - formValues:', formValues);
    console.log('  - adjuntos actuales:', this.getAdjuntosFormArray().value);
    
    // Crear un objeto Timebox básico con los datos del formulario
    const timeboxToSave: Timebox = {
      ...formValues,
      fases: {
        ...formValues.fases,
        kickOff: {
          ...formValues.kickOff,
          adjuntos: this.getAdjuntosFormArray().value
        }
      }
    };
    
    console.log('🔄 Guardando timebox automáticamente para persistir adjuntos...', timeboxToSave);
    console.log('📋 Timebox ID:', timeboxToSave.id);
    console.log('📋 Timebox fases:', timeboxToSave.fases);
    console.log('📤 Emitiendo evento autoSaveRequest...');
    this.autoSaveRequest.emit(timeboxToSave);
    console.log('✅ Evento autoSaveRequest emitido');
  }

  downloadFile(adjuntoControl: AbstractControl) {
    console.log('🚀 downloadFile() iniciado con adjuntoControl:', adjuntoControl);
    const adjuntoValue = adjuntoControl.value;
    if (adjuntoValue && adjuntoValue.url) {
      // Construir la URL completa usando la URL base del environment
      const baseUrl = environment.apiUrl.replace('/api', ''); // Remover /api para obtener solo el servidor
      const fullUrl = `${baseUrl}${adjuntoValue.url}`;
      
      console.log('🔍 Debug archivo kickoff:', {
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
    console.log('🚀 eliminarAdjunto() iniciado con índice:', index);
    this.adjuntos.removeAt(index);
  }

  /**
   * Formatea una fecha para mostrar en el template
   */
  getFormattedDate(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
  }
}
