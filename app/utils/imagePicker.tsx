import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const pickImage = async (options: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
} = {}) => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Precisamos da permissão para acessar suas fotos para alterar a imagem de perfil'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    ...options
  });

  if (result.canceled) return null;

  return await processImage(result.assets[0].uri);
};

export const takePhoto = async (options: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
} = {}) => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Precisamos da permissão para acessar sua câmera para tirar uma foto'
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    ...options
  });

  if (result.canceled) return null;

  return await processImage(result.assets[0].uri);
};

const processImage = async (uri: string) => {
  try {
    // Redimensionar e converter para JPG
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    // Verificar tamanho do arquivo
    const fileInfo = await FileSystem.getInfoAsync(manipResult.uri);
    if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
      Alert.alert(
        'Imagem muito grande',
        'Por favor, selecione uma imagem menor que 5MB'
      );
      return null;
    }

    return manipResult.uri;
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    Alert.alert('Erro', 'Não foi possível processar a imagem selecionada');
    return null;
  }
};

export const showImagePickerOptions = () => {
  return new Promise<'camera' | 'library' | null>((resolve) => {
    Alert.alert(
      'Alterar Foto de Perfil',
      'Escolha uma opção',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => resolve(null)
        },
        {
          text: 'Tirar Foto',
          onPress: () => resolve('camera')
        },
        {
          text: 'Escolher da Galeria',
          onPress: () => resolve('library')
        }
      ]
    );
  });
};