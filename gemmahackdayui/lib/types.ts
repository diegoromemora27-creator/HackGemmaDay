export interface LearnerProfile {
  nombre: string;
  objetivo_principal?: string;
  nivel_actual: string;
  estilo_aprendizaje?: string;
  duracion_sesion_minutos?: number;
  bloqueos?: string[];
  motivacion?: string;
  tono_preferido: string;
  grupo_etario?: string;
  necesidades_especiales?: string;
}

export interface Topic {
  index: number;
  tema: string;
  subtema: string;
}

export interface Syllabus {
  materia: Record<string, any>;
  topics: Topic[];
}

export interface TermDefinition {
  termino: string;
  definicion: string;
}

export interface Example {
  nivel: string;
  enunciado: string;
  pista: string;
  resolucion: string;
}

export interface MicroChallenge {
  pregunta: string;
  opciones: string[];
  respuesta_correcta: number; // index of the correct option
  explicacion: string;
}

export interface Leccion {
  subtema: string;
  conceptos_previos: string[];
  mapa_conocimiento: Record<string, any>;
  explicacion_paso_a_paso: string[];
  pausa_reflexion: string;
  glosario: TermDefinition[];
  ejemplos: Example[];
  micro_retos: MicroChallenge[];
  version: number;
}
