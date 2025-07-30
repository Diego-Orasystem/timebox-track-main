import {
  Close,
  Entrega,
  KickOff,
  Persona,
  Planning,
  QaData,
  Refinement,
} from './fases-timebox.interface';

export interface Timebox {
  id: string;
  tipoTimebox: TimeboxType['id'];
  businessAnalyst?: Persona;
  fases: {
    planning?: Planning;
    kickOff?: KickOff;
    refinement?: Refinement;
    qa?: QaData;
    close?: Close;
  };
  entrega?: Entrega;
  publicacionOferta?: {
    solicitado: boolean;
    publicado?: boolean;
    fechaPublicacion?: string;
    postulaciones?: Postulacion[];
  };
  projectId: string;
  monto?: number;
  estado: 'En Definición' | 'Disponible' | 'En Ejecución' | 'Finalizado';
  
  // Propiedades adicionales que vienen del backend
  tipo_timebox_id?: string;
  business_analyst_id?: string;
  tipo_nombre?: string;
  tipo_definicion?: string;
  categoria_nombre?: string;
  business_analyst_nombre?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Postulacion {
  id: string;
  rol: string;
  desarrollador: string;
  fechaPostulacion: string;
  estadoSolicitud: string;
  asignacion: {
    asignado: boolean;
    fechaAsignacion?: string;
  };
}

export interface TimeboxCategory {
  id: string;
  nombre: string;
}

export interface TimeboxType {
  id: string;
  nombre: string;
  definicion?: string;
  categoriaId?: string; // Para compatibilidad con frontend
  categoria_id?: string; // Campo que viene del backend
  categoria_nombre?: string; // Nombre de la categoría que viene del backend
  entregablesComunes?: string[]; // Para compatibilidad con frontend
  evidenciasCierre?: string[]; // Para compatibilidad con frontend
  entregables_comunes?: string[]; // Campo que viene del backend
  evidencias_cierre?: string[]; // Campo que viene del backend
}
