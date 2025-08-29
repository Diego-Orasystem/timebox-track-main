import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../components/breadcrumb.component';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces/auth.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'sp-navbar',
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true,
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  currentUser: User | null = null;
  private userSubscription: Subscription;

  constructor(private authService: AuthService) {
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => this.currentUser = user
    );
  }

  ngOnInit() {
    // El usuario ya se carga en el constructor
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada exitosamente');
        this.isMenuOpen = false;
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        // Incluso si hay error, el servicio ya limpia los datos locales
      }
    });
  }

  get userInitials(): string {
    if (!this.currentUser) return '?';
    return this.authService.getInitials();
  }

  get userFullName(): string {
    if (!this.currentUser) return 'Usuario';
    return this.authService.getFullName();
  }

  get userEmail(): string {
    return this.currentUser?.email || 'usuario@example.com';
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
