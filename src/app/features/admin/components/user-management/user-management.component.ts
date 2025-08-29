import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../shared/services/auth.service';
import { UserManagementService, CreateUserRequest, UpdateUserRequest } from '../../services/user-management.service';
import { User } from '../../../../shared/interfaces/auth.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  userForm!: FormGroup;
  isModalOpen = false;
  isEditing = false;
  editingUserId: string | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  private subscription = new Subscription();

  // Roles disponibles - se cargarán desde el backend
  availableRoles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userManagementService: UserManagementService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.loadRoles(); // Cargar roles desde el backend
    this.subscribeToUsers(); // Suscribirse a cambios en tiempo real
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      roleId: ['', [Validators.required]],
      isActive: [true],
      isVerified: [false]
    });
  }

  private loadUsers(): void {
    console.log('🔄 Componente: Iniciando carga de usuarios');
    this.isLoading = true;
    this.errorMessage = '';
    
    this.subscription.add(
      this.userManagementService.loadUsers().subscribe({
        next: (response) => {
          console.log('✅ Componente: Respuesta de carga:', response);
          if (response.success) {
            console.log('🔄 Componente: Usuarios cargados exitosamente:', response.data);
            this.users = response.data as User[];
          } else {
            this.errorMessage = response.message || 'Error al cargar usuarios';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Componente: Error cargando usuarios:', error);
          this.errorMessage = 'Error al cargar usuarios. Verifica la conexión.';
          this.isLoading = false;
          
          // Fallback: usar usuarios mock si hay error
          this.loadMockUsers();
        }
      })
    );
  }

  private subscribeToUsers(): void {
    console.log('🔄 Componente: Suscribiéndose a cambios de usuarios');
    this.subscription.add(
      this.userManagementService.users$.subscribe(users => {
        console.log('🔄 Componente: Lista de usuarios actualizada:', users);
        this.users = users;
      })
    );
  }

  private loadMockUsers(): void {
    // Usuarios de respaldo si falla la API
    this.users = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@timebox.com',
        first_name: 'Administrador',
        last_name: 'Sistema',
        is_active: true,
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingUserId = null;
    this.userForm.reset({
      isActive: true,
      isVerified: false
    });
    this.isModalOpen = true;
  }

  openEditModal(user: User): void {
    this.isEditing = true;
    this.editingUserId = user.id;
    
    // Obtener el primer rol del usuario (asumiendo que un usuario puede tener múltiples roles)
    const currentRoleId = user.roles && user.roles.length > 0 ? user.roles[0].id : '';
    
    console.log('🔄 Editando usuario:', user.username);
    console.log('🎭 Roles del usuario:', user.roles);
    console.log('🆔 Role ID seleccionado:', currentRoleId);
    
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roleId: currentRoleId,
      isActive: user.is_active,
      isVerified: user.is_verified,
      password: '' // No mostrar contraseña actual
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.userForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const userData = {
        ...this.userForm.value,
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName
      };

      console.log('📝 Datos del formulario:', userData);
      console.log('🔧 Modo edición:', this.isEditing);

      if (this.isEditing) {
        this.updateUser(userData);
      } else {
        this.createUser(userData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createUser(userData: any): void {
    const createRequest: CreateUserRequest = {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
      roleId: userData.roleId,
      isActive: userData.isActive,
      isVerified: userData.isVerified
    };

    this.subscription.add(
              this.userManagementService.createUser(createRequest).subscribe({
          next: (response) => {
            if (response.success) {
              this.successMessage = 'Usuario creado exitosamente';
              this.closeModal();
            } else {
              this.errorMessage = response.message || 'Error al crear usuario';
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error creando usuario:', error);
            this.errorMessage = 'Error al crear usuario. Verifica la conexión.';
            this.isLoading = false;
          }
        })
    );
  }

  private updateUser(userData: any): void {
    const updateRequest: UpdateUserRequest = {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      roleId: userData.roleId,
      isActive: userData.isActive,
      isVerified: userData.isVerified
    };

    // Solo incluir password si se proporcionó uno nuevo
    if (userData.password && userData.password.trim() !== '') {
      updateRequest.password = userData.password;
    }

    console.log('🔄 Actualizando usuario con datos:', updateRequest);
    console.log('🆔 Role ID a enviar:', updateRequest.roleId);
    console.log('🔍 Tipo de roleId:', typeof updateRequest.roleId);

    if (this.editingUserId) {
      this.subscription.add(
        this.userManagementService.updateUser(this.editingUserId, updateRequest).subscribe({
          next: (response) => {
            if (response.success) {
              this.successMessage = 'Usuario actualizado exitosamente';
              this.closeModal();
            } else {
              this.errorMessage = response.message || 'Error al actualizar usuario';
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error actualizando usuario:', error);
            this.errorMessage = 'Error al actualizar usuario. Verifica la conexión.';
            this.isLoading = false;
          }
        })
      );
    }
  }

  toggleUserStatus(user: User): void {
    console.log('🔄 Cambiando estado del usuario:', user.username, 'Estado actual:', user.is_active);
    
    this.subscription.add(
      this.userManagementService.toggleUserStatus(user.id).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          if (response.success) {
            // Confirmar el cambio exitoso
            this.successMessage = `Usuario ${!user.is_active ? 'activado' : 'desactivado'} exitosamente`;
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.message || 'Error al cambiar estado del usuario';
          }
        },
        error: (error) => {
          console.error('❌ Error cambiando estado:', error);
          this.errorMessage = 'Error al cambiar estado del usuario. Verifica la conexión.';
        }
      })
    );
  }

  deleteUser(userId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      this.subscription.add(
        this.userManagementService.deleteUser(userId).subscribe({
          next: (response) => {
            if (response.success) {
              this.successMessage = 'Usuario eliminado exitosamente';
              setTimeout(() => this.successMessage = '', 3000);
            } else {
              this.errorMessage = response.message || 'Error al eliminar usuario';
            }
          },
          error: (error) => {
            console.error('Error eliminando usuario:', error);
            this.errorMessage = 'Error al eliminar usuario. Verifica la conexión.';
          }
        })
      );
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['email']) {
        return 'Formato de email inválido';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      username: 'Usuario',
      email: 'Email',
      firstName: 'Nombre',
      lastName: 'Apellido',
      password: 'Contraseña',
      roleId: 'Rol'
    };
    return labels[fieldName] || fieldName;
  }

  getRoleName(roleId: string): string {
    const role = this.availableRoles.find(r => r.id === roleId);
    return role ? role.name : 'Sin rol';
  }

  // Cargar roles disponibles desde el backend
  private loadRoles() {
    console.log('🔄 Cargando roles desde el backend...');
    this.userManagementService.getAvailableRoles().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableRoles = response.data;
          console.log('✅ Roles cargados exitosamente:', this.availableRoles);
          console.log('📊 Total de roles:', this.availableRoles.length);
          
          // Log detallado de cada rol
          this.availableRoles.forEach((role, index) => {
            console.log(`🎭 Rol ${index + 1}:`, {
              id: role.id,
              name: role.name,
              level: role.level,
              type: typeof role.id
            });
          });
        } else {
          console.warn('⚠️ Respuesta sin datos:', response);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando roles:', error);
        // Fallback a roles básicos si falla la carga
        this.availableRoles = [
          { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Business Sponsor', level: 'PLATFORM' },
          { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Project Manager', level: 'PROJECT' },
          { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Team Leader', level: 'TEAM' }
        ];
      }
    });
  }
}
