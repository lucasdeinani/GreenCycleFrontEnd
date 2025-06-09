import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { VideoView, useVideoPlayer } from 'expo-video';

const { width, height } = Dimensions.get('window');

interface Video {
  id: number;
  title: string;
  url: string;
  thumbnail: string;
}

const videos: Video[] = [
  {
    id: 1,
    title: 'Como Separar Papel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1585351737354-204ffbbe584f?w=800&h=450&fit=crop',
  },
  {
    id: 2,
    title: 'Reciclagem de Plástico',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&h=450&fit=crop',
  },
  {
    id: 3,
    title: 'Processamento de Metal',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1625662276901-4a7ec44fbeed?w=800&h=450&fit=crop',
  },
  {
    id: 4,
    title: 'Resíduos Hospitalares',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://plus.unsplash.com/premium_photo-1681488170085-17f1308c26fe?w=800&h=450&fit=crop',
  },
  {
    id: 5,
    title: 'Compostagem',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=450&fit=crop',
  },
];

export default function VideoParceiroScreen() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const player = useVideoPlayer(selectedVideo ? selectedVideo.url : '', player => {
    player.loop = false;
    player.play();
  });

  const handleVideoPress = (video: Video) => {
    setSelectedVideo(video);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    player.pause();
    setSelectedVideo(null);
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
              {selectedVideo ? selectedVideo.title : ''}
            </Text>
          </View>
          
          <View style={styles.videoContainer}>
            {selectedVideo && (
              <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
              />
            )}
          </View>

          <View style={styles.videoInfo}>
            <Text style={styles.videoDescription}>
              {selectedVideo ? selectedVideo.title : ''}
            </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  video: {
    width: width,
    height: width * (9/16), // Aspect ratio 16:9
    backgroundColor: '#000000',
  },
  videoInfo: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  videoDescription: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
    textAlign: 'center',
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