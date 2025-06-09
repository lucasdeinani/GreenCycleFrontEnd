import { API_BASE_URL } from '../app/configs';

export const IMAGE_CONFIG = {
  // Endpoints da API
  endpoints: {
    list: `${API_BASE_URL}/imagens-perfil/`,
    get: (userId: number) => `${API_BASE_URL}/imagens-perfil/${userId}/`,
    create: `${API_BASE_URL}/imagens-perfil/`,
    delete: (userId: number) => `${API_BASE_URL}/imagens-perfil/${userId}/`,
  },
  
  // Configurações de cache
  cache: {
    directory: 'profile_images',
    fileExtension: '.jpg',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em milliseconds
  },
  
  // Configurações de imagem
  image: {
    quality: 0.8,
    aspectRatio: [1, 1] as [number, number],
    maxWidth: 800,
    maxHeight: 800,
    allowsEditing: true,
  },
  
  // Configurações de upload
  upload: {
    fieldName: 'imagem',
    userIdFieldName: 'id_usuarios',
    mimeType: 'image/jpeg',
    timeout: 30000, // 30 segundos
  },
  
  // Mensagens de erro
  errorMessages: {
    permissionDenied: 'Permissões necessárias para acessar câmera e galeria',
    uploadFailed: 'Erro ao fazer upload da imagem',
    downloadFailed: 'Erro ao baixar imagem',
    deleteFailed: 'Erro ao remover imagem',
    cacheInitFailed: 'Erro ao inicializar cache de imagens',
    invalidImage: 'Imagem inválida selecionada',
  },
} as const;

export default IMAGE_CONFIG; 