import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, ClipboardList, Plus } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useUser } from '../context/UserContext';

export default function OrderScreen() {
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
        <Text style={styles.title}>Solicitações</Text>
        <Text style={styles.subtitle}>O que você deseja fazer?</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/request')}
        >
          <View style={styles.optionIconContainer}>
            <Feather name="plus" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Nova Solicitação</Text>
            <Text style={styles.optionDescription}>
              Solicite uma coleta de materiais recicláveis
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/historicRequest')}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: '#2196F3' }]}>
            <FontAwesome5 name="clipboard-list" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Histórico</Text>
            <Text style={styles.optionDescription}>
              Consulte seus pedidos anteriores e acompanhe o status
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Como funciona?</Text>
            <Text style={styles.infoText}>
              1. Faça sua solicitação informando o tipo de material{'\n'}
              2. Aguarde a confirmação de um parceiro{'\n'}
              3. O parceiro irá até o endereço indicado fazer a coleta{'\n'}
              4. Receba créditos pela sua contribuição ecológica
            </Text>
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
  optionCard: {
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
  optionIconContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    lineHeight: 20,
  },
  infoContainer: {
    marginTop: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    lineHeight: 24,
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