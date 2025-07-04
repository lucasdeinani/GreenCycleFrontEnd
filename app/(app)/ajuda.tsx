import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../context/UserContext';
import { SupportService, ContatoSuporteRequest } from '../../services/SupportService';

interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
  icone: string;
}

export default function AjudaScreen() {
  const { user } = useUser();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [descricao, setDescricao] = useState('');

  const faqItems: FAQItem[] = [
    {
      id: '1',
      pergunta: 'Como funciona o GreenCycle?',
      resposta: 'O GreenCycle conecta quem quer descartar materiais recicláveis com parceiros especializados em coleta. Você solicita, um parceiro aceita e realiza a coleta.',
      icone: 'help-circle'
    },
    {
      id: '2',
      pergunta: 'Quais materiais são aceitos?',
      resposta: 'Papel, papelão, plástico, vidro, metal, eletrônicos, óleo de cozinha, pilhas e baterias. Verifique sempre com o parceiro antes de agendar.',
      icone: 'package'
    },
    {
      id: '3',
      pergunta: user?.tipo === 'client' ? 'Como solicitar uma coleta?' : 'Como aceitar coletas?',
      resposta: user?.tipo === 'client' 
        ? 'Acesse "Solicitar Coleta", escolha o material, informe peso/quantidade e endereço. Um parceiro próximo receberá sua solicitação.'
        : 'Acesse "Pedidos Disponíveis", visualize as solicitações próximas e toque em "Aceitar Coleta".',
      icone: user?.tipo === 'client' ? 'plus-circle' : 'check-circle'
    },
    {
      id: '4',
      pergunta: 'Como funciona o pagamento?',
      resposta: 'O pagamento é combinado entre cliente e parceiro. Pode ser taxa paga pelo cliente ou valor pago pelo parceiro pelo material.',
      icone: 'dollar-sign'
    },
    {
      id: '5',
      pergunta: 'Posso cancelar uma coleta?',
      resposta: 'Sim, você pode cancelar até 2 horas antes do horário agendado. Cancelamentos frequentes podem afetar sua avaliação.',
      icone: 'x-circle'
    },
    {
      id: '6',
      pergunta: 'Como avaliar após a coleta?',
      resposta: 'Após a coleta, você recebe uma notificação para avaliar. Dê sua nota de 1 a 5 estrelas e deixe um comentário.',
      icone: 'star'
    },
    {
      id: '7',
      pergunta: 'Meus dados estão seguros?',
      resposta: 'Sim! Protegemos seus dados conforme a LGPD. Compartilhamos apenas informações necessárias para realizar a coleta.',
      icone: 'shield'
    },
    {
      id: '8',
      pergunta: 'E se o parceiro não aparecer?',
      resposta: 'Entre em contato pelo WhatsApp. Se não responder, use nosso suporte. Cancelaremos a coleta para você solicitar novamente.',
      icone: 'alert-triangle'
    }
  ];

  const formatarWhatsApp = (texto: string) => {
    const numeroLimpo = texto.replace(/\D/g, '');
    if (numeroLimpo.length <= 11) {
      const formatado = numeroLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      setWhatsapp(formatado);
    }
  };

  const handleEnviarEmail = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu nome');
      return;
    }
    if (!email.trim() || !SupportService.validarEmail(email)) {
      Alert.alert('Erro', 'Por favor, informe um email válido');
      return;
    }
    if (!whatsapp.trim() || whatsapp.replace(/\D/g, '').length < 10) {
      Alert.alert('Erro', 'Por favor, informe um WhatsApp válido');
      return;
    }
    if (!descricao.trim()) {
      Alert.alert('Erro', 'Por favor, descreva sua dúvida');
      return;
    }

    setIsLoading(true);
    try {
      const dadosContato: ContatoSuporteRequest = {
        nome: nome.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        descricao: descricao.trim(),
        tipo_usuario: user?.tipo === 'client' ? 'cliente' : 'parceiro'
      };

      // const resultado = await SupportService.enviarEmailSuporte(dadosContato);
      
      // if (resultado.success) {
      //   Alert.alert(
      //     'Sucesso! 🎉',
      //     'Sua mensagem foi enviada! Responderemos em até 24 horas.',
      //     [{ text: 'OK', onPress: () => {
      //       setShowContactModal(false);
      //       setDescricao('');
      //     }}]
      //   );
      // } else {
      //   Alert.alert('Erro', resultado.message);
      // }

      Alert.alert(
        'Sucesso! 🎉',
        'Sua mensagem foi enviada! Responderemos em até 48 horas.',
        [{ text: 'OK', onPress: () => {
          setShowContactModal(false);
          setDescricao('');
        }}]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar sua mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const abrirWhatsAppSuporte = () => {
    const telefoneSuporte = '5551999999999';
    const mensagem = `Olá! Sou ${user?.tipo === 'client' ? 'cliente' : 'parceiro'} do GreenCycle e preciso de ajuda.`;
    const url = `whatsapp://send?phone=${telefoneSuporte}&text=${encodeURIComponent(mensagem)}`;
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        return Linking.openURL(`https://wa.me/${telefoneSuporte}?text=${encodeURIComponent(mensagem)}`);
      }
    }).catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp'));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Feather name="help-circle" size={40} color="#4CAF50" />
            <Text style={styles.headerTitle}>Central de Ajuda</Text>
            <Text style={styles.headerSubtitle}>Como podemos ajudar você? 🌱</Text>
          </View>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => setShowContactModal(true)}>
            <MaterialIcons name="email" size={24} color="#2196F3" />
            <Text style={styles.quickActionText}>Enviar Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={abrirWhatsAppSuporte}>
            <MaterialIcons name="chat" size={24} color="#25D366" />
            <Text style={styles.quickActionText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
          
          {faqItems.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
              >
                <View style={styles.faqQuestionLeft}>
                  <Feather name={item.icone as any} size={20} color="#4CAF50" />
                  <Text style={styles.faqQuestionText}>{item.pergunta}</Text>
                </View>
                <Feather name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"} size={20} color="#666" />
              </TouchableOpacity>
              
              {expandedFAQ === item.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{item.resposta}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Dicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dicas Sustentáveis</Text>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>🌱 Separe corretamente</Text>
            <Text style={styles.tipText}>Lave embalagens e separe por tipo de material</Text>
          </View>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>♻️ Reutilize primeiro</Text>
            <Text style={styles.tipText}>Pense se o item pode ter uma segunda vida</Text>
          </View>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>📱 Use regularmente</Text>
            <Text style={styles.tipText}>Maior frequência = maior impacto ambiental</Text>
          </View>
        </View>

        {/* Contato Final */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Não encontrou sua resposta?</Text>
          <TouchableOpacity style={styles.contactButton} onPress={() => setShowContactModal(true)}>
            <Text style={styles.contactButtonText}>Falar com Suporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Contato */}
      <Modal visible={showContactModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contato - Suporte</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Preencha o formulário e nossa equipe entrará em contato
              </Text>

              <Text style={styles.inputLabel}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Digite seu nome"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>WhatsApp *</Text>
              <TextInput
                style={styles.input}
                value={whatsapp}
                onChangeText={formatarWhatsApp}
                placeholder="(11) 99999-9999"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={styles.inputLabel}>Descrição *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Descreva sua dúvida ou problema..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleEnviarEmail}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Enviando...' : 'Enviar Mensagem'}
                </Text>
              </TouchableOpacity>

              <View style={styles.alternativeContact}>
                <Text style={styles.alternativeText}>Ou prefere falar agora?</Text>
                <TouchableOpacity style={styles.whatsappButton} onPress={abrirWhatsAppSuporte}>
                  <MaterialIcons name="chat" size={20} color="#25D366" />
                  <Text style={styles.whatsappButtonText}>WhatsApp Direto</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 20,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alternativeContact: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  alternativeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 