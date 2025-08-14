import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../components/breadcrumb.component';
import { Persona } from '../interfaces/fases-timebox.interface';

@Component({
  selector: 'sp-navbar',
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true,
})
export class NavbarComponent {
  isMenuOpen = false;

  persona: Persona = {
    nombre: 'Juan Pérez',
    rol: 'Solution Developer',
    email: 'juan.perez@example.com',
    habilidades: ['Angular', 'Tailwind', 'UX/UI', 'Figma'],
  };

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
