# Funcionalidade de Verificação Automática de Imagens

## Visão Geral

O sistema Green Cycle agora possui uma funcionalidade que **sempre verifica se houve mudanças na imagem de perfil** na API, mesmo quando existe uma imagem salva localmente no cache.

## Como Funciona

### 1. Carregamento Rápido + Verificação em Background

```typescript
// 1. Carrega imagem do cache IMEDIATAMENTE (UX rápida)
const cachedImage = await getCachedImage(userId);
if (cachedImage) {
  // Exibe a imagem do cache
  setImageUri(cachedImage);
  
  // Em paralelo, verifica se há atualizações na API
  checkForImageUpdates(userId, userType, cachedImage);
}
```

### 2. Comparação de URLs

O sistema salva metadados junto com cada imagem em cache:

```json
{
  "originalUrl": "https://ik.imagekit.io/9bdssn5scf/foto_perfil_lucas.cliente.jpg",
  "cachedAt": "2025-01-27T10:30:00.000Z",
  "userId": 46
}
```

### 3. Detecção Automática de Mudanças

```typescript
const cachedImageUrl = await getCachedImageUrl(userId);
const apiImageUrl = response.data.imagem;

if (cachedImageUrl !== apiImageUrl) {
  // Nova imagem detectada!
  console.log('🔄 Nova imagem detectada na API, atualizando cache...');
  downloadAndCacheImage(userId, apiImageUrl);
}
```

## Cenários Suportados

### ✅ Imagem Atualizada por Outro Dispositivo
- **Situação**: Usuário mudou foto no outro dispositivo/navegador
- **Comportamento**: App detecta automaticamente e atualiza

### ✅ Imagem Removida
- **Situação**: Usuário deletou foto de perfil
- **Comportamento**: Cache é limpo, volta para imagem padrão

### ✅ Nova Imagem Adicionada
- **Situação**: Usuário que não tinha foto agora tem
- **Comportamento**: Baixa e exibe nova imagem automaticamente

### ✅ Falhas de Rede
- **Situação**: Sem internet ou API indisponível
- **Comportamento**: Continua usando cache, falha silenciosa

## Logs de Depuração

O sistema produz logs detalhados para acompanhar o processo:

```
📁 Imagem encontrada no cache, verificando atualizações em background...
🔄 Verificando atualizações da imagem em background...
📷 URL antiga: https://old-image.jpg
📷 URL nova: https://new-image.jpg
🔄 Nova imagem detectada na API, atualizando cache...
✅ Cache atualizado com nova imagem
```

## Implementação Técnica

### ImageService.ts

- `downloadAndCacheImage()`: Salva metadados junto com imagem
- `checkForImageUpdates()`: Verifica mudanças em background
- `getCachedImageUrl()`: Obtém URL original para comparação

### useProfileImage.ts

- `checkForUpdatesInBackground()`: Hook que atualiza estado quando detecta mudanças
- Sincronização automática com `UserContext`

### Arquivos de Cache

```
profile_images/
├── 46.jpg                 # Imagem do usuário 46
├── 46_metadata.json       # Metadados (URL original, timestamp)
├── 47.jpg                 # Imagem do usuário 47
└── 47_metadata.json       # Metadados
```

## Performance

- **Primeira exibição**: Instantânea (cache local)
- **Verificação API**: Em background, não bloqueia UI
- **Bandwidth**: Só baixa se URL mudou realmente
- **Frequência**: A cada carregamento do hook (abertura de tela)

## Benefícios

1. **UX Rápida**: Imagem aparece instantaneamente
2. **Sempre Atualizada**: Detecta mudanças automaticamente
3. **Eficiente**: Só baixa quando necessário
4. **Confiável**: Funciona offline com cache
5. **Transparente**: Usuário não percebe a verificação

## Casos de Teste

### Teste 1: Mudança de Imagem Externa
1. Usuário A muda foto no navegador web
2. Usuário A abre app mobile
3. ✅ App detecta mudança e atualiza automaticamente

### Teste 2: Remoção de Imagem
1. Usuário remove foto de perfil via API
2. Usuário abre app
3. ✅ Cache é limpo, volta para imagem padrão

### Teste 3: Primeiro Login
1. Usuário nunca teve foto
2. Usuário adiciona foto via outro dispositivo
3. Usuário abre app
4. ✅ Nova foto é detectada e baixada

## Configuração

A funcionalidade está habilitada por padrão para todos os usuários. Não há configurações específicas necessárias.

## Troubleshooting

- **Logs**: Verificar console para mensagens de debug
- **Cache**: Localizado em `${FileSystem.documentDirectory}profile_images/`
- **Metadados**: Arquivo `{userId}_metadata.json` junto a cada imagem
- **Limpar**: `ImageService.clearCacheForUser(userId)` se necessário 