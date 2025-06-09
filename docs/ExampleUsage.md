# Exemplos de Uso - Sistema de Imagens de Perfil

## 1. Uso Básico nos Componentes

### Profile Screen com Hook

```typescript
// app/(app)/profile.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProfileImage } from '../../hooks/useProfileImage';
import { ProfileImage } from '../../components/ProfileImage';

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const { 
    imageUri, 
    isLoading, 
    isUpdating, 
    updateImage,
    error 
  } = useProfileImage();

  return (
    <View style={styles.container}>
      <ProfileImage
        imageUri={imageUri}
        isLoading={isLoading}
        isUpdating={isUpdating}
        size={120}
        borderColor="#4CAF50"
        borderWidth={3}
        editable={isEditing}
        onPress={updateImage}
        loadingColor="#4CAF50"
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}
```

### Menu Screen (Somente Exibição)

```typescript
// app/(app)/menu.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProfileImage } from '../../hooks/useProfileImage';
import { ProfileImage } from '../../components/ProfileImage';

export default function MenuScreen() {
  const { imageUri, isLoading } = useProfileImage();

  return (
    <View style={styles.container}>
      <ProfileImage
        imageUri={imageUri}
        isLoading={isLoading}
        size={80}
        borderColor="#4CAF50"
        borderWidth={2}
        editable={false}
      />
      <Text style={styles.userName}>Bem-vindo!</Text>
    </View>
  );
}
```

## 2. Uso Direto do ImageService

### Captura Manual de Imagem

```typescript
import { ImageService } from '../../services/ImageService';
import { Alert } from 'react-native';

const handleCaptureImage = async () => {
  try {
    // Solicitar permissões
    const hasPermissions = await ImageService.requestPermissions();
    if (!hasPermissions) {
      Alert.alert('Erro', 'Permissões necessárias não concedidas');
      return;
    }

    // Capturar imagem da câmera
    const imageUri = await ImageService.pickImageFromCamera();
    
    if (imageUri) {
      console.log('Imagem capturada:', imageUri);
      
      // Upload para a API
      const success = await ImageService.uploadProfileImage(userId, imageUri);
      
      if (success) {
        Alert.alert('Sucesso', 'Imagem atualizada com sucesso!');
      } else {
        Alert.alert('Erro', 'Falha ao fazer upload da imagem');
      }
    }
  } catch (error) {
    console.error('Erro ao capturar imagem:', error);
    Alert.alert('Erro', 'Erro inesperado ao capturar imagem');
  }
};
```

### Seleção da Galeria

```typescript
const handleSelectFromGallery = async () => {
  try {
    const imageUri = await ImageService.pickImageFromGallery();
    
    if (imageUri) {
      // Processar imagem selecionada
      await processSelectedImage(imageUri);
    }
  } catch (error) {
    console.error('Erro ao selecionar da galeria:', error);
  }
};
```

## 3. Gerenciamento de Cache

### Limpar Cache Específico

```typescript
const clearUserCache = async (userId: number) => {
  try {
    await ImageService.clearCacheForUser(userId);
    console.log('Cache do usuário limpo');
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
};
```

### Verificar Estado do Cache

```typescript
const checkCacheStatus = async (userId: number) => {
  try {
    const cachedImage = await ImageService.getCachedImage(userId);
    
    if (cachedImage) {
      console.log('Imagem encontrada no cache:', cachedImage);
    } else {
      console.log('Imagem não encontrada no cache');
    }
  } catch (error) {
    console.error('Erro ao verificar cache:', error);
  }
};
```

## 4. Integração com Estados da Aplicação

### Context Provider para Imagens

```typescript
// contexts/ImageContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface ImageContextType {
  profileImages: Record<number, string>;
  updateProfileImage: (userId: number, imageUri: string) => void;
  getProfileImage: (userId: number) => string | null;
}

const ImageContext = createContext<ImageContextType | null>(null);

export const ImageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileImages, setProfileImages] = useState<Record<number, string>>({});

  const updateProfileImage = (userId: number, imageUri: string) => {
    setProfileImages(prev => ({ ...prev, [userId]: imageUri }));
  };

  const getProfileImage = (userId: number) => {
    return profileImages[userId] || null;
  };

  return (
    <ImageContext.Provider value={{
      profileImages,
      updateProfileImage,
      getProfileImage
    }}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within ImageProvider');
  }
  return context;
};
```

## 5. Componente Avançado com Múltiplas Opções

```typescript
// components/AdvancedProfileImage.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ProfileImage } from './ProfileImage';
import { useProfileImage } from '../hooks/useProfileImage';
import { ImageService } from '../services/ImageService';

interface AdvancedProfileImageProps {
  size?: number;
  showOptions?: boolean;
  onImageChanged?: (imageUri: string) => void;
}

export const AdvancedProfileImage: React.FC<AdvancedProfileImageProps> = ({
  size = 120,
  showOptions = true,
  onImageChanged
}) => {
  const { imageUri, isLoading, isUpdating, deleteImage } = useProfileImage();
  const [showMenu, setShowMenu] = useState(false);

  const handleCameraPress = async () => {
    try {
      const imageUri = await ImageService.pickImageFromCamera();
      if (imageUri) {
        // Processar upload aqui
        onImageChanged?.(imageUri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao capturar imagem da câmera');
    }
    setShowMenu(false);
  };

  const handleGalleryPress = async () => {
    try {
      const imageUri = await ImageService.pickImageFromGallery();
      if (imageUri) {
        // Processar upload aqui
        onImageChanged?.(imageUri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao selecionar imagem da galeria');
    }
    setShowMenu(false);
  };

  const handleDeletePress = async () => {
    Alert.alert(
      'Confirmar',
      'Deseja remover a imagem de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            await deleteImage();
            setShowMenu(false);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ProfileImage
        imageUri={imageUri}
        isLoading={isLoading}
        isUpdating={isUpdating}
        size={size}
        editable={showOptions}
        onPress={() => setShowMenu(true)}
      />

      {showMenu && showOptions && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity style={styles.option} onPress={handleCameraPress}>
            <Feather name="camera" size={20} color="#333" />
            <Text style={styles.optionText}>Câmera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleGalleryPress}>
            <Feather name="image" size={20} color="#333" />
            <Text style={styles.optionText}>Galeria</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleDeletePress}>
            <Feather name="trash-2" size={20} color="#F44336" />
            <Text style={[styles.optionText, { color: '#F44336' }]}>Remover</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={() => setShowMenu(false)}
          >
            <Feather name="x" size={20} color="#666" />
            <Text style={styles.optionText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  optionsMenu: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 150,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
});
```

## 6. Teste e Debugging

### Função de Teste Completa

```typescript
// utils/testImageService.ts
import { ImageService } from '../services/ImageService';
import { Alert } from 'react-native';

export const testImageService = async (userId: number) => {
  console.log('🧪 Iniciando teste do ImageService...');

  try {
    // 1. Testar inicialização do cache
    console.log('📁 Testando inicialização do cache...');
    await ImageService.initializeCache();
    console.log('✅ Cache inicializado com sucesso');

    // 2. Testar busca de imagem
    console.log('🔍 Testando busca de imagem...');
    const profileImage = await ImageService.getProfileImage(userId, 'client');
    console.log('✅ Imagem obtida:', profileImage);

    // 3. Testar permissões
    console.log('🔐 Testando permissões...');
    const hasPermissions = await ImageService.requestPermissions();
    console.log('✅ Permissões:', hasPermissions ? 'Concedidas' : 'Negadas');

    // 4. Testar cache
    console.log('💾 Testando cache...');
    const cachedImage = await ImageService.getCachedImage(userId);
    console.log('✅ Cache:', cachedImage ? 'Encontrado' : 'Não encontrado');

    console.log('🎉 Todos os testes passaram!');
    Alert.alert('Teste Completo', 'Todos os testes do ImageService passaram!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    Alert.alert('Erro no Teste', `Falha: ${error}`);
  }
};
```

## 7. Monitoramento e Analytics

### Hook para Métricas

```typescript
// hooks/useImageMetrics.ts
import { useEffect, useState } from 'react';

interface ImageMetrics {
  cacheHits: number;
  cacheMisses: number;
  uploadsSuccessful: number;
  uploadsFailed: number;
  totalLoadTime: number;
}

export const useImageMetrics = () => {
  const [metrics, setMetrics] = useState<ImageMetrics>({
    cacheHits: 0,
    cacheMisses: 0,
    uploadsSuccessful: 0,
    uploadsFailed: 0,
    totalLoadTime: 0,
  });

  const recordCacheHit = () => {
    setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
  };

  const recordCacheMiss = () => {
    setMetrics(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));
  };

  const recordUploadSuccess = () => {
    setMetrics(prev => ({ ...prev, uploadsSuccessful: prev.uploadsSuccessful + 1 }));
  };

  const recordUploadFailure = () => {
    setMetrics(prev => ({ ...prev, uploadsFailed: prev.uploadsFailed + 1 }));
  };

  const recordLoadTime = (time: number) => {
    setMetrics(prev => ({ ...prev, totalLoadTime: prev.totalLoadTime + time }));
  };

  return {
    metrics,
    recordCacheHit,
    recordCacheMiss,
    recordUploadSuccess,
    recordUploadFailure,
    recordLoadTime,
  };
};
```

## 8. Exemplo Completo de Integração

```typescript
// screens/CompleteProfileExample.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { ProfileImage } from '../components/ProfileImage';
import { useProfileImage } from '../hooks/useProfileImage';
import { ImageService } from '../services/ImageService';

export default function CompleteProfileExample() {
  const [isEditing, setIsEditing] = useState(false);
  const { 
    imageUri, 
    isLoading, 
    isUpdating, 
    updateImage,
    deleteImage,
    refreshImage,
    error 
  } = useProfileImage();

  useEffect(() => {
    // Refresh da imagem quando entrar na tela
    refreshImage();
  }, []);

  const handleImageUpdate = async () => {
    try {
      await updateImage();
      Alert.alert('Sucesso', 'Imagem atualizada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar imagem');
    }
  };

  const handleImageDelete = async () => {
    Alert.alert(
      'Confirmar',
      'Deseja remover a imagem de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: deleteImage
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancelar' : 'Editar'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <ProfileImage
          imageUri={imageUri}
          isLoading={isLoading}
          isUpdating={isUpdating}
          size={150}
          borderColor="#4CAF50"
          borderWidth={4}
          editable={isEditing}
          onPress={handleImageUpdate}
          loadingColor="#4CAF50"
        />

        {isEditing && (
          <View style={styles.imageActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleImageUpdate}
              disabled={isUpdating}
            >
              <Text style={styles.actionButtonText}>Alterar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]} 
              onPress={handleImageDelete}
              disabled={isUpdating}
            >
              <Text style={[styles.actionButtonText, styles.deleteText]}>
                Remover Foto
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          {isLoading ? 'Carregando perfil...' : 'Perfil carregado com sucesso'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deleteText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  infoText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
});
```

Este exemplo mostra uma implementação completa com todas as funcionalidades do sistema de imagens integradas em uma tela de perfil prática e funcional. 