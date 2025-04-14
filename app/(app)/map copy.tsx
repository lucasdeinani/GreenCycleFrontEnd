import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, X, Info } from 'lucide-react-native';
import * as Location from 'expo-location';

// Tipagem para os pontos de coleta
interface Material {
    id: number;
    nome: string;
  }

  interface Endereco {
    id: number;
    cep: string;
    estado: string;
    cidade: string;
    bairro: string;
    rua: string;
    numero: number;
    complemento?: string;
    latitude?: number;
    longitude?: number;
}

interface Parceiro {
    id: number;
    cnpj: string;
    id_usuarios: number;
}

interface PontoColeta {
    id: number;
    nome: string;
    id_enderecos: number;
    // endereco?: Endereco;
    descricao: string;
    horario_funcionamento: string;
    id_parceiros: number;
    materiais: number[];
    materiaisInfo?: Material[];
}

// Platform-specific map imports
let MapView, Marker;
if (Platform.OS !== 'web') {
    try {
        const RNMaps = require('react-native-maps');
        MapView = RNMaps.default;
        Marker = RNMaps.Marker;
    } catch (err) {
        console.warn('react-native-maps failed to load:', err);
    }
}

export default function MapScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [pontosColeta, setPontosColeta] = useState<PontoColeta[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [filtroMateriais, setFiltroMateriais] = useState<number[]>([]);
    const [pontoSelecionado, setPontoSelecionado] = useState<PontoColeta | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        (async () => {
            // Solicitar permissão de localização
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            // Obter localização atual
            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);

            // Buscar materiais disponíveis da API
            fetchMateriais();

            // Buscar pontos de coleta da API
            fetchPontosColeta();
        })();
    }, []);

    // Função para buscar materiais da API
    const fetchMateriais = async () => {
        try {
            const response = await fetch('http://localhost:8000/v1/materiais/');
            const data = await response.json();
            setMateriais(data);

            // Dados de exemplo caso a API não esteja disponível
            /* 
            const materiaisExemplo: Material[] = [
              { id: 1, nome: 'Papel' },
              { id: 2, nome: 'Plástico' },
              { id: 3, nome: 'Vidro' },
              { id: 4, nome: 'Metal' },
              { id: 5, nome: 'Eletrônicos' },
              { id: 6, nome: 'Óleo' },
              { id: 7, nome: 'Pilhas' },
            ];
            setMateriais(materiaisExemplo);
            */
        } catch (error) {
            console.error('Erro ao buscar materiais:', error);
            // Fallback para dados locais em caso de erro
            const materiaisExemplo: Material[] = [
                { id: 1, nome: 'Papel' },
                { id: 2, nome: 'Plástico' },
                { id: 3, nome: 'Vidro' },
                { id: 4, nome: 'Metal' },
                { id: 5, nome: 'Eletrônicos' },
                { id: 6, nome: 'Óleo' },
                { id: 7, nome: 'Pilhas' },
            ];
            setMateriais(materiaisExemplo);
        }
    };

    // Função para buscar pontos de coleta da API
    const fetchPontosColeta = async () => {
        try {
          // Buscar pontos de coleta da API
          const response = await fetch('http://localhost:8000/v1/pontos-coleta/');
          if (!response.ok) throw new Error('Erro ao buscar pontos de coleta');
          
          const pontosData: PontoColeta[] = await response.json();
      
          // Processar cada ponto para adicionar coordenadas geográficas
          const pontosComCoordenadas = await Promise.all(
            pontosData.map(async (ponto) => {
              const coordenadas = await geocodificarEndereco(ponto.id_enderecos);
              return {
                ...ponto,
                endereco: {
                  ...ponto.id_enderecos,
                  latitude: coordenadas?.latitude,
                  longitude: coordenadas?.longitude
                }
              };
            })
          );
      
          setPontosColeta(pontosComCoordenadas);
        } catch (error) {
          console.error('Erro ao buscar pontos de coleta:', error);
          Alert.alert('Erro', 'Não foi possível carregar os pontos de coleta');
        }
    };

    // Função para obter os nomes dos materiais de um ponto específico
    const getNomesMateriais = (ponto: PontoColeta) => {
        return ponto.materiais.map(m => m.nome).join(', ');
    };

    // Função para alternar o filtro de materiais
    const toggleFiltroMaterial = (materialId: number) => {
        if (filtroMateriais.includes(materialId)) {
            setFiltroMateriais(filtroMateriais.filter(id => id !== materialId));
        } else {
            setFiltroMateriais([...filtroMateriais, materialId]);
        }
    };

    // Filtrar pontos de coleta com base nos materiais selecionados
    const pontosFiltrados = filtroMateriais.length > 0
        ? pontosColeta.filter(ponto =>
            ponto.materiais.some(materialId => filtroMateriais.includes(materialId))
        )
        : pontosColeta;

    // Função para abrir o modal com detalhes do ponto
    const abrirDetalhesPonto = (ponto: PontoColeta) => {
        setPontoSelecionado(ponto);
        setModalVisible(true);
    };

    // Função para geocodificar um endereço
    const geocodificarEndereco = async (endereco: Endereco) => {
        // Se já tiver latitude e longitude (vindo da API), retorne
        if (endereco.latitude && endereco.longitude) {
          return {
            latitude: endereco.latitude,
            longitude: endereco.longitude
          };
        }
      
        try {
          const enderecoFormatado = `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}, Brasil`;
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(enderecoFormatado)}&key=SUA_API_KEY`
          );
          const data = await response.json();
      
          if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
            return data.results[0].geometry.location;
          }
          return null;
        } catch (error) {
          console.error('Erro na geocodificação:', error);
          return null;
        }
    };

    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#333333" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderMapContent = () => {
        if (Platform.OS === 'web') {
            return (
                <iframe
                    src={`https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${location?.coords.latitude},${location?.coords.longitude}&zoom=15`}
                    style={{
                        border: 0,
                        width: '100%',
                        height: '100%',
                        minHeight: 400,
                    }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            );
        } else if (location && MapView) {
            return (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    {Marker && (
                        <Marker
                            coordinate={{
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            }}
                            title="Sua localização"
                            pinColor="#4CAF50"
                        />
                    )}

                    {pontosFiltrados.map(ponto => (
                        ponto.endereco?.latitude && ponto.endereco?.longitude && Marker && (
                            <Marker
                                key={ponto.id}
                                coordinate={{
                                    latitude: ponto.endereco.latitude,
                                    longitude: ponto.endereco.longitude,
                                }}
                                title={ponto.nome}
                                description={getNomesMateriais(ponto)}
                                onPress={() => abrirDetalhesPonto(ponto)}
                            />
                        )
                    ))}
                </MapView>
            );
        }

        return (
            <View style={[styles.mapContainer, styles.loadingContainer]}>
                <Text>Carregando mapa...</Text>
            </View>
        );
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

            {/* Filtros de materiais */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtrosContainer}
                contentContainerStyle={styles.filtrosContent}
            >
                {materiais.map(material => (
                    <TouchableOpacity
                        key={material.id}
                        style={[
                            styles.filtroBtn,
                            filtroMateriais.includes(material.id) && styles.filtroBtnActive
                        ]}
                        onPress={() => toggleFiltroMaterial(material.id)}
                    >
                        <Text
                            style={[
                                styles.filtroBtnText,
                                filtroMateriais.includes(material.id) && styles.filtroBtnTextActive
                            ]}
                        >
                            {material.nome}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Mapa */}
            <View style={styles.mapContainer}>
                {renderMapContent()}
            </View>

            {/* Lista de pontos de coleta */}
            <View style={styles.listaContainer}>
                <Text style={styles.listaTitle}>Pontos de Coleta</Text>
                {pontosFiltrados.length === 0 ? (
                    <Text style={styles.emptyListText}>
                        Nenhum ponto de coleta encontrado para os filtros selecionados
                    </Text>
                ) : (
                    pontosFiltrados.map(ponto => (
                        <TouchableOpacity
                            key={ponto.id}
                            style={styles.pontoItem}
                            onPress={() => abrirDetalhesPonto(ponto)}
                        >
                            <View style={styles.pontoItemContent}>
                                <Text style={styles.pontoNome}>{ponto.nome}</Text>
                                <Text style={styles.pontoMateriais}>
                                    Materiais: {getNomesMateriais(ponto)}
                                </Text>
                            </View>
                            <Info size={24} color="#4CAF50" />
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Modal de detalhes do ponto */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {pontoSelecionado?.nome}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <X size={24} color="#333333" />
                            </TouchableOpacity>
                        </View>

                        {pontoSelecionado && (
                            <ScrollView style={styles.modalBody}>
                                <Text style={styles.modalSubtitle}>Descrição</Text>
                                <Text style={styles.modalText}>{pontoSelecionado.descricao}</Text>

                                <Text style={styles.modalSubtitle}>Materiais</Text>
                                <Text style={styles.modalText}>{getNomesMateriais(pontoSelecionado)}</Text>

                                <Text style={styles.modalSubtitle}>Horário de Funcionamento</Text>
                                <Text style={styles.modalText}>{pontoSelecionado.horario_funcionamento}</Text>

                                <Text style={styles.modalSubtitle}>Endereço</Text>
                                {pontoSelecionado.endereco && (
                                    <Text style={styles.modalText}>
                                        {pontoSelecionado.endereco.rua}, {pontoSelecionado.endereco.numero}{pontoSelecionado.endereco.complemento ? ` - ${pontoSelecionado.endereco.complemento}` : ''}{'\n'}
                                        {pontoSelecionado.endereco.bairro}, {pontoSelecionado.endereco.cidade} - {pontoSelecionado.endereco.estado}{'\n'}
                                        CEP: {pontoSelecionado.endereco.cep}
                                    </Text>
                                )}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeModalButtonText}>Fechar</Text>
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
    errorText: {
        padding: 16,
        color: 'red',
        textAlign: 'center',
    },
    mapContainer: {
        height: 400,
        marginBottom: 16,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    filtrosContainer: {
        maxHeight: 60,
        marginBottom: 10,
    },
    filtrosContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    filtroBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#EEEEEE',
        marginRight: 8,
    },
    filtroBtnActive: {
        backgroundColor: '#4CAF50',
    },
    filtroBtnText: {
        fontSize: 14,
        color: '#333333',
    },
    filtroBtnTextActive: {
        color: '#FFFFFF',
    },
    listaContainer: {
        padding: 16,
    },
    listaTitle: {
        fontSize: 18,
        fontFamily: 'Roboto-Medium',
        marginBottom: 8,
        color: '#333333',
    },
    emptyListText: {
        textAlign: 'center',
        padding: 16,
        color: '#666666',
    },
    pontoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    pontoItemContent: {
        flex: 1,
    },
    pontoNome: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 4,
    },
    pontoMateriais: {
        fontSize: 14,
        color: '#666666',
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
    // Estilos para o modal
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        maxHeight: 400,
    },
    modalSubtitle: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#4CAF50',
        marginTop: 12,
        marginBottom: 4,
    },
    modalText: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 8,
    },
    closeModalButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    closeModalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
    },
});