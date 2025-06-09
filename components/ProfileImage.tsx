import React from 'react';
import { View, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ProfileImageProps {
  imageUri: string;
  isLoading?: boolean;
  isUpdating?: boolean;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  editable?: boolean;
  onPress?: () => void;
  loadingColor?: string;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUri,
  isLoading = false,
  isUpdating = false,
  size = 120,
  borderColor = '#4CAF50',
  borderWidth = 3,
  editable = false,
  onPress,
  loadingColor = '#4CAF50',
}) => {
  const imageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth,
    borderColor,
  };

  const loadingContainerStyle = {
    ...imageStyle,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F5F5F5',
  };

  const changePhotoButtonStyle = {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    width: size * 0.33,
    height: size * 0.33,
    borderRadius: (size * 0.33) / 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={loadingContainerStyle}>
          <ActivityIndicator size="large" color={loadingColor} />
        </View>
      ) : (
        <Image source={{ uri: imageUri }} style={imageStyle} />
      )}
      
      {editable && onPress && (
        <TouchableOpacity
          style={changePhotoButtonStyle}
          onPress={onPress}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="camera" size={size * 0.16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
}); 