import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  Linking,
  Image,
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ConvidarAmigosScreen() {
  const { user } = useUser();
  const [animatedValue] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const shareMessage = `🌱 *Olá! Venha fazer parte da revolução verde!* 🌱

Eu uso o *GreenCycle* e estou convidando você para juntos transformarmos nossa cidade em um lugar mais sustentável! 

💚 *Por que você vai amar:*
✅ Encontre pontos de reciclagem próximos
✅ Conecte-se com parceiros locais 
✅ Transforme lixo em oportunidade
✅ Contribua para um planeta mais verde

🎁 *Benefícios especiais:*
• Descubra como reciclar corretamente
• Facilite o descarte responsável
• Faça parte de uma comunidade sustentável
• Ajude o meio ambiente sem sair de casa

🌍 *Juntos podemos fazer a diferença!*
Cada material reciclado é um passo para um futuro melhor.

Baixe agora e comece sua jornada verde: 
📱 [Link do app] 

#GreenCycle #Sustentabilidade #MeioAmbiente #Reciclagem`;

  const handleWhatsAppShare = async () => {
    try {
      // Tentar diferentes URLs do WhatsApp para máxima compatibilidade
      const whatsappUrls = [
        `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
        `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`,
        `whatsapp://send?text=${encodeURIComponent(shareMessage)}`
      ];

      let success = false;
      
      for (const url of whatsappUrls) {
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
            success = true;
            break;
          }
        } catch (urlError) {
          continue;
        }
      }
      
      if (!success) {
        Alert.alert(
          'WhatsApp não encontrado',
          'O WhatsApp não está instalado no seu dispositivo. Gostaria de compartilhar de outra forma?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Compartilhar', onPress: handleGenericShare }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
    }
  };

  const handleGenericShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: 'Convite GreenCycle'
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar');
    }
  };

  const impactData = [
    { icon: 'user', number: '5.2K+', label: 'Usuários ativos' },
    { icon: 'repeat', number: '12K+', label: 'Kg reciclados' },
    { icon: 'map-pin', number: '200+', label: 'Pontos parceiros' },
  ];

  // Dados do sistema de recompensas (exemplo)
  const userInvites = {
    totalInvites: 7,
    acceptedInvites: 4,
    pendingInvites: 3,
    currentLevel: 'silver',
    pointsEarned: 80,
    nextLevelProgress: 70, // porcentagem para próximo nível
  };

  // Dados de tracking de convites (exemplo)
  const inviteTracking = [
    { name: 'Maria Silva', status: 'accepted', date: '2025-01-15', points: 20 },
    { name: 'João Santos', status: 'pending', date: '2025-01-14', points: 0 },
    { name: 'Ana Costa', status: 'accepted', date: '2025-01-12', points: 20 },
    { name: 'Pedro Lima', status: 'accepted', date: '2025-01-10', points: 20 },
    { name: 'Carla Mendes', status: 'pending', date: '2025-01-08', points: 0 },
  ];

  const rewardLevels = {
    bronze: { min: 0, max: 30, name: 'Bronze', icon: '🥉', color: '#CD7F32' },
    silver: { min: 31, max: 100, name: 'Prata', icon: '🥈', color: '#C0C0C0' },
    gold: { min: 101, max: 200, name: 'Ouro', icon: '🥇', color: '#FFD700' },
    platinum: { min: 201, max: 999, name: 'Platina', icon: '💎', color: '#E5E4E2' },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Animated.View style={[styles.headerContent, { opacity: animatedValue }]}>
          <FontAwesome5 name="leaf" size={40} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Convide Amigos</Text>
          <Text style={styles.headerSubtitle}>
            Espalhe a sustentabilidade
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Seção de Apresentação */}
        <View style={styles.presentationCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="eco" size={32} color="#4CAF50" />
            <Text style={styles.cardTitle}>Por que convidar amigos?</Text>
          </View>
          
          <Text style={styles.cardDescription}>
            Quando você convida um amigo para o GreenCycle, vocês dois se tornam agentes de transformação ambiental! Juntos, vocês amplificam o impacto positivo na natureza.
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Feather name="heart" size={20} color="#FF5722" />
              <Text style={styles.benefitText}>Mais pessoas cuidando do planeta</Text>
            </View>
            <View style={styles.benefitItem}>
              <Feather name="award" size={20} color="#FF9800" />
              <Text style={styles.benefitText}>Reconhecimento na comunidade</Text>
            </View>
            <View style={styles.benefitItem}>
              <Feather name="users" size={20} color="#2196F3" />
              <Text style={styles.benefitText}>Rede de reciclagem mais forte</Text>
            </View>
          </View>
        </View>

        {/* Seção de Impacto */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Nossa Comunidade em Números</Text>
          <View style={styles.impactStats}>
            {impactData.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Feather name={stat.icon as any} size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{stat.number}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Seção de Call-to-Action */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaHeader}>
            <FontAwesome5 name="whatsapp" size={32} color="#25D366" />
            <Text style={styles.ctaTitle}>Compartilhe agora!</Text>
          </View>
          
          <Text style={styles.ctaDescription}>
            Toque no botão abaixo e envie uma mensagem especial criada para inspirar seus amigos a entrarem nessa missão verde! 🌱
          </Text>

          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleWhatsAppShare}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#25D366', '#128C7E']}
              style={styles.whatsappGradient}
            >
              <FontAwesome5 name="whatsapp" size={24} color="#FFFFFF" />
              <Text style={styles.whatsappButtonText}>
                Convidar pelo WhatsApp
              </Text>
              <Feather name="send" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGenericShare}
          >
            <Feather name="share-2" size={20} color="#4CAF50" />
            <Text style={styles.secondaryButtonText}>Outras opções</Text>
          </TouchableOpacity>
        </View>

        {/* Sistema de Recompensas */}
        <View style={styles.rewardsCard}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsTitle}>🏆 Sistema de Recompensas</Text>
            <View style={styles.currentLevelBadge}>
              <Text style={styles.levelIcon}>{(rewardLevels as any)[userInvites.currentLevel].icon}</Text>
              <Text style={styles.levelName}>{(rewardLevels as any)[userInvites.currentLevel].name}</Text>
            </View>
          </View>
          
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{userInvites.pointsEarned} pontos acumulados</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${userInvites.nextLevelProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{userInvites.nextLevelProgress}% para o próximo nível</Text>
            </View>
          </View>

          <View style={styles.inviteStatsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>{userInvites.totalInvites}</Text>
              <Text style={styles.statBoxLabel}>Total Enviados</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>{userInvites.acceptedInvites}</Text>
              <Text style={styles.statBoxLabel}>Aceitos</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>{userInvites.pendingInvites}</Text>
              <Text style={styles.statBoxLabel}>Pendentes</Text>
            </View>
          </View>
        </View>

        {/* Tracking de Convites */}
        <View style={styles.trackingCard}>
          <Text style={styles.trackingTitle}>📊 Seus Convites</Text>
          <View style={styles.invitesList}>
            {inviteTracking.slice(0, 3).map((invite, index) => (
              <View key={index} style={styles.inviteItem}>
                <View style={styles.inviteInfo}>
                  <Text style={styles.inviteName}>{invite.name}</Text>
                  <Text style={styles.inviteDate}>{new Date(invite.date).toLocaleDateString('pt-BR')}</Text>
                </View>
                <View style={styles.inviteStatus}>
                  <View style={[
                    styles.statusDot, 
                    { backgroundColor: invite.status === 'accepted' ? '#4CAF50' : '#FF9800' }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: invite.status === 'accepted' ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {invite.status === 'accepted' ? 'Ativo' : 'Pendente'}
                  </Text>
                  {invite.status === 'accepted' && (
                    <Text style={styles.pointsEarned}>+{invite.points}pts</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver todos os convites</Text>
            <Feather name="chevron-right" size={16} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Seção de Dicas */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Dicas de Ouro para Convencer</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipText}>
              💚 <Text style={styles.tipHighlight}>Destaque a facilidade:</Text> "Encontre pontos de reciclagem em segundos"
            </Text>
            <Text style={styles.tipText}>
              🎯 <Text style={styles.tipHighlight}>Foque na economia:</Text> "Transforme lixo em dinheiro"
            </Text>
            <Text style={styles.tipText}>
              🏆 <Text style={styles.tipHighlight}>Mostre os benefícios:</Text> "Mais de 200 parceiros e crescendo"
            </Text>
            <Text style={styles.tipText}>
              🌍 <Text style={styles.tipHighlight}>Apele para valores:</Text> "Seja parte da solução ambiental"
            </Text>
            <Text style={styles.tipText}>
              📱 <Text style={styles.tipHighlight}>Comprove a praticidade:</Text> "App gratuito, sem complicação"
            </Text>
            <Text style={styles.tipText}>
              👥 <Text style={styles.tipHighlight}>Use prova social:</Text> "Junte-se a +5.000 usuários conscientes"
            </Text>
            <Text style={styles.tipText}>
              🎁 <Text style={styles.tipHighlight}>Crie urgência:</Text> "Quanto antes começar, maior o impacto"
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Obrigado por fazer parte do movimento GreenCycle! 🌍
          </Text>
          <Text style={styles.footerSubtext}>
            Juntos somos mais fortes pela sustentabilidade
          </Text>
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 5,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  presentationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    flex: 1,
  },
  cardDescription: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
  },
  benefitsContainer: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
    flex: 1,
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  impactTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 12,
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  ctaDescription: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  whatsappButton: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  whatsappGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    flex: 1,
    textAlign: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  rewardsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rewardsTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  currentLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelIcon: {
    fontSize: 16,
  },
  levelName: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#F57C00',
  },
  pointsContainer: {
    marginBottom: 20,
  },
  pointsText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  inviteStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statBoxNumber: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
  },
  statBoxLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  trackingTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 15,
  },
  invitesList: {
    gap: 12,
    marginBottom: 15,
  },
  inviteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  inviteInfo: {
    flex: 1,
  },
  inviteName: {
    fontSize: 15,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  inviteDate: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#999999',
    marginTop: 2,
  },
  inviteStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
  },
  pointsEarned: {
    fontSize: 11,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
  },
  tipHighlight: {
    fontFamily: 'Roboto-Bold',
    color: '#2E7D32',
  },
  tipsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 15,
    fontFamily: 'Roboto-Regular',
    color: '#2E7D32',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    textAlign: 'center',
    marginTop: 5,
  },
});