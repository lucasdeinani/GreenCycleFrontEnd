// URLs de imagens padrão para fallback
export const DEFAULT_PROFILE_IMAGES = {
  client: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&h=180&fit=crop&q=80&auto=format',
  partner: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&h=180&fit=crop&q=80&auto=format',
  generic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=180&h=180&fit=crop&q=80&auto=format',
} as const;

export const getDefaultProfileImage = (userType: 'client' | 'partner' | 'generic' = 'generic'): string => {
  return DEFAULT_PROFILE_IMAGES[userType];
};

// Função para validar se uma URI de imagem é válida
export const isValidImageUri = (uri: string): boolean => {
  if (!uri || typeof uri !== 'string') return false;
  
  // Verificar se é uma URI local válida (file://) ou HTTP/HTTPS
  return (
    uri.startsWith('file://') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('asset://') ||
    uri.startsWith('data:image/')
  );
};

// Função para obter a imagem adequada baseada no usuário
export const getProfileImageForUser = (
  imageUri: string | null | undefined,
  userType: 'client' | 'partner' = 'client'
): string => {
  if (imageUri && isValidImageUri(imageUri)) {
    return imageUri;
  }
  
  return getDefaultProfileImage(userType);
}; 