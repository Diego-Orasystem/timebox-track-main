import { Component } from '@angular/core';
import { Product } from '../../../../shared/interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MOCK_PROJECTS } from '../../../../core/data/mock-projects';

@Component({
  selector: 'app-inicio',
  imports: [CommonModule, FormsModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  standalone: true,
})
export class InicioComponent {
  products: Product[] = [...MOCK_PROJECTS];

  busqueda: string = '';

  constructor(private router: Router) {}

  get proyectosFiltrados(): Product[] {
    if (!this.busqueda.trim()) return this.products;
    return this.products.filter((p) =>
      p.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  verDetalleProyecto(nombreProyecto: string) {
    this.router.navigate(['/home', nombreProyecto]);
  }
}
