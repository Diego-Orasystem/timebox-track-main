import { Adjuntos } from './fases-timebox.interface';
import { Timebox } from './timebox.interface';

export interface Project {
  id: string;
  nombre: string;
  descripcion: string;
  fechaCreacion: string;
  contenido: ProjectContent[];
  timeboxes: Timebox[];
}

export interface ProjectContent {
  id: string;
  nombre: string;
  tipo: 'Carpeta' | 'Documento' | 'Video' | 'Imagen';
  descripcion?: string;
  contenido?: ProjectContent[]; // Solo si el tipo es 'Carpeta'
  adjunto?: Adjuntos; // Solo si el tipo es 'Documento', 'Video', 'Imágen'
  project_id?: string; // ID del proyecto al que pertenece
  parent_id?: string; // ID del contenido padre (null si es raíz)
}
