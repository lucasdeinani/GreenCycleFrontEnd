import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// URLs dos vídeos do YouTube
const videos = [
  'https://www.youtube.com/embed/DaTnsqQktag', // Papel
  'https://www.youtube.com/embed/uMZJUcWAKbE', // Plastico
  'https://www.youtube.com/embed/xouKg3XwrxY', // Metal
  'https://www.youtube.com/embed/8YRl79CcVBo', // Hospitalar
  'https://www.youtube.com/embed/Zue2bN1-Pp8', // Organico
];

const buttonNames = ['Papel', 'Plastico', 'Metal', 'Hospitalar', 'Organico'];

export default function VideoScreen() {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleVideoPress = (index: number) => {
    setSelectedVideoIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVideoIndex(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Feather name="arrow-left" size={24} color="#333333" />
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
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Feather name="x" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedVideoIndex !== null ? buttonNames[selectedVideoIndex] : ''}
            </Text>
          </View>
          
          <View style={styles.videoContainer}>
            {selectedVideoIndex !== null && (
              <WebView
                style={styles.webview}
                source={{ uri: videos[selectedVideoIndex] }}
                allowsFullscreenVideo={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando vídeo...</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <FontAwesome5 name="leaf" size={40} color="#4CAF50" />
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
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
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