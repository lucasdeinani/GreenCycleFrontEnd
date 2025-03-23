import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Package, Video, LogOut, Leaf, User } from 'lucide-react-native';

export default function MenuScreen() {
  const handleLogout = () => {
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&h=180&fit=crop&q=80&auto=format' }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>Nome Usuario</Text>
        </View>

        <View style={styles.menuButtons}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/order')}
          >
            <Package size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/map')}
          >
            <MapPin size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Mapa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/video')}
          >
            <Video size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/profile')}
          >
            <User size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleLogout}
          >
            <LogOut size={24} color="#FFFFFF" />
            <Text style={styles.menuButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Leaf size={40} color="#4CAF50" />
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