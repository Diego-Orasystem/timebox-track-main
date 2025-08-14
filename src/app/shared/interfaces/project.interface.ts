import { Adjuntos, Persona } from './fases-timebox.interface';
import { Timebox } from './timebox.interface';

export interface Project {
  id: string;
  nombre: string;
  descripcion?: string;
  responsable?: Persona;
  fechaCreacion?: string;
  apps?: Aplicacion[];
  contenido?: ProjectContent[]; // Contenido directo del proyecto (nueva estructura del backend)
}

export interface Aplicacion {
  id: string;
  nombre: string;
  descripcion: string;
  team: Persona[];
  estado?: 'activa' | 'en desarrollo' | 'mantenimiento';
  version?: string;
  enlaces: Enlace[];
  contenido: ProjectContent[];
  timeboxes: Timebox[];
}

export interface Enlace {
  nombre: string;
  url: string; // URL
}

export interface ProjectContent {
  id: string;
  nombre: string;
  tipo: 'Carpeta' | 'Documento' | 'Video' | 'Imagen' | 'Imágen';
  descripcion?: string;
  contenido?: ProjectContent[]; // Solo si el tipo es 'Carpeta'
  adjunto?: Adjuntos; // Solo si el tipo es 'Documento', 'Video', 'Imagen'
  project_id?: string; // ID del proyecto al que pertenece
  parent_id?: string; // ID del contenido padre (null si es raíz)
}
