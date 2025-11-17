import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Entregable,
  Product,
} from '../../../../shared/interfaces/product.interface';
import { MOCK_PROJECTS } from '../../../../core/data/mock-projects';

@Component({
  selector: 'app-inicio-detalle-proyecto',
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-proyecto.component.html',
  standalone: true,
})
export class DetalleProyectoComponent {
  nombreProducto = '';
  producto: Product = {} as Product;
  productos: Product[] = [...MOCK_PROJECTS];
  busqueda: string = '';
  entregables: Entregable[] = [] as Entregable[];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.nombreProducto =
      this.route.snapshot.paramMap.get('nombreProducto') ?? '';
    // Aquí puedes obtener el proyecto desde un servicio o array mock:

    this.producto = this.obtenerProyecto(this.nombreProducto);
    this.entregables = [];
  }

  get entregablesFiltrados(): Entregable[] {
    if (!this.busqueda.trim()) return this.entregables;

    return this.entregables.filter((ent) =>
      ent.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  obtenerProyecto(nombre: string): Product {
    return this.productos.find((p) => p.nombre === nombre) as Product;
  }

  getCantidadTimeboxes(ent: Entregable): number {
    return ent.timeboxes.length;
  }
}
