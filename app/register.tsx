import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';

const MATERIAL_OPTIONS = [
    'Metais',
    'Papeis',
    'Plastico',
    'Residuo Organico',
    'Residuo Hospitalar'
];

// URL base da API
const API_BASE_URL = 'http://10.0.0.160:8000/v1';

export default function RegisterScreen() {
    const [userType, setUserType] = useState<'client' | 'partner'>('client');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        document: '', // CPF or CNPJ
        gender: '',
        birthday: new Date(),
        username: '',
        password: '',
        confirmPassword: '',
        collectionMaterials: [] as string[], // Changed to array for multiple selections
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleMaterialToggle = (material: string) => {
        setFormData(prev => {
            const materials = prev.collectionMaterials.includes(material)
                ? prev.collectionMaterials.filter(m => m !== material)
                : [...prev.collectionMaterials, material];

            return { ...prev, collectionMaterials: materials };
        });
        if (errors.collectionMaterials) {
            setErrors(prev => ({ ...prev, collectionMaterials: null }));
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, birthday: selectedDate }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string | null> = {};

        if (!formData.fullName) newErrors.fullName = 'Nome é obrigatório';
        if (!formData.email) newErrors.email = 'Email é obrigatório';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';

        if (!formData.document) {
            newErrors.document = userType === 'client' ? 'CPF é obrigatório' : 'CNPJ é obrigatório';
        } else {
            const cleanDoc = formData.document.replace(/\D/g, '');
            if (userType === 'client' && cleanDoc.length !== 11) {
                newErrors.document = 'CPF inválido';
            } else if (userType === 'partner' && cleanDoc.length !== 14) {
                newErrors.document = 'CNPJ inválido';
            }
        }

        if (userType === 'client' && !formData.gender) {
            newErrors.gender = 'Sexo é obrigatório';
        }

        if (userType === 'partner' && formData.collectionMaterials.length === 0) {
            newErrors.collectionMaterials = 'Selecione pelo menos um material para coleta';
        }

        if (!formData.username) newErrors.username = 'Usuário é obrigatório';

        if (!formData.password) newErrors.password = 'Senha é obrigatória';
        else if (formData.password.length < 8) newErrors.password = 'Senha deve ter no mínimo 8 caracteres';

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Senhas não conferem';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setIsLoading(true);

            try {
                // 1. Criar usuário
                const userResponse = await axios.post(`${API_BASE_URL}/usuarios/`, {
                    nome: formData.fullName,
                    email: formData.email,
                    senha: formData.password,
                    id_endereco: null
                });

                const userId = userResponse.data.id;

                // 2. Criar cliente ou parceiro usando o ID do usuário recém-criado
                const endpoint = userType === 'client' ? 'clientes' : 'parceiros';
                const documentField = userType === 'client' ? 'cpf' : 'cnpj';

                const userTypeResponse = await axios.post(`${API_BASE_URL}/${endpoint}/`, {
                    [documentField]: formData.document,
                    id_usuarios: userId
                });

                Alert.alert(
                    'Sucesso',
                    'Cadastro realizado com sucesso!',
                    [{ text: 'OK', onPress: () => router.replace('/login') }]
                );

            } catch (error: any) {
                console.error('Erro ao criar cadastro:', error);

                let errorMessage = 'Não foi possível realizar o cadastro. Tente novamente.';
                if (error.response?.status === 400 && error.response.data) {
                    const errorDetails = Object.entries(error.response.data)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                    errorMessage += `\n\n${errorDetails}`;
                }
                Alert.alert('Erro', errorMessage);
            } finally {
                setIsLoading(false);
            }
        }
    };


    const handleUserTypeChange = (type: 'client' | 'partner') => {
        setUserType(type);
        if (type === 'client') {
            setFormData(prev => ({ ...prev, collectionMaterials: [] }));
        }
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={isLoading}
            >
                <ArrowLeft size={24} color="#4CAF50" />
                <Text style={styles.backButtonText}>Retorne ao Login</Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <Leaf size={40} color="#4CAF50" />
                <Text style={styles.title}>Crie sua conta</Text>
            </View>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, userType === 'client' && styles.toggleButtonActive]}
                    onPress={() => handleUserTypeChange('client')}
                    disabled={isLoading}
                >
                    <Text style={[styles.toggleText, userType === 'client' && styles.toggleTextActive]}>
                        Cliente
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, userType === 'partner' && styles.toggleButtonActive]}
                    onPress={() => handleUserTypeChange('partner')}
                    disabled={isLoading}
                >
                    <Text style={[styles.toggleText, userType === 'partner' && styles.toggleTextActive]}>
                        Parceiro
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome Completo</Text>
                    <TextInput
                        style={[styles.input, errors.fullName && styles.inputError]}
                        placeholder="Escreva seu nome completo"
                        value={formData.fullName}
                        onChangeText={(value) => handleChange('fullName', value)}
                        editable={!isLoading}
                    />
                    {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        placeholder="Escreva seu email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(value) => handleChange('email', value)}
                        editable={!isLoading}
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{userType === 'client' ? 'CPF' : 'CNPJ'}</Text>
                    <TextInput
                        style={[styles.input, errors.document && styles.inputError]}
                        placeholder={`Escreva seu ${userType === 'client' ? 'CPF' : 'CNPJ'}`}
                        keyboardType="numeric"
                        value={formData.document}
                        onChangeText={(value) => handleChange('document', value)}
                        maxLength={userType === 'client' ? 14 : 18}
                        editable={!isLoading}
                    />
                    {errors.document && <Text style={styles.errorText}>{errors.document}</Text>}
                </View>

                {userType === 'client' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Sexo</Text>
                        <View style={styles.genderContainer}>
                            {['Masculino', 'Feminino', 'Outro'].map((gender) => (
                                <TouchableOpacity
                                    key={gender}
                                    style={[
                                        styles.genderButton,
                                        formData.gender === gender && styles.genderButtonActive
                                    ]}
                                    onPress={() => handleChange('gender', gender)}
                                    disabled={isLoading}
                                >
                                    <Text style={[
                                        styles.genderButtonText,
                                        formData.gender === gender && styles.genderButtonTextActive
                                    ]}>
                                        {gender}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
                    </View>
                )}

                {userType === 'partner' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Materiais que deseja coletar</Text>
                        <View style={styles.materialContainer}>
                            {MATERIAL_OPTIONS.map((material) => (
                                <TouchableOpacity
                                    key={material}
                                    style={[
                                        styles.materialButton,
                                        formData.collectionMaterials.includes(material) && styles.materialButtonActive
                                    ]}
                                    onPress={() => handleMaterialToggle(material)}
                                    disabled={isLoading}
                                >
                                    <View style={styles.materialButtonContent}>
                                        <View style={[
                                            styles.checkbox,
                                            formData.collectionMaterials.includes(material) && styles.checkboxActive
                                        ]}>
                                            {formData.collectionMaterials.includes(material) && (
                                                <Check size={16} color="#FFFFFF" />
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.materialButtonText,
                                            formData.collectionMaterials.includes(material) && styles.materialButtonTextActive
                                        ]}>
                                            {material}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.collectionMaterials && (
                            <Text style={styles.errorText}>{errors.collectionMaterials}</Text>
                        )}
                    </View>
                )}

                {userType === 'client' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Aniversário</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => !isLoading && setShowDatePicker(true)}
                            disabled={isLoading}
                        >
                            <Text style={styles.dateText}>
                                {formData.birthday.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.birthday}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Usuário</Text>
                    <TextInput
                        style={[styles.input, errors.username && styles.inputError]}
                        placeholder="Escreva um nome de usuário"
                        autoCapitalize="none"
                        value={formData.username}
                        onChangeText={(value) => handleChange('username', value)}
                        editable={!isLoading}
                    />
                    {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholder="Digite sua senha"
                        secureTextEntry
                        value={formData.password}
                        onChangeText={(value) => handleChange('password', value)}
                        editable={!isLoading}
                    />
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirme a Senha</Text>
                    <TextInput
                        style={[styles.input, errors.confirmPassword && styles.inputError]}
                        placeholder="Confirme sua senha"
                        secureTextEntry
                        value={formData.confirmPassword}
                        onChangeText={(value) => handleChange('confirmPassword', value)}
                        editable={!isLoading}
                    />
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.registerButtonText}>Cadastrando...</Text>
                        </View>
                    ) : (
                        <Text style={styles.registerButtonText}>Finalizar Cadastro</Text>
                    )}
                </TouchableOpacity>
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
        color: '#4CAF50',
    },
    header: {
        alignItems: 'center',
        marginVertical: 20,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Roboto-Bold',
        color: '#333333',
        marginTop: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        margin: 16,
    }
});