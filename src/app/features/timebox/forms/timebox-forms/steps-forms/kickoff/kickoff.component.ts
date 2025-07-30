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
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { MOCK_PERSONAS } from '../../../../data/mock-personas';

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

  private destroy$ = new Subject<void>(); // Para desuscribirse de observables

  constructor(
    private fb: FormBuilder,
    private rootFormGroup: FormGroupDirective
  ) {}

  ngOnInit(): void {
    this.form = this.rootFormGroup.control.get(this.formGroupName) as FormGroup;

    // Cargar todas las personas del mock
    this.allPersonas = MOCK_PERSONAS;

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
    this.destroy$.next();
    this.destroy$.complete();
  }

  areAllTeamRolesAssigned(): boolean {
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
    this.rolesAssignedStatusChange.emit(this.areAllTeamRolesAssigned());
  }

  // --- Métodos de inicialización y setup de autocompletado ---

  private initializeSearchControl(
    roleName: string,
    searchControl: FormControl<string | null>
  ): void {
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
    this.getSearchControlForRole(roleName)?.setValue(null); // Limpia el texto del input
    const teamMovilizationGroup = this.form.get(
      'teamMovilization'
    ) as FormGroup;
    teamMovilizationGroup.get(roleName)?.setValue(null); // Borra el valor en el FormGroup padre
    this.setShowDropdownForRole(roleName, false); // Oculta el dropdown
  }

  onFocusInput(roleName: string): void {
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
    return this.form.value;
  }

  //Responsable
  showModalResponsable = false;

  openModalResponsable() {
    this.showModalResponsable = true;
  }

  closeModalResponsable() {
    this.showModalResponsable = false;
  }

  //Persona
  showModalParticipantes = false;

  openModalParticipantes() {
    this.showModalParticipantes = true;
  }

  closeModalParticipantes() {
    this.showModalParticipantes = false;
  }

  get responsable(): FormControl {
    return this.form.controls['responsable'] as FormControl;
  }

  get participantes(): FormArray {
    return this.form.controls['participantes'] as FormArray;
  }

  handlePersonaSeleccionada(event: { tipo: string; persona: string }) {
    if (event.tipo === 'responsable') {
      this.responsable.setValue(event.persona);
      this.closeModalResponsable();
    } else if (event.tipo === 'participantes') {
      const participantesGroup = this.fb.group({
        persona: event.persona,
      });
      this.participantes.push(participantesGroup);
      this.closeModalParticipantes();
    }
  }
  eliminarResponsable() {
    this.responsable.setValue(null);
  }

  eliminarParticipante(index: number) {
    this.participantes.removeAt(index);
  }

  //Checklist
  showModalChecklist = false;

  openModalChecklist() {
    this.showModalChecklist = true;
  }

  closeModalChecklist() {
    this.showModalChecklist = false;
  }

  get listaAcuerdos(): FormArray {
    return this.form.get('listaAcuerdos') as FormArray;
  }

  addItemChecklist(item: { label: string; checked: boolean }) {
    const acuerdoGroup = this.fb.group({
      label: [item.label],
      checked: [item.checked],
    });

    this.listaAcuerdos.push(acuerdoGroup);
  }

  eliminarChecklist(index: number) {
    this.listaAcuerdos.removeAt(index);
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
}
