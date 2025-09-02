/**
 * Dashboard Management System
 * JavaScript Vanilla - Clean Code Implementation
 * Preparado para integração com backend
 */

// ===== CONFIGURAÇÕES E CONSTANTES =====
const CONFIG = {
    API_BASE_URL: '/api', // Base URL para futuras chamadas de API
    UPDATE_INTERVAL: 30000, // Intervalo de atualização em ms (30s)
    ANIMATION_DURATION: 300, // Duração das animações em ms
    STORAGE_PREFIX: 'dashboard_' // Prefixo para localStorage
};

// Seletores de elementos principais
const SELECTORS = {
    navButtons: '.nav-button',
    activeNavButton: '.nav-button.active',
    financialValues: '.financial-value',
    chartContainer: '#sales-chart',
    topCardsList: '#top-cards-list',
    additionalData: '#additional-data',
    scrollableContent: '.scrollable-content'
};

// ===== CLASSES PRINCIPAIS =====

/**
 * Classe principal para gerenciamento do Dashboard
 */
class DashboardManager {
    constructor() {
        this.currentSection = 'gestao-interna';
        this.isLoading = false;
        this.updateTimer = null;
        
        this.init();
    }

    /**
     * Inicializa o dashboard
     */
    init() {
        this.bindEvents();
        this.loadInitialData();
        this.startAutoUpdate();
        
        console.log('Dashboard inicializado com sucesso');
    }

    /**
     * Vincula eventos aos elementos da interface
     */
    bindEvents() {
        // Navegação principal
        this.bindNavigationEvents();
        
        // Eventos de scroll personalizado
        this.bindScrollEvents();
        
        // Eventos de redimensionamento
        this.bindResizeEvents();
        
        // Eventos de teclado para acessibilidade
        this.bindKeyboardEvents();
    }

    /**
     * Vincula eventos de navegação
     */
    bindNavigationEvents() {
        const navButtons = document.querySelectorAll(SELECTORS.navButtons);
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.dataset.section;
                this.switchSection(section, button);
            });
        });
    }

    /**
     * Vincula eventos de scroll
     */
    bindScrollEvents() {
        const scrollableElements = document.querySelectorAll(SELECTORS.scrollableContent);
        
        scrollableElements.forEach(element => {
            element.addEventListener('scroll', this.handleScroll.bind(this));
        });
    }

    /**
     * Vincula eventos de redimensionamento
     */
    bindResizeEvents() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    /**
     * Vincula eventos de teclado para acessibilidade
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Navegação por teclado (Tab + números 1-4)
            if (e.altKey && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const sections = ['gestao-interna', 'mercado-externo', 'analytics', 'estoque'];
                const sectionIndex = parseInt(e.key) - 1;
                const button = document.querySelector(`[data-section="${sections[sectionIndex]}"]`);
                if (button) {
                    this.switchSection(sections[sectionIndex], button);
                }
            }
        });
    }

    /**
     * Troca de seção ativa
     */
    switchSection(sectionName, buttonElement) {
        if (this.currentSection === sectionName || this.isLoading) {
            return;
        }

        // Atualiza estado visual
        this.updateActiveNavigation(buttonElement);
        
        // Atualiza seção atual
        this.currentSection = sectionName;
        
        // Carrega dados da seção
        this.loadSectionData(sectionName);
        
        // Salva preferência no localStorage
        this.saveUserPreference('activeSection', sectionName);
        
        console.log(`Seção alterada para: ${sectionName}`);
    }

    /**
     * Atualiza navegação ativa
     */
    updateActiveNavigation(activeButton) {
        // Remove classe ativa de todos os botões
        document.querySelectorAll(SELECTORS.navButtons).forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adiciona classe ativa ao botão clicado
        activeButton.classList.add('active');
    }

    /**
     * Carrega dados iniciais do dashboard
     */
    async loadInitialData() {
        this.setLoadingState(true);
        
        try {
            // Simula carregamento de dados (substituir por chamadas reais de API)
            await this.loadFinancialData();
            await this.loadSalesData();
            await this.loadTopCardsData();
            await this.loadAdditionalData();
            
            // Restaura preferências do usuário
            this.restoreUserPreferences();
            
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showErrorMessage('Erro ao carregar dados do dashboard');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Carrega dados financeiros
     */
    async loadFinancialData() {
        // Simula delay de API
        await this.delay(500);
        
        const financialData = {
            companyCash: 560000.00,
            semesterProfit: 200000.00,
            totalDebts: 2025.00
        };
        
        this.updateFinancialDisplay(financialData);
    }

    /**
     * Carrega dados de vendas
     */
    async loadSalesData() {
        await this.delay(300);
        
        const salesData = [
            { month: 'Jan', value: 60 },
            { month: 'Fev', value: 50 },
            { month: 'Mar', value: 80 },
            { month: 'Abr', value: 90 },
            { month: 'Mai', value: 70 }
        ];
        
        this.updateSalesChart(salesData);
    }

    /**
     * Carrega dados das cartas mais vendidas
     */
    async loadTopCardsData() {
        await this.delay(400);
        
        const topCards = [
            { icon: '⚡', name: 'Pikachu', price: 65000 },
            { icon: '🔵', name: 'Zubat', price: 1000 },
            { icon: '🟣', name: 'Ticaracaticamon', price: 550 },
            { icon: '🔥', name: 'Charizard', price: 300 },
            { icon: '🐻', name: 'Freddy Fazbear', price: 150 }
        ];
        
        this.updateTopCardsList(topCards);
    }

    /**
     * Carrega dados adicionais para área rolável
     */
    async loadAdditionalData() {
        await this.delay(200);
        
        const additionalData = [
            { label: 'Vendas Hoje', value: 'R$1.250,00' },
            { label: 'Vendas Ontem', value: 'R$980,00' },
            { label: 'Meta Mensal', value: 'R$50.000,00' },
            { label: 'Progresso', value: '68%' },
            { label: 'Clientes Ativos', value: '1.247' },
            { label: 'Novos Clientes', value: '23' },
            { label: 'Produtos em Estoque', value: '5.432' },
            { label: 'Produtos Vendidos', value: '892' },
            { label: 'Ticket Médio', value: 'R$125,00' },
            { label: 'Conversão', value: '3.2%' },
            { label: 'Satisfação', value: '4.8/5' },
            { label: 'Tempo Médio', value: '2m 30s' }
        ];
        
        this.updateAdditionalData(additionalData);
    }

    /**
     * Carrega dados específicos de uma seção
     */
    async loadSectionData(sectionName) {
        this.setLoadingState(true);
        
        try {
            switch (sectionName) {
                case 'gestao-interna':
                    await this.loadInternalManagementData();
                    break;
                case 'mercado-externo':
                    await this.loadExternalMarketData();
                    break;
                case 'analytics':
                    await this.loadAnalyticsData();
                    break;
                case 'estoque':
                    await this.loadInventoryData();
                    break;
                default:
                    console.warn(`Seção desconhecida: ${sectionName}`);
            }
        } catch (error) {
            console.error(`Erro ao carregar dados da seção ${sectionName}:`, error);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Carrega dados de gestão interna
     */
    async loadInternalManagementData() {
        // Implementar lógica específica para gestão interna
        console.log('Carregando dados de gestão interna...');
    }

    /**
     * Carrega dados de mercado externo
     */
    async loadExternalMarketData() {
        // Implementar lógica específica para mercado externo
        console.log('Carregando dados de mercado externo...');
    }

    /**
     * Carrega dados de analytics
     */
    async loadAnalyticsData() {
        // Implementar lógica específica para analytics
        console.log('Carregando dados de analytics...');
    }

    /**
     * Carrega dados de estoque
     */
    async loadInventoryData() {
        // Implementar lógica específica para estoque
        console.log('Carregando dados de estoque...');
    }

    /**
     * Atualiza display financeiro
     */
    updateFinancialDisplay(data) {
        const companyCashElement = document.getElementById('company-cash');
        const semesterProfitElement = document.getElementById('semester-profit');
        const totalDebtsElement = document.getElementById('total-debts');
        
        if (companyCashElement) {
            companyCashElement.textContent = this.formatCurrency(data.companyCash);
        }
        
        if (semesterProfitElement) {
            semesterProfitElement.textContent = this.formatCurrency(data.semesterProfit);
        }
        
        if (totalDebtsElement) {
            totalDebtsElement.textContent = this.formatCurrency(data.totalDebts);
        }
    }

    /**
     * Atualiza gráfico de vendas
     */
    updateSalesChart(data) {
        const chartContainer = document.querySelector(SELECTORS.chartContainer);
        if (!chartContainer) return;
        
        const chartPlaceholder = chartContainer.querySelector('.chart-placeholder');
        if (!chartPlaceholder) return;
        
        // Limpa gráfico atual
        chartPlaceholder.innerHTML = '';
        
        // Adiciona novas barras com animação
        data.forEach((item, index) => {
            setTimeout(() => {
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.height = `${item.value}%`;
                bar.style.backgroundColor = this.getBarColor(index);
                bar.title = `${item.month}: ${item.value}%`;
                
                chartPlaceholder.appendChild(bar);
            }, index * 100);
        });
    }

    /**
     * Atualiza lista de cartas mais vendidas
     */
    updateTopCardsList(cards) {
        const listContainer = document.querySelector(SELECTORS.topCardsList);
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                const cardElement = this.createCardElement(card);
                listContainer.appendChild(cardElement);
            }, index * 150);
        });
    }

    /**
     * Cria elemento de carta
     */
    createCardElement(card) {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        cardItem.innerHTML = `
            <span class="card-icon">${card.icon}</span>
            <span class="card-name">${card.name}</span>
            <span class="card-price">${this.formatCurrency(card.price)}</span>
        `;
        
        // Adiciona evento de clique para futura integração
        cardItem.addEventListener('click', () => {
            this.handleCardClick(card);
        });
        
        return cardItem;
    }

    /**
     * Atualiza dados adicionais na área rolável
     */
    updateAdditionalData(data) {
        const container = document.querySelector(SELECTORS.additionalData);
        if (!container) return;
        
        container.innerHTML = '';
        
        data.forEach((item, index) => {
            setTimeout(() => {
                const dataItem = this.createDataItem(item);
                container.appendChild(dataItem);
            }, index * 50);
        });
    }

    /**
     * Cria item de dados
     */
    createDataItem(item) {
        const dataItem = document.createElement('div');
        dataItem.className = 'data-item';
        dataItem.innerHTML = `
            <span class="data-label">${item.label}:</span>
            <span class="data-value">${item.value}</span>
        `;
        
        // Adiciona evento para futura integração
        dataItem.addEventListener('click', () => {
            this.handleDataItemClick(item);
        });
        
        return dataItem;
    }

    /**
     * Manipula clique em carta
     */
    handleCardClick(card) {
        console.log('Carta clicada:', card);
        // Implementar lógica de detalhes da carta
    }

    /**
     * Manipula clique em item de dados
     */
    handleDataItemClick(item) {
        console.log('Item de dados clicado:', item);
        // Implementar lógica de detalhes do item
    }

    /**
     * Manipula evento de scroll
     */
    handleScroll(event) {
        const element = event.target;
        const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
        
        // Implementar lógica de carregamento infinito se necessário
        if (scrollPercentage > 90) {
            console.log('Próximo ao final do scroll - carregar mais dados');
        }
    }

    /**
     * Manipula redimensionamento da janela
     */
    handleResize() {
        console.log('Janela redimensionada');
        // Implementar lógica de responsividade adicional se necessário
    }

    /**
     * Define estado de carregamento
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        const body = document.body;
        
        if (loading) {
            body.classList.add('loading');
        } else {
            body.classList.remove('loading');
        }
    }

    /**
     * Inicia atualização automática
     */
    startAutoUpdate() {
        this.updateTimer = setInterval(() => {
            if (!this.isLoading) {
                this.refreshData();
            }
        }, CONFIG.UPDATE_INTERVAL);
    }

    /**
     * Para atualização automática
     */
    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * Atualiza dados automaticamente
     */
    async refreshData() {
        console.log('Atualizando dados automaticamente...');
        
        try {
            await this.loadFinancialData();
            // Adicionar outras atualizações conforme necessário
        } catch (error) {
            console.error('Erro na atualização automática:', error);
        }
    }

    /**
     * Salva preferência do usuário
     */
    saveUserPreference(key, value) {
        try {
            localStorage.setItem(`${CONFIG.STORAGE_PREFIX}${key}`, JSON.stringify(value));
        } catch (error) {
            console.warn('Erro ao salvar preferência:', error);
        }
    }

    /**
     * Carrega preferência do usuário
     */
    getUserPreference(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}${key}`);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.warn('Erro ao carregar preferência:', error);
            return defaultValue;
        }
    }

    /**
     * Restaura preferências do usuário
     */
    restoreUserPreferences() {
        const activeSection = this.getUserPreference('activeSection', 'gestao-interna');
        const button = document.querySelector(`[data-section="${activeSection}"]`);
        
        if (button && activeSection !== this.currentSection) {
            this.switchSection(activeSection, button);
        }
    }

    /**
     * Exibe mensagem de erro
     */
    showErrorMessage(message) {
        console.error(message);
        // Implementar sistema de notificações se necessário
    }

    /**
     * Utilitários
     */
    
    /**
     * Formata valor monetário
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Obtém cor da barra do gráfico
     */
    getBarColor(index) {
        const colors = ['#20B2AA', '#20B2AA', '#32CD32', '#9ACD32', '#FFD700'];
        return colors[index % colors.length];
    }

    /**
     * Simula delay (para desenvolvimento)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup - limpa recursos
     */
    destroy() {
        this.stopAutoUpdate();
        
        // Remove event listeners se necessário
        console.log('Dashboard destruído');
    }
}

// ===== INICIALIZAÇÃO =====

/**
 * Inicializa o dashboard quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se todos os elementos necessários estão presentes
    const requiredElements = [
        '.main-header',
        '.main-container',
        '.financial-sidebar'
    ];
    
    const missingElements = requiredElements.filter(selector => 
        !document.querySelector(selector)
    );
    
    if (missingElements.length > 0) {
        console.error('Elementos obrigatórios não encontrados:', missingElements);
        return;
    }
    
    // Inicializa o dashboard
    window.dashboardManager = new DashboardManager();
    
    // Adiciona suporte para desenvolvimento
    if (typeof window !== 'undefined') {
        window.dashboard = window.dashboardManager;
    }
});

// ===== TRATAMENTO DE ERROS GLOBAIS =====
window.addEventListener('error', (event) => {
    console.error('Erro global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada não tratada:', event.reason);
});

// ===== EXPORTAÇÃO PARA MÓDULOS (SE NECESSÁRIO) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardManager, CONFIG };
}

