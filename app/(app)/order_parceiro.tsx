import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf } from 'lucide-react-native';

// Temporary mock data with more partner-specific details
const mockOrders = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  orderNumber: `Pedido ${i + 1}`,
  details: `Detalhes do pedido ${i + 1}`,
  status: ['Pendente', 'Em Coleta', 'Finalizado'][Math.floor(Math.random() * 3)],
  type: ['Metais', 'Papeis', 'Plastico', 'Residuo Organico', 'Residuo Hospitalar'][Math.floor(Math.random() * 5)],
  address: `Rua ${i + 1}, Bairro ${i + 1}`,
  scheduledDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
}));

export default function OrderParceiroScreen() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendente':
        return '#FFC107';
      case 'Em Coleta':
        return '#2196F3';
      case 'Finalizado':
        return '#4CAF50';
      default:
        return '#666666';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Pedidos de Coleta</Text>

      <View style={styles.content}>
        {mockOrders.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.orderCard}
            onPress={() => handleOrderPress(item)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderType}>{item.type}</Text>
              <Text style={styles.orderDate}>{item.scheduledDate}</Text>
            </View>
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
            <Text style={styles.modalTitle}>
              {selectedOrder?.orderNumber}
            </Text>
            <View style={styles.modalDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder?.status) }]}>
                  <Text style={styles.statusText}>{selectedOrder?.status}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo:</Text>
                <Text style={styles.detailValue}>{selectedOrder?.type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Endereço:</Text>
                <Text style={styles.detailValue}>{selectedOrder?.address}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data Agendada:</Text>
                <Text style={styles.detailValue}>{selectedOrder?.scheduledDate}</Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.actionButtonText}>Iniciar Coleta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#666666' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.actionButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Leaf size={40} color="#4CAF50" />
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
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderType: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 24,
  },
  modalDetails: {
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#666666',
    width: 120,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
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