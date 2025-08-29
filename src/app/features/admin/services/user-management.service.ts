import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../../../shared/interfaces/auth.interface';
import { environment } from '../../../../environments/environment';

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  roleId?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data?: User | User[];
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private API_URL = environment.apiUrl;
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Cargar todos los usuarios
  loadUsers(): Observable<UserResponse> {
    console.log('🔄 Servicio: Cargando usuarios desde:', `${this.API_URL}/admin/users`);
    
    return this.http.get<UserResponse>(`${this.API_URL}/admin/users`)
      .pipe(
        tap(response => {
          console.log('✅ Servicio: Usuarios cargados:', response);
          if (response.success && response.data) {
            console.log('🔄 Servicio: Actualizando lista de usuarios:', response.data);
            this.usersSubject.next(response.data as User[]);
          }
        }),
        catchError(error => {
          console.error('❌ Servicio: Error cargando usuarios:', error);
          return this.handleError(error);
        })
      );
  }

  // Crear nuevo usuario
  createUser(userData: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.API_URL}/admin/users`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const currentUsers = this.usersSubject.value;
            this.usersSubject.next([...currentUsers, response.data as User]);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Actualizar usuario existente
  updateUser(userId: string, userData: UpdateUserRequest): Observable<UserResponse> {
    console.log('🔄 Servicio: Actualizando usuario:', userId);
    console.log('📝 Servicio: Datos a enviar:', userData);
    console.log('🆔 Servicio: Role ID:', userData.roleId);
    
    return this.http.put<UserResponse>(`${this.API_URL}/admin/users/${userId}`, userData)
      .pipe(
        tap(response => {
          console.log('✅ Servicio: Respuesta de actualización:', response);
          if (response.success && response.data) {
            const currentUsers = this.usersSubject.value;
            const updatedUsers = currentUsers.map(user => 
              user.id === userId ? { ...user, ...response.data } : user
            );
            this.usersSubject.next(updatedUsers);
          }
        }),
        catchError(error => {
          console.error('❌ Servicio: Error actualizando usuario:', error);
          return this.handleError(error);
        })
      );
  }

  // Cambiar estado del usuario (activo/inactivo)
  toggleUserStatus(userId: string): Observable<UserResponse> {
    console.log('🔄 Servicio: Cambiando estado del usuario:', userId);
    console.log('🔄 Servicio: URL:', `${this.API_URL}/admin/users/${userId}/toggle-status`);
    
    return this.http.patch<UserResponse>(`${this.API_URL}/admin/users/${userId}/toggle-status`, {})
      .pipe(
        tap(response => {
          console.log('✅ Servicio: Respuesta recibida:', response);
          if (response.success) {
            const currentUsers = this.usersSubject.value;
            const updatedUsers = currentUsers.map(user => 
              user.id === userId ? { ...user, is_active: !user.is_active } : user
            );
            console.log('🔄 Servicio: Actualizando lista local:', updatedUsers);
            this.usersSubject.next(updatedUsers);
          }
        }),
        catchError(error => {
          console.error('❌ Servicio: Error en toggleUserStatus:', error);
          return this.handleError(error);
        })
      );
  }

  // Eliminar usuario
  deleteUser(userId: string): Observable<UserResponse> {
    return this.http.delete<UserResponse>(`${this.API_URL}/admin/users/${userId}`)
      .pipe(
        tap(response => {
          if (response.success) {
            const currentUsers = this.usersSubject.value;
            const filteredUsers = currentUsers.filter(user => user.id !== userId);
            this.usersSubject.next(filteredUsers);
          }
        }),
        catchError(this.handleError)
      );
  }

  // Obtener roles disponibles
  getAvailableRoles(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/admin/roles`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener usuario por ID
  getUserById(userId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.API_URL}/admin/users/${userId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener usuarios actuales (sin hacer HTTP request)
  getCurrentUsers(): User[] {
    return this.usersSubject.value;
  }

  // Actualizar usuarios localmente (útil para operaciones offline)
  updateUsersLocally(users: User[]): void {
    this.usersSubject.next(users);
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en UserManagementService:', error);
    throw error;
  }
}

