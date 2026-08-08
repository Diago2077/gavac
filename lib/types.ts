export type Finca = {
  id: string;
  nombre: string;
  propietario: string | null;
  created_at: string;
};

export type Animal = {
  id: string;
  finca_id: string;
  caravana: string;
  created_at: string;
};

export const LADOS_CUERPO = [
  { value: "lado_izquierdo", label: "Lado izquierdo" },
  { value: "lado_derecho", label: "Lado derecho" },
  { value: "paleta", label: "Paleta" },
  { value: "cuello", label: "Cuello" },
  { value: "axila", label: "Axila" },
  { value: "entrepierna", label: "Entrepierna" },
  { value: "cola", label: "Cola" },
] as const;

export type LadoCuerpo = (typeof LADOS_CUERPO)[number]["value"];

export type Deteccion = {
  x: number; // 0-1, posición relativa horizontal en la imagen
  y: number; // 0-1, posición relativa vertical en la imagen
  tamano_mm_estimado: number | null;
};

export type Conteo = {
  id: string;
  animal_id: string;
  foto_url: string;
  lado_cuerpo: LadoCuerpo;
  count_total: number;
  detecciones: Deteccion[];
  created_at: string;
};
