/**
 * Dashboard Management System
 * Integração real com backend (Spring Boot)
 * Versão corrigida — gráficos populam corretamente
 */

const CONFIG = {
  API_BASE_URL: "http://localhost:8080/api/dashboard",
  UPDATE_INTERVAL: 30000,
  STORAGE_PREFIX: "dashboard_",
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

  static async fetchJSON(url) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar dados da API (${url}):`, error);
      return [];
    }
  }
}

// ===== GERENCIADOR PRINCIPAL =====
class DashboardManager {
  constructor() {
    this.isLoading = false;
    this.updateTimer = null;
    this.charts = {};
    this.init();
  }

  init() {
    this.loadInitialData();
    this.startAutoUpdate();
    console.log("Dashboard inicializado com sucesso 🚀");
  }

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
        valuedCards,
      ] = await Promise.all([
        DashboardAPI.getTotalCardsInStock(),
        DashboardAPI.getTotalBoosterBoxes(),
        DashboardAPI.getTopPokemonByStock(),
        DashboardAPI.getTopCollectionByItems(),
        DashboardAPI.getMonthlyAcquisitions(),
        DashboardAPI.getSalesOverview(),
        DashboardAPI.getStockAgingOverview(),
        DashboardAPI.getValuedCards(),
      ]);

      this.updateKPIs({
        totalCards,
        boosterBoxes,
        topPokemon,
        topCollection,
      });

      this.updateCharts({
        monthlyAcquisitions,
        salesOverview,
        stockAging,
        valuedCards,
      });
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    } finally {
      this.setLoadingState(false);
    }
  }

  // ===== ATUALIZAÇÕES =====
  updateKPIs(data) {
    const { totalCards, boosterBoxes, topPokemon } = data;

    document.getElementById("company-cash").textContent = `${
      totalCards.total_cards_in_stock || 0
    } cartas`;
    document.getElementById("semester-profit").textContent = `${
      boosterBoxes.total_booster_boxes || 0
    } boosters`;
    document.getElementById("total-debts").textContent = `Top: ${
      topPokemon.pokemonName || "---"
    }`;
  }

  updateCharts(data) {
    const { monthlyAcquisitions, salesOverview, stockAging, valuedCards } =
      data;

    // === Panorama de Vendas ===
    this.drawChartOnce("salesChart", "bar", salesOverview, {
      label: "Vendas (R$)",
      labelField: this.detectLabelField(salesOverview, [
        "month",
        "productName",
        "name",
      ]),
      valueField: this.detectValueField(salesOverview, [
        "totalRevenue",
        "sales",
        "value",
      ]),
    });

    // === Aquisições Mensais ===
    this.drawChartOnce("collectionsChart", "pie", monthlyAcquisitions, {
      label: "Aquisições (R$)",
      labelField: this.detectLabelField(monthlyAcquisitions, [
        "month",
        "label",
      ]),
      valueField: this.detectValueField(monthlyAcquisitions, [
        "totalCost",
        "value",
        "amount",
      ]),
    });

    // === Envelhecimento de Estoque ===
    this.drawChartOnce("weeklyChart", "line", stockAging, {
      label: "Dias em Estoque",
      labelField: this.detectLabelField(stockAging, [
        "productName",
        "item",
        "name",
      ]),
      valueField: this.detectValueField(stockAging, [
        "daysInStock",
        "days",
        "value",
      ]),
    });

    // === Cartas Valiosas ===
    this.updateTopCardsList(valuedCards);
  }

  // ===== DETECÇÃO AUTOMÁTICA DE CAMPOS =====
  detectLabelField(data, candidates) {
    if (!Array.isArray(data) || data.length === 0) return "label";
    const keys = Object.keys(data[0]);
    return candidates.find((c) => keys.includes(c)) || keys[0];
  }

  detectValueField(data, candidates) {
    if (!Array.isArray(data) || data.length === 0) return "value";
    const keys = Object.keys(data[0]);
    return (
      candidates.find((c) => keys.includes(c)) ||
      keys.find((k) => typeof data[0][k] === "number") ||
      keys[1]
    );
  }

  // ===== CHART CREATION =====
  drawChartOnce(elementId, type, data, { label, labelField, valueField }) {
    const canvas = document.getElementById(elementId);
    if (!canvas || !Array.isArray(data) || data.length === 0) return;

    const labels = data.map((d) => d[labelField] || "---");
    const values = data.map((d) => d[valueField] || 0);

    if (this.charts[elementId]) {
      const chart = this.charts[elementId];
      chart.data.labels = labels;
      chart.data.datasets[0].data = values;
      chart.update();
      return;
    }

    const ctx = canvas.getContext("2d");
    this.charts[elementId] = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            backgroundColor: [
              "#20B2AA",
              "#32CD32",
              "#FFD700",
              "#4D96FF",
              "#FF6F61",
              "#6A5ACD",
              "#FFB347",
              "#66CDAA",
              "#C71585",
              "#708090",
            ],
            borderColor: "#1E90FF",
            borderWidth: 1,
            fill: type === "line",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: type !== "pie" ? { y: { beginAtZero: true } } : {},
      },
    });
  }

  updateTopCardsList(cards) {
    const container = document.getElementById("top-cards-list");
    container.innerHTML = "";

    if (!Array.isArray(cards) || cards.length === 0) {
      container.innerHTML = "<p>Nenhuma carta encontrada.</p>";
      return;
    }

    // Normaliza e garante número (fallbacks: avg_sale_price -> current_sale_price -> 0)
    const normalized = cards.map((c) => ({
      ...c,
      _avgPrice: Number(c.avg_sale_price ?? c.current_sale_price ?? 0),
      _currentPrice: Number(c.current_sale_price ?? 0),
      _stock: Number(c.current_stock ?? 0),
    }));

    // Ordena decrescentemente por avg_sale_price
    normalized.sort(
      (a, b) => b._avgPrice - a._avgPrice || b._currentPrice - a._currentPrice
    );

    // Pega top 3 (ou menos se tiver menos itens)
    const top = normalized.slice(0, 3);

    // Cria título opcional
    const title = document.createElement("div");
    title.className = "top-cards-title";
    title.innerHTML = "<strong>Top 3 Cartas Valiosas</strong>";
    container.appendChild(title);

    top.forEach((card, index) => {
      const item = document.createElement("div");
      item.className = "card-item";

      // Exibe posição, nome, avg_sale_price, current_sale_price e estoque
      item.innerHTML = `
            <span class="card-rank">#${index + 1}</span>
            <span class="card-icon">🎴</span>
            <span class="card-name">${
              card.product_name || card.product_name || "---"
            }</span>
            <span class="card-avg">Avg: ${this.formatCurrency(
              card._avgPrice
            )}</span>
            <span class="card-price">Venda: ${this.formatCurrency(
              card._currentPrice
            )}</span>
            <span class="card-stock">(${card._stock} unid.)</span>
        `;

      container.appendChild(item);
    });
  }

  // ===== UTILITÁRIOS =====
  setLoadingState(loading) {
    this.isLoading = loading;
    document.body.classList.toggle("loading", loading);
  }

  startAutoUpdate() {
    this.updateTimer = setInterval(
      () => this.refreshData(),
      CONFIG.UPDATE_INTERVAL
    );
  }

  async refreshData() {
    try {
      const totalCards = await DashboardAPI.getTotalCardsInStock();
      document.getElementById("company-cash").textContent = `${
        totalCards.totalCardsInStock || 0
      } cartas`;
    } catch (e) {
      console.error("Erro na atualização automática:", e);
    }
  }

  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", () => {
  window.dashboardManager = new DashboardManager();
});
