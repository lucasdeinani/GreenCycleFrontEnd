import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf } from 'lucide-react-native';

// Temporary mock data
const mockOrders = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  orderNumber: `Pedido ${i + 1}`,
  details: `Detalhes do pedido ${i + 1}`,
}));

export default function OrderScreen() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
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

      <View style={styles.content}>
        {mockOrders.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.orderCard}
            onPress={() => handleOrderPress(item)}
          >
            <Text style={styles.orderText}>{item.orderNumber}</Text>
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
            <Text style={styles.modalDetails}>
              {selectedOrder?.details}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
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
  orderText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 16,
  },
  modalDetails: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
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