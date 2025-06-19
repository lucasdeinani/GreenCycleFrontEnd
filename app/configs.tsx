export const API_BASE_URL = 'http://10.0.0.162:8000/v1';
export const APP_NAME = 'Green Cycle';

export const MATERIALS = [
    { id: 1, nome: 'Metal' },
    { id: 2, nome: 'Papel' },
    { id: 3, nome: 'Plástico' },
    { id: 4, nome: 'Vidro' },
    { id: 5, nome: 'Eletrônico' },
    { id: 6, nome: 'Resíduo Orgânico' },
    { id: 7, nome: 'Resíduo Hospitalar' },
  ] as const;
  
// Tipos úteis
export type MaterialId = typeof MATERIALS[number]['id'];
export type MaterialName = typeof MATERIALS[number]['nome'];

// Helper functions
export const getMaterialById = (id: MaterialId) => 
  MATERIALS.find(m => m.id === id);

export const getMaterialByName = (name: string) => 
  MATERIALS.find(m => m.nome.toLowerCase() === name.toLowerCase());

// Lista de materiais para exibição no cadastro (apenas os permitidos)
export const REGISTER_MATERIALS = MATERIALS.filter(m => 
  ['Metal', 'Papel', 'Plástico', 'Resíduo Orgânico', 'Resíduo Hospitalar'].includes(m.nome)
);

export default function Config() {
  return null;
};