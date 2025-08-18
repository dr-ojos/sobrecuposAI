// types/homepage.ts - Tipos para página principal
export interface EspecialidadResponse {
  success: boolean;
  especialidades: string[];
  error?: string;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface ChatFormProps {
  chatInput: string;
  setChatInput: (value: string) => void;
  handleChatSubmit: (e?: React.FormEvent) => void;
  isTyping: boolean;
  chatExpanding: boolean;
}

export interface SuggestionProps {
  text: string;
  onClick: (text: string) => void;
}

export interface SpecialtyGridProps {
  especialidades: string[];
  onSpecialtyClick: (specialty: string) => void;
}