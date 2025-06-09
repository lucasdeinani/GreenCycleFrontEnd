import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { VideoView, useVideoPlayer } from 'expo-video';

const { width, height } = Dimensions.get('window');

// URLs dos vídeos locais ou remotos
const videos = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Papel - exemplo
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', // Plastico - exemplo
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // Metal - exemplo
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', // Hospitalar - exemplo
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', // Organico - exemplo
];

const buttonNames = ['Papel', 'Plastico', 'Metal', 'Hospitalar', 'Organico'];

export default function VideoScreen() {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const player = useVideoPlayer(selectedVideoIndex !== null ? videos[selectedVideoIndex] : '', player => {
    player.loop = false;
    player.play();
  });

  const handleVideoPress = (index: number) => {
    setSelectedVideoIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    player.pause();
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
              <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: width * (9/16), // Aspect ratio 16:9
    backgroundColor: '#000000',
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