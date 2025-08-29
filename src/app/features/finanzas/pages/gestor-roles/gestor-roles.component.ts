import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../shared/services/auth.service';
import { RoleService, Role, SueldoUpdate } from '../../services/role.service';

@Component({
  selector: 'app-gestor-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestor-roles.component.html',
  styleUrl: './gestor-roles.component.css'
})
export class GestorRolesComponent implements OnInit {
  roles: Role[] = [];
  editingRole: Role | null = null;
  isEditing = false;
  hasPermission = false;
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.hasPermission = this.authService.hasPermission('role_management');
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.error = '';
    
    this.roleService.getAllRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data;
        } else {
          this.error = response.message || 'Error al cargar roles';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.error = 'Error de conexión al cargar roles';
        this.loading = false;
      }
    });
  }

  startEdit(role: Role): void {
    if (!this.hasPermission) return;
    
    this.editingRole = { ...role };
    this.isEditing = true;
  }

  saveEdit(): void {
    if (!this.editingRole || !this.hasPermission) return;

    this.loading = true;
    this.error = '';

    // Asegurar que el sueldo se envíe como número válido
    let sueldoToSend: number;
    
    // El input puede devolver string o number, convertirlo a número
    const sueldoInput = this.editingRole.sueldo_base_semanal;
    
    if (typeof sueldoInput === 'string') {
      // Convertir string a número, reemplazando coma por punto si es necesario
      sueldoToSend = parseFloat((sueldoInput as string).replace(',', '.'));
    } else {
      sueldoToSend = sueldoInput as number;
    }

    // Validar que sea un número válido
    if (isNaN(sueldoToSend) || sueldoToSend < 0) {
      this.error = 'El sueldo debe ser un número válido mayor o igual a 0';
      this.loading = false;
      return;
    }

    const sueldoData: SueldoUpdate = {
      sueldo_base_semanal: sueldoToSend,
      moneda: this.editingRole.moneda
    };

    this.roleService.updateRoleSueldo(this.editingRole.id, sueldoData).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar el rol en la lista local
          const index = this.roles.findIndex(r => r.id === this.editingRole!.id);
          if (index !== -1) {
            this.roles[index] = { ...this.editingRole! };
          }
          this.cancelEdit();
          // Recargar roles para obtener datos actualizados
          this.loadRoles();
        } else {
          this.error = response.message || 'Error al actualizar sueldo';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al actualizar sueldo:', error);
        this.error = error.error?.message || 'Error de conexión al actualizar sueldo';
        this.loading = false;
      }
    });
  }

  cancelEdit(): void {
    this.editingRole = null;
    this.isEditing = false;
  }

  getTotalRoles(): number {
    return this.roles.length;
  }

  getMonedaSymbol(moneda: string): string {
    switch (moneda) {
      case 'USD':
        return '$';
      case 'CLP':
        return '$';
      default:
        return '';
    }
  }
}
