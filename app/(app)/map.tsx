import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, X, Info, LocateFixed } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapView, { Marker, MapViewProps } from 'react-native-maps';
import { fetchPontosColeta, fetchMateriais } from '../services/api';

// Tipagens para Materiais
interface Material {
  id: number;
  nome: string;
  descricao: string;
  preco: string;
}

// Tipagens para Endereços
interface Endereco {
  id: number;
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: number;
  complemento?: string;
  latitude: number;
  longitude: number;
}

// Tipagens para Parceiros
interface Parceiro {
  id: number;
  id_usuarios: number;
  cnpj: string;
}

// Tipagens para Pontos Coleta
interface PontoColeta {
  id: number;
  nome: string;
  id_enderecos: Endereco;
  descricao: string;
  horario_funcionamento: string;
  id_parceiros: Parceiro;
  materiais: Material[];
}

// Tipagem para coordenadas
interface Coordinates {
  latitude: number;
  longitude: number;
}

// Tipagem estendida para PontoColeta com distância
interface PontoColetaComDistancia extends PontoColeta {
  distancia?: number;
}

// Função para calcular distância entre duas coordenadas (Haversine formula)
const calcularDistancia = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * 
    Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distância em km
};

// Função para formatar a distância
const formatarDistancia = (distancia: number): string => {
  if (distancia < 1) {
    return `${Math.round(distancia * 1000)} m`;
  }
  return `${distancia.toFixed(1)} km`;
};

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pontosColeta, setPontosColeta] = useState<PontoColetaComDistancia[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [filtroMateriais, setFiltroMateriais] = useState<number[]>([]);
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoColetaComDistancia | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marcadorDestaque, setMarcadorDestaque] = useState<Coordinates | null>(null);
  const mapRef = useRef<MapView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Efeito para limpar o marcador destacado quando o modal fecha
  useEffect(() => {
    if (!modalVisible) {
      setMarcadorDestaque(null);
    }
  }, [modalVisible]);

  // Função para centralizar no mapa na localização inicial
  const centralizarNoMapa = useCallback(() => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 500);
    }
  }, [location]);

  // Função para calcular e ordenar pontos por distância
  const calcularEOrdenarPontos = useCallback((pontos: PontoColeta[], userLocation: Location.LocationObject) => {
    return pontos.map(ponto => {
      const distancia = calcularDistancia(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude
        },
        {
          latitude: ponto.id_enderecos.latitude,
          longitude: ponto.id_enderecos.longitude
        }
      );
      return { ...ponto, distancia };
    }).sort((a, b) => (a.distancia || 0) - (b.distancia || 0));
  }, []);

  // Função para rolar até o mapa
  const rolarAteMapa = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Solicitar permissão de localização
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão para acessar a localização foi negada');
          setLoading(false);
          return;
        }

        // Obter localização atual
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        // Buscar dados da API
        const [materiaisData, pontosData] = await Promise.all([
          fetchMateriais(),
          fetchPontosColeta()
        ]);

        // Calcular distâncias e ordenar
        const pontosComDistancia = calcularEOrdenarPontos(pontosData, location);

        setMateriais(materiaisData);
        setPontosColeta(pontosComDistancia);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [calcularEOrdenarPontos]);

  // Função para obter os nomes dos materiais de um ponto específico
  const getNomesMateriais = (ponto: PontoColeta) => {
    return ponto.materiais.map(m => m.nome).join(', ');
  };

  // Função para alternar o filtro de materiais
  const toggleFiltroMaterial = (materialId: number) => {
    setFiltroMateriais(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  // Filtrar pontos de coleta com base nos materiais selecionados
  const pontosFiltrados = filtroMateriais.length > 0
    ? pontosColeta.filter(ponto =>
        ponto.materiais.some(material => filtroMateriais.includes(material.id)))
    : pontosColeta;

  // Função para abrir o modal com detalhes do ponto
  const abrirDetalhesPonto = (ponto: PontoColetaComDistancia) => {
    // Fecha o modal se estiver aberto (para garantir a atualização)
    setModalVisible(false);
    
    // Atualiza o ponto selecionado e o marcador destacado
    setPontoSelecionado(ponto);
    setMarcadorDestaque({
      latitude: ponto.id_enderecos.latitude,
      longitude: ponto.id_enderecos.longitude
    });
    
    // Centraliza o mapa no ponto selecionado
    mapRef.current?.animateToRegion({
      latitude: ponto.id_enderecos.latitude,
      longitude: ponto.id_enderecos.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
    
    // Rola a tela até o mapa
    rolarAteMapa();
    
    // Abre o modal após um pequeno delay para garantir a atualização
    setTimeout(() => {
      setModalVisible(true);
    }, 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

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
    if (!location) return null;

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Sua localização"
          pinColor="#4CAF50"
        />

        {/* Marcador destacado */}
        {marcadorDestaque && (
          <Marker
            coordinate={marcadorDestaque}
            pinColor="#FF5722" // Cor laranja para destacar
            zIndex={999} // Garante que fique acima dos outros
          />
        )}

        {pontosFiltrados.map(ponto => (
          <Marker
            key={ponto.id}
            coordinate={{
              latitude: ponto.id_enderecos.latitude,
              longitude: ponto.id_enderecos.longitude,
            }}
            title={ponto.nome}
            description={`${getNomesMateriais(ponto)} (${ponto.distancia !== undefined ? formatarDistancia(ponto.distancia) : 'N/D'})`}
            onPress={() => abrirDetalhesPonto(ponto)}
          />
        ))}
      </MapView>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      ref={scrollViewRef}
    >
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
        {/* Botão de centralizar */}
        <TouchableOpacity
          style={styles.centralizarButton}
          onPress={centralizarNoMapa}
        >
          <LocateFixed size={24} color="#333333" />
        </TouchableOpacity>
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
                <Text style={styles.pontoEndereco}>
                  {ponto.id_enderecos.rua}, {ponto.id_enderecos.numero} - {ponto.id_enderecos.bairro}
                </Text>
              </View>
              {ponto.distancia !== undefined && (
                <Text style={styles.pontoDistancia}>
                  {formatarDistancia(ponto.distancia)}
                </Text>
              )}
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
                <Text style={styles.modalSubtitle}>Distância</Text>
                <Text style={styles.modalText}>
                  {pontoSelecionado.distancia !== undefined 
                    ? formatarDistancia(pontoSelecionado.distancia)
                    : 'Não disponível'}
                </Text>

                <Text style={styles.modalSubtitle}>Descrição</Text>
                <Text style={styles.modalText}>{pontoSelecionado.descricao}</Text>

                <Text style={styles.modalSubtitle}>Materiais</Text>
                <Text style={styles.modalText}>{getNomesMateriais(pontoSelecionado)}</Text>

                <Text style={styles.modalSubtitle}>Horário de Funcionamento</Text>
                <Text style={styles.modalText}>{pontoSelecionado.horario_funcionamento}</Text>

                <Text style={styles.modalSubtitle}>Endereço</Text>
                <Text style={styles.modalText}>
                  {pontoSelecionado.id_enderecos.rua}, {pontoSelecionado.id_enderecos.numero}
                  {pontoSelecionado.id_enderecos.complemento ? ` - ${pontoSelecionado.id_enderecos.complemento}` : ''}{'\n'}
                  {pontoSelecionado.id_enderecos.bairro}, {pontoSelecionado.id_enderecos.cidade} - {pontoSelecionado.id_enderecos.estado}{'\n'}
                  CEP: {pontoSelecionado.id_enderecos.cep}
                </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  map: {
    width: '100%',
    height: '100%',
  },
  centralizarButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
    marginRight: 8,
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
    marginBottom: 4,
  },
  pontoEndereco: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  pontoDistancia: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
    minWidth: 60,
    textAlign: 'right',
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