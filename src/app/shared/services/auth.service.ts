import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { 
  User, 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  LogoutResponse,
  VerifyTokenResponse,
  ProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ApiResponse,
  RegisterRequest,
  RegisterResponse
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/users`;
  private readonly AUTH_URL = `${this.API_URL}/auth`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public accessToken$ = this.accessTokenSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService
  ) {
    this.loadStoredAuthData();
  }

  // =====================================================
  // AUTENTICACIÓN
  // =====================================================

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.AUTH_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.user, response.data.accessToken, response.data.refreshToken);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.AUTH_URL}/logout-no-auth`, {})
      .pipe(
        tap(() => {
          this.clearAuthData();
          this.router.navigate(['/login']);
        }),
        catchError(error => {
          // Incluso si hay error, limpiar datos locales
          this.clearAuthData();
          this.router.navigate(['/login']);
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.refreshTokenSubject.value;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<RefreshTokenResponse>(`${this.AUTH_URL}/refresh`, request)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setAccessToken(response.data.accessToken);
            if (response.data.refreshToken) {
              this.refreshTokenSubject.next(response.data.refreshToken);
              this.storageService.setItem('refreshToken', response.data.refreshToken);
            }
          }
        }),
        catchError(error => {
          // Si falla el refresh, hacer logout
          this.clearAuthData();
          this.router.navigate(['/login']);
          return throwError(() => error);
        })
      );
  }

  verifyToken(): Observable<VerifyTokenResponse> {
    return this.http.get<VerifyTokenResponse>(`${this.AUTH_URL}/verify`)
      .pipe(
        catchError(error => {
          // Si falla la verificación, limpiar datos
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  /**
   * Registrar un nuevo usuario
   */
  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/auth/register`, registerData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // Almacenar tokens y datos del usuario
            this.storageService.setItem('accessToken', response.data.token);
            this.storageService.setItem('refreshToken', response.data.refreshToken);
            this.storageService.setObject('currentUser', response.data.user);
            
            // Actualizar el estado de autenticación
            this.currentUserSubject.next(response.data.user);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(this.handleError)
      );
  }

  // =====================================================
  // PERFIL DE USUARIO
  // =====================================================

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.API_URL}/profile`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCurrentUser(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  updateProfile(profileData: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${this.API_URL}/profile`, profileData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.updateCurrentUser(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.put<ChangePasswordResponse>(`${this.API_URL}/profile/change-password`, passwordData)
      .pipe(catchError(this.handleError));
  }

  // =====================================================
  // RECUPERACIÓN DE CONTRASEÑA
  // =====================================================

  requestPasswordReset(email: string): Observable<PasswordResetResponse> {
    const request: PasswordResetRequest = { email };
    return this.http.post<PasswordResetResponse>(`${this.AUTH_URL}/forgot-password`, request)
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string): Observable<ResetPasswordResponse> {
    const request: ResetPasswordRequest = { token, newPassword };
    return this.http.post<ResetPasswordResponse>(`${this.AUTH_URL}/reset-password`, request)
      .pipe(catchError(this.handleError));
  }

  // =====================================================
  // GESTIÓN DE TOKENS
  // =====================================================

  private setAuthData(user: User, accessToken: string, refreshToken: string): void {
    this.currentUserSubject.next(user);
    this.accessTokenSubject.next(accessToken);
    this.refreshTokenSubject.next(refreshToken);
    this.isAuthenticatedSubject.next(true);

    this.storageService.setObject('currentUser', user);
    this.storageService.setItem('accessToken', accessToken);
    this.storageService.setItem('refreshToken', refreshToken);
  }

  private setAccessToken(accessToken: string): void {
    this.accessTokenSubject.next(accessToken);
    this.storageService.setItem('accessToken', accessToken);
  }

  private updateCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.storageService.setObject('currentUser', user);
  }

  private clearAuthData(): void {
    this.currentUserSubject.next(null);
    this.accessTokenSubject.next(null);
    this.refreshTokenSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    this.storageService.removeItem('currentUser');
    this.storageService.removeItem('accessToken');
    this.storageService.removeItem('refreshToken');
  }

  // =====================================================
  // INTERCEPTOR HTTP
  // =====================================================

  getAuthHeaders(): HttpHeaders {
    const token = this.accessTokenSubject.value;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // =====================================================
  // GETTERS PÚBLICOS
  // =====================================================

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.roles) {
      //console.log('❌ hasRole: Usuario o roles no disponibles');
      return false;
    }
    
    //console.log('🔍 hasRole: Verificando rol:', role);
    //console.log('👤 Usuario roles:', user.roles);
    
    // Verificar si el usuario tiene el rol específico
    // Manejar tanto arrays de strings como arrays de objetos
    const hasRole = user.roles.some(userRole => {
      if (typeof userRole === 'string') {
        // Si es un string, comparar directamente
        return userRole === role;
      } else if (userRole && typeof userRole === 'object' && 'name' in userRole) {
        // Si es un objeto con propiedad name
        return userRole.name === role;
      }
      return false;
    });
    
    
    return hasRole;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) {
      //console.log('❌ hasPermission: Usuario no disponible');
      return false;
    }
    
    //console.log('🔍 hasPermission: Verificando permiso:', permission);
    
    // Los administradores tienen todos los permisos
    const isAdmin = this.hasRole('admin');
    const isPlatformAdmin = this.hasRole('Platform Administrator');
    
    //console.log('👑 isAdmin:', isAdmin, 'isPlatformAdmin:', isPlatformAdmin);
    
    if (isAdmin || isPlatformAdmin) {
      //console.log('✅ Usuario es administrador, tiene todos los permisos');
      return true; // Los administradores tienen todos los permisos
    }
    
    // Para otros roles, verificar permisos específicos
    let result = false;
    switch (permission) {
      case 'user_management':
        result = this.hasRole('admin') || this.hasRole('Platform Administrator');
        break;
      case 'role_management':
        result = this.hasRole('admin') || this.hasRole('Platform Administrator');
        break;
      case 'timebox_management':
        // Project Manager y Team Leader también pueden gestionar timeboxes
        result = this.hasRole('admin') || 
               this.hasRole('Platform Administrator') || 
               this.hasRole('Project Manager') || 
               this.hasRole('Team Leader');
        break;
      case 'task_management':
        result = this.hasRole('admin') || 
               this.hasRole('Platform Administrator') ||
               // Roles de TEAM
               this.hasRole('Team Leader') || 
               this.hasRole('Deployment Team') ||
               this.hasRole('Solution Developer') ||
               this.hasRole('Solution Tester') ||
               this.hasRole('Business Ambassador') ||
               this.hasRole('Business Advisor') ||
               this.hasRole('Technical Advisor') ||
               // Roles de PROJECT
               this.hasRole('Project Manager') ||
               this.hasRole('Business Change Manager') ||
               // Roles de SUPPORT (si también necesitan acceso)
               this.hasRole('Project Support') ||
               this.hasRole('Project Office');
        break;
      default:
        result = false;
    }
    
    //console.log('✅ hasPermission resultado para', permission, ':', result);
    return result;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Método de debug para verificar permisos
  debugPermissions(): void {
    const user = this.currentUserSubject.value;
    //console.log('🔍 Debug de permisos:');
    //console.log('👤 Usuario:', user);
    //console.log('🎭 Roles:', user?.roles);
    
    if (user?.roles) {
      //console.log('📊 Detalle de roles:');
      user.roles.forEach((role, index) => {
        if (typeof role === 'string') {
          console.log(`  Rol ${index + 1} (string):`, {
            value: role,
            type: typeof role,
            length: (role as string).length
          });
        } else if (role && typeof role === 'object') {
          console.log(`  Rol ${index + 1} (object):`, {
            id: role.id,
            name: role.name,
            type: typeof role.name,
            fullRole: role
          });
        } else {
          console.log(`  Rol ${index + 1} (unknown):`, role);
        }
      });
    }
    
    console.log('🔐 Verificando permisos individuales:');
    console.log('  - user_management:', this.hasPermission('user_management'));
    console.log('  - role_management:', this.hasPermission('role_management'));
    console.log('  - timebox_management:', this.hasPermission('timebox_management'));
    console.log('  - task_management:', this.hasPermission('task_management'));
    
    // Debug adicional
    console.log('🔍 Debug hasRole:');
    console.log('  - hasRole("admin"):', this.hasRole('admin'));
    console.log('  - hasRole("Platform Administrator"):', this.hasRole('Platform Administrator'));
    console.log('  - hasRole("Project Manager"):', this.hasRole('Project Manager'));
    console.log('  - hasRole("Team Leader"):', this.hasRole('Team Leader'));
    console.log('  - hasRole("Deployment Team"):', this.hasRole('Deployment Team'));
    console.log('  - hasRole("Solution Developer"):', this.hasRole('Solution Developer'));
    console.log('  - hasRole("Solution Tester"):', this.hasRole('Solution Tester'));
    console.log('  - hasRole("Business Ambassador"):', this.hasRole('Business Ambassador'));
    console.log('  - hasRole("Business Advisor"):', this.hasRole('Business Advisor'));
    console.log('  - hasRole("Technical Advisor"):', this.hasRole('Technical Advisor'));
    console.log('  - hasRole("Business Change Manager"):', this.hasRole('Business Change Manager'));
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  getFullName(): string {
    const user = this.currentUserSubject.value;
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`.trim();
  }

  getInitials(): string {
    const user = this.currentUserSubject.value;
    if (!user) return '';
    const firstName = user.first_name.charAt(0).toUpperCase();
    const lastName = user.last_name.charAt(0).toUpperCase();
    return `${firstName}${lastName}`;
  }

  getAvatarUrl(): string {
    const user = this.currentUserSubject.value;
    if (!user || !user.avatar_url) {
      // Avatar por defecto basado en iniciales
      return `https://ui-avatars.com/api/?name=${this.getInitials()}&background=random&color=fff&size=128`;
    }
    return user.avatar_url;
  }

  // =====================================================
  // VALIDACIONES
  // =====================================================

  isValidPassword(password: string): boolean {
    // Mínimo 8 caracteres, al menos una letra y un número
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidUsername(username: string): boolean {
    // 3-20 caracteres, solo letras, números y guiones bajos
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  // =====================================================
  // MANEJO DE ERRORES
  // =====================================================

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = error.error.message;
    } else {
      // Error del servidor
      if (error.status === 401) {
        errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
      } else if (error.status === 403) {
        errorMessage = 'Acceso denegado. No tiene permisos para realizar esta acción.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor.';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    console.error('AuthService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  private loadStoredAuthData(): void {
    try {
      const storedUser = this.storageService.getObject<User>('currentUser');
      const storedAccessToken = this.storageService.getItem('accessToken');
      const storedRefreshToken = this.storageService.getItem('refreshToken');

      if (storedUser && storedAccessToken) {
        this.currentUserSubject.next(storedUser);
        this.accessTokenSubject.next(storedAccessToken);
        this.isAuthenticatedSubject.next(true);
        
        if (storedRefreshToken) {
          this.refreshTokenSubject.next(storedRefreshToken);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error);
      this.clearAuthData();
    }
  }
}
