import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';

export default function OrderParceiroMenuScreen() {
  const { user } = useUser();

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
        <Text style={styles.title}>Gestão de Coletas</Text>
        <Text style={styles.subtitle}>Gerencie suas solicitações de coleta</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/aceitarSolicitacaoParceiro')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
            <Feather name="plus-circle" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.menuCardContent}>
            <Text style={styles.menuCardTitle}>Aceitar Solicitações</Text>
            <Text style={styles.menuCardDescription}>
              Visualize e aceite novas solicitações de coleta disponíveis na sua região
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/dashboardParceiro')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
            <Feather name="clipboard" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.menuCardContent}>
            <Text style={styles.menuCardTitle}>Dashboard de Pedidos</Text>
            <Text style={styles.menuCardDescription}>
              Acompanhe e gerencie as coletas que você aceitou
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/historicRequest')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#9C27B0' }]}>
            <Feather name="clock" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.menuCardContent}>
            <Text style={styles.menuCardTitle}>Histórico</Text>
            <Text style={styles.menuCardDescription}>
              Consulte todas as coletas que você já realizou
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Resumo de Atividades</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Coletas Pendentes</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Coletas Concluídas</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0kg</Text>
              <Text style={styles.statLabel}>Material Coletado</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>R$ 0,00</Text>
              <Text style={styles.statLabel}>Ganhos Totais</Text>
            </View>
          </View>
        </View>
      </View>

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
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  content: {
    padding: 16,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    borderRadius: 50,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuCardContent: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 4,
  },
  menuCardDescription: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#F5F5F5',
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
  },
  footerText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
  },
});