import { Adjuntos, Persona } from './fases-timebox.interface';
import { Timebox } from './timebox.interface';

export interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  responsable?: Persona;
  documentacion?: Adjuntos[];
  fechaCreacion?: string;
}

export interface Entregable {
  id: string;
  productId: string;
  tipo: 'Release' | 'Increment';
  nombre: string;
  descripcion: string;
  fechaCreacion: string;
  entregableId?: string;
  ultimaModificacion?: string;
  documentacion?: Adjuntos[];
  timeboxes: Timebox[];
  subEntregables?: Entregable[];
}
