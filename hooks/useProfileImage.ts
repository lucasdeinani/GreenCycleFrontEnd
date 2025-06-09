import { useState, useEffect, useCallback } from 'react';
import { ImageService } from '../services/ImageService';
import { useUser } from '../app/context/UserContext';
import { DEFAULT_PROFILE_IMAGES } from '../services/DefaultImages';

export interface UseProfileImageReturn {
  imageUri: string;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  refreshImage: () => Promise<void>;
  updateImage: () => Promise<void>;
  deleteImage: () => Promise<void>;
}

export const useProfileImage = (): UseProfileImageReturn => {
  const { user } = useUser();
  const [imageUri, setImageUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar imagem de perfil
  const loadProfileImage = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Inicializar cache se necessário
      await ImageService.initializeCache();

      // Obter imagem de perfil
      const profileImageUri = await ImageService.getProfileImage(
        user.user_id, 
        user.tipo
      );

      setImageUri(profileImageUri);
    } catch (err) {
      console.error('Erro ao carregar imagem de perfil:', err);
      setError('Erro ao carregar imagem de perfil');
      
      // Usar imagem padrão em caso de erro
      const defaultImage = DEFAULT_PROFILE_IMAGES[user.tipo];
      
      setImageUri(defaultImage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id, user?.tipo]);

  // Atualizar imagem de perfil
  const updateImage = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setIsUpdating(true);
      setError(null);

      // Mostrar seletor de imagem
      const selectedImageUri = await ImageService.showImagePicker();
      
      if (selectedImageUri) {
        // Upload da nova imagem
        const success = await ImageService.updateProfileImage(user.user_id, selectedImageUri);
        
        if (success) {
          // Recarregar imagem do cache
          await loadProfileImage();
        } else {
          setError('Erro ao atualizar imagem de perfil');
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar imagem:', err);
      setError('Erro ao atualizar imagem de perfil');
    } finally {
      setIsUpdating(false);
    }
  }, [user?.user_id, loadProfileImage]);

  // Deletar imagem de perfil
  const deleteImage = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setIsUpdating(true);
      setError(null);

      const success = await ImageService.deleteProfileImage(user.user_id);
      
      if (success) {
        // Recarregar imagem (vai mostrar a padrão)
        await loadProfileImage();
      } else {
        setError('Erro ao remover imagem de perfil');
      }
    } catch (err) {
      console.error('Erro ao deletar imagem:', err);
      setError('Erro ao remover imagem de perfil');
    } finally {
      setIsUpdating(false);
    }
  }, [user?.user_id, loadProfileImage]);

  // Recarregar imagem
  const refreshImage = useCallback(async () => {
    await loadProfileImage();
  }, [loadProfileImage]);

  // Carregar imagem quando o usuário mudar
  useEffect(() => {
    loadProfileImage();
  }, [loadProfileImage]);

  return {
    imageUri,
    isLoading,
    isUpdating,
    error,
    refreshImage,
    updateImage,
    deleteImage,
  };
}; 