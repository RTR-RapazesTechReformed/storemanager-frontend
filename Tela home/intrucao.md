
# Dashboard - Sistema de Gestão

Um dashboard moderno e responsivo desenvolvido com HTML5, CSS3 e JavaScript Vanilla, seguindo princípios de Clean Code e preparado para integração com backend.

## 🚀 Características

- **Layout Responsivo**: Adapta-se perfeitamente a diferentes tamanhos de tela
- **Área de Rolagem Otimizada**: Sidebar direita com scroll personalizado para dados financeiros
- **Navegação Interativa**: Sistema de abas com feedback visual
- **Clean Code**: Código bem estruturado e documentado
- **Preparado para Backend**: Classes e métodos prontos para integração com APIs
- **Acessibilidade**: Suporte a navegação por teclado e foco visual

## 📁 Estrutura do Projeto

```
projeto-dashboard/
├── html/
│   └── index.html          # Página principal
├── css/
│   └── styles.css          # Estilos principais
├── js/
│   └── dashboard.js        # Lógica JavaScript
└── README.md              # Documentação
```

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com Flexbox e Grid
- **JavaScript Vanilla**: Lógica de interação sem dependências
- **CSS Custom Properties**: Variáveis CSS para fácil manutenção

## 🎨 Funcionalidades Implementadas

### Layout Principal
- Header com navegação por abas
- Área de gráficos com placeholder interativo
- Lista de cartas mais vendidas
- Sidebar financeira com dados roláveis

### Interatividade
- Navegação entre seções (Gestão Interna, Analytics, Estoque)
- Animações suaves de transição
- Hover effects em elementos interativos
- Sistema de loading states

### Responsividade
- Layout adaptativo para desktop, tablet e mobile
- Navegação otimizada para dispositivos móveis
- Sidebar que se adapta ao tamanho da tela

## 🚀 Como Executar

### Opção 1: Live Server (Recomendado)
1. Instale a extensão "Live Server" no VS Code
2. Abra o arquivo `html/index.html`
3. Clique com o botão direito e selecione "Open with Live Server"

### Opção 2: Servidor Local
1. Navegue até a pasta do projeto
2. Execute um servidor HTTP local:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (se tiver http-server instalado)
   npx http-server
   ```
3. Acesse `http://localhost:8000/html/`

### Opção 3: Arquivo Local
1. Abra o arquivo `html/index.html` diretamente no navegador
2. **Nota**: Algumas funcionalidades podem não funcionar devido a restrições de CORS

## 🎯 Funcionalidades Principais

### Sidebar Financeira (Área Problemática Resolvida)
A sidebar direita foi especialmente desenvolvida para resolver o problema de "dados que varam":

- **Container com altura fixa**: Evita que o conteúdo ultrapasse os limites
- **Scroll interno**: Área rolável independente do resto da página
- **Barra de rolagem personalizada**: Design consistente com o tema
- **Responsividade**: Adapta-se a diferentes tamanhos de tela

### Sistema de Navegação
- **Estados visuais claros**: Botão ativo destacado
- **Feedback de hover**: Interação visual ao passar o mouse
- **Navegação por teclado**: Suporte a Alt + 1-4 para trocar seções
- **Persistência**: Lembra a última seção visitada

## 🔧 Integração com Backend

O código foi estruturado para facilitar a integração com backend:

### Classes e Métodos Preparados
```javascript
// Configurações de API
const CONFIG = {
    API_BASE_URL: '/api',
    UPDATE_INTERVAL: 30000
};

// Métodos para carregamento de dados
loadFinancialData()      // Dados financeiros
loadSalesData()          // Dados de vendas
loadTopCardsData()       // Cartas mais vendidas
loadSectionData()        // Dados específicos por seção
```

### Endpoints Sugeridos
- `GET /api/financial` - Dados financeiros
- `GET /api/sales` - Dados de vendas
- `GET /api/cards/top` - Cartas mais vendidas
- `GET /api/sections/{section}` - Dados por seção

## 🎨 Customização

### Cores (CSS Custom Properties)
```css
:root {
    --primary-color: #00CED1;
    --secondary-color: #20B2AA;
    --success-color: #32CD32;
    --warning-color: #FFD700;
    --danger-color: #FF6B6B;
}
```

### Configurações JavaScript
```javascript
const CONFIG = {
    UPDATE_INTERVAL: 30000,     // Intervalo de atualização
    ANIMATION_DURATION: 300,    // Duração das animações
    STORAGE_PREFIX: 'dashboard_' // Prefixo do localStorage
};
```

## 📱 Responsividade

### Breakpoints
- **Desktop**: > 1024px - Layout completo
- **Tablet**: 768px - 1024px - Sidebar abaixo do conteúdo
- **Mobile**: < 768px - Layout em coluna única

### Adaptações Mobile
- Navegação em grid compacto
- Textos dos botões ocultados em telas pequenas
- Sidebar com altura automática
- Scroll otimizado para touch

## 🔍 Detalhes Técnicos

### Solução do Problema de Scroll
O problema original de "dados que varam" foi resolvido com:

1. **Container com altura máxima**:
   ```css
   .financial-container {
       max-height: calc(100vh - 200px);
       overflow-y: auto;
   }
   ```

2. **Scroll personalizado**:
   ```css
   .financial-container::-webkit-scrollbar {
       width: 6px;
   }
   ```

3. **Área adicional rolável**:
   ```css
   .scrollable-content {
       max-height: 300px;
       overflow-y: auto;
   }
   ```

### Performance
- **Will-change**: Otimização para animações
- **Debounce**: Eventos de resize otimizados
- **Lazy loading**: Preparado para carregamento sob demanda

## 🧪 Testes Realizados

✅ Layout visual correto
✅ Navegação entre seções funcionando
✅ Área de scroll na sidebar operacional
✅ Responsividade em diferentes tamanhos
✅ JavaScript sem erros no console
✅ Compatibilidade com Live Server

## 📞 Suporte

Para dúvidas sobre implementação ou customização, consulte os comentários no código ou a documentação inline.

## 📄 Licença

Este projeto foi desenvolvido como solução personalizada e pode ser modificado conforme necessário.

---

**Desenvolvido com ❤️ usando HTML5, CSS3 e JavaScript Vanilla**

