import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../app/configs';
import { DEFAULT_PROFILE_IMAGES } from './DefaultImages';

export interface ProfileImage {
  id?: number;
  id_usuarios: number;
  imagem: string;
  file_id: string;
  created_at?: string;
  updated_at?: string;
}

export class ImageService {
  private static readonly CACHE_DIR = `${FileSystem.documentDirectory}profile_images/`;

  // Inicializar diretório de cache
  static async initializeCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Erro ao inicializar cache de imagens:', error);
    }
  }

  // Limpar cache local
  static async clearCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.CACHE_DIR);
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  // Obter imagem do cache local
  static async getCachedImage(userId: number): Promise<string | null> {
    try {
      const cachedPath = `${this.CACHE_DIR}${userId}.jpg`;
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      
      if (fileInfo.exists) {
        return cachedPath;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar imagem no cache:', error);
      return null;
    }
  }

  // Salvar imagem no cache local
  static async saveToCache(userId: number, imageUri: string): Promise<string | null> {
    try {
      const cachedPath = `${this.CACHE_DIR}${userId}.jpg`;
      await FileSystem.copyAsync({
        from: imageUri,
        to: cachedPath,
      });
      return cachedPath;
    } catch (error) {
      console.error('Erro ao salvar imagem no cache:', error);
      return null;
    }
  }

  // Baixar e cachear imagem da API
  static async downloadAndCacheImage(userId: number, imageUrl: string): Promise<string | null> {
    try {
      const cachedPath = `${this.CACHE_DIR}${userId}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(imageUrl, cachedPath);
      
      if (downloadResult.status === 200) {
        return cachedPath;
      }
      return null;
    } catch (error) {
      console.error('Erro ao baixar e cachear imagem:', error);
      return null;
    }
  }

  // Obter imagem de perfil (cache primeiro, depois API, depois default)
  static async getProfileImage(userId: number, userType: 'client' | 'partner'): Promise<string> {
    try {
      // 1. Verificar cache local primeiro
      console.log('Verificando cache local para o usuário:', userId);
      const cachedImage = await this.getCachedImage(userId);
      if (cachedImage) {
        return cachedImage;
      }

      // 2. Buscar na API
             try {
         const response = await axios.get<ProfileImage>(`${API_BASE_URL}/imagens-perfil/${userId}/`);
         
         if (response.data?.imagem) {
           // Baixar e cachear a imagem
           const cachedPath = await this.downloadAndCacheImage(userId, response.data.imagem);
           if (cachedPath) {
             return cachedPath;
           }
         }
      } catch (apiError: any) {
        // Se erro 404, usuário não tem imagem
        if (apiError.response?.status !== 404) {
          console.error('Erro ao buscar imagem na API:', apiError);
        }
      }

      // 3. Retornar imagem padrão
      return DEFAULT_PROFILE_IMAGES[userType];
      
    } catch (error) {
      console.error('Erro ao obter imagem de perfil:', error);
      return DEFAULT_PROFILE_IMAGES[userType];
    }
  }

  // Solicitar permissões
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraStatus === 'granted' && mediaStatus === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }

  // Mostrar seletor de imagem
  static async showImagePicker(): Promise<string | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permissões necessárias',
          'Precisamos de permissão para acessar a câmera e galeria de fotos.'
        );
        return null;
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Selecionar Imagem',
          'Escolha uma opção:',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => resolve(null),
            },
            {
              text: 'Câmera',
              onPress: async () => {
                const result = await this.pickImageFromCamera();
                resolve(result);
              },
            },
            {
              text: 'Galeria',
              onPress: async () => {
                const result = await this.pickImageFromGallery();
                resolve(result);
              },
            },
          ],
          { cancelable: true, onDismiss: () => resolve(null) }
        );
      });
    } catch (error) {
      console.error('Erro ao mostrar seletor de imagem:', error);
      return null;
    }
  }

  // Selecionar imagem da câmera
  static async pickImageFromCamera(): Promise<string | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Erro ao capturar imagem da câmera:', error);
      Alert.alert('Erro', 'Não foi possível capturar a imagem da câmera.');
      return null;
    }
  }

  // Selecionar imagem da galeria
  static async pickImageFromGallery(): Promise<string | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Erro ao selecionar imagem da galeria:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem da galeria.');
      return null;
    }
  }

  // Upload de imagem para a API
  static async uploadProfileImage(userId: number, imageUri: string): Promise<boolean> {
    try {
      // Primeiro, deletar imagem existente (se houver)
      await this.deleteProfileImage(userId);

      // Criar FormData para upload
      const formData = new FormData();
      formData.append('id_usuarios', userId.toString());
      formData.append('imagem', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${userId}.jpg`,
      } as any);

      const response = await axios.post<ProfileImage>(`${API_BASE_URL}/imagens-perfil/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201 && response.data) {
        console.log('✅ Upload bem-sucedido:', {
          id_usuarios: response.data.id_usuarios,
          imagem: response.data.imagem,
          file_id: response.data.file_id
        });
        
        // Limpar cache local após upload bem-sucedido
        await this.clearCacheForUser(userId);
        
        // Opcionalmente, baixar e cachear a nova imagem
        if (response.data.imagem) {
          await this.downloadAndCacheImage(userId, response.data.imagem);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return false;
    }
  }

  // Deletar imagem de perfil da API
  static async deleteProfileImage(userId: number): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE_URL}/imagens-perfil/${userId}/`);
      // Limpar cache local após deletar
      await this.clearCacheForUser(userId);
      return true;
    } catch (error: any) {
      // Se erro 404, imagem não existe (não é um erro real)
      if (error.response?.status === 404) {
        return true;
      }
      console.error('Erro ao deletar imagem:', error);
      return false;
    }
  }

  // Limpar cache para usuário específico
  static async clearCacheForUser(userId: number): Promise<void> {
    try {
      const cachedPath = `${this.CACHE_DIR}${userId}.jpg`;
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cachedPath);
      }
    } catch (error) {
      console.error('Erro ao limpar cache do usuário:', error);
    }
  }

  // Atualizar imagem de perfil (delete + create)
  static async updateProfileImage(userId: number, imageUri: string): Promise<boolean> {
    try {
      // Upload da nova imagem (já inclui o delete)
      const success = await this.uploadProfileImage(userId, imageUri);
      
      if (success) {
        // Salvar nova imagem no cache
        await this.saveToCache(userId, imageUri);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao atualizar imagem de perfil:', error);
      return false;
    }
  }

  // Listar todas as imagens (se necessário)
  static async getAllProfileImages(): Promise<ProfileImage[]> {
    try {
      const response = await axios.get<ProfileImage[]>(`${API_BASE_URL}/imagens-perfil/`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao listar imagens:', error);
      return [];
    }
  }

  // Obter informações completas da imagem (incluindo file_id)
  static async getProfileImageInfo(userId: number): Promise<ProfileImage | null> {
    try {
      const response = await axios.get<ProfileImage>(`${API_BASE_URL}/imagens-perfil/${userId}/`);
      return response.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Usuário não tem imagem
      }
      console.error('Erro ao obter informações da imagem:', error);
      return null;
    }
  }

  // Verificar se imagem é do ImageKit
  static isImageKitUrl(imageUrl: string): boolean {
    return imageUrl.includes('ik.imagekit.io');
  }
} 