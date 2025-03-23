import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

// Example video URLs (replace with actual videos later)
const videos = [
  'https://www.youtube.com/embed/dQw4w9WgXcQ', // Papel
  'https://www.youtube.com/embed/dQw4w9WgXcQ', // Plastico
  'https://www.youtube.com/embed/dQw4w9WgXcQ', // Metal
  'https://www.youtube.com/embed/dQw4w9WgXcQ', // Hospitalar
  'https://www.youtube.com/embed/dQw4w9WgXcQ', // Organico
];

const buttonNames = ['Papel', 'Plastico', 'Metal', 'Hospitalar', 'Organico'];

export default function VideoScreen() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleVideoPress = (index) => {
    setSelectedVideo(videos[index]);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        {buttonNames.map((name, index) => (
          <TouchableOpacity
            key={index}
            style={styles.videoButton}
            onPress={() => handleVideoPress(index)}
          >
            <Text style={styles.videoButtonText}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <WebView
              style={styles.video}
              source={{ uri: selectedVideo }}
              allowsFullscreenVideo
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Leaf size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  buttonContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  videoButton: {
    backgroundColor: '#FFC107',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  videoButtonText: {
    color: '#333333',
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 300,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  footer: {
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
  },
});