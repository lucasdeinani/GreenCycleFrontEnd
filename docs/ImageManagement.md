# Sistema de Gerenciamento de Imagens de Perfil

## Visão Geral

O sistema de gerenciamento de imagens de perfil do Green Cycle oferece uma solução completa para captura, upload, cache e exibição de imagens de perfil, com suporte para clientes e parceiros.

## Componentes Principais

### 1. ImageService (`services/ImageService.ts`)

Serviço principal responsável por:
- ✅ Gerenciamento de cache local
- ✅ Upload/download de imagens via API REST
- ✅ Captura de imagens via câmera/galeria
- ✅ Manipulação de permissões
- ✅ Fallback para imagens padrão

### 2. useProfileImage Hook (`hooks/useProfileImage.ts`)

Hook React personalizado que fornece:
- ✅ Estado de loading e atualização
- ✅ Função para atualizar imagem
- ✅ Função para deletar imagem
- ✅ Refresh automático
- ✅ Tratamento de erros

### 3. ProfileImage Component (`components/ProfileImage.tsx`)

Componente reutilizável com:
- ✅ Loading state visual
- ✅ Botão de edição integrado
- ✅ Suporte a diferentes tamanhos
- ✅ Customização de cores e bordas
- ✅ Indicadores visuais de estado

## API Endpoints

### Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/v1/imagens-perfil/` | Lista todas as imagens |
| `GET` | `/v1/imagens-perfil/{id_usuario}/` | Obter imagem específica |
| `POST` | `/v1/imagens-perfil/` | Upload de nova imagem |
| `DELETE` | `/v1/imagens-perfil/{id_usuario}/` | Remover imagem existente |

### Formato de Upload

```typescript
// FormData para upload
{
  id_usuarios: string,   // ID do usuário (campo plural)
  imagem: File          // Arquivo da imagem (JPEG)
}
```

### Resposta da API

```typescript
interface ProfileImage {
  id?: number;
  id_usuarios: number;
  imagem: string;           // URL da imagem no ImageKit
  file_id: string;          // ID do arquivo no ImageKit
  created_at?: string;
  updated_at?: string;
}
```

### Exemplo de Resposta de Upload:
```json
{
    "id_usuarios": 46,
    "imagem": "https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg",
    "file_id": "68462965b13a102537a489a7"
}
```

### Resposta quando usuário não tem imagem:
```json
{
    "detail": "No ImagemPerfil matches the given query."
}
```
**Comportamento**: Sistema detecta automaticamente e usa imagem padrão

## Fluxo de Funcionamento

### 1. Inicialização (Login)
```typescript
// No login, o cache é inicializado automaticamente
await ImageService.initializeCache();
```

### 2. Carregamento de Imagem
```typescript
// 1. Verificar cache local
const cachedImage = await ImageService.getCachedImage(userId);

// 2. Se não existe no cache, buscar na API
const response = await axios.get(`/v1/imagens-perfil/${userId}/`);

// 3. Se não existe na API, usar imagem padrão
const defaultImage = DEFAULT_PROFILE_IMAGES[userType];
```

### 3. Atualização de Imagem
```typescript
// 1. Usuário seleciona nova imagem
const imageUri = await ImageService.showImagePicker();

// 2. Delete imagem existente (se houver)
await ImageService.deleteProfileImage(userId);

// 3. Upload nova imagem
await ImageService.uploadProfileImage(userId, imageUri);

// 4. Limpar cache e recarregar
await ImageService.clearCacheForUser(userId);
```

## Cache Local

### Estratégia de Cache
- **Localização**: `${FileSystem.documentDirectory}profile_images/`
- **Formato**: `{userId}.jpg`
- **Validade**: Indefinida (limpa apenas quando necessário)
- **Fallback**: Imagem padrão via URL

### Gerenciamento
```typescript
// Inicializar cache
await ImageService.initializeCache();

// Limpar cache completo
await ImageService.clearCache();

// Limpar cache de usuário específico
await ImageService.clearCacheForUser(userId);
```

## Uso nos Componentes

### 1. Hook useProfileImage

```typescript
export default function ProfileScreen() {
  const { 
    imageUri, 
    isLoading, 
    isUpdating, 
    updateImage,
    deleteImage,
    refreshImage 
  } = useProfileImage();

  return (
    <ProfileImage
      imageUri={imageUri}
      isLoading={isLoading}
      isUpdating={isUpdating}
      editable={true}
      onPress={updateImage}
      borderColor="#4CAF50"
    />
  );
}
```

### 2. Componente ProfileImage

```typescript
<ProfileImage
  imageUri={imageUri}
  isLoading={isLoading}
  isUpdating={isUpdating}
  size={120}
  borderColor="#4CAF50"
  borderWidth={3}
  editable={isEditing}
  onPress={updateImage}
  loadingColor="#4CAF50"
/>
```

## Permissões Necessárias

### app.json
```json
{
  "plugins": [
    [
      "expo-image-picker",
      {
        "photosPermission": "custom photos permission",
        "cameraPermission": "Allow $(PRODUCT_NAME) to open the camera",
        "microphonePermission": false
      }
    ]
  ]
}
```

## Imagens Padrão

### URLs Configuradas
- **Cliente**: `https://images.unsplash.com/photo-1494790108377-be9c29b29330`
- **Parceiro**: `https://images.unsplash.com/photo-1534528741775-53994a69daeb`
- **Genérica**: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e`

## Estados de Loading

### Indicadores Visuais
- ✅ Loading durante carregamento inicial
- ✅ Loading durante upload/update
- ✅ Disabled state durante operações
- ✅ Erro com fallback automático

## Tratamento de Erros

### Estratégias
1. **Permissões negadas**: Alert informativo
2. **Erro de rede**: Retry automático com fallback
3. **Imagem inválida**: Validação e feedback
4. **Cache corrompido**: Limpeza e recarregamento
5. **API indisponível**: Uso de cache local

## Otimizações

### Performance
- ✅ Cache local para reduzir chamadas à API
- ✅ Compressão de imagem (quality: 0.8)
- ✅ Aspect ratio fixo (1:1) para consistência
- ✅ Loading states para melhor UX
- ✅ Lazy loading de imagens

### Memória
- ✅ Limpeza automática de cache
- ✅ Fallback para URLs externas
- ✅ Compression de imagens

## Troubleshooting

### Problemas Comuns

1. **Imagem não carrega**
   - Verificar conectividade
   - Limpar cache: `ImageService.clearCache()`
   - Verificar permissões

2. **Upload falha**
   - Verificar tamanho da imagem
   - Verificar conectividade
   - Verificar endpoint da API

3. **Cache não funciona**
   - Verificar permissões de escrita
   - Reinicializar: `ImageService.initializeCache()`

### Debug
```typescript
// Log de debug
console.log('Cache directory:', ImageService.CACHE_DIR);
console.log('User image:', await ImageService.getCachedImage(userId));
```

## Próximas Melhorias

- [ ] Suporte a múltiplas imagens
- [ ] Redimensionamento automático
- [ ] Sync automático em background
- [ ] Compression avançada
- [ ] Watermark automático
- [ ] Backup em cloud storage 