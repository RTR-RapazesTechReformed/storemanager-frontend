// analytics.js

const ANALYTICS_CONFIG = {
    API_BASE_URL: 'http://localhost:8080/api/dash/inventory'
};

// ===== API =====
class AnalyticsAPI {
    static async getHistoricalInventoryDistribution(date) {
        // date = objeto Date do JS
        const iso = date.toISOString(); // compatível com @DateTimeFormat ISO.DATE_TIME

        const url = `${ANALYTICS_CONFIG.API_BASE_URL}/distribution/historical?date=${encodeURIComponent(iso)}`;
        return this.fetchJSON(url);
    }

    static async fetchJSON(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            console.error(`Erro ao chamar API (${url}):`, err);
            return [];
        }
    }
}

// ===== MANAGER DO ANALYTICS =====
class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        const dateInput = document.getElementById('inventory-date');
        const todayBtn = document.getElementById('inventory-today-btn');

        if (dateInput) {
            // valor padrão = hoje
            const today = new Date();
            dateInput.value = today.toISOString().slice(0, 10);

            dateInput.addEventListener('change', () => {
                this.loadInventoryDistribution();
            });
        }

        if (todayBtn && dateInput) {
            todayBtn.addEventListener('click', () => {
                const now = new Date();
                dateInput.value = now.toISOString().slice(0, 10);
                this.loadInventoryDistribution();
            });
        }

        await this.loadInventoryDistribution();
    }

    async loadInventoryDistribution() {
        const canvas = document.getElementById('inventoryChart');
        if (!canvas) return;

        let refDate = new Date();
        const dateInput = document.getElementById('inventory-date');
        if (dateInput?.value) {
            refDate = new Date(`${dateInput.value}T23:59:59`);
        }

        const data = await AnalyticsAPI.getHistoricalInventoryDistribution(refDate);
        this.updateInventoryChart(data);
    }

    // ... resto igual ao que já te mandei
}

class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        // se depois você criar um input de data, é só plugar aqui
        await this.loadInventoryDistribution();
    }

    // Carrega dados históricos de distribuição de estoque
    async loadInventoryDistribution() {
        const canvas = document.getElementById('inventoryChart');
        if (!canvas) return;

        // Por enquanto: usa "agora" como data de referência
        let refDate = new Date();

        // Se você quiser depois usar um <input type="date" id="inventory-date">
        const dateInput = document.getElementById('inventory-date');
        if (dateInput?.value) {
            // monta um Date no fim do dia selecionado
            refDate = new Date(`${dateInput.value}T23:59:59`);
        }

        const data = await AnalyticsAPI.getHistoricalInventoryDistribution(refDate);
        this.updateInventoryChart(data);
    }

    // Atualiza o gráfico de doughnut de distribuição
    updateInventoryChart(distributionData) {
        const canvas = document.getElementById('inventoryChart');
        if (!canvas) return;

        // Se já existir um chart anterior, destrói
        if (this.charts['inventoryChart']) {
            this.charts['inventoryChart'].destroy();
            this.charts['inventoryChart'] = null;
        }

        if (!Array.isArray(distributionData) || distributionData.length === 0) {
            console.warn('Nenhum dado de distribuição de estoque retornado.');
            return;
        }

        // DTO esperado do back: { category: 'CARTAS_AVULSAS', totalQuantity: 123 } etc.
        const labels = distributionData.map(item =>
            this.mapCategoryLabel(item.category || item.categoryName || '')
        );

        const values = distributionData.map(item =>
            Number(item.totalQuantity ?? item.total_quantity ?? item.quantity ?? 0)
        );

        const ctx = canvas.getContext('2d');

        this.charts['inventoryChart'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#f87171', // vermelho
                        '#34d399', // verde
                        '#60a5fa', // azul
                        '#fbbf24', // amarelo
                        '#a78bfa'  // roxo extra pra "OUTROS" se aparecer
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const label = ctx.label || '';
                                const value = ctx.parsed || 0;
                                return `${label}: ${value} unid.`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Mapeia código da categoria do back pra label bonitinha
    mapCategoryLabel(code) {
        switch ((code || '').toUpperCase()) {
            case 'CARTAS_AVULSAS':
                return 'Cartas Avulsas';
            case 'BOOSTER_BOX':
                return 'Booster Box';
            case 'BOOSTER':
                return 'Boosters';
            case 'ACCESSORY':
                return 'Acessórios';
            case 'OUTROS':
                return 'Outros';
            default:
                return code || 'Desconhecido';
        }
    }
}

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsManager = new AnalyticsManager();
});
