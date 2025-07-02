import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Video {
  id: number;
  title: string;
  emoji: string;
  color: [string, string];
  url: string;
  manual: string;
  category: string;
}

const videos: Video[] = [
  {
    id: 1,
    title: 'Reciclagem de Papel',
    emoji: '📄',
    color: ['#4FC3F7', '#29B6F6'],
    url: 'https://www.youtube.com/embed/DaTnsqQktag',
    category: 'Básico',
    manual: `📄 Manual de Reciclagem: PAPEL 📄
*GreenCycle - O Ciclo Verde Começa Aqui!*

✔️ **O que reciclar?**
- Jornais, revistas, folhas de caderno
- Caixas de papelão (desmontadas)
- Envelopes (sem plástico)

❌ **Não recicle:**
- Papel higiênico, guardanapos sujos
- Fotografias ou papel plastificado

🧽 **Como preparar?**
1. Remova clipes, fitas adesivas ou plásticos.
2. Caixas de pizza: corte partes gordurosas (orgânico).
3. Armazene em local seco para evitar mofo.

⚠️ **Cuidados:**
- Papel molhado NÃO é reciclável!
- Papel branco tem maior valor de reciclagem.

🌎 **Impacto:** 1 tonelada de papel reciclado = 22 árvores salvas!
Doe livros usados via *GreenCycle* para bibliotecas comunitárias.`
  },
  {
    id: 2,
    title: 'Reciclagem do Plástico',
    emoji: '🥤',
    color: ['#FF7043', '#F4511E'],
    url: 'https://www.youtube.com/embed/uMZJUcWAKbE',
    category: 'Básico',
    manual: `🥤 Manual de Reciclagem: PLÁSTICO 🥤
*GreenCycle - O Ciclo Verde Começa Aqui!*

✔️ **O que reciclar?**
- Garrafas PET (água, refrigerante)
- Embalagens de shampoo, potes de alimento (nº 1, 2, 5)
- Sacos plásticos (entregue em supermercados)

❌ **Não recicle:**
- Embalagens de salgadinho (metalizadas)
- Acrílico, esponjas, fraldas

🧽 **Como preparar?**
1. Lave para remover resíduos (ex: iogurte).
2. Retire tampas (materiais diferentes).
3. Amasse garrafas para economizar espaço.

⚠️ **Cuidados:**
- Evite embalagens multicamadas (sachês).
- Sacolas plásticas entopem máquinas! Descarte separadamente.

🌎 **Impacto:** Brasil recicla apenas 22% do plástico!
Ganhe pontos no *GreenCycle* por cada kg entregue.`
  },
  {
    id: 3,
    title: 'Reciclagem de Metal',
    emoji: '♻️',
    color: ['#FFB74D', '#FF9800'],
    url: 'https://www.youtube.com/embed/xouKg3XwrxY',
    category: 'Básico',
    manual: `♻️ Manual de Reciclagem: METAL ♻️
*GreenCycle - O Ciclo Verde Começa Aqui!*

✔️ **O que reciclar?**
- Latas de alumínio (refrigerante, cerveja)
- Latas de aço (alimentos, óleo)
- Tampas de metal, arames, papel alumínio limpo

❌ **Não recicle:**
- Latas de tinta ou aerossóis (resíduos perigosos)
- Clipes, grampos, esponjas de aço

🧽 **Como preparar?**
1. Enxágue latas para remover resíduos.
2. Amasse para economizar espaço.
3. Separe tampas (podem ser de material diferente).

⚠️ **Cuidados:**
- Use luvas ao manusear bordas afiadas.
- Baterias NÃO são metais comuns! Descarte em pontos específicos.

🌎 **Impacto:** Reciclar 1 lata = Energia para 3h de TV!
Encontre pontos de coleta no *GreenCycle* e ajude a fechar o ciclo!`
  },
  {
    id: 4,
    title: 'Resíduos Hospitalares',
    emoji: '⚕️',
    color: ['#E57373', '#F44336'],
    url: 'https://www.youtube.com/embed/8YRl79CcVBo',
    category: 'Especial',
    manual: `⚕️ Manual de Reciclagem: HOSPITALAR ⚕️
*GreenCycle - O Ciclo Verde Começa Aqui!*

✔️ **O que descartar?**
- Agulhas, seringas
- Remédios vencidos
- Curativos, gazes com sangue

❌ **Não descarte no lixo comum:**
- Gesso, próteses
- Químicos industriais

🧽 **Como preparar?**
1. Seringas: tampem e guardem em garrafa PET fechada.
2. Remédios: mantenham na embalagem original.
3. Use saco branco leitoso (norma ABNT).

⚠️ **Cuidados:**
- Nunca descarte no vaso sanitário!
- Agulhas: nunca as recape sem técnica adequada.

🌎 **Impacto:** Fármacos poluem água e causam mutações!
Encontre farmácias parceiras no *GreenCycle*.`
  },
  {
    id: 5,
    title: 'Compostagem',
    emoji: '🥕',
    color: ['#81C784', '#4CAF50'],
    url: 'https://www.youtube.com/embed/Zue2bN1-Pp8',
    category: 'Orgânico',
    manual: `🥕 Manual de Reciclagem: ORGÂNICO 🥕
*GreenCycle - O Ciclo Verde Começa Aqui!*

✔️ **O que compostar?**
- Cascas de frutas/legumes
- Borra de café, folhas secas
- Cascas de ovo (trituradas)

❌ **Não composte:**
- Carnes, laticínios, óleos
- Fezes de animais

🧽 **Como preparar?**
1. Corte resíduos em pedaços pequenos.
2. Intercale camadas úmidas (comida) e secas (folhas).
3. Revolva a cada 15 dias para arejar.

⚠️ **Cuidados:**
- Mantenha proporção 3:1 (materiais secos : úmidos) para evitar odor.
- Evite citros em excesso (acidificam o composto).

🌎 **Impacto:** Reduz 24x o metano no lixo!
Conecte-se a hortas comunitárias via *GreenCycle*.`
  },
];

export default function VideoParceiroScreen() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'manual'>('video');

  const handleVideoPress = (video: Video) => {
    setSelectedVideo(video);
    setActiveTab('video');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVideo(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vídeos Educativos</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Conteúdo Premium</Text>
        <Text style={styles.description}>Vídeos detalhados dos nossos parceiros</Text>
      </View>

      {/* Video Grid */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.videoGrid}
      >
        {videos.map((video) => (
          <TouchableOpacity
            key={video.id}
            style={styles.videoCard}
            onPress={() => handleVideoPress(video)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={video.color}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{video.category}</Text>
                </View>
                <Feather name="play-circle" size={24} color="#FFFFFF" />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.videoEmoji}>{video.emoji}</Text>
                <Text style={styles.videoTitle}>{video.title}</Text>
                
                <View style={styles.cardFooter}>
                  <View style={styles.cardActions}>
                    <View style={styles.actionItem}>
                      <Feather name="play" size={16} color="#FFFFFF" />
                      <Text style={styles.actionText}>Assistir</Text>
                    </View>
                    <View style={styles.actionItem}>
                      <MaterialIcons name="menu-book" size={16} color="#FFFFFF" />
                      <Text style={styles.actionText}>Manual</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Feather name="x" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalEmoji}>{selectedVideo?.emoji}</Text>
              <Text style={styles.modalTitle}>{selectedVideo?.title}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'video' && styles.activeTab]}
              onPress={() => setActiveTab('video')}
            >
              <Feather 
                name="play-circle" 
                size={20} 
                color={activeTab === 'video' ? '#4CAF50' : '#7C8BA0'} 
              />
              <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>
                Vídeo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
              onPress={() => setActiveTab('manual')}
            >
              <MaterialIcons 
                name="menu-book" 
                size={20} 
                color={activeTab === 'manual' ? '#4CAF50' : '#7C8BA0'} 
              />
              <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
                Manual
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'video' ? (
              <View style={styles.videoContainer}>
                {selectedVideo && (
                  <WebView
                    style={styles.webview}
                    source={{ uri: selectedVideo.url }}
                    allowsFullscreenVideo={true}
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View style={styles.loadingContainer}>
                        <MaterialIcons name="play-circle-outline" size={48} color="#4CAF50" />
                        <Text style={styles.loadingText}>Carregando vídeo...</Text>
                      </View>
                    )}
                  />
                )}
              </View>
            ) : (
              <ScrollView style={styles.manualContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.manualContent}>
                  <Text style={styles.manualText}>{selectedVideo?.manual}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <FontAwesome5 name="leaf" size={32} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
        <Text style={styles.footerSubtext}>Conteúdo educativo premium</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#7C8BA0',
  },
  scrollContainer: {
    flex: 1,
  },
  videoGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  videoCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
    minHeight: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
  },
  videoEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 24,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 40,
  },
  modalEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    margin: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7C8BA0',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
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
    fontWeight: '500',
    marginTop: 12,
  },
  manualContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  manualContent: {
    padding: 20,
  },
  manualText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2C3E50',
    fontWeight: '400',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#7C8BA0',
    marginTop: 2,
  },
});