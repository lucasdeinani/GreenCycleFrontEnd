import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PasswordResetModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ 
  visible, 
  onClose,
  onConfirm
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleStep1Submit = async () => {
    setLoading(true);
    try {
      // Verificação fictícia - será feita no onConfirm
      setStep(2);
    } catch (error) {
      Alert.alert('Erro', 'Senha atual incorreta');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const success = await onConfirm(currentPassword, newPassword);
      if (success) {
        Alert.alert('Sucesso', 'Senha alterada com sucesso!');
        onClose();
        resetForm();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStep(1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        onClose();
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => {
            onClose();
            resetForm();
          }}>
            <Feather name="x" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Feather name="settings" size={32} color="#4CAF50" />
            <Text style={styles.title}>Redefinir Senha</Text>
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.label}>Digite sua senha atual</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Senha atual"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <Feather name="eye-off" size={20} color="#666" />
                  ) : (
                    <Feather name="eye" size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleStep1Submit}
                disabled={loading || !currentPassword}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Verificando...' : 'Continuar'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Nova senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 8 caracteres"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <Feather name="eye-off" size={20} color="#666" />
                  ) : (
                    <Feather name="eye" size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Confirme a nova senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Digite novamente"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <Feather name="eye-off" size={20} color="#666" />
                  ) : (
                    <Feather name="eye" size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleStep2Submit}
                disabled={loading || !newPassword || !confirmPassword}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Salvando...' : 'Confirmar Alteração'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
  },
});