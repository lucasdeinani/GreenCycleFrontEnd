import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';
import { useProfileImage } from '../../hooks/useProfileImage';

export default function MenuParceiroScreen() {
  const { user, setUser } = useUser();
  const { imageUri, isLoading: imageLoading } = useProfileImage();
  console.log('Usuário no contexto:', user);
  const handleLogout = () => {
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          {imageLoading ? (
            <View style={[styles.profileImage, styles.loadingContainer]}>
              <ActivityIndicator size="large" color="#FFC107" />
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.profileImage}
            />
          )}
          <Text style={styles.profileName}>{user?.nome ?? 'Parceiro'}</Text>
        </View>

        <View style={styles.menuButtons}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/order_parceiro')}
          >
            <Feather name="package" size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/map_parceiro')}
          >
            <Feather name="map-pin" size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Mapa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/video_parceiro')}
          >
            <Feather name="video" size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/profile_parceiro')}
          >
            <Feather name="user" size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/avaliacoes_parceiro')}
          >
            <Feather name="star" size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Avaliações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/convidar_amigos')}
          >
            <Feather name="user-plus" size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Convidar Amigos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/ajuda')}
          >
            <Feather name="help-circle" size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Ajuda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <FontAwesome5 name="leaf" size={40} color="#4CAF50" />
          <Text style={styles.footerText}>Green Cycle</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
    minHeight: '100%',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  menuButtons: {
    gap: 16,
    marginBottom: 40,
  },
  menuButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 32,
  },
  footerText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
  },
});