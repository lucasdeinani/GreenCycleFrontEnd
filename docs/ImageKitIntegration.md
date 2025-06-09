# Integração com ImageKit

## Visão Geral

A API do Green Cycle está integrada com o **ImageKit** para hospedagem otimizada de imagens. Todas as imagens de perfil são armazenadas no ImageKit e retornam URLs otimizadas.

## Formato de Resposta da API

### Upload Bem-sucedido:
```json
{
    "id_usuarios": 46,
    "imagem": "https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg",
    "file_id": "68462965b13a102537a489a7"
}
```

### Campos Retornados:
- **`id_usuarios`**: ID do usuário na base de dados
- **`imagem`**: URL otimizada da imagem no ImageKit
- **`file_id`**: ID único do arquivo no ImageKit (útil para operações futuras)

## Vantagens do ImageKit

### 🚀 **Performance**
- URLs otimizadas para diferentes dispositivos
- CDN global para carregamento rápido
- Compressão automática sem perda de qualidade

### 🎨 **Transformações**
- Redimensionamento dinâmico
- Diferentes formatos (WebP, AVIF)
- Filtros e efeitos automáticos

### 📱 **Responsividade**
- Imagens adaptadas ao tamanho da tela
- Carregamento progressivo
- Suporte a retina/alta resolução

## Implementação no ImageService

### Upload com Logs Detalhados:
```typescript
// Resposta após upload
if (response.status === 201 && response.data) {
  console.log('✅ Upload bem-sucedido:', {
    id_usuarios: response.data.id_usuarios,
    imagem: response.data.imagem,
    file_id: response.data.file_id
  });
  
  // A imagem já está otimizada pelo ImageKit
  await this.downloadAndCacheImage(userId, response.data.imagem);
}
```

### Verificação de URL do ImageKit:
```typescript
// Verificar se a URL é do ImageKit
static isImageKitUrl(imageUrl: string): boolean {
  return imageUrl.includes('ik.imagekit.io');
}

// Uso prático
const imageUrl = "https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg";
if (ImageService.isImageKitUrl(imageUrl)) {
  console.log('✅ Imagem hospedada no ImageKit');
}
```

### Obter Informações Completas:
```typescript
// Obter file_id e outras informações
const imageInfo = await ImageService.getProfileImageInfo(userId);
if (imageInfo) {
  console.log('File ID:', imageInfo.file_id);
  console.log('URL da imagem:', imageInfo.imagem);
}
```

## Cache Local vs ImageKit

### Estratégia Híbrida:
1. **Cache Local**: Para acesso offline rápido
2. **ImageKit**: Para versão mais recente e otimizada
3. **Fallback**: Imagem padrão se ambos falharem

### Fluxo de Carregamento:
```
1. Verificar cache local
   ↓
2. Se não existe, buscar na API (ImageKit URL)
   ↓  
3. Baixar e cachear localmente
   ↓
4. Exibir imagem otimizada
```

## URLs de Exemplo

### Estrutura Típica:
```
https://ik.imagekit.io/{imagekit_id}/{nome_arquivo}
```

### Exemplo Real:
```
https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg
```

### Componentes:
- **ik.imagekit.io**: Domínio do ImageKit
- **9bdssn5scf**: ID da conta ImageKit
- **foto_perfil_lucas.cliente.jpg**: Nome do arquivo

## Possíveis Transformações Dinâmicas

### Redimensionamento:
```
// Original
https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg

// Redimensionada para 150x150
https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg?tr=w-150,h-150

// Com qualidade ajustada
https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg?tr=w-150,h-150,q-80
```

### Parâmetros Úteis:
- `w-{width}`: Largura
- `h-{height}`: Altura  
- `q-{quality}`: Qualidade (1-100)
- `f-{format}`: Formato (webp, jpg, png)

## Debugging e Monitoramento

### Logs de Upload:
```typescript
// No console após upload bem-sucedido
✅ Upload bem-sucedido: {
  id_usuarios: 46,
  imagem: "https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg",
  file_id: "68462965b13a102537a489a7"
}
```

### Verificações de Integridade:
```typescript
// Verificar se URL é válida
const isValidImageKit = ImageService.isImageKitUrl(imageUrl);

// Verificar se imagem carrega
const response = await fetch(imageUrl);
const isAccessible = response.ok;

console.log('ImageKit URL válida:', isValidImageKit);
console.log('Imagem acessível:', isAccessible);
```

## Tratamento de Erros

### Casos Comuns:
1. **URL inválida**: Fallback para imagem padrão
2. **ImageKit indisponível**: Usar cache local
3. **Arquivo não encontrado**: Limpar cache e usar padrão

### Implementação:
```typescript
try {
  const cachedPath = await this.downloadAndCacheImage(userId, imageKitUrl);
  return cachedPath;
} catch (error) {
  console.warn('Erro ao baixar do ImageKit, usando padrão:', error);
  return DEFAULT_PROFILE_IMAGES[userType];
}
```

## Status da Integração

### ✅ **Implementado:**
- Upload para ImageKit via API
- Recebimento de URLs otimizadas
- Cache local das imagens do ImageKit
- Logs detalhados de upload
- Verificação de URLs do ImageKit
- Fallback para imagens padrão

### 🔄 **Futuras Melhorias:**
- Transformações dinâmicas de imagem
- Uso do `file_id` para operações diretas
- Otimização baseada no dispositivo
- Precarregamento inteligente 