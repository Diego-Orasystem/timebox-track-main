import { Component } from '@angular/core';
import { Project } from '../../../../shared/interfaces/project.interface';
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
  projects: Project[] = [...MOCK_PROJECTS];

  busqueda: string = '';

  constructor(private router: Router) {}

  get proyectosFiltrados(): Project[] {
    if (!this.busqueda.trim()) return this.projects;
    return this.projects.filter((p) =>
      p.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  verDetalleProyecto(nombreProyecto: string) {
    this.router.navigate(['/home', nombreProyecto]);
  }

  contarApps(proyecto: Project): number {
    return proyecto.apps?.length || 0;
  }

  getProgreso(project: Project): number {
    const apps = project.apps;
    if (!apps || apps.length === 0) return 0;

    let totalCompletados = 0;
    let totalTimeboxes = 0;

    apps.forEach((app) => {
      const completados = app.timeboxes.filter(
        (t) => t.estado === 'Finalizado'
      ).length;
      totalCompletados += completados;
      totalTimeboxes += app.timeboxes.length;
    });

    return totalTimeboxes === 0 ? 0 : Math.round((totalCompletados / totalTimeboxes) * 100);
  }
}
