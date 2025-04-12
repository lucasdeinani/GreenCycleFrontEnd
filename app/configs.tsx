export const API_BASE_URL = 'http://192.168.0.86:8000/v1';
export const APP_NAME = 'Green Cycle';

export const MATERIALS = [
    { id: 1, name: 'Metal' },
    { id: 2, name: 'Papel' },
    { id: 3, name: 'Plástico' },
    // { id: 4, name: 'Vidro' },
    // { id: 5, name: 'Eletrônico' },
    { id: 6, name: 'Resíduo Orgânico' },
    { id: 7, name: 'Resíduo Hospitalar' },
  ] as const;
  
  // Tipos úteis
  export type MaterialId = typeof MATERIALS[number]['id'];
  export type MaterialName = typeof MATERIALS[number]['name'];
  
  // Helper functions
  export const getMaterialById = (id: MaterialId) => 
    MATERIALS.find(m => m.id === id);
  
  export const getMaterialByName = (name: string) => 
    MATERIALS.find(m => m.name.toLowerCase() === name.toLowerCase());
  
  // Lista de materiais para exibição no cadastro (apenas os permitidos)
  export const REGISTER_MATERIALS = MATERIALS.filter(m => 
    ['Metal', 'Papel', 'Plástico', 'Resíduo Orgânico', 'Resíduo Hospitalar'].includes(m.name)
  );

  export default function Config() {
    return null;
  }