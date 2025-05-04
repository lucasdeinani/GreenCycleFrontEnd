import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { WebView } from 'react-native-webview';


// Example video URLs with proper YouTube embed format
const videos = [
  {
    id: 1,
    title: 'Como Separar Papel',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
    thumbnail: 'https://images.unsplash.com/photo-1571727153934-b9e0059b7ab2?w=800&h=450&fit=crop',
  },
  {
    id: 2,
    title: 'Reciclagem de Plástico',
    url: 'https://www.youtube.com/embed/jG7dSXcfVqE?autoplay=1&rel=0',
    thumbnail: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=450&fit=crop',
  },
  {
    id: 3,
    title: 'Processamento de Metal',
    url: 'https://www.youtube.com/embed/9bZkp7q19f0?autoplay=1&rel=0',
    thumbnail: 'https://images.unsplash.com/photo-1558640476-437a2b9438a2?w=800&h=450&fit=crop',
  },
  {
    id: 4,
    title: 'Resíduos Hospitalares',
    url: 'https://www.youtube.com/embed/M7FIvfx5J10?autoplay=1&rel=0',
    thumbnail: 'https://images.unsplash.com/photo-1587556930799-8dca6fad6d7e?w=800&h=450&fit=crop',
  },
  {
    id: 5,
    title: 'Compostagem',
    url: 'https://www.youtube.com/embed/pW4v8XkF1O0?autoplay=1&rel=0',
    thumbnail: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=450&fit=crop',
  },
];

export default function VideoParceiroScreen() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleVideoPress = (video) => {
    setSelectedVideo(video);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Feather name="arrow-left" size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Vídeos Educativos</Text>
      </View>

      <View style={styles.videoGrid}>
        {videos.map((video) => (
          <TouchableOpacity
            key={video.id}
            style={styles.videoCard}
            onPress={() => handleVideoPress(video)}
          >
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: video.thumbnail }}
                style={styles.thumbnail}
              />
              <View style={styles.playIconOverlay}>
                <Feather name="play-circle" size={40} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.videoTitle}>{video.title}</Text>
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
              source={{ uri: selectedVideo?.url }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSelectedVideo(null);
                setModalVisible(false);
              }}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <FontAwesome5 name="leaf" size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>
    </ScrollView>
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
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  videoGrid: {
    padding: 16,
    gap: 16,
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
    padding: 12,
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