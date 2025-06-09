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
  const { user, updateProfileImage, clearProfileImage } = useUser();
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

      // Verificar se existe imagem no contexto do usuário primeiro
      if (user.profileImageUri) {
        setImageUri(user.profileImageUri);
        setIsLoading(false);
        
        // Mesmo tendo no contexto, ainda verifica atualizações em background
        checkForUpdatesInBackground();
        return;
      }

      // Inicializar cache se necessário
      await ImageService.initializeCache();

      // Obter imagem de perfil (com verificação automática em background)
      const profileImageUri = await ImageService.getProfileImage(
        user.user_id, 
        user.tipo
      );

      setImageUri(profileImageUri);
      
      // Atualizar no contexto se for uma imagem válida (não padrão)
      if (profileImageUri && profileImageUri !== DEFAULT_PROFILE_IMAGES[user.tipo]) {
        updateProfileImage(profileImageUri);
      }
    } catch (err) {
      console.error('Erro ao carregar imagem de perfil:', err);
      setError('Erro ao carregar imagem de perfil');
      
      // Usar imagem padrão em caso de erro
      const defaultImage = DEFAULT_PROFILE_IMAGES[user.tipo];
      
      setImageUri(defaultImage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id, user?.tipo, user?.profileImageUri, updateProfileImage]);

  // Verificar atualizações em background
  const checkForUpdatesInBackground = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      // Verificar se há atualizações
      const updatedImageUri = await ImageService.checkForImageUpdates(
        user.user_id,
        user.tipo,
        imageUri
      );

      // Se houve atualização, atualizar o estado
      if (updatedImageUri && updatedImageUri !== imageUri) {
        console.log('🔄 Atualizando imagem após verificação em background');
        setImageUri(updatedImageUri);
        
        // Atualizar no contexto se for uma imagem válida (não padrão)
        if (updatedImageUri !== DEFAULT_PROFILE_IMAGES[user.tipo]) {
          updateProfileImage(updatedImageUri);
        } else {
          clearProfileImage();
        }
      }
    } catch (err) {
      console.log('Erro ao verificar atualizações em background:', err);
      // Falhas silenciosas para não atrapalhar UX
    }
  }, [user?.user_id, user?.tipo, imageUri, updateProfileImage, clearProfileImage]);

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
          
          // Sincronizar com contexto do usuário
          updateProfileImage(selectedImageUri);
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
  }, [user?.user_id, loadProfileImage, updateProfileImage]);

  // Deletar imagem de perfil
  const deleteImage = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setIsUpdating(true);
      setError(null);

      const success = await ImageService.deleteProfileImage(user.user_id);
      
      if (success) {
        // Limpar do contexto do usuário
        clearProfileImage();
        
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
  }, [user?.user_id, loadProfileImage, clearProfileImage]);

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