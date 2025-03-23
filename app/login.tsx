import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Pressable, Modal } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Leaf, X } from 'lucide-react-native';

export default function LoginScreen() {
  const [userType, setUserType] = useState<'user' | 'partner'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleLogin = () => {
    if (userType === 'user') {
      router.replace('/(app)/menu');
    } else {
      router.replace('/(app)/menu_parceiro');
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleRecoverPassword = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setShowForgotPassword(false);
      setRecoveryEmail('');
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Leaf size={60} color="#4CAF50" />
        <Text style={styles.title}>Green Cycle</Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, userType === 'user' && styles.toggleButtonActive]}
          onPress={() => setUserType('user')}
        >
          <Text style={[styles.toggleText, userType === 'user' && styles.toggleTextActive]}>
            Cliente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, userType === 'partner' && styles.toggleButtonActive]}
          onPress={() => setUserType('partner')}
        >
          <Text style={[styles.toggleText, userType === 'partner' && styles.toggleTextActive]}>
            Parceiro
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Usuário</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Digite seu usuário"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Senha</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Digite sua senha"
            placeholderTextColor="#999"
          />
          <Pressable
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={24} color="#999" />
            ) : (
              <Eye size={24} color="#999" />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.forgotPassword}
        onPress={() => setShowForgotPassword(true)}
      >
        <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
      </TouchableOpacity>

      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowForgotPassword(false)}
            >
              <X size={24} color="#666666" />
            </TouchableOpacity>

            {!showSuccessMessage ? (
              <>
                <Text style={styles.modalTitle}>
                  Digite seu email para recuperar a senha
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={recoveryEmail}
                  onChangeText={setRecoveryEmail}
                  placeholder="Digite seu email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.recoverButton}
                  onPress={handleRecoverPassword}
                >
                  <Text style={styles.recoverButtonText}>
                    Recuperar Senha
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.successMessage}>
                Enviamos um email para recuperação da sua senha, verifique sua caixa de entrada
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Roboto-Bold',
    fontSize: 24,
    color: '#4CAF50',
    marginTop: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFC107',
  },
  toggleText: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#666',
  },
  toggleTextActive: {
    color: '#333333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Roboto-Medium',
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
  },
  eyeIcon: {
    padding: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  button: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  forgotPassword: {
    marginTop: 24,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#333333',
    marginBottom: 16,
  },
  recoverButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  recoverButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#4CAF50',
    textAlign: 'center',
    lineHeight: 24,
  },
});