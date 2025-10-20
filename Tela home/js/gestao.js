/**
 * Dashboard Management System
 * Integração real com backend (Spring Boot)
 * Versão estável - sem duplicar gráficos
 */

// ===== CONFIGURAÇÕES =====
const CONFIG = {
    API_BASE_URL: 'http://localhost:8080/api/dashboard',
    UPDATE_INTERVAL: 30000,
    STORAGE_PREFIX: 'dashboard_'
};

// ===== SERVIÇOS DE API =====
class DashboardAPI {
    static async getTotalCardsInStock() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/total-cards-in-stock`);
    }

    static async getTotalBoosterBoxes() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/total-booster-boxes`);
    }

    static async getTopPokemonByStock() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/top-pokemon-by-stock`);
    }

    static async getTopCollectionByItems() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/top-collection-by-items`);
    }

    static async getMonthlyAcquisitions() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/monthly-acquisitions`);
    }

    static async getSalesOverview() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/sales-overview`);
    }

    static async getStockAgingOverview() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/stock-aging-overview`);
    }

    static async getValuedCards() {
        return this.fetchJSON(`${CONFIG.API_BASE_URL}/valued-cards`);
    }

    /** Função genérica */
    static async fetchJSON(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Erro ao buscar dados da API (${url}):`, error);
            throw error;
        }
    }
}

// ===== GERENCIADOR PRINCIPAL =====
class DashboardManager {
    constructor() {
        this.isLoading = false;
        this.updateTimer = null;
        this.charts = {}; // armazena instâncias do Chart.js
        this.init();
    }

    /** Inicialização */
    init() {
        this.loadInitialData();
        this.startAutoUpdate();
        console.log('Dashboard inicializado com sucesso 🚀');
    }

    /** Carregamento inicial */
    async loadInitialData() {
        this.setLoadingState(true);
        try {
            const [
                totalCards,
                boosterBoxes,
                topPokemon,
                topCollection,
                monthlyAcquisitions,
                salesOverview,
                stockAging,
                valuedCards
            ] = await Promise.all([
                DashboardAPI.getTotalCardsInStock(),
                DashboardAPI.getTotalBoosterBoxes(),
                DashboardAPI.getTopPokemonByStock(),
                DashboardAPI.getTopCollectionByItems(),
                DashboardAPI.getMonthlyAcquisitions(),
                DashboardAPI.getSalesOverview(),
                DashboardAPI.getStockAgingOverview(),
                DashboardAPI.getValuedCards()
            ]);

            this.updateKPIs({
                totalCards,
                boosterBoxes,
                topPokemon,
                topCollection
            });

            this.updateCharts({
                monthlyAcquisitions,
                salesOverview,
                stockAging,
                valuedCards
            });

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    // ===== ATUALIZAÇÕES DE INTERFACE =====

    /** Atualiza cards de KPI */
    updateKPIs(data) {
        const { totalCards, boosterBoxes, topPokemon } = data;
        document.getElementById('company-cash').textContent = `${totalCards.totalCardsInStock || 0} cartas`;
        document.getElementById('semester-profit').textContent = `${boosterBoxes.totalBoosterBoxes || 0} boosters`;
        document.getElementById('total-debts').textContent = `Top: ${topPokemon.pokemonName || '---'}`;
    }

    /** Atualiza todos os gráficos (versão estável) */
    updateCharts(data) {
        const { monthlyAcquisitions, salesOverview, stockAging, valuedCards } = data;

        this.drawChartOnce('salesChart', 'bar', salesOverview, {
            label: 'Vendas (R$)',
            labelField: 'productName',
            valueField: 'totalRevenue'
        });

        this.drawChartOnce('collectionsChart', 'pie', monthlyAcquisitions, {
            label: 'Aquisições',
            labelField: 'month',
            valueField: 'totalCost'
        });

        this.drawChartOnce('weeklyChart', 'line', stockAging, {
            label: 'Dias em Estoque',
            labelField: 'productName',
            valueField: 'daysInStock'
        });

        this.updateTopCardsList(valuedCards);
    }

    /**
     * Cria ou atualiza um gráfico de forma controlada (sem duplicar)
     */
    drawChartOnce(elementId, type, data, { label, labelField, valueField }) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return;

        // Atualiza gráfico existente
        if (this.charts[elementId]) {
            const chart = this.charts[elementId];
            chart.data.labels = data.map(d => d[labelField] || '---');
            chart.data.datasets[0].data = data.map(d => d[valueField] || 0);
            chart.update();
            return;
        }

        // Cria gráfico novo
        const ctx = canvas.getContext('2d');
        this.charts[elementId] = new Chart(ctx, {
            type: type,
            data: {
                labels: data.map(d => d[labelField] || '---'),
                datasets: [{
                    label: label,
                    data: data.map(d => d[valueField] || 0),
                    backgroundColor: ['#20B2AA', '#32CD32', '#FFD700', '#4D96FF'],
                    borderColor: '#20B2AA',
                    borderWidth: 1,
                    fill: type === 'line'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: type !== 'pie' ? { y: { beginAtZero: true } } : {}
            }
        });
    }

    /** Atualiza lista das cartas mais valiosas */
    updateTopCardsList(cards) {
        const container = document.getElementById('top-cards-list');
        container.innerHTML = '';
        cards.forEach(card => {
            const item = document.createElement('div');
            item.className = 'card-item';
            item.innerHTML = `
                <span class="card-icon">🎴</span>
                <span class="card-name">${card.productName || '---'}</span>
                <span class="card-price">${this.formatCurrency(card.currentSalePrice || 0)}</span>
            `;
            container.appendChild(item);
        });
    }

    // ===== UTILITÁRIOS =====

    setLoadingState(loading) {
        this.isLoading = loading;
        document.body.classList.toggle('loading', loading);
    }

    startAutoUpdate() {
        this.updateTimer = setInterval(() => this.refreshData(), CONFIG.UPDATE_INTERVAL);
    }

    async refreshData() {
        try {
            const totalCards = await DashboardAPI.getTotalCardsInStock();
            document.getElementById('company-cash').textContent = `${totalCards.totalCardsInStock || 0} cartas`;
        } catch (e) {
            console.error('Erro na atualização automática:', e);
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
