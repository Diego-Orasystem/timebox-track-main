import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Aplicacion,
  Project,
} from '../../../../shared/interfaces/project.interface';
import { MOCK_PROJECTS } from '../../../../core/data/mock-projects';

@Component({
  selector: 'app-inicio-detalle-proyecto',
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-proyecto.component.html',
  standalone: true,
})
export class DetalleProyectoComponent {
  nombreProyecto = '';
  proyecto: Project = {} as Project;
  projects: Project[] = [...MOCK_PROJECTS];
  busqueda: string = '';
  apps: Aplicacion[] = [] as Aplicacion[];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.nombreProyecto =
      this.route.snapshot.paramMap.get('nombreProyecto') ?? '';
    // Aquí puedes obtener el proyecto desde un servicio o array mock:

    this.proyecto = this.obtenerProyecto(this.nombreProyecto);
    this.apps = this.proyecto.apps || [];
  }

  get appsFiltradas(): Aplicacion[] {
    if (!this.busqueda.trim()) return this.apps;

    return this.apps.filter((app) =>
      app.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  obtenerProyecto(nombre: string): Project {
    return this.projects.find((p) => p.nombre === nombre) as Project;
  }

  getCantidadTimeboxes(app: Aplicacion): number {
    return app.timeboxes.length;
  }

  getCantidadColaboradores(app: Aplicacion): number {
    return app.team.length;
  }

  getProgreso(app: Aplicacion): number {
    const total = app.timeboxes.length;
    const completados = app.timeboxes.filter(
      (t) => t.estado === 'Finalizado'
    ).length;
    return total === 0 ? 0 : Math.round((completados / total) * 100);
  }

  obtenerTeam(app: Aplicacion) {
    return app.team.map((persona) => persona.nombre).join(', ');
  }
}
